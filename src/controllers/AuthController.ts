import { Request, Response } from 'express';
import { User } from '@/models/User';
import { AuthUtils } from '@/utils/auth';
import { createUserSchema, loginSchema, ApiResponse } from '@/types/schemas';
import { logger } from '@/utils/logger';

export class AuthController {
  static async register(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const validation = createUserSchema.safeParse(req.body);
      
      if (!validation.success) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: validation.error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
        });
        return;
      }

      const { email, password, firstName, lastName, roles, isActive } = validation.data;

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        res.status(409).json({
          success: false,
          message: 'User with this email already exists'
        });
        return;
      }

      // Create new user
      const user = new User({
        email,
        passwordHash: password, // Will be hashed by pre-save middleware
        firstName,
        lastName,
        roles,
        isActive
      });

      await user.save();

      logger.info(`New user registered: ${email}`);

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          roles: user.roles,
          isActive: user.isActive
        }
      });
    } catch (error) {
      logger.error('Registration error:', error);
      res.status(500).json({
        success: false,
        message: 'Registration failed'
      });
    }
  }

  static async login(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const validation = loginSchema.safeParse(req.body);
      
      if (!validation.success) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: validation.error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
        });
        return;
      }

      const { email, password } = validation.data;

      // Find user by email
      const user = await User.findOne({ email });
      if (!user || !user.isActive) {
        res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
        return;
      }

      // Verify password
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
        return;
      }

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      // Generate tokens
      const tokens = AuthUtils.generateTokenPair(user);

      logger.info(`User logged in: ${email}`);

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            roles: user.roles,
            lastLogin: user.lastLogin
          },
          tokens
        }
      });
    } catch (error) {
      logger.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Login failed'
      });
    }
  }

  static async refreshToken(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const { refreshToken } = req.body;
      
      if (!refreshToken) {
        res.status(400).json({
          success: false,
          message: 'Refresh token required'
        });
        return;
      }

      // Verify refresh token
      const payload = AuthUtils.verifyRefreshToken(refreshToken);
      
      // Find user
      const user = await User.findById(payload.userId);
      if (!user || !user.isActive) {
        res.status(401).json({
          success: false,
          message: 'User not found or inactive'
        });
        return;
      }

      // Generate new tokens
      const tokens = AuthUtils.generateTokenPair(user);

      res.json({
        success: true,
        message: 'Token refreshed successfully',
        data: { tokens }
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Token refresh failed';
      res.status(401).json({
        success: false,
        message
      });
    }
  }

  static async profile(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const user = await User.findById(req.userId);
      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found'
        });
        return;
      }

      res.json({
        success: true,
        data: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          roles: user.roles,
          isActive: user.isActive,
          lastLogin: user.lastLogin,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }
      });
    } catch (error) {
      logger.error('Profile fetch error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch profile'
      });
    }
  }

  static async updateProfile(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const allowedUpdates = ['firstName', 'lastName'];
      const updates: any = {};
      
      for (const field of allowedUpdates) {
        if (req.body[field] !== undefined) {
          updates[field] = req.body[field];
        }
      }

      if (Object.keys(updates).length === 0) {
        res.status(400).json({
          success: false,
          message: 'No valid updates provided'
        });
        return;
      }

      const user = await User.findByIdAndUpdate(
        req.userId,
        updates,
        { new: true, runValidators: true }
      );

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found'
        });
        return;
      }

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          roles: user.roles
        }
      });
    } catch (error) {
      logger.error('Profile update error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update profile'
      });
    }
  }

  static async changePassword(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const { currentPassword, newPassword } = req.body;
      
      if (!currentPassword || !newPassword) {
        res.status(400).json({
          success: false,
          message: 'Current password and new password are required'
        });
        return;
      }

      if (newPassword.length < 6) {
        res.status(400).json({
          success: false,
          message: 'New password must be at least 6 characters long'
        });
        return;
      }

      const user = await User.findById(req.userId);
      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found'
        });
        return;
      }

      // Verify current password
      const isCurrentPasswordValid = await user.comparePassword(currentPassword);
      if (!isCurrentPasswordValid) {
        res.status(400).json({
          success: false,
          message: 'Current password is incorrect'
        });
        return;
      }

      // Update password
      user.passwordHash = newPassword; // Will be hashed by pre-save middleware
      await user.save();

      logger.info(`Password changed for user: ${user.email}`);

      res.json({
        success: true,
        message: 'Password changed successfully'
      });
    } catch (error) {
      logger.error('Password change error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to change password'
      });
    }
  }

  static async logout(_req: Request, res: Response<ApiResponse>): Promise<void> {
    // In a more advanced implementation, you would invalidate the token
    // by adding it to a blacklist stored in Redis
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  }
}
