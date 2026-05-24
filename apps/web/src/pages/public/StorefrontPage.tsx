import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Globe,
  MapPin,
  Clock,
  Instagram,
  Twitter,
  ExternalLink,
  MessageSquare,
  Star,
  CheckCircle,
  AlertCircle,
  Loader2,
  Box,
  Wallet,
  ArrowUpRight,
  ShoppingBag,
  X,
} from 'lucide-react';
import {
  getStorefrontPublic,
  getStorefrontCatalog,
  getReputationBySlug,
  buyProduct,
  submitEscrowLock,
  createChatRoom,
} from '../../services/api';
import { bech32 } from 'bech32';

// CIP-30 wallet helper
interface CardanoApi {
  getUsedAddresses(): Promise<string[]>;
  getChangeAddress(): Promise<string>;
  signTx(tx: string, partialSign?: boolean): Promise<string>;
  submitTx(tx: string): Promise<string>;
}

const SUPPORTED_WALLETS = [
  { key: 'eternl', name: 'Eternl' },
  { key: 'lace', name: 'Lace' },
  { key: 'nami', name: 'Nami' },
  { key: 'flint', name: 'Flint' },
  { key: 'vespr', name: 'Vespr' },
  { key: 'begin', name: 'Begin' },
];

function bech32FromHex(hex: string): string {
  if (hex.startsWith('addr') || hex.startsWith('stake')) return hex;
  try {
    const bytes = Uint8Array.from(hex.trim().match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16)));
    const networkId = bytes[0] & 0x0f;
    const type = bytes[0] >> 4;
    const isStake = type === 14 || type === 15;
    const prefix = isStake
      ? networkId === 1 ? 'stake' : 'stake_test'
      : networkId === 1 ? 'addr' : 'addr_test';
    const words = bech32.toWords(bytes);
    return bech32.encode(prefix, words, 1023);
  } catch (err) {
    throw new Error('Failed to parse Cardano address');
  }
}

export default function StorefrontPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'catalog' | 'reviews'>('catalog');

  // Checkout modal states
  const [checkoutProduct, setCheckoutProduct] = useState<any | null>(null);
  const [checkoutStep, setCheckoutStep] = useState<'wallet_select' | 'signing' | 'success' | 'error'>('wallet_select');
  const [errorMsg, setErrorMsg] = useState('');
  const [txHash, setTxHash] = useState('');

  // Fetch Public Profile (updates view counter automatically on fetch)
  const { data: profileRes, isLoading: isProfileLoading } = useQuery({
    queryKey: ['public-storefront', slug],
    queryFn: () => getStorefrontPublic(slug!),
    enabled: !!slug,
  });

  const merchant = profileRes?.data as any;

  // Fetch Catalog
  const { data: catalogRes, isLoading: isCatalogLoading } = useQuery({
    queryKey: ['storefront-catalog', slug],
    queryFn: () => getStorefrontCatalog(slug!),
    enabled: !!slug,
  });

  const products: any[] = (catalogRes?.data as any) || [];

  // Fetch Trust & Review Metrics
  const { data: reputationRes } = useQuery({
    queryKey: ['storefront-reputation', slug],
    queryFn: () => getReputationBySlug(slug!),
    enabled: !!slug,
  });

  const reviewsSummary = (reputationRes?.data as any)?.reviews || { average: 0, count: 0 };

  const handleStartChat = async () => {
    if (!merchant) return;
    try {
      const res = await createChatRoom({ merchantStringId: merchant.merchantId });
      if (res.success && res.data?.roomId) {
        navigate(`/customer/chats/${res.data.roomId}`);
      }
    } catch (err) {
      alert('Must be logged in to chat with merchant');
    }
  };

  const handleBuyClick = (product: any) => {
    setCheckoutProduct(product);
    setCheckoutStep('wallet_select');
    setErrorMsg('');
    setTxHash('');
  };

  const handleWalletSelect = async (walletKey: string) => {
    if (!checkoutProduct) return;
    setCheckoutStep('signing');
    setErrorMsg('');

    try {
      if (!window.cardano?.[walletKey]) {
        throw new Error(`${walletKey.toUpperCase()} wallet is not installed in your browser.`);
      }

      // 1. Enable Wallet
      const api: CardanoApi = await window.cardano[walletKey]!.enable();

      // 2. Fetch bech32 change address
      const usedAddresses = await api.getUsedAddresses();
      const hexAddress = usedAddresses[0] ?? (await api.getChangeAddress());
      if (!hexAddress) throw new Error('Could not retrieve address from wallet');
      const changeAddress = bech32FromHex(hexAddress);

      // 3. Initiate one-click buy
      const buyRes: any = await buyProduct(checkoutProduct._id, { customerAddress: changeAddress });
      if (!buyRes.success || !buyRes.data) {
        throw new Error(buyRes.error || 'Failed to initialize smart contract checkout');
      }

      const { invoice, lockTx } = buyRes.data;

      // 4. Sign CBOR using wallet keys
      const signedTx = await api.signTx(lockTx.unsignedCbor, true);

      // 5. Submit transaction on-chain
      const hash = await api.submitTx(signedTx);
      setTxHash(hash);

      // 6. Submit tx locking hash to backend to schedule transaction polling
      await submitEscrowLock(invoice.invoiceId, hash, changeAddress);

      setCheckoutStep('success');
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || String(err));
      setCheckoutStep('error');
    }
  };

  if (isProfileLoading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <Loader2 size={36} className="text-teal-500 animate-spin" />
      </div>
    );
  }

  if (!merchant) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-6 text-center space-y-4">
        <AlertCircle size={44} className="text-status-failed" />
        <h2 className="text-base font-bold">Storefront Not Found</h2>
        <p className="text-xs text-text-secondary">
          The requested URL slug does not exist or has been disabled by the merchant.
        </p>
        <button onClick={() => navigate('/')} className="btn-primary text-xs py-2 px-6">
          Go Home
        </button>
      </div>
    );
  }

  const verifiedBadgeColor = merchant.verifiedMerchantBadge
    ? 'bg-teal-500/10 text-teal-400 border-teal-500/20'
    : 'bg-surface-border text-text-muted border-transparent';

  const tierColors: Record<string, string> = {
    platinum: 'from-emerald-500/20 to-teal-500/20 text-emerald-400 border-emerald-500/30',
    gold: 'from-amber-500/20 to-yellow-500/20 text-amber-400 border-amber-500/30',
    silver: 'from-slate-500/20 to-gray-500/20 text-slate-400 border-slate-500/30',
    unrated: 'from-transparent to-transparent text-text-muted border-surface-border',
  };

  return (
    <div className="min-h-screen bg-surface pb-28 text-text-primary">
      {/* Banner */}
      <div className="relative h-44 bg-gradient-to-r from-teal-900 to-indigo-950 border-b border-surface-border overflow-hidden">
        {merchant.bannerImageUrl && (
          <img src={merchant.bannerImageUrl} alt="Banner" className="w-full h-full object-cover opacity-70" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-black/30" />
      </div>

      {/* Profile info overlay */}
      <div className="px-5 -mt-10 relative space-y-4 max-w-xl mx-auto">
        <div className="flex items-end justify-between">
          <div className="w-20 h-20 rounded-full border-4 border-surface bg-surface-card overflow-hidden flex items-center justify-center flex-shrink-0 shadow-xl">
            {merchant.profileImageUrl ? (
              <img src={merchant.profileImageUrl} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <Globe size={28} className="text-text-secondary" />
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleStartChat}
              className="p-2.5 rounded-xl btn-secondary flex items-center justify-center"
              title="Chat with Merchant"
            >
              <MessageSquare size={16} />
            </button>
          </div>
        </div>

        {/* Merchant metadata */}
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl font-bold">{merchant.shopName}</h1>
            {merchant.verifiedMerchantBadge && (
              <span className={`text-[9px] uppercase font-extrabold tracking-wider border px-2 py-0.5 rounded-full ${verifiedBadgeColor}`}>
                Verified Partner
              </span>
            )}
          </div>
          <p className="text-xs text-text-secondary pr-6 leading-relaxed">
            {merchant.description || 'Welcome to our verified programmable commerce storefront.'}
          </p>
        </div>

        {/* trust metric tags */}
        <div className="flex gap-2 flex-wrap pt-1.5">
          <span className={`badge border bg-gradient-to-br text-[10px] font-extrabold tracking-wider uppercase ${tierColors[merchant.reliabilityTier] || tierColors.unrated}`}>
            {merchant.reliabilityTier} Tier
          </span>
          <span className="badge bg-surface-elevated/40 border border-surface-border text-[10px] text-text-secondary font-medium">
            <MapPin size={10} className="text-teal-400" /> {merchant.location?.city || 'India'}
          </span>
          {merchant.businessHours && (
            <span className="badge bg-surface-elevated/40 border border-surface-border text-[10px] text-text-secondary font-medium">
              <Clock size={10} className="text-teal-400" /> {merchant.businessHours}
            </span>
          )}
        </div>

        {/* Mini stats dashboard */}
        <div className="grid grid-cols-3 gap-2 bg-surface-card/60 border border-surface-border/50 p-3 rounded-2xl text-center">
          <div>
            <span className="text-[9px] text-text-secondary uppercase font-semibold">Reputation</span>
            <p className="text-sm font-bold font-mono text-teal-400 mt-0.5">
              {merchant.reputationScore}%
            </p>
          </div>
          <div>
            <span className="text-[9px] text-text-secondary uppercase font-semibold">Escrows Completed</span>
            <p className="text-sm font-bold text-text-primary mt-0.5">
              {merchant.totalOrders || 0}
            </p>
          </div>
          <div>
            <span className="text-[9px] text-text-secondary uppercase font-semibold">Avg rating</span>
            <p className="text-sm font-bold text-text-primary mt-0.5 flex items-center justify-center gap-0.5">
              <Star size={11} className="text-yellow-400 fill-yellow-400" />
              {reviewsSummary.count > 0 ? reviewsSummary.average : 'unrated'}
            </p>
          </div>
        </div>

        {/* Tab selection */}
        <div className="flex border-b border-surface-border pt-4">
          <button
            onClick={() => setActiveTab('catalog')}
            className={`flex-1 pb-2.5 text-xs font-bold transition-all relative ${
              activeTab === 'catalog' ? 'text-teal-400 font-extrabold' : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Store Catalog
            {activeTab === 'catalog' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-400 rounded-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`flex-1 pb-2.5 text-xs font-bold transition-all relative ${
              activeTab === 'reviews' ? 'text-teal-400 font-extrabold' : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Verified Reviews ({reviewsSummary.count})
            {activeTab === 'reviews' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-400 rounded-full" />
            )}
          </button>
        </div>

        {/* Catalog grid */}
        {activeTab === 'catalog' && (
          <div className="space-y-3 pt-2">
            {isCatalogLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 size={24} className="text-teal-500 animate-spin" />
              </div>
            ) : products.length === 0 ? (
              <div className="card text-center py-10 space-y-2">
                <Box size={32} className="text-text-muted mx-auto" />
                <p className="text-xs text-text-secondary">Store catalog is currently empty.</p>
              </div>
            ) : (
              products.map((p: any) => (
                <div key={p.productId} className="card flex gap-4 relative overflow-hidden items-start border-surface-border hover:border-teal-500/20 transition-all">
                  <div className="w-16 h-16 rounded-xl bg-surface-elevated overflow-hidden border border-surface-border flex items-center justify-center flex-shrink-0">
                    {p.images?.[0] ? (
                      <img src={p.images[0]} alt="Thumb" className="w-full h-full object-cover" />
                    ) : (
                      <Box size={20} className="text-text-muted" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 pr-20 space-y-1">
                    <span className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/15">
                      {p.category}
                    </span>
                    <h3 className="text-xs font-bold text-text-primary truncate pt-1">{p.title}</h3>
                    <p className="text-[11px] text-text-secondary line-clamp-2 leading-relaxed">
                      {p.description}
                    </p>
                    <p className="text-xs font-mono font-bold text-teal-400 pt-1">
                      {(p.priceLovelace / 1_000_000).toFixed(1)} ADA
                    </p>
                  </div>

                  {/* Buy CTA */}
                  <button
                    onClick={() => handleBuyClick(p)}
                    className="absolute right-4 bottom-4 btn-primary text-[10px] py-1.5 px-3 rounded-lg flex items-center gap-1"
                  >
                    Buy Now <ArrowUpRight size={12} />
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* Reviews tab */}
        {activeTab === 'reviews' && (
          <div className="space-y-3 pt-2">
            {reviewsSummary.count === 0 ? (
              <div className="card text-center py-10 space-y-2">
                <Star size={32} className="text-text-muted mx-auto" />
                <p className="text-xs text-text-secondary">No verified purchase reviews yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Review logs list placeholder */}
                <div className="card text-center py-6">
                  <p className="text-xs text-text-muted">Loading verified reviews...</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* CIP-30 Checkout Modal */}
      {checkoutProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-sm bg-surface-card rounded-3xl border border-surface-border p-6 space-y-5 shadow-2xl relative animate-slide-up">
            {/* Close button */}
            {checkoutStep !== 'signing' && (
              <button
                onClick={() => setCheckoutProduct(null)}
                className="absolute right-4 top-4 btn-ghost p-1 text-text-secondary"
              >
                <X size={20} />
              </button>
            )}

            {checkoutStep === 'wallet_select' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-surface-border pb-3">
                  <ShoppingBag size={18} className="text-teal-400 animate-bounce" />
                  <h2 className="text-sm font-bold text-text-primary">One-Click Checkout</h2>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-text-secondary">Item selected:</p>
                  <p className="text-xs font-bold text-text-primary truncate">{checkoutProduct.title}</p>
                  <p className="text-xs font-mono font-bold text-teal-400">
                    {(checkoutProduct.priceLovelace / 1_000_000).toFixed(1)} ADA
                  </p>
                </div>
                <p className="text-[10px] text-text-secondary leading-relaxed">
                  Funds will be securely locked in a ZeroPay Cardano smart contract escrow. Releases are triggered strictly on milestone deliverables!
                </p>
                <div className="space-y-2 pt-2">
                  <span className="text-[10px] uppercase font-bold text-text-secondary block">
                    Choose Browser Wallet
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {SUPPORTED_WALLETS.map((w) => (
                      <button
                        key={w.key}
                        onClick={() => handleWalletSelect(w.key)}
                        className="py-2.5 px-3 rounded-xl border border-surface-border bg-surface-elevated/40 hover:bg-surface-border text-xs text-text-primary font-bold flex items-center justify-center gap-2 transition-colors"
                      >
                        <Wallet size={12} className="text-teal-400" />
                        {w.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {checkoutStep === 'signing' && (
              <div className="text-center py-8 space-y-4 flex flex-col items-center">
                <Loader2 size={36} className="text-teal-500 animate-spin" />
                <h3 className="text-sm font-bold">Signing Smart Contract</h3>
                <p className="text-xs text-text-secondary leading-relaxed max-w-[240px] mx-auto">
                  Please confirm the transaction signature in your browser extension to secure your escrow funds.
                </p>
              </div>
            )}

            {checkoutStep === 'success' && (
              <div className="text-center py-6 space-y-4 flex flex-col items-center">
                <CheckCircle size={40} className="text-status-confirmed animate-bounce" />
                <h3 className="text-sm font-bold">Escrow Deposit Confirmed!</h3>
                <p className="text-xs text-text-secondary leading-relaxed max-w-[260px] mx-auto">
                  Your funds are secured on the Cardano blockchain! Work can safely begin. Track progress in your chats tab.
                </p>
                <div className="space-y-2 w-full pt-2">
                  <button
                    onClick={() => {
                      setCheckoutProduct(null);
                      navigate('/customer/chats');
                    }}
                    className="btn-primary w-full py-2 text-xs"
                  >
                    View Active Escrows
                  </button>
                  {txHash && (
                    <a
                      href={`https://preprod.cardanoscan.io/transaction/${txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-teal-400 font-bold hover:underline flex items-center justify-center gap-1"
                    >
                      Verify on Cardanoscan <ExternalLink size={10} />
                    </a>
                  )}
                </div>
              </div>
            )}

            {checkoutStep === 'error' && (
              <div className="space-y-4 text-center py-6 flex flex-col items-center">
                <AlertCircle size={40} className="text-status-failed" />
                <h3 className="text-sm font-bold">Transaction Failed</h3>
                <p className="text-xs text-text-secondary max-w-[250px] leading-relaxed">
                  {errorMsg || 'An error occurred during wallet integration.'}
                </p>
                <button
                  onClick={() => setCheckoutStep('wallet_select')}
                  className="btn-secondary w-full py-2 text-xs"
                >
                  Try Again
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
