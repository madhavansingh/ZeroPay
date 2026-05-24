import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  TrendingUp,
  Package,
  Activity,
  AlertCircle,
  ArrowLeft,
  Loader2,
  Brain,
  Sparkles,
  RefreshCw,
  Award,
  ChevronRight,
  TrendingDown,
  ArrowUpRight,
} from 'lucide-react';
import { getAnalyticsSummary, getAnalyticsRevenue, getAnalyticsInsights } from '../../services/api';

export default function AnalyticsDashboardPage() {
  const navigate = useNavigate();
  const [windowDays, setWindowDays] = useState(30);

  const { data: summaryData, isLoading: isSummaryLoading, refetch: refetchSummary } = useQuery({
    queryKey: ['analytics-summary', windowDays],
    queryFn: () => getAnalyticsSummary({ windowDays }),
  });

  const { data: revenueData, isLoading: isRevenueLoading, refetch: refetchRevenue } = useQuery({
    queryKey: ['analytics-revenue', windowDays],
    queryFn: () => getAnalyticsRevenue({ windowDays }),
  });

  const { data: insightsData, isLoading: isInsightsLoading, refetch: refetchInsights } = useQuery({
    queryKey: ['analytics-insights', windowDays],
    queryFn: () => getAnalyticsInsights({ windowDays }),
  });

  const handleRefreshAll = () => {
    refetchSummary();
    refetchRevenue();
    refetchInsights();
  };

  // Extract variables
  const stats: any = summaryData?.data || {};
  const revenueTimeline: any = (revenueData?.data as any)?.timeline || {};
  const insights: any = insightsData?.data || {};

  const timelineEntries = Object.entries(revenueTimeline).map(([date, val]: any) => ({
    date,
    ...val,
  }));

  const maxLovelace = Math.max(...timelineEntries.map((e) => e.lovelace), 1);

  const formatAda = (lov: number) => (lov ? (lov / 1_000_000).toFixed(1) : '0.0');
  const formatInr = (paise: number) => (paise ? (paise / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 }) : '0');

  const shortDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  const isDataLoading = isSummaryLoading || isRevenueLoading;

  return (
    <div className="min-h-screen bg-surface pb-28 text-text-primary">
      {/* Header */}
      <div className="px-5 pt-14 pb-5 flex items-center justify-between border-b border-surface-border">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/merchant/dashboard')} className="btn-ghost p-1">
            <ArrowLeft size={22} />
          </button>
          <div>
            <h1 className="text-xl font-bold">Commerce Insights</h1>
            <p className="text-xs text-text-secondary">AI-powered analytics and pricing metrics</p>
          </div>
        </div>
        <button onClick={handleRefreshAll} className="p-2 btn-ghost rounded-xl">
          <RefreshCw size={18} className="text-teal-400" />
        </button>
      </div>

      {/* Main Window Selectors */}
      <div className="px-5 mt-6 flex justify-center max-w-xl mx-auto">
        <div className="bg-surface-card p-1 rounded-2xl border border-surface-border flex w-full">
          {([7, 30, 90] as const).map((days) => (
            <button
              key={days}
              onClick={() => setWindowDays(days)}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-colors ${
                windowDays === days
                  ? 'bg-teal-600 text-white'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {days} Days
            </button>
          ))}
        </div>
      </div>

      {isDataLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 size={32} className="text-teal-500 animate-spin" />
        </div>
      ) : (
        <div className="px-5 mt-6 space-y-6 max-w-xl mx-auto">
          {/* KPI Dashboard */}
          <div className="grid grid-cols-2 gap-3">
            <div className="card space-y-2">
              <span className="text-text-secondary text-[10px] font-semibold uppercase tracking-wider block">
                Escrow Volume
              </span>
              <p className="font-mono text-lg font-bold text-text-primary">
                {formatAda(stats.totalVolumeLovelace)} ADA
              </p>
              <p className="text-text-secondary text-xs">₹{formatInr(stats.totalVolumePaise)}</p>
            </div>
            <div className="card space-y-2">
              <span className="text-text-secondary text-[10px] font-semibold uppercase tracking-wider block">
                Total Orders
              </span>
              <p className="text-xl font-bold text-text-primary">{stats.totalOrders || 0}</p>
              <p className="text-text-secondary text-xs">{stats.settledOrders || 0} completed</p>
            </div>
            <div className="card space-y-2">
              <span className="text-text-secondary text-[10px] font-semibold uppercase tracking-wider block">
                Milestone Success
              </span>
              <p className="text-xl font-bold text-status-confirmed">{stats.escrowCompletionRate || 0}%</p>
              <p className="text-text-secondary text-xs">escrow closure rate</p>
            </div>
            <div className="card space-y-2">
              <span className="text-text-secondary text-[10px] font-semibold uppercase tracking-wider block">
                Dispute Ratio
              </span>
              <p className={`text-xl font-bold ${stats.disputeRate > 5 ? 'text-status-failed' : 'text-text-primary'}`}>
                {stats.disputeRate || 0}%
              </p>
              <p className="text-text-secondary text-xs">{stats.disputeCount || 0} raised</p>
            </div>
          </div>

          {/* Revenue Chart */}
          <div className="card space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-teal-400">
              Settled Volume Timeline
            </h3>
            {timelineEntries.length === 0 ? (
              <p className="text-xs text-text-muted text-center py-6">No transaction activity inside this window</p>
            ) : (
              <div className="flex items-end gap-1 h-32 pt-6">
                {timelineEntries.map((e, idx) => {
                  const heightPct = (e.lovelace / maxLovelace) * 100;
                  const hasData = e.lovelace > 0;
                  return (
                    <div key={e.date} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                      <div
                        className="w-full flex items-end justify-center overflow-hidden rounded-t-sm"
                        style={{ height: '80px' }}
                      >
                        <div
                          className={`w-full rounded-t-sm ${
                            hasData
                              ? 'bg-gradient-to-t from-teal-700 to-teal-400 animate-grow-up'
                              : 'bg-surface-elevated'
                          }`}
                          style={{
                            height: hasData ? `${Math.max(heightPct, 6)}%` : '4px',
                            animationDelay: hasData ? `${idx * 15}ms` : '0ms',
                            animationFillMode: 'both',
                          }}
                          title={`${formatAda(e.lovelace)} ADA · ${e.count} orders`}
                        />
                      </div>
                      <span className="text-[7px] text-text-muted rotate-45 origin-left whitespace-nowrap ml-1">
                        {shortDate(e.date)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
            <div className="pt-4 border-t border-surface-border flex justify-between items-center text-xs text-text-secondary">
              <span>Avg Order Value</span>
              <span className="font-mono font-bold text-text-primary">
                {formatAda(stats.averageOrderSizeLovelace)} ADA (₹{formatInr(stats.averageOrderSizePaise)})
              </span>
            </div>
          </div>

          {/* AI Insights Card */}
          <div className="card bg-gradient-to-br from-surface-card to-indigo-950/20 border-indigo-500/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl" />
            <div className="flex items-center gap-2 mb-4">
              <Brain size={18} className="text-indigo-400" />
              <h3 className="text-sm font-bold text-indigo-300">AI Trust & Intelligence Insights</h3>
            </div>

            {isInsightsLoading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 size={24} className="text-indigo-400 animate-spin" />
              </div>
            ) : insights.revenueTrendNarrative ? (
              <div className="space-y-4 text-xs">
                <div className="space-y-1">
                  <span className="text-text-secondary font-semibold">Volume Trend Analysis</span>
                  <p className="text-text-primary leading-relaxed">{insights.revenueTrendNarrative}</p>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="space-y-1 bg-surface-elevated/40 border border-surface-border p-3 rounded-xl">
                    <span className="text-indigo-300 font-semibold block">Peak Storefront Hours</span>
                    <p className="text-text-primary font-medium">{insights.peakHours}</p>
                  </div>
                  <div className="space-y-1 bg-surface-elevated/40 border border-surface-border p-3 rounded-xl">
                    <span className="text-indigo-300 font-semibold block">Loyalty Signals</span>
                    <p className="text-text-primary font-medium">{insights.retentionSignals}</p>
                  </div>
                </div>

                {insights.pricingSuggestions && insights.pricingSuggestions.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <span className="text-text-secondary font-semibold">Psychological Pricing Suggestions</span>
                    <ul className="space-y-2">
                      {insights.pricingSuggestions.map((s: string, i: number) => (
                        <li key={i} className="flex gap-2 items-start bg-indigo-500/5 p-2.5 rounded-xl border border-indigo-500/10">
                          <Sparkles size={14} className="text-indigo-400 flex-shrink-0 mt-0.5" />
                          <span className="text-text-primary">{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6 space-y-2">
                <p className="text-xs text-text-secondary">Could not fetch business intelligence</p>
                <button
                  onClick={() => refetchInsights()}
                  className="btn-secondary text-xs py-1.5 px-4"
                >
                  Generate Insights
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
