import type {
  ClientItemRow,
  TransactionRow,
  TransactionAccountJoin,
  TransactionClientJoin,
  TransactionEmployeeJoin,
  TransactionVendorJoin,
  VendorItemRow,
} from '../repository/transactions.repository.js';
import type {
  ClientItem,
  ClientPayment,
  LedgerTransaction,
  PaymentMode,
  Payroll,
  Transaction,
  TransactionAccountSummary,
  TransactionClientSummary,
  TransactionEmployeeSummary,
  TransactionVendorSummary,
  Transfer,
  VendorItem,
  VendorPayment,
} from '../types/transactions.types.js';

function mapAccount(
  join: TransactionAccountJoin | TransactionAccountJoin[] | null,
): TransactionAccountSummary | null {
  if (!join) return null;
  const row = Array.isArray(join) ? join[0] : join;
  if (!row) return null;
  return {
    id: row.id,
    acName: row.ac_name,
    acType: row.ac_type,
  };
}

export function mapEmployee(
  join: TransactionEmployeeJoin | TransactionEmployeeJoin[] | null,
): TransactionEmployeeSummary | null {
  if (!join) return null;
  const row = Array.isArray(join) ? join[0] : join;
  if (!row) return null;
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    employeeCode: row.employee_code,
    salary: row.salary != null ? Number(row.salary) : null,
    lastSalaryTransferDate: row.last_salary_transfer_date,
  };
}

export function mapVendor(
  join: TransactionVendorJoin | TransactionVendorJoin[] | null,
): TransactionVendorSummary | null {
  if (!join) return null;
  const row = Array.isArray(join) ? join[0] : join;
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    balance: Number(row.balance),
  };
}

export function mapClient(
  join: TransactionClientJoin | TransactionClientJoin[] | null,
): TransactionClientSummary | null {
  if (!join) return null;
  const row = Array.isArray(join) ? join[0] : join;
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    balance: Number(row.balance),
  };
}

export function mapVendorItems(rows: VendorItemRow[] | null | undefined): VendorItem[] {
  return (rows ?? [])
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((row) => ({
      id: row.id,
      productName: row.product_name,
      unitPrice: Number(row.unit_price),
      quantity: row.quantity != null ? Number(row.quantity) : null,
      lineTotal: Number(row.line_total),
      sortOrder: row.sort_order,
    }));
}

export function mapClientItems(rows: ClientItemRow[] | null | undefined): ClientItem[] {
  return (rows ?? [])
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((row) => ({
      id: row.id,
      serviceName: row.service_name,
      amount: Number(row.amount),
      description: row.description,
      sortOrder: row.sort_order,
    }));
}

export function mapTransaction(row: TransactionRow): Transaction {
  return {
    id: row.id,
    transactionType: row.transaction_type,
    sourceAccountId: row.source_account_id,
    destinationAccountId: row.destination_account_id,
    sourceAccount: mapAccount(row.source_account),
    destinationAccount: mapAccount(row.destination_account),
    employee: mapEmployee(row.employee),
    vendor: mapVendor(row.vendor),
    client: mapClient(row.client),
    vendorItems: mapVendorItems(row.vendor_items),
    clientItems: mapClientItems(row.client_items),
    openingBalance: Number(row.opening_balance),
    closingBalance: Number(row.closing_balance),
    totalAmount: Number(row.total_amount),
    paidAmount: Number(row.paid_amount),
    remainingAmount: Number(row.remaining_amount),
    paymentMode: row.payment_mode,
    employeeId: row.employee_id,
    vendorId: row.vendor_id,
    clientId: row.client_id,
    reference: row.reference,
    notes: row.notes,
    transactionDate: row.transaction_date,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const DISPLAY_TYPE: Record<string, string> = {
  deposit: 'Deposit',
  transfer_out: 'Internal Transfer',
  transfer: 'Internal Transfer',
  payroll: 'Payroll',
  utility: 'Utility',
  payable: 'Payable',
  receivable: 'Receivable',
  vendor_payment: 'Vendor Payment',
  vendor_clear: 'Vendor Clear Bill',
  client_payment: 'Client Payment',
  client_clear: 'Client Clear Bill',
};

export function mapLedgerTransaction(row: TransactionRow): LedgerTransaction {
  const isTransfer = row.transaction_type === 'transfer_out';
  return {
    id: row.id,
    reference: row.reference,
    transactionType: isTransfer
      ? 'transfer'
      : (row.transaction_type as LedgerTransaction['transactionType']),
    displayType: DISPLAY_TYPE[row.transaction_type] ?? row.transaction_type,
    sourceAccount: mapAccount(row.source_account),
    destinationAccount: mapAccount(row.destination_account),
    employee: mapEmployee(row.employee),
    vendor: mapVendor(row.vendor),
    client: mapClient(row.client),
    totalAmount: Number(row.total_amount),
    paidAmount: Number(row.paid_amount),
    remainingAmount: Number(row.remaining_amount),
    closingBalance: Number(row.closing_balance),
    notes: row.notes,
    status: row.status,
    transactionDate: row.transaction_date,
  };
}

export function mapTransferPair(
  transferOut: TransactionRow,
  transferIn: TransactionRow,
  sourceAccount: TransactionAccountSummary,
  destinationAccount: TransactionAccountSummary,
): Transfer {
  return {
    id: transferOut.id,
    reference: transferOut.reference ?? '',
    sourceAccount,
    destinationAccount,
    amount: Number(transferOut.total_amount),
    sourceOpeningBalance: Number(transferOut.opening_balance),
    sourceClosingBalance: Number(transferOut.closing_balance),
    destinationOpeningBalance: Number(transferIn.opening_balance),
    destinationClosingBalance: Number(transferIn.closing_balance),
    notes: transferOut.notes,
    status: transferOut.status,
    transactionDate: transferOut.transaction_date,
    transferOutId: transferOut.id,
    transferInId: transferIn.id,
  };
}

export function mapPayroll(
  row: TransactionRow,
  sourceAccount: TransactionAccountSummary,
  employee: TransactionEmployeeSummary,
): Payroll {
  return {
    id: row.id,
    reference: row.reference ?? '',
    sourceAccount,
    employee,
    amount: Number(row.total_amount),
    openingBalance: Number(row.opening_balance),
    closingBalance: Number(row.closing_balance),
    notes: row.notes,
    status: row.status,
    transactionDate: row.transaction_date,
  };
}

export function mapVendorPayment(
  row: TransactionRow,
  partyBalanceBefore: number,
  partyBalanceAfter: number,
): VendorPayment {
  const vendor = mapVendor(row.vendor);
  if (!vendor) {
    throw new Error('Vendor missing on vendor payment row');
  }

  return {
    id: row.id,
    reference: row.reference ?? '',
    transactionType: row.transaction_type as VendorPayment['transactionType'],
    paymentMode: (row.payment_mode ?? 'full') as PaymentMode,
    sourceAccount: mapAccount(row.source_account),
    vendor: {
      ...vendor,
      balance: partyBalanceAfter,
    },
    items: mapVendorItems(row.vendor_items),
    totalAmount: Number(row.total_amount),
    paidAmount: Number(row.paid_amount),
    remainingAmount: Number(row.remaining_amount),
    openingBalance: Number(row.opening_balance),
    closingBalance: Number(row.closing_balance),
    partyBalanceBefore,
    partyBalanceAfter,
    notes: row.notes,
    status: row.status,
    transactionDate: row.transaction_date,
  };
}

export function mapClientPayment(
  row: TransactionRow,
  partyBalanceBefore: number,
  partyBalanceAfter: number,
): ClientPayment {
  const client = mapClient(row.client);
  if (!client) {
    throw new Error('Client missing on client payment row');
  }

  return {
    id: row.id,
    reference: row.reference ?? '',
    transactionType: row.transaction_type as ClientPayment['transactionType'],
    paymentMode: (row.payment_mode ?? 'full') as PaymentMode,
    destinationAccount: mapAccount(row.destination_account),
    client: {
      ...client,
      balance: partyBalanceAfter,
    },
    items: mapClientItems(row.client_items),
    totalAmount: Number(row.total_amount),
    paidAmount: Number(row.paid_amount),
    remainingAmount: Number(row.remaining_amount),
    openingBalance: Number(row.opening_balance),
    closingBalance: Number(row.closing_balance),
    partyBalanceBefore,
    partyBalanceAfter,
    notes: row.notes,
    status: row.status,
    transactionDate: row.transaction_date,
  };
}
