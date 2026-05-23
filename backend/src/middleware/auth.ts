import { Request, Response, NextFunction } from 'express';
import { getFirebaseAuth } from '../config/firebase-admin';
import { User, IUser } from '../models/User';

// Augment Express Request to include authenticated user
declare global {
  namespace Express {
    interface Request {
      firebaseUid: string;
      user: IUser;
    }
  }
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      res.status(401).json({ success: false, error: 'Missing authorization header' });
      return;
    }

    const token = authHeader.slice(7);

    // Verify Firebase JWT
    const decoded = await getFirebaseAuth().verifyIdToken(token, true);
    req.firebaseUid = decoded.uid;

    // Load MongoDB user
    const user = await User.findOne({ firebaseUid: decoded.uid });
    if (!user) {
      res.status(401).json({ success: false, error: 'User not found — call /auth/sync first' });
      return;
    }

    req.user = user;
    next();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Authentication failed';
    res.status(401).json({ success: false, error: message });
  }
}

export function requireMerchant(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (req.user.role !== 'merchant' && req.user.role !== 'both') {
    res.status(403).json({ success: false, error: 'Merchant access required' });
    return;
  }
  next();
}

export function requireCustomer(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (req.user.role !== 'customer' && req.user.role !== 'both') {
    res.status(403).json({ success: false, error: 'Customer access required' });
    return;
  }
  next();
}
