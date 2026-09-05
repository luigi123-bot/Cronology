import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, Platform, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getDriveFileForEpisode } from '@/services/googleDrive';

interface EpisodePlayerProps {
  seriesTmdbId: number;
  seriesName: string;
  seasonNumber: number;
  episodeNumber: number;
  episodeName: string;
  youtubeClipId?: string | null;
}

type AudioMode = 'latino' | 'english';
type StreamServer = 'gdrive' | 'vidlink' | 'videasy' | 'autoembed' | 'multiembed' | 'vidsrcto' | 'custom' | 'youtube';

interface ServerOption {
  id: StreamServer;
  name: string;
  badge: string;
  icon: keyof typeof Ionicons.glyphMap;
  quality: string;
  audioInfo: string;
}

const SERVER_OPTIONS: ServerOption[] = [
  {
    id: 'vidlink',
    name: 'VidLink Ultra',
    badge: '1080p',
    icon: 'flash',
    quality: '1080p Full HD',
    audioInfo: 'Audio Original / Subtítulos',
  },
  {
    id: 'videasy',
    name: 'Videasy HD',
    badge: 'Rápido',
    icon: 'globe',
    quality: 'HD 1080p',
    audioInfo: 'Pistas internacionales',
  },
  {
    id: 'autoembed',
    name: 'AutoEmbed',
    badge: 'Estable',
    icon: 'play-circle',
    quality: '1080p',
    audioInfo: 'Multi-idioma',
  },
  {
    id: 'multiembed',
    name: 'MultiEmbed',
    badge: 'Multi-Idioma',
    icon: 'server',
    quality: 'HD',
    audioInfo: 'Servidor multi-fuente',
  },
  {
    id: 'vidsrcto',
    name: 'VidSrc Pro',
    badge: 'Respaldo',
    icon: 'tv-outline',
    quality: '1080p',
    audioInfo: 'Servidor secundario',
  },
];

export default function EpisodePlayer({
  seriesTmdbId,
  seriesName,
  seasonNumber,
  episodeNumber,
  episodeName,
  youtubeClipId,
}: EpisodePlayerProps) {
  const driveInfo = getDriveFileForEpisode(seriesName, seasonNumber, episodeNumber);

  const [currentServer, setCurrentServer] = useState<StreamServer>(
    driveInfo ? 'gdrive' : 'vidlink'
  );
  const [audioMode, setAudioMode] = useState<AudioMode>('latino');
  const [theaterMode, setTheaterMode] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  // Drive state: 'loading' | 'ready' | 'processing' | 'error'
  const [driveState, setDriveState] = useState<'loading' | 'ready' | 'processing' | 'error'>('loading');
  const driveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset drive state on server/episode change — one-shot timer, no loops
  useEffect(() => {
    if (currentServer !== 'gdrive' || !driveInfo || Platform.OS !== 'web') return;
    setDriveState('loading');
    // Clear any previous timer
    if (driveTimerRef.current) clearTimeout(driveTimerRef.current);
    // After 25s with no iframe onLoad signal, assume Drive is still processing
    driveTimerRef.current = setTimeout(() => {
      setDriveState(prev => prev === 'loading' ? 'processing' : prev);
    }, 25000);
    return () => {
      if (driveTimerRef.current) clearTimeout(driveTimerRef.current);
    };
  // Only reset when the actual episode/server changes, NOT on refreshKey
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentServer, driveInfo?.fileId]);

  const handleDriveLoad = useCallback(() => {
    if (driveTimerRef.current) clearTimeout(driveTimerRef.current);
    setDriveState('ready');
  }, []);

  const handleDriveRetry = useCallback(() => {
    setDriveState('loading');
    setRefreshKey(k => k + 1);
    // Re-arm the timeout
    if (driveTimerRef.current) clearTimeout(driveTimerRef.current);
    driveTimerRef.current = setTimeout(() => {
      setDriveState(prev => prev === 'loading' ? 'processing' : prev);
    }, 25000);
  }, []);

  const getServerUrl = (server: StreamServer): string => {
    switch (server) {
      case 'gdrive':
        // /preview with rm=minimal + hd=1 forces Google to serve the highest quality stream available
        return driveInfo
          ? `https://drive.google.com/file/d/${driveInfo.fileId}/preview?rm=minimal&hd=1`
          : '';
      case 'vidlink':
        return `https://vidlink.pro/tv/${seriesTmdbId}/${seasonNumber}/${episodeNumber}?primaryColor=a855f7&secondaryColor=161622&iconColor=ffffff&title=true&poster=true`;
      case 'videasy':
        return `https://player.videasy.to/tv/${seriesTmdbId}/${seasonNumber}/${episodeNumber}`;
      case 'autoembed':
        return `https://autoembed.co/tv/tmdb/${seriesTmdbId}-${seasonNumber}-${episodeNumber}`;
      case 'multiembed':
        return `https://multiembed.mov/?video_id=${seriesTmdbId}&tmdb=1&s=${seasonNumber}&e=${episodeNumber}`;
      case 'vidsrcto':
        return `https://vidsrc.to/embed/tv/${seriesTmdbId}/${seasonNumber}/${episodeNumber}`;
      case 'custom':
        return '';
      case 'youtube':
        return youtubeClipId
          ? `https://www.youtube-nocookie.com/embed/${youtubeClipId}?autoplay=1&rel=0`
          : `https://www.youtube.com/results?search_query=${encodeURIComponent(
              `${seriesName} Temporada ${seasonNumber} Capitulo ${episodeNumber} trailer latino`
            )}`;
    }
  };

  const currentUrl = getServerUrl(currentServer);

  const availableServers: ServerOption[] = [
    ...(driveInfo
      ? [
          {
            id: 'gdrive' as StreamServer,
            name: 'Servidor Latino HD',
            badge: '⭐ Latino 1080p',
            icon: 'play-circle' as const,
            quality: 'Full HD 1080p',
            audioInfo: 'Español Latino (Doblaje Oficial)',
          },
        ]
      : []),
    ...SERVER_OPTIONS,
  ];

  const activeOption = availableServers.find((s) => s.id === currentServer);

  const handleSelectAudio = (mode: AudioMode) => {
    setAudioMode(mode);
    if (mode === 'latino' && driveInfo) {
      setCurrentServer('gdrive');
    }
  };

  const handleReload = () => {
    setRefreshKey((k) => k + 1);
  };

  const openExternal = () => {
    Linking.openURL(currentUrl);
  };

  return (
    <View style={[styles.container, theaterMode && styles.theaterContainer]}>
      
      {/* Audio Language Switcher Bar */}
      <View style={styles.audioSwitcherBar}>
        <View style={styles.audioToggleGroup}>
          <Text style={styles.audioSectionLabel}>IDIOMA DE AUDIO:</Text>
          <Pressable
            style={[
              styles.audioPill,
              audioMode === 'latino' && styles.audioPillActiveLatino,
            ]}
            onPress={() => handleSelectAudio('latino')}
          >
            <Text style={styles.flagIcon}>🇲🇽</Text>
            <Text
              style={[
                styles.audioPillText,
                audioMode === 'latino' && styles.audioPillTextActive,
              ]}
            >
              Español Latino
            </Text>
            {audioMode === 'latino' && (
              <Ionicons name="checkmark-circle" size={14} color="#22c55e" />
            )}
          </Pressable>

          <Pressable
            style={[
              styles.audioPill,
              audioMode === 'english' && styles.audioPillActiveEnglish,
            ]}
            onPress={() => handleSelectAudio('english')}
          >
            <Text style={styles.flagIcon}>🇺🇸</Text>
            <Text
              style={[
                styles.audioPillText,
                audioMode === 'english' && styles.audioPillTextActive,
              ]}
            >
              Inglés (Original)
            </Text>
            {audioMode === 'english' && (
              <Ionicons name="checkmark-circle" size={14} color="#38bdf8" />
            )}
          </Pressable>
        </View>

        <View style={styles.dualNoticeBadge}>
          <Ionicons name="sparkles" size={13} color="#a855f7" />
          <Text style={styles.dualNoticeText}>1080p Full HD</Text>
        </View>
      </View>

      {/* Server Selection Bar */}
      <View style={styles.serverBar}>
        <View style={styles.serverPills}>
          {availableServers.map((opt) => {
            const isActive = currentServer === opt.id;
            return (
              <Pressable
                key={opt.id}
                style={[styles.serverBtn, isActive && styles.serverBtnActive]}
                onPress={() => setCurrentServer(opt.id)}
              >
                <Ionicons
                  name={opt.icon}
                  size={13}
                  color={isActive ? '#ffffff' : '#94a3b8'}
                />
                <Text
                  style={[
                    styles.serverBtnText,
                    isActive && styles.serverBtnTextActive,
                  ]}
                >
                  {opt.name}
                </Text>
                <View
                  style={[
                    styles.badgePill,
                    isActive && styles.badgePillActive,
                  ]}
                >
                  <Text style={styles.badgePillText}>{opt.badge}</Text>
                </View>
              </Pressable>
            );
          })}

          {/* YouTube Trailer Latino */}
          {youtubeClipId && (
            <Pressable
              style={[
                styles.serverBtn,
                currentServer === 'youtube' && styles.serverBtnActiveYt,
              ]}
              onPress={() => setCurrentServer('youtube')}
            >
              <Ionicons
                name="logo-youtube"
                size={13}
                color={currentServer === 'youtube' ? '#ffffff' : '#ef4444'}
              />
              <Text
                style={[
                  styles.serverBtnText,
                  currentServer === 'youtube' && styles.serverBtnTextActive,
                ]}
              >
                Trailer Latino
              </Text>
            </Pressable>
          )}
        </View>

        {/* Player Controls (Reload, Theater, Open External) */}
        <View style={styles.serverActions}>
          <Pressable
            style={styles.actionIconBtn}
            onPress={handleReload}
            accessibilityLabel="Recargar reproductor"
          >
            <Ionicons name="refresh" size={15} color="#cbd5e1" />
          </Pressable>

          {Platform.OS === 'web' && (
            <Pressable
              style={styles.actionIconBtn}
              onPress={() => setTheaterMode(!theaterMode)}
              accessibilityLabel="Modo Teatro"
            >
              <Ionicons
                name={theaterMode ? 'contract' : 'expand'}
                size={15}
                color="#cbd5e1"
              />
            </Pressable>
          )}

          <Pressable
            style={styles.actionIconBtn}
            onPress={openExternal}
            accessibilityLabel="Abrir en ventana nueva"
          >
            <Ionicons name="open-outline" size={15} color="#cbd5e1" />
          </Pressable>
        </View>
      </View>

      {/* Quality & Audio Indicator Strip */}
      <View style={styles.qualityStrip}>
        <View style={styles.qualityGroup}>
          <View style={styles.qualityBadge}>
            <Ionicons name="sparkles" size={11} color="#22c55e" />
            <Text style={styles.qualityBadgeText}>
              {activeOption?.quality ?? 'Full HD 1080p'}
            </Text>
          </View>
          <View style={styles.audioBadge}>
            <Ionicons name="volume-high" size={12} color="#a855f7" />
            <Text style={styles.audioBadgeText}>
              {activeOption?.audioInfo ?? 'Español Latino / Inglés'}
            </Text>
          </View>
        </View>

        <View style={styles.instructionBadge}>
          <Ionicons
            name={currentServer === 'gdrive' ? 'settings' : 'settings'}
            size={12}
            color={currentServer === 'gdrive' ? '#f59e0b' : '#38bdf8'}
          />
          <Text style={styles.instructionText}>
            {currentServer === 'gdrive'
              ? '⚙ En el reproductor → haz clic en Calidad → selecciona 1080p'
              : 'En el reproductor: Ajustes ⚙️ > Audio o Subtítulos'}
          </Text>
        </View>
      </View>

      {/* Quality Tip Banner — only for Drive server */}
      {currentServer === 'gdrive' && driveInfo && driveState === 'ready' && (
        <View style={styles.qualityTipBanner}>
          <Ionicons name="information-circle" size={14} color="#f59e0b" />
          <Text style={styles.qualityTipText}>
            <Text style={{ fontWeight: '800', color: '#fbbf24' }}>Para ver en 1080p Full HD:</Text>
            {'  '}Dentro del reproductor, haz clic en{' '}
            <Text style={{ fontWeight: '800', color: '#fff' }}>⚙ (Configuración)</Text>
            {' '}→{' '}
            <Text style={{ fontWeight: '800', color: '#4ade80' }}>Calidad → 1080p</Text>
          </Text>
        </View>
      )}

      {/* Video Player Frame */}
      <View style={[styles.playerFrame, theaterMode && styles.playerFrameTheater]}>
        {Platform.OS === 'web' ? (
          currentServer === 'gdrive' && driveInfo ? (
            driveState === 'processing' ? (
              // Drive still processing — no loop, just a clear message
              <View style={styles.driveProcessingOverlay}>
                <Ionicons name="cloud-download-outline" size={48} color="#f59e0b" />
                <Text style={styles.driveProcessingTitle}>⏳ Drive aún está procesando el video</Text>
                <Text style={styles.driveProcessingText}>
                  Google Drive necesita convertir el archivo a formato de streaming.{' '}
                  Esto puede tardar{' '}
                  <Text style={{ color: '#fbbf24', fontWeight: '700' }}>entre 30 minutos y varias horas</Text>{' '}
                  para archivos de 1080p. Mientras tanto puedes:
                </Text>
                <Pressable
                  style={styles.driveRetryBtn}
                  onPress={handleDriveRetry}
                >
                  <Ionicons name="refresh" size={15} color="#fff" />
                  <Text style={styles.driveRetryText}>Verificar si ya terminó</Text>
                </Pressable>
                <Pressable
                  style={[styles.driveRetryBtn, { backgroundColor: '#7c3aed', marginTop: 8 }]}
                  onPress={() => setCurrentServer('vidlink')}
                >
                  <Ionicons name="flash" size={15} color="#fff" />
                  <Text style={styles.driveRetryText}>Ver en Inglés con VidLink (disponible ya)</Text>
                </Pressable>
                <Pressable
                  style={[styles.driveRetryBtn, { backgroundColor: '#0f766e', marginTop: 8 }]}
                  onPress={() => Linking.openURL(`https://drive.google.com/file/d/${driveInfo.fileId}/view`)}
                >
                  <Ionicons name="open-outline" size={15} color="#fff" />
                  <Text style={styles.driveRetryText}>Abrir directo en Google Drive</Text>
                </Pressable>
              </View>
            ) : (
              // Drive iframe — /preview is the ONLY reliable way to play MKV from Drive
              <>
                {driveState === 'loading' && (
                  <View style={styles.driveLoadingOverlay}>
                    <View style={styles.driveLoadingSpinner}>
                      <Ionicons name="logo-google" size={28} color="#4ade80" />
                    </View>
                    <Text style={styles.driveLoadingText}>Cargando reproductor de Drive...</Text>
                    <Text style={styles.driveLoadingHint}>Si tarda más de 30s, el archivo aún está siendo procesado por Google</Text>
                  </View>
                )}
                <iframe
                  key={refreshKey}
                  src={currentUrl}
                  title={`${seriesName} S${seasonNumber}E${episodeNumber} - ${episodeName}`}
                  onLoad={handleDriveLoad}
                  style={{
                    width: '100%',
                    height: '100%',
                    border: 'none',
                    backgroundColor: '#000000',
                    display: driveState === 'loading' ? 'none' : 'block',
                  }}
                  allowFullScreen
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                />
              </>
            )
          ) : (
            <iframe
              key={refreshKey}
              src={currentUrl}
              title={`${seriesName} S${seasonNumber}E${episodeNumber} - ${episodeName}`}
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                backgroundColor: '#000000',
              }}
              loading="lazy"
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            />
          )
        ) : (
          <View style={styles.mobileFallback}>
            <Ionicons name="play-circle" size={54} color="#a855f7" />
            <Text style={styles.fallbackTitle}>Reproducir Capítulo Completo</Text>
            <Text style={styles.fallbackSubtitle}>
              Transmisión Full HD con pistas en Español Latino e Inglés
            </Text>
            <Pressable style={styles.fallbackPlayBtn} onPress={openExternal}>
              <Text style={styles.fallbackPlayBtnText}>Abrir Reproductor</Text>
            </Pressable>
          </View>
        )}
      </View>

      {/* Player footer info */}
      <View style={styles.playerFooter}>
        <Ionicons name="shield-checkmark" size={14} color="#22c55e" />
        <Text style={styles.playerNotice}>
          Servidor activo: <Text style={{ color: '#f8fafc', fontWeight: '700' }}>{activeOption?.name}</Text> ({activeOption?.quality}). Reproducción Full HD directa en el navegador.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: '#0f0f18',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
    marginVertical: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
    elevation: 10,
  },
  theaterContainer: {
    maxWidth: '100%',
  },
  audioSwitcherBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#161626',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    flexWrap: 'wrap',
    gap: 10,
  },
  audioToggleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  audioSectionLabel: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginRight: 4,
  },
  audioPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    cursor: 'pointer' as any,
  },
  audioPillActiveLatino: {
    backgroundColor: 'rgba(34, 197, 94, 0.18)',
    borderColor: '#22c55e',
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 3,
  },
  audioPillActiveEnglish: {
    backgroundColor: 'rgba(56, 189, 248, 0.18)',
    borderColor: '#38bdf8',
    shadowColor: '#38bdf8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 3,
  },
  flagIcon: {
    fontSize: 14,
  },
  audioPillText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '700',
  },
  audioPillTextActive: {
    color: '#ffffff',
  },
  dualNoticeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(168, 85, 247, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.3)',
  },
  dualNoticeText: {
    color: '#c084fc',
    fontSize: 11,
    fontWeight: '700',
  },
  serverBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: 'rgba(15, 15, 24, 0.98)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
    flexWrap: 'wrap',
    gap: 8,
  },
  serverPills: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  serverBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    cursor: 'pointer' as any,
  },
  serverBtnActive: {
    backgroundColor: '#7c3aed',
    borderColor: '#a855f7',
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 4,
  },
  serverBtnActiveYt: {
    backgroundColor: '#dc2626',
    borderColor: '#ef4444',
  },
  serverBtnText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
  },
  serverBtnTextActive: {
    color: '#ffffff',
  },
  badgePill: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 6,
  },
  badgePillActive: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  badgePillText: {
    color: '#e2e8f0',
    fontSize: 9,
    fontWeight: '700',
  },
  serverActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionIconBtn: {
    padding: 7,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    cursor: 'pointer' as any,
  },
  qualityStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(20, 20, 32, 0.8)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
    flexWrap: 'wrap',
    gap: 8,
  },
  qualityGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  qualityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  qualityBadgeText: {
    color: '#86efac',
    fontSize: 10,
    fontWeight: '800',
  },
  audioBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(168, 85, 247, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.3)',
  },
  audioBadgeText: {
    color: '#d8b4fe',
    fontSize: 10,
    fontWeight: '800',
  },
  instructionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  instructionText: {
    color: '#7dd3fc',
    fontSize: 11,
    fontWeight: '600',
  },
  playerFrame: {
    width: '100%',
    aspectRatio: 16 / 9,
    maxHeight: 650,
    backgroundColor: '#000000',
    position: 'relative',
  },
  playerFrameTheater: {
    maxHeight: 1080,
  },
  mobileFallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 10,
  },
  fallbackTitle: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '700',
  },
  fallbackSubtitle: {
    color: '#94a3b8',
    fontSize: 13,
    textAlign: 'center',
  },
  fallbackPlayBtn: {
    marginTop: 8,
    backgroundColor: '#7c3aed',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 14,
  },
  fallbackPlayBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  playerFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: 'rgba(10, 10, 15, 0.6)',
  },
  playerNotice: {
    color: '#94a3b8',
    fontSize: 11,
    flex: 1,
  },
  driveProcessingOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 28,
    gap: 12,
    backgroundColor: 'rgba(15, 10, 5, 0.95)',
  },
  driveProcessingTitle: {
    color: '#fbbf24',
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 8,
  },
  driveProcessingText: {
    color: '#cbd5e1',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 400,
  },
  driveRetryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    backgroundColor: '#d97706',
    paddingVertical: 10,
    paddingHorizontal: 22,
    borderRadius: 14,
    cursor: 'pointer' as any,
  },
  driveRetryText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  driveLoadingOverlay: {
    position: 'absolute' as any,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
    gap: 12,
    zIndex: 10,
  },
  driveLoadingSpinner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(74, 222, 128, 0.12)',
    borderWidth: 2,
    borderColor: 'rgba(74, 222, 128, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  driveLoadingText: {
    color: '#e2e8f0',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  driveLoadingHint: {
    color: '#64748b',
    fontSize: 11,
    textAlign: 'center',
    maxWidth: 320,
    lineHeight: 16,
  },
  qualityTipBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(245, 158, 11, 0.25)',
    flexWrap: 'wrap',
  },
  qualityTipText: {
    color: '#cbd5e1',
    fontSize: 12,
    flex: 1,
    lineHeight: 18,
  },
});

