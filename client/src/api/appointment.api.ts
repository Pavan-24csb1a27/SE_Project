import { apiClient } from './client';
import type {
  Doctor,
  DoctorAvailability,
  Appointment,
  LockSlotDTO,
  BookAppointmentDTO,
} from '../types/appointment';

export const appointmentApi = {
  getDoctors: async (): Promise<{ success: boolean; doctors: Doctor[] }> => {
    const res = await apiClient.get<{ success: boolean; doctors: Doctor[] }>('/availability/doctors');
    return res.data;
  },

  getDoctorAvailability: async (
    doctorId: string,
    date: string
  ): Promise<{ success: boolean; availability: DoctorAvailability }> => {
    const res = await apiClient.get<{ success: boolean; availability: DoctorAvailability }>(
      `/availability/doctors/${doctorId}/availability`,
      { params: { date } }
    );
    return res.data;
  },

  lockSlot: async (
    data: LockSlotDTO
  ): Promise<{ success: boolean; message: string; lockedUntil: string; slotId: string }> => {
    const res = await apiClient.post<{
      success: boolean;
      message: string;
      lockedUntil: string;
      slotId: string;
    }>('/availability/lock-slot', data);
    return res.data;
  },

  releaseSlot: async (
    data: LockSlotDTO
  ): Promise<{ success: boolean; message: string }> => {
    const res = await apiClient.post<{ success: boolean; message: string }>(
      '/availability/release-slot',
      data
    );
    return res.data;
  },

  bookAppointment: async (
    data: BookAppointmentDTO
  ): Promise<{ success: boolean; message: string; appointment: Appointment }> => {
    const res = await apiClient.post<{
      success: boolean;
      message: string;
      appointment: Appointment;
    }>('/appointments/book', data);
    return res.data;
  },

  getMyAppointments: async (
    status?: string
  ): Promise<{ success: boolean; count: number; appointments: Appointment[] }> => {
    const res = await apiClient.get<{
      success: boolean;
      count: number;
      appointments: Appointment[];
    }>('/appointments/my', {
      params: status ? { status } : undefined,
    });
    return res.data;
  },

  cancelAppointment: async (
    id: string,
    cancellationReason?: string
  ): Promise<{ success: boolean; message: string; appointment: Appointment }> => {
    const res = await apiClient.patch<{
      success: boolean;
      message: string;
      appointment: Appointment;
    }>(`/appointments/${id}/cancel`, { cancellationReason });
    return res.data;
  },

  configureSchedule: async (data: {
    doctorId: string;
    date: string;
    startHour?: number;
    endHour?: number;
  }): Promise<{ success: boolean; message: string; availability: DoctorAvailability }> => {
    const res = await apiClient.post<{
      success: boolean;
      message: string;
      availability: DoctorAvailability;
    }>('/availability/schedule', data);
    return res.data;
  },
};
