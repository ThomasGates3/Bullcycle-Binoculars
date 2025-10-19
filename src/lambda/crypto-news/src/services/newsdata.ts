import axios from 'axios';
import { exponentialBackoff } from '../utils/backoff';
import { logger } from '../utils/logger';

export interface NewsArticle {
  title: string;
  url: string;
  source_id: string;
  source_name?: string;
  pubDate: string;
  description?: string;
  image_url?: string;
  tickers?: string[];
}

export interface NewsDataResponse {
  articles: NewsArticle[];
  nextPage?: string;
}

const QUERY = 'cryptocurrency';

export async function fetchCryptoNews(apiKey: string, maxRetries: number, initialBackoffMs: number): Promise<NewsArticle[]> {
  const url = 'https://newsdata.io/api/1/news';
  const params = {
    apikey: apiKey,
    q: QUERY,
    language: 'en',
    category: 'business',
    size: 10,
  };

  try {
    const articles = await exponentialBackoff(
      async () => {
        const response = await axios.get(url, {
          params,
          timeout: 10000,
          headers: { 'User-Agent': 'crypto-news-enricher/1.0' },
        });
        return response.data.results || [];
      },
      maxRetries,
      initialBackoffMs
    );

    logger.info('Fetched crypto news', { articleCount: articles.length });
    return articles;
  } catch (error) {
    logger.error('Failed to fetch crypto news', error);
    throw new Error(`NewsData API error: ${error instanceof Error ? error.message : 'unknown'}`);
  }
}

export function normalizeArticle(article: any): NewsArticle {
  return {
    title: article.title || '',
    url: article.link || article.url || '',
    source_id: article.source_id || 'unknown',
    source_name: article.source_name || article.source_id,
    pubDate: article.pubDate || article.pubdate || new Date().toISOString(),
    description: article.description || article.content || '',
    image_url: article.image_url || article.image || undefined,
    tickers: parseTickers(article),
  };
}

function parseTickers(article: any): string[] {
  const tickers: Set<string> = new Set();

  // Try to get from API response
  if (article.tickers && Array.isArray(article.tickers)) {
    article.tickers.forEach((t: string) => tickers.add(t.toUpperCase()));
  }

  // Regex for common crypto tickers
  const tickerRegex = /\b(BTC|ETH|SOL|DOGE|XRP|ADA|USDT|USDC|BNB|XLM|LINK|SHIB|AVAX|MATIC)\b/gi;
  const matches = `${article.title} ${article.description}`.match(tickerRegex);
  if (matches) {
    matches.forEach(t => tickers.add(t.toUpperCase()));
  }

  return Array.from(tickers);
}
