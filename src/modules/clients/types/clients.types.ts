export const CLIENT_SERVICE_OPTIONS = [
  'finishing',
  'woodwork',
  'electrical',
  'plumbing',
  'painting',
  'tiling',
] as const;

export type ClientServiceOption = (typeof CLIENT_SERVICE_OPTIONS)[number];

export interface Client {
  id: string;
  name: string;
  services: string[];
  balance: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateClientInput {
  name: string;
  services: string[];
}

export interface UpdateClientInput {
  name?: string;
  services?: string[];
}

export interface ListClientsQuery {
  page: number;
  limit: number;
  search?: string;
}

export interface PaginatedClients {
  clients: Client[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
