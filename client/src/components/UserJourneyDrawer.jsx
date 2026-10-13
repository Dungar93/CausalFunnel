import React, { useEffect, useState } from 'react';
import {
  X,
  Eye,
  MousePointer2,
  Copy,
  Check,
  Clock,
  Layers,
  ArrowRight,
  Maximize2,
  ExternalLink,
} from 'lucide-react';
import { fetchSessionEvents } from '../services/api';
import { formatDate, formatDuration, cleanUrl } from '../utils/formatters';

export default function UserJourneyDrawer({ session, onClose }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!session?.session_id) return;

    let isMounted = true;
    setLoading(true);
    setError(null);

    fetchSessionEvents(session.session_id)
      .then((data) => {
        if (isMounted) {
          setEvents(data.events || []);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || 'Failed to load session events');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [session?.session_id]);

  const handleCopy = () => {
    if (!session?.session_id) return;
    navigator.clipboard.writeText(session.session_id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!session) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-lg bg-white shadow-2xl flex flex-col border-l border-slate-200">
          
          {/* Header */}
          <div className="p-6 border-b border-slate-100 flex items-start justify-between bg-slate-50/50">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
                  User Journey
                </span>
                <span className="text-xs text-slate-400">
                  {events.length} step{events.length === 1 ? '' : 's'}
                </span>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <h3 className="font-mono text-sm font-bold text-slate-900 truncate max-w-xs">
                  {session.session_id}
                </h3>
                <button
                  onClick={handleCopy}
                  className="p-1 text-slate-400 hover:text-slate-700 rounded transition"
                  title="Copy Session ID"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 rounded-xl transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Session Overview Stats */}
          <div className="grid grid-cols-3 divide-x divide-slate-100 border-b border-slate-100 bg-white text-center py-3">
            <div>
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">Total Events</span>
              <span className="text-sm font-bold text-slate-800">{session.total_events}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">Views / Clicks</span>
              <span className="text-sm font-bold text-slate-800">
                <span className="text-sky-600">{session.page_views}</span> / <span className="text-amber-600">{session.clicks}</span>
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">Duration</span>
              <span className="text-sm font-bold text-slate-800">
                {formatDuration(session.first_activity, session.last_activity)}
              </span>
            </div>
          </div>

          {/* Timeline Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {loading ? (
              <div className="space-y-6 animate-pulse">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-slate-200 shrink-0"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-slate-200 rounded w-1/3"></div>
                      <div className="h-3 bg-slate-100 rounded w-full"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="p-4 rounded-xl bg-rose-50 text-rose-700 text-xs border border-rose-200">
                {error}
              </div>
            ) : events.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                No events recorded for this session.
              </div>
            ) : (
              <div className="relative pl-6 space-y-8 before:absolute before:left-3.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
                {events.map((ev, index) => {
                  const isClick = ev.event_type === 'click';
                  const prevEvent = index > 0 ? events[index - 1] : null;
                  let deltaMs = 0;
                  if (prevEvent && ev.timestamp && prevEvent.timestamp) {
                    deltaMs = new Date(ev.timestamp) - new Date(prevEvent.timestamp);
                  }

                  return (
                    <div key={ev._id || index} className="relative group">
                      {/* Timeline Node Icon */}
                      <div
                        className={`absolute -left-6 top-1 w-7 h-7 rounded-full flex items-center justify-center text-white ring-4 ring-white shadow-xs ${
                          isClick ? 'bg-amber-500' : 'bg-sky-500'
                        }`}
                      >
                        {isClick ? (
                          <MousePointer2 className="w-3.5 h-3.5" />
                        ) : (
                          <Eye className="w-3.5 h-3.5" />
                        )}
                      </div>

                      {/* Event Card */}
                      <div className="bg-slate-50/70 hover:bg-slate-50 border border-slate-200/80 rounded-2xl p-4 transition">
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                              isClick
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-sky-100 text-sky-800'
                            }`}
                          >
                            {isClick ? 'Click Event' : 'Page View'}
                          </span>

                          <span className="text-[11px] text-slate-400 font-mono">
                            {formatDate(ev.timestamp)}
                          </span>
                        </div>

                        {/* Relative Delta */}
                        {index > 0 && deltaMs >= 0 && (
                          <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1 font-mono">
                            <Clock className="w-3 h-3" />
                            <span>+{Math.max(0, (deltaMs / 1000).toFixed(1))}s from previous action</span>
                          </div>
                        )}

                        {/* Page URL */}
                        <div className="mt-3">
                          <span className="text-[10px] uppercase font-semibold text-slate-400 block">Page URL</span>
                          <a
                            href={ev.page_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-mono text-indigo-600 hover:text-indigo-800 hover:underline break-all inline-flex items-center gap-1 mt-0.5"
                          >
                            <span>{ev.page_url}</span>
                            <ExternalLink className="w-3 h-3 shrink-0" />
                          </a>
                        </div>

                        {/* Coordinates if Click */}
                        {isClick && ev.coordinates && (
                          <div className="mt-3 pt-3 border-t border-slate-200/60 grid grid-cols-2 gap-2 text-xs">
                            <div className="bg-white rounded-lg p-2 border border-slate-200/50">
                              <span className="text-[10px] uppercase font-semibold text-slate-400 block">X Coordinate</span>
                              <span className="font-mono font-bold text-amber-700">{ev.coordinates.x} px</span>
                            </div>
                            <div className="bg-white rounded-lg p-2 border border-slate-200/50">
                              <span className="text-[10px] uppercase font-semibold text-slate-400 block">Y Coordinate</span>
                              <span className="font-mono font-bold text-amber-700">{ev.coordinates.y} px</span>
                            </div>
                          </div>
                        )}

                        {/* Viewport size */}
                        {ev.viewport && (ev.viewport.width || ev.viewport.height) && (
                          <div className="mt-2 text-[10px] text-slate-400 flex items-center gap-1">
                            <Maximize2 className="w-3 h-3" />
                            <span>Viewport: {ev.viewport.width} &times; {ev.viewport.height}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-xl text-xs transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
