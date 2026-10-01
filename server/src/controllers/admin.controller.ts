import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { User } from '../models/User.model';
import { Appointment } from '../models/Appointment.model';
import { Prescription } from '../models/Prescription.model';
import { ClinicalReport } from '../models/ClinicalReport.model';
import { AuditLog } from '../models/AuditLog.model';
import { AuditService } from '../services/audit.service';

export class AdminController {
  /**
   * Retrieves high-level aggregated operational analytics across the clinic.
   * Leverages MongoDB Aggregation pipelines.
   */
  public static async getAnalytics(_req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // 1. User distribution by role
      const usersByRole = await User.aggregate([
        {
          $group: {
            _id: '$role',
            total: { $sum: 1 },
            active: {
              $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] },
            },
          },
        },
      ]);

      const userStats = {
        totalUsers: 0,
        civilian: 0,
        doctor: 0,
        pharmacy: 0,
        admin: 0,
      };

      usersByRole.forEach((u) => {
        userStats.totalUsers += u.total;
        if (u._id in userStats) {
          (userStats as Record<string, number>)[u._id] = u.total;
        }
      });

      // 2. Appointments status distribution
      const appointmentsByStatus = await Appointment.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]);

      const appointmentStats = {
        total: 0,
        confirmed: 0,
        completed: 0,
        cancelled: 0,
      };

      appointmentsByStatus.forEach((a) => {
        appointmentStats.total += a.count;
        if (a._id in appointmentStats) {
          (appointmentStats as Record<string, number>)[a._id] = a.count;
        }
      });

      // 3. Prescriptions distribution and top prescribed medicines
      const prescriptionsByStatus = await Prescription.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]);

      const prescriptionStats = {
        total: 0,
        open: 0,
        closed: 0,
      };

      prescriptionsByStatus.forEach((p) => {
        prescriptionStats.total += p.count;
        if (p._id in prescriptionStats) {
          (prescriptionStats as Record<string, number>)[p._id] = p.count;
        }
      });

      // Top prescribed medicines
      const topMedicines = await Prescription.aggregate([
        { $unwind: '$medications' },
        {
          $group: {
            _id: '$medications.name',
            prescribedCount: { $sum: 1 },
          },
        },
        { $sort: { prescribedCount: -1 } },
        { $limit: 5 },
        {
          $project: {
            medicine: '$_id',
            count: '$prescribedCount',
            _id: 0,
          },
        },
      ]);

      // 4. Clinical Reports count
      const totalReports = await ClinicalReport.countDocuments();

      // 5. Recent System Activity (last 10 audit logs)
      const recentAudit = await AuditLog.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();

      res.status(200).json({
        success: true,
        data: {
          users: userStats,
          appointments: appointmentStats,
          prescriptions: {
            ...prescriptionStats,
            topMedicines,
          },
          reports: {
            total: totalReports,
          },
          recentActivity: recentAudit,
        },
      });
    } catch (err: unknown) {
      console.error('[AdminController.getAnalytics] Error:', err);
      res.status(500).json({ success: false, message: 'Failed to aggregate analytics.' });
    }
  }

  /**
   * Retrieves list of users with search and filter capabilities.
   */
  public static async getUsers(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { role, status, search } = req.query;

      const filter: Record<string, unknown> = {};

      if (role && role !== 'all') {
        filter.role = role;
      }

      if (status) {
        filter.isActive = status === 'active';
      }

      if (search && typeof search === 'string') {
        const regex = new RegExp(search, 'i');
        filter.$or = [
          { name: regex },
          { email: regex },
          { universityId: regex },
        ];
      }

      const users = await User.find(filter)
        .select('-passwordHash')
        .sort({ createdAt: -1 })
        .lean();

      res.status(200).json({
        success: true,
        data: users,
        total: users.length,
      });
    } catch (err: unknown) {
      console.error('[AdminController.getUsers] Error:', err);
      res.status(500).json({ success: false, message: 'Failed to retrieve users.' });
    }
  }

  /**
   * Toggles a user's active status (activate/suspend).
   */
  public static async updateUserStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { isActive } = req.body;

      if (typeof isActive !== 'boolean') {
        res.status(400).json({ success: false, message: 'isActive must be a boolean.' });
        return;
      }

      const user = await User.findById(id);
      if (!user) {
        res.status(404).json({ success: false, message: 'User not found.' });
        return;
      }

      // Prevent deactivating own account
      if (req.user && req.user.userId === user._id.toString() && !isActive) {
        res.status(400).json({ success: false, message: 'Admins cannot deactivate their own account.' });
        return;
      }

      user.isActive = isActive;
      await user.save();

      // Record in audit log
      if (req.user) {
        await AuditService.log({
          actorId: req.user.userId,
          actorName: req.user.universityId || 'Admin',
          actorRole: req.user.role,
          action: 'USER_STATUS_UPDATE',
          targetEntity: 'User',
          targetId: user._id.toString(),
          details: {
            targetUser: user.name,
            targetRole: user.role,
            newStatus: isActive ? 'active' : 'suspended',
          },
          ipAddress: req.ip,
        });
      }

      res.status(200).json({
        success: true,
        message: `User ${user.name} has been ${isActive ? 'activated' : 'suspended'}.`,
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
        },
      });
    } catch (err: unknown) {
      console.error('[AdminController.updateUserStatus] Error:', err);
      res.status(500).json({ success: false, message: 'Failed to update user status.' });
    }
  }

  /**
   * Retrieves audit logs with optional filters and pagination.
   */
  public static async getAuditLogs(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { action, actorRole, limit = 50 } = req.query;

      const filter: Record<string, unknown> = {};

      if (action && action !== 'all') {
        filter.action = action;
      }

      if (actorRole && actorRole !== 'all') {
        filter.actorRole = actorRole;
      }

      const logs = await AuditLog.find(filter)
        .sort({ createdAt: -1 })
        .limit(Number(limit))
        .lean();

      res.status(200).json({
        success: true,
        data: logs,
        total: logs.length,
      });
    } catch (err: unknown) {
      console.error('[AdminController.getAuditLogs] Error:', err);
      res.status(500).json({ success: false, message: 'Failed to retrieve audit logs.' });
    }
  }
}
