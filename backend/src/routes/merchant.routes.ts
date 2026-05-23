import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { requireAuth, requireMerchant } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { Merchant } from '../models/Merchant';
import { User } from '../models/User';
import { Invoice } from '../models/Invoice';
import { upstashRedis, cacheKeys, cacheTtl } from '../config/redis';

const router = Router();

async function generateMerchantId(): Promise<string> {
  const counter = await upstashRedis.incr('merchant:id:counter');
  return `MC-${String(counter + 1000).padStart(4, '0')}`;
}

const onboardSchema = z.object({
  shopName: z.string().min(2).max(50).trim(),
  category: z.enum(['food', 'retail', 'services', 'vendor', 'other']),
  description: z.string().max(200).trim().optional(),
});

const settingsSchema = z.object({
  shopName: z.string().min(2).max(50).trim().optional(),
  category: z.enum(['food', 'retail', 'services', 'vendor', 'other']).optional(),
  description: z.string().max(200).trim().optional(),
  invoiceExpiry: z.number().int().min(300).max(1800).optional(),
});

const walletSchema = z.object({
  walletAddress: z.string().regex(/^addr(_test)?1[a-z0-9]+$/, 'Invalid Cardano bech32 address'),
  stakeAddress: z.string().optional(),
});

// POST /api/v1/merchant/onboard
router.post(
  '/onboard',
  requireAuth,
  validate(onboardSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const existing = await Merchant.findOne({ userId: req.user.id });
      if (existing) {
        res.status(409).json({ success: false, error: 'Merchant profile already exists' });
        return;
      }

      if (!req.user.walletAddress) {
        res.status(400).json({
          success: false,
          error: 'Connect a wallet before onboarding as merchant',
        });
        return;
      }

      const merchantId = await generateMerchantId();
      const { shopName, category, description } = req.body as z.infer<typeof onboardSchema>;

      const merchant = await Merchant.create({
        userId: req.user.id,
        merchantId,
        shopName,
        category,
        description,
        paymentAddress: req.user.walletAddress,
        invoiceExpiry: 600,
      });

      // Update user role
      await User.findByIdAndUpdate(req.user.id, {
        $set: {
          role: req.user.role === 'customer' ? 'both' : 'merchant',
          onboardingStep: 'shop-complete',
        },
      });

      res.status(201).json({
        success: true,
        data: {
          merchantId: merchant.merchantId,
          shopName: merchant.shopName,
          category: merchant.category,
          paymentAddress: merchant.paymentAddress,
        },
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Onboarding failed';
      res.status(400).json({ success: false, error: message });
    }
  }
);

// GET /api/v1/merchant/:merchantId — Public profile (for QR scan)
router.get('/:merchantId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { merchantId } = req.params;

    // Check cache first
    const cached = await upstashRedis.get(cacheKeys.merchantProfile(merchantId));
    if (cached) {
      res.json({ success: true, data: cached, source: 'cached' });
      return;
    }

    const merchant = await Merchant.findOne({ merchantId, isActive: true }).lean();
    if (!merchant) {
      res.status(404).json({ success: false, error: 'Merchant not found' });
      return;
    }

    const publicProfile = {
      merchantId: merchant.merchantId,
      shopName: merchant.shopName,
      category: merchant.category,
      description: merchant.description,
      paymentAddress: merchant.paymentAddress,
      invoiceExpiry: merchant.invoiceExpiry,
    };

    await upstashRedis.set(cacheKeys.merchantProfile(merchantId), publicProfile, {
      ex: cacheTtl.merchantProfile,
    });

    res.json({ success: true, data: publicProfile });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch merchant';
    res.status(500).json({ success: false, error: message });
  }
});

// PUT /api/v1/merchant/settings
router.put(
  '/settings',
  requireAuth,
  requireMerchant,
  validate(settingsSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const merchant = await Merchant.findOne({ userId: req.user.id });
      if (!merchant) {
        res.status(404).json({ success: false, error: 'Merchant profile not found' });
        return;
      }

      const updates = req.body as z.infer<typeof settingsSchema>;
      if (updates.shopName) merchant.shopName = updates.shopName;
      if (updates.category) merchant.category = updates.category;
      if (updates.description !== undefined) merchant.description = updates.description;
      if (updates.invoiceExpiry) merchant.invoiceExpiry = updates.invoiceExpiry;

      await merchant.save();

      // Invalidate cache
      await upstashRedis.del(cacheKeys.merchantProfile(merchant.merchantId));

      res.json({ success: true, data: { merchantId: merchant.merchantId, shopName: merchant.shopName } });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Update failed';
      res.status(400).json({ success: false, error: message });
    }
  }
);

// POST /api/v1/merchant/wallet — Connect/update wallet address
router.post(
  '/wallet',
  requireAuth,
  validate(walletSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { walletAddress, stakeAddress } = req.body as z.infer<typeof walletSchema>;

      await User.findByIdAndUpdate(req.user.id, {
        $set: {
          walletAddress,
          stakeAddress,
          onboardingStep:
            req.user.onboardingStep === 'shop-complete' ? 'wallet-complete' : req.user.onboardingStep,
        },
      });

      // If merchant exists, update their payment address too
      const merchant = await Merchant.findOneAndUpdate(
        { userId: req.user.id },
        { $set: { paymentAddress: walletAddress } },
        { new: true }
      );

      if (merchant) {
        await upstashRedis.del(cacheKeys.merchantProfile(merchant.merchantId));
      }

      res.json({ success: true, data: { walletAddress } });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Wallet update failed';
      res.status(400).json({ success: false, error: message });
    }
  }
);

// GET /api/v1/merchant/dashboard
router.get(
  '/dashboard',
  requireAuth,
  requireMerchant,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const merchant = await Merchant.findOne({ userId: req.user.id });
      if (!merchant) {
        res.status(404).json({ success: false, error: 'Merchant profile not found' });
        return;
      }

      // Last 7 days stats
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const [recentInvoices, statusCounts] = await Promise.all([
        Invoice.find({ merchantId: merchant._id, createdAt: { $gte: sevenDaysAgo } })
          .sort({ createdAt: -1 })
          .limit(20)
          .lean(),
        Invoice.aggregate([
          { $match: { merchantId: merchant._id } },
          { $group: { _id: '$status', count: { $sum: 1 } } },
        ]),
      ]);

      const stats: Record<string, number> = {};
      statusCounts.forEach((s: { _id: string; count: number }) => {
        stats[s._id] = s.count;
      });

      res.json({
        success: true,
        data: {
          merchant: {
            merchantId: merchant.merchantId,
            shopName: merchant.shopName,
            totalReceivedLovelace: merchant.totalReceivedLovelace,
            totalOrders: merchant.totalOrders,
          },
          stats,
          recentInvoices: recentInvoices.map((inv) => ({
            invoiceId: inv.invoiceId,
            amountPaise: inv.amountPaise,
            amountLovelace: inv.amountLovelace,
            status: inv.status,
            createdAt: inv.createdAt,
            settledAt: inv.settledAt,
          })),
        },
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Dashboard fetch failed';
      res.status(500).json({ success: false, error: message });
    }
  }
);

export default router;
