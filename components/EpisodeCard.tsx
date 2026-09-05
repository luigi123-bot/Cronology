import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import type { EpisodeWithProgress } from '@/types';

const STILL_WIDTH = 130;
const STILL_HEIGHT = 76;

interface EpisodeCardProps {
  episode: EpisodeWithProgress;
  isCurrent?: boolean;
  onToggleWatched: () => void;
  onPress: () => void;
}

export default function EpisodeCard({
  episode,
  isCurrent,
  onToggleWatched,
  onPress,
}: EpisodeCardProps) {
  const epCode = `E${String(episode.episodeNumber).padStart(2, '0')}`;

  return (
    <Pressable
      style={({ hovered }: any) => [
        styles.card,
        isCurrent && styles.cardCurrent,
        episode.watched && styles.cardWatched,
        hovered && styles.cardHovered,
      ]}
      onPress={onPress}
    >
      {/* Episode Still with Play Hover Overlay */}
      <View style={styles.stillContainer}>
        {episode.stillUrl ? (
          <Image
            source={{ uri: episode.stillUrl }}
            style={styles.still}
            contentFit="cover"
            transition={300}
          />
        ) : (
          <View style={[styles.still, styles.stillPlaceholder]}>
            <Ionicons name="film-outline" size={24} color="#475569" />
          </View>
        )}

        {/* Play icon overlay */}
        <View style={styles.playOverlay}>
          <View style={[styles.playCircle, isCurrent && styles.playCircleCurrent]}>
            <Ionicons name="play" size={14} color="#ffffff" />
          </View>
        </View>

        {episode.watched && (
          <View style={styles.watchedOverlay}>
            <Ionicons name="checkmark-circle" size={28} color="#22c55e" />
          </View>
        )}

        {episode.isCrossover && (
          <View style={styles.crossoverBadge}>
            <Ionicons name="git-merge" size={10} color="#f59e0b" />
          </View>
        )}
      </View>

      {/* Info Section */}
      <View style={styles.info}>
        <View style={styles.titleLine}>
          <View style={[styles.epPill, isCurrent && styles.epPillCurrent]}>
            <Text style={[styles.epCode, isCurrent && styles.epCodeCurrent]}>{epCode}</Text>
          </View>

          {isCurrent && (
            <View style={styles.currentBadge}>
              <Ionicons name="location" size={10} color="#c084fc" />
              <Text style={styles.currentBadgeText}>Capítulo actual</Text>
            </View>
          )}

          {episode.watched && (
            <View style={styles.watchedBadge}>
              <Ionicons name="checkmark" size={11} color="#4ade80" />
              <Text style={styles.watchedBadgeText}>Visto</Text>
            </View>
          )}

          <Text style={styles.name} numberOfLines={1}>
            {episode.name}
          </Text>
        </View>

        {episode.overview ? (
          <Text style={styles.overview} numberOfLines={2}>
            {episode.overview}
          </Text>
        ) : null}

        <View style={styles.metaRow}>
          {episode.airDate && (
            <Text style={styles.meta}>{episode.airDate}</Text>
          )}
          {episode.runtime && (
            <Text style={styles.meta}>· {episode.runtime} min</Text>
          )}
          {episode.isCrossover && (
            <Text style={styles.crossoverText}>· Crossover Arc</Text>
          )}
        </View>
      </View>

      {/* Watched Toggle Button */}
      <Pressable
        style={[styles.watchBtn, episode.watched && styles.watchBtnActive]}
        onPress={(e) => {
          e.stopPropagation?.();
          onToggleWatched();
        }}
        accessibilityLabel={episode.watched ? "Marcar como no visto" : "Marcar como visto"}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        <Ionicons
          name={episode.watched ? 'checkmark-circle' : 'checkmark-circle-outline'}
          size={24}
          color={episode.watched ? '#22c55e' : '#64748b'}
        />
        <Text style={[styles.watchBtnLabel, episode.watched && styles.watchBtnLabelActive]}>
          {episode.watched ? 'Visto' : 'Marcar'}
        </Text>
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: '#12121e',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    gap: 14,
    cursor: 'pointer' as any,
  },
  cardHovered: {
    backgroundColor: '#171726',
    borderColor: 'rgba(168, 85, 247, 0.4)',
    transform: [{ translateX: 4 }] as any,
  },
  cardCurrent: {
    backgroundColor: 'rgba(168, 85, 247, 0.1)',
    borderColor: 'rgba(168, 85, 247, 0.6)',
    shadowColor: '#a855f7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  cardWatched: {
    opacity: 0.85,
    borderColor: 'rgba(34, 197, 94, 0.25)',
  },
  stillContainer: {
    width: STILL_WIDTH,
    height: STILL_HEIGHT,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    flexShrink: 0,
    backgroundColor: '#1a1b2e',
  },
  still: {
    width: '100%',
    height: '100%',
  },
  stillPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#161726',
  },
  playOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(10, 10, 15, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(124, 58, 237, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 2,
  },
  playCircleCurrent: {
    backgroundColor: '#a855f7',
    transform: [{ scale: 1.1 }] as any,
  },
  watchedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(10, 10, 15, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  crossoverBadge: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: 'rgba(245, 158, 11, 0.9)',
    borderRadius: 4,
    padding: 3,
  },
  info: {
    flex: 1,
    gap: 4,
  },
  titleLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  epPill: {
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  epPillCurrent: {
    backgroundColor: '#7c3aed',
  },
  epCode: {
    color: '#c084fc',
    fontSize: 11,
    fontWeight: '800',
  },
  epCodeCurrent: {
    color: '#ffffff',
  },
  currentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(168, 85, 247, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.4)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  currentBadgeText: {
    color: '#d8b4fe',
    fontSize: 10,
    fontWeight: '800',
  },
  watchedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.35)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  watchedBadgeText: {
    color: '#4ade80',
    fontSize: 10,
    fontWeight: '800',
  },
  name: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  overview: {
    color: '#94a3b8',
    fontSize: 12,
    lineHeight: 16,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  meta: {
    color: '#64748b',
    fontSize: 11,
  },
  crossoverText: {
    color: '#f59e0b',
    fontSize: 11,
    fontWeight: '600',
  },
  watchBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    cursor: 'pointer' as any,
    minWidth: 46,
  },
  watchBtnActive: {
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  watchBtnLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748b',
    marginTop: 2,
  },
  watchBtnLabelActive: {
    color: '#4ade80',
  },
});
