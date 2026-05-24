import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, CheckCircle, Clock } from 'lucide-react';
import QRCode from 'react-qr-code';
import { createInvoice, getAdaInrRate } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import { useQuery } from '@tanstack/react-query';
import { database } from '../../services/firebase';
import { ref, onValue } from 'firebase/database';

const QUICK_AMOUNTS = [50, 100, 200, 500, 1000];

export default function CounterCheckoutPage() {
  const [amountStr, setAmountStr] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [invoiceData, setInvoiceData] = useState<{
    invoiceId: string;
    amountPaise: number;
    amountLovelace: number;
    adaInrRate: number;
    expiresAt: string;
  } | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [invoiceStatus, setInvoiceStatus] = useState<string>('pending');

  const navigate = useNavigate();
  const { user } = useAuthStore();

  const { data: priceData } = useQuery({
    queryKey: ['ada-inr-rate'],
    queryFn: () => getAdaInrRate(),
    refetchInterval: 60_000,
  });

  useEffect(() => {
    if (!invoiceData) return;

    const update = () => {
      const left = Math.max(0, Math.floor((new Date(invoiceData.expiresAt).getTime() - Date.now()) / 1000));
      setTimeLeft(left);
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [invoiceData]);

  useEffect(() => {
    if (!invoiceData) {
      setInvoiceStatus('pending');
      return;
    }

    const statusRef = ref(database, `/invoices/${invoiceData.invoiceId}`);
    const unsubscribe = onValue(statusRef, (snap) => {
      const status = snap.val();
      if (status) {
        setInvoiceStatus(status);
      }
    });

    return () => unsubscribe();
  }, [invoiceData]);

  const amountInr = parseFloat(amountStr) || 0;
  const amountPaise = Math.round(amountInr * 100);
  const rate = priceData?.data?.rate ?? 0;
  const adaPreview = rate > 0 ? (amountInr / rate).toFixed(4) : '—';

  const handleKeypad = (key: string) => {
    if (key === 'DEL') {
      setAmountStr((p) => p.slice(0, -1));
    } else if (key === '.' && amountStr.includes('.')) {
      return;
    } else if (amountStr.length >= 7) {
      return;
    } else {
      setAmountStr((p) => p + key);
    }
  };

  const handleCreateInvoice = async () => {
    if (amountPaise < 100) return;
    setLoading(true);
    setError('');
    try {
      const res = await createInvoice({ amountPaise, description: description || undefined });
      if (res.success && res.data) setInvoiceData(res.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create invoice');
    } finally {
      setLoading(false);
    }
  };

  if (invoiceData && invoiceStatus === 'settled') {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center px-6 py-10 animate-fade-in text-center">
        <div className="w-full max-w-sm">
          {/* Stunning glowing tick mark container */}
          <div className="w-24 h-24 rounded-full bg-status-confirmed/10 border-2 border-status-confirmed/30 flex items-center justify-center mx-auto mb-6 shadow-[0_0_50px_-12px_rgba(16,185,129,0.3)] animate-bounce">
            <svg className="w-12 h-12 text-status-confirmed" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" className="checkmark-path" />
            </svg>
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight mb-2">Payment Settled!</h1>
          <p className="text-text-secondary text-sm mb-8">
            Your transaction has been validated on-chain and receipt generated.
          </p>

          <div className="card space-y-4 mb-8 bg-surface-card border border-surface-border text-left">
            <div className="border-b border-surface-border pb-4 text-center">
              <p className="text-text-secondary text-xs uppercase tracking-wider mb-1">Amount Settled</p>
              <p className="text-4xl font-extrabold text-teal-400">₹{(invoiceData.amountPaise / 100).toFixed(2)}</p>
              <p className="font-mono text-text-secondary text-sm mt-1">
                {(invoiceData.amountLovelace / 1_000_000).toFixed(4)} ADA
              </p>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-text-secondary">Invoice ID</span>
              <span className="font-mono text-xs text-text-primary">{invoiceData.invoiceId}</span>
            </div>
            
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary">Exchange Rate</span>
              <span className="text-text-primary">₹{invoiceData.adaInrRate.toFixed(2)} / ADA</span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-text-secondary">Network</span>
              <span className="text-text-primary font-medium">Cardano Preprod</span>
            </div>
          </div>

          <button
            id="checkout-complete-btn"
            onClick={() => {
              setInvoiceData(null);
              setAmountStr('');
              setDescription('');
            }}
            className="btn-primary w-full shadow-lg shadow-teal-600/20 active:scale-[0.98] transition-transform"
          >
            Complete Checkout
          </button>
        </div>
      </div>
    );
  }

  if (invoiceData) {
    const deepLink = `${window.location.origin}/customer/pay/${invoiceData.invoiceId}`;
    const isExpired = timeLeft === 0;

    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center px-6 py-10 animate-fade-in">
        <div className="w-full max-w-sm">
          <button onClick={() => setInvoiceData(null)} className="btn-ghost mb-6 flex items-center gap-2 -ml-2">
            <ArrowLeft size={18} /> New Request
          </button>

          <div className="card text-center mb-4">
            <p className="text-text-secondary text-sm mb-1">Amount</p>
            <p className="text-4xl font-bold">₹{(invoiceData.amountPaise / 100).toFixed(2)}</p>
            <p className="font-mono text-text-secondary text-sm mt-1">
              {(invoiceData.amountLovelace / 1_000_000).toFixed(4)} ADA
            </p>
          </div>

          <div className={`bg-white rounded-3xl p-6 flex items-center justify-center mb-4 transition-opacity duration-300 ${isExpired ? 'opacity-40' : ''}`}>
            <QRCode
              value={deepLink}
              size={220}
              level="M"
              bgColor="#ffffff"
              fgColor="#0f1117"
            />
          </div>

          <div className="card text-center mb-6">
            <p className="text-text-muted text-xs font-mono">{invoiceData.invoiceId}</p>
            <p className="text-text-secondary text-sm mt-1">
              {isExpired ? (
                <span className="text-red-400 font-semibold">QR Code Expired</span>
              ) : (
                <>
                  Expires in <span className="text-status-pending font-medium">{Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}</span>
                </>
              )}
            </p>
          </div>

          {/* Live status pill */}
          {invoiceStatus !== 'pending' && invoiceStatus !== 'settled' && (
            <div
              className={`flex items-center gap-2 justify-center px-4 py-2 rounded-2xl text-sm font-medium mb-4 animate-fade-in ${
                invoiceStatus === 'submitted'
                  ? 'bg-status-submitted/10 text-status-submitted border border-status-submitted/20'
                  : invoiceStatus === 'confirming'
                  ? 'bg-status-confirming/10 text-status-confirming border border-status-confirming/20'
                  : 'bg-status-confirmed/10 text-status-confirmed border border-status-confirmed/20'
              }`}
            >
              {invoiceStatus === 'submitted' ? (
                <Loader2 size={14} className="animate-spin" />
              ) : invoiceStatus === 'confirming' ? (
                <Clock size={14} className="animate-pulse" />
              ) : (
                <CheckCircle size={14} />
              )}
              <span>
                {invoiceStatus === 'submitted'
                  ? 'Payment broadcast — awaiting chain'
                  : invoiceStatus === 'confirming'
                  ? 'Confirming on Cardano...'
                  : `Status: ${invoiceStatus}`}
              </span>
            </div>
          )}

          <p className="text-text-muted text-xs text-center">
            {isExpired ? 'Please go back and generate a new checkout QR code.' : 'Customer scans the QR code with their ZeroPay app to pay'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col px-5 pt-14 pb-8">
      <button onClick={() => navigate(-1)} className="btn-ghost flex items-center gap-2 -ml-2 mb-8">
        <ArrowLeft size={18} /> Back
      </button>

      <h1 className="text-2xl font-bold mb-1">Counter Checkout</h1>
      <p className="text-text-secondary text-sm mb-8">Enter amount to generate a payment QR</p>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-3 mb-4 text-red-400 text-sm">{error}</div>
      )}

      {/* Amount display */}
      <div className="text-center mb-6">
        <p className="text-6xl font-bold">
          ₹{amountStr || '0'}
        </p>
        <p className="font-mono text-text-secondary mt-2">≈ {adaPreview} ADA</p>
        {rate > 0 && (
          <p className="text-text-muted text-xs mt-1">@ ₹{rate.toFixed(2)}/ADA</p>
        )}
      </div>

      {/* Quick amounts */}
      <div className="flex gap-2 justify-center flex-wrap mb-6">
        {QUICK_AMOUNTS.map((amt) => (
          <button
            key={amt}
            onClick={() => setAmountStr(String(amt))}
            className="px-3 py-1.5 rounded-full border border-surface-border text-sm text-text-secondary hover:border-teal-600 hover:text-teal-400 transition-colors"
          >
            ₹{amt}
          </button>
        ))}
      </div>

      {/* Description */}
      <input
        type="text"
        placeholder="Description (optional)"
        maxLength={100}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="input mb-6"
      />

      {/* Numpad */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        {['1','2','3','4','5','6','7','8','9','.','0','DEL'].map((key) => (
          <button
            key={key}
            onClick={() => handleKeypad(key)}
            className={`h-16 rounded-2xl font-semibold text-xl transition-all active:scale-95 ${
              key === 'DEL'
                ? 'bg-surface-elevated text-text-secondary text-base'
                : 'bg-surface-card border border-surface-border text-text-primary hover:border-teal-600'
            }`}
          >
            {key === 'DEL' ? '⌫' : key}
          </button>
        ))}
      </div>

      <button
        id="counter-create-btn"
        onClick={handleCreateInvoice}
        disabled={amountPaise < 100 || loading}
        className="btn-primary w-full"
      >
        {loading ? 'Generating QR...' : `Request ₹${amountStr || '0'}`}
      </button>
    </div>
  );
}
