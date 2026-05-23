import { useNavigate } from 'react-router-dom';
import { CreditCard, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';

interface Props {
  payload: {
    invoiceId: string;
    merchantId: string;
    shopName: string;
    amountPaise: number;
    amountLovelace: number;
    adaInrRate: number;
    description?: string | null;
    expiresAt: string;
  };
}

export default function PaymentRequestBubble({ payload }: Props) {
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    const update = () => {
      const left = Math.max(0, Math.floor((new Date(payload.expiresAt).getTime() - Date.now()) / 1000));
      setTimeLeft(left);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [payload.expiresAt]);

  const isExpired = timeLeft === 0;
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="flex justify-center my-2">
      <div className={`w-full max-w-xs rounded-3xl border transition-all ${
        isExpired ? 'border-surface-border bg-surface-card opacity-60' : 'border-teal-600/30 bg-teal-600/5'
      }`}>
        <div className="px-4 pt-4 pb-3">
          <div className="flex items-center gap-2 mb-3">
            <CreditCard size={16} className={isExpired ? 'text-text-muted' : 'text-teal-400'} />
            <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
              Payment Request
            </span>
          </div>

          <p className="text-2xl font-bold mb-0.5">₹{(payload.amountPaise / 100).toFixed(2)}</p>
          <p className="font-mono text-text-secondary text-xs">
            {(payload.amountLovelace / 1_000_000).toFixed(4)} ADA
          </p>

          {payload.description && (
            <p className="text-text-secondary text-sm mt-2">{payload.description}</p>
          )}

          <div className="flex items-center gap-1.5 mt-3">
            <Clock size={12} className={isExpired ? 'text-text-muted' : 'text-status-pending'} />
            <span className={`text-xs ${isExpired ? 'text-text-muted' : 'text-status-pending'}`}>
              {isExpired ? 'Expired' : `Expires in ${minutes}:${String(seconds).padStart(2, '0')}`}
            </span>
          </div>
        </div>

        {!isExpired && (
          <button
            id={`pay-btn-${payload.invoiceId}`}
            onClick={() => navigate(`/customer/pay/${payload.invoiceId}`)}
            className="w-full bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white font-semibold py-3 rounded-b-3xl transition-colors text-sm"
          >
            Pay Now →
          </button>
        )}
      </div>
    </div>
  );
}
