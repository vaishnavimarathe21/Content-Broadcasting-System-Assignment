import prisma from '../utils/prisma';

export const getLiveContentForTeacher = async (teacherId: string, subjectQuery?: string) => {
  const now = new Date();

  // Fetch all APPROVED schedules for this teacher
  const schedules = await prisma.contentSchedule.findMany({
    where: {
      content: {
        uploadedById: teacherId,
        status: 'APPROVED',
        ...(subjectQuery ? { subject: subjectQuery } : {}),
      },
    },
    include: {
      content: true,
      slot: true,
    },
    orderBy: { rotationOrder: 'asc' }, // Ensure deterministic order
  });

  // Filter for active schedules exactly as per assignment rules:
  // "Without start_time/end_time -> content is not active"
  // "Within time window -> eligible for rotation"
  // "Outside time window -> not shown"
  const activeSchedules = schedules.filter((s: any) => {
    if (!s.startTime || !s.endTime) return false;
    return now >= s.startTime && now <= s.endTime;
  });

  if (activeSchedules.length === 0) {
    return [];
  }

  // Group by Subject to apply rotation per subject independently
  const activeBySubject: Record<string, typeof activeSchedules> = {};
  activeSchedules.forEach((s: any) => {
    if (!activeBySubject[s.slot.subject]) activeBySubject[s.slot.subject] = [];
    activeBySubject[s.slot.subject].push(s);
  });

  const liveContents: any[] = [];

  // Stateless rotation algorithm based on duration (minutes)
  // Unix timestamp in minutes provides a reliable, globally moving epoch
  const currentEpochTimeMinutes = Math.floor(now.getTime() / (1000 * 60));

  for (const subject in activeBySubject) {
    const subjectSchedules = activeBySubject[subject];
    
    // If only one content is active for this subject, it's always the live one
    if (subjectSchedules.length === 1) {
      liveContents.push(subjectSchedules[0].content);
      continue;
    }

    // Cycle length is the total sum of durations of all active contents for this subject
    const cycleLengthMinutes = subjectSchedules.reduce((sum: number, s: any) => sum + s.durationMinutes, 0);
    
    if (cycleLengthMinutes === 0) {
      // Fallback if somehow durations are 0
      liveContents.push(subjectSchedules[0].content);
      continue;
    }

    // Find exactly where we are in the current rotation cycle
    const positionInCycle = currentEpochTimeMinutes % cycleLengthMinutes;

    // Find which content corresponds to this position in the rotation
    let accumulated = 0;
    for (const s of subjectSchedules) {
      accumulated += s.durationMinutes;
      if (positionInCycle < accumulated) {
        liveContents.push(s.content);
        break; // Found the active content for this subject!
      }
    }
  }

  return liveContents;
};
