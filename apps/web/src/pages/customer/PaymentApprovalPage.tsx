import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { ArrowLeft, Shield, CheckCircle, AlertCircle } from 'lucide-react';
import { getInvoice, buildTx, submitTx } from '../../services/api';
import StatusBadge from '../../components/atoms/StatusBadge';

// CIP-30 type definitions
interface CardanoApi {
  getUsedAddresses(): Promise<string[]>;
  getChangeAddress(): Promise<string>;
  signTx(tx: string, partialSign?: boolean): Promise<string>;
  submitTx(tx: string): Promise<string>;
}


async function getFirstAvailableWallet(): Promise<CardanoApi> {
  const walletKeys = ['eternl', 'lace', 'nami', 'flint', 'vespr', 'begin'];
  for (const key of walletKeys) {
    if (window.cardano?.[key]) {
      return window.cardano[key]!.enable();
    }
  }
  throw new Error('No Cardano wallet detected. Please install Eternl or Lace.');
}

type PayStep = 'review' | 'signing' | 'submitted' | 'error';

export default function PaymentApprovalPage() {
  const { merchantId } = useParams<{ merchantId: string }>();
  const navigate = useNavigate();
  const [step, setStep] = useState<PayStep>('review');
  const [txHash, setTxHash] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // merchantId could be an invoiceId
  const isInvoiceId = merchantId?.startsWith('INV-');

  const { data: invoiceRes, isLoading } = useQuery({
    queryKey: ['invoice', merchantId],
    queryFn: () => getInvoice(merchantId!),
    enabled: !!merchantId,
  });

  const invoice = invoiceRes?.data;

  const handlePay = async () => {
    if (!invoice?.invoiceId) return;
    setStep('signing');
    setErrorMsg('');

    try {
      // 1. Build unsigned CBOR from backend
      const buildRes = await buildTx(invoice.invoiceId);
      if (!buildRes.success || !buildRes.data) throw new Error('Failed to build transaction');

      // 2. Get CIP-30 wallet
      const api = await getFirstAvailableWallet();

      // 3. Sign client-side — keys never leave browser
      const signedTx = await api.signTx(buildRes.data.unsignedCbor, true);

      // 4. Submit via wallet's own node connection
      const hash = await api.submitTx(signedTx);
      setTxHash(hash);

      // 5. Notify backend of the tx hash
      await submitTx({ invoiceId: invoice.invoiceId, txHash: hash });

      setStep('submitted');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Payment failed';
      if (msg.toLowerCase().includes('user') && (msg.includes('decline') || msg.includes('cancel'))) {
        setStep('review');
      } else {
        setErrorMsg(msg);
        setStep('error');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (step === 'submitted') {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center px-6 animate-fade-in">
        <div className="w-full max-w-sm text-center">
          <div className="w-24 h-24 rounded-full bg-status-confirmed/10 flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={48} className="text-status-confirmed" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Payment Submitted!</h1>
          <p className="text-text-secondary mb-6">
            Your transaction is being confirmed on the Cardano blockchain. You'll be notified when complete.
          </p>
          <div className="card mb-6 text-left">
            <p className="text-text-muted text-xs mb-1">Transaction Hash</p>
            <p className="font-mono text-xs text-text-secondary break-all">{txHash}</p>
          </div>
          <button id="payment-done-btn" onClick={() => navigate('/customer/chats')} className="btn-primary w-full">
            Back to Chats
          </button>
        </div>
      </div>
    );
  }

  if (step === 'error') {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center px-6 animate-fade-in">
        <div className="w-full max-w-sm text-center">
          <div className="w-24 h-24 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6">
            <AlertCircle size={48} className="text-red-400" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Payment Failed</h1>
          <p className="text-text-secondary mb-4">{errorMsg}</p>
          <button onClick={() => setStep('review')} className="btn-primary w-full mb-3">Try Again</button>
          <button onClick={() => navigate(-1)} className="btn-ghost w-full">Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col px-5 pt-12 pb-10">
      <button onClick={() => navigate(-1)} className="btn-ghost flex items-center gap-2 -ml-2 mb-8">
        <ArrowLeft size={18} /> Back
      </button>

      <h1 className="text-2xl font-bold mb-1">Confirm Payment</h1>
      <p className="text-text-secondary text-sm mb-8">Review details before approving with your wallet</p>

      {invoice ? (
        <div className="space-y-4">
          <div className="card text-center py-6">
            <p className="text-text-secondary text-sm mb-1">You're paying</p>
            <p className="text-5xl font-bold">₹{(invoice.amountPaise / 100).toFixed(2)}</p>
            <p className="font-mono text-text-secondary mt-2">
              {(invoice.amountLovelace / 1_000_000).toFixed(4)} ADA
            </p>
            <p className="text-text-muted text-xs mt-1">
              @ ₹{invoice.adaInrRate?.toFixed(2)}/ADA (locked at creation)
            </p>
          </div>

          <div className="card space-y-3">
            {(
              [
                { label: 'Invoice', value: invoice.invoiceId, mono: true },
                { label: 'Status', node: <StatusBadge status={invoice.status} /> },
                invoice.description ? { label: 'Description', value: invoice.description } : null,
                { label: 'To', value: `${invoice.paymentAddress?.slice(0, 12)}...${invoice.paymentAddress?.slice(-6)}`, mono: true },
              ] as Array<{ label: string; value?: string; mono?: boolean; node?: React.ReactNode } | null>
            ).filter((row): row is { label: string; value?: string; mono?: boolean; node?: React.ReactNode } => row !== null).map((row, i) => (
              <div key={i} className="flex justify-between items-center text-sm">
                <span className="text-text-secondary">{row.label}</span>
                {row.node ? (
                  row.node
                ) : (
                  <span className={`${row.mono ? 'font-mono text-xs' : ''} text-text-primary text-right max-w-[55%] break-all`}>
                    {row.value}
                  </span>
                )}
              </div>
            ))}
          </div>

          <div className="flex items-start gap-3 bg-teal-600/5 border border-teal-600/20 rounded-2xl p-4">
            <Shield size={18} className="text-teal-400 shrink-0 mt-0.5" />
            <p className="text-text-secondary text-xs">
              Your private keys never leave your browser. ZeroPay only receives the final transaction hash.
            </p>
          </div>

          <button
            id="confirm-pay-btn"
            onClick={handlePay}
            disabled={step === 'signing' || invoice.status !== 'pending'}
            className="btn-primary w-full mt-2"
          >
            {step === 'signing' ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Waiting for wallet...
              </span>
            ) : invoice.status !== 'pending' ? (
              `Invoice is ${invoice.status}`
            ) : (
              `Pay ₹${(invoice.amountPaise / 100).toFixed(2)} via Cardano`
            )}
          </button>
        </div>
      ) : (
        <div className="card text-center py-10">
          <p className="text-text-muted">Invoice not found or expired.</p>
          <button onClick={() => navigate(-1)} className="btn-ghost mt-4">Go Back</button>
        </div>
      )}
    </div>
  );
}
