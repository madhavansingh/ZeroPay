import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Share2, Download } from 'lucide-react';
import QRCode from 'react-qr-code';
import { getMerchantPublic } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';

export default function QRDisplayPage() {
  const { merchantId } = useParams<{ merchantId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const { data: merchantRes, isLoading } = useQuery({
    queryKey: ['merchant-public', merchantId],
    queryFn: () => getMerchantPublic(merchantId!),
    enabled: !!merchantId,
  });

  const merchant = merchantRes?.data;

  // Deep-link URL that the customer's scanner will resolve
  const payUrl = `${window.location.origin}/customer/pay/${merchantId}`;

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: `Pay ${merchant?.shopName ?? 'ZeroPay merchant'}`,
        text: 'Scan to pay with Cardano',
        url: payUrl,
      }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(payUrl);
      alert('Payment link copied!');
    }
  };

  const handleDownload = () => {
    const svg = document.getElementById('merchant-qr-svg');
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([svgData], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `zeropay-qr-${merchantId}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-surface px-5 pt-12 pb-24 flex flex-col">
      <button
        onClick={() => navigate(-1)}
        className="btn-ghost flex items-center gap-2 -ml-2 mb-8"
      >
        <ArrowLeft size={18} /> Back
      </button>

      <h1 className="text-2xl font-bold mb-1">Your Payment QR</h1>
      <p className="text-text-secondary text-sm mb-8">
        Customers scan this to pay you in ADA
      </p>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="flex flex-col items-center gap-6 animate-fade-in">
          {/* QR Card */}
          <div className="bg-white rounded-3xl p-6 shadow-2xl shadow-black/20 w-full max-w-xs">
            <QRCode
              id="merchant-qr-svg"
              value={payUrl}
              size={256}
              style={{ width: '100%', height: 'auto' }}
              viewBox="0 0 256 256"
              fgColor="#0f172a"
              bgColor="#ffffff"
            />
          </div>

          {/* Shop name badge */}
          <div className="text-center">
            <p className="font-bold text-xl">{merchant?.shopName ?? user?.displayName}</p>
            <p className="text-text-muted text-sm font-mono mt-0.5">{merchantId}</p>
          </div>

          {/* URL chip */}
          <div className="bg-surface-card border border-surface-border rounded-2xl px-4 py-2.5 w-full max-w-xs">
            <p className="font-mono text-xs text-text-secondary truncate text-center">{payUrl}</p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 w-full max-w-xs">
            <button
              id="share-qr-btn"
              onClick={handleShare}
              className="btn-secondary flex-1 flex items-center justify-center gap-2"
            >
              <Share2 size={16} /> Share
            </button>
            <button
              id="download-qr-btn"
              onClick={handleDownload}
              className="btn-secondary flex-1 flex items-center justify-center gap-2"
            >
              <Download size={16} /> Save
            </button>
          </div>

          <p className="text-text-muted text-xs text-center max-w-xs">
            This QR is static — it works for all payment amounts. The merchant sets the amount in the chat.
          </p>
        </div>
      )}
    </div>
  );
}
