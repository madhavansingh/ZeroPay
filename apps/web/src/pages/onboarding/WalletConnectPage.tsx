import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wallet, ExternalLink, CheckCircle } from 'lucide-react';
import { connectWallet } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';

const SUPPORTED_WALLETS = [
  { key: 'eternl', name: 'Eternl' },
  { key: 'lace', name: 'Lace' },
  { key: 'nami', name: 'Nami' },
  { key: 'flint', name: 'Flint' },
  { key: 'vespr', name: 'Vespr' },
  { key: 'begin', name: 'Begin' },
] as const;

// CIP-30 type
interface CardanoApi {
  getUsedAddresses(): Promise<string[]>;
  getChangeAddress(): Promise<string>;
  getBalance(): Promise<string>;
  signTx(tx: string, partialSign?: boolean): Promise<string>;
  submitTx(tx: string): Promise<string>;
}

declare global {
  interface Window {
    cardano?: Record<string, { enable: () => Promise<CardanoApi>; name?: string } | undefined>;
  }
}

function bech32FromHex(hex: string): string {
  // CIP-30 wallets return hex-encoded addresses; some return bech32 directly
  // If it starts with 'addr', it's bech32 already
  if (hex.startsWith('addr')) return hex;
  // Otherwise return as-is (frontend just stores it, backend validates)
  return hex;
}

export default function WalletConnectPage() {
  const [connecting, setConnecting] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { updateOnboardingStep, updateWallet } = useAuthStore();

  const handleConnectWallet = async (walletKey: string) => {
    setConnecting(walletKey);
    setError('');
    try {
      const cardanoWallet = window.cardano?.[walletKey];
      if (!cardanoWallet) {
        throw new Error(`${walletKey} is not installed. Please install it as a browser extension.`);
      }

      const api = await cardanoWallet.enable();
      const usedAddresses = await api.getUsedAddresses();
      const hexAddress = usedAddresses[0] ?? (await api.getChangeAddress());

      if (!hexAddress) throw new Error('Could not retrieve wallet address');

      const address = bech32FromHex(hexAddress);

      // Save to backend
      await connectWallet({ walletAddress: address });

      updateWallet(address);
      updateOnboardingStep('wallet-complete');
      setWalletAddress(address);
      setConnected(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Wallet connection failed';
      setError(msg);
    } finally {
      setConnecting(null);
    }
  };

  const handleContinue = () => {
    updateOnboardingStep('complete');
    navigate('/merchant/dashboard');
  };

  if (connected) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-sm text-center animate-fade-in">
          <div className="w-20 h-20 rounded-full bg-status-confirmed/10 flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={40} className="text-status-confirmed" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Wallet Connected!</h1>
          <p className="text-text-secondary mb-2 text-sm">Your payment address:</p>
          <div className="bg-surface-card border border-surface-border rounded-2xl p-3 mb-8">
            <p className="font-mono text-xs text-text-secondary break-all">{walletAddress}</p>
          </div>
          <button id="wallet-continue-btn" onClick={handleContinue} className="btn-primary w-full">
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const installedWallets = SUPPORTED_WALLETS.filter((w) => !!window.cardano?.[w.key]);
  const notInstalledWallets = SUPPORTED_WALLETS.filter((w) => !window.cardano?.[w.key]);

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center px-6 py-10">
      <div className="w-full max-w-sm animate-slide-up">
        {/* Step indicator */}
        <div className="flex gap-2 mb-8">
          <div className="h-1 flex-1 rounded-full bg-teal-600" />
          <div className="h-1 flex-1 rounded-full bg-teal-600" />
        </div>

        <div className="w-12 h-12 rounded-2xl bg-teal-600/10 flex items-center justify-center mb-6">
          <Wallet size={24} className="text-teal-400" />
        </div>

        <h1 className="text-3xl font-bold mb-2">Connect your wallet</h1>
        <p className="text-text-secondary mb-8">
          Payments go directly to your Cardano wallet. Your keys never leave your browser.
        </p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-3 mb-4 text-red-400 text-sm">{error}</div>
        )}

        {/* Installed wallets first */}
        {installedWallets.length > 0 && (
          <>
            <p className="text-text-muted text-xs uppercase tracking-wider mb-2">Detected wallets</p>
            <div className="space-y-3 mb-4">
              {installedWallets.map((wallet) => (
                <button
                  key={wallet.key}
                  id={`connect-${wallet.key}-btn`}
                  onClick={() => handleConnectWallet(wallet.key)}
                  disabled={!!connecting}
                  className="w-full flex items-center justify-between px-4 py-4 rounded-2xl border border-teal-600/40 bg-teal-600/5 hover:bg-teal-600/10 transition-all disabled:opacity-50"
                >
                  <span className="font-medium text-text-primary">{wallet.name}</span>
                  {connecting === wallet.key ? (
                    <span className="w-5 h-5 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span className="text-teal-400 text-sm">Connect →</span>
                  )}
                </button>
              ))}
            </div>
          </>
        )}

        {/* Other wallets */}
        {notInstalledWallets.length > 0 && (
          <>
            <p className="text-text-muted text-xs uppercase tracking-wider mb-2">Other wallets</p>
            <div className="space-y-2">
              {notInstalledWallets.map((wallet) => (
                <div
                  key={wallet.key}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-2xl border border-surface-border bg-surface-card opacity-50"
                >
                  <span className="text-sm text-text-secondary">{wallet.name}</span>
                  <span className="text-text-muted text-xs">Not installed</span>
                </div>
              ))}
            </div>
          </>
        )}

        {installedWallets.length === 0 && (
          <div className="text-center py-6">
            <p className="text-text-secondary mb-4">No Cardano wallets detected.</p>
            <a
              href="https://eternl.io"
              target="_blank"
              rel="noreferrer"
              className="btn-primary inline-flex items-center gap-2"
            >
              <ExternalLink size={16} />
              Install Eternl Wallet
            </a>
          </div>
        )}

        <p className="text-text-muted text-xs text-center mt-6">
          Your private keys are never shared with ZeroPay.
        </p>
      </div>
    </div>
  );
}
