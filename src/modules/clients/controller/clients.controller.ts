import type { Request, Response } from 'express';
import { asyncHandler } from '../../../shared/async-handler.js';
import { successResponse } from '../../../shared/responses/index.js';
import { clientsService } from '../service/clients.service.js';
import type {
  ClientIdParam,
  CreateClientBody,
  ListClientsQueryBody,
  UpdateClientBody,
} from '../validator/clients.validator.js';

export class ClientsController {
  list = asyncHandler(async (req: Request, res: Response) => {
    const query = req.query as unknown as ListClientsQueryBody;
    const result = await clientsService.list(query);
    res.status(200).json(successResponse(result, 'Clients retrieved'));
  });

  stats = asyncHandler(async (_req: Request, res: Response) => {
    const result = await clientsService.stats();
    res.status(200).json(successResponse(result, 'Client stats retrieved'));
  });

  getById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as unknown as ClientIdParam;
    const client = await clientsService.getById(id);
    res.status(200).json(successResponse(client, 'Client retrieved'));
  });

  create = asyncHandler(async (req: Request, res: Response) => {
    const body = req.body as CreateClientBody;
    const client = await clientsService.create(body);
    res.status(201).json(successResponse(client, 'Client created'));
  });

  update = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as unknown as ClientIdParam;
    const body = req.body as UpdateClientBody;
    const client = await clientsService.update(id, body);
    res.status(200).json(successResponse(client, 'Client updated'));
  });

  remove = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as unknown as ClientIdParam;
    await clientsService.remove(id);
    res.status(200).json(successResponse(null, 'Client deleted'));
  });
}

export const clientsController = new ClientsController();
