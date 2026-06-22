import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler';

export const notFound = (_req: Request, _res: Response, next: NextFunction): void => {
  next(new AppError(`Route ${_req.originalUrl} not found`, 404));
};
