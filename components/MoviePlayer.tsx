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
import { buildStreamUrl } from '@/services/streamUrlBuilder';
import {
  getWatchSession,
  saveWatchSession,
  clearWatchSession,
} from '@/services/watchProgress';

interface MoviePlayerProps {
  movieTitle: string;
  driveFileId?: string;
  quality?: string;
}

export default function MoviePlayer({
  movieTitle,
  quality = 'Full HD 1080p',
}: MoviePlayerProps) {
  const { width } = useWindowDimensions();
  const isMobile = width < 600;
  const mediaKey = `movie-${movieTitle.toLowerCase().replace(/[^a-z0-9]/g, '')}`;

  // Stream URL directo desde el VPS Nginx
  const currentUrl = buildStreamUrl(movieTitle, null, null, true);

  const [theaterMode, setTheaterMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showResumePrompt, setShowResumePrompt] = useState(false);
  const [savedTimeSecs, setSavedTimeSecs] = useState<number>(0);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [hasError, setHasError] = useState(false);

  const containerRef = useRef<View>(null);
  const playerFrameRef = useRef<View>(null);
  const webVideoRef = useRef<HTMLVideoElement | null>(null);
  const nativeVideoRef = useRef<Video | null>(null);
  const isFocused = useIsFocused();

  // Verificar sesión anterior para reanudar
  useEffect(() => {
    const session = getWatchSession(mediaKey);
    if (session) {
      try {
        const rawTime = localStorage.getItem(`pos_${mediaKey}`);
        if (rawTime) {
          const secs = parseFloat(rawTime);
          if (secs > 20) {
            setSavedTimeSecs(Math.floor(secs));
            setShowResumePrompt(true);
          }
        }
      } catch {}
    }
  }, [mediaKey]);

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
    }
  }, [mediaKey]);

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

  const openExternal = () => {
    if (currentUrl) Linking.openURL(currentUrl);
  };

  const fileName = currentUrl.split('/').pop() || `${movieTitle}.mp4`;

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
      {!isFullscreen && (
        <View style={[styles.headerBar, isMobile && styles.headerBarMobile]}>
          <View style={styles.headerLeft}>
            <View style={styles.vpsBadge}>
              <Ionicons name="film" size={13} color="#c084fc" />
              <Text style={styles.vpsBadgeText}>CINEMA</Text>
            </View>
            <Text style={styles.qualityText}>{quality}</Text>
          </View>

          <View style={styles.headerRight}>
            <Pressable style={styles.actionBtn} onPress={handleRestart} accessibilityLabel="Reiniciar">
              <Ionicons name="reload" size={14} color="#94a3b8" />
            </Pressable>
            <Pressable style={styles.actionBtn} onPress={openExternal} accessibilityLabel="Abrir enlace VPS">
              <Ionicons name="open-outline" size={14} color="#94a3b8" />
            </Pressable>
          </View>
        </View>
      )}

      {/* Frame de Video */}
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
              key={`vps-movie-${currentUrl}-${refreshKey}`}
              ref={(el) => {
                webVideoRef.current = el;
              }}
              src={currentUrl}
              controls
              autoPlay
              playsInline
              onTimeUpdate={handleWebTimeUpdate}
              onError={() => setHasError(true)}
              style={{
                width: '100%',
                height: '100%',
                backgroundColor: '#000000',
                outline: 'none',
              }}
            />

            {/* Prompt de Reanudar */}
            {showResumePrompt && (
              <View style={styles.resumeOverlay}>
                <View style={styles.resumeCard}>
                  <Ionicons name="time" size={32} color="#a855f7" style={{ marginBottom: 8 }} />
                  <Text style={styles.resumeTitle}>¿Reanudar película?</Text>
                  <Text style={styles.resumeSubtitle}>
                    {`Ibas en el minuto ${Math.floor(savedTimeSecs / 60)}:${String(savedTimeSecs % 60).padStart(2, '0')} de ${movieTitle}.`}
                  </Text>
                  <View style={styles.resumeBtnRow}>
                    <Pressable style={styles.resumePrimaryBtn} onPress={handleContinue}>
                      <Ionicons name="play" size={16} color="#ffffff" />
                      <Text style={styles.resumePrimaryText}>Continuar</Text>
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

        {hasError && (
          <View style={styles.errorOverlay}>
            <MaterialCommunityIcons name="server-network-off" size={44} color="#f87171" />
            <Text style={styles.errorTitle}>Película no disponible en VPS</Text>
            <Text style={styles.errorSub}>
              {`Verifica el archivo en tu servidor Nginx:\n${currentUrl}`}
            </Text>
            <Pressable style={styles.directBtn} onPress={openExternal}>
              <Ionicons name="open-outline" size={16} color="#ffffff" />
              <Text style={styles.directBtnText}>Abrir enlace en navegador</Text>
            </Pressable>
          </View>
        )}
      </View>

      {/* Footer */}
      <View style={styles.footerBar}>
        <View style={styles.footerLeft}>
          <Text style={styles.footerMovieTitle} numberOfLines={1}>
            {movieTitle}
          </Text>
        </View>
        <View style={styles.footerRight}>
          <Text style={styles.footerFileText} numberOfLines={1}>
            {decodeURIComponent(fileName)}
          </Text>
        </View>
      </View>
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
    backgroundColor: '#000',
  },
  theaterContainer: { maxWidth: '100%' },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 9,
    backgroundColor: '#11111c',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  headerBarMobile: { paddingHorizontal: 10, paddingVertical: 7 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  vpsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(74, 222, 128, 0.12)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(74, 222, 128, 0.3)',
  },
  vpsDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#4ade80' },
  vpsBadgeText: { color: '#86efac', fontSize: 11, fontWeight: '800' },
  qualityText: { color: '#94a3b8', fontSize: 11, fontWeight: '600' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionBtn: {
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
    backgroundColor: '#000',
    position: 'relative',
    overflow: 'hidden',
  },
  playerFrameMobile: { minHeight: 220 },
  playerFrameTheater: { maxHeight: 1080 },
  playerFrameFullscreen: {
    flex: 1,
    width: '100%',
    height: '100%',
    aspectRatio: undefined,
  },
  videoNative: { width: '100%', height: '100%', backgroundColor: '#000' },
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
  resumeTitle: { color: '#fff', fontSize: 17, fontWeight: '800' },
  resumeSubtitle: {
    color: '#94a3b8',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  resumeBtnRow: { flexDirection: 'row', gap: 10, marginTop: 18, width: '100%' },
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
  resumePrimaryText: { color: '#fff', fontSize: 13, fontWeight: '800' },
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
  resumeSecondaryText: { color: '#cbd5e1', fontSize: 12, fontWeight: '700' },
  errorOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: 'rgba(14, 10, 14, 0.96)',
    gap: 8,
  },
  errorTitle: { color: '#f87171', fontSize: 16, fontWeight: '800' },
  errorSub: {
    color: '#94a3b8',
    fontSize: 11,
    textAlign: 'center',
    maxWidth: 420,
    lineHeight: 16,
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
  directBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
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
  footerLeft: { flex: 1, marginRight: 10 },
  footerMovieTitle: { color: '#f1f5f9', fontSize: 12, fontWeight: '700' },
  footerRight: { alignItems: 'flex-end' },
  footerFileText: {
    color: '#64748b',
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
});
