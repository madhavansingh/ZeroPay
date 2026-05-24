import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { onboardMerchant } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';

const CATEGORIES = [
  { value: 'food', label: '🍱 Food & Beverages' },
  { value: 'retail', label: '🛍️ Retail' },
  { value: 'services', label: '⚙️ Services' },
  { value: 'vendor', label: '🚐 Street Vendor' },
  { value: 'other', label: '📦 Other' },
] as const;

type Category = 'food' | 'retail' | 'services' | 'vendor' | 'other';

export default function ShopSetupPage() {
  const [shopName, setShopName] = useState('');
  const [category, setCategory] = useState<Category | ''>('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { user, walletProvider, updateOnboardingStep } = useAuthStore();
  useEffect(() => {
    if (user?.onboardingStep === 'complete') {
      console.log('[ShopSetup] User onboarding already complete. Redirecting to home...');
      navigate('/', { replace: true });
      return;
    }
    if (user && !user.walletAddress) {
      alert("Please connect a wallet before continuing");
      navigate('/onboarding/wallet', { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async () => {
    if (!shopName.trim() || !category) return;
    if (!user?.walletAddress || !walletProvider) {
      setError('Cardano wallet is not connected. Please connect a wallet first.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await onboardMerchant({ 
        shopName: shopName.trim(), 
        category, 
        description: description.trim() || undefined,
        walletAddress: user.walletAddress,
        walletProvider: walletProvider,
      });
      updateOnboardingStep('complete');
      navigate('/merchant/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Setup failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center px-6 py-10">
      <div className="w-full max-w-sm animate-slide-up">
        {/* Step indicator */}
        <div className="flex gap-2 mb-8">
          <div className="h-1 flex-1 rounded-full bg-teal-600" />
          <div className="h-1 flex-1 rounded-full bg-teal-600 animate-pulse" />
        </div>

        <h1 className="text-3xl font-bold mb-2">Set up your shop</h1>
        <p className="text-text-secondary mb-8">Customers will see this when they scan your QR code.</p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-3 mb-4 text-red-400 text-sm">{error}</div>
        )}

        <div className="space-y-4">
          <div>
            <label className="text-sm text-text-secondary mb-1.5 block">Shop name *</label>
            <input
              id="shop-name-input"
              type="text"
              placeholder="Meena's Tiffin Centre"
              maxLength={50}
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              className="input"
              autoFocus
            />
          </div>

          <div>
            <label className="text-sm text-text-secondary mb-1.5 block">Category *</label>
            <div className="grid grid-cols-1 gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  id={`cat-${cat.value}`}
                  onClick={() => setCategory(cat.value)}
                  className={`text-left px-4 py-3 rounded-2xl border transition-all text-sm font-medium ${
                    category === cat.value
                      ? 'border-teal-600 bg-teal-600/10 text-text-primary'
                      : 'border-surface-border bg-surface-card text-text-secondary hover:border-surface-elevated'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm text-text-secondary mb-1.5 block">Description <span className="text-text-muted">(optional)</span></label>
            <input
              id="shop-desc-input"
              type="text"
              placeholder="Fresh homemade food, daily specials"
              maxLength={200}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input"
            />
          </div>
        </div>

        <button
          id="shop-continue-btn"
          onClick={handleSubmit}
          disabled={!shopName.trim() || !category || loading}
          className="btn-primary w-full mt-8"
        >
          {loading ? 'Creating shop...' : 'Continue'}
        </button>
      </div>
    </div>
  );
}
