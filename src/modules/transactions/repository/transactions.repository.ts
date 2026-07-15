import { supabase } from '../../../database/supabase.js';
import { AppError } from '../../../shared/errors/index.js';
import type {
  PaymentMode,
  TransactionStatus,
  TransactionType,
} from '../types/transactions.types.js';

export interface TransactionAccountJoin {
  id: string;
  ac_name: string;
  ac_type: 'bank' | 'cash';
}

export interface TransactionEmployeeJoin {
  id: string;
  first_name: string;
  last_name: string;
  employee_code: string | null;
  salary: number | string | null;
  last_salary_transfer_date: string | null;
}

export interface TransactionVendorJoin {
  id: string;
  name: string;
  balance: number | string;
}

export interface TransactionClientJoin {
  id: string;
  name: string;
  balance: number | string;
}

export interface VendorItemRow {
  id: string;
  transaction_id: string;
  product_name: string;
  unit_price: number | string;
  quantity: number | string | null;
  line_total: number | string;
  sort_order: number;
}

export interface ClientItemRow {
  id: string;
  transaction_id: string;
  service_name: string;
  amount: number | string;
  description: string | null;
  sort_order: number;
}

export interface TransactionRow {
  id: string;
  transaction_type: TransactionType;
  source_account_id: string | null;
  destination_account_id: string | null;
  opening_balance: number | string;
  closing_balance: number | string;
  total_amount: number | string;
  paid_amount: number | string;
  remaining_amount: number | string;
  payment_mode: PaymentMode | null;
  employee_id: string | null;
  vendor_id: string | null;
  client_id: string | null;
  party_opening_balance: number | string | null;
  party_closing_balance: number | string | null;
  reference: string | null;
  notes: string | null;
  transaction_date: string;
  status: TransactionStatus;
  created_at: string;
  updated_at: string;
  source_account: TransactionAccountJoin | TransactionAccountJoin[] | null;
  destination_account: TransactionAccountJoin | TransactionAccountJoin[] | null;
  employee: TransactionEmployeeJoin | TransactionEmployeeJoin[] | null;
  vendor: TransactionVendorJoin | TransactionVendorJoin[] | null;
  client: TransactionClientJoin | TransactionClientJoin[] | null;
  vendor_items?: VendorItemRow[] | null;
  client_items?: ClientItemRow[] | null;
}

const TRANSACTION_SELECT = `
  id,
  transaction_type,
  source_account_id,
  destination_account_id,
  opening_balance,
  closing_balance,
  total_amount,
  paid_amount,
  remaining_amount,
  payment_mode,
  employee_id,
  vendor_id,
  client_id,
  party_opening_balance,
  party_closing_balance,
  reference,
  notes,
  transaction_date,
  status,
  created_at,
  updated_at,
  source_account:accounts!source_account_id ( id, ac_name, ac_type ),
  destination_account:accounts!destination_account_id ( id, ac_name, ac_type ),
  employee:users!employee_id ( id, first_name, last_name, employee_code, salary, last_salary_transfer_date ),
  vendor:vendors!vendor_id ( id, name, balance ),
  client:clients!client_id ( id, name, balance ),
  vendor_items:transaction_vendor_items ( id, transaction_id, product_name, unit_price, quantity, line_total, sort_order ),
  client_items:transaction_client_items ( id, transaction_id, service_name, amount, description, sort_order )
`;

const BASE_SELECT = `
  id,
  transaction_type,
  source_account_id,
  destination_account_id,
  opening_balance,
  closing_balance,
  total_amount,
  paid_amount,
  remaining_amount,
  payment_mode,
  employee_id,
  vendor_id,
  client_id,
  party_opening_balance,
  party_closing_balance,
  reference,
  notes,
  transaction_date,
  status,
  created_at,
  updated_at
`;

function emptyJoins(
  row: Omit<
    TransactionRow,
    | 'source_account'
    | 'destination_account'
    | 'employee'
    | 'vendor'
    | 'client'
    | 'vendor_items'
    | 'client_items'
  >,
): TransactionRow {
  return {
    ...row,
    source_account: null,
    destination_account: null,
    employee: null,
    vendor: null,
    client: null,
    vendor_items: [],
    client_items: [],
  };
}

export class TransactionsRepository {
  async findDeposits(): Promise<TransactionRow[]> {
    const { data, error } = await supabase
      .from('transactions')
      .select(TRANSACTION_SELECT)
      .eq('transaction_type', 'deposit')
      .is('deleted_at', null)
      .order('transaction_date', { ascending: false });

    if (error) {
      throw new AppError('Failed to fetch deposits', 500, 'DATABASE_ERROR', error);
    }

    return (data ?? []) as TransactionRow[];
  }

  async findTransferPairs(): Promise<TransactionRow[]> {
    const { data, error } = await supabase
      .from('transactions')
      .select(TRANSACTION_SELECT)
      .in('transaction_type', ['transfer_out', 'transfer_in'])
      .is('deleted_at', null)
      .order('transaction_date', { ascending: false });

    if (error) {
      throw new AppError('Failed to fetch transfers', 500, 'DATABASE_ERROR', error);
    }

    return (data ?? []) as TransactionRow[];
  }

  async findLedgerPage(page: number, limit: number): Promise<{ rows: TransactionRow[]; total: number }> {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { count, error: countError } = await supabase
      .from('transactions')
      .select('id', { count: 'exact', head: true })
      .neq('transaction_type', 'transfer_in')
      .is('deleted_at', null);

    if (countError) {
      throw new AppError('Failed to count transactions', 500, 'DATABASE_ERROR', countError);
    }

    const { data, error } = await supabase
      .from('transactions')
      .select(TRANSACTION_SELECT)
      .neq('transaction_type', 'transfer_in')
      .is('deleted_at', null)
      .order('transaction_date', { ascending: false })
      .range(from, to);

    if (error) {
      throw new AppError('Failed to fetch transactions', 500, 'DATABASE_ERROR', error);
    }

    return {
      rows: (data ?? []) as TransactionRow[],
      total: count ?? 0,
    };
  }

  async countByTypeForYear(type: TransactionType, year: number): Promise<number> {
    const start = `${year}-01-01T00:00:00.000Z`;
    const end = `${year + 1}-01-01T00:00:00.000Z`;

    const { count, error } = await supabase
      .from('transactions')
      .select('id', { count: 'exact', head: true })
      .eq('transaction_type', type)
      .gte('created_at', start)
      .lt('created_at', end);

    if (error) {
      throw new AppError('Failed to generate transaction reference', 500, 'DATABASE_ERROR', error);
    }

    return count ?? 0;
  }

  async countDepositsForYear(year: number): Promise<number> {
    return this.countByTypeForYear('deposit', year);
  }

  async countTransfersForYear(year: number): Promise<number> {
    return this.countByTypeForYear('transfer_out', year);
  }

  async countPayrollsForYear(year: number): Promise<number> {
    return this.countByTypeForYear('payroll', year);
  }

  async countVendorPaymentsForYear(year: number): Promise<number> {
    return this.countByTypeForYear('vendor_payment', year);
  }

  async countVendorClearsForYear(year: number): Promise<number> {
    return this.countByTypeForYear('vendor_clear', year);
  }

  async countClientPaymentsForYear(year: number): Promise<number> {
    return this.countByTypeForYear('client_payment', year);
  }

  async countClientClearsForYear(year: number): Promise<number> {
    return this.countByTypeForYear('client_clear', year);
  }

  async createDeposit(input: {
    destinationAccountId: string;
    openingBalance: number;
    closingBalance: number;
    amount: number;
    reference: string;
    notes: string | null;
  }): Promise<TransactionRow> {
    const { data, error } = await supabase
      .from('transactions')
      .insert({
        transaction_type: 'deposit',
        source_account_id: null,
        destination_account_id: input.destinationAccountId,
        opening_balance: input.openingBalance,
        closing_balance: input.closingBalance,
        total_amount: input.amount,
        paid_amount: input.amount,
        remaining_amount: 0,
        employee_id: null,
        vendor_id: null,
        client_id: null,
        payment_mode: null,
        reference: input.reference,
        notes: input.notes,
        transaction_date: new Date().toISOString(),
        status: 'completed',
      })
      .select(BASE_SELECT)
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new AppError('Deposit reference already exists', 409, 'CONFLICT');
      }
      throw new AppError('Failed to create deposit', 500, 'DATABASE_ERROR', error);
    }

    return emptyJoins(
      data as Omit<
        TransactionRow,
        | 'source_account'
        | 'destination_account'
        | 'employee'
        | 'vendor'
        | 'client'
        | 'vendor_items'
        | 'client_items'
      >,
    );
  }

  async createTransferPair(input: {
    sourceAccountId: string;
    destinationAccountId: string;
    sourceOpeningBalance: number;
    sourceClosingBalance: number;
    destinationOpeningBalance: number;
    destinationClosingBalance: number;
    amount: number;
    reference: string;
    notes: string | null;
  }): Promise<{ transferOut: TransactionRow; transferIn: TransactionRow }> {
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('transactions')
      .insert([
        {
          transaction_type: 'transfer_out',
          source_account_id: input.sourceAccountId,
          destination_account_id: input.destinationAccountId,
          opening_balance: input.sourceOpeningBalance,
          closing_balance: input.sourceClosingBalance,
          total_amount: input.amount,
          paid_amount: input.amount,
          remaining_amount: 0,
          employee_id: null,
          vendor_id: null,
          client_id: null,
          payment_mode: null,
          reference: input.reference,
          notes: input.notes,
          transaction_date: now,
          status: 'completed',
        },
        {
          transaction_type: 'transfer_in',
          source_account_id: input.sourceAccountId,
          destination_account_id: input.destinationAccountId,
          opening_balance: input.destinationOpeningBalance,
          closing_balance: input.destinationClosingBalance,
          total_amount: input.amount,
          paid_amount: input.amount,
          remaining_amount: 0,
          employee_id: null,
          vendor_id: null,
          client_id: null,
          payment_mode: null,
          reference: input.reference,
          notes: input.notes,
          transaction_date: now,
          status: 'completed',
        },
      ])
      .select(BASE_SELECT);

    if (error) {
      if (error.code === '23505') {
        throw new AppError('Transfer reference already exists', 409, 'CONFLICT');
      }
      throw new AppError('Failed to create transfer', 500, 'DATABASE_ERROR', error);
    }

    const rows = (data ?? []) as Array<
      Omit<
        TransactionRow,
        | 'source_account'
        | 'destination_account'
        | 'employee'
        | 'vendor'
        | 'client'
        | 'vendor_items'
        | 'client_items'
      >
    >;
    const transferOut = rows.find((row) => row.transaction_type === 'transfer_out');
    const transferIn = rows.find((row) => row.transaction_type === 'transfer_in');

    if (!transferOut || !transferIn) {
      throw new AppError('Failed to create transfer pair', 500, 'DATABASE_ERROR');
    }

    return {
      transferOut: emptyJoins(transferOut),
      transferIn: emptyJoins(transferIn),
    };
  }

  async findPayrolls(): Promise<TransactionRow[]> {
    const { data, error } = await supabase
      .from('transactions')
      .select(TRANSACTION_SELECT)
      .eq('transaction_type', 'payroll')
      .is('deleted_at', null)
      .order('transaction_date', { ascending: false });

    if (error) {
      throw new AppError('Failed to fetch payrolls', 500, 'DATABASE_ERROR', error);
    }

    return (data ?? []) as TransactionRow[];
  }

  async createPayroll(input: {
    sourceAccountId: string;
    employeeId: string;
    openingBalance: number;
    closingBalance: number;
    amount: number;
    reference: string;
    notes: string | null;
  }): Promise<TransactionRow> {
    const { data, error } = await supabase
      .from('transactions')
      .insert({
        transaction_type: 'payroll',
        source_account_id: input.sourceAccountId,
        destination_account_id: null,
        opening_balance: input.openingBalance,
        closing_balance: input.closingBalance,
        total_amount: input.amount,
        paid_amount: input.amount,
        remaining_amount: 0,
        employee_id: input.employeeId,
        vendor_id: null,
        client_id: null,
        payment_mode: null,
        reference: input.reference,
        notes: input.notes,
        transaction_date: new Date().toISOString(),
        status: 'completed',
      })
      .select(BASE_SELECT)
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new AppError('Payroll reference already exists', 409, 'CONFLICT');
      }
      throw new AppError('Failed to create payroll', 500, 'DATABASE_ERROR', error);
    }

    return emptyJoins(
      data as Omit<
        TransactionRow,
        | 'source_account'
        | 'destination_account'
        | 'employee'
        | 'vendor'
        | 'client'
        | 'vendor_items'
        | 'client_items'
      >,
    );
  }

  async listActiveEmployeesForPayroll(): Promise<TransactionEmployeeJoin[]> {
    const { data, error } = await supabase
      .from('users')
      .select('id, first_name, last_name, employee_code, salary, last_salary_transfer_date')
      .eq('is_active', true)
      .is('deleted_at', null)
      .order('first_name', { ascending: true });

    if (error) {
      throw new AppError('Failed to fetch employees', 500, 'DATABASE_ERROR', error);
    }

    return (data ?? []) as TransactionEmployeeJoin[];
  }

  async updateEmployeeLastSalaryTransferDate(employeeId: string, date: string): Promise<void> {
    const { error } = await supabase
      .from('users')
      .update({
        last_salary_transfer_date: date,
        updated_at: new Date().toISOString(),
      })
      .eq('id', employeeId)
      .is('deleted_at', null);

    if (error) {
      throw new AppError('Failed to update employee salary transfer date', 500, 'DATABASE_ERROR', error);
    }
  }

  async findByTypes(types: TransactionType[]): Promise<TransactionRow[]> {
    const { data, error } = await supabase
      .from('transactions')
      .select(TRANSACTION_SELECT)
      .in('transaction_type', types)
      .is('deleted_at', null)
      .order('transaction_date', { ascending: false });

    if (error) {
      throw new AppError('Failed to fetch transactions', 500, 'DATABASE_ERROR', error);
    }

    return (data ?? []) as TransactionRow[];
  }

  async createPartyTransaction(input: {
    transactionType: 'vendor_payment' | 'vendor_clear' | 'client_payment' | 'client_clear';
    sourceAccountId: string | null;
    destinationAccountId: string | null;
    vendorId: string | null;
    clientId: string | null;
    openingBalance: number;
    closingBalance: number;
    partyOpeningBalance: number;
    partyClosingBalance: number;
    totalAmount: number;
    paidAmount: number;
    remainingAmount: number;
    paymentMode: PaymentMode;
    status: TransactionStatus;
    reference: string;
    notes: string | null;
    vendorItems?: Array<{
      productName: string;
      unitPrice: number;
      quantity: number | null;
      lineTotal: number;
      sortOrder: number;
    }>;
    clientItems?: Array<{
      serviceName: string;
      amount: number;
      description: string | null;
      sortOrder: number;
    }>;
  }): Promise<TransactionRow> {
    const { data, error } = await supabase
      .from('transactions')
      .insert({
        transaction_type: input.transactionType,
        source_account_id: input.sourceAccountId,
        destination_account_id: input.destinationAccountId,
        opening_balance: input.openingBalance,
        closing_balance: input.closingBalance,
        party_opening_balance: input.partyOpeningBalance,
        party_closing_balance: input.partyClosingBalance,
        total_amount: input.totalAmount,
        paid_amount: input.paidAmount,
        remaining_amount: input.remainingAmount,
        payment_mode: input.paymentMode,
        employee_id: null,
        vendor_id: input.vendorId,
        client_id: input.clientId,
        reference: input.reference,
        notes: input.notes,
        transaction_date: new Date().toISOString(),
        status: input.status,
      })
      .select(BASE_SELECT)
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new AppError('Transaction reference already exists', 409, 'CONFLICT');
      }
      throw new AppError('Failed to create transaction', 500, 'DATABASE_ERROR', error);
    }

    const txn = emptyJoins(
      data as Omit<
        TransactionRow,
        | 'source_account'
        | 'destination_account'
        | 'employee'
        | 'vendor'
        | 'client'
        | 'vendor_items'
        | 'client_items'
      >,
    );

    if (input.vendorItems?.length) {
      const { data: items, error: itemsError } = await supabase
        .from('transaction_vendor_items')
        .insert(
          input.vendorItems.map((item) => ({
            transaction_id: txn.id,
            product_name: item.productName,
            unit_price: item.unitPrice,
            quantity: item.quantity,
            line_total: item.lineTotal,
            sort_order: item.sortOrder,
          })),
        )
        .select('id, transaction_id, product_name, unit_price, quantity, line_total, sort_order');

      if (itemsError) {
        await this.softDelete(txn.id);
        throw new AppError('Failed to save vendor line items', 500, 'DATABASE_ERROR', itemsError);
      }

      txn.vendor_items = (items ?? []) as VendorItemRow[];
    }

    if (input.clientItems?.length) {
      const { data: items, error: itemsError } = await supabase
        .from('transaction_client_items')
        .insert(
          input.clientItems.map((item) => ({
            transaction_id: txn.id,
            service_name: item.serviceName,
            amount: item.amount,
            description: item.description,
            sort_order: item.sortOrder,
          })),
        )
        .select('id, transaction_id, service_name, amount, description, sort_order');

      if (itemsError) {
        await this.softDelete(txn.id);
        throw new AppError('Failed to save client line items', 500, 'DATABASE_ERROR', itemsError);
      }

      txn.client_items = (items ?? []) as ClientItemRow[];
    }

    return txn;
  }

  async updateAccountBalance(accountId: string, balance: number): Promise<void> {
    const { error } = await supabase
      .from('accounts')
      .update({
        balance,
        updated_at: new Date().toISOString(),
      })
      .eq('id', accountId)
      .is('deleted_at', null);

    if (error) {
      throw new AppError('Failed to update account balance', 500, 'DATABASE_ERROR', error);
    }
  }

  async softDelete(id: string): Promise<void> {
    const { error } = await supabase
      .from('transactions')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      throw new AppError('Failed to roll back transaction', 500, 'DATABASE_ERROR', error);
    }
  }

  async softDeleteMany(ids: string[]): Promise<void> {
    if (!ids.length) return;
    const { error } = await supabase
      .from('transactions')
      .update({ deleted_at: new Date().toISOString() })
      .in('id', ids);

    if (error) {
      throw new AppError('Failed to roll back transactions', 500, 'DATABASE_ERROR', error);
    }
  }
}

export const transactionsRepository = new TransactionsRepository();
