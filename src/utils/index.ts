import { v4 as uuidv4 } from 'uuid';

export function generateRequestId(): string {
  return uuidv4();
}

export function omitUndefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, value]) => value !== undefined),
  ) as Partial<T>;
}
