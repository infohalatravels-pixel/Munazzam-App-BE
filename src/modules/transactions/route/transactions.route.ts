import { Router } from 'express';
import { authenticate } from '../../../middlewares/auth.middleware.js';
import { authorize } from '../../../middlewares/role.middleware.js';
import { validate } from '../../../middlewares/validate.middleware.js';
import { USER_ROLES } from '../../../shared/constants/index.js';
import { transactionsController } from '../controller/transactions.controller.js';
import {
  createClientClearSchema,
  createClientPaymentSchema,
  createDepositSchema,
  createPayrollSchema,
  createTransferSchema,
  createVendorClearSchema,
  createVendorPaymentSchema,
  listLedgerQuerySchema,
} from '../validator/transactions.validator.js';

export const transactionsRouter = Router();

transactionsRouter.use(authenticate);
transactionsRouter.use(authorize(USER_ROLES.ADMIN, USER_ROLES.HR));

transactionsRouter.get(
  '/',
  validate(listLedgerQuerySchema, 'query'),
  transactionsController.listLedger,
);

transactionsRouter.get('/deposits', transactionsController.listDeposits);
transactionsRouter.post(
  '/deposits',
  validate(createDepositSchema),
  transactionsController.createDeposit,
);

transactionsRouter.get('/transfers', transactionsController.listTransfers);
transactionsRouter.post(
  '/transfers',
  validate(createTransferSchema),
  transactionsController.createTransfer,
);

transactionsRouter.get('/payrolls/employees', transactionsController.listPayrollEmployees);
transactionsRouter.get('/payrolls', transactionsController.listPayrolls);
transactionsRouter.post(
  '/payrolls',
  validate(createPayrollSchema),
  transactionsController.createPayroll,
);

transactionsRouter.get('/vendor-payments', transactionsController.listVendorPayments);
transactionsRouter.post(
  '/vendor-payments',
  validate(createVendorPaymentSchema),
  transactionsController.createVendorPayment,
);
transactionsRouter.post(
  '/vendor-clears',
  validate(createVendorClearSchema),
  transactionsController.createVendorClear,
);

transactionsRouter.get('/client-payments', transactionsController.listClientPayments);
transactionsRouter.post(
  '/client-payments',
  validate(createClientPaymentSchema),
  transactionsController.createClientPayment,
);
transactionsRouter.post(
  '/client-clears',
  validate(createClientClearSchema),
  transactionsController.createClientClear,
);
