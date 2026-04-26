import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { rejectContentSchema } from '../models/admin.schema';
import { invalidateTeacherCache } from '../utils/redis';

// Get all uploaded content with pagination and filters
export const getAllContent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string | undefined;
    const subject = req.query.subject as string | undefined;
    const teacherId = req.query.teacherId as string | undefined;

    const where: any = {};
    if (status) where.status = status.toUpperCase();
    if (subject) where.subject = subject;
    if (teacherId) where.uploadedById = teacherId;

    const [contents, total] = await Promise.all([
      prisma.content.findMany({
        where,
        include: {
          uploadedBy: { select: { id: true, name: true, email: true, role: true } },
          schedules: { include: { slot: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.content.count({ where }),
    ]);

    res.status(200).json({
      success: true,
      data: contents,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get all pending content
export const getPendingContent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const pendingContent = await prisma.content.findMany({
      where: { status: 'PENDING' },
      include: {
        uploadedBy: { select: { id: true, name: true, email: true } },
        schedules: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({ success: true, data: pendingContent });
  } catch (error) {
    next(error);
  }
};

export const approveContent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const principalId = req.user!.id;

    const content = await prisma.content.findUnique({ where: { id } });
    if (!content) {
      return res.status(404).json({ success: false, message: 'Content not found' });
    }

    if (content.status !== 'PENDING') {
      return res.status(400).json({ success: false, message: `Content is already ${content.status}` });
    }

    const updatedContent = await prisma.content.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedById: principalId,
        approvedAt: new Date(),
      },
    });

    // Invalidate cache for this teacher to ensure live updates
    await invalidateTeacherCache(content.uploadedById);

    res.status(200).json({
      success: true,
      message: 'Content approved successfully',
      data: updatedContent,
    });
  } catch (error) {
    next(error);
  }
};

export const rejectContent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { rejectionReason } = rejectContentSchema.parse(req).body;

    const content = await prisma.content.findUnique({ where: { id } });
    if (!content) {
      return res.status(404).json({ success: false, message: 'Content not found' });
    }

    if (content.status !== 'PENDING') {
      return res.status(400).json({ success: false, message: `Content is already ${content.status}` });
    }

    const updatedContent = await prisma.content.update({
      where: { id },
      data: {
        status: 'REJECTED',
        rejectionReason,
      },
    });

    // Invalidate cache for this teacher to ensure live updates
    await invalidateTeacherCache(content.uploadedById);

    res.status(200).json({
      success: true,
      message: 'Content rejected successfully',
      data: updatedContent,
    });
  } catch (error) {
    next(error);
  }
};
