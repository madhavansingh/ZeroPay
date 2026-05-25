import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  Plus, 
  TrendingUp, 
  Package, 
  Clock, 
  CheckCircle, 
  QrCode, 
  Shield, 
  Sparkles, 
  Radio, 
  Activity, 
  Copy, 
  Check, 
  AlertTriangle,
  ChevronRight
} from 'lucide-react';
import { getMerchantDashboard, getMerchantInvoices } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import InvoiceSheet from '../../components/organisms/InvoiceSheet';
import RevenueChart from '../../components/organisms/RevenueChart';
import StatusBadge from '../../components/atoms/StatusBadge';
import type { InvoiceStatus } from '@zeropay/shared-types';


function lovelaceToAda(lovelace: number) {
  return (lovelace / 1_000_000).toFixed(2);
}

function paiseToinr(paise: number) {
  return (paise / 100).toFixed(2);
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function DashboardPage() {
  const [showInvoiceSheet, setShowInvoiceSheet] = useState(false);
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['merchant-dashboard'],
    queryFn: () => getMerchantDashboard(),
    refetchInterval: 30_000,
  });

  const { data: invoicesData } = useQuery({
    queryKey: ['merchant-invoices'],
    queryFn: () => getMerchantInvoices({ limit: 20 }),
    refetchInterval: 15_000,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const merchantData = (dashboardData?.data as any);
  const merchant = merchantData?.merchant as {
    shopName: string;
    merchantId: string;
    totalReceivedLovelace: number;
    totalOrders: number;
  } | undefined;

  const revenueByDay = (merchantData?.revenueByDay ?? {}) as Record<
    string,
    { lovelace: number; paise: number; count: number }
  >;

  const recentInvoices: Array<{
    invoiceId: string;
    amountPaise: number;
    status: InvoiceStatus;
    createdAt: string;
    escrowState?: string;
    isDisputed?: boolean;
  }> = ((invoicesData?.data as any)?.items ?? []);

  const stats = merchantData?.stats ?? {};
  const settledCount = (stats.settled ?? 0) as number;
  const pendingCount = ((stats.pending ?? 0) + (stats.confirming ?? 0)) as number;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface pb-28 animate-pulse">
        {/* Header Skeleton */}
        <div className="px-5 pt-14 pb-5 flex justify-between items-center">
          <div>
            <div className="h-4 w-28 bg-surface-card rounded-lg mb-2" />
            <div className="h-8 w-48 bg-surface-card rounded-xl" />
          </div>
          <div className="h-10 w-10 bg-surface-card rounded-xl" />
        </div>

        {/* Stats Grid Skeleton */}
        <div className="px-5 grid grid-cols-2 gap-3 mb-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 bg-surface-elevated rounded-full" />
                <div className="h-3 w-16 bg-surface-elevated rounded-lg" />
              </div>
              <div className="h-6 w-24 bg-surface-elevated rounded-lg" />
              <div className="h-3 w-8 bg-surface-elevated rounded-lg" />
            </div>
          ))}
        </div>

        {/* Chart Skeleton */}
        <div className="px-5 mb-4">
          <div className="card h-40 flex flex-col justify-between">
            <div className="flex justify-between items-center">
              <div className="h-4 w-24 bg-surface-elevated rounded-lg" />
              <div className="space-y-1">
                <div className="h-4 w-16 bg-teal-600/20 rounded-lg ml-auto" />
                <div className="h-3 w-12 bg-surface-elevated rounded-lg ml-auto" />
              </div>
            </div>
            {/* Chart bars placeholders */}
            <div className="flex items-end gap-1.5 h-20 mt-4">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                  <div className="w-full bg-surface-elevated rounded-t-sm" style={{ height: `${20 + i * 10}%` }} />
                  <div className="h-2 w-6 bg-surface-elevated rounded-md" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Transactions List Skeleton */}
        <div className="px-5 mt-2">
          <div className="h-4 w-16 bg-surface-card rounded-lg mb-3" />
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="card flex items-center justify-between h-14">
                <div className="space-y-1.5">
                  <div className="h-4 w-20 bg-surface-elevated rounded-lg" />
                  <div className="h-3 w-28 bg-surface-elevated rounded-lg" />
                </div>
                <div className="h-6 w-16 bg-surface-elevated rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // AI bargaining state
  const [aiBargainEnabled, setAiBargainEnabled] = useState(true);
  const [maxDiscount, setMaxDiscount] = useState(15);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = (txt: string, id: string) => {
    navigator.clipboard.writeText(txt);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="min-h-screen bg-surface pb-28 text-text-primary">
      {/* Header */}
      <div className="px-5 pt-14 pb-5 flex items-center justify-between">
        <div>
          <p className="text-text-secondary text-xs font-mono uppercase tracking-wider">{getGreeting()} 👋</p>
          <h1 className="text-2xl font-black mt-0.5 tracking-tight">{merchant?.shopName ?? user?.displayName}</h1>
        </div>
        <div className="flex items-center gap-2">
          {merchant?.merchantId && (
            <button
              id="show-qr-btn"
              onClick={() => navigate(`/merchant/qr/${merchant.merchantId}`)}
              className="btn-secondary p-2.5 rounded-xl hover:bg-surface-elevated transition-colors"
              title="Show payment QR"
            >
              <QrCode size={18} className="text-teal-400" />
            </button>
          )}
        </div>
      </div>

      {/* Stats cards */}
      <div className="px-5 grid grid-cols-2 gap-3 mb-4">
        <div className="card bg-[#131622]/40 border-[#22263a] p-4 flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={15} className="text-teal-400" />
            <span className="text-text-secondary text-[11px] font-medium uppercase tracking-wider">Total Volume</span>
          </div>
          <div>
            <p className="font-mono text-xl font-bold text-text-primary">
              {lovelaceToAda(merchant?.totalReceivedLovelace ?? 0)}
            </p>
            <p className="text-text-muted text-[10px] font-mono mt-0.5">ADA RECEIVED</p>
          </div>
        </div>
        <div className="card bg-[#131622]/40 border-[#22263a] p-4 flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-3">
            <Package size={15} className="text-indigo-400" />
            <span className="text-text-secondary text-[11px] font-medium uppercase tracking-wider">Orders</span>
          </div>
          <div>
            <p className="text-2xl font-bold text-text-primary">{merchant?.totalOrders ?? 0}</p>
            <p className="text-text-muted text-[10px] uppercase font-mono mt-0.5">settlements</p>
          </div>
        </div>
        <div className="card bg-[#131622]/40 border-[#22263a] p-4 flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle size={15} className="text-emerald-400" />
            <span className="text-text-secondary text-[11px] font-medium uppercase tracking-wider">Settled</span>
          </div>
          <div>
            <p className="text-2xl font-bold text-emerald-400">{settledCount}</p>
            <p className="text-text-muted text-[10px] uppercase font-mono mt-0.5">ledger entries</p>
          </div>
        </div>
        <div className="card bg-[#131622]/40 border-[#22263a] p-4 flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-3">
            <Clock size={15} className="text-amber-400 animate-pulse" />
            <span className="text-text-secondary text-[11px] font-medium uppercase tracking-wider">Pending</span>
          </div>
          <div>
            <p className="text-2xl font-bold text-amber-400">{pendingCount}</p>
            <p className="text-text-muted text-[10px] uppercase font-mono mt-0.5">awaiting block</p>
          </div>
        </div>
      </div>

      {/* Grid: Reputation and AI Negotiation Control */}
      <div className="px-5 grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Merchant Reputation Surface Card */}
        <div className="card bg-[#131622] border-[#22263a] p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[#22263a] pb-3">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-teal-400 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider text-text-primary">Staked Reputation</span>
            </div>
            <span className="text-[10px] bg-teal-500/15 text-teal-400 font-mono px-2 py-0.5 rounded border border-teal-500/20 uppercase font-bold">
              Platinum Rank
            </span>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-3xl font-black text-teal-400">98.4%</p>
              <p className="text-[10px] text-text-muted mt-1 uppercase font-mono">Consensus Trust Score</p>
            </div>
            <div className="text-right text-[10px] font-mono text-text-secondary space-y-1">
              <p>Disputes MTTR: <span className="text-emerald-400 font-bold">1.2 hrs</span></p>
              <p>Slashed Stake: <span className="text-text-primary">0.0 ADA</span></p>
              <p>Locked Deposit: <span className="text-text-primary">250 ADA</span></p>
            </div>
          </div>
        </div>

        {/* AI Bargain Negotiation Agent Configuration Card */}
        <div className="card bg-[#131622] border-[#22263a] p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[#22263a] pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-violet-400 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider text-text-primary">Gemini Price Bargaining</span>
            </div>
            <button 
              onClick={() => setAiBargainEnabled(!aiBargainEnabled)}
              className={`w-10 h-5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none ${aiBargainEnabled ? 'bg-teal-600' : 'bg-surface-elevated'}`}
            >
              <div className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-200 ${aiBargainEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>
          
          {aiBargainEnabled ? (
            <div className="space-y-3 animate-fade-in">
              <div className="flex justify-between items-center text-xs">
                <span className="text-text-secondary">Max Discount Limit:</span>
                <span className="font-mono font-bold text-violet-400">{maxDiscount}%</span>
              </div>
              <input
                type="range"
                min="5"
                max="30"
                value={maxDiscount}
                onChange={(e) => setMaxDiscount(Number(e.target.value))}
                className="w-full h-1 bg-surface-elevated rounded-lg appearance-none cursor-pointer accent-teal-600"
              />
              <div className="flex justify-between items-center text-[10px] text-text-muted font-mono pt-1">
                <span>Negotiated Savings:</span>
                <span className="text-emerald-400 font-bold">₹4,250.00 saved</span>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-text-muted text-[11px] italic">
              AI bargaining agent disabled. Store items checkout at absolute static prices.
            </div>
          )}
        </div>
      </div>

      {/* Grid: Revenue Chart & Webhooks Telemetry */}
      <div className="px-5 grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {/* Revenue chart */}
        <div className="md:col-span-2">
          {Object.keys(revenueByDay).length > 0 && (
            <RevenueChart data={revenueByDay} />
          )}
        </div>

        {/* Webhooks SLA Telemetry widget */}
        <div className="card bg-[#131622]/40 border-[#22263a] p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[#22263a] pb-3">
            <div className="flex items-center gap-1.5">
              <Radio className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-text-primary">Webhook SLA</span>
            </div>
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs text-text-secondary">Delivery Success</span>
              <span className="font-mono text-xs font-bold text-emerald-400">99.92%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-text-secondary">Avg Latency</span>
              <span className="font-mono text-xs text-text-primary">145ms</span>
            </div>
            <div className="flex justify-between items-center border-t border-[#22263a] pt-2">
              <span className="text-[10px] text-text-muted uppercase">Subscribed Endpoints</span>
              <button 
                onClick={() => navigate('/developer/webhooks')}
                className="text-[10px] text-teal-400 hover:text-teal-300 font-bold flex items-center gap-0.5"
              >
                Configure <ChevronRight size={10} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Recent transactions */}
      <div className="px-5 mt-2">
        <h2 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-3">
          Recent active transactions
        </h2>
        <div className="space-y-2">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="card h-14 animate-pulse bg-surface-elevated" />
            ))
          ) : recentInvoices.length === 0 ? (
            <div className="card text-center py-10 bg-[#131622]/20 border-[#22263a]">
              <p className="text-text-muted">No invoices generated yet</p>
              <p className="text-text-muted text-xs mt-1">
                Tap <span className="text-teal-400">+</span> to create your first payment checkout link
              </p>
            </div>
          ) : (
            recentInvoices.map((inv) => (
              <div key={inv.invoiceId} className="card bg-[#131622]/40 hover:bg-[#131622]/70 border-[#22263a] transition-all flex items-center justify-between p-3.5">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-sm text-text-primary">₹{paiseToinr(inv.amountPaise)}</p>
                    {inv.escrowState && inv.escrowState !== 'None' && (
                      <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded-full ${
                        inv.escrowState === 'Locked' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/15' :
                        inv.escrowState === 'PartiallyReleased' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/15' :
                        inv.escrowState === 'Released' ? 'bg-teal-500/10 text-teal-400 border border-teal-500/15' :
                        inv.escrowState === 'Disputed' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/15 animate-pulse' :
                        inv.escrowState === 'Resolved' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/15' :
                        'bg-gray-500/10 text-gray-400 border border-gray-500/15'
                      }`}>
                        Escrow: {inv.escrowState}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1 text-[10px] text-text-secondary font-mono">
                    <span className="truncate max-w-[120px]">{inv.invoiceId}</span>
                    <button 
                      onClick={() => copyToClipboard(inv.invoiceId, inv.invoiceId)}
                      className="text-text-muted hover:text-text-secondary p-0.5 rounded"
                      title="Copy Invoice ID"
                    >
                      {copiedId === inv.invoiceId ? <Check size={10} className="text-emerald-400" /> : <Copy size={10} />}
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <StatusBadge status={inv.status} />
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* FAB — Create invoice */}
      <button
        id="create-invoice-fab"
        onClick={() => setShowInvoiceSheet(true)}
        className="fixed bottom-24 right-6 w-16 h-16 bg-teal-600 hover:bg-teal-700 active:scale-95 rounded-full shadow-2xl shadow-teal-600/40 flex items-center justify-center transition-all z-30"
        aria-label="Create invoice"
      >
        <Plus size={28} className="text-white" />
      </button>

      {/* Invoice creation sheet */}
      {showInvoiceSheet && (
        <InvoiceSheet onClose={() => setShowInvoiceSheet(false)} />
      )}
    </div>
  );
}
