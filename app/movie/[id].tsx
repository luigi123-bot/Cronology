import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';

import WebHeader from '@/components/WebHeader';
import MoviePlayer from '@/components/MoviePlayer';
import { getMovieById, DRIVE_MOVIES } from '@/services/googleDriveMovies';

export default function MovieScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const scrollRef = useRef<ScrollView>(null);
  const playerPosition = useRef<number>(0);
  const trailerPosition = useRef<number>(0);

  const movie = getMovieById(id || '') || DRIVE_MOVIES[0];

  const scrollToPlayer = () => {
    scrollRef.current?.scrollTo({ y: playerPosition.current - 20, animated: true });
  };

  const scrollToTrailer = () => {
    scrollRef.current?.scrollTo({ y: trailerPosition.current - 20, animated: true });
  };

  if (!movie) {
    return (
      <View style={styles.loader}>
        <Text style={styles.errorText}>Película no encontrada</Text>
        <Pressable style={styles.backButtonSimple} onPress={() => router.replace('/')}>
          <Text style={{ color: '#fff', fontWeight: '700' }}>Volver al Inicio</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.outerContainer}>
      <WebHeader />

      <ScrollView
        ref={scrollRef}
        style={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.mainWrapper, isDesktop && styles.desktopWrapper]}>
          {/* Top Bar Navigation */}
          <View style={styles.breadcrumbBar}>
            <Pressable
              style={styles.backBtn}
              onPress={() => {
                if (router.canGoBack()) {
                  router.back();
                } else {
                  router.replace('/');
                }
              }}
            >
              <Ionicons name="arrow-back" size={18} color="#ffffff" />
              <Text style={styles.backBtnText}>Volver al Inicio</Text>
            </Pressable>

            <View style={styles.movieBadgeHeader}>
              <Ionicons name="film" size={14} color="#ec4899" />
              <Text style={styles.movieBadgeHeaderText}>CINE DRIVE</Text>
            </View>
          </View>

          {/* ═══════════════════════════════════════════════════════════
              CARTELERA PRINCIPAL (Billboard + Sinopsis ANTES del video)
             ═══════════════════════════════════════════════════════════ */}
          <View style={styles.carteleraCard}>
            {/* Backdrop Banner Background */}
            {movie.backdropUrl && (
              <Image
                source={{ uri: movie.backdropUrl }}
                style={styles.carteleraBackdrop}
                contentFit="cover"
                transition={400}
              />
            )}
            <LinearGradient
              colors={[
                'rgba(18, 18, 30, 0.7)',
                'rgba(18, 18, 30, 0.95)',
                '#12121e',
              ]}
              style={styles.carteleraGradient}
            >
              <View style={[styles.carteleraContent, isDesktop && styles.carteleraDesktop]}>
                {/* Poster Column */}
                {movie.posterUrl && (
                  <View style={styles.posterWrapper}>
                    <Image
                      source={{ uri: movie.posterUrl }}
                      style={styles.posterImage}
                      contentFit="cover"
                      transition={300}
                    />
                    <View style={styles.posterBadge}>
                      <Text style={styles.posterBadgeText}>{movie.quality}</Text>
                    </View>
                  </View>
                )}

                {/* Details Column */}
                <View style={styles.detailsCol}>
                  {/* Badges */}
                  <View style={styles.badgeRow}>
                    <View style={styles.yearBadge}>
                      <Text style={styles.yearBadgeText}>{movie.year}</Text>
                    </View>
                    <View style={styles.qualityPill}>
                      <Ionicons name="sparkles" size={12} color="#86efac" />
                      <Text style={styles.qualityPillText}>{movie.quality}</Text>
                    </View>
                    {movie.runtime > 0 && (
                      <View style={styles.runtimePill}>
                        <Ionicons name="time-outline" size={12} color="#94a3b8" />
                        <Text style={styles.runtimeText}>{movie.runtime} min</Text>
                      </View>
                    )}
                    {movie.voteAverage && (
                      <View style={styles.ratingBadge}>
                        <Ionicons name="star" size={13} color="#fbbf24" />
                        <Text style={styles.ratingText}>{movie.voteAverage}</Text>
                      </View>
                    )}
                  </View>

                  {/* Title */}
                  <Text style={styles.movieTitle}>{movie.title}</Text>
                  {movie.originalTitle && movie.originalTitle !== movie.title && (
                    <Text style={styles.originalTitle}>
                      Título original: {movie.originalTitle}
                    </Text>
                  )}

                  {/* Genres */}
                  {movie.genres && movie.genres.length > 0 && (
                    <View style={styles.genresRow}>
                      {movie.genres.map((g) => (
                        <View key={g.id} style={styles.genrePill}>
                          <Text style={styles.genreText}>{g.name}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Call-to-action buttons */}
                  <View style={styles.ctaRow}>
                    <Pressable style={styles.playCtaBtn} onPress={scrollToPlayer}>
                      <Ionicons name="play" size={18} color="#ffffff" />
                      <Text style={styles.playCtaText}>Reproducir Película</Text>
                    </Pressable>

                    {movie.youtubeTrailerId && (
                      <Pressable style={styles.trailerCtaBtn} onPress={scrollToTrailer}>
                        <Ionicons name="logo-youtube" size={16} color="#ef4444" />
                        <Text style={styles.trailerCtaText}>Ver Tráiler</Text>
                      </Pressable>
                    )}
                  </View>

                  {/* Synopsis / Sinopsis Oficial */}
                  <View style={styles.synopsisSection}>
                    <View style={styles.synopsisHeader}>
                      <Ionicons name="document-text-outline" size={16} color="#a855f7" />
                      <Text style={styles.synopsisLabel}>Sinopsis Oficial</Text>
                    </View>
                    <Text style={styles.synopsisText}>{movie.overview}</Text>
                  </View>
                </View>
              </View>
            </LinearGradient>
          </View>

          {/* ═══════════════════════════════════════════════════════════
              SECCIÓN DE REPRODUCCIÓN (El video abajo de la cartelera)
             ═══════════════════════════════════════════════════════════ */}
          <View
            onLayout={(e) => {
              playerPosition.current = e.nativeEvent.layout.y;
            }}
            style={styles.playerSection}
          >
            <View style={styles.sectionTitleRow}>
              <Ionicons name="play-circle" size={22} color="#4ade80" />
              <View>
                <Text style={styles.sectionHeading}>Reproductor Full HD</Text>
                <Text style={styles.sectionSubheading}>
                  Streaming directo desde Google Drive sin anuncios
                </Text>
              </View>
            </View>

            <MoviePlayer
              movieTitle={movie.title}
              driveFileId={movie.driveFileId}
              quality={movie.quality}
            />
          </View>

          {/* ═══════════════════════════════════════════════════════════
              TRÁILER OFICIAL DE YOUTUBE
             ═══════════════════════════════════════════════════════════ */}
          {movie.youtubeTrailerId && (
            <View
              onLayout={(e) => {
                trailerPosition.current = e.nativeEvent.layout.y;
              }}
              style={styles.trailerCard}
            >
              <View style={styles.trailerHeader}>
                <Ionicons name="logo-youtube" size={20} color="#ef4444" />
                <View>
                  <Text style={styles.trailerTitle}>Tráiler Oficial</Text>
                  <Text style={styles.trailerSubtitle}>Avance cinematográfico en alta definición</Text>
                </View>
              </View>
              <View style={styles.trailerFrame}>
                {Platform.OS === 'web' ? (
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${movie.youtubeTrailerId}?rel=0`}
                    title={`${movie.title} Tráiler Oficial`}
                    style={{
                      width: '100%',
                      height: '100%',
                      border: 'none',
                    }}
                    allowFullScreen
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  />
                ) : (
                  <View style={styles.mobileTrailer}>
                    <Text style={{ color: '#cbd5e1' }}>Ver en YouTube</Text>
                  </View>
                )}
              </View>
            </View>
          )}

          <View style={{ height: 80 }} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: '#0a0a0f',
  },
  container: {
    flex: 1,
    backgroundColor: '#0a0a0f',
  },
  mainWrapper: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  desktopWrapper: {
    maxWidth: 1100,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 24,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0a0f',
    gap: 16,
    padding: 24,
  },
  errorText: {
    color: '#f87171',
    fontSize: 16,
    fontWeight: '700',
  },
  backButtonSimple: {
    backgroundColor: '#a855f7',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  breadcrumbBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 12,
    cursor: 'pointer' as any,
  },
  backBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  movieBadgeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(236, 72, 153, 0.15)',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(236, 72, 153, 0.35)',
  },
  movieBadgeHeaderText: {
    color: '#f472b6',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },

  /* ─── Cartelera Billboard Styles ─── */
  carteleraCard: {
    position: 'relative',
    backgroundColor: '#12121e',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
    marginBottom: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.5,
    shadowRadius: 28,
    elevation: 10,
  },
  carteleraBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    opacity: 0.28,
  },
  carteleraGradient: {
    width: '100%',
    padding: 24,
  },
  carteleraContent: {
    flexDirection: 'column',
    gap: 24,
  },
  carteleraDesktop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 32,
  },
  posterWrapper: {
    width: 220,
    alignSelf: 'center',
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    position: 'relative',
  },
  posterImage: {
    width: 220,
    height: 330,
  },
  posterBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  posterBadgeText: {
    color: '#4ade80',
    fontSize: 10,
    fontWeight: '800',
  },
  detailsCol: {
    flex: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  yearBadge: {
    backgroundColor: 'rgba(168, 85, 247, 0.22)',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.45)',
  },
  yearBadgeText: {
    color: '#c084fc',
    fontSize: 12,
    fontWeight: '800',
  },
  qualityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(74, 222, 128, 0.14)',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(74, 222, 128, 0.35)',
  },
  qualityPillText: {
    color: '#86efac',
    fontSize: 11,
    fontWeight: '700',
  },
  runtimePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  runtimeText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '600',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  ratingText: {
    color: '#fbbf24',
    fontSize: 11,
    fontWeight: '800',
  },
  movieTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: -0.6,
  },
  originalTitle: {
    color: '#94a3b8',
    fontSize: 13,
    marginTop: 4,
  },
  genresRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
  },
  genrePill: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  genreText: {
    color: '#e2e8f0',
    fontSize: 12,
    fontWeight: '600',
  },
  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 20,
    flexWrap: 'wrap',
  },
  playCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#16a34a',
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 14,
    cursor: 'pointer' as any,
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 4,
  },
  playCtaText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  trailerCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    cursor: 'pointer' as any,
  },
  trailerCtaText: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: '700',
  },
  synopsisSection: {
    marginTop: 22,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  synopsisHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  synopsisLabel: {
    color: '#f1f5f9',
    fontSize: 14,
    fontWeight: '800',
  },
  synopsisText: {
    color: '#cbd5e1',
    fontSize: 14,
    lineHeight: 24,
  },

  /* ─── Video Player Section ─── */
  playerSection: {
    marginBottom: 28,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  sectionHeading: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
  },
  sectionSubheading: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 2,
  },

  /* ─── Trailer Card ─── */
  trailerCard: {
    backgroundColor: '#12121e',
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 24,
  },
  trailerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  trailerTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  trailerSubtitle: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 2,
  },
  trailerFrame: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#000000',
  },
  mobileTrailer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
