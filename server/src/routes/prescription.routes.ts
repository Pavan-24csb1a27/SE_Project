import { Router } from 'express';
import {
  addPrescription,
  getPrescriptions,
  updateItemDistribution,
  closePrescription,
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

// REQ 4.7: Pharmacy updates medicine item distribution status
router.patch(
  '/:id/items/:itemIndex/distribute',
  requireRoles('pharmacy', 'admin'),
  updateItemDistribution
);

// REQ 4.7: Pharmacy closes prescription once all medicines are distributed
router.patch(
  '/:id/close',
  requireRoles('pharmacy', 'admin'),
  closePrescription
);

export default router;
