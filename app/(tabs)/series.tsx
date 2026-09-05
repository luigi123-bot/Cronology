import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ProgressBar } from 'react-native-paper';

import { useStore } from '@/store/useStore';
import type { SeriesWithProgress } from '@/types';
import WebHeader from '@/components/WebHeader';
import {
  getAllSeriesCurrentEpisodes,
  type SeriesCurrentProgress,
} from '@/services/watchProgress';

type SeriesFilter = 'all' | 'in_progress' | 'completed' | 'unstarted';

function SeriesCardItem({
  item,
  currentProgress,
  nativeWidth,
}: {
  item: SeriesWithProgress;
  currentProgress?: SeriesCurrentProgress;
  nativeWidth: any;
}) {
  const router = useRouter();

  const isCompleted = item.progressPercent === 100;
  const isInProgress = item.progressPercent > 0 || !!currentProgress;

  const statusColor = isCompleted
    ? '#22c55e'
    : isInProgress
    ? '#a855f7'
    : '#64748b';

  return (
    <Pressable
      style={({ hovered }: any) => [
        styles.card,
        Platform.OS !== 'web' && { width: nativeWidth },
        hovered && styles.cardHovered,
      ]}
      onPress={() => router.push(`/series/${item.id}`)}
    >
      <View style={styles.posterWrapper}>
        {item.posterUrl ? (
          <Image
            source={{ uri: item.posterUrl }}
            style={styles.poster as any}
            contentFit="cover"
            transition={300}
          />
        ) : (
          <View style={[styles.poster, styles.posterPlaceholder]}>
            <Ionicons name="tv-outline" size={36} color="#475569" />
          </View>
        )}

        {/* Current Episode Pill */}
        {currentProgress && !isCompleted && (
          <View style={styles.currentEpisodeBadge}>
            <Ionicons name="location" size={10} color="#ffffff" />
            <Text style={styles.currentEpisodeBadgeText}>
              T{currentProgress.seasonNumber}:E{currentProgress.episodeNumber}
            </Text>
          </View>
        )}

        {isCompleted && (
          <View style={styles.completedBadge}>
            <Ionicons name="checkmark-circle" size={11} color="#ffffff" />
            <Text style={styles.completedBadgeText}>Completada</Text>
          </View>
        )}

        {item.isChicagoUniverse && (
          <View style={styles.chicagoBadge}>
            <Ionicons name="flame" size={11} color="#f97316" />
            <Text style={styles.chicagoBadgeText}>Chicago</Text>
          </View>
        )}

        <LinearGradient
          colors={['transparent', 'rgba(10,10,15,0.7)', 'rgba(10,10,15,0.98)']}
          style={styles.gradient}
        >
          <Text style={styles.seriesName} numberOfLines={1}>
            {item.name}
          </Text>

          <View style={styles.metaRow}>
            <Text style={styles.metaText}>
              {item.numberOfSeasons}T · {item.totalCount || item.numberOfEpisodes} eps
            </Text>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          </View>

          {/* Current episode subtitle hint */}
          {currentProgress && !isCompleted ? (
            <Text style={styles.currentEpHint} numberOfLines={1}>
              Vas por: {currentProgress.episodeName}
            </Text>
          ) : null}

          <View style={styles.progressContainer}>
            <ProgressBar
              progress={Math.max(item.progressPercent / 100, 0.02)}
              color={statusColor}
              style={styles.progressBar}
            />
          </View>

          <Text style={[styles.progressLabel, { color: statusColor }]}>
            {isCompleted
              ? '✓ 100% Completado'
              : isInProgress
              ? `${item.progressPercent}% visto (${item.watchedCount}/${item.totalCount} eps)`
              : 'Sin empezar'}
          </Text>
        </LinearGradient>
      </View>
    </Pressable>
  );
}

export default function SeriesScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { seriesList } = useStore();

  const [activeFilter, setActiveFilter] = useState<SeriesFilter>('all');

  const isDesktop = width >= 1024;

  const currentProgressMap = useMemo(() => {
    return getAllSeriesCurrentEpisodes();
  }, [seriesList]);

  const totalWatched = seriesList.reduce((acc, s) => acc + s.watchedCount, 0);
  const totalEpisodes = seriesList.reduce((acc, s) => acc + (s.totalCount || s.numberOfEpisodes), 0);
  const overallProgress = totalEpisodes > 0 ? Math.round((totalWatched / totalEpisodes) * 100) : 0;

  const inProgressCount = seriesList.filter(
    (s) => (s.progressPercent > 0 && s.progressPercent < 100) || !!currentProgressMap[s.id]
  ).length;

  const completedCount = seriesList.filter((s) => s.progressPercent === 100).length;

  // Native responsive card width
  const nativeCardWidth = useMemo(() => {
    if (width >= 1200) return '18.4%';
    if (width >= 800) return '23%';
    if (width >= 560) return '31%';
    return '47.6%';
  }, [width]);

  const filteredSeries = useMemo(() => {
    if (activeFilter === 'in_progress') {
      return seriesList.filter(
        (s) => (s.progressPercent > 0 && s.progressPercent < 100) || !!currentProgressMap[s.id]
      );
    }
    if (activeFilter === 'completed') {
      return seriesList.filter((s) => s.progressPercent === 100);
    }
    if (activeFilter === 'unstarted') {
      return seriesList.filter(
        (s) => s.progressPercent === 0 && !currentProgressMap[s.id]
      );
    }
    return seriesList;
  }, [seriesList, activeFilter, currentProgressMap]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <WebHeader />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={[styles.mainWrapper, isDesktop && styles.desktopWrapper]}>
          
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Mis Series</Text>
              <Text style={styles.subtitle}>
                Seguimiento automático de tu progreso, capítulos vistos y punto de continuación.
              </Text>
            </View>
            <Pressable
              style={({ hovered }: any) => [
                styles.addBtn,
                hovered && styles.btnHovered,
              ]}
              onPress={() => router.push('/search')}
            >
              <Ionicons name="search" size={18} color="#ffffff" />
              {isDesktop && <Text style={styles.addBtnText}>Explorar Catálogo</Text>}
            </Pressable>
          </View>

          {/* Stats Dashboard Bar */}
          {seriesList.length > 0 && (
            <View style={styles.statsContainer}>
              <View style={styles.statCard}>
                <Ionicons name="tv" size={20} color="#a855f7" />
                <View>
                  <Text style={styles.statNumber}>{seriesList.length}</Text>
                  <Text style={styles.statLabel}>Series Disponibles</Text>
                </View>
              </View>

              <View style={styles.statCard}>
                <Ionicons name="play-circle" size={20} color="#c084fc" />
                <View>
                  <Text style={styles.statNumber}>{inProgressCount}</Text>
                  <Text style={styles.statLabel}>En Curso</Text>
                </View>
              </View>

              <View style={styles.statCard}>
                <Ionicons name="checkmark-done-circle" size={20} color="#22c55e" />
                <View>
                  <Text style={styles.statNumber}>{totalWatched}</Text>
                  <Text style={styles.statLabel}>Capítulos Vistos</Text>
                </View>
              </View>

              <View style={styles.statCard}>
                <Ionicons name="pie-chart-outline" size={20} color="#f59e0b" />
                <View>
                  <Text style={styles.statNumber}>{overallProgress}%</Text>
                  <Text style={styles.statLabel}>Progreso Total</Text>
                </View>
              </View>
            </View>
          )}

          {/* Filter Pills */}
          <View style={styles.filterPillsRow}>
            <Pressable
              style={[
                styles.filterPill,
                activeFilter === 'all' && styles.filterPillActive,
              ]}
              onPress={() => setActiveFilter('all')}
            >
              <Text
                style={[
                  styles.filterPillText,
                  activeFilter === 'all' && styles.filterPillTextActive,
                ]}
              >
                Todas ({seriesList.length})
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.filterPill,
                activeFilter === 'in_progress' && styles.filterPillActive,
              ]}
              onPress={() => setActiveFilter('in_progress')}
            >
              <Ionicons
                name="play"
                size={12}
                color={activeFilter === 'in_progress' ? '#fff' : '#c084fc'}
              />
              <Text
                style={[
                  styles.filterPillText,
                  activeFilter === 'in_progress' && styles.filterPillTextActive,
                ]}
              >
                En Progreso ({inProgressCount})
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.filterPill,
                activeFilter === 'completed' && styles.filterPillActive,
              ]}
              onPress={() => setActiveFilter('completed')}
            >
              <Ionicons
                name="checkmark"
                size={12}
                color={activeFilter === 'completed' ? '#fff' : '#22c55e'}
              />
              <Text
                style={[
                  styles.filterPillText,
                  activeFilter === 'completed' && styles.filterPillTextActive,
                ]}
              >
                Completadas ({completedCount})
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.filterPill,
                activeFilter === 'unstarted' && styles.filterPillActive,
              ]}
              onPress={() => setActiveFilter('unstarted')}
            >
              <Text
                style={[
                  styles.filterPillText,
                  activeFilter === 'unstarted' && styles.filterPillTextActive,
                ]}
              >
                Sin Empezar
              </Text>
            </Pressable>
          </View>

          {/* Series Grid */}
          <View style={styles.grid as any}>
            {filteredSeries.map((item) => (
              <SeriesCardItem
                key={item.id}
                item={item}
                currentProgress={currentProgressMap[item.id]}
                nativeWidth={nativeCardWidth}
              />
            ))}
          </View>

          {filteredSeries.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="film-outline" size={48} color="#475569" />
              <Text style={styles.emptyTitle}>No hay series en esta categoría</Text>
              <Text style={styles.emptySubtitle}>
                Selecciona otra pestaña o explora el catálogo para comenzar una nueva serie.
              </Text>
              <Pressable
                style={styles.emptyBtn}
                onPress={() => setActiveFilter('all')}
              >
                <Text style={styles.emptyBtnText}>Ver Todas las Series</Text>
              </Pressable>
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
  scrollContent: {
    paddingBottom: 130,
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#f8fafc',
    letterSpacing: -0.5,
  },
  subtitle: {
    color: '#94a3b8',
    fontSize: 13,
    marginTop: 4,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#7c3aed',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 20,
    cursor: 'pointer' as any,
  },
  btnHovered: {
    backgroundColor: '#9333ea',
    shadowColor: '#9333ea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 4,
  },
  addBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    minWidth: 140,
    backgroundColor: '#12121f',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: '#f8fafc',
  },
  statLabel: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
  },
  filterPillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
    cursor: 'pointer' as any,
  },
  filterPillActive: {
    backgroundColor: '#7c3aed',
    borderColor: '#a855f7',
  },
  filterPillText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
  },
  filterPillTextActive: {
    color: '#ffffff',
    fontWeight: '800',
  },
  grid: {
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
  },
  card: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#13131f',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    cursor: 'pointer' as any,
  },
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
  poster: {
    width: '100%',
    height: '100%',
  },
  posterPlaceholder: {
    backgroundColor: '#1a1b2e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  currentEpisodeBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#7c3aed',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#a855f7',
    zIndex: 10,
  },
  currentEpisodeBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
  },
  completedBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(34, 197, 94, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#4ade80',
    zIndex: 10,
  },
  completedBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
  },
  chicagoBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(10, 10, 15, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(249, 115, 22, 0.4)',
    zIndex: 10,
  },
  chicagoBadgeText: {
    color: '#fdba74',
    fontSize: 10,
    fontWeight: '700',
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    justifyContent: 'flex-end',
    zIndex: 2,
  },
  seriesName: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 2,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  metaText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '600',
  },
  currentEpHint: {
    color: '#d8b4fe',
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  progressContainer: {
    marginBottom: 6,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  progressLabel: {
    fontSize: 10,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    gap: 12,
  },
  emptyTitle: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '700',
  },
  emptySubtitle: {
    color: '#64748b',
    fontSize: 13,
    textAlign: 'center',
    maxWidth: 360,
  },
  emptyBtn: {
    marginTop: 8,
    backgroundColor: '#7c3aed',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 14,
  },
  emptyBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },
});
