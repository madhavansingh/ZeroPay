import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, TrendingUp, Package, Clock, CheckCircle } from 'lucide-react';
import { getMerchantDashboard, getMerchantInvoices } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import InvoiceSheet from '../../components/organisms/InvoiceSheet';
import StatusBadge from '../../components/atoms/StatusBadge';
import type { InvoiceStatus } from '@zeropay/shared-types';

function lovelaceToAda(lovelace: number) {
  return (lovelace / 1_000_000).toFixed(2);
}

function paiseToinr(paise: number) {
  return (paise / 100).toFixed(2);
}

export default function DashboardPage() {
  const [showInvoiceSheet, setShowInvoiceSheet] = useState(false);
  const { user } = useAuthStore();

  const { data: dashboardData } = useQuery({
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
  const merchant = merchantData?.merchant as { shopName: string; totalReceivedLovelace: number; totalOrders: number } | undefined;
  const recentInvoices: Array<{ invoiceId: string; amountPaise: number; status: InvoiceStatus; createdAt: string }> =
    ((invoicesData?.data as any)?.items ?? []) as Array<{ invoiceId: string; amountPaise: number; status: InvoiceStatus; createdAt: string }>;

  const settledCount = (merchantData?.stats?.settled ?? 0) as number;
  const pendingCount = ((merchantData?.stats?.pending ?? 0) + (merchantData?.stats?.confirming ?? 0)) as number;

  return (
    <div className="min-h-screen bg-surface pb-24">
      {/* Header */}
      <div className="px-5 pt-14 pb-6">
        <p className="text-text-secondary text-sm">Good morning 👋</p>
        <h1 className="text-2xl font-bold mt-0.5">{merchant?.shopName ?? user?.displayName}</h1>
      </div>

      {/* Stats cards */}
      <div className="px-5 grid grid-cols-2 gap-3 mb-6">
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

      {/* Recent transactions */}
      <div className="px-5">
        <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">Recent</h2>
        <div className="space-y-2">
          {recentInvoices.length === 0 ? (
            <div className="card text-center py-10">
              <p className="text-text-muted">No invoices yet</p>
              <p className="text-text-muted text-sm mt-1">Tap + to create your first payment request</p>
            </div>
          ) : (
            recentInvoices.map((inv) => (
              <div key={inv.invoiceId} className="card flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">₹{paiseToinr(inv.amountPaise)}</p>
                  <p className="text-text-muted text-xs font-mono mt-0.5">{inv.invoiceId}</p>
                </div>
                <StatusBadge status={inv.status} />
              </div>
            ))
          )}
        </div>
      </div>

      {/* FAB */}
      <button
        id="create-invoice-fab"
        onClick={() => setShowInvoiceSheet(true)}
        className="fixed bottom-8 right-6 w-16 h-16 bg-teal-600 hover:bg-teal-700 active:scale-95 rounded-full shadow-2xl shadow-teal-600/40 flex items-center justify-center transition-all"
        aria-label="Create invoice"
      >
        <Plus size={28} className="text-white" />
      </button>

      {/* Invoice sheet */}
      {showInvoiceSheet && (
        <InvoiceSheet onClose={() => setShowInvoiceSheet(false)} />
      )}
    </div>
  );
}
