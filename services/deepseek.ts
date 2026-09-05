// DeepSeek API Service — Narrative AI Analysis
// Docs: https://platform.deepseek.com/api-docs

const DEEPSEEK_BASE_URL = 'https://api.deepseek.com/v1';
const API_KEY =
  process.env.EXPO_PUBLIC_DEEPSEEK_API_KEY ||
  process.env.DEEPSEEK_API_KEY ||
  '';

if (!API_KEY) {
  console.warn('[DeepSeek] API key not set — AI analysis disabled');
}

interface DeepSeekMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface DeepSeekResponse {
  id: string;
  choices: {
    message: { role: string; content: string };
    finish_reason: string;
  }[];
  usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
}

const deepseekChat = async (
  messages: DeepSeekMessage[],
  model = 'deepseek-chat',
  maxTokens = 500
): Promise<string> => {
  if (!API_KEY) throw new Error('DeepSeek API key not configured');

  const response = await fetch(`${DEEPSEEK_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: maxTokens,
      temperature: 0.8,
      stream: false,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`DeepSeek API error: ${response.status} — ${err}`);
  }

  const data = (await response.json()) as DeepSeekResponse;
  return data.choices[0]?.message?.content?.trim() ?? '';
};

// ─── Episode Analysis ──────────────────────────────────────────────────────

/** Generate curious facts about an episode */
export const getEpisodeFacts = async (
  seriesName: string,
  episodeName: string,
  seasonNumber: number,
  episodeNumber: number,
  overview: string
): Promise<string> => {
  try {
    const content = await deepseekChat([
      {
        role: 'system',
        content:
          'You are a TV series expert. Generate 3 short, fascinating behind-the-scenes facts about the given episode. Use bullet points (•). Be concise and engaging. Max 150 words.',
      },
      {
        role: 'user',
        content: `Series: ${seriesName}
Episode: S${String(seasonNumber).padStart(2, '0')}E${String(episodeNumber).padStart(2, '0')} — "${episodeName}"
Overview: ${overview || 'No overview available'}

Generate 3 curious facts about this episode.`,
      },
    ]);
    return content;
  } catch (error) {
    console.warn('[DeepSeek] Failed to get episode facts:', error);
    return '';
  }
};

/** Generate narrative context for a crossover episode */
export const getCrossoverContext = async (
  crossoverName: string,
  episodes: { series: string; title: string; order: number }[]
): Promise<string> => {
  try {
    const epList = episodes
      .map((e) => `${e.order}. [${e.series}] "${e.title}"`)
      .join('\n');

    const content = await deepseekChat([
      {
        role: 'system',
        content:
          'You are a TV series expert specializing in crossover events. Explain the narrative importance of the crossover and why the viewing order matters. Be concise (max 100 words).',
      },
      {
        role: 'user',
        content: `Crossover Event: "${crossoverName}"
Viewing Order:
${epList}

Explain why this crossover matters and why the order is important.`,
      },
    ]);
    return content;
  } catch (error) {
    console.warn('[DeepSeek] Failed to get crossover context:', error);
    return '';
  }
};

/** Generate recommendations based on genres */
export const getAIRecommendation = async (
  genres: string[],
  watchedSeries: string[]
): Promise<string> => {
  try {
    const content = await deepseekChat([
      {
        role: 'system',
        content:
          'You are a TV recommendation expert. Based on the genres and series the user watches, suggest 2-3 series they might enjoy. Be brief and enthusiastic. Max 80 words.',
      },
      {
        role: 'user',
        content: `Genres I enjoy: ${genres.join(', ')}
Series I've watched: ${watchedSeries.join(', ')}

What should I watch next?`,
      },
    ]);
    return content;
  } catch {
    return '';
  }
};
