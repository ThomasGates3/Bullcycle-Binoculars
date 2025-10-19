import { APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda';
import { loadConfig } from './utils/config';
import { logger } from './utils/logger';
import { fetchCryptoNews, normalizeArticle } from './services/newsdata';
import { analyzeSentiment } from './services/sentiment';
import { getCachedArticles, cacheArticles, generateQueryKey } from './services/cache';
import { deduplicateArticles } from './services/deduplicator';

const QUERY = 'cryptocurrency AND (Regulation OR Investigation OR Investment OR Institutional OR Hack OR Exploit OR Vulnerability OR AI OR Partnership OR Crash OR Surge OR "All-Time High" OR Record OR Dip)';
const LANGUAGE = 'en';
const CATEGORY = 'business';

interface EnrichedArticle {
  title: string;
  url: string;
  source: string;
  pubDate: string;
  tickers: string[];
  snippet: string;
  sentiment: 'Positive' | 'Negative' | 'Neutral';
  score: number;
  emoji: string;
}

interface ApiResponse {
  query: string;
  fetchedAt: string;
  cacheUntil: string;
  articles: EnrichedArticle[];
}

export const handler: APIGatewayProxyHandler = async (event): Promise<APIGatewayProxyResult> => {
  try {
    const config = loadConfig();
    logger.setContext({ requestId: event.requestContext?.requestId || 'unknown' });

    // Parse sentiment filter
    const sentimentParam = (event.queryStringParameters?.sentiment || 'all').toLowerCase();
    const validSentiments = ['positive', 'negative', 'neutral', 'all'];
    if (!validSentiments.includes(sentimentParam)) {
      return errorResponse(400, 'Invalid sentiment parameter. Must be: positive, negative, neutral, or all');
    }

    logger.info('Crypto news request received', { sentiment: sentimentParam });

    // Check cache
    const queryKey = generateQueryKey(QUERY, LANGUAGE, CATEGORY);
    let cachedEntry = await getCachedArticles(config.ddbTable, queryKey, config.awsRegion);

    if (!cachedEntry) {
      // Fetch fresh articles
      const rawArticles = await fetchCryptoNews(config.newsDataApiKey, config.maxRetries, config.initialBackoffMs);
      const normalized = rawArticles.map(normalizeArticle);
      const deduplicated = deduplicateArticles(normalized);

      // Enrich with sentiment
      const enriched = await Promise.all(
        deduplicated.map(async article => ({
          ...article,
          ...(await analyzeSentiment(
            article.title,
            article.description || '',
            config.bedrockModelId,
            config.sagemakerEndpoint,
            config.awsRegion
          )),
        }))
      );

      // Cache results
      const cachedArticles = enriched.map(a => ({
        title: a.title,
        url: a.url,
        source_name: a.source_name || 'Unknown',
        pubDate: a.pubDate,
        tickers: a.tickers || [],
        snippet: a.description || '',
        sentiment: a.sentiment,
        score: a.score,
        emoji: a.emoji,
        cachedAt: Math.floor(Date.now() / 1000),
      }));

      await cacheArticles(config.ddbTable, queryKey, cachedArticles, config.cacheTtl, config.awsRegion);
      cachedEntry = {
        queryKey,
        articles: cachedArticles,
        cachedAt: Math.floor(Date.now() / 1000),
        ttl: Math.floor(Date.now() / 1000) + config.cacheTtl,
      };
    }

    // Filter by sentiment
    const filtered = filterBySentiment(cachedEntry.articles, sentimentParam);

    const now = new Date();
    const cacheUntil = new Date(cachedEntry.ttl * 1000);

    const response: ApiResponse = {
      query: QUERY,
      fetchedAt: now.toISOString(),
      cacheUntil: cacheUntil.toISOString(),
      articles: filtered,
    };

    logger.info('Response prepared', {
      articleCount: filtered.length,
      sentiment: sentimentParam,
    });

    return successResponse(response);
  } catch (error) {
    logger.error('Handler error', error);
    return errorResponse(500, 'Internal server error');
  }
};

function filterBySentiment(articles: any[], sentiment: string): EnrichedArticle[] {
  if (sentiment === 'all') return articles;

  const sentimentLabel = sentiment.charAt(0).toUpperCase() + sentiment.slice(1);
  return articles.filter(a => a.sentiment === sentimentLabel);
}

function successResponse(data: ApiResponse): APIGatewayProxyResult {
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Cache-Control': 'no-cache',
    },
    body: JSON.stringify(data),
  };
}

function errorResponse(statusCode: number, message: string): APIGatewayProxyResult {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify({ error: message }),
  };
}
