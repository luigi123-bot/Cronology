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
}

const STORAGE_PREFIX = 'cronology_watch_';
const SERIES_PROGRESS_PREFIX = 'cronology_series_current_';
const WATCHED_EPISODES_KEY = 'cronology_watched_episodes';

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

// ─── Seguimiento del capítulo donde vas por serie ────────────────────────────

export function saveSeriesCurrentEpisode(
  seriesId: number,
  data: Omit<SeriesCurrentProgress, 'updatedAt'>
): void {
  if (typeof window === 'undefined') return;
  try {
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
