import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore, getRoleDashboardPath } from '../store/authStore';
import type { UserRole } from '../types/auth';
import { ShieldAlert } from 'lucide-react';

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const { user, isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
          <p className="text-sm font-medium text-slate-600">Verifying session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center p-6 text-center">
        <div className="mb-4 rounded-full bg-rose-100 p-4 text-rose-600">
          <ShieldAlert className="h-12 w-12" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800">403 - Access Denied</h2>
        <p className="mt-2 max-w-md text-slate-600">
          Your account role (<span className="font-semibold text-rose-600">{user.role}</span>) does not
          have permission to access this portal section.
        </p>
        <a
          href={getRoleDashboardPath(user.role)}
          className="mt-6 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow hover:bg-indigo-700 transition"
        >
          Return to My Dashboard
        </a>
      </div>
    );
  }

  return <Outlet />;
};
