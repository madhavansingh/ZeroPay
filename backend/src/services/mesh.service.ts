import { MeshWallet, Transaction, BlockfrostProvider } from '@meshsdk/core';
import { env } from '../config/env';
import { Invoice } from '../models/Invoice';

const provider = new BlockfrostProvider(env.BLOCKFROST_PROJECT_ID);

const METADATA_KEY = 674; // CIP standard key for app metadata
const MAX_METADATA_BYTES = 64; // Cardano 64-byte field limit

/**
 * Truncate a string to 64 bytes (Cardano metadata limit).
 */
function truncateTo64Bytes(str: string): string {
  const encoded = new TextEncoder().encode(str);
  if (encoded.length <= MAX_METADATA_BYTES) return str;
  return new TextDecoder().decode(encoded.slice(0, MAX_METADATA_BYTES));
}

export interface BuildTxResult {
  unsignedCbor: string;
  invoiceId: string;
  amountLovelace: number;
  paymentAddress: string;
}

/**
 * Build an unsigned transaction CBOR for a payment invoice.
 * The backend NEVER signs — only builds and returns the unsigned CBOR.
 * The wallet (CIP-30) signs client-side.
 */
export async function buildPaymentTx(invoiceId: string): Promise<BuildTxResult> {
  const invoice = await Invoice.findOne({ invoiceId });
  if (!invoice) throw new Error('Invoice not found');
  if (invoice.status !== 'pending') {
    throw new Error(`Cannot build tx for invoice with status: ${invoice.status}`);
  }
  if (invoice.expiresAt < new Date()) {
    throw new Error('Invoice has expired');
  }

  // Build metadata (all values must be ≤ 64 bytes)
  const metadata = {
    [METADATA_KEY]: {
      app: truncateTo64Bytes('zeropay'),
      schema: truncateTo64Bytes('1'),
      invoiceId: truncateTo64Bytes(invoice.invoiceId),
      merchantId: truncateTo64Bytes(invoice.merchantStringId),
    },
  };

  // Build unsigned transaction
  // Note: MeshJS requires a wallet to build — we use a read-only provider approach
  // The actual signing happens client-side via CIP-30
  const tx = new Transaction({ initiator: provider as unknown as MeshWallet })
    .sendLovelace(invoice.paymentAddress, invoice.amountLovelace.toString())
    .setMetadata(METADATA_KEY, metadata[METADATA_KEY]);

  const unsignedCbor = await tx.build();

  return {
    unsignedCbor,
    invoiceId: invoice.invoiceId,
    amountLovelace: invoice.amountLovelace,
    paymentAddress: invoice.paymentAddress,
  };
}
