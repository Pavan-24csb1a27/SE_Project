import mongoose, { Document, Schema } from 'mongoose';

export interface IAuditLog extends Document {
  actorId: mongoose.Types.ObjectId;
  actorName: string;
  actorRole: 'civilian' | 'doctor' | 'pharmacy' | 'admin' | 'system';
  action: string;
  targetEntity: string;
  targetId?: string;
  details?: Record<string, unknown> | string;
  ipAddress?: string;
  createdAt: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    actorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    actorName: {
      type: String,
      required: true,
    },
    actorRole: {
      type: String,
      enum: ['civilian', 'doctor', 'pharmacy', 'admin', 'system'],
      required: true,
      index: true,
    },
    action: {
      type: String,
      required: true,
      index: true,
    },
    targetEntity: {
      type: String,
      required: true,
      index: true,
    },
    targetId: {
      type: String,
      default: null,
    },
    details: {
      type: Schema.Types.Mixed,
      default: {},
    },
    ipAddress: {
      type: String,
      default: '127.0.0.1',
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // Immutable append-only audit trail
  }
);

// Compound index for query efficiency
auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', auditLogSchema);
export default AuditLog;
