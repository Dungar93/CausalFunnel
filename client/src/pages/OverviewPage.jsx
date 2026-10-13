import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Layers,
  Eye,
  MousePointer2,
  Flame,
  ArrowUpRight,
  Code2,
  Copy,
  Check,
  TrendingUp,
  Activity,
  ShoppingBag,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import MetricCard from '../components/MetricCard';
import { CardSkeleton } from '../components/LoadingSkeleton';
import ErrorAlert from '../components/ErrorAlert';
import { fetchStatsSummary, fetchSessions } from '../services/api';
import { formatTimeRelative } from '../utils/formatters';

export default function OverviewPage() {
  const [stats, setStats] = useState(null);
  const [recentSessions, setRecentSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [snippetCopied, setSnippetCopied] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [statsData, sessionsData] = await Promise.all([
        fetchStatsSummary(),
        fetchSessions({ page: 1, limit: 5 }),
      ]);
      setStats(statsData.stats || null);
      setRecentSessions(sessionsData.sessions || []);
    } catch (err) {
      setError(err.message || 'Failed to load analytics overview');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const embedSnippet = `<!-- CausalFunnel Analytics Tracker -->
<script src="http://localhost:5000/tracker/tracker.js"></script>
<script>
  AnalyticsTracker.init({
    apiUrl: 'http://localhost:5000/api/events'
  });
</script>`;

  const handleCopySnippet = () => {
    navigator.clipboard.writeText(embedSnippet);
    setSnippetCopied(true);
    setTimeout(() => setSnippetCopied(false), 2000);
  };

  const pieData = stats
    ? [
        { name: 'Page Views', value: stats.total_page_views || 0, color: '#0ea5e9' },
        { name: 'Clicks', value: stats.total_clicks || 0, color: '#f59e0b' },
      ]
    : [];

  const barData = recentSessions.map((s, idx) => ({
    name: `Sess ${idx + 1}`,
    id: s.session_id,
    views: s.page_views,
    clicks: s.clicks,
    total: s.total_events,
  }));

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Metrics Row */}
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
              value={stats?.total_sessions ?? 0}
              subtitle="Unique user sessions tracked"
              icon={Users}
              color="indigo"
            />
            <MetricCard
              title="Total Events"
              value={stats?.total_events ?? 0}
              subtitle="All user interactions recorded"
              icon={Layers}
              color="emerald"
            />
            <MetricCard
              title="Page Views"
              value={stats?.total_page_views ?? 0}
              subtitle="Page visits and navigations"
              icon={Eye}
              color="sky"
            />
            <MetricCard
              title="Total Clicks"
              value={stats?.total_clicks ?? 0}
              subtitle="Document-relative click events"
              icon={MousePointer2}
              color="amber"
            />
          </>
        )}
      </div>

      {error && <ErrorAlert message={error} onRetry={loadData} />}

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Event Composition Donut */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Event Distribution</h3>
            <p className="text-xs text-slate-400 mt-0.5">Ratio of page views vs click interactions</p>
          </div>
          <div className="h-56 my-2">
            {stats && stats.total_events > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val, name) => [`${val} events`, name]}
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    iconSize={8}
                    wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No events recorded yet.
              </div>
            )}
          </div>
          <div className="pt-3 border-t border-slate-100 flex justify-between text-xs text-slate-500 font-mono">
            <span>Views: {stats?.total_page_views ?? 0}</span>
            <span>Clicks: {stats?.total_clicks ?? 0}</span>
          </div>
        </div>

        {/* Recent Session Activity Bar Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Recent Session Volume</h3>
              <p className="text-xs text-slate-400 mt-0.5">Event counts across latest user sessions</p>
            </div>
            <Link
              to="/sessions"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="h-56 my-2">
            {barData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="views" name="Page Views" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="clicks" name="Clicks" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No session data available.
              </div>
            )}
          </div>
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Latest 5 active sessions</span>
            <span className="font-mono text-indigo-600 font-medium">Sorted chronologically</span>
          </div>
        </div>
      </div>

      {/* Integration & Quick Launch Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Launch Card */}
        <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-2xl p-6 text-white flex flex-col justify-between shadow-md">
          <div className="space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
              <ShoppingBag className="w-3.5 h-3.5" /> Live Testing Environment
            </span>
            <h3 className="text-xl font-bold">Generate Live Analytics Events</h3>
            <p className="text-indigo-200 text-xs leading-relaxed max-w-md">
              Open the Aura Store e-commerce demo in a new browser window. Click products, navigate categories, and watch the sessions table and heatmap update in real-time.
            </p>
          </div>
          <div className="pt-6 flex flex-wrap gap-2.5">
            <a
              href="http://localhost:5000/tracker/demo.html"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-semibold px-3.5 py-2 rounded-xl shadow-md transition flex items-center gap-1.5"
            >
              <span>Launch Demo Page</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
            <Link
              to="/funnel"
              className="bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-3.5 py-2 rounded-xl border border-white/20 transition flex items-center gap-1.5"
            >
              <TrendingUp className="w-3.5 h-3.5 text-emerald-300" />
              <span>Conversion Funnel</span>
            </Link>
            <Link
              to="/heatmap"
              className="bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-3.5 py-2 rounded-xl border border-white/20 transition flex items-center gap-1.5"
            >
              <Flame className="w-3.5 h-3.5 text-amber-300" />
              <span>Heatmap</span>
            </Link>
          </div>
        </div>

        {/* Tracker Embed Code Snippet Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">Embed Tracking Script</h3>
              </div>
              <button
                onClick={handleCopySnippet}
                className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-indigo-600 px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 transition"
              >
                {snippetCopied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-600">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Add this snippet right before <code className="text-indigo-600 font-mono">&lt;/body&gt;</code> on any webpage to enable tracking.
            </p>
          </div>

          <div className="mt-4 bg-slate-900 rounded-xl p-3.5 text-slate-200 font-mono text-[11px] overflow-x-auto leading-relaxed border border-slate-800">
            <pre>{embedSnippet}</pre>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Maintains persistent session ID across page reloads</span>
            <span className="text-emerald-600 font-semibold">&lt; 3 KB bundle</span>
          </div>
        </div>
      </div>
    </div>
  );
}
