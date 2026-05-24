import { useEffect, useState, useCallback, useRef } from 'react';
import { database } from '../services/firebase';
import { ref, onValue } from 'firebase/database';
import * as SecureStore from 'expo-secure-store';
import { Platform, AppState, AppStateStatus } from 'react-native';
import axios from 'axios';

export interface EscrowState {
  invoiceId: string;
  status: string;
  escrowState: string | null;
  milestones: any[];
  milestoneIndex: number;
  totalMilestones: number;
  amountPaise: number;
  amountLovelace: number;
  paymentAddress?: string;
  isDisputed?: boolean;
  updatedAt?: number;
}

interface OfflineAction {
  id: string;
  type: 'submit-payment' | 'raise-dispute' | 'submit-evidence';
  endpoint: string;
  payload: any;
}

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';

export function useEscrowSync(invoiceId: string, userToken?: string) {
  const [invoiceData, setInvoiceData] = useState<EscrowState | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [offlineQueue, setOfflineQueue] = useState<OfflineAction[]>([]);
  
  const prevConnectedRef = useRef<boolean>(true);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  const cacheKey = `zeropay_cache_invoice_${invoiceId}`;
  const queueKey = `zeropay_offline_actions_queue`;

  // ─── 1. Cache Management & Stale State Cleanup (24h Limit) ──────────────────

  const saveToLocalCache = useCallback(async (data: EscrowState) => {
    try {
      const serialized = JSON.stringify({ ...data, updatedAt: Date.now() });
      if (Platform.OS !== 'web') {
        await SecureStore.setItemAsync(cacheKey, serialized);
      } else {
        localStorage.setItem(cacheKey, serialized);
      }
    } catch (err) {
      console.warn('[EscrowSync] Failed to cache invoice state:', err);
    }
  }, [cacheKey]);

  const loadFromLocalCache = useCallback(async () => {
    try {
      let cached: string | null = null;
      if (Platform.OS !== 'web') {
        cached = await SecureStore.getItemAsync(cacheKey);
      } else {
        cached = localStorage.getItem(cacheKey);
      }

      if (cached) {
        const parsed = JSON.parse(cached);
        // Stale state cleanup: check if older than 24 hours (86400000ms)
        const isStale = Date.now() - (parsed.updatedAt || 0) > 86400000;
        if (isStale) {
          console.log('[EscrowSync] Evicting stale local cache (older than 24h)');
          if (Platform.OS !== 'web') {
            await SecureStore.deleteItemAsync(cacheKey);
          } else {
            localStorage.removeItem(cacheKey);
          }
        } else {
          setInvoiceData(parsed);
        }
      }
    } catch (err) {
      console.warn('[EscrowSync] Failed to load from local cache:', err);
    }
  }, [cacheKey]);

  // ─── 2. Offline Action Reconnect Recovery Queue ─────────────────────────────

  const loadOfflineQueue = useCallback(async () => {
    try {
      let queueStr: string | null = null;
      if (Platform.OS !== 'web') {
        queueStr = await SecureStore.getItemAsync(queueKey);
      } else {
        queueStr = localStorage.getItem(queueKey);
      }

      if (queueStr) {
        setOfflineQueue(JSON.parse(queueStr));
      }
    } catch (err) {
      console.warn('[EscrowSync] Failed to load offline actions queue:', err);
    }
  }, [queueKey]);

  const saveOfflineQueue = useCallback(async (queue: OfflineAction[]) => {
    try {
      const serialized = JSON.stringify(queue);
      if (Platform.OS !== 'web') {
        await SecureStore.setItemAsync(queueKey, serialized);
      } else {
        localStorage.setItem(queueKey, serialized);
      }
      setOfflineQueue(queue);
    } catch (err) {
      console.warn('[EscrowSync] Failed to save offline actions queue:', err);
    }
  }, [queueKey]);

  const enqueueOfflineAction = useCallback(async (action: Omit<OfflineAction, 'id'>) => {
    const fullAction: OfflineAction = {
      ...action,
      id: Math.random().toString(36).substring(7),
    };
    const newQueue = [...offlineQueue, fullAction];
    await saveOfflineQueue(newQueue);
    console.log('[EscrowSync] Action enqueued to offline queue:', fullAction);
  }, [offlineQueue, saveOfflineQueue]);

  const processOfflineQueue = useCallback(async () => {
    if (offlineQueue.length === 0) return;
    console.log(`[EscrowSync] Reconnected! Processing ${offlineQueue.length} pending offline actions...`);
    const headers: Record<string, string> = {};
    if (userToken) {
      headers['Authorization'] = `Bearer ${userToken}`;
    }

    const remainingActions = [...offlineQueue];

    for (const action of offlineQueue) {
      try {
        await axios.post(`${API_URL}${action.endpoint}`, action.payload, { headers, timeout: 8000 });
        console.log(`[EscrowSync] Successfully executed offline action: ${action.type}`);
        // Remove from list
        const index = remainingActions.findIndex((a) => a.id === action.id);
        if (index > -1) remainingActions.splice(index, 1);
      } catch (err: any) {
        console.warn(`[EscrowSync] Failed to execute offline action ${action.type}:`, err.message);
        // Keep in queue for next reconnect retry
      }
    }

    await saveOfflineQueue(remainingActions);
  }, [offlineQueue, userToken, saveOfflineQueue]);

  // ─── 3. Fetch from API (Absolute Source of Truth with Exponential Retries) ──────

  const fetchFromApi = useCallback(async (maxAttempts: number = 3) => {
    if (!invoiceId) return;
    let attempt = 0;
    let delay = 1000;

    const executeFetch = async () => {
      const headers: Record<string, string> = {};
      if (userToken) {
        headers['Authorization'] = `Bearer ${userToken}`;
      }
      
      const response = await axios.get(`${API_URL}/api/v1/invoices/${invoiceId}`, {
        headers,
        timeout: 8000,
      });

      if (response.data?.success && response.data?.invoice) {
        const inv = response.data.invoice;
        const normalized: EscrowState = {
          invoiceId: inv.invoiceId,
          status: inv.status,
          escrowState: inv.escrowState || null,
          milestones: inv.milestones || [],
          milestoneIndex: inv.milestoneIndex ?? 0,
          totalMilestones: inv.totalMilestones ?? (inv.milestones?.length || 0),
          amountPaise: inv.amountPaise,
          amountLovelace: inv.amountLovelace,
          paymentAddress: inv.paymentAddress,
          isDisputed: inv.isDisputed || false,
        };
        setInvoiceData(normalized);
        saveToLocalCache(normalized);
        setError(null);
      }
    };

    while (true) {
      try {
        attempt++;
        await executeFetch();
        break; // break loop on success
      } catch (err: any) {
        if (attempt >= maxAttempts) {
          console.warn('[EscrowSync] API fetch failed permanently:', err.message);
          await loadFromLocalCache();
          break;
        }
        console.log(`[EscrowSync] Fetch attempt ${attempt} failed. Retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= 2; // exponential backoff
      } finally {
        setLoading(false);
      }
    }
  }, [invoiceId, userToken, saveToLocalCache, loadFromLocalCache]);

  // ─── 4. Reconnection & AppState Lifecycle Hooks ────────────────────────────

  useEffect(() => {
    if (!invoiceId) return;

    setLoading(true);
    
    // Load local storage and offline queues immediately
    Promise.all([loadFromLocalCache(), loadOfflineQueue()]).then(() => {
      fetchFromApi();
    });

    // AppState Listener (Resume state recovery)
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
        console.log('[EscrowSync] App resumed from background. Forcing absolute status synchronization...');
        fetchFromApi();
        loadOfflineQueue().then(() => {
          processOfflineQueue();
        });
      }
      appStateRef.current = nextAppState;
    };

    const appStateSub = AppState.addEventListener('change', handleAppStateChange);

    // Firebase Connection State Listener
    const connectedRef = ref(database, '.info/connected');
    const unsubscribeConnected = onValue(connectedRef, (snap) => {
      const connected = snap.val() === true;
      setIsOffline(!connected);

      if (connected) {
        if (!prevConnectedRef.current) {
          console.log('[EscrowSync] Connection restored. Synchronizing states and queues...');
          fetchFromApi();
          processOfflineQueue();
        }
      }
      prevConnectedRef.current = connected;
    });

    // Firebase RTDB Invoice Status Listener
    const statusRef = ref(database, `/invoices/${invoiceId}`);
    const unsubscribeStatus = onValue(statusRef, (snap) => {
      const status = snap.val();
      if (status) {
        setInvoiceData((prev) => {
          if (!prev) return null;
          const updated = { ...prev, status };
          saveToLocalCache(updated);
          return updated;
        });
      }
    });

    // Firebase RTDB Escrow State Listener
    const escrowRef = ref(database, `/escrow/${invoiceId}`);
    const unsubscribeEscrow = onValue(escrowRef, (snap) => {
      const data = snap.val();
      if (data) {
        setInvoiceData((prev) => {
          if (!prev) return null;
          const updated = {
            ...prev,
            escrowState: data.escrowState !== undefined ? data.escrowState : prev.escrowState,
            milestones: data.milestones !== undefined ? data.milestones : prev.milestones,
            milestoneIndex: data.milestoneIndex !== undefined ? data.milestoneIndex : prev.milestoneIndex,
            isDisputed: data.isDisputed !== undefined ? data.isDisputed : prev.isDisputed,
          };
          saveToLocalCache(updated);
          return updated;
        });
      }
    });

    return () => {
      appStateSub.remove();
      unsubscribeConnected();
      unsubscribeStatus();
      unsubscribeEscrow();
    };
  }, [invoiceId, fetchFromApi, loadFromLocalCache, loadOfflineQueue, processOfflineQueue, saveToLocalCache]);

  return {
    invoiceData,
    loading,
    error,
    isOffline,
    offlineQueue,
    enqueueOfflineAction,
    syncEscrow: () => fetchFromApi(3),
  };
}
