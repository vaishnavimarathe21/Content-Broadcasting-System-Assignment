import { Request, Response, NextFunction } from 'express';
import { getLiveContentForTeacher } from '../services/scheduling.service';
import { getCache, setCache } from '../utils/redis';

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
