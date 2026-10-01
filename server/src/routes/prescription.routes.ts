import { Router } from 'express';
import {
  addPrescription,
  getPrescriptions,
} from '../controllers/prescription.controller';
import { verifyAuth } from '../middleware/auth.middleware';
import { requireRoles } from '../middleware/rbac.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import { addPrescriptionSchema } from '../validators/prescription.validator';

const router = Router();

router.use(verifyAuth);

// REQ 4.4: Add prescription (Doctor only)
router.post(
  '/',
  requireRoles('doctor'),
  validateRequest(addPrescriptionSchema),
  addPrescription
);

// REQ 4.2: View prescriptions / medicines (Civilian self, Doctor, Pharmacy, Admin)
router.get('/', getPrescriptions);

export default router;
