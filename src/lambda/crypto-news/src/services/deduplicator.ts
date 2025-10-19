import { logger } from '../utils/logger';

export interface Article {
  title: string;
  url: string;
  source_name?: string;
  pubDate?: string;
  description?: string;
  tickers?: string[];
  [key: string]: any;
}

const TRUSTED_DOMAINS = [
  'coindesk.com',
  'cointelegraph.com',
  'decrypt.co',
  'theblock.co',
  'bloomberg.com',
  'reuters.com',
  'cnbc.com',
  'businessinsider.com',
  'techcrunch.com',
];

export function deduplicateArticles(articles: Article[]): Article[] {
  const seen = new Set<string>();
  const deduplicated: Article[] = [];

  for (const article of articles) {
    const url = article.url?.trim() || '';
    const title = article.title?.trim() || '';

    // Skip if URL is empty
    if (!url) {
      logger.debug('Skipping article with no URL', { title });
      continue;
    }

    // Primary dedup key: URL
    if (seen.has(url)) {
      logger.debug('Duplicate URL found', { url });
      continue;
    }

    // Secondary dedup: exact title
    const titleKey = title.toLowerCase();
    if ([...deduplicated].some(a => a.title?.toLowerCase() === titleKey)) {
      logger.debug('Duplicate title found', { title });
      continue;
    }

    seen.add(url);
    deduplicated.push(article);
  }

  logger.info('Deduplication complete', {
    before: articles.length,
    after: deduplicated.length,
    removed: articles.length - deduplicated.length,
  });

  return deduplicated;
}

export function scoreTrust(source: string | undefined, url: string | undefined): number {
  if (!source && !url) return 0.5;

  const domain = extractDomain(url || source || '');
  const isTrusted = TRUSTED_DOMAINS.some(t => domain.includes(t));

  return isTrusted ? 1.0 : 0.8;
}

function extractDomain(urlOrSource: string): string {
  try {
    const url = urlOrSource.startsWith('http') ? new URL(urlOrSource).hostname : urlOrSource;
    return url?.toLowerCase() || '';
  } catch {
    return urlOrSource.toLowerCase();
  }
}
