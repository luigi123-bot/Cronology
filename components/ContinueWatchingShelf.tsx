import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  type SeriesCurrentProgress,
  resolveSeriesBackdrop,
} from '@/services/watchProgress';

interface ContinueWatchingShelfProps {
  items: SeriesCurrentProgress[];
  onRemoveItem: (seriesId: number) => void;
}

export default function ContinueWatchingShelf({
  items,
  onRemoveItem,
}: ContinueWatchingShelfProps) {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isMobile = width < 600;
  const [hoveredCardId, setHoveredCardId] = useState<number | null>(null);

  if (!items || items.length === 0) {
    return null;
  }

  const handleCardPress = (item: SeriesCurrentProgress) => {
    if (item.episodeId) {
      router.push(`/episode/${item.episodeId}`);
    } else if (item.seriesId) {
      router.push(`/series/${item.seriesId}`);
    }
  };

  const handleRemove = (e: any, seriesId: number) => {
    if (e && e.stopPropagation) {
      e.stopPropagation();
    }
    onRemoveItem(seriesId);
  };

  return (
    <View style={styles.container}>
      {/* ── Cabecera Premium de Sección ── */}
      <View style={styles.headerRow}>
        <View style={styles.headerTitleGroup}>
          <View style={styles.popcornIconWrapper}>
            <MaterialCommunityIcons name="popcorn" size={20} color="#ffffff" />
          </View>
          <Text style={styles.headerTitle}>CONTINÚA VIENDO</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{items.length}</Text>
          </View>
        </View>
      </View>

      {/* ── Carrusel Horizontal de Tarjetas Cinemáticas ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollList}
      >
        {items.map((item) => {
          const progressVal = Math.min(Math.max(item.progressPercent ?? 35, 10), 100);
          const yearDisplay = item.year ? `(${item.year})` : '';
          const backdropUri = resolveSeriesBackdrop(item.seriesName, item.bannerUrl);
          const isHovered = hoveredCardId === item.seriesId;

          // Formateo elegante de código de episodio y nombre
          const episodeCode = `T${item.seasonNumber} : E${item.episodeNumber}`;
          const episodeSubText = item.episodeName
            ? `${item.seasonNumber}x${item.episodeNumber} • ${item.episodeName}`
            : `${item.seasonNumber}x${item.episodeNumber}`;

          return (
            <Pressable
              key={`continue-${item.seriesId}`}
              style={({ hovered }: any) => [
                styles.card,
                isMobile && styles.cardMobile,
                (hovered || isHovered) && styles.cardHovered,
              ]}
              onHoverIn={() => setHoveredCardId(item.seriesId)}
              onHoverOut={() => setHoveredCardId(null)}
              onPress={() => handleCardPress(item)}
              accessibilityRole="button"
              accessibilityLabel={`Continuar viendo ${item.seriesName} episodio ${item.episodeNumber}`}
            >
              {/* Imagen de fondo de alta fidelidad con transición */}
              <Image
                source={{ uri: backdropUri }}
                style={StyleSheet.absoluteFillObject}
                contentFit="cover"
                transition={350}
              />

              {/* Degradado Cinematográfico Multi-capa */}
              <LinearGradient
                colors={[
                  'rgba(0, 0, 0, 0.65)',
                  'rgba(0, 0, 0, 0.1)',
                  'rgba(6, 6, 12, 0.7)',
                  'rgba(6, 6, 12, 0.98)',
                ]}
                locations={[0, 0.28, 0.65, 1]}
                style={StyleSheet.absoluteFillObject}
              />

              {/* ── Barra Superior: Pill de Episodio + Botón Descartar ── */}
              <View style={styles.cardTopRow}>
                <View style={styles.episodeCodePill}>
                  <Ionicons name="play" size={10} color="#e50914" style={{ marginRight: 4 }} />
                  <Text style={styles.episodeCodeText}>{episodeCode}</Text>
                </View>

                {/* Botón Minimalista de Cierre / Eliminar (Estilo Frosted Glass) */}
                <Pressable
                  style={({ hovered }: any) => [
                    styles.dismissButton,
                    hovered && styles.dismissButtonHovered,
                  ]}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  onPress={(e) => handleRemove(e, item.seriesId)}
                  accessibilityLabel="Quitar de continuar viendo"
                  accessibilityRole="button"
                >
                  <Ionicons name="close" size={15} color="#e2e8f0" />
                </Pressable>
              </View>

              {/* ── Botón Central de Play Flotante (Aparece en Hover) ── */}
              <View
                style={[
                  styles.centerPlayWrapper,
                  (isHovered || Platform.OS !== 'web') && styles.centerPlayWrapperVisible,
                ]}
              >
                <View style={styles.centerPlayCircle}>
                  <Ionicons name="play" size={22} color="#ffffff" style={{ marginLeft: 3 }} />
                </View>
              </View>

              {/* ── Información Inferior: Título, Capítulo y Barra de Progreso ── */}
              <View style={styles.cardBottomOverlay}>
                <View style={styles.titleRow}>
                  <Text style={styles.seriesNameText} numberOfLines={1}>
                    {item.seriesName} <Text style={styles.yearText}>{yearDisplay}</Text>
                  </Text>
                  <View style={styles.percentBadge}>
                    <Text style={styles.percentText}>{`${progressVal}%`}</Text>
                  </View>
                </View>

                <Text style={styles.episodeSubText} numberOfLines={1}>
                  {episodeSubText}
                </Text>

                {/* Barra de progreso estilo Netflix con resplandor suave */}
                <View style={styles.progressTrack}>
                  <LinearGradient
                    colors={['#e50914', '#ff3b30']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.progressFill, { width: `${progressVal}%` }]}
                  />
                </View>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
    marginBottom: 28,
    width: '100%',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  popcornIconWrapper: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#e50914', // Rojo icónico streaming
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#e50914',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 5,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  countBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  countBadgeText: {
    color: '#e2e8f0',
    fontSize: 12,
    fontWeight: '700',
  },
  scrollList: {
    paddingHorizontal: 4,
    paddingBottom: 10,
    gap: 18,
    flexDirection: 'row',
  },
  card: {
    width: 295,
    height: 168,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#0f1016',
    position: 'relative',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.09)',
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
      } as any,
      default: {
        elevation: 5,
      },
    }),
  },
  cardMobile: {
    width: 245,
    height: 140,
    borderRadius: 12,
  },
  cardHovered: {
    borderColor: 'rgba(229, 9, 20, 0.55)',
    transform: [{ scale: 1.03 }],
    ...Platform.select({
      web: {
        boxShadow: '0 14px 34px rgba(0, 0, 0, 0.75), 0 0 20px rgba(229, 9, 20, 0.18)',
      } as any,
    }),
  },
  cardTopRow: {
    position: 'absolute',
    top: 10,
    left: 12,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  episodeCodePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(10, 11, 16, 0.75)',
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  episodeCodeText: {
    color: '#ffffff',
    fontSize: 11.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  dismissButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(10, 11, 16, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'all 0.18s ease',
      } as any,
    }),
  },
  dismissButtonHovered: {
    backgroundColor: '#dc2626',
    borderColor: '#ef4444',
    transform: [{ scale: 1.12 }],
  },
  centerPlayWrapper: {
    position: 'absolute',
    top: '40%',
    left: '50%',
    transform: [{ translateX: -24 }, { translateY: -24 }],
    opacity: 0,
    zIndex: 5,
    ...Platform.select({
      web: {
        transition: 'opacity 0.22s ease, transform 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
      } as any,
    }),
  },
  centerPlayWrapperVisible: {
    opacity: 1,
  },
  centerPlayCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(229, 9, 20, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    shadowColor: '#e50914',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 6,
  },
  cardBottomOverlay: {
    position: 'absolute',
    bottom: 10,
    left: 12,
    right: 12,
    zIndex: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
    gap: 8,
  },
  seriesNameText: {
    flex: 1,
    color: '#ffffff',
    fontSize: 15.5,
    fontWeight: '900',
    letterSpacing: 0.2,
    textShadowColor: 'rgba(0, 0, 0, 0.9)',
    textShadowOffset: { width: 0, height: 1.5 },
    textShadowRadius: 4,
  },
  yearText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94a3b8',
  },
  percentBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  percentText: {
    color: '#cbd5e1',
    fontSize: 10.5,
    fontWeight: '700',
  },
  episodeSubText: {
    color: '#cbd5e1',
    fontSize: 12.5,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    marginBottom: 8,
  },
  progressTrack: {
    height: 4.5,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    borderRadius: 3,
    overflow: 'hidden',
    width: '100%',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
});
