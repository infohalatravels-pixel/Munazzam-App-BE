import type { UserRole } from '../shared/constants/index.js';

export interface JwtAccessPayload {
  sub: string;
  email: string;
  /** App role used by API + Supabase RLS (`user_role` claim). */
  user_role: UserRole;
  /** Supabase postgres role — must be `authenticated` for realtime. */
  role: 'authenticated';
  aud: 'authenticated';
  type: 'access';
}

/** Legacy tokens may still use `role` as the app role before `user_role` was added. */
export type LegacyJwtAccessPayload = {
  sub: string;
  email: string;
  role: UserRole | 'authenticated';
  type: 'access';
  user_role?: UserRole;
  aud?: string;
};

export interface JwtRefreshPayload {
  sub: string;
  tokenId: string;
  type: 'refresh';
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
}
