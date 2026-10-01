import React from 'react';
import { useAuthStore } from '../../store/authStore';
import { CalendarRange, Shield, BarChart3, Users, History } from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { user } = useAuthStore();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6 rounded-2xl bg-gradient-to-r from-purple-800 to-indigo-900 p-6 sm:p-8 text-white shadow-sm">
        <span className="inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider mb-2">
          Health Center Operations & Administration
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold">Admin Console</h1>
        <p className="mt-1 text-purple-200 text-sm">
          Administrator: <span className="font-semibold">{user?.name}</span> | Admin ID: <span className="font-mono">{user?.universityId}</span>
        </p>
      </div>

      {/* Control Panels Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs hover:border-purple-400 hover:shadow-sm transition cursor-pointer">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Doctor Schedules
            </span>
            <div className="rounded-lg bg-purple-50 p-2 text-purple-600">
              <CalendarRange className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-900">Configure</p>
          <p className="mt-1 text-xs text-purple-600 font-medium">Manage shifts & slot generator →</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs hover:border-purple-400 hover:shadow-sm transition cursor-pointer">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              User Accounts
            </span>
            <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-900">Directory</p>
          <p className="mt-1 text-xs text-indigo-600 font-medium">Doctors, staff & student records →</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs hover:border-purple-400 hover:shadow-sm transition cursor-pointer">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Clinic Analytics
            </span>
            <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
              <BarChart3 className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-900">Reporting</p>
          <p className="mt-1 text-xs text-blue-600 font-medium">Turnaround, volume & no-shows →</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs hover:border-purple-400 hover:shadow-sm transition cursor-pointer">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Audit Logs
            </span>
            <div className="rounded-lg bg-slate-100 p-2 text-slate-700">
              <Shield className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-900">Security</p>
          <p className="mt-1 text-xs text-slate-600 font-medium">HIPAA/FERPA-aligned activity trail →</p>
        </div>
      </div>

      {/* Activity Overview */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <History className="h-4 w-4 text-purple-600" />
            Clinic Audit Trail & Access Events
          </h2>
          <span className="text-xs text-slate-400">Phase 5 Admin & Analytics Module</span>
        </div>
        <div className="py-12 text-center">
          <p className="text-sm text-slate-500">System initialization complete.</p>
          <p className="mt-1 text-xs text-slate-400">
            Phase 1 Foundation & RBAC security layer verified. Subsequent phases will feed real-time analytics.
          </p>
        </div>
      </div>
    </div>
  );
};
