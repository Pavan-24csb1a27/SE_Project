import React from 'react';
import { useAuthStore } from '../../store/authStore';
import { Stethoscope, AlertTriangle, Users, FilePlus, UserCheck } from 'lucide-react';

export const DoctorDashboard: React.FC = () => {
  const { user } = useAuthStore();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6 rounded-2xl bg-gradient-to-r from-emerald-800 to-teal-700 p-6 sm:p-8 text-white shadow-sm">
        <span className="inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider mb-2">
          Clinician / Medical Staff Portal
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold">Dr. {user?.name}</h1>
        <p className="mt-1 text-emerald-100 text-sm">
          Specialization: <span className="font-semibold">{user?.specialization || 'General Medicine'}</span> | Medical ID: <span className="font-mono">{user?.universityId}</span>
        </p>
      </div>

      {/* Safety Compliance Alert Banner (REQ 5.2) */}
      <div className="mb-8 rounded-xl border-l-4 border-amber-500 bg-amber-50 p-4 shadow-xs">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-amber-900">Clinical Safety Protocol Active</h4>
            <p className="text-xs text-amber-800 mt-0.5">
              Per UniHealth SRS Section 5.2, all student allergy warnings and critical chronic conditions are automatically surfaced on patient lookup prior to prescription issuance.
            </p>
          </div>
        </div>
      </div>

      {/* Quick Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Today's Patients
            </span>
            <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-900">Ready</p>
          <p className="mt-1 text-xs text-slate-500">Appointments scheduled for today</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Prescription Desk
            </span>
            <div className="rounded-lg bg-teal-50 p-2 text-teal-600">
              <FilePlus className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-900">Digital Rx</p>
          <p className="mt-1 text-xs text-slate-500">Issue medications to pharmacy queue</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Referrals & Tests
            </span>
            <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
              <Stethoscope className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-900">Diagnostics</p>
          <p className="mt-1 text-xs text-slate-500">Recommend lab tests & campus specialists</p>
        </div>
      </div>

      {/* Active Consultations Feed */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-emerald-600" />
            Patient Consultation Queue
          </h2>
          <span className="text-xs text-slate-400">Phase 3 Clinical Care Module</span>
        </div>
        <div className="py-12 text-center">
          <p className="text-sm text-slate-500">No patient currently waiting in consultation queue.</p>
          <p className="mt-1 text-xs text-slate-400">
            Appointments booked by students in Phase 2 will dynamically stream into this clinical queue.
          </p>
        </div>
      </div>
    </div>
  );
};
