import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  useWindowDimensions,
  ActivityIndicator,
  Linking,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { db } from '@/db';
import { episodes, userProgress, series } from '@/db/schema';
import { eq, and, asc } from 'drizzle-orm';
import { useStore } from '@/store/useStore';
import { getYouTubeDeepLink, getYouTubeUrl } from '@/services/youtube';
import { getEpisodeFacts } from '@/services/deepseek';
import CrossoverAlert from '@/components/CrossoverAlert';
import EpisodePlayer from '@/components/EpisodePlayer';
import WebHeader from '@/components/WebHeader';
import type { EpisodeWithProgress } from '@/types';

export default function EpisodeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { user, watchedEpisodes, markEpisodeWatched } = useStore();

  const [episode, setEpisode] = useState<EpisodeWithProgress | null>(null);
  const [seriesData, setSeriesData] = useState<typeof series.$inferSelect | null>(null);
  const [prevEpisode, setPrevEpisode] = useState<{ id: number; name: string } | null>(null);
  const [nextEpisode, setNextEpisode] = useState<{ id: number; name: string } | null>(null);

  const [facts, setFacts] = useState<string>('');
  const [loadingFacts, setLoadingFacts] = useState(false);
  const [watched, setWatched] = useState(false);
  const [loading, setLoading] = useState(true);

  const isDesktop = width >= 768;
  const userId = user?.id ?? 1;
  const episodeId = Number(id);

  const loadEpisode = useCallback(async () => {
    try {
      const [ep] = await db.select().from(episodes).where(eq(episodes.id, episodeId));
      if (!ep) return;

      const [s] = await db.select().from(series).where(eq(series.id, ep.seriesId));
      setSeriesData(s ?? null);

      const [prog] = await db
        .select()
        .from(userProgress)
        .where(and(eq(userProgress.userId, userId), eq(userProgress.episodeId, episodeId)))
        .limit(1);

      const isWatched = prog?.watched ?? watchedEpisodes.has(episodeId);
      setWatched(isWatched);

      setEpisode({
        id: ep.id,
        seriesId: ep.seriesId,
        seriesName: s?.name ?? '',
        tmdbId: ep.tmdbId,
        seasonNumber: ep.seasonNumber,
        episodeNumber: ep.episodeNumber,
        name: ep.name,
        overview: ep.overview,
        airDate: ep.airDate,
        runtime: ep.runtime,
        stillUrl: ep.stillUrl,
        youtubeClipId: ep.youtubeClipId,
        isCrossover: ep.isCrossover ?? false,
        crossoverName: ep.crossoverName,
        crossoverOrder: ep.crossoverOrder,
        crossoverSeries: (ep.crossoverSeries as { seriesName: string; seasonEp: string }[]) ?? [],
        deepseekFacts: ep.deepseekFacts,
        watched: isWatched,
        watchedAt: prog?.watchedAt ?? null,
        rating: prog?.rating ?? null,
      });

      if (ep.deepseekFacts) {
        // Detect if cached facts are in English and re-generate in Spanish
        const isEnglish = detectEnglish(ep.deepseekFacts);
        if (isEnglish) {
          // Clear stale English cache from DB
          await db
            .update(episodes)
            .set({ deepseekFacts: null, updatedAt: new Date() })
            .where(eq(episodes.id, episodeId));
          // Leave facts empty so user can regenerate in Spanish
        } else {
          setFacts(ep.deepseekFacts);
        }
      }

      // Load prev and next episode in the series
      const allSeasonEps = await db
        .select({ id: episodes.id, name: episodes.name, epNum: episodes.episodeNumber })
        .from(episodes)
        .where(
          and(
            eq(episodes.seriesId, ep.seriesId),
            eq(episodes.seasonNumber, ep.seasonNumber)
          )
        )
        .orderBy(asc(episodes.episodeNumber));

      const currentIndex = allSeasonEps.findIndex((e) => e.id === ep.id);
      if (currentIndex > 0) {
        setPrevEpisode(allSeasonEps[currentIndex - 1]);
      } else {
        setPrevEpisode(null);
      }

      if (currentIndex >= 0 && currentIndex < allSeasonEps.length - 1) {
        setNextEpisode(allSeasonEps[currentIndex + 1]);
      } else {
        setNextEpisode(null);
      }
    } catch (error) {
      console.error('[Episode] Load failed:', error);
    } finally {
      setLoading(false);
    }
  }, [episodeId, userId, watchedEpisodes]);

  useEffect(() => {
    loadEpisode();
  }, [loadEpisode]);

  // Heuristic: detect if a text is primarily in English
  const detectEnglish = (text: string): boolean => {
    const englishMarkers = [
      /\bthe\b/i, /\bwas\b/i, /\bwere\b/i, /\btheir\b/i,
      /\bwho\b/i, /\bwhat\b/i, /\bwhen\b/i, /\bwhere\b/i,
      /\bthis\b/i, /\bthat\b/i, /\bwith\b/i, /\bfrom\b/i,
      /\bhave\b/i, /\bhas\b/i, /\bhad\b/i, /\bwould\b/i,
      /\bcould\b/i, /\bshould\b/i,
    ];
    const matches = englishMarkers.filter(re => re.test(text)).length;
    return matches >= 4;
  };

  const loadFacts = async (forceRegenerate = false) => {
    if (!episode || loadingFacts) return;
    if (facts && !forceRegenerate) return;
    setLoadingFacts(true);
    if (forceRegenerate) setFacts('');
    try {
      const result = await getEpisodeFacts(
        episode.seriesName,
        episode.name,
        episode.seasonNumber,
        episode.episodeNumber,
        episode.overview ?? ''
      );
      setFacts(result);

      // Cache in DB
      await db
        .update(episodes)
        .set({ deepseekFacts: result, updatedAt: new Date() })
        .where(eq(episodes.id, episodeId));
    } catch {
      setFacts('No se pudieron obtener curiosidades en este momento.');
    } finally {
      setLoadingFacts(false);
    }
  };

  const handleToggleWatched = async () => {
    if (!episode) return;
    const newWatched = !watched;
    setWatched(newWatched);
    markEpisodeWatched(episodeId, newWatched);

    try {
      const existing = await db
        .select()
        .from(userProgress)
        .where(and(eq(userProgress.userId, userId), eq(userProgress.episodeId, episodeId)))
        .limit(1);

      if (existing.length > 0) {
        await db
          .update(userProgress)
          .set({
            watched: newWatched,
            watchedAt: newWatched ? new Date() : null,
            updatedAt: new Date(),
          })
          .where(eq(userProgress.id, existing[0].id));
      } else {
        await db.insert(userProgress).values({
          userId,
          episodeId,
          watched: newWatched,
          watchedAt: newWatched ? new Date() : null,
        });
      }
    } catch (error) {
      console.error('[Episode] Toggle watched failed:', error);
      setWatched(!newWatched);
      markEpisodeWatched(episodeId, !newWatched);
    }
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#a855f7" />
        <Text style={styles.loaderText}>Cargando episodio y reproductor...</Text>
      </View>
    );
  }

  if (!episode) {
    return (
      <View style={styles.loader}>
        <Text style={styles.errorText}>Episodio no encontrado</Text>
        <Pressable style={styles.backButtonSimple} onPress={() => router.back()}>
          <Text style={{ color: '#fff', fontWeight: '700' }}>Volver</Text>
        </Pressable>
      </View>
    );
  }

  const epCode = `T${String(episode.seasonNumber).padStart(2, '0')} · E${String(episode.episodeNumber).padStart(2, '0')}`;

  return (
    <View style={styles.outerContainer}>
      <WebHeader />

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={[styles.mainWrapper, isDesktop && styles.desktopWrapper]}>
          
          {/* Breadcrumb / Top Navigation Bar */}
          <View style={styles.breadcrumbBar}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Pressable
                style={styles.backBtn}
                onPress={() => {
                  if (router.canGoBack()) {
                    router.back();
                  } else if (episode?.seriesId) {
                    router.replace(`/series/${episode.seriesId}`);
                  } else {
                    router.replace('/');
                  }
                }}
              >
                <Ionicons name="arrow-back" size={18} color="#ffffff" />
                <Text style={styles.backBtnText}>Volver a {episode.seriesName}</Text>
              </Pressable>

              <Pressable
                style={[styles.backBtn, { backgroundColor: 'rgba(255,255,255,0.06)' }]}
                onPress={() => router.replace('/')}
              >
                <Ionicons name="home" size={15} color="#c084fc" />
                <Text style={[styles.backBtnText, { color: '#f1f5f9' }]}>Inicio</Text>
              </Pressable>
            </View>

            <View style={styles.navControls}>
              {prevEpisode && (
                <Pressable
                  style={styles.adjBtn}
                  onPress={() => router.push(`/episode/${prevEpisode.id}`)}
                >
                  <Ionicons name="play-skip-back" size={14} color="#cbd5e1" />
                  <Text style={styles.adjBtnText}>Anterior</Text>
                </Pressable>
              )}

              {nextEpisode && (
                <Pressable
                  style={styles.adjBtn}
                  onPress={() => router.push(`/episode/${nextEpisode.id}`)}
                >
                  <Text style={styles.adjBtnText}>Siguiente</Text>
                  <Ionicons name="play-skip-forward" size={14} color="#cbd5e1" />
                </Pressable>
              )}
            </View>
          </View>

          {/* Video Player (Full Episode Stream + YouTube Trailer) */}
          <EpisodePlayer
            seriesTmdbId={seriesData?.tmdbId ?? 0}
            seriesName={episode.seriesName}
            seasonNumber={episode.seasonNumber}
            episodeNumber={episode.episodeNumber}
            episodeName={episode.name}
            youtubeClipId={episode.youtubeClipId}
          />

          {/* Episode Details */}
          <View style={styles.infoCard}>
            <View style={styles.titleRow}>
              <View style={{ flex: 1 }}>
                <View style={styles.badgeRow}>
                  <View style={styles.epCodeBadge}>
                    <Text style={styles.epCodeText}>{epCode}</Text>
                  </View>
                  <Text style={styles.seriesName}>{episode.seriesName}</Text>
                  {episode.airDate && (
                    <Text style={styles.airDate}>· {episode.airDate}</Text>
                  )}
                  {episode.runtime && (
                    <Text style={styles.airDate}>· {episode.runtime} min</Text>
                  )}
                </View>

                <Text style={styles.episodeTitle}>{episode.name}</Text>
              </View>

              {/* Watched Action Button */}
              <Pressable
                style={[styles.watchedBtn, watched && styles.watchedBtnActive]}
                onPress={handleToggleWatched}
              >
                <Ionicons
                  name={watched ? 'checkmark-circle' : 'checkmark-circle-outline'}
                  size={20}
                  color={watched ? '#ffffff' : '#a855f7'}
                />
                <Text style={[styles.watchedBtnText, watched && styles.watchedBtnTextActive]}>
                  {watched ? 'Completado ✓' : 'Marcar Visto'}
                </Text>
              </Pressable>
            </View>

            {/* Crossover Alert (if applicable) */}
            {episode.isCrossover && (
              <View style={styles.crossoverBox}>
                <CrossoverAlert episode={episode} detailed />
              </View>
            )}

            {/* Overview / Synopsis */}
            {episode.overview && (
              <View style={styles.overviewSection}>
                <Text style={styles.overviewLabel}>Sinopsis del Capítulo</Text>
                <Text style={styles.overviewText}>{episode.overview}</Text>
              </View>
            )}
          </View>

          {/* DeepSeek AI Narrative & Facts Card */}
          <View style={styles.aiCard}>
            <View style={styles.aiCardHeader}>
              <View style={styles.aiBadge}>
                <Ionicons name="sparkles" size={14} color="#38bdf8" />
                <Text style={styles.aiBadgeText}>DeepSeek AI</Text>
              </View>
              <Text style={styles.aiCardTitle}>Contexto Narrativo & Curiosidades</Text>
            </View>

            {facts ? (
              <View style={styles.factsContent}>
                <Text style={styles.factsText}>{facts}</Text>
                {/* Regenerate button in case it's still in English */}
                <Pressable
                  style={styles.regenerateBtn}
                  onPress={() => loadFacts(true)}
                >
                  <Ionicons name="refresh" size={12} color="#38bdf8" />
                  <Text style={styles.regenerateBtnText}>Regenerar en español</Text>
                </Pressable>
              </View>
            ) : loadingFacts ? (
              <View style={styles.aiLoading}>
                <ActivityIndicator size="small" color="#38bdf8" />
                <Text style={styles.aiLoadingText}>
                  Generando curiosidades en español con IA...
                </Text>
              </View>
            ) : (
              <View style={styles.aiPromptRow}>
                <Text style={styles.aiPromptText}>
                  Descubre curiosidades de producción, impacto en el canon y secretos del rodaje — todo en español.
                </Text>
                <Pressable style={styles.aiActionBtn} onPress={() => loadFacts()}>
                  <Ionicons name="sparkles" size={14} color="#ffffff" />
                  <Text style={styles.aiActionBtnText}>Generar con IA</Text>
                </Pressable>
              </View>
            )}
          </View>

          {/* Bottom spacing */}
          <View style={{ height: 100 }} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: '#0a0a0f',
  },
  container: {
    flex: 1,
    backgroundColor: '#0a0a0f',
  },
  loader: {
    flex: 1,
    backgroundColor: '#0a0a0f',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loaderText: {
    color: '#94a3b8',
    fontSize: 14,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '700',
  },
  backButtonSimple: {
    marginTop: 12,
    backgroundColor: '#7c3aed',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  mainWrapper: {
    width: '100%',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  desktopWrapper: {
    maxWidth: 1140,
    alignSelf: 'center',
    paddingHorizontal: 24,
  },
  breadcrumbBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    flexWrap: 'wrap',
    gap: 12,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    cursor: 'pointer' as any,
  },
  backBtnText: {
    color: '#e2e8f0',
    fontSize: 13,
    fontWeight: '600',
  },
  navControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  adjBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    cursor: 'pointer' as any,
  },
  adjBtnText: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: '#161624',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 20,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 16,
    flexWrap: 'wrap',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  epCodeBadge: {
    backgroundColor: 'rgba(168, 85, 247, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.4)',
  },
  epCodeText: {
    color: '#c084fc',
    fontSize: 11,
    fontWeight: '800',
  },
  seriesName: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: '700',
  },
  airDate: {
    color: '#64748b',
    fontSize: 12,
  },
  episodeTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: -0.3,
  },
  watchedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(168, 85, 247, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.3)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 14,
    cursor: 'pointer' as any,
  },
  watchedBtnActive: {
    backgroundColor: '#16a34a',
    borderColor: '#22c55e',
  },
  watchedBtnText: {
    color: '#c084fc',
    fontSize: 13,
    fontWeight: '700',
  },
  watchedBtnTextActive: {
    color: '#ffffff',
  },
  crossoverBox: {
    marginTop: 16,
  },
  overviewSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  overviewLabel: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  overviewText: {
    color: '#cbd5e1',
    fontSize: 14,
    lineHeight: 22,
  },
  aiCard: {
    backgroundColor: '#101726',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
    marginBottom: 20,
  },
  aiCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.4)',
  },
  aiBadgeText: {
    color: '#38bdf8',
    fontSize: 11,
    fontWeight: '700',
  },
  aiCardTitle: {
    color: '#f8fafc',
    fontSize: 15,
    fontWeight: '800',
  },
  factsContent: {
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  factsText: {
    color: '#e2e8f0',
    fontSize: 13,
    lineHeight: 21,
  },
  aiLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
  },
  aiLoadingText: {
    color: '#94a3b8',
    fontSize: 13,
  },
  aiPromptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  aiPromptText: {
    color: '#94a3b8',
    fontSize: 13,
    flex: 1,
    minWidth: 240,
  },
  aiActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0284c7',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    cursor: 'pointer' as any,
  },
  aiActionBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  regenerateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 10,
    alignSelf: 'flex-end',
    cursor: 'pointer' as any,
    opacity: 0.7,
  },
  regenerateBtnText: {
    color: '#38bdf8',
    fontSize: 11,
    fontWeight: '600',
  },
});
