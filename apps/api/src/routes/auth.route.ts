import { Router } from 'express';
import { z } from 'zod';
import { authController } from '../controllers/auth.controller';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';

const router = Router();

const registerSchema = z.object({
  email:    z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name:     z.string().min(1, 'Name is required'),
  role:     z.enum(['admin', 'ops', 'viewer']).optional(),
});

const loginSchema = z.object({
  email:    z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});

router.post('/register', validate(registerSchema), authController.register.bind(authController));
router.post('/login',    validate(loginSchema),    authController.login.bind(authController));
router.get('/me',        authenticate,             authController.me.bind(authController));

export default router;
