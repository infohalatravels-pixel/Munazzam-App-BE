export type AccountType = 'bank' | 'cash';

export interface Account {
  id: string;
  acName: string;
  acType: AccountType;
  balance: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAccountInput {
  acName: string;
  acType: AccountType;
}

export interface UpdateAccountInput {
  acName: string;
  acType: AccountType;
}
