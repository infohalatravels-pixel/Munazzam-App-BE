import jwt, { type SignOptions } from 'jsonwebtoken';
import { getEnv } from '../../config/index.js';
import { UnauthorizedError } from '../errors/index.js';
import type { UserRole } from '../../shared/constants/index.js';
import type { JwtAccessPayload, JwtRefreshPayload, LegacyJwtAccessPayload } from '../../types/auth.types.js';

const APP_ROLES: UserRole[] = ['admin', 'hr', 'employee'];

function resolveAppRole(payload: LegacyJwtAccessPayload): UserRole {
  if (payload.user_role && APP_ROLES.includes(payload.user_role)) {
    return payload.user_role;
  }

  if (payload.role !== 'authenticated' && APP_ROLES.includes(payload.role as UserRole)) {
    return payload.role as UserRole;
  }

  throw new UnauthorizedError('Invalid access token role');
}

export function signAccessToken(payload: {
  sub: string;
  email: string;
  user_role: UserRole;
}): string {
  const tokenPayload: JwtAccessPayload = {
    sub: payload.sub,
    email: payload.email,
    user_role: payload.user_role,
    role: 'authenticated',
    aud: 'authenticated',
    type: 'access',
  };

  return jwt.sign(tokenPayload, getEnv().JWT_ACCESS_SECRET, {
    expiresIn: getEnv().JWT_ACCESS_EXPIRY as SignOptions['expiresIn'],
  });
}

export function signRefreshToken(payload: Omit<JwtRefreshPayload, 'type'>): string {
  const tokenPayload: JwtRefreshPayload = { ...payload, type: 'refresh' };
  return jwt.sign(tokenPayload, getEnv().JWT_REFRESH_SECRET, {
    expiresIn: getEnv().JWT_REFRESH_EXPIRY as SignOptions['expiresIn'],
  });
}

export function verifyAccessToken(token: string): JwtAccessPayload {
  try {
    const payload = jwt.verify(token, getEnv().JWT_ACCESS_SECRET) as LegacyJwtAccessPayload;

    if (payload.type !== 'access') {
      throw new UnauthorizedError('Invalid access token');
    }

    const user_role = resolveAppRole(payload);

    return {
      sub: payload.sub,
      email: payload.email,
      user_role,
      role: 'authenticated',
      aud: 'authenticated',
      type: 'access',
    };
  } catch (error) {
    if (error instanceof UnauthorizedError) throw error;
    throw new UnauthorizedError('Invalid or expired access token');
  }
}

export function verifyRefreshToken(token: string): JwtRefreshPayload {
  try {
    const payload = jwt.verify(token, getEnv().JWT_REFRESH_SECRET) as JwtRefreshPayload;
    if (payload.type !== 'refresh') {
      throw new UnauthorizedError('Invalid refresh token');
    }
    return payload;
  } catch {
    throw new UnauthorizedError('Invalid or expired refresh token');
  }
}

export function getRefreshTokenExpiryDate(): Date {
  const expiry = getEnv().JWT_REFRESH_EXPIRY;
  const match = /^(\d+)([dhms])$/.exec(expiry);
  if (!match) {
    return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  }

  const amount = Number(match[1]);
  const unit = match[2];
  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };

  return new Date(Date.now() + amount * (multipliers[unit] ?? multipliers.d));
}
