import { Router } from 'express';
import { authenticate } from '../../../middlewares/auth.middleware.js';
import { authorize } from '../../../middlewares/role.middleware.js';
import { validate } from '../../../middlewares/validate.middleware.js';
import { USER_ROLES } from '../../../shared/constants/index.js';
import { vendorsController } from '../controller/vendors.controller.js';
import {
  createVendorSchema,
  listVendorsQuerySchema,
  updateVendorSchema,
  vendorIdParamSchema,
} from '../validator/vendors.validator.js';

export const vendorsRouter = Router();

vendorsRouter.use(authenticate);
vendorsRouter.use(authorize(USER_ROLES.ADMIN, USER_ROLES.HR));

vendorsRouter.get('/stats', vendorsController.stats);
vendorsRouter.get('/', validate(listVendorsQuerySchema, 'query'), vendorsController.list);
vendorsRouter.get('/:id', validate(vendorIdParamSchema, 'params'), vendorsController.getById);
vendorsRouter.post('/', validate(createVendorSchema), vendorsController.create);
vendorsRouter.patch(
  '/:id',
  validate(vendorIdParamSchema, 'params'),
  validate(updateVendorSchema),
  vendorsController.update,
);
vendorsRouter.delete(
  '/:id',
  validate(vendorIdParamSchema, 'params'),
  vendorsController.remove,
);
