import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore, getRoleDashboardPath } from '../store/authStore';
import { Activity, LogOut, User as UserIcon } from 'lucide-react';
import type { UserRole } from '../types/auth';

const getRoleBadgeClasses = (role: UserRole) => {
  switch (role) {
    case 'civilian':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'doctor':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    case 'pharmacy':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'admin':
      return 'bg-purple-100 text-purple-800 border-purple-200';
  }
};

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur shadow-xs">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <Link
          to={isAuthenticated ? getRoleDashboardPath(user?.role) : '/'}
          className="flex items-center gap-2.5 text-indigo-600 font-bold text-xl tracking-tight"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-xs">
            <Activity className="h-5 w-5" />
          </div>
          <span className="text-slate-900">
            Uni<span className="text-indigo-600">Health</span>
          </span>
        </Link>

        {/* User Info & Actions */}
        <div className="flex items-center gap-4">
          {isAuthenticated && user ? (
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-sm font-semibold text-slate-800">{user.name}</span>
                <span className="text-xs text-slate-500 font-mono">{user.universityId}</span>
              </div>

              <span
                className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider ${getRoleBadgeClasses(
                  user.role
                )}`}
              >
                {user.role}
              </span>

              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
                title="Log Out"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 transition"
              >
                <UserIcon className="h-3.5 w-3.5" />
                Sign In
              </Link>
              <Link
                to="/register"
                className="rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-medium text-white shadow-xs hover:bg-indigo-700 transition"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
