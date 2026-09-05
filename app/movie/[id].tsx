import React from 'react';
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

  const movie = getMovieById(id || '') || DRIVE_MOVIES[0];

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

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
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
              <Ionicons name="film" size={14} color="#a855f7" />
              <Text style={styles.movieBadgeHeaderText}>PELÍCULA</Text>
            </View>
          </View>

          {/* Video Player */}
          <MoviePlayer
            movieTitle={movie.title}
            driveFileId={movie.driveFileId}
            quality={movie.quality}
          />

          {/* Movie Details Card */}
          <View style={styles.infoCard}>
            <View style={styles.titleRow}>
              <View style={{ flex: 1 }}>
                <View style={styles.badgeRow}>
                  <View style={styles.yearBadge}>
                    <Text style={styles.yearBadgeText}>{movie.year}</Text>
                  </View>
                  <View style={styles.qualityBadge}>
                    <Text style={styles.qualityBadgeText}>{movie.quality}</Text>
                  </View>
                  {movie.runtime > 0 && (
                    <Text style={styles.runtimeText}>· {movie.runtime} min</Text>
                  )}
                  {movie.voteAverage && (
                    <View style={styles.ratingBadge}>
                      <Ionicons name="star" size={12} color="#fbbf24" />
                      <Text style={styles.ratingText}>{movie.voteAverage}</Text>
                    </View>
                  )}
                </View>

                <Text style={styles.movieTitle}>{movie.title}</Text>
                {movie.originalTitle && movie.originalTitle !== movie.title && (
                  <Text style={styles.originalTitle}>Título original: {movie.originalTitle}</Text>
                )}
              </View>
            </View>

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

            {/* Synopsis */}
            {movie.overview && (
              <View style={styles.overviewSection}>
                <Text style={styles.overviewLabel}>Sinopsis Oficial</Text>
                <Text style={styles.overviewText}>{movie.overview}</Text>
              </View>
            )}
          </View>

          {/* Official YouTube Trailer */}
          {movie.youtubeTrailerId && (
            <View style={styles.trailerCard}>
              <View style={styles.trailerHeader}>
                <Ionicons name="logo-youtube" size={18} color="#ef4444" />
                <Text style={styles.trailerTitle}>Tráiler Oficial</Text>
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

          <View style={{ height: 60 }} />
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
    marginBottom: 12,
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
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.3)',
  },
  movieBadgeHeaderText: {
    color: '#c084fc',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  infoCard: {
    backgroundColor: '#12121e',
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
    flexWrap: 'wrap',
  },
  yearBadge: {
    backgroundColor: 'rgba(168, 85, 247, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.4)',
  },
  yearBadgeText: {
    color: '#c084fc',
    fontSize: 11,
    fontWeight: '800',
  },
  qualityBadge: {
    backgroundColor: 'rgba(74, 222, 128, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(74, 222, 128, 0.3)',
  },
  qualityBadgeText: {
    color: '#86efac',
    fontSize: 11,
    fontWeight: '700',
  },
  runtimeText: {
    color: '#64748b',
    fontSize: 12,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(251, 191, 36, 0.12)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  ratingText: {
    color: '#fbbf24',
    fontSize: 11,
    fontWeight: '700',
  },
  movieTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  originalTitle: {
    color: '#64748b',
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
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  genreText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '600',
  },
  overviewSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  overviewLabel: {
    color: '#e2e8f0',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  overviewText: {
    color: '#cbd5e1',
    fontSize: 14,
    lineHeight: 22,
  },
  trailerCard: {
    backgroundColor: '#12121e',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 16,
  },
  trailerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  trailerTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  trailerFrame: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#000000',
  },
  mobileTrailer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
