import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../../api/auth.api';
import { useAuthStore, getRoleDashboardPath } from '../../store/authStore';
import { Activity, Lock, User, AlertCircle, ArrowRight, Stethoscope, Pill, GraduationCap, Shield } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { setUser } = useAuthStore();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !password) {
      setErrorMsg('Please enter both University ID/Email and password.');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg(null);
      const response = await authApi.login({ identifier, password });
      setUser(response.user);
      navigate(getRoleDashboardPath(response.user.role));
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoCredentials = (email: string) => {
    setIdentifier(email);
    setPassword('Password123!');
    setErrorMsg(null);
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-slate-50">
      <div className="w-full max-w-md space-y-6 rounded-2xl bg-white p-8 shadow-sm border border-slate-200">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 mb-3">
            <Activity className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Sign in to UniHealth</h1>
          <p className="mt-1 text-sm text-slate-500">
            Integrated University Health Center Portal
          </p>
        </div>

        {/* Quick Demo Role Logins */}
        <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-3.5 text-xs">
          <p className="font-semibold text-indigo-900 mb-2 flex items-center justify-between">
            <span>Quick Demo Logins:</span>
            <span className="text-[10px] font-normal text-indigo-600">Password: Password123!</span>
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => fillDemoCredentials('doctor@univ.edu')}
              className="flex items-center gap-1.5 p-2 rounded-lg bg-white border border-indigo-200 text-slate-800 hover:border-emerald-500 hover:bg-emerald-50/40 transition font-medium text-left"
            >
              <Stethoscope className="h-4 w-4 text-emerald-600 shrink-0" />
              <div>
                <div className="font-semibold text-slate-900">Doctor View</div>
                <div className="text-[10px] text-slate-500">doctor@univ.edu</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => fillDemoCredentials('pharmacy@univ.edu')}
              className="flex items-center gap-1.5 p-2 rounded-lg bg-white border border-indigo-200 text-slate-800 hover:border-amber-500 hover:bg-amber-50/40 transition font-medium text-left"
            >
              <Pill className="h-4 w-4 text-amber-600 shrink-0" />
              <div>
                <div className="font-semibold text-slate-900">Pharmacy View</div>
                <div className="text-[10px] text-slate-500">pharmacy@univ.edu</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => fillDemoCredentials('student@univ.edu')}
              className="flex items-center gap-1.5 p-2 rounded-lg bg-white border border-indigo-200 text-slate-800 hover:border-indigo-500 hover:bg-indigo-50/40 transition font-medium text-left"
            >
              <GraduationCap className="h-4 w-4 text-indigo-600 shrink-0" />
              <div>
                <div className="font-semibold text-slate-900">Student View</div>
                <div className="text-[10px] text-slate-500">student@univ.edu</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => fillDemoCredentials('admin@univ.edu')}
              className="flex items-center gap-1.5 p-2 rounded-lg bg-white border border-indigo-200 text-slate-800 hover:border-purple-500 hover:bg-purple-50/40 transition font-medium text-left"
            >
              <Shield className="h-4 w-4 text-purple-600 shrink-0" />
              <div>
                <div className="font-semibold text-slate-900">Admin View</div>
                <div className="text-[10px] text-slate-500">admin@univ.edu</div>
              </div>
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="flex items-center gap-2.5 rounded-lg border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-700">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              University ID or Email
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <User className="h-4 w-4" />
              </div>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="e.g. 24CSB1A27 or doctor@univ.edu"
                className="block w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Lock className="h-4 w-4" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
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
                <span>Sign In</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        <div className="text-center text-xs text-slate-500">
          Need an account?{' '}
          <Link to="/register" className="font-semibold text-indigo-600 hover:text-indigo-500">
            Create an account (Student, Doctor, or Pharmacy)
          </Link>
        </div>
      </div>
    </div>
  );
};
