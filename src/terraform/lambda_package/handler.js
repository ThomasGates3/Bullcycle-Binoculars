"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const config_1 = require("./utils/config");
const logger_1 = require("./utils/logger");
const newsdata_1 = require("./services/newsdata");
const sentiment_1 = require("./services/sentiment");
const cache_1 = require("./services/cache");
const deduplicator_1 = require("./services/deduplicator");
const QUERY = 'cryptocurrency AND (Regulation OR Investigation OR Investment OR Institutional OR Hack OR Exploit OR Vulnerability OR AI OR Partnership OR Crash OR Surge OR "All-Time High" OR Record OR Dip)';
const LANGUAGE = 'en';
const CATEGORY = 'business';
const handler = async (event) => {
    try {
        const config = (0, config_1.loadConfig)();
        logger_1.logger.setContext({ requestId: event.requestContext?.requestId || 'unknown' });
        // Parse sentiment filter
        const sentimentParam = (event.queryStringParameters?.sentiment || 'all').toLowerCase();
        const validSentiments = ['positive', 'negative', 'neutral', 'all'];
        if (!validSentiments.includes(sentimentParam)) {
            return errorResponse(400, 'Invalid sentiment parameter. Must be: positive, negative, neutral, or all');
        }
        logger_1.logger.info('Crypto news request received', { sentiment: sentimentParam });
        // Check cache
        const queryKey = (0, cache_1.generateQueryKey)(QUERY, LANGUAGE, CATEGORY);
        let cachedEntry = await (0, cache_1.getCachedArticles)(config.ddbTable, queryKey, config.awsRegion);
        if (!cachedEntry) {
            // Fetch fresh articles
            const rawArticles = await (0, newsdata_1.fetchCryptoNews)(config.newsDataApiKey, config.maxRetries, config.initialBackoffMs);
            const normalized = rawArticles.map(newsdata_1.normalizeArticle);
            const deduplicated = (0, deduplicator_1.deduplicateArticles)(normalized);
            // Enrich with sentiment
            const enriched = await Promise.all(deduplicated.map(async (article) => ({
                ...article,
                ...(await (0, sentiment_1.analyzeSentiment)(article.title, article.description || '', config.bedrockModelId, config.sagemakerEndpoint, config.awsRegion)),
            })));
            // Cache results
            const cachedArticles = enriched.map(a => ({
                title: a.title,
                url: a.url,
                source_name: a.source_name || 'Unknown',
                pubDate: a.pubDate || new Date().toISOString(),
                tickers: a.tickers || [],
                snippet: a.description || '',
                sentiment: a.sentiment,
                score: a.score,
                emoji: a.emoji,
                cachedAt: Math.floor(Date.now() / 1000),
            }));
            await (0, cache_1.cacheArticles)(config.ddbTable, queryKey, cachedArticles, config.cacheTtl, config.awsRegion);
            cachedEntry = {
                queryKey,
                articles: cachedArticles,
                cachedAt: Math.floor(Date.now() / 1000),
                ttl: Math.floor(Date.now() / 1000) + config.cacheTtl,
            };
        }
        if (!cachedEntry) {
            return errorResponse(503, 'Failed to retrieve articles');
        }
        // Filter by sentiment
        const filtered = filterBySentiment(cachedEntry.articles, sentimentParam);
        const now = new Date();
        const cacheUntil = new Date(cachedEntry.ttl * 1000);
        const response = {
            query: QUERY,
            fetchedAt: now.toISOString(),
            cacheUntil: cacheUntil.toISOString(),
            articles: filtered,
        };
        logger_1.logger.info('Response prepared', {
            articleCount: filtered.length,
            sentiment: sentimentParam,
        });
        return successResponse(response);
    }
    catch (error) {
        logger_1.logger.error('Handler error', error);
        return errorResponse(500, 'Internal server error');
    }
};
exports.handler = handler;
function filterBySentiment(articles, sentiment) {
    if (sentiment === 'all')
        return articles;
    const sentimentLabel = sentiment.charAt(0).toUpperCase() + sentiment.slice(1);
    return articles.filter(a => a.sentiment === sentimentLabel);
}
function successResponse(data) {
    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Cache-Control': 'no-cache',
        },
        body: JSON.stringify(data),
    };
}
function errorResponse(statusCode, message) {
    return {
        statusCode,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ error: message }),
    };
}
//# sourceMappingURL=handler.js.map