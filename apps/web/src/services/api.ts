import axios from 'axios';
import { auth } from './firebase';
import type {
  ApiResponse,
  AdaInrRate,
  Invoice,
  Merchant,
  BuildTxResponse,
  User,
} from '@zeropay/shared-types';

const BASE_URL = import.meta.env.VITE_API_URL ?? '/api/v1';

const http = axios.create({ baseURL: BASE_URL });

// Attach Firebase JWT to every request
http.interceptors.request.use(async (config) => {
  const currentUser = auth.currentUser;
  if (currentUser) {
    const token = await currentUser.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const syncUser = (data?: { displayName?: string; fcmToken?: string }) =>
  http.post<ApiResponse<User>>('/auth/sync', data).then((r) => r.data);

export const getMe = () =>
  http.get<ApiResponse<User>>('/auth/me').then((r) => r.data);

export const updateProfile = (data: { displayName?: string; fcmToken?: string }) =>
  http.put<ApiResponse>('/auth/profile', data).then((r) => r.data);

// ─── Price ────────────────────────────────────────────────────────────────────

export const getAdaInrRate = () =>
  http.get<ApiResponse<AdaInrRate>>('/price/ada-inr').then((r) => r.data);

// ─── Merchant ────────────────────────────────────────────────────────────────

export const onboardMerchant = (data: {
  shopName: string;
  category: string;
  description?: string;
}) => http.post<ApiResponse<Merchant>>('/merchant/onboard', data).then((r) => r.data);

export const getMerchantPublic = (merchantId: string) =>
  http.get<ApiResponse<Merchant>>(`/merchant/${merchantId}`).then((r) => r.data);

export const getMerchantDashboard = () =>
  http.get<ApiResponse>('/merchant/dashboard').then((r) => r.data);

export const connectWallet = (data: { walletAddress: string; stakeAddress?: string }) =>
  http.post<ApiResponse>('/merchant/wallet', data).then((r) => r.data);

// ─── Invoices ────────────────────────────────────────────────────────────────

export const createInvoice = (data: {
  amountPaise: number;
  description?: string;
  chatRoomId?: string;
  customerId?: string;
}) => http.post<ApiResponse<Invoice>>('/invoices/create', data).then((r) => r.data);

export const getInvoice = (invoiceId: string) =>
  http.get<ApiResponse<Invoice>>(`/invoices/${invoiceId}`).then((r) => r.data);

export const getMerchantInvoices = (params?: { page?: number; limit?: number; status?: string }) =>
  http.get<ApiResponse>('/invoices/merchant/list', { params }).then((r) => r.data);

// ─── Payments ────────────────────────────────────────────────────────────────

export const buildTx = (invoiceId: string) =>
  http.post<ApiResponse<BuildTxResponse>>('/payments/build-tx', { invoiceId }).then((r) => r.data);

export const submitTx = (data: { invoiceId: string; txHash: string }) =>
  http.post<ApiResponse>('/payments/submit', data).then((r) => r.data);
