import { Router } from 'express';
import { authenticate } from '../../../middlewares/auth.middleware.js';
import { authorize } from '../../../middlewares/role.middleware.js';
import { validate } from '../../../middlewares/validate.middleware.js';
import { USER_ROLES } from '../../../shared/constants/index.js';
import { accountsController } from '../controller/accounts.controller.js';
import {
  accountIdParamSchema,
  createAccountSchema,
  updateAccountSchema,
} from '../validator/accounts.validator.js';

export const accountsRouter = Router();

accountsRouter.use(authenticate);
accountsRouter.use(authorize(USER_ROLES.ADMIN, USER_ROLES.HR));

accountsRouter.get('/', accountsController.list);

accountsRouter.get(
  '/:id',
  validate(accountIdParamSchema, 'params'),
  accountsController.getById,
);

accountsRouter.post(
  '/',
  validate(createAccountSchema),
  accountsController.create,
);

accountsRouter.patch(
  '/:id',
  validate(accountIdParamSchema, 'params'),
  validate(updateAccountSchema),
  accountsController.update,
);
