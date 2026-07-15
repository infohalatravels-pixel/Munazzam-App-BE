import { Router } from 'express';
import { authenticate } from '../../../middlewares/auth.middleware.js';
import { authorize } from '../../../middlewares/role.middleware.js';
import { validate } from '../../../middlewares/validate.middleware.js';
import { USER_ROLES } from '../../../shared/constants/index.js';
import { clientsController } from '../controller/clients.controller.js';
import {
  clientIdParamSchema,
  createClientSchema,
  listClientsQuerySchema,
  updateClientSchema,
} from '../validator/clients.validator.js';

export const clientsRouter = Router();

clientsRouter.use(authenticate);
clientsRouter.use(authorize(USER_ROLES.ADMIN, USER_ROLES.HR));

clientsRouter.get('/stats', clientsController.stats);
clientsRouter.get('/', validate(listClientsQuerySchema, 'query'), clientsController.list);
clientsRouter.get('/:id', validate(clientIdParamSchema, 'params'), clientsController.getById);
clientsRouter.post('/', validate(createClientSchema), clientsController.create);
clientsRouter.patch(
  '/:id',
  validate(clientIdParamSchema, 'params'),
  validate(updateClientSchema),
  clientsController.update,
);
clientsRouter.delete(
  '/:id',
  validate(clientIdParamSchema, 'params'),
  clientsController.remove,
);
