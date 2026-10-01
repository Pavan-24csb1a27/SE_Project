import { z } from 'zod';

export const addDiagnosticTestSchema = z.object({
  body: z.object({
    civilianId: z.string({ required_error: 'Civilian ID is required' }),
    appointmentId: z.string().optional(),
    testNames: z
      .array(z.string().min(1, 'Test name cannot be empty'))
      .min(1, 'Must include at least one test name'),
    clinicalInstructions: z
      .string({ required_error: 'Clinical instructions are required' })
      .min(3, 'Instructions must be at least 3 characters'),
  }),
});

export const addReferralSchema = z.object({
  body: z.object({
    civilianId: z.string({ required_error: 'Civilian ID is required' }),
    recommendedDoctorId: z.string({ required_error: 'Specialist Doctor ID is required' }),
    specialization: z.string({ required_error: 'Specialization is required' }).min(2),
    clinicalReason: z
      .string({ required_error: 'Clinical reason is required' })
      .min(5, 'Reason must be at least 5 characters'),
  }),
});
