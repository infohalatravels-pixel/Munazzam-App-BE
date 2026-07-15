import { z } from 'zod';
import { USER_ROLES } from '../../../shared/constants/index.js';

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain an uppercase letter')
  .regex(/[a-z]/, 'Password must contain a lowercase letter')
  .regex(/[0-9]/, 'Password must contain a number');

export const listUsersQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  role: z.enum([USER_ROLES.ADMIN, USER_ROLES.HR, USER_ROLES.EMPLOYEE]).optional(),
  departmentId: z.string().uuid().optional(),
  isActive: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional(),
});

export const userIdParamSchema = z.object({
  id: z.string().uuid('Invalid user ID'),
});

const timeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Use HH:MM 24-hour format')
  .nullable();

const latitudeSchema = z.coerce.number().min(-90).max(90).nullable();
const longitudeSchema = z.coerce.number().min(-180).max(180).nullable();
const radiusSchema = z.coerce.number().int().min(50).max(5000).nullable();

export const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: passwordSchema,
  roleId: z.string().uuid('Invalid role ID'),
  departmentId: z.string().uuid('Invalid department ID').nullable().optional(),
  employeeTypeId: z.string().uuid('Invalid employee type ID'),
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  phone: z.string().max(30).nullable().optional(),
  avatarUrl: z.string().url().nullable().optional(),
  jobTitle: z.string().max(150).nullable().optional(),
  employeeCode: z.string().max(50).nullable().optional(),
  salary: z.coerce.number().nonnegative('Salary must be 0 or greater').nullable().optional(),
  lastSalaryTransferDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD date format')
    .nullable()
    .optional(),
  officeLocationId: z.string().max(100).nullable().optional(),
  workStartTime: timeSchema.optional(),
  workEndTime: timeSchema.optional(),
  projectLatitude: latitudeSchema.optional(),
  projectLongitude: longitudeSchema.optional(),
  projectRadiusMeters: radiusSchema.optional(),
  isActive: z.boolean().optional().default(true),
});

export const updateUserSchema = z
  .object({
    email: z.string().email('Invalid email address').optional(),
    password: passwordSchema.optional(),
    roleId: z.string().uuid('Invalid role ID').optional(),
    departmentId: z.string().uuid('Invalid department ID').nullable().optional(),
    employeeTypeId: z.string().uuid('Invalid employee type ID').optional(),
    firstName: z.string().min(1).max(100).optional(),
    lastName: z.string().min(1).max(100).optional(),
    phone: z.string().max(30).nullable().optional(),
    avatarUrl: z.string().url().nullable().optional(),
    jobTitle: z.string().max(150).nullable().optional(),
    employeeCode: z.string().max(50).nullable().optional(),
    salary: z.coerce.number().nonnegative('Salary must be 0 or greater').nullable().optional(),
    lastSalaryTransferDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD date format')
      .nullable()
      .optional(),
    officeLocationId: z.string().max(100).nullable().optional(),
    workStartTime: timeSchema.optional(),
    workEndTime: timeSchema.optional(),
    projectLatitude: latitudeSchema.optional(),
    projectLongitude: longitudeSchema.optional(),
    projectRadiusMeters: radiusSchema.optional(),
    isActive: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  })
  .refine(
    (data) => {
      const hasLat = data.projectLatitude != null;
      const hasLng = data.projectLongitude != null;
      return hasLat === hasLng;
    },
    { message: 'Latitude and longitude must be set together' },
  );

export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
export type UserIdParam = z.infer<typeof userIdParamSchema>;
export type CreateUserBody = z.infer<typeof createUserSchema>;
export type UpdateUserBody = z.infer<typeof updateUserSchema>;
