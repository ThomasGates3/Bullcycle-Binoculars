"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeSentiment = analyzeSentiment;
const client_bedrock_runtime_1 = require("@aws-sdk/client-bedrock-runtime");
const client_sagemaker_runtime_1 = require("@aws-sdk/client-sagemaker-runtime");
const logger_1 = require("../utils/logger");
const NEGATIVE_TOKENS = ['hack', 'exploit', 'lawsuit', 'ban', 'investigation', 'vulnerability', 'dip', 'crash', 'fall', 'decline', 'loss'];
const POSITIVE_TOKENS = ['approval', 'investment', 'surge', 'record', 'all-time high', 'partnership', 'funding', 'gain', 'rise', 'moon', 'bull'];
async function analyzeSentiment(title, snippet, bedrockModelId, sagemakerEndpoint, region = 'us-east-1') {
    try {
        return await analyzeSentimentBedrock(title, snippet, bedrockModelId, region);
    }
    catch (error) {
        logger_1.logger.warn('Bedrock sentiment analysis failed, trying fallback', { error: error instanceof Error ? error.message : error });
        if (sagemakerEndpoint) {
            try {
                return await analyzeSentimentSageMaker(title, snippet, sagemakerEndpoint, region);
            }
            catch (smError) {
                logger_1.logger.warn('SageMaker sentiment analysis failed, using keyword fallback', { error: smError instanceof Error ? smError.message : smError });
            }
        }
        return analyzeSentimentKeyword(title, snippet);
    }
}
async function analyzeSentimentBedrock(title, snippet, modelId, region) {
    const client = new client_bedrock_runtime_1.BedrockRuntimeClient({ region });
    const systemPrompt = `You are a sentiment classifier for cryptocurrency news. Analyze the provided article title and snippet, then respond with ONLY a JSON object (no markdown, no extra text) with these fields:
{
  "sentiment": "Positive" or "Negative" or "Neutral",
  "score": a number between 0.0 and 1.0
}

Guidelines:
- Positive: news about adoption, records, partnerships, institutional interest, price surges, regulatory approval
- Negative: news about hacks, crashes, investigations, bans, vulnerabilities, lawsuits
- Neutral: factual news without clear sentiment`;
    const userPrompt = `Title: ${title}
Description: ${snippet}`;
    const payload = {
        anthropic_version: 'bedrock-2023-06-01',
        max_tokens: 100,
        system: systemPrompt,
        messages: [
            {
                role: 'user',
                content: userPrompt,
            },
        ],
    };
    const command = new client_bedrock_runtime_1.InvokeModelCommand({
        modelId,
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify(payload),
    });
    const response = await client.send(command);
    const body = JSON.parse(new TextDecoder().decode(response.body));
    const content = body.content[0]?.text || '';
    const sentimentData = JSON.parse(content);
    return mapSentiment(sentimentData.sentiment, sentimentData.score);
}
async function analyzeSentimentSageMaker(title, snippet, endpoint, region) {
    const client = new client_sagemaker_runtime_1.SageMakerRuntimeClient({ region });
    const payload = JSON.stringify({
        inputs: [`${title} ${snippet}`],
    });
    const command = new client_sagemaker_runtime_1.InvokeEndpointCommand({
        EndpointName: endpoint,
        ContentType: 'application/json',
        Body: payload,
    });
    const response = await client.send(command);
    const body = JSON.parse(new TextDecoder().decode(response.Body));
    const sentiment = body[0]?.label || 'NEUTRAL';
    const score = body[0]?.score || 0.5;
    const sentimentLabel = sentiment === 'POSITIVE' ? 'Positive' : sentiment === 'NEGATIVE' ? 'Negative' : 'Neutral';
    return mapSentiment(sentimentLabel, score);
}
function analyzeSentimentKeyword(title, snippet) {
    const text = `${title} ${snippet}`.toLowerCase();
    const negativeCount = NEGATIVE_TOKENS.filter(token => text.includes(token)).length;
    const positiveCount = POSITIVE_TOKENS.filter(token => text.includes(token)).length;
    let sentiment;
    let score;
    if (positiveCount > negativeCount) {
        sentiment = 'Positive';
        score = 0.65 + positiveCount * 0.05;
    }
    else if (negativeCount > positiveCount) {
        sentiment = 'Negative';
        score = 0.35 - negativeCount * 0.05;
    }
    else {
        sentiment = 'Neutral';
        score = 0.5;
    }
    return mapSentiment(sentiment, Math.min(1, Math.max(0, score)));
}
function mapSentiment(label, score) {
    let sentiment;
    let finalScore = Math.min(1, Math.max(0, score));
    if (label === 'Positive' || label === 'positive') {
        sentiment = 'Positive';
    }
    else if (label === 'Negative' || label === 'negative') {
        sentiment = 'Negative';
    }
    else if (finalScore >= 0.65) {
        sentiment = 'Positive';
    }
    else if (finalScore <= 0.35) {
        sentiment = 'Negative';
    }
    else {
        sentiment = 'Neutral';
    }
    const emoji = sentiment === 'Positive' ? '🐂' : sentiment === 'Negative' ? '🐻' : '⚪';
    return { sentiment, score: finalScore, emoji };
}
//# sourceMappingURL=sentiment.js.map