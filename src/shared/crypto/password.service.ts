import bcrypt from 'bcryptjs';
import { getEnv } from '../../config/index.js';

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, getEnv().BCRYPT_ROUNDS);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export async function hashToken(token: string): Promise<string> {
  return bcrypt.hash(token, getEnv().BCRYPT_ROUNDS);
}

export async function verifyTokenHash(token: string, hash: string): Promise<boolean> {
  return bcrypt.compare(token, hash);
}
