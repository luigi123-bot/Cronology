require('dotenv').config();
const fs = require('fs');
const path = require('path');

// ══════════════════════════════════════════════════════════════════════════════
// 📺 Cronology - Sincronizador Recursivo de Series y Temporadas de Google Drive
// • Escanea recursivamente carpetas y subcarpetas (ej: Grimm/Temporada 1/...)
// • Separa automáticamente las series por carpetas y por nombres de archivo
// • Agrupa y organiza cada serie POR TEMPORADAS y POR CAPÍTULOS
// • Muestra informe detallado de videos procesados y archivos no-video omitidos
// • Sincroniza metadatos y carátulas oficiales con TMDB y Base de Datos Neon
// ══════════════════════════════════════════════════════════════════════════════

// Argumentos CLI: -f o --folder (carpeta de Drive a escanear)
const args = process.argv.slice(2);
let customFolderArg = '';
for (let i = 0; i < args.length; i++) {
  if ((args[i] === '-f' || args[i] === '--folder') && args[i + 1]) {
    customFolderArg = args[++i];
  }
}

function extractFolderId(input) {
  if (!input) return null;
  const match = input.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (match) return match[1];
  if (/^[a-zA-Z0-9_-]{25,45}$/.test(input.trim())) return input.trim();
  return null;
}

const ROOT_FOLDER_ID = (customFolderArg && extractFolderId(customFolderArg)) || '1lVqDRczGqe-3cYuTcD_NC2Nu0n955TjS';
const ROOT_FOLDER_URL = `https://drive.google.com/drive/folders/${ROOT_FOLDER_ID}`;

async function fetchDriveFolderHtml(folderId) {
  const url = `https://drive.google.com/drive/folders/${folderId}`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
  });

  if (!res.ok) {
    throw new Error(`Error al acceder a Google Drive (${folderId}): HTTP ${res.status}`);
  }

  return res.text();
}

/**
 * Escanea recursivamente una carpeta de Google Drive y todas sus subcarpetas
 */
async function crawlDriveFolder(folderId, currentPath = [], visited = new Set(), results = { videos: [], nonVideos: [], subfoldersScanned: 0 }) {
  if (visited.has(folderId)) return results;
  visited.add(folderId);

  const pathLabel = currentPath.length > 0 ? currentPath.join(' / ') : 'Raíz';
  process.stdout.write(`   📁 Escaneando carpeta: [${pathLabel}] (${folderId.slice(0, 10)}...)... `);

  let html = '';
  try {
    html = await fetchDriveFolderHtml(folderId);
  } catch (err) {
    console.log(`❌ Error: ${err.message}`);
    return results;
  }

  results.subfoldersScanned++;

  const rawItems = [];
  const foundSubfolders = [];
  const seenInThisFolder = new Set();

  // Pattern 1: Escaped hex JSON format
  const hexPattern = /\\x5b\\x22([a-zA-Z0-9_-]{25,45})\\x22,\\x5b\\x22[a-zA-Z0-9_-]+\\x22\\x5d,\\x22([^\\"]+?)\\x22/gi;
  let match;
  while ((match = hexPattern.exec(html)) !== null) {
    const id = match[1];
    const name = match[2];
    if (id.length >= 28 && !id.startsWith('AAAAA') && !seenInThisFolder.has(id)) {
      seenInThisFolder.add(id);
      const chunk = html.slice(Math.max(0, match.index - 50), Math.min(html.length, match.index + 400));
      const isFolder = chunk.includes('application/vnd.google-apps.folder') || chunk.includes('google-apps.folder');
      if (isFolder) {
        foundSubfolders.push({ id, name });
      } else {
        rawItems.push({ id, name, folderPath: currentPath });
      }
    }
  }

  // Pattern 2: Standard unescaped format
  const standardPattern = /\["([a-zA-Z0-9_-]{25,45})",\["[a-zA-Z0-9_-]+"\],"([^"]+?)"/gi;
  while ((match = standardPattern.exec(html)) !== null) {
    const id = match[1];
    const name = match[2];
    if (id.length >= 28 && !id.startsWith('AAAAA') && !seenInThisFolder.has(id)) {
      seenInThisFolder.add(id);
      const chunk = html.slice(Math.max(0, match.index - 50), Math.min(html.length, match.index + 400));
      const isFolder = chunk.includes('application/vnd.google-apps.folder');
      if (isFolder) {
        foundSubfolders.push({ id, name });
      } else {
        rawItems.push({ id, name, folderPath: currentPath });
      }
    }
  }

  // Clasificar archivos en video vs no-video
  let newVideos = 0;
  for (const item of rawItems) {
    const isVideo = /\.(?:mkv|mp4|avi|webm|ts|mov|m4v)$/i.test(item.name) ||
      /(?:dual|1080p|720p|bluray|h264|x264|hevc|x265)/i.test(item.name);

    if (isVideo) {
      results.videos.push(item);
      newVideos++;
    } else {
      results.nonVideos.push(item);
    }
  }

  console.log(`✅ ${newVideos} videos | ${foundSubfolders.length} subcarpetas`);

  // Explorar recursivamente cada subcarpeta encontrada
  for (const subfolder of foundSubfolders) {
    await crawlDriveFolder(
      subfolder.id,
      [...currentPath, subfolder.name],
      visited,
      results
    );
  }

  return results;
}

/**
 * Analiza un archivo de video y extrae serie, temporada, número de episodio y calidad
 */
/**
 * Analiza un archivo de video y extrae serie, temporada, número de episodio y calidad.
 * Soporta cualquier estructura de carpetas:
 *   - [Raíz] / Serie / Temporada X / Archivo
 *   - [Raíz] / Serie Temp X / Archivo
 *   - [Raíz] / Serie / Archivo
 *   - [Raíz] / Archivo (con Serie S01E01)
 */
function parseVideoItem(item) {
  const { name, id, folderPath } = item;
  const fullName = name.trim();

  // Filtrar carpetas genéricas del folderPath
  const cleanFolderPath = folderPath.filter(
    (f) => !/^(?:series|mis\s*series|drive|videos|pel[ií]culas|raiz|ra[ií]z|compartido)$/i.test(f.trim())
  );

  // 1. Detectar Temporada (Season)
  let season = null;

  // 1.1 Intentar desde el nombre del archivo (ej. S01E01, 1x01, Temp 1)
  const epInFile =
    fullName.match(/[sS](\d{1,2})[eE](\d{1,3})/) ||
    fullName.match(/(\d{1,2})[xX](\d{1,3})/) ||
    fullName.match(/[._\s-](\d{1,2})[._\s-]?[eE](\d{1,3})/i) ||
    fullName.match(/(?:temp(?:orada)?|season)[._\s-]*(\d{1,2})[._\s-]*(?:ep|episode|cap|capitulo)?[._\s-]*(\d{1,3})/i);

  if (epInFile) {
    season = parseInt(epInFile[1], 10);
  } else {
    // 1.2 Si no está en el nombre del archivo, buscar en la ruta de carpetas de derecha a izquierda
    for (let i = cleanFolderPath.length - 1; i >= 0; i--) {
      const folder = cleanFolderPath[i];
      const match = folder.match(/(?:temp(?:orada)?|season|t)[._\s-]*(\d{1,2})\b/i);
      if (match) {
        season = parseInt(match[1], 10);
        break;
      }
      // O si la carpeta es solo un número (ej. "1", "02") y la anterior es el nombre de la serie
      if (/^\d{1,2}$/.test(folder.trim()) && i > 0) {
        season = parseInt(folder.trim(), 10);
        break;
      }
    }
  }

  // 2. Detectar Episodio (Episode)
  let episode = null;

  if (epInFile) {
    episode = parseInt(epInFile[2], 10);
  } else {
    // Buscar patrones de episodio en el nombre del archivo
    const capNamedMatch =
      fullName.match(/(?:cap[ií]tulo|cap|episodio|ep|episode)[._\s-]*(\d{1,3})\b/i) ||
      fullName.match(/[eE](\d{1,3})\b/);

    if (capNamedMatch) {
      episode = parseInt(capNamedMatch[1], 10);
    } else {
      // Buscar número inicial (ej. "01 - Titulo.mp4", "05.mkv")
      const leadingNumMatch = fullName.match(/^(\d{1,3})(?:[._\s-]+|\.[a-z0-9]+$)/i);
      if (leadingNumMatch) {
        const num = parseInt(leadingNumMatch[1], 10);
        if (num > 0 && num < 1000) {
          episode = num;
        }
      } else {
        // Buscar cualquier número 1-99 aislado que no sea año ni resolución
        const allNums = fullName.match(/\b\d{1,3}\b/g);
        if (allNums) {
          for (const nStr of allNums) {
            const n = parseInt(nStr, 10);
            if (n >= 1 && n <= 99 && n !== season && ![480, 576, 720].includes(n)) {
              episode = n;
              break;
            }
          }
        }
      }
    }
  }

  // Si no se pudo detectar temporada o episodio, no podemos indexarlo con precisión
  if (season === null || episode === null) {
    return null;
  }

  // 3. Determinar la Serie
  let seriesKey = '';
  let seriesName = '';

  const lowerName = fullName.toLowerCase();
  const lowerPath = cleanFolderPath.join(' ').toLowerCase();

  // 3.1 Series conocidas directamente
  if (lowerName.includes('grimm') || lowerPath.includes('grimm')) {
    seriesKey = 'grimm';
    seriesName = 'Grimm';
  } else if (
    lowerName.includes('gravity') ||
    lowerName.includes('falls') ||
    lowerPath.includes('gravity') ||
    lowerPath.includes('falls')
  ) {
    seriesKey = 'gravity-falls';
    seriesName = 'Gravity Falls';
  } else if (lowerName.includes('chicago med') || lowerPath.includes('chicago med')) {
    seriesKey = 'chicago-med';
    seriesName = 'Chicago Med';
  } else if (lowerName.includes('chicago fire') || lowerPath.includes('chicago fire')) {
    seriesKey = 'chicago-fire';
    seriesName = 'Chicago Fire';
  } else if (lowerName.includes('chicago p') || lowerPath.includes('chicago p')) {
    seriesKey = 'chicago-pd';
    seriesName = 'Chicago P.D.';
  } else {
    // 3.2 Deducir de las carpetas
    for (const folder of cleanFolderPath) {
      // Si la carpeta tiene "Grimm Temp1" o "The Boys Temporada 2", limpiar la parte de temporada
      const stripped = folder
        .replace(/(?:temp(?:orada)?|season|t)[._\s-]*\d{1,2}/gi, '')
        .replace(/[._\-\[\]\(\)]+/g, ' ')
        .trim();

      if (stripped.length >= 2 && !/^\d+$/.test(stripped)) {
        seriesName = stripped
          .split(/\s+/)
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
          .join(' ');
        seriesKey = seriesName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        break;
      }
    }

    // 3.3 Si las carpetas solo decían "Temporada 1", deducir del nombre del archivo
    if (!seriesKey) {
      const prefix = fullName.split(/[sS]\d{1,2}[eE]\d{1,2}|\d{1,2}[xX]\d{1,2}|(?:temp|season|cap)/i)[0];
      const cleaned = prefix.replace(/[._\-]+/g, ' ').trim();
      if (cleaned.length >= 2) {
        seriesName = cleaned
          .split(/\s+/)
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
          .join(' ');
        seriesKey = seriesName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      }
    }
  }

  if (!seriesKey) {
    seriesKey = 'serie-desconocida';
    seriesName = 'Serie Desconocida';
  }

  // 4. Detección de calidad de audio y video
  let quality = '1080p HD';
  if (lowerName.includes('dual')) {
    quality = '1080p Dual Latino / Inglés';
  } else if (lowerName.includes('lat') || lowerName.includes('latino')) {
    quality = '1080p HD Latino';
  } else if (lowerName.includes('castellano') || lowerName.includes('esp')) {
    quality = '1080p Castellano';
  } else if (lowerName.includes('4k') || lowerName.includes('2160p')) {
    quality = '4K Ultra HD';
  } else if (lowerName.includes('720p')) {
    quality = '720p HD';
  }

  const cleanTitle = fullName.replace(/[,;]+$/, '').trim();

  return {
    fileId: id,
    title: cleanTitle,
    quality,
    seriesKey,
    seriesName,
    season,
    episode,
    folderPath,
  };
}

async function main() {
  console.log(`\n╔══════════════════════════════════════════════════════════════════════╗`);
  console.log(`║  📺 Cronology - Sincronizador Multi-Serie y Temporadas Google Drive  ║`);
  console.log(`╚══════════════════════════════════════════════════════════════════════╝`);
  console.log(`\n📡 Carpeta Raíz:`);
  console.log(`   📁 ID:  ${ROOT_FOLDER_ID}`);
  console.log(`   🔗 URL: ${ROOT_FOLDER_URL}\n`);

  // Paso 1: Escaneo recursivo
  console.log(`🔍 Paso 1/4 — Escaneando carpetas y subcarpetas recursivamente...`);
  const crawlResults = await crawlDriveFolder(ROOT_FOLDER_ID);

  console.log(`\n📋 Resumen de escaneo de Google Drive:`);
  console.log(`   • Total elementos encontrados:  ${crawlResults.videos.length + crawlResults.nonVideos.length}`);
  console.log(`   • Archivos de video detectados: ${crawlResults.videos.length}`);
  console.log(`   • Archivos no-video omitidos:   ${crawlResults.nonVideos.length}`);
  console.log(`   • Carpetas exploradas:          ${crawlResults.subfoldersScanned}`);

  if (crawlResults.nonVideos.length > 0) {
    console.log(`\n   ℹ️ Archivos no-video ignorados (${crawlResults.nonVideos.length}):`);
    crawlResults.nonVideos.forEach((nv) => {
      console.log(`      📄 [${nv.folderPath.join('/') || 'Raíz'}] ${nv.name}`);
    });
  }

  // Paso 2: Clasificar por Serie y por Temporada
  console.log(`\n🔍 Paso 2/4 — Clasificando archivos por Serie y por Temporada...`);

  // Estructura:
  // seriesMap[seriesKey] = {
  //   seriesKey, seriesName, folderUrl, folderId,
  //   seasons: { 1: { epKey: { fileId, title, quality, season, episode } } },
  //   episodes: { epKey: { fileId, title, quality, season, episode } }
  // }
  const seriesMap = {};

  for (const item of crawlResults.videos) {
    const parsed = parseVideoItem(item);
    if (!parsed) continue;

    const { seriesKey, seriesName, season, episode, fileId, title, quality } = parsed;

    if (!seriesMap[seriesKey]) {
      seriesMap[seriesKey] = {
        seriesKey,
        seriesName,
        folderUrl: ROOT_FOLDER_URL,
        folderId: ROOT_FOLDER_ID,
        seasons: {},
        episodes: {},
      };
    }

    if (!seriesMap[seriesKey].seasons[season]) {
      seriesMap[seriesKey].seasons[season] = {};
    }

    const epKey = `${seriesKey}-s${season}e${episode}`;
    const epObj = { fileId, title, quality, season, episode };

    seriesMap[seriesKey].seasons[season][epKey] = epObj;
    seriesMap[seriesKey].episodes[epKey] = epObj;
  }

  // Paso 3: Guardar en los servicios de Cronology
  console.log(`\n💾 Paso 3/4 — Guardando datos organizados en el sistema...`);

  // 3.1: Procesar GRIMM y guardar en services/googleDrive.ts
  if (seriesMap['grimm']) {
    const grimmGroup = seriesMap['grimm'];
    const servicePath = path.join(__dirname, '..', 'services', 'googleDrive.ts');
    let serviceContent = fs.readFileSync(servicePath, 'utf8');

    // Leer episodios existentes (excluyendo cualquier contaminación previa)
    const existingGrimm = {};
    const existingRegex = /'(grimm-s[1-9]\d*e[1-9]\d*)':\s*\{\s*fileId:\s*'([^']+)',\s*title:\s*'([^']+)',\s*quality:\s*'([^']+)',?\s*\}/g;
    let exMatch;
    while ((exMatch = existingRegex.exec(serviceContent)) !== null) {
      const key = exMatch[1];
      const fileId = exMatch[2];
      const title = exMatch[3];
      const quality = exMatch[4];
      if (/gravity/i.test(title)) continue;
      if (fileId.length >= 28 && !fileId.startsWith('AAAAA')) {
        existingGrimm[key] = { fileId, title, quality };
      }
    }

    const mergedGrimm = { ...existingGrimm, ...grimmGroup.episodes };

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
    console.log(`   ✅ Actualizado services/googleDrive.ts (Grimm)`);
  }

  // 3.2: Guardar todas las series en syncedSeriesEpisodes.json y .ts
  const jsonPath = path.join(__dirname, '..', 'services', 'syncedSeriesEpisodes.json');
  let syncedData = {};
  if (fs.existsSync(jsonPath)) {
    try {
      syncedData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    } catch (e) {
      syncedData = {};
    }
  }

  for (const [key, group] of Object.entries(seriesMap)) {
    const seasonsCount = Object.keys(group.seasons).length;
    const episodesCount = Object.keys(group.episodes).length;

    syncedData[key] = {
      seriesKey: group.seriesKey,
      seriesName: group.seriesName,
      folderUrl: group.folderUrl,
      folderId: group.folderId,
      seasonsCount,
      episodesCount,
      seasons: group.seasons,
      episodes: group.episodes,
    };

    // Auto-registrar en Neon DB con TMDB si falta la ficha
    await ensureSeriesInDatabase(group.seriesName);
  }

  fs.writeFileSync(jsonPath, JSON.stringify(syncedData, null, 2), 'utf8');
  console.log(`   ✅ Guardado services/syncedSeriesEpisodes.json`);

  const tsPath = path.join(__dirname, '..', 'services', 'syncedSeriesEpisodes.ts');
  const tsContent = `/**
 * services/syncedSeriesEpisodes.ts
 * Auto-generado por scripts/sync-drive.js
 * Catálogo estructurado por Series y por Temporadas desde Google Drive.
 * NO EDITAR MANUALMENTE - se sobreescribe al sincronizar.
 * 
 * Última actualización: ${new Date().toISOString()}
 * Series sincronizadas: ${Object.keys(syncedData).length}
 */

export interface SyncedEpisode {
  fileId: string;
  title: string;
  quality: string;
  season?: number;
  episode?: number;
}

export interface SyncedSeriesEntry {
  seriesKey: string;
  seriesName: string;
  folderUrl: string;
  folderId: string;
  seasonsCount?: number;
  episodesCount?: number;
  seasons?: Record<number, Record<string, SyncedEpisode>>;
  episodes: Record<string, SyncedEpisode>;
}

export const SYNCED_SERIES_DATA: Record<string, SyncedSeriesEntry> = ${JSON.stringify(syncedData, null, 2)};
`;

  fs.writeFileSync(tsPath, tsContent, 'utf8');
  console.log(`   ✅ Guardado services/syncedSeriesEpisodes.ts`);

  // Paso 4: Resumen estructurado por Series y Temporadas
  console.log(`\n══════════════════════════════════════════════════════════════════════`);
  console.log(`  🎉 RESUMEN DE SERIES Y TEMPORADAS SINCRONIZADAS`);
  console.log(`══════════════════════════════════════════════════════════════════════\n`);

  for (const [key, group] of Object.entries(seriesMap)) {
    const totalEps = Object.keys(group.episodes).length;
    const seasonNumbers = Object.keys(group.seasons).sort((a, b) => Number(a) - Number(b));

    console.log(`📺 ${group.seriesName} (${key}) — Total: ${totalEps} capítulos listos:`);

    for (const sNum of seasonNumbers) {
      const sEps = group.seasons[sNum];
      const sCount = Object.keys(sEps).length;
      console.log(`   📁 Temporada ${sNum} (${sCount} capítulos):`);

      Object.entries(sEps)
        .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
        .forEach(([epKey, epData]) => {
          console.log(`      • ${epKey} -> ${epData.title} [${epData.quality}]`);
        });
    }
    console.log('');
  }

  console.log(`══════════════════════════════════════════════════════════════════════`);
  console.log(`✅ ¡Todo sincronizado y organizado por series y temporadas con éxito!`);
  console.log(`══════════════════════════════════════════════════════════════════════\n`);
}

/**
 * Verifica y registra la serie en Neon DB con TMDB si aún no existe
 */
async function ensureSeriesInDatabase(seriesName) {
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
      SELECT id, name FROM series
      WHERE LOWER(name) = LOWER(${seriesName}) OR LOWER(original_name) = LOWER(${seriesName})
      LIMIT 1
    `;

    if (existing.length > 0) return; // Ya existe

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

    console.log(`   ✨ Ficha de "${newSeries.name}" creada en BD con carátula oficial TMDB`);
  } catch (err) {
    // Silencioso
  }
}

main().catch((err) => {
  console.error('\n❌ Error al sincronizar:', err);
  process.exit(1);
});
