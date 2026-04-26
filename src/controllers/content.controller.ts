import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import prisma from '../utils/prisma';
import { uploadContentSchema } from '../models/content.schema';
import { uploadToS3, isS3Configured } from '../utils/s3';

export const uploadContent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'File is required (JPG, PNG, GIF)' });
    }

    const { title, subject, description, startTime, endTime, rotationDuration } = uploadContentSchema.parse(req).body;

    const teacherId = req.user!.id;
    const fileType = req.file.mimetype;
    const fileSize = req.file.size;

    // Upload to S3 if configured, otherwise use local storage
    let fileUrl: string;
    if (isS3Configured()) {
      fileUrl = await uploadToS3(req.file);
    } else {
      fileUrl = `/uploads/${req.file.filename}`;
    }

    // Use Prisma Transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx: any) => {
      // 1. Create Content
      const content = await tx.content.create({
        data: {
          title,
          description,
          subject,
          fileUrl,
          fileType,
          fileSize,
          status: 'PENDING',
          uploadedById: teacherId,
        },
      });

      // 2. Find or Create Content Slot for the Subject
      const slot = await tx.contentSlot.upsert({
        where: { subject },
        update: {},
        create: { subject },
      });

      // 3. Create Content Schedule
      // Default to 5 minutes if not provided
      const durationMinutes = rotationDuration ? parseInt(rotationDuration, 10) : 5;

      // Determine rotationOrder (simply append to existing)
      const existingSchedules = await tx.contentSchedule.count({
        where: { slotId: slot.id }
      });

      const schedule = await tx.contentSchedule.create({
        data: {
          contentId: content.id,
          slotId: slot.id,
          rotationOrder: existingSchedules + 1,
          durationMinutes,
          startTime: startTime ? new Date(startTime) : null,
          endTime: endTime ? new Date(endTime) : null,
        },
      });

      return { content, schedule };
    });

    res.status(201).json({
      success: true,
      message: 'Content uploaded successfully and is pending approval',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getMyUploads = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const teacherId = req.user!.id;
    const contents = await prisma.content.findMany({
      where: { uploadedById: teacherId },
      include: {
        schedules: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({
      success: true,
      data: contents,
    });
  } catch (error) {
    next(error);
  }
};
