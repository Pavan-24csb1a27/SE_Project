import React, { useState } from 'react';
import type { Appointment } from '../../types/appointment';
import { Calendar, Clock, Stethoscope, AlertCircle, XCircle } from 'lucide-react';

interface AppointmentCardProps {
  appointment: Appointment;
  onCancel: (appointmentId: string, reason: string) => Promise<void>;
  userRole: 'civilian' | 'doctor' | 'admin' | 'pharmacy';
}

export const AppointmentCard: React.FC<AppointmentCardProps> = ({
  appointment,
  onCancel,
  userRole,
}) => {
  const [cancelling, setCancelling] = useState(false);
  const [showCancelPrompt, setShowCancelPrompt] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'cancelled':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'no-show':
        return 'bg-slate-100 text-slate-800 border-slate-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const handleConfirmCancel = async () => {
    try {
      setCancelling(true);
      await onCancel(appointment._id, cancelReason || 'Cancelled by user');
      setShowCancelPrompt(false);
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs hover:border-slate-300 transition">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold text-slate-500">
            {appointment.appointmentNumber}
          </span>
          <span
            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider ${getStatusBadge(
              appointment.status
            )}`}
          >
            {appointment.status}
          </span>
        </div>

        <div className="flex items-center gap-4 text-xs text-slate-500 font-medium">
          <span className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-indigo-600" />
            {appointment.date}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-indigo-600" />
            {appointment.timeSlot.startTime} - {appointment.timeSlot.endTime}
          </span>
        </div>
      </div>

      <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          {userRole === 'civilian' ? (
            <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
              <Stethoscope className="h-4 w-4 text-indigo-600" />
              Dr. {appointment.doctorId?.name || 'Assigned Clinician'}
              <span className="text-xs font-normal text-slate-500">
                ({appointment.doctorId?.specialization || 'General Medicine'})
              </span>
            </div>
          ) : (
            <div className="text-slate-900 font-bold text-base">
              Patient: {appointment.civilianId?.name}
              <span className="text-xs font-normal text-slate-500 ml-2">
                ID: {appointment.civilianId?.universityId}
              </span>
            </div>
          )}

          <p className="mt-1 text-xs text-slate-600">
            <strong className="text-slate-700">Reason:</strong> {appointment.reasonForVisit}
          </p>

          {appointment.cancellationReason && (
            <p className="mt-1 text-xs text-rose-600">
              <strong>Cancellation Note:</strong> {appointment.cancellationReason}
            </p>
          )}
        </div>

        {appointment.status === 'confirmed' && (
          <div>
            {!showCancelPrompt ? (
              <button
                onClick={() => setShowCancelPrompt(true)}
                className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700 transition"
              >
                <XCircle className="h-3.5 w-3.5" />
                Cancel Appointment
              </button>
            ) : (
              <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-3 text-xs space-y-2">
                <div className="flex items-center gap-1.5 text-rose-800 font-semibold">
                  <AlertCircle className="h-3.5 w-3.5 text-rose-600" />
                  Confirm Cancellation?
                </div>
                <input
                  type="text"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Reason for cancellation..."
                  className="block w-full rounded border border-slate-300 p-1.5 text-xs text-slate-800 bg-white"
                />
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleConfirmCancel}
                    disabled={cancelling}
                    className="rounded bg-rose-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
                  >
                    {cancelling ? 'Cancelling...' : 'Yes, Cancel'}
                  </button>
                  <button
                    onClick={() => setShowCancelPrompt(false)}
                    className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-600 hover:bg-slate-100"
                  >
                    Keep Appointment
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
