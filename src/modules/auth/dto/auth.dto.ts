import type { AuthTokens, AuthUserProfile } from '../types/auth.types.js';

export interface LoginResponseDto {
  user: AuthUserProfile;
  tokens: AuthTokens;
}

export interface RefreshResponseDto {
  tokens: AuthTokens;
}

export interface MeResponseDto {
  user: AuthUserProfile;
}

export interface LogoutResponseDto {
  success: true;
}
