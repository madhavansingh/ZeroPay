import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, UserRole, OnboardingStep } from '@zeropay/shared-types';

interface AuthState {
  user: User | null;
  firebaseUid: string | null;
  idToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  activeRoleView: 'merchant' | 'customer';
  setUser: (user: User) => void;
  setIdToken: (token: string) => void;
  setFirebaseUid: (uid: string) => void;
  setLoading: (loading: boolean) => void;
  setActiveRoleView: (view: 'merchant' | 'customer') => void;
  updateOnboardingStep: (step: OnboardingStep) => void;
  updateRole: (role: UserRole) => void;
  updateWallet: (address: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      firebaseUid: null,
      idToken: null,
      isLoading: true,
      isAuthenticated: false,
      activeRoleView: 'merchant',

      setUser: (user) =>
        set((state) => ({
          user,
          isAuthenticated: true,
          isLoading: false,
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

      updateWallet: (walletAddress) =>
        set((state) => ({
          user: state.user ? { ...state.user, walletAddress } : null,
        })),

      logout: () =>
        set({
          user: null,
          firebaseUid: null,
          idToken: null,
          isAuthenticated: false,
          activeRoleView: 'merchant',
        }),
    }),
    {
      name: 'zeropay-auth',
      partialize: (state) => ({
        user: state.user,
        firebaseUid: state.firebaseUid,
        activeRoleView: state.activeRoleView,
      }),
    }
  )
);
