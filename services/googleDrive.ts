/**
 * services/googleDrive.ts
 * Integración con carpetas y archivos de Google Drive para streaming directo en Cronology.
 * Incluye sincronización y mapeo de episodios para Grimm y Chicago Med, además de
 * registro dinámico de carpetas de Drive por parte del administrador (Luis Gotopo).
 */

import { SYNCED_SERIES_DATA } from './syncedSeriesEpisodes';

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
  'grimm-s1e13': {
    fileId: '1SY2b6WeGpu84NWk3IRGzxL0ZK5FdBXn2',
    title: 'Grimm.1x13.Dual.1080p-lat.mkv',
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
  'grimm-s1e19': {
    fileId: '1k3Woq_HjhDfRfJpaF5ii3L2Aky91hNm_',
    title: 'Grimm.1x19.Dual.1080p-lat.mkv',
    quality: '1080p Dual Latino / Inglés',
  },
  'grimm-s1e20': {
    fileId: '1nD0n-bUkMdPhuvsXJDKFndg4paH9aT_T',
    title: 'Grimm.1x20.Dual.1080p-lat.mkv',
    quality: '1080p Dual Latino / Inglés',
  },
  'grimm-s1e21': {
    fileId: '1ygCst2mImjxFfQVGyAZpGuSsIH9UzjuJ',
    title: 'Grimm.1x21.Dual.1080p-lat.mkv',
    quality: '1080p Dual Latino / Inglés',
  },
  'grimm-s1e22': {
    fileId: '1de2spze4gB0Wvh2cIRMIL-SJ-FwMksGS',
    title: 'Grimm.1x22.Dual.1080p-lat.mkv',
    quality: '1080p Dual Latino / Inglés',
  },
  'grimm-s2e1': {
    fileId: '14Wj65ISotMPqbfewAU21OUCY1kDJLNj9',
    title: 'Grimm.2x01.Dual.1080p-lat.mp4',
    quality: '1080p Dual Latino / Inglés',
  },
  'grimm-s2e2': {
    fileId: '1WEHFqKHWTk3SzBTKgz1kZw_kK9LOZMKJ',
    title: 'Grimm.2x02.Dual.1080p-lat.mp4',
    quality: '1080p Dual Latino / Inglés',
  },
  'grimm-s2e3': {
    fileId: '18lQqsLYTqxM0OIGTS8dyT6oKrszDbkCp',
    title: 'Grimm.2x03.Dual.1080p-lat.mkv',
    quality: '1080p Dual Latino / Inglés',
  },
  'grimm-s2e4': {
    fileId: '15wA08oI24TY8t8lDMWoxXThu8L_oJx0u',
    title: 'Grimm.2x04.Dual.1080p-lat.mkv',
    quality: '1080p Dual Latino / Inglés',
  },
  'grimm-s2e5': {
    fileId: '1NlQ-i5Z9Cm-yjuTSZ0uVLQyVnjfyv2-1',
    title: 'Grimm.2x05.Dual.1080p-lat.mkv',
    quality: '1080p Dual Latino / Inglés',
  },
  'grimm-s2e6': {
    fileId: '1Dx0J2icLvyV6ONn8UFuXZV1d6YDy1I5F',
    title: 'Grimm.2x06.Dual.1080p-lat.mkv',
    quality: '1080p Dual Latino / Inglés',
  },
  'grimm-s2e7': {
    fileId: '12BPfIzxaBF4c1hT5wq23hBTJE0ki9Mz8',
    title: 'Grimm.2x07.Dual.1080p-lat.mkv',
    quality: '1080p Dual Latino / Inglés',
  },
  'grimm-s2e8': {
    fileId: '1S68fLFoGbdVj8J2cc8wf3-8UqRVocwJe',
    title: 'Grimm.2x08.Dual.1080p-lat.mkv',
    quality: '1080p Dual Latino / Inglés',
  },
  'grimm-s2e9': {
    fileId: '1sVeyXL_dsZDU1wMPlItj9MgeMyySl1ZF',
    title: 'Grimm.2x09.Dual.1080p-lat.mkv',
    quality: '1080p Dual Latino / Inglés',
  },
  'grimm-s2e10': {
    fileId: '1vStalSSo7uxZMhISdP2xMWtXq9qE1TY7',
    title: 'Grimm.2x10.Dual.1080p-lat.mkv',
    quality: '1080p Dual Latino / Inglés',
  },
  'grimm-s2e11': {
    fileId: '1y90b9xfMhTXdRUTMxV5W_XKqb17FBlq3',
    title: 'Grimm.2x11.Dual.1080p-lat.mkv',
    quality: '1080p Dual Latino / Inglés',
  },
  'grimm-s2e12': {
    fileId: '1UEB8YSNDHvGdzwIgk-ApAU-s3qR6ZuUN',
    title: 'Grimm.2x12.Dual.1080p-lat.mkv',
    quality: '1080p Dual Latino / Inglés',
  },
  'grimm-s2e13': {
    fileId: '1AmY9_eI3x_SiBiE-c_t81Us0uxbhiZgB',
    title: 'Grimm.2x13.Dual.1080p-lat.mkv',
    quality: '1080p Dual Latino / Inglés',
  },
  'grimm-s2e14': {
    fileId: '1EPVHTiP4UzGgYEFBHUGibvLxpiFtZO1W',
    title: 'Grimm.2x14.Dual.1080p-lat.mkv',
    quality: '1080p Dual Latino / Inglés',
  },
  'grimm-s2e15': {
    fileId: '1sz5LqUVgFdxDSzYpVl3bJ7DwMDNEAhpl',
    title: 'Grimm.2x15.Dual.1080p-lat.mkv',
    quality: '1080p Dual Latino / Inglés',
  },
  'grimm-s2e16': {
    fileId: '1eQgyXDb_JFv2zOQe7kjrA3KuLBWu2oSQ',
    title: 'Grimm.2x16.Dual.1080p-lat.mkv',
    quality: '1080p Dual Latino / Inglés',
  },
  'grimm-s2e17': {
    fileId: '1ZoxMpoaPz7og4PG_6Bc1utBrigk9g0Bs',
    title: 'Grimm.2x17.Dual.1080p-lat.mkv',
    quality: '1080p Dual Latino / Inglés',
  },
  'grimm-s2e18': {
    fileId: '1CO_taksgEHNGgkA0iUDAbuvNYcvTrse1',
    title: 'Grimm.2x18.Dual.1080p-lat.mkv',
    quality: '1080p Dual Latino / Inglés',
  },
  'grimm-s2e19': {
    fileId: '1EMls6FkD7QMrVrSIikeQRi-hfhoYXTkX',
    title: 'Grimm.2x19.Dual.1080p-lat.mkv',
    quality: '1080p Dual Latino / Inglés',
  },
  'grimm-s2e20': {
    fileId: '118fvEBoEFtktlYIYsmPhArZS1w_G34W5',
    title: 'Grimm.2x20.Dual.1080p-lat.mkv',
    quality: '1080p Dual Latino / Inglés',
  },
  'grimm-s2e21': {
    fileId: '1243kzbDM9KIaW_owr_SSXEzM1eXOT-6U',
    title: 'Grimm.2x21.Dual.1080p-lat.mkv',
    quality: '1080p Dual Latino / Inglés',
  },
  'grimm-s2e22': {
    fileId: '1vAwKUDiiOV782AYhZ6VQ0w4dKVuz08De',
    title: 'Grimm.2x22.Dual.1080p-lat.mkv',
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
  // Series hardcodeadas
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

  // Merge series sincronizadas por sync-series.js / sync-drive.js
  if (typeof SYNCED_SERIES_DATA !== 'undefined' && SYNCED_SERIES_DATA) {
    for (const [key, entry] of Object.entries(SYNCED_SERIES_DATA)) {
      defaults[key] = {
        seriesKey: entry.seriesKey,
        seriesName: entry.seriesName,
        folderUrl: entry.folderUrl,
        folderId: entry.folderId,
        updatedAt: Date.now(),
        episodesCount: Object.keys(entry.episodes || {}).length,
        episodes: entry.episodes || {},
      };
    }
  }

  if (typeof window === 'undefined') return defaults;

  try {
    const raw = localStorage.getItem(CUSTOM_DRIVE_CONFIG_KEY);
    if (!raw) return defaults;
    const stored: Record<string, DriveSeriesConfig> = JSON.parse(raw);

    // Merge seguro: nunca permitir que un registro vacío de localStorage
    // sobreescriba una serie que ya tiene episodios en defaults / SYNCED_SERIES_DATA
    const merged: Record<string, DriveSeriesConfig> = { ...defaults };
    for (const [k, conf] of Object.entries(stored)) {
      if (!merged[k]) {
        merged[k] = conf;
      } else {
        const storedCount = conf.episodes ? Object.keys(conf.episodes).length : 0;
        const defaultCount = merged[k].episodes ? Object.keys(merged[k].episodes).length : 0;
        merged[k] = {
          ...merged[k],
          ...conf,
          episodes: storedCount >= defaultCount ? conf.episodes : merged[k].episodes,
          episodesCount: Math.max(storedCount, defaultCount),
        };
      }
    }
    return merged;
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

  console.log('[saveRegisteredDriveFolder] 📺 Serie:', seriesName);
  console.log('[saveRegisteredDriveFolder] 🔑 Key:', seriesKey);
  console.log('[saveRegisteredDriveFolder] 📁 Folder ID:', folderId);
  console.log('[saveRegisteredDriveFolder] 🔗 URL:', folderUrl);

  let episodesToSave = customEpisodes || {};
  console.log('[saveRegisteredDriveFolder] 📋 Episodios custom proporcionados:', Object.keys(episodesToSave).length);

  // Buscar episodios en series hardcodeadas
  if (Object.keys(episodesToSave).length === 0) {
    if (seriesKey.includes('med')) {
      episodesToSave = CHICAGO_MED_DRIVE_EPISODES;
      console.log('[saveRegisteredDriveFolder] ↪ Usando episodios hardcoded de Chicago Med:', Object.keys(episodesToSave).length);
    } else if (seriesKey.includes('grimm')) {
      episodesToSave = GRIMM_DRIVE_EPISODES;
      console.log('[saveRegisteredDriveFolder] ↪ Usando episodios hardcoded de Grimm:', Object.keys(episodesToSave).length);
    }
  }

  // Buscar episodios en series sincronizadas por sync-series.js
  if (Object.keys(episodesToSave).length === 0 && SYNCED_SERIES_DATA[seriesKey]) {
    episodesToSave = SYNCED_SERIES_DATA[seriesKey].episodes;
    console.log('[saveRegisteredDriveFolder] ↪ Usando episodios sincronizados (sync-series.js):', Object.keys(episodesToSave).length);
  }

  if (Object.keys(episodesToSave).length === 0) {
    console.warn('[saveRegisteredDriveFolder] ⚠️ No se encontraron episodios para esta serie.');
    console.warn('[saveRegisteredDriveFolder] 💡 Para sincronizar episodios, ejecuta:');
    console.warn(`[saveRegisteredDriveFolder]    npm run sync:series -- -s "${seriesName}" -f "${folderUrl}"`);
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

  console.log('[saveRegisteredDriveFolder] ✅ Config generada:', {
    seriesKey: config.seriesKey,
    seriesName: config.seriesName,
    episodesCount: config.episodesCount,
  });

  if (typeof window !== 'undefined') {
    try {
      const all = getRegisteredDriveFolders();
      all[seriesKey] = config;
      localStorage.setItem(CUSTOM_DRIVE_CONFIG_KEY, JSON.stringify(all));
      console.log('[saveRegisteredDriveFolder] 💾 Guardado en localStorage OK');
    } catch (e) {
      console.error('[saveRegisteredDriveFolder] ❌ Error al guardar en localStorage:', e);
    }
  }

  return config;
}

/**
 * Elimina una carpeta registrada de Google Drive del almacenamiento local.
 */
export function removeRegisteredDriveFolder(seriesKey: string): void {
  if (typeof window === 'undefined') return;
  try {
    const all = getRegisteredDriveFolders();
    delete all[seriesKey];
    localStorage.setItem(CUSTOM_DRIVE_CONFIG_KEY, JSON.stringify(all));
  } catch (e) {
    console.error('Failed to remove drive folder config:', e);
  }
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
  if (!seriesName) return null;

  const norm = seriesName.toLowerCase().trim();
  const normKey = norm.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const epSuffix = `s${season}e${episode}`;

  console.log(`[getDriveFileForEpisode] 🔍 Buscando: "${seriesName}" (key: "${normKey}"), T${season}E${episode}`);

  // 1. Coincidencia directa en SYNCED_SERIES_DATA (garantía infalible de sync-drive / sync-series)
  if (typeof SYNCED_SERIES_DATA !== 'undefined' && SYNCED_SERIES_DATA) {
    for (const [key, entry] of Object.entries(SYNCED_SERIES_DATA)) {
      const match =
        key === normKey ||
        norm.includes(key) ||
        normKey.includes(key) ||
        key.includes(normKey) ||
        norm.includes(entry.seriesName.toLowerCase()) ||
        entry.seriesName.toLowerCase().includes(norm);

      if (match && entry.episodes) {
        const found =
          entry.episodes[`${key}-${epSuffix}`] ||
          entry.episodes[`${normKey}-${epSuffix}`];

        if (found) {
          console.log(`[getDriveFileForEpisode] ✅ Encontrado en SYNCED_SERIES_DATA [${key}]:`, found.title);
          return {
            ...found,
            embedUrl: `https://drive.google.com/file/d/${found.fileId}/preview`,
            streamUrl: getDriveStreamUrl(found.fileId),
          };
        }
      }
    }
  }

  // 2. Coincidencia directa con Grimm
  if (norm.includes('grimm')) {
    const key = `grimm-${epSuffix}`;
    const info = GRIMM_DRIVE_EPISODES[key];
    if (info) {
      console.log(`[getDriveFileForEpisode] ✅ Encontrado en GRIMM_DRIVE_EPISODES:`, info.title);
      return {
        ...info,
        embedUrl: `https://drive.google.com/file/d/${info.fileId}/preview`,
        streamUrl: getDriveStreamUrl(info.fileId),
      };
    }
  }

  // 3. Coincidencia directa con Chicago Med
  if (norm.includes('med')) {
    const key = `chicago-med-${epSuffix}`;
    const info = CHICAGO_MED_DRIVE_EPISODES[key];
    if (info) {
      console.log(`[getDriveFileForEpisode] ✅ Encontrado en CHICAGO_MED_DRIVE_EPISODES:`, info.title);
      return {
        ...info,
        embedUrl: `https://drive.google.com/file/d/${info.fileId}/preview`,
        streamUrl: getDriveStreamUrl(info.fileId),
      };
    }
  }

  // 4. Buscar en carpetas configuradas por el usuario (localStorage y runtime)
  const allFolders = getRegisteredDriveFolders();
  for (const [key, conf] of Object.entries(allFolders)) {
    const match =
      key === normKey ||
      norm.includes(key) ||
      normKey.includes(key) ||
      key.includes(normKey) ||
      norm.includes(conf.seriesName.toLowerCase()) ||
      conf.seriesName.toLowerCase().includes(norm);

    if (match && conf.episodes) {
      const found =
        conf.episodes[`${key}-${epSuffix}`] ||
        conf.episodes[`${normKey}-${epSuffix}`];

      if (found) {
        console.log(`[getDriveFileForEpisode] ✅ Encontrado en allFolders [${key}]:`, found.title);
        return {
          ...found,
          embedUrl: `https://drive.google.com/file/d/${found.fileId}/preview`,
          streamUrl: getDriveStreamUrl(found.fileId),
        };
      }
    }
  }

  console.warn(`[getDriveFileForEpisode] ❌ No se encontró archivo en Drive para "${seriesName}" T${season}E${episode}`);
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
