import { Router } from 'express';
import { authenticate } from '../../../middlewares/auth.middleware.js';
import { analyticsController } from '../controller/analytics.controller.js';

export const analyticsRouter = Router();

analyticsRouter.use(authenticate);

analyticsRouter.get('/dashboard', analyticsController.dashboard);
