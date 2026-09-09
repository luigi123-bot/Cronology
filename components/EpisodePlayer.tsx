import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  Linking,
  useWindowDimensions,
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Video, ResizeMode, type AVPlaybackStatus } from 'expo-av';
import {
  Modal,
  Portal,
  RadioButton,
  Divider,
  Surface,
  IconButton,
} from 'react-native-paper';
import {
  buildStreamUrl,
  getStreamMediaInfo,
  isMkvUrl,
} from '@/services/streamUrlBuilder';
import {
  getWatchSession,
  saveWatchSession,
  clearWatchSession,
  saveSeriesCurrentEpisode,
  markEpisodeWatchedLocal,
  isEpisodeWatchedLocal,
} from '@/services/watchProgress';

interface EpisodePlayerProps {
  seriesTmdbId: number;
  seriesName: string;
  seasonNumber: number;
  episodeNumber: number;
  episodeName: string;
  youtubeClipId?: string | null;
  episodeId?: number;
  seriesId?: number;
}

export default function EpisodePlayer({
  seriesTmdbId,
  seriesName,
  seasonNumber,
  episodeNumber,
  episodeName,
  episodeId,
  seriesId,
}: EpisodePlayerProps) {
  const { width } = useWindowDimensions();
  const isMobile = width < 600;
  const isFocused = useIsFocused();

  // Construir la URL e información de streaming (soporta MKV y MP4)
  const mediaInfo = React.useMemo(() => {
    return getStreamMediaInfo(seriesName, seasonNumber, episodeNumber);
  }, [seriesName, seasonNumber, episodeNumber]);

  const [activeStreamUrl, setActiveStreamUrl] = useState<string>(mediaInfo.url);

  useEffect(() => {
    setActiveStreamUrl(mediaInfo.url);
    setHasError(false);
  }, [mediaInfo.url]);

  const currentUrl = activeStreamUrl;
  const isMkv = isMkvUrl(activeStreamUrl);
  const mediaKey = `episode-${seriesTmdbId || seriesId || 's'}-${seasonNumber}-${episodeNumber}`;
  const resolvedEpisodeId = episodeId || 0;
  const resolvedSeriesId = seriesId || seriesTmdbId || 0;

  // Estados del reproductor
  const [theaterMode, setTheaterMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showResumePrompt, setShowResumePrompt] = useState(false);
  const [savedTimeSecs, setSavedTimeSecs] = useState<number>(0);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [isWatched, setIsWatched] = useState<boolean>(() =>
    resolvedEpisodeId ? isEpisodeWatchedLocal(resolvedEpisodeId) : false
  );
  const [hasError, setHasError] = useState(false);

  // ─── Ajustes de Cine: Pistas de Audio, Subtítulos, Calidad y Velocidad ───
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'audio' | 'subtitles' | 'quality' | 'speed'>('audio');

  const [selectedAudio, setSelectedAudio] = useState<string>('es-lat');
  const [selectedSubtitle, setSelectedSubtitle] = useState<string>('off');
  const [selectedQuality, setSelectedQuality] = useState<string>('1080p');
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);

  const containerRef = useRef<View>(null);
  const playerFrameRef = useRef<View>(null);
  const webVideoRef = useRef<HTMLVideoElement | null>(null);
  const nativeVideoRef = useRef<Video | null>(null);

  // Pistas de Audio disponibles para MKV / Dual Audio
  const availableAudioTracks = [
    { id: 'es-lat', name: 'Español Latino', desc: 'Audio Principal (Dual)' },
    { id: 'en-orig', name: 'Inglés Original', desc: 'Audio Secundario' },
    { id: 'es-cast', name: 'Español (Castellano)', desc: 'Pista Alternativa' },
  ];

  // Opciones de subtítulos
  const availableSubtitles = [
    { id: 'off', name: 'Desactivados', desc: 'Sin subtítulos' },
    { id: 'es', name: 'Español Latino', desc: 'Subtítulos completos' },
    { id: 'es-forced', name: 'Español (Forzados)', desc: 'Solo diálogos extranjeros' },
    { id: 'en', name: 'English [CC]', desc: 'Closed Captions' },
  ];

  // Opciones de calidad / resolución
  const availableQualities = [
    { id: '1080p', name: '1080p Full HD', desc: 'Resolución Máxima Original' },
    { id: '720p', name: '720p HD', desc: 'Alta Definición Equilibrada' },
    { id: '480p', name: '480p SD', desc: 'Modo Ahorro de Datos' },
    { id: 'auto', name: 'Automática', desc: 'Ajuste según conexión' },
  ];

  // Opciones de velocidad
  const availableSpeeds = [0.75, 1.0, 1.25, 1.5, 2.0];

  // Guardar punto exacto donde va el usuario
  useEffect(() => {
    if (resolvedSeriesId && resolvedEpisodeId) {
      saveSeriesCurrentEpisode(resolvedSeriesId, {
        seriesId: resolvedSeriesId,
        seriesName,
        seasonNumber,
        episodeNumber,
        episodeId: resolvedEpisodeId,
        episodeName,
        progressPercent,
      });
    }
  }, [resolvedSeriesId, resolvedEpisodeId, seriesName, seasonNumber, episodeNumber, episodeName, progressPercent]);

  // Verificar sesión anterior para reanudar
  useEffect(() => {
    const session = getWatchSession(mediaKey);
    if (session) {
      try {
        const rawTime = localStorage.getItem(`pos_${mediaKey}`);
        if (rawTime) {
          const secs = parseFloat(rawTime);
          if (secs > 15) {
            setSavedTimeSecs(Math.floor(secs));
            setShowResumePrompt(true);
          }
        }
      } catch {}
    }
  }, [mediaKey]);

  // Manejar atajos de teclado en Web
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // No activar si el foco está en un input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      const video = webVideoRef.current;
      if (!video) return;

      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        if (video.paused) video.play().catch(() => {});
        else video.pause();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        video.currentTime = Math.max(0, video.currentTime - 10);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        video.currentTime = Math.min(video.duration || 0, video.currentTime + 10);
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        video.muted = !video.muted;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Manejar progreso en Web
  const handleWebTimeUpdate = useCallback(() => {
    if (!webVideoRef.current) return;
    const current = webVideoRef.current.currentTime;
    const duration = webVideoRef.current.duration;
    if (duration > 0) {
      const pct = Math.round((current / duration) * 100);
      setProgressPercent(pct);
      saveWatchSession(mediaKey, 'watching');
      try {
        localStorage.setItem(`pos_${mediaKey}`, String(current));
      } catch {}

      if (resolvedSeriesId && resolvedEpisodeId) {
        saveSeriesCurrentEpisode(resolvedSeriesId, {
          seriesId: resolvedSeriesId,
          seriesName,
          seasonNumber,
          episodeNumber,
          episodeId: resolvedEpisodeId,
          episodeName,
          progressPercent: pct,
        });
      }

      if (pct >= 90 && !isWatched && resolvedEpisodeId) {
        setIsWatched(true);
        markEpisodeWatchedLocal(resolvedEpisodeId, true);
      }
    }
  }, [mediaKey, resolvedSeriesId, resolvedEpisodeId, seriesName, seasonNumber, episodeNumber, episodeName, isWatched]);

  // Aplicar cambio de pista de audio
  const handleAudioChange = (trackId: string) => {
    setSelectedAudio(trackId);
    if (Platform.OS === 'web' && webVideoRef.current) {
      const video = webVideoRef.current as any;
      if (video.audioTracks && video.audioTracks.length > 1) {
        const targetIndex = trackId === 'en-orig' ? 1 : 0;
        for (let i = 0; i < video.audioTracks.length; i++) {
          video.audioTracks[i].enabled = i === targetIndex;
        }
      }
    }
  };

  // Aplicar cambio de subtítulos
  const handleSubtitleChange = (subId: string) => {
    setSelectedSubtitle(subId);
    if (Platform.OS === 'web' && webVideoRef.current) {
      const textTracks = webVideoRef.current.textTracks;
      if (textTracks && textTracks.length > 0) {
        for (let i = 0; i < textTracks.length; i++) {
          textTracks[i].mode = subId === 'off' ? 'disabled' : (textTracks[i].language === subId ? 'showing' : 'disabled');
        }
      }
    }
  };

  // Aplicar cambio de velocidad
  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (Platform.OS === 'web' && webVideoRef.current) {
      webVideoRef.current.playbackRate = speed;
    } else if (nativeVideoRef.current) {
      nativeVideoRef.current.setRateAsync(speed, true);
    }
  };

  // Saltar 10 segundos adelante / atrás
  const handleSkip = (seconds: number) => {
    if (Platform.OS === 'web' && webVideoRef.current) {
      webVideoRef.current.currentTime = Math.max(0, webVideoRef.current.currentTime + seconds);
    } else if (nativeVideoRef.current) {
      nativeVideoRef.current.getStatusAsync().then((st) => {
        if (st.isLoaded) {
          nativeVideoRef.current?.setPositionAsync(st.positionMillis + seconds * 1000);
        }
      });
    }
  };

  const toggleFullscreen = () => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    const doc = document as any;
    if (!doc.fullscreenElement) {
      const el = (playerFrameRef.current as any) || webVideoRef.current;
      if (el?.requestFullscreen) el.requestFullscreen();
      setIsFullscreen(true);
    } else {
      if (doc.exitFullscreen) doc.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleContinue = () => {
    setShowResumePrompt(false);
    if (Platform.OS === 'web' && webVideoRef.current && savedTimeSecs > 0) {
      webVideoRef.current.currentTime = savedTimeSecs;
      webVideoRef.current.play().catch(() => {});
    } else if (nativeVideoRef.current && savedTimeSecs > 0) {
      nativeVideoRef.current.setPositionAsync(savedTimeSecs * 1000);
      nativeVideoRef.current.playAsync();
    }
  };

  const handleRestart = () => {
    clearWatchSession(mediaKey);
    try {
      localStorage.removeItem(`pos_${mediaKey}`);
    } catch {}
    setSavedTimeSecs(0);
    setShowResumePrompt(false);
    if (Platform.OS === 'web' && webVideoRef.current) {
      webVideoRef.current.currentTime = 0;
      webVideoRef.current.play().catch(() => {});
    } else if (nativeVideoRef.current) {
      nativeVideoRef.current.setPositionAsync(0);
      nativeVideoRef.current.playAsync();
    }
  };

  const toggleWatchedManual = () => {
    if (!resolvedEpisodeId) return;
    const next = !isWatched;
    setIsWatched(next);
    markEpisodeWatchedLocal(resolvedEpisodeId, next);
  };

  return (
    <View
      ref={containerRef}
      style={[
        styles.container,
        isMobile && styles.containerMobile,
        theaterMode && styles.theaterContainer,
        isFullscreen && styles.containerFullscreen,
      ]}
    >
      {/* ── Cabecera Cinemática Profesional (Estilo Netflix / Jellyfin) ── */}
      {!isFullscreen && (
        <View style={[styles.cinemaHeader, isMobile && styles.cinemaHeaderMobile]}>
          <View style={styles.headerLeftGroup}>
            {/* Título y Código del Capítulo */}
            <View style={styles.seriesCodePill}>
              <Text style={styles.seriesCodeText}>{`T${seasonNumber}:E${episodeNumber}`}</Text>
            </View>

            <Text style={styles.seriesTitleText} numberOfLines={1}>
              {`${seriesName} • ${episodeName}`}
            </Text>

            {/* Badges de Formato y Calidad */}
            <View style={isMkv ? styles.mkvBadge : styles.qualityPill}>
              <Text style={isMkv ? styles.mkvBadgeText : styles.qualityPillText}>
                {isMkv ? 'MKV 1080p' : selectedQuality}
              </Text>
            </View>

            <View style={styles.dualAudioPill}>
              <Ionicons name="volume-medium" size={12} color="#38bdf8" />
              <Text style={styles.dualAudioText}>Dual Audio</Text>
            </View>
          </View>

          <View style={styles.headerRightGroup}>
            {/* Botón de Ajustes (Audio, Subtítulos, Calidad) */}
            <Pressable
              style={styles.settingsHeaderBtn}
              onPress={() => setShowSettingsModal(true)}
              accessibilityLabel="Ajustes de audio, subtítulos y calidad"
            >
              <Ionicons name="options" size={15} color="#c084fc" />
              <Text style={styles.settingsHeaderBtnText}>Audio & Subs</Text>
            </Pressable>

            {/* Botón de Visto */}
            <Pressable
              style={[styles.actionBtnWatched, isWatched && styles.actionBtnWatchedActive]}
              onPress={toggleWatchedManual}
              accessibilityLabel="Marcar como visto"
            >
              <Ionicons
                name={isWatched ? 'checkmark-circle' : 'checkmark-circle-outline'}
                size={14}
                color={isWatched ? '#4ade80' : '#94a3b8'}
              />
              <Text style={[styles.actionBtnWatchedText, isWatched && styles.actionBtnWatchedTextActive]}>
                {isWatched ? 'Visto' : 'Marcar'}
              </Text>
            </Pressable>

            {/* Reiniciar */}
            <Pressable style={styles.headerIconBtn} onPress={handleRestart} accessibilityLabel="Reiniciar">
              <Ionicons name="reload" size={15} color="#94a3b8" />
            </Pressable>

            {/* Modo Teatro */}
            {Platform.OS === 'web' && (
              <Pressable
                style={styles.headerIconBtn}
                onPress={() => setTheaterMode(!theaterMode)}
                accessibilityLabel="Modo Teatro"
              >
                <Ionicons name={theaterMode ? 'contract' : 'expand'} size={15} color="#94a3b8" />
              </Pressable>
            )}
          </View>
        </View>
      )}

      {/* ── Frame del Reproductor de Video ── */}
      <View
        ref={playerFrameRef}
        style={[
          styles.playerFrame,
          isMobile && styles.playerFrameMobile,
          theaterMode && styles.playerFrameTheater,
          isFullscreen && styles.playerFrameFullscreen,
        ]}
      >
        {Platform.OS === 'web' ? (
          <>
            <video
              key={`cinema-video-${currentUrl}-${refreshKey}`}
              ref={(el) => {
                webVideoRef.current = el;
              }}
              controls
              autoPlay
              playsInline
              preload="auto"
              onTimeUpdate={handleWebTimeUpdate}
              onError={() => setHasError(true)}
              style={{
                width: '100%',
                height: '100%',
                backgroundColor: '#000000',
                outline: 'none',
              }}
            >
              {/* Compatibilidad multi-contenedor: MKV (Matroska) / WebM / MP4 */}
              <source src={currentUrl} type={isMkv ? 'video/x-matroska' : 'video/mp4'} />
              <source src={currentUrl} type="video/webm" />
              <source src={currentUrl} type="video/mp4" />
              {mediaInfo.alternativeUrl && (
                <source src={mediaInfo.alternativeUrl} type={isMkv ? 'video/mp4' : 'video/x-matroska'} />
              )}

              {/* Pistas de subtítulos VTT */}
              <track
                label="Español Latino"
                kind="subtitles"
                srcLang="es"
                src={`/subtitles/${seriesName}-T${seasonNumber}E${episodeNumber}-es.vtt`}
                default={selectedSubtitle === 'es'}
              />
              <track
                label="English"
                kind="subtitles"
                srcLang="en"
                src={`/subtitles/${seriesName}-T${seasonNumber}E${episodeNumber}-en.vtt`}
                default={selectedSubtitle === 'en'}
              />
            </video>

            {/* Botón flotante de Ajustes sobre el video */}
            <Pressable
              style={styles.floatingSettingsBtn}
              onPress={() => setShowSettingsModal(true)}
            >
              <MaterialCommunityIcons name="cog" size={18} color="#ffffff" />
              <Text style={styles.floatingSettingsText}>Ajustes</Text>
            </Pressable>

            {/* Prompt de Reanudar */}
            {showResumePrompt && (
              <View style={styles.resumeOverlay}>
                <View style={styles.resumeCard}>
                  <Ionicons name="time" size={34} color="#a855f7" style={{ marginBottom: 8 }} />
                  <Text style={styles.resumeTitle}>¿Reanudar reproducción?</Text>
                  <Text style={styles.resumeSubtitle}>
                    {`Ibas en el minuto ${Math.floor(savedTimeSecs / 60)}:${String(savedTimeSecs % 60).padStart(2, '0')} de ${seriesName}.`}
                  </Text>
                  <View style={styles.resumeBtnRow}>
                    <Pressable style={styles.resumePrimaryBtn} onPress={handleContinue}>
                      <Ionicons name="play" size={16} color="#ffffff" />
                      <Text style={styles.resumePrimaryText}>Reanudar</Text>
                    </Pressable>
                    <Pressable style={styles.resumeSecondaryBtn} onPress={handleRestart}>
                      <Ionicons name="refresh" size={14} color="#cbd5e1" />
                      <Text style={styles.resumeSecondaryText}>Desde el inicio</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            )}
          </>
        ) : (
          <Video
            ref={nativeVideoRef}
            style={styles.videoNative}
            source={{ uri: currentUrl }}
            useNativeControls
            resizeMode={ResizeMode.CONTAIN}
            shouldPlay={true}
            onError={() => setHasError(true)}
          />
        )}

        {/* Fallback de error y compatibilidad MKV */}
        {hasError && (
          <View style={styles.errorOverlay}>
            <MaterialCommunityIcons
              name={isMkv ? 'movie-open-play-outline' : 'alert-circle-outline'}
              size={44}
              color={isMkv ? '#c084fc' : '#f87171'}
            />
            <Text style={styles.errorTitle}>
              {isMkv ? 'Archivo MKV (Matroska Dual Audio)' : 'Video temporalmente no disponible'}
            </Text>
            <Text style={styles.errorSub}>
              {isMkv
                ? 'El archivo es un MKV original con audio dual. Si tu navegador no lo decodifica de forma nativa, puedes reproducirlo directamente en VLC o abrir la transmisión.'
                : 'No se pudo cargar el archivo desde el servidor de streaming.'}
            </Text>

            <View style={styles.errorBtnRow}>
              <Pressable
                style={styles.directBtn}
                onPress={() => {
                  if (Platform.OS === 'web' && typeof window !== 'undefined') {
                    window.open(currentUrl, '_blank');
                  } else {
                    Linking.openURL(currentUrl);
                  }
                }}
              >
                <Ionicons name="play-circle-outline" size={16} color="#ffffff" />
                <Text style={styles.directBtnText}>Transmisión Directa</Text>
              </Pressable>

              <Pressable
                style={styles.vlcBtn}
                onPress={() => {
                  const vlcUrl = currentUrl.replace(/^https?:\/\//, 'vlc://');
                  Linking.openURL(vlcUrl).catch(() => {
                    Linking.openURL(currentUrl);
                  });
                }}
              >
                <MaterialCommunityIcons name="vlc" size={16} color="#f97316" />
                <Text style={styles.vlcBtnText}>Abrir en VLC</Text>
              </Pressable>

              {mediaInfo.alternativeUrl && (
                <Pressable
                  style={styles.altFormatBtn}
                  onPress={() => {
                    setActiveStreamUrl(mediaInfo.alternativeUrl!);
                    setHasError(false);
                    setRefreshKey((k) => k + 1);
                  }}
                >
                  <Ionicons name="swap-horizontal" size={15} color="#38bdf8" />
                  <Text style={styles.altFormatBtnText}>
                    {`Probar en ${isMkv ? 'MP4' : 'MKV'}`}
                  </Text>
                </Pressable>
              )}
            </View>
          </View>
        )}
      </View>

      {/* ── Barra Inferior: Controles de Cine Rápido y Detalles ── */}
      <View style={styles.footerBar}>
        <View style={styles.footerControls}>
          <Pressable style={styles.quickSkipBtn} onPress={() => handleSkip(-10)}>
            <MaterialCommunityIcons name="rewind-10" size={18} color="#cbd5e1" />
            <Text style={styles.quickSkipText}>10s</Text>
          </Pressable>

          <Pressable style={styles.quickSkipBtn} onPress={() => handleSkip(10)}>
            <MaterialCommunityIcons name="fast-forward-10" size={18} color="#cbd5e1" />
            <Text style={styles.quickSkipText}>10s</Text>
          </Pressable>

          <View style={styles.speedPill}>
            <Text style={styles.speedPillText}>{`${playbackSpeed}x`}</Text>
          </View>
        </View>

        <View style={styles.footerRightInfo}>
          <Text style={styles.footerSubStatus}>
            {`Audio: ${availableAudioTracks.find((a) => a.id === selectedAudio)?.name || 'Latino'} • Subs: ${selectedSubtitle === 'off' ? 'No' : selectedSubtitle.toUpperCase()}`}
          </Text>
        </View>
      </View>

      {/* ── Modal de Configuración Profesional (Audio, Subs, Calidad, Velocidad) ── */}
      <Portal>
        <Modal
          visible={showSettingsModal}
          onDismiss={() => setShowSettingsModal(false)}
          contentContainerStyle={styles.settingsModalContainer}
        >
          <Surface style={styles.settingsSurface} elevation={5}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <MaterialCommunityIcons name="tune" size={22} color="#c084fc" />
                <Text style={styles.modalTitle}>Ajustes de Reproducción</Text>
              </View>
              <IconButton icon="close" size={20} onPress={() => setShowSettingsModal(false)} />
            </View>

            {/* Pestañas de Ajustes */}
            <View style={styles.tabsRow}>
              <Pressable
                style={[styles.tabBtn, settingsTab === 'audio' && styles.tabBtnActive]}
                onPress={() => setSettingsTab('audio')}
              >
                <Ionicons name="volume-high" size={15} color={settingsTab === 'audio' ? '#fff' : '#94a3b8'} />
                <Text style={[styles.tabBtnText, settingsTab === 'audio' && styles.tabBtnTextActive]}>
                  Idioma / Audio
                </Text>
              </Pressable>

              <Pressable
                style={[styles.tabBtn, settingsTab === 'subtitles' && styles.tabBtnActive]}
                onPress={() => setSettingsTab('subtitles')}
              >
                <MaterialCommunityIcons name="subtitles" size={16} color={settingsTab === 'subtitles' ? '#fff' : '#94a3b8'} />
                <Text style={[styles.tabBtnText, settingsTab === 'subtitles' && styles.tabBtnTextActive]}>
                  Subtítulos
                </Text>
              </Pressable>

              <Pressable
                style={[styles.tabBtn, settingsTab === 'quality' && styles.tabBtnActive]}
                onPress={() => setSettingsTab('quality')}
              >
                <MaterialCommunityIcons name="quality-high" size={16} color={settingsTab === 'quality' ? '#fff' : '#94a3b8'} />
                <Text style={[styles.tabBtnText, settingsTab === 'quality' && styles.tabBtnTextActive]}>
                  Resolución
                </Text>
              </Pressable>

              <Pressable
                style={[styles.tabBtn, settingsTab === 'speed' && styles.tabBtnActive]}
                onPress={() => setSettingsTab('speed')}
              >
                <Ionicons name="speedometer" size={15} color={settingsTab === 'speed' ? '#fff' : '#94a3b8'} />
                <Text style={[styles.tabBtnText, settingsTab === 'speed' && styles.tabBtnTextActive]}>
                  Velocidad
                </Text>
              </Pressable>
            </View>

            <Divider style={styles.modalDivider} />

            {/* Contenido según la pestaña activa */}
            <View style={styles.tabContentArea}>
              {/* Pestaña: Idioma / Audio */}
              {settingsTab === 'audio' && (
                <View>
                  <Text style={styles.sectionSubtitle}>Selecciona el canal o pista de audio:</Text>
                  {availableAudioTracks.map((item) => (
                    <RadioButton.Item
                      key={item.id}
                      label={`${item.name} — ${item.desc}`}
                      value={item.id}
                      status={selectedAudio === item.id ? 'checked' : 'unchecked'}
                      onPress={() => handleAudioChange(item.id)}
                      labelStyle={styles.radioLabel}
                      color="#7c5af3"
                    />
                  ))}
                </View>
              )}

              {/* Pestaña: Subtítulos */}
              {settingsTab === 'subtitles' && (
                <View>
                  <Text style={styles.sectionSubtitle}>Subtítulos sincronizados:</Text>
                  {availableSubtitles.map((item) => (
                    <RadioButton.Item
                      key={item.id}
                      label={`${item.name} (${item.desc})`}
                      value={item.id}
                      status={selectedSubtitle === item.id ? 'checked' : 'unchecked'}
                      onPress={() => handleSubtitleChange(item.id)}
                      labelStyle={styles.radioLabel}
                      color="#7c5af3"
                    />
                  ))}
                </View>
              )}

              {/* Pestaña: Calidad */}
              {settingsTab === 'quality' && (
                <View>
                  <Text style={styles.sectionSubtitle}>Resolución de video:</Text>
                  {availableQualities.map((item) => (
                    <RadioButton.Item
                      key={item.id}
                      label={`${item.name} — ${item.desc}`}
                      value={item.id}
                      status={selectedQuality === item.id ? 'checked' : 'unchecked'}
                      onPress={() => setSelectedQuality(item.id)}
                      labelStyle={styles.radioLabel}
                      color="#7c5af3"
                    />
                  ))}
                </View>
              )}

              {/* Pestaña: Velocidad */}
              {settingsTab === 'speed' && (
                <View>
                  <Text style={styles.sectionSubtitle}>Velocidad de reproducción:</Text>
                  <View style={styles.speedsRow}>
                    {availableSpeeds.map((spd) => (
                      <Pressable
                        key={spd}
                        style={[styles.speedOptionBtn, playbackSpeed === spd && styles.speedOptionBtnActive]}
                        onPress={() => handleSpeedChange(spd)}
                      >
                        <Text style={[styles.speedOptionText, playbackSpeed === spd && styles.speedOptionTextActive]}>
                          {spd === 1.0 ? 'Normal (1.0x)' : `${spd}x`}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              )}
            </View>
          </Surface>
        </Modal>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: '#0c0c14',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
    marginVertical: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.45,
    shadowRadius: 18,
    elevation: 8,
  },
  containerMobile: {
    borderRadius: 12,
    marginVertical: 8,
  },
  containerFullscreen: {
    position: 'fixed' as any,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999999,
    borderRadius: 0,
    backgroundColor: '#000000',
  },
  theaterContainer: {
    maxWidth: '100%',
  },
  cinemaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#11111e',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
    flexWrap: 'wrap',
    gap: 8,
  },
  cinemaHeaderMobile: {
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  headerLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    flex: 1,
  },
  seriesCodePill: {
    backgroundColor: '#7c5af3',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  seriesCodeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  seriesTitleText: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: '700',
    maxWidth: 260,
  },
  qualityPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  qualityPillText: {
    color: '#cbd5e1',
    fontSize: 10,
    fontWeight: '800',
  },
  dualAudioPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
  },
  dualAudioText: {
    color: '#38bdf8',
    fontSize: 10,
    fontWeight: '800',
  },
  headerRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  settingsHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(168, 85, 247, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.35)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  settingsHeaderBtnText: {
    color: '#d8b4fe',
    fontSize: 11,
    fontWeight: '800',
  },
  actionBtnWatched: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  actionBtnWatchedActive: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    borderColor: 'rgba(34, 197, 94, 0.4)',
  },
  actionBtnWatchedText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '700',
  },
  actionBtnWatchedTextActive: {
    color: '#4ade80',
  },
  headerIconBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playerFrame: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000000',
    position: 'relative',
    overflow: 'hidden',
  },
  playerFrameMobile: {
    minHeight: 220,
  },
  playerFrameTheater: {
    maxHeight: 1080,
  },
  playerFrameFullscreen: {
    flex: 1,
    width: '100%',
    height: '100%',
    aspectRatio: undefined,
  },
  videoNative: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000000',
  },
  floatingSettingsBtn: {
    position: 'absolute' as any,
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(18, 18, 28, 0.85)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    zIndex: 10,
  },
  floatingSettingsText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  footerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#0e0e16',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  footerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quickSkipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  quickSkipText: {
    color: '#cbd5e1',
    fontSize: 10,
    fontWeight: '700',
  },
  speedPill: {
    backgroundColor: 'rgba(124, 90, 243, 0.15)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  speedPillText: {
    color: '#c084fc',
    fontSize: 10,
    fontWeight: '800',
  },
  footerRightInfo: {
    alignItems: 'flex-end',
  },
  footerSubStatus: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '600',
  },
  resumeOverlay: {
    position: 'absolute' as any,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(10, 10, 16, 0.94)',
    padding: 20,
    zIndex: 20,
  },
  resumeCard: {
    alignItems: 'center',
    maxWidth: 400,
    width: '100%',
    padding: 22,
    backgroundColor: '#161626',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.3)',
  },
  resumeTitle: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
  },
  resumeSubtitle: {
    color: '#94a3b8',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  resumeBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
    width: '100%',
  },
  resumePrimaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#7c5af3',
    paddingVertical: 10,
    borderRadius: 10,
  },
  resumePrimaryText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  resumeSecondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 10,
    borderRadius: 10,
  },
  resumeSecondaryText: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '700',
  },
  errorOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: 'rgba(14, 10, 14, 0.96)',
    gap: 8,
  },
  errorTitle: {
    color: '#f87171',
    fontSize: 16,
    fontWeight: '800',
  },
  errorSub: {
    color: '#94a3b8',
    fontSize: 11,
    textAlign: 'center',
    maxWidth: 400,
  },
  directBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#7c5af3',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 6,
  },
  directBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  errorBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  vlcBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(249, 115, 22, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(249, 115, 22, 0.45)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  vlcBtnText: {
    color: '#fb923c',
    fontSize: 12,
    fontWeight: '700',
  },
  altFormatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.35)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  altFormatBtnText: {
    color: '#38bdf8',
    fontSize: 12,
    fontWeight: '700',
  },
  mkvBadge: {
    backgroundColor: 'rgba(168, 85, 247, 0.18)',
    borderWidth: 1,
    borderColor: '#a855f7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  mkvBadgeText: {
    color: '#d8b4fe',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  settingsModalContainer: {
    padding: 16,
    maxWidth: 520,
    width: '100%',
    alignSelf: 'center',
  },
  settingsSurface: {
    backgroundColor: '#141422',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '800',
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 12,
    flexWrap: 'wrap',
  },
  tabBtn: {
    flex: 1,
    minWidth: 90,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  tabBtnActive: {
    backgroundColor: '#7c5af3',
  },
  tabBtnText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '700',
  },
  tabBtnTextActive: {
    color: '#ffffff',
  },
  modalDivider: {
    marginVertical: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  tabContentArea: {
    minHeight: 180,
  },
  sectionSubtitle: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  radioLabel: {
    color: '#f1f5f9',
    fontSize: 13,
  },
  speedsRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    marginTop: 10,
  },
  speedOptionBtn: {
    flex: 1,
    minWidth: 80,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
  },
  speedOptionBtnActive: {
    backgroundColor: '#7c5af3',
  },
  speedOptionText: {
    color: '#cbd5e1',
    fontSize: 13,
    fontWeight: '700',
  },
  speedOptionTextActive: {
    color: '#ffffff',
  },
});
