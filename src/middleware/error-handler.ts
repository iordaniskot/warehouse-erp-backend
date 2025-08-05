import { Request, Response, NextFunction } from 'express';
import { logger } from '@/utils/logger';
import { config } from '@/config/environment';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export class CustomError extends Error implements AppError {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  error: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const { statusCode = 500, message, stack } = error;

  // Log error details
  logger.error(`Error ${statusCode}: ${message}`, {
    statusCode,
    message,
    stack: config.nodeEnv === 'development' ? stack : undefined,
  });

  // Send error response
  res.status(statusCode).json({
    success: false,
    error: {
      message: statusCode === 500 ? 'Internal Server Error' : message,
      ...(config.nodeEnv === 'development' && { stack }),
    },
    timestamp: new Date().toISOString(),
  });
};

// Async error wrapper
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Common error creators
export const createNotFoundError = (resource: string): CustomError => {
  return new CustomError(`${resource} not found`, 404);
};

export const createValidationError = (message: string): CustomError => {
  return new CustomError(`Validation error: ${message}`, 400);
};

export const createUnauthorizedError = (message = 'Unauthorized'): CustomError => {
  return new CustomError(message, 401);
};

export const createForbiddenError = (message = 'Forbidden'): CustomError => {
  return new CustomError(message, 403);
};

export const createConflictError = (message: string): CustomError => {
  return new CustomError(`Conflict: ${message}`, 409);
};
