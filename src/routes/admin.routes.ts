import { Router } from 'express';
import { getAllContent, getPendingContent, approveContent, rejectContent } from '../controllers/admin.controller';
import { isAuth, isPrincipal } from '../middlewares/auth.middleware';

const router = Router();

// Principal routes
router.use(isAuth, isPrincipal);

router.get('/all', getAllContent);
router.get('/pending', getPendingContent);
router.put('/:id/approve', approveContent);
router.put('/:id/reject', rejectContent);

export default router;
