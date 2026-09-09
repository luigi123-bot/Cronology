/**
 * Generador Dinámico de URLs de Streaming para VPS Nginx
 * Soporta Películas y Series de televisión de Cronology tanto en formato MKV como MP4.
 */

import syncedVpsCatalog from './syncedVpsCatalog.json';

export const DEFAULT_STREAMING_BASE_URL =
  process.env.EXPO_PUBLIC_STREAMING_BASE_URL || 'https://streaming.techzonne.online/';

/**
 * Genera un prefijo de archivo estructurado para series si no se proporciona uno explícito.
 * Ejemplo: "Grimm" -> "GRMM", "Chicago P.D." -> "CPD", "The Boys" -> "BOYS"
 */
export function deriveSeriesPrefix(title: string): string {
  if (!title) return 'EP';

  const clean = title.trim();
  const lower = clean.toLowerCase();

  // Mapeos conocidos / comunes del catálogo
  if (lower.includes('grimm')) return 'GRMM';
  if (lower.includes('chicago p.d') || lower.includes('chicago pd')) return 'CPD';
  if (lower.includes('chicago fire')) return 'CF';
  if (lower.includes('chicago med')) return 'CM';
  if (lower.includes('law & order') || lower.includes('law and order')) return 'SVU';

  // Si no hay mapeo predefinido, extraer consonantes o primeras 4 letras en mayúsculas
  const lettersOnly = clean.replace(/[^a-zA-Z0-9]/g, '');
  const consonants = clean.replace(/[^bcdfghjklmnpqrstvwxyzBCDFGHJKLMNPQRSTVWXYZ0-9]/g, '');
  
  if (consonants.length >= 3) {
    return consonants.slice(0, 4).toUpperCase();
  }
  return lettersOnly.slice(0, 4).toUpperCase() || 'EP';
}

export interface StreamMediaInfo {
  url: string;
  isMkv: boolean;
  format: 'mkv' | 'mp4';
  filename: string;
  alternativeUrl: string | null;
}

export function isMkvUrl(url?: string | null): boolean {
  if (!url) return false;
  return url.toLowerCase().includes('.mkv');
}

/**
 * Construye dinámicamente la URL de streaming hacia el VPS Nginx.
 * Detecta automáticamente si el recurso existe en formato .mkv o .mp4 en el catálogo sincronizado.
 */
export function buildStreamUrl(
  mediaTitle: string,
  seasonNum?: number | null,
  episodeNum?: number | null,
  isMovie?: boolean,
  prefix?: string,
  preferredFormat?: 'mkv' | 'mp4'
): string {
  const base = (
    process.env.EXPO_PUBLIC_STREAMING_BASE_URL || DEFAULT_STREAMING_BASE_URL
  ).replace(/\/+$/, '') + '/';

  const sanitizedTitle = mediaTitle.trim();

  // Si es película (o no se especificaron temporadas/episodios)
  if (isMovie || seasonNum == null || episodeNum == null) {
    const ext = preferredFormat || 'mp4';
    const rawPath = `${base}Movies/${sanitizedTitle}.${ext}`;
    return encodeURI(rawPath);
  }

  // 1. Verificar si el episodio existe exactamente en el catálogo sincronizado del VPS
  const lowerTitle = sanitizedTitle.toLowerCase();
  if (lowerTitle.includes('grimm') && syncedVpsCatalog?.grimmEpisodes) {
    const matched = syncedVpsCatalog.grimmEpisodes.find(
      (e: any) => e.seasonNumber === seasonNum && e.episodeNumber === episodeNum
    );
    if (matched?.url) {
      // Si el usuario especificó un formato y coincide con el catálogo o no, retornar
      return matched.url;
    }
  }

  // 2. Si es Season 5 de Grimm, patrón garantizado en MP4
  if (lowerTitle.includes('grimm') && seasonNum === 5) {
    return `${base}Series/Grimm/Season%205/GRMM5${episodeNum}.mp4`;
  }

  // 3. Si es Season 1 o 2 de Grimm y no estaba en catálogo exacto, patrón MKV
  if (lowerTitle.includes('grimm') && (seasonNum === 1 || seasonNum === 2)) {
    const epStr = String(episodeNum).padStart(2, '0');
    if (seasonNum === 1) {
      return `${base}Series/Grimm/Season%201/Grimm.1x${epStr}.HD1080p-lat.mkv`;
    }
    if (seasonNum === 2 && episodeNum <= 2) {
      return `${base}Series/Grimm/Season%202/Grimm.2x${epStr}.Dual.1080p-lat.mp4`;
    }
    return `${base}Series/Grimm/Season%202/Grimm.2x${epStr}.Dual.1080p-lat.mkv`;
  }

  // 4. Patrón dinámico general
  const ext = preferredFormat || 'mp4';
  const resolvedPrefix = prefix ? prefix.trim().toUpperCase() : deriveSeriesPrefix(sanitizedTitle);
  const rawPath = `${base}Series/${sanitizedTitle}/Season ${seasonNum}/${resolvedPrefix}${seasonNum}${episodeNum}.${ext}`;
  return encodeURI(rawPath);
}

/**
 * Obtiene información detallada de medios y alternativas de reproducción (MKV y MP4)
 */
export function getStreamMediaInfo(
  mediaTitle: string,
  seasonNum?: number | null,
  episodeNum?: number | null,
  isMovie?: boolean,
  prefix?: string
): StreamMediaInfo {
  const primaryUrl = buildStreamUrl(mediaTitle, seasonNum, episodeNum, isMovie, prefix);
  const isMkv = isMkvUrl(primaryUrl);
  const filename = decodeURIComponent(primaryUrl.split('/').pop() || `${mediaTitle}.${isMkv ? 'mkv' : 'mp4'}`);

  let alternativeUrl: string | null = null;
  if (isMkv) {
    // Generar candidato MP4 alternativo
    alternativeUrl = buildStreamUrl(mediaTitle, seasonNum, episodeNum, isMovie, prefix, 'mp4');
  } else {
    // Generar candidato MKV alternativo
    alternativeUrl = buildStreamUrl(mediaTitle, seasonNum, episodeNum, isMovie, prefix, 'mkv');
  }

  return {
    url: primaryUrl,
    isMkv,
    format: isMkv ? 'mkv' : 'mp4',
    filename,
    alternativeUrl: alternativeUrl !== primaryUrl ? alternativeUrl : null,
  };
}
