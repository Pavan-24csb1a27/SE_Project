import mongoose from 'mongoose';
import { AuditLog } from '../models/AuditLog.model';

export interface AuditLogParams {
  actorId: mongoose.Types.ObjectId | string;
  actorName: string;
  actorRole: 'civilian' | 'doctor' | 'pharmacy' | 'admin' | 'system';
  action: string;
  targetEntity: string;
  targetId?: string;
  details?: Record<string, unknown> | string;
  ipAddress?: string;
}

export class AuditService {
  /**
   * Records an immutable entry in the system audit log.
   * Safe execution: Never bubbles errors to break parent HTTP request flows.
   */
  public static async log(params: AuditLogParams): Promise<void> {
    try {
      await AuditLog.create({
        actorId: new mongoose.Types.ObjectId(params.actorId.toString()),
        actorName: params.actorName,
        actorRole: params.actorRole,
        action: params.action,
        targetEntity: params.targetEntity,
        targetId: params.targetId,
        details: params.details,
        ipAddress: params.ipAddress || '127.0.0.1',
      });
    } catch (err) {
      console.error('[AuditService] Failed to record audit log:', err);
    }
  }
}
