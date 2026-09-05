import React, { useEffect, useState, useCallback } from 'react';
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
import { ActivityIndicator, Chip, ProgressBar } from 'react-native-paper';

import { useStore } from '@/store/useStore';
import { db } from '@/db';
import { series, userProgress } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getRecommendationsByGenre } from '@/services/tmdb';
import type { SeriesWithProgress, TMDBSearchResult } from '@/types';
import WebHeader from '@/components/WebHeader';

export default function HomeScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { seriesList, setSeries, userGenres, user } = useStore();

  const [recommendations, setRecommendations] = useState<TMDBSearchResult[]>([]);
  const [continueSeries, setContinueSeries] = useState<SeriesWithProgress | null>(null);
  const [loading, setLoading] = useState(seriesList.length === 0);
  const [refreshing, setRefreshing] = useState(false);

  const isDesktop = width >= 768;
  const isLargeDesktop = width >= 1200;

  // Ultra-fast optimized loader: 1 single parallel fetch, zero blocking TMDB
  const loadData = useCallback(async () => {
    try {
      const userId = user?.id ?? 1;

      // 1. Fetch series from Neon
      const dbSeriesPromise = db.select().from(series).orderBy(series.sortOrder);
      
      // 2. Fetch all user progress in 1 single query instead of N queries
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
        // Compute watched from set
        const watched = 0; // Guest or synced count
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
      // Unblock UI immediately — do not wait for external recommendation API!
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, setSeries]);

  // Load recommendations in the background without blocking
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

  const chicagoSeries = seriesList
    .filter((s) => s.isChicagoUniverse)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const otherSeries = seriesList
    .filter((s) => !s.isChicagoUniverse)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  if (loading && seriesList.length === 0) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#a855f7" />
        <Text style={styles.loaderTitle}>Iniciando Cronology</Text>
        <Text style={styles.loaderSub}>Cargando universo de series y conexiones...</Text>
      </View>
    );
  }

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
        {/* Main responsive container (centered on wide desktop) */}
        <View style={[styles.mainWrapper, isDesktop && styles.desktopWrapper]}>
          
          {/* Top Bar Header */}
          <View style={styles.header}>
            <View>
              <View style={styles.brandBadge}>
                <Ionicons name="time" size={14} color="#a855f7" />
                <Text style={styles.brandBadgeText}>TIMELINE TRACKER</Text>
              </View>
              <Text style={styles.title}>Cronology</Text>
            </View>
            <View style={styles.headerActions}>
              <Pressable
                style={({ hovered }: any) => [
                  styles.searchActionBtn,
                  hovered && styles.btnHovered,
                ]}
                onPress={() => router.push('/search')}
              >
                <Ionicons name="search" size={18} color="#e2e8f0" />
                {isDesktop && <Text style={styles.searchActionText}>Buscar series</Text>}
              </Pressable>
            </View>
          </View>

          {/* Featured Hero Banner */}
          {continueSeries && (
            <View style={styles.heroSection}>
              <Pressable
                style={({ hovered }: any) => [
                  styles.heroCard,
                  isDesktop && styles.heroCardDesktop,
                  hovered && styles.heroCardHovered,
                ]}
                onPress={() => router.push(`/series/${continueSeries.id}`)}
              >
                <Image
                  source={{ uri: continueSeries.bannerUrl ?? continueSeries.posterUrl ?? '' }}
                  style={styles.heroImage}
                  contentFit="cover"
                  transition={400}
                />
                <LinearGradient
                  colors={[
                    'rgba(10,10,15,0.1)',
                    'rgba(10,10,15,0.7)',
                    'rgba(10,10,15,0.98)',
                  ]}
                  style={styles.heroGradient}
                >
                  <View style={styles.heroBadges}>
                    {continueSeries.isChicagoUniverse && (
                      <View style={styles.chicagoTag}>
                        <Ionicons name="flame" size={14} color="#f97316" />
                        <Text style={styles.chicagoTagText}>One Chicago Universe</Text>
                      </View>
                    )}
                    <View style={styles.seasonTag}>
                      <Text style={styles.seasonTagText}>
                        {continueSeries.numberOfSeasons} Temporadas · {continueSeries.numberOfEpisodes} Episodios
                      </Text>
                    </View>
                  </View>

                  <Text style={[styles.heroTitle, isDesktop && styles.heroTitleDesktop]} numberOfLines={2}>
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
                  </View>
                </LinearGradient>
              </Pressable>
            </View>
          )}

          {/* One Chicago Universe Section */}
          {chicagoSeries.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View>
                  <View style={styles.sectionTitleRow}>
                    <Ionicons name="flame" size={22} color="#f97316" />
                    <Text style={styles.sectionTitle}>Universo One Chicago</Text>
                  </View>
                  <Text style={styles.sectionSubtitle}>
                    Franquicia interconectada con 9 arcos crossover organizados en orden cronológico
                  </Text>
                </View>
              </View>

              {/* Responsive Grid for Chicago Universe */}
              <View style={styles.cardGrid}>
                {chicagoSeries.map((s) => (
                  <Pressable
                    key={s.id}
                    style={({ hovered }: any) => [
                      styles.seriesCard,
                      isDesktop && styles.seriesCardDesktop,
                      hovered && styles.cardHovered,
                    ]}
                    onPress={() => router.push(`/series/${s.id}`)}
                  >
                    <View style={styles.posterWrapper}>
                      <Image
                        source={{ uri: s.posterUrl ?? '' }}
                        style={styles.seriesPoster}
                        contentFit="cover"
                        transition={300}
                      />
                      <View style={styles.cardBadge}>
                        <Text style={styles.cardBadgeText}>S1-S{s.numberOfSeasons}</Text>
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

          {/* Other Series Section (Grimm, etc.) */}
          {otherSeries.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View>
                  <View style={styles.sectionTitleRow}>
                    <Ionicons name="tv" size={22} color="#a855f7" />
                    <Text style={styles.sectionTitle}>Más Series Disponibles</Text>
                  </View>
                  <Text style={styles.sectionSubtitle}>
                    Series completas con todas sus temporadas y episodios en Español Latino Full HD
                  </Text>
                </View>
              </View>

              {/* Responsive Grid for Other Series */}
              <View style={styles.cardGrid}>
                {otherSeries.map((s) => (
                  <Pressable
                    key={s.id}
                    style={({ hovered }: any) => [
                      styles.seriesCard,
                      isDesktop && styles.seriesCardDesktop,
                      hovered && styles.cardHovered,
                    ]}
                    onPress={() => router.push(`/series/${s.id}`)}
                  >
                    <View style={styles.posterWrapper}>
                      <Image
                        source={{ uri: s.posterUrl ?? '' }}
                        style={styles.seriesPoster}
                        contentFit="cover"
                        transition={300}
                      />
                      <View style={styles.cardBadge}>
                        <Text style={styles.cardBadgeText}>S1-S{s.numberOfSeasons}</Text>
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

          {/* AI Recommendations Section */}
          {recommendations.length > 0 && (
            <View style={[styles.section, { marginBottom: 100 }]}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleRow}>
                  <Ionicons name="sparkles" size={20} color="#38bdf8" />
                  <Text style={styles.sectionTitle}>Recomendado por IA</Text>
                </View>
                <Text style={styles.sectionSubtitle}>
                  Sugerencias personalizadas basadas en tus preferencias
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
                      style={styles.recPoster}
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
    backgroundColor: '#0a0a0f',
  },
  loaderContainer: {
    flex: 1,
    backgroundColor: '#0a0a0f',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loaderTitle: {
    color: '#f1f5f9',
    fontSize: 18,
    fontWeight: '700',
    fontFamily: Platform.OS === 'web' ? 'Inter, sans-serif' : undefined,
  },
  loaderSub: {
    color: '#64748b',
    fontSize: 14,
  },
  scrollContent: {
    paddingBottom: 110,
  },
  mainWrapper: {
    width: '100%',
    paddingHorizontal: 16,
  },
  desktopWrapper: {
    maxWidth: 1240,
    alignSelf: 'center',
    paddingHorizontal: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
  },
  brandBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  brandBadgeText: {
    color: '#a855f7',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#f8fafc',
    letterSpacing: -0.5,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    cursor: 'pointer' as any,
  },
  btnHovered: {
    backgroundColor: 'rgba(168,85,247,0.18)',
    borderColor: 'rgba(168,85,247,0.4)',
  },
  searchActionText: {
    color: '#e2e8f0',
    fontSize: 13,
    fontWeight: '600',
  },
  heroSection: {
    marginVertical: 12,
  },
  heroCard: {
    height: 340,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#161622',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    cursor: 'pointer' as any,
  },
  heroCardDesktop: {
    height: 420,
  },
  heroCardHovered: {
    borderColor: 'rgba(168,85,247,0.5)',
    shadowColor: '#a855f7',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 8,
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
    marginBottom: 10,
  },
  chicagoTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(249,115,22,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(249,115,22,0.4)',
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
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  seasonTagText: {
    color: '#94a3b8',
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
  heroTitleDesktop: {
    fontSize: 38,
    maxWidth: 700,
  },
  heroProgressBox: {
    backgroundColor: 'rgba(15,15,24,0.6)',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
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
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  heroActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  playBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#7c3aed',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 16,
  },
  playBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  section: {
    marginTop: 32,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#f8fafc',
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    color: '#94a3b8',
    fontSize: 13,
    maxWidth: 650,
  },
  cardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  seriesCard: {
    width: '47%',
    minWidth: 150,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#161622',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    cursor: 'pointer' as any,
  },
  seriesCardDesktop: {
    width: '18.5%', // 5 columns on desktop!
    minWidth: 180,
  },
  cardHovered: {
    transform: [{ translateY: -4 }] as any,
    borderColor: 'rgba(168,85,247,0.5)',
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 6,
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
    backgroundColor: 'rgba(10,10,15,0.75)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  cardBadgeText: {
    color: '#e2e8f0',
    fontSize: 10,
    fontWeight: '700',
  },
  cardGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    justifyContent: 'flex-end',
  },
  cardTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  cardEpisodes: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 2,
  },
  horizontalScroll: {
    gap: 14,
    paddingVertical: 4,
  },
  recCard: {
    width: 150,
    aspectRatio: 2 / 3,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#161622',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    cursor: 'pointer' as any,
  },
  recPoster: {
    width: '100%',
    height: '100%',
  },
  recTitle: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  ratingText: {
    color: '#fbbf24',
    fontSize: 11,
    fontWeight: '700',
  },
});
