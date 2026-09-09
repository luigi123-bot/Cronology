import { create } from 'zustand';
import { getSeasonDetails, type TMDBEpisode, type TMDBSeason } from '@/services/tmdb';

// Grimm TMDB ID constant
export const GRIMM_TMDB_ID = 39351;
export const GRIMM_DEFAULT_SEASON = 5;

// URL base configurable desde .env (soporta dominio o IP directa de VPS)
export const VPS_BASE_URL =
  process.env.EXPO_PUBLIC_VPS_BASE_URL || 'http://techzonne.online';

interface SeasonState {
  // Estado de Datos
  seriesId: number;
  seasonNumber: number;
  seasonDetails: TMDBSeason | null;
  episodes: TMDBEpisode[];
  selectedEpisode: TMDBEpisode | null;
  currentVideoUrl: string | null;

  // Estado de UI / Reproductor
  isLoading: boolean;
  error: string | null;
  isPlaying: boolean;

  // Acciones
  fetchSeasonEpisodes: (seriesId?: number, seasonNumber?: number) => Promise<void>;
  setSelectedEpisode: (episode: TMDBEpisode | null) => void;
  selectEpisode: (episode: TMDBEpisode) => void;
  buildVpsUrl: (seasonNumber: number, episodeNumber: number) => string;
  setIsPlaying: (playing: boolean) => void;
  reset: () => void;
}

/**
 * Función pura que construye dinámicamente la URL del archivo .mp4 en el VPS Nginx.
 * Sigue el patrón: rutaBase + GRMM5${numero_episodio}.mp4
 * Ejemplo: http://techzonne.online/Series/Grimm/Season%205/GRMM51.mp4
 */
export const buildGrimmVpsUrl = (seasonNumber: number = 5, episodeNumber: number): string => {
  const base = VPS_BASE_URL.replace(/\/+$/, '');
  const rutaBase = `${base}/Series/Grimm/Season%20${seasonNumber}/`;
  const fileName = `GRMM5${episodeNumber}.mp4`;
  return `${rutaBase}${fileName}`;
};

export const useSeasonStore = create<SeasonState>((set, get) => ({
  seriesId: GRIMM_TMDB_ID,
  seasonNumber: GRIMM_DEFAULT_SEASON,
  seasonDetails: null,
  episodes: [],
  selectedEpisode: null,
  currentVideoUrl: null,
  isLoading: false,
  error: null,
  isPlaying: false,

  /**
   * Genera dinámicamente la URL de streaming del VPS
   */
  buildVpsUrl: (seasonNumber: number, episodeNumber: number) => {
    return buildGrimmVpsUrl(seasonNumber, episodeNumber);
  },

  /**
   * Carga la lista de episodios desde la API de TMDB
   */
  fetchSeasonEpisodes: async (seriesId = GRIMM_TMDB_ID, seasonNumber = GRIMM_DEFAULT_SEASON) => {
    set({ isLoading: true, error: null, seriesId, seasonNumber });
    try {
      const data = await getSeasonDetails(seriesId, seasonNumber);
      const episodeList = data.episodes || [];
      
      set({
        seasonDetails: data,
        episodes: episodeList,
        isLoading: false,
        error: null,
      });

      // Si aún no hay episodio seleccionado y hay episodios, preparamos el primero
      const currentSelected = get().selectedEpisode;
      if (!currentSelected && episodeList.length > 0) {
        const firstEpisode = episodeList[0];
        const initialUrl = buildGrimmVpsUrl(seasonNumber, firstEpisode.episode_number);
        set({
          selectedEpisode: firstEpisode,
          currentVideoUrl: initialUrl,
          isPlaying: false, // Inicia en pausa como requiere la especificación
        });
      }
    } catch (err: any) {
      console.error('[SeasonStore] Error al cargar temporada de TMDB:', err);
      set({
        isLoading: false,
        error: err?.message || 'Error al conectar con TMDB para obtener los episodios.',
      });
    }
  },

  /**
   * Selecciona un episodio de la lista, genera la URL del VPS y activa reproducción
   */
  selectEpisode: (episode: TMDBEpisode) => {
    const { seasonNumber } = get();
    const vpsUrl = buildGrimmVpsUrl(seasonNumber, episode.episode_number);
    set({
      selectedEpisode: episode,
      currentVideoUrl: vpsUrl,
      isPlaying: true,
    });
  },

  setSelectedEpisode: (episode: TMDBEpisode | null) => {
    if (!episode) {
      set({ selectedEpisode: null, currentVideoUrl: null, isPlaying: false });
      return;
    }
    const { seasonNumber } = get();
    const vpsUrl = buildGrimmVpsUrl(seasonNumber, episode.episode_number);
    set({
      selectedEpisode: episode,
      currentVideoUrl: vpsUrl,
    });
  },

  setIsPlaying: (isPlaying: boolean) => set({ isPlaying }),

  reset: () =>
    set({
      seasonDetails: null,
      episodes: [],
      selectedEpisode: null,
      currentVideoUrl: null,
      isLoading: false,
      error: null,
      isPlaying: false,
    }),
}));
