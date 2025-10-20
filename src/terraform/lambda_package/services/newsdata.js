"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchCryptoNews = fetchCryptoNews;
exports.normalizeArticle = normalizeArticle;
const axios_1 = __importDefault(require("axios"));
const backoff_1 = require("../utils/backoff");
const logger_1 = require("../utils/logger");
const QUERY = 'cryptocurrency AND (Regulation OR Investigation OR Investment OR Institutional OR Hack OR Exploit OR Vulnerability OR AI OR Partnership OR Crash OR Surge OR "All-Time High" OR Record OR Dip)';
async function fetchCryptoNews(apiKey, maxRetries, initialBackoffMs) {
    const url = 'https://newsdata.io/api/1/news';
    const params = {
        apikey: apiKey,
        q: QUERY,
        language: 'en',
        category: 'business',
        size: 10,
    };
    try {
        const articles = await (0, backoff_1.exponentialBackoff)(async () => {
            const response = await axios_1.default.get(url, {
                params,
                timeout: 10000,
                headers: { 'User-Agent': 'crypto-news-enricher/1.0' },
            });
            return response.data.results || [];
        }, maxRetries, initialBackoffMs);
        logger_1.logger.info('Fetched crypto news', { articleCount: articles.length });
        return articles;
    }
    catch (error) {
        logger_1.logger.error('Failed to fetch crypto news', error);
        throw new Error(`NewsData API error: ${error instanceof Error ? error.message : 'unknown'}`);
    }
}
function normalizeArticle(article) {
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
function parseTickers(article) {
    const tickers = new Set();
    // Try to get from API response
    if (article.tickers && Array.isArray(article.tickers)) {
        article.tickers.forEach((t) => tickers.add(t.toUpperCase()));
    }
    // Regex for common crypto tickers
    const tickerRegex = /\b(BTC|ETH|SOL|DOGE|XRP|ADA|USDT|USDC|BNB|XLM|LINK|SHIB|AVAX|MATIC)\b/gi;
    const matches = `${article.title} ${article.description}`.match(tickerRegex);
    if (matches) {
        matches.forEach(t => tickers.add(t.toUpperCase()));
    }
    return Array.from(tickers);
}
//# sourceMappingURL=newsdata.js.map