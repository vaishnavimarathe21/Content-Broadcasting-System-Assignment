import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { getLiveContent } from '../controllers/public.controller';
import { config } from '../config';

const router = Router();

// Apply rate limiting to public routes
const publicApiLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: { success: false, message: 'Too many requests, please try again later.' },
});

// Public Broadcast Route
router.get('/content/live/:teacherId', publicApiLimiter, getLiveContent);

export default router;
