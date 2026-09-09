import React, { useEffect, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  ScrollView,
  Pressable,
  useWindowDimensions,
  SafeAreaView,
  Platform,
  RefreshControl,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import {
  Card,
  Text,
  Badge,
  ActivityIndicator,
  useTheme,
  Button,
  Chip,
} from 'react-native-paper';

import { useMediaStore, type MediaType } from '@/store/useMediaStore';
import DynamicMediaVideoPlayer from '@/components/DynamicMediaVideoPlayer';
import { getStillUrl, type TMDBEpisode } from '@/services/tmdb';

export default function MediaDetailScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const isMobile = width < 650;
  const isDesktop = width >= 950;

  // Parámetros de ruta dinámica: /media/[type]/[id]
  const { type, id } = useLocalSearchParams<{ type?: string; id?: string }>();

  const resolvedType = useMemo<MediaType>(() => {
    return type === 'movie' ? 'movie' : 'tv';
  }, [type]);

  const tmdbId = useMemo<number>(() => {
    const parsed = parseInt(id || '0', 10);
    return isNaN(parsed) ? 0 : parsed;
  }, [id]);

  const {
    media,
    seasons,
    selectedSeason,
    episodes,
    activeMedia,
    isPlaying,
    isLoading,
    isLoadingEpisodes,
    error,
    fetchMediaData,
    selectSeason,
    playMovie,
    playEpisode,
  } = useMediaStore();

  useEffect(() => {
    if (tmdbId > 0) {
      fetchMediaData(resolvedType, tmdbId);
    }
  }, [resolvedType, tmdbId, fetchMediaData]);

  const handleRefresh = useCallback(() => {
    if (tmdbId > 0) {
      fetchMediaData(resolvedType, tmdbId);
    }
  }, [resolvedType, tmdbId, fetchMediaData]);

  // Renderizar Tarjeta de Episodio para Series usando React Native Paper
  const renderEpisodeCard = useCallback(
    ({ item }: { item: TMDBEpisode }) => {
      const isSelected =
        activeMedia?.episodeId === item.id ||
        (activeMedia?.episodeNumber === item.episode_number &&
          activeMedia?.seasonNumber === selectedSeason);

      const still = getStillUrl(item.still_path);

      return (
        <Card
          mode="elevated"
          elevation={isSelected ? 4 : 1}
          style={[
            styles.episodeCard,
            isSelected && {
              borderColor: theme.colors.primary || '#7c5af3',
              borderWidth: 1.5,
              backgroundColor: '#18152b',
            },
          ]}
        >
          <Pressable
            style={styles.cardTouchable}
            onPress={() => playEpisode(item)}
            android_ripple={{ color: 'rgba(124, 90, 243, 0.2)' }}
          >
            <View style={[styles.episodeLayout, isMobile && styles.episodeLayoutMobile]}>
              {/* Miniatura del episodio */}
              <View
                style={[
                  styles.thumbnailContainer,
                  isMobile && styles.thumbnailContainerMobile,
                ]}
              >
                {still ? (
                  <Image
                    source={{ uri: still }}
                    style={styles.thumbnailImg}
                    contentFit="cover"
                    transition={200}
                  />
                ) : (
                  <View style={styles.thumbnailFallback}>
                    <Ionicons name="film-outline" size={28} color="#64748b" />
                  </View>
                )}

                <LinearGradient
                  colors={['transparent', 'rgba(10, 10, 18, 0.7)']}
                  style={StyleSheet.absoluteFillObject}
                />

                <Badge style={styles.epNumBadge}>
                  {item.episode_number}
                </Badge>

                <View style={[styles.playCircleOverlay, isSelected && styles.playCircleActive]}>
                  <Ionicons
                    name={isSelected && isPlaying ? 'pause' : 'play'}
                    size={isMobile ? 18 : 22}
                    color="#ffffff"
                    style={!isSelected || !isPlaying ? { marginLeft: 2 } : undefined}
                  />
                </View>
              </View>

              {/* Información del episodio */}
              <Card.Content style={styles.episodeContent}>
                <View style={styles.epHeaderRow}>
                  <Text
                    variant="titleMedium"
                    numberOfLines={2}
                    style={[styles.epTitle, isSelected && styles.epTitleActive]}
                  >
                    {item.episode_number}. {item.name}
                  </Text>
                  {isSelected && (
                    <Badge style={styles.activePill}>
                      {isPlaying ? 'EN REPRODUCCIÓN' : 'ACTIVO'}
                    </Badge>
                  )}
                </View>

                <View style={styles.epMetaRow}>
                  {item.runtime ? (
                    <View style={styles.metaItem}>
                      <Ionicons name="time-outline" size={13} color="#94a3b8" />
                      <Text style={styles.metaText}>{item.runtime} min</Text>
                    </View>
                  ) : null}

                  {item.vote_average > 0 ? (
                    <View style={styles.metaItem}>
                      <Ionicons name="star" size={12} color="#eab308" />
                      <Text style={styles.metaText}>{item.vote_average.toFixed(1)}</Text>
                    </View>
                  ) : null}

                  <View style={styles.vpsBadgeTag}>
                    <MaterialCommunityIcons name="server-network" size={12} color="#38bdf8" />
                    <Text style={styles.vpsBadgeText}>VPS MP4</Text>
                  </View>
                </View>

                <Text
                  variant="bodySmall"
                  numberOfLines={isMobile ? 3 : 4}
                  style={styles.epOverview}
                >
                  {item.overview || 'Sin descripción disponible para este episodio.'}
                </Text>
              </Card.Content>
            </View>
          </Pressable>
        </Card>
      );
    },
    [activeMedia, selectedSeason, isPlaying, isMobile, theme.colors.primary, playEpisode]
  );

  // Cabecera superior común: Reproductor + Metadatos de TMDB + Controles específicos
  const renderHeader = useMemo(() => {
    return (
      <View style={styles.headerBlock}>
        {/* Reproductor de Video en la parte superior */}
        <DynamicMediaVideoPlayer />

        {/* Backdrop y Metadatos TMDB con Gradiente */}
        <View style={styles.metadataCard}>
          {media?.backdropUrl && (
            <View style={styles.backdropCover}>
              <Image
                source={{ uri: media.backdropUrl }}
                style={StyleSheet.absoluteFillObject}
                contentFit="cover"
                transition={300}
              />
              <LinearGradient
                colors={[
                  'rgba(10, 10, 18, 0.2)',
                  'rgba(10, 10, 18, 0.85)',
                  '#0f0f1a',
                ]}
                style={StyleSheet.absoluteFillObject}
              />
            </View>
          )}

          <View style={styles.metadataContent}>
            <View style={styles.mediaTagRow}>
              <Badge style={styles.mediaTypeBadge}>
                {media?.type === 'movie' ? 'PELÍCULA' : 'SERIE DE TV'}
              </Badge>
              {media?.releaseDate ? (
                <Text style={styles.releaseYear}>
                  {media.releaseDate.slice(0, 4)}
                </Text>
              ) : null}
              {media?.voteAverage ? (
                <View style={styles.ratingBox}>
                  <Ionicons name="star" size={13} color="#facc15" />
                  <Text style={styles.ratingNumber}>
                    {media.voteAverage.toFixed(1)}
                  </Text>
                </View>
              ) : null}
            </View>

            <Text variant="headlineMedium" style={styles.mainTitle}>
              {media?.title}
            </Text>

            {/* Géneros */}
            {media?.genres && media.genres.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.genresScroll}
                contentContainerStyle={{ gap: 6 }}
              >
                {media.genres.map((g) => (
                  <Chip
                    key={g.id}
                    compact
                    style={styles.genreChip}
                    textStyle={styles.genreChipText}
                  >
                    {g.name}
                  </Chip>
                ))}
              </ScrollView>
            )}

            {/* Sinopsis */}
            {media?.overview ? (
              <Text variant="bodyMedium" style={styles.mainOverview}>
                {media.overview}
              </Text>
            ) : null}

            {/* CONTROLES ESPECÍFICOS SEGÚN TIPO: */}
            {resolvedType === 'movie' ? (
              // ── Si es Película: Botón Gigante de "Reproducir Película" ──
              <View style={styles.movieActionBox}>
                <Pressable
                  style={({ pressed }) => [
                    styles.giantPlayBtn,
                    pressed && styles.giantPlayBtnPressed,
                  ]}
                  onPress={playMovie}
                  accessibilityRole="button"
                  accessibilityLabel="Reproducir Película completa"
                >
                  <LinearGradient
                    colors={['#7c5af3', '#4f27d4']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.giantPlayGradient}
                  >
                    <Ionicons name="play-circle" size={32} color="#ffffff" />
                    <View style={styles.giantPlayTexts}>
                      <Text style={styles.giantPlayTitle}>Reproducir Película</Text>
                      <Text style={styles.giantPlaySub}>
                        Transmisión directa en MP4 desde el servidor Nginx
                      </Text>
                    </View>
                  </LinearGradient>
                </Pressable>
              </View>
            ) : (
              // ── Si es Serie: Selector Horizontal de Temporadas ──
              <View style={styles.tvControlsBox}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="layers-outline" size={18} color="#c084fc" />
                  <Text variant="titleMedium" style={styles.sectionTitle}>
                    Temporadas ({seasons.length})
                  </Text>
                </View>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.seasonsRow}
                >
                  {seasons.map((s) => {
                    const isSeasonActive = selectedSeason === s.season_number;
                    return (
                      <Pressable
                        key={`season-pill-${s.season_number}`}
                        style={[
                          styles.seasonPill,
                          isSeasonActive && styles.seasonPillActive,
                        ]}
                        onPress={() => selectSeason(s.season_number)}
                      >
                        <Text
                          style={[
                            styles.seasonPillText,
                            isSeasonActive && styles.seasonPillTextActive,
                          ]}
                        >
                          Temporada {s.season_number}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>

                <View style={styles.sectionHeader}>
                  <Ionicons name="list" size={18} color="#c084fc" />
                  <Text variant="titleMedium" style={styles.sectionTitle}>
                    Episodios ({episodes.length})
                  </Text>
                </View>

                {isLoadingEpisodes && (
                  <View style={styles.seasonLoadingRow}>
                    <ActivityIndicator size="small" color="#7c5af3" />
                    <Text style={styles.seasonLoadingText}>
                      Cargando episodios de la temporada {selectedSeason}...
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>
        </View>
      </View>
    );
  }, [
    media,
    resolvedType,
    seasons,
    selectedSeason,
    episodes.length,
    isLoadingEpisodes,
    playMovie,
    selectSeason,
  ]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Fondo oscuro con gradientes profundos */}
      <LinearGradient
        colors={['#08080e', '#100e1f', '#06060a']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Barra de navegación superior */}
      <View style={styles.topNavbar}>
        <Pressable
          style={({ pressed }) => [styles.navBackBtn, pressed && styles.navBackBtnPressed]}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Regresar"
        >
          <Ionicons name="chevron-back" size={20} color="#f1f5f9" />
          <Text style={styles.navBackText}>Volver</Text>
        </Pressable>

        <View style={styles.navCenter}>
          <Text style={styles.navTitle} numberOfLines={1}>
            {media?.title || 'Detalle'}
          </Text>
          <Text style={styles.navSub}>
            {resolvedType === 'movie' ? 'Película' : `Serie • T${selectedSeason}`}
          </Text>
        </View>

        <Pressable style={styles.navActionBtn} onPress={handleRefresh}>
          <Ionicons name="refresh" size={18} color="#cbd5e1" />
        </Pressable>
      </View>

      {/* Contenido Dinámico */}
      <View style={[styles.mainWrapper, isDesktop && styles.mainWrapperDesktop]}>
        {isLoading && !media ? (
          <View style={styles.loaderArea}>
            <ActivityIndicator size="large" color="#7c5af3" />
            <Text style={styles.loaderLabel}>Cargando catálogo dinámico desde TMDB...</Text>
          </View>
        ) : error && !media ? (
          <View style={styles.errorArea}>
            <Ionicons name="alert-circle-outline" size={54} color="#f87171" />
            <Text style={styles.errorHeading}>No se pudo cargar el título</Text>
            <Text style={styles.errorText}>{error}</Text>
            <Button mode="contained" onPress={handleRefresh} style={styles.retryBtn}>
              Reintentar
            </Button>
          </View>
        ) : resolvedType === 'movie' ? (
          // Vista para películas: ScrollView con cabecera y botón gigante
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isLoading}
                onRefresh={handleRefresh}
                tintColor="#7c5af3"
              />
            }
          >
            {renderHeader}
            <View style={{ height: 60 }} />
          </ScrollView>
        ) : (
          // Vista para series: FlatList con selector y tarjetas de episodios
          <FlatList
            data={episodes}
            keyExtractor={(item) => `media-ep-${item.id}-${item.episode_number}`}
            ListHeaderComponent={renderHeader}
            renderItem={renderEpisodeCard}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isLoading}
                onRefresh={handleRefresh}
                tintColor="#7c5af3"
              />
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#08080e',
    paddingTop: Platform.OS === 'android' ? 24 : 0,
  },
  topNavbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
    backgroundColor: 'rgba(8, 8, 14, 0.85)',
    zIndex: 10,
  },
  navBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  navBackBtnPressed: {
    opacity: 0.7,
  },
  navBackText: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: '600',
  },
  navCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  navTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  navSub: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '600',
  },
  navActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainWrapper: {
    flex: 1,
    width: '100%',
    alignSelf: 'center',
  },
  mainWrapperDesktop: {
    maxWidth: 1060,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  headerBlock: {
    paddingTop: 12,
  },
  metadataCard: {
    borderRadius: 16,
    backgroundColor: '#10101c',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 16,
  },
  backdropCover: {
    height: 180,
    width: '100%',
    position: 'relative',
  },
  metadataContent: {
    padding: 16,
    marginTop: -40,
    zIndex: 2,
  },
  mediaTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  mediaTypeBadge: {
    backgroundColor: '#7c5af3',
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 10,
  },
  releaseYear: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '700',
  },
  ratingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(250, 204, 21, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(250, 204, 21, 0.3)',
  },
  ratingNumber: {
    color: '#facc15',
    fontSize: 11,
    fontWeight: '700',
  },
  mainTitle: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 24,
    letterSpacing: -0.4,
    marginBottom: 10,
  },
  genresScroll: {
    marginBottom: 12,
  },
  genreChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    borderRadius: 8,
    height: 28,
  },
  genreChipText: {
    color: '#cbd5e1',
    fontSize: 11,
    fontWeight: '600',
  },
  mainOverview: {
    color: '#94a3b8',
    lineHeight: 20,
    fontSize: 13,
    marginBottom: 16,
  },
  movieActionBox: {
    marginTop: 8,
  },
  giantPlayBtn: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#7c5af3',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  },
  giantPlayBtnPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.92,
  },
  giantPlayGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 16,
  },
  giantPlayTexts: {
    flex: 1,
  },
  giantPlayTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  giantPlaySub: {
    color: '#d8b4fe',
    fontSize: 12,
    marginTop: 2,
  },
  tvControlsBox: {
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    marginBottom: 10,
  },
  sectionTitle: {
    color: '#f1f5f9',
    fontWeight: '800',
    fontSize: 15,
  },
  seasonsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 10,
  },
  seasonPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  seasonPillActive: {
    backgroundColor: '#7c5af3',
    borderColor: '#7c5af3',
  },
  seasonPillText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '700',
  },
  seasonPillTextActive: {
    color: '#ffffff',
  },
  seasonLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  seasonLoadingText: {
    color: '#a855f7',
    fontSize: 12,
    fontWeight: '600',
  },
  episodeCard: {
    marginBottom: 10,
    backgroundColor: '#12121e',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    overflow: 'hidden',
  },
  cardTouchable: {
    borderRadius: 14,
  },
  episodeLayout: {
    flexDirection: 'row',
    padding: 10,
    gap: 12,
  },
  episodeLayoutMobile: {
    flexDirection: 'column',
    padding: 10,
  },
  thumbnailContainer: {
    width: 160,
    height: 100,
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#090910',
  },
  thumbnailContainerMobile: {
    width: '100%',
    height: 170,
  },
  thumbnailImg: {
    width: '100%',
    height: '100%',
  },
  thumbnailFallback: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#161624',
  },
  epNumBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 11,
  },
  playCircleOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    alignSelf: 'center',
    top: '50%',
    left: '50%',
    marginTop: -18,
    marginLeft: -18,
  },
  playCircleActive: {
    backgroundColor: '#7c5af3',
    borderColor: '#ffffff',
  },
  episodeContent: {
    flex: 1,
    paddingHorizontal: 0,
    paddingVertical: 2,
    justifyContent: 'center',
  },
  epHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 4,
  },
  epTitle: {
    color: '#f8fafc',
    fontWeight: '700',
    fontSize: 14,
    lineHeight: 18,
    flex: 1,
  },
  epTitleActive: {
    color: '#c084fc',
  },
  activePill: {
    backgroundColor: '#7c5af3',
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
    paddingHorizontal: 6,
  },
  epMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
    flexWrap: 'wrap',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '600',
  },
  vpsBadgeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  vpsBadgeText: {
    color: '#38bdf8',
    fontSize: 9,
    fontWeight: '700',
  },
  epOverview: {
    color: '#94a3b8',
    lineHeight: 17,
    fontSize: 12,
  },
  loaderArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 400,
    gap: 12,
  },
  loaderLabel: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '600',
  },
  errorArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 400,
    padding: 30,
    gap: 12,
  },
  errorHeading: {
    color: '#f87171',
    fontSize: 18,
    fontWeight: '800',
  },
  errorText: {
    color: '#94a3b8',
    fontSize: 13,
    textAlign: 'center',
    maxWidth: 380,
  },
  retryBtn: {
    backgroundColor: '#7c5af3',
    marginTop: 8,
  },
});
