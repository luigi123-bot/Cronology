/**
 * services/auth.ts
 * Servicio de autenticación obligatoria y control de acceso para Cronology.
 * Usuario autorizado:
 *  Nombre: 'Luis gotopo' (insensible a mayúsculas/minúsculas)
 *  Usuario: '1266845'
 */

import type { AuthUser } from '@/types';

export const AUTH_STORAGE_KEY = 'cronology_auth_user';

export const AUTHORIZED_CREDENTIALS = {
  normalizedName: 'luis gotopo',
  normalizedUser: '1266845',
  defaultDisplayName: 'Luis Gotopo',
};

/**
 * Valida credenciales permitiendo escribir el nombre en cualquier combinación
 * de mayúsculas y minúsculas (ej: 'luis gotopo', 'Luis Gotopo', 'LUIS GOTOPO', 'Luis gotopo').
 */
export function validateCredentials(
  nameInput?: string | null,
  userInput?: string | null
): boolean {
  if (!nameInput || !userInput) return false;
  const cleanName = nameInput.trim().toLowerCase().replace(/\s+/g, ' ');
  const cleanUser = userInput.trim().toLowerCase();
  return (
    cleanName === AUTHORIZED_CREDENTIALS.normalizedName &&
    cleanUser === AUTHORIZED_CREDENTIALS.normalizedUser
  );
}

export function getStoredUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const user: AuthUser = JSON.parse(raw);
    if (user && validateCredentials(user.displayName, user.username || '')) {
      return user;
    }
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  } catch {
    return null;
  }
}

export function setStoredUser(user: AuthUser): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
  } catch {}
}

export function removeStoredUser(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  } catch {}
}
