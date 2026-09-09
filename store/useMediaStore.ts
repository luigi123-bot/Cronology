import { create } from 'zustand';
import {
  getMovieDetails,
  getSeriesDetails,
  getSeasonDetails,
  getPosterUrl,
  getBannerUrl,
  getStillUrl,
  type TMDBMovie,
  type TMDBSeries,
  type TMDBSeason,
  type TMDBEpisode,
} from '@/services/tmdb';
import { buildStreamUrl } from '@/services/streamUrlBuilder';

export type MediaType = 'movie' | 'tv';

export interface UnifiedMedia {
  id: number;
  type: MediaType;
  title: string;
  originalTitle: string;
  overview: string;
  posterUrl: string | null;
  backdropUrl: string | null;
  releaseDate: string;
  runtime: number | null;
  voteAverage: number;
  genres: { id: number; name: string }[];
  numberOfSeasons?: number;
  numberOfEpisodes?: number;
  rawMovie?: TMDBMovie;
  rawSeries?: TMDBSeries;
}

export interface ActiveMediaPlayback {
  title: string;
  subTitle?: string;
  streamUrl: string;
  posterUrl?: string | null;
  isMovie: boolean;
  seasonNumber?: number;
  episodeNumber?: number;
  episodeId?: number;
}

interface MediaState {
  // Parámetros y metadatos
  mediaType: MediaType | null;
  tmdbId: number | null;
  media: UnifiedMedia | null;

  // Catálogo de series
  seasons: TMDBSeason[];
  selectedSeason: number;
  episodes: TMDBEpisode[];

  // Reproducción
  activeMedia: ActiveMediaPlayback | null;
  isPlaying: boolean;

  // Estados de carga
  isLoading: boolean;
  isLoadingEpisodes: boolean;
  error: string | null;

  // Acciones
  fetchMediaData: (type: MediaType, tmdbId: number) => Promise<void>;
  selectSeason: (seasonNumber: number) => Promise<void>;
  playMovie: () => void;
  playEpisode: (episode: TMDBEpisode) => void;
  setIsPlaying: (playing: boolean) => void;
  reset: () => void;
}

export const useMediaStore = create<MediaState>((set, get) => ({
  mediaType: null,
  tmdbId: null,
  media: null,
  seasons: [],
  selectedSeason: 1,
  episodes: [],
  activeMedia: null,
  isPlaying: false,
  isLoading: false,
  isLoadingEpisodes: false,
  error: null,

  /**
   * Consulta la API de TMDB dinámicamente para Película o Serie
   */
  fetchMediaData: async (type: MediaType, tmdbId: number) => {
    set({
      isLoading: true,
      error: null,
      mediaType: type,
      tmdbId,
      isPlaying: false,
      activeMedia: null,
    });

    try {
      if (type === 'movie') {
        const movie = await getMovieDetails(tmdbId);
        const unified: UnifiedMedia = {
          id: movie.id,
          type: 'movie',
          title: movie.title,
          originalTitle: movie.original_title,
          overview: movie.overview,
          posterUrl: getPosterUrl(movie.poster_path),
          backdropUrl: getBannerUrl(movie.backdrop_path),
          releaseDate: movie.release_date,
          runtime: movie.runtime,
          voteAverage: movie.vote_average,
          genres: movie.genres || [],
          rawMovie: movie,
        };

        const streamUrl = buildStreamUrl(movie.title, null, null, true);

        set({
          media: unified,
          seasons: [],
          episodes: [],
          isLoading: false,
          activeMedia: {
            title: movie.title,
            subTitle: movie.release_date ? `Estreno: ${movie.release_date.slice(0, 4)}` : undefined,
            streamUrl,
            posterUrl: unified.backdropUrl || unified.posterUrl,
            isMovie: true,
          },
          isPlaying: false, // Inicia en pausa con placeholder
        });
      } else {
        // Es una Serie ('tv')
        const series = await getSeriesDetails(tmdbId);
        const unified: UnifiedMedia = {
          id: series.id,
          type: 'tv',
          title: series.name,
          originalTitle: series.original_name,
          overview: series.overview,
          posterUrl: getPosterUrl(series.poster_path),
          backdropUrl: getBannerUrl(series.backdrop_path),
          releaseDate: series.first_air_date,
          runtime: null,
          voteAverage: series.vote_average,
          genres: series.genres || [],
          numberOfSeasons: series.number_of_seasons,
          numberOfEpisodes: series.number_of_episodes,
          rawSeries: series,
        };

        // Construir lista de temporadas disponibles
        const seasonNumbers = Array.from(
          { length: series.number_of_seasons || 1 },
          (_, i) => i + 1
        );
        const dummySeasons: TMDBSeason[] = seasonNumbers.map((num) => ({
          id: num,
          name: `Temporada ${num}`,
          overview: '',
          season_number: num,
          air_date: '',
          episode_count: 0,
          poster_path: null,
        }));

        set({
          media: unified,
          seasons: dummySeasons,
          selectedSeason: 1,
          isLoading: false,
        });

        // Obtener episodios de la Temporada 1
        await get().selectSeason(1);
      }
    } catch (err: any) {
      console.error('[MediaStore] Error fetching media data:', err);
      set({
        isLoading: false,
        error: err?.message || 'Error al conectar con la base de datos de TMDB.',
      });
    }
  },

  /**
   * Cambia la temporada activa de una serie y descarga sus episodios de TMDB
   */
  selectSeason: async (seasonNumber: number) => {
    const { media, tmdbId } = get();
    if (!tmdbId || !media || media.type !== 'tv') return;

    set({ isLoadingEpisodes: true, selectedSeason: seasonNumber });
    try {
      const seasonData = await getSeasonDetails(tmdbId, seasonNumber);
      const episodeList = seasonData.episodes || [];

      set({
        episodes: episodeList,
        isLoadingEpisodes: false,
      });

      // Si no hay episodio en reproducción o se cambia de temporada, preparar el primer episodio
      if (episodeList.length > 0) {
        const firstEp = episodeList[0];
        const initialStreamUrl = buildStreamUrl(
          media.title,
          seasonNumber,
          firstEp.episode_number,
          false
        );

        set({
          activeMedia: {
            title: `${media.title} — T${seasonNumber}:E${firstEp.episode_number}`,
            subTitle: firstEp.name,
            streamUrl: initialStreamUrl,
            posterUrl: getStillUrl(firstEp.still_path) || media.backdropUrl,
            isMovie: false,
            seasonNumber,
            episodeNumber: firstEp.episode_number,
            episodeId: firstEp.id,
          },
          isPlaying: false, // Inicia pausado hasta interacción
        });
      }
    } catch (err: any) {
      console.warn(`[MediaStore] Error fetching season ${seasonNumber}:`, err);
      set({
        isLoadingEpisodes: false,
        episodes: [],
      });
    }
  },

  /**
   * Inicia la reproducción de la película activa
   */
  playMovie: () => {
    const { media } = get();
    if (!media) return;

    const streamUrl = buildStreamUrl(media.title, null, null, true);
    set({
      activeMedia: {
        title: media.title,
        subTitle: media.releaseDate ? `Película • ${media.releaseDate.slice(0, 4)}` : 'Película',
        streamUrl,
        posterUrl: media.backdropUrl || media.posterUrl,
        isMovie: true,
      },
      isPlaying: true,
    });
  },

  /**
   * Inicia la reproducción de un episodio seleccionado de la lista
   */
  playEpisode: (episode: TMDBEpisode) => {
    const { media, selectedSeason } = get();
    if (!media) return;

    const streamUrl = buildStreamUrl(
      media.title,
      selectedSeason,
      episode.episode_number,
      false
    );

    set({
      activeMedia: {
        title: `${media.title} — T${selectedSeason}:E${episode.episode_number}`,
        subTitle: episode.name,
        streamUrl,
        posterUrl: getStillUrl(episode.still_path) || media.backdropUrl,
        isMovie: false,
        seasonNumber: selectedSeason,
        episodeNumber: episode.episode_number,
        episodeId: episode.id,
      },
      isPlaying: true,
    });
  },

  setIsPlaying: (playing: boolean) => set({ isPlaying: playing }),

  reset: () =>
    set({
      mediaType: null,
      tmdbId: null,
      media: null,
      seasons: [],
      selectedSeason: 1,
      episodes: [],
      activeMedia: null,
      isPlaying: false,
      isLoading: false,
      isLoadingEpisodes: false,
      error: null,
    }),
}));
