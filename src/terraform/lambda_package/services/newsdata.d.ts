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
export declare function fetchCryptoNews(apiKey: string, maxRetries: number, initialBackoffMs: number): Promise<NewsArticle[]>;
export declare function normalizeArticle(article: any): NewsArticle;
//# sourceMappingURL=newsdata.d.ts.map