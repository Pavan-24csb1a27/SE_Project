import { z } from 'zod';

export const updateMedicalRecordSchema = z.object({
  body: z.object({
    bloodGroup: z
      .enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])
      .optional(),
    allergies: z
      .array(
        z.object({
          allergen: z.string().min(1, 'Allergen name is required'),
          severity: z.enum(['mild', 'moderate', 'critical']),
          notes: z.string().optional(),
        })
      )
      .optional(),
    chronicConditions: z.array(z.string().min(1)).optional(),
  }),
});

export const addConsultationNoteSchema = z.object({
  body: z.object({
    appointmentId: z.string().optional(),
    diagnosis: z.string().min(2, 'Diagnosis is required'),
    clinicalNotes: z.string().min(3, 'Clinical notes are required'),
  }),
});
