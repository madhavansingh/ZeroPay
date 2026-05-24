import { Database } from 'firebase/database';
export declare function subscribeToInvoiceStatus(db: Database, invoiceId: string, onStatusUpdate: (status: string) => void): import("@firebase/database").Unsubscribe;
export declare function subscribeToEscrowDetails(db: Database, invoiceId: string, onEscrowUpdate: (data: {
    escrowState?: string;
    milestones?: any[];
    milestoneIndex?: number;
    isDisputed?: boolean;
    [key: string]: any;
}) => void): import("@firebase/database").Unsubscribe;
