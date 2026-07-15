import { AppError } from '../../../shared/errors/index.js';
import { accountsRepository } from '../../accounts/repository/accounts.repository.js';
import { clientsRepository } from '../../clients/repository/clients.repository.js';
import { usersRepository } from '../../users/repository/users.repository.js';
import { vendorsRepository } from '../../vendors/repository/vendors.repository.js';
import {
  mapClientPayment,
  mapLedgerTransaction,
  mapPayroll,
  mapTransaction,
  mapTransferPair,
  mapVendorPayment,
} from '../dto/transactions.mapper.js';
import { transactionsRepository } from '../repository/transactions.repository.js';
import type {
  ClientPayment,
  CreateClientClearInput,
  CreateClientPaymentInput,
  CreateDepositInput,
  CreatePayrollInput,
  CreateTransferInput,
  CreateVendorClearInput,
  CreateVendorPaymentInput,
  ListLedgerQuery,
  PaginatedLedger,
  PaymentMode,
  Payroll,
  PayrollEmployeeOption,
  Transaction,
  TransactionStatus,
  Transfer,
  VendorPayment,
} from '../types/transactions.types.js';

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function toDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function deriveStatus(total: number, paid: number): TransactionStatus {
  if (paid <= 0) return 'pending';
  if (paid < total) return 'partial';
  return 'completed';
}

function validatePaymentMode(mode: PaymentMode, total: number, paid: number): void {
  if (mode === 'unpaid' && paid !== 0) {
    throw new AppError('Unpaid mode requires paid amount 0', 400, 'VALIDATION_ERROR');
  }
  if (mode === 'partial' && !(paid > 0 && paid < total)) {
    throw new AppError('Partial mode requires paid amount between 0 and total', 400, 'VALIDATION_ERROR');
  }
  if (mode === 'full' && paid !== total) {
    throw new AppError('Full mode requires paid amount equal to total', 400, 'VALIDATION_ERROR');
  }
  if (mode === 'advance' && !(paid > total)) {
    throw new AppError('Advance mode requires paid amount greater than total', 400, 'VALIDATION_ERROR');
  }
}

/** Eligible if never paid, or last transfer was at least 1 calendar month ago. */
export function getPayrollEligibility(lastSalaryTransferDate: string | null): {
  eligible: boolean;
  nextEligibleDate: string | null;
} {
  if (!lastSalaryTransferDate) {
    return { eligible: true, nextEligibleDate: null };
  }

  const last = new Date(lastSalaryTransferDate);
  if (Number.isNaN(last.getTime())) {
    return { eligible: true, nextEligibleDate: null };
  }

  const nextEligible = new Date(last);
  nextEligible.setMonth(nextEligible.getMonth() + 1);

  const now = new Date();
  return {
    eligible: now >= nextEligible,
    nextEligibleDate: toDateOnly(nextEligible),
  };
}

async function nextDepositReference(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await transactionsRepository.countDepositsForYear(year);
  return `DEP-${year}-${String(count + 1).padStart(6, '0')}`;
}

async function nextTransferReference(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await transactionsRepository.countTransfersForYear(year);
  return `TRF-${year}-${String(count + 1).padStart(6, '0')}`;
}

async function nextPayrollReference(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await transactionsRepository.countPayrollsForYear(year);
  return `PAY-${year}-${String(count + 1).padStart(6, '0')}`;
}

async function nextVendorPaymentReference(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await transactionsRepository.countVendorPaymentsForYear(year);
  return `VPAY-${year}-${String(count + 1).padStart(6, '0')}`;
}

async function nextVendorClearReference(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await transactionsRepository.countVendorClearsForYear(year);
  return `VCLR-${year}-${String(count + 1).padStart(6, '0')}`;
}

async function nextClientPaymentReference(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await transactionsRepository.countClientPaymentsForYear(year);
  return `CPAY-${year}-${String(count + 1).padStart(6, '0')}`;
}

async function nextClientClearReference(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await transactionsRepository.countClientClearsForYear(year);
  return `CCLR-${year}-${String(count + 1).padStart(6, '0')}`;
}

export class TransactionsService {
  async listDeposits(): Promise<Transaction[]> {
    const rows = await transactionsRepository.findDeposits();
    return rows.map(mapTransaction);
  }

  async listTransfers(): Promise<Transfer[]> {
    const rows = await transactionsRepository.findTransferPairs();
    const byReference = new Map<string, { out?: (typeof rows)[0]; in?: (typeof rows)[0] }>();

    for (const row of rows) {
      const key = row.reference ?? row.id;
      const entry = byReference.get(key) ?? {};
      if (row.transaction_type === 'transfer_out') entry.out = row;
      if (row.transaction_type === 'transfer_in') entry.in = row;
      byReference.set(key, entry);
    }

    const transfers: Transfer[] = [];
    for (const entry of byReference.values()) {
      if (!entry.out || !entry.in) continue;

      const source = entry.out.source_account
        ? {
            id: Array.isArray(entry.out.source_account)
              ? entry.out.source_account[0].id
              : entry.out.source_account.id,
            acName: Array.isArray(entry.out.source_account)
              ? entry.out.source_account[0].ac_name
              : entry.out.source_account.ac_name,
            acType: Array.isArray(entry.out.source_account)
              ? entry.out.source_account[0].ac_type
              : entry.out.source_account.ac_type,
          }
        : null;

      const destination = entry.out.destination_account
        ? {
            id: Array.isArray(entry.out.destination_account)
              ? entry.out.destination_account[0].id
              : entry.out.destination_account.id,
            acName: Array.isArray(entry.out.destination_account)
              ? entry.out.destination_account[0].ac_name
              : entry.out.destination_account.ac_name,
            acType: Array.isArray(entry.out.destination_account)
              ? entry.out.destination_account[0].ac_type
              : entry.out.destination_account.ac_type,
          }
        : null;

      if (!source || !destination) continue;
      transfers.push(mapTransferPair(entry.out, entry.in, source, destination));
    }

    return transfers.sort(
      (a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime(),
    );
  }

  async listLedger(query: ListLedgerQuery): Promise<PaginatedLedger> {
    const { rows, total } = await transactionsRepository.findLedgerPage(query.page, query.limit);
    return {
      items: rows.map(mapLedgerTransaction),
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.ceil(total / query.limit) || 1,
    };
  }

  async createDeposit(input: CreateDepositInput): Promise<Transaction> {
    const account = await accountsRepository.findById(input.destinationAccountId);
    if (!account) {
      throw new AppError('Destination account not found', 404, 'NOT_FOUND');
    }

    const amount = roundMoney(input.amount);
    if (amount <= 0) {
      throw new AppError('Amount must be greater than 0', 400, 'VALIDATION_ERROR');
    }

    const openingBalance = roundMoney(Number(account.balance));
    const closingBalance = roundMoney(openingBalance + amount);
    const reference = await nextDepositReference();
    const notes = input.notes?.trim() ? input.notes.trim() : null;

    const row = await transactionsRepository.createDeposit({
      destinationAccountId: account.id,
      openingBalance,
      closingBalance,
      amount,
      reference,
      notes,
    });

    try {
      await transactionsRepository.updateAccountBalance(account.id, closingBalance);
    } catch (error) {
      await transactionsRepository.softDelete(row.id);
      throw error;
    }

    return mapTransaction({
      ...row,
      destination_account: {
        id: account.id,
        ac_name: account.ac_name,
        ac_type: account.ac_type,
      },
      source_account: null,
      employee: null,
      vendor: null,
      client: null,
    });
  }

  async createTransfer(input: CreateTransferInput): Promise<Transfer> {
    if (input.sourceAccountId === input.destinationAccountId) {
      throw new AppError('Source and destination accounts must be different', 400, 'VALIDATION_ERROR');
    }

    const [source, destination] = await Promise.all([
      accountsRepository.findById(input.sourceAccountId),
      accountsRepository.findById(input.destinationAccountId),
    ]);

    if (!source) {
      throw new AppError('Source account not found', 404, 'NOT_FOUND');
    }
    if (!destination) {
      throw new AppError('Destination account not found', 404, 'NOT_FOUND');
    }

    const amount = roundMoney(input.amount);
    if (amount <= 0) {
      throw new AppError('Amount must be greater than 0', 400, 'VALIDATION_ERROR');
    }

    const sourceOpening = roundMoney(Number(source.balance));
    if (amount > sourceOpening) {
      throw new AppError('Insufficient balance in source account', 400, 'INSUFFICIENT_BALANCE');
    }

    const sourceClosing = roundMoney(sourceOpening - amount);
    const destinationOpening = roundMoney(Number(destination.balance));
    const destinationClosing = roundMoney(destinationOpening + amount);
    const reference = await nextTransferReference();
    const notes = input.notes?.trim() ? input.notes.trim() : null;

    const { transferOut, transferIn } = await transactionsRepository.createTransferPair({
      sourceAccountId: source.id,
      destinationAccountId: destination.id,
      sourceOpeningBalance: sourceOpening,
      sourceClosingBalance: sourceClosing,
      destinationOpeningBalance: destinationOpening,
      destinationClosingBalance: destinationClosing,
      amount,
      reference,
      notes,
    });

    try {
      await transactionsRepository.updateAccountBalance(source.id, sourceClosing);
      await transactionsRepository.updateAccountBalance(destination.id, destinationClosing);
    } catch (error) {
      await transactionsRepository.softDeleteMany([transferOut.id, transferIn.id]);
      throw error;
    }

    return mapTransferPair(
      transferOut,
      transferIn,
      {
        id: source.id,
        acName: source.ac_name,
        acType: source.ac_type,
      },
      {
        id: destination.id,
        acName: destination.ac_name,
        acType: destination.ac_type,
      },
    );
  }

  async listPayrolls(): Promise<Payroll[]> {
    const rows = await transactionsRepository.findPayrolls();
    return rows
      .map((row) => {
        const source = row.source_account
          ? {
              id: Array.isArray(row.source_account) ? row.source_account[0].id : row.source_account.id,
              acName: Array.isArray(row.source_account)
                ? row.source_account[0].ac_name
                : row.source_account.ac_name,
              acType: Array.isArray(row.source_account)
                ? row.source_account[0].ac_type
                : row.source_account.ac_type,
            }
          : null;
        const employeeJoin = row.employee
          ? Array.isArray(row.employee)
            ? row.employee[0]
            : row.employee
          : null;
        if (!source || !employeeJoin) return null;
        return mapPayroll(row, source, {
          id: employeeJoin.id,
          firstName: employeeJoin.first_name,
          lastName: employeeJoin.last_name,
          employeeCode: employeeJoin.employee_code,
          salary: employeeJoin.salary != null ? Number(employeeJoin.salary) : null,
          lastSalaryTransferDate: employeeJoin.last_salary_transfer_date,
        });
      })
      .filter((item): item is Payroll => item !== null);
  }

  async listPayrollEmployees(): Promise<PayrollEmployeeOption[]> {
    const rows = await transactionsRepository.listActiveEmployeesForPayroll();
    return rows.map((row) => {
      const eligibility = getPayrollEligibility(row.last_salary_transfer_date);
      return {
        id: row.id,
        firstName: row.first_name,
        lastName: row.last_name,
        employeeCode: row.employee_code,
        salary: row.salary != null ? Number(row.salary) : null,
        lastSalaryTransferDate: row.last_salary_transfer_date,
        eligible: eligibility.eligible,
        nextEligibleDate: eligibility.nextEligibleDate,
      };
    });
  }

  async createPayroll(input: CreatePayrollInput): Promise<Payroll> {
    const [source, employee] = await Promise.all([
      accountsRepository.findById(input.sourceAccountId),
      usersRepository.findById(input.employeeId),
    ]);

    if (!source) {
      throw new AppError('Source account not found', 404, 'NOT_FOUND');
    }
    if (!employee || !employee.is_active) {
      throw new AppError('Employee not found or inactive', 404, 'NOT_FOUND');
    }

    const eligibility = getPayrollEligibility(employee.last_salary_transfer_date);
    if (!eligibility.eligible) {
      throw new AppError(
        `Payroll already processed this month. Next eligible on ${eligibility.nextEligibleDate}`,
        400,
        'PAYROLL_NOT_ELIGIBLE',
      );
    }

    const salaryAmount = employee.salary != null ? Number(employee.salary) : null;
    const rawAmount = input.amount ?? salaryAmount;
    if (rawAmount == null || rawAmount <= 0) {
      throw new AppError('Employee has no salary set. Enter an amount.', 400, 'VALIDATION_ERROR');
    }

    const amount = roundMoney(rawAmount);
    const openingBalance = roundMoney(Number(source.balance));
    if (amount > openingBalance) {
      throw new AppError('Insufficient balance in source account', 400, 'INSUFFICIENT_BALANCE');
    }

    const closingBalance = roundMoney(openingBalance - amount);
    const reference = await nextPayrollReference();
    const notes = input.notes?.trim() ? input.notes.trim() : null;
    const transferDate = toDateOnly(new Date());

    const row = await transactionsRepository.createPayroll({
      sourceAccountId: source.id,
      employeeId: employee.id,
      openingBalance,
      closingBalance,
      amount,
      reference,
      notes,
    });

    try {
      await transactionsRepository.updateAccountBalance(source.id, closingBalance);
      await transactionsRepository.updateEmployeeLastSalaryTransferDate(employee.id, transferDate);
    } catch (error) {
      await transactionsRepository.softDelete(row.id);
      throw error;
    }

    return mapPayroll(
      row,
      {
        id: source.id,
        acName: source.ac_name,
        acType: source.ac_type,
      },
      {
        id: employee.id,
        firstName: employee.first_name,
        lastName: employee.last_name,
        employeeCode: employee.employee_code,
        salary: employee.salary != null ? Number(employee.salary) : null,
        lastSalaryTransferDate: transferDate,
      },
    );
  }

  async listVendorPayments(): Promise<VendorPayment[]> {
    const rows = await transactionsRepository.findByTypes(['vendor_payment', 'vendor_clear']);
    return rows
      .map((row) => {
        try {
          const before = row.party_opening_balance != null ? Number(row.party_opening_balance) : 0;
          const after = row.party_closing_balance != null ? Number(row.party_closing_balance) : 0;
          return mapVendorPayment(row, before, after);
        } catch {
          return null;
        }
      })
      .filter((item): item is VendorPayment => item !== null);
  }

  async listClientPayments(): Promise<ClientPayment[]> {
    const rows = await transactionsRepository.findByTypes(['client_payment', 'client_clear']);
    return rows
      .map((row) => {
        try {
          const before = row.party_opening_balance != null ? Number(row.party_opening_balance) : 0;
          const after = row.party_closing_balance != null ? Number(row.party_closing_balance) : 0;
          return mapClientPayment(row, before, after);
        } catch {
          return null;
        }
      })
      .filter((item): item is ClientPayment => item !== null);
  }

  async createVendorPayment(input: CreateVendorPaymentInput): Promise<VendorPayment> {
    const vendor = await vendorsRepository.findById(input.vendorId);
    if (!vendor) {
      throw new AppError('Vendor not found', 404, 'NOT_FOUND');
    }

    const lineItems = input.items.map((item, index) => {
      const unitPrice = roundMoney(item.unitPrice);
      const quantity = item.quantity != null ? Number(item.quantity) : null;
      const lineTotal = roundMoney(unitPrice * (quantity ?? 1));
      return {
        productName: item.productName.trim(),
        unitPrice,
        quantity,
        lineTotal,
        sortOrder: index,
      };
    });

    const totalAmount = roundMoney(lineItems.reduce((sum, item) => sum + item.lineTotal, 0));
    if (totalAmount <= 0) {
      throw new AppError('Total amount must be greater than 0', 400, 'VALIDATION_ERROR');
    }

    const paidAmount = roundMoney(input.paidAmount);
    validatePaymentMode(input.paymentMode, totalAmount, paidAmount);
    const remainingAmount = roundMoney(totalAmount - paidAmount);
    const status = deriveStatus(totalAmount, paidAmount);

    let sourceAccountId: string | null = null;
    let openingBalance = 0;
    let closingBalance = 0;
    let sourceMeta: { id: string; ac_name: string; ac_type: 'bank' | 'cash' } | null = null;

    if (paidAmount > 0) {
      if (!input.sourceAccountId) {
        throw new AppError('Source account is required when paying', 400, 'VALIDATION_ERROR');
      }
      const source = await accountsRepository.findById(input.sourceAccountId);
      if (!source) {
        throw new AppError('Source account not found', 404, 'NOT_FOUND');
      }
      openingBalance = roundMoney(Number(source.balance));
      if (paidAmount > openingBalance) {
        throw new AppError('Insufficient balance in source account', 400, 'INSUFFICIENT_BALANCE');
      }
      closingBalance = roundMoney(openingBalance - paidAmount);
      sourceAccountId = source.id;
      sourceMeta = { id: source.id, ac_name: source.ac_name, ac_type: source.ac_type };
    }

    const partyBefore = roundMoney(Number(vendor.balance));
    const partyAfter = roundMoney(partyBefore + remainingAmount);
    const reference = await nextVendorPaymentReference();
    const notes = input.notes?.trim() ? input.notes.trim() : null;

    const row = await transactionsRepository.createPartyTransaction({
      transactionType: 'vendor_payment',
      sourceAccountId,
      destinationAccountId: null,
      vendorId: vendor.id,
      clientId: null,
      openingBalance,
      closingBalance,
      partyOpeningBalance: partyBefore,
      partyClosingBalance: partyAfter,
      totalAmount,
      paidAmount,
      remainingAmount,
      paymentMode: input.paymentMode,
      status,
      reference,
      notes,
      vendorItems: lineItems,
    });

    try {
      if (sourceAccountId) {
        await transactionsRepository.updateAccountBalance(sourceAccountId, closingBalance);
      }
      await vendorsRepository.updateBalance(vendor.id, partyAfter);
    } catch (error) {
      await transactionsRepository.softDelete(row.id);
      throw error;
    }

    return mapVendorPayment(
      {
        ...row,
        source_account: sourceMeta,
        vendor: {
          id: vendor.id,
          name: vendor.name,
          balance: partyAfter,
        },
      },
      partyBefore,
      partyAfter,
    );
  }

  async createVendorClear(input: CreateVendorClearInput): Promise<VendorPayment> {
    const [vendor, source] = await Promise.all([
      vendorsRepository.findById(input.vendorId),
      accountsRepository.findById(input.sourceAccountId),
    ]);

    if (!vendor) throw new AppError('Vendor not found', 404, 'NOT_FOUND');
    if (!source) throw new AppError('Source account not found', 404, 'NOT_FOUND');

    const paidAmount = roundMoney(input.paidAmount);
    if (paidAmount <= 0) {
      throw new AppError('Payment amount must be greater than 0', 400, 'VALIDATION_ERROR');
    }

    const openingBalance = roundMoney(Number(source.balance));
    if (paidAmount > openingBalance) {
      throw new AppError('Insufficient balance in source account', 400, 'INSUFFICIENT_BALANCE');
    }

    const closingBalance = roundMoney(openingBalance - paidAmount);
    const partyBefore = roundMoney(Number(vendor.balance));
    const partyAfter = roundMoney(partyBefore - paidAmount);
    const reference = await nextVendorClearReference();
    const notes = input.notes?.trim() ? input.notes.trim() : null;

    const row = await transactionsRepository.createPartyTransaction({
      transactionType: 'vendor_clear',
      sourceAccountId: source.id,
      destinationAccountId: null,
      vendorId: vendor.id,
      clientId: null,
      openingBalance,
      closingBalance,
      partyOpeningBalance: partyBefore,
      partyClosingBalance: partyAfter,
      totalAmount: paidAmount,
      paidAmount,
      remainingAmount: 0,
      paymentMode: 'clear',
      status: 'completed',
      reference,
      notes,
    });

    try {
      await transactionsRepository.updateAccountBalance(source.id, closingBalance);
      await vendorsRepository.updateBalance(vendor.id, partyAfter);
    } catch (error) {
      await transactionsRepository.softDelete(row.id);
      throw error;
    }

    return mapVendorPayment(
      {
        ...row,
        source_account: {
          id: source.id,
          ac_name: source.ac_name,
          ac_type: source.ac_type,
        },
        vendor: {
          id: vendor.id,
          name: vendor.name,
          balance: partyAfter,
        },
      },
      partyBefore,
      partyAfter,
    );
  }

  async createClientPayment(input: CreateClientPaymentInput): Promise<ClientPayment> {
    const client = await clientsRepository.findById(input.clientId);
    if (!client) {
      throw new AppError('Client not found', 404, 'NOT_FOUND');
    }

    const lineItems = input.items.map((item, index) => ({
      serviceName: item.serviceName.trim(),
      amount: roundMoney(item.amount),
      description: item.description?.trim() ? item.description.trim() : null,
      sortOrder: index,
    }));

    const totalAmount = roundMoney(lineItems.reduce((sum, item) => sum + item.amount, 0));
    if (totalAmount <= 0) {
      throw new AppError('Total amount must be greater than 0', 400, 'VALIDATION_ERROR');
    }

    const paidAmount = roundMoney(input.paidAmount);
    validatePaymentMode(input.paymentMode, totalAmount, paidAmount);
    const remainingAmount = roundMoney(totalAmount - paidAmount);
    const status = deriveStatus(totalAmount, paidAmount);

    let destinationAccountId: string | null = null;
    let openingBalance = 0;
    let closingBalance = 0;

    if (paidAmount > 0) {
      if (!input.destinationAccountId) {
        throw new AppError('Destination account is required when receiving payment', 400, 'VALIDATION_ERROR');
      }
      const destination = await accountsRepository.findById(input.destinationAccountId);
      if (!destination) {
        throw new AppError('Destination account not found', 404, 'NOT_FOUND');
      }
      openingBalance = roundMoney(Number(destination.balance));
      closingBalance = roundMoney(openingBalance + paidAmount);
      destinationAccountId = destination.id;
    }

    const partyBefore = roundMoney(Number(client.balance));
    const partyAfter = roundMoney(partyBefore + remainingAmount);
    const reference = await nextClientPaymentReference();
    const notes = input.notes?.trim() ? input.notes.trim() : null;

    const row = await transactionsRepository.createPartyTransaction({
      transactionType: 'client_payment',
      sourceAccountId: null,
      destinationAccountId,
      vendorId: null,
      clientId: client.id,
      openingBalance,
      closingBalance,
      partyOpeningBalance: partyBefore,
      partyClosingBalance: partyAfter,
      totalAmount,
      paidAmount,
      remainingAmount,
      paymentMode: input.paymentMode,
      status,
      reference,
      notes,
      clientItems: lineItems,
    });

    try {
      if (destinationAccountId) {
        await transactionsRepository.updateAccountBalance(destinationAccountId, closingBalance);
      }
      await clientsRepository.updateBalance(client.id, partyAfter);
    } catch (error) {
      await transactionsRepository.softDelete(row.id);
      throw error;
    }

    const dest = destinationAccountId
      ? await accountsRepository.findById(destinationAccountId)
      : null;

    return mapClientPayment(
      {
        ...row,
        destination_account: dest
          ? { id: dest.id, ac_name: dest.ac_name, ac_type: dest.ac_type }
          : null,
        client: {
          id: client.id,
          name: client.name,
          balance: partyAfter,
        },
      },
      partyBefore,
      partyAfter,
    );
  }

  async createClientClear(input: CreateClientClearInput): Promise<ClientPayment> {
    const [client, destination] = await Promise.all([
      clientsRepository.findById(input.clientId),
      accountsRepository.findById(input.destinationAccountId),
    ]);

    if (!client) throw new AppError('Client not found', 404, 'NOT_FOUND');
    if (!destination) throw new AppError('Destination account not found', 404, 'NOT_FOUND');

    const paidAmount = roundMoney(input.paidAmount);
    if (paidAmount <= 0) {
      throw new AppError('Payment amount must be greater than 0', 400, 'VALIDATION_ERROR');
    }

    const openingBalance = roundMoney(Number(destination.balance));
    const closingBalance = roundMoney(openingBalance + paidAmount);
    const partyBefore = roundMoney(Number(client.balance));
    const partyAfter = roundMoney(partyBefore - paidAmount);
    const reference = await nextClientClearReference();
    const notes = input.notes?.trim() ? input.notes.trim() : null;

    const row = await transactionsRepository.createPartyTransaction({
      transactionType: 'client_clear',
      sourceAccountId: null,
      destinationAccountId: destination.id,
      vendorId: null,
      clientId: client.id,
      openingBalance,
      closingBalance,
      partyOpeningBalance: partyBefore,
      partyClosingBalance: partyAfter,
      totalAmount: paidAmount,
      paidAmount,
      remainingAmount: 0,
      paymentMode: 'clear',
      status: 'completed',
      reference,
      notes,
    });

    try {
      await transactionsRepository.updateAccountBalance(destination.id, closingBalance);
      await clientsRepository.updateBalance(client.id, partyAfter);
    } catch (error) {
      await transactionsRepository.softDelete(row.id);
      throw error;
    }

    return mapClientPayment(
      {
        ...row,
        destination_account: {
          id: destination.id,
          ac_name: destination.ac_name,
          ac_type: destination.ac_type,
        },
        client: {
          id: client.id,
          name: client.name,
          balance: partyAfter,
        },
      },
      partyBefore,
      partyAfter,
    );
  }
}

export const transactionsService = new TransactionsService();
