/**
 * Generador Dinámico de URLs de Streaming para VPS Nginx
 * Soporta Películas y Series de televisión de Cronology.
 */

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

export interface BuildStreamUrlParams {
  mediaTitle: string;
  seasonNum?: number | null;
  episodeNum?: number | null;
  isMovie?: boolean;
  prefix?: string;
  customBaseUrl?: string;
}

/**
 * Construye dinámicamente la URL de streaming hacia el VPS Nginx.
 *
 * Patrón Película:
 *  base + Movies/{mediaTitle}.mp4
 *  Ejemplo: https://streaming.techzonne.online/Movies/Inception.mp4
 *
 * Patrón Serie:
 *  base + Series/{mediaTitle}/Season {seasonNum}/{Prefijo}{seasonNum}{episodeNum}.mp4
 *  Ejemplo: https://streaming.techzonne.online/Series/Grimm/Season%205/GRMM51.mp4
 *
 * Sanitiza automáticamente los espacios y caracteres especiales mediante encodeURI.
 */
import syncedVpsCatalog from './syncedVpsCatalog.json';

export function buildStreamUrl(
  mediaTitle: string,
  seasonNum?: number | null,
  episodeNum?: number | null,
  isMovie?: boolean,
  prefix?: string
): string {
  const base = (
    process.env.EXPO_PUBLIC_STREAMING_BASE_URL || DEFAULT_STREAMING_BASE_URL
  ).replace(/\/+$/, '') + '/';

  const sanitizedTitle = mediaTitle.trim();

  // Si es película (o no se especificaron temporadas/episodios)
  if (isMovie || seasonNum == null || episodeNum == null) {
    const rawPath = `${base}Movies/${sanitizedTitle}.mp4`;
    return encodeURI(rawPath);
  }

  // 1. Verificar si el episodio existe exactamente en el catálogo sincronizado del VPS
  const lowerTitle = sanitizedTitle.toLowerCase();
  if (lowerTitle.includes('grimm') && syncedVpsCatalog?.grimmEpisodes) {
    const matched = syncedVpsCatalog.grimmEpisodes.find(
      (e: any) => e.seasonNumber === seasonNum && e.episodeNumber === episodeNum
    );
    if (matched?.url) {
      return matched.url;
    }
  }

  // 2. Si es Season 5 de Grimm, patrón garantizado
  if (lowerTitle.includes('grimm') && seasonNum === 5) {
    return `${base}Series/Grimm/Season%205/GRMM5${episodeNum}.mp4`;
  }

  // 3. Patrón dinámico general
  const resolvedPrefix = prefix ? prefix.trim().toUpperCase() : deriveSeriesPrefix(sanitizedTitle);
  const rawPath = `${base}Series/${sanitizedTitle}/Season ${seasonNum}/${resolvedPrefix}${seasonNum}${episodeNum}.mp4`;
  return encodeURI(rawPath);
}
