#!/usr/bin/env ts-node
/**
 * Cronology — Database Seed Script
 * Seeds the Chicago Universe (Fire, P.D., Med, Justice) + SVU crossover data
 * into Neon PostgreSQL via Drizzle ORM
 *
 * Usage: npm run db:seed
 */

import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../db/schema';
import { eq } from 'drizzle-orm';
import {
  CHICAGO_SERIES,
  CROSSOVER_ARCS,
  CROSSOVER_EPISODE_MAP,
  getCrossoverKey,
} from '../constants/chicago';
import {
  getFullSeriesData,
  getPosterUrl,
  getBannerUrl,
  getStillUrl,
  extractTrailerId,
} from '../services/tmdb';

// ─── Setup ─────────────────────────────────────────────────────────────────
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) throw new Error('DATABASE_URL not set in .env');

const TMDB_KEY = process.env.EXPO_PUBLIC_TMDB_API_KEY;
if (!TMDB_KEY) throw new Error('EXPO_PUBLIC_TMDB_API_KEY not set in .env');

const sql = neon(DATABASE_URL);
const db = drizzle(sql, { schema });

// ─── Helpers ───────────────────────────────────────────────────────────────
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const log = (msg: string) => console.log(`[SEED] ${msg}`);
const warn = (msg: string) => console.warn(`[SEED WARN] ${msg}`);

// ─── Main Seed Function ────────────────────────────────────────────────────
async function seed() {
  log('🌱 Starting Cronology seed...');
  log(`🗄️  Database: ${DATABASE_URL?.split('@')[1]?.split('/')[0] ?? 'unknown'}`);

  // First, seed the default user (guest/local user)
  log('👤 Creating default user...');
  const existingUser = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, 'guest@cronology.local'))
    .limit(1);

  let userId: number;
  if (existingUser.length === 0) {
    const [user] = await db
      .insert(schema.users)
      .values({
        email: 'guest@cronology.local',
        displayName: 'Guest',
      })
      .returning();
    userId = user.id;
    log(`✅ Created default user (id: ${userId})`);
  } else {
    userId = existingUser[0].id;
    log(`✅ Default user already exists (id: ${userId})`);
  }

  // Process each Chicago series
  for (const seriesInfo of CHICAGO_SERIES) {
    log(`\n📺 Processing: ${seriesInfo.name} (TMDB: ${seriesInfo.tmdbId})`);

    try {
      // Check if already seeded
      const existing = await db
        .select()
        .from(schema.series)
        .where(eq(schema.series.tmdbId, seriesInfo.tmdbId))
        .limit(1);

      if (existing.length > 0) {
        log(`  ⏭️  Already seeded — skipping`);
        continue;
      }

      // Fetch from TMDB
      log(`  📡 Fetching from TMDB...`);
      const { series: tmdbSeries, seasons: tmdbSeasons } = await getFullSeriesData(
        seriesInfo.tmdbId
      );
      await sleep(300); // Rate limiting

      const trailerId = tmdbSeries.videos?.results
        ? extractTrailerId(tmdbSeries.videos.results)
        : null;

      // Insert series
      const [insertedSeries] = await db
        .insert(schema.series)
        .values({
          tmdbId: tmdbSeries.id,
          name: tmdbSeries.name,
          originalName: tmdbSeries.original_name,
          overview: tmdbSeries.overview,
          posterUrl: getPosterUrl(tmdbSeries.poster_path),
          bannerUrl: getBannerUrl(tmdbSeries.backdrop_path),
          genres: tmdbSeries.genres,
          firstAirDate: tmdbSeries.first_air_date,
          lastAirDate: tmdbSeries.last_air_date,
          status: tmdbSeries.status,
          numberOfSeasons: tmdbSeries.number_of_seasons,
          numberOfEpisodes: tmdbSeries.number_of_episodes,
          youtubeTrailerId: trailerId,
          voteAverage: String(tmdbSeries.vote_average),
          isChicagoUniverse: true,
          sortOrder: seriesInfo.sortOrder,
        })
        .returning();

      log(`  ✅ Series inserted (id: ${insertedSeries.id})`);

      // Process seasons
      let totalEpisodesInserted = 0;
      for (const tmdbSeason of tmdbSeasons) {
        if (tmdbSeason.season_number === 0) continue; // skip specials

        // Insert season
        const [insertedSeason] = await db
          .insert(schema.seasons)
          .values({
            seriesId: insertedSeries.id,
            tmdbId: tmdbSeason.id,
            seasonNumber: tmdbSeason.season_number,
            name: tmdbSeason.name,
            overview: tmdbSeason.overview,
            posterUrl: getPosterUrl(tmdbSeason.poster_path),
            airDate: tmdbSeason.air_date,
            episodeCount: tmdbSeason.episode_count,
          })
          .returning();

        // Process episodes
        const episodes = tmdbSeason.episodes || [];
        const episodeValues = episodes.map((ep) => {
          // Check if this episode is part of a crossover
          const crossoverKey = getCrossoverKey(
            seriesInfo.name,
            ep.season_number,
            ep.episode_number
          );
          const crossoverInfo = CROSSOVER_EPISODE_MAP.get(crossoverKey);

          return {
            seriesId: insertedSeries.id,
            seasonId: insertedSeason.id,
            tmdbId: ep.id,
            seasonNumber: ep.season_number,
            episodeNumber: ep.episode_number,
            name: ep.name,
            overview: ep.overview,
            airDate: ep.air_date,
            runtime: ep.runtime,
            stillUrl: getStillUrl(ep.still_path),
            voteAverage: String(ep.vote_average),
            isCrossover: !!crossoverInfo,
            crossoverName: crossoverInfo?.arcName ?? null,
            crossoverOrder: crossoverInfo?.order ?? null,
            crossoverSeries: crossoverInfo
              ? crossoverInfo.arcEpisodes.map((e) => ({
                  seriesName: e.series,
                  seasonEp: `S${String(e.season).padStart(2, '0')}E${String(e.episode).padStart(2, '0')}`,
                }))
              : [],
          };
        });

        if (episodeValues.length > 0) {
          // Insert in batches of 50 to avoid hitting Neon limits
          for (let i = 0; i < episodeValues.length; i += 50) {
            const batch = episodeValues.slice(i, i + 50);
            await db.insert(schema.episodes).values(batch).onConflictDoNothing();
          }
          totalEpisodesInserted += episodeValues.length;
        }

        log(
          `    📼 Season ${tmdbSeason.season_number}: ${episodes.length} episodes`
        );
        await sleep(200);
      }

      log(
        `  🎬 Total: ${totalEpisodesInserted} episodes inserted for ${seriesInfo.name}`
      );

    } catch (error) {
      warn(`Failed to process ${seriesInfo.name}: ${error}`);
      continue;
    }

    await sleep(500); // Rate limit between series
  }

  // Seed crossover arcs
  log('\n🔗 Seeding crossover arcs...');
  for (const arc of CROSSOVER_ARCS) {
    const existing = await db
      .select()
      .from(schema.crossoverArcs)
      .where(eq(schema.crossoverArcs.name, arc.name))
      .limit(1);

    if (existing.length > 0) {
      log(`  ⏭️  Crossover "${arc.name}" already exists`);
      continue;
    }

    await db.insert(schema.crossoverArcs).values({
      name: arc.name,
      description: arc.description,
      orderedEpisodes: arc.episodes.map((e) => ({
        order: e.order,
        seriesName: e.series,
        seasonNumber: e.season,
        episodeNumber: e.episode,
        title: e.title,
      })),
      includesSVU: arc.includesSVU,
      airDate: arc.airDate,
    });
    log(`  ✅ Crossover arc: "${arc.name}"`);
  }

  log('\n🎉 Seed completed successfully!');
  log(`📊 Summary:`);

  const seriesCount = await db.select().from(schema.series);
  const episodeCount = await db.select().from(schema.episodes);
  const crossoverCount = await db
    .select()
    .from(schema.episodes)
    .where(eq(schema.episodes.isCrossover, true));

  log(`   Series: ${seriesCount.length}`);
  log(`   Episodes: ${episodeCount.length}`);
  log(`   Crossover episodes: ${crossoverCount.length}`);
}

seed().catch((e) => {
  console.error('[SEED ERROR]', e);
  process.exit(1);
});
