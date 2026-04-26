import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { config } from '../config';
import fs from 'fs';
import path from 'path';

// S3 Client configuration
const s3Client = new S3Client({
  region: config.aws.region,
  credentials: {
    accessKeyId: config.aws.accessKeyId,
    secretAccessKey: config.aws.secretAccessKey,
  },
});

// Upload file to S3 and return the public URL
export const uploadToS3 = async (file: Express.Multer.File): Promise<string> => {
  const fileKey = `uploads/${Date.now()}-${file.originalname}`;

  const command = new PutObjectCommand({
    Bucket: config.aws.s3Bucket,
    Key: fileKey,
    Body: fs.readFileSync(file.path),
    ContentType: file.mimetype,
  });

  await s3Client.send(command);

  // Delete the local file after successful S3 upload
  fs.unlinkSync(file.path);

  // Return the public S3 URL
  return `https://${config.aws.s3Bucket}.s3.${config.aws.region}.amazonaws.com/${fileKey}`;
};

// Check if S3 is configured
export const isS3Configured = (): boolean => {
  return !!(config.aws.accessKeyId && config.aws.secretAccessKey && config.aws.s3Bucket);
};
