import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { createHash } from 'crypto';
import { logger } from '../utils/logger';

export interface CachedArticle {
  title: string;
  url: string;
  source_name: string;
  pubDate: string;
  tickers: string[];
  snippet: string;
  sentiment: 'Positive' | 'Negative' | 'Neutral';
  score: number;
  emoji: string;
  cachedAt: number;
}

export interface CacheEntry {
  queryKey: string;
  articles: CachedArticle[];
  cachedAt: number;
  ttl: number;
}

export function generateQueryKey(query: string, language: string, category: string): string {
  const key = `${query}|${language}|${category}`;
  return createHash('sha256').update(key).digest('hex');
}

export async function getCachedArticles(
  ddbTable: string,
  queryKey: string,
  region: string
): Promise<CacheEntry | null> {
  const client = new DynamoDBClient({ region });
  const docClient = DynamoDBDocumentClient.from(client);

  try {
    const command = new GetCommand({
      TableName: ddbTable,
      Key: { queryKey },
    });

    const response = await docClient.send(command);
    const item = response.Item as any;

    if (!item) {
      logger.debug('Cache miss', { queryKey });
      return null;
    }

    const now = Math.floor(Date.now() / 1000);
    if (item.ttl && item.ttl < now) {
      logger.debug('Cache entry expired', { queryKey, ttl: item.ttl, now });
      return null;
    }

    logger.info('Cache hit', { queryKey, articleCount: item.articles?.length || 0 });
    return item;
  } catch (error) {
    logger.error('Error retrieving from cache', error, { queryKey });
    return null;
  }
}

export async function cacheArticles(
  ddbTable: string,
  queryKey: string,
  articles: CachedArticle[],
  ttlSeconds: number,
  region: string
): Promise<void> {
  const client = new DynamoDBClient({ region });
  const docClient = DynamoDBDocumentClient.from(client);

  try {
    const now = Math.floor(Date.now() / 1000);
    const entry: CacheEntry = {
      queryKey,
      articles,
      cachedAt: now,
      ttl: now + ttlSeconds,
    };

    const command = new PutCommand({
      TableName: ddbTable,
      Item: entry,
    });

    await docClient.send(command);
    logger.info('Articles cached', { queryKey, articleCount: articles.length, ttlSeconds });
  } catch (error) {
    logger.error('Error writing to cache', error, { queryKey });
    throw error;
  }
}
