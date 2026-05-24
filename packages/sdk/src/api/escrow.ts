import { apiClient } from './client';
import { ApiResponse } from '@zeropay/shared-types';

export async function createInvoice(data: {
  amountPaise: number;
  description: string;
  milestones?: { title: string; amountPaise: number }[];
  network?: 'cardano' | 'base';
}): Promise<ApiResponse> {
  const res = await apiClient.post('/api/v1/invoices/create', data);
  return res.data;
}

export async function getInvoiceDetails(invoiceId: string): Promise<ApiResponse> {
  const res = await apiClient.get(`/api/v1/invoices/${invoiceId}`);
  return res.data;
}

export async function lockEscrowTx(invoiceId: string): Promise<ApiResponse> {
  const res = await apiClient.post(`/api/v1/escrow/${invoiceId}/lock`);
  return res.data;
}

export async function submitEscrowLock(invoiceId: string, txHash: string): Promise<ApiResponse> {
  const res = await apiClient.post(`/api/v1/escrow/${invoiceId}/lock/submit`, { txHash });
  return res.data;
}

export async function releaseMilestoneTx(invoiceId: string, customerAddress: string): Promise<ApiResponse> {
  const res = await apiClient.post(`/api/v1/escrow/${invoiceId}/release`, { customerAddress });
  return res.data;
}

export async function submitReleaseMilestone(invoiceId: string, txHash: string, milestoneIndex: number): Promise<ApiResponse> {
  const res = await apiClient.post(`/api/v1/escrow/${invoiceId}/release/submit`, { txHash, milestoneIndex });
  return res.data;
}

export async function raiseDisputeTx(invoiceId: string, signerAddress: string): Promise<ApiResponse> {
  const res = await apiClient.post(`/api/v1/escrow/${invoiceId}/dispute`, { signerAddress });
  return res.data;
}

export async function submitRaiseDispute(invoiceId: string, txHash: string): Promise<ApiResponse> {
  const res = await apiClient.post(`/api/v1/escrow/${invoiceId}/dispute/submit`, { txHash });
  return res.data;
}

export async function adminResolveTx(data: {
  invoiceId: string;
  adminAddress: string;
  merchantPayoutLovelace: number;
  customerPayoutLovelace: number;
  customerAddress: string;
}): Promise<ApiResponse> {
  const res = await apiClient.post(`/api/v1/escrow/${data.invoiceId}/resolve`, data);
  return res.data;
}

export async function submitAdminResolve(invoiceId: string, txHash: string): Promise<ApiResponse> {
  const res = await apiClient.post(`/api/v1/escrow/${invoiceId}/resolve/submit`, { txHash });
  return res.data;
}

export async function uploadEvidence(invoiceId: string, file: any, fileName?: string): Promise<ApiResponse> {
  const formData = new FormData();
  if (file && typeof file === 'object' && 'uri' in file) {
    // React Native file format
    formData.append('file', file as any);
  } else {
    // Web File or Blob
    formData.append('file', file, fileName || 'file');
  }
  formData.append('invoiceId', invoiceId);
  const res = await apiClient.post('/api/v1/evidence/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return res.data;
}
export default {
  createInvoice,
  getInvoiceDetails,
  lockEscrowTx,
  submitEscrowLock,
  releaseMilestoneTx,
  submitReleaseMilestone,
  raiseDisputeTx,
  submitRaiseDispute,
  adminResolveTx,
  submitAdminResolve,
  uploadEvidence,
};
