import { Router } from 'express';
import { verifyAuth } from '../middleware/auth.middleware';
import { requireRoles } from '../middleware/rbac.middleware';
import { AdminController } from '../controllers/admin.controller';

const router = Router();

// Protect all admin routes: Requires authentication and 'admin' role
router.use(verifyAuth, requireRoles('admin'));

router.get('/analytics', AdminController.getAnalytics);
router.get('/users', AdminController.getUsers);
router.patch('/users/:id/status', AdminController.updateUserStatus);
router.get('/audit-logs', AdminController.getAuditLogs);

export default router;
