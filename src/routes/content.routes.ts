import { Router } from 'express';
import { uploadContent, getMyUploads } from '../controllers/content.controller';
import { isAuth, isTeacher } from '../middlewares/auth.middleware';
import { uploadMiddleware } from '../middlewares/upload.middleware';

const router = Router();

// Teacher routes
router.post('/upload', isAuth, isTeacher, uploadMiddleware.single('file'), uploadContent);
router.get('/my-uploads', isAuth, isTeacher, getMyUploads);

export default router;
