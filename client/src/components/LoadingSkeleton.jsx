import React from 'react';

export function CardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 animate-pulse">
      <div className="flex justify-between items-center">
        <div className="h-3 w-24 bg-slate-200 rounded"></div>
        <div className="h-8 w-8 bg-slate-200 rounded-xl"></div>
      </div>
      <div className="h-7 w-20 bg-slate-200 rounded mt-3"></div>
      <div className="h-3 w-32 bg-slate-100 rounded mt-2"></div>
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 6 }) {
  return (
    <div className="w-full animate-pulse divide-y divide-slate-100">
      <div className="bg-slate-50/50 py-3 px-4 flex gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="h-3 bg-slate-200 rounded flex-1"></div>
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="py-4 px-4 flex gap-4 items-center">
          {Array.from({ length: cols }).map((_, c) => (
            <div key={c} className="h-4 bg-slate-100 rounded flex-1"></div>
          ))}
        </div>
      ))}
    </div>
  );
}
