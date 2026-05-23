import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { getFirebaseAuth } from '../config/firebase-admin';
import { User } from '../models/User';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { authRateLimit } from '../middleware/rateLimit';

const router = Router();

const syncSchema = z.object({
  displayName: z.string().min(1).max(60).optional(),
  phone: z.string().regex(/^\+[1-9]\d{6,14}$/).optional(),
  fcmToken: z.string().optional(),
});

const profileSchema = z.object({
  displayName: z.string().min(1).max(60).optional(),
  fcmToken: z.string().optional(),
  notificationPreferences: z
    .object({
      paymentReceived: z.boolean().optional(),
      paymentConfirmed: z.boolean().optional(),
      invoiceExpired: z.boolean().optional(),
    })
    .optional(),
});

// POST /api/v1/auth/sync — Create or update user from Firebase token
router.post(
  '/sync',
  authRateLimit,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        res.status(401).json({ success: false, error: 'Missing authorization header' });
        return;
      }

      const token = authHeader.slice(7);
      const decoded = await getFirebaseAuth().verifyIdToken(token, true);

      const body = syncSchema.safeParse(req.body);

      let user = await User.findOne({ firebaseUid: decoded.uid });

      if (!user) {
        user = await User.create({
          firebaseUid: decoded.uid,
          phone: decoded.phone_number ?? body.data?.phone,
          displayName: body.data?.displayName ?? decoded.name ?? 'ZeroPay User',
          role: 'customer',
          onboardingStep: 'new',
          fcmToken: body.data?.fcmToken,
        });
      } else {
        // Update mutable fields on re-sync
        if (body.data?.displayName) user.displayName = body.data.displayName;
        if (body.data?.fcmToken) user.fcmToken = body.data.fcmToken;
        if (body.data?.phone) user.phone = body.data.phone;
        await user.save();
      }

      res.json({
        success: true,
        data: {
          id: user.id,
          firebaseUid: user.firebaseUid,
          displayName: user.displayName,
          role: user.role,
          onboardingStep: user.onboardingStep,
          walletAddress: user.walletAddress,
        },
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Sync failed';
      res.status(400).json({ success: false, error: message });
    }
  }
);

// GET /api/v1/auth/me
router.get('/me', requireAuth, (req: Request, res: Response): void => {
  const { user } = req;
  res.json({
    success: true,
    data: {
      id: user.id,
      firebaseUid: user.firebaseUid,
      phone: user.phone,
      displayName: user.displayName,
      role: user.role,
      walletAddress: user.walletAddress,
      onboardingStep: user.onboardingStep,
      notificationPreferences: user.notificationPreferences,
    },
  });
});

// PUT /api/v1/auth/profile
router.put(
  '/profile',
  requireAuth,
  validate(profileSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { user } = req;
      const updates = req.body as z.infer<typeof profileSchema>;

      if (updates.displayName) user.displayName = updates.displayName;
      if (updates.fcmToken) user.fcmToken = updates.fcmToken;
      if (updates.notificationPreferences) {
        user.notificationPreferences = {
          ...user.notificationPreferences,
          ...updates.notificationPreferences,
        };
      }

      await user.save();

      res.json({ success: true, data: { displayName: user.displayName } });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Update failed';
      res.status(400).json({ success: false, error: message });
    }
  }
);

export default router;
