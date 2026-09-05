import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, LayoutAnimation, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { EpisodeWithProgress } from '@/types';

interface CrossoverAlertProps {
  episode: EpisodeWithProgress;
  detailed?: boolean;
}

export default function CrossoverAlert({ episode, detailed = false }: CrossoverAlertProps) {
  const [expanded, setExpanded] = useState(detailed);

  if (!episode.isCrossover) return null;

  const toggle = () => {
    if (Platform.OS !== 'web') {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }
    setExpanded((v: boolean) => !v);
  };

  const hasSVU = episode.crossoverSeries.some((s) =>
    s.seriesName.toLowerCase().includes('special victims')
  );

  return (
    <Pressable onPress={toggle} style={styles.container}>
      <LinearGradient
        colors={['rgba(245,158,11,0.12)', 'rgba(239,68,68,0.08)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.leftRow}>
            <View style={styles.iconContainer}>
              <Ionicons name="link" size={16} color="#f59e0b" />
            </View>
            <View>
              <Text style={styles.label}>CROSSOVER EVENT</Text>
              <Text style={styles.arcName} numberOfLines={1}>
                {episode.crossoverName?.replace(/^["']|["']$/g, '') ?? 'Crossover'}
              </Text>
            </View>
          </View>
          <View style={styles.rightRow}>
            {hasSVU && (
              <View style={styles.svuBadge}>
                <Text style={styles.svuText}>+ SVU</Text>
              </View>
            )}
            <View style={styles.orderBadge}>
              <Text style={styles.orderText}>#{episode.crossoverOrder}</Text>
            </View>
            <Ionicons
              name={expanded ? 'chevron-up' : 'chevron-down'}
              size={16}
              color="#94a3b8"
            />
          </View>
        </View>

        {/* Expanded Details */}
        {expanded && episode.crossoverSeries.length > 0 && (
          <View style={styles.details}>
            <Text style={styles.detailsTitle}>Watch in this order:</Text>
            {episode.crossoverSeries.map((s, idx) => (
              <View key={idx} style={styles.crossoverItem}>
                <View style={[styles.orderCircle, episode.crossoverOrder === idx + 1 && styles.orderCircleActive]}>
                  <Text style={[styles.orderCircleText, episode.crossoverOrder === idx + 1 && styles.orderCircleTextActive]}>
                    {idx + 1}
                  </Text>
                </View>
                <View>
                  <Text style={[styles.crossoverSeries, episode.crossoverOrder === idx + 1 && styles.crossoverSeriesActive]}>
                    {s.seriesName}
                  </Text>
                  <Text style={styles.crossoverEp}>{s.seasonEp}</Text>
                </View>
                {episode.crossoverOrder === idx + 1 && (
                  <View style={styles.currentBadge}>
                    <Text style={styles.currentBadgeText}>← This episode</Text>
                  </View>
                )}
              </View>
            ))}
            <Text style={styles.tipText}>
              💡 Tap the Crossovers button on the series page to filter crossover episodes only.
            </Text>
          </View>
        )}
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.25)',
  },
  gradient: { padding: 12 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(245,158,11,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    color: '#f59e0b',
    fontFamily: 'Inter_700Bold',
    fontSize: 9,
    letterSpacing: 1.5,
    marginBottom: 1,
  },
  arcName: {
    color: '#fbbf24',
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    flex: 1,
  },
  rightRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  svuBadge: {
    backgroundColor: 'rgba(99,102,241,0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  svuText: { color: '#818cf8', fontFamily: 'Inter_700Bold', fontSize: 9 },
  orderBadge: {
    backgroundColor: 'rgba(245,158,11,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  orderText: { color: '#f59e0b', fontFamily: 'Inter_700Bold', fontSize: 12 },
  // Details
  details: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(245,158,11,0.15)',
    gap: 8,
  },
  detailsTitle: {
    color: '#94a3b8',
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  crossoverItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  orderCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#334155',
  },
  orderCircleActive: {
    backgroundColor: '#f59e0b',
    borderColor: '#f59e0b',
  },
  orderCircleText: {
    color: '#64748b',
    fontFamily: 'Inter_700Bold',
    fontSize: 11,
  },
  orderCircleTextActive: { color: '#0a0a0f' },
  crossoverSeries: {
    color: '#94a3b8',
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
  },
  crossoverSeriesActive: { color: '#fbbf24' },
  crossoverEp: {
    color: '#475569',
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
  },
  currentBadge: {
    backgroundColor: 'rgba(245,158,11,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 'auto',
  },
  currentBadgeText: {
    color: '#f59e0b',
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
  },
  tipText: {
    color: '#475569',
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    lineHeight: 16,
    marginTop: 4,
    fontStyle: 'italic',
  },
});
