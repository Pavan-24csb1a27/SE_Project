import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { appointmentApi } from '../../api/appointment.api';
import type { Appointment } from '../../types/appointment';
import { AppointmentCard } from '../../components/appointments/AppointmentCard';
import { useAuthStore } from '../../store/authStore';
import { Calendar, Plus, ArrowLeft, AlertCircle } from 'lucide-react';

export const MyAppointmentsPage: React.FC = () => {
  const { user } = useAuthStore();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchAppointments = async (filter?: string) => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const queryFilter = filter && filter !== 'all' ? filter : undefined;
      const res = await appointmentApi.getMyAppointments(queryFilter);
      setAppointments(res.appointments);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load appointments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments(statusFilter);
  }, [statusFilter]);

  const handleCancelAppointment = async (id: string, reason: string) => {
    try {
      await appointmentApi.cancelAppointment(id, reason);
      // Refresh list
      fetchAppointments(statusFilter);
    } catch (err: any) {
      alert(err.message || 'Failed to cancel appointment.');
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            to="/student"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition mb-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Student Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">My Appointments</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Review your upcoming consultations and past health center visits
          </p>
        </div>

        <Link
          to="/student/book"
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow hover:bg-indigo-700 transition"
        >
          <Plus className="h-4 w-4" />
          Book New Consultation
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 mb-6 overflow-x-auto">
        {['all', 'confirmed', 'completed', 'cancelled'].map((filter) => (
          <button
            key={filter}
            onClick={() => setStatusFilter(filter)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-wider capitalize transition ${
              statusFilter === filter
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      {errorMsg && (
        <div className="mb-6 flex items-center gap-2.5 rounded-lg border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-700">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
          <span>{errorMsg}</span>
        </div>
      )}

      {loading ? (
        <div className="flex h-40 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
            Loading appointments...
          </div>
        </div>
      ) : appointments.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-500 mb-3">
            <Calendar className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No appointments found</h3>
          <p className="mt-1 text-xs text-slate-500">
            You currently have no {statusFilter !== 'all' ? statusFilter : ''} appointments recorded.
          </p>
          <div className="mt-5">
            <Link
              to="/student/book"
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-indigo-700 transition"
            >
              <Plus className="h-3.5 w-3.5" />
              Book Appointment Now
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {appointments.map((appt) => (
            <AppointmentCard
              key={appt._id}
              appointment={appt}
              onCancel={handleCancelAppointment}
              userRole={user?.role || 'civilian'}
            />
          ))}
        </div>
      )}
    </div>
  );
};
