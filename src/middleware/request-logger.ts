import { Request, Response, NextFunction } from 'express';
import { logger } from '@/utils/logger';

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();
  const { method, url, ip } = req;
  const userAgent = req.get('User-Agent') || 'Unknown';

  // Log request start
  logger.info(`→ ${method} ${url} from ${ip}`);

  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function(chunk?: unknown, encoding?: unknown): Response {
    const duration = Date.now() - start;
    const { statusCode } = res;
    const contentLength = res.get('Content-Length') || 0;

    // Log response
    logger.info(
      `← ${method} ${url} ${statusCode} ${duration}ms ${contentLength}bytes - ${userAgent}`
    );

    // Call original end method
    originalEnd.call(this, chunk, encoding);
    return this;
  };

  next();
};
