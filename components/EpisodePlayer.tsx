import React, { useState, useRef, useEffect } from 'react';
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
  // Drive error state: true = Drive is still processing, switch to fallback
  const [driveError, setDriveError] = useState(false);
  const driveVideoRef = useRef<HTMLVideoElement>(null);

  // Auto-fallback: if Drive video can't load after 8s, switch to VidLink
  useEffect(() => {
    if (currentServer !== 'gdrive' || !driveInfo || Platform.OS !== 'web') return;
    setDriveError(false);
    const timer = setTimeout(() => {
      const video = driveVideoRef.current;
      if (video && video.readyState === 0 && video.networkState === 3) {
        setDriveError(true);
      }
    }, 10000);
    return () => clearTimeout(timer);
  }, [currentServer, driveInfo, refreshKey]);

  const getServerUrl = (server: StreamServer): string => {
    switch (server) {
      case 'gdrive':
        // Use direct stream URL (bypasses Drive processing requirement)
        return driveInfo ? driveInfo.streamUrl : '';
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
            name={currentServer === 'gdrive' ? 'checkmark-circle' : 'settings'}
            size={12}
            color={currentServer === 'gdrive' ? '#22c55e' : '#38bdf8'}
          />
          <Text style={styles.instructionText}>
            {currentServer === 'gdrive'
              ? 'Reproduciendo con doblaje en Español Latino'
              : 'En el reproductor: Ajustes ⚙️ > Audio o Subtítulos'}
          </Text>
        </View>
      </View>

      {/* Video Player Frame */}
      <View style={[styles.playerFrame, theaterMode && styles.playerFrameTheater]}>
        {Platform.OS === 'web' ? (
          currentServer === 'gdrive' && driveInfo ? (
            driveError ? (
              // Drive processing error fallback
              <View style={styles.driveProcessingOverlay}>
                <Ionicons name="cloud-download-outline" size={48} color="#f59e0b" />
                <Text style={styles.driveProcessingTitle}>⏳ Archivo en procesamiento</Text>
                <Text style={styles.driveProcessingText}>
                  Google Drive aún está procesando este video en Full HD. Esto puede tardar{' '}
                  <Text style={{ color: '#fbbf24', fontWeight: '700' }}>30 minutos a algunas horas</Text>{' '}
                  según el tamaño del archivo.
                </Text>
                <Pressable
                  style={styles.driveRetryBtn}
                  onPress={() => { setRefreshKey(k => k + 1); setDriveError(false); }}
                >
                  <Ionicons name="refresh" size={15} color="#fff" />
                  <Text style={styles.driveRetryText}>Reintentar</Text>
                </Pressable>
                <Pressable
                  style={[styles.driveRetryBtn, { backgroundColor: '#7c3aed', marginTop: 8 }]}
                  onPress={() => setCurrentServer('vidlink')}
                >
                  <Ionicons name="flash" size={15} color="#fff" />
                  <Text style={styles.driveRetryText}>Usar VidLink Ultra en su lugar</Text>
                </Pressable>
              </View>
            ) : (
              // Native HTML5 video player - no transcoding needed
              <video
                key={refreshKey}
                ref={driveVideoRef}
                style={{
                  width: '100%',
                  height: '100%',
                  backgroundColor: '#000',
                }}
                controls
                autoPlay={false}
                preload="metadata"
                onError={() => setDriveError(true)}
                onStalled={() => {
                  // If stalled immediately with no data, it's likely still processing
                  const v = driveVideoRef.current;
                  if (v && v.readyState === 0) setDriveError(true);
                }}
              >
                <source src={currentUrl} type="video/x-matroska" />
                <source src={currentUrl} type="video/mp4" />
                Tu navegador no soporta reproducción de video HTML5.
              </video>
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
    maxHeight: 580,
    backgroundColor: '#000000',
    position: 'relative',
  },
  playerFrameTheater: {
    maxHeight: 720,
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
});
