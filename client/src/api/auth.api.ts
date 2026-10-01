import { apiClient } from './client';
import type { AuthResponse, LoginDTO, RegisterDTO, User } from '../types/auth';

export const authApi = {
  login: async (data: LoginDTO): Promise<AuthResponse> => {
    const res = await apiClient.post<AuthResponse>('/auth/login', data);
    if (res.data.token) {
      localStorage.setItem('unihealth_token', res.data.token);
    }
    return res.data;
  },

  register: async (data: RegisterDTO): Promise<AuthResponse> => {
    const res = await apiClient.post<AuthResponse>('/auth/register', data);
    if (res.data.token) {
      localStorage.setItem('unihealth_token', res.data.token);
    }
    return res.data;
  },

  logout: async (): Promise<{ success: boolean; message: string }> => {
    try {
      const res = await apiClient.post<{ success: boolean; message: string }>('/auth/logout');
      return res.data;
    } finally {
      localStorage.removeItem('unihealth_token');
    }
  },

  getMe: async (): Promise<{ success: boolean; user: User }> => {
    const res = await apiClient.get<{ success: boolean; user: User }>('/auth/me');
    return res.data;
  },
};
