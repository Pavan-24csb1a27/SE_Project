import { z } from 'zod';

export const configureScheduleSchema = z.object({
  body: z.object({
    doctorId: z.string({ required_error: 'Doctor ID is required' }),
    date: z
      .string({ required_error: 'Date is required (YYYY-MM-DD)' })
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be formatted as YYYY-MM-DD'),
    startHour: z.number().int().min(7).max(18).optional().default(9),
    endHour: z.number().int().min(8).max(21).optional().default(17),
  }),
});

export const queryAvailabilitySchema = z.object({
  query: z.object({
    date: z
      .string({ required_error: 'Date query param is required (YYYY-MM-DD)' })
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be formatted as YYYY-MM-DD'),
  }),
});
