export interface UserAnalytics {
  totalUsers: number;
  civilian: number;
  doctor: number;
  pharmacy: number;
  admin: number;
}

export interface AppointmentAnalytics {
  total: number;
  confirmed: number;
  completed: number;
  cancelled: number;
}

export interface TopMedicine {
  medicine: string;
  count: number;
}

export interface PrescriptionAnalytics {
  total: number;
  open: number;
  closed: number;
  topMedicines: TopMedicine[];
}

export interface ReportAnalytics {
  total: number;
}

export interface AuditLogEntry {
  _id: string;
  actorId: string;
  actorName: string;
  actorRole: 'civilian' | 'doctor' | 'pharmacy' | 'admin' | 'system';
  action: string;
  targetEntity: string;
  targetId?: string;
  details?: Record<string, unknown> | string;
  ipAddress?: string;
  createdAt: string;
}

export interface SystemAnalytics {
  users: UserAnalytics;
  appointments: AppointmentAnalytics;
  prescriptions: PrescriptionAnalytics;
  reports: ReportAnalytics;
  recentActivity: AuditLogEntry[];
}

export interface ManagedUser {
  _id: string;
  universityId: string;
  name: string;
  email: string;
  role: 'civilian' | 'doctor' | 'pharmacy' | 'admin';
  phone?: string;
  department?: string;
  specialization?: string;
  isActive: boolean;
  createdAt: string;
}
