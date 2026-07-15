import { supabase } from '../../../database/supabase.js';
import type { DbUserWithRelations } from '../../../database/types.js';
import { AppError, ConflictError, NotFoundError } from '../../../shared/errors/index.js';
import type { CreateUserInput, UpdateUserInput, UserListQuery } from '../types/users.types.js';

const USER_SELECT = `
  *,
  roles:role_id ( id, name, description ),
  departments:department_id ( id, name ),
  employee_types:employee_type_id ( id, name )
`;

export class UsersRepository {
  async findMany(query: UserListQuery): Promise<{ users: DbUserWithRelations[]; total: number }> {
    const offset = (query.page - 1) * query.limit;

    let builder = supabase
      .from('users')
      .select(USER_SELECT, { count: 'exact' })
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .range(offset, offset + query.limit - 1);

    if (query.search) {
      const term = `%${query.search}%`;
      builder = builder.or(
        `email.ilike.${term},first_name.ilike.${term},last_name.ilike.${term},employee_code.ilike.${term}`,
      );
    }

    if (query.departmentId) {
      builder = builder.eq('department_id', query.departmentId);
    }

    if (query.role) {
      const { data: roleData } = await supabase
        .from('roles')
        .select('id')
        .eq('name', query.role)
        .is('deleted_at', null)
        .maybeSingle();

      if (roleData) {
        builder = builder.eq('role_id', roleData.id);
      }
    }

    if (query.isActive !== undefined) {
      builder = builder.eq('is_active', query.isActive);
    }

    const { data, error, count } = await builder;

    if (error) {
      throw new AppError('Failed to fetch users', 500, 'DATABASE_ERROR', error);
    }

    let users = (data ?? []) as DbUserWithRelations[];

    return { users, total: count ?? users.length };
  }

  async findById(id: string): Promise<DbUserWithRelations | null> {
    const { data, error } = await supabase
      .from('users')
      .select(USER_SELECT)
      .eq('id', id)
      .is('deleted_at', null)
      .maybeSingle();

    if (error) {
      throw new AppError('Failed to fetch user', 500, 'DATABASE_ERROR', error);
    }

    return data as DbUserWithRelations | null;
  }

  async findByEmail(email: string): Promise<DbUserWithRelations | null> {
    const { data, error } = await supabase
      .from('users')
      .select(USER_SELECT)
      .eq('email', email.toLowerCase())
      .is('deleted_at', null)
      .maybeSingle();

    if (error) {
      throw new AppError('Failed to fetch user', 500, 'DATABASE_ERROR', error);
    }

    return data as DbUserWithRelations | null;
  }

  async create(input: CreateUserInput & { passwordHash: string }): Promise<DbUserWithRelations> {
    const { data, error } = await supabase
      .from('users')
      .insert({
        email: input.email.toLowerCase(),
        password_hash: input.passwordHash,
        role_id: input.roleId,
        department_id: input.departmentId ?? null,
        employee_type_id: input.employeeTypeId,
        first_name: input.firstName,
        last_name: input.lastName,
        phone: input.phone ?? null,
        avatar_url: input.avatarUrl ?? null,
        job_title: input.jobTitle ?? null,
        employee_code: input.employeeCode ?? null,
        salary: input.salary ?? null,
        last_salary_transfer_date: input.lastSalaryTransferDate ?? null,
        office_location_id: input.officeLocationId ?? null,
        work_start_time: input.workStartTime ?? null,
        work_end_time: input.workEndTime ?? null,
        is_active: input.isActive ?? true,
      })
      .select(USER_SELECT)
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new ConflictError('Email or employee code already exists');
      }
      throw new AppError('Failed to create user', 500, 'DATABASE_ERROR', error);
    }

    if (!data) {
      throw new AppError('Failed to create user', 500, 'DATABASE_ERROR');
    }

    return data as DbUserWithRelations;
  }

  async update(
    id: string,
    input: UpdateUserInput & { passwordHash?: string },
  ): Promise<DbUserWithRelations> {
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (input.email !== undefined) updateData.email = input.email.toLowerCase();
    if (input.passwordHash !== undefined) updateData.password_hash = input.passwordHash;
    if (input.roleId !== undefined) updateData.role_id = input.roleId;
    if (input.departmentId !== undefined) updateData.department_id = input.departmentId;
    if (input.employeeTypeId !== undefined) updateData.employee_type_id = input.employeeTypeId;
    if (input.firstName !== undefined) updateData.first_name = input.firstName;
    if (input.lastName !== undefined) updateData.last_name = input.lastName;
    if (input.phone !== undefined) updateData.phone = input.phone;
    if (input.avatarUrl !== undefined) updateData.avatar_url = input.avatarUrl;
    if (input.jobTitle !== undefined) updateData.job_title = input.jobTitle;
    if (input.employeeCode !== undefined) updateData.employee_code = input.employeeCode;
    if (input.salary !== undefined) updateData.salary = input.salary;
    if (input.lastSalaryTransferDate !== undefined) {
      updateData.last_salary_transfer_date = input.lastSalaryTransferDate;
    }
    if (input.officeLocationId !== undefined) {
      updateData.office_location_id = input.officeLocationId;
    }
    if (input.workStartTime !== undefined) updateData.work_start_time = input.workStartTime;
    if (input.workEndTime !== undefined) updateData.work_end_time = input.workEndTime;
    if (input.projectLatitude !== undefined) updateData.project_latitude = input.projectLatitude;
    if (input.projectLongitude !== undefined) updateData.project_longitude = input.projectLongitude;
    if (input.projectRadiusMeters !== undefined) {
      updateData.project_radius_meters = input.projectRadiusMeters;
    }
    if (input.isActive !== undefined) updateData.is_active = input.isActive;

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', id)
      .is('deleted_at', null)
      .select(USER_SELECT)
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new ConflictError('Email or employee code already exists');
      }
      throw new AppError('Failed to update user', 500, 'DATABASE_ERROR', error);
    }

    if (!data) {
      throw new NotFoundError('User not found');
    }

    return data as DbUserWithRelations;
  }

  async softDelete(id: string): Promise<void> {
    const { error } = await supabase
      .from('users')
      .update({ deleted_at: new Date().toISOString(), is_active: false })
      .eq('id', id)
      .is('deleted_at', null);

    if (error) {
      throw new AppError('Failed to delete user', 500, 'DATABASE_ERROR', error);
    }
  }

  async countAllUsers(): Promise<number> {
    const { count, error } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .is('deleted_at', null);

    if (error) {
      throw new AppError('Failed to count users', 500, 'DATABASE_ERROR', error);
    }

    return count ?? 0;
  }

  async countUsersByActive(isActive: boolean): Promise<number> {
    const { count, error } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', isActive)
      .is('deleted_at', null);

    if (error) {
      throw new AppError('Failed to count users by status', 500, 'DATABASE_ERROR', error);
    }

    return count ?? 0;
  }

  async countUsersCreatedBetween(startDate: string, endDate: string): Promise<number> {
    const { count, error } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .is('deleted_at', null);

    if (error) {
      throw new AppError('Failed to count new users', 500, 'DATABASE_ERROR', error);
    }

    return count ?? 0;
  }

  async countRecentUserModifications(since: string): Promise<number> {
    const { count, error } = await supabase
      .from('activity_logs')
      .select('id', { count: 'exact', head: true })
      .in('action', ['user.create', 'user.update', 'user.delete'])
      .gte('created_at', since)
      .is('deleted_at', null);

    if (error) {
      throw new AppError('Failed to count user modifications', 500, 'DATABASE_ERROR', error);
    }

    return count ?? 0;
  }

  async countSecurityAlerts(since: string): Promise<number> {
    const { count, error } = await supabase
      .from('activity_logs')
      .select('id', { count: 'exact', head: true })
      .or('action.ilike.%failed%,action.ilike.%unauthorized%')
      .gte('created_at', since)
      .is('deleted_at', null);

    if (error) {
      return 0;
    }

    return count ?? 0;
  }

  async generateNextEmployeeCode(): Promise<string> {
    const { data, error } = await supabase
      .from('users')
      .select('employee_code')
      .not('employee_code', 'is', null)
      .is('deleted_at', null);

    if (error) {
      throw new AppError('Failed to generate employee code', 500, 'DATABASE_ERROR', error);
    }

    let maxNumber = 0;
    for (const row of data ?? []) {
      const code = row.employee_code as string | null;
      if (!code) continue;
      const match = /^EMP-(\d+)$/i.exec(code.trim());
      if (match) {
        maxNumber = Math.max(maxNumber, Number(match[1]));
      }
    }

    return `EMP-${String(maxNumber + 1).padStart(4, '0')}`;
  }

  async findFormLookups(): Promise<{
    roles: Array<{ id: string; name: string; description: string | null }>;
    employeeTypes: Array<{ id: string; name: string }>;
    departments: Array<{ id: string; name: string }>;
    officeLocations: Array<{
      id: string;
      name: string;
      latitude: number;
      longitude: number;
      radiusMeters: number;
    }>;
    nextEmployeeCode: string;
  }> {
    const { settingsRepository } = await import(
      '../../../shared/repositories/settings.repository.js'
    );

    const [rolesResult, employeeTypesResult, departmentsResult, officeLocations, nextEmployeeCode] =
      await Promise.all([
        supabase.from('roles').select('id, name, description').is('deleted_at', null).order('name'),
        supabase.from('employee_types').select('id, name').is('deleted_at', null).order('name'),
        supabase.from('departments').select('id, name').is('deleted_at', null).order('name'),
        settingsRepository.getOfficeLocations(),
        this.generateNextEmployeeCode(),
      ]);

    if (rolesResult.error || employeeTypesResult.error || departmentsResult.error) {
      throw new AppError('Failed to fetch form lookups', 500, 'DATABASE_ERROR');
    }

    return {
      roles: rolesResult.data ?? [],
      employeeTypes: employeeTypesResult.data ?? [],
      departments: departmentsResult.data ?? [],
      officeLocations,
      nextEmployeeCode,
    };
  }
}

export const usersRepository = new UsersRepository();
