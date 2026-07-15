import type { VendorRow } from '../repository/vendors.repository.js';
import type { Vendor } from '../types/vendors.types.js';

export function mapVendor(row: VendorRow): Vendor {
  return {
    id: row.id,
    name: row.name,
    vendorType: Array.isArray(row.vendor_type) ? row.vendor_type.map(String) : [],
    balance: Number(row.balance),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
