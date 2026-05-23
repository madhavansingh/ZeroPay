import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, MessageSquare } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { updateProfile } from '../../services/api';
import { User } from '@zeropay/shared-types';

export default function RoleSelectPage() {
  const [selected, setSelected] = useState<'customer' | 'merchant' | null>(null);
  const [loading, setLoading] = useState(false);
  const { user, setUser, updateOnboardingStep } = useAuthStore();
  const navigate = useNavigate();

  const handleContinue = async () => {
    if (!selected) return;
    setLoading(true);
    try {
      // Update role in backend (via profile update — role logic handled server-side)
      // For now update locally and direct to correct onboarding
      if (selected === 'merchant') {
        navigate('/onboarding/shop');
      } else {
        updateOnboardingStep('complete');
        navigate('/customer/chats');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm animate-slide-up">
        <h1 className="text-3xl font-bold mb-2">How will you use ZeroPay?</h1>
        <p className="text-text-secondary mb-8">You can change this later in settings.</p>

        <div className="space-y-3 mb-8">
          {/* Merchant option */}
          <button
            id="role-merchant-btn"
            onClick={() => setSelected('merchant')}
            className={`w-full p-5 rounded-3xl border-2 transition-all text-left ${
              selected === 'merchant'
                ? 'border-teal-600 bg-teal-600/10'
                : 'border-surface-border bg-surface-card hover:border-surface-elevated'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                selected === 'merchant' ? 'bg-teal-600' : 'bg-surface-elevated'
              }`}>
                <ShoppingBag size={22} className={selected === 'merchant' ? 'text-white' : 'text-text-secondary'} />
              </div>
              <div>
                <p className="font-semibold text-text-primary">I'm a Merchant</p>
                <p className="text-text-secondary text-sm">Accept ADA payments at my shop</p>
              </div>
            </div>
          </button>

          {/* Customer option */}
          <button
            id="role-customer-btn"
            onClick={() => setSelected('customer')}
            className={`w-full p-5 rounded-3xl border-2 transition-all text-left ${
              selected === 'customer'
                ? 'border-teal-600 bg-teal-600/10'
                : 'border-surface-border bg-surface-card hover:border-surface-elevated'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                selected === 'customer' ? 'bg-teal-600' : 'bg-surface-elevated'
              }`}>
                <MessageSquare size={22} className={selected === 'customer' ? 'text-white' : 'text-text-secondary'} />
              </div>
              <div>
                <p className="font-semibold text-text-primary">I'm a Customer</p>
                <p className="text-text-secondary text-sm">Pay merchants with my Cardano wallet</p>
              </div>
            </div>
          </button>
        </div>

        <button
          id="role-continue-btn"
          onClick={handleContinue}
          disabled={!selected || loading}
          className="btn-primary w-full"
        >
          {loading ? 'Setting up...' : 'Continue'}
        </button>
      </div>
    </div>
  );
}
