// YouTube Data API v3 Service
// Docs: https://developers.google.com/youtube/v3

const YOUTUBE_BASE_URL = 'https://www.googleapis.com/youtube/v3';
const API_KEY = process.env.EXPO_PUBLIC_YOUTUBE_API_KEY || '';

if (!API_KEY) {
  console.warn('[YouTube] EXPO_PUBLIC_YOUTUBE_API_KEY is not set — trailer search disabled');
}

export interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  channelTitle: string;
  publishedAt: string;
  viewCount: string;
}

const ytFetch = async <T>(endpoint: string, params: Record<string, string>): Promise<T> => {
  const url = new URL(`${YOUTUBE_BASE_URL}${endpoint}`);
  url.searchParams.set('key', API_KEY);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const response = await fetch(url.toString());
  if (!response.ok) {
    const err = await response.text();
    throw new Error(`YouTube API error: ${response.status} — ${err}`);
  }
  return response.json() as Promise<T>;
};

/** Search for a series trailer on YouTube */
export const searchTrailer = async (seriesName: string): Promise<YouTubeVideo | null> => {
  if (!API_KEY) return null;

  try {
    const data = await ytFetch<{
      items: {
        id: { videoId: string };
        snippet: {
          title: string;
          description: string;
          thumbnails: { medium: { url: string } };
          channelTitle: string;
          publishedAt: string;
        };
      }[];
    }>('/search', {
      part: 'snippet',
      q: `${seriesName} trailer español latino oficial`,
      type: 'video',
      maxResults: '5',
      relevanceLanguage: 'es',
      videoCategoryId: '2', // Film & Animation
      order: 'relevance',
    });

    const item = data.items[0];
    if (!item) return null;

    // Get video statistics
    const stats = await getVideoStats(item.id.videoId);

    return {
      id: item.id.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnailUrl: item.snippet.thumbnails.medium.url,
      channelTitle: item.snippet.channelTitle,
      publishedAt: item.snippet.publishedAt,
      viewCount: stats?.viewCount || '0',
    };
  } catch (error) {
    console.warn(`[YouTube] Failed to search trailer for "${seriesName}":`, error);
    return null;
  }
};

/** Search for an episode trailer / promo in Spanish Latino */
export const searchEpisodeTrailerLatino = async (
  seriesName: string,
  seasonNumber: number,
  episodeNumber: number,
  episodeName?: string
): Promise<YouTubeVideo | null> => {
  if (!API_KEY) return null;

  try {
    const queries = [
      `${seriesName} temporada ${seasonNumber} capitulo ${episodeNumber} trailer latino`,
      `${seriesName} S${String(seasonNumber).padStart(2, '0')}E${String(episodeNumber).padStart(2, '0')} promo trailer español`,
      `${seriesName} ${episodeName ?? ''} promo latino`,
    ];

    for (const q of queries) {
      const data = await ytFetch<{
        items: {
          id: { videoId: string };
          snippet: {
            title: string;
            description: string;
            thumbnails: { medium: { url: string } };
            channelTitle: string;
            publishedAt: string;
          };
        }[];
      }>('/search', {
        part: 'snippet',
        q,
        type: 'video',
        maxResults: '3',
        videoCategoryId: '2',
        order: 'relevance',
      });

      const item = data.items[0];
      if (item) {
        return {
          id: item.id.videoId,
          title: item.snippet.title,
          description: item.snippet.description,
          thumbnailUrl: item.snippet.thumbnails.medium.url,
          channelTitle: item.snippet.channelTitle,
          publishedAt: item.snippet.publishedAt,
          viewCount: '0',
        };
      }
    }
    return null;
  } catch (error) {
    console.warn(`[YouTube] Failed to search episode trailer:`, error);
    return null;
  }
};

/** Get video statistics */
export const getVideoStats = async (
  videoId: string
): Promise<{ viewCount: string; likeCount: string } | null> => {
  if (!API_KEY) return null;

  try {
    const data = await ytFetch<{
      items: { statistics: { viewCount: string; likeCount: string } }[];
    }>('/videos', {
      part: 'statistics',
      id: videoId,
    });
    return data.items[0]?.statistics ?? null;
  } catch {
    return null;
  }
};

/** Build YouTube watch URL */
export const getYouTubeUrl = (videoId: string): string =>
  `https://www.youtube.com/watch?v=${videoId}`;

/** Build YouTube deep link (opens YouTube app) */
export const getYouTubeDeepLink = (videoId: string): string =>
  `youtube://watch?v=${videoId}`;

/** Build YouTube thumbnail URL */
export const getYouTubeThumbnail = (
  videoId: string,
  quality: 'default' | 'hq' | 'maxres' = 'hq'
): string => {
  const qualityMap = {
    default: 'default',
    hq: 'hqdefault',
    maxres: 'maxresdefault',
  };
  return `https://img.youtube.com/vi/${videoId}/${qualityMap[quality]}.jpg`;
};
