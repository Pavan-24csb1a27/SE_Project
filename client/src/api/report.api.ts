import { apiClient } from './client';
import type { ClinicalReport } from '../types/report';

export const reportApi = {
  uploadReport: async (
    formData: FormData
  ): Promise<{ success: boolean; message: string; report: ClinicalReport }> => {
    const res = await apiClient.post<{
      success: boolean;
      message: string;
      report: ClinicalReport;
    }>('/reports/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },

  getReports: async (params?: {
    civilianId?: string;
  }): Promise<{ success: boolean; count: number; reports: ClinicalReport[] }> => {
    const res = await apiClient.get<{
      success: boolean;
      count: number;
      reports: ClinicalReport[];
    }>('/reports', { params });
    return res.data;
  },

  getDownloadUrl: (id: string): string => {
    return `/api/v1/reports/${id}/download`;
  },
};
