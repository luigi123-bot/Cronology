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
  maxTokens = 600
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

/** Generate curious facts about an episode — always in Spanish (es-MX) */
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
          'Eres un experto en series de televisión. Genera exactamente 3 curiosidades cortas y fascinantes sobre el episodio indicado, usando datos reales de producción, actuación o datos de detrás de cámaras. ' +
          'IMPORTANTE: Responde SIEMPRE en español latino (es-MX). ' +
          'Usa viñetas (•). Sé conciso y entretenido. Máximo 200 palabras en total.',
      },
      {
        role: 'user',
        content: `Serie: ${seriesName}
Episodio: S${String(seasonNumber).padStart(2, '0')}E${String(episodeNumber).padStart(2, '0')} — "${episodeName}"
Sinopsis: ${overview || 'Sin sinopsis disponible'}

Genera 3 curiosidades sobre este episodio. Responde completamente en español latino.`,
      },
    ]);
    return content;
  } catch (error) {
    console.warn('[DeepSeek] Failed to get episode facts:', error);
    return '';
  }
};

/** Generate narrative context for a crossover episode — always in Spanish (es-MX) */
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
          'Eres un experto en series de televisión, especializado en eventos crossover. ' +
          'Explica la importancia narrativa del crossover y por qué importa el orden de visionado. ' +
          'IMPORTANTE: Responde SIEMPRE en español latino (es-MX). Sé conciso (máximo 120 palabras).',
      },
      {
        role: 'user',
        content: `Evento crossover: "${crossoverName}"
Orden de visualización:
${epList}

Explica por qué este crossover es importante y por qué el orden importa. Responde en español latino.`,
      },
    ]);
    return content;
  } catch (error) {
    console.warn('[DeepSeek] Failed to get crossover context:', error);
    return '';
  }
};

/** Generate recommendations based on genres — always in Spanish (es-MX) */
export const getAIRecommendation = async (
  genres: string[],
  watchedSeries: string[]
): Promise<string> => {
  try {
    const content = await deepseekChat([
      {
        role: 'system',
        content:
          'Eres un experto en recomendaciones de series de televisión. ' +
          'Basándote en los géneros y las series que ha visto el usuario, sugiere 2-3 series que podría disfrutar. ' +
          'IMPORTANTE: Responde SIEMPRE en español latino (es-MX). Sé breve y entusiasta. Máximo 100 palabras.',
      },
      {
        role: 'user',
        content: `Géneros que disfruto: ${genres.join(', ')}
Series que he visto: ${watchedSeries.join(', ')}

¿Qué debería ver a continuación? Responde en español latino.`,
      },
    ]);
    return content;
  } catch {
    return '';
  }
};
