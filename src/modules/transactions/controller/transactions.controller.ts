import type { Request, Response } from 'express';
import { asyncHandler } from '../../../shared/async-handler.js';
import { successResponse } from '../../../shared/responses/index.js';
import { transactionsService } from '../service/transactions.service.js';
import type {
  CreateClientClearBody,
  CreateClientPaymentBody,
  CreateDepositBody,
  CreatePayrollBody,
  CreateTransferBody,
  CreateVendorClearBody,
  CreateVendorPaymentBody,
  ListLedgerQueryBody,
} from '../validator/transactions.validator.js';

export class TransactionsController {
  listDeposits = asyncHandler(async (_req: Request, res: Response) => {
    const deposits = await transactionsService.listDeposits();
    res.status(200).json(successResponse(deposits, 'Deposits retrieved'));
  });

  createDeposit = asyncHandler(async (req: Request, res: Response) => {
    const body = req.body as CreateDepositBody;
    const deposit = await transactionsService.createDeposit({
      destinationAccountId: body.destinationAccountId,
      amount: body.amount,
      notes: body.notes ?? null,
    });
    res.status(201).json(successResponse(deposit, 'Deposit recorded'));
  });

  listTransfers = asyncHandler(async (_req: Request, res: Response) => {
    const transfers = await transactionsService.listTransfers();
    res.status(200).json(successResponse(transfers, 'Transfers retrieved'));
  });

  createTransfer = asyncHandler(async (req: Request, res: Response) => {
    const body = req.body as CreateTransferBody;
    const transfer = await transactionsService.createTransfer({
      sourceAccountId: body.sourceAccountId,
      destinationAccountId: body.destinationAccountId,
      amount: body.amount,
      notes: body.notes ?? null,
    });
    res.status(201).json(successResponse(transfer, 'Transfer recorded'));
  });

  listPayrolls = asyncHandler(async (_req: Request, res: Response) => {
    const payrolls = await transactionsService.listPayrolls();
    res.status(200).json(successResponse(payrolls, 'Payrolls retrieved'));
  });

  listPayrollEmployees = asyncHandler(async (_req: Request, res: Response) => {
    const employees = await transactionsService.listPayrollEmployees();
    res.status(200).json(successResponse(employees, 'Payroll employees retrieved'));
  });

  createPayroll = asyncHandler(async (req: Request, res: Response) => {
    const body = req.body as CreatePayrollBody;
    const payroll = await transactionsService.createPayroll({
      sourceAccountId: body.sourceAccountId,
      employeeId: body.employeeId,
      amount: body.amount ?? null,
      notes: body.notes ?? null,
    });
    res.status(201).json(successResponse(payroll, 'Payroll recorded'));
  });

  listVendorPayments = asyncHandler(async (_req: Request, res: Response) => {
    const items = await transactionsService.listVendorPayments();
    res.status(200).json(successResponse(items, 'Vendor payments retrieved'));
  });

  createVendorPayment = asyncHandler(async (req: Request, res: Response) => {
    const body = req.body as CreateVendorPaymentBody;
    const result = await transactionsService.createVendorPayment({
      vendorId: body.vendorId,
      sourceAccountId: body.sourceAccountId ?? null,
      paymentMode: body.paymentMode,
      paidAmount: body.paidAmount,
      notes: body.notes ?? null,
      items: body.items,
    });
    res.status(201).json(successResponse(result, 'Vendor payment recorded'));
  });

  createVendorClear = asyncHandler(async (req: Request, res: Response) => {
    const body = req.body as CreateVendorClearBody;
    const result = await transactionsService.createVendorClear({
      vendorId: body.vendorId,
      sourceAccountId: body.sourceAccountId,
      paidAmount: body.paidAmount,
      notes: body.notes ?? null,
    });
    res.status(201).json(successResponse(result, 'Vendor bill cleared'));
  });

  listClientPayments = asyncHandler(async (_req: Request, res: Response) => {
    const items = await transactionsService.listClientPayments();
    res.status(200).json(successResponse(items, 'Client payments retrieved'));
  });

  createClientPayment = asyncHandler(async (req: Request, res: Response) => {
    const body = req.body as CreateClientPaymentBody;
    const result = await transactionsService.createClientPayment({
      clientId: body.clientId,
      destinationAccountId: body.destinationAccountId ?? null,
      paymentMode: body.paymentMode,
      paidAmount: body.paidAmount,
      notes: body.notes ?? null,
      items: body.items,
    });
    res.status(201).json(successResponse(result, 'Client payment recorded'));
  });

  createClientClear = asyncHandler(async (req: Request, res: Response) => {
    const body = req.body as CreateClientClearBody;
    const result = await transactionsService.createClientClear({
      clientId: body.clientId,
      destinationAccountId: body.destinationAccountId,
      paidAmount: body.paidAmount,
      notes: body.notes ?? null,
    });
    res.status(201).json(successResponse(result, 'Client bill cleared'));
  });

  listLedger = asyncHandler(async (req: Request, res: Response) => {
    const query = req.query as unknown as ListLedgerQueryBody;
    const result = await transactionsService.listLedger({
      page: query.page,
      limit: query.limit,
    });
    res.status(200).json(successResponse(result, 'Transactions retrieved'));
  });
}

export const transactionsController = new TransactionsController();
