import { rolesRepository } from '../repository/roles.repository.js';
import type { RoleItem } from '../types/roles.types.js';
import type { RolesListResponseDto } from '../dto/roles.dto.js';

export class RolesService {
  async list(): Promise<RolesListResponseDto> {
    const roles = await rolesRepository.findAll();

    return {
      roles: roles.map(
        (role): RoleItem => ({
          id: role.id,
          name: role.name,
          description: role.description,
          createdAt: role.created_at,
        }),
      ),
    };
  }
}

export const rolesService = new RolesService();
