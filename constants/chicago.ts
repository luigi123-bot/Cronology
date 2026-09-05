// Chicago Universe — Official Chronological Watch Order
// Includes crossover episodes with Law & Order: SVU

export const CHICAGO_SERIES = [
  { name: 'Chicago Fire', tmdbId: 42907, sortOrder: 1 },
  { name: "Chicago P.D.", tmdbId: 58841, sortOrder: 2 },
  { name: 'Chicago Med', tmdbId: 62650, sortOrder: 3 },
  { name: 'Chicago Justice', tmdbId: 70160, sortOrder: 4 },
  // SVU for crossover reference only
  { name: 'Law & Order: Special Victims Unit', tmdbId: 2734, sortOrder: 5 },
] as const;

// Major Crossover Arcs — Official One Chicago crossovers
// Each arc defines the watch order of episodes across series
export const CROSSOVER_ARCS = [
  {
    name: '"Three Alarm Fire" — Season 1 Backdoor Pilot',
    description:
      'Chicago P.D. was introduced via a Chicago Fire backdoor pilot episode.',
    episodes: [
      { order: 1, series: 'Chicago Fire', season: 1, episode: 18, title: 'Fireworks' },
      { order: 2, series: "Chicago P.D.", season: 1, episode: 1, title: 'Pilot' },
    ],
    includesSVU: false,
    airDate: '2014-01-08',
  },
  {
    name: '"Chicago Fire/P.D." — Gang Story Crossover',
    description:
      'A major gang investigation forces Chicago Fire and Chicago P.D. to work together.',
    episodes: [
      { order: 1, series: 'Chicago Fire', season: 3, episode: 1, title: 'Always' },
      { order: 2, series: "Chicago P.D.", season: 2, episode: 1, title: 'Call It Macaroni' },
    ],
    includesSVU: false,
    airDate: '2014-09-23',
  },
  {
    name: '"Infection" — Three-Way Crossover',
    description:
      'A deadly infection outbreak brings together all three One Chicago series for a massive crossover.',
    episodes: [
      { order: 1, series: 'Chicago Med', season: 1, episode: 1, title: 'Pilot' },
      { order: 2, series: 'Chicago Fire', season: 4, episode: 1, title: 'The Last One for Mom' },
      { order: 3, series: "Chicago P.D.", season: 3, episode: 1, title: 'Life Is Fluid' },
    ],
    includesSVU: false,
    airDate: '2015-11-03',
  },
  {
    name: '"For Chicago" — Four-Way Crossover',
    description:
      'The first-ever four-show crossover event including Chicago Justice.',
    episodes: [
      { order: 1, series: 'Chicago Fire', season: 5, episode: 10, title: 'The People We Meet' },
      { order: 2, series: "Chicago P.D.", season: 4, episode: 10, title: 'Don\'t Read the News' },
      { order: 3, series: 'Chicago Med', season: 2, episode: 10, title: 'Heart Matters' },
      { order: 4, series: 'Chicago Justice', season: 1, episode: 1, title: 'Pilot' },
    ],
    includesSVU: false,
    airDate: '2017-01-04',
  },
  {
    name: '"One Chicago One Night" — Three-Show Crossover',
    description:
      'A night of chaos connects all three active One Chicago series.',
    episodes: [
      { order: 1, series: 'Chicago Fire', season: 6, episode: 1, title: 'It Wasn\'t Enough' },
      { order: 2, series: 'Chicago Med', season: 3, episode: 1, title: 'Speak Your Truth' },
      { order: 3, series: "Chicago P.D.", season: 5, episode: 1, title: 'Reform' },
    ],
    includesSVU: false,
    airDate: '2017-09-27',
  },
  {
    name: '"P.D./SVU" — Chicago Crossover',
    description:
      'Chicago P.D. Detective Voight teams up with the SVU unit in a joint investigation crossing jurisdictions.',
    episodes: [
      { order: 1, series: "Chicago P.D.", season: 3, episode: 20, title: 'The Song of Gregory Williams Yates' },
      { order: 2, series: 'Law & Order: Special Victims Unit', season: 17, episode: 19, title: 'Intersecting Lives' },
    ],
    includesSVU: true,
    airDate: '2016-04-27',
  },
  {
    name: '"P.D./SVU" — Yates Crossover Part 2',
    description:
      'The conclusion of the Gregory Yates arc with another Chicago P.D. and SVU crossover.',
    episodes: [
      { order: 1, series: 'Law & Order: Special Victims Unit', season: 18, episode: 2, title: 'Making a Rapist' },
      { order: 2, series: "Chicago P.D.", season: 4, episode: 3, title: 'So What\'s Your Story?' },
    ],
    includesSVU: true,
    airDate: '2016-10-05',
  },
  {
    name: '"One Chicago" — Season 8 Crossover',
    description: 'Season 8 premiere crossover event spanning all active series.',
    episodes: [
      { order: 1, series: 'Chicago Fire', season: 8, episode: 1, title: 'Sacred Hearts Club' },
      { order: 2, series: 'Chicago Med', season: 5, episode: 1, title: 'Never Going Back to Normal' },
      { order: 3, series: "Chicago P.D.", season: 7, episode: 1, title: 'Chicago and the Land of Misfit Toys' },
    ],
    includesSVU: false,
    airDate: '2019-09-25',
  },
  {
    name: '"One Chicago" — Season 9 Crossover',
    description: 'Three-night crossover event for Season 9.',
    episodes: [
      { order: 1, series: 'Chicago Fire', season: 9, episode: 1, title: 'Rattle Second City' },
      { order: 2, series: 'Chicago Med', season: 6, episode: 1, title: 'When Did We Begin to Change' },
      { order: 3, series: "Chicago P.D.", season: 8, episode: 1, title: 'Fighting Ghosts' },
    ],
    includesSVU: false,
    airDate: '2020-11-11',
  },
  {
    name: '"One Chicago" — Season 10 Three-Night Crossover',
    description: 'Milestone Season 10 premiere crossover.',
    episodes: [
      { order: 1, series: 'Chicago Fire', season: 10, episode: 1, title: 'Back with a Bang' },
      { order: 2, series: 'Chicago Med', season: 7, episode: 1, title: 'You Can\'t Always Trust Your Eyes' },
      { order: 3, series: "Chicago P.D.", season: 9, episode: 1, title: 'Closure' },
    ],
    includesSVU: false,
    airDate: '2021-09-22',
  },
] as const;

// Episodes that are part of a crossover arc — used to flag isCrossover in the DB
export type CrossoverEpisodeKey = `${string}-S${number}E${number}`;

export const getCrossoverKey = (
  seriesName: string,
  season: number,
  episode: number
): CrossoverEpisodeKey => `${seriesName}-S${season}E${episode}`;

// Build lookup map for quick crossover detection
export const CROSSOVER_EPISODE_MAP = new Map<
  CrossoverEpisodeKey,
  { arcName: string; order: number; arcEpisodes: typeof CROSSOVER_ARCS[number]['episodes'] }
>();

CROSSOVER_ARCS.forEach((arc) => {
  arc.episodes.forEach((ep) => {
    const key = getCrossoverKey(ep.series, ep.season, ep.episode);
    CROSSOVER_EPISODE_MAP.set(key, {
      arcName: arc.name,
      order: ep.order,
      arcEpisodes: arc.episodes,
    });
  });
});
