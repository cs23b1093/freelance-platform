import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { User, IUser } from '../../models/user.model';
import ApiError from '../../utils/apierror';
import config from '../../config/config';
import logger from '../../utils/logger';

export class AuthService {
  async register(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: 'freelancer' | 'client';
    bio?: string;
    skills?: string[];
    hourlyRate?: number;
    location?: {
      country: string;
      city: string;
    };
  }): Promise<{ user: Partial<IUser>; token: string; refreshToken: string }> {
    try {
      // Check if user already exists
      const existingUser = await User.findOne({ email: userData.email });
      if (existingUser) {
        throw new ApiError(400, 'User already exists with this email');
      }

      // Create new user
      const user = new User(userData);
      await user.save();

      // Generate tokens
      const token = user.generateAuthToken();
      const refreshToken = user.generateRefreshToken();

      // Save refresh token to user
      user.refreshToken = refreshToken;
      await user.save();

      // Log registration
      logger.info(`New user registered: ${user.email}`);

      // Return user data without sensitive information
      const userResponse = {
        _id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        profilePicture: user.profilePicture,
        bio: user.bio,
        skills: user.skills,
        hourlyRate: user.hourlyRate,
        location: user.location,
        rating: user.rating,
        isVerified: user.isVerified,
        isEmailVerified: user.isEmailVerified,
        createdAt: user.createdAt
      };

      return { user: userResponse, token, refreshToken };
    } catch (error) {
      logger.error('Registration error:', error);
      throw error;
    }
  }

  async login(email: string, password: string, rememberMe = false): Promise<{ user: Partial<IUser>; token: string; refreshToken: string }> {
    try {
      // Find user with password field
      const user = await User.findOne({ email, isActive: true }).select('+password');
      if (!user) {
        throw new ApiError(401, 'Invalid email or password');
      }

      // Check password
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        throw new ApiError(401, 'Invalid email or password');
      }

      // Generate tokens
      const token = user.generateAuthToken();
      const refreshToken = user.generateRefreshToken();

      // Update user login info
      user.lastLogin = new Date();
      user.refreshToken = refreshToken;
      await user.save();

      // Log login
      logger.info(`User logged in: ${user.email}`);

      // Return user data without sensitive information
      const userResponse = {
        _id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        profilePicture: user.profilePicture,
        bio: user.bio,
        skills: user.skills,
        hourlyRate: user.hourlyRate,
        location: user.location,
        languages: user.languages,
        socialLinks: user.socialLinks,
        rating: user.rating,
        totalEarnings: user.totalEarnings,
        completedProjects: user.completedProjects,
        isVerified: user.isVerified,
        isEmailVerified: user.isEmailVerified,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt
      };

      return { user: userResponse, token, refreshToken };
    } catch (error) {
      logger.error('Login error:', error);
      throw error;
    }
  }

  async logout(userId: string): Promise<void> {
    try {
      // Clear refresh token
      await User.findByIdAndUpdate(userId, { 
        $unset: { refreshToken: 1 } 
      });

      logger.info(`User logged out: ${userId}`);
    } catch (error) {
      logger.error('Logout error:', error);
      throw error;
    }
  }

  async refreshToken(refreshToken: string): Promise<{ token: string; refreshToken: string }> {
    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret) as { userId: string };
      
      // Find user with the refresh token
      const user = await User.findOne({ 
        _id: decoded.userId, 
        refreshToken,
        isActive: true 
      });

      if (!user) {
        throw new ApiError(401, 'Invalid refresh token');
      }

      // Generate new tokens
      const newToken = user.generateAuthToken();
      const newRefreshToken = user.generateRefreshToken();

      // Update refresh token in database
      user.refreshToken = newRefreshToken;
      await user.save();

      return { token: newToken, refreshToken: newRefreshToken };
    } catch (error) {
      logger.error('Refresh token error:', error);
      if (error instanceof jwt.JsonWebTokenError) {
        throw new ApiError(401, 'Invalid refresh token');
      }
      throw error;
    }
  }

  async getUserById(userId: string): Promise<IUser | null> {
    try {
      return await User.findById(userId).select('-refreshToken');
    } catch (error) {
      logger.error('Get user by ID error:', error);
      throw error;
    }
  }

  async updateProfile(userId: string, updateData: Partial<IUser>): Promise<IUser | null> {
    try {
      const updatedUser = await User.findByIdAndUpdate(
        userId, 
        updateData, 
        { new: true, runValidators: true }
      ).select('-refreshToken');

      if (!updatedUser) {
        throw new ApiError(404, 'User not found');
      }

      logger.info(`Profile updated for user: ${updatedUser.email}`);
      return updatedUser;
    } catch (error) {
      logger.error('Update profile error:', error);
      throw error;
    }
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    try {
      // Find user with password
      const user = await User.findById(userId).select('+password');
      if (!user) {
        throw new ApiError(404, 'User not found');
      }

      // Verify current password
      const isCurrentPasswordValid = await user.comparePassword(currentPassword);
      if (!isCurrentPasswordValid) {
        throw new ApiError(400, 'Current password is incorrect');
      }

      // Update password
      user.password = newPassword;
      await user.save();

      logger.info(`Password changed for user: ${user.email}`);
    } catch (error) {
      logger.error('Change password error:', error);
      throw error;
    }
  }

  async forgotPassword(email: string): Promise<string> {
    try {
      const user = await User.findOne({ email, isActive: true });
      if (!user) {
        throw new ApiError(404, 'No user found with this email address');
      }

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

      // Save hashed token and expiry to user
      user.passwordResetToken = hashedToken;
      user.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
      await user.save();

      logger.info(`Password reset requested for user: ${user.email}`);

      // Return plain token (to be sent via email)
      return resetToken;
    } catch (error) {
      logger.error('Forgot password error:', error);
      throw error;
    }
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      // Hash the token to compare with stored hash
      const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

      // Find user with valid reset token
      const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: new Date() },
        isActive: true
      });

      if (!user) {
        throw new ApiError(400, 'Invalid or expired reset token');
      }

      // Update password and clear reset token
      user.password = newPassword;
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save();

      logger.info(`Password reset completed for user: ${user.email}`);
    } catch (error) {
      logger.error('Reset password error:', error);
      throw error;
    }
  }

  verifyToken(token: string): { userId: string; email: string; role: string } {
    try {
      return jwt.verify(token, config.jwt.secret) as { userId: string; email: string; role: string };
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new ApiError(401, 'Invalid or expired token');
      }
      throw error;
    }
  }

  async deactivateAccount(userId: string): Promise<void> {
    try {
      await User.findByIdAndUpdate(userId, { 
        isActive: false,
        $unset: { refreshToken: 1 }
      });

      logger.info(`Account deactivated for user: ${userId}`);
    } catch (error) {
      logger.error('Deactivate account error:', error);
      throw error;
    }
  }
}