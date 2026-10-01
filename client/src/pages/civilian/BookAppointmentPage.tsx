import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { SlotPicker } from '../../components/appointments/SlotPicker';
import type { Appointment } from '../../types/appointment';
import { CheckCircle2, Calendar, ArrowLeft, ArrowRight, ShieldCheck } from 'lucide-react';

export const BookAppointmentPage: React.FC = () => {
  const [confirmedAppointment, setConfirmedAppointment] = useState<Appointment | null>(null);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Navigation Breadcrumb */}
      <div className="mb-6 flex items-center justify-between">
        <Link
          to="/student"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Student Dashboard
        </Link>

        <Link
          to="/student/appointments"
          className="text-xs font-semibold text-slate-600 hover:text-indigo-600 transition"
        >
          My Appointments →
        </Link>
      </div>

      {confirmedAppointment ? (
        /* Confirmed Booking Success Card (REQ_05 & REQ_06) */
        <div className="rounded-2xl border border-emerald-200 bg-white p-8 shadow-sm text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mb-4">
            <CheckCircle2 className="h-9 w-9" />
          </div>

          <h2 className="text-2xl font-bold text-slate-900">Appointment Confirmed!</h2>
          <p className="mt-1 text-sm text-slate-600">
            Your appointment has been registered with the University Health Center.
          </p>

          <div className="mx-auto mt-6 max-w-md rounded-xl border border-slate-200 bg-slate-50 p-4 text-left space-y-2.5 text-xs text-slate-700">
            <div className="flex justify-between border-b border-slate-200 pb-2">
              <span className="font-semibold text-slate-500">Appointment Number</span>
              <span className="font-mono font-bold text-indigo-600">
                {confirmedAppointment.appointmentNumber}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Date</span>
              <span className="font-semibold">{confirmedAppointment.date}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Consultation Slot</span>
              <span className="font-semibold">
                {confirmedAppointment.timeSlot.startTime} - {confirmedAppointment.timeSlot.endTime}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Reason</span>
              <span className="font-semibold">{confirmedAppointment.reasonForVisit}</span>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span>Confirmation dispatched via email/SMS gateway per SRS REQ_06.</span>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/student/appointments"
              className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white shadow hover:bg-indigo-700 transition"
            >
              <span>View In My Appointments</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <button
              onClick={() => setConfirmedAppointment(null)}
              className="w-full sm:w-auto rounded-lg border border-slate-300 px-5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Book Another Visit
            </button>
          </div>
        </div>
      ) : (
        /* Booking Interface */
        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
          <div className="border-b border-slate-100 pb-5 mb-6">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 mb-2">
              <Calendar className="h-3.5 w-3.5" />
              Real-Time Health Center Scheduling
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Book Doctor Consultation</h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-500">
              Select an available clinician and a 30-minute consultation slot. The slot will be held
              for 5 minutes while you confirm your visit.
            </p>
          </div>

          <SlotPicker onBookingSuccess={(appointment) => setConfirmedAppointment(appointment)} />
        </div>
      )}
    </div>
  );
};
