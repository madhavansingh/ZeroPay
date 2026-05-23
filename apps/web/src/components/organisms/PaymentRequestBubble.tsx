import { useNavigate } from 'react-router-dom';
import { CreditCard, Clock, Loader } from 'lucide-react';
import { useState, useEffect } from 'react';
import { database } from '../../services/firebase';
import { ref, onValue } from 'firebase/database';

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
  const [status, setStatus] = useState<string>('pending');

  useEffect(() => {
    const update = () => {
      const left = Math.max(0, Math.floor((new Date(payload.expiresAt).getTime() - Date.now()) / 1000));
      setTimeLeft(left);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [payload.expiresAt]);

  useEffect(() => {
    const statusRef = ref(database, `/invoices/${payload.invoiceId}`);
    const unsubscribe = onValue(statusRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setStatus(data as string);
      }
    });
    return () => unsubscribe();
  }, [payload.invoiceId]);

  const isExpired = timeLeft === 0;
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  const renderFooter = () => {
    if (status === 'pending') {
      if (isExpired) return null;
      return (
        <button
          id={`pay-btn-${payload.invoiceId}`}
          onClick={() => navigate(`/customer/pay/${payload.invoiceId}`)}
          className="w-full bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white font-semibold py-3 rounded-b-3xl transition-colors text-sm"
        >
          Pay Now →
        </button>
      );
    }

    if (status === 'submitted' || status === 'confirming') {
      return (
        <div className="w-full flex items-center justify-center gap-2 bg-teal-600/10 text-teal-400 font-semibold py-3 rounded-b-3xl border-t border-teal-500/20 text-xs cursor-not-allowed">
          <Loader size={14} className="animate-spin" />
          Confirming Payment...
        </div>
      );
    }

    if (status === 'confirmed' || status === 'settled') {
      return (
        <div className="w-full flex items-center justify-center gap-1.5 bg-status-settled/10 text-status-settled font-semibold py-3 rounded-b-3xl border-t border-status-settled/20 text-xs cursor-not-allowed">
          ✓ Paid & Confirmed
        </div>
      );
    }

    return (
      <div className="w-full flex items-center justify-center bg-surface-card text-text-muted font-semibold py-3 rounded-b-3xl border-t border-surface-border text-xs cursor-not-allowed">
        Expired/Failed
      </div>
    );
  };

  return (
    <div className="flex justify-center my-2">
      <div className={`w-full max-w-xs rounded-3xl border transition-all ${
        isExpired && status === 'pending' ? 'border-surface-border bg-surface-card opacity-60' : 'border-teal-600/30 bg-teal-600/5'
      }`}>
        <div className="px-4 pt-4 pb-3">
          <div className="flex items-center gap-2 mb-3">
            <CreditCard size={16} className={isExpired && status === 'pending' ? 'text-text-muted' : 'text-teal-400'} />
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

          {status === 'pending' && (
            <div className="flex items-center gap-1.5 mt-3">
              <Clock size={12} className={isExpired ? 'text-text-muted' : 'text-status-pending'} />
              <span className={`text-xs ${isExpired ? 'text-text-muted' : 'text-status-pending'}`}>
                {isExpired ? 'Expired' : `Expires in ${minutes}:${String(seconds).padStart(2, '0')}`}
              </span>
            </div>
          )}
        </div>

        {renderFooter()}
      </div>
    </div>
  );
}
