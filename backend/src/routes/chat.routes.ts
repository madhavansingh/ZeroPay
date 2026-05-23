import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { getFirebaseDatabase } from '../config/firebase-admin';
import { Merchant } from '../models/Merchant';

const router = Router();

// ─── POST /chat/rooms/create ─────────────────────────────────────────────────
const createRoomSchema = z.object({
  merchantStringId: z.string().min(1),
});

router.post(
  '/rooms/create',
  requireAuth,
  validate(createRoomSchema),
  async (req: Request, res: Response): Promise<void> => {
    const { merchantStringId } = req.body as { merchantStringId: string };
    const customerId = req.user._id.toString();

    const merchant = await Merchant.findOne({ merchantId: merchantStringId });
    if (!merchant) {
      res.status(404).json({ success: false, error: 'Merchant not found' });
      return;
    }

    const roomId = `${customerId}-${merchantStringId}`;
    const db = getFirebaseDatabase();
    const existing = await db.ref(`/chatrooms/${roomId}`).get();

    if (!existing.exists()) {
      const now = Date.now();

      await db.ref(`/chatrooms/${roomId}`).set({
        roomId,
        merchantId: merchantStringId,
        customerId,
        shopName: merchant.shopName,
        merchantMongoId: merchant._id.toString(),
        createdAt: now,
        lastMessage: null,
      });

      // Index rooms under each participant so frontend can query fast
      await Promise.all([
        db.ref(`/users/${customerId}/chatrooms/${roomId}`).set({
          roomId,
          merchantId: merchantStringId,
          shopName: merchant.shopName,
          lastMessage: null,
          unreadCount: 0,
        }),
        db.ref(`/users/${merchant._id.toString()}/chatrooms/${roomId}`).set({
          roomId,
          customerId,
          shopName: merchant.shopName,
          lastMessage: null,
          unreadCount: 0,
        }),
      ]);
    }

    res.json({
      success: true,
      data: {
        roomId,
        merchantStringId,
        shopName: merchant.shopName,
        isNew: !existing.exists(),
      },
    });
  }
);

// ─── GET /chat/rooms ──────────────────────────────────────────────────────────
router.get('/rooms', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const userId = req.user._id.toString();
  const db = getFirebaseDatabase();
  const snapshot = await db.ref(`/users/${userId}/chatrooms`).get();

  const rooms = snapshot.exists() ? Object.values(snapshot.val() as Record<string, unknown>) : [];

  res.json({ success: true, data: { rooms } });
});

// ─── GET /chat/rooms/:roomId ─────────────────────────────────────────────────
router.get('/rooms/:roomId', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const { roomId } = req.params;
  const db = getFirebaseDatabase();

  const [roomSnap, messagesSnap] = await Promise.all([
    db.ref(`/chatrooms/${roomId}`).get(),
    db.ref(`/chatrooms/${roomId}/messages`).limitToLast(50).get(),
  ]);

  if (!roomSnap.exists()) {
    res.status(404).json({ success: false, error: 'Chat room not found' });
    return;
  }

  const messages = messagesSnap.exists()
    ? Object.entries(messagesSnap.val() as Record<string, unknown>).map(([key, val]) => ({
        key,
        ...(val as object),
      }))
    : [];

  res.json({ success: true, data: { room: roomSnap.val(), messages } });
});

export default router;
