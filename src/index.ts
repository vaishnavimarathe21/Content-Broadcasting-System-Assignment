import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config';
import path from 'path';
import authRoutes from './routes/auth.routes';
import contentRoutes from './routes/content.routes';
import adminRoutes from './routes/admin.routes';
import publicRoutes from './routes/public.routes';
import analyticsRoutes from './routes/analytics.routes';
import { errorHandler } from './middlewares/error.middleware';

const app = express();
const PORT = config.port;

// Security Middlewares
app.use(helmet());
app.use(cors());

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (for uploaded content)
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/admin/content', adminRoutes);
app.use('/api/admin/analytics', analyticsRoutes);
app.use('/api', publicRoutes);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Content Broadcasting System API is running.' });
});

// Global Error Handler
app.use(errorHandler);

// Start server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export default app;
