import React, { useEffect, useState } from 'react';
import {
  Radio,
  Eye,
  MousePointer2,
  RefreshCw,
  Pause,
  Play,
  Clock,
  ExternalLink,
  Layers,
  Copy,
  Check,
} from 'lucide-react';
import { fetchRecentEvents } from '../services/api';
import { formatDate, formatTimeRelative } from '../utils/formatters';
import ErrorAlert from '../components/ErrorAlert';

export default function LiveFeedPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLive, setIsLive] = useState(true);
  const [filterType, setFilterType] = useState('all'); // 'all' | 'click' | 'page_view'
  const [copiedId, setCopiedId] = useState(null);

  const loadData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setError(null);
      const res = await fetchRecentEvents(30);
      setEvents(res.events || []);
    } catch (err) {
      setError(err.message || 'Failed to stream live events');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Polling loop when isLive is active
  useEffect(() => {
    if (!isLive) return;
    const interval = setInterval(() => {
      loadData(true);
    }, 4000);
    return () => clearInterval(interval);
  }, [isLive]);

  const handleCopy = (id) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredEvents = events.filter((e) => {
    if (filterType === 'all') return true;
    return e.event_type === filterType;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Radio className="w-5 h-5" />
            </div>
            {isLive && (
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 absolute -top-1 -right-1 ring-2 ring-white animate-pulse" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900">Live Interaction Stream</h3>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  isLive
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {isLive ? 'Polling Active (4s)' : 'Paused'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Real-time telemetry buffer capturing page visits and clicks as they happen
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          {/* Filter pills */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1 rounded-lg font-semibold transition ${
                filterType === 'all'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({events.length})
            </button>
            <button
              onClick={() => setFilterType('click')}
              className={`px-3 py-1 rounded-lg font-semibold transition ${
                filterType === 'click'
                  ? 'bg-white text-amber-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Clicks
            </button>
            <button
              onClick={() => setFilterType('page_view')}
              className={`px-3 py-1 rounded-lg font-semibold transition ${
                filterType === 'page_view'
                  ? 'bg-white text-sky-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Views
            </button>
          </div>

          <button
            onClick={() => setIsLive(!isLive)}
            className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl transition text-xs font-semibold flex items-center gap-1.5"
            title={isLive ? 'Pause Stream' : 'Resume Stream'}
          >
            {isLive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isLive ? 'Pause' : 'Resume'}</span>
          </button>

          <button
            onClick={() => loadData(false)}
            className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl transition text-xs font-semibold"
            title="Force Refresh"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && <ErrorAlert message={error} onRetry={() => loadData(false)} />}

      {/* Events List */}
      <div className="space-y-3">
        {loading && events.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            Connecting to live event telemetry stream...
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs">
            No events match the selected filter.
          </div>
        ) : (
          filteredEvents.map((ev, idx) => {
            const isClick = ev.event_type === 'click';

            return (
              <div
                key={ev._id || idx}
                className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs hover:shadow-md transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                {/* Event Type & Info */}
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      isClick
                        ? 'bg-amber-50 text-amber-600 border border-amber-100'
                        : 'bg-sky-50 text-sky-600 border border-sky-100'
                    }`}
                  >
                    {isClick ? <MousePointer2 className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                          isClick ? 'bg-amber-100 text-amber-800' : 'bg-sky-100 text-sky-800'
                        }`}
                      >
                        {isClick ? 'Click Event' : 'Page Impression'}
                      </span>

                      <div className="flex items-center gap-1">
                        <span className="font-mono text-xs text-slate-600 truncate max-w-[180px] sm:max-w-xs">
                          {ev.session_id}
                        </span>
                        <button
                          onClick={() => handleCopy(ev.session_id)}
                          className="text-slate-400 hover:text-slate-700 p-0.5 rounded"
                          title="Copy Session ID"
                        >
                          {copiedId === ev.session_id ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </div>

                    <a
                      href={ev.page_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-mono text-slate-500 hover:text-indigo-600 truncate block mt-0.5"
                    >
                      {ev.page_url}
                    </a>
                  </div>
                </div>

                {/* Coordinates & Timestamp */}
                <div className="flex items-center gap-4 self-end sm:self-auto shrink-0 text-right">
                  {isClick && ev.coordinates && (
                    <div className="bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-1 font-mono text-xs">
                      <span className="text-slate-400 text-[10px] block">Coordinates</span>
                      <span className="font-bold text-amber-700">
                        x:{ev.coordinates.x}, y:{ev.coordinates.y}
                      </span>
                    </div>
                  )}

                  <div>
                    <div className="text-xs font-semibold text-slate-800">
                      {formatTimeRelative(ev.timestamp)}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {formatDate(ev.timestamp)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
