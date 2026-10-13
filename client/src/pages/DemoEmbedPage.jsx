import React, { useState } from 'react';
import { ExternalLink, RefreshCw, ShoppingBag, Info, CheckCircle2 } from 'lucide-react';

export default function DemoEmbedPage() {
  const [iframeKey, setIframeKey] = useState(0);
  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  const backendBase = apiBase.replace(/\/api\/?$/, '');
  const demoUrl = `${backendBase}/tracker/demo.html`;

  const reloadIframe = () => {
    setIframeKey((prev) => prev + 1);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header card with instructions */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-lg bg-indigo-50 text-indigo-600">
              <ShoppingBag className="w-4 h-4" />
            </span>
            <h3 className="text-sm font-bold text-slate-900">
              Interactive Aura Store (Live Analytics Playground)
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Every click, page navigation, and product interaction below sends tracking telemetry directly to MongoDB.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={reloadIframe}
            className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl transition text-xs font-semibold flex items-center gap-1.5"
            title="Reload Demo Store"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reload Frame</span>
          </button>

          <a
            href={demoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition text-xs font-semibold flex items-center gap-1.5 shadow-xs"
          >
            <span>Open in Full Tab</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Embedded Iframe Container */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
        <div className="px-4 py-2.5 bg-slate-100 border-b border-slate-200 flex items-center gap-2 text-xs text-slate-600 font-mono">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-400"></span>
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
          <span className="ml-2 text-slate-400">Target:</span>
          <span className="text-slate-700">{demoUrl}</span>
        </div>

        <iframe
          key={iframeKey}
          src={demoUrl}
          title="Aura Store Live Tracker Demo"
          className="w-full h-[750px] border-none bg-slate-50"
        />
      </div>
    </div>
  );
}
