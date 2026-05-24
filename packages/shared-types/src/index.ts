// ─── Invoice Types ───────────────────────────────────────────────────────────

export type InvoiceStatus =
  | 'pending'
  | 'submitted'
  | 'confirming'
  | 'confirmed'
  | 'settled'
  | 'expired'
  | 'failed';

export interface InvoiceSnapshot {
  amountPaise: number;
  amountLovelace: number;
  adaInrRate: number;
  paymentAddress: string;
}

export interface Invoice {
  invoiceId: string;
  merchantId: string;
  merchantStringId: string;
  customerId?: string;
  chatRoomId?: string;
  amountPaise: number;
  amountLovelace: number;
  adaInrRate: number;
  paymentAddress: string;
  status: InvoiceStatus;
  txHash?: string;
  description?: string;
  expiresAt: string;
  createdAt: string;
  submittedAt?: string;
  confirmingAt?: string;
  confirmedAt?: string;
  settledAt?: string;
  receiptCid?: string;
}

// ─── User Types ───────────────────────────────────────────────────────────────

export type UserRole = 'customer' | 'merchant' | 'both';

export type OnboardingStep =
  | 'new'
  | 'role-selected'
  | 'shop-complete'
  | 'wallet-complete'
  | 'complete';

export interface User {
  id: string;
  firebaseUid: string;
  phone: string;
  displayName: string;
  role: UserRole;
  walletAddress?: string;
  walletProvider?: string;
  stakeAddress?: string;
  fcmToken?: string;
  onboardingStep: OnboardingStep;
  createdAt: string;
  updatedAt: string;
}

// ─── Merchant Types ───────────────────────────────────────────────────────────

export type MerchantCategory =
  | 'food'
  | 'retail'
  | 'services'
  | 'vendor'
  | 'other';

export interface Merchant {
  id: string;
  userId: string;
  merchantId: string;
  shopName: string;
  category: MerchantCategory;
  description?: string;
  paymentAddress: string;
  invoiceExpiry: number;
  totalReceivedLovelace: number;
  totalOrders: number;
  createdAt: string;
  updatedAt: string;
}

// ─── API Response Types ───────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// ─── Price Types ──────────────────────────────────────────────────────────────

export interface AdaInrRate {
  rate: number;
  source: 'live' | 'cached' | 'fallback';
  cachedAt: string;
}

// ─── Chat Types ───────────────────────────────────────────────────────────────

export type MessageType =
  | 'text'
  | 'payment-request'
  | 'payment-submitted'
  | 'payment-confirming'
  | 'receipt'
  | 'system';

export interface ChatMessage {
  id: string;
  senderId: string | 'system';
  type: MessageType;
  timestamp: number;
  payload: Record<string, unknown>;
}

export interface ChatRoom {
  id: string;
  merchantId: string;
  customerId: string;
  participants: Record<string, boolean>;
  lastMessage?: {
    preview: string;
    timestamp: number;
  };
  unreadCounts: Record<string, number>;
  createdAt: number;
}

// ─── Payment Types ────────────────────────────────────────────────────────────

export interface BuildTxRequest {
  invoiceId: string;
}

export interface BuildTxResponse {
  unsignedCbor: string;
  invoiceId: string;
  amountLovelace: number;
  paymentAddress: string;
}

export interface SubmitTxRequest {
  invoiceId: string;
  txHash: string;
}

// ─── Receipt Types ────────────────────────────────────────────────────────────

export interface IpfsReceipt {
  version: string;
  invoiceId: string;
  txHash: string;
  amountLovelace: number;
  amountInr: number;
  adaInrRate: number;
  merchant: {
    merchantId: string;
    shopName: string;
    paymentAddress: string;
  };
  customer: {
    displayName: string;
    walletAddress?: string;
  };
  confirmedAt: string;
  settledAt: string;
  networkConfirmations: number;
}
