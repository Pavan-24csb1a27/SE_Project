export type UserRole = 'civilian' | 'doctor' | 'pharmacy' | 'admin';

export interface User {
  id: string;
  universityId: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  department?: string;
  specialization?: string;
  isActive: boolean;
  createdAt: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
  user: User;
}

export interface RegisterDTO {
  universityId: string;
  name: string;
  email: string;
  password: string;
  role?: UserRole;
  phone?: string;
  department?: string;
  specialization?: string;
}

export interface LoginDTO {
  identifier: string;
  password: string;
}
