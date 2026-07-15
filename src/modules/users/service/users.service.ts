import { ForbiddenError, NotFoundError } from '../../../shared/errors/index.js';
import { hashPassword } from '../../../shared/crypto/password.service.js';
import { activityLogRepository } from '../../../shared/repositories/activity-log.repository.js';
import { broadcastTableChange } from '../../../shared/realtime/broadcast.js';
import { USER_ROLES, type UserRole } from '../../../shared/constants/index.js';
import type { AuthenticatedUser } from '../../../types/auth.types.js';
import { usersRepository } from '../repository/users.repository.js';
import { mapUserToProfile } from '../dto/user.mapper.js';
import type {
  CreateUserInput,
  PaginatedUsers,
  UpdateUserInput,
  UserListQuery,
  UserManagementStats,
  UserProfile,
} from '../types/users.types.js';

export class UsersService {
  async list(query: UserListQuery, actor: AuthenticatedUser): Promise<PaginatedUsers> {
    this.assertCanList(actor);

    const { users, total } = await usersRepository.findMany(query);

    return {
      users: users.map(mapUserToProfile),
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.ceil(total / query.limit) || 1,
    };
  }

  async getStats(actor: AuthenticatedUser): Promise<UserManagementStats> {
    this.assertCanList(actor);

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [totalUsers, activeUsers, inactiveUsers, recentHires, priorHires, recentModifications, securityAlerts] =
      await Promise.all([
        usersRepository.countAllUsers(),
        usersRepository.countUsersByActive(true),
        usersRepository.countUsersByActive(false),
        usersRepository.countUsersCreatedBetween(thirtyDaysAgo.toISOString(), now.toISOString()),
        usersRepository.countUsersCreatedBetween(sixtyDaysAgo.toISOString(), thirtyDaysAgo.toISOString()),
        usersRepository.countRecentUserModifications(weekAgo.toISOString()),
        usersRepository.countSecurityAlerts(weekAgo.toISOString()),
      ]);

    const growthPercent =
      priorHires > 0
        ? Math.round(((recentHires - priorHires) / priorHires) * 1000) / 10
        : recentHires > 0
          ? 100
          : null;

    return {
      totalUsers,
      activeUsers,
      inactiveUsers,
      securityAlerts,
      growthPercent,
      recentModifications,
    };
  }

  async getById(id: string, actor: AuthenticatedUser): Promise<UserProfile> {
    const user = await usersRepository.findById(id);

    if (!user) {
      throw new NotFoundError('User not found');
    }

    this.assertCanView(user.roles?.name as UserRole, actor, id);

    return mapUserToProfile(user);
  }

  async create(
    input: CreateUserInput,
    actor: AuthenticatedUser,
    ip?: string,
  ): Promise<UserProfile> {
    await this.assertCanCreate(input.roleId, actor);

    const existing = await usersRepository.findByEmail(input.email);
    if (existing) {
      throw new ForbiddenError('Email already in use');
    }

    const passwordHash = await hashPassword(input.password);
    const employeeCode =
      input.employeeCode?.trim() || (await usersRepository.generateNextEmployeeCode());
    const user = await usersRepository.create({
      ...input,
      employeeCode,
      passwordHash,
    });

    await activityLogRepository.create({
      userId: actor.id,
      action: 'user.create',
      entityType: 'user',
      entityId: user.id,
      metadata: { email: user.email },
      ip,
    });

    void broadcastTableChange('users');

    return mapUserToProfile(user);
  }

  async update(
    id: string,
    input: UpdateUserInput,
    actor: AuthenticatedUser,
    ip?: string,
  ): Promise<UserProfile> {
    const existing = await usersRepository.findById(id);

    if (!existing) {
      throw new NotFoundError('User not found');
    }

    const targetRole = existing.roles?.name as UserRole;
    this.assertCanUpdate(targetRole, actor, id, input.roleId);

    if (input.roleId) {
      await this.assertCanAssignRole(input.roleId, actor);
    }

    const passwordHash = input.password ? await hashPassword(input.password) : undefined;
    const user = await usersRepository.update(id, { ...input, passwordHash });

    await activityLogRepository.create({
      userId: actor.id,
      action: 'user.update',
      entityType: 'user',
      entityId: id,
      ip,
    });

    return mapUserToProfile(user);
  }

  async getFormLookups(actor: AuthenticatedUser) {
    this.assertCanList(actor);
    return usersRepository.findFormLookups();
  }

  async remove(id: string, actor: AuthenticatedUser, ip?: string): Promise<void> {
    if (actor.role !== USER_ROLES.ADMIN) {
      throw new ForbiddenError('Only administrators can delete users');
    }

    if (actor.id === id) {
      throw new ForbiddenError('Cannot delete your own account');
    }

    const existing = await usersRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('User not found');
    }

    await usersRepository.softDelete(id);

    await activityLogRepository.create({
      userId: actor.id,
      action: 'user.delete',
      entityType: 'user',
      entityId: id,
      ip,
    });

    void broadcastTableChange('users');
  }

  private assertCanList(actor: AuthenticatedUser): void {
    if (actor.role === USER_ROLES.EMPLOYEE) {
      throw new ForbiddenError('Employees cannot list all users');
    }
  }

  private assertCanView(targetRole: UserRole, actor: AuthenticatedUser, targetId: string): void {
    if (actor.id === targetId) return;

    if (actor.role === USER_ROLES.EMPLOYEE) {
      throw new ForbiddenError('Insufficient permissions');
    }

    if (actor.role === USER_ROLES.HR && targetRole !== USER_ROLES.EMPLOYEE) {
      throw new ForbiddenError('HR can only view employee accounts');
    }
  }

  private async assertCanCreate(roleId: string, actor: AuthenticatedUser): Promise<void> {
    const role = await this.getRoleById(roleId);

    if (actor.role === USER_ROLES.ADMIN) return;

    if (actor.role === USER_ROLES.HR && role === USER_ROLES.EMPLOYEE) return;

    throw new ForbiddenError('Insufficient permissions to create this user');
  }

  private assertCanUpdate(
    targetRole: UserRole,
    actor: AuthenticatedUser,
    targetId: string,
    newRoleId?: string,
  ): void {
    if (actor.role === USER_ROLES.ADMIN) return;

    if (actor.id === targetId && actor.role === USER_ROLES.EMPLOYEE) {
      if (newRoleId || targetRole !== USER_ROLES.EMPLOYEE) {
        throw new ForbiddenError('Employees cannot change role or elevated fields');
      }
      return;
    }

    if (actor.role === USER_ROLES.HR) {
      if (targetRole !== USER_ROLES.EMPLOYEE) {
        throw new ForbiddenError('HR can only update employee accounts');
      }
      return;
    }

    throw new ForbiddenError('Insufficient permissions');
  }

  private async assertCanAssignRole(roleId: string, actor: AuthenticatedUser): Promise<void> {
    const role = await this.getRoleById(roleId);

    if (actor.role === USER_ROLES.ADMIN) return;

    if (actor.role === USER_ROLES.HR && role === USER_ROLES.EMPLOYEE) return;

    throw new ForbiddenError('Insufficient permissions to assign this role');
  }

  private async getRoleById(roleId: string): Promise<UserRole> {
    const { supabase } = await import('../../../database/supabase.js');
    const { data, error } = await supabase
      .from('roles')
      .select('name')
      .eq('id', roleId)
      .is('deleted_at', null)
      .maybeSingle();

    if (error || !data) {
      throw new NotFoundError('Role not found');
    }

    return data.name as UserRole;
  }
}

export const usersService = new UsersService();
