import { AppError } from '../../../shared/errors/index.js';
import { mapClient } from '../dto/clients.mapper.js';
import { clientsRepository } from '../repository/clients.repository.js';
import type {
  Client,
  CreateClientInput,
  ListClientsQuery,
  PaginatedClients,
  UpdateClientInput,
} from '../types/clients.types.js';

export class ClientsService {
  async list(query: ListClientsQuery): Promise<PaginatedClients> {
    const { rows, total } = await clientsRepository.findPage(query);
    return {
      clients: rows.map(mapClient),
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.ceil(total / query.limit) || 1,
    };
  }

  async getById(id: string): Promise<Client> {
    const row = await clientsRepository.findById(id);
    if (!row) throw new AppError('Client not found', 404, 'NOT_FOUND');
    return mapClient(row);
  }

  async create(input: CreateClientInput): Promise<Client> {
    const row = await clientsRepository.create({
      name: input.name.trim(),
      services: input.services.map((item) => item.trim().toLowerCase()),
    });
    return mapClient(row);
  }

  async update(id: string, input: UpdateClientInput): Promise<Client> {
    const existing = await clientsRepository.findById(id);
    if (!existing) throw new AppError('Client not found', 404, 'NOT_FOUND');

    const row = await clientsRepository.update(id, {
      name: input.name?.trim(),
      services: input.services?.map((item) => item.trim().toLowerCase()),
    });
    return mapClient(row);
  }

  async remove(id: string): Promise<void> {
    const existing = await clientsRepository.findById(id);
    if (!existing) throw new AppError('Client not found', 404, 'NOT_FOUND');
    await clientsRepository.softDelete(id);
  }

  async stats(): Promise<{ totalClients: number }> {
    const totalClients = await clientsRepository.countAll();
    return { totalClients };
  }
}

export const clientsService = new ClientsService();
