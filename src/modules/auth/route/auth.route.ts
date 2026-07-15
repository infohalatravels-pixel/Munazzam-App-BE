import { Router } from 'express';
import { authenticate } from '../../../middlewares/auth.middleware.js';
import { validate } from '../../../middlewares/validate.middleware.js';
import { authController } from '../controller/auth.controller.js';
import { loginSchema, logoutSchema, refreshSchema } from '../validator/auth.validator.js';

export const authRouter = Router();

authRouter.post('/login', validate(loginSchema), authController.login);
authRouter.post('/refresh', validate(refreshSchema), authController.refresh);
authRouter.post('/logout', validate(logoutSchema), authController.logout);
authRouter.get('/me', authenticate, authController.me);
