import { apiClient } from './client';
import type {
  MedicalRecord,
  Prescription,
  DiagnosticTest,
  SpecialistReferral,
  AddPrescriptionDTO,
  AddDiagnosticTestDTO,
  AddReferralDTO,
  Allergy,
  BloodGroup,
} from '../types/clinical';
import type { User } from '../types/auth';

export const clinicalApi = {
  getPatientRecord: async (
    civilianId: string
  ): Promise<{
    success: boolean;
    civilian: User;
    record: MedicalRecord;
    hasCriticalAlerts: boolean;
    criticalAllergies: Allergy[];
  }> => {
    const res = await apiClient.get<{
      success: boolean;
      civilian: User;
      record: MedicalRecord;
      hasCriticalAlerts: boolean;
      criticalAllergies: Allergy[];
    }>(`/medical-records/patient/${civilianId}`);
    return res.data;
  },

  updatePatientRecord: async (
    civilianId: string,
    data: {
      bloodGroup?: BloodGroup;
      allergies?: Allergy[];
      chronicConditions?: string[];
    }
  ): Promise<{ success: boolean; message: string; record: MedicalRecord }> => {
    const res = await apiClient.put<{
      success: boolean;
      message: string;
      record: MedicalRecord;
    }>(`/medical-records/patient/${civilianId}`, data);
    return res.data;
  },

  addConsultationNote: async (
    civilianId: string,
    data: {
      appointmentId?: string;
      diagnosis: string;
      clinicalNotes: string;
    }
  ): Promise<{ success: boolean; message: string; record: MedicalRecord }> => {
    const res = await apiClient.post<{
      success: boolean;
      message: string;
      record: MedicalRecord;
    }>(`/medical-records/patient/${civilianId}/consultation`, data);
    return res.data;
  },

  addPrescription: async (
    data: AddPrescriptionDTO
  ): Promise<{ success: boolean; message: string; prescription: Prescription }> => {
    const res = await apiClient.post<{
      success: boolean;
      message: string;
      prescription: Prescription;
    }>('/prescriptions', data);
    return res.data;
  },

  getPrescriptions: async (params?: {
    civilianId?: string;
    status?: string;
  }): Promise<{ success: boolean; count: number; prescriptions: Prescription[] }> => {
    const res = await apiClient.get<{
      success: boolean;
      count: number;
      prescriptions: Prescription[];
    }>('/prescriptions', { params });
    return res.data;
  },

  addDiagnosticTest: async (
    data: AddDiagnosticTestDTO
  ): Promise<{ success: boolean; message: string; testOrder: DiagnosticTest }> => {
    const res = await apiClient.post<{
      success: boolean;
      message: string;
      testOrder: DiagnosticTest;
    }>('/clinical/tests', data);
    return res.data;
  },

  getDiagnosticTests: async (params?: {
    civilianId?: string;
  }): Promise<{ success: boolean; count: number; tests: DiagnosticTest[] }> => {
    const res = await apiClient.get<{
      success: boolean;
      count: number;
      tests: DiagnosticTest[];
    }>('/clinical/tests', { params });
    return res.data;
  },

  addReferral: async (
    data: AddReferralDTO
  ): Promise<{ success: boolean; message: string; referral: SpecialistReferral }> => {
    const res = await apiClient.post<{
      success: boolean;
      message: string;
      referral: SpecialistReferral;
    }>('/clinical/referrals', data);
    return res.data;
  },

  getReferrals: async (params?: {
    civilianId?: string;
  }): Promise<{ success: boolean; count: number; referrals: SpecialistReferral[] }> => {
    const res = await apiClient.get<{
      success: boolean;
      count: number;
      referrals: SpecialistReferral[];
    }>('/clinical/referrals', { params });
    return res.data;
  },
};
