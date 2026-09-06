// Global Application Types

export interface SeriesWithProgress {
  id: number;
  tmdbId: number;
  name: string;
  posterUrl: string | null;
  bannerUrl: string | null;
  genres: { id: number; name: string }[];
  status: string | null;
  numberOfSeasons: number;
  numberOfEpisodes: number;
  watchedCount: number;
  totalCount: number;
  progressPercent: number;
  youtubeTrailerId: string | null;
  isChicagoUniverse: boolean;
  sortOrder: number;
  firstAirDate?: string | null;
}

export interface EpisodeWithProgress {
  id: number;
  seriesId: number;
  seriesName: string;
  tmdbId: number;
  seasonNumber: number;
  episodeNumber: number;
  name: string;
  overview: string | null;
  airDate: string | null;
  runtime: number | null;
  stillUrl: string | null;
  youtubeClipId: string | null;
  isCrossover: boolean;
  crossoverName: string | null;
  crossoverOrder: number | null;
  crossoverSeries: { seriesName: string; seasonEp: string }[];
  deepseekFacts: string | null;
  watched: boolean;
  watchedAt: Date | null;
  rating: number | null;
}

export interface AuthUser {
  id: number;
  email: string;
  displayName: string | null;
  username?: string;
  avatarUrl: string | null;
}

export interface CrossoverArcDisplay {
  id: number;
  name: string;
  description: string | null;
  orderedEpisodes: {
    order: number;
    seriesName: string;
    seasonNumber: number;
    episodeNumber: number;
    episodeId?: number;
    title: string;
  }[];
  includesSVU: boolean;
}

export type WatchStatus = 'watched' | 'unwatched' | 'in-progress';

export interface SeasonDisplay {
  seasonNumber: number;
  name: string | null;
  posterUrl: string | null;
  episodes: EpisodeWithProgress[];
  watchedCount: number;
  totalEpisodes: number;
}

export type { TMDBSearchResult } from '@/services/tmdb';

