"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateQueryKey = generateQueryKey;
exports.getCachedArticles = getCachedArticles;
exports.cacheArticles = cacheArticles;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const crypto_1 = require("crypto");
const logger_1 = require("../utils/logger");
function generateQueryKey(query, language, category) {
    const key = `${query}|${language}|${category}`;
    return (0, crypto_1.createHash)('sha256').update(key).digest('hex');
}
async function getCachedArticles(ddbTable, queryKey, region) {
    const client = new client_dynamodb_1.DynamoDBClient({ region });
    const docClient = lib_dynamodb_1.DynamoDBDocumentClient.from(client);
    try {
        const command = new lib_dynamodb_1.GetCommand({
            TableName: ddbTable,
            Key: { queryKey },
        });
        const response = await docClient.send(command);
        const item = response.Item;
        if (!item) {
            logger_1.logger.debug('Cache miss', { queryKey });
            return null;
        }
        const now = Math.floor(Date.now() / 1000);
        if (item.ttl && item.ttl < now) {
            logger_1.logger.debug('Cache entry expired', { queryKey, ttl: item.ttl, now });
            return null;
        }
        logger_1.logger.info('Cache hit', { queryKey, articleCount: item.articles?.length || 0 });
        return item;
    }
    catch (error) {
        logger_1.logger.error('Error retrieving from cache', error, { queryKey });
        return null;
    }
}
async function cacheArticles(ddbTable, queryKey, articles, ttlSeconds, region) {
    const client = new client_dynamodb_1.DynamoDBClient({ region });
    const docClient = lib_dynamodb_1.DynamoDBDocumentClient.from(client);
    try {
        const now = Math.floor(Date.now() / 1000);
        const entry = {
            queryKey,
            articles,
            cachedAt: now,
            ttl: now + ttlSeconds,
        };
        const command = new lib_dynamodb_1.PutCommand({
            TableName: ddbTable,
            Item: entry,
        });
        await docClient.send(command);
        logger_1.logger.info('Articles cached', { queryKey, articleCount: articles.length, ttlSeconds });
    }
    catch (error) {
        logger_1.logger.error('Error writing to cache', error, { queryKey });
        throw error;
    }
}
//# sourceMappingURL=cache.js.map