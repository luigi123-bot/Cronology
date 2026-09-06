require('dotenv').config();
const fs = require('fs');
const path = require('path');

// ══════════════════════════════════════════════════════════════════════════════
// 📺 Cronology - Sincronizador Genérico de Series desde Google Drive
// ══════════════════════════════════════════════════════════════════════════════

// Parse CLI arguments
const args = process.argv.slice(2);
let folderUrl = '';
let seriesName = '';

for (let i = 0; i < args.length; i++) {
  if ((args[i] === '--folder' || args[i] === '-f') && args[i + 1]) {
    folderUrl = args[++i];
  } else if ((args[i] === '--series' || args[i] === '-s') && args[i + 1]) {
    seriesName = args[++i];
  }
}

if (!folderUrl || !seriesName) {
  console.log(`
╔══════════════════════════════════════════════════════════╗
║  📺 Cronology - Sincronizador Genérico de Series Drive  ║
╚══════════════════════════════════════════════════════════╝

Uso:
  node scripts/sync-series.js --series "Nombre" --folder "URL_CARPETA"

Alias cortos:
  node scripts/sync-series.js -s "Nombre" -f "URL_CARPETA"

Ejemplos:
  node scripts/sync-series.js -s "Chicago Med" -f "https://drive.google.com/drive/folders/1R6HGda0taH2liyBHvasI7_vmpsMCyaJa"
  node scripts/sync-series.js -s "Breaking Bad" -f "https://drive.google.com/drive/folders/ABC123?usp=sharing"

npm script:
  npm run sync:series -- -s "Nombre" -f "URL"
`);
  process.exit(1);
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function extractFolderId(url) {
  const match = url.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (match) return match[1];
  if (/^[a-zA-Z0-9_-]{25,45}$/.test(url.trim())) return url.trim();
  return null;
}

const folderId = extractFolderId(folderUrl);
if (!folderId) {
  console.error('❌ No se pudo extraer el ID de la carpeta del URL proporcionado.');
  console.error('   URL recibido:', folderUrl);
  process.exit(1);
}

const driveUrl = `https://drive.google.com/drive/folders/${folderId}`;
const seriesKey = seriesName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

console.log('');
console.log('═══════════════════════════════════════════════════════════');
console.log(`  📺 Serie:     "${seriesName}"`);
console.log(`  🔑 Key:       ${seriesKey}`);
console.log(`  📁 Folder ID: ${folderId}`);
console.log(`  🔗 URL:       ${driveUrl}`);
console.log('═══════════════════════════════════════════════════════════');
console.log('');

// ── Episode Parser ──────────────────────────────────────────────────────────

function parseGenericEpisode(fileName) {
  // Filter system/non-video files
  if (/\.(?:svg|png|jpg|jpeg|gif|css|js|json|html|xml|txt|srt|sub|idx|nfo)$/i.test(fileName)) {
    console.log(`      🚫 Filtrado (no es video): ${fileName}`);
    return null;
  }
  if (/^(?:desktop\.ini|\.ds_store|thumbs\.db)$/i.test(fileName.trim())) return null;
  if (fileName.includes('googlelogo') || fileName.includes('@media')) return null;
  if (/^0x[0-9a-f]/i.test(fileName)) return null;

  // Try multiple episode patterns (order matters: most specific first)
  const epMatch =
    fileName.match(/[sS](\d{1,2})[eE](\d{1,3})/) ||                   // S01E01
    fileName.match(/(\d{1,2})[xX](\d{1,3})/) ||                        // 1x01
    fileName.match(/[._\s-](\d{1,2})[._\s-]?[eE](\d{1,3})/i) ||       // .1E01.
    fileName.match(/(?:temp|temporada|season)[._\s-]*(\d{1,2})[._\s-]*(?:ep|episode|cap|capitulo)?[._\s-]*(\d{1,3})/i);

  if (!epMatch) {
    console.log(`      ⚠️ Sin patrón SxxExx/NxNN detectado: ${fileName}`);
    return null;
  }

  const season = parseInt(epMatch[1], 10);
  const episode = parseInt(epMatch[2], 10);

  if (season < 1 || season > 30) {
    console.log(`      ⚠️ Temporada fuera de rango (${season}): ${fileName}`);
    return null;
  }
  if (episode < 1 || episode > 100) {
    console.log(`      ⚠️ Episodio fuera de rango (${episode}): ${fileName}`);
    return null;
  }

  // Quality detection
  const lower = fileName.toLowerCase();
  let quality = '1080p HD';
  if (lower.includes('dual')) {
    quality = '1080p Dual Latino / Inglés';
  } else if (lower.includes('lat') || lower.includes('latino')) {
    quality = '1080p HD Latino';
  } else if (lower.includes('castellano') || lower.includes('esp')) {
    quality = '1080p Castellano';
  } else if (lower.includes('720p')) {
    quality = '720p HD';
  } else if (lower.includes('4k') || lower.includes('2160p')) {
    quality = '4K Ultra HD';
  }

  return { season, episode, quality };
}

// ── Main Sync ───────────────────────────────────────────────────────────────

async function syncSeries() {
  console.log('📡 Paso 1/5 — Conectando a Google Drive...');

  const res = await fetch(driveUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
  });

  if (!res.ok) {
    throw new Error(`Error al acceder a Google Drive: HTTP ${res.status}`);
  }

  const html = await res.text();
  console.log(`✅ Respuesta recibida: ${html.length} bytes\n`);

  // ── Paso 2: Extraer archivos del HTML ────────────────────────────────────
  console.log('🔍 Paso 2/5 — Extrayendo archivos del HTML de Google Drive...');

  const rawFiles = [];

  // Pattern 1: Escaped hex JSON format (most common in Drive web response)
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

  // Pattern 3: Search for series name with adjacent Drive file IDs
  const seriesRegex = new RegExp(
    seriesName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '[._\\s-]*') +
    '[._\\s-]*(\\d{1,2})[xXeE](\\d{1,2})[^"\'\\s<>\\\\]*',
    'gi'
  );
  while ((match = seriesRegex.exec(html)) !== null) {
    const fullName = match[0];
    const chunk = html.slice(Math.max(0, match.index - 300), Math.min(html.length, match.index + 300));
    const ids = chunk.match(/[a-zA-Z0-9_-]{33}/g);
    if (ids && ids.length > 0) {
      const fileId = ids[0];
      if (!rawFiles.some(f => f.fileId === fileId)) {
        rawFiles.push({ fileId, fileName: fullName });
      }
    }
  }

  // Deduplicate by fileId
  const seen = new Set();
  const uniqueFiles = rawFiles.filter(f => {
    if (seen.has(f.fileId)) return false;
    seen.add(f.fileId);
    return true;
  });

  console.log(`📂 Archivos únicos encontrados: ${uniqueFiles.length}\n`);
  uniqueFiles.forEach((f, i) => {
    console.log(`   [${String(i + 1).padStart(2)}] ${f.fileName}`);
    console.log(`       ID: ${f.fileId}`);
  });

  // ── Paso 3: Filtrar archivos de video ───────────────────────────────────
  console.log('\n🎬 Paso 3/5 — Filtrando archivos de video...');

  const videoFiles = uniqueFiles.filter(f => {
    const n = f.fileName.toLowerCase();
    return (
      n.endsWith('.mkv') || n.endsWith('.mp4') || n.endsWith('.avi') ||
      n.endsWith('.webm') || n.endsWith('.mov') || n.endsWith('.ts') || n.endsWith('.m4v') ||
      /(?:1080p|720p|4k|2160p|dual|latino|bluray|web-dl|webrip|x264|x265|hevc)/i.test(n)
    );
  });

  console.log(`   Videos detectados: ${videoFiles.length} de ${uniqueFiles.length} archivos totales\n`);

  // ── Paso 4: Parsear episodios ───────────────────────────────────────────
  console.log('📋 Paso 4/5 — Detectando episodios...\n');

  const episodes = {};

  for (const file of videoFiles) {
    const parsed = parseGenericEpisode(file.fileName);
    if (parsed) {
      const key = `${seriesKey}-s${parsed.season}e${parsed.episode}`;
      episodes[key] = {
        fileId: file.fileId,
        title: file.fileName.replace(/[,;]+$/, '').trim(),
        quality: parsed.quality,
      };
      console.log(`   ✅ ${key} → ${file.fileName}`);
      console.log(`      Calidad: ${parsed.quality} | Drive ID: ${file.fileId}`);
    }
  }

  const episodeCount = Object.keys(episodes).length;
  console.log(`\n${'─'.repeat(60)}`);
  console.log(`🎉 Total episodios sincronizados para "${seriesName}": ${episodeCount}`);
  console.log(`${'─'.repeat(60)}`);

  if (episodeCount === 0) {
    console.log('\n⚠️  No se detectaron episodios. Verifica que:');
    console.log('   1. La carpeta de Google Drive sea pública ("Cualquiera con el enlace puede ver")');
    console.log('   2. Los archivos tengan un patrón reconocible (S01E01, 1x01, etc.)');
    console.log('   3. Los archivos sean de video (.mkv, .mp4, .avi, etc.)');
    console.log('\n   Archivos raw encontrados (para diagnóstico):');
    uniqueFiles.forEach(f => console.log(`      - ${f.fileName}`));
    return;
  }

  // ── Paso 5: Guardar resultados ──────────────────────────────────────────
  console.log('\n💾 Paso 5/5 — Guardando resultados...');

  // Load existing synced data
  const jsonPath = path.join(__dirname, '..', 'services', 'syncedSeriesEpisodes.json');
  let existingData = {};

  if (fs.existsSync(jsonPath)) {
    try {
      existingData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
      console.log(`   📄 Datos existentes cargados: ${Object.keys(existingData).length} serie(s)`);
    } catch (e) {
      console.log('   ⚠️ No se pudieron leer datos existentes, creando desde cero');
    }
  }

  // Merge new data
  existingData[seriesKey] = {
    seriesKey,
    seriesName,
    folderUrl: driveUrl,
    folderId,
    episodes,
  };

  // Write JSON (source of truth for re-generation)
  fs.writeFileSync(jsonPath, JSON.stringify(existingData, null, 2), 'utf8');
  console.log(`   ✅ JSON guardado: services/syncedSeriesEpisodes.json`);

  // Generate TypeScript file
  const tsPath = path.join(__dirname, '..', 'services', 'syncedSeriesEpisodes.ts');
  const tsContent = `/**
 * services/syncedSeriesEpisodes.ts
 * Auto-generado por scripts/sync-series.js
 * Contiene episodios sincronizados de carpetas de Google Drive.
 * NO EDITAR MANUALMENTE - se sobreescribe al ejecutar sync:series.
 * 
 * Última actualización: ${new Date().toISOString()}
 * Series sincronizadas: ${Object.keys(existingData).length}
 */

export interface SyncedSeriesEntry {
  seriesKey: string;
  seriesName: string;
  folderUrl: string;
  folderId: string;
  episodes: Record<string, { fileId: string; title: string; quality: string }>;
}

export const SYNCED_SERIES_DATA: Record<string, SyncedSeriesEntry> = ${JSON.stringify(existingData, null, 2)};
`;

  fs.writeFileSync(tsPath, tsContent, 'utf8');
  console.log(`   ✅ TypeScript guardado: services/syncedSeriesEpisodes.ts`);

  // Step 6: Ensure metadata & posters in DB
  await syncDatabaseMetadata(seriesName);

  // Summary
  console.log(`\n╔══════════════════════════════════════════════════════════╗`);
  console.log(`║  ✅ Sincronización completada exitosamente               ║`);
  console.log(`╚══════════════════════════════════════════════════════════╝`);
  console.log(`\nSeries en el sistema:`);
  Object.entries(existingData).forEach(([key, data]) => {
    console.log(`   📺 ${data.seriesName} (${key}): ${Object.keys(data.episodes).length} episodios`);
  });
  console.log('');
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

  console.log(`\n🔍 Paso 6 — Verificando carátula y ficha en Base de Datos de Cronology...`);

  try {
    const existing = await sql`
      SELECT id, name, poster_url FROM series
      WHERE LOWER(name) = LOWER(${seriesName}) OR LOWER(original_name) = LOWER(${seriesName})
      LIMIT 1
    `;

    if (existing.length > 0) {
      console.log(`   ✅ "${existing[0].name}" ya está registrada en la base de datos (ID: ${existing[0].id}).`);
      if (existing[0].poster_url) {
        console.log(`   🖼️ Portada activa: ${existing[0].poster_url}`);
      }
      return;
    }

    const TMDB_BEARER = process.env.EXPO_PUBLIC_TMDB_BEARER_TOKEN || '';
    const TMDB_KEY = process.env.EXPO_PUBLIC_TMDB_API_KEY || '';
    if (!TMDB_BEARER && !TMDB_KEY) return;

    console.log(`   📡 Buscando "${seriesName}" en TMDB (español)...`);
    const searchUrl = new URL('https://api.themoviedb.org/3/search/tv');
    searchUrl.searchParams.set('query', seriesName);
    searchUrl.searchParams.set('language', 'es-MX');
    if (!TMDB_BEARER && TMDB_KEY) searchUrl.searchParams.set('api_key', TMDB_KEY);

    const headers = TMDB_BEARER ? { Authorization: `Bearer ${TMDB_BEARER}` } : {};
    const searchRes = await fetch(searchUrl.toString(), { headers });
    if (!searchRes.ok) return;

    const searchData = await searchRes.json();
    if (!searchData.results || searchData.results.length === 0) {
      console.log(`   ⚠️ No se encontró "${seriesName}" en TMDB.`);
      return;
    }

    const tmdbMatch = searchData.results[0];
    console.log(`   🎯 Serie encontrada en TMDB: "${tmdbMatch.name}" (TMDB ID: ${tmdbMatch.id})`);

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

    console.log(`   ✅ Serie insertada en base de datos (ID: ${newSeries.id})`);
    console.log(`   🖼️ Portada guardada: ${posterUrl}`);

    const numSeasons = fullTv.number_of_seasons || 1;
    for (let s = 1; s <= numSeasons; s++) {
      try {
        const sUrl = new URL(`https://api.themoviedb.org/3/tv/${fullTv.id}/season/${s}`);
        sUrl.searchParams.set('language', 'es-MX');
        if (!TMDB_BEARER && TMDB_KEY) sUrl.searchParams.set('api_key', TMDB_KEY);

        const sRes = await fetch(sUrl.toString(), { headers });
        if (!sRes.ok) continue;
        const sData = await sRes.json();

        const [newSeason] = await sql`
          INSERT INTO seasons (
            series_id, tmdb_id, season_number, name, overview,
            poster_url, air_date, episode_count
          ) VALUES (
            ${newSeries.id}, ${sData.id || s}, ${sData.season_number || s},
            ${sData.name || `Temporada ${s}`}, ${sData.overview || ''},
            ${sData.poster_path ? `https://image.tmdb.org/t/p/w500${sData.poster_path}` : posterUrl},
            ${sData.air_date || null}, ${(sData.episodes || []).length}
          ) RETURNING id
        `;

        for (const ep of (sData.episodes || [])) {
          await sql`
            INSERT INTO episodes (
              series_id, season_id, tmdb_id,
              season_number, episode_number, name, overview,
              air_date, runtime, still_url, vote_average,
              is_crossover
            ) VALUES (
              ${newSeries.id}, ${newSeason.id}, ${ep.id},
              ${ep.season_number}, ${ep.episode_number}, ${ep.name}, ${ep.overview || ''},
              ${ep.air_date || null}, ${ep.runtime || null},
              ${ep.still_path ? `https://image.tmdb.org/t/p/w300${ep.still_path}` : null},
              ${String(ep.vote_average || 0)}, false
            ) ON CONFLICT DO NOTHING
          `;
        }
      } catch (e) {}
    }
    console.log(`   🎉 ¡Ficha, carátula y episodios registrados en Cronology!`);
  } catch (err) {
    console.warn('   ⚠️ Error al sincronizar metadatos de serie:', err.message);
  }
}

syncSeries().catch((err) => {
  console.error('\n❌ Error al sincronizar serie:', err);
  process.exit(1);
});
