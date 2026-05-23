import mongoose, { Document, Schema, Model } from 'mongoose';
import type { MerchantCategory } from '@zeropay/shared-types';

export interface IMerchant extends Document {
  userId: mongoose.Types.ObjectId;
  merchantId: string;
  shopName: string;
  category: MerchantCategory;
  description?: string;
  paymentAddress: string;
  invoiceExpiry: number;
  totalReceivedLovelace: number;
  totalOrders: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const merchantSchema = new Schema<IMerchant>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      immutable: true,
      index: true,
    },
    merchantId: {
      type: String,
      required: true,
      unique: true,
      immutable: true,
      index: true,
      match: /^MC-\d{4,6}$/,
    },
    shopName: {
      type: String,
      required: true,
      minlength: 2,
      maxlength: 50,
      trim: true,
    },
    category: {
      type: String,
      enum: ['food', 'retail', 'services', 'vendor', 'other'],
      required: true,
    },
    description: {
      type: String,
      maxlength: 200,
      trim: true,
    },
    paymentAddress: {
      type: String,
      required: true,
      index: true,
      match: /^addr(_test)?1[a-z0-9]+$/,
    },
    invoiceExpiry: {
      type: Number,
      required: true,
      default: 600,
      min: 300,
      max: 1800,
    },
    totalReceivedLovelace: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalOrders: {
      type: Number,
      default: 0,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Compound index for dashboard queries
merchantSchema.index({ userId: 1, isActive: 1 });

export const Merchant: Model<IMerchant> = mongoose.model<IMerchant>('Merchant', merchantSchema);
