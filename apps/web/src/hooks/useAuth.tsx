import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
  onAuthStateChanged,
  signOut,
} from 'firebase/auth';
import { auth } from '../services/firebase';
import { syncUser } from '../services/api';
import { useAuthStore } from '../stores/authStore';

interface AuthContextValue {
  sendOtp: (phone: string) => Promise<void>;
  verifyOtp: (otp: string) => Promise<void>;
  logout: () => Promise<void>;
  isOtpSent: boolean;
  phoneNumber: string;
  isSending: boolean;
  isVerifying: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { setUser, setFirebaseUid, setLoading, logout: storeLogout } = useAuthStore();

  // Listen to Firebase auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setFirebaseUid(firebaseUser.uid);
        try {
          const response = await syncUser({
            displayName: firebaseUser.displayName ?? undefined,
          });
          if (response.success && response.data) {
            setUser(response.data);
          }
        } catch {
          setLoading(false);
        }
      } else {
        storeLogout();
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const sendOtp = async (phone: string): Promise<void> => {
    setIsSending(true);
    setError(null);

    try {
      // Setup invisible recaptcha
      const recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
      });

      const result = await signInWithPhoneNumber(auth, phone, recaptchaVerifier);
      setConfirmation(result);
      setPhoneNumber(phone);
      setIsOtpSent(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to send OTP';
      setError(message);
      throw err;
    } finally {
      setIsSending(false);
    }
  };

  const verifyOtp = async (otp: string): Promise<void> => {
    if (!confirmation) throw new Error('No OTP sent');
    setIsVerifying(true);
    setError(null);

    try {
      await confirmation.confirm(otp);
      // onAuthStateChanged will handle the rest
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Invalid OTP';
      setError(message);
      throw err;
    } finally {
      setIsVerifying(false);
    }
  };

  const logout = async (): Promise<void> => {
    await signOut(auth);
    storeLogout();
  };

  return (
    <AuthContext.Provider
      value={{ sendOtp, verifyOtp, logout, isOtpSent, phoneNumber, isSending, isVerifying, error }}
    >
      {children}
      <div id="recaptcha-container" />
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
