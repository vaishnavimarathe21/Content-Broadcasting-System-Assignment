import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  databaseUrl: process.env.DATABASE_URL || '',
  jwtSecret: process.env.JWT_SECRET || 'fallback_secret',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  upload: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif'],
    uploadDir: 'uploads/',
  },
  rateLimit: {
    windowMs: 5 * 60 * 1000, // 5 minutes
    maxRequests: 100,
  },
  aws: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    region: process.env.AWS_REGION || 'eu-north-1',
    s3Bucket: process.env.AWS_S3_BUCKET || '',
  },
};
