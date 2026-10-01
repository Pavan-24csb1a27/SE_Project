import { z } from 'zod';

export const lockSlotSchema = z.object({
  body: z.object({
    doctorId: z.string({ required_error: 'Doctor ID is required' }),
    date: z
      .string({ required_error: 'Date is required (YYYY-MM-DD)' })
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be formatted as YYYY-MM-DD'),
    slotId: z.string({ required_error: 'Slot ID is required' }),
  }),
});

export const bookAppointmentSchema = z.object({
  body: z.object({
    doctorId: z.string({ required_error: 'Doctor ID is required' }),
    date: z
      .string({ required_error: 'Date is required (YYYY-MM-DD)' })
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be formatted as YYYY-MM-DD'),
    slotId: z.string({ required_error: 'Slot ID is required' }),
    reasonForVisit: z
      .string({ required_error: 'Reason for visit is required' })
      .min(3, 'Please provide a descriptive reason for visit (min 3 chars)')
      .max(500, 'Reason cannot exceed 500 characters'),
  }),
});

export const cancelAppointmentSchema = z.object({
  body: z.object({
    cancellationReason: z
      .string()
      .max(200, 'Reason cannot exceed 200 characters')
      .optional()
      .default('Cancelled by user'),
  }),
});
