import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export interface UserProfile {
  id: string;
  phone: string;
  displayName: string;
  role: 'customer' | 'merchant' | 'hybrid';
  onboardingStep: 'new' | 'role-selected' | 'complete';
  walletAddress: string | null;
}

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  timestamp: number;
  read: boolean;
  type: 'escrow' | 'payment' | 'dispute' | 'system';
}

interface UserState {
  user: UserProfile | null;
  isLoggedIn: boolean;
  isOnboarded: boolean;
  activeRole: 'customer' | 'merchant' | 'developer';
  developerModeEnabled: boolean;
  notifications: AppNotification[];
  login: (phone: string) => Promise<void>;
  verifyOtp: (code: string) => Promise<boolean>;
  selectRole: (role: 'customer' | 'merchant' | 'hybrid') => Promise<void>;
  toggleDeveloperMode: () => void;
  logout: () => Promise<void>;
  addNotification: (title: string, body: string, type?: AppNotification['type']) => void;
  markNotificationsAsRead: () => void;
  loadSavedUser: () => Promise<void>;
}

export const useUserStore = create<UserState>((set, get) => ({
  user: null,
  isLoggedIn: false,
  isOnboarded: false,
  activeRole: 'customer',
  developerModeEnabled: false,
  notifications: [
    {
      id: '1',
      title: 'Welcome to ZeroPay',
      body: 'Your smart escrow-backed Cardano mobile wallet is ready.',
      timestamp: Date.now() - 3600000 * 2,
      read: false,
      type: 'system',
    },
    {
      id: '2',
      title: 'Escrow Locked',
      body: 'Invoice INV-9801 locked 450 ADA in escrow milestone #1.',
      timestamp: Date.now() - 3600000,
      read: false,
      type: 'escrow',
    }
  ],

  login: async (phone: string) => {
    // Simulated OTP trigger
    console.log('[UserStore] Triggered mock OTP send to:', phone);
  },

  verifyOtp: async (code: string) => {
    if (code.length === 6) {
      const mockUser: UserProfile = {
        id: 'usr_879021',
        phone: '+919988776655',
        displayName: 'Aarav Sharma',
        role: 'customer',
        onboardingStep: 'new',
        walletAddress: null,
      };

      if (Platform.OS !== 'web') {
        await SecureStore.setItemAsync('zeropay_user', JSON.stringify(mockUser));
        await SecureStore.setItemAsync('zeropay_logged_in', 'true');
      } else {
        localStorage.setItem('zeropay_user', JSON.stringify(mockUser));
        localStorage.setItem('zeropay_logged_in', 'true');
      }

      set({
        user: mockUser,
        isLoggedIn: true,
        isOnboarded: false,
        activeRole: 'customer',
      });
      return true;
    }
    return false;
  },

  selectRole: async (role: 'customer' | 'merchant' | 'hybrid') => {
    const { user } = get();
    if (!user) return;

    const updated = { ...user, role, onboardingStep: 'complete' as const };

    if (Platform.OS !== 'web') {
      await SecureStore.setItemAsync('zeropay_user', JSON.stringify(updated));
      await SecureStore.setItemAsync('zeropay_onboarded', 'true');
    } else {
      localStorage.setItem('zeropay_user', JSON.stringify(updated));
      localStorage.setItem('zeropay_onboarded', 'true');
    }

    set({
      user: updated,
      isOnboarded: true,
      activeRole: role === 'hybrid' ? 'customer' : role,
    });
  },

  toggleDeveloperMode: () => {
    const current = get().developerModeEnabled;
    const active = get().activeRole;
    set({
      developerModeEnabled: !current,
      activeRole: !current ? 'developer' : (active === 'developer' ? 'customer' : active),
    });
  },

  logout: async () => {
    if (Platform.OS !== 'web') {
      await SecureStore.deleteItemAsync('zeropay_user');
      await SecureStore.deleteItemAsync('zeropay_logged_in');
      await SecureStore.deleteItemAsync('zeropay_onboarded');
    } else {
      localStorage.removeItem('zeropay_user');
      localStorage.removeItem('zeropay_logged_in');
      localStorage.removeItem('zeropay_onboarded');
    }

    set({
      user: null,
      isLoggedIn: false,
      isOnboarded: false,
      activeRole: 'customer',
      developerModeEnabled: false,
    });
  },

  addNotification: (title: string, body: string, type: AppNotification['type'] = 'system') => {
    const newNotif: AppNotification = {
      id: Math.random().toString(36).substring(7),
      title,
      body,
      timestamp: Date.now(),
      read: false,
      type,
    };
    set((state) => ({ notifications: [newNotif, ...state.notifications] }));
  },

  markNotificationsAsRead: () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
    }));
  },

  loadSavedUser: async () => {
    try {
      let savedUser: string | null = null;
      let isLoggedInStr: string | null = null;
      let isOnboardedStr: string | null = null;

      if (Platform.OS !== 'web') {
        savedUser = await SecureStore.getItemAsync('zeropay_user');
        isLoggedInStr = await SecureStore.getItemAsync('zeropay_logged_in');
        isOnboardedStr = await SecureStore.getItemAsync('zeropay_onboarded');
      } else {
        savedUser = localStorage.getItem('zeropay_user');
        isLoggedInStr = localStorage.getItem('zeropay_logged_in');
        isOnboardedStr = localStorage.getItem('zeropay_onboarded');
      }

      if (savedUser && isLoggedInStr === 'true') {
        const userParsed = JSON.parse(savedUser) as UserProfile;
        set({
          user: userParsed,
          isLoggedIn: true,
          isOnboarded: isOnboardedStr === 'true',
          activeRole: userParsed.role === 'hybrid' ? 'customer' : userParsed.role,
        });
      }
    } catch (error) {
      console.error('[UserStore] Failed to load saved user session:', error);
    }
  },
}));
