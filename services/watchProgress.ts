/**
 * services/watchProgress.ts
 * Gestor de progreso de reproducción para episodios y películas.
 * Permite reanudar donde se dejó o empezar de nuevo, evitando que se repita solo.
 */

export interface WatchSession {
  mediaKey: string;
  status: 'watching' | 'completed';
  updatedAt: number;
}

const STORAGE_PREFIX = 'cronology_watch_';

export function getWatchSession(mediaKey: string): WatchSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${mediaKey}`);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveWatchSession(mediaKey: string, status: 'watching' | 'completed'): void {
  if (typeof window === 'undefined') return;
  try {
    const session: WatchSession = {
      mediaKey,
      status,
      updatedAt: Date.now(),
    };
    localStorage.setItem(`${STORAGE_PREFIX}${mediaKey}`, JSON.stringify(session));
  } catch {}
}

export function clearWatchSession(mediaKey: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(`${STORAGE_PREFIX}${mediaKey}`);
  } catch {}
}
