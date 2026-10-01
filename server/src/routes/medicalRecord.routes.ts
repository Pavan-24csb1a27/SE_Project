import { Router } from 'express';
import {
  getPatientRecord,
  updatePatientRecord,
  addConsultationNote,
} from '../controllers/medicalRecord.controller';
import { verifyAuth } from '../middleware/auth.middleware';
import { requireRoles } from '../middleware/rbac.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import {
  updateMedicalRecordSchema,
  addConsultationNoteSchema,
} from '../validators/medicalRecord.validator';

const router = Router();

router.use(verifyAuth);

// Get medical record & allergy alert banner (Civilian self or Doctor/Admin)
router.get('/patient/:civilianId', getPatientRecord);

// Update patient allergies, conditions, and blood group (Doctor or Admin)
router.put(
  '/patient/:civilianId',
  requireRoles('doctor', 'admin'),
  validateRequest(updateMedicalRecordSchema),
  updatePatientRecord
);

// Append consultation note & mark appointment completed (Doctor only)
router.post(
  '/patient/:civilianId/consultation',
  requireRoles('doctor'),
  validateRequest(addConsultationNoteSchema),
  addConsultationNote
);

export default router;
