import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

interface WalletState {
  address: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  walletName: string | null;
  connect: (address: string, walletName?: string) => Promise<void>;
  disconnect: () => Promise<void>;
  loadSavedWallet: () => Promise<void>;
  signTx: (unsignedCbor: string) => Promise<string>;
}

export const useWalletStore = create<WalletState>((set, get) => ({
  address: null,
  isConnected: false,
  isConnecting: false,
  walletName: null,

  connect: async (address: string, walletName: string = 'Eternl') => {
    set({ isConnecting: true });
    try {
      if (Platform.OS !== 'web') {
        await SecureStore.setItemAsync('zeropay_wallet_address', address);
        await SecureStore.setItemAsync('zeropay_wallet_name', walletName);
      } else {
        localStorage.setItem('zeropay_wallet_address', address);
        localStorage.setItem('zeropay_wallet_name', walletName);
      }
      set({ address, isConnected: true, isConnecting: false, walletName });
    } catch (error) {
      set({ isConnecting: false });
      console.error('[WalletStore] Failed to connect wallet:', error);
    }
  },

  disconnect: async () => {
    try {
      if (Platform.OS !== 'web') {
        await SecureStore.deleteItemAsync('zeropay_wallet_address');
        await SecureStore.deleteItemAsync('zeropay_wallet_name');
      } else {
        localStorage.removeItem('zeropay_wallet_address');
        localStorage.removeItem('zeropay_wallet_name');
      }
      set({ address: null, isConnected: false, walletName: null });
    } catch (error) {
      console.error('[WalletStore] Failed to disconnect wallet:', error);
    }
  },

  loadSavedWallet: async () => {
    try {
      let savedAddress: string | null = null;
      let savedName: string | null = null;

      if (Platform.OS !== 'web') {
        savedAddress = await SecureStore.getItemAsync('zeropay_wallet_address');
        savedName = await SecureStore.getItemAsync('zeropay_wallet_name');
      } else {
        savedAddress = localStorage.getItem('zeropay_wallet_address');
        savedName = localStorage.getItem('zeropay_wallet_name');
      }

      if (savedAddress) {
        set({ address: savedAddress, isConnected: true, walletName: savedName || 'Eternl' });
      }
    } catch (error) {
      console.error('[WalletStore] Failed to load saved wallet:', error);
    }
  },

  signTx: async (unsignedCbor: string) => {
    // In a production app, this initiates deep linking (e.g. eternl://sign/...) or WalletConnect v2
    console.log('[WalletStore] Requesting signature via hybrid deep linking/WalletConnect:', unsignedCbor);
    
    // Mimic deep-linking / signing delay
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    // Return a mock signature/signed transaction string for testing & demo purposes
    return `${unsignedCbor}_signed`;
  },
}));
