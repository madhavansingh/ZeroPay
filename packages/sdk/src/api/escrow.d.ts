import { ApiResponse } from '@zeropay/shared-types';
export declare function createInvoice(data: {
    amountPaise: number;
    description: string;
    milestones?: {
        title: string;
        amountPaise: number;
    }[];
}): Promise<ApiResponse>;
export declare function getInvoiceDetails(invoiceId: string): Promise<ApiResponse>;
export declare function lockEscrowTx(invoiceId: string): Promise<ApiResponse>;
export declare function submitEscrowLock(invoiceId: string, txHash: string): Promise<ApiResponse>;
export declare function releaseMilestoneTx(invoiceId: string, customerAddress: string): Promise<ApiResponse>;
export declare function submitReleaseMilestone(invoiceId: string, txHash: string, milestoneIndex: number): Promise<ApiResponse>;
export declare function raiseDisputeTx(invoiceId: string, signerAddress: string): Promise<ApiResponse>;
export declare function submitRaiseDispute(invoiceId: string, txHash: string): Promise<ApiResponse>;
export declare function adminResolveTx(data: {
    invoiceId: string;
    adminAddress: string;
    merchantPayoutLovelace: number;
    customerPayoutLovelace: number;
    customerAddress: string;
}): Promise<ApiResponse>;
export declare function submitAdminResolve(invoiceId: string, txHash: string): Promise<ApiResponse>;
export declare function uploadEvidence(invoiceId: string, file: any, fileName?: string): Promise<ApiResponse>;
declare const _default: {
    createInvoice: typeof createInvoice;
    getInvoiceDetails: typeof getInvoiceDetails;
    lockEscrowTx: typeof lockEscrowTx;
    submitEscrowLock: typeof submitEscrowLock;
    releaseMilestoneTx: typeof releaseMilestoneTx;
    submitReleaseMilestone: typeof submitReleaseMilestone;
    raiseDisputeTx: typeof raiseDisputeTx;
    submitRaiseDispute: typeof submitRaiseDispute;
    adminResolveTx: typeof adminResolveTx;
    submitAdminResolve: typeof submitAdminResolve;
    uploadEvidence: typeof uploadEvidence;
};
export default _default;
