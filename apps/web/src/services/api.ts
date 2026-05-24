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

// ─── Storefronts ─────────────────────────────────────────────────────────────

export const getStorefrontPublic = (slug: string) =>
  http.get<ApiResponse>(`/storefronts/${slug}`).then((r) => r.data);

export const getStorefrontCatalog = (slug: string) =>
  http.get<ApiResponse>(`/storefronts/${slug}/catalog`).then((r) => r.data);

export const setupStorefront = (data: {
  slug: string;
  profileImageUrl?: string;
  bannerImageUrl?: string;
  location?: { city: string; state: string; country: string };
  socialLinks?: { instagram?: string; twitter?: string; website?: string };
  businessHours?: string;
  isPublicStorefront?: boolean;
}) => http.post<ApiResponse>('/storefronts/setup', data).then((r) => r.data);

export const updateStorefront = (data: {
  shopName?: string;
  category?: string;
  description?: string;
  slug?: string;
  location?: { city?: string; state?: string; country?: string };
  socialLinks?: { instagram?: string; twitter?: string; website?: string };
  businessHours?: string;
  isPublicStorefront?: boolean;
}) => http.put<ApiResponse>('/storefronts/update', data).then((r) => r.data);

export const getFeaturedStorefronts = () =>
  http.get<ApiResponse>('/storefronts/featured').then((r) => r.data);

export const submitStorefrontReview = (slug: string, data: {
  invoiceId: string;
  rating: number;
  body?: string;
  productId?: string;
}) => http.post<ApiResponse>(`/storefronts/${slug}/review`, data).then((r) => r.data);

// ─── Catalog ──────────────────────────────────────────────────────────────────

export const createProduct = (data: {
  title: string;
  description: string;
  priceLovelace: number;
  priceINR?: number;
  category: 'digital' | 'physical' | 'service';
  isDigital: boolean;
  ipfsHash?: string;
  inventory?: number;
  images?: string[];
  tags?: string[];
}) => http.post<ApiResponse>('/catalog/products', data).then((r) => r.data);

export const updateProduct = (productId: string, data: {
  title?: string;
  description?: string;
  priceLovelace?: number;
  priceINR?: number;
  category?: 'digital' | 'physical' | 'service';
  isDigital?: boolean;
  ipfsHash?: string;
  inventory?: number;
  images?: string[];
  tags?: string[];
  isActive?: boolean;
}) => http.put<ApiResponse>(`/catalog/products/${productId}`, data).then((r) => r.data);

export const deleteProduct = (productId: string) =>
  http.delete<ApiResponse>(`/catalog/products/${productId}`).then((r) => r.data);

export const getProduct = (productId: string) =>
  http.get<ApiResponse>(`/catalog/products/${productId}`).then((r) => r.data);

export const buyProduct = (productId: string, data: { customerAddress: string }) =>
  http.post<ApiResponse>(`/catalog/products/${productId}/buy`, data).then((r) => r.data);

// ─── Developer Keys ───────────────────────────────────────────────────────────

export const createApiKey = (data: { name: string; permissions: string[] }) =>
  http.post<ApiResponse<{ apiKey: string }>>('/developer/keys/create', data).then((r) => r.data);

export const getApiKeys = () =>
  http.get<ApiResponse<any[]>>('/developer/keys').then((r) => r.data);

export const revokeApiKey = (keyId: string) =>
  http.delete<ApiResponse>(`/developer/keys/${keyId}`).then((r) => r.data);

// ─── Webhooks ────────────────────────────────────────────────────────────────

export const registerWebhook = (data: { url: string; events: string[] }) =>
  http.post<ApiResponse>('/webhooks/register', data).then((r) => r.data);

export const getWebhooks = () =>
  http.get<ApiResponse<any[]>>('/webhooks').then((r) => r.data);

export const deleteWebhook = (id: string) =>
  http.delete<ApiResponse>(`/webhooks/${id}`).then((r) => r.data);

export const testWebhook = (id: string) =>
  http.post<ApiResponse>(`/webhooks/${id}/test`).then((r) => r.data);

export const getWebhookDeliveries = (id: string) =>
  http.get<ApiResponse<any[]>>(`/webhooks/${id}/deliveries`).then((r) => r.data);

// ─── Reputation ──────────────────────────────────────────────────────────────

export const getReputationByWallet = (walletAddress: string) =>
  http.get<ApiResponse>(`/reputation/${walletAddress}`).then((r) => r.data);

export const getReputationBySlug = (slug: string) =>
  http.get<ApiResponse>(`/reputation/merchant/${slug}`).then((r) => r.data);

export const refreshReputation = (merchantId: string) =>
  http.post<ApiResponse>(`/reputation/refresh/${merchantId}`).then((r) => r.data);

export const getEscrowExplanation = (invoiceId: string) =>
  http.get<ApiResponse>(`/ai/escrow/${invoiceId}/explain`).then((r) => r.data);

// ─── Analytics ───────────────────────────────────────────────────────────────

export const getAnalyticsSummary = (params?: { windowDays?: number }) =>
  http.get<ApiResponse>('/analytics/merchant/summary', { params }).then((r) => r.data);

export const getAnalyticsRevenue = (params?: { windowDays?: number }) =>
  http.get<ApiResponse>('/analytics/merchant/revenue', { params }).then((r) => r.data);

export const getAnalyticsInsights = (params?: { windowDays?: number }) =>
  http.get<ApiResponse>('/analytics/merchant/insights', { params }).then((r) => r.data);

export const suggestPricing = (data: { description: string; category: string }) =>
  http.post<ApiResponse>('/analytics/pricing/suggest', data).then((r) => r.data);

export const generateInvoiceDraft = (data: { description: string; category: string }) =>
  http.post<ApiResponse>('/analytics/invoice/draft', data).then((r) => r.data);

// ─── Marketplace ──────────────────────────────────────────────────────────────

export const getMarketplaceFeed = (params?: { city?: string; category?: string; page?: number; limit?: number }) =>
  http.get<ApiResponse>('/marketplace/feed', { params }).then((r) => r.data);

export const getMarketplaceTrending = () =>
  http.get<ApiResponse>('/marketplace/trending').then((r) => r.data);

export const searchMarketplace = (params: { q: string }) =>
  http.get<ApiResponse>('/marketplace/search', { params }).then((r) => r.data);

export const getMarketplaceCategories = () =>
  http.get<ApiResponse>('/marketplace/categories').then((r) => r.data);

export const getMarketplaceNearby = (params: { city: string }) =>
  http.get<ApiResponse>('/marketplace/nearby', { params }).then((r) => r.data);
