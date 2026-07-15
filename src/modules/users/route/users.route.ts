import { Router } from 'express';
import { authenticate } from '../../../middlewares/auth.middleware.js';
import { authorize } from '../../../middlewares/role.middleware.js';
import { validate } from '../../../middlewares/validate.middleware.js';
import { USER_ROLES } from '../../../shared/constants/index.js';
import { usersController } from '../controller/users.controller.js';
import {
  createUserSchema,
  listUsersQuerySchema,
  updateUserSchema,
  userIdParamSchema,
} from '../validator/users.validator.js';

export const usersRouter = Router();

usersRouter.use(authenticate);

usersRouter.get(
  '/lookups',
  authorize(USER_ROLES.ADMIN, USER_ROLES.HR),
  usersController.lookups,
);

usersRouter.get(
  '/stats',
  authorize(USER_ROLES.ADMIN, USER_ROLES.HR),
  usersController.stats,
);

usersRouter.get(
  '/',
  authorize(USER_ROLES.ADMIN, USER_ROLES.HR),
  validate(listUsersQuerySchema, 'query'),
  usersController.list,
);

usersRouter.get(
  '/:id',
  validate(userIdParamSchema, 'params'),
  usersController.getById,
);

usersRouter.post(
  '/',
  authorize(USER_ROLES.ADMIN, USER_ROLES.HR),
  validate(createUserSchema),
  usersController.create,
);

usersRouter.patch(
  '/:id',
  validate(userIdParamSchema, 'params'),
  validate(updateUserSchema),
  usersController.update,
);

usersRouter.delete(
  '/:id',
  authorize(USER_ROLES.ADMIN),
  validate(userIdParamSchema, 'params'),
  usersController.remove,
);
