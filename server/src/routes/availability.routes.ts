import { Router } from 'express';
import {
  getDoctors,
  getDoctorAvailability,
  configureSchedule,
  lockSlot,
  releaseSlot,
} from '../controllers/availability.controller';
import { verifyAuth } from '../middleware/auth.middleware';
import { requireRoles } from '../middleware/rbac.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import {
  configureScheduleSchema,
  queryAvailabilitySchema,
} from '../validators/availability.validator';
import { lockSlotSchema } from '../validators/appointment.validator';

const router = Router();

// Public / Authenticated doctor directory
router.get('/doctors', getDoctors);

// REQ_01: View doctor availability by date
router.get(
  '/doctors/:doctorId/availability',
  validateRequest(queryAvailabilitySchema),
  getDoctorAvailability
);

// Protected scheduling actions
router.post(
  '/schedule',
  verifyAuth,
  requireRoles('doctor', 'admin'),
  validateRequest(configureScheduleSchema),
  configureSchedule
);

// REQ_04: Atomic slot locking to prevent double-booking
router.post(
  '/lock-slot',
  verifyAuth,
  requireRoles('civilian', 'admin'),
  validateRequest(lockSlotSchema),
  lockSlot
);

router.post(
  '/release-slot',
  verifyAuth,
  requireRoles('civilian', 'admin'),
  releaseSlot
);

export default router;
