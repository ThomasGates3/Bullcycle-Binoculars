"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadConfig = loadConfig;
function loadConfig() {
    const apiKey = process.env.NEWSDATA_API_KEY;
    if (!apiKey)
        throw new Error('NEWSDATA_API_KEY not set');
    const table = process.env.DDB_TABLE;
    if (!table)
        throw new Error('DDB_TABLE not set');
    const region = process.env.AWS_REGION || 'us-east-1';
    return {
        newsDataApiKey: apiKey,
        ddbTable: table,
        awsRegion: region,
        bedrockModelId: process.env.BEDROCK_MODEL_ID || 'anthropic.claude-3-haiku-20240307-v1:0',
        sagemakerEndpoint: process.env.SAGEMAKER_ENDPOINT,
        cacheTtl: parseInt(process.env.CACHE_TTL || '900'), // 15 minutes default
        maxRetries: parseInt(process.env.MAX_RETRIES || '5'),
        initialBackoffMs: parseInt(process.env.INITIAL_BACKOFF_MS || '1000'),
    };
}
//# sourceMappingURL=config.js.map