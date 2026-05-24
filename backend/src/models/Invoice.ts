import mongoose, { Document, Schema, Model } from 'mongoose';
import type { InvoiceStatus } from '@zeropay/shared-types';

export interface IInvoice extends Document {
  invoiceId: string;
  merchantId: mongoose.Types.ObjectId;
  merchantStringId: string;
  customerId?: mongoose.Types.ObjectId;
  chatRoomId?: string;
  description?: string;
  // Immutable snapshots — set once at creation
  amountPaise: number;
  amountLovelace: number;
  adaInrRate: number;
  paymentAddress: string;
  // Lifecycle
  status: InvoiceStatus;
  txHash?: string;
  expiresAt: Date;
  // Timestamps per transition
  submittedAt?: Date;
  confirmingAt?: Date;
  confirmedAt?: Date;
  settledAt?: Date;
  // Receipt
  receiptCid?: string;
  receiptPending?: boolean;
  // On-chain verification
  amountLovelaceVerified?: number;
  verificationResult?: 'amount-matched' | 'amount-mismatch' | 'address-mismatch';
  networkConfirmations?: number;
  createdAt: Date;
  updatedAt: Date;
}

const invoiceSchema = new Schema<IInvoice>(
  {
    invoiceId: {
      type: String,
      required: true,
      unique: true,
      immutable: true,
      index: true,
    },
    merchantId: {
      type: Schema.Types.ObjectId,
      ref: 'Merchant',
      required: true,
      index: true,
    },
    merchantStringId: {
      type: String,
      required: true,
      index: true,
    },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      sparse: true,
    },
    chatRoomId: {
      type: String,
      sparse: true,
    },
    description: {
      type: String,
      maxlength: 100,
      trim: true,
    },
    // ── Immutable snapshot fields ──────────────────────────────────────────────
    amountPaise: {
      type: Number,
      required: true,
      min: 100, // minimum ₹1.00
      immutable: true,
    },
    amountLovelace: {
      type: Number,
      required: true,
      min: 1000000, // minimum 1 ADA
      immutable: true,
    },
    adaInrRate: {
      type: Number,
      required: true,
      immutable: true,
    },
    paymentAddress: {
      type: String,
      required: true,
      immutable: true,
      match: /^addr(_test)?1[a-z0-9]+$/,
    },
    // ── Lifecycle ──────────────────────────────────────────────────────────────
    status: {
      type: String,
      enum: ['pending', 'submitted', 'confirming', 'confirmed', 'settled', 'expired', 'failed'],
      default: 'pending',
      index: true,
    },
    txHash: {
      type: String,
      sparse: true,
      unique: true,
      match: /^[a-f0-9]{64}$/,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expireAfterSeconds: 86400 }, // auto-cleanup after 24h post-expiry
    },
    submittedAt: Date,
    confirmingAt: Date,
    confirmedAt: Date,
    settledAt: Date,
    receiptCid: String,
    receiptPending: { type: Boolean, default: false },
    amountLovelaceVerified: Number,
    verificationResult: {
      type: String,
      enum: ['amount-matched', 'amount-mismatch', 'address-mismatch'],
    },
    networkConfirmations: Number,
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Compound indexes for common queries
invoiceSchema.index({ merchantId: 1, status: 1, createdAt: -1 });
invoiceSchema.index({ merchantStringId: 1, status: 1, createdAt: -1 });
invoiceSchema.index({ status: 1, expiresAt: 1 }); // expiry worker
invoiceSchema.index({ status: 1, createdAt: -1 }); // admin queries
invoiceSchema.index({ merchantId: 1, createdAt: -1 }); // optimized recent transaction feed
invoiceSchema.index({ merchantId: 1, status: 1, settledAt: -1 }); // optimized 7-day aggregation window

// Prevent mutation of immutable snapshot fields after creation
invoiceSchema.pre('save', function (next) {
  if (!this.isNew) {
    const immutableFields = ['amountPaise', 'amountLovelace', 'adaInrRate', 'paymentAddress'] as const;
    for (const field of immutableFields) {
      if (this.isModified(field)) {
        return next(new Error(`Cannot modify immutable field: ${field}`));
      }
    }
  }
  next();
});

export const Invoice: Model<IInvoice> = mongoose.model<IInvoice>('Invoice', invoiceSchema);
