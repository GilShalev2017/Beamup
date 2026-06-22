import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../services/auth.service';
import { AppError } from './errorHandler';

declare global {
  namespace Express {
    interface Request {
      user?: { id: string; email: string; role: string };
    }
  }
}

export const authenticate = (req: Request, _res: Response, next: NextFunction): void => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return next(new AppError('Unauthorized — no token provided', 401));

  try {
    req.user = verifyToken(token);
    next();
  } catch {
    next(new AppError('Unauthorized — invalid or expired token', 401));
  }
};

export const authorize =
  (...roles: string[]) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError('Forbidden — insufficient permissions', 403));
    }
    next();
  };
