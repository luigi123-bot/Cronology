import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
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
import { useSeasonStore } from '@/store/useSeasonStore';
import { getStillUrl, getBannerUrl, type TMDBEpisode } from '@/services/tmdb';

interface SeasonVideoPlayerProps {
  seriesTitle?: string;
  seasonNumber?: number;
  backdropPath?: string | null;
}

export default function SeasonVideoPlayer({
  seriesTitle = 'Grimm',
  seasonNumber = 5,
  backdropPath,
}: SeasonVideoPlayerProps) {
  const { width } = useWindowDimensions();
  const videoRef = useRef<Video>(null);

  const {
    selectedEpisode,
    currentVideoUrl,
    isPlaying,
    setIsPlaying,
  } = useSeasonStore();

  const [status, setStatus] = useState<AVPlaybackStatus | null>(null);
  const [isBuffering, setIsBuffering] = useState(false);
  const [hasPlaybackError, setHasPlaybackError] = useState(false);
  const [showPosterPlaceholder, setShowPosterPlaceholder] = useState(!isPlaying);

  const isMobile = width < 650;
  const isTabletOrDesktop = width >= 900;

  // Sincronizar estado cuando cambia el episodio o la URL
  useEffect(() => {
    setHasPlaybackError(false);
    if (currentVideoUrl && isPlaying) {
      setShowPosterPlaceholder(false);
      videoRef.current?.playAsync().catch((err) => {
        console.warn('[SeasonVideoPlayer] Autoplay prevented or error:', err);
      });
    } else {
      // Inicia en pausa según los requisitos
      setShowPosterPlaceholder(!isPlaying);
    }
  }, [currentVideoUrl, isPlaying]);

  const handlePlaybackStatusUpdate = (playbackStatus: AVPlaybackStatus) => {
    setStatus(playbackStatus);
    if (!playbackStatus.isLoaded) {
      if (playbackStatus.error) {
        console.warn('[SeasonVideoPlayer] Error de reproducción:', playbackStatus.error);
        setHasPlaybackError(true);
      }
      return;
    }

    setIsBuffering(playbackStatus.isBuffering);
    setIsPlaying(playbackStatus.isPlaying);

    if (playbackStatus.isPlaying && showPosterPlaceholder) {
      setShowPosterPlaceholder(false);
    }
  };

  const handleStartPlayback = async () => {
    setShowPosterPlaceholder(false);
    setIsPlaying(true);
    try {
      await videoRef.current?.playAsync();
    } catch (e) {
      console.warn('[SeasonVideoPlayer] Error al iniciar video:', e);
    }
  };

  const openInBrowserFallback = () => {
    if (currentVideoUrl) {
      Linking.openURL(currentVideoUrl);
    }
  };

  const stillImage = selectedEpisode?.still_path
    ? getStillUrl(selectedEpisode.still_path)
    : backdropPath
    ? getBannerUrl(backdropPath)
    : 'https://image.tmdb.org/t/p/w1280/8mC4Q2YyA9qfD5PfZ1x39Z5WwKq.jpg';

  return (
    <Surface style={[styles.wrapper, isMobile && styles.wrapperMobile]} elevation={4}>
      <View
        style={[
          styles.playerContainer,
          isMobile ? styles.playerContainerMobile : styles.playerContainerDesktop,
        ]}
      >
        {/* Componente oficial de Video de Expo */}
        {currentVideoUrl ? (
          <Video
            ref={videoRef}
            style={styles.video}
            source={{ uri: currentVideoUrl }}
            useNativeControls
            resizeMode={ResizeMode.CONTAIN}
            shouldPlay={isPlaying}
            isLooping={false}
            onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
            onError={(err) => {
              console.warn('[SeasonVideoPlayer] Video onError:', err);
              setHasPlaybackError(true);
            }}
          />
        ) : null}

        {/* Placeholder / Poster inicial cuando está en pausa o antes de reproducir */}
        {showPosterPlaceholder && (
          <View style={styles.placeholderLayer}>
            {stillImage && (
              <Image
                source={{ uri: stillImage }}
                style={StyleSheet.absoluteFillObject}
                contentFit="cover"
                transition={300}
              />
            )}

            {/* Gradiente oscuro sobre el poster */}
            <LinearGradient
              colors={[
                'rgba(10, 10, 18, 0.4)',
                'rgba(10, 10, 18, 0.85)',
                'rgba(10, 10, 18, 0.98)',
              ]}
              style={StyleSheet.absoluteFillObject}
            />

            {/* Información del episodio seleccionado y botón de Play */}
            <View style={styles.placeholderContent}>
              <View style={styles.seasonBadgeRow}>
                <Badge style={styles.seasonBadge}>
                  {`${seriesTitle.toUpperCase()} • T${seasonNumber}`}
                </Badge>
                {selectedEpisode && (
                  <Badge style={styles.episodeBadge}>
                    {`EPISODIO ${selectedEpisode.episode_number}`}
                  </Badge>
                )}
                <View style={styles.serverPill}>
                  <Ionicons name="sparkles" size={12} color="#4ade80" />
                  <Text style={styles.serverPillText}>HD 1080p</Text>
                </View>
              </View>

              <Text style={styles.placeholderTitle} numberOfLines={2}>
                {selectedEpisode
                  ? `${selectedEpisode.episode_number}. ${selectedEpisode.name}`
                  : `${seriesTitle} — Temporada ${seasonNumber}`}
              </Text>

              {selectedEpisode?.overview ? (
                <Text style={styles.placeholderOverview} numberOfLines={isMobile ? 2 : 3}>
                  {selectedEpisode.overview}
                </Text>
              ) : (
                <Text style={styles.placeholderOverview}>
                  Selecciona cualquier episodio del listado para iniciar la reproducción directa desde el servidor Nginx.
                </Text>
              )}

              {/* Botón central de Reproducir */}
              <Pressable
                style={({ pressed }) => [
                  styles.playButtonLarge,
                  pressed && styles.playButtonLargePressed,
                ]}
                onPress={handleStartPlayback}
                accessibilityRole="button"
                accessibilityLabel="Iniciar reproducción"
              >
                <LinearGradient
                  colors={['#7c5af3', '#5a3ec8']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.playButtonGradient}
                >
                  <Ionicons name="play" size={26} color="#ffffff" style={{ marginLeft: 3 }} />
                  <Text style={styles.playButtonText}>Reproducir Episodio</Text>
                </LinearGradient>
              </Pressable>
            </View>
          </View>
        )}

        {/* Indicador de buffering */}
        {isBuffering && !showPosterPlaceholder && (
          <View style={styles.bufferingOverlay}>
            <ActivityIndicator size="large" color="#7c5af3" />
            <Text style={styles.bufferingText}>Cargando video desde VPS...</Text>
          </View>
        )}

        {/* Fallback de error (ej. Mixed Content en Web cuando se solicita HTTP en sitio HTTPS) */}
        {hasPlaybackError && (
          <View style={styles.errorOverlay}>
            <MaterialCommunityIcons name="alert-circle-outline" size={44} color="#f87171" />
            <Text style={styles.errorTitle}>Error al reproducir desde VPS</Text>
            <Text style={styles.errorSub}>
              {Platform.OS === 'web'
                ? 'El navegador puede bloquear URLs HTTP no seguras si la app corre bajo HTTPS. Puedes abrir el video directamente:'
                : 'No se pudo conectar con el servidor de medios. Verifica tu conexión.'}
            </Text>
            <Pressable style={styles.externalLinkBtn} onPress={openInBrowserFallback}>
              <Ionicons name="open-outline" size={16} color="#ffffff" />
              <Text style={styles.externalLinkText}>Abrir en reproductor externo</Text>
            </Pressable>
          </View>
        )}
      </View>

      {/* Barra inferior de estado del video activo */}
      <View style={styles.nowPlayingBar}>
        <View style={styles.nowPlayingLeft}>
          <View style={[styles.liveDot, isPlaying && styles.liveDotActive]} />
          <Text style={styles.nowPlayingLabel}>
            {isPlaying ? 'REPRODUCIENDO:' : 'SELECCIONADO:'}
          </Text>
          <Text style={styles.nowPlayingTitle} numberOfLines={1}>
            {selectedEpisode
              ? `E${selectedEpisode.episode_number} - ${selectedEpisode.name}`
              : 'Ningún episodio'}
          </Text>
        </View>

        <View style={styles.nowPlayingRight}>
          <Text style={styles.vpsUrlText} numberOfLines={1}>
            {selectedEpisode ? `GRMM5${selectedEpisode.episode_number}.mp4` : ''}
          </Text>
        </View>
      </View>
    </Surface>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    borderRadius: 18,
    backgroundColor: '#12121c',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 16,
  },
  wrapperMobile: {
    borderRadius: 14,
    marginBottom: 12,
  },
  playerContainer: {
    width: '100%',
    backgroundColor: '#000000',
    position: 'relative',
    overflow: 'hidden',
  },
  playerContainerDesktop: {
    aspectRatio: 16 / 9,
    maxHeight: 520,
  },
  playerContainerMobile: {
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
  seasonBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  seasonBadge: {
    backgroundColor: '#7c5af3',
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 11,
    paddingHorizontal: 8,
  },
  episodeBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    color: '#e2e8f0',
    fontWeight: '700',
    fontSize: 11,
    paddingHorizontal: 8,
  },
  serverPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(74, 222, 128, 0.14)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(74, 222, 128, 0.3)',
  },
  serverPillText: {
    color: '#86efac',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  placeholderTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  placeholderOverview: {
    color: '#94a3b8',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },
  playButtonLarge: {
    alignSelf: 'flex-start',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#7c5af3',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  playButtonLargePressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.9,
  },
  playButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 18,
    gap: 8,
  },
  playButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  bufferingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 15,
    gap: 10,
  },
  bufferingText: {
    color: '#cbd5e1',
    fontSize: 13,
    fontWeight: '600',
  },
  errorOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 10, 15, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    zIndex: 20,
    gap: 8,
  },
  errorTitle: {
    color: '#f87171',
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
  errorSub: {
    color: '#94a3b8',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 17,
    maxWidth: 420,
    marginBottom: 8,
  },
  externalLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#7c5af3',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  externalLinkText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  nowPlayingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#101018',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  nowPlayingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    marginRight: 10,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#64748b',
  },
  liveDotActive: {
    backgroundColor: '#22c55e',
  },
  nowPlayingLabel: {
    color: '#a855f7',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  nowPlayingTitle: {
    color: '#f1f5f9',
    fontSize: 13,
    fontWeight: '600',
    flexShrink: 1,
  },
  nowPlayingRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vpsUrlText: {
    color: '#64748b',
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
});
