/**
 * seed.js — CommonJS seed script for Node 24 compatibility
 * Imports Chicago Universe series from TMDB into Neon PostgreSQL
 * Usage: node scripts/seed.js
 */
require('dotenv/config');
const { neon } = require('@neondatabase/serverless');

const DATABASE_URL = process.env.DATABASE_URL;
const TMDB_BEARER = process.env.EXPO_PUBLIC_TMDB_BEARER_TOKEN;
const TMDB_KEY = process.env.EXPO_PUBLIC_TMDB_API_KEY;

if (!DATABASE_URL) { console.error('❌ DATABASE_URL not set'); process.exit(1); }
if (!TMDB_BEARER && !TMDB_KEY) { console.error('❌ TMDB API credentials not set'); process.exit(1); }

const sql = neon(DATABASE_URL);
const TMDB_BASE = 'https://api.themoviedb.org/3';
const IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';
const BANNER_BASE = 'https://image.tmdb.org/t/p/w1280';
const STILL_BASE = 'https://image.tmdb.org/t/p/w300';

// ─── Chicago Universe config ──────────────────────────────────────────────
const CHICAGO_SERIES = [
  { name: 'Chicago Fire',      tmdbId: 42907, sortOrder: 1, isChicago: true },
  { name: "Chicago P.D.",      tmdbId: 58841, sortOrder: 2, isChicago: true },
  { name: 'Chicago Med',       tmdbId: 62650, sortOrder: 3, isChicago: true },
  { name: 'Chicago Justice',   tmdbId: 70160, sortOrder: 4, isChicago: true },
  { name: 'Law & Order: SVU',  tmdbId: 2734,  sortOrder: 5, isChicago: false },
  { name: 'Grimm',             tmdbId: 39351, sortOrder: 6, isChicago: false },
  { name: 'Gravity Falls',     tmdbId: 40075, sortOrder: 7, isChicago: false },
];

// Crossover episode lookup: "SeriesName-SxEy" → arc info
const CROSSOVER_MAP = {};
const CROSSOVER_ARCS = [
  {
    name: '"Three Alarm Fire" — Chicago P.D. Backdoor Pilot',
    description: 'Chicago P.D. was introduced via a Chicago Fire backdoor pilot episode.',
    episodes: [
      { series: 'Chicago Fire', s: 1, e: 18, title: 'Fireworks' },
      { series: "Chicago P.D.", s: 1, e: 1,  title: 'Pilot' },
    ],
    includesSVU: false, airDate: '2014-01-08',
  },
  {
    name: '"Infection" — Three-Way Crossover',
    description: 'A deadly infection brings together all three One Chicago series.',
    episodes: [
      { series: 'Chicago Med',  s: 1, e: 1, title: 'Pilot' },
      { series: 'Chicago Fire', s: 4, e: 1, title: 'The Last One for Mom' },
      { series: "Chicago P.D.", s: 3, e: 1, title: 'Life Is Fluid' },
    ],
    includesSVU: false, airDate: '2015-11-03',
  },
  {
    name: '"For Chicago" — Four-Way Crossover',
    description: 'The first-ever four-show crossover including Chicago Justice.',
    episodes: [
      { series: 'Chicago Fire',    s: 5, e: 10, title: 'The People We Meet' },
      { series: "Chicago P.D.",    s: 4, e: 10, title: "Don't Read the News" },
      { series: 'Chicago Med',     s: 2, e: 10, title: 'Heart Matters' },
      { series: 'Chicago Justice', s: 1, e: 1,  title: 'Pilot' },
    ],
    includesSVU: false, airDate: '2017-01-04',
  },
  {
    name: '"One Chicago One Night" — Season 6/3/5 Premiere',
    description: 'A night of chaos connects all three active One Chicago series.',
    episodes: [
      { series: 'Chicago Fire', s: 6, e: 1, title: "It Wasn't Enough" },
      { series: 'Chicago Med',  s: 3, e: 1, title: 'Speak Your Truth' },
      { series: "Chicago P.D.", s: 5, e: 1, title: 'Reform' },
    ],
    includesSVU: false, airDate: '2017-09-27',
  },
  {
    name: '"P.D./SVU" — Gregory Yates Crossover',
    description: 'Chicago P.D. and SVU join forces in a cross-jurisdiction investigation.',
    episodes: [
      { series: "Chicago P.D.",              s: 3, e: 20, title: 'The Song of Gregory Williams Yates' },
      { series: 'Law & Order: SVU', s: 17, e: 19, title: 'Intersecting Lives' },
    ],
    includesSVU: true, airDate: '2016-04-27',
  },
  {
    name: '"P.D./SVU" — Yates Part 2',
    description: 'The conclusion of the Gregory Yates arc.',
    episodes: [
      { series: 'Law & Order: SVU', s: 18, e: 2, title: 'Making a Rapist' },
      { series: "Chicago P.D.",              s: 4, e: 3, title: "So What's Your Story?" },
    ],
    includesSVU: true, airDate: '2016-10-05',
  },
  {
    name: '"One Chicago" — Season 8/5/7 Premiere',
    description: 'Season 8 premiere crossover event spanning all active series.',
    episodes: [
      { series: 'Chicago Fire', s: 8, e: 1, title: 'Sacred Hearts Club' },
      { series: 'Chicago Med',  s: 5, e: 1, title: 'Never Going Back to Normal' },
      { series: "Chicago P.D.", s: 7, e: 1, title: 'Chicago and the Land of Misfit Toys' },
    ],
    includesSVU: false, airDate: '2019-09-25',
  },
  {
    name: '"One Chicago" — Season 9/6/8 Premiere',
    description: 'Three-night crossover event for Season 9.',
    episodes: [
      { series: 'Chicago Fire', s: 9, e: 1, title: 'Rattle Second City' },
      { series: 'Chicago Med',  s: 6, e: 1, title: 'When Did We Begin to Change' },
      { series: "Chicago P.D.", s: 8, e: 1, title: 'Fighting Ghosts' },
    ],
    includesSVU: false, airDate: '2020-11-11',
  },
  {
    name: '"One Chicago" — Season 10/7/9 Premiere',
    description: 'Milestone Season 10 premiere crossover.',
    episodes: [
      { series: 'Chicago Fire', s: 10, e: 1, title: 'Back with a Bang' },
      { series: 'Chicago Med',  s:  7, e: 1, title: "You Can't Always Trust Your Eyes" },
      { series: "Chicago P.D.", s:  9, e: 1, title: 'Closure' },
    ],
    includesSVU: false, airDate: '2021-09-22',
  },
];

// Build lookup map
CROSSOVER_ARCS.forEach((arc) => {
  arc.episodes.forEach((ep, idx) => {
    const key = `${ep.series}-S${ep.s}E${ep.e}`;
    CROSSOVER_MAP[key] = {
      arcName: arc.name,
      order: idx + 1,
      arcEpisodes: arc.episodes.map((e, i) => ({
        seriesName: e.series,
        seasonEp: `S${String(e.s).padStart(2,'0')}E${String(e.e).padStart(2,'0')}`,
        order: i + 1,
      })),
    };
  });
});

// ─── TMDB helpers ─────────────────────────────────────────────────────────
async function tmdbGet(path, params = {}) {
  const url = new URL(`${TMDB_BASE}${path}`);
  url.searchParams.set('language', 'es-MX');
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)));

  const headers = { 'Content-Type': 'application/json' };
  if (TMDB_BEARER) {
    headers['Authorization'] = `Bearer ${TMDB_BEARER}`;
  } else {
    url.searchParams.set('api_key', TMDB_KEY);
  }

  const res = await fetch(url.toString(), { headers });
  if (!res.ok) throw new Error(`TMDB ${res.status}: ${path}`);
  return res.json();
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const posterUrl  = (p) => p ? `${IMAGE_BASE}${p}` : null;
const bannerUrl  = (p) => p ? `${BANNER_BASE}${p}` : null;
const stillUrl   = (p) => p ? `${STILL_BASE}${p}` : null;

function extractTrailer(videos) {
  if (!videos || !videos.length) return null;
  const ytVideos = videos.filter((v) => v.site === 'YouTube');
  return (
    ytVideos.find((v) => v.type === 'Trailer' && v.official)?.key ||
    ytVideos.find((v) => v.type === 'Trailer')?.key ||
    ytVideos.find((v) => v.type === 'Teaser')?.key ||
    null
  );
}

// ─── Main seed ────────────────────────────────────────────────────────────
async function seed() {
  console.log('🌱 Starting Cronology seed...\n');

  // 1. Create default user
  const existingUsers = await sql`SELECT id FROM users WHERE email = 'guest@cronology.local' LIMIT 1`;
  let userId;
  if (existingUsers.length === 0) {
    const [u] = await sql`
      INSERT INTO users (email, display_name) VALUES ('guest@cronology.local', 'Guest') RETURNING id
    `;
    userId = u.id;
    console.log(`👤 Created default user (id: ${userId})`);
  } else {
    userId = existingUsers[0].id;
    console.log(`👤 Default user exists (id: ${userId})`);
  }

  // 2. Process each series
  for (const info of CHICAGO_SERIES) {
    console.log(`\n📺 ${info.name} (TMDB: ${info.tmdbId})`);

    // Check if already seeded
    const existing = await sql`SELECT id FROM series WHERE tmdb_id = ${info.tmdbId} LIMIT 1`;
    if (existing.length > 0) {
      console.log(`  ⏭️  Already in database — skipping`);
      continue;
    }

    // Fetch series details + videos
    console.log(`  📡 Fetching from TMDB...`);
    let tmdbSeries;
    try {
      tmdbSeries = await tmdbGet(`/tv/${info.tmdbId}`, { append_to_response: 'videos' });
    } catch (e) {
      console.warn(`  ❌ Failed to fetch: ${e.message}`);
      continue;
    }
    await sleep(300);

    const trailerId = extractTrailer(tmdbSeries.videos?.results);

    // Insert series
    const [insertedSeries] = await sql`
      INSERT INTO series (
        tmdb_id, name, original_name, overview,
        poster_url, banner_url, genres,
        first_air_date, last_air_date, status,
        number_of_seasons, number_of_episodes,
        youtube_trailer_id, vote_average,
        is_chicago_universe, sort_order
      ) VALUES (
        ${tmdbSeries.id}, ${tmdbSeries.name}, ${tmdbSeries.original_name}, ${tmdbSeries.overview},
        ${posterUrl(tmdbSeries.poster_path)}, ${bannerUrl(tmdbSeries.backdrop_path)},
        ${JSON.stringify(tmdbSeries.genres || [])},
        ${tmdbSeries.first_air_date}, ${tmdbSeries.last_air_date}, ${tmdbSeries.status},
        ${tmdbSeries.number_of_seasons}, ${tmdbSeries.number_of_episodes},
        ${trailerId}, ${String(tmdbSeries.vote_average || 0)},
        ${info.isChicago}, ${info.sortOrder}
      ) RETURNING id
    `;
    console.log(`  ✅ Series inserted (id: ${insertedSeries.id})`);

    // Process seasons
    const totalSeasons = tmdbSeries.number_of_seasons || 0;
    let totalEpisodes = 0;

    for (let seasonNum = 1; seasonNum <= totalSeasons; seasonNum++) {
      let tmdbSeason;
      try {
        tmdbSeason = await tmdbGet(`/tv/${info.tmdbId}/season/${seasonNum}`);
        await sleep(200);
      } catch (e) {
        console.warn(`    ⚠️  Season ${seasonNum} fetch failed: ${e.message}`);
        continue;
      }

      // Insert season
      const [insertedSeason] = await sql`
        INSERT INTO seasons (
          series_id, tmdb_id, season_number, name, overview,
          poster_url, air_date, episode_count
        ) VALUES (
          ${insertedSeries.id}, ${tmdbSeason.id}, ${tmdbSeason.season_number},
          ${tmdbSeason.name}, ${tmdbSeason.overview},
          ${posterUrl(tmdbSeason.poster_path)}, ${tmdbSeason.air_date},
          ${(tmdbSeason.episodes || []).length}
        ) ON CONFLICT DO NOTHING RETURNING id
      `;

      if (!insertedSeason) continue;

      const episodes = tmdbSeason.episodes || [];
      // Insert episodes in batches
      for (const ep of episodes) {
        const crossoverKey = `${info.name}-S${ep.season_number}E${ep.episode_number}`;
        const crossover = CROSSOVER_MAP[crossoverKey];

        try {
          await sql`
            INSERT INTO episodes (
              series_id, season_id, tmdb_id,
              season_number, episode_number, name, overview,
              air_date, runtime, still_url, vote_average,
              is_crossover, crossover_name, crossover_order, crossover_series
            ) VALUES (
              ${insertedSeries.id}, ${insertedSeason.id}, ${ep.id},
              ${ep.season_number}, ${ep.episode_number}, ${ep.name}, ${ep.overview || ''},
              ${ep.air_date || null}, ${ep.runtime || null},
              ${stillUrl(ep.still_path)}, ${String(ep.vote_average || 0)},
              ${!!crossover}, ${crossover?.arcName || null},
              ${crossover?.order || null}, ${JSON.stringify(crossover?.arcEpisodes || [])}
            ) ON CONFLICT DO NOTHING
          `;
          totalEpisodes++;
        } catch (e) {
          // Skip duplicates silently
        }
      }

      process.stdout.write(`    📼 S${String(seasonNum).padStart(2,'0')}: ${episodes.length} eps | `);
    }
    console.log(`\n  🎬 Total: ${totalEpisodes} episodes`);
  }

  // 3. Seed crossover arcs
  console.log('\n🔗 Seeding crossover arcs...');
  for (const arc of CROSSOVER_ARCS) {
    const existing = await sql`SELECT id FROM crossover_arcs WHERE name = ${arc.name} LIMIT 1`;
    if (existing.length > 0) {
      console.log(`  ⏭️  "${arc.name}" exists`);
      continue;
    }
    await sql`
      INSERT INTO crossover_arcs (name, description, ordered_episodes, includes_svu, air_date)
      VALUES (
        ${arc.name}, ${arc.description},
        ${JSON.stringify(arc.episodes.map((e, i) => ({
          order: i + 1,
          seriesName: e.series,
          seasonNumber: e.s,
          episodeNumber: e.e,
          title: e.title,
        })))},
        ${arc.includesSVU}, ${arc.airDate}
      )
    `;
    console.log(`  ✅ "${arc.name}"`);
  }

  // 4. Summary
  const [{ count: sc }] = await sql`SELECT COUNT(*) as count FROM series`;
  const [{ count: ec }] = await sql`SELECT COUNT(*) as count FROM episodes`;
  const [{ count: cc }] = await sql`SELECT COUNT(*) as count FROM crossover_arcs`;
  const [{ count: xc }] = await sql`SELECT COUNT(*) as count FROM episodes WHERE is_crossover = true`;

  console.log('\n🎉 Seed complete!');
  console.log(`📊 Series: ${sc} | Episodes: ${ec} | Crossovers: ${xc} | Arcs: ${cc}`);
}

seed().catch((e) => {
  console.error('\n❌ Seed failed:', e.message);
  process.exit(1);
});
