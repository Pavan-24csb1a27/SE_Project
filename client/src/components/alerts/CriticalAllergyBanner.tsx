import React from 'react';
import type { Allergy } from '../../types/clinical';
import { AlertOctagon, AlertTriangle, ShieldCheck } from 'lucide-react';

interface CriticalAllergyBannerProps {
  allergies: Allergy[];
  chronicConditions: string[];
}

export const CriticalAllergyBanner: React.FC<CriticalAllergyBannerProps> = ({
  allergies,
  chronicConditions,
}) => {
  const criticalAllergies = allergies.filter((a) => a.severity === 'critical');
  const moderateAllergies = allergies.filter((a) => a.severity !== 'critical');

  const hasAlerts = allergies.length > 0 || chronicConditions.length > 0;

  if (!hasAlerts) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-4 text-xs text-emerald-900 flex items-center gap-3">
        <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0" />
        <div>
          <span className="font-bold">No Known Allergies or Chronic Conditions Recorded:</span>{' '}
          Patient has no flagged contraindications on file.
        </div>
      </div>
    );
  }

  return (
    <aside
      role="alert"
      aria-label="Critical Medical and Allergy Alerts"
      className="sticky top-20 z-40 mb-6 rounded-2xl border-2 border-rose-600 bg-rose-50 p-5 shadow-md"
    >
      <div className="flex items-start gap-3.5">
        <div className="rounded-xl bg-rose-600 p-2.5 text-white shrink-0 animate-pulse">
          <AlertOctagon className="h-6 w-6" />
        </div>

        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold text-rose-900 tracking-tight flex items-center gap-2">
              POINT-OF-CARE SAFETY ALERT (SRS REQ 5.2)
            </h3>
            <span className="rounded-full bg-rose-200 px-3 py-0.5 text-[11px] font-black uppercase tracking-wider text-rose-900">
              High Risk / Critical
            </span>
          </div>

          <p className="text-xs text-rose-800 font-medium">
            Please verify all prescribed medications, dosages, and diagnostic procedures against the
            following known patient contraindications:
          </p>

          {/* Critical Allergies */}
          {criticalAllergies.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-xs font-bold text-rose-900">CRITICAL DRUG ALLERGIES:</span>
              {criticalAllergies.map((allergy, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 rounded-lg bg-rose-600 px-2.5 py-1 text-xs font-bold text-white shadow-xs"
                >
                  <AlertTriangle className="h-3 w-3" />
                  {allergy.allergen.toUpperCase()}
                  {allergy.notes && (
                    <span className="font-normal opacity-90">({allergy.notes})</span>
                  )}
                </span>
              ))}
            </div>
          )}

          {/* Moderate Allergies & Chronic Conditions */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-800 pt-1">
            {moderateAllergies.length > 0 && (
              <div className="flex items-center gap-1.5 mr-3">
                <span className="font-semibold text-slate-700">Other Allergies:</span>
                {moderateAllergies.map((a, idx) => (
                  <span
                    key={idx}
                    className="rounded bg-amber-100 px-2 py-0.5 font-medium text-amber-900"
                  >
                    {a.allergen} ({a.severity})
                  </span>
                ))}
              </div>
            )}

            {chronicConditions.length > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-slate-700">Chronic Conditions:</span>
                {chronicConditions.map((c, idx) => (
                  <span
                    key={idx}
                    className="rounded bg-purple-100 px-2 py-0.5 font-medium text-purple-900"
                  >
                    {c}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
};
