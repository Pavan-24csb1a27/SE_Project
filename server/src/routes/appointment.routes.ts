import { Router } from 'express';
import {
  bookAppointment,
  getMyAppointments,
  cancelAppointment,
} from '../controllers/appointment.controller';
import { verifyAuth } from '../middleware/auth.middleware';
import { requireRoles } from '../middleware/rbac.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import {
  bookAppointmentSchema,
  cancelAppointmentSchema,
} from '../validators/appointment.validator';

const router = Router();

// All appointment operations require authentication
router.use(verifyAuth);

// REQ_01 to REQ_06: Book appointment
router.post(
  '/book',
  requireRoles('civilian', 'admin'),
  validateRequest(bookAppointmentSchema),
  bookAppointment
);

// View user's appointments
router.get('/my', getMyAppointments);

// Cancel appointment
router.patch(
  '/:id/cancel',
  requireRoles('civilian', 'doctor', 'admin'),
  validateRequest(cancelAppointmentSchema),
  cancelAppointment
);

export default router;
