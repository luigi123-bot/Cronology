import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  useWindowDimensions,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { Video, ResizeMode, type AVPlaybackStatus } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Badge, Surface } from 'react-native-paper';
import { useMediaStore } from '@/store/useMediaStore';

export default function DynamicMediaVideoPlayer() {
  const { width } = useWindowDimensions();
  const isMobile = width < 600;
  const videoRef = useRef<Video>(null);

  const {
    activeMedia,
    media,
    isPlaying,
    setIsPlaying,
    playMovie,
  } = useMediaStore();

  const [status, setStatus] = useState<AVPlaybackStatus | null>(null);
  const [isBuffering, setIsBuffering] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [showPlaceholder, setShowPlaceholder] = useState(!isPlaying);

  // Sincronizar reproducción cuando el store actualiza activeMedia o isPlaying
  useEffect(() => {
    setHasError(false);
    if (activeMedia?.streamUrl && isPlaying) {
      setShowPlaceholder(false);
      videoRef.current?.playAsync().catch((err) => {
        console.warn('[DynamicMediaVideoPlayer] Autoplay error:', err);
      });
    } else {
      setShowPlaceholder(!isPlaying);
    }
  }, [activeMedia?.streamUrl, isPlaying]);

  const handlePlaybackStatusUpdate = useCallback((playbackStatus: AVPlaybackStatus) => {
    setStatus(playbackStatus);
    if (!playbackStatus.isLoaded) {
      if (playbackStatus.error) {
        console.warn('[DynamicMediaVideoPlayer] Error de reproducción:', playbackStatus.error);
        setHasError(true);
      }
      return;
    }

    setIsBuffering(playbackStatus.isBuffering);
    setIsPlaying(playbackStatus.isPlaying);

    if (playbackStatus.isPlaying && showPlaceholder) {
      setShowPlaceholder(false);
    }
  }, [showPlaceholder, setIsPlaying]);

  const handleStartPlay = async () => {
    if (activeMedia?.isMovie) {
      playMovie();
    } else {
      setIsPlaying(true);
    }
    setShowPlaceholder(false);
    try {
      await videoRef.current?.playAsync();
    } catch (e) {
      console.warn('[DynamicMediaVideoPlayer] Error playAsync:', e);
    }
  };

  const openInExternalPlayer = () => {
    if (activeMedia?.streamUrl) {
      Linking.openURL(activeMedia.streamUrl);
    }
  };

  const posterUri =
    activeMedia?.posterUrl ||
    media?.backdropUrl ||
    media?.posterUrl ||
    'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=1280&q=80';

  return (
    <Surface style={[styles.cardWrapper, isMobile && styles.cardWrapperMobile]} elevation={4}>
      <View
        style={[
          styles.playerBox,
          isMobile ? styles.playerBoxMobile : styles.playerBoxDesktop,
        ]}
      >
        {/* Componente Oficial de Video de Expo */}
        {activeMedia?.streamUrl ? (
          <Video
            ref={videoRef}
            style={styles.video}
            source={{ uri: activeMedia.streamUrl }}
            useNativeControls
            resizeMode={ResizeMode.CONTAIN}
            shouldPlay={isPlaying}
            isLooping={false}
            onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
            onError={() => setHasError(true)}
          />
        ) : null}

        {/* Placeholder / Póster inicial cuando está en pausa o antes de reproducir */}
        {showPlaceholder && (
          <View style={styles.placeholderLayer}>
            <Image
              source={{ uri: posterUri }}
              style={StyleSheet.absoluteFillObject}
              contentFit="cover"
              transition={300}
            />

            {/* Gradiente cinematográfico */}
            <LinearGradient
              colors={[
                'rgba(8, 8, 14, 0.4)',
                'rgba(8, 8, 14, 0.75)',
                'rgba(8, 8, 14, 0.98)',
              ]}
              style={StyleSheet.absoluteFillObject}
            />

            <View style={styles.placeholderContent}>
              <View style={styles.badgeRow}>
                <Badge style={styles.typeBadge}>
                  {media?.type === 'movie' ? 'PELÍCULA' : 'SERIE'}
                </Badge>
                {activeMedia?.seasonNumber != null && activeMedia?.episodeNumber != null && (
                  <Badge style={styles.episodeBadge}>
                    {`T${activeMedia.seasonNumber} : E${activeMedia.episodeNumber}`}
                  </Badge>
                )}
                <View style={styles.vpsServerPill}>
                  <Ionicons name="sparkles" size={12} color="#4ade80" />
                  <Text style={styles.vpsServerText}>FULL HD 1080p</Text>
                </View>
              </View>

              <Text style={styles.placeholderTitle} numberOfLines={2}>
                {activeMedia?.title || media?.title || 'Cargando contenido...'}
              </Text>

              {activeMedia?.subTitle ? (
                <Text style={styles.placeholderSubTitle} numberOfLines={1}>
                  {activeMedia.subTitle}
                </Text>
              ) : null}

              <Pressable
                style={({ pressed }) => [
                  styles.playButton,
                  pressed && styles.playButtonPressed,
                ]}
                onPress={handleStartPlay}
                accessibilityRole="button"
                accessibilityLabel="Iniciar reproducción"
              >
                <LinearGradient
                  colors={['#7c5af3', '#5932d8']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.playButtonGradient}
                >
                  <Ionicons name="play" size={24} color="#ffffff" style={{ marginLeft: 3 }} />
                  <Text style={styles.playButtonText}>
                    {media?.type === 'movie' ? 'Reproducir Película' : 'Reproducir Ahora'}
                  </Text>
                </LinearGradient>
              </Pressable>
            </View>
          </View>
        )}

        {/* Indicador de buffering */}
        {isBuffering && !showPlaceholder && (
          <View style={styles.overlayCenter}>
            <ActivityIndicator size="large" color="#7c5af3" />
            <Text style={styles.bufferingText}>Transfiriendo video desde VPS...</Text>
          </View>
        )}

        {/* Fallback de error (ej. Mixed Content en navegadores web) */}
        {hasError && (
          <View style={styles.overlayCenter}>
            <MaterialCommunityIcons name="alert-circle-outline" size={48} color="#f87171" />
            <Text style={styles.errorTitle}>Error al reproducir el video</Text>
            <Text style={styles.errorDescription}>
              {Platform.OS === 'web'
                ? 'El navegador puede restringir la reproducción por seguridad. Puedes abrirlo directamente:'
                : 'Verifica la conexión con el servidor Nginx de streaming.'}
            </Text>
            <Pressable style={styles.externalBtn} onPress={openInExternalPlayer}>
              <Ionicons name="open-outline" size={16} color="#ffffff" />
              <Text style={styles.externalBtnText}>Abrir enlace de streaming</Text>
            </Pressable>
          </View>
        )}
      </View>

      {/* Info bar inferior */}
      <View style={styles.bottomInfoBar}>
        <View style={styles.infoLeft}>
          <View style={[styles.statusDot, isPlaying && styles.statusDotActive]} />
          <Text style={styles.streamLabel}>
            {isPlaying ? 'EN STREAMING:' : 'PREPARADO:'}
          </Text>
          <Text style={styles.streamTarget} numberOfLines={1}>
            {activeMedia?.title || media?.title || 'Esperando selección'}
          </Text>
        </View>

        {activeMedia?.streamUrl && (
          <Pressable onPress={openInExternalPlayer} style={styles.directLink}>
            <Ionicons name="link-outline" size={13} color="#94a3b8" />
            <Text style={styles.directLinkText}>Direct Link</Text>
          </Pressable>
        )}
      </View>
    </Surface>
  );
}

const styles = StyleSheet.create({
  cardWrapper: {
    width: '100%',
    borderRadius: 16,
    backgroundColor: '#12121e',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 16,
  },
  cardWrapperMobile: {
    borderRadius: 12,
    marginBottom: 12,
  },
  playerBox: {
    width: '100%',
    backgroundColor: '#000000',
    position: 'relative',
    overflow: 'hidden',
  },
  playerBoxDesktop: {
    aspectRatio: 16 / 9,
    maxHeight: 520,
  },
  playerBoxMobile: {
    aspectRatio: 16 / 9,
    minHeight: 220,
  },
  video: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000000',
  },
  placeholderLayer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    padding: 20,
    zIndex: 10,
  },
  placeholderContent: {
    zIndex: 2,
    maxWidth: 620,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  typeBadge: {
    backgroundColor: '#7c5af3',
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 10,
    paddingHorizontal: 6,
  },
  episodeBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    color: '#f1f5f9',
    fontWeight: '700',
    fontSize: 10,
    paddingHorizontal: 6,
  },
  vpsServerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(74, 222, 128, 0.14)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(74, 222, 128, 0.3)',
  },
  vpsServerText: {
    color: '#86efac',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  placeholderTitle: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.4,
    marginBottom: 4,
  },
  placeholderSubTitle: {
    color: '#c084fc',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 16,
  },
  playButton: {
    alignSelf: 'flex-start',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#7c5af3',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  playButtonPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  playButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 20,
    gap: 8,
  },
  playButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  overlayCenter: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 10, 18, 0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    zIndex: 15,
    gap: 10,
  },
  bufferingText: {
    color: '#cbd5e1',
    fontSize: 13,
    fontWeight: '600',
  },
  errorTitle: {
    color: '#f87171',
    fontSize: 16,
    fontWeight: '800',
  },
  errorDescription: {
    color: '#94a3b8',
    fontSize: 12,
    textAlign: 'center',
    maxWidth: 380,
    lineHeight: 18,
  },
  externalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#7c5af3',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 6,
  },
  externalBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  bottomInfoBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#0e0e16',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  infoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    marginRight: 10,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#64748b',
  },
  statusDotActive: {
    backgroundColor: '#22c55e',
  },
  streamLabel: {
    color: '#a855f7',
    fontSize: 11,
    fontWeight: '800',
  },
  streamTarget: {
    color: '#f1f5f9',
    fontSize: 12,
    fontWeight: '600',
    flexShrink: 1,
  },
  directLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  directLinkText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '600',
  },
});
