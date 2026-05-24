import { Database, ref, onValue } from 'firebase/database';

export function subscribeToInvoiceStatus(
  db: Database,
  invoiceId: string,
  onStatusUpdate: (status: string) => void
) {
  const statusRef = ref(db, `/invoices/${invoiceId}`);
  return onValue(statusRef, (snapshot) => {
    const status = snapshot.val();
    if (status) {
      onStatusUpdate(status);
    }
  });
}

export function subscribeToEscrowDetails(
  db: Database,
  invoiceId: string,
  onEscrowUpdate: (data: {
    escrowState?: string;
    milestones?: any[];
    milestoneIndex?: number;
    isDisputed?: boolean;
    [key: string]: any;
  }) => void
) {
  const escrowRef = ref(db, `/escrow/${invoiceId}`);
  return onValue(escrowRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      onEscrowUpdate(data);
    }
  });
}
