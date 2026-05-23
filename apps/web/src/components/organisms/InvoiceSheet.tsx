import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { createInvoice, getAdaInrRate } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import { useQueryClient } from '@tanstack/react-query';

interface Props {
  onClose: () => void;
  chatRoomId?: string;
  customerId?: string;
}

const QUICK_AMOUNTS = [50, 100, 200, 500, 1000, 2000];

export default function InvoiceSheet({ onClose, chatRoomId, customerId }: Props) {
  const [amountStr, setAmountStr] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [rate, setRate] = useState(0);
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    getAdaInrRate().then((r) => setRate(r.data?.rate ?? 0)).catch(() => {});
  }, []);

  const amountInr = parseFloat(amountStr) || 0;
  const amountPaise = Math.round(amountInr * 100);
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

  const handleCreate = async () => {
    if (amountPaise < 100) return;
    setLoading(true);
    setError('');
    try {
      const res = await createInvoice({
        amountPaise,
        description: description.trim() || undefined,
        chatRoomId,
        customerId,
      });
      if (res.success) {
        queryClient.invalidateQueries({ queryKey: ['merchant-dashboard'] });
        queryClient.invalidateQueries({ queryKey: ['merchant-invoices'] });
        onClose();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create invoice');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Sheet */}
      <div className="absolute bottom-0 inset-x-0 bg-surface-card rounded-t-3xl px-5 pt-4 pb-10 animate-slide-up">
        {/* Handle */}
        <div className="w-10 h-1 rounded-full bg-surface-border mx-auto mb-6" />

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Create Payment Request</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-surface-elevated transition-colors">
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-3 mb-4 text-red-400 text-sm">{error}</div>
        )}

        {/* Amount display */}
        <div className="text-center mb-4">
          <p className="text-5xl font-bold">₹{amountStr || '0'}</p>
          <p className="font-mono text-text-secondary mt-1.5">≈ {adaPreview} ADA</p>
        </div>

        {/* Quick amounts */}
        <div className="flex gap-2 justify-center flex-wrap mb-4">
          {QUICK_AMOUNTS.map((amt) => (
            <button
              key={amt}
              onClick={() => setAmountStr(String(amt))}
              className="px-3 py-1 rounded-full border border-surface-border text-sm text-text-secondary hover:border-teal-600 hover:text-teal-400 transition-colors"
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
          className="input mb-4"
        />

        {/* Numpad */}
        <div className="grid grid-cols-3 gap-2.5 mb-5">
          {['1','2','3','4','5','6','7','8','9','.','0','DEL'].map((key) => (
            <button
              key={key}
              onClick={() => handleKeypad(key)}
              className={`h-14 rounded-2xl font-semibold text-lg transition-all active:scale-95 ${
                key === 'DEL'
                  ? 'bg-surface-elevated text-text-secondary text-sm'
                  : 'bg-surface-elevated border border-surface-border text-text-primary'
              }`}
            >
              {key === 'DEL' ? '⌫' : key}
            </button>
          ))}
        </div>

        <button
          id="invoice-sheet-create-btn"
          onClick={handleCreate}
          disabled={amountPaise < 100 || loading}
          className="btn-primary w-full"
        >
          {loading ? 'Sending request...' : `Request ₹${amountStr || '0'}`}
        </button>
      </div>
    </div>
  );
}
