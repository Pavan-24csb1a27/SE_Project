import React from 'react';
import { useAuthStore } from '../../store/authStore';
import { Package, CheckCircle2, Clock, ShieldCheck } from 'lucide-react';

export const PharmacyDashboard: React.FC = () => {
  const { user } = useAuthStore();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6 rounded-2xl bg-gradient-to-r from-amber-700 to-orange-600 p-6 sm:p-8 text-white shadow-sm">
        <span className="inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider mb-2">
          Campus Dispensary & Pharmacy
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold">Pharmacy Dispensation Portal</h1>
        <p className="mt-1 text-amber-100 text-sm">
          Operator: <span className="font-semibold">{user?.name}</span> | Staff ID: <span className="font-mono">{user?.universityId}</span>
        </p>
      </div>

      {/* SRS Rule Reminder */}
      <div className="mb-8 rounded-xl border border-amber-200 bg-amber-50/60 p-4 text-xs text-amber-900 flex items-center gap-3">
        <ShieldCheck className="h-5 w-5 text-amber-600 shrink-0" />
        <span>
          <strong>SRS REQ_02 Enforcement:</strong> Prescriptions cannot be transitioned to <em>"closed"</em> status until every individual medicine item is verified and marked as distributed.
        </span>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-8">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Open Prescriptions
            </span>
            <div className="rounded-lg bg-amber-50 p-2 text-amber-600">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-900">0 Pending</p>
          <p className="mt-1 text-xs text-slate-500">Awaiting student pickup & medicine dispensation</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Closed Today
            </span>
            <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-900">0 Dispensed</p>
          <p className="mt-1 text-xs text-slate-500">Completed prescriptions archived with staff timestamp</p>
        </div>
      </div>

      {/* Prescriptions Queue Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Package className="h-4 w-4 text-amber-600" />
            Live Pharmacy Dispensation Queue
          </h2>
          <span className="text-xs text-slate-400">Phase 4 Pharmacy Module</span>
        </div>
        <div className="py-12 text-center">
          <p className="text-sm text-slate-500">No open prescriptions awaiting distribution.</p>
          <p className="mt-1 text-xs text-slate-400">
            When clinicians issue digital prescriptions in Phase 3, they will appear here in real time.
          </p>
        </div>
      </div>
    </div>
  );
};
