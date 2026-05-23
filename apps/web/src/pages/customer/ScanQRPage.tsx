import { useNavigate } from 'react-router-dom';
import { QrCode, Camera } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

// Minimal QR scan — uses native browser camera + manual input fallback
export default function ScanQRPage() {
  const [manualInput, setManualInput] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Try to start camera
  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          streamRef.current = stream;
        }
      } catch {
        // Camera not available — show manual input
      }
    };
    startCamera();
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const handleManualNavigate = () => {
    const input = manualInput.trim();
    if (!input) return;

    // Support both full URL and just merchantId/invoiceId
    if (input.includes('/customer/pay/') || input.includes('/receipt/')) {
      try {
        const url = new URL(input);
        navigate(url.pathname);
      } catch {
        navigate(`/customer/pay/${input}`);
      }
    } else {
      // Treat as merchantId or invoiceId
      navigate(`/customer/pay/${input}`);
    }
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
        {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
      </div>
    </div>
  );
}
