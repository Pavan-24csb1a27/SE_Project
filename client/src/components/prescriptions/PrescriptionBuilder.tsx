import React, { useState } from 'react';
import { clinicalApi } from '../../api/clinical.api';
import type { Prescription } from '../../types/clinical';
import { Pill, Plus, Trash2, Send, AlertCircle } from 'lucide-react';

interface MedicineRow {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  notes: string;
}

interface PrescriptionBuilderProps {
  appointmentId: string;
  civilianId: string;
  patientName: string;
  onSuccess: (prescription: Prescription) => void;
}

export const PrescriptionBuilder: React.FC<PrescriptionBuilderProps> = ({
  appointmentId,
  civilianId,
  patientName,
  onSuccess,
}) => {
  const [medicines, setMedicines] = useState<MedicineRow[]>([
    { name: '', dosage: '', frequency: '', duration: '', notes: '' },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleAddRow = () => {
    setMedicines((prev) => [
      ...prev,
      { name: '', dosage: '', frequency: '', duration: '', notes: '' },
    ]);
  };

  const handleRemoveRow = (index: number) => {
    if (medicines.length === 1) return;
    setMedicines((prev) => prev.filter((_, i) => i !== index));
  };

  const handleFieldChange = (index: number, field: keyof MedicineRow, value: string) => {
    setMedicines((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // REQ_02 Client Validation: ensure every item has name, dosage, frequency, duration
    for (let i = 0; i < medicines.length; i++) {
      const item = medicines[i];
      if (!item.name.trim() || !item.dosage.trim() || !item.frequency.trim() || !item.duration.trim()) {
        setErrorMsg(
          `Medicine #${i + 1} is missing mandatory fields. Name, dosage, frequency, and duration are required.`
        );
        return;
      }
    }

    try {
      setSubmitting(true);
      const res = await clinicalApi.addPrescription({
        appointmentId,
        civilianId,
        medicines,
      });

      onSuccess(res.prescription);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to issue prescription.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Pill className="h-4 w-4 text-emerald-600" />
            Digital Prescription Desk (SRS REQ 4.4)
          </h3>
          <p className="text-xs text-slate-500">
            Issuing for patient: <strong className="text-slate-700">{patientName}</strong> | Will be dispatched to Campus Pharmacy as <em>"open"</em>.
          </p>
        </div>

        <button
          type="button"
          onClick={handleAddRow}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Another Medicine
        </button>
      </div>

      {errorMsg && (
        <div className="flex items-center gap-2.5 rounded-lg border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-700">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Dynamic Medicine Rows */}
      <div className="space-y-3">
        {medicines.map((row, idx) => (
          <div
            key={idx}
            className="grid grid-cols-1 sm:grid-cols-12 gap-3 rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 items-end"
          >
            <div className="sm:col-span-3">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                Medicine Name *
              </label>
              <input
                type="text"
                value={row.name}
                onChange={(e) => handleFieldChange(idx, 'name', e.target.value)}
                placeholder="e.g. Amoxicillin"
                className="block w-full rounded-lg border border-slate-300 py-1.5 px-2.5 text-xs text-slate-900 bg-white focus:border-emerald-600 focus:outline-none"
                required
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                Dosage *
              </label>
              <input
                type="text"
                value={row.dosage}
                onChange={(e) => handleFieldChange(idx, 'dosage', e.target.value)}
                placeholder="500mg"
                className="block w-full rounded-lg border border-slate-300 py-1.5 px-2.5 text-xs text-slate-900 bg-white focus:border-emerald-600 focus:outline-none"
                required
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                Frequency *
              </label>
              <input
                type="text"
                value={row.frequency}
                onChange={(e) => handleFieldChange(idx, 'frequency', e.target.value)}
                placeholder="1-0-1 (Twice daily after meals)"
                className="block w-full rounded-lg border border-slate-300 py-1.5 px-2.5 text-xs text-slate-900 bg-white focus:border-emerald-600 focus:outline-none"
                required
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                Duration *
              </label>
              <input
                type="text"
                value={row.duration}
                onChange={(e) => handleFieldChange(idx, 'duration', e.target.value)}
                placeholder="5 days"
                className="block w-full rounded-lg border border-slate-300 py-1.5 px-2.5 text-xs text-slate-900 bg-white focus:border-emerald-600 focus:outline-none"
                required
              />
            </div>

            <div className="sm:col-span-2 flex items-center justify-between gap-2">
              <div className="w-full">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Notes
                </label>
                <input
                  type="text"
                  value={row.notes}
                  onChange={(e) => handleFieldChange(idx, 'notes', e.target.value)}
                  placeholder="Oral"
                  className="block w-full rounded-lg border border-slate-300 py-1.5 px-2.5 text-xs text-slate-900 bg-white focus:border-emerald-600 focus:outline-none"
                />
              </div>

              {medicines.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveRow(idx)}
                  className="text-slate-400 hover:text-rose-600 transition p-1.5 shrink-0"
                  title="Remove this drug"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
        <span className="text-xs text-slate-500">
          Status will be initialized as <strong>"open"</strong> for Pharmacy pickup.
        </span>

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-5 py-2.5 text-xs font-semibold text-white shadow hover:bg-emerald-800 disabled:opacity-50 transition"
        >
          {submitting ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <>
              <Send className="h-3.5 w-3.5" />
              <span>Issue & Transmit Prescription</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};
