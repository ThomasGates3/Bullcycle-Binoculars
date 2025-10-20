export interface Article {
    title: string;
    url: string;
    source_name?: string;
    pubDate?: string;
    description?: string;
    tickers?: string[];
    [key: string]: any;
}
export declare function deduplicateArticles(articles: Article[]): Article[];
export declare function scoreTrust(source: string | undefined, url: string | undefined): number;
//# sourceMappingURL=deduplicator.d.ts.map