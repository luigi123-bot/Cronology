/**
 * services/googleDrive.ts
 * Integración con carpetas y archivos de Google Drive para streaming directo en Cronology.
 * Incluye sincronización y mapeo de episodios para Grimm y Chicago Med, además de
 * registro dinámico de carpetas de Drive por parte del administrador (Luis Gotopo).
 */

export const GRIMM_DRIVE_FOLDER_ID = '1lVqDRczGqe-3cYuTcD_NC2Nu0n955TjS';
export const GRIMM_DRIVE_FOLDER_URL = `https://drive.google.com/drive/folders/${GRIMM_DRIVE_FOLDER_ID}?usp=sharing`;

export const CHICAGO_MED_DRIVE_FOLDER_ID = '1R6HGda0taH2liyBHvasI7_vmpsMCyaJa';
export const CHICAGO_MED_DRIVE_FOLDER_URL = `https://drive.google.com/drive/folders/${CHICAGO_MED_DRIVE_FOLDER_ID}?usp=sharing`;

/**
 * Mapeo de episodios de Grimm a sus IDs de archivo de Google Drive.
 */
export const GRIMM_DRIVE_EPISODES: Record<string, { fileId: string; title: string; quality: string }> = {
  'grimm-s1e1': {
    fileId: '12anfnPB2mtTG5G0fi_4nV9hMvtrfk7Jy',
    title: 'Grimm.1x01.HD1080p-lat.mkv',
    quality: '1080p HD Latino',
  },
  'grimm-s1e2': {
    fileId: '1g17xPECwlTphlS8kcR5qpkA3EeMovBQd',
    title: 'Grimm.1x02.HD1080p-lat.mkv',
    quality: '1080p HD Latino',
  },
  'grimm-s1e3': {
    fileId: '1cbPeKMJx7W5Pv5WzpkryEuLdPq9llycv',
    title: 'Grimm.1x03.HD1080p-lat.mkv',
    quality: '1080p HD Latino',
  },
  'grimm-s1e4': {
    fileId: '1mV6Ir5IEfEjDyAR4mr4o2GdgrYiP-8qq',
    title: 'Grimm.1x04.HD1080p-lat.mkv',
    quality: '1080p HD Latino',
  },
  'grimm-s1e5': {
    fileId: '1hF9Vya-t8KuJD8iuqYeM_k_kKlZRkCAF',
    title: 'Grimm.1x05.HD1080p-lat.mkv',
    quality: '1080p HD Latino',
  },
  'grimm-s1e6': {
    fileId: '1GFrta7R5cRQLfW0RcLwk7jUoZAAMVZgY',
    title: 'Grimm.1x06.HD1080p-lat.mkv',
    quality: '1080p HD Latino',
  },
  'grimm-s1e7': {
    fileId: '1bc4dBKx5vUOCgSILFDBo554q-mz01Hjp',
    title: 'Grimm.1x07.HD1080p-lat.mkv',
    quality: '1080p HD Latino',
  },
  'grimm-s1e8': {
    fileId: '1-95Yez-3chUZK_t_BkkiDYgFMYaGMqVL',
    title: 'Grimm.1x08.HD1080p-lat.mkv',
    quality: '1080p HD Latino',
  },
  'grimm-s1e10': {
    fileId: '1uBTnS2cgqxbLQd6mq_l4bTsGZYabD3fK',
    title: 'Grimm.1x10.HD1080p-lat.mkv',
    quality: '1080p HD Latino',
  },
  'grimm-s1e11': {
    fileId: '1guos_LmcB-Tg1pbf2T959Klw_a6lSUfZ',
    title: 'Grimm.1x11.Dual.1080p-lat.mkv',
    quality: '1080p Dual Latino / Inglés',
  },
  'grimm-s1e12': {
    fileId: '18Ak9YC7zoUdXvLJ99lu_jbZnMvmYRomg',
    title: 'Grimm.1x12.Dual.1080p-lat.mkv',
    quality: '1080p Dual Latino / Inglés',
  },
  'grimm-s1e14': {
    fileId: '1HUWtoiKZp537AlKNyTENBxFFFPbWgz0X',
    title: 'Grimm.1x14.Dual.1080p-lat.mkv',
    quality: '1080p Dual Latino / Inglés',
  },
  'grimm-s1e15': {
    fileId: '1JR5tckk_pASBjiUm29hWxuEm9JI0T9o-',
    title: 'Grimm.1x15.Dual.1080p-lat.mkv',
    quality: '1080p Dual Latino / Inglés',
  },
  'grimm-s1e16': {
    fileId: '15koE9OTJdUyUwkEhmNUKp3TymabT0oq7',
    title: 'Grimm.1x16.Dual.1080p-lat.mkv',
    quality: '1080p Dual Latino / Inglés',
  },
  'grimm-s1e17': {
    fileId: '1ZFd7DRbz3Hqy7m7lpE_Fq3fd3CxayS7V',
    title: 'Grimm.1x17.Dual.1080p-lat.mkv',
    quality: '1080p Dual Latino / Inglés',
  },
  'grimm-s1e18': {
    fileId: '1inGcre4hPFW2p7dC0vjrJ2RgrnV_ncjR',
    title: 'Grimm.1x18.Dual.1080p-lat.mkv',
    quality: '1080p Dual Latino / Inglés',
  },
};

/**
 * Mapeo completo de episodios de Chicago Med Temporada 1 desde la carpeta de Google Drive.
 */
export const CHICAGO_MED_DRIVE_EPISODES: Record<string, { fileId: string; title: string; quality: string }> = {
  'chicago-med-s1e1': {
    fileId: '1T4F7lo_jFubqCRLrMe3D54xltaHc0dYB',
    title: 'Chicago.Med.S01E01.2015.720p-Dual-Lat.mkv',
    quality: '720p Dual Latino / Inglés',
  },
  'chicago-med-s1e2': {
    fileId: '1jeRc5v5oK849bkUJrNWNPsBkus0Ibi6Q',
    title: 'Chicago.Med.S01E02.2015.720p-Dual-Lat.mkv',
    quality: '720p Dual Latino / Inglés',
  },
  'chicago-med-s1e3': {
    fileId: '1iui2-O7A7-gTB_sT02G049e7J3AeMjqE',
    title: 'Chicago.Med.S01E03.2015.720p-Dual-Lat.mkv',
    quality: '720p Dual Latino / Inglés',
  },
  'chicago-med-s1e4': {
    fileId: '1tDaWbppKRtJ9wJFGkI47gY_vAFAEw76N',
    title: 'Chicago.Med.S01E04.2015.720p-Dual-Lat.mkv',
    quality: '720p Dual Latino / Inglés',
  },
  'chicago-med-s1e5': {
    fileId: '1WdzAns4fKH4enrBeSVN-_NfnAaZ0-JHf',
    title: 'Chicago.Med.S01E05.2015.720p-Dual-Lat.mkv',
    quality: '720p Dual Latino / Inglés',
  },
  'chicago-med-s1e6': {
    fileId: '1i960o4QYf2hb8iSNXUS0mLpCEnP2z0Hf',
    title: 'Chicago.Med.S01E06.2015.720p-Dual-Lat.mkv',
    quality: '720p Dual Latino / Inglés',
  },
  'chicago-med-s1e7': {
    fileId: '1fxv1JXHZ8B_QaHmtS36LftU8QvY7GcKl',
    title: 'Chicago.Med.S01E07.2015.720p-Dual-Lat.mkv',
    quality: '720p Dual Latino / Inglés',
  },
  'chicago-med-s1e8': {
    fileId: '1r_r-VoJC--mxRQasj0D0Z4Ak58IXnYOJ',
    title: 'Chicago.Med.S01E08.2015.720p-Dual-Lat.mkv',
    quality: '720p Dual Latino / Inglés',
  },
  'chicago-med-s1e9': {
    fileId: '1qviaV8G8NH5q5IMF7-AYfWpGpT5RVpNY',
    title: 'Chicago.Med.S01E09.2015.720p-Dual-Lat.mkv',
    quality: '720p Dual Latino / Inglés',
  },
  'chicago-med-s1e10': {
    fileId: '1cfUxwqnhV6vKHRcHgvUIaZUwhNJbrtD3',
    title: 'Chicago.Med.S01E10.2015.720p-Dual-Lat.mkv',
    quality: '720p Dual Latino / Inglés',
  },
  'chicago-med-s1e11': {
    fileId: '1OG3wPxgQCs3JhV1nK08mQ6XiyWVduygc',
    title: 'Chicago.Med.S01E11.2015.720p-Dual-Lat.mkv',
    quality: '720p Dual Latino / Inglés',
  },
  'chicago-med-s1e12': {
    fileId: '1eOdr5zI8t7SVwVTjl29LnL7acFk0pAZt',
    title: 'Chicago.Med.S01E12.2015.720p-Dual-Lat.mkv',
    quality: '720p Dual Latino / Inglés',
  },
  'chicago-med-s1e13': {
    fileId: '1jM_DIRW1N3gd5rGnEsHi5ZXIPjLRfAmn',
    title: 'Chicago.Med.S01E13.2015.720p-Dual-Lat.mkv',
    quality: '720p Dual Latino / Inglés',
  },
  'chicago-med-s1e14': {
    fileId: '1aOXhQAhGXCBZV3PVF3Ds_8NMewYi7S-C',
    title: 'Chicago.Med.S01E14.2015.720p-Dual-Lat.mkv',
    quality: '720p Dual Latino / Inglés',
  },
  'chicago-med-s1e15': {
    fileId: '12IsRs8VKhpa0CP0wUeoAWRM_kiJGI3zB',
    title: 'Chicago.Med.S01E15.2015.720p-Dual-Lat.mkv',
    quality: '720p Dual Latino / Inglés',
  },
  'chicago-med-s1e16': {
    fileId: '1zBnUA6wt8RQwUyO3wuo4eBtAupK9xFC3',
    title: 'Chicago.Med.S01E16.2015.720p-Dual-Lat.mkv',
    quality: '720p Dual Latino / Inglés',
  },
  'chicago-med-s1e17': {
    fileId: '1-tuFc8Xo0uRmtltv0raJsj27WsIJw_nu',
    title: 'Chicago.Med.S01E17.2015.720p-Dual-Lat.mkv',
    quality: '720p Dual Latino / Inglés',
  },
  'chicago-med-s1e18': {
    fileId: '1MFol6HUQBQrwugKmJwMoXB9-izRveQcg',
    title: 'Chicago.Med.S01E18.2015.720p-Dual-Lat.mkv',
    quality: '720p Dual Latino / Inglés',
  },
};

export interface DriveSeriesConfig {
  seriesKey: string;
  seriesName: string;
  folderUrl: string;
  folderId: string;
  updatedAt: number;
  episodesCount: number;
  episodes: Record<string, { fileId: string; title: string; quality: string }>;
}

const CUSTOM_DRIVE_CONFIG_KEY = 'cronology_custom_drive_series';

/**
 * Obtiene todas las carpetas registradas para series (pre-configuradas + añadidas por Luis).
 */
export function getRegisteredDriveFolders(): Record<string, DriveSeriesConfig> {
  const defaults: Record<string, DriveSeriesConfig> = {
    'chicago-med': {
      seriesKey: 'chicago-med',
      seriesName: 'Chicago Med',
      folderUrl: CHICAGO_MED_DRIVE_FOLDER_URL,
      folderId: CHICAGO_MED_DRIVE_FOLDER_ID,
      updatedAt: Date.now(),
      episodesCount: Object.keys(CHICAGO_MED_DRIVE_EPISODES).length,
      episodes: CHICAGO_MED_DRIVE_EPISODES,
    },
    'grimm': {
      seriesKey: 'grimm',
      seriesName: 'Grimm',
      folderUrl: GRIMM_DRIVE_FOLDER_URL,
      folderId: GRIMM_DRIVE_FOLDER_ID,
      updatedAt: Date.now(),
      episodesCount: Object.keys(GRIMM_DRIVE_EPISODES).length,
      episodes: GRIMM_DRIVE_EPISODES,
    },
  };

  if (typeof window === 'undefined') return defaults;

  try {
    const raw = localStorage.getItem(CUSTOM_DRIVE_CONFIG_KEY);
    if (!raw) return defaults;
    const stored: Record<string, DriveSeriesConfig> = JSON.parse(raw);
    return { ...defaults, ...stored };
  } catch {
    return defaults;
  }
}

/**
 * Guarda o actualiza una carpeta de Google Drive para una serie
 */
export function saveRegisteredDriveFolder(
  seriesName: string,
  folderUrl: string,
  customEpisodes?: Record<string, { fileId: string; title: string; quality: string }>
): DriveSeriesConfig {
  const folderId = extractDriveId(folderUrl) || '';
  const seriesKey = seriesName.toLowerCase().replace(/[^a-z0-9]/g, '-');

  let episodesToSave = customEpisodes || {};
  if (Object.keys(episodesToSave).length === 0) {
    if (seriesKey.includes('med')) {
      episodesToSave = CHICAGO_MED_DRIVE_EPISODES;
    } else if (seriesKey.includes('grimm')) {
      episodesToSave = GRIMM_DRIVE_EPISODES;
    }
  }

  const config: DriveSeriesConfig = {
    seriesKey,
    seriesName,
    folderUrl,
    folderId,
    updatedAt: Date.now(),
    episodesCount: Object.keys(episodesToSave).length,
    episodes: episodesToSave,
  };

  if (typeof window !== 'undefined') {
    try {
      const all = getRegisteredDriveFolders();
      all[seriesKey] = config;
      localStorage.setItem(CUSTOM_DRIVE_CONFIG_KEY, JSON.stringify(all));
    } catch (e) {
      console.error('Failed to save drive folder config:', e);
    }
  }

  return config;
}

/**
 * URL de streaming directo de Google Drive
 */
export function getDriveStreamUrl(fileId: string): string {
  return `https://drive.google.com/uc?export=download&id=${fileId}&confirm=t`;
}

/**
 * Obtiene el archivo de Google Drive para un episodio específico.
 * Busca en las carpetas registradas dinámicamente, luego en Chicago Med y en Grimm.
 */
export function getDriveFileForEpisode(
  seriesName: string,
  season: number,
  episode: number
): { fileId: string; title: string; quality: string; embedUrl: string; streamUrl: string } | null {
  const norm = seriesName.toLowerCase().trim();

  // 1. Buscar en carpetas configuradas por el usuario
  const allFolders = getRegisteredDriveFolders();
  for (const [key, conf] of Object.entries(allFolders)) {
    if (norm.includes(key) || norm.includes(conf.seriesName.toLowerCase())) {
      const epKey = `${key}-s${season}e${episode}`;
      const found = conf.episodes[epKey];
      if (found) {
        return {
          ...found,
          embedUrl: `https://drive.google.com/file/d/${found.fileId}/preview`,
          streamUrl: getDriveStreamUrl(found.fileId),
        };
      }
    }
  }

  // 2. Coincidencia directa con Chicago Med
  if (norm.includes('med')) {
    const key = `chicago-med-s${season}e${episode}`;
    const info = CHICAGO_MED_DRIVE_EPISODES[key];
    if (info) {
      return {
        ...info,
        embedUrl: `https://drive.google.com/file/d/${info.fileId}/preview`,
        streamUrl: getDriveStreamUrl(info.fileId),
      };
    }
  }

  // 3. Coincidencia directa con Grimm
  if (norm.includes('grimm')) {
    const key = `grimm-s${season}e${episode}`;
    const info = GRIMM_DRIVE_EPISODES[key];
    if (info) {
      return {
        ...info,
        embedUrl: `https://drive.google.com/file/d/${info.fileId}/preview`,
        streamUrl: getDriveStreamUrl(info.fileId),
      };
    }
  }

  return null;
}

/**
 * Extrae el ID de un archivo o carpeta de Google Drive a partir de una URL
 */
export function extractDriveId(urlOrId: string): string | null {
  if (!urlOrId) return null;
  const trimmed = urlOrId.trim();

  if (/^[a-zA-Z0-9_-]{25,45}$/.test(trimmed)) {
    return trimmed;
  }

  const fileMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileMatch) return fileMatch[1];

  const idMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idMatch) return idMatch[1];

  const folderMatch = trimmed.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (folderMatch) return folderMatch[1];

  return null;
}
