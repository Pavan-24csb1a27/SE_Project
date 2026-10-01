import React from 'react';
import { Link } from 'react-router-dom';
import { Activity, Calendar, ShieldCheck, HeartPulse, Clock, ArrowRight } from 'lucide-react';

export const HomePage: React.FC = () => {
  return (
    <div className="relative overflow-hidden bg-slate-50">
      {/* Hero Section */}
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50/70 px-4 py-1.5 text-xs font-semibold text-indigo-700 mb-6">
            <HeartPulse className="h-4 w-4" />
            University Institute Health Center Portal
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900">
            Smart, Centralized Healthcare for{' '}
            <span className="text-indigo-600">Our University</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base sm:text-lg text-slate-600">
            Eliminate long queues and fragmented records. Book appointments in seconds, access verified
            digital prescriptions, and securely view clinical reports from any device.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/login"
              className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3.5 text-sm font-semibold text-white shadow hover:bg-indigo-700 transition"
            >
              <span>Access UniHealth Portal</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/register"
              className="flex w-full sm:w-auto items-center justify-center rounded-xl border border-slate-300 bg-white px-6 py-3.5 text-sm font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition"
            >
              New Student Registration
            </Link>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-xs">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 mb-5">
              <Calendar className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Real-Time Scheduling</h3>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              Book consultations with university doctors with atomic slot-locking to prevent double-booking.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-xs">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 mb-5">
              <Activity className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Critical Allergy Alerting</h3>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              Prominently surfaces severe drug allergies and chronic conditions to clinicians at the point of care.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-xs">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600 mb-5">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Verified Pharmacy Dispense</h3>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              Digital prescription workflows ensuring every prescribed item is safely distributed before closure.
            </p>
          </div>
        </div>

        {/* Operating Hours Banner */}
        <div className="mt-12 rounded-2xl bg-slate-900 text-white p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10 text-indigo-400">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <h4 className="text-base font-bold">Health Center Operating Hours</h4>
              <p className="text-xs text-slate-300">
                Monday to Friday: 08:30 AM – 06:00 PM | Emergency & Urgent Care: 24/7 on Campus
              </p>
            </div>
          </div>
          <Link
            to="/login"
            className="rounded-lg bg-indigo-500 px-4 py-2.5 text-xs font-semibold text-white hover:bg-indigo-400 transition shrink-0"
          >
            Check Doctor Availability
          </Link>
        </div>
      </div>
    </div>
  );
};
