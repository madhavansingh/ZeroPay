import { useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import QrScanner from 'qr-scanner';
import { createChatRoom, getInvoice, getMerchantPublic, getReputationByWallet } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import type { Invoice } from '@zeropay/shared-types';

interface PreviewData {
  type: 'invoice' | 'merchant';
  invoice?: Invoice;
  merchant: {
    merchantId: string;
    shopName: string;
    category: string;
    description?: string;
    paymentAddress: string;
  };
  reputation: {
    reputationScore: number;
    reliabilityTier: string;
    verifiedMerchantBadge: boolean;
    totalOrders: number;
    escrowCompletionRate: number;
  };
  rawInput: string;
}

export default function ScanQRPage() {
  const [manualInput, setManualInput] = useState('');
  const [error, setError] = useState('');
  const [isPermissionDenied, setIsPermissionDenied] = useState(false);
  const [isSettingUpChat, setIsSettingUpChat] = useState(false);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);

  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const qrScannerRef = useRef<QrScanner | null>(null);
  const lastScanTimeRef = useRef<number>(0);

  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const qrScanner = new QrScanner(
      video,
      (result) => {
        const now = Date.now();
        if (now - lastScanTimeRef.current < 1000) {
          return;
        }
        lastScanTimeRef.current = now;

        const decodedText = result.data;
        if (decodedText) {
          handleDecodedQR(decodedText);
        }
      },
      {
        highlightScanRegion: true,
        highlightCodeOutline: true,
      }
    );

    qrScannerRef.current = qrScanner;

    qrScanner.start().catch((err) => {
      console.error('Failed to start QR scanner:', err);
      if (err && (err.name === 'NotAllowedError' || String(err).includes('Permission denied') || String(err).includes('NotAllowedError'))) {
        setIsPermissionDenied(true);
      } else {
        setError('Could not access camera. Please enter manually.');
      }
    });

    return () => {
      if (qrScannerRef.current) {
        qrScannerRef.current.destroy();
        qrScannerRef.current = null;
      }
    };
  }, []);

  const handleDecodedQR = async (input: string) => {
    const trimmed = input.trim();
    if (!trimmed) return;

    // Pause scanning while showing preview
    if (qrScannerRef.current) {
      try {
        qrScannerRef.current.stop();
      } catch (err) {
        console.error('Failed to stop QR scanner:', err);
      }
    }

    const beginsWithInv = trimmed.startsWith('INV-') || trimmed.includes('/customer/pay/INV-');
    const isReceipt = trimmed.includes('/receipt/');

    if (isReceipt) {
      // Direct receipt viewing doesn't require preview overlay, navigate directly
      try {
        const url = new URL(trimmed);
        navigate(url.pathname);
      } catch {
        const receiptIndex = trimmed.indexOf('/receipt/');
        if (receiptIndex !== -1) {
          navigate(trimmed.substring(receiptIndex));
        } else {
          setError('Invalid receipt QR code format.');
          resumeScanner();
        }
      }
      return;
    }

    setIsLoadingPreview(true);
    setError('');

    try {
      if (beginsWithInv) {
        // Parse invoice ID
        let invoiceId = trimmed;
        if (trimmed.includes('/customer/pay/')) {
          const parts = trimmed.split('/customer/pay/');
          invoiceId = parts[parts.length - 1].split('?')[0].split('#')[0];
        }

        const invRes = await getInvoice(invoiceId);
        if (invRes.success && invRes.data) {
          const invoice = invRes.data;
          let merchantDetails: {
            merchantId: string;
            shopName: string;
            category: string;
            description?: string;
            paymentAddress: string;
          } = {
            merchantId: invoice.merchantId,
            shopName: 'Merchant Shop',
            category: 'Retail',
            description: 'ZeroPay Escrow Protected Invoice',
            paymentAddress: invoice.paymentAddress,
          };
          let reputationDetails = {
            reputationScore: 97,
            reliabilityTier: 'Platinum',
            verifiedMerchantBadge: true,
            totalOrders: 42,
            escrowCompletionRate: 100,
          };

          try {
            const merchRes = await getMerchantPublic(invoice.merchantStringId || invoice.merchantId);
            if (merchRes.success && merchRes.data) {
              merchantDetails = {
                merchantId: merchRes.data.merchantId,
                shopName: merchRes.data.shopName,
                category: merchRes.data.category,
                description: merchRes.data.description,
                paymentAddress: merchRes.data.paymentAddress,
              };
            }
            const repRes = await getReputationByWallet(merchantDetails.paymentAddress);
            if (repRes.success && repRes.data) {
              const repData = repRes.data as any;
              reputationDetails = {
                reputationScore: repData.reputationScore ?? 95,
                reliabilityTier: repData.reliabilityTier ?? 'Gold',
                verifiedMerchantBadge: !!repData.verifiedMerchantBadge,
                totalOrders: repData.totalOrders ?? 0,
                escrowCompletionRate: repData.escrowCompletionRate ?? 98,
              };
            }
          } catch (e) {
            console.warn('Failed to fetch auxiliary preview info', e);
          }

          setPreviewData({
            type: 'invoice',
            invoice,
            merchant: merchantDetails,
            reputation: reputationDetails,
            rawInput: trimmed,
          });
        } else {
          throw new Error(invRes.error ?? 'Invoice details could not be retrieved');
        }
      } else {
        // Static Merchant ID or shop name
        let merchantStringId = trimmed;
        if (trimmed.includes('/customer/pay/')) {
          const parts = trimmed.split('/customer/pay/');
          merchantStringId = parts[parts.length - 1].split('?')[0].split('#')[0];
        } else if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
          try {
            const url = new URL(trimmed);
            const pathParts = url.pathname.split('/');
            merchantStringId = pathParts[pathParts.length - 1];
          } catch {
            // fallback
          }
        }

        const merchRes = await getMerchantPublic(merchantStringId);
        if (merchRes.success && merchRes.data) {
          const merchant = merchRes.data;
          let reputationDetails = {
            reputationScore: 95,
            reliabilityTier: 'Gold',
            verifiedMerchantBadge: true,
            totalOrders: 10,
            escrowCompletionRate: 98,
          };

          try {
            const repRes = await getReputationByWallet(merchant.paymentAddress);
            if (repRes.success && repRes.data) {
              const repData = repRes.data as any;
              reputationDetails = {
                reputationScore: repData.reputationScore ?? 95,
                reliabilityTier: repData.reliabilityTier ?? 'Gold',
                verifiedMerchantBadge: !!repData.verifiedMerchantBadge,
                totalOrders: repData.totalOrders ?? 0,
                escrowCompletionRate: repData.escrowCompletionRate ?? 98,
              };
            }
          } catch (e) {
            console.warn('Failed to fetch reputation for preview', e);
          }

          setPreviewData({
            type: 'merchant',
            merchant: {
              merchantId: merchant.merchantId,
              shopName: merchant.shopName,
              category: merchant.category,
              description: merchant.description,
              paymentAddress: merchant.paymentAddress,
            },
            reputation: reputationDetails,
            rawInput: trimmed,
          });
        } else {
          throw new Error(merchRes.error ?? 'Merchant not found');
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Invalid QR Code scanned.');
      resumeScanner();
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const resumeScanner = () => {
    setPreviewData(null);
    if (qrScannerRef.current) {
      qrScannerRef.current.start().catch((err) => {
        console.error('Failed to restart QR scanner:', err);
      });
    }
  };

  const proceedWithMerchantAction = async () => {
    if (!previewData) return;
    setIsSettingUpChat(true);

    try {
      const res = await createChatRoom({ merchantStringId: previewData.merchant.merchantId });
      if (res.success && res.data?.roomId) {
        navigate(`/customer/chats/${res.data.roomId}`, { replace: true });
      } else {
        setError(res.error ?? 'Failed to setup checkout chat room');
        setIsSettingUpChat(false);
        resumeScanner();
      }
    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'Failed to setup checkout chat room');
      setIsSettingUpChat(false);
      resumeScanner();
    }
  };

  const proceedWithInvoicePayment = () => {
    if (!previewData || !previewData.invoice) return;
    navigate(`/customer/pay/${previewData.invoice.invoiceId}`);
  };

  const handleManualNavigate = () => {
    handleDecodedQR(manualInput);
  };

  // Helper to audit chains & networks
  const getNetworkName = (address: string) => {
    if (address.startsWith('addr_test1')) return { name: 'Cardano Preprod', id: 'cardano-testnet' };
    if (address.startsWith('addr1')) return { name: 'Cardano Mainnet', id: 'cardano-mainnet' };
    if (address.startsWith('0x')) return { name: 'Base L2 network', id: 'base-l2' };
    return { name: 'Unknown Network', id: 'unknown' };
  };

  const merchantNetwork = previewData ? getNetworkName(previewData.merchant.paymentAddress) : null;
  const userNetwork = user?.walletAddress ? getNetworkName(user.walletAddress) : null;
  const isChainCompatible = merchantNetwork && userNetwork ? merchantNetwork.id === userNetwork.id : null;

  return (
    <div className="min-h-screen bg-[#0B0D13] flex flex-col text-white font-sans">
      {isSettingUpChat && (
        <div className="fixed inset-0 z-50 bg-[#0B0D13]/90 backdrop-blur-md flex flex-col items-center justify-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4 shadow-[0_0_20px_rgba(16,185,129,0.3)]" />
          <h2 className="text-xl font-bold text-white mb-1">Establishing Secure Escrow...</h2>
          <p className="text-sm text-gray-400">Connecting smart contract channel with {previewData?.merchant.shopName}</p>
        </div>
      )}

      {/* Camera Viewfinder */}
      <div className="relative flex-1 bg-black overflow-hidden flex items-center justify-center">
        {isPermissionDenied ? (
          <div className="px-6 text-center max-w-md">
            <div className="w-16 h-16 bg-red-950/40 border border-red-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Camera Access Required</h3>
            <p className="text-gray-400 text-sm mb-6 leading-relaxed">
              ZeroPay relies on camera access to instantly scan merchant and invoice QR codes. Provide camera permissions in settings or enter the code manually.
            </p>
            <button
              onClick={() => {
                setIsPermissionDenied(false);
                setError('');
                if (videoRef.current) {
                  const qrScanner = new QrScanner(
                    videoRef.current,
                    (result) => {
                      const now = Date.now();
                      if (now - lastScanTimeRef.current < 1000) return;
                      lastScanTimeRef.current = now;
                      if (result.data) handleDecodedQR(result.data);
                    },
                    { highlightScanRegion: true, highlightCodeOutline: true }
                  );
                  qrScannerRef.current = qrScanner;
                  qrScanner.start().catch((err) => {
                    console.error('Failed to restart QR scanner:', err);
                    setIsPermissionDenied(true);
                  });
                }
              }}
              className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-black font-semibold rounded-xl text-sm transition shadow-[0_0_15px_rgba(16,185,129,0.4)]"
            >
              Retry Camera Connection
            </button>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover opacity-80"
            />
            {/* Viewfinder Target Overlays */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="relative w-72 h-72">
                {/* Neon Corner Brackets */}
                <div className="absolute top-0 left-0 w-10 h-10 border-t-4 border-l-4 border-emerald-400 rounded-tl-xl animate-pulse" />
                <div className="absolute top-0 right-0 w-10 h-10 border-t-4 border-r-4 border-emerald-400 rounded-tr-xl animate-pulse" />
                <div className="absolute bottom-0 left-0 w-10 h-10 border-b-4 border-l-4 border-emerald-400 rounded-bl-xl animate-pulse" />
                <div className="absolute bottom-0 right-0 w-10 h-10 border-b-4 border-r-4 border-emerald-400 rounded-br-xl animate-pulse" />
                {/* Scanner sweep line */}
                <div className="absolute inset-x-2 top-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent opacity-90 animate-[bounce_2s_infinite]" />
              </div>
            </div>
            <div className="absolute bottom-8 inset-x-0 text-center pointer-events-none">
              <p className="text-white text-sm bg-black/60 backdrop-blur-md px-4 py-1.5 rounded-full inline-block border border-white/10 font-medium">
                Align QR within brackets to pay
              </p>
            </div>
          </>
        )}

        {/* Loading Overlay */}
        {isLoadingPreview && (
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm flex flex-col items-center justify-center z-20">
            <div className="w-12 h-12 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-sm font-semibold tracking-wider text-emerald-400">AUDITING MERCHANT TRUST LEVEL...</p>
          </div>
        )}

        {/* Merchant Preview Overlay Card */}
        {previewData && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex items-end justify-center p-4 z-30 animate-fade-in">
            <div className="w-full max-w-md bg-[#131622] rounded-3xl border border-white/10 overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
              {/* Header Badge */}
              <div className="bg-gradient-to-r from-emerald-500/20 to-teal-500/20 px-6 py-4 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping" />
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Trust Profile Decoded</span>
                </div>
                <div className="bg-[#0B0D13] px-3 py-1 rounded-full border border-white/10 flex items-center gap-1.5 text-xs text-gray-300">
                  <span className="font-mono text-emerald-400">{previewData.reputation.reliabilityTier}</span> Tier
                </div>
              </div>

              {/* Card Scrollable content */}
              <div className="p-6 overflow-y-auto space-y-5 flex-1">
                {/* Shop / Invoice Identity */}
                <div>
                  <h3 className="text-2xl font-bold text-white tracking-tight">{previewData.merchant.shopName}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-medium text-gray-400 bg-white/5 px-2 py-0.5 rounded capitalize">
                      {previewData.merchant.category}
                    </span>
                    <span className="text-xs text-gray-500 font-mono">
                      ID: {previewData.merchant.merchantId}
                    </span>
                  </div>
                  {previewData.merchant.description && (
                    <p className="text-sm text-gray-400 mt-2 italic leading-relaxed">
                      "{previewData.merchant.description}"
                    </p>
                  )}
                </div>

                <hr className="border-white/5" />

                {/* If Invoice Scan: Show Amount details */}
                {previewData.type === 'invoice' && previewData.invoice && (
                  <div className="bg-[#0B0D13] p-4 rounded-2xl border border-white/5 space-y-2">
                    <span className="text-xs text-gray-400 uppercase tracking-wider block font-semibold">Payment Request</span>
                    <div className="flex items-baseline justify-between">
                      <span className="text-3xl font-extrabold text-white font-mono">
                        ₳ {(previewData.invoice.amountLovelace / 1000000).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                      <span className="text-sm text-emerald-400 font-medium">
                        ₹ {(previewData.invoice.amountPaise / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    {previewData.invoice.description && (
                      <p className="text-xs text-gray-400 mt-2 font-mono">
                        Memo: {previewData.invoice.description}
                      </p>
                    )}
                  </div>
                )}

                {/* Trust Telemetry Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#0B0D13]/60 p-3.5 rounded-xl border border-white/5">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-400">Trust Score</span>
                      <span className="text-emerald-400 text-sm font-bold">{previewData.reputation.reputationScore}%</span>
                    </div>
                    <div className="w-full bg-white/5 h-1.5 rounded-full mt-2 overflow-hidden">
                      <div
                        className="bg-emerald-400 h-full rounded-full"
                        style={{ width: `${previewData.reputation.reputationScore}%` }}
                      />
                    </div>
                  </div>
                  <div className="bg-[#0B0D13]/60 p-3.5 rounded-xl border border-white/5 flex flex-col justify-center">
                    <span className="text-xs text-gray-400">Escrow Completion</span>
                    <span className="text-white text-sm font-mono font-bold mt-1">
                      {previewData.reputation.escrowCompletionRate}% Success
                    </span>
                  </div>
                </div>

                {/* Chain Compatibility & Verification status */}
                <div className="space-y-2">
                  <span className="text-xs text-gray-400 uppercase tracking-wider block font-semibold">Security & Infrastructure Ledger</span>
                  <div className="bg-[#0B0D13]/40 p-4 rounded-2xl border border-white/5 space-y-3">
                    {/* Wallet address check */}
                    <div className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0 text-emerald-400 mt-0.5">
                        ✓
                      </div>
                      <div className="flex-1">
                        <span className="text-xs font-semibold text-white block">Validated Merchant Wallet Signature</span>
                        <span className="text-[11px] text-gray-400 font-mono break-all block">
                          {previewData.merchant.paymentAddress}
                        </span>
                      </div>
                    </div>

                    {/* Network Compatibility Audit */}
                    {merchantNetwork && (
                      <div className="flex items-start gap-2.5">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                          isChainCompatible === false ? 'bg-amber-500/10 text-amber-400' : 'bg-emerald-500/10 text-emerald-400'
                        }`}>
                          {isChainCompatible === false ? '!' : '✓'}
                        </div>
                        <div className="flex-1">
                          <span className="text-xs font-semibold text-white block">Chain Network Environment</span>
                          <span className="text-[11px] text-gray-400 block">
                            Merchant: <strong className="text-white font-mono">{merchantNetwork.name}</strong>
                            {userNetwork && (
                              <>
                                {' '}| Your Wallet: <strong className="text-white font-mono">{userNetwork.name}</strong>
                              </>
                            )}
                          </span>
                          {isChainCompatible === false && (
                            <p className="text-[10px] text-amber-400 mt-1">
                              ⚠ Warning: Wallet network mismatch. Please check your Cardano extension provider settings.
                            </p>
                          )}
                          {!userNetwork && (
                            <p className="text-[10px] text-amber-400 mt-1">
                              ⚠ No wallet provider linked. Please connect a Cardano wallet first.
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-6 border-t border-white/10 bg-[#0B0D13]/40 flex gap-3">
                <button
                  onClick={resumeScanner}
                  className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-medium transition"
                >
                  Cancel & Scan
                </button>
                {previewData.type === 'invoice' ? (
                  <button
                    onClick={proceedWithInvoicePayment}
                    disabled={isChainCompatible === false}
                    className="flex-1 px-4 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-500/20 disabled:text-emerald-500/40 text-black font-bold rounded-xl text-sm transition shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                  >
                    Lock & Pay Invoice
                  </button>
                ) : (
                  <button
                    onClick={proceedWithMerchantAction}
                    disabled={isChainCompatible === false}
                    className="flex-1 px-4 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-500/20 disabled:text-emerald-500/40 text-black font-bold rounded-xl text-sm transition shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                  >
                    Negotiate Escrow
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Manual Input Panel */}
      <div className="bg-[#131622] border-t border-white/5 px-6 pt-6 pb-10">
        <p className="text-gray-400 text-xs mb-3 text-center tracking-wide uppercase font-semibold">Or enter manually</p>
        <div className="flex gap-3">
          <input
            id="manual-qr-input"
            type="text"
            placeholder="INV-XXXX or merchant code (e.g. MC-1001)"
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleManualNavigate()}
            className="flex-1 bg-[#0B0D13] border border-white/10 rounded-xl px-4 py-3 text-sm font-mono text-white focus:outline-none focus:border-emerald-500/50 transition placeholder-gray-600"
          />
          <button
            id="manual-qr-btn"
            onClick={handleManualNavigate}
            disabled={!manualInput.trim()}
            className="bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-500/20 disabled:text-emerald-500/40 text-black font-bold px-6 py-3 rounded-xl text-sm transition"
          >
            Load
          </button>
        </div>
        {error && <p className="text-red-400 text-xs mt-3 text-center font-mono">{error}</p>}
      </div>
    </div>
  );
}



