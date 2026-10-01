import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { clinicalApi } from '../../api/clinical.api';
import type { Prescription } from '../../types/clinical';
import {
  Package,
  CheckCircle2,
  Clock,
  ShieldCheck,
  CheckSquare,
  Square,
  AlertCircle,
  Calendar,
  Stethoscope,
  Archive,
} from 'lucide-react';

export const PharmacyDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [activeTab, setActiveTab] = useState<'open' | 'closed'>('open');
  const [loading, setLoading] = useState(false);
  const [updatingIdx, setUpdatingIdx] = useState<string | null>(null);
  const [closingId, setClosingId] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  const fetchPrescriptions = async (status: 'open' | 'closed') => {
    try {
      setLoading(true);
      setStatusMsg(null);
      const res = await clinicalApi.getPrescriptions({ status });
      setPrescriptions(res.prescriptions);
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to load prescriptions.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrescriptions(activeTab);
  }, [activeTab]);

  // REQ 4.7: Toggle medicine item distribution
  const handleToggleItem = async (prescriptionId: string, itemIndex: number, currentStatus: boolean) => {
    try {
      setUpdatingIdx(`${prescriptionId}_${itemIndex}`);
      setStatusMsg(null);
      const res = await clinicalApi.updateItemDistribution(prescriptionId, itemIndex, !currentStatus);

      // Update local state
      setPrescriptions((prev) =>
        prev.map((rx) => (rx._id === prescriptionId ? res.prescription : rx))
      );
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to update item distribution.' });
    } finally {
      setUpdatingIdx(null);
    }
  };

  // REQ 4.7: Close Prescription
  // REQ_02: The system shall only allow a prescription to be closed once all medicine items are marked as distributed.
  const handleClosePrescription = async (rx: Prescription) => {
    const allDistributed = rx.medicines.every((m) => m.isDistributed);
    if (!allDistributed) {
      setStatusMsg({
        type: 'error',
        text: 'SRS REQ_02 Violation: All medicine items must be marked as distributed before this prescription can be closed.',
      });
      return;
    }

    try {
      setClosingId(rx._id);
      setStatusMsg(null);
      await clinicalApi.closePrescription(rx._id);

      setStatusMsg({
        type: 'success',
        text: `Prescription ${rx.prescriptionNumber} marked as closed and archived (SRS REQ_03 & REQ_04).`,
      });

      // Refetch
      fetchPrescriptions(activeTab);
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to close prescription.' });
    } finally {
      setClosingId(null);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6 rounded-2xl bg-gradient-to-r from-amber-700 to-orange-600 p-6 sm:p-8 text-white shadow-sm">
        <span className="inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider mb-2">
          Campus Dispensary & Pharmacy
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold">Pharmacy Dispensation Portal</h1>
        <p className="mt-1 text-amber-100 text-sm">
          Operator: <span className="font-semibold">{user?.name}</span> | Staff ID:{' '}
          <span className="font-mono">{user?.universityId}</span>
        </p>
      </div>

      {/* SRS Rule Reminder */}
      <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50/80 p-4 text-xs text-amber-900 flex items-center gap-3">
        <ShieldCheck className="h-5 w-5 text-amber-600 shrink-0" />
        <span>
          <strong>SRS REQ_02 Enforcement:</strong> Prescriptions cannot be transitioned to{' '}
          <em>"closed"</em> status until every individual medicine item is verified and marked as
          distributed.
        </span>
      </div>

      {/* Status Notifications */}
      {statusMsg && (
        <div
          className={`mb-6 flex items-center gap-2.5 rounded-lg border p-3.5 text-xs ${
            statusMsg.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-rose-200 bg-rose-50 text-rose-700'
          }`}
        >
          {statusMsg.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
          )}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 mb-6">
        <button
          onClick={() => setActiveTab('open')}
          className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold transition ${
            activeTab === 'open'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Clock className="h-4 w-4" />
          Open Prescriptions Queue
        </button>

        <button
          onClick={() => setActiveTab('closed')}
          className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold transition ${
            activeTab === 'closed'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Archive className="h-4 w-4" />
          Closed & Dispensed Archive
        </button>
      </div>

      {/* Prescriptions List */}
      {loading ? (
        <div className="flex h-40 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-amber-600 border-t-transparent" />
            Loading prescriptions...
          </div>
        </div>
      ) : prescriptions.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <Package className="mx-auto h-12 w-12 text-slate-400 mb-3" />
          <h3 className="text-base font-bold text-slate-800">
            No {activeTab === 'open' ? 'Open' : 'Closed'} Prescriptions
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            {activeTab === 'open'
              ? 'All issued digital prescriptions have been distributed and archived.'
              : 'No closed prescriptions currently archived.'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {prescriptions.map((rx) => {
            const allDistributed = rx.medicines.every((m) => m.isDistributed);

            return (
              <div
                key={rx._id}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4"
              >
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div>
                    <span className="font-mono text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 mr-2">
                      {rx.prescriptionNumber}
                    </span>
                    <span className="text-xs font-bold text-slate-800">
                      Patient: {rx.civilianId?.name} ({rx.civilianId?.universityId})
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Stethoscope className="h-3.5 w-3.5 text-slate-400" />
                      Prescribed by Dr. {rx.doctorId?.name}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      {new Date(rx.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Medicine Items Dispensation Tracker */}
                <div className="space-y-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center justify-between">
                    <span>Prescribed Medications ({rx.medicines.length})</span>
                    <span className="text-[11px] font-normal text-slate-400">
                      {rx.medicines.filter((m) => m.isDistributed).length} of {rx.medicines.length}{' '}
                      distributed
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {rx.medicines.map((m, idx) => {
                      const isUpdating = updatingIdx === `${rx._id}_${idx}`;

                      return (
                        <div
                          key={idx}
                          onClick={() => {
                            if (rx.status === 'open' && !isUpdating) {
                              handleToggleItem(rx._id, idx, m.isDistributed);
                            }
                          }}
                          className={`flex items-start gap-3 p-3.5 rounded-xl border text-xs transition cursor-pointer ${
                            m.isDistributed
                              ? 'border-emerald-300 bg-emerald-50/60 text-emerald-950'
                              : 'border-slate-200 bg-slate-50/60 text-slate-800 hover:border-amber-300'
                          }`}
                        >
                          <div className="pt-0.5 shrink-0 text-emerald-600">
                            {isUpdating ? (
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
                            ) : m.isDistributed ? (
                              <CheckSquare className="h-4 w-4" />
                            ) : (
                              <Square className="h-4 w-4 text-slate-400" />
                            )}
                          </div>

                          <div className="flex-1">
                            <div className="font-bold text-sm">{m.name}</div>
                            <div className="text-xs text-slate-600 mt-0.5">
                              <strong>Dosage:</strong> {m.dosage} | <strong>Frequency:</strong>{' '}
                              {m.frequency} | <strong>Duration:</strong> {m.duration}
                            </div>
                            {m.notes && (
                              <div className="text-[11px] text-slate-500 mt-0.5 italic">
                                Note: {m.notes}
                              </div>
                            )}
                          </div>

                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase shrink-0 ${
                              m.isDistributed
                                ? 'bg-emerald-200 text-emerald-900'
                                : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {m.isDistributed ? 'Verified' : 'Pending'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
                  {rx.status === 'open' ? (
                    <>
                      <div className="text-xs text-slate-500">
                        {!allDistributed ? (
                          <span className="text-amber-700 font-semibold flex items-center gap-1">
                            <AlertCircle className="h-3.5 w-3.5" />
                            Verify all medicine checkboxes above to enable closure.
                          </span>
                        ) : (
                          <span className="text-emerald-700 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            All items verified. Ready for prescription closure.
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => handleClosePrescription(rx)}
                        disabled={!allDistributed || closingId === rx._id}
                        className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold transition shadow-xs ${
                          allDistributed
                            ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                            : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                        }`}
                      >
                        {closingId === rx._id ? (
                          <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        ) : (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        )}
                        <span>Close Prescription (REQ 4.7)</span>
                      </button>
                    </>
                  ) : (
                    /* REQ_04: Display Closure Date and Staff Name */
                    <div className="text-xs text-slate-500 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      <span>
                        Closed on{' '}
                        <strong>{rx.closedAt ? new Date(rx.closedAt).toLocaleString() : 'N/A'}</strong>{' '}
                        by Staff Member <strong>{rx.closedBy?.name || 'Pharmacy Operator'}</strong>.
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
