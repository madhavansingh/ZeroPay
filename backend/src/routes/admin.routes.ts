import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { Invoice } from '../models/Invoice';
import { Transaction } from '../models/Transaction';
import { logger } from '../config/logger';

const router = Router();

// Middleware to enforce Admin role
function requireAdmin(req: Request, res: Response, next: any) {
  if (req.user.role !== 'admin') {
    res.status(403).json({ success: false, error: 'Admin access required' });
    return;
  }
  next();
}

// GET /api/v1/admin/dashboard/stats
router.get(
  '/dashboard/stats',
  requireAuth,
  requireAdmin,
  async (_req: Request, res: Response): Promise<void> => {
    try {
      // 1. Escrow Volume & Statistics
      const invoiceStats = await Invoice.aggregate([
        {
          $group: {
            _id: '$escrowState',
            count: { $sum: 1 },
            totalLovelace: { $sum: '$amountLovelace' },
            totalPaise: { $sum: '$amountPaise' },
          },
        },
      ]);

      // 2. Failed / confirmed transactions stats
      const txStats = await Transaction.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]);

      // Compute total volume locked on contract vs resolved vs released
      let volumeLockedLovelace = 0;
      let volumeReleasedLovelace = 0;
      let volumeRefundedLovelace = 0;
      let activeDisputesCount = 0;

      invoiceStats.forEach((stat) => {
        if (['Locked', 'PartiallyReleased'].includes(stat._id)) {
          volumeLockedLovelace += stat.totalLovelace;
        } else if (stat._id === 'Released') {
          volumeReleasedLovelace += stat.totalLovelace;
        } else if (stat._id === 'Refunded') {
          volumeRefundedLovelace += stat.totalLovelace;
        } else if (stat._id === 'Disputed') {
          activeDisputesCount = stat.count;
        }
      });

      res.json({
        success: true,
        data: {
          escrowStats: invoiceStats,
          transactionStats: txStats,
          metrics: {
            volumeLockedLovelace,
            volumeReleasedLovelace,
            volumeRefundedLovelace,
            activeDisputesCount,
          },
        },
      });
    } catch (err: any) {
      logger.error('[admin/stats] Failed to fetch stats', { error: err.message });
      res.status(500).json({ success: false, error: 'Failed to fetch admin stats', detail: err.message });
    }
  }
);

// GET /api/v1/admin/disputes/queue
router.get(
  '/disputes/queue',
  requireAuth,
  requireAdmin,
  async (_req: Request, res: Response): Promise<void> => {
    try {
      const disputes = await Invoice.find({
        $or: [{ escrowState: 'Disputed' }, { isDisputed: true }],
      })
        .populate('merchantId')
        .populate('customerId')
        .sort({ updatedAt: -1 });

      res.json({
        success: true,
        data: disputes.map((inv) => ({
          invoiceId: inv.invoiceId,
          description: inv.description,
          amountPaise: inv.amountPaise,
          amountLovelace: inv.amountLovelace,
          paymentAddress: inv.paymentAddress,
          status: inv.status,
          escrowState: inv.escrowState,
          merchant: inv.merchantId,
          customer: inv.customerId,
          disputeTxHash: inv.disputeTxHash,
          updatedAt: inv.updatedAt,
        })),
      });
    } catch (err: any) {
      logger.error('[admin/disputes] Failed to fetch disputes', { error: err.message });
      res.status(500).json({ success: false, error: 'Failed to fetch disputes queue', detail: err.message });
    }
  }
);

export default router;
