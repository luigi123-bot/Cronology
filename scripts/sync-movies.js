require('dotenv').config();
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
let customFolder = null;
for (let i = 0; i < args.length; i++) {
  if (args[i] === '-f' || args[i] === '--folder') {
    customFolder = args[i + 1];
  }
}

function extractDriveFolderId(input) {
  if (!input) return null;
  const match = input.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (match) return match[1];
  if (/^[a-zA-Z0-9_-]{25,45}$/.test(input.trim())) return input.trim();
  return null;
}

const MOVIES_FOLDER_ID = (customFolder && extractDriveFolderId(customFolder)) || '1q_Jh0Ijw425S-8jcuJ7ILb6dmcRLcj9_';
const MOVIES_FOLDER_URL = `https://drive.google.com/drive/folders/${MOVIES_FOLDER_ID}`;
const TMDB_BEARER = process.env.EXPO_PUBLIC_TMDB_BEARER_TOKEN || '';
const TMDB_API_KEY = process.env.EXPO_PUBLIC_TMDB_API_KEY || '';

// Helper to clean filename into a clean search query
function parseMovieFilename(filename) {
  // Remove extension
  let clean = filename.replace(/\.(?:mkv|mp4|avi|webm|ts|mov|m4v)$/i, '');
  
  // Extract year if present (e.g. 1990-2030)
  const yearMatch = clean.match(/\b(19\d\d|20\d\d)\b/);
  const year = yearMatch ? parseInt(yearMatch[1], 10) : null;

  // Remove common scene tags: 1080p, 720p, Dual, Lat, Latino, BluRay, WEB-DL, x264, etc.
  clean = clean.replace(/\b(19\d\d|20\d\d)\b.*$/i, ''); // cut from year onwards if present
  clean = clean.replace(/\b(1080p|720p|4k|2160p|dual|lat|latino|castellano|bluray|web-dl|webrip|x264|x265|hevc|aac)\b.*/gi, '');
  
  // Replace dots, underscores, dashes with spaces
  clean = clean.replace(/[._\-]+/g, ' ').trim();

  // Normalize Roman numerals / words: "Ii" -> "II"
  clean = clean.replace(/\bIi\b/g, 'II').replace(/\bIii\b/g, 'III').replace(/\bIv\b/g, 'IV');

  return { query: clean, year };
}

async function fetchTmdbMovie(query, year) {
  const url = new URL('https://api.themoviedb.org/3/search/movie');
  url.searchParams.set('query', query);
  url.searchParams.set('language', 'es-MX');
  url.searchParams.set('include_adult', 'false');
  if (year) {
    url.searchParams.set('year', String(year));
  }

  const headers = TMDB_BEARER
    ? { Authorization: `Bearer ${TMDB_BEARER}` }
    : {};
  if (!TMDB_BEARER && TMDB_API_KEY) {
    url.searchParams.set('api_key', TMDB_API_KEY);
  }

  const res = await fetch(url.toString(), { headers });
  if (!res.ok) {
    throw new Error(`TMDB error: ${res.status}`);
  }
  const data = await res.json();
  if (!data.results || data.results.length === 0) {
    // Retry without year if not found
    if (year) {
      return fetchTmdbMovie(query, null);
    }
    return null;
  }

  const match = data.results[0];

  // Fetch full details with videos for official trailer
  const detailUrl = new URL(`https://api.themoviedb.org/3/movie/${match.id}`);
  detailUrl.searchParams.set('language', 'es-MX');
  detailUrl.searchParams.set('append_to_response', 'videos');
  if (!TMDB_BEARER && TMDB_API_KEY) {
    detailUrl.searchParams.set('api_key', TMDB_API_KEY);
  }

  const detailRes = await fetch(detailUrl.toString(), { headers });
  if (!detailRes.ok) return match;
  return detailRes.json();
}

async function syncMovies() {
  console.log(`📡 Conectando a Google Drive para escanear películas: ${MOVIES_FOLDER_ID}...`);
  const res = await fetch(MOVIES_FOLDER_URL, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
  });

  if (!res.ok) {
    throw new Error(`Error al acceder a Google Drive: HTTP ${res.status}`);
  }

  const html = await res.text();
  const rawFiles = [];

  // Pattern 1: Escaped hex JSON format
  const hexPattern = /\\x5b\\x22([a-zA-Z0-9_-]{25,45})\\x22,\\x5b\\x22[a-zA-Z0-9_-]+\\x22\\x5d,\\x22([^\\"]+?)\\x22/gi;
  let match;
  while ((match = hexPattern.exec(html)) !== null) {
    const fileId = match[1];
    const fileName = match[2];
    if (fileId.length >= 28 && !fileId.startsWith('AAAAA') && !fileId.startsWith('googlelogo')) {
      rawFiles.push({ fileId, fileName });
    }
  }

  // Pattern 2: Standard JSON array if rendered unescaped
  const standardPattern = /\["([a-zA-Z0-9_-]{25,45})",\["[a-zA-Z0-9_-]+"\],"([^"]+?)"/gi;
  while ((match = standardPattern.exec(html)) !== null) {
    const fileId = match[1];
    const fileName = match[2];
    if (fileId.length >= 28 && !fileId.startsWith('AAAAA') && !fileId.startsWith('googlelogo')) {
      rawFiles.push({ fileId, fileName });
    }
  }

  // Filter video files
  const movieFiles = rawFiles.filter((f) => {
    const n = f.fileName.toLowerCase();
    return (
      n.endsWith('.mkv') ||
      n.endsWith('.mp4') ||
      n.endsWith('.avi') ||
      n.endsWith('.webm') ||
      n.endsWith('.mov') ||
      n.endsWith('.ts') ||
      /1080p|720p|dual|latino|bluray/.test(n)
    );
  });

  console.log(`🎬 Archivos de película encontrados en Drive: ${movieFiles.length}`);

  const movies = [];

  for (const file of movieFiles) {
    const { query, year } = parseMovieFilename(file.fileName);
    console.log(`\n🔍 Buscando metadatos en TMDB en español para: "${query}" (${year || 'año no especificado'})...`);

    let tmdbData = null;
    try {
      tmdbData = await fetchTmdbMovie(query, year);
    } catch (e) {
      console.warn(`[TMDB] Error al buscar ${query}:`, e.message);
    }

    // Determine trailer
    let youtubeTrailerId = null;
    if (tmdbData?.videos?.results?.length) {
      const vids = tmdbData.videos.results;
      const trailer =
        vids.find((v) => v.site === 'YouTube' && v.type === 'Trailer') ||
        vids.find((v) => v.site === 'YouTube');
      if (trailer) {
        youtubeTrailerId = trailer.key;
      }
    }

    // Quality detection
    const lower = file.fileName.toLowerCase();
    let quality = '1080p HD';
    if (lower.includes('dual')) {
      quality = '1080p Dual Latino / Inglés';
    } else if (lower.includes('lat')) {
      quality = '1080p HD Latino';
    } else if (lower.includes('4k') || lower.includes('2160p')) {
      quality = '4K Ultra HD';
    }

    const movieObj = {
      id: tmdbData ? `movie-${tmdbData.id}` : `movie-${file.fileId.slice(0, 10)}`,
      tmdbId: tmdbData?.id ?? 0,
      title: tmdbData?.title || query,
      originalTitle: tmdbData?.original_title || query,
      overview:
        tmdbData?.overview ||
        'Sinopsis en español no disponible en este momento.',
      releaseDate: tmdbData?.release_date || (year ? `${year}-01-01` : ''),
      year: year || (tmdbData?.release_date ? parseInt(tmdbData.release_date.slice(0, 4), 10) : 2026),
      posterUrl: tmdbData?.poster_path
        ? `https://image.tmdb.org/t/p/w500${tmdbData.poster_path}`
        : null,
      backdropUrl: tmdbData?.backdrop_path
        ? `https://image.tmdb.org/t/p/w1280${tmdbData.backdrop_path}`
        : null,
      genres: tmdbData?.genres ?? [{ id: 28, name: 'Acción' }],
      voteAverage: tmdbData?.vote_average ? String(tmdbData.vote_average.toFixed(1)) : '8.5',
      runtime: tmdbData?.runtime ?? 115,
      youtubeTrailerId,
      quality,
      driveFileId: file.fileId,
      driveFileName: file.fileName,
    };

    console.log(`✅ ¡Procesada con éxito! "${movieObj.title}"`);
    console.log(`   - Sinopsis: ${movieObj.overview.slice(0, 90)}...`);
    console.log(`   - Poster: ${movieObj.posterUrl}`);
    console.log(`   - Trailer YouTube: ${movieObj.youtubeTrailerId}`);
    movies.push(movieObj);
  }

  // Save to services/googleDriveMovies.ts
  const servicePath = path.join(__dirname, '..', 'services', 'googleDriveMovies.ts');
  const fileContent = `/**
 * services/googleDriveMovies.ts
 * Catálogo sincronizado automáticamente de películas alojadas en Google Drive
 * Generado con metadatos en español de TMDB, trailers oficiales y posters Full HD.
 */

export interface DriveMovie {
  id: string;
  tmdbId: number;
  title: string;
  originalTitle: string;
  overview: string;
  releaseDate: string;
  year: number;
  posterUrl: string | null;
  backdropUrl: string | null;
  genres: { id: number; name: string }[];
  voteAverage: string;
  runtime: number;
  youtubeTrailerId: string | null;
  quality: string;
  driveFileId: string;
  driveFileName: string;
}

export const DRIVE_MOVIES_FOLDER_ID = '${MOVIES_FOLDER_ID}';
export const DRIVE_MOVIES_FOLDER_URL = '${MOVIES_FOLDER_URL}';

export const DRIVE_MOVIES: DriveMovie[] = ${JSON.stringify(movies, null, 2)};

export function getMovieById(id: string): DriveMovie | undefined {
  return DRIVE_MOVIES.find((m) => m.id === id || String(m.tmdbId) === id || m.driveFileId === id);
}
`;

  fs.writeFileSync(servicePath, fileContent, 'utf8');
  console.log(`\n🎉 Archivo services/googleDriveMovies.ts generado con éxito con ${movies.length} película(s).`);
}

syncMovies().catch((err) => {
  console.error('Error al sincronizar películas de Google Drive:', err);
  process.exit(1);
});
