import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { appointmentApi } from '../../api/appointment.api';
import { useAuthStore } from '../../store/authStore';
import type { Slot } from '../../types/appointment';
import { Calendar, Clock, Save, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';

export const DoctorSchedulePage: React.FC = () => {
  const { user } = useAuthStore();
  const [selectedDate, setSelectedDate] = useState<string>(
    () => new Date().toISOString().split('T')[0]
  );
  const [startHour, setStartHour] = useState<number>(9);
  const [endHour, setEndHour] = useState<number>(17);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  const fetchSchedule = async (date: string) => {
    if (!user) return;
    try {
      setLoading(true);
      setStatusMsg(null);
      const res = await appointmentApi.getDoctorAvailability(user.id, date);
      setSlots(res.availability.slots || []);
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to load schedule.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedule(selectedDate);
  }, [selectedDate, user]);

  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setSaving(true);
      setStatusMsg(null);
      const res = await appointmentApi.configureSchedule({
        doctorId: user.id,
        date: selectedDate,
        startHour,
        endHour,
      });

      setSlots(res.availability.slots || []);
      setStatusMsg({
        type: 'success',
        text: `Schedule successfully generated and saved for ${selectedDate}.`,
      });
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to update schedule.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6">
        <Link
          to="/doctor"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-900 transition mb-2"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Doctor Dashboard
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">Manage Availability & Shifts</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure working hours and discrete 30-minute consultation slots for student bookings
        </p>
      </div>

      {statusMsg && (
        <div
          className={`mb-6 flex items-center gap-2.5 rounded-lg border p-3.5 text-xs ${
            statusMsg.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-rose-200 bg-rose-50 text-rose-700'
          }`}
        >
          {statusMsg.type === 'success' ? (
            <CheckCircle className="h-4 w-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
          )}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Schedule Configuration Card */}
      <form
        onSubmit={handleSaveSchedule}
        className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4"
      >
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Clock className="h-4 w-4 text-emerald-600" />
          Set Shift Hours for Selected Date
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Shift Date *
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Calendar className="h-4 w-4" />
              </div>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="block w-full rounded-lg border border-slate-300 py-2 pl-10 pr-3 text-sm text-slate-900 bg-white focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Start Shift (Hour)
            </label>
            <select
              value={startHour}
              onChange={(e) => setStartHour(Number(e.target.value))}
              className="block w-full rounded-lg border border-slate-300 py-2 px-3 text-sm text-slate-900 bg-white focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
            >
              <option value={8}>08:00 AM</option>
              <option value={9}>09:00 AM</option>
              <option value={10}>10:00 AM</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              End Shift (Hour)
            </label>
            <select
              value={endHour}
              onChange={(e) => setEndHour(Number(e.target.value))}
              className="block w-full rounded-lg border border-slate-300 py-2 px-3 text-sm text-slate-900 bg-white focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
            >
              <option value={13}>01:00 PM (Half Day)</option>
              <option value={16}>04:00 PM</option>
              <option value={17}>05:00 PM (Standard)</option>
              <option value={18}>06:00 PM</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-emerald-700 px-5 py-2.5 text-xs font-semibold text-white shadow hover:bg-emerald-800 disabled:opacity-50 transition"
          >
            {saving ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>Save & Generate 30-Min Slots</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Active Slots Display */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <h3 className="text-sm font-bold text-slate-900">
            Active Schedule for {selectedDate} ({slots.length} Total Slots)
          </h3>
          <div className="flex items-center gap-3 text-[11px]">
            <span className="flex items-center gap-1 text-emerald-600 font-semibold">
              ● Available: {slots.filter((s) => s.status === 'available').length}
            </span>
            <span className="flex items-center gap-1 text-indigo-600 font-semibold">
              ● Booked: {slots.filter((s) => s.status === 'booked').length}
            </span>
            <span className="flex items-center gap-1 text-amber-600 font-semibold">
              ● Held: {slots.filter((s) => s.status === 'locked').length}
            </span>
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-sm text-slate-500">Loading slots...</div>
        ) : slots.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-500">
            No slots configured for this date. Click "Save & Generate 30-Min Slots" above.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {slots.map((s) => (
              <div
                key={s.slotId}
                className={`p-3 rounded-xl border text-center text-xs ${
                  s.status === 'booked'
                    ? 'border-indigo-200 bg-indigo-50/60 text-indigo-800 font-bold'
                    : s.status === 'locked'
                    ? 'border-amber-200 bg-amber-50 text-amber-800'
                    : 'border-slate-200 bg-slate-50/50 text-slate-700'
                }`}
              >
                <div className="font-mono text-xs">{s.startTime}</div>
                <div className="text-[10px] text-slate-400">to {s.endTime}</div>
                <div className="mt-1 text-[10px] uppercase font-bold tracking-wider">
                  {s.status}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
