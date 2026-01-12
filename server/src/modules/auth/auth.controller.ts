import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { 
  registerSchema, 
  loginSchema, 
  updateProfileSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  refreshTokenSchema
} from './auth.validate';
import ApiError from '../../utils/apierror';
import logger from '../../utils/logger';
import config from '../../config/config';

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
  file?: Express.Multer.File;
  files?: Express.Multer.File[] | { [fieldname: string]: Express.Multer.File[] };
}

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { error, value } = registerSchema.validate(req.body);
      if (error) {
        throw new ApiError(400, error.details[0].message);
      }

      const { confirmPassword, ...userData } = value;

      const result = await this.authService.register(userData);
      
      // Set refresh token as httpOnly cookie
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: config.nodeEnv === 'production',
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
      });

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user: result.user,
          token: result.token
        }
      });
    } catch (error) {
      logger.error('Register controller error:', error);
      next(error);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { error, value } = loginSchema.validate(req.body);
      if (error) {
        throw new ApiError(400, error.details[0].message);
      }

      const { email, password, rememberMe } = value;

      const result = await this.authService.login(email, password, rememberMe);
      
      // Set refresh token cookie duration based on rememberMe
      const cookieMaxAge = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: config.nodeEnv === 'production',
        sameSite: 'strict',
        maxAge: cookieMaxAge
      });

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          user: result.user,
          token: result.token
        }
      });
    } catch (error) {
      logger.error('Login controller error:', error);
      next(error);
    }
  };

  logout = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new ApiError(401, 'User not authenticated');
      }

      await this.authService.logout(userId);
      
      res.clearCookie('refreshToken');

      res.status(200).json({
        success: true,
        message: 'Logout successful'
      });
    } catch (error) {
      logger.error('Logout controller error:', error);
      next(error);
    }
  };

  refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
      
      if (!refreshToken) {
        throw new ApiError(401, 'Refresh token not provided');
      }

      const { error } = refreshTokenSchema.validate({ refreshToken });
      if (error) {
        throw new ApiError(400, error.details[0].message);
      }

      const result = await this.authService.refreshToken(refreshToken);
      
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: config.nodeEnv === 'production',
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60 * 1000
      });

      res.status(200).json({
        success: true,
        message: 'Token refreshed successfully',
        data: {
          token: result.token
        }
      });
    } catch (error) {
      logger.error('Refresh token controller error:', error);
      next(error);
    }
  };

  getProfile = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new ApiError(401, 'User not authenticated');
      }

      const user = await this.authService.getUserById(userId);
      
      if (!user) {
        throw new ApiError(404, 'User not found');
      }

      res.status(200).json({
        success: true,
        message: 'Profile retrieved successfully',
        data: { user }
      });
    } catch (error) {
      logger.error('Get profile controller error:', error);
      next(error);
    }
  };

  updateProfile = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { error, value } = updateProfileSchema.validate(req.body);
      if (error) {
        throw new ApiError(400, error.details[0].message);
      }

      const userId = req.user?.userId;
      if (!userId) {
        throw new ApiError(401, 'User not authenticated');
      }

      // Handle profile picture from multer
      if (req.file) {
        value.profilePicture = `/uploads/profile-pics/${req?.file.filename}`;
      }

      const updatedUser = await this.authService.updateProfile(userId, value);
      
      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: { user: updatedUser }
      });
    } catch (error) {
      logger.error('Update profile controller error:', error);
      next(error);
    }
  };

  changePassword = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { error, value } = changePasswordSchema.validate(req.body);
      if (error) {
        throw new ApiError(400, error.details[0].message);
      }

      const userId = req.user?.userId;
      if (!userId) {
        throw new ApiError(401, 'User not authenticated');
      }

      const { currentPassword, newPassword } = value;

      await this.authService.changePassword(userId, currentPassword, newPassword);
      
      res.status(200).json({
        success: true,
        message: 'Password changed successfully'
      });
    } catch (error) {
      logger.error('Change password controller error:', error);
      next(error);
    }
  };

  forgotPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { error, value } = forgotPasswordSchema.validate(req.body);
      if (error) {
        throw new ApiError(400, error.details[0].message);
      }

      const { email } = value;

      const resetToken = await this.authService.forgotPassword(email);
      
      // In production, send this token via email instead of returning it
      res.status(200).json({
        success: true,
        message: 'Password reset token generated successfully',
        data: {
          resetToken, // Remove this in production
          message: 'If an account with this email exists, a password reset link has been sent.'
        }
      });
    } catch (error) {
      logger.error('Forgot password controller error:', error);
      next(error);
    }
  };

  resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { error, value } = resetPasswordSchema.validate(req.body);
      if (error) {
        throw new ApiError(400, error.details[0].message);
      }

      const { token, newPassword } = value;

      await this.authService.resetPassword(token, newPassword);
      
      res.status(200).json({
        success: true,
        message: 'Password reset successfully'
      });
    } catch (error) {
      logger.error('Reset password controller error:', error);
      next(error);
    }
  };

  deactivateAccount = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new ApiError(401, 'User not authenticated');
      }

      await this.authService.deactivateAccount(userId);
      
      res.clearCookie('refreshToken');

      res.status(200).json({
        success: true,
        message: 'Account deactivated successfully'
      });
    } catch (error) {
      logger.error('Deactivate account controller error:', error);
      next(error);
    }
  };
}