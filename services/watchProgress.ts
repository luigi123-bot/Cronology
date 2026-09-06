/**
 * services/watchProgress.ts
 * Gestor integral de progreso de reproducción, seguimiento de capítulos vistos
 * y punto exacto de continuación para series y películas en Cronology.
 */

export interface WatchSession {
  mediaKey: string;
  status: 'watching' | 'completed';
  updatedAt: number;
}

export interface SeriesCurrentProgress {
  seriesId: number;
  seriesName: string;
  seasonNumber: number;
  episodeNumber: number;
  episodeId: number;
  episodeName: string;
  updatedAt: number;
  year?: string | number;
  bannerUrl?: string | null;
  progressPercent?: number;
}

const STORAGE_PREFIX = 'cronology_watch_';
const SERIES_PROGRESS_PREFIX = 'cronology_series_current_';
const WATCHED_EPISODES_KEY = 'cronology_watched_episodes';
const DISMISSED_SERIES_KEY = 'cronology_dismissed_continue_series';

// ─── Sesiones individuales de video ──────────────────────────────────────────

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

// ─── Control de series descartadas de "Continúa viendo" ───────────────────────

export function getDismissedSeriesIds(): Set<number> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(DISMISSED_SERIES_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw));
  } catch {
    return new Set();
  }
}

export function dismissSeriesFromContinue(seriesId: number): void {
  if (typeof window === 'undefined') return;
  try {
    // 1. Eliminar de progreso actual
    localStorage.removeItem(`${SERIES_PROGRESS_PREFIX}${seriesId}`);
    // 2. Registrar en lista de descartadas para no resembrarla
    const dismissed = getDismissedSeriesIds();
    dismissed.add(seriesId);
    localStorage.setItem(DISMISSED_SERIES_KEY, JSON.stringify(Array.from(dismissed)));
  } catch {}
}

export function removeSeriesCurrentEpisode(seriesId: number): void {
  dismissSeriesFromContinue(seriesId);
}

// ─── Seguimiento del capítulo donde vas por serie ────────────────────────────

export function saveSeriesCurrentEpisode(
  seriesId: number,
  data: Omit<SeriesCurrentProgress, 'updatedAt'>
): void {
  if (typeof window === 'undefined') return;
  try {
    // Si se reanuda, reactivamos de la lista de descartadas
    const dismissed = getDismissedSeriesIds();
    if (dismissed.has(seriesId)) {
      dismissed.delete(seriesId);
      localStorage.setItem(DISMISSED_SERIES_KEY, JSON.stringify(Array.from(dismissed)));
    }

    const progress: SeriesCurrentProgress = {
      ...data,
      seriesId,
      updatedAt: Date.now(),
    };
    localStorage.setItem(
      `${SERIES_PROGRESS_PREFIX}${seriesId}`,
      JSON.stringify(progress)
    );
  } catch {}
}

export function getSeriesCurrentEpisode(seriesId: number): SeriesCurrentProgress | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(`${SERIES_PROGRESS_PREFIX}${seriesId}`);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function getAllSeriesCurrentEpisodes(): Record<number, SeriesCurrentProgress> {
  if (typeof window === 'undefined') return {};
  try {
    const result: Record<number, SeriesCurrentProgress> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(SERIES_PROGRESS_PREFIX)) {
        const raw = localStorage.getItem(key);
        if (raw) {
          const item: SeriesCurrentProgress = JSON.parse(raw);
          result[item.seriesId] = item;
        }
      }
    }
    return result;
  } catch {
    return {};
  }
}

/**
 * Inicializa valores por defecto de "Continúa viendo" si el usuario aún no tiene
 * progreso guardado (ej. Chicago Med 1x17 y Grimm 1x13 según el catálogo).
 */
export function getOrSeedContinueWatching(
  availableSeries: { id: number; name: string; bannerUrl?: string | null; posterUrl?: string | null; firstAirDate?: string | null }[]
): Record<number, SeriesCurrentProgress> {
  const current = getAllSeriesCurrentEpisodes();
  const dismissed = getDismissedSeriesIds();

  // Si ya tiene progreso guardado o ya descartó elementos, respetamos el estado del usuario
  if (Object.keys(current).length > 0 || dismissed.size > 0) {
    return current;
  }

  // Si está limpio y no hay descartadas, sembramos los dos items de demostración iniciales
  const seedItems: SeriesCurrentProgress[] = [
    {
      seriesId: 2,
      seriesName: 'Chicago Med',
      seasonNumber: 1,
      episodeNumber: 17,
      episodeId: 56,
      episodeName: 'Withdrawal',
      year: '2015',
      bannerUrl: 'https://image.tmdb.org/t/p/w1280/x2jNLrYw1s9i6kihEJqsBQgs9nR.jpg',
      progressPercent: 62,
      updatedAt: Date.now() - 1000 * 60 * 30, // hace 30 mins
    },
    {
      seriesId: 6,
      seriesName: 'Grimm',
      seasonNumber: 1,
      episodeNumber: 13,
      episodeId: 1318,
      episodeName: 'Tres monedas a la fuente',
      year: '2011',
      bannerUrl: 'https://image.tmdb.org/t/p/w1280/oS3nip9GGsx5A7vWp8A1cazqJlF.jpg',
      progressPercent: 14,
      updatedAt: Date.now() - 1000 * 60 * 120, // hace 2 horas
    },
  ];

  seedItems.forEach((item) => {
    saveSeriesCurrentEpisode(item.seriesId, item);
  });

  return getAllSeriesCurrentEpisodes();
}


// ─── Capítulos ya vistos (Local y sincronizado) ───────────────────────────────

export function getLocalWatchedEpisodeIds(): Set<number> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(WATCHED_EPISODES_KEY);
    if (!raw) return new Set();
    const arr: number[] = JSON.parse(raw);
    return new Set(arr);
  } catch {
    return new Set();
  }
}

export function markEpisodeWatchedLocal(episodeId: number, watched: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    const set = getLocalWatchedEpisodeIds();
    if (watched) {
      set.add(episodeId);
    } else {
      set.delete(episodeId);
    }
    localStorage.setItem(
      WATCHED_EPISODES_KEY,
      JSON.stringify(Array.from(set))
    );
  } catch {}
}

export function isEpisodeWatchedLocal(episodeId: number): boolean {
  return getLocalWatchedEpisodeIds().has(episodeId);
}
