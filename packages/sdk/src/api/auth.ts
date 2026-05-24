import { apiClient } from './client';
import { ApiResponse } from '@zeropay/shared-types';

export async function syncUserProfile(data: {
  displayName?: string;
  phone?: string;
  fcmToken?: string;
}): Promise<ApiResponse> {
  const res = await apiClient.post('/api/v1/auth/sync', data);
  return res.data;
}

export async function updateUserProfile(data: {
  displayName?: string;
  fcmToken?: string;
  notificationPreferences?: {
    paymentReceived?: boolean;
    paymentConfirmed?: boolean;
    invoiceExpired?: boolean;
    escrowUpdates?: boolean;
    disputeAlerts?: boolean;
    milestoneNotifications?: boolean;
    channels?: ('push' | 'email')[];
  };
}): Promise<ApiResponse> {
  const res = await apiClient.put('/api/v1/auth/profile', data);
  return res.data;
}

export async function selectUserRole(role: 'customer' | 'merchant' | 'both'): Promise<ApiResponse> {
  const res = await apiClient.put('/api/v1/auth/role', { role });
  return res.data;
}

export async function logoutUser(): Promise<ApiResponse> {
  const res = await apiClient.post('/api/v1/auth/logout');
  return res.data;
}
