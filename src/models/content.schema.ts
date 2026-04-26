import { z } from 'zod';

export const uploadContentSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required'),
    subject: z.string().min(1, 'Subject is required'),
    description: z.string().optional(),
    startTime: z.string().optional(), // Expected ISO string or date parseable string
    endTime: z.string().optional(),
    rotationDuration: z.string().optional(), // Multer passes form-data as strings
  }),
});
