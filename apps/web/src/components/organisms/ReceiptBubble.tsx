import { useNavigate } from 'react-router-dom';
import { CheckCircle, ExternalLink } from 'lucide-react';

interface Props {
  payload: {
    invoiceId: string;
    txHash: string;
    amountPaise: number;
    amountLovelace: number;
    receiptCid?: string;
    ipfsUrl?: string;
    settledAt: string;
  };
}

export default function ReceiptBubble({ payload }: Props) {
  const navigate = useNavigate();

  return (
    <div className="flex justify-center my-2">
      <div className="w-full max-w-xs rounded-3xl border border-status-settled/30 bg-status-settled/5">
        <div className="px-4 pt-4 pb-3">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle size={16} className="text-status-settled" />
            <span className="text-xs font-semibold uppercase tracking-wider text-status-settled">
              Payment Confirmed
            </span>
          </div>

          <p className="text-2xl font-bold mb-0.5">₹{(payload.amountPaise / 100).toFixed(2)}</p>
          <p className="font-mono text-text-secondary text-xs">
            {(payload.amountLovelace / 1_000_000).toFixed(4)} ADA settled
          </p>

          <p className="text-text-muted text-xs mt-2">
            {new Date(payload.settledAt).toLocaleString()}
          </p>
        </div>

        <div className="flex border-t border-surface-border">
          <button
            id={`receipt-view-${payload.invoiceId}`}
            onClick={() => navigate(`/receipt/${payload.invoiceId}`)}
            className="flex-1 py-3 text-teal-400 text-sm font-medium hover:bg-teal-600/5 transition-colors rounded-bl-3xl"
          >
            View Receipt
          </button>
          {payload.ipfsUrl && (
            <a
              href={payload.ipfsUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-1.5 flex-1 py-3 text-text-secondary text-sm hover:bg-surface-elevated transition-colors rounded-br-3xl border-l border-surface-border"
            >
              <ExternalLink size={12} /> IPFS
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
