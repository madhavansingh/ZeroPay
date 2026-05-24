import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ExternalLink, CheckCircle, Share2 } from 'lucide-react';
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

  const handleShare = async () => {
    if (!invoice || !navigator.share) return;
    try {
      await navigator.share({
        title: 'ZeroPay Receipt',
        text: [
          `Payment of ₹${(invoice.amountPaise / 100).toFixed(2)} (${(invoice.amountLovelace / 1_000_000).toFixed(4)} ADA) settled on Cardano.`,
          `Invoice: ${invoice.invoiceId}`,
          invoice.txHash ? `TX: ${invoice.txHash}` : '',
          invoice.receiptCid ? `IPFS: https://gateway.pinata.cloud/ipfs/${invoice.receiptCid}` : '',
        ].filter(Boolean).join('\n'),
        url: window.location.href,
      });
    } catch (err) {
      // User cancelled or error — silently ignore
    }
  };

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
        <div className="max-w-md mx-auto animate-fade-in">
          <div className="relative mb-8">
            <div className="absolute inset-0 bg-status-confirmed blur-3xl opacity-10 rounded-full scale-150 animate-pulse" />
            <div className="relative text-center">
              <div className="w-20 h-20 rounded-full bg-status-confirmed/10 flex items-center justify-center mx-auto mb-4 border-4 border-surface shadow-lg">
                <CheckCircle size={40} className="text-status-confirmed animate-bounce" />
              </div>
              <h1 className="text-3xl font-bold">Payment Settled</h1>
              <p className="text-text-secondary mt-1">Your transaction has been processed</p>
            </div>
          </div>

          <div className="card space-y-6 mb-6 p-6">
            <div className="text-center pb-6 border-b border-surface-border">
              <p className="text-sm text-text-secondary mb-1">Total Paid</p>
              <p className="text-5xl font-bold text-teal-400">₹{(invoice.amountPaise / 100).toFixed(2)}</p>
              <p className="font-mono text-text-muted mt-2">
                {(invoice.amountLovelace / 1_000_000).toFixed(4)} ADA
              </p>
            </div>

            <div className="space-y-4">
              {[
                { label: 'Invoice ID', value: invoice.invoiceId },
                { label: 'Network', value: 'Cardano (Preprod)' },
                { label: 'Rate', value: `₹${invoice.adaInrRate?.toFixed(2)}/ADA` },
                { label: 'Timestamp', value: new Date(invoice.createdAt).toLocaleString() },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-center text-sm">
                  <span className="text-text-secondary">{label}</span>
                  <span className="font-mono text-text-primary">{value}</span>
                </div>
              ))}
            </div>

            {invoice.txHash && (
              <div className="pt-4 border-t border-surface-border space-y-3">
                <a
                  href={`https://preprod.cardanoscan.io/transaction/${invoice.txHash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full btn-secondary flex items-center justify-center gap-2 text-sm"
                >
                  <ExternalLink size={14} />
                  View on Explorer
                </a>
              </div>
            )}
          </div>

          {'share' in navigator && (
            <button
              id="share-receipt-btn"
              onClick={handleShare}
              className="btn-secondary w-full flex items-center justify-center gap-2"
            >
              <Share2 size={16} /> Share Receipt
            </button>
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
