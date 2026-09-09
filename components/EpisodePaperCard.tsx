import React from 'react';
import { View, StyleSheet, Pressable, useWindowDimensions } from 'react-native';
import { Card, Text, Badge, useTheme } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { getStillUrl, type TMDBEpisode } from '@/services/tmdb';

interface EpisodePaperCardProps {
  episode: TMDBEpisode;
  isSelected: boolean;
  isPlaying: boolean;
  onPress: () => void;
}

export default function EpisodePaperCard({
  episode,
  isSelected,
  isPlaying,
  onPress,
}: EpisodePaperCardProps) {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const isMobile = width < 600;

  const stillUrl = getStillUrl(episode.still_path);
  const formattedAirDate = episode.air_date
    ? new Date(episode.air_date).toLocaleDateString('es-MX', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : null;

  return (
    <Card
      mode="elevated"
      elevation={isSelected ? 4 : 1}
      style={[
        styles.card,
        isSelected && {
          borderColor: theme.colors.primary || '#7c5af3',
          borderWidth: 1.5,
          backgroundColor: '#161426',
        },
      ]}
    >
      <Pressable
        style={styles.touchable}
        onPress={onPress}
        android_ripple={{ color: 'rgba(124, 90, 243, 0.15)' }}
      >
        <View style={[styles.cardLayout, isMobile && styles.cardLayoutMobile]}>
          {/* Contenedor de la Imagen Miniatura */}
          <View style={[styles.thumbnailContainer, isMobile && styles.thumbnailContainerMobile]}>
            {stillUrl ? (
              <Image
                source={{ uri: stillUrl }}
                style={styles.thumbnail}
                contentFit="cover"
                transition={200}
              />
            ) : (
              <View style={styles.thumbnailFallback}>
                <Ionicons name="film-outline" size={32} color="#64748b" />
              </View>
            )}

            {/* Gradiente sutil sobre la miniatura */}
            <LinearGradient
              colors={['transparent', 'rgba(10, 10, 18, 0.7)']}
              style={StyleSheet.absoluteFillObject}
            />

            {/* Número de Episodio */}
            <Badge style={styles.episodeNumberBadge}>
              {episode.episode_number}
            </Badge>

            {/* Botón flotante de Play sobre la miniatura */}
            <View style={[styles.playOverlay, isSelected && styles.playOverlaySelected]}>
              <View
                style={[
                  styles.playIconCircle,
                  isSelected && styles.playIconCircleActive,
                ]}
              >
                <Ionicons
                  name={isSelected && isPlaying ? 'pause' : 'play'}
                  size={isMobile ? 18 : 22}
                  color="#ffffff"
                  style={!isSelected || !isPlaying ? { marginLeft: 2 } : undefined}
                />
              </View>
            </View>
          </View>

          {/* Contenido e Información de la Tarjeta */}
          <Card.Content style={styles.content}>
            <View style={styles.headerRow}>
              <View style={styles.titleWrap}>
                <Text
                  variant="titleMedium"
                  numberOfLines={2}
                  style={[styles.title, isSelected && styles.titleSelected]}
                >
                  {episode.episode_number}. {episode.name}
                </Text>
              </View>

              {isSelected && (
                <Badge style={styles.statusBadge}>
                  {isPlaying ? 'REPRODUCIENDO' : 'ACTIVO'}
                </Badge>
              )}
            </View>

            {/* Metadata Chips: Duración, Calificación, Fecha */}
            <View style={styles.metaRow}>
              {episode.runtime ? (
                <View style={styles.metaItem}>
                  <Ionicons name="time-outline" size={13} color="#94a3b8" />
                  <Text style={styles.metaText}>{episode.runtime} min</Text>
                </View>
              ) : null}

              {episode.vote_average > 0 ? (
                <View style={styles.metaItem}>
                  <Ionicons name="star" size={12} color="#eab308" />
                  <Text style={styles.metaText}>{episode.vote_average.toFixed(1)}</Text>
                </View>
              ) : null}

              {formattedAirDate ? (
                <View style={styles.metaItem}>
                  <Ionicons name="calendar-outline" size={12} color="#94a3b8" />
                  <Text style={styles.metaText}>{formattedAirDate}</Text>
                </View>
              ) : null}

              <View style={styles.vpsTag}>
                <Ionicons name="film-outline" size={11} color="#38bdf8" />
                <Text style={styles.vpsTagText}>1080p</Text>
              </View>
            </View>

            {/* Sinopsis del Episodio */}
            <Text
              variant="bodySmall"
              numberOfLines={isMobile ? 3 : 4}
              style={styles.overview}
            >
              {episode.overview || 'Sin descripción disponible para este episodio.'}
            </Text>
          </Card.Content>
        </View>
      </Pressable>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
    backgroundColor: '#12121e',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    overflow: 'hidden',
  },
  touchable: {
    borderRadius: 14,
  },
  cardLayout: {
    flexDirection: 'row',
    padding: 10,
    gap: 12,
  },
  cardLayoutMobile: {
    flexDirection: 'column',
    padding: 10,
  },
  thumbnailContainer: {
    width: 170,
    height: 105,
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#0a0a10',
  },
  thumbnailContainerMobile: {
    width: '100%',
    height: 180,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  thumbnailFallback: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#181826',
  },
  episodeNumberBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 11,
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playOverlaySelected: {
    backgroundColor: 'rgba(124, 90, 243, 0.2)',
  },
  playIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIconCircleActive: {
    backgroundColor: '#7c5af3',
    borderColor: '#ffffff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 0,
    paddingVertical: 2,
    justifyContent: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 4,
  },
  titleWrap: {
    flex: 1,
  },
  title: {
    color: '#f8fafc',
    fontWeight: '700',
    fontSize: 15,
    lineHeight: 20,
  },
  titleSelected: {
    color: '#c084fc',
  },
  statusBadge: {
    backgroundColor: '#7c5af3',
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 9,
    paddingHorizontal: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
    fontSize: 12,
    fontWeight: '500',
  },
  vpsTag: {
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
  vpsTagText: {
    color: '#38bdf8',
    fontSize: 10,
    fontWeight: '700',
  },
  overview: {
    color: '#94a3b8',
    lineHeight: 18,
    fontSize: 12,
  },
});
