import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  Pressable,
  useWindowDimensions,
  RefreshControl,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, ProgressBar } from 'react-native-paper';

import { useStore } from '@/store/useStore';
import { db } from '@/db';
import { series, userProgress } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getRecommendationsByGenre } from '@/services/tmdb';
import type { SeriesWithProgress, TMDBSearchResult } from '@/types';
import WebHeader from '@/components/WebHeader';
import { DRIVE_MOVIES } from '@/services/googleDriveMovies';

type CategoryFilter = 'all' | 'chicago' | 'movies' | 'series' | 'recs';

export default function HomeScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { seriesList, setSeries, userGenres, user } = useStore();

  const [recommendations, setRecommendations] = useState<TMDBSearchResult[]>([]);
  const [continueSeries, setContinueSeries] = useState<SeriesWithProgress | null>(null);
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('all');
  const [loading, setLoading] = useState(seriesList.length === 0);
  const [refreshing, setRefreshing] = useState(false);

  // Responsive breakpoints
  const isMobile = width < 600;
  const isTablet = width >= 600 && width < 1024;
  const isDesktop = width >= 1024;
  const isWideScreen = width >= 1440;

  // Ultra-fast loader: 1 single parallel query for series + progress
  const loadData = useCallback(async () => {
    try {
      const userId = user?.id ?? 1;

      const dbSeriesPromise = db.select().from(series).orderBy(series.sortOrder);
      const progressPromise = db
        .select({ episodeId: userProgress.episodeId })
        .from(userProgress)
        .where(
          and(
            eq(userProgress.userId, userId),
            eq(userProgress.watched, true)
          )
        )
        .catch(() => []);

      const [dbSeries, watchedRows] = await Promise.all([dbSeriesPromise, progressPromise]);
      const watchedSet = new Set((watchedRows || []).map((r) => r.episodeId));

      const seriesWithProgress: SeriesWithProgress[] = dbSeries.map((s) => {
        const total = Number(s.numberOfEpisodes ?? 0);
        const watched = 0;
        return {
          id: s.id,
          tmdbId: s.tmdbId,
          name: s.name,
          posterUrl: s.posterUrl,
          bannerUrl: s.bannerUrl,
          genres: (s.genres as { id: number; name: string }[]) ?? [],
          status: s.status,
          numberOfSeasons: s.numberOfSeasons ?? 0,
          numberOfEpisodes: total,
          watchedCount: watched,
          totalCount: total,
          progressPercent: total > 0 ? Math.round((watched / total) * 100) : 0,
          youtubeTrailerId: s.youtubeTrailerId,
          isChicagoUniverse: s.isChicagoUniverse ?? false,
          sortOrder: s.sortOrder ?? 999,
        };
      });

      setSeries(seriesWithProgress);

      const inProgress = seriesWithProgress
        .filter((s) => s.progressPercent > 0 && s.progressPercent < 100)
        .sort((a, b) => b.progressPercent - a.progressPercent);

      setContinueSeries(inProgress[0] ?? seriesWithProgress[0] ?? null);
    } catch (error) {
      console.error('[Home] Failed to load series:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, setSeries]);

  // Load recommendations in background without blocking initial paint
  useEffect(() => {
    if (userGenres.length > 0 && seriesList.length > 0 && recommendations.length === 0) {
      getRecommendationsByGenre(userGenres.map((g) => g.id))
        .then((recs) => {
          const userTmdbIds = new Set(seriesList.map((s) => s.tmdbId));
          setRecommendations(recs.filter((r) => !userTmdbIds.has(r.id)).slice(0, 10));
        })
        .catch(() => {});
    }
  }, [userGenres, seriesList.length, recommendations.length]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const chicagoSeries = useMemo(
    () => seriesList.filter((s) => s.isChicagoUniverse).sort((a, b) => a.sortOrder - b.sortOrder),
    [seriesList]
  );

  const otherSeries = useMemo(
    () => seriesList.filter((s) => !s.isChicagoUniverse).sort((a, b) => a.sortOrder - b.sortOrder),
    [seriesList]
  );

  // Responsive card dimensions for native
  const nativeCardWidth = useMemo(() => {
    if (width >= 1200) return '18.4%';
    if (width >= 800) return '23%';
    if (width >= 560) return '31%';
    return '47.6%';
  }, [width]);

  if (loading && seriesList.length === 0) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#a855f7" />
        <Text style={styles.loaderTitle}>Iniciando Cronology</Text>
        <Text style={styles.loaderSub}>Cargando catálogo en orden cronológico...</Text>
      </View>
    );
  }

  const showChicago = activeCategory === 'all' || activeCategory === 'chicago';
  const showMovies = activeCategory === 'all' || activeCategory === 'movies';
  const showSeries = activeCategory === 'all' || activeCategory === 'series';
  const showRecs = activeCategory === 'all' || activeCategory === 'recs';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <WebHeader />
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#a855f7"
          />
        }
        contentContainerStyle={styles.scrollContent}
      >
        <View style={[styles.mainWrapper, isDesktop && styles.desktopWrapper]}>
          
          {/* Welcome & Stats Greeting Bar */}
          <View style={styles.welcomeBanner}>
            <View style={styles.welcomeLeft}>
              <View style={styles.greetingRow}>
                <Text style={styles.greetingEmoji}>{user?.avatarUrl || '👋'}</Text>
                <Text style={styles.greetingTitle}>
                  {user ? `¡Hola de nuevo, ${user.displayName || 'Luis'}!` : '¡Bienvenido a Cronology!'}
                </Text>
              </View>
              <Text style={styles.greetingSubtitle}>
                Series organizadas en orden cronológico oficial y películas completas en streaming Drive 1080p.
              </Text>
            </View>

            <View style={styles.statsPillRow}>
              <View style={styles.statPill}>
                <Ionicons name="tv" size={13} color="#c084fc" />
                <Text style={styles.statPillText}>{seriesList.length} Series</Text>
              </View>
              <View style={[styles.statPill, styles.statPillPink]}>
                <Ionicons name="film" size={13} color="#f472b6" />
                <Text style={styles.statPillText}>{DRIVE_MOVIES.length} Película{DRIVE_MOVIES.length > 1 ? 's' : ''}</Text>
              </View>
              <View style={[styles.statPill, styles.statPillGreen]}>
                <Ionicons name="logo-google" size={13} color="#4ade80" />
                <Text style={styles.statPillText}>Drive HD</Text>
              </View>
            </View>
          </View>

          {/* Quick Filter Pill Tabs */}
          <View style={styles.filterBarWrapper}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterBar}
            >
              <Pressable
                style={[
                  styles.filterTab,
                  activeCategory === 'all' && styles.filterTabActive,
                ]}
                onPress={() => setActiveCategory('all')}
              >
                <Ionicons
                  name="sparkles"
                  size={14}
                  color={activeCategory === 'all' ? '#ffffff' : '#94a3b8'}
                />
                <Text
                  style={[
                    styles.filterTabText,
                    activeCategory === 'all' && styles.filterTabTextActive,
                  ]}
                >
                  Todo el Catálogo
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.filterTab,
                  activeCategory === 'chicago' && styles.filterTabActive,
                ]}
                onPress={() => setActiveCategory('chicago')}
              >
                <Ionicons
                  name="flame"
                  size={14}
                  color={activeCategory === 'chicago' ? '#ffffff' : '#f97316'}
                />
                <Text
                  style={[
                    styles.filterTabText,
                    activeCategory === 'chicago' && styles.filterTabTextActive,
                  ]}
                >
                  Universo One Chicago
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.filterTab,
                  activeCategory === 'movies' && styles.filterTabActive,
                ]}
                onPress={() => setActiveCategory('movies')}
              >
                <Ionicons
                  name="film"
                  size={14}
                  color={activeCategory === 'movies' ? '#ffffff' : '#ec4899'}
                />
                <Text
                  style={[
                    styles.filterTabText,
                    activeCategory === 'movies' && styles.filterTabTextActive,
                  ]}
                >
                  Películas Drive
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.filterTab,
                  activeCategory === 'series' && styles.filterTabActive,
                ]}
                onPress={() => setActiveCategory('series')}
              >
                <Ionicons
                  name="tv"
                  size={14}
                  color={activeCategory === 'series' ? '#ffffff' : '#a855f7'}
                />
                <Text
                  style={[
                    styles.filterTabText,
                    activeCategory === 'series' && styles.filterTabTextActive,
                  ]}
                >
                  Otras Series
                </Text>
              </Pressable>

              {recommendations.length > 0 && (
                <Pressable
                  style={[
                    styles.filterTab,
                    activeCategory === 'recs' && styles.filterTabActive,
                  ]}
                  onPress={() => setActiveCategory('recs')}
                >
                  <Ionicons
                    name="bulb"
                    size={14}
                    color={activeCategory === 'recs' ? '#ffffff' : '#38bdf8'}
                  />
                  <Text
                    style={[
                      styles.filterTabText,
                      activeCategory === 'recs' && styles.filterTabTextActive,
                    ]}
                  >
                    Recomendados IA
                  </Text>
                </Pressable>
              )}
            </ScrollView>
          </View>

          {/* Featured Hero Banner */}
          {continueSeries && activeCategory === 'all' && (
            <View style={styles.heroSection}>
              <Pressable
                style={({ hovered }: any) => [
                  styles.heroCard,
                  isTablet && styles.heroCardTablet,
                  isDesktop && styles.heroCardDesktop,
                  hovered && styles.heroCardHovered,
                ]}
                onPress={() => router.push(`/series/${continueSeries.id}`)}
              >
                <Image
                  source={{ uri: continueSeries.bannerUrl ?? continueSeries.posterUrl ?? '' }}
                  style={styles.heroImage as any}
                  contentFit="cover"
                  transition={400}
                />
                <LinearGradient
                  colors={[
                    'rgba(10,10,15,0.05)',
                    'rgba(10,10,15,0.5)',
                    'rgba(10,10,15,0.96)',
                  ]}
                  style={styles.heroGradient}
                >
                  <View style={styles.heroBadges}>
                    <View style={styles.heroFeaturePill}>
                      <Ionicons name="star" size={12} color="#fbbf24" />
                      <Text style={styles.heroFeatureText}>DESTACADO DE HOY</Text>
                    </View>

                    {continueSeries.isChicagoUniverse && (
                      <View style={styles.chicagoTag}>
                        <Ionicons name="flame" size={13} color="#f97316" />
                        <Text style={styles.chicagoTagText}>Universo One Chicago</Text>
                      </View>
                    )}

                    <View style={styles.seasonTag}>
                      <Text style={styles.seasonTagText}>
                        {continueSeries.numberOfSeasons} Temporadas · {continueSeries.numberOfEpisodes} Capítulos
                      </Text>
                    </View>
                  </View>

                  <Text
                    style={[
                      styles.heroTitle,
                      isTablet && styles.heroTitleTablet,
                      isDesktop && styles.heroTitleDesktop,
                    ]}
                    numberOfLines={2}
                  >
                    {continueSeries.name}
                  </Text>

                  {/* Progress info */}
                  <View style={styles.heroProgressBox}>
                    <View style={styles.progressRow}>
                      <Text style={styles.progressLabel}>Progreso general</Text>
                      <Text style={styles.progressValue}>
                        {continueSeries.progressPercent}% completado
                      </Text>
                    </View>
                    <ProgressBar
                      progress={Math.max(continueSeries.progressPercent / 100, 0.02)}
                      color="#a855f7"
                      style={styles.progressBar}
                    />
                  </View>

                  <View style={styles.heroActions}>
                    <View style={styles.playBtn}>
                      <Ionicons name="play" size={16} color="#ffffff" />
                      <Text style={styles.playBtnText}>Ver Temporadas</Text>
                    </View>
                    <View style={styles.detailsBtn}>
                      <Ionicons name="information-circle-outline" size={17} color="#cbd5e1" />
                      <Text style={styles.detailsBtnText}>Orden Cronológico</Text>
                    </View>
                  </View>
                </LinearGradient>
              </Pressable>
            </View>
          )}

          {/* Section: One Chicago Universe */}
          {showChicago && chicagoSeries.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View>
                  <View style={styles.sectionTitleRow}>
                    <View style={styles.sectionIconBadgeOrange}>
                      <Ionicons name="flame" size={18} color="#f97316" />
                    </View>
                    <Text style={styles.sectionTitle}>Universo One Chicago</Text>
                  </View>
                  <Text style={styles.sectionSubtitle}>
                    Franquicia interconectada con crossovers organizados en orden cronológico estricto.
                  </Text>
                </View>
              </View>

              <View style={styles.gridContainer as any}>
                {chicagoSeries.map((s) => (
                  <Pressable
                    key={s.id}
                    style={({ hovered }: any) => [
                      styles.seriesCard,
                      Platform.OS !== 'web' && { width: nativeCardWidth as any },
                      hovered && styles.cardHovered,
                    ]}
                    onPress={() => router.push(`/series/${s.id}`)}
                  >
                    <View style={styles.posterWrapper}>
                      <Image
                        source={{ uri: s.posterUrl ?? '' }}
                        style={styles.seriesPoster as any}
                        contentFit="cover"
                        transition={300}
                      />
                      <View style={styles.cardBadge}>
                        <Text style={styles.cardBadgeText}>S1-S{s.numberOfSeasons}</Text>
                      </View>
                      <View style={styles.playOverlay}>
                        <View style={styles.playCircle}>
                          <Ionicons name="play" size={18} color="#ffffff" />
                        </View>
                      </View>
                      <LinearGradient
                        colors={['transparent', 'rgba(10,10,15,0.92)']}
                        style={styles.cardGradient}
                      >
                        <Text style={styles.cardTitle} numberOfLines={1}>
                          {s.name}
                        </Text>
                        <Text style={styles.cardEpisodes}>
                          {s.numberOfEpisodes} episodios
                        </Text>
                      </LinearGradient>
                    </View>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {/* Section: Películas en Google Drive */}
          {showMovies && DRIVE_MOVIES.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View>
                  <View style={styles.sectionTitleRow}>
                    <View style={styles.sectionIconBadgePink}>
                      <Ionicons name="film" size={18} color="#ec4899" />
                    </View>
                    <Text style={styles.sectionTitle}>Películas en Google Drive</Text>
                  </View>
                  <Text style={styles.sectionSubtitle}>
                    Películas completas con sinopsis oficial, tráiler de cine y reproductor Drive Full HD 1080p.
                  </Text>
                </View>
              </View>

              <View style={styles.gridContainer as any}>
                {DRIVE_MOVIES.map((m) => (
                  <Pressable
                    key={m.id}
                    style={({ hovered }: any) => [
                      styles.seriesCard,
                      Platform.OS !== 'web' && { width: nativeCardWidth as any },
                      hovered && styles.cardHovered,
                    ]}
                    onPress={() => router.push(`/movie/${m.id}` as any)}
                  >
                    <View style={styles.posterWrapper}>
                      <Image
                        source={{ uri: m.posterUrl ?? '' }}
                        style={styles.seriesPoster as any}
                        contentFit="cover"
                        transition={300}
                      />
                      <View style={[styles.cardBadge, styles.badgePink]}>
                        <Ionicons name="logo-google" size={10} color="#ffffff" style={{ marginRight: 3 }} />
                        <Text style={styles.cardBadgeText}>Cine Drive</Text>
                      </View>
                      <View style={styles.playOverlay}>
                        <View style={[styles.playCircle, styles.playCirclePink]}>
                          <Ionicons name="play" size={18} color="#ffffff" />
                        </View>
                      </View>
                      <LinearGradient
                        colors={['transparent', 'rgba(10,10,15,0.95)']}
                        style={styles.cardGradient}
                      >
                        <Text style={styles.cardTitle} numberOfLines={1}>
                          {m.title}
                        </Text>
                        <View style={styles.movieMetaRow}>
                          <Text style={styles.cardEpisodes}>{m.year}</Text>
                          <Text style={styles.metaDot}>•</Text>
                          <Text style={styles.cardQualityBadge}>1080p</Text>
                          {m.voteAverage && (
                            <>
                              <Text style={styles.metaDot}>•</Text>
                              <View style={styles.ratingBadge}>
                                <Ionicons name="star" size={10} color="#fbbf24" />
                                <Text style={styles.ratingBadgeText}>{m.voteAverage}</Text>
                              </View>
                            </>
                          )}
                        </View>
                      </LinearGradient>
                    </View>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {/* Section: Más Series Disponibles (Grimm, etc.) */}
          {showSeries && otherSeries.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View>
                  <View style={styles.sectionTitleRow}>
                    <View style={styles.sectionIconBadgePurple}>
                      <Ionicons name="tv" size={18} color="#a855f7" />
                    </View>
                    <Text style={styles.sectionTitle}>Más Series Disponibles</Text>
                  </View>
                  <Text style={styles.sectionSubtitle}>
                    Series completas con todas sus temporadas y episodios en Español Latino Full HD.
                  </Text>
                </View>
              </View>

              <View style={styles.gridContainer as any}>
                {otherSeries.map((s) => (
                  <Pressable
                    key={s.id}
                    style={({ hovered }: any) => [
                      styles.seriesCard,
                      Platform.OS !== 'web' && { width: nativeCardWidth as any },
                      hovered && styles.cardHovered,
                    ]}
                    onPress={() => router.push(`/series/${s.id}`)}
                  >
                    <View style={styles.posterWrapper}>
                      <Image
                        source={{ uri: s.posterUrl ?? '' }}
                        style={styles.seriesPoster as any}
                        contentFit="cover"
                        transition={300}
                      />
                      <View style={styles.cardBadge}>
                        <Text style={styles.cardBadgeText}>S1-S{s.numberOfSeasons}</Text>
                      </View>
                      <View style={styles.playOverlay}>
                        <View style={styles.playCircle}>
                          <Ionicons name="play" size={18} color="#ffffff" />
                        </View>
                      </View>
                      <LinearGradient
                        colors={['transparent', 'rgba(10,10,15,0.92)']}
                        style={styles.cardGradient}
                      >
                        <Text style={styles.cardTitle} numberOfLines={1}>
                          {s.name}
                        </Text>
                        <Text style={styles.cardEpisodes}>
                          {s.numberOfEpisodes} episodios
                        </Text>
                      </LinearGradient>
                    </View>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {/* Section: Recomendados por Inteligencia Artificial */}
          {showRecs && recommendations.length > 0 && (
            <View style={[styles.section, { marginBottom: 40 }]}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleRow}>
                  <View style={styles.sectionIconBadgeBlue}>
                    <Ionicons name="sparkles" size={18} color="#38bdf8" />
                  </View>
                  <Text style={styles.sectionTitle}>Recomendado por IA</Text>
                </View>
                <Text style={styles.sectionSubtitle}>
                  Sugerencias personalizadas basadas en tus gustos y universos seguidos.
                </Text>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalScroll}
              >
                {recommendations.map((rec) => (
                  <Pressable
                    key={rec.id}
                    style={({ hovered }: any) => [
                      styles.recCard,
                      hovered && styles.cardHovered,
                    ]}
                    onPress={() => router.push(`/search?prefill=${encodeURIComponent(rec.name)}`)}
                  >
                    <Image
                      source={{
                        uri: rec.poster_path
                          ? `https://image.tmdb.org/t/p/w342${rec.poster_path}`
                          : '',
                      }}
                      style={styles.recPoster as any}
                      contentFit="cover"
                      transition={300}
                    />
                    <LinearGradient
                      colors={['transparent', 'rgba(10,10,15,0.95)']}
                      style={styles.cardGradient}
                    >
                      <Text style={styles.recTitle} numberOfLines={1}>
                        {rec.name}
                      </Text>
                      <View style={styles.ratingRow}>
                        <Ionicons name="star" size={12} color="#fbbf24" />
                        <Text style={styles.ratingText}>
                          {rec.vote_average.toFixed(1)}
                        </Text>
                      </View>
                    </LinearGradient>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090f',
  },
  loaderContainer: {
    flex: 1,
    backgroundColor: '#09090f',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loaderTitle: {
    color: '#f1f5f9',
    fontSize: 18,
    fontWeight: '800',
  },
  loaderSub: {
    color: '#64748b',
    fontSize: 14,
  },
  scrollContent: {
    paddingBottom: 130, // Clearance for bottom floating navigation bar
  },
  mainWrapper: {
    width: '100%',
    paddingHorizontal: 16,
  },
  desktopWrapper: {
    maxWidth: 1320,
    alignSelf: 'center',
    paddingHorizontal: 32,
  },
  welcomeBanner: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
    marginBottom: 16,
  },
  welcomeLeft: {
    flex: 1,
    minWidth: 260,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  greetingEmoji: {
    fontSize: 22,
  },
  greetingTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: -0.4,
  },
  greetingSubtitle: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 4,
    lineHeight: 18,
  },
  statsPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(168, 85, 247, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statPillPink: {
    backgroundColor: 'rgba(236, 72, 153, 0.12)',
    borderColor: 'rgba(236, 72, 153, 0.3)',
  },
  statPillGreen: {
    backgroundColor: 'rgba(74, 222, 128, 0.12)',
    borderColor: 'rgba(74, 222, 128, 0.3)',
  },
  statPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#f8fafc',
  },
  filterBarWrapper: {
    marginVertical: 10,
  },
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    cursor: 'pointer' as any,
  },
  filterTabActive: {
    backgroundColor: '#7c3aed',
    borderColor: '#a855f7',
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 4,
  },
  filterTabText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '600',
  },
  filterTabTextActive: {
    color: '#ffffff',
    fontWeight: '800',
  },
  heroSection: {
    marginVertical: 16,
  },
  heroCard: {
    height: 350,
    borderRadius: 26,
    overflow: 'hidden',
    backgroundColor: '#161622',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    cursor: 'pointer' as any,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.5,
    shadowRadius: 28,
    elevation: 8,
  },
  heroCardTablet: {
    height: 400,
  },
  heroCardDesktop: {
    height: 460,
  },
  heroCardHovered: {
    borderColor: 'rgba(168, 85, 247, 0.6)',
    shadowColor: '#a855f7',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.35,
    shadowRadius: 30,
    elevation: 12,
  },
  heroImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  heroGradient: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 24,
  },
  heroBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  heroFeaturePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.4)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  heroFeatureText: {
    color: '#fde047',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  chicagoTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(249, 115, 22, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(249, 115, 22, 0.4)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  chicagoTagText: {
    color: '#fdba74',
    fontSize: 11,
    fontWeight: '700',
  },
  seasonTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  seasonTagText: {
    color: '#e2e8f0',
    fontSize: 11,
    fontWeight: '600',
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#ffffff',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  heroTitleTablet: {
    fontSize: 34,
  },
  heroTitleDesktop: {
    fontSize: 42,
    maxWidth: 760,
  },
  heroProgressBox: {
    backgroundColor: 'rgba(15, 15, 24, 0.75)',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    maxWidth: 500,
    marginBottom: 16,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '500',
  },
  progressValue: {
    color: '#c084fc',
    fontSize: 12,
    fontWeight: '700',
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  heroActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  playBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#7c3aed',
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 16,
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  playBtnText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 14,
  },
  detailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    paddingVertical: 11,
    paddingHorizontal: 18,
    borderRadius: 16,
  },
  detailsBtnText: {
    color: '#e2e8f0',
    fontWeight: '700',
    fontSize: 13,
  },
  section: {
    marginTop: 34,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  sectionIconBadgeOrange: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(249, 115, 22, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(249, 115, 22, 0.3)',
  },
  sectionIconBadgePink: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(236, 72, 153, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(236, 72, 153, 0.3)',
  },
  sectionIconBadgePurple: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.3)',
  },
  sectionIconBadgeBlue: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  sectionTitle: {
    fontSize: 21,
    fontWeight: '900',
    color: '#f8fafc',
    letterSpacing: -0.4,
  },
  sectionSubtitle: {
    color: '#94a3b8',
    fontSize: 13,
    maxWidth: 700,
    lineHeight: 18,
    marginTop: 2,
  },
  // Responsive Grid styling
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    width: '100%',
    ...(Platform.OS === 'web'
      ? ({
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(185px, 1fr))',
          gap: 18,
        } as any)
      : {}),
  } as any,
  seriesCard: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#13131f',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    cursor: 'pointer' as any,
    ...(Platform.OS === 'web' ? ({ transition: 'all 0.25s ease' } as any) : {}),
  } as any,
  cardHovered: {
    transform: [{ translateY: -6 }] as any,
    borderColor: 'rgba(168, 85, 247, 0.6)',
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 8,
  },
  posterWrapper: {
    width: '100%',
    aspectRatio: 2 / 3,
    position: 'relative',
  },
  seriesPoster: {
    width: '100%',
    height: '100%',
  },
  cardBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(10, 10, 16, 0.82)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    zIndex: 2,
  },
  badgePink: {
    backgroundColor: 'rgba(219, 39, 119, 0.88)',
    borderColor: 'rgba(244, 114, 182, 0.4)',
  },
  cardBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  playOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
    opacity: 0,
    ...(Platform.OS === 'web'
      ? {
          transition: 'opacity 0.2s ease',
          ':hover': { opacity: 1 },
        }
      : {}),
  },
  playCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(124, 58, 237, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  playCirclePink: {
    backgroundColor: 'rgba(236, 72, 153, 0.85)',
  },
  cardGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 14,
    justifyContent: 'flex-end',
    zIndex: 2,
  },
  cardTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  cardEpisodes: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 3,
  },
  movieMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
    flexWrap: 'wrap',
  },
  metaDot: {
    color: '#64748b',
    fontSize: 10,
    marginHorizontal: 4,
  },
  cardQualityBadge: {
    color: '#4ade80',
    fontSize: 11,
    fontWeight: '700',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ratingBadgeText: {
    color: '#fbbf24',
    fontSize: 11,
    fontWeight: '700',
  },
  horizontalScroll: {
    gap: 16,
    paddingVertical: 6,
  },
  recCard: {
    width: 155,
    aspectRatio: 2 / 3,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#13131f',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    cursor: 'pointer' as any,
  },
  recPoster: {
    width: '100%',
    height: '100%',
  },
  recTitle: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  ratingText: {
    color: '#fbbf24',
    fontSize: 11,
    fontWeight: '700',
  },
});
