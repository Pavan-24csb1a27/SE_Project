import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../../api/auth.api';
import { useAuthStore, getRoleDashboardPath } from '../../store/authStore';
import type { UserRole } from '../../types/auth';
import {
  Activity,
  Lock,
  User,
  Mail,
  Phone,
  BookOpen,
  AlertCircle,
  ArrowRight,
  Stethoscope,
  Pill,
  GraduationCap,
} from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const [role, setRole] = useState<UserRole>('civilian');
  const [formData, setFormData] = useState({
    universityId: '',
    name: '',
    email: '',
    password: '',
    phone: '',
    department: '',
    specialization: 'General Medicine',
  });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { setUser } = useAuthStore();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.universityId || !formData.name || !formData.email || !formData.password) {
      setErrorMsg('Please complete all required fields.');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await authApi.register({
        universityId: formData.universityId.trim(),
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        phone: formData.phone.trim() || undefined,
        department:
          formData.department.trim() ||
          (role === 'doctor'
            ? 'Campus Health Center'
            : role === 'pharmacy'
            ? 'Main Dispensary'
            : 'Academic Department'),
        specialization: role === 'doctor' ? formData.specialization : undefined,
        role,
      });
      setUser(res.user);
      navigate(getRoleDashboardPath(res.user.role));
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-slate-50">
      <div className="w-full max-w-lg space-y-6 rounded-2xl bg-white p-8 shadow-sm border border-slate-200">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 mb-3">
            <Activity className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Create UniHealth Account</h1>
          <p className="mt-1 text-sm text-slate-500">
            Register as a Student, Doctor, or Pharmacy Staff
          </p>
        </div>

        {/* Role Selector Tabs */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
            Select Your Role
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => {
                setRole('civilian');
                setFormData((prev) => ({ ...prev, department: 'Computer Science' }));
              }}
              className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-semibold transition ${
                role === 'civilian'
                  ? 'border-indigo-600 bg-indigo-50/70 text-indigo-700 ring-2 ring-indigo-600 ring-offset-1'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              <GraduationCap className="h-5 w-5 mb-1 text-indigo-600" />
              <span>Student</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setRole('doctor');
                setFormData((prev) => ({
                  ...prev,
                  department: 'Campus Health Center',
                  specialization: 'General Medicine',
                }));
              }}
              className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-semibold transition ${
                role === 'doctor'
                  ? 'border-emerald-600 bg-emerald-50/70 text-emerald-800 ring-2 ring-emerald-600 ring-offset-1'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Stethoscope className="h-5 w-5 mb-1 text-emerald-600" />
              <span>Doctor</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setRole('pharmacy');
                setFormData((prev) => ({ ...prev, department: 'Main Dispensary' }));
              }}
              className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-semibold transition ${
                role === 'pharmacy'
                  ? 'border-amber-600 bg-amber-50/70 text-amber-800 ring-2 ring-amber-600 ring-offset-1'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Pill className="h-5 w-5 mb-1 text-amber-600" />
              <span>Pharmacy</span>
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="flex items-center gap-2.5 rounded-lg border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-700">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                {role === 'doctor'
                  ? 'Medical Staff ID *'
                  : role === 'pharmacy'
                  ? 'Pharmacy Staff ID *'
                  : 'University ID / Roll No *'}
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <User className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  name="universityId"
                  value={formData.universityId}
                  onChange={handleChange}
                  placeholder={
                    role === 'doctor'
                      ? 'e.g. DOC103'
                      : role === 'pharmacy'
                      ? 'e.g. PHARM02'
                      : 'e.g. 24CSB1A24'
                  }
                  className="block w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Full Name *
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <User className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder={role === 'doctor' ? 'Dr. Name' : 'Full Name'}
                  className="block w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                  required
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              University Email *
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Mail className="h-4 w-4" />
              </div>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder={
                  role === 'doctor'
                    ? 'doctor.name@univ.edu'
                    : role === 'pharmacy'
                    ? 'pharmacy.staff@univ.edu'
                    : 'student@univ.edu'
                }
                className="block w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                required
              />
            </div>
          </div>

          {/* Specialization (for Doctors) */}
          {role === 'doctor' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Medical Specialization *
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Stethoscope className="h-4 w-4 text-emerald-600" />
                </div>
                <select
                  name="specialization"
                  value={formData.specialization}
                  onChange={handleChange}
                  className="block w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-3 text-sm text-slate-900 bg-white focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                >
                  <option value="General Medicine">General Medicine</option>
                  <option value="Cardiology">Cardiology</option>
                  <option value="Dermatology">Dermatology</option>
                  <option value="Orthopedics">Orthopedics</option>
                  <option value="Pediatrics">Pediatrics</option>
                  <option value="Ophthalmology">Ophthalmology</option>
                  <option value="Psychiatry & Mental Health">Psychiatry & Mental Health</option>
                  <option value="ENT (Ear, Nose & Throat)">ENT (Ear, Nose & Throat)</option>
                </select>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Phone Number
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Phone className="h-4 w-4" />
                </div>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+1 (555) 000-0000"
                  className="block w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Department
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <BookOpen className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  placeholder={
                    role === 'doctor'
                      ? 'Campus Health Center'
                      : role === 'pharmacy'
                      ? 'Main Dispensary'
                      : 'Computer Science'
                  }
                  className="block w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Password *
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Lock className="h-4 w-4" />
              </div>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="At least 6 characters"
                className="block w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 py-2.5 px-4 text-sm font-semibold text-white shadow hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 transition"
          >
            {loading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <>
                <span>Complete Registration as {role === 'doctor' ? 'Doctor' : role === 'pharmacy' ? 'Pharmacy' : 'Student'}</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        <div className="text-center text-xs text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-500">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
};
