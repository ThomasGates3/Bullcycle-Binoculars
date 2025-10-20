"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deduplicateArticles = deduplicateArticles;
exports.scoreTrust = scoreTrust;
const logger_1 = require("../utils/logger");
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
function deduplicateArticles(articles) {
    const seen = new Set();
    const deduplicated = [];
    for (const article of articles) {
        const url = article.url?.trim() || '';
        const title = article.title?.trim() || '';
        // Skip if URL is empty
        if (!url) {
            logger_1.logger.debug('Skipping article with no URL', { title });
            continue;
        }
        // Primary dedup key: URL
        if (seen.has(url)) {
            logger_1.logger.debug('Duplicate URL found', { url });
            continue;
        }
        // Secondary dedup: exact title
        const titleKey = title.toLowerCase();
        if ([...deduplicated].some(a => a.title?.toLowerCase() === titleKey)) {
            logger_1.logger.debug('Duplicate title found', { title });
            continue;
        }
        seen.add(url);
        deduplicated.push(article);
    }
    logger_1.logger.info('Deduplication complete', {
        before: articles.length,
        after: deduplicated.length,
        removed: articles.length - deduplicated.length,
    });
    return deduplicated;
}
function scoreTrust(source, url) {
    if (!source && !url)
        return 0.5;
    const domain = extractDomain(url || source || '');
    const isTrusted = TRUSTED_DOMAINS.some(t => domain.includes(t));
    return isTrusted ? 1.0 : 0.8;
}
function extractDomain(urlOrSource) {
    try {
        const url = urlOrSource.startsWith('http') ? new URL(urlOrSource).hostname : urlOrSource;
        return url?.toLowerCase() || '';
    }
    catch {
        return urlOrSource.toLowerCase();
    }
}
//# sourceMappingURL=deduplicator.js.map