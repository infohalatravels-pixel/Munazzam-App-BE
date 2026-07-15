import { Router } from 'express';
import { authenticate } from '../../../middlewares/auth.middleware.js';
import { authorize } from '../../../middlewares/role.middleware.js';
import { USER_ROLES } from '../../../shared/constants/index.js';
import { rolesController } from '../controller/roles.controller.js';

export const rolesRouter = Router();

rolesRouter.get(
  '/',
  authenticate,
  authorize(USER_ROLES.ADMIN, USER_ROLES.HR),
  rolesController.list,
);
