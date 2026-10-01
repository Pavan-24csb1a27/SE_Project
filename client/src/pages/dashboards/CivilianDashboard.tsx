import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { appointmentApi } from '../../api/appointment.api';
import type { Appointment } from '../../types/appointment';
import { Calendar, Pill, FileText, Clock, Plus, ArrowRight } from 'lucide-react';

export const CivilianDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const [recentAppointments, setRecentAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchRecent = async () => {
      try {
        setLoading(true);
        const res = await appointmentApi.getMyAppointments('confirmed');
        setRecentAppointments(res.appointments.slice(0, 3));
      } catch (err) {
        console.error('Failed to load appointments:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchRecent();
  }, []);

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
        <Link
          to="/student/book"
          className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs hover:border-indigo-400 hover:shadow-sm transition block"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Book Appointment
            </span>
            <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600">
              <Calendar className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-900">Schedule</p>
          <p className="mt-1 text-xs text-indigo-600 font-medium">Select Doctor & Slot →</p>
        </Link>

        <Link
          to="/student/appointments"
          className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs hover:border-indigo-400 hover:shadow-sm transition block"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              My Appointments
            </span>
            <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-900">
            {recentAppointments.length} Active
          </p>
          <p className="mt-1 text-xs text-blue-600 font-medium">View Scheduled Visits →</p>
        </Link>

        <Link
          to="/student/medicines"
          className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs hover:border-emerald-400 hover:shadow-sm transition block"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Prescribed Meds
            </span>
            <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
              <Pill className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-900">Rx & Labs</p>
          <p className="mt-1 text-xs text-emerald-600 font-medium">View Medicines & Tests →</p>
        </Link>

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
          <p className="mt-1 text-xs text-purple-600 font-medium">View Tests (Phase 4) →</p>
        </div>
      </div>

      {/* Upcoming Visits Feed */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Clock className="h-4 w-4 text-indigo-600" />
            Upcoming Health Center Visits
          </h2>
          <Link
            to="/student/appointments"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
          >
            All Appointments <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {loading ? (
          <div className="py-8 text-center text-sm text-slate-500">Loading appointments...</div>
        ) : recentAppointments.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm text-slate-500">No upcoming consultations booked.</p>
            <div className="mt-4">
              <Link
                to="/student/book"
                className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-indigo-700 transition"
              >
                <Plus className="h-3.5 w-3.5" />
                Book Your First Visit
              </Link>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 mt-2">
            {recentAppointments.map((appt) => (
              <div key={appt._id} className="py-4 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-sm text-slate-900">
                    Dr. {appt.doctorId?.name} ({appt.doctorId?.specialization || 'General Medicine'})
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {appt.date} at {appt.timeSlot.startTime} - {appt.timeSlot.endTime} | {appt.reasonForVisit}
                  </div>
                </div>
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 uppercase">
                  {appt.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
