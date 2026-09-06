import React from 'react';
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
import type { SeriesCurrentProgress } from '@/services/watchProgress';

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
      {/* Header con icono de palomitas e insignia roja */}
      <View style={styles.headerRow}>
        <View style={styles.popcornIconWrapper}>
          <MaterialCommunityIcons name="popcorn" size={22} color="#ffffff" />
        </View>
        <Text style={styles.headerTitle}>CONTINÚA VIENDO</Text>
      </View>

      {/* Lista horizontal de tarjetas */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollList}
      >
        {items.map((item) => {
          const progressVal = Math.min(Math.max(item.progressPercent ?? 35, 8), 100);
          const yearDisplay = item.year ? `(${item.year})` : '';

          return (
            <Pressable
              key={`continue-${item.seriesId}`}
              style={({ hovered }: any) => [
                styles.card,
                isMobile && styles.cardMobile,
                hovered && styles.cardHovered,
              ]}
              onPress={() => handleCardPress(item)}
            >
              {/* Imagen de fondo (backdrop) */}
              <Image
                source={{
                  uri:
                    item.bannerUrl ||
                    'https://image.tmdb.org/t/p/w1280/x2jNLrYw1s9i6kihEJqsBQgs9nR.jpg',
                }}
                style={StyleSheet.absoluteFillObject}
                contentFit="cover"
                transition={300}
              />

              {/* Sombreado degradado para legibilidad del texto */}
              <LinearGradient
                colors={['rgba(0,0,0,0.05)', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.94)']}
                locations={[0, 0.45, 1]}
                style={StyleSheet.absoluteFillObject}
              />

              {/* Botón de papelera amarillo en la esquina superior derecha */}
              <Pressable
                style={({ hovered }: any) => [
                  styles.trashButton,
                  hovered && styles.trashButtonHovered,
                ]}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                onPress={(e) => handleRemove(e, item.seriesId)}
                accessibilityLabel="Eliminar de continuar viendo"
                accessibilityRole="button"
              >
                <MaterialCommunityIcons
                  name="trash-can-outline"
                  size={17}
                  color="#facc15"
                />
              </Pressable>

              {/* Información inferior (Capítulo, Serie y Barra Roja) */}
              <View style={styles.cardBottomOverlay}>
                {/* 1x17 */}
                <Text style={styles.episodeCodeText}>
                  {item.seasonNumber}x{item.episodeNumber}
                </Text>

                {/* Chicago Med (2015) */}
                <Text style={styles.seriesNameText} numberOfLines={1}>
                  {item.seriesName} {yearDisplay}
                </Text>

                {/* Barra de progreso de reproducción roja */}
                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${progressVal}%` },
                    ]}
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
    marginTop: 18,
    marginBottom: 26,
    width: '100%',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 12,
    paddingHorizontal: 4,
  },
  popcornIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e50914', // Rojo icónico streaming
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#e50914',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 4,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 21,
    fontWeight: '900',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  scrollList: {
    paddingHorizontal: 4,
    paddingBottom: 8,
    gap: 16,
    flexDirection: 'row',
  },
  card: {
    width: 280,
    height: 158,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#151620',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s ease',
      } as any,
      default: {
        elevation: 4,
      },
    }),
  },
  cardMobile: {
    width: 235,
    height: 132,
  },
  cardHovered: {
    transform: [{ scale: 1.025 }],
    borderColor: 'rgba(255, 255, 255, 0.25)',
    ...Platform.select({
      web: {
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6)',
      } as any,
    }),
  },
  trashButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    borderRadius: 6,
    padding: 5,
    paddingHorizontal: 6,
    zIndex: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'background-color 0.15s ease, transform 0.15s ease',
      } as any,
    }),
  },
  trashButtonHovered: {
    backgroundColor: 'rgba(239, 68, 68, 0.35)',
    borderColor: '#facc15',
    transform: [{ scale: 1.1 }],
  },
  cardBottomOverlay: {
    position: 'absolute',
    bottom: 10,
    left: 12,
    right: 12,
  },
  episodeCodeText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.3,
    textShadowColor: 'rgba(0, 0, 0, 0.9)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    marginBottom: 2,
  },
  seriesNameText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.2,
    textShadowColor: 'rgba(0, 0, 0, 0.9)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  progressTrack: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.28)',
    borderRadius: 2,
    marginTop: 8,
    overflow: 'hidden',
    width: '100%',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#e50914', // Rojo Netflix streaming
    borderRadius: 2,
  },
});
