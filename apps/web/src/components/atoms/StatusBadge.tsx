import type { InvoiceStatus } from '@zeropay/shared-types';

const STATUS_CONFIG: Record<InvoiceStatus, { label: string; classes: string }> = {
  pending: { label: 'Pending', classes: 'bg-status-pending/10 text-status-pending' },
  submitted: { label: 'Submitted', classes: 'bg-status-submitted/10 text-status-submitted' },
  confirming: { label: 'Confirming', classes: 'bg-status-confirming/10 text-status-confirming' },
  confirmed: { label: 'Confirmed', classes: 'bg-status-confirmed/10 text-status-confirmed' },
  settled: { label: 'Settled', classes: 'bg-status-settled/10 text-status-settled' },
  expired: { label: 'Expired', classes: 'bg-status-expired/10 text-status-expired' },
  failed: { label: 'Failed', classes: 'bg-status-failed/10 text-status-failed' },
};

interface Props {
  status: InvoiceStatus;
}

export default function StatusBadge({ status }: Props) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  return (
    <span className={`badge ${config.classes}`}>
      {config.label}
    </span>
  );
}
