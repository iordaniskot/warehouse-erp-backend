import { Request, Response, NextFunction } from 'express';
import { AuthUtils, JWTPayload } from '@/utils/auth';
import { User } from '@/models/User';
import { ApiResponse } from '@/types/schemas';

declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
      userId?: string;
    }
  }
}

export class AuthMiddleware {
  static async authenticate(req: Request, res: Response<ApiResponse>, next: NextFunction): Promise<void> {
    try {
      const token = AuthUtils.extractTokenFromHeader(req.headers.authorization);
      
      if (!token) {
        res.status(401).json({
          success: false,
          message: 'Access token required'
        });
        return;
      }

      const payload = AuthUtils.verifyAccessToken(token);
      
      // Verify user still exists and is active
      const user = await User.findById(payload.userId);
      if (!user || !user.isActive) {
        res.status(401).json({
          success: false,
          message: 'User not found or inactive'
        });
        return;
      }

      req.user = payload;
      req.userId = payload.userId;
      next();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Authentication failed';
      res.status(401).json({
        success: false,
        message
      });
    }
  }

  static requireRoles(roles: string | string[]) {
    return async (req: Request, res: Response<ApiResponse>, next: NextFunction): Promise<void> => {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const requiredRoles = Array.isArray(roles) ? roles : [roles];
      const hasRole = AuthUtils.hasAnyRole(req.user.roles, requiredRoles);

      if (!hasRole) {
        res.status(403).json({
          success: false,
          message: 'Insufficient permissions'
        });
        return;
      }

      next();
    };
  }

  static requireWarehouseAccess(warehouseIdField: string = 'warehouseId') {
    return async (req: Request, res: Response<ApiResponse>, next: NextFunction): Promise<void> => {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const targetWarehouseId = req.params[warehouseIdField] || req.body[warehouseIdField] || req.query[warehouseIdField];
      
      const canAccess = AuthUtils.canAccessWarehouse(
        req.user.roles,
        req.user.warehouseId,
        targetWarehouseId as string
      );

      if (!canAccess) {
        res.status(403).json({
          success: false,
          message: 'Access denied to this warehouse'
        });
        return;
      }

      next();
    };
  }

  static adminOnly(req: Request, res: Response<ApiResponse>, next: NextFunction): void {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    if (!AuthUtils.isAdmin(req.user.roles)) {
      res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
      return;
    }

    next();
  }

  static optional(req: Request, _res: Response, next: NextFunction): void {
    const token = AuthUtils.extractTokenFromHeader(req.headers.authorization);
    
    if (token) {
      try {
        const payload = AuthUtils.verifyAccessToken(token);
        req.user = payload;
        req.userId = payload.userId;
      } catch (error) {
        // Optional auth - continue even if token is invalid
      }
    }
    
    next();
  }
}

// Convenience middleware exports
export const authenticate = AuthMiddleware.authenticate;
export const requireRoles = AuthMiddleware.requireRoles;
export const requireWarehouseAccess = AuthMiddleware.requireWarehouseAccess;
export const adminOnly = AuthMiddleware.adminOnly;
export const optionalAuth = AuthMiddleware.optional;
