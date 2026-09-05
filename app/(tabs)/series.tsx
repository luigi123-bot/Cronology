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
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ProgressBar } from 'react-native-paper';

import { useStore } from '@/store/useStore';
import type { SeriesWithProgress } from '@/types';
import WebHeader from '@/components/WebHeader';

function SeriesCardItem({ item, isDesktop }: { item: SeriesWithProgress; isDesktop: boolean }) {
  const router = useRouter();

  const statusColor =
    item.progressPercent === 100
      ? '#22c55e'
      : item.progressPercent > 0
      ? '#a855f7'
      : '#64748b';

  return (
    <Pressable
      style={({ hovered }: any) => [
        styles.card,
        isDesktop && styles.cardDesktop,
        hovered && styles.cardHovered,
      ]}
      onPress={() => router.push(`/series/${item.id}`)}
    >
      <View style={styles.posterWrapper}>
        {item.posterUrl ? (
          <Image
            source={{ uri: item.posterUrl }}
            style={styles.poster}
            contentFit="cover"
            transition={300}
          />
        ) : (
          <View style={[styles.poster, styles.posterPlaceholder]}>
            <Ionicons name="tv-outline" size={36} color="#475569" />
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

          <View style={styles.progressContainer}>
            <ProgressBar
              progress={Math.max(item.progressPercent / 100, 0.02)}
              color={statusColor}
              style={styles.progressBar}
            />
          </View>

          <Text style={[styles.progressLabel, { color: statusColor }]}>
            {item.progressPercent === 100
              ? '✓ Completado'
              : item.progressPercent > 0
              ? `${item.progressPercent}% visto`
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

  const isDesktop = width >= 768;

  const totalWatched = seriesList.reduce((acc, s) => acc + s.watchedCount, 0);
  const totalEpisodes = seriesList.reduce((acc, s) => acc + (s.totalCount || s.numberOfEpisodes), 0);
  const overallProgress = totalEpisodes > 0 ? Math.round((totalWatched / totalEpisodes) * 100) : 0;

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
                Colección personal y seguimiento de episodios
              </Text>
            </View>
            <Pressable
              style={({ hovered }: any) => [
                styles.addBtn,
                hovered && styles.btnHovered,
              ]}
              onPress={() => router.push('/search')}
            >
              <Ionicons name="add" size={20} color="#ffffff" />
              {isDesktop && <Text style={styles.addBtnText}>Agregar Serie</Text>}
            </Pressable>
          </View>

          {/* Stats Dashboard Bar */}
          {seriesList.length > 0 && (
            <View style={styles.statsContainer}>
              <View style={styles.statCard}>
                <Ionicons name="tv" size={20} color="#a855f7" />
                <View>
                  <Text style={styles.statNumber}>{seriesList.length}</Text>
                  <Text style={styles.statLabel}>Series</Text>
                </View>
              </View>

              <View style={styles.statCard}>
                <Ionicons name="checkmark-done-circle" size={20} color="#22c55e" />
                <View>
                  <Text style={styles.statNumber}>{totalWatched}</Text>
                  <Text style={styles.statLabel}>Vistos</Text>
                </View>
              </View>

              <View style={styles.statCard}>
                <Ionicons name="film-outline" size={20} color="#38bdf8" />
                <View>
                  <Text style={styles.statNumber}>{totalEpisodes}</Text>
                  <Text style={styles.statLabel}>Episodios Totales</Text>
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

          {/* Series Grid */}
          <View style={styles.grid}>
            {seriesList.map((item) => (
              <SeriesCardItem key={item.id} item={item} isDesktop={isDesktop} />
            ))}
          </View>

          {seriesList.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="film-outline" size={48} color="#475569" />
              <Text style={styles.emptyTitle}>No tienes series agregadas</Text>
              <Text style={styles.emptySubtitle}>
                Busca en el catálogo y añade tus series favoritas
              </Text>
              <Pressable
                style={styles.emptyBtn}
                onPress={() => router.push('/search')}
              >
                <Text style={styles.emptyBtnText}>Explorar Catálogo</Text>
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
    backgroundColor: '#0a0a0f',
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
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#f8fafc',
    letterSpacing: -0.5,
  },
  subtitle: {
    color: '#94a3b8',
    fontSize: 13,
    marginTop: 2,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#7c3aed',
    paddingVertical: 10,
    paddingHorizontal: 16,
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
    marginBottom: 28,
  },
  statCard: {
    flex: 1,
    minWidth: 140,
    backgroundColor: '#161622',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
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
    fontWeight: '500',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  card: {
    width: '47%',
    minWidth: 150,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#161622',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    cursor: 'pointer' as any,
  },
  cardDesktop: {
    width: '18.5%', // 5 columns on desktop!
    minWidth: 180,
  },
  cardHovered: {
    transform: [{ translateY: -4 }] as any,
    borderColor: 'rgba(168,85,247,0.5)',
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.45,
    shadowRadius: 18,
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
  chicagoBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(10,10,15,0.85)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(249,115,22,0.4)',
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
  },
  seriesName: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  metaText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '500',
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
    backgroundColor: 'rgba(255,255,255,0.1)',
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
