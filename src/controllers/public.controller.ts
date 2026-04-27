import { Request, Response, NextFunction } from 'express';
import { getLiveContentForTeacher } from '../services/scheduling.service';
import { getCache, setCache } from '../utils/redis';
import prisma from '../utils/prisma';

export const getLiveContent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const teacherId = req.params.teacherId as string;
    const subject = req.query.subject as string | undefined;

    // Check Redis cache first
    const cacheKey = `live:${teacherId}:${subject || 'all'}`;
    const cached = await getCache(cacheKey);
    if (cached) {
      return res.status(200).json(JSON.parse(cached));
    }

    // Validate that the teacher exists before fetching content
    const teacher = await prisma.user.findUnique({
      where: { id: teacherId }
    });

    if (!teacher || teacher.role !== 'TEACHER') {
      return res.status(404).json({ 
        success: false, 
        message: 'Teacher not found' 
      });
    }

    const liveContents = await getLiveContentForTeacher(teacherId, subject);

    // Return empty response if no content is currently active
    if (liveContents.length === 0) {
      const response = { 
        success: true, 
        message: 'No content available', 
        data: [] 
      };
      await setCache(cacheKey, response);
      return res.status(200).json(response);
    }

    const response = { 
      success: true, 
      data: liveContents 
    };
    
    // Cache the response
    await setCache(cacheKey, response);

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};
