"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.subscribeToInvoiceStatus = subscribeToInvoiceStatus;
exports.subscribeToEscrowDetails = subscribeToEscrowDetails;
const database_1 = require("firebase/database");
function subscribeToInvoiceStatus(db, invoiceId, onStatusUpdate) {
    const statusRef = (0, database_1.ref)(db, `/invoices/${invoiceId}`);
    return (0, database_1.onValue)(statusRef, (snapshot) => {
        const status = snapshot.val();
        if (status) {
            onStatusUpdate(status);
        }
    });
}
function subscribeToEscrowDetails(db, invoiceId, onEscrowUpdate) {
    const escrowRef = (0, database_1.ref)(db, `/escrow/${invoiceId}`);
    return (0, database_1.onValue)(escrowRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            onEscrowUpdate(data);
        }
    });
}
