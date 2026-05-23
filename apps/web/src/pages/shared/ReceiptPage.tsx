import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ExternalLink, CheckCircle } from 'lucide-react';
import { getInvoice } from '../../services/api';

export default function ReceiptPage() {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const navigate = useNavigate();

  const { data: invoiceRes, isLoading } = useQuery({
    queryKey: ['invoice', invoiceId],
    queryFn: () => getInvoice(invoiceId!),
    enabled: !!invoiceId,
  });

  const invoice = invoiceRes?.data;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface px-5 pt-12 pb-10">
      <button onClick={() => navigate(-1)} className="btn-ghost flex items-center gap-2 -ml-2 mb-8">
        <ArrowLeft size={18} /> Back
      </button>

      {invoice ? (
        <div className="max-w-sm mx-auto animate-fade-in">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-status-confirmed/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={32} className="text-status-confirmed" />
            </div>
            <h1 className="text-2xl font-bold">Payment Receipt</h1>
            <p className="text-text-secondary text-sm mt-1">
              {invoice.status === 'settled' ? 'Payment confirmed & settled' : `Status: ${invoice.status}`}
            </p>
          </div>

          {/* Receipt card */}
          <div className="card space-y-4 mb-4">
            <div className="border-b border-surface-border pb-4 text-center">
              <p className="text-4xl font-bold">₹{(invoice.amountPaise / 100).toFixed(2)}</p>
              <p className="font-mono text-text-secondary mt-1">
                {(invoice.amountLovelace / 1_000_000).toFixed(4)} ADA
              </p>
            </div>

            {[
              { label: 'Invoice ID', value: invoice.invoiceId, mono: true },
              { label: 'TX Hash', value: invoice.txHash ? `${invoice.txHash.slice(0, 16)}...` : 'Pending', mono: true },
              { label: 'Rate at payment', value: `₹${invoice.adaInrRate?.toFixed(2)}/ADA` },
              { label: 'Created', value: new Date(invoice.createdAt).toLocaleString() },
              { label: 'Settled', value: invoice.settledAt ? new Date(invoice.settledAt).toLocaleString() : 'Pending' },
            ].map(({ label, value, mono }) => (
              <div key={label} className="flex justify-between text-sm">
                <span className="text-text-secondary">{label}</span>
                <span className={`${mono ? 'font-mono text-xs' : ''} text-text-primary text-right max-w-[55%] break-all`}>
                  {value}
                </span>
              </div>
            ))}

            {invoice.receiptCid && (
              <div className="pt-2 border-t border-surface-border">
                <a
                  href={`https://gateway.pinata.cloud/ipfs/${invoice.receiptCid}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 text-teal-400 text-sm hover:text-teal-300 transition-colors"
                >
                  <ExternalLink size={14} />
                  View on IPFS (Permanent Record)
                </a>
              </div>
            )}
          </div>

          {invoice.txHash && (
            <a
              href={`https://preprod.cardanoscan.io/transaction/${invoice.txHash}`}
              target="_blank"
              rel="noreferrer"
              className="btn-secondary w-full flex items-center justify-center gap-2"
            >
              <ExternalLink size={16} />
              View on Cardano Explorer
            </a>
          )}
        </div>
      ) : (
        <div className="text-center py-20">
          <p className="text-text-muted">Receipt not found.</p>
        </div>
      )}
    </div>
  );
}
