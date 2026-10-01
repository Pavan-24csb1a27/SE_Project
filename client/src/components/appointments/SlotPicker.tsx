import React, { useState, useEffect } from 'react';
import { appointmentApi } from '../../api/appointment.api';
import type { Doctor, Slot, Appointment } from '../../types/appointment';
import {
  Calendar,
  Clock,
  User,
  CheckCircle,
  AlertCircle,
  Lock,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

interface SlotPickerProps {
  onBookingSuccess: (appointment: Appointment) => void;
}

export const SlotPicker: React.FC<SlotPickerProps> = ({ onBookingSuccess }) => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(
    () => new Date().toISOString().split('T')[0]
  );
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [reasonForVisit, setReasonForVisit] = useState<string>('');

  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [lockingSlot, setLockingSlot] = useState(false);
  const [submittingBooking, setSubmittingBooking] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [lockSuccessMsg, setLockSuccessMsg] = useState<string | null>(null);

  // 1. Fetch active doctors
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        setLoadingDoctors(true);
        const data = await appointmentApi.getDoctors();
        setDoctors(data.doctors);
        if (data.doctors.length > 0) {
          setSelectedDoctorId(data.doctors[0]._id);
        }
      } catch (err: any) {
        setErrorMsg(err.message || 'Failed to load doctors.');
      } finally {
        setLoadingDoctors(false);
      }
    };
    fetchDoctors();
  }, []);

  // 2. Fetch availability slots whenever doctor or date changes
  useEffect(() => {
    if (!selectedDoctorId || !selectedDate) return;

    const fetchSlots = async () => {
      try {
        setLoadingSlots(true);
        setErrorMsg(null);
        setSelectedSlotId(null);
        setLockSuccessMsg(null);
        const res = await appointmentApi.getDoctorAvailability(selectedDoctorId, selectedDate);
        setSlots(res.availability.slots || []);
      } catch (err: any) {
        setErrorMsg(err.message || 'Failed to load availability for this date.');
      } finally {
        setLoadingSlots(false);
      }
    };

    fetchSlots();
  }, [selectedDoctorId, selectedDate]);

  // REQ_04: Step 1 - Lock the slot atomically for 5 minutes
  const handleSlotSelect = async (slot: Slot) => {
    if (slot.status !== 'available') return;

    try {
      setLockingSlot(true);
      setErrorMsg(null);
      await appointmentApi.lockSlot({
        doctorId: selectedDoctorId,
        date: selectedDate,
        slotId: slot.slotId,
      });

      setSelectedSlotId(slot.slotId);
      setLockSuccessMsg(
        `Slot ${slot.startTime} - ${slot.endTime} held for you. Please complete booking within 5 minutes.`
      );
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to hold this slot. Please select another time.');
      // Refresh slots
      const res = await appointmentApi.getDoctorAvailability(selectedDoctorId, selectedDate);
      setSlots(res.availability.slots || []);
    } finally {
      setLockingSlot(false);
    }
  };

  // REQ_05: Step 2 - Finalize booking with reason for visit
  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlotId || !reasonForVisit.trim()) {
      setErrorMsg('Please select a time slot and provide a reason for the consultation.');
      return;
    }

    try {
      setSubmittingBooking(true);
      setErrorMsg(null);
      const res = await appointmentApi.bookAppointment({
        doctorId: selectedDoctorId,
        date: selectedDate,
        slotId: selectedSlotId,
        reasonForVisit: reasonForVisit.trim(),
      });

      onBookingSuccess(res.appointment);
    } catch (err: any) {
      setErrorMsg(err.message || 'Booking failed.');
    } finally {
      setSubmittingBooking(false);
    }
  };

  const selectedDoctor = doctors.find((d) => d._id === selectedDoctorId);
  const selectedSlot = slots.find((s) => s.slotId === selectedSlotId);

  return (
    <div className="space-y-6">
      {/* Filters: Doctor & Date */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
            Select Healthcare Provider *
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <User className="h-4 w-4" />
            </div>
            <select
              value={selectedDoctorId}
              onChange={(e) => setSelectedDoctorId(e.target.value)}
              disabled={loadingDoctors}
              className="block w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-8 text-sm text-slate-900 bg-white focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
            >
              {doctors.map((doc) => (
                <option key={doc._id} value={doc._id}>
                  Dr. {doc.name} — {doc.specialization || 'General Medicine'}
                </option>
              ))}
            </select>
          </div>
          {selectedDoctor && (
            <p className="mt-1 text-xs text-slate-500">
              {selectedDoctor.department || 'Campus Health Center'} | {selectedDoctor.email}
            </p>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
            Select Consultation Date *
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Calendar className="h-4 w-4" />
            </div>
            <input
              type="date"
              value={selectedDate}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="block w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-3 text-sm text-slate-900 bg-white focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
            />
          </div>
        </div>
      </div>

      {/* Messages */}
      {errorMsg && (
        <div className="flex items-center gap-2.5 rounded-lg border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-700">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
          <span>{errorMsg}</span>
        </div>
      )}

      {lockSuccessMsg && (
        <div className="flex items-center gap-2.5 rounded-lg border border-emerald-200 bg-emerald-50 p-3.5 text-xs text-emerald-800">
          <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>{lockSuccessMsg}</span>
        </div>
      )}

      {/* Slots Grid (REQ_01 & REQ_03) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-indigo-600" />
            Available Time Slots (30-Min Consultations)
          </label>
          <span className="text-xs text-slate-400">
            {slots.filter((s) => s.status === 'available').length} slots available
          </span>
        </div>

        {loadingSlots ? (
          <div className="flex h-32 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
              Loading real-time availability...
            </div>
          </div>
        ) : slots.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
            No consultation slots found for this date. Please select another date or doctor.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
            {slots.map((slot) => {
              const isSelected = selectedSlotId === slot.slotId;
              const isAvailable = slot.status === 'available';
              const isLocked = slot.status === 'locked' && !isSelected;
              const isBooked = slot.status === 'booked';

              return (
                <button
                  key={slot.slotId}
                  type="button"
                  onClick={() => handleSlotSelect(slot)}
                  disabled={!isAvailable && !isSelected}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-semibold transition ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-600 ring-offset-1'
                      : isAvailable
                      ? 'border-slate-200 bg-white text-slate-800 hover:border-emerald-500 hover:bg-emerald-50/50'
                      : isLocked
                      ? 'border-amber-200 bg-amber-50/60 text-amber-700 cursor-not-allowed opacity-80'
                      : 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed line-through'
                  }`}
                >
                  <span className="font-mono text-sm">{slot.startTime}</span>
                  <span className="text-[10px] mt-0.5 opacity-80">to {slot.endTime}</span>

                  <span className="mt-1 text-[10px] uppercase font-bold tracking-wider">
                    {isSelected ? (
                      <span className="flex items-center gap-1">
                        <Lock className="h-2.5 w-2.5" /> Held (5m)
                      </span>
                    ) : isAvailable ? (
                      <span className="text-emerald-600">Available</span>
                    ) : isLocked ? (
                      'In Checkout'
                    ) : isBooked ? (
                      'Booked'
                    ) : (
                      'Unavailable'
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Confirmation Form (REQ_05 & REQ_06) */}
      {selectedSlotId && (
        <form
          onSubmit={handleConfirmBooking}
          className="rounded-xl border border-indigo-200 bg-indigo-50/30 p-5 space-y-4"
        >
          <div className="flex items-center gap-2 text-indigo-900 font-semibold text-sm">
            <CheckCircle className="h-4 w-4 text-indigo-600" />
            Selected: {selectedDate} at {selectedSlot?.startTime} - {selectedSlot?.endTime} with Dr.{' '}
            {selectedDoctor?.name}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Reason for Visit / Symptoms *
            </label>
            <textarea
              rows={3}
              value={reasonForVisit}
              onChange={(e) => setReasonForVisit(e.target.value)}
              placeholder="Describe your symptoms or the primary reason for consultation (e.g. fever, headache, routine checkup, allergy refill)..."
              className="block w-full rounded-lg border border-slate-300 p-2.5 text-sm text-slate-900 bg-white placeholder:text-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
              required
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-slate-500">
              Notification will be dispatched to your university email upon confirmation.
            </span>

            <button
              type="submit"
              disabled={submittingBooking || lockingSlot}
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 transition"
            >
              {submittingBooking ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <span>Confirm Appointment</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
