"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createInvoice = createInvoice;
exports.getInvoiceDetails = getInvoiceDetails;
exports.lockEscrowTx = lockEscrowTx;
exports.submitEscrowLock = submitEscrowLock;
exports.releaseMilestoneTx = releaseMilestoneTx;
exports.submitReleaseMilestone = submitReleaseMilestone;
exports.raiseDisputeTx = raiseDisputeTx;
exports.submitRaiseDispute = submitRaiseDispute;
exports.adminResolveTx = adminResolveTx;
exports.submitAdminResolve = submitAdminResolve;
exports.uploadEvidence = uploadEvidence;
const client_1 = require("./client");
async function createInvoice(data) {
    const res = await client_1.apiClient.post('/api/v1/invoices', data);
    return res.data;
}
async function getInvoiceDetails(invoiceId) {
    const res = await client_1.apiClient.get(`/api/v1/invoices/${invoiceId}`);
    return res.data;
}
async function lockEscrowTx(invoiceId) {
    const res = await client_1.apiClient.post(`/api/v1/escrow/${invoiceId}/lock`);
    return res.data;
}
async function submitEscrowLock(invoiceId, txHash) {
    const res = await client_1.apiClient.post(`/api/v1/escrow/${invoiceId}/lock/submit`, { txHash });
    return res.data;
}
async function releaseMilestoneTx(invoiceId, customerAddress) {
    const res = await client_1.apiClient.post(`/api/v1/escrow/${invoiceId}/release`, { customerAddress });
    return res.data;
}
async function submitReleaseMilestone(invoiceId, txHash, milestoneIndex) {
    const res = await client_1.apiClient.post(`/api/v1/escrow/${invoiceId}/release/submit`, { txHash, milestoneIndex });
    return res.data;
}
async function raiseDisputeTx(invoiceId, signerAddress) {
    const res = await client_1.apiClient.post(`/api/v1/escrow/${invoiceId}/dispute`, { signerAddress });
    return res.data;
}
async function submitRaiseDispute(invoiceId, txHash) {
    const res = await client_1.apiClient.post(`/api/v1/escrow/${invoiceId}/dispute/submit`, { txHash });
    return res.data;
}
async function adminResolveTx(data) {
    const res = await client_1.apiClient.post(`/api/v1/escrow/${data.invoiceId}/resolve`, data);
    return res.data;
}
async function submitAdminResolve(invoiceId, txHash) {
    const res = await client_1.apiClient.post(`/api/v1/escrow/${invoiceId}/resolve/submit`, { txHash });
    return res.data;
}
async function uploadEvidence(invoiceId, file, fileName) {
    const formData = new FormData();
    if (file && typeof file === 'object' && 'uri' in file) {
        // React Native file format
        formData.append('file', file);
    }
    else {
        // Web File or Blob
        formData.append('file', file, fileName || 'file');
    }
    formData.append('invoiceId', invoiceId);
    const res = await client_1.apiClient.post('/api/v1/evidence/upload', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return res.data;
}
exports.default = {
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
