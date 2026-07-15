import { getEnv } from '../../../config/index.js';
import { UnauthorizedError } from '../../../shared/errors/index.js';
import {
  hashToken,
  verifyPassword,
  verifyTokenHash,
} from '../../../shared/crypto/password.service.js';
import {
  getRefreshTokenExpiryDate,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '../../../shared/jwt/jwt.service.js';
import { activityLogRepository } from '../../../shared/repositories/activity-log.repository.js';
import type { UserRole } from '../../../shared/constants/index.js';
import { authRepository } from '../repository/auth.repository.js';
import { mapUserToProfile } from '../dto/user.mapper.js';
import type { LoginResponseDto, MeResponseDto, RefreshResponseDto } from '../dto/auth.dto.js';
import { randomUUID } from 'crypto';

interface RequestMeta {
  userAgent?: string;
  ip?: string;
}

export class AuthService {
  async login(
    email: string,
    password: string,
    meta: RequestMeta = {},
  ): Promise<LoginResponseDto> {
    const user = await authRepository.findUserByEmail(email);

    if (!user || !user.is_active) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const isValid = await verifyPassword(password, user.password_hash);
    if (!isValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const roleName = user.roles?.name as UserRole;
    const tokens = await this.issueTokens(user.id, user.email, roleName, meta);

    await activityLogRepository.create({
      userId: user.id,
      action: 'auth.login',
      entityType: 'user',
      entityId: user.id,
      ip: meta.ip,
    });

    return {
      user: mapUserToProfile(user),
      tokens,
    };
  }

  async refresh(refreshToken: string, meta: RequestMeta = {}): Promise<RefreshResponseDto> {
    const payload = verifyRefreshToken(refreshToken);
    const storedToken = await authRepository.findRefreshTokenById(payload.tokenId);

    const sessionExpired = 'Your session is expired. Please login again.';

    if (!storedToken || storedToken.revoked_at) {
      throw new UnauthorizedError(sessionExpired, 'SESSION_EXPIRED');
    }

    if (new Date(storedToken.expires_at) < new Date()) {
      throw new UnauthorizedError(sessionExpired, 'SESSION_EXPIRED');
    }

    const isValid = await verifyTokenHash(refreshToken, storedToken.token_hash);
    if (!isValid) {
      throw new UnauthorizedError(sessionExpired, 'SESSION_EXPIRED');
    }

    const user = await authRepository.findUserById(payload.sub);
    if (!user || !user.is_active) {
      throw new UnauthorizedError(sessionExpired, 'SESSION_EXPIRED');
    }

    await authRepository.revokeRefreshToken(storedToken.id);

    const roleName = user.roles?.name as UserRole;
    const tokens = await this.issueTokens(user.id, user.email, roleName, meta);

    return { tokens };
  }

  async logout(refreshToken: string, userId?: string, meta: RequestMeta = {}): Promise<void> {
    try {
      const payload = verifyRefreshToken(refreshToken);
      const storedToken = await authRepository.findRefreshTokenById(payload.tokenId);

      if (storedToken && !storedToken.revoked_at) {
        const isValid = await verifyTokenHash(refreshToken, storedToken.token_hash);
        if (isValid) {
          await authRepository.revokeRefreshToken(storedToken.id);
        }
      }
    } catch {
      // Idempotent logout — invalid tokens are treated as already logged out
    }

    if (userId) {
      await activityLogRepository.create({
        userId,
        action: 'auth.logout',
        entityType: 'user',
        entityId: userId,
        ip: meta.ip,
      });
    }
  }

  async me(userId: string): Promise<MeResponseDto> {
    const user = await authRepository.findUserById(userId);

    if (!user || !user.is_active) {
      throw new UnauthorizedError(
        'Your session is expired. Please login again.',
        'SESSION_EXPIRED',
      );
    }

    return { user: mapUserToProfile(user) };
  }

  private async issueTokens(
    userId: string,
    email: string,
    role: UserRole,
    meta: RequestMeta,
  ) {
    const tokenId = randomUUID();
    const expiresAt = getRefreshTokenExpiryDate();

    const refreshToken = signRefreshToken({ sub: userId, tokenId });
    const tokenHash = await hashToken(refreshToken);

    await authRepository.createRefreshToken({
      id: tokenId,
      userId,
      tokenHash,
      expiresAt,
      userAgent: meta.userAgent,
      ip: meta.ip,
    });

    const accessToken = signAccessToken({ sub: userId, email, user_role: role });

    return {
      accessToken,
      refreshToken,
      expiresIn: getEnv().JWT_ACCESS_EXPIRY,
    };
  }
}

export const authService = new AuthService();
