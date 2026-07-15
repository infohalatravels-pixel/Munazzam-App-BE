export type TransactionType =
  | 'deposit'
  | 'transfer_in'
  | 'transfer_out'
  | 'payroll'
  | 'utility'
  | 'payable'
  | 'receivable'
  | 'vendor_payment'
  | 'vendor_clear'
  | 'client_payment'
  | 'client_clear';

export type TransactionStatus = 'pending' | 'partial' | 'completed' | 'cancelled';

export type PaymentMode = 'unpaid' | 'partial' | 'full' | 'advance' | 'clear';

export interface TransactionAccountSummary {
  id: string;
  acName: string;
  acType: 'bank' | 'cash';
}

export interface TransactionEmployeeSummary {
  id: string;
  firstName: string;
  lastName: string;
  employeeCode: string | null;
  salary: number | null;
  lastSalaryTransferDate: string | null;
}

export interface TransactionVendorSummary {
  id: string;
  name: string;
  balance: number;
}

export interface TransactionClientSummary {
  id: string;
  name: string;
  balance: number;
}

export interface VendorItemInput {
  productName: string;
  unitPrice: number;
  quantity?: number | null;
}

export interface ClientItemInput {
  serviceName: string;
  amount: number;
  description?: string | null;
}

export interface VendorItem {
  id: string;
  productName: string;
  unitPrice: number;
  quantity: number | null;
  lineTotal: number;
  sortOrder: number;
}

export interface ClientItem {
  id: string;
  serviceName: string;
  amount: number;
  description: string | null;
  sortOrder: number;
}

export interface Transaction {
  id: string;
  transactionType: TransactionType;
  sourceAccountId: string | null;
  destinationAccountId: string | null;
  sourceAccount: TransactionAccountSummary | null;
  destinationAccount: TransactionAccountSummary | null;
  employee: TransactionEmployeeSummary | null;
  vendor: TransactionVendorSummary | null;
  client: TransactionClientSummary | null;
  vendorItems: VendorItem[];
  clientItems: ClientItem[];
  openingBalance: number;
  closingBalance: number;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  paymentMode: PaymentMode | null;
  employeeId: string | null;
  vendorId: string | null;
  clientId: string | null;
  reference: string | null;
  notes: string | null;
  transactionDate: string;
  status: TransactionStatus;
  createdAt: string;
  updatedAt: string;
}

/** Unified transfer row for UI (pairs transfer_out + transfer_in). */
export interface Transfer {
  id: string;
  reference: string;
  sourceAccount: TransactionAccountSummary;
  destinationAccount: TransactionAccountSummary;
  amount: number;
  sourceOpeningBalance: number;
  sourceClosingBalance: number;
  destinationOpeningBalance: number;
  destinationClosingBalance: number;
  notes: string | null;
  status: TransactionStatus;
  transactionDate: string;
  transferOutId: string;
  transferInId: string;
}

export interface Payroll {
  id: string;
  reference: string;
  sourceAccount: TransactionAccountSummary;
  employee: TransactionEmployeeSummary;
  amount: number;
  openingBalance: number;
  closingBalance: number;
  notes: string | null;
  status: TransactionStatus;
  transactionDate: string;
}

export interface PayrollEmployeeOption {
  id: string;
  firstName: string;
  lastName: string;
  employeeCode: string | null;
  salary: number | null;
  lastSalaryTransferDate: string | null;
  eligible: boolean;
  nextEligibleDate: string | null;
}

export interface VendorPayment {
  id: string;
  reference: string;
  transactionType: 'vendor_payment' | 'vendor_clear';
  paymentMode: PaymentMode;
  sourceAccount: TransactionAccountSummary | null;
  vendor: TransactionVendorSummary;
  items: VendorItem[];
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  openingBalance: number;
  closingBalance: number;
  partyBalanceBefore: number;
  partyBalanceAfter: number;
  notes: string | null;
  status: TransactionStatus;
  transactionDate: string;
}

export interface ClientPayment {
  id: string;
  reference: string;
  transactionType: 'client_payment' | 'client_clear';
  paymentMode: PaymentMode;
  destinationAccount: TransactionAccountSummary | null;
  client: TransactionClientSummary;
  items: ClientItem[];
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  openingBalance: number;
  closingBalance: number;
  partyBalanceBefore: number;
  partyBalanceAfter: number;
  notes: string | null;
  status: TransactionStatus;
  transactionDate: string;
}

/** Ledger row for Accounts recent list (transfer_in excluded). */
export interface LedgerTransaction {
  id: string;
  reference: string | null;
  transactionType: Exclude<TransactionType, 'transfer_in'> | 'transfer';
  displayType: string;
  sourceAccount: TransactionAccountSummary | null;
  destinationAccount: TransactionAccountSummary | null;
  employee: TransactionEmployeeSummary | null;
  vendor: TransactionVendorSummary | null;
  client: TransactionClientSummary | null;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  closingBalance: number;
  notes: string | null;
  status: TransactionStatus;
  transactionDate: string;
}

export interface PaginatedLedger {
  items: LedgerTransaction[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateDepositInput {
  destinationAccountId: string;
  amount: number;
  notes?: string | null;
}

export interface CreateTransferInput {
  sourceAccountId: string;
  destinationAccountId: string;
  amount: number;
  notes?: string | null;
}

export interface CreatePayrollInput {
  sourceAccountId: string;
  employeeId: string;
  amount?: number | null;
  notes?: string | null;
}

export interface CreateVendorPaymentInput {
  vendorId: string;
  sourceAccountId?: string | null;
  paymentMode: Exclude<PaymentMode, 'clear'>;
  paidAmount: number;
  notes?: string | null;
  items: VendorItemInput[];
}

export interface CreateVendorClearInput {
  vendorId: string;
  sourceAccountId: string;
  paidAmount: number;
  notes?: string | null;
}

export interface CreateClientPaymentInput {
  clientId: string;
  destinationAccountId?: string | null;
  paymentMode: Exclude<PaymentMode, 'clear'>;
  paidAmount: number;
  notes?: string | null;
  items: ClientItemInput[];
}

export interface CreateClientClearInput {
  clientId: string;
  destinationAccountId: string;
  paidAmount: number;
  notes?: string | null;
}

export interface ListLedgerQuery {
  page: number;
  limit: number;
}
