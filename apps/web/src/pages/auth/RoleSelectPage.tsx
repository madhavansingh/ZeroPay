import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, MessageSquare } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { updateRoleAndStep } from '../../services/api';
import { User } from '@zeropay/shared-types';

export default function RoleSelectPage() {
  const [selected, setSelected] = useState<'customer' | 'merchant' | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, setUser, updateOnboardingStep, updateRole } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.onboardingStep === 'complete') {
      console.log('[RoleSelect] User onboarding already complete. Redirecting to home...');
      navigate('/', { replace: true });
    }
  }, [user?.onboardingStep, navigate]);

  const handleContinue = async () => {
    if (!selected) return;
    setLoading(true);
    setError(null);
    try {
      if (selected === 'merchant') {
        const response = await updateRoleAndStep({ role: 'merchant', onboardingStep: 'role-selected' });
        if (response.success && response.data) {
          setUser(response.data);
        }
        updateRole('merchant');
        updateOnboardingStep('role-selected');
        if (user?.walletAddress) {
          navigate('/onboarding/shop');
        } else {
          navigate('/onboarding/wallet');
        }
      } else {
        const response = await updateRoleAndStep({ role: 'customer', onboardingStep: 'complete' });
        if (response.success && response.data) {
          setUser(response.data);
        }
        updateRole('customer');
        updateOnboardingStep('complete');
        navigate('/customer/chats');
      }
    } catch (err: unknown) {
      console.error('Failed to update role:', err);
      setError(err instanceof Error ? err.message : 'Failed to save role. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm animate-slide-up">
        <h1 className="text-3xl font-bold mb-2">How will you use ZeroPay?</h1>
        <p className="text-text-secondary mb-8">You can change this later in settings.</p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-3 mb-4 text-red-400 text-sm animate-fade-in">
            {error}
          </div>
        )}

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
