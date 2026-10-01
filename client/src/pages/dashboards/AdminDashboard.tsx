import React, { useState, useEffect, useTransition } from 'react';
import { useAuthStore } from '../../store/authStore';
import { adminApi } from '../../api/admin.api';
import type { SystemAnalytics, ManagedUser, AuditLogEntry } from '../../types/admin';
import {
  Users,
  Calendar,
  Pill,
  FileText,
  Shield,
  Search,
  Activity,
  UserCheck,
  UserX,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const [, startTransition] = useTransition();

  const [activeTab, setActiveTab] = useState<'analytics' | 'users' | 'audit'>('analytics');
  const [loading, setLoading] = useState<boolean>(true);
  const [analytics, setAnalytics] = useState<SystemAnalytics | null>(null);

  // Users Directory State
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [userRoleFilter, setUserRoleFilter] = useState<string>('all');
  const [userStatusFilter, setUserStatusFilter] = useState<string>('all');
  const [userSearch, setUserSearch] = useState<string>('');
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [auditActionFilter, setAuditActionFilter] = useState<string>('all');
  const [auditRoleFilter, setAuditRoleFilter] = useState<string>('all');

  // Error/Success alerts
  const [actionMessage, setActionMessage] = useState<{ text: string; isError?: boolean } | null>(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [analyticsData, usersData, logsData] = await Promise.all([
        adminApi.getAnalytics(),
        adminApi.getUsers({
          role: userRoleFilter === 'all' ? undefined : userRoleFilter,
          status: userStatusFilter === 'all' ? undefined : userStatusFilter,
          search: userSearch || undefined,
        }),
        adminApi.getAuditLogs({
          action: auditActionFilter === 'all' ? undefined : auditActionFilter,
          actorRole: auditRoleFilter === 'all' ? undefined : auditRoleFilter,
        }),
      ]);

      setAnalytics(analyticsData);
      setUsers(usersData.users);
      setAuditLogs(logsData.logs);
    } catch (err: unknown) {
      console.error('Failed to load admin dashboard data:', err);
      setActionMessage({ text: 'Failed to retrieve administrative data.', isError: true });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [userRoleFilter, userStatusFilter, auditActionFilter, auditRoleFilter]);

  // Live search debouncing / trigger
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        const usersData = await adminApi.getUsers({
          role: userRoleFilter === 'all' ? undefined : userRoleFilter,
          status: userStatusFilter === 'all' ? undefined : userStatusFilter,
          search: userSearch || undefined,
        });
        setUsers(usersData.users);
      } catch (err) {
        console.error('Search failed:', err);
      }
    });
  };

  // Toggle User Activation Status
  const handleToggleStatus = async (targetUser: ManagedUser) => {
    if (targetUser._id === user?.id) {
      setActionMessage({ text: 'You cannot deactivate your own administrative account.', isError: true });
      return;
    }

    const nextStatus = !targetUser.isActive;
    const confirmMsg = nextStatus
      ? `Activate account for ${targetUser.name}?`
      : `Suspend account for ${targetUser.name}? They will be blocked from logging in.`;

    if (!window.confirm(confirmMsg)) return;

    setUpdatingUserId(targetUser._id);
    try {
      const res = await adminApi.updateUserStatus(targetUser._id, nextStatus);
      setUsers((prev) =>
        prev.map((u) => (u._id === targetUser._id ? { ...u, isActive: res.user.isActive } : u))
      );
      setActionMessage({ text: res.message });
      // Refresh audit logs
      const logsData = await adminApi.getAuditLogs();
      setAuditLogs(logsData.logs);
    } catch (err: any) {
      setActionMessage({
        text: err.response?.data?.message || 'Failed to update user status.',
        isError: true,
      });
    } finally {
      setUpdatingUserId(null);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'doctor':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'pharmacy':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getActionBadge = (action: string) => {
    if (action.includes('REGISTER') || action.includes('CREATED') || action.includes('BOOKED')) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
    if (action.includes('CANCEL') || action.includes('SUSPEND') || action.includes('DELETE')) {
      return 'bg-rose-50 text-rose-700 border-rose-200';
    }
    if (action.includes('CLOSE') || action.includes('DISTRIBUTED')) {
      return 'bg-blue-50 text-blue-700 border-blue-200';
    }
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header Banner */}
      <div className="mb-6 rounded-2xl bg-gradient-to-r from-purple-800 via-indigo-900 to-slate-900 p-6 sm:p-8 text-white shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider">
                <Shield className="h-3.5 w-3.5" />
                Administrative Command Center
              </span>
              <span className="rounded-full bg-emerald-500/20 text-emerald-300 text-xs px-2.5 py-0.5 border border-emerald-500/30">
                System Active
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Clinic Governance & Intelligence</h1>
            <p className="mt-1 text-purple-200 text-sm">
              Administrator: <span className="font-semibold text-white">{user?.name}</span> | University ID:{' '}
              <span className="font-mono text-purple-300">{user?.universityId}</span>
            </p>
          </div>

          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="self-start sm:self-center flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 px-4 py-2.5 text-xs font-medium text-white transition border border-white/20 backdrop-blur-xs disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Data
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="mt-8 flex gap-2 border-b border-white/15 pb-px">
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-t-lg transition border-b-2 ${
              activeTab === 'analytics'
                ? 'bg-white/15 text-white border-white'
                : 'text-purple-200 hover:text-white border-transparent'
            }`}
          >
            <Activity className="h-4 w-4" />
            Overview & Analytics
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-t-lg transition border-b-2 ${
              activeTab === 'users'
                ? 'bg-white/15 text-white border-white'
                : 'text-purple-200 hover:text-white border-transparent'
            }`}
          >
            <Users className="h-4 w-4" />
            User Directory & Access
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-t-lg transition border-b-2 ${
              activeTab === 'audit'
                ? 'bg-white/15 text-white border-white'
                : 'text-purple-200 hover:text-white border-transparent'
            }`}
          >
            <Shield className="h-4 w-4" />
            Immutable Audit Trail
          </button>
        </div>
      </div>

      {/* Action Message Alert */}
      {actionMessage && (
        <div
          className={`mb-6 rounded-xl p-4 text-sm font-medium flex items-center justify-between border ${
            actionMessage.isError
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}
        >
          <span>{actionMessage.text}</span>
          <button
            onClick={() => setActionMessage(null)}
            className="text-xs underline hover:no-underline font-semibold ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* TAB 1: OVERVIEW & ANALYTICS */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* Key Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Registered Accounts
                </span>
                <div className="rounded-xl bg-purple-50 p-2.5 text-purple-600">
                  <Users className="h-5 w-5" />
                </div>
              </div>
              <p className="mt-3 text-3xl font-extrabold text-slate-900">
                {analytics?.users.totalUsers ?? 0}
              </p>
              <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                <span className="font-semibold text-purple-700">{analytics?.users.civilian ?? 0}</span> students,{' '}
                <span className="font-semibold text-emerald-700">{analytics?.users.doctor ?? 0}</span> doctors
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Appointments Booked
                </span>
                <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600">
                  <Calendar className="h-5 w-5" />
                </div>
              </div>
              <p className="mt-3 text-3xl font-extrabold text-slate-900">
                {analytics?.appointments.total ?? 0}
              </p>
              <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                <span className="font-semibold text-blue-700">{analytics?.appointments.confirmed ?? 0}</span> confirmed,{' '}
                <span className="font-semibold text-emerald-700">{analytics?.appointments.completed ?? 0}</span> completed
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Open Prescriptions
                </span>
                <div className="rounded-xl bg-amber-50 p-2.5 text-amber-600">
                  <Pill className="h-5 w-5" />
                </div>
              </div>
              <p className="mt-3 text-3xl font-extrabold text-amber-600">
                {analytics?.prescriptions.open ?? 0}
              </p>
              <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                <span className="font-semibold text-emerald-700">{analytics?.prescriptions.closed ?? 0}</span> dispensed & closed
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Clinical Documents
                </span>
                <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-600">
                  <FileText className="h-5 w-5" />
                </div>
              </div>
              <p className="mt-3 text-3xl font-extrabold text-slate-900">
                {analytics?.reports.total ?? 0}
              </p>
              <p className="mt-2 text-xs text-slate-500">Secure diagnostic files archived</p>
            </div>
          </div>

          {/* Aggregated Visual Breakdowns */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* User Breakdown */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
              <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Users className="h-4 w-4 text-purple-600" />
                User Population Distribution
              </h2>
              <div className="space-y-4">
                {[
                  { label: 'Students / Civilians', count: analytics?.users.civilian ?? 0, color: 'bg-blue-600' },
                  { label: 'Clinical Doctors', count: analytics?.users.doctor ?? 0, color: 'bg-emerald-600' },
                  { label: 'Pharmacy Staff', count: analytics?.users.pharmacy ?? 0, color: 'bg-amber-600' },
                  { label: 'System Administrators', count: analytics?.users.admin ?? 0, color: 'bg-purple-600' },
                ].map((item, idx) => {
                  const total = analytics?.users.totalUsers || 1;
                  const pct = Math.round((item.count / total) * 100);
                  return (
                    <div key={idx}>
                      <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                        <span>{item.label}</span>
                        <span>
                          {item.count} ({pct}%)
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div className={`h-full rounded-full ${item.color}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Top Prescribed Medications */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
              <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Pill className="h-4 w-4 text-amber-600" />
                Top Prescribed Medications
              </h2>
              {analytics?.prescriptions.topMedicines && analytics.prescriptions.topMedicines.length > 0 ? (
                <div className="space-y-3">
                  {analytics.prescriptions.topMedicines.map((m, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/70 p-3"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-xs font-bold text-amber-800">
                          #{idx + 1}
                        </span>
                        <span className="text-sm font-semibold text-slate-800">{m.medicine}</span>
                      </div>
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-700 border border-slate-200">
                        {m.count} prescription{m.count === 1 ? '' : 's'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-sm text-slate-400">
                  No medication dispensation data logged yet.
                </div>
              )}
            </div>
          </div>

          {/* Recent Live Activity Logs Preview */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Clock className="h-4 w-4 text-indigo-600" />
                Recent System Activity
              </h2>
              <button
                onClick={() => setActiveTab('audit')}
                className="text-xs font-semibold text-purple-700 hover:text-purple-800"
              >
                View Full Audit Trail →
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase">
                    <th className="py-2.5 pr-4">Timestamp</th>
                    <th className="py-2.5 px-4">Actor</th>
                    <th className="py-2.5 px-4">Action</th>
                    <th className="py-2.5 px-4">Target Entity</th>
                    <th className="py-2.5 pl-4">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {analytics?.recentActivity && analytics.recentActivity.length > 0 ? (
                    analytics.recentActivity.map((log) => (
                      <tr key={log._id} className="hover:bg-slate-50/50">
                        <td className="py-3 pr-4 text-slate-500 whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-slate-800">{log.actorName}</span>{' '}
                          <span
                            className={`ml-1 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase border ${getRoleBadge(
                              log.actorRole
                            )}`}
                          >
                            {log.actorRole}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`rounded-md px-2 py-0.5 font-mono text-[11px] font-semibold border ${getActionBadge(
                              log.action
                            )}`}
                          >
                            {log.action}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600 font-medium">{log.targetEntity}</td>
                        <td className="py-3 pl-4 text-slate-500 truncate max-w-xs font-mono text-[11px]">
                          {typeof log.details === 'object' ? JSON.stringify(log.details) : String(log.details || '-')}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-400">
                        No activity recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: USER DIRECTORY & ACCESS */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          {/* Filters & Search Header */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
              <form onSubmit={handleSearchSubmit} className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search user by name, University ID, or email..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2.5 text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-hidden"
                />
              </form>

              <div className="flex flex-wrap items-center gap-3">
                <select
                  value={userRoleFilter}
                  onChange={(e) => setUserRoleFilter(e.target.value)}
                  aria-label="Filter user directory by role"
                  className="rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs font-semibold text-slate-700 bg-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-hidden"
                >
                  <option value="all">All Roles</option>
                  <option value="civilian">Students (Civilians)</option>
                  <option value="doctor">Doctors</option>
                  <option value="pharmacy">Pharmacy Staff</option>
                  <option value="admin">Administrators</option>
                </select>

                <select
                  value={userStatusFilter}
                  onChange={(e) => setUserStatusFilter(e.target.value)}
                  aria-label="Filter user directory by account status"
                  className="rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs font-semibold text-slate-700 bg-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-hidden"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active Only</option>
                  <option value="suspended">Suspended Only</option>
                </select>
              </div>
            </div>
          </div>

          {/* Users Table */}
          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase text-slate-500">
                  <tr>
                    <th className="py-3.5 px-6">User</th>
                    <th className="py-3.5 px-4">University ID</th>
                    <th className="py-3.5 px-4">Role</th>
                    <th className="py-3.5 px-4">Department / Specs</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-6 text-right">Access Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.length > 0 ? (
                    users.map((u) => (
                      <tr key={u._id} className="hover:bg-slate-50/70 transition">
                        <td className="py-4 px-6">
                          <div className="font-semibold text-slate-900">{u.name}</div>
                          <div className="text-xs text-slate-500">{u.email}</div>
                        </td>
                        <td className="py-4 px-4 font-mono text-xs text-slate-700 font-medium">
                          {u.universityId}
                        </td>
                        <td className="py-4 px-4">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-xs font-bold uppercase border ${getRoleBadge(
                              u.role
                            )}`}
                          >
                            {u.role}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-xs text-slate-600">
                          {u.department || u.specialization || 'General'}
                        </td>
                        <td className="py-4 px-4">
                          {u.isActive ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="h-3 w-3" />
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-700 border border-rose-200">
                              <AlertTriangle className="h-3 w-3" />
                              Suspended
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-6 text-right">
                          <button
                            onClick={() => handleToggleStatus(u)}
                            disabled={updatingUserId === u._id || u._id === user?.id}
                            className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition border disabled:opacity-40 ${
                              u.isActive
                                ? 'border-rose-300 text-rose-700 hover:bg-rose-50'
                                : 'border-emerald-300 text-emerald-700 hover:bg-emerald-50'
                            }`}
                          >
                            {u.isActive ? (
                              <>
                                <UserX className="h-3.5 w-3.5" />
                                Suspend Account
                              </>
                            ) : (
                              <>
                                <UserCheck className="h-3.5 w-3.5" />
                                Reactivate
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-sm text-slate-400">
                        No users found matching current filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: IMMUTABLE AUDIT TRAIL */}
      {activeTab === 'audit' && (
        <div className="space-y-6">
          {/* Audit Filters */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <FileCheck className="h-5 w-5 text-purple-700" />
              <div>
                <h3 className="text-sm font-bold text-slate-800">Compliance & Regulatory Trail</h3>
                <p className="text-xs text-slate-500">Every sensitive clinical, auth, and dispensation event is permanently stored.</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <select
                value={auditRoleFilter}
                onChange={(e) => setAuditRoleFilter(e.target.value)}
                aria-label="Filter audit logs by actor role"
                className="rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white focus:border-purple-500 outline-hidden"
              >
                <option value="all">All Actor Roles</option>
                <option value="admin">Admin</option>
                <option value="doctor">Doctor</option>
                <option value="pharmacy">Pharmacy</option>
                <option value="civilian">Civilian / Student</option>
              </select>

              <select
                value={auditActionFilter}
                onChange={(e) => setAuditActionFilter(e.target.value)}
                aria-label="Filter audit logs by action category"
                className="rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white focus:border-purple-500 outline-hidden"
              >
                <option value="all">All Action Categories</option>
                <option value="USER_LOGIN">USER_LOGIN</option>
                <option value="USER_REGISTER">USER_REGISTER</option>
                <option value="USER_STATUS_UPDATE">USER_STATUS_UPDATE</option>
                <option value="APPOINTMENT_BOOKED">APPOINTMENT_BOOKED</option>
                <option value="APPOINTMENT_CANCELLED">APPOINTMENT_CANCELLED</option>
                <option value="PRESCRIPTION_CREATED">PRESCRIPTION_CREATED</option>
                <option value="PRESCRIPTION_ITEM_DISTRIBUTED">PRESCRIPTION_ITEM_DISTRIBUTED</option>
                <option value="PRESCRIPTION_CLOSED">PRESCRIPTION_CLOSED</option>
                <option value="REPORT_UPLOADED">REPORT_UPLOADED</option>
                <option value="REPORT_DOWNLOADED">REPORT_DOWNLOADED</option>
                <option value="MEDICAL_RECORD_ACCESSED">MEDICAL_RECORD_ACCESSED</option>
              </select>
            </div>
          </div>

          {/* Full Audit Logs Table */}
          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 font-semibold uppercase text-slate-500">
                  <tr>
                    <th className="py-3.5 px-6">Timestamp</th>
                    <th className="py-3.5 px-4">Actor</th>
                    <th className="py-3.5 px-4">Action</th>
                    <th className="py-3.5 px-4">Target Entity</th>
                    <th className="py-3.5 px-4">Event Details</th>
                    <th className="py-3.5 px-6 text-right">IP Address</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {auditLogs.length > 0 ? (
                    auditLogs.map((log) => (
                      <tr key={log._id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3.5 px-6 text-slate-500 whitespace-nowrap font-mono text-[11px]">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="font-semibold text-slate-800">{log.actorName}</span>{' '}
                          <span
                            className={`ml-1.5 rounded px-2 py-0.5 text-[10px] font-bold uppercase border ${getRoleBadge(
                              log.actorRole
                            )}`}
                          >
                            {log.actorRole}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span
                            className={`rounded-md px-2.5 py-1 font-mono text-[11px] font-bold border ${getActionBadge(
                              log.action
                            )}`}
                          >
                            {log.action}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-700 whitespace-nowrap">
                          {log.targetEntity}
                          {log.targetId && (
                            <span className="block font-mono text-[10px] text-slate-400 font-normal">
                              ID: {log.targetId}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600 max-w-sm break-all">
                          {typeof log.details === 'object'
                            ? JSON.stringify(log.details, null, 1)
                            : String(log.details || '-')}
                        </td>
                        <td className="py-3.5 px-6 text-right font-mono text-[11px] text-slate-400">
                          {log.ipAddress || '127.0.0.1'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-sm text-slate-400">
                        No audit records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
