import { z } from 'zod';

export const addPrescriptionSchema = z.object({
  body: z.object({
    appointmentId: z.string({ required_error: 'Appointment ID is required' }),
    civilianId: z.string({ required_error: 'Civilian / Student ID is required' }),
    medicines: z
      .array(
        z.object({
          name: z.string({ required_error: 'Medicine name is required' }).min(1),
          dosage: z.string({ required_error: 'Dosage is required (e.g. 500mg)' }).min(1),
          frequency: z
            .string({ required_error: 'Frequency is required (e.g. 1-0-1)' })
            .min(1),
          duration: z
            .string({ required_error: 'Duration is required (e.g. 5 days)' })
            .min(1),
          notes: z.string().optional(),
        }),
        { required_error: 'Prescription must include at least one medicine item' }
      )
      .min(1, 'Prescription must include at least one medicine item'),
  }),
});
