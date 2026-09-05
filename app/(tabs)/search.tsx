import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  Pressable,
  ActivityIndicator,
  Alert,
  Keyboard,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';

import {
  searchSeries,
  getFullSeriesData,
  getPosterUrl,
  getBannerUrl,
  getStillUrl,
  extractTrailerId,
  type TMDBSearchResult,
} from '@/services/tmdb';
import { searchTrailer } from '@/services/youtube';
import { db } from '@/db';
import { series as seriesTable, seasons as seasonsTable, episodes as episodesTable } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { useStore } from '@/store/useStore';
import { CROSSOVER_EPISODE_MAP, getCrossoverKey, CHICAGO_SERIES } from '@/constants/chicago';
import WebHeader from '@/components/WebHeader';

const { width } = Dimensions.get('window');

export default function SearchScreen() {
  const params = useLocalSearchParams<{ prefill?: string }>();
  const { addSeries } = useStore();

  const [query, setQuery] = useState(params.prefill ?? '');
  const [results, setResults] = useState<TMDBSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState<number | null>(null);

  const handleSearch = useCallback(async (text: string) => {
    if (text.trim().length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await searchSeries(text.trim());
      setResults(res.slice(0, 20));
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => handleSearch(query), 500);
    return () => clearTimeout(timer);
  }, [query, handleSearch]);

  // If prefill param, trigger search
  useEffect(() => {
    if (params.prefill) {
      setQuery(params.prefill);
    }
  }, [params.prefill]);

  const importSeries = async (tmdbId: number, seriesName: string) => {
    setImporting(tmdbId);
    Keyboard.dismiss();

    try {
      // Check if already imported
      const existing = await db
        .select()
        .from(seriesTable)
        .where(eq(seriesTable.tmdbId, tmdbId))
        .limit(1);

      if (existing.length > 0) {
        Alert.alert('Already Added', `"${seriesName}" is already in your list.`);
        return;
      }

      // Check if it's a Chicago series
      const isChicago = CHICAGO_SERIES.some(
        (s) => s.tmdbId === tmdbId || s.name.toLowerCase() === seriesName.toLowerCase()
      );
      const chicagoInfo = CHICAGO_SERIES.find((s) => s.tmdbId === tmdbId);

      // Fetch full data from TMDB
      const { series: tmdbSeries, seasons: tmdbSeasons } = await getFullSeriesData(tmdbId);

      const tmdbTrailerId = tmdbSeries.videos?.results
        ? extractTrailerId(tmdbSeries.videos.results)
        : null;

      // Try YouTube if TMDB trailer not available
      let youtubeTrailerId = tmdbTrailerId;
      if (!youtubeTrailerId) {
        const ytVideo = await searchTrailer(seriesName);
        youtubeTrailerId = ytVideo?.id ?? null;
      }

      // Insert series
      const [insertedSeries] = await db
        .insert(seriesTable)
        .values({
          tmdbId: tmdbSeries.id,
          name: tmdbSeries.name,
          originalName: tmdbSeries.original_name,
          overview: tmdbSeries.overview,
          posterUrl: getPosterUrl(tmdbSeries.poster_path),
          bannerUrl: getBannerUrl(tmdbSeries.backdrop_path),
          genres: tmdbSeries.genres,
          firstAirDate: tmdbSeries.first_air_date,
          lastAirDate: tmdbSeries.last_air_date,
          status: tmdbSeries.status,
          numberOfSeasons: tmdbSeries.number_of_seasons,
          numberOfEpisodes: tmdbSeries.number_of_episodes,
          youtubeTrailerId,
          voteAverage: String(tmdbSeries.vote_average),
          isChicagoUniverse: isChicago,
          sortOrder: chicagoInfo?.sortOrder ?? 999,
        })
        .returning();

      // Insert seasons + episodes
      let totalEps = 0;
      for (const tmdbSeason of tmdbSeasons) {
        if (tmdbSeason.season_number === 0) continue;

        const [insertedSeason] = await db
          .insert(seasonsTable)
          .values({
            seriesId: insertedSeries.id,
            tmdbId: tmdbSeason.id,
            seasonNumber: tmdbSeason.season_number,
            name: tmdbSeason.name,
            overview: tmdbSeason.overview,
            posterUrl: getPosterUrl(tmdbSeason.poster_path),
            airDate: tmdbSeason.air_date,
            episodeCount: tmdbSeason.episode_count,
          })
          .returning();

        const eps = tmdbSeason.episodes ?? [];
        if (eps.length > 0) {
          const epValues = eps.map((ep) => {
            const crossoverKey = getCrossoverKey(
              seriesName,
              ep.season_number,
              ep.episode_number
            );
            const crossoverInfo = CROSSOVER_EPISODE_MAP.get(crossoverKey);
            return {
              seriesId: insertedSeries.id,
              seasonId: insertedSeason.id,
              tmdbId: ep.id,
              seasonNumber: ep.season_number,
              episodeNumber: ep.episode_number,
              name: ep.name,
              overview: ep.overview,
              airDate: ep.air_date,
              runtime: ep.runtime,
              stillUrl: getStillUrl(ep.still_path),
              voteAverage: String(ep.vote_average),
              isCrossover: !!crossoverInfo,
              crossoverName: crossoverInfo?.arcName ?? null,
              crossoverOrder: crossoverInfo?.order ?? null,
              crossoverSeries: crossoverInfo
                ? crossoverInfo.arcEpisodes.map((e) => ({
                    seriesName: e.series,
                    seasonEp: `S${String(e.season).padStart(2, '0')}E${String(e.episode).padStart(2, '0')}`,
                  }))
                : [],
            };
          });

          for (let i = 0; i < epValues.length; i += 50) {
            await db
              .insert(episodesTable)
              .values(epValues.slice(i, i + 50))
              .onConflictDoNothing();
          }
          totalEps += eps.length;
        }
      }

      addSeries({
        id: insertedSeries.id,
        tmdbId: insertedSeries.tmdbId,
        name: insertedSeries.name,
        posterUrl: insertedSeries.posterUrl,
        bannerUrl: insertedSeries.bannerUrl,
        genres: (insertedSeries.genres as { id: number; name: string }[]) ?? [],
        status: insertedSeries.status,
        numberOfSeasons: insertedSeries.numberOfSeasons ?? 0,
        numberOfEpisodes: totalEps,
        watchedCount: 0,
        totalCount: totalEps,
        progressPercent: 0,
        youtubeTrailerId: insertedSeries.youtubeTrailerId,
        isChicagoUniverse: insertedSeries.isChicagoUniverse ?? false,
        sortOrder: insertedSeries.sortOrder ?? 999,
      });

      Alert.alert(
        '✅ Added!',
        `"${seriesName}" has been added with ${totalEps} episodes.`
      );
    } catch (error) {
      console.error('[Search] Import failed:', error);
      Alert.alert('Error', `Failed to import "${seriesName}". Please try again.`);
    } finally {
      setImporting(null);
    }
  };

  const { width } = Dimensions.get('window');
  const isDesktop = width >= 768;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <WebHeader />
      <View style={[styles.mainWrapper, isDesktop && styles.desktopWrapper]}>
        <Text style={styles.title}>Buscar Series</Text>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color="#64748b" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search for a series..."
          placeholderTextColor="#475569"
          value={query}
          onChangeText={setQuery}
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
        />
        {query.length > 0 && (
          <Pressable onPress={() => { setQuery(''); setResults([]); }}>
            <Ionicons name="close-circle" size={18} color="#475569" />
          </Pressable>
        )}
      </View>

      {loading && (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color="#7c5af3" />
          <Text style={styles.loadingText}>Searching TMDB...</Text>
        </View>
      )}

      <FlatList
        data={results}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <Pressable
            style={styles.resultCard}
            onPress={() => importSeries(item.id, item.name)}
            disabled={importing === item.id}
          >
            <View style={styles.posterContainer}>
              {item.poster_path ? (
                <Image
                  source={{ uri: `https://image.tmdb.org/t/p/w185${item.poster_path}` }}
                  style={styles.resultPoster}
                  contentFit="cover"
                  transition={300}
                />
              ) : (
                <View style={[styles.resultPoster, styles.noPoster]}>
                  <Ionicons name="tv-outline" size={28} color="#334155" />
                </View>
              )}
            </View>
            <View style={styles.resultInfo}>
              <Text style={styles.resultName} numberOfLines={2}>
                {item.name}
              </Text>
              <Text style={styles.resultYear}>
                {item.first_air_date?.split('-')[0] ?? 'Unknown'}
              </Text>
              {item.overview ? (
                <Text style={styles.resultOverview} numberOfLines={2}>
                  {item.overview}
                </Text>
              ) : null}
              <View style={styles.resultFooter}>
                <View style={styles.ratingPill}>
                  <Ionicons name="star" size={11} color="#f59e0b" />
                  <Text style={styles.ratingText}>
                    {item.vote_average?.toFixed(1) ?? '--'}
                  </Text>
                </View>
                {importing === item.id ? (
                  <View style={styles.importingBtn}>
                    <ActivityIndicator size="small" color="#fff" />
                    <Text style={styles.addBtnText}>Importing...</Text>
                  </View>
                ) : (
                  <Pressable
                    style={styles.addBtn}
                    onPress={() => importSeries(item.id, item.name)}
                  >
                    <Ionicons name="add" size={14} color="#fff" />
                    <Text style={styles.addBtnText}>Add</Text>
                  </Pressable>
                )}
              </View>
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
          query.length >= 2 && !loading ? (
            <View style={styles.noResults}>
              <Ionicons name="search-outline" size={48} color="#334155" />
              <Text style={styles.noResultsText}>No results for "{query}"</Text>
            </View>
          ) : query.length < 2 && query.length > 0 ? (
            <Text style={styles.hint}>Type at least 2 characters to search</Text>
          ) : (
            <View style={styles.hintContainer}>
              <Ionicons name="sparkles" size={32} color="#7c5af3" />
              <Text style={styles.hintTitle}>Search any series</Text>
              <Text style={styles.hintText}>
                Episodes, trailers, crossovers and AI facts will be imported automatically
              </Text>
            </View>
          )
        }
      />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f' },
  mainWrapper: {
    flex: 1,
    width: '100%',
  },
  desktopWrapper: {
    maxWidth: 960,
    alignSelf: 'center',
    width: '100%',
  },
  title: {
    color: '#f8fafc',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.5,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161622',
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(168,85,247,0.3)',
  },
  searchIcon: {},
  searchInput: {
    flex: 1,
    color: '#f8fafc',
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    padding: 0,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 8,
  },
  loadingText: {
    color: '#64748b',
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
  },
  listContent: { paddingHorizontal: 20, paddingBottom: 100 },
  resultCard: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    borderRadius: 14,
    marginBottom: 12,
    overflow: 'hidden',
  },
  posterContainer: { width: 90 },
  resultPoster: { width: 90, height: 130 },
  noPoster: {
    height: 130,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f172a',
  },
  resultInfo: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  resultName: {
    color: '#f8fafc',
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
    lineHeight: 20,
  },
  resultYear: {
    color: '#64748b',
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    marginTop: 2,
  },
  resultOverview: {
    color: '#94a3b8',
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
  },
  resultFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(245,158,11,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  ratingText: {
    color: '#f59e0b',
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#7c5af3',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  importingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#475569',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  addBtnText: {
    color: '#fff',
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
  },
  noResults: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  noResultsText: {
    color: '#64748b',
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
  },
  hint: {
    color: '#475569',
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    textAlign: 'center',
    paddingTop: 20,
  },
  hintContainer: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 40,
    gap: 12,
  },
  hintTitle: {
    color: '#e2e8f0',
    fontFamily: 'Inter_700Bold',
    fontSize: 20,
  },
  hintText: {
    color: '#64748b',
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
