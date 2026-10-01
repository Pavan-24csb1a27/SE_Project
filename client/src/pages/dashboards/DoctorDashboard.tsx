import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { appointmentApi } from '../../api/appointment.api';
import type { Appointment } from '../../types/appointment';
import {
  Stethoscope,
  AlertTriangle,
  Users,
  UserCheck,
  CalendarRange,
  Clock,
} from 'lucide-react';

export const DoctorDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchQueue = async () => {
      try {
        setLoading(true);
        const res = await appointmentApi.getMyAppointments('confirmed');
        setAppointments(res.appointments);
      } catch (err) {
        console.error('Failed to load doctor appointments:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchQueue();
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6 rounded-2xl bg-gradient-to-r from-emerald-800 to-teal-700 p-6 sm:p-8 text-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider mb-2">
            Clinician / Medical Staff Portal
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold">Dr. {user?.name}</h1>
          <p className="mt-1 text-emerald-100 text-sm">
            Specialization: <span className="font-semibold">{user?.specialization || 'General Medicine'}</span> | Medical ID: <span className="font-mono">{user?.universityId}</span>
          </p>
        </div>

        <Link
          to="/doctor/schedule"
          className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-emerald-900 shadow hover:bg-emerald-50 transition shrink-0"
        >
          <CalendarRange className="h-4 w-4 text-emerald-700" />
          Manage Availability & Shifts
        </Link>
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
              Scheduled Consultations
            </span>
            <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-900">{appointments.length} Patients</p>
          <p className="mt-1 text-xs text-slate-500">Confirmed appointments waiting</p>
        </div>

        <Link
          to="/doctor/schedule"
          className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs hover:border-emerald-400 transition block"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Working Schedule
            </span>
            <div className="rounded-lg bg-teal-50 p-2 text-teal-600">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-900">Active</p>
          <p className="mt-1 text-xs text-teal-600 font-medium">Configure slots & shifts →</p>
        </Link>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Prescription & Lab Desk
            </span>
            <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
              <Stethoscope className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-900">Phase 3</p>
          <p className="mt-1 text-xs text-slate-500">Digital Rx & diagnostic lab orders</p>
        </div>
      </div>

      {/* Active Consultations Feed */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-emerald-600" />
            Patient Consultation Queue ({appointments.length})
          </h2>
          <span className="text-xs text-slate-400">Real-Time Schedule</span>
        </div>

        {loading ? (
          <div className="py-8 text-center text-sm text-slate-500">Loading schedule...</div>
        ) : appointments.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-500">
            No patient currently waiting in consultation queue.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 mt-2">
            {appointments.map((appt) => (
              <div key={appt._id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">
                      {appt.civilianId?.name}
                    </span>
                    <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      {appt.civilianId?.universityId}
                    </span>
                    <span className="text-xs text-slate-500">
                      Dept: {appt.civilianId?.department || 'University'}
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 mt-1">
                    <strong>Time:</strong> {appt.date} at {appt.timeSlot.startTime} - {appt.timeSlot.endTime} | <strong>Reason:</strong> {appt.reasonForVisit}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 uppercase">
                    {appt.status}
                  </span>

                  {appt.civilianId && (
                    <Link
                      to={`/doctor/consultation/${appt.civilianId._id}`}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-emerald-800 transition"
                    >
                      <Stethoscope className="h-3.5 w-3.5" />
                      <span>Start Consultation</span>
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
