import jwt from 'jsonwebtoken';
import { config } from '@/config/environment';
import { IUser } from '@/models/User';

export interface JWTPayload {
  userId: string;
  email: string;
  roles: string[];
  warehouseId?: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export class AuthUtils {
  static generateAccessToken(user: IUser, warehouseId?: string): string {
    const payload: JWTPayload = {
      userId: (user._id as any).toString(),
      email: user.email,
      roles: user.roles,
      ...(warehouseId && { warehouseId })
    };

    return jwt.sign(payload, config.jwt.accessSecret, {
      expiresIn: config.jwt.accessExpiresIn,
      issuer: 'warehouse-erp',
      audience: 'warehouse-erp-client'
    });
  }

  static generateRefreshToken(userId: string): string {
    return jwt.sign(
      { userId, type: 'refresh' },
      config.jwt.refreshSecret,
      {
        expiresIn: config.jwt.refreshExpiresIn,
        issuer: 'warehouse-erp',
        audience: 'warehouse-erp-client'
      }
    );
  }

  static generateTokenPair(user: IUser, warehouseId?: string): TokenPair {
    return {
      accessToken: this.generateAccessToken(user, warehouseId),
      refreshToken: this.generateRefreshToken((user._id as any).toString())
    };
  }

  static verifyAccessToken(token: string): JWTPayload {
    try {
      const decoded = jwt.verify(token, config.jwt.accessSecret, {
        issuer: 'warehouse-erp',
        audience: 'warehouse-erp-client'
      }) as JWTPayload;
      
      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Access token expired');
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid access token');
      }
      throw new Error('Token verification failed');
    }
  }

  static verifyRefreshToken(token: string): { userId: string; type: string } {
    try {
      const decoded = jwt.verify(token, config.jwt.refreshSecret, {
        issuer: 'warehouse-erp',
        audience: 'warehouse-erp-client'
      }) as { userId: string; type: string };
      
      if (decoded.type !== 'refresh') {
        throw new Error('Invalid token type');
      }
      
      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Refresh token expired');
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid refresh token');
      }
      throw new Error('Token verification failed');
    }
  }

  static extractTokenFromHeader(authHeader?: string): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.substring(7);
  }

  static hasRole(userRoles: string[], requiredRoles: string | string[]): boolean {
    const required = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
    return required.some(role => userRoles.includes(role));
  }

  static hasAnyRole(userRoles: string[], allowedRoles: string[]): boolean {
    return allowedRoles.some(role => userRoles.includes(role));
  }

  static isAdmin(userRoles: string[]): boolean {
    return userRoles.includes('admin');
  }

  static canAccessWarehouse(userRoles: string[], userWarehouseId?: string, targetWarehouseId?: string): boolean {
    // Admins can access any warehouse
    if (this.isAdmin(userRoles)) {
      return true;
    }

    // If no target warehouse specified, allow access
    if (!targetWarehouseId) {
      return true;
    }

    // Check if user has access to the specific warehouse
    return userWarehouseId === targetWarehouseId;
  }
}
