import { Router } from 'express';
import { authController } from './auth.controller';
import { validateRequest } from '../../middleware/validateRequest';
import { authLimiter } from '../../middleware/rateLimiter';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  refreshTokenSchema
} from './auth.validation';
import { authenticate } from '../../middleware/authenticate';

const router = Router();

router.post('/register', authLimiter, validateRequest({ body: registerSchema }), authController.register);
router.post('/login', authLimiter, validateRequest({ body: loginSchema }), authController.login);
router.post('/logout', authenticate, authController.logout);
router.post('/refresh-token', validateRequest({ body: refreshTokenSchema }), authController.refreshToken);
router.post('/forgot-password', authLimiter, validateRequest({ body: forgotPasswordSchema }), authController.forgotPassword);
router.post('/reset-password', authLimiter, validateRequest({ body: resetPasswordSchema }), authController.resetPassword);
router.post('/verify-email', validateRequest({ body: verifyEmailSchema }), authController.verifyEmail);

export const authRoutes = router;
