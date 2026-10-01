import { create } from 'zustand';
import type { User, UserRole } from '../types/auth';
import { authApi } from '../api/auth.api';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  setUser: (user: User | null) => void;
  checkAuth: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  setUser: (user) => {
    set({
      user,
      isAuthenticated: !!user,
      isLoading: false,
      error: null,
    });
  },

  checkAuth: async () => {
    try {
      set({ isLoading: true, error: null });
      const data = await authApi.getMe();
      set({ user: data.user, isAuthenticated: true, isLoading: false });
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  logout: async () => {
    try {
      await authApi.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));

export const getRoleDashboardPath = (role?: UserRole): string => {
  switch (role) {
    case 'civilian':
      return '/student';
    case 'doctor':
      return '/doctor';
    case 'pharmacy':
      return '/pharmacy';
    case 'admin':
      return '/admin';
    default:
      return '/login';
  }
};
