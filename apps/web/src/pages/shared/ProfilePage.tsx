import { useNavigate } from 'react-router-dom';
import { User, LogOut, ChevronRight, Wallet, Store } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useAuth } from '../../hooks/useAuth';

export default function ProfilePage() {
  const { user } = useAuthStore();
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/auth');
  };

  const isMerchant = user?.role === 'merchant' || user?.role === 'both';

  return (
    <div className="min-h-screen bg-surface px-5 pt-14 pb-10">
      {/* Avatar */}
      <div className="flex flex-col items-center mb-10">
        <div className="w-20 h-20 rounded-full bg-teal-600/10 border-2 border-teal-600/30 flex items-center justify-center mb-4">
          <User size={32} className="text-teal-400" />
        </div>
        <h1 className="text-xl font-bold">{user?.displayName ?? 'ZeroPay User'}</h1>
        <p className="text-text-secondary text-sm mt-0.5">{user?.phone}</p>
        <div className="mt-2 px-3 py-1 rounded-full bg-surface-card border border-surface-border text-text-secondary text-xs capitalize">
          {user?.role === 'both' ? 'Merchant & Customer' : user?.role}
        </div>
      </div>

      {/* Menu sections */}
      <div className="space-y-3">
        {/* Wallet */}
        <div className="card space-y-1">
          <p className="text-text-muted text-xs uppercase tracking-wider mb-3">Wallet</p>
          {user?.walletAddress ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Wallet size={18} className="text-teal-400" />
                <div>
                  <p className="text-sm font-medium">Connected</p>
                  <p className="font-mono text-xs text-text-muted">
                    {user.walletAddress.slice(0, 16)}...{user.walletAddress.slice(-6)}
                  </p>
                </div>
              </div>
              <button
                id="change-wallet-btn"
                onClick={() => navigate('/onboarding/wallet')}
                className="text-teal-400 text-xs hover:text-teal-300"
              >
                Change
              </button>
            </div>
          ) : (
            <button
              id="connect-wallet-profile-btn"
              onClick={() => navigate('/onboarding/wallet')}
              className="flex items-center gap-3 w-full"
            >
              <Wallet size={18} className="text-text-muted" />
              <span className="text-sm text-text-secondary">Connect Wallet</span>
              <ChevronRight size={16} className="ml-auto text-text-muted" />
            </button>
          )}
        </div>

        {/* Merchant settings */}
        {isMerchant && (
          <div className="card">
            <p className="text-text-muted text-xs uppercase tracking-wider mb-3">Merchant</p>
            <button
              id="counter-checkout-btn"
              onClick={() => navigate('/merchant/checkout')}
              className="flex items-center gap-3 w-full"
            >
              <Store size={18} className="text-teal-400" />
              <span className="text-sm">Counter Checkout</span>
              <ChevronRight size={16} className="ml-auto text-text-muted" />
            </button>
          </div>
        )}

        {/* Logout */}
        <div className="card">
          <button
            id="logout-btn"
            onClick={handleLogout}
            className="flex items-center gap-3 w-full text-red-400 hover:text-red-300 transition-colors"
          >
            <LogOut size={18} />
            <span className="text-sm font-medium">Sign Out</span>
          </button>
        </div>
      </div>

      {/* Version */}
      <p className="text-text-muted text-xs text-center mt-10">
        ZeroPay v1.0.0 · Cardano Preprod
      </p>
    </div>
  );
}
