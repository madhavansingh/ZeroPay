import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wallet, ExternalLink, CheckCircle, RefreshCw } from 'lucide-react';
import { bech32 } from 'bech32';
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
  if (hex.startsWith('addr') || hex.startsWith('stake')) return hex;
  try {
    const cleanHex = hex.trim();
    const bytes = Uint8Array.from(
      cleanHex.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16))
    );
    const networkId = bytes[0] & 0x0f; // 0 = testnet (preprod), 1 = mainnet
    const type = bytes[0] >> 4; // 14 or 15 = stake
    
    const isStake = type === 14 || type === 15;
    const prefix = isStake
      ? (networkId === 1 ? 'stake' : 'stake_test')
      : (networkId === 1 ? 'addr' : 'addr_test');
      
    const words = bech32.toWords(bytes);
    return bech32.encode(prefix, words, 1023);
  } catch (err) {
    console.error('Error converting address from hex to bech32:', err);
    throw new Error('Failed to parse Cardano address');
  }
}

export default function WalletConnectPage() {
  const [connecting, setConnecting] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { user, isAuthenticated, updateOnboardingStep, updateWallet, walletProvider } = useAuthStore();

  useEffect(() => {
    if (user?.onboardingStep === 'complete') {
      console.log('[WalletConnect] User onboarding already complete. Redirecting to home...');
      navigate('/', { replace: true });
    }
  }, [user?.onboardingStep, navigate]);

  useEffect(() => {
    // Auto-reconnect if previously approved AND user is authenticated
    if (isAuthenticated && walletProvider && window.cardano?.[walletProvider]) {
      console.log(`Auto-reconnecting to ${walletProvider} wallet for authenticated user...`);
      handleConnectWallet(walletProvider, true);
    }
  }, [walletProvider, isAuthenticated]);

  const handleConnectWallet = async (walletKey: string, silent = false) => {
    if (!silent) setConnecting(walletKey);
    setError('');
    try {
      const cardanoWallet = window.cardano?.[walletKey];
      if (!cardanoWallet) {
        if (!silent) {
          throw new Error(`${walletKey} is not installed. Please install it as a browser extension.`);
        }
        return;
      }

      const api = await cardanoWallet.enable();
      const usedAddresses = await api.getUsedAddresses();
      const hexAddress = usedAddresses[0] ?? (await api.getChangeAddress());

      if (!hexAddress) {
        if (!silent) throw new Error('Could not retrieve wallet address');
        return;
      }

      const address = bech32FromHex(hexAddress);

      if (address.startsWith('stake')) {
        throw new Error('Stake addresses are not supported. Please connect a wallet with a payment address.');
      }

      if (!address.startsWith('addr')) {
        throw new Error('Invalid payment address format.');
      }

      // Save to backend
      await connectWallet({ walletAddress: address });

      updateWallet(address, walletKey);
      updateOnboardingStep('wallet-complete');
      setWalletAddress(address);
      setConnected(true);
    } catch (err: unknown) {
      console.error('Wallet connect error:', err);
      if (!silent) {
        const msg = err instanceof Error ? err.message : 'Wallet connection failed';
        setError(msg);
      }
    } finally {
      if (!silent) setConnecting(null);
    }
  };

  const handleContinue = () => {
    navigate('/onboarding/shop');
  };

  if (connected) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-sm text-center animate-fade-in">
          <div className="w-20 h-20 rounded-full bg-teal-500/10 flex items-center justify-center mx-auto mb-6 shadow-[0_0_20px_rgba(20,169,154,0.2)]">
            <CheckCircle size={40} className="text-teal-400" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Wallet Connected!</h1>
          <p className="text-text-secondary mb-2 text-sm">
            Connected via <span className="text-teal-400 capitalize font-medium">{walletProvider}</span>
          </p>
          <div className="bg-surface-card border border-surface-border rounded-3xl p-4 mb-8">
            <p className="font-mono text-[11px] text-text-secondary break-all leading-relaxed">{walletAddress}</p>
          </div>
          <button id="wallet-continue-btn" onClick={handleContinue} className="btn-primary w-full">
            Continue to Shop Setup
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
          <div className="h-1 flex-1 rounded-full bg-teal-600 animate-pulse" />
          <div className="h-1 flex-1 rounded-full bg-surface-border" />
        </div>

        <div className="w-12 h-12 rounded-2xl bg-teal-600/10 flex items-center justify-center mb-6 shadow-[0_0_15px_rgba(20,169,154,0.1)]">
          <Wallet size={24} className="text-teal-400" />
        </div>

        <h1 className="text-3xl font-bold mb-2">Connect your wallet</h1>
        <p className="text-text-secondary mb-8">
          Payments go directly to your Cardano wallet. Your keys never leave your browser.
        </p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-3 mb-4 text-red-400 text-sm animate-fade-in">
            {error}
          </div>
        )}

        {/* Installed wallets first */}
        {installedWallets.length > 0 && (
          <>
            <p className="text-text-muted text-xs uppercase tracking-wider mb-3 font-semibold">Detected wallets</p>
            <div className="space-y-3 mb-6">
              {installedWallets.map((wallet) => (
                <button
                  key={wallet.key}
                  id={`connect-${wallet.key}-btn`}
                  onClick={() => handleConnectWallet(wallet.key)}
                  disabled={!!connecting}
                  className="w-full flex items-center justify-between px-5 py-4 rounded-3xl border border-surface-border bg-surface-card hover:border-teal-500/50 hover:bg-teal-950/10 transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  <span className="font-semibold text-text-primary">{wallet.name}</span>
                  {connecting === wallet.key ? (
                    <RefreshCw size={16} className="animate-spin text-teal-400" />
                  ) : (
                    <span className="text-teal-400 text-sm font-medium">Connect →</span>
                  )}
                </button>
              ))}
            </div>
          </>
        )}

        {/* Other wallets */}
        {notInstalledWallets.length > 0 && (
          <>
            <p className="text-text-muted text-xs uppercase tracking-wider mb-3 font-semibold">Other wallets</p>
            <div className="grid grid-cols-2 gap-2">
              {notInstalledWallets.map((wallet) => (
                <div
                  key={wallet.key}
                  className="flex items-center justify-between px-4 py-3 rounded-2xl border border-surface-border bg-surface-card/40 opacity-40"
                >
                  <span className="text-xs text-text-secondary">{wallet.name}</span>
                  <span className="text-[10px] text-text-muted">Missing</span>
                </div>
              ))}
            </div>
          </>
        )}

        {installedWallets.length === 0 && (
          <div className="text-center py-8">
            <p className="text-text-secondary mb-4 text-sm">No Cardano browser extension wallets detected.</p>
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

        <p className="text-text-muted text-xs text-center mt-8">
          Your private keys are never shared with ZeroPay.
        </p>
      </div>
    </div>
  );
}
