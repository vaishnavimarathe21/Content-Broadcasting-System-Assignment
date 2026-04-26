import { z } from 'zod';

export const rejectContentSchema = z.object({
  body: z.object({
    rejectionReason: z.string().min(5, 'Rejection reason must be at least 5 characters long'),
  }),
});
