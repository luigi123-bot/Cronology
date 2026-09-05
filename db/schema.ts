import {
  pgTable,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  serial,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ─── SERIES ────────────────────────────────────────────────────────────────
export const series = pgTable(
  'series',
  {
    id: serial('id').primaryKey(),
    tmdbId: integer('tmdb_id').notNull().unique(),
    name: text('name').notNull(),
    originalName: text('original_name'),
    overview: text('overview'),
    posterUrl: text('poster_url'),
    bannerUrl: text('banner_url'),
    genres: jsonb('genres').$type<{ id: number; name: string }[]>().default([]),
    firstAirDate: text('first_air_date'),
    lastAirDate: text('last_air_date'),
    status: text('status'), // "Returning Series" | "Ended" | "Canceled"
    numberOfSeasons: integer('number_of_seasons').default(0),
    numberOfEpisodes: integer('number_of_episodes').default(0),
    youtubeTrailerId: text('youtube_trailer_id'),
    voteAverage: text('vote_average'),
    isChicagoUniverse: boolean('is_chicago_universe').default(false),
    sortOrder: integer('sort_order').default(999), // for Chicago Universe ordering
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    tmdbIdIdx: uniqueIndex('series_tmdb_id_idx').on(table.tmdbId),
    nameIdx: index('series_name_idx').on(table.name),
  })
);

// ─── SEASONS ───────────────────────────────────────────────────────────────
export const seasons = pgTable(
  'seasons',
  {
    id: serial('id').primaryKey(),
    seriesId: integer('series_id')
      .notNull()
      .references(() => series.id, { onDelete: 'cascade' }),
    tmdbId: integer('tmdb_id').notNull(),
    seasonNumber: integer('season_number').notNull(),
    name: text('name'),
    overview: text('overview'),
    posterUrl: text('poster_url'),
    airDate: text('air_date'),
    episodeCount: integer('episode_count').default(0),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    seriesSeasonIdx: uniqueIndex('seasons_series_season_idx').on(
      table.seriesId,
      table.seasonNumber
    ),
  })
);

// ─── EPISODES ──────────────────────────────────────────────────────────────
export const episodes = pgTable(
  'episodes',
  {
    id: serial('id').primaryKey(),
    seriesId: integer('series_id')
      .notNull()
      .references(() => series.id, { onDelete: 'cascade' }),
    seasonId: integer('season_id').references(() => seasons.id, {
      onDelete: 'cascade',
    }),
    tmdbId: integer('tmdb_id').notNull(),
    seasonNumber: integer('season_number').notNull(),
    episodeNumber: integer('episode_number').notNull(),
    name: text('name').notNull(),
    overview: text('overview'),
    airDate: text('air_date'),
    runtime: integer('runtime'), // in minutes
    stillUrl: text('still_url'), // episode thumbnail from TMDB
    youtubeClipId: text('youtube_clip_id'), // YouTube trailer/clip ID
    // Crossover fields
    isCrossover: boolean('is_crossover').default(false),
    crossoverName: text('crossover_name'), // e.g. "Infection" crossover
    crossoverOrder: integer('crossover_order'), // position within the crossover arc
    crossoverSeries: jsonb('crossover_series')
      .$type<{ seriesName: string; seasonEp: string }[]>()
      .default([]),
    // DeepSeek AI fields
    deepseekFacts: text('deepseek_facts'), // AI-generated curious facts
    deepseekNarrative: text('deepseek_narrative'), // AI-generated narrative context
    voteAverage: text('vote_average'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    seriesEpIdx: index('episodes_series_idx').on(table.seriesId),
    crossoverIdx: index('episodes_crossover_idx').on(table.isCrossover),
    tmdbEpIdx: uniqueIndex('episodes_tmdb_id_idx').on(table.tmdbId, table.seriesId),
  })
);

// ─── USERS ─────────────────────────────────────────────────────────────────
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash'), // nullable if using Neon Auth
  displayName: text('display_name'),
  avatarUrl: text('avatar_url'),
  neonAuthId: text('neon_auth_id').unique(), // Neon Auth user ID
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ─── USER PROGRESS ─────────────────────────────────────────────────────────
export const userProgress = pgTable(
  'user_progress',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    episodeId: integer('episode_id')
      .notNull()
      .references(() => episodes.id, { onDelete: 'cascade' }),
    watched: boolean('watched').default(false).notNull(),
    watchedAt: timestamp('watched_at'),
    rating: integer('rating'), // 1-5 stars
    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    userEpIdx: uniqueIndex('user_progress_user_ep_idx').on(
      table.userId,
      table.episodeId
    ),
    userIdx: index('user_progress_user_idx').on(table.userId),
  })
);

// ─── CROSSOVER ARCS ────────────────────────────────────────────────────────
export const crossoverArcs = pgTable('crossover_arcs', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(), // e.g. "Infection" or "Life is Short"
  description: text('description'),
  // Ordered list of {seriesName, seasonEp, episodeId}
  orderedEpisodes: jsonb('ordered_episodes')
    .$type<
      {
        order: number;
        seriesName: string;
        seasonNumber: number;
        episodeNumber: number;
        episodeId?: number;
        title: string;
      }[]
    >()
    .default([]),
  includesSVU: boolean('includes_svu').default(false),
  airDate: text('air_date'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ─── RELATIONS ─────────────────────────────────────────────────────────────
export const seriesRelations = relations(series, ({ many }) => ({
  seasons: many(seasons),
  episodes: many(episodes),
}));

export const seasonsRelations = relations(seasons, ({ one, many }) => ({
  series: one(series, { fields: [seasons.seriesId], references: [series.id] }),
  episodes: many(episodes),
}));

export const episodesRelations = relations(episodes, ({ one, many }) => ({
  series: one(series, { fields: [episodes.seriesId], references: [series.id] }),
  season: one(seasons, { fields: [episodes.seasonId], references: [seasons.id] }),
  userProgress: many(userProgress),
}));

export const usersRelations = relations(users, ({ many }) => ({
  progress: many(userProgress),
}));

export const userProgressRelations = relations(userProgress, ({ one }) => ({
  user: one(users, { fields: [userProgress.userId], references: [users.id] }),
  episode: one(episodes, {
    fields: [userProgress.episodeId],
    references: [episodes.id],
  }),
}));

// ─── TYPE EXPORTS ──────────────────────────────────────────────────────────
export type Series = typeof series.$inferSelect;
export type NewSeries = typeof series.$inferInsert;
export type Season = typeof seasons.$inferSelect;
export type NewSeason = typeof seasons.$inferInsert;
export type Episode = typeof episodes.$inferSelect;
export type NewEpisode = typeof episodes.$inferInsert;
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type UserProgress = typeof userProgress.$inferSelect;
export type NewUserProgress = typeof userProgress.$inferInsert;
export type CrossoverArc = typeof crossoverArcs.$inferSelect;
