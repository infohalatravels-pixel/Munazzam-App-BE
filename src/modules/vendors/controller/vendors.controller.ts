import type { Request, Response } from 'express';
import { asyncHandler } from '../../../shared/async-handler.js';
import { successResponse } from '../../../shared/responses/index.js';
import { vendorsService } from '../service/vendors.service.js';
import type {
  CreateVendorBody,
  ListVendorsQueryBody,
  UpdateVendorBody,
  VendorIdParam,
} from '../validator/vendors.validator.js';

export class VendorsController {
  list = asyncHandler(async (req: Request, res: Response) => {
    const query = req.query as unknown as ListVendorsQueryBody;
    const result = await vendorsService.list(query);
    res.status(200).json(successResponse(result, 'Vendors retrieved'));
  });

  stats = asyncHandler(async (_req: Request, res: Response) => {
    const result = await vendorsService.stats();
    res.status(200).json(successResponse(result, 'Vendor stats retrieved'));
  });

  getById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as unknown as VendorIdParam;
    const vendor = await vendorsService.getById(id);
    res.status(200).json(successResponse(vendor, 'Vendor retrieved'));
  });

  create = asyncHandler(async (req: Request, res: Response) => {
    const body = req.body as CreateVendorBody;
    const vendor = await vendorsService.create(body);
    res.status(201).json(successResponse(vendor, 'Vendor created'));
  });

  update = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as unknown as VendorIdParam;
    const body = req.body as UpdateVendorBody;
    const vendor = await vendorsService.update(id, body);
    res.status(200).json(successResponse(vendor, 'Vendor updated'));
  });

  remove = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as unknown as VendorIdParam;
    await vendorsService.remove(id);
    res.status(200).json(successResponse(null, 'Vendor deleted'));
  });
}

export const vendorsController = new VendorsController();
