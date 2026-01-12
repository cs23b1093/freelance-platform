import { Router } from 'express';
import { AuthController } from '../modules/auth/auth.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { uploadProfilePicture } from '../config/multer';
import rateLimit from 'express-rate-limit';

const router = Router();
const authController = new AuthController();

// Rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs for auth routes
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Public routes
router.post('/register', authLimiter, authController.register);
router.post('/login', authLimiter, authController.login);
router.post('/refresh-token', authLimiter, authController.refreshToken);
router.post('/forgot-password', authLimiter, authController.forgotPassword);
router.post('/reset-password', authLimiter, authController.resetPassword);

// Protected routes
router.post('/logout', generalLimiter, authenticate, authController.logout);
router.get('/profile', generalLimiter, authenticate, authController.getProfile);
router.put('/profile', generalLimiter, authenticate, uploadProfilePicture, authController.updateProfile);
router.put('/change-password', authLimiter, authenticate, authController.changePassword);
router.delete('/deactivate', authLimiter, authenticate, authController.deactivateAccount);

export default router;