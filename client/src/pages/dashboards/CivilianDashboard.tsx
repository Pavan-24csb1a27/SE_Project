import React from 'react';
import { useAuthStore } from '../../store/authStore';
import { Calendar, Pill, FileText, Clock, UserCheck } from 'lucide-react';

export const CivilianDashboard: React.FC = () => {
  const { user } = useAuthStore();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Welcome Header */}
      <div className="mb-8 rounded-2xl bg-gradient-to-r from-indigo-700 to-blue-600 p-6 sm:p-8 text-white shadow-sm">
        <span className="inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider mb-2">
          Student Health Portal
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold">Welcome back, {user?.name}!</h1>
        <p className="mt-1 text-indigo-100 text-sm">
          University ID: <span className="font-mono font-semibold">{user?.universityId}</span> | Access your appointments, prescriptions, and lab reports.
        </p>
      </div>

      {/* Quick Action Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs hover:border-indigo-400 hover:shadow-sm transition cursor-pointer">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Appointments
            </span>
            <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600">
              <Calendar className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-900">0 Active</p>
          <p className="mt-1 text-xs text-indigo-600 font-medium">Book New Consultation →</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs hover:border-indigo-400 hover:shadow-sm transition cursor-pointer">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Prescribed Meds
            </span>
            <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
              <Pill className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-900">Active Rx</p>
          <p className="mt-1 text-xs text-emerald-600 font-medium">View Medicines & Dosage →</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs hover:border-indigo-400 hover:shadow-sm transition cursor-pointer">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Clinical Reports
            </span>
            <div className="rounded-lg bg-purple-50 p-2 text-purple-600">
              <FileText className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-900">Lab Results</p>
          <p className="mt-1 text-xs text-purple-600 font-medium">View & Download Tests →</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs hover:border-indigo-400 hover:shadow-sm transition cursor-pointer">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Medical Profile
            </span>
            <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
              <UserCheck className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-900">Verified</p>
          <p className="mt-1 text-xs text-blue-600 font-medium">Check Allergies & History →</p>
        </div>
      </div>

      {/* Placeholder Feed for Phase 2/3 */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Clock className="h-4 w-4 text-indigo-600" />
            Upcoming Health Center Visits
          </h2>
          <span className="text-xs text-slate-400">Phase 2 Booking Module</span>
        </div>
        <div className="py-12 text-center">
          <p className="text-sm text-slate-500">No scheduled appointments at this time.</p>
          <p className="mt-1 text-xs text-slate-400">
            Phase 1 Foundation & Auth is active. Phase 2 will enable real-time slot booking.
          </p>
        </div>
      </div>
    </div>
  );
};
