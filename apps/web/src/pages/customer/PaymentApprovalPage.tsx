import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { ArrowLeft, Shield, CheckCircle, AlertCircle, Loader, ExternalLink } from 'lucide-react';
import { getInvoice, buildTx, submitTx, createChatRoom } from '../../services/api';
import StatusBadge from '../../components/atoms/StatusBadge';
import { database } from '../../services/firebase';
import { ref, onValue } from 'firebase/database';
import type { InvoiceStatus } from '@zeropay/shared-types';

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

function mapWalletError(err: any): string {
  if (!err) return 'An unknown error occurred.';
  const code = err.code;
  const msg = err.message || String(err);
  const lowerMsg = msg.toLowerCase();

  // CIP-30 error code mapping
  if (
    code === 2 || 
    code === 4 || 
    lowerMsg.includes('user decline') || 
    lowerMsg.includes('declined') || 
    lowerMsg.includes('canceled') || 
    lowerMsg.includes('cancelled') || 
    lowerMsg.includes('refused') || 
    lowerMsg.includes('user rejected')
  ) {
    return 'Transaction signature declined by user.';
  }
  if (
    lowerMsg.includes('insufficient') || 
    lowerMsg.includes('funds') || 
    lowerMsg.includes('balance') || 
    lowerMsg.includes('overflow')
  ) {
    return 'Insufficient funds in your wallet to cover the transaction value and network fees.';
  }
  if (
    lowerMsg.includes('no cardano wallet') || 
    lowerMsg.includes('no wallet found')
  ) {
    return 'No compatible Cardano wallet detected. Please install Eternl, Lace, Nami, Flint, or Vespr.';
  }
  return msg;
}

type PayStep = 'review' | 'signing' | 'submitted' | 'error';

export default function PaymentApprovalPage() {
  const { merchantId } = useParams<{ merchantId: string }>();
  const navigate = useNavigate();
  const [step, setStep] = useState<PayStep>('review');
  const [txHash, setTxHash] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [liveStatus, setLiveStatus] = useState<InvoiceStatus | null>(null);

  // merchantId could be an invoiceId
  const isInvoiceId = merchantId?.startsWith('INV-');

  // 1. Redirection for static merchant QR codes (merchantStringId instead of invoiceId)
  useEffect(() => {
    if (merchantId && !isInvoiceId) {
      createChatRoom({ merchantStringId: merchantId })
        .then((res) => {
          if (res.success && res.data?.roomId) {
            navigate(`/customer/chats/${res.data.roomId}`, { replace: true });
          } else {
            setErrorMsg(res.error ?? 'Failed to open chat room');
            setStep('error');
          }
        })
        .catch((err) => {
          setErrorMsg(err instanceof Error ? err.message : 'Failed to open chat room');
          setStep('error');
        });
    }
  }, [merchantId, isInvoiceId, navigate]);

  const { data: invoiceRes, isLoading } = useQuery({
    queryKey: ['invoice', merchantId],
    queryFn: () => getInvoice(merchantId!),
    enabled: !!merchantId && isInvoiceId,
  });

  const invoice = invoiceRes?.data;

  // 2. Real-time Firebase RTDB listener for status
  useEffect(() => {
    if (!isInvoiceId || !merchantId) return;

    if (invoice?.status) {
      setLiveStatus(invoice.status);
    }

    const statusRef = ref(database, `/invoices/${merchantId}`);
    const unsubscribe = onValue(statusRef, (snap) => {
      const status = snap.val();
      if (status) {
        setLiveStatus(status as InvoiceStatus);
      }
    });

    return () => unsubscribe();
  }, [merchantId, isInvoiceId, invoice?.status]);

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
      console.error('Wallet transaction error:', err);
      const mapped = mapWalletError(err);
      setErrorMsg(mapped);
      setStep('review');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const currentStatus = liveStatus || invoice?.status || 'pending';

  // Handle expired status
  if (currentStatus === 'expired') {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center px-6 animate-fade-in">
        <div className="w-full max-w-sm text-center">
          <div className="w-24 h-24 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6">
            <AlertCircle size={48} className="text-red-400" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Invoice Expired</h1>
          <p className="text-text-secondary mb-8">
            This invoice has expired and is no longer payable. Please ask the merchant to generate a new invoice.
          </p>
          <button
            onClick={() => navigate('/customer/chats')}
            className="btn-primary w-full"
          >
            Back to Chats
          </button>
        </div>
      </div>
    );
  }

  const isPending = currentStatus === 'pending';
  const showStepper = step === 'submitted' || !isPending;

  // Render visual stepper when transaction has been submitted
  if (showStepper) {
    const isStep1Done = currentStatus !== 'pending';
    
    const isStep2Active = currentStatus === 'submitted' || currentStatus === 'confirming';
    const isStep2Done = currentStatus === 'confirmed' || currentStatus === 'settled';
    
    const isStep3Active = currentStatus === 'confirmed';
    const isStep3Done = currentStatus === 'settled';

    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center px-6 animate-fade-in">
        <div className="w-full max-w-sm text-center">
          {isStep3Done ? (
            <div className="w-24 h-24 rounded-full bg-teal-500/10 flex items-center justify-center mx-auto mb-6 animate-bounce">
              <CheckCircle size={48} className="text-teal-400" />
            </div>
          ) : (
            <div className="w-24 h-24 rounded-full bg-teal-600/10 flex items-center justify-center mx-auto mb-6">
              <Loader size={48} className="text-teal-400 animate-spin" />
            </div>
          )}

          <h1 className="text-2xl font-bold mb-2">
            {isStep3Done ? 'Payment Settled!' : 'Verifying Payment...'}
          </h1>
          <p className="text-text-secondary mb-8">
            {isStep3Done 
              ? 'Your Cardano payment has been settled and receipt generated.'
              : 'Please wait while we verify your transaction on the Cardano blockchain.'}
          </p>

          {/* Real-time Web3 Stepper */}
          <div className="card text-left space-y-6 mb-8 bg-surface-card border border-surface-border">
            {/* Step 1 */}
            <div className="flex items-center gap-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                isStep1Done ? 'bg-teal-600 text-white' : 'bg-surface-elevated text-text-secondary'
              }`}>
                {isStep1Done ? '✓' : '1'}
              </div>
              <div>
                <p className="font-semibold text-sm">Transaction Broadcasted</p>
                <p className="text-xs text-text-secondary">Sent successfully to Cardano network</p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex items-center gap-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                isStep2Done 
                  ? 'bg-teal-600 text-white' 
                  : isStep2Active 
                    ? 'border-2 border-teal-500 text-teal-400 animate-pulse' 
                    : 'bg-surface-elevated text-text-secondary'
              }`}>
                {isStep2Done ? '✓' : '2'}
              </div>
              <div>
                <p className="font-semibold text-sm">Blockchain Confirmation</p>
                <p className="text-xs text-text-secondary">
                  {isStep2Active ? 'Waiting for block confirmations...' : isStep2Done ? 'Confirmed in block' : 'Pending confirmations'}
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex items-center gap-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                isStep3Done 
                  ? 'bg-teal-600 text-white' 
                  : isStep3Active 
                    ? 'border-2 border-teal-500 text-teal-400 animate-pulse' 
                    : 'bg-surface-elevated text-text-secondary'
              }`}>
                {isStep3Done ? '✓' : '3'}
              </div>
              <div>
                <p className="font-semibold text-sm">Receipt & Settlement</p>
                <p className="text-xs text-text-secondary">
                  {isStep3Active ? 'Pinning receipt to IPFS...' : isStep3Done ? 'Receipt generated & settled' : 'Pending settlement'}
                </p>
              </div>
            </div>
          </div>

          {txHash && (
            <div className="card mb-6 text-left bg-surface-card border border-surface-border">
              <div className="flex items-center justify-between mb-1">
                <span className="text-text-muted text-xs">Transaction Hash</span>
                <a 
                  href={`https://preprod.cardanoscan.io/transaction/${txHash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-teal-400 hover:text-teal-300 flex items-center gap-1 transition-colors"
                >
                  <ExternalLink size={10} /> Explorer
                </a>
              </div>
              <p className="font-mono text-xs text-text-secondary break-all">{txHash}</p>
            </div>
          )}

          <div className="flex flex-col gap-2">
            {isStep3Done && invoice && (
              <button
                id="payment-receipt-btn"
                onClick={() => navigate(`/receipt/${invoice.invoiceId}`)}
                className="btn-primary w-full"
              >
                View Receipt
              </button>
            )}
            <button 
              id="payment-done-btn" 
              onClick={() => navigate('/customer/chats')} 
              className={isStep3Done ? "btn-secondary w-full" : "btn-primary w-full"}
            >
              Back to Chats
            </button>
          </div>
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

      {errorMsg && (
        <div className="mb-6 flex items-start gap-3 bg-red-950/20 border border-red-500/25 rounded-2xl p-4 text-red-200 animate-fade-in">
          <AlertCircle size={18} className="text-red-400 shrink-0 mt-0.5" />
          <div className="text-xs">
            <p className="font-semibold mb-0.5 text-red-300">Payment Failed</p>
            <p className="text-gray-400">{errorMsg}</p>
          </div>
        </div>
      )}

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
                { label: 'Status', node: <StatusBadge status={currentStatus} /> },
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
            disabled={step === 'signing' || currentStatus !== 'pending'}
            className="btn-primary w-full mt-2"
          >
            {step === 'signing' ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Waiting for wallet...
              </span>
            ) : currentStatus !== 'pending' ? (
              `Invoice is ${currentStatus}`
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

