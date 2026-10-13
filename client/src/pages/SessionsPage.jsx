import React, { useEffect, useState } from 'react';
import {
  Users,
  Layers,
  Eye,
  MousePointer2,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Copy,
  Check,
  Calendar,
} from 'lucide-react';
import MetricCard from '../components/MetricCard';
import { CardSkeleton, TableSkeleton } from '../components/LoadingSkeleton';
import ErrorAlert from '../components/ErrorAlert';
import EmptyState from '../components/EmptyState';
import UserJourneyDrawer from '../components/UserJourneyDrawer';
import { fetchSessions, fetchStatsSummary } from '../services/api';
import { formatDate, formatTimeRelative, formatDuration } from '../utils/formatters';

export default function SessionsPage() {
  const [sessions, setSessions] = useState([]);
  const [stats, setStats] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSession, setSelectedSession] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const loadData = async (page = 1, search = searchTerm) => {
    try {
      setLoading(true);
      setError(null);

      const [sessionsData, statsData] = await Promise.all([
        fetchSessions({ page, limit: 10, search }),
        fetchStatsSummary(),
      ]);

      setSessions(sessionsData.sessions || []);
      setPagination(sessionsData.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 });
      setStats(statsData.stats || null);
    } catch (err) {
      setError(err.message || 'Failed to load sessions data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(1, searchTerm);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadData(1, searchTerm);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      loadData(newPage, searchTerm);
    }
  };

  const handleCopySession = (e, id) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading && !stats ? (
          <>
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </>
        ) : (
          <>
            <MetricCard
              title="Total Sessions"
              value={stats?.total_sessions ?? pagination.total}
              subtitle="Distinct tracked visitor sessions"
              icon={Users}
              color="indigo"
            />
            <MetricCard
              title="Total Events"
              value={stats?.total_events ?? 0}
              subtitle="Page views and user clicks"
              icon={Layers}
              color="emerald"
            />
            <MetricCard
              title="Page Views"
              value={stats?.total_page_views ?? 0}
              subtitle="Total tracked page impressions"
              icon={Eye}
              color="sky"
            />
            <MetricCard
              title="Total Clicks"
              value={stats?.total_clicks ?? 0}
              subtitle="User coordinate interactions"
              icon={MousePointer2}
              color="amber"
            />
          </>
        )}
      </div>

      {/* Error Alert */}
      {error && <ErrorAlert message={error} onRetry={() => loadData(pagination.page, searchTerm)} />}

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {/* Table Toolbar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
            <input
              type="text"
              placeholder="Search by session ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl pl-9 pr-4 py-2 text-xs outline-none transition"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
          </form>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={() => loadData(pagination.page, searchTerm)}
              className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl transition text-xs font-semibold flex items-center gap-1.5"
              title="Refresh table"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Sessions Table */}
        {loading ? (
          <TableSkeleton rows={6} cols={6} />
        ) : sessions.length === 0 ? (
          <div className="p-8">
            <EmptyState
              title="No Sessions Recorded Yet"
              description="Interact with the demo e-commerce store to record user events, or start the tracking script."
              actionLabel="Open Demo Store"
              onAction={() => window.open('http://localhost:5000/tracker/demo.html', '_blank')}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-100 text-slate-500 uppercase tracking-wider text-[10px] font-bold">
                  <th className="py-3.5 px-5">Session ID</th>
                  <th className="py-3.5 px-4 text-center">Total Events</th>
                  <th className="py-3.5 px-4">Views / Clicks</th>
                  <th className="py-3.5 px-4">Duration</th>
                  <th className="py-3.5 px-4">Last Activity</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {sessions.map((sess) => (
                  <tr
                    key={sess.session_id}
                    onClick={() => setSelectedSession(sess)}
                    className="hover:bg-indigo-50/40 transition-colors cursor-pointer group"
                  >
                    {/* Session ID */}
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold text-slate-900 group-hover:text-indigo-600 transition">
                          {sess.session_id}
                        </span>
                        <button
                          onClick={(e) => handleCopySession(e, sess.session_id)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-slate-700 rounded transition"
                          title="Copy ID"
                        >
                          {copiedId === sess.session_id ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </td>

                    {/* Total Events Badge */}
                    <td className="py-4 px-4 text-center">
                      <span className="inline-flex items-center justify-center font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        {sess.total_events}
                      </span>
                    </td>

                    {/* Page Views & Clicks Breakdown */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md">
                          <Eye className="w-3 h-3" /> {sess.page_views}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
                          <MousePointer2 className="w-3 h-3" /> {sess.clicks}
                        </span>
                      </div>
                    </td>

                    {/* Duration */}
                    <td className="py-4 px-4 font-mono text-slate-500">
                      {formatDuration(sess.first_activity, sess.last_activity)}
                    </td>

                    {/* Last Activity */}
                    <td className="py-4 px-4">
                      <div className="font-medium text-slate-800">
                        {formatTimeRelative(sess.last_activity)}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {formatDate(sess.last_activity)}
                      </div>
                    </td>

                    {/* Action */}
                    <td className="py-4 px-5 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedSession(sess);
                        }}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 group-hover:text-indigo-800 transition"
                      >
                        <span>View Journey</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {sessions.length > 0 && (
          <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <span className="text-slate-500">
              Showing <span className="font-bold text-slate-800">{(pagination.page - 1) * pagination.limit + 1}</span> to{' '}
              <span className="font-bold text-slate-800">
                {Math.min(pagination.page * pagination.limit, pagination.total)}
              </span>{' '}
              of <span className="font-bold text-slate-800">{pagination.total}</span> sessions
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={!pagination.hasPrev}
                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </button>

              <span className="px-3 py-1 rounded-xl bg-indigo-50 text-indigo-700 font-bold font-mono">
                {pagination.page} / {pagination.totalPages}
              </span>

              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={!pagination.hasNext}
                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* User Journey Slide-over Drawer */}
      <UserJourneyDrawer
        session={selectedSession}
        onClose={() => setSelectedSession(null)}
      />
    </div>
  );
}
