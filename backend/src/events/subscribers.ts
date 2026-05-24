import { domainEventBus, DomainEvents } from './eventBus';
import { logProtocolActivity } from '../services/audit.service';
import { updateMerchantReputation } from '../services/reputation.service';
import { enqueueNotification, enqueueDigitalDelivery, NotificationJobData } from '../queues/queue.definitions';
import { Invoice } from '../models/Invoice';
import { Merchant } from '../models/Merchant';
import { Product } from '../models/Product';
import { logger } from '../config/logger';

export function initSubscribers(): void {
  logger.info('[Subscribers] Initializing local domain event subscribers...');

  // ─── 1. EscrowLocked ───────────────────────────────────────────────────────
  domainEventBus.on(DomainEvents.EscrowLocked, async (payload) => {
    const { invoiceId, txHash, amountLovelace, customerAddress, actorId, requestId } = payload;
    
    // Log to immutable audit log
    await logProtocolActivity({
      eventType: DomainEvents.EscrowLocked,
      status: 'success',
      actorId: actorId || 'system',
      requestId,
      invoiceId,
      metadata: { txHash, amountLovelace, customerAddress },
      details: `Escrow funds locked. TxHash: ${txHash}. Amount: ${amountLovelace} Lovelace.`,
    });

    // Send Notification
    try {
      const invoice = await Invoice.findOne({ invoiceId });
      if (invoice) {
        const merchant = await Merchant.findById(invoice.merchantId);
        if (merchant) {
          await enqueueNotification({
            type: 'escrow-locked',
            merchantUserId: merchant.userId.toString(),
            customerUserId: invoice.customerId?.toString(),
            invoiceId,
            amountPaise: invoice.amountPaise,
            shopName: merchant.shopName,
          });
        }
      }
    } catch (err: any) {
      logger.error('[Subscribers] Failed in EscrowLocked notification trigger:', { detail: err.message });
    }
  });

  // ─── 2. MilestoneReleased ──────────────────────────────────────────────────
  domainEventBus.on(DomainEvents.MilestoneReleased, async (payload) => {
    const { invoiceId, txHash, milestoneIndex, payoutLovelace, isFinal, customerAddress, actorId, requestId } = payload;

    // Log to immutable audit log
    await logProtocolActivity({
      eventType: DomainEvents.MilestoneReleased,
      status: 'success',
      actorId: actorId || 'system',
      requestId,
      invoiceId,
      metadata: { txHash, milestoneIndex, payoutLovelace, isFinal, customerAddress },
      details: `Milestone index ${milestoneIndex} released (${isFinal ? 'Final' : 'Partial'}). TxHash: ${txHash}. Payout: ${payoutLovelace} Lovelace.`,
    });

    try {
      const invoice = await Invoice.findOne({ invoiceId });
      if (invoice) {
        // Trigger merchant reputation recalculation
        await updateMerchantReputation(invoice.merchantId.toString());

        // Send Notification
        const merchant = await Merchant.findById(invoice.merchantId);
        if (merchant) {
          await enqueueNotification({
            type: 'milestone-released',
            merchantUserId: merchant.userId.toString(),
            customerUserId: invoice.customerId?.toString(),
            invoiceId,
            amountPaise: invoice.amountPaise,
            shopName: merchant.shopName,
          });
        }
        // Check if digital product delivery is needed
        if (isFinal && invoice.productId && invoice.customerId) {
          const product = await Product.findById(invoice.productId);
          if (product && (product.isDigital || product.category === 'digital') && product.ipfsHash) {
            await enqueueDigitalDelivery({
              invoiceId,
              productId: product._id.toString(),
              customerId: invoice.customerId.toString(),
              ipfsHash: product.ipfsHash,
            });
            logger.info('[Subscribers] Enqueued digital delivery for milestone release', { invoiceId, productId: product._id });
          }
        }
      }
    } catch (err: any) {
      logger.error('[Subscribers] Failed in MilestoneReleased updates:', { detail: err.message });
    }
  });

  // ─── 3. DisputeRaised ──────────────────────────────────────────────────────
  domainEventBus.on(DomainEvents.DisputeRaised, async (payload) => {
    const { invoiceId, txHash, signerAddress, actorId, requestId } = payload;

    // Log to immutable audit log
    await logProtocolActivity({
      eventType: DomainEvents.DisputeRaised,
      status: 'success',
      actorId: actorId || 'system',
      requestId,
      invoiceId,
      metadata: { txHash, signerAddress },
      details: `Dispute raised on escrow contract. TxHash: ${txHash}. Signer: ${signerAddress}`,
    });

    try {
      const invoice = await Invoice.findOne({ invoiceId });
      if (invoice) {
        const merchant = await Merchant.findById(invoice.merchantId);
        if (merchant) {
          await enqueueNotification({
            type: 'dispute-raised',
            merchantUserId: merchant.userId.toString(),
            customerUserId: invoice.customerId?.toString(),
            invoiceId,
            amountPaise: invoice.amountPaise,
            shopName: merchant.shopName,
          });
        }
      }
    } catch (err: any) {
      logger.error('[Subscribers] Failed in DisputeRaised notification trigger:', { detail: err.message });
    }
  });

  // ─── 4. RefundCompleted ────────────────────────────────────────────────────
  domainEventBus.on(DomainEvents.RefundCompleted, async (payload) => {
    const { invoiceId, txHash, payoutLovelace, customerAddress, actorId, requestId } = payload;

    // Log to immutable audit log
    await logProtocolActivity({
      eventType: DomainEvents.RefundCompleted,
      status: 'success',
      actorId: actorId || 'system',
      requestId,
      invoiceId,
      metadata: { txHash, payoutLovelace, customerAddress },
      details: `Escrow funds fully refunded to customer. TxHash: ${txHash}. Payout: ${payoutLovelace} Lovelace.`,
    });

    try {
      const invoice = await Invoice.findOne({ invoiceId });
      if (invoice) {
        const merchant = await Merchant.findById(invoice.merchantId);
        if (merchant) {
          await enqueueNotification({
            type: 'refund-completed',
            merchantUserId: merchant.userId.toString(),
            customerUserId: invoice.customerId?.toString(),
            invoiceId,
            amountPaise: invoice.amountPaise,
            shopName: merchant.shopName,
          });
        }
      }
    } catch (err: any) {
      logger.error('[Subscribers] Failed in RefundCompleted notification trigger:', { detail: err.message });
    }
  });

  // ─── 5. EscrowResolved ─────────────────────────────────────────────────────
  domainEventBus.on(DomainEvents.EscrowResolved, async (payload) => {
    const { invoiceId, txHash, merchantPayoutLovelace, customerPayoutLovelace, actorId, requestId } = payload;

    // Log to immutable audit log
    await logProtocolActivity({
      eventType: DomainEvents.EscrowResolved,
      status: 'success',
      actorId: actorId || 'system',
      requestId,
      invoiceId,
      metadata: { txHash, merchantPayoutLovelace, customerPayoutLovelace },
      details: `Dispute resolved by Admin. TxHash: ${txHash}. Payouts: Merchant=${merchantPayoutLovelace} Lovelace, Customer=${customerPayoutLovelace} Lovelace.`,
    });

    try {
      const invoice = await Invoice.findOne({ invoiceId });
      if (invoice) {
        // Trigger merchant reputation recalculation
        await updateMerchantReputation(invoice.merchantId.toString());

        // Send Notification
        const merchant = await Merchant.findById(invoice.merchantId);
        if (merchant) {
          await enqueueNotification({
            type: 'payment-confirmed',
            merchantUserId: merchant.userId.toString(),
            customerUserId: invoice.customerId?.toString(),
            invoiceId,
            amountPaise: invoice.amountPaise,
            shopName: merchant.shopName,
          });
        }
        // Check if digital product delivery is needed
        if (invoice.productId && invoice.customerId) {
          const product = await Product.findById(invoice.productId);
          if (product && (product.isDigital || product.category === 'digital') && product.ipfsHash) {
            await enqueueDigitalDelivery({
              invoiceId,
              productId: product._id.toString(),
              customerId: invoice.customerId.toString(),
              ipfsHash: product.ipfsHash,
            });
            logger.info('[Subscribers] Enqueued digital delivery for escrow resolution', { invoiceId, productId: product._id });
          }
        }
      }
    } catch (err: any) {
      logger.error('[Subscribers] Failed in EscrowResolved updates:', { detail: err.message });
    }
  });

  // ─── 6. NotificationRequested ──────────────────────────────────────────────
  domainEventBus.on(DomainEvents.NotificationRequested, async (data: NotificationJobData) => {
    try {
      await enqueueNotification(data);
    } catch (err: any) {
      logger.error('[Subscribers] Failed to enqueue requested notification:', { detail: err.message });
    }
  });
}
