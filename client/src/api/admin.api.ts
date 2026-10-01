import { apiClient } from './client';
import type { SystemAnalytics, ManagedUser, AuditLogEntry } from '../types/admin';

export const adminApi = {
  getAnalytics: async (): Promise<SystemAnalytics> => {
    const res = await apiClient.get('/admin/analytics');
    return res.data.data;
  },

  getUsers: async (params?: {
    role?: string;
    status?: string;
    search?: string;
  }): Promise<{ users: ManagedUser[]; total: number }> => {
    const res = await apiClient.get('/admin/users', { params });
    return {
      users: res.data.data,
      total: res.data.total,
    };
  },

  updateUserStatus: async (
    userId: string,
    isActive: boolean
  ): Promise<{ message: string; user: ManagedUser }> => {
    const res = await apiClient.patch(`/admin/users/${userId}/status`, { isActive });
    return {
      message: res.data.message,
      user: res.data.data,
    };
  },

  getAuditLogs: async (params?: {
    action?: string;
    actorRole?: string;
    limit?: number;
  }): Promise<{ logs: AuditLogEntry[]; total: number }> => {
    const res = await apiClient.get('/admin/audit-logs', { params });
    return {
      logs: res.data.data,
      total: res.data.total,
    };
  },
};
