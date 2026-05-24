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

export const updateRoleAndStep = (data: { role?: string; onboardingStep?: string }) =>
  http.put<ApiResponse<User>>('/auth/role', data).then((r) => r.data);

export const logoutUser = () =>
  http.post<ApiResponse>('/auth/logout').then((r) => r.data);

// ─── Price ────────────────────────────────────────────────────────────────────

export const getAdaInrRate = () =>
  http.get<ApiResponse<AdaInrRate>>('/price/ada-inr').then((r) => r.data);

// ─── Merchant ────────────────────────────────────────────────────────────────

export const onboardMerchant = (data: {
  shopName: string;
  category: string;
  description?: string;
  walletAddress: string;
  walletProvider: string;
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

export const buildTx = (invoiceId: string, customerAddress: string) =>
  http.post<ApiResponse<BuildTxResponse>>('/payments/build-tx', { invoiceId, customerAddress }).then((r) => r.data);

export const submitTx = (data: { invoiceId: string; txHash: string }) =>
  http.post<ApiResponse>('/payments/submit', data).then((r) => r.data);

// ─── Chat ─────────────────────────────────────────────────────────────────────

export const createChatRoom = (data: { merchantStringId: string }) =>
  http.post<ApiResponse<{ roomId: string; shopName: string; isNew: boolean }>>(
    '/chat/rooms/create',
    data
  ).then((r) => r.data);

export const getChatRooms = () =>
  http.get<ApiResponse<{ rooms: unknown[] }>>('/chat/rooms').then((r) => r.data);

export const getChatRoom = (roomId: string) =>
  http.get<ApiResponse>(`/chat/rooms/${roomId}`).then((r) => r.data);

// ─── Escrow ───────────────────────────────────────────────────────────────────

export interface EscrowTxResult {
  unsignedCbor: string;
  scriptAddress: string;
  invoiceId: string;
}

export interface EscrowStatus {
  invoiceId: string;
  status: string;
  escrowState: string;
  milestoneIndex: number;
  totalMilestones: number;
  isDisputed: boolean;
  milestones: Array<{
    title: string;
    amountLovelace: number;
    status: string;
    releasedAt?: string;
  }>;
}

/** Build unsigned lock TX — customer provides their bech32 address */
export const buildEscrowLockTx = (invoiceId: string, customerAddress: string) =>
  http
    .post<ApiResponse<EscrowTxResult>>(`/escrow/${invoiceId}/lock`, { customerAddress })
    .then((r) => r.data);

/** Record confirmed lock TX hash */
export const submitEscrowLock = (
  invoiceId: string,
  txHash: string,
  customerAddress: string
) =>
  http
    .post<ApiResponse>(`/escrow/${invoiceId}/lock/submit`, { txHash, customerAddress })
    .then((r) => r.data);

/** Build unsigned milestone release TX */
export const buildEscrowRelease = (params: {
  invoiceId: string;
  customerAddress: string;
  scriptUtxoTxHash: string;
  scriptUtxoIndex: number;
  payoutLovelace: number;
}) =>
  http
    .post<ApiResponse<EscrowTxResult>>(`/escrow/${params.invoiceId}/release`, params)
    .then((r) => r.data);

/** Record confirmed milestone release TX hash */
export const submitEscrowRelease = (
  invoiceId: string,
  txHash: string,
  payoutLovelace: number
) =>
  http
    .post<ApiResponse>(`/escrow/${invoiceId}/release/submit`, { txHash, payoutLovelace })
    .then((r) => r.data);

/** Build unsigned dispute TX */
export const buildEscrowDispute = (params: {
  invoiceId: string;
  signerAddress: string;
  scriptUtxoTxHash: string;
  scriptUtxoIndex: number;
}) =>
  http
    .post<ApiResponse<EscrowTxResult>>(`/escrow/${params.invoiceId}/dispute`, params)
    .then((r) => r.data);

/** Record confirmed dispute TX hash */
export const submitEscrowDispute = (invoiceId: string, txHash: string) =>
  http
    .post<ApiResponse>(`/escrow/${invoiceId}/dispute/submit`, { txHash })
    .then((r) => r.data);

/** Get live escrow state for an invoice */
export const getEscrowStatus = (invoiceId: string) =>
  http.get<ApiResponse<EscrowStatus>>(`/escrow/${invoiceId}/status`).then((r) => r.data);
