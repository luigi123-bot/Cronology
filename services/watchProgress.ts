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

// ─── Mapeo de backdrops auténticos por serie para evitar mezclas ─────────────
export const KNOWN_SERIES_BACKDROPS: Record<string, string> = {
  grimm: 'https://image.tmdb.org/t/p/w1280/oS3nip9GGsx5A7vWp8A1cazqJlF.jpg',
  'chicago med': 'https://image.tmdb.org/t/p/w1280/x2jNLrYw1s9i6kihEJqsBQgs9nR.jpg',
  'chicago fire': 'https://image.tmdb.org/t/p/w1280/9g5a43sL3wT0tBq4D4b1c7Gq9Z0.jpg',
  'chicago p.d.': 'https://image.tmdb.org/t/p/w1280/tHLhFzR6jZ3q8K7D1W1b3B4c5D6.jpg',
  'gravity falls': 'https://image.tmdb.org/t/p/w1280/mvl08U24d3L9qE9sW2u8K4G5H6J.jpg',
};

export function resolveSeriesBackdrop(seriesName?: string, currentBanner?: string | null): string {
  const CHICAGO_MED_DEFAULT = 'https://image.tmdb.org/t/p/w1280/x2jNLrYw1s9i6kihEJqsBQgs9nR.jpg';
  const clean = (seriesName || '').toLowerCase().trim();

  // Si es Grimm y tenía el backdrop de Chicago Med por error de fallback previo, corregir
  if (clean.includes('grimm')) {
    if (!currentBanner || currentBanner === CHICAGO_MED_DEFAULT) {
      return KNOWN_SERIES_BACKDROPS.grimm;
    }
  }

  if (currentBanner && currentBanner.startsWith('http')) {
    return currentBanner;
  }

  for (const [key, url] of Object.entries(KNOWN_SERIES_BACKDROPS)) {
    if (clean.includes(key)) return url;
  }

  return currentBanner || CHICAGO_MED_DEFAULT;
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

    const existing = getSeriesCurrentEpisode(seriesId);
    const resolvedBanner = resolveSeriesBackdrop(
      data.seriesName || existing?.seriesName,
      data.bannerUrl || existing?.bannerUrl
    );

    const progress: SeriesCurrentProgress = {
      ...existing,
      ...data,
      seriesId,
      bannerUrl: resolvedBanner,
      year: data.year || existing?.year,
      episodeName: data.episodeName || existing?.episodeName || '',
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
    const item: SeriesCurrentProgress = JSON.parse(raw);
    item.bannerUrl = resolveSeriesBackdrop(item.seriesName, item.bannerUrl);
    return item;
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
          item.bannerUrl = resolveSeriesBackdrop(item.seriesName, item.bannerUrl);
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

  // Enriquecer items existentes con banners de availableSeries si faltan
  if (availableSeries && availableSeries.length > 0) {
    let updatedAny = false;
    for (const [sId, item] of Object.entries(current)) {
      const numId = Number(sId);
      const match = availableSeries.find(
        (s) => s.id === numId || s.name?.toLowerCase() === item.seriesName?.toLowerCase()
      );
      if (match) {
        const trueBanner = resolveSeriesBackdrop(item.seriesName, match.bannerUrl || match.posterUrl);
        if (trueBanner && trueBanner !== item.bannerUrl) {
          item.bannerUrl = trueBanner;
          if (match.firstAirDate && !item.year) {
            item.year = match.firstAirDate.slice(0, 4);
          }
          saveSeriesCurrentEpisode(numId, item);
          updatedAny = true;
        }
      }
    }
  }

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
      episodeNumber: 1,
      episodeId: 1,
      episodeName: 'Piloto',
      year: '2011',
      bannerUrl: 'https://image.tmdb.org/t/p/w1280/oS3nip9GGsx5A7vWp8A1cazqJlF.jpg',
      progressPercent: 45,
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
