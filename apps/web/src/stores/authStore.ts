import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, UserRole, OnboardingStep } from '@zeropay/shared-types';

interface AuthState {
  // Auth state — NOT persisted (always synced from backend on mount)
  user: User | null;
  firebaseUid: string | null;
  idToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  activeRoleView: 'merchant' | 'customer';
  walletProvider: string | null;

  // Device identity — persisted (survives logout, unique per browser)
  deviceId: string | null;

  // Actions
  setUser: (user: User) => void;
  setIdToken: (token: string) => void;
  setFirebaseUid: (uid: string) => void;
  setLoading: (loading: boolean) => void;
  setActiveRoleView: (view: 'merchant' | 'customer') => void;
  updateOnboardingStep: (step: OnboardingStep) => void;
  updateRole: (role: UserRole) => void;
  updateWallet: (address: string, provider: string) => void;
  setWalletProvider: (provider: string | null) => void;
  logout: () => void;
  reset: () => void;
}

const INITIAL_STATE = {
  user: null,
  firebaseUid: null,
  idToken: null,
  isLoading: true,
  isAuthenticated: false,
  activeRoleView: 'merchant' as const,
  walletProvider: null,
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      ...INITIAL_STATE,
      deviceId: null,

      setUser: (user) =>
        set((state) => ({
          user,
          isAuthenticated: true,
          isLoading: false,
          walletProvider: user.walletProvider || state.walletProvider,
          activeRoleView:
            state.activeRoleView === 'customer' && user.role === 'both'
              ? 'customer'
              : user.role === 'both'
              ? 'merchant'
              : user.role === 'customer'
              ? 'customer'
              : 'merchant',
        })),

      setIdToken: (idToken) => set({ idToken }),
      setFirebaseUid: (firebaseUid) => set({ firebaseUid }),
      setLoading: (isLoading) => set({ isLoading }),
      setActiveRoleView: (activeRoleView) => set({ activeRoleView }),

      updateOnboardingStep: (step) =>
        set((state) => ({
          user: state.user ? { ...state.user, onboardingStep: step } : null,
        })),

      updateRole: (role) =>
        set((state) => ({
          user: state.user ? { ...state.user, role } : null,
        })),

      updateWallet: (walletAddress, walletProvider) =>
        set((state) => ({
          user: state.user ? { ...state.user, walletAddress, walletProvider } : null,
          walletProvider,
        })),

      setWalletProvider: (walletProvider) => set({ walletProvider }),

      // logout(): clears all non-device auth state from memory
      // The calling code (useAuth.tsx) is responsible for clearing localStorage
      logout: () => set({ ...INITIAL_STATE }),

      // reset(): same as logout but also resets loading to true
      reset: () => set({ ...INITIAL_STATE, isLoading: true }),
    }),
    {
      name: 'zeropay-auth',
      // CRITICAL: Only persist deviceId — NEVER persist user/role/wallet/onboarding
      // These are always re-synced from backend on every app mount.
      // Persisting auth state causes stale role redirects after logout.
      partialize: (state) => ({
        deviceId: state.deviceId ?? crypto.randomUUID(),
      }),
    }
  )
);
