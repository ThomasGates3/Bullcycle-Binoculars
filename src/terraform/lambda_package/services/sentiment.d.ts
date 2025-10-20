export interface SentimentResult {
    sentiment: 'Positive' | 'Negative' | 'Neutral';
    score: number;
    emoji: string;
}
export declare function analyzeSentiment(title: string, snippet: string, bedrockModelId: string, sagemakerEndpoint?: string, region?: string): Promise<SentimentResult>;
//# sourceMappingURL=sentiment.d.ts.map