import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Plus, TrendingUp, Package, Clock, CheckCircle, QrCode } from 'lucide-react';
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

  return (
    <div className="min-h-screen bg-surface pb-28">
      {/* Header */}
      <div className="px-5 pt-14 pb-5">
        <p className="text-text-secondary text-sm">{getGreeting()} 👋</p>
        <div className="flex items-center justify-between mt-0.5">
          <h1 className="text-2xl font-bold">{merchant?.shopName ?? user?.displayName}</h1>
          {merchant?.merchantId && (
            <button
              id="show-qr-btn"
              onClick={() => navigate(`/merchant/qr/${merchant.merchantId}`)}
              className="btn-ghost p-2 rounded-xl"
              title="Show payment QR"
            >
              <QrCode size={22} className="text-teal-400" />
            </button>
          )}
        </div>
      </div>

      {/* Stats cards */}
      <div className="px-5 grid grid-cols-2 gap-3 mb-4">
        <div className="card">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={16} className="text-teal-400" />
            <span className="text-text-secondary text-xs">Total Received</span>
          </div>
          <p className="font-mono text-xl font-bold">
            {lovelaceToAda(merchant?.totalReceivedLovelace ?? 0)}
          </p>
          <p className="text-text-muted text-xs font-mono">ADA</p>
        </div>
        <div className="card">
          <div className="flex items-center gap-2 mb-3">
            <Package size={16} className="text-teal-400" />
            <span className="text-text-secondary text-xs">Total Orders</span>
          </div>
          <p className="text-2xl font-bold">{merchant?.totalOrders ?? 0}</p>
          <p className="text-text-muted text-xs">payments</p>
        </div>
        <div className="card">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle size={16} className="text-status-settled" />
            <span className="text-text-secondary text-xs">Settled</span>
          </div>
          <p className="text-2xl font-bold text-status-settled">{settledCount}</p>
        </div>
        <div className="card">
          <div className="flex items-center gap-2 mb-3">
            <Clock size={16} className="text-status-pending" />
            <span className="text-text-secondary text-xs">Pending</span>
          </div>
          <p className="text-2xl font-bold text-status-pending">{pendingCount}</p>
        </div>
      </div>

      {/* Revenue chart */}
      <div className="px-5">
        {Object.keys(revenueByDay).length > 0 && (
          <RevenueChart data={revenueByDay} />
        )}
      </div>

      {/* Recent transactions */}
      <div className="px-5 mt-2">
        <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">
          Recent
        </h2>
        <div className="space-y-2">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="card h-14 animate-pulse bg-surface-elevated" />
            ))
          ) : recentInvoices.length === 0 ? (
            <div className="card text-center py-10">
              <p className="text-text-muted">No invoices yet</p>
              <p className="text-text-muted text-sm mt-1">
                Tap <span className="text-teal-400">+</span> to create your first payment request
              </p>
            </div>
          ) : (
            recentInvoices.map((inv) => (
              <div key={inv.invoiceId} className="card flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">₹{paiseToinr(inv.amountPaise)}</p>
                    {inv.escrowState && inv.escrowState !== 'None' && (
                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                        inv.escrowState === 'Locked' ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/20' :
                        inv.escrowState === 'PartiallyReleased' ? 'bg-blue-500/15 text-blue-400 border border-blue-500/20' :
                        inv.escrowState === 'Released' ? 'bg-teal-500/15 text-teal-400 border border-teal-500/20' :
                        inv.escrowState === 'Disputed' ? 'bg-red-500/15 text-red-400 border border-red-500/20' :
                        inv.escrowState === 'Resolved' ? 'bg-purple-500/15 text-purple-400 border border-purple-500/20' :
                        'bg-gray-500/15 text-gray-400 border border-gray-500/20'
                      }`}>
                        Escrow: {inv.escrowState}
                      </span>
                    )}
                  </div>
                  <p className="text-text-muted text-xs font-mono mt-0.5">{inv.invoiceId}</p>
                </div>
                <StatusBadge status={inv.status} />
              </div>
            ))
          )}
        </div>
      </div>

      {/* FAB — Create invoice */}
      <button
        id="create-invoice-fab"
        onClick={() => setShowInvoiceSheet(true)}
        className="fixed bottom-24 right-6 w-16 h-16 bg-teal-600 hover:bg-teal-700 active:scale-95 rounded-full shadow-2xl shadow-teal-600/40 flex items-center justify-center transition-all"
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
