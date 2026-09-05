import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { db } from '@/db';
import { series, seasons, episodes, userProgress } from '@/db/schema';
import { eq, and, count } from 'drizzle-orm';
import { useStore } from '@/store/useStore';
import { getYouTubeDeepLink, getYouTubeUrl } from '@/services/youtube';
import type { SeasonDisplay, EpisodeWithProgress } from '@/types';
import CrossoverAlert from '@/components/CrossoverAlert';
import EpisodeCard from '@/components/EpisodeCard';
import WebHeader from '@/components/WebHeader';
import { GRIMM_DRIVE_FOLDER_URL } from '@/services/googleDrive';
import {
  getSeriesCurrentEpisode,
  isEpisodeWatchedLocal,
  markEpisodeWatchedLocal,
  type SeriesCurrentProgress,
} from '@/services/watchProgress';

const { width, height } = Dimensions.get('window');
const BANNER_HEIGHT = height * 0.38;

export default function SeriesDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user, watchedEpisodes, markEpisodeWatched } = useStore();

  const [seriesData, setSeriesData] = useState<typeof series.$inferSelect | null>(null);
  const [seasonList, setSeasonList] = useState<SeasonDisplay[]>([]);
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [currentProgress, setCurrentProgress] = useState<SeriesCurrentProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [crossoverOnly, setCrossoverOnly] = useState(false);

  const userId = user?.id ?? 1;
  const seriesId = Number(id);

  const loadSeries = useCallback(async () => {
    try {
      const [s] = await db.select().from(series).where(eq(series.id, seriesId));
      if (!s) return;
      setSeriesData(s);

      // Check current episode progress point for this series
      const savedProgress = getSeriesCurrentEpisode(seriesId);
      if (savedProgress) {
        setCurrentProgress(savedProgress);
        setSelectedSeason(savedProgress.seasonNumber);
      }

      // Load seasons
      const dbSeasons = await db
        .select()
        .from(seasons)
        .where(eq(seasons.seriesId, seriesId))
        .orderBy(seasons.seasonNumber);

      // Load all episodes with user progress
      const dbEpisodes = await db.select().from(episodes).where(eq(episodes.seriesId, seriesId));
      const dbProgress = await db
        .select()
        .from(userProgress)
        .where(eq(userProgress.userId, userId));

      const progressMap = new Map(
        dbProgress.map((p) => [p.episodeId, p])
      );

      const seasonDisplays: SeasonDisplay[] = dbSeasons.map((season) => {
        const seasonEps = dbEpisodes
          .filter((ep) => ep.seasonNumber === season.seasonNumber)
          .sort((a, b) => a.episodeNumber - b.episodeNumber);

        const eps: EpisodeWithProgress[] = seasonEps.map((ep) => {
          const prog = progressMap.get(ep.id);
          const isWatched =
            prog?.watched ??
            isEpisodeWatchedLocal(ep.id) ??
            watchedEpisodes.has(ep.id);

          return {
            id: ep.id,
            seriesId: ep.seriesId,
            seriesName: s.name,
            tmdbId: ep.tmdbId,
            seasonNumber: ep.seasonNumber,
            episodeNumber: ep.episodeNumber,
            name: ep.name,
            overview: ep.overview,
            airDate: ep.airDate,
            runtime: ep.runtime,
            stillUrl: ep.stillUrl,
            youtubeClipId: ep.youtubeClipId,
            isCrossover: ep.isCrossover ?? false,
            crossoverName: ep.crossoverName,
            crossoverOrder: ep.crossoverOrder,
            crossoverSeries: (ep.crossoverSeries as { seriesName: string; seasonEp: string }[]) ?? [],
            deepseekFacts: ep.deepseekFacts,
            watched: isWatched,
            watchedAt: prog?.watchedAt ?? null,
            rating: prog?.rating ?? null,
          };
        });

        const watchedCount = eps.filter((e) => e.watched).length;
        return {
          seasonNumber: season.seasonNumber,
          name: season.name,
          posterUrl: season.posterUrl,
          episodes: eps,
          watchedCount,
          totalEpisodes: eps.length,
        };
      });

      setSeasonList(seasonDisplays);
    } catch (error) {
      console.error('[Series] Load failed:', error);
    } finally {
      setLoading(false);
    }
  }, [seriesId, userId, watchedEpisodes]);

  useEffect(() => {
    loadSeries();
  }, [loadSeries]);

  const handleToggleWatched = async (episode: EpisodeWithProgress) => {
    const newWatched = !episode.watched;
    markEpisodeWatched(episode.id, newWatched);
    markEpisodeWatchedLocal(episode.id, newWatched);

    try {
      const existing = await db
        .select()
        .from(userProgress)
        .where(
          and(
            eq(userProgress.userId, userId),
            eq(userProgress.episodeId, episode.id)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        await db
          .update(userProgress)
          .set({
            watched: newWatched,
            watchedAt: newWatched ? new Date() : null,
            updatedAt: new Date(),
          })
          .where(eq(userProgress.id, existing[0].id));
      } else {
        await db.insert(userProgress).values({
          userId,
          episodeId: episode.id,
          watched: newWatched,
          watchedAt: newWatched ? new Date() : null,
        });
      }

      // Update local state
      setSeasonList((prev) =>
        prev.map((s) => ({
          ...s,
          episodes: s.episodes.map((ep) =>
            ep.id === episode.id ? { ...ep, watched: newWatched } : ep
          ),
          watchedCount: s.episodes.filter((ep) =>
            ep.id === episode.id ? newWatched : ep.watched
          ).length,
        }))
      );
    } catch (error) {
      console.error('[Series] Toggle watched failed:', error);
      markEpisodeWatched(episode.id, episode.watched); // rollback
    }
  };

  const openTrailer = async () => {
    if (!seriesData?.youtubeTrailerId) return;
    const deepLink = getYouTubeDeepLink(seriesData.youtubeTrailerId);
    const webUrl = getYouTubeUrl(seriesData.youtubeTrailerId);
    const canOpen = await Linking.canOpenURL(deepLink);
    await Linking.openURL(canOpen ? deepLink : webUrl);
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#7c5af3" />
      </View>
    );
  }

  if (!seriesData) {
    return (
      <View style={styles.loader}>
        <Text style={{ color: '#64748b' }}>Series not found.</Text>
      </View>
    );
  }

  const currentSeason = seasonList.find((s) => s.seasonNumber === selectedSeason);
  const totalWatched = seasonList.reduce((acc, s) => acc + s.watchedCount, 0);
  const totalEpisodes = seasonList.reduce((acc, s) => acc + s.totalEpisodes, 0);
  const overallProgress = totalEpisodes > 0 ? Math.round((totalWatched / totalEpisodes) * 100) : 0;

  const displayEpisodes = crossoverOnly
    ? currentSeason?.episodes.filter((e) => e.isCrossover) ?? []
    : currentSeason?.episodes ?? [];

  const crossoverCount = currentSeason?.episodes.filter((e) => e.isCrossover).length ?? 0;

  const firstEp = seasonList[0]?.episodes[0];

  return (
    <View style={styles.outerContainer}>
      <WebHeader />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Banner */}
        <View style={styles.bannerContainer}>
          <Image
            source={{ uri: seriesData.bannerUrl ?? seriesData.posterUrl ?? '' }}
            style={styles.banner}
            contentFit="cover"
            transition={400}
          />
          <LinearGradient
            colors={['rgba(10,10,15,0.3)', 'rgba(10,10,15,0.6)', '#0a0a0f']}
            style={styles.bannerGradient}
          />
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </Pressable>
        </View>

        <View style={styles.content}>
          {/* Header */}
          <Text style={styles.seriesTitle}>{seriesData.name}</Text>
          <View style={styles.metaRow}>
            <Text style={styles.meta}>
              {seriesData.firstAirDate?.split('-')[0]} •{' '}
            </Text>
            <Text style={styles.meta}>
              {seriesData.numberOfSeasons} seasons •{' '}
            </Text>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor:
                    seriesData.status === 'Returning Series'
                      ? 'rgba(34,197,94,0.15)'
                      : 'rgba(100,116,139,0.15)',
                },
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  {
                    color:
                      seriesData.status === 'Returning Series'
                        ? '#22c55e'
                        : '#94a3b8',
                  },
                ]}
              >
                {seriesData.status ?? 'Unknown'}
              </Text>
            </View>
          </View>

          {/* Progress */}
          <View style={styles.progressSection}>
            <View style={styles.progressRow}>
              <Text style={styles.progressLabel}>
                {totalWatched} / {totalEpisodes} episodes
              </Text>
              <Text style={styles.progressPercent}>{overallProgress}%</Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${overallProgress}%` }]} />
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actionsRow}>
            {firstEp && (
              <Pressable
                style={styles.playFirstBtn}
                onPress={() => router.push(`/episode/${firstEp.id}`)}
              >
                <Ionicons name="play" size={16} color="#fff" />
                <Text style={styles.playFirstBtnText}>Reproducir Serie</Text>
              </Pressable>
            )}

            {seriesData.youtubeTrailerId && (
              <Pressable style={styles.trailerBtn} onPress={openTrailer}>
                <Ionicons name="logo-youtube" size={16} color="#fff" />
                <Text style={styles.trailerBtnText}>Trailer</Text>
              </Pressable>
            )}

            {crossoverCount > 0 && (
              <Pressable
                style={[styles.crossoverBtn, crossoverOnly && styles.crossoverBtnActive]}
                onPress={() => setCrossoverOnly((v) => !v)}
              >
                <Ionicons name="link" size={16} color={crossoverOnly ? '#fff' : '#f59e0b'} />
                <Text style={[styles.crossoverBtnText, crossoverOnly && { color: '#fff' }]}>
                  Crossovers ({crossoverCount})
                </Text>
              </Pressable>
            )}
          </View>

        {/* Overview */}
        {seriesData.overview && (
          <Text style={styles.overview} numberOfLines={4}>
            {seriesData.overview}
          </Text>
        )}

        {/* Continue Watching Banner if user has started this series */}
        {currentProgress && (
          <View style={styles.continueCard}>
            <View style={styles.continueCardLeft}>
              <View style={styles.continuePill}>
                <Ionicons name="play" size={11} color="#c084fc" />
                <Text style={styles.continuePillText}>CONTINUAR VIENDO</Text>
              </View>
              <Text style={styles.continueEpCode}>
                Temporada {currentProgress.seasonNumber} · Episodio {currentProgress.episodeNumber}
              </Text>
              <Text style={styles.continueEpTitle} numberOfLines={1}>
                {currentProgress.episodeName}
              </Text>
            </View>
            <Pressable
              style={styles.continueBtn}
              onPress={() => router.push(`/episode/${currentProgress.episodeId}`)}
            >
              <Ionicons name="play" size={15} color="#ffffff" />
              <Text style={styles.continueBtnText}>Reproducir</Text>
            </Pressable>
          </View>
        )}

        {/* Season Selector */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.seasonScroll}
          contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
        >
          {seasonList.map((s) => (
            <Pressable
              key={s.seasonNumber}
              style={[
                styles.seasonTab,
                selectedSeason === s.seasonNumber && styles.seasonTabActive,
              ]}
              onPress={() => setSelectedSeason(s.seasonNumber)}
            >
              <Text
                style={[
                  styles.seasonTabText,
                  selectedSeason === s.seasonNumber && styles.seasonTabTextActive,
                ]}
              >
                S{s.seasonNumber}
              </Text>
              {s.watchedCount === s.totalEpisodes && s.totalEpisodes > 0 && (
                <Ionicons name="checkmark-circle" size={12} color="#22c55e" />
              )}
            </Pressable>
          ))}
        </ScrollView>

        {/* Episode List */}
        <View style={styles.episodeList}>
          {displayEpisodes.map((ep) => (
            <View key={ep.id}>
              {ep.isCrossover && <CrossoverAlert episode={ep} />}
              <EpisodeCard
                episode={ep}
                isCurrent={currentProgress?.episodeId === ep.id}
                onToggleWatched={() => handleToggleWatched(ep)}
                onPress={() => router.push(`/episode/${ep.id}`)}
              />
            </View>
          ))}
        </View>

        <View style={{ height: 120 }} />
      </View>
    </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: { flex: 1, backgroundColor: '#0a0a0f' },
  container: { flex: 1, backgroundColor: '#0a0a0f' },
  loader: { flex: 1, backgroundColor: '#0a0a0f', justifyContent: 'center', alignItems: 'center' },
  bannerContainer: { height: Math.min(BANNER_HEIGHT, 420), position: 'relative', width: '100%', backgroundColor: '#12121a' },
  banner: { width: '100%', height: '100%' },
  bannerGradient: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  backBtn: {
    position: 'absolute',
    top: 36,
    left: 20,
    backgroundColor: 'rgba(10,10,15,0.75)',
    borderRadius: 20,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    cursor: 'pointer' as any,
    zIndex: 10,
  },
  content: {
    paddingHorizontal: 20,
    marginTop: -28,
    maxWidth: 1100,
    alignSelf: 'center',
    width: '100%',
    paddingBottom: 100,
  },
  seriesTitle: {
    color: '#f8fafc',
    fontFamily: 'Inter_900Black',
    fontSize: 26,
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' },
  meta: { color: '#94a3b8', fontFamily: 'Inter_400Regular', fontSize: 13 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  statusText: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  progressSection: { marginBottom: 16 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressLabel: { color: '#94a3b8', fontFamily: 'Inter_400Regular', fontSize: 13 },
  progressPercent: { color: '#7c5af3', fontFamily: 'Inter_700Bold', fontSize: 13 },
  progressBar: {
    height: 5,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#7c5af3',
    borderRadius: 3,
  },
  actionsRow: { flexDirection: 'row', gap: 10, marginBottom: 16, flexWrap: 'wrap' },
  playFirstBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#7c3aed',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 50,
    cursor: 'pointer' as any,
  },
  playFirstBtnText: { color: '#fff', fontFamily: 'Inter_700Bold', fontSize: 14 },
  trailerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ef4444',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 50,
  },
  trailerBtnText: { color: '#fff', fontFamily: 'Inter_700Bold', fontSize: 14 },
  crossoverBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(245,158,11,0.12)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.3)',
  },
  crossoverBtnActive: {
    backgroundColor: '#f59e0b',
    borderColor: '#f59e0b',
  },
  crossoverBtnText: { color: '#f59e0b', fontFamily: 'Inter_700Bold', fontSize: 14 },
  overview: {
    color: '#94a3b8',
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 16,
  },
  continueCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(124, 58, 237, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.35)',
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
    gap: 12,
  },
  continueCardLeft: {
    flex: 1,
    gap: 3,
  },
  continuePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 2,
  },
  continuePillText: {
    color: '#c084fc',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  continueEpCode: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  continueEpTitle: {
    color: '#cbd5e1',
    fontSize: 13,
    fontWeight: '500',
  },
  continueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#7c3aed',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 14,
    cursor: 'pointer' as any,
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 4,
  },
  continueBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  seasonScroll: { marginHorizontal: -20, marginBottom: 16 },
  seasonTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1e293b',
  },
  seasonTabActive: { backgroundColor: '#7c5af3' },
  seasonTabText: { color: '#64748b', fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  seasonTabTextActive: { color: '#fff' },
  episodeList: { gap: 0 },
});
