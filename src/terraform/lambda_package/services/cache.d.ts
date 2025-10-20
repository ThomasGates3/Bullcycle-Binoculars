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
export declare function generateQueryKey(query: string, language: string, category: string): string;
export declare function getCachedArticles(ddbTable: string, queryKey: string, region: string): Promise<CacheEntry | null>;
export declare function cacheArticles(ddbTable: string, queryKey: string, articles: CachedArticle[], ttlSeconds: number, region: string): Promise<void>;
//# sourceMappingURL=cache.d.ts.map