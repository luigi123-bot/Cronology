import { create } from 'zustand';
import type { AuthUser, SeriesWithProgress, EpisodeWithProgress } from '@/types';

interface AppState {
  // Auth
  user: AuthUser | null;
  isAuthenticated: boolean;
  setUser: (user: AuthUser | null) => void;

  // Series
  seriesList: SeriesWithProgress[];
  setSeries: (series: SeriesWithProgress[]) => void;
  addSeries: (series: SeriesWithProgress) => void;
  updateSeriesProgress: (seriesId: number, watchedCount: number) => void;

  // Current Episode Context
  currentEpisode: EpisodeWithProgress | null;
  setCurrentEpisode: (episode: EpisodeWithProgress | null) => void;

  // Progress (local cache, synced with Neon)
  watchedEpisodes: Set<number>; // episode IDs
  markEpisodeWatched: (episodeId: number, watched: boolean) => void;
  isEpisodeWatched: (episodeId: number) => boolean;

  // UI State
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // Genre-based Recommendations
  userGenres: { id: number; name: string }[];
  computeUserGenres: () => void;
}

export const useStore = create<AppState>((set, get) => ({
  // ─── Auth ───────────────────────────────────────────────
  user: null,
  isAuthenticated: false,
  setUser: (user) => set({ user, isAuthenticated: !!user }),

  // ─── Series ─────────────────────────────────────────────
  seriesList: [],
  setSeries: (seriesList) => {
    set({ seriesList });
    get().computeUserGenres();
  },
  addSeries: (series) => {
    set((state) => ({ seriesList: [...state.seriesList, series] }));
    get().computeUserGenres();
  },
  updateSeriesProgress: (seriesId, watchedCount) => {
    set((state) => ({
      seriesList: state.seriesList.map((s) =>
        s.id === seriesId
          ? {
              ...s,
              watchedCount,
              progressPercent:
                s.totalCount > 0
                  ? Math.round((watchedCount / s.totalCount) * 100)
                  : 0,
            }
          : s
      ),
    }));
  },

  // ─── Current Episode ────────────────────────────────────
  currentEpisode: null,
  setCurrentEpisode: (episode) => set({ currentEpisode: episode }),

  // ─── Progress Cache ──────────────────────────────────────
  watchedEpisodes: new Set(),
  markEpisodeWatched: (episodeId, watched) => {
    set((state) => {
      const next = new Set(state.watchedEpisodes);
      if (watched) {
        next.add(episodeId);
      } else {
        next.delete(episodeId);
      }
      return { watchedEpisodes: next };
    });
  },
  isEpisodeWatched: (episodeId) => get().watchedEpisodes.has(episodeId),

  // ─── UI ─────────────────────────────────────────────────
  isLoading: false,
  setLoading: (isLoading) => set({ isLoading }),
  searchQuery: '',
  setSearchQuery: (searchQuery) => set({ searchQuery }),

  // ─── Genre Aggregation ──────────────────────────────────
  userGenres: [],
  computeUserGenres: () => {
    const { seriesList } = get();
    const genreMap = new Map<number, { id: number; name: string; count: number }>();

    seriesList.forEach((s) => {
      (s.genres || []).forEach((g) => {
        const existing = genreMap.get(g.id);
        if (existing) {
          existing.count++;
        } else {
          genreMap.set(g.id, { ...g, count: 1 });
        }
      });
    });

    // Sort by frequency and take top 5
    const sorted = Array.from(genreMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map(({ id, name }) => ({ id, name }));

    set({ userGenres: sorted });
  },
}));
