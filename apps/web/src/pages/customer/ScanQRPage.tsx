import { useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import QrScanner from 'qr-scanner';

export default function ScanQRPage() {
  const [manualInput, setManualInput] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const qrScannerRef = useRef<QrScanner | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const qrScanner = new QrScanner(
      video,
      (result) => {
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

    qrScanner.start().catch((err) => {
      console.error('Failed to start QR scanner:', err);
      setError('Could not access camera. Please enter manually.');
    });

    qrScannerRef.current = qrScanner;

    return () => {
      qrScanner.destroy();
    };
  }, []);

  const handleDecodedQR = (input: string) => {
    const trimmed = input.trim();
    if (!trimmed) return;

    // Stop scanning once decoded
    qrScannerRef.current?.stop();

    if (trimmed.includes('/customer/pay/') || trimmed.includes('/receipt/')) {
      try {
        const url = new URL(trimmed);
        navigate(url.pathname + url.search);
      } catch {
        const payIndex = trimmed.indexOf('/customer/pay/');
        const receiptIndex = trimmed.indexOf('/receipt/');
        if (payIndex !== -1) {
          navigate(trimmed.substring(payIndex));
        } else if (receiptIndex !== -1) {
          navigate(trimmed.substring(receiptIndex));
        } else {
          navigate(`/customer/pay/${trimmed}`);
        }
      }
    } else {
      navigate(`/customer/pay/${trimmed}`);
    }
  };

  const handleManualNavigate = () => {
    handleDecodedQR(manualInput);
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      {/* Camera viewfinder */}
      <div className="relative flex-1 bg-black overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
        {/* Overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative w-64 h-64">
            {/* Corner brackets */}
            <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-teal-400 rounded-tl-lg" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-teal-400 rounded-tr-lg" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-teal-400 rounded-bl-lg" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-teal-400 rounded-br-lg" />
            {/* Scan line animation */}
            <div className="absolute inset-x-2 top-0 h-0.5 bg-teal-400 opacity-80 animate-bounce" />
          </div>
        </div>
        <div className="absolute bottom-8 inset-x-0 text-center">
          <p className="text-white text-sm opacity-80">Align QR code in the frame</p>
        </div>
      </div>

      {/* Manual input */}
      <div className="bg-surface px-5 pt-6 pb-10">
        <p className="text-text-secondary text-sm mb-3 text-center">Or enter invoice ID manually</p>
        <div className="flex gap-2">
          <input
            id="manual-qr-input"
            type="text"
            placeholder="INV-20240523-XXXXXX or merchant URL"
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleManualNavigate()}
            className="input flex-1"
          />
          <button
            id="manual-qr-btn"
            onClick={handleManualNavigate}
            disabled={!manualInput.trim()}
            className="btn-primary px-5 py-3 shrink-0"
          >
            Go
          </button>
        </div>
        {error && <p className="text-red-400 text-sm mt-2 text-center">{error}</p>}
      </div>
    </div>
  );
}

