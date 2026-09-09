import React, { useEffect, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  useWindowDimensions,
  Pressable,
  RefreshControl,
  SafeAreaView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Text, ActivityIndicator, useTheme } from 'react-native-paper';

import { useSeasonStore, GRIMM_TMDB_ID, GRIMM_DEFAULT_SEASON } from '@/store/useSeasonStore';
import SeasonVideoPlayer from '@/components/SeasonVideoPlayer';
import EpisodePaperCard from '@/components/EpisodePaperCard';
import type { TMDBEpisode } from '@/services/tmdb';

export default function SeasonDetailScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;
  const isMobile = width < 600;

  // Parámetros dinámicos de la ruta: /serie/[id]/temporada/[season]
  const { id, season } = useLocalSearchParams<{ id?: string; season?: string }>();

  // Resolver ID de TMDB (si pasan 'grimm' usamos el ID oficial 39351)
  const seriesId = useMemo(() => {
    if (!id || id.toLowerCase() === 'grimm') return GRIMM_TMDB_ID;
    const parsed = parseInt(id, 10);
    return isNaN(parsed) ? GRIMM_TMDB_ID : parsed;
  }, [id]);

  const seasonNumber = useMemo(() => {
    if (!season) return GRIMM_DEFAULT_SEASON;
    const parsed = parseInt(season, 10);
    return isNaN(parsed) ? GRIMM_DEFAULT_SEASON : parsed;
  }, [season]);

  const {
    episodes,
    seasonDetails,
    selectedEpisode,
    isLoading,
    error,
    isPlaying,
    fetchSeasonEpisodes,
    selectEpisode,
  } = useSeasonStore();

  // Cargar episodios de TMDB al montar la vista o cambiar parámetros
  useEffect(() => {
    fetchSeasonEpisodes(seriesId, seasonNumber);
  }, [seriesId, seasonNumber, fetchSeasonEpisodes]);

  const handleRefresh = useCallback(() => {
    fetchSeasonEpisodes(seriesId, seasonNumber);
  }, [seriesId, seasonNumber, fetchSeasonEpisodes]);

  const handleSelectEpisode = useCallback(
    (ep: TMDBEpisode) => {
      selectEpisode(ep);
    },
    [selectEpisode]
  );

  const seriesTitle = useMemo(() => {
    if (seriesId === GRIMM_TMDB_ID) return 'Grimm';
    return seasonDetails?.name || 'Serie';
  }, [seriesId, seasonDetails]);

  // Cabecera superior del FlatList: Reproductor y resumen de temporada
  const renderHeader = useMemo(() => {
    return (
      <View style={styles.headerContainer}>
        {/* Reproductor de Video de Expo en la parte superior */}
        <SeasonVideoPlayer
          seriesTitle={seriesTitle}
          seasonNumber={seasonNumber}
          backdropPath={seasonDetails?.poster_path}
        />

        {/* Barra de Título de la Temporada y Conteo de Episodios */}
        <View style={styles.seasonInfoRow}>
          <View style={styles.seasonTitleWrap}>
            <Text variant="headlineSmall" style={styles.seasonTitle}>
              {seasonDetails?.name || `Temporada ${seasonNumber}`}
            </Text>
            <Text variant="labelMedium" style={styles.seasonMetaText}>
              {episodes.length} episodios disponibles • Full HD 1080p
            </Text>
          </View>

          <View style={styles.vpsLivePill}>
            <Ionicons name="sparkles" size={13} color="#4ade80" />
            <Text style={styles.vpsLiveText}>Alta Definición</Text>
          </View>
        </View>

        {seasonDetails?.overview ? (
          <Text variant="bodyMedium" style={styles.seasonOverview}>
            {seasonDetails.overview}
          </Text>
        ) : null}

        <View style={styles.divider} />

        <View style={styles.episodesHeader}>
          <Ionicons name="list" size={18} color="#c084fc" />
          <Text variant="titleMedium" style={styles.episodesSectionTitle}>
            Lista de Capítulos
          </Text>
        </View>
      </View>
    );
  }, [seriesTitle, seasonNumber, seasonDetails, episodes.length]);

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Fondo Premium con Gradientes sutiles oscuros */}
      <LinearGradient
        colors={['#0a0a12', '#120f26', '#08080f']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Barra de navegación superior */}
      <View style={[styles.navBar, isMobile && styles.navBarMobile]}>
        <Pressable
          style={({ pressed }) => [styles.backBtn, pressed && styles.backBtnPressed]}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Volver atrás"
        >
          <Ionicons name="chevron-back" size={22} color="#f1f5f9" />
          <Text style={styles.backBtnText}>Volver</Text>
        </Pressable>

        <View style={styles.navCenter}>
          <Text variant="titleMedium" style={styles.navTitle} numberOfLines={1}>
            {seriesTitle}
          </Text>
          <Text variant="labelSmall" style={styles.navSubtitle}>
            Temporada {seasonNumber}
          </Text>
        </View>

        <Pressable
          style={styles.refreshBtn}
          onPress={handleRefresh}
          accessibilityLabel="Recargar episodios"
        >
          <Ionicons name="refresh" size={18} color="#cbd5e1" />
        </Pressable>
      </View>

      {/* Contenido Principal */}
      <View style={[styles.mainContent, isDesktop && styles.mainContentDesktop]}>
        {isLoading && episodes.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary || '#7c5af3'} />
            <Text style={styles.loadingText}>Obteniendo episodios de TMDB...</Text>
          </View>
        ) : error && episodes.length === 0 ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={54} color="#f87171" />
            <Text style={styles.errorTitle}>Error al cargar temporada</Text>
            <Text style={styles.errorMessage}>{error}</Text>
            <Pressable style={styles.retryButton} onPress={handleRefresh}>
              <Ionicons name="reload" size={16} color="#ffffff" />
              <Text style={styles.retryButtonText}>Reintentar</Text>
            </Pressable>
          </View>
        ) : (
          <FlatList
            data={episodes}
            keyExtractor={(item) => `tmdb-ep-${item.id}-${item.episode_number}`}
            ListHeaderComponent={renderHeader}
            renderItem={({ item }) => (
              <EpisodePaperCard
                episode={item}
                isSelected={selectedEpisode?.id === item.id}
                isPlaying={selectedEpisode?.id === item.id && isPlaying}
                onPress={() => handleSelectEpisode(item)}
              />
            )}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isLoading}
                onRefresh={handleRefresh}
                tintColor="#7c5af3"
                colors={['#7c5af3']}
              />
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0a0a12',
    paddingTop: Platform.OS === 'android' ? 24 : 0,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
    backgroundColor: 'rgba(10, 10, 18, 0.85)',
    zIndex: 10,
  },
  navBarMobile: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  backBtnPressed: {
    opacity: 0.7,
  },
  backBtnText: {
    color: '#f1f5f9',
    fontSize: 13,
    fontWeight: '600',
  },
  navCenter: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 10,
  },
  navTitle: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 16,
  },
  navSubtitle: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '600',
  },
  refreshBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainContent: {
    flex: 1,
    width: '100%',
    alignSelf: 'center',
  },
  mainContentDesktop: {
    maxWidth: 1040,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  headerContainer: {
    paddingTop: 12,
    paddingBottom: 8,
  },
  seasonInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 8,
    flexWrap: 'wrap',
    gap: 8,
  },
  seasonTitleWrap: {
    flex: 1,
  },
  seasonTitle: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 22,
    letterSpacing: -0.4,
  },
  seasonMetaText: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 2,
  },
  vpsLivePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(74, 222, 128, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(74, 222, 128, 0.3)',
  },
  vpsLiveText: {
    color: '#4ade80',
    fontSize: 11,
    fontWeight: '700',
  },
  seasonOverview: {
    color: '#cbd5e1',
    lineHeight: 20,
    fontSize: 13,
    marginBottom: 14,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    marginVertical: 12,
  },
  episodesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  episodesSectionTitle: {
    color: '#f8fafc',
    fontWeight: '800',
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 14,
    minHeight: 350,
  },
  loadingText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
    gap: 12,
    minHeight: 350,
  },
  errorTitle: {
    color: '#f87171',
    fontSize: 18,
    fontWeight: '800',
  },
  errorMessage: {
    color: '#94a3b8',
    fontSize: 13,
    textAlign: 'center',
    maxWidth: 380,
    lineHeight: 18,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#7c5af3',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 6,
  },
  retryButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },
});
