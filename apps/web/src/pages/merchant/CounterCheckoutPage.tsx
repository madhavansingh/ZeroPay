import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import QRCode from 'react-qr-code';
import { createInvoice, getAdaInrRate } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import { useQuery } from '@tanstack/react-query';

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

  const navigate = useNavigate();
  const { user } = useAuthStore();

  const { data: priceData } = useQuery({
    queryKey: ['ada-inr-rate'],
    queryFn: () => getAdaInrRate(),
    refetchInterval: 60_000,
  });

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

  if (invoiceData) {
    const deepLink = `${window.location.origin}/customer/pay/${invoiceData.invoiceId}`;
    const timeLeft = Math.max(0, Math.floor((new Date(invoiceData.expiresAt).getTime() - Date.now()) / 1000));

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

          <div className="bg-white rounded-3xl p-6 flex items-center justify-center mb-4">
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
              Expires in <span className="text-status-pending font-medium">{Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}</span>
            </p>
          </div>

          <p className="text-text-muted text-xs text-center">
            Customer scans the QR code with their ZeroPay app to pay
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
