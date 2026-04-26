import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';

// Get subject-wise analytics

// GET /api/admin/analytics/subjects — Most active subject + per-subject breakdown
export const getSubjectAnalytics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const subjectStats = await prisma.content.groupBy({
      by: ['subject'],
      _count: { id: true },
    });

    // Get approved counts per subject
    const approvedStats = await prisma.content.groupBy({
      by: ['subject'],
      where: { status: 'APPROVED' },
      _count: { id: true },
    });

    const approvedMap: Record<string, number> = {};
    approvedStats.forEach((s: any) => { approvedMap[s.subject] = s._count.id; });

    const subjects = subjectStats
      .map((s: any) => ({
        subject: s.subject,
        totalContent: s._count.id,
        approvedContent: approvedMap[s.subject] || 0,
      }))
      .sort((a: any, b: any) => b.totalContent - a.totalContent);

    const mostActiveSubject = subjects.length > 0 ? subjects[0].subject : null;

    res.status(200).json({
      success: true,
      mostActiveSubject,
      data: subjects,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/analytics/overview — Content usage tracking (overall stats)
export const getOverviewAnalytics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const [total, approved, rejected, pending, uploaded] = await Promise.all([
      prisma.content.count(),
      prisma.content.count({ where: { status: 'APPROVED' } }),
      prisma.content.count({ where: { status: 'REJECTED' } }),
      prisma.content.count({ where: { status: 'PENDING' } }),
      prisma.content.count({ where: { status: 'UPLOADED' } }),
    ]);

    const totalTeachers = await prisma.user.count({ where: { role: 'TEACHER' } });
    const totalPrincipals = await prisma.user.count({ where: { role: 'PRINCIPAL' } });

    // Unique subjects that have content
    const uniqueSubjects = await prisma.content.groupBy({ by: ['subject'] });

    res.status(200).json({
      success: true,
      data: {
        totalContent: total,
        byStatus: { approved, rejected, pending, uploaded },
        totalTeachers,
        totalPrincipals,
        totalSubjects: uniqueSubjects.length,
        approvalRate: total > 0 ? Math.round((approved / total) * 100) + '%' : '0%',
      },
    });
  } catch (error) {
    next(error);
  }
};
