import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, Platform, Linking, useWindowDimensions } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { getDriveFileForEpisode } from '@/services/googleDrive';
import { getWatchSession, saveWatchSession, clearWatchSession } from '@/services/watchProgress';

interface EpisodePlayerProps {
  seriesTmdbId: number;
  seriesName: string;
  seasonNumber: number;
  episodeNumber: number;
  episodeName: string;
  youtubeClipId?: string | null;
}

export default function EpisodePlayer({
  seriesTmdbId,
  seriesName,
  seasonNumber,
  episodeNumber,
  episodeName,
}: EpisodePlayerProps) {
  const { width } = useWindowDimensions();
  const isMobile = width < 600;
  const driveInfo = getDriveFileForEpisode(seriesName, seasonNumber, episodeNumber);
  const mediaKey = `episode-${seriesTmdbId}-${seasonNumber}-${episodeNumber}`;

  const [theaterMode, setTheaterMode] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showResumePrompt, setShowResumePrompt] = useState(false);
  const [driveState, setDriveState] = useState<'loading' | 'ready' | 'processing' | 'error'>('loading');
  const driveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const isFocused = useIsFocused();

  // Check for prior watch session to offer resume or start fresh
  useEffect(() => {
    if (Platform.OS === 'web') {
      const session = getWatchSession(mediaKey);
      if (session) {
        setShowResumePrompt(true);
      } else {
        setShowResumePrompt(false);
      }
    }
  }, [mediaKey]);

  // Stop playback when component unmounts
  useEffect(() => {
    return () => {
      if (Platform.OS === 'web' && iframeRef.current) {
        try {
          iframeRef.current.src = 'about:blank';
        } catch (_) {}
      }
    };
  }, []);

  // Stop playback when screen loses focus
  useEffect(() => {
    if (!isFocused && Platform.OS === 'web' && iframeRef.current) {
      try {
        iframeRef.current.src = 'about:blank';
      } catch (_) {}
    }
  }, [isFocused]);

  // Window unload / pagehide cleanup
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const stopAudio = () => {
      if (iframeRef.current) {
        try {
          iframeRef.current.src = 'about:blank';
        } catch (_) {}
      }
    };
    window.addEventListener('beforeunload', stopAudio);
    window.addEventListener('pagehide', stopAudio);
    return () => {
      window.removeEventListener('beforeunload', stopAudio);
      window.removeEventListener('pagehide', stopAudio);
    };
  }, []);

  // Reset drive loading timer on episode change
  useEffect(() => {
    if (!driveInfo || Platform.OS !== 'web') return;
    setDriveState('loading');
    if (driveTimerRef.current) clearTimeout(driveTimerRef.current);
    driveTimerRef.current = setTimeout(() => {
      setDriveState(prev => (prev === 'loading' ? 'processing' : prev));
    }, 25000);
    return () => {
      if (driveTimerRef.current) clearTimeout(driveTimerRef.current);
    };
  }, [driveInfo?.fileId]);

  const handleDriveLoad = useCallback(() => {
    if (driveTimerRef.current) clearTimeout(driveTimerRef.current);
    setDriveState('ready');
    saveWatchSession(mediaKey, 'watching');
  }, [mediaKey]);

  const handleContinue = useCallback(() => {
    setShowResumePrompt(false);
    saveWatchSession(mediaKey, 'watching');
  }, [mediaKey]);

  const handleRestart = useCallback(() => {
    clearWatchSession(mediaKey);
    saveWatchSession(mediaKey, 'watching');
    setShowResumePrompt(false);
    setRefreshKey(k => k + 1);
  }, [mediaKey]);

  const handleDriveRetry = useCallback(() => {
    setDriveState('loading');
    setRefreshKey(k => k + 1);
    if (driveTimerRef.current) clearTimeout(driveTimerRef.current);
    driveTimerRef.current = setTimeout(() => {
      setDriveState(prev => (prev === 'loading' ? 'processing' : prev));
    }, 25000);
  }, []);

  const handleReload = () => {
    setRefreshKey(k => k + 1);
  };

  const currentUrl = driveInfo
    ? `https://drive.google.com/file/d/${driveInfo.fileId}/preview?rm=minimal&hd=1`
    : '';

  const openExternal = () => {
    if (driveInfo) {
      Linking.openURL(`https://drive.google.com/file/d/${driveInfo.fileId}/view`);
    }
  };

  return (
    <View style={[styles.container, theaterMode && styles.theaterContainer]}>
      {/* Sleek Minimal Header: Only essentials */}
      <View style={styles.headerBar}>
        <View style={styles.headerLeft}>
          <View style={styles.driveBadge}>
            <View style={styles.driveDot} />
            <Ionicons name="logo-google" size={13} color="#4ade80" />
            <Text style={styles.driveBadgeText}>Google Drive</Text>
          </View>
          <Text style={styles.qualityText}>
            {isMobile ? '1080p' : (driveInfo?.quality || 'Full HD 1080p')}
          </Text>
        </View>

        <View style={styles.headerRight}>
          {/* Empezar de nuevo quick button */}
          <Pressable
            style={styles.restartActionBtn}
            onPress={handleRestart}
            accessibilityLabel="Empezar de nuevo el video"
          >
            <Ionicons name="reload" size={13} color="#c084fc" />
            <Text style={styles.restartActionText}>
              {isMobile ? 'Reiniciar' : 'Empezar de nuevo'}
            </Text>
          </Pressable>

          <Pressable
            style={styles.actionBtn}
            onPress={handleReload}
            accessibilityLabel="Recargar video"
          >
            <Ionicons name="refresh" size={15} color="#94a3b8" />
          </Pressable>

          {Platform.OS === 'web' && (
            <Pressable
              style={styles.actionBtn}
              onPress={() => setTheaterMode(!theaterMode)}
              accessibilityLabel="Modo Teatro"
            >
              <Ionicons
                name={theaterMode ? 'contract' : 'expand'}
                size={15}
                color="#94a3b8"
              />
            </Pressable>
          )}

          {driveInfo && (
            <Pressable
              style={styles.actionBtn}
              onPress={openExternal}
              accessibilityLabel="Abrir en Google Drive"
            >
              <Ionicons name="open-outline" size={15} color="#94a3b8" />
            </Pressable>
          )}
        </View>
      </View>

      {/* Video Player Frame */}
      <View style={[styles.playerFrame, theaterMode && styles.playerFrameTheater]}>
        {Platform.OS === 'web' ? (
          !isFocused ? (
            <View style={styles.centeredBox}>
              <Ionicons name="pause-circle-outline" size={42} color="#475569" />
              <Text style={styles.pausedText}>Reproducción detenida</Text>
            </View>
          ) : showResumePrompt ? (
            <View style={styles.resumeOverlay}>
              <View style={styles.resumeCard}>
                <View style={styles.resumeIconWrap}>
                  <Ionicons name="play" size={28} color="#a855f7" />
                </View>
                <Text style={styles.resumeTitle}>¿Continuar o empezar de nuevo?</Text>
                <Text style={styles.resumeSubtitle}>
                  Ya estuviste viendo este episodio ({seriesName} T{seasonNumber}:E{episodeNumber}).
                  Elige cómo prefieres reproducirlo para que no se repita solo.
                </Text>
                <View style={styles.resumeBtnRow}>
                  <Pressable style={styles.resumePrimaryBtn} onPress={handleContinue}>
                    <Ionicons name="play-circle" size={18} color="#ffffff" />
                    <Text style={styles.resumePrimaryText}>Continuar video</Text>
                  </Pressable>
                  <Pressable style={styles.resumeSecondaryBtn} onPress={handleRestart}>
                    <Ionicons name="reload" size={15} color="#cbd5e1" />
                    <Text style={styles.resumeSecondaryText}>Empezar de nuevo</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          ) : driveInfo ? (
            driveState === 'processing' ? (
              <View style={styles.driveProcessingOverlay}>
                <Ionicons name="cloud-download-outline" size={48} color="#f59e0b" />
                <Text style={styles.driveProcessingTitle}>⏳ Drive aún está procesando el video</Text>
                <Text style={styles.driveProcessingText}>
                  Google Drive necesita unos minutos para preparar el streaming en HD.
                </Text>
                <View style={styles.processingBtnRow}>
                  <Pressable style={styles.driveRetryBtn} onPress={handleDriveRetry}>
                    <Ionicons name="refresh" size={15} color="#fff" />
                    <Text style={styles.driveBtnText}>Verificar de nuevo</Text>
                  </Pressable>
                  <Pressable style={[styles.driveRetryBtn, styles.driveDirectBtn]} onPress={openExternal}>
                    <Ionicons name="open-outline" size={15} color="#fff" />
                    <Text style={styles.driveBtnText}>Abrir en Google Drive</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <>
                {driveState === 'loading' && (
                  <View style={styles.driveLoadingOverlay}>
                    <View style={styles.driveLoadingSpinner}>
                      <Ionicons name="logo-google" size={26} color="#4ade80" />
                    </View>
                    <Text style={styles.driveLoadingText}>Cargando reproductor de Drive...</Text>
                  </View>
                )}
                <iframe
                  key={`gdrive-${seriesTmdbId}-${seasonNumber}-${episodeNumber}-${refreshKey}`}
                  ref={iframeRef}
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
            <View style={styles.centeredBox}>
              <Ionicons name="cloud-offline-outline" size={48} color="#64748b" />
              <Text style={styles.notFoundTitle}>Capítulo no disponible en Drive</Text>
              <Text style={styles.notFoundSub}>
                Sube este archivo a tu carpeta de Google Drive y ejecuta npm run sync:drive
              </Text>
            </View>
          )
        ) : (
          <View style={styles.centeredBox}>
            <Ionicons name="play-circle" size={54} color="#4ade80" />
            <Text style={styles.notFoundTitle}>Reproducir en Google Drive</Text>
            <Pressable style={styles.fallbackBtn} onPress={openExternal}>
              <Text style={styles.fallbackBtnText}>Abrir Video</Text>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: '#0c0c14',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
    marginVertical: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 8,
  },
  theaterContainer: {
    maxWidth: '100%',
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#12121e',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
    flexWrap: 'wrap',
    gap: 8,
    width: '100%',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  driveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(74, 222, 128, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(74, 222, 128, 0.3)',
  },
  driveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4ade80',
  },
  driveBadgeText: {
    color: '#86efac',
    fontSize: 12,
    fontWeight: '700',
  },
  qualityText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  restartActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(168, 85, 247, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.3)',
    paddingHorizontal: 10,
    height: 32,
    borderRadius: 8,
    cursor: 'pointer' as any,
  },
  restartActionText: {
    color: '#d8b4fe',
    fontSize: 12,
    fontWeight: '700',
  },
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer' as any,
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
    padding: 24,
    zIndex: 20,
    ...(Platform.OS === 'web'
      ? {
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
        }
      : {}),
  } as any,
  resumeCard: {
    alignItems: 'center',
    maxWidth: 420,
    width: '100%',
    padding: 24,
    backgroundColor: '#141422',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.25)',
    boxShadow: '0 12px 36px rgba(0,0,0,0.6)',
  } as any,
  resumeIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  resumeTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  resumeSubtitle: {
    color: '#94a3b8',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 18,
  },
  resumeBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 20,
    width: '100%',
    justifyContent: 'center',
  },
  resumePrimaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#7c3aed',
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderRadius: 12,
    cursor: 'pointer' as any,
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
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderRadius: 12,
    cursor: 'pointer' as any,
  },
  resumeSecondaryText: {
    color: '#cbd5e1',
    fontSize: 13,
    fontWeight: '700',
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
  centeredBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
    padding: 24,
    gap: 8,
  },
  pausedText: {
    color: '#64748b',
    fontSize: 13,
  },
  notFoundTitle: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  notFoundSub: {
    color: '#64748b',
    fontSize: 12,
    textAlign: 'center',
    maxWidth: 340,
    lineHeight: 18,
  },
  fallbackBtn: {
    marginTop: 8,
    backgroundColor: '#16a34a',
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 12,
  },
  fallbackBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
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
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
  },
  driveProcessingText: {
    color: '#cbd5e1',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 380,
  },
  processingBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  driveRetryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#d97706',
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 12,
    cursor: 'pointer' as any,
  },
  driveDirectBtn: {
    backgroundColor: '#2563eb',
  },
  driveBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
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
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(74, 222, 128, 0.12)',
    borderWidth: 2,
    borderColor: 'rgba(74, 222, 128, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  driveLoadingText: {
    color: '#e2e8f0',
    fontSize: 13,
    fontWeight: '600',
  },
});
