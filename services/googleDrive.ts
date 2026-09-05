/**
 * services/googleDrive.ts
 * Integración con carpetas y archivos de Google Drive para streaming directo en Cronology
 */

export const GRIMM_DRIVE_FOLDER_ID = '1lVqDRczGqe-3cYuTcD_NC2Nu0n955TjS';
export const GRIMM_DRIVE_FOLDER_URL = `https://drive.google.com/drive/folders/${GRIMM_DRIVE_FOLDER_ID}?usp=sharing`;

/**
 * Mapeo de episodios de Grimm a sus IDs de archivo de Google Drive.
 * Permite reproducción directa en Full HD con audio en Español Latino sin anuncios.
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
};

/**
 * URL de streaming directo de Google Drive (bypasea el procesamiento de /preview)
 * Funciona para archivos compartidos públicamente sin necesidad de transcoding
 */
export function getDriveStreamUrl(fileId: string): string {
  // Esta URL permite streaming parcial (Range requests) directo sin necesitar procesamiento
  return `https://drive.google.com/uc?export=download&id=${fileId}&confirm=t`;
}

/**
 * Obtiene el ID del archivo de Google Drive para un episodio específico
 */
export function getDriveFileForEpisode(
  seriesName: string,
  season: number,
  episode: number
): { fileId: string; title: string; quality: string; embedUrl: string; streamUrl: string } | null {
  const norm = seriesName.toLowerCase().trim();
  if (norm.includes('grimm')) {
    const key = `grimm-s${season}e${episode}`;
    const info = GRIMM_DRIVE_EPISODES[key];
    if (info) {
      return {
        ...info,
        // /preview requiere que Google transcodifique el video (puede tardar horas para MKV)
        embedUrl: `https://drive.google.com/file/d/${info.fileId}/preview`,
        // streamUrl usa el reproductor HTML5 nativo: carga directo sin procesar
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

  // Si ya es un ID de 28-44 caracteres alfanuméricos
  if (/^[a-zA-Z0-9_-]{25,45}$/.test(trimmed)) {
    return trimmed;
  }

  // /file/d/{id}/
  const fileMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileMatch) return fileMatch[1];

  // id={id}
  const idMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idMatch) return idMatch[1];

  // /folders/{id}
  const folderMatch = trimmed.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (folderMatch) return folderMatch[1];

  return null;
}
