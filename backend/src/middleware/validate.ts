import { Request, Response, NextFunction } from 'express';
import { ZodError, ZodSchema } from 'zod';

type ValidateTarget = 'body' | 'query' | 'params';

export function validate(schema: ZodSchema, target: ValidateTarget = 'body') {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[target]);

    if (!result.success) {
      const errors = result.error instanceof ZodError
        ? result.error.flatten().fieldErrors
        : { _: ['Validation failed'] };

      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors,
      });
      return;
    }

    // Replace target with coerced/parsed data
    req[target] = result.data;
    next();
  };
}
