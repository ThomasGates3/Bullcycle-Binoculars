export interface Config {
    newsDataApiKey: string;
    ddbTable: string;
    awsRegion: string;
    bedrockModelId: string;
    sagemakerEndpoint?: string;
    cacheTtl: number;
    maxRetries: number;
    initialBackoffMs: number;
}
export declare function loadConfig(): Config;
//# sourceMappingURL=config.d.ts.map