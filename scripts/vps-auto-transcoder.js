/**
 * scripts/vps-auto-transcoder.js
 * Servidor Microservicio de Transcodificación y Remux On-Demand para VPS (Nginx / Linux)
 *
 * FUNCIONAMIENTO:
 * 1. Recibe la petición cuando el usuario reproduce un video MKV.
 * 2. Si ya existe la versión .mp4, responde inmediatamente.
 * 3. Si sólo existe el .mkv:
 *    - Ejecuta FFmpeg ultra-rápido: remuxing (-c:v copy -c:a aac -movflags +faststart)
 *      (Al no recodificar video, tarda sólo ~10-20 segundos en vez de horas).
 *    - Elimina automáticamente el archivo .mkv original para ahorrar espacio.
 *    - Devuelve la URL directa del .mp4 generado.
 *
 * USO EN TU VPS:
 *   node scripts/vps-auto-transcoder.js
 *   o con PM2: pm2 start scripts/vps-auto-transcoder.js --name "cronology-transcoder"
 */

const http = require('http');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.TRANSCODER_PORT || 3005;
// Ruta raíz donde Nginx sirve los medios en tu VPS (ajustar si es diferente, ej. /var/www/streaming)
const MEDIA_ROOT = process.env.VPS_MEDIA_ROOT || '/var/www/streaming';
const PUBLIC_STREAMING_URL = process.env.STREAMING_BASE_URL || 'https://streaming.techzonne.online';

// Registro de conversiones en curso para evitar ejecuciones simultáneas del mismo archivo
const activeJobs = new Map();

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(JSON.stringify(data));
}

/**
 * Convierte MKV a MP4 ultra-rápido:
 * - Copia el flujo de video H.264 sin tocarlo (-c:v copy) -> Calidad 100% original y ultra-rápido.
 * - Convierte el audio AC-3 a AAC estéreo/surround (-c:a aac -b:a 256k) -> Compatible con todos los navegadores.
 * - Añade -movflags +faststart para que el navegador empiece a reproducir de inmediato sin descargar todo.
 */
function convertMkvToMp4(mkvAbsolutePath, mp4AbsolutePath) {
  return new Promise((resolve, reject) => {
    console.log(`\n🎬 [Transcoder] Iniciando conversión:`);
    console.log(`   De:   ${mkvAbsolutePath}`);
    console.log(`   Hacia: ${mp4AbsolutePath}`);

    const startTime = Date.now();
    const tempMp4 = `${mp4AbsolutePath}.tmp.mp4`;

    const args = [
      '-y',
      '-i', mkvAbsolutePath,
      '-c:v', 'copy',            // Copia de video idéntica (sin re-codificación)
      '-c:a', 'aac',             // Audio AAC universal para navegadores
      '-b:a', '256k',
      '-movflags', '+faststart', // Permite streaming inmediato en navegador
      tempMp4,
    ];

    const ffmpeg = spawn('ffmpeg', args);

    ffmpeg.stderr.on('data', (data) => {
      // Opcional: registrar progreso de ffmpeg si es necesario
    });

    ffmpeg.on('close', (code) => {
      if (code === 0) {
        try {
          // Renombrar temporal a final
          fs.renameSync(tempMp4, mp4AbsolutePath);

          // Eliminar archivo MKV original según lo solicitado
          if (fs.existsSync(mkvAbsolutePath)) {
            fs.unlinkSync(mkvAbsolutePath);
            console.log(`   🗑️ MKV original eliminado: ${path.basename(mkvAbsolutePath)}`);
          }

          const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
          console.log(`   ✅ Conversión completada en ${elapsed}s: ${path.basename(mp4AbsolutePath)}`);
          resolve({ success: true, elapsedSeconds: elapsed });
        } catch (err) {
          reject(err);
        }
      } else {
        if (fs.existsSync(tempMp4)) {
          fs.unlinkSync(tempMp4);
        }
        reject(new Error(`FFmpeg falló con código ${code}`));
      }
    });

    ffmpeg.on('error', (err) => {
      if (fs.existsSync(tempMp4)) {
        fs.unlinkSync(tempMp4);
      }
      reject(err);
    });
  });
}

const server = http.createServer(async (req, res) => {
  // Manejo de preflight CORS
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url, true);

  // Endpoint de salud
  if (parsedUrl.pathname === '/health') {
    sendJson(res, 200, { status: 'ok', service: 'Cronology On-Demand Transcoder' });
    return;
  }

  // Endpoint principal: /api/convert?relPath=Series/Grimm/Season%201/Grimm.1x01.HD1080p-lat.mkv
  if (parsedUrl.pathname === '/api/convert') {
    const relPath = parsedUrl.query.relPath || parsedUrl.query.path || '';
    if (!relPath) {
      sendJson(res, 400, { error: 'Se requiere el parámetro relPath (ej: Series/Grimm/Season 1/archivo.mkv)' });
      return;
    }

    // Sanitizar ruta
    const sanitizedRel = decodeURIComponent(relPath).replace(/^\/+/, '');
    const mkvAbs = path.join(MEDIA_ROOT, sanitizedRel);
    const mp4Rel = sanitizedRel.replace(/\.mkv$/i, '.mp4');
    const mp4Abs = path.join(MEDIA_ROOT, mp4Rel);

    const publicMp4Url = `${PUBLIC_STREAMING_URL}/${encodeURI(mp4Rel)}`;

    // 1. Si el MP4 ya existe, devolverlo inmediatamente
    if (fs.existsSync(mp4Abs)) {
      sendJson(res, 200, {
        status: 'ready',
        message: 'El archivo MP4 ya existe y está disponible para streaming.',
        streamUrl: publicMp4Url,
        alreadyConverted: true,
      });
      return;
    }

    // 2. Verificar que exista el MKV original
    if (!fs.existsSync(mkvAbs)) {
      sendJson(res, 404, {
        error: `No se encontró el archivo original: ${sanitizedRel}`,
      });
      return;
    }

    // 3. Si ya se está convirtiendo este archivo, avisar que espere
    if (activeJobs.has(sanitizedRel)) {
      sendJson(res, 202, {
        status: 'converting',
        message: 'La conversión ya está en proceso en el VPS. Espera unos momentos.',
        streamUrl: publicMp4Url,
      });
      return;
    }

    // 4. Ejecutar la conversión on-demand
    activeJobs.set(sanitizedRel, Date.now());
    try {
      const result = await convertMkvToMp4(mkvAbs, mp4Abs);
      activeJobs.delete(sanitizedRel);

      sendJson(res, 200, {
        status: 'ready',
        message: 'Conversión exitosa a MP4 y MKV eliminado.',
        streamUrl: publicMp4Url,
        elapsedSeconds: result.elapsedSeconds,
      });
    } catch (err) {
      activeJobs.delete(sanitizedRel);
      console.error('❌ Error en conversión:', err);
      sendJson(res, 500, {
        error: 'Falló la conversión en el servidor VPS.',
        details: err.message,
      });
    }
    return;
  }

  sendJson(res, 404, { error: 'Ruta no encontrada' });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Cronology VPS Transcoder escuchando en http://0.0.0.0:${PORT}`);
  console.log(`📁 Directorio de medios: ${MEDIA_ROOT}`);
  console.log(`🌐 URL base pública: ${PUBLIC_STREAMING_URL}`);
});
