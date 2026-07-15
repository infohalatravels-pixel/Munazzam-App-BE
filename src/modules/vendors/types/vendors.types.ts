export const VENDOR_TYPE_OPTIONS = [
  'material',
  'machines',
  'equipment',
  'concrete',
  'sand',
  'brick',
] as const;

export type VendorTypeOption = (typeof VENDOR_TYPE_OPTIONS)[number];

export interface Vendor {
  id: string;
  name: string;
  vendorType: string[];
  balance: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateVendorInput {
  name: string;
  vendorType: string[];
}

export interface UpdateVendorInput {
  name?: string;
  vendorType?: string[];
}

export interface ListVendorsQuery {
  page: number;
  limit: number;
  search?: string;
}

export interface PaginatedVendors {
  vendors: Vendor[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
