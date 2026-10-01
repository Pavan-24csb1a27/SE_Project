import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { clinicalApi } from '../../api/clinical.api';
import type { Prescription, DiagnosticTest, SpecialistReferral } from '../../types/clinical';
import {
  Pill,
  Calendar,
  Stethoscope,
  FlaskConical,
  UserPlus,
  ArrowLeft,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';

export const MyMedicinesPage: React.FC = () => {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [diagnosticTests, setDiagnosticTests] = useState<DiagnosticTest[]>([]);
  const [referrals, setReferrals] = useState<SpecialistReferral[]>([]);

  const [activeTab, setActiveTab] = useState<'medicines' | 'tests' | 'referrals'>('medicines');
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setErrorMsg(null);
        const [rxRes, testRes, refRes] = await Promise.all([
          clinicalApi.getPrescriptions(),
          clinicalApi.getDiagnosticTests(),
          clinicalApi.getReferrals(),
        ]);

        setPrescriptions(rxRes.prescriptions);
        setDiagnosticTests(testRes.tests);
        setReferrals(refRes.referrals);
      } catch (err: any) {
        setErrorMsg(err.message || 'Failed to load medicines and clinical orders.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6">
        <Link
          to="/student"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition mb-2"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Student Dashboard
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">Medicines & Clinical Prescriptions</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Review your prescribed medication dosages, lab requisitions, and specialist referrals
        </p>
      </div>

      {errorMsg && (
        <div className="mb-6 flex items-center gap-2.5 rounded-lg border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-700">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 mb-6 overflow-x-auto">
        <button
          onClick={() => setActiveTab('medicines')}
          className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold transition ${
            activeTab === 'medicines'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Pill className="h-4 w-4" />
          Prescribed Medicines ({prescriptions.length})
        </button>

        <button
          onClick={() => setActiveTab('tests')}
          className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold transition ${
            activeTab === 'tests'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <FlaskConical className="h-4 w-4" />
          Recommended Lab Tests ({diagnosticTests.length})
        </button>

        <button
          onClick={() => setActiveTab('referrals')}
          className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold transition ${
            activeTab === 'referrals'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <UserPlus className="h-4 w-4" />
          Specialist Referrals ({referrals.length})
        </button>
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
            Loading clinical records...
          </div>
        </div>
      ) : activeTab === 'medicines' ? (
        /* REQ 4.2: View Medicines List */
        prescriptions.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-500 mb-3">
              <Pill className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800">No Prescriptions on File</h3>
            <p className="mt-1 text-xs text-slate-500">
              When a university doctor issues a prescription, it will appear here with instructions.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {prescriptions.map((rx) => (
              <div
                key={rx._id}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4"
              >
                {/* Header (REQ_03: Prescribing Doctor & Issue Date) */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div>
                    <span className="font-mono text-xs font-bold text-slate-500 mr-2">
                      {rx.prescriptionNumber}
                    </span>
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider ${
                        rx.status === 'open'
                          ? 'border-amber-200 bg-amber-50 text-amber-800'
                          : 'border-emerald-200 bg-emerald-50 text-emerald-800'
                      }`}
                    >
                      {rx.status === 'open' ? 'Ready for Pharmacy Pickup' : 'Dispensed & Closed'}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Stethoscope className="h-3.5 w-3.5 text-indigo-600" />
                      Dr. {rx.doctorId?.name} ({rx.doctorId?.specialization || 'General Medicine'})
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-indigo-600" />
                      {new Date(rx.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Medicines Table (REQ_01 & REQ_02: Dosage, Frequency, Duration) */}
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200 text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-left">
                        <th className="py-2.5 px-3">Medicine Name</th>
                        <th className="py-2.5 px-3">Dosage</th>
                        <th className="py-2.5 px-3">Frequency</th>
                        <th className="py-2.5 px-3">Duration</th>
                        <th className="py-2.5 px-3">Dispensation Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {rx.medicines.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/60">
                          <td className="py-2.5 px-3 font-semibold text-slate-900">
                            {item.name}
                            {item.notes && (
                              <span className="block text-[11px] font-normal text-slate-500">
                                {item.notes}
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 font-mono font-medium text-slate-700">
                            {item.dosage}
                          </td>
                          <td className="py-2.5 px-3 text-slate-700">{item.frequency}</td>
                          <td className="py-2.5 px-3 text-slate-700">{item.duration}</td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                                item.isDistributed
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {item.isDistributed ? 'Dispensed' : 'Awaiting Pickup'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )
      ) : activeTab === 'tests' ? (
        /* REQ 4.5: View Diagnostic Tests */
        diagnosticTests.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
            <FlaskConical className="mx-auto h-12 w-12 text-slate-400 mb-3" />
            <h3 className="text-base font-bold text-slate-800">No Pending Lab Tests</h3>
            <p className="mt-1 text-xs text-slate-500">
              Your clinicians have not ordered any diagnostic lab tests.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {diagnosticTests.map((t) => (
              <div key={t._id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div className="text-xs font-bold text-indigo-700 uppercase tracking-wider">
                    Recommended by Dr. {t.doctorId?.name}
                  </div>
                  <span className="text-xs text-slate-400">
                    {new Date(t.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="mt-3">
                  <h4 className="text-sm font-bold text-slate-900">
                    Required Tests: {t.testNames.join(', ')}
                  </h4>
                  <p className="mt-1 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    <strong>Instructions:</strong> {t.clinicalInstructions}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* REQ 4.6: Specialist Referrals */
        referrals.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
            <UserPlus className="mx-auto h-12 w-12 text-slate-400 mb-3" />
            <h3 className="text-base font-bold text-slate-800">No Specialist Referrals</h3>
            <p className="mt-1 text-xs text-slate-500">
              No specialist referrals currently pending on your record.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {referrals.map((ref) => (
              <div
                key={ref._id}
                className="rounded-2xl border border-indigo-200 bg-white p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-indigo-100 text-indigo-800 text-[10px] font-bold px-2.5 py-0.5 uppercase tracking-wider">
                      Specialist Recommendation
                    </span>
                    <span className="text-xs text-slate-400">
                      Referred by Dr. {ref.referringDoctorId?.name}
                    </span>
                  </div>

                  <h4 className="text-base font-bold text-slate-900 mt-2">
                    Dr. {ref.recommendedDoctorId?.name} ({ref.specialization})
                  </h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    <strong>Clinical Reason:</strong> {ref.clinicalReason}
                  </p>
                </div>

                <div className="shrink-0">
                  {/* REQ_04: Student books manually */}
                  <Link
                    to="/student/book"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-indigo-700 transition"
                  >
                    <span>Book Specialist Slot</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
};
