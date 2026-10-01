import { Router } from 'express';
import { register, login, logout, getMe } from '../controllers/auth.controller';
import { verifyAuth, AuthenticatedRequest } from '../middleware/auth.middleware';
import { requireRoles } from '../middleware/rbac.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import { registerSchema, loginSchema } from '../validators/auth.validator';

const router = Router();

// Public auth endpoints
router.post('/register', validateRequest(registerSchema), register);
router.post('/login', validateRequest(loginSchema), login);
router.post('/logout', logout);

// Protected session endpoint
router.get('/me', verifyAuth, getMe);

// RBAC verification test endpoints
router.get(
  '/doctor-only',
  verifyAuth,
  requireRoles('doctor'),
  (req: AuthenticatedRequest, res) => {
    res.json({
      success: true,
      message: `Doctor access granted for user ${req.user?.universityId}`,
    });
  }
);

router.get(
  '/pharmacy-only',
  verifyAuth,
  requireRoles('pharmacy'),
  (req: AuthenticatedRequest, res) => {
    res.json({
      success: true,
      message: `Pharmacy access granted for user ${req.user?.universityId}`,
    });
  }
);

router.get(
  '/admin-only',
  verifyAuth,
  requireRoles('admin'),
  (req: AuthenticatedRequest, res) => {
    res.json({
      success: true,
      message: `Admin access granted for user ${req.user?.universityId}`,
    });
  }
);

export default router;
