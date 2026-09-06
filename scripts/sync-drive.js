require('dotenv').config();
const fs = require('fs');
const path = require('path');

const FOLDER_ID = '1lVqDRczGqe-3cYuTcD_NC2Nu0n955TjS';
const FOLDER_URL = `https://drive.google.com/drive/folders/${FOLDER_ID}`;

// ══════════════════════════════════════════════════════════════════════════════
// 📺 Cronology - Sincronizador Multi-Serie Inteligente de Google Drive
// Detecta automáticamente qué serie corresponde a cada archivo en la carpeta
// y organiza cada episodio en su serie correcta (Grimm, Gravity Falls, etc.)
// ══════════════════════════════════════════════════════════════════════════════

async function syncDrive() {
  console.log(`\n═══════════════════════════════════════════════════════════`);
  console.log(`📡 Conectando a Google Drive para escanear carpeta:`);
  console.log(`   📁 ID:  ${FOLDER_ID}`);
  console.log(`   🔗 URL: ${FOLDER_URL}`);
  console.log(`═══════════════════════════════════════════════════════════\n`);

  const res = await fetch(FOLDER_URL, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
  });

  if (!res.ok) {
    throw new Error(`Error al acceder a Google Drive: HTTP ${res.status}`);
  }

  const html = await res.text();
  const rawFiles = [];
  const seenIds = new Set();

  // Pattern 1: Escaped hex JSON format
  const hexPattern = /\\x5b\\x22([a-zA-Z0-9_-]{25,45})\\x22,\\x5b\\x22[a-zA-Z0-9_-]+\\x22\\x5d,\\x22([^\\"]+?)\\x22/gi;
  let match;
  while ((match = hexPattern.exec(html)) !== null) {
    const fileId = match[1];
    const name = match[2];
    if (fileId.length >= 28 && !fileId.startsWith('AAAAA') && !seenIds.has(fileId)) {
      seenIds.add(fileId);
      rawFiles.push({ fileId, name });
    }
  }

  // Pattern 2: Standard JSON array if rendered unescaped
  const standardPattern = /\["([a-zA-Z0-9_-]{25,45})",\["[a-zA-Z0-9_-]+"\],"([^"]+?)"/gi;
  while ((match = standardPattern.exec(html)) !== null) {
    const fileId = match[1];
    const name = match[2];
    if (fileId.length >= 28 && !fileId.startsWith('AAAAA') && !seenIds.has(fileId)) {
      seenIds.add(fileId);
      rawFiles.push({ fileId, name });
    }
  }

  console.log(`📂 Total archivos encontrados en Drive: ${rawFiles.length}\n`);

  // Map to group episodes by series
  // key -> { seriesKey, seriesName, episodes: {} }
  const seriesGroups = {
    'grimm': {
      seriesKey: 'grimm',
      seriesName: 'Grimm',
      folderUrl: FOLDER_URL,
      folderId: FOLDER_ID,
      episodes: {},
    },
    'gravity-falls': {
      seriesKey: 'gravity-falls',
      seriesName: 'Gravity Falls',
      folderUrl: FOLDER_URL,
      folderId: FOLDER_ID,
      episodes: {},
    },
  };

  for (const file of rawFiles) {
    parseMultiSeriesEpisode(file.name, file.fileId, seriesGroups);
  }

  // ─── 1. Procesar GRIMM y guardar en services/googleDrive.ts ────────────────
  const grimmGroup = seriesGroups['grimm'];
  const grimmScanned = grimmGroup ? grimmGroup.episodes : {};

  const servicePath = path.join(__dirname, '..', 'services', 'googleDrive.ts');
  let serviceContent = fs.readFileSync(servicePath, 'utf8');

  // Leer episodios actuales de Grimm (filtrando los que por error tenían "gravity")
  const existingGrimmEpisodes = {};
  const existingRegex = /'(grimm-s[1-9]\d*e[1-9]\d*)':\s*\{\s*fileId:\s*'([^']+)',\s*title:\s*'([^']+)',\s*quality:\s*'([^']+)',?\s*\}/g;
  let exMatch;
  while ((exMatch = existingRegex.exec(serviceContent)) !== null) {
    const key = exMatch[1];
    const fileId = exMatch[2];
    const title = exMatch[3];
    const quality = exMatch[4];
    // Excluir cualquier archivo que pertenezca a Gravity Falls
    if (/gravity/i.test(title)) continue;
    if (fileId.length >= 28 && !fileId.startsWith('AAAAA')) {
      existingGrimmEpisodes[key] = { fileId, title, quality };
    }
  }

  // Merge Grimm: los escaneados tienen prioridad
  const mergedGrimm = { ...existingGrimmEpisodes, ...grimmScanned };

  console.log(`───────────────────────────────────────────────────────────`);
  console.log(`📺 Grimm: ${Object.keys(mergedGrimm).length} capítulos organizados`);
  Object.keys(mergedGrimm)
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    .forEach((k) => console.log(`   ✅ ${k} -> ${mergedGrimm[k].title}`));

  // Escribir GRIMM_DRIVE_EPISODES en services/googleDrive.ts
  const serializedGrimm = Object.entries(mergedGrimm)
    .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
    .map(
      ([key, data]) => `  '${key}': {
    fileId: '${data.fileId}',
    title: '${data.title}',
    quality: '${data.quality}',
  },`
    )
    .join('\n');

  const replacementBlock = `export const GRIMM_DRIVE_EPISODES: Record<string, { fileId: string; title: string; quality: string }> = {\n${serializedGrimm}\n};`;

  serviceContent = serviceContent.replace(
    /export const GRIMM_DRIVE_EPISODES: Record<string, \{ fileId: string; title: string; quality: string \}> = \{[\s\S]*?\};/,
    replacementBlock
  );

  fs.writeFileSync(servicePath, serviceContent, 'utf8');
  console.log(`\n💾 Archivo services/googleDrive.ts actualizado para Grimm.`);

  // ─── 2. Procesar GRAVITY FALLS y otras series en syncedSeriesEpisodes ─────
  const jsonPath = path.join(__dirname, '..', 'services', 'syncedSeriesEpisodes.json');
  let syncedData = {};
  if (fs.existsSync(jsonPath)) {
    try {
      syncedData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    } catch (e) {
      syncedData = {};
    }
  }

  for (const [key, group] of Object.entries(seriesGroups)) {
    if (key === 'grimm') continue; // Grimm ya se guardó en googleDrive.ts
    const epCount = Object.keys(group.episodes).length;
    if (epCount > 0) {
      console.log(`\n───────────────────────────────────────────────────────────`);
      console.log(`📺 ${group.seriesName}: ${epCount} capítulos organizados`);
      Object.keys(group.episodes)
        .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
        .forEach((k) => console.log(`   ✅ ${k} -> ${group.episodes[k].title}`));

      syncedData[key] = {
        seriesKey: group.seriesKey,
        seriesName: group.seriesName,
        folderUrl: group.folderUrl,
        folderId: group.folderId,
        episodes: group.episodes,
      };

      // Auto-registrar metadatos en DB si faltan
      await syncDatabaseMetadata(group.seriesName);
    }
  }

  // Guardar JSON y TS de series sincronizadas
  fs.writeFileSync(jsonPath, JSON.stringify(syncedData, null, 2), 'utf8');
  console.log(`💾 JSON guardado: services/syncedSeriesEpisodes.json`);

  const tsPath = path.join(__dirname, '..', 'services', 'syncedSeriesEpisodes.ts');
  const tsContent = `/**
 * services/syncedSeriesEpisodes.ts
 * Auto-generado por scripts/sync-drive.js y sync-series.js
 * Contiene episodios sincronizados de carpetas de Google Drive.
 * NO EDITAR MANUALMENTE - se sobreescribe al sincronizar.
 * 
 * Última actualización: ${new Date().toISOString()}
 * Series sincronizadas: ${Object.keys(syncedData).length}
 */

export interface SyncedSeriesEntry {
  seriesKey: string;
  seriesName: string;
  folderUrl: string;
  folderId: string;
  episodes: Record<string, { fileId: string; title: string; quality: string }>;
}

export const SYNCED_SERIES_DATA: Record<string, SyncedSeriesEntry> = ${JSON.stringify(syncedData, null, 2)};
`;

  fs.writeFileSync(tsPath, tsContent, 'utf8');
  console.log(`💾 TypeScript guardado: services/syncedSeriesEpisodes.ts`);

  console.log(`\n╔══════════════════════════════════════════════════════════╗`);
  console.log(`║  🎉 Sincronización Multi-Serie completada con éxito     ║`);
  console.log(`╚══════════════════════════════════════════════════════════╝`);
  console.log(`\nResumen de series sincronizadas en su lugar correcto:`);
  console.log(`   📺 Grimm:          ${Object.keys(mergedGrimm).length} capítulos (en services/googleDrive.ts)`);
  Object.entries(syncedData).forEach(([k, data]) => {
    console.log(`   📺 ${data.seriesName}: ${Object.keys(data.episodes).length} capítulos (en services/syncedSeriesEpisodes.ts)`);
  });
  console.log('');
}

/**
 * Analiza el nombre del archivo y lo asigna a la serie y capítulo correspondiente
 */
function parseMultiSeriesEpisode(fullName, fileId, seriesGroups) {
  if (!fullName || !fileId) return;

  // Filtrar archivos no deseados
  if (fileId.length < 28 || fileId.startsWith('AAAAA') || fileId.startsWith('googlelogo')) return;
  if (/\.(?:svg|png|jpg|jpeg|css|js|json|html|xml|txt|doc|docx)$/i.test(fullName)) return;
  if (/^(?:desktop\.ini|\.ds_store|thumbs\.db|documento sin t[ií]tulo)$/i.test(fullName.trim())) return;
  if (fullName.includes('googlelogo') || fullName.includes('@media')) return;

  // Detectar temporada y episodio
  const epMatch =
    fullName.match(/[sS](\d{1,2})[eE](\d{1,3})/) ||
    fullName.match(/(\d{1,2})[xX](\d{1,3})/) ||
    fullName.match(/[._\s-](\d{1,2})[._\s-]?[eE](\d{1,3})/i) ||
    fullName.match(/(?:temp|temporada|season)[._\s-]*(\d{1,2})[._\s-]*(?:ep|episode|cap|capitulo)?[._\s-]*(\d{1,3})/i);

  if (!epMatch) return;

  const season = parseInt(epMatch[1], 10);
  const episode = parseInt(epMatch[2], 10);
  if (season < 1 || season > 30) return;
  if (episode < 1 || episode > 99) return;

  // Detección de calidad de audio y video
  const lower = fullName.toLowerCase();
  let quality = '1080p HD';
  if (lower.includes('dual')) {
    quality = '1080p Dual Latino / Inglés';
  } else if (lower.includes('lat') || lower.includes('latino')) {
    quality = '1080p HD Latino';
  } else if (lower.includes('castellano') || lower.includes('esp')) {
    quality = '1080p Castellano';
  } else if (lower.includes('4k') || lower.includes('2160p')) {
    quality = '4K Ultra HD';
  } else if (lower.includes('720p')) {
    quality = '720p HD';
  }

  const cleanTitle = fullName.replace(/[,;]+$/, '').trim();

  // ── Identificar Serie ──────────────────────────────────────────────────────
  let targetSeriesKey = '';
  let targetSeriesName = '';

  if (/grimm/i.test(fullName)) {
    targetSeriesKey = 'grimm';
    targetSeriesName = 'Grimm';
  } else if (/gravity[._\s-]*falls/i.test(fullName)) {
    targetSeriesKey = 'gravity-falls';
    targetSeriesName = 'Gravity Falls';
  } else if (/chicago[._\s-]*med/i.test(fullName)) {
    targetSeriesKey = 'chicago-med';
    targetSeriesName = 'Chicago Med';
  } else if (/chicago[._\s-]*fire/i.test(fullName)) {
    targetSeriesKey = 'chicago-fire';
    targetSeriesName = 'Chicago Fire';
  } else if (/chicago[._\s-]*p\.?d\.?/i.test(fullName)) {
    targetSeriesKey = 'chicago-pd';
    targetSeriesName = 'Chicago P.D.';
  } else {
    // Detectar nombre antes del código de temporada/episodio
    const prefix = fullName.split(/[sS]\d{1,2}[eE]\d{1,2}|\d{1,2}[xX]\d{1,2}/)[0];
    const cleaned = prefix.replace(/[._\-]+/g, ' ').trim();
    if (cleaned.length >= 2) {
      targetSeriesName = cleaned.replace(/\b\w/g, (c) => c.toUpperCase());
      targetSeriesKey = targetSeriesName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    }
  }

  if (!targetSeriesKey) return;

  if (!seriesGroups[targetSeriesKey]) {
    seriesGroups[targetSeriesKey] = {
      seriesKey: targetSeriesKey,
      seriesName: targetSeriesName,
      folderUrl: FOLDER_URL,
      folderId: FOLDER_ID,
      episodes: {},
    };
  }

  const epKey = `${targetSeriesKey}-s${season}e${episode}`;
  seriesGroups[targetSeriesKey].episodes[epKey] = {
    fileId,
    title: cleanTitle,
    quality,
  };
}

async function syncDatabaseMetadata(seriesName) {
  const DATABASE_URL = process.env.DATABASE_URL;
  if (!DATABASE_URL) return;

  let sql;
  try {
    const { neon } = require('@neondatabase/serverless');
    sql = neon(DATABASE_URL);
  } catch (e) {
    return;
  }

  try {
    const existing = await sql`
      SELECT id, name, poster_url FROM series
      WHERE LOWER(name) = LOWER(${seriesName}) OR LOWER(original_name) = LOWER(${seriesName})
      LIMIT 1
    `;

    if (existing.length > 0) {
      return; // Ya existe en la BD
    }

    const TMDB_BEARER = process.env.EXPO_PUBLIC_TMDB_BEARER_TOKEN || '';
    const TMDB_KEY = process.env.EXPO_PUBLIC_TMDB_API_KEY || '';
    if (!TMDB_BEARER && !TMDB_KEY) return;

    const searchUrl = new URL('https://api.themoviedb.org/3/search/tv');
    searchUrl.searchParams.set('query', seriesName);
    searchUrl.searchParams.set('language', 'es-MX');
    if (!TMDB_BEARER && TMDB_KEY) searchUrl.searchParams.set('api_key', TMDB_KEY);

    const headers = TMDB_BEARER ? { Authorization: `Bearer ${TMDB_BEARER}` } : {};
    const searchRes = await fetch(searchUrl.toString(), { headers });
    if (!searchRes.ok) return;

    const searchData = await searchRes.json();
    if (!searchData.results || searchData.results.length === 0) return;

    const tmdbMatch = searchData.results[0];

    const detailUrl = new URL(`https://api.themoviedb.org/3/tv/${tmdbMatch.id}`);
    detailUrl.searchParams.set('language', 'es-MX');
    if (!TMDB_BEARER && TMDB_KEY) detailUrl.searchParams.set('api_key', TMDB_KEY);

    const detailRes = await fetch(detailUrl.toString(), { headers });
    const fullTv = detailRes.ok ? await detailRes.json() : tmdbMatch;

    const posterUrl = fullTv.poster_path ? `https://image.tmdb.org/t/p/w500${fullTv.poster_path}` : null;
    const bannerUrl = fullTv.backdrop_path ? `https://image.tmdb.org/t/p/w1280${fullTv.backdrop_path}` : null;

    const [{ max_sort }] = await sql`SELECT COALESCE(MAX(sort_order), 0) as max_sort FROM series`;

    const [newSeries] = await sql`
      INSERT INTO series (
        tmdb_id, name, original_name, overview,
        poster_url, banner_url, genres,
        first_air_date, last_air_date, status,
        number_of_seasons, number_of_episodes,
        vote_average, is_chicago_universe, sort_order
      ) VALUES (
        ${fullTv.id}, ${fullTv.name}, ${fullTv.original_name || fullTv.name}, ${fullTv.overview || ''},
        ${posterUrl}, ${bannerUrl}, ${JSON.stringify(fullTv.genres || [])},
        ${fullTv.first_air_date || null}, ${fullTv.last_air_date || null}, ${fullTv.status || 'Ended'},
        ${fullTv.number_of_seasons || 1}, ${fullTv.number_of_episodes || 0},
        ${String(fullTv.vote_average || 8.5)}, false, ${Number(max_sort) + 1}
      ) RETURNING id
    `;

    console.log(`   ✅ Serie "${newSeries.name}" registrada en BD con póster: ${posterUrl}`);
  } catch (err) {
    // Silencioso si falla metadatos
  }
}

syncDrive().catch((err) => {
  console.error('❌ Error al sincronizar Google Drive:', err);
  process.exit(1);
});
