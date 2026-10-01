import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    universityId: z
      .string({ required_error: 'University ID is required' })
      .min(3, 'University ID must be at least 3 characters')
      .trim(),
    name: z
      .string({ required_error: 'Name is required' })
      .min(2, 'Name must be at least 2 characters')
      .trim(),
    email: z
      .string({ required_error: 'University email is required' })
      .email('Must be a valid email format')
      .toLowerCase()
      .trim(),
    password: z
      .string({ required_error: 'Password is required' })
      .min(6, 'Password must be at least 6 characters'),
    role: z
      .enum(['civilian', 'doctor', 'pharmacy', 'admin'])
      .optional()
      .default('civilian'),
    phone: z.string().optional(),
    department: z.string().optional(),
    specialization: z.string().optional(),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    identifier: z
      .string({ required_error: 'Email or University ID is required' })
      .trim(),
    password: z
      .string({ required_error: 'Password is required' }),
  }),
});
