import { Router } from 'express';
import { authenticate } from '../../../middlewares/auth.middleware.js';
import { announcementsController } from '../controller/announcements.controller.js';

export const announcementsRouter = Router();

announcementsRouter.use(authenticate);
announcementsRouter.get('/', announcementsController.list);
