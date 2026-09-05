/**
 * Direct migration script — bypasses drizzle-kit interactive prompt
 * Runs all CREATE TABLE statements directly against Neon via the serverless driver
 */
import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

const migrations = [
  `CREATE TABLE IF NOT EXISTS "crossover_arcs" (
    "id" serial PRIMARY KEY NOT NULL,
    "name" text NOT NULL,
    "description" text,
    "ordered_episodes" jsonb DEFAULT '[]'::jsonb,
    "includes_svu" boolean DEFAULT false,
    "air_date" text,
    "created_at" timestamp DEFAULT now() NOT NULL
  )`,

  `CREATE TABLE IF NOT EXISTS "series" (
    "id" serial PRIMARY KEY NOT NULL,
    "tmdb_id" integer NOT NULL,
    "name" text NOT NULL,
    "original_name" text,
    "overview" text,
    "poster_url" text,
    "banner_url" text,
    "genres" jsonb DEFAULT '[]'::jsonb,
    "first_air_date" text,
    "last_air_date" text,
    "status" text,
    "number_of_seasons" integer DEFAULT 0,
    "number_of_episodes" integer DEFAULT 0,
    "youtube_trailer_id" text,
    "vote_average" text,
    "is_chicago_universe" boolean DEFAULT false,
    "sort_order" integer DEFAULT 999,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL,
    CONSTRAINT "series_tmdb_id_unique" UNIQUE("tmdb_id")
  )`,

  `CREATE TABLE IF NOT EXISTS "seasons" (
    "id" serial PRIMARY KEY NOT NULL,
    "series_id" integer NOT NULL,
    "tmdb_id" integer NOT NULL,
    "season_number" integer NOT NULL,
    "name" text,
    "overview" text,
    "poster_url" text,
    "air_date" text,
    "episode_count" integer DEFAULT 0,
    "created_at" timestamp DEFAULT now() NOT NULL
  )`,

  `CREATE TABLE IF NOT EXISTS "episodes" (
    "id" serial PRIMARY KEY NOT NULL,
    "series_id" integer NOT NULL,
    "season_id" integer,
    "tmdb_id" integer NOT NULL,
    "season_number" integer NOT NULL,
    "episode_number" integer NOT NULL,
    "name" text NOT NULL,
    "overview" text,
    "air_date" text,
    "runtime" integer,
    "still_url" text,
    "youtube_clip_id" text,
    "is_crossover" boolean DEFAULT false,
    "crossover_name" text,
    "crossover_order" integer,
    "crossover_series" jsonb DEFAULT '[]'::jsonb,
    "deepseek_facts" text,
    "deepseek_narrative" text,
    "vote_average" text,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
  )`,

  `CREATE TABLE IF NOT EXISTS "users" (
    "id" serial PRIMARY KEY NOT NULL,
    "email" text NOT NULL,
    "password_hash" text,
    "display_name" text,
    "avatar_url" text,
    "neon_auth_id" text,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL,
    CONSTRAINT "users_email_unique" UNIQUE("email"),
    CONSTRAINT "users_neon_auth_id_unique" UNIQUE("neon_auth_id")
  )`,

  `CREATE TABLE IF NOT EXISTS "user_progress" (
    "id" serial PRIMARY KEY NOT NULL,
    "user_id" integer NOT NULL,
    "episode_id" integer NOT NULL,
    "watched" boolean DEFAULT false NOT NULL,
    "watched_at" timestamp,
    "rating" integer,
    "notes" text,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
  )`,

  // Foreign keys
  `DO $$ BEGIN
    ALTER TABLE "seasons" ADD CONSTRAINT "seasons_series_id_series_id_fk"
      FOREIGN KEY ("series_id") REFERENCES "series"("id") ON DELETE cascade;
  EXCEPTION WHEN duplicate_object THEN null; END $$`,

  `DO $$ BEGIN
    ALTER TABLE "episodes" ADD CONSTRAINT "episodes_series_id_series_id_fk"
      FOREIGN KEY ("series_id") REFERENCES "series"("id") ON DELETE cascade;
  EXCEPTION WHEN duplicate_object THEN null; END $$`,

  `DO $$ BEGIN
    ALTER TABLE "episodes" ADD CONSTRAINT "episodes_season_id_seasons_id_fk"
      FOREIGN KEY ("season_id") REFERENCES "seasons"("id") ON DELETE cascade;
  EXCEPTION WHEN duplicate_object THEN null; END $$`,

  `DO $$ BEGIN
    ALTER TABLE "user_progress" ADD CONSTRAINT "user_progress_user_id_users_id_fk"
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade;
  EXCEPTION WHEN duplicate_object THEN null; END $$`,

  `DO $$ BEGIN
    ALTER TABLE "user_progress" ADD CONSTRAINT "user_progress_episode_id_episodes_id_fk"
      FOREIGN KEY ("episode_id") REFERENCES "episodes"("id") ON DELETE cascade;
  EXCEPTION WHEN duplicate_object THEN null; END $$`,

  // Indexes
  `CREATE INDEX IF NOT EXISTS "episodes_series_idx" ON "episodes" USING btree ("series_id")`,
  `CREATE INDEX IF NOT EXISTS "episodes_crossover_idx" ON "episodes" USING btree ("is_crossover")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "episodes_tmdb_id_idx" ON "episodes" USING btree ("tmdb_id","series_id")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "seasons_series_season_idx" ON "seasons" USING btree ("series_id","season_number")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "series_tmdb_id_idx" ON "series" USING btree ("tmdb_id")`,
  `CREATE INDEX IF NOT EXISTS "series_name_idx" ON "series" USING btree ("name")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "user_progress_user_ep_idx" ON "user_progress" USING btree ("user_id","episode_id")`,
  `CREATE INDEX IF NOT EXISTS "user_progress_user_idx" ON "user_progress" USING btree ("user_id")`,
];

async function migrate() {
  console.log('🔧 Running migrations against Neon...\n');
  let success = 0;
  let failed = 0;

  for (const statement of migrations) {
    const preview = statement.trim().split('\n')[0].slice(0, 60);
    try {
      await sql(statement);
      console.log(`  ✅ ${preview}...`);
      success++;
    } catch (err: any) {
      // Ignore "already exists" errors — idempotent
      if (err?.message?.includes('already exists')) {
        console.log(`  ⏭️  ${preview} (already exists)`);
        success++;
      } else {
        console.error(`  ❌ ${preview}`);
        console.error(`     ${err?.message}`);
        failed++;
      }
    }
  }

  console.log(`\n📊 Migration complete: ${success} succeeded, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

migrate().catch((e) => {
  console.error('Migration error:', e);
  process.exit(1);
});
