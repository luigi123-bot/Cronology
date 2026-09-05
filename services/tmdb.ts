// TMDB API Service
// Docs: https://developer.themoviedb.org/docs

const TMDB_BASE_URL =
  process.env.EXPO_PUBLIC_TMDB_BASE_URL || 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE =
  process.env.EXPO_PUBLIC_TMDB_IMAGE_BASE || 'https://image.tmdb.org/t/p/w500';
const TMDB_BANNER_BASE = 'https://image.tmdb.org/t/p/w1280';
const TMDB_STILL_BASE = 'https://image.tmdb.org/t/p/w300';
const API_KEY = process.env.EXPO_PUBLIC_TMDB_API_KEY || '';
const BEARER_TOKEN = process.env.EXPO_PUBLIC_TMDB_BEARER_TOKEN || '';

if (!API_KEY && !BEARER_TOKEN) {
  console.warn('[TMDB] No API key or Bearer token configured');
}

const tmdbFetch = async <T>(endpoint: string, params: Record<string, string> = {}): Promise<T> => {
  const url = new URL(`${TMDB_BASE_URL}${endpoint}`);
  url.searchParams.set('language', params.language || 'es-MX');
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  // Prefer Bearer token (recommended), fall back to api_key query param
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (BEARER_TOKEN) {
    headers['Authorization'] = `Bearer ${BEARER_TOKEN}`;
  } else {
    url.searchParams.set('api_key', API_KEY);
  }

  const response = await fetch(url.toString(), { headers });
  if (!response.ok) {
    throw new Error(`TMDB API error: ${response.status} ${response.statusText}`);
  }
  return response.json() as Promise<T>;
};

// ─── Types ─────────────────────────────────────────────────────────────────
export interface TMDBSeries {
  id: number;
  name: string;
  original_name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date: string;
  last_air_date: string;
  status: string;
  number_of_seasons: number;
  number_of_episodes: number;
  vote_average: number;
  genres: { id: number; name: string }[];
  videos?: { results: TMDBVideo[] };
}

export interface TMDBVideo {
  id: string;
  key: string; // YouTube video ID
  name: string;
  site: string;
  type: string; // "Trailer" | "Teaser" | "Clip" etc.
  official: boolean;
}

export interface TMDBEpisode {
  id: number;
  name: string;
  overview: string;
  episode_number: number;
  season_number: number;
  air_date: string;
  runtime: number;
  still_path: string | null;
  vote_average: number;
}

export interface TMDBSeason {
  id: number;
  name: string;
  overview: string;
  season_number: number;
  air_date: string;
  episode_count: number;
  poster_path: string | null;
  episodes?: TMDBEpisode[];
}

export interface TMDBSearchResult {
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  first_air_date: string;
  vote_average: number;
}

// ─── Image URL builders ────────────────────────────────────────────────────
export const getPosterUrl = (path: string | null): string | null =>
  path ? `${TMDB_IMAGE_BASE}${path}` : null;

export const getBannerUrl = (path: string | null): string | null =>
  path ? `${TMDB_BANNER_BASE}${path}` : null;

export const getStillUrl = (path: string | null): string | null =>
  path ? `${TMDB_STILL_BASE}${path}` : null;

// ─── API Methods ───────────────────────────────────────────────────────────

/** Search for TV series by name */
export const searchSeries = async (query: string): Promise<TMDBSearchResult[]> => {
  const data = await tmdbFetch<{ results: TMDBSearchResult[] }>('/search/tv', {
    query,
    include_adult: 'false',
  });
  return data.results;
};

/** Get full series details including videos (trailers) */
export const getSeriesDetails = async (tmdbId: number): Promise<TMDBSeries> => {
  return tmdbFetch<TMDBSeries>(`/tv/${tmdbId}`, {
    append_to_response: 'videos,external_ids',
  });
};

/** Get all episodes for a specific season */
export const getSeasonDetails = async (
  seriesId: number,
  seasonNumber: number
): Promise<TMDBSeason> => {
  return tmdbFetch<TMDBSeason>(`/tv/${seriesId}/season/${seasonNumber}`);
};

/** Get episode details */
export const getEpisodeDetails = async (
  seriesId: number,
  seasonNumber: number,
  episodeNumber: number
): Promise<TMDBEpisode> => {
  return tmdbFetch<TMDBEpisode>(
    `/tv/${seriesId}/season/${seasonNumber}/episode/${episodeNumber}`
  );
};

/** Get official YouTube trailer ID from series videos */
export const extractTrailerId = (videos: TMDBVideo[]): string | null => {
  // Priority: Official Trailer > Trailer > Teaser
  const official = videos.find(
    (v) => v.site === 'YouTube' && v.type === 'Trailer' && v.official
  );
  const trailer = videos.find((v) => v.site === 'YouTube' && v.type === 'Trailer');
  const teaser = videos.find((v) => v.site === 'YouTube' && v.type === 'Teaser');
  return (official || trailer || teaser)?.key ?? null;
};

/** Get recommendations based on genre IDs */
export const getRecommendationsByGenre = async (
  genreIds: number[],
  page = 1
): Promise<TMDBSearchResult[]> => {
  const data = await tmdbFetch<{ results: TMDBSearchResult[] }>('/discover/tv', {
    with_genres: genreIds.join(','),
    sort_by: 'vote_average.desc',
    'vote_count.gte': '100',
    page: String(page),
  });
  return data.results;
};

/** Get all seasons + episodes for a series (full import) */
export const getFullSeriesData = async (
  tmdbId: number
): Promise<{ series: TMDBSeries; seasons: TMDBSeason[] }> => {
  const seriesData = await getSeriesDetails(tmdbId);
  const seasonNumbers = Array.from(
    { length: seriesData.number_of_seasons },
    (_, i) => i + 1
  );

  // Fetch all seasons in parallel (with rate limiting)
  const seasonPromises = seasonNumbers.map((n) =>
    getSeasonDetails(tmdbId, n).catch((e) => {
      console.warn(`Failed to fetch season ${n}:`, e);
      return null;
    })
  );
  const seasons = (await Promise.all(seasonPromises)).filter(
    Boolean
  ) as TMDBSeason[];

  return { series: seriesData, seasons };
};
