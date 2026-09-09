/**
 * scripts/sync-vps.js
 * Escáner y Sincronizador Automático de Medios del VPS Nginx de Cronology
 * Conecta con https://streaming.techzonne.online/ y detecta todas las series,
 * temporadas y archivos disponibles para sincronizarlos con la app web.
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const VPS_BASE = 'https://streaming.techzonne.online';

function checkUrl(urlPath) {
  return new Promise((resolve) => {
    const fullUrl = `${VPS_BASE}${urlPath}`;
    const req = https.request(
      fullUrl,
      { method: 'HEAD', timeout: 5000 },
      (res) => {
        resolve({
          statusCode: res.statusCode,
          contentLength: parseInt(res.headers['content-length'] || '0', 10),
          contentType: res.headers['content-type'] || '',
        });
      }
    );
    req.on('error', () => resolve({ statusCode: 0, contentLength: 0 }));
    req.on('timeout', () => {
      req.destroy();
      resolve({ statusCode: 0, contentLength: 0 });
    });
    req.end();
  });
}

async function scanGrimmSeason5() {
  console.log('\n🔍 [1/3] Escaneando Grimm - Temporada 5 en VPS...');
  const episodes = [];

  for (let i = 1; i <= 22; i++) {
    const filename = `GRMM5${i}.mp4`;
    const relPath = `/Series/Grimm/Season%205/${filename}`;
    const res = await checkUrl(relPath);

    if (res.statusCode === 200) {
      const mb = Math.round(res.contentLength / (1024 * 1024));
      console.log(`  ✅ Grimm 5x${String(i).padStart(2, '0')}: ${filename} (${mb} MB)`);
      episodes.push({
        seasonNumber: 5,
        episodeNumber: i,
        filename,
        url: `${VPS_BASE}${relPath}`,
        sizeMb: mb,
        contentType: res.contentType,
      });
    } else {
      console.log(`  ❌ Grimm 5x${String(i).padStart(2, '0')}: No disponible (${res.statusCode})`);
    }
  }

  return episodes;
}

async function scanGrimmSeasons1To4() {
  console.log('\n🔍 [2/3] Escaneando Grimm - Temporadas 1 a 4 en VPS...');
  const episodes = [];

  // Mapeos conocidos de nombres de archivo
  const knownFiles = {
    1: (ep) => `Grimm.1x${String(ep).padStart(2, '0')}.HD1080p-lat.mkv`,
    2: (ep) => (ep <= 2 ? `Grimm.2x${String(ep).padStart(2, '0')}.Dual.1080p-lat.mp4` : `Grimm.2x${String(ep).padStart(2, '0')}.Dual.1080p-lat.mkv`),
  };

  for (const season of [1, 2]) {
    const fileFn = knownFiles[season];
    for (let ep = 1; ep <= 22; ep++) {
      const fn = fileFn(ep);
      const relPath = `/Series/Grimm/Season%20${season}/${encodeURIComponent(fn)}`;
      const res = await checkUrl(relPath);

      if (res.statusCode === 200) {
        const mb = Math.round(res.contentLength / (1024 * 1024));
        console.log(`  ✅ Grimm ${season}x${String(ep).padStart(2, '0')}: ${fn} (${mb} MB)`);
        episodes.push({
          seasonNumber: season,
          episodeNumber: ep,
          filename: fn,
          url: `${VPS_BASE}${relPath}`,
          sizeMb: mb,
          contentType: res.contentType,
        });
      }
    }
  }

  return episodes;
}

async function scanSeriesFolders() {
  console.log('\n🔍 [3/3] Escaneando carpetas de series principales...');
  const candidates = [
    'Grimm',
    'Gravity Falls',
    'Chicago Fire',
    'Chicago P.D.',
    'Chicago Med',
    'The Boys',
    'Breaking Bad',
  ];

  const availableSeries = [];
  for (const name of candidates) {
    const relPath = `/Series/${encodeURIComponent(name)}/`;
    const res = await checkUrl(relPath);
    if (res.statusCode !== 404 && res.statusCode !== 0) {
      console.log(`  📁 Carpeta detectada: /Series/${name}/ (Status: ${res.statusCode})`);
      availableSeries.push({ name, url: `${VPS_BASE}${relPath}` });
    }
  }

  return availableSeries;
}

async function main() {
  console.log('🚀 Iniciando escaneo de VPS: ' + VPS_BASE);
  const startTime = Date.now();

  const seriesFolders = await scanSeriesFolders();
  const grimmS5 = await scanGrimmSeason5();
  const grimmOther = await scanGrimmSeasons1To4();

  const catalog = {
    updatedAt: new Date().toISOString(),
    vpsBaseUrl: VPS_BASE,
    seriesDetected: seriesFolders,
    grimmEpisodes: [...grimmOther, ...grimmS5],
    totalGrimmSynced: grimmOther.length + grimmS5.length,
  };

  const outputPath = path.join(__dirname, '..', 'services', 'syncedVpsCatalog.json');
  fs.writeFileSync(outputPath, JSON.stringify(catalog, null, 2), 'utf-8');

  console.log(`\n🎉 ¡Sincronización con VPS completada en ${((Date.now() - startTime) / 1000).toFixed(1)}s!`);
  console.log(`📊 Total de episodios confirmados en el VPS: ${catalog.totalGrimmSynced}`);
  console.log(`💾 Catálogo guardado en: services/syncedVpsCatalog.json`);
}

main().catch((err) => {
  console.error('Error durante la sincronización:', err);
  process.exit(1);
});
