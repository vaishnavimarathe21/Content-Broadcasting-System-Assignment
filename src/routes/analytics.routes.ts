import { Router } from 'express';
import { getSubjectAnalytics, getOverviewAnalytics } from '../controllers/analytics.controller';
import { isAuth, isPrincipal } from '../middlewares/auth.middleware';

const router = Router();

// Principal-only analytics routes
router.use(isAuth, isPrincipal);

router.get('/subjects', getSubjectAnalytics);
router.get('/overview', getOverviewAnalytics);

export default router;
