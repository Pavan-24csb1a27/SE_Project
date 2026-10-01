import { Router } from 'express';
import {
  addDiagnosticTest,
  getDiagnosticTests,
  addReferral,
  getReferrals,
} from '../controllers/clinical.controller';
import { verifyAuth } from '../middleware/auth.middleware';
import { requireRoles } from '../middleware/rbac.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import {
  addDiagnosticTestSchema,
  addReferralSchema,
} from '../validators/clinical.validator';

const router = Router();

router.use(verifyAuth);

// REQ 4.5: Diagnostic tests
router.post(
  '/tests',
  requireRoles('doctor'),
  validateRequest(addDiagnosticTestSchema),
  addDiagnosticTest
);
router.get('/tests', getDiagnosticTests);

// REQ 4.6: Specialist doctor referrals
router.post(
  '/referrals',
  requireRoles('doctor'),
  validateRequest(addReferralSchema),
  addReferral
);
router.get('/referrals', getReferrals);

export default router;
