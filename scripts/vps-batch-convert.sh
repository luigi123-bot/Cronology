#!/bin/bash
# ==============================================================================
# scripts/vps-batch-convert.sh
# Conversor por lotes ultra-rápido de MKV a MP4 para Cronology en el VPS
#
# • Copia el flujo de video H.264 intacto (-c:v copy) -> 0% pérdida de calidad y velocidad extrema (~15s por capítulo).
# • Convierte el audio a AAC (-c:a aac -b:a 256k) para compatibilidad 100% nativa en web, móviles y Smart TVs.
# • Habilita streaming inmediato (-movflags +faststart).
# • Elimina el archivo .mkv original únicamente tras verificar que el .mp4 se generó con éxito.
#
# USO EN EL VPS (desde la terminal de tu servidor):
#   chmod +x scripts/vps-batch-convert.sh
#   ./scripts/vps-batch-convert.sh /var/www/streaming/Series/Grimm
#   (o pásale la carpeta raíz donde tengas tus series)
# ==============================================================================

TARGET_DIR="${1:-.}"

echo "========================================================="
echo "🎬 Iniciando conversión de MKV a MP4 en: $TARGET_DIR"
echo "========================================================="

# Verificar que ffmpeg esté instalado en el VPS
if ! command -v ffmpeg &> /dev/null; then
    echo "❌ Error: 'ffmpeg' no está instalado en este servidor."
    echo "👉 Instálalo en Ubuntu/Debian con: sudo apt update && sudo apt install -y ffmpeg"
    exit 1
fi

COUNT=0
SUCCESS_COUNT=0
FAIL_COUNT=0

# Buscar recursivamente todos los archivos .mkv
find "$TARGET_DIR" -type f -name "*.mkv" | while read -r mkv_file; do
    COUNT=$((COUNT + 1))
    base_name="${mkv_file%.*}"
    mp4_file="${base_name}.mp4"
    temp_mp4="${base_name}.tmp.mp4"

    echo ""
    echo "---------------------------------------------------------"
    echo "▶️ [$COUNT] Procesando: $(basename "$mkv_file")"
    echo "---------------------------------------------------------"

    # Ejecutar conversión con FFmpeg
    ffmpeg -y -hide_banner -loglevel warning -stats \
        -i "$mkv_file" \
        -c:v copy \
        -c:a aac -b:a 256k \
        -movflags +faststart \
        "$temp_mp4"

    if [ $? -eq 0 ] && [ -f "$temp_mp4" ] && [ -s "$temp_mp4" ]; then
        mv "$temp_mp4" "$mp4_file"
        rm -f "$mkv_file"
        echo "✅ Éxito: Generado $(basename "$mp4_file")"
        echo "🗑️ Eliminado original: $(basename "$mkv_file")"
        SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
    else
        echo "❌ Error al procesar $mkv_file"
        rm -f "$temp_mp4"
        FAIL_COUNT=$((FAIL_COUNT + 1))
    fi
done

echo ""
echo "========================================================="
echo "🎉 ¡Proceso finalizado!"
echo "   Archivos convertidos a MP4: $SUCCESS_COUNT"
echo "   Archivos fallidos: $FAIL_COUNT"
echo "========================================================="
