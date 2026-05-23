import { Request, Response, NextFunction } from 'express';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  console.error(`[${new Date().toISOString()}] ${req.method} ${req.path}`, err);

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    res.status(400).json({ success: false, error: err.message });
    return;
  }

  // Mongoose duplicate key
  if (err.name === 'MongoServerError' && (err as NodeJS.ErrnoException).code === '11000') {
    res.status(409).json({ success: false, error: 'Duplicate entry' });
    return;
  }

  // Default 500
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
}

export function notFound(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.path} not found`,
  });
}
