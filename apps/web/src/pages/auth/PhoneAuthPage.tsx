import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const COUNTRY_CODE = '+91';

export default function PhoneAuthPage() {
  const { sendOtp, verifyOtp, isOtpSent, isSending, isVerifying, error } = useAuth();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const navigate = useNavigate();

  const handleSendOtp = async () => {
    if (phone.length < 10) return;
    await sendOtp(`${COUNTRY_CODE}${phone}`);
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) return;
    await verifyOtp(otp);
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm animate-slide-up">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 rounded-2xl bg-teal-600 flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 40 40" fill="none">
              <path d="M14 20L20 14L26 20L20 26L14 20Z" fill="white" />
            </svg>
          </div>
          <span className="text-xl font-bold">ZeroPay</span>
        </div>

        <h1 className="text-3xl font-bold mb-2">
          {isOtpSent ? 'Enter OTP' : 'Welcome back'}
        </h1>
        <p className="text-text-secondary mb-8">
          {isOtpSent
            ? `We sent a 6-digit code to ${COUNTRY_CODE}${phone}`
            : 'Enter your mobile number to continue'}
        </p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-3 mb-4 text-red-400 text-sm">
            {error}
          </div>
        )}

        {!isOtpSent ? (
          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="input w-16 text-center text-text-secondary shrink-0">{COUNTRY_CODE}</div>
              <input
                id="phone-input"
                type="tel"
                inputMode="numeric"
                placeholder="9876543210"
                maxLength={10}
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                onKeyDown={(e) => e.key === 'Enter' && handleSendOtp()}
                className="input flex-1"
                autoFocus
              />
            </div>
            <button
              id="send-otp-btn"
              onClick={handleSendOtp}
              disabled={phone.length < 10 || isSending}
              className="btn-primary w-full"
            >
              {isSending ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Sending...
                </span>
              ) : (
                'Send OTP'
              )}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <input
              id="otp-input"
              type="tel"
              inputMode="numeric"
              placeholder="••••••"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              onKeyDown={(e) => e.key === 'Enter' && handleVerifyOtp()}
              className="input text-center text-2xl font-mono tracking-widest"
              autoFocus
            />
            <button
              id="verify-otp-btn"
              onClick={handleVerifyOtp}
              disabled={otp.length !== 6 || isVerifying}
              className="btn-primary w-full"
            >
              {isVerifying ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Verifying...
                </span>
              ) : (
                'Verify & Continue'
              )}
            </button>
            <button
              id="resend-otp-btn"
              onClick={() => { setOtp(''); handleSendOtp(); }}
              className="btn-ghost w-full text-center"
            >
              Resend OTP
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
