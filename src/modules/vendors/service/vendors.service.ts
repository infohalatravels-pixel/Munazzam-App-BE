import { AppError } from '../../../shared/errors/index.js';
import { mapVendor } from '../dto/vendors.mapper.js';
import { vendorsRepository } from '../repository/vendors.repository.js';
import type {
  CreateVendorInput,
  ListVendorsQuery,
  PaginatedVendors,
  UpdateVendorInput,
  Vendor,
} from '../types/vendors.types.js';

export class VendorsService {
  async list(query: ListVendorsQuery): Promise<PaginatedVendors> {
    const { rows, total } = await vendorsRepository.findPage(query);
    return {
      vendors: rows.map(mapVendor),
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.ceil(total / query.limit) || 1,
    };
  }

  async getById(id: string): Promise<Vendor> {
    const row = await vendorsRepository.findById(id);
    if (!row) throw new AppError('Vendor not found', 404, 'NOT_FOUND');
    return mapVendor(row);
  }

  async create(input: CreateVendorInput): Promise<Vendor> {
    const row = await vendorsRepository.create({
      name: input.name.trim(),
      vendorType: input.vendorType.map((item) => item.trim().toLowerCase()),
    });
    return mapVendor(row);
  }

  async update(id: string, input: UpdateVendorInput): Promise<Vendor> {
    const existing = await vendorsRepository.findById(id);
    if (!existing) throw new AppError('Vendor not found', 404, 'NOT_FOUND');

    const row = await vendorsRepository.update(id, {
      name: input.name?.trim(),
      vendorType: input.vendorType?.map((item) => item.trim().toLowerCase()),
    });
    return mapVendor(row);
  }

  async remove(id: string): Promise<void> {
    const existing = await vendorsRepository.findById(id);
    if (!existing) throw new AppError('Vendor not found', 404, 'NOT_FOUND');
    await vendorsRepository.softDelete(id);
  }

  async stats(): Promise<{ totalVendors: number }> {
    const totalVendors = await vendorsRepository.countAll();
    return { totalVendors };
  }
}

export const vendorsService = new VendorsService();
