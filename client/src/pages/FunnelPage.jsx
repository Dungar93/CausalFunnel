import React, { useEffect, useState } from 'react';
import {
  TrendingUp,
  Users,
  ShoppingBag,
  ShoppingCart,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ArrowRight,
  ArrowDown,
  Sparkles,
  Zap,
} from 'lucide-react';
import MetricCard from '../components/MetricCard';
import { CardSkeleton } from '../components/LoadingSkeleton';
import ErrorAlert from '../components/ErrorAlert';
import { fetchFunnelMetrics } from '../services/api';

export default function FunnelPage() {
  const [funnel, setFunnel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchFunnelMetrics();
      setFunnel(data);
    } catch (err) {
      setError(err.message || 'Failed to calculate conversion funnel');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const stageIcons = [Users, ShoppingBag, ShoppingCart, CheckCircle2];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
            <Zap className="w-3.5 h-3.5 text-amber-300" />
            <span>CausalFunnel Intelligence Engine</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            E-Commerce Conversion Funnel
          </h2>
          <p className="text-xs sm:text-sm text-indigo-200 max-w-2xl leading-relaxed">
            Identifies where prospective shoppers drop off throughout their journey from storefront landing to cart inspection.
          </p>
        </div>

        <button
          onClick={loadData}
          className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-semibold transition flex items-center gap-2 shrink-0 backdrop-blur"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Recalculate Funnel</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading && !funnel ? (
          <>
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </>
        ) : (
          <>
            <MetricCard
              title="Overall Conversion"
              value={`${funnel?.overallConversionRate ?? 0}%`}
              subtitle="Visitors who reach cart/checkout"
              icon={TrendingUp}
              color="emerald"
            />
            <MetricCard
              title="Total Sessions"
              value={funnel?.totalSessions ?? 0}
              subtitle="All tracked shopping journeys"
              icon={Users}
              color="indigo"
            />
            <MetricCard
              title="Cart Adders"
              value={funnel?.stages?.[2]?.count ?? 0}
              subtitle="Users adding products to cart"
              icon={ShoppingCart}
              color="amber"
            />
            <MetricCard
              title="Checkouts Reviewed"
              value={funnel?.stages?.[3]?.count ?? 0}
              subtitle="Users opening cart drawer"
              icon={CheckCircle2}
              color="sky"
            />
          </>
        )}
      </div>

      {error && <ErrorAlert message={error} onRetry={loadData} />}

      {/* Visual Funnel Step Stages */}
      {funnel?.stages && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Stage-by-Stage Drop-off Pipeline</h3>
              <p className="text-xs text-slate-400 mt-0.5">Calculated in real-time from recorded mouse interactions and page events</p>
            </div>
            <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
              {funnel.totalSessions} Total Sessions
            </span>
          </div>

          <div className="space-y-4">
            {funnel.stages.map((stage, idx) => {
              const Icon = stageIcons[idx] || Users;
              const prevStage = idx > 0 ? funnel.stages[idx - 1] : null;
              const pctOfFirst = funnel.stages[0]?.count > 0
                ? Math.round((stage.count / funnel.stages[0].count) * 100)
                : 0;

              return (
                <div key={stage.id} className="space-y-2">
                  <div className="bg-slate-50 border border-slate-200/70 rounded-2xl p-4 sm:p-5 hover:bg-slate-50/80 transition group">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      {/* Step Header */}
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-xs">
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-slate-900">{stage.name}</h4>
                            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700">
                              {stage.count} sessions
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">{stage.description}</p>
                        </div>
                      </div>

                      {/* Percentages */}
                      <div className="flex items-center gap-4 text-right">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Ratio</span>
                          <span className="text-base font-extrabold text-slate-900 font-mono">
                            {pctOfFirst}%
                          </span>
                        </div>

                        {idx > 0 && (
                          <div className="border-l border-slate-200 pl-4">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">Stage Drop-off</span>
                            <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                              -{stage.dropoffRate}%
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Progress Bar Representation */}
                    <div className="mt-4 w-full bg-slate-200/70 h-3 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(5, pctOfFirst)}%` }}
                      />
                    </div>
                  </div>

                  {/* Connector indicator */}
                  {idx < funnel.stages.length - 1 && (
                    <div className="flex justify-center -my-1 text-slate-300">
                      <ArrowDown className="w-4 h-4 animate-bounce" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Causal Insights & Recommendations Box */}
          <div className="mt-8 rounded-2xl bg-amber-50/60 border border-amber-200/80 p-5 space-y-3">
            <div className="flex items-center gap-2 text-amber-900 font-bold text-xs uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>Causal Behavior Diagnostics</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-700">
              <div className="bg-white p-3.5 rounded-xl border border-amber-100 shadow-2xs space-y-1">
                <span className="font-bold text-slate-900 block">Catalog Engagement</span>
                <p className="text-slate-600">
                  Visitors interact enthusiastically with Hero CTAs and Category filter pills, demonstrating strong initial interest in the Aura audio collection.
                </p>
              </div>
              <div className="bg-white p-3.5 rounded-xl border border-amber-100 shadow-2xs space-y-1">
                <span className="font-bold text-slate-900 block">Cart-to-Checkout Drop-off</span>
                <p className="text-slate-600">
                  {funnel.stages[3]?.dropoffRate > 0
                    ? `${funnel.stages[3].dropoffRate}% of users who add to cart do not proceed to click the cart drawer. A persistent slide-over mini-cart could capture this friction point.`
                    : 'Shoppers who add items to their cart show strong follow-through to inspecting the cart drawer.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
