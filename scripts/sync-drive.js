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

  // Pattern in Google Drive folder payload:
  // \x5b\x22{fileId}\x22,\x5b\x22{folderId}\x22\x5d,\x22{fileName}\x22
  // Or escaped in quotes
  const episodes = {};

  // Pattern 1: Escaped hex JSON format
  // Example: \x5b\x221g17xPECwlTphlS8kcR5qpkA3EeMovBQd\x22,\x5b\x221lVqDRczGqe-3cYuTcD_NC2Nu0n955TjS\x22\x5d,\x22Grimm.1x02.HD1080p-lat.mkv\x22
  const hexPattern = /\\x5b\\x22([a-zA-Z0-9_-]{25,45})\\x22,\\x5b\\x22[a-zA-Z0-9_-]+\\x22\\x5d,\\x22([^\\"]+)\.(?:mkv|mp4|avi)\\x22/gi;
  let match;
  while ((match = hexPattern.exec(html)) !== null) {
    const fileId = match[1];
    const baseName = match[2];
    const fullName = `${baseName}.mkv`;
    parseEpisode(fullName, fileId, episodes);
  }

  // Pattern 2: Standard JSON array if rendered unescaped
  const standardPattern = /\["([a-zA-Z0-9_-]{25,45})",\["[a-zA-Z0-9_-]+"\],"([^"]+)\.(?:mkv|mp4|avi)"/gi;
  while ((match = standardPattern.exec(html)) !== null) {
    const fileId = match[1];
    const baseName = match[2];
    const fullName = `${baseName}.mkv`;
    parseEpisode(fullName, fileId, episodes);
  }

  // Pattern 3: Generic fallback scanning filenames and adjacent IDs
  const namePattern = /(Grimm\.(\d+)x(\d+)[^"'\s<>\\]*\.(?:mkv|mp4))/gi;
  while ((match = namePattern.exec(html)) !== null) {
    const fullName = match[1];
    const chunk = html.slice(Math.max(0, match.index - 300), Math.min(html.length, match.index + 300));
    const ids = chunk.match(/[a-zA-Z0-9_-]{33}/g);
    if (ids && ids.length > 0) {
      parseEpisode(fullName, ids[0], episodes);
    }
  }

  console.log(`\n🎉 Se encontraron ${Object.keys(episodes).length} capítulos organizados:`);
  console.log(JSON.stringify(episodes, null, 2));

  // Update services/googleDrive.ts
  const servicePath = path.join(__dirname, '..', 'services', 'googleDrive.ts');
  let serviceContent = fs.readFileSync(servicePath, 'utf8');

  const serializedEpisodes = Object.entries(episodes)
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
  // Matches: Grimm.1x02.HD1080p-lat.mkv or Grimm.S01E02 or Grimm.1x2
  const epMatch = fullName.match(/(\d+)x(\d+)/i) || fullName.match(/s(\d+)e(\d+)/i);
  if (!epMatch) return;

  const season = parseInt(epMatch[1], 10);
  const episode = parseInt(epMatch[2], 10);
  const key = `grimm-s${season}e${episode}`;

  if (!episodes[key]) {
    episodes[key] = {
      fileId,
      title: fullName,
      quality: '1080p HD Latino',
    };
  }
}

syncDrive().catch((err) => {
  console.error('Error al sincronizar Google Drive:', err);
  process.exit(1);
});
