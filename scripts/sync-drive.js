const fs = require('fs');
const path = require('path');

const FOLDER_ID = '1lVqDRczGqe-3cYuTcD_NC2Nu0n955TjS';
const FOLDER_URL = `https://drive.google.com/drive/folders/${FOLDER_ID}`;

async function syncDrive() {
  console.log(`📡 Conectando a Google Drive para escanear carpeta: ${FOLDER_ID}...`);
  const res = await fetch(FOLDER_URL, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
  });

  if (!res.ok) {
    throw new Error(`Error al acceder a Google Drive: HTTP ${res.status}`);
  }

  const html = await res.text();
  const episodes = {};

  // Pattern 1: Escaped hex JSON format (Drive web response)
  // Matches any file name: with .mkv, .mp4, other extensions or NO extension at all
  // Example: Grimm.1x18.Dual.1080p-lat or Grimm.1x02.HD1080p-lat.mkv
  const hexPattern = /\\x5b\\x22([a-zA-Z0-9_-]{25,45})\\x22,\\x5b\\x22[a-zA-Z0-9_-]+\\x22\\x5d,\\x22([^\\"]+?)\\x22/gi;
  let match;
  while ((match = hexPattern.exec(html)) !== null) {
    const fileId = match[1];
    const fullName = match[2];
    parseEpisode(fullName, fileId, episodes);
  }

  // Pattern 2: Standard JSON array if rendered unescaped
  const standardPattern = /\["([a-zA-Z0-9_-]{25,45})",\["[a-zA-Z0-9_-]+"\],"([^"]+?)"/gi;
  while ((match = standardPattern.exec(html)) !== null) {
    const fileId = match[1];
    const fullName = match[2];
    parseEpisode(fullName, fileId, episodes);
  }

  // Pattern 3: Explicit Grimm title scanner with adjacent 33-char Drive file IDs
  const grimmPattern = /Grimm[._\s-]*(\d{1,2})[xX](\d{1,2})[^"'\s<>\\]*/gi;
  while ((match = grimmPattern.exec(html)) !== null) {
    const fullName = match[0];
    const chunk = html.slice(Math.max(0, match.index - 300), Math.min(html.length, match.index + 300));
    const ids = chunk.match(/[a-zA-Z0-9_-]{33}/g);
    if (ids && ids.length > 0) {
      parseEpisode(fullName, ids[0], episodes);
    }
  }

  // Read existing mapped episodes from services/googleDrive.ts
  const servicePath = path.join(__dirname, '..', 'services', 'googleDrive.ts');
  let serviceContent = fs.readFileSync(servicePath, 'utf8');

  const existingEpisodes = {};
  const existingRegex = /'(grimm-s[1-9]\d*e[1-9]\d*)':\s*\{\s*fileId:\s*'([^']+)',\s*title:\s*'([^']+)',\s*quality:\s*'([^']+)',?\s*\}/g;
  let exMatch;
  while ((exMatch = existingRegex.exec(serviceContent)) !== null) {
    const key = exMatch[1];
    const fileId = exMatch[2];
    // Keep only valid file IDs (not junk tokens)
    if (fileId.length >= 28 && !fileId.startsWith('AAAAA')) {
      existingEpisodes[key] = {
        fileId: exMatch[2],
        title: exMatch[3],
        quality: exMatch[4],
      };
    }
  }

  // Merge newly scanned episodes with existing ones
  const mergedEpisodes = { ...existingEpisodes, ...episodes };
  const newlyAdded = Object.keys(episodes).filter(k => !existingEpisodes[k]);

  console.log(`\n🎉 Total de capítulos de Grimm sincronizados: ${Object.keys(mergedEpisodes).length}`);
  if (newlyAdded.length > 0) {
    console.log(`✨ Nuevos capítulos añadidos (${newlyAdded.length}):`, newlyAdded.join(', '));
  } else {
    console.log(`ℹ️ Todos los capítulos ya estaban registrados.`);
  }

  console.log(JSON.stringify(mergedEpisodes, null, 2));

  // Serialize and write back to services/googleDrive.ts
  const serializedEpisodes = Object.entries(mergedEpisodes)
    .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
    .map(
      ([key, data]) => `  '${key}': {
    fileId: '${data.fileId}',
    title: '${data.title}',
    quality: '${data.quality}',
  },`
    )
    .join('\n');

  const replacementBlock = `export const GRIMM_DRIVE_EPISODES: Record<string, { fileId: string; title: string; quality: string }> = {\n${serializedEpisodes}\n};`;

  serviceContent = serviceContent.replace(
    /export const GRIMM_DRIVE_EPISODES: Record<string, \{ fileId: string; title: string; quality: string \}> = \{[\s\S]*?\};/,
    replacementBlock
  );

  fs.writeFileSync(servicePath, serviceContent, 'utf8');
  console.log(`\n✅ Archivo services/googleDrive.ts actualizado automáticamente con éxito.`);
}

function parseEpisode(fullName, fileId, episodes) {
  if (!fullName || !fileId) return;

  // Filter out invalid or junk IDs
  if (fileId.length < 28 || fileId.startsWith('AAAAA') || fileId.startsWith('googlelogo')) {
    return;
  }

  // Filter out system files, SVGs, images, CSS
  if (/\.(?:svg|png|jpg|jpeg|css|js|json|html|xml)$/i.test(fullName)) return;
  if (/^0x[0-9a-f]/i.test(fullName)) return;
  if (fullName.includes('googlelogo') || fullName.includes('@media')) return;
  if (/^(?:desktop\.ini|\.ds_store|thumbs\.db)$/i.test(fullName.trim())) return;

  // Matches flexible formats:
  // - Grimm.1x18.Dual.1080p-lat
  // - Grimm.1x18.Dual.1080p-lat.mkv
  // - Grimm.1x02.HD1080p-lat.mkv
  // - Grimm.S01E18.Dual
  // - Grimm - 1x18 - Dual
  // - Grimm 1x18
  const epMatch =
    fullName.match(/(?:s|temp|temporada|\b)?(\d{1,2})[xxe](\d{1,2})\b/i) ||
    fullName.match(/(\d{1,2})x(\d{1,2})/i) ||
    fullName.match(/s(\d{1,2})e(\d{1,2})/i);

  if (!epMatch) return;

  const season = parseInt(epMatch[1], 10);
  const episode = parseInt(epMatch[2], 10);

  // Validate Grimm season and episode boundaries
  if (season < 1 || season > 6) return;
  if (episode < 1 || episode > 30) return;

  // Must be Grimm related
  const isGrimm = /grimm/i.test(fullName);
  const isVideo = /\.(?:mkv|mp4|avi|webm|ts|mov|m4v)$/i.test(fullName);
  const isVideoNaming = /(?:dual|1080p|720p|lat|hd|bdrip|web-dl|x264|hevc)/i.test(fullName);

  if (!isGrimm && !isVideo && !isVideoNaming) return;

  const key = `grimm-s${season}e${episode}`;
  const cleanTitle = fullName.replace(/[,;]+$/, '').trim();

  // Smart quality & audio detection:
  let quality = '1080p HD';
  const lower = cleanTitle.toLowerCase();
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

  episodes[key] = {
    fileId,
    title: cleanTitle,
    quality,
  };
}

syncDrive().catch((err) => {
  console.error('Error al sincronizar Google Drive:', err);
  process.exit(1);
});
