import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
  onAuthStateChanged,
  signOut,
} from 'firebase/auth';
import { getMessaging, getToken } from 'firebase/messaging';
import { useQueryClient } from '@tanstack/react-query';
import app, { auth } from '../services/firebase';
import { syncUser, logoutUser } from '../services/api';
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

  const queryClient = useQueryClient();
  const { setUser, setFirebaseUid, setLoading, logout: storeLogout } = useAuthStore();

  const requestFcmToken = async (): Promise<string | undefined> => {
    try {
      if (typeof window === 'undefined' || !('Notification' in window)) return undefined;

      if (Notification.permission === 'default') {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') return undefined;
      }

      if (Notification.permission !== 'granted') return undefined;

      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration) {
        throw new Error('No service worker registration found');
      }

      const messaging = getMessaging(app);
      const token = await getToken(messaging, {
        serviceWorkerRegistration: registration,
      });

      return token;
    } catch (err) {
      console.warn('FCM token retrieval failed:', err);
      // Fallback: return a mock token in development / test environments to satisfy schema checks
      if (import.meta.env.DEV) {
        return 'mock-fcm-token-' + Math.random().toString(36).substring(2, 10);
      }
      return undefined;
    }
  };

  // Listen to Firebase auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        setFirebaseUid(firebaseUser.uid);
        try {
          let fcmToken: string | undefined;
          try {
            fcmToken = await requestFcmToken();
          } catch (e) {
            console.warn('[Auth] Failed to obtain FCM token:', e);
          }

          const response = await syncUser({
            displayName: firebaseUser.displayName ?? undefined,
            fcmToken,
          });
          if (response.success && response.data) {
            setUser(response.data);
          } else {
            console.error('[Auth] User sync returned unsuccessful response. Clearing session.');
            localStorage.removeItem('zeropay-auth');
            storeLogout();
          }
        } catch (err) {
          console.error('[Auth] User sync exception. Clearing session:', err);
          localStorage.removeItem('zeropay-auth');
          storeLogout();
        } finally {
          setLoading(false);
        }
      } else {
        storeLogout();
        setLoading(false);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const sendOtp = async (phone: string): Promise<void> => {
    if (isSending) {
      return;
    }
    setIsSending(true);
    setError(null);

    let verifier: RecaptchaVerifier | null = null;
    try {
      // Clear container child elements to avoid duplicate ReCAPTCHA frames
      const container = document.getElementById('recaptcha-container');
      if (container) {
        container.innerHTML = '';
      }

      verifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
      });

      const result = await signInWithPhoneNumber(auth, phone, verifier);
      setConfirmation(result);
      setPhoneNumber(phone);
      setIsOtpSent(true);
    } catch (err: unknown) {
      console.error('[Auth] Failed to send OTP:', err);
      if (verifier) {
        try {
          verifier.clear();
        } catch (e) {
          console.warn('[Auth] Failed to clear verifier:', e);
        }
      }
      const message = err instanceof Error ? err.message : 'Failed to send OTP';
      setError(message);
      throw err;
    } finally {
      setIsSending(false);
    }
  };

  const verifyOtp = async (otp: string): Promise<void> => {
    if (isVerifying) {
      return;
    }
    if (!confirmation) {
      console.warn('[Auth] verifyOtp called but confirmationResult is null');
      throw new Error('No OTP sent');
    }
    setIsVerifying(true);
    setError(null);

    try {
      await confirmation.confirm(otp);
      // onAuthStateChanged will handle backend sync and routing next
    } catch (err: unknown) {
      console.error('[Auth] OTP verification failed:', err);
      const message = err instanceof Error ? err.message : 'Invalid OTP';
      setError(message);
      throw err;
    } finally {
      setIsVerifying(false);
    }
  };

  const logout = async (): Promise<void> => {
    // Step 1: Backend reset (non-fatal if fails)
    try {
      if (auth.currentUser) {
        await logoutUser();
      }
    } catch (e) {
      console.warn('[Auth] Backend logout failed (non-fatal):', e);
    }

    // Step 2: Firebase signOut (must succeed)
    try {
      await signOut(auth);
    } catch (e) {
      console.error('[Auth] Firebase signOut error:', e);
    }

    // Step 3: React Query cache
    try {
      queryClient.clear();
    } catch (e) {
      console.error('[Auth] Failed to clear query cache:', e);
    }

    // Step 4: Zustand in-memory reset + persisted storage clear
    useAuthStore.getState().reset();
    try {
      useAuthStore.persist.clearStorage();
    } catch (e) {
      console.error('[Auth] Failed to clear Zustand storage:', e);
    }

    // Step 5: Nuke all browser storage artifacts
    localStorage.clear();
    sessionStorage.clear();

    // Step 6: Hard redirect — bypasses React Router, ensures clean state
    window.location.replace('/');
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
