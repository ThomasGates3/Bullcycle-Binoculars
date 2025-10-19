# Crypto News Enrichment API

A serverless microservice that fetches crypto news from NewsData.io, enriches articles with sentiment analysis using AWS Bedrock, and provides a queryable REST API with caching.

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Environment Setup](#environment-setup)
- [Deployment](#deployment)
- [API Usage](#api-usage)
- [Sentiment Analysis](#sentiment-analysis)
- [Caching Strategy](#caching-strategy)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)

## Overview

### What It Does

1. **Fetches News**: Queries NewsData.io API for crypto articles matching a curated query
2. **Deduplicates**: Removes duplicate articles by URL and exact title
3. **Enriches**: Classifies sentiment (Positive/Negative/Neutral) using AWS Bedrock Claude 3 Haiku
4. **Maps Emoji**: 🐂 (Bull) for positive, 🐻 (Bear) for negative, ⚪ (Neutral circle) for neutral
5. **Caches**: Stores results in DynamoDB with 15-minute TTL to avoid rate limits
6. **Filters**: Returns articles filtered by requested sentiment (positive, negative, neutral, or all)

### Key Features

- **Exponential Backoff**: Handles API rate limits gracefully (up to 5 retries)
- **Cost Efficient**: Uses Claude 3 Haiku for sentiment analysis (~3x cheaper than Sonnet)
- **Fallback Strategies**: Keyword-based sentiment if Bedrock unavailable
- **Source Trust**: Prioritizes trusted crypto news sources
- **Ticker Extraction**: Automatically detects cryptocurrency tickers in articles
- **CORS Enabled**: Ready for cross-origin requests from frontend

## Architecture

```
┌─────────────────────────┐
│   Frontend Application  │ (bullcycle-binoculars)
└────────┬────────────────┘
         │ GET /news?sentiment=positive
         │
┌────────▼──────────────────────────────────┐
│      AWS API Gateway                       │
│   (REST endpoint with CORS support)       │
└────────┬──────────────────────────────────┘
         │
┌────────▼──────────────────────────────────┐
│      AWS Lambda Function                   │
│  (crypto-news-enricher)                   │
│  • Orchestrates fetch → enrich → cache    │
└────┬───────────────┬──────────────┬───────┘
     │               │              │
  ┌──▼──┐        ┌───▼────┐    ┌───▼──────┐
  │      │        │        │    │          │
┌─▼────────────┐ ┌▼──────────┐ ┌▼──────────┐
│ NewsData.io  │ │ DynamoDB  │ │ Bedrock   │
│ (Fetch news) │ │ (Cache)   │ │ (Sentiment)
└──────────────┘ └───────────┘ └───────────┘
```

### AWS Services Used

| Service | Purpose | Cost |
|---------|---------|------|
| **Lambda** | Orchestration & processing | ~$0.20/million invocations |
| **API Gateway** | HTTP endpoint | ~$0.35/million requests |
| **DynamoDB** | On-demand cache storage | ~$1.25 per million read units |
| **Bedrock** | Sentiment analysis | ~$0.25 per 1M input tokens (Haiku) |

**Estimated monthly cost for moderate traffic**: $5-15/month

## Environment Setup

### Prerequisites

- AWS account with Bedrock access in your region
- NewsData.io API key (free tier available at https://newsdata.io)
- AWS CLI configured locally
- Terraform (v1.0+)
- Node.js 18+

### Step 1: Get API Keys

#### NewsData.io API Key

1. Go to https://newsdata.io/register
2. Sign up and get your free API key
3. Save it securely (you'll need it for Terraform)

#### AWS Bedrock Access

1. Open AWS Console → Bedrock → Model access
2. Verify Claude 3 Haiku is available in your region
3. If not available, adjust Terraform `aws_region` variable

### Step 2: Create terraform.tfvars

Create `terraform/terraform.tfvars`:

```hcl
aws_region          = "us-east-1"  # Must support Bedrock
environment         = "prod"
bucket_name         = "bullcycle-binoculars-yourname"
newsdata_api_key    = "your-newsdata-api-key-here"
ddb_table_name      = "crypto-news-cache"
lambda_function_name = "crypto-news-enricher"
cache_ttl           = 900            # 15 minutes
max_retries         = 5
```

**Important**: Never commit `terraform.tfvars` to git (add to .gitignore)

### Step 3: Configure .gitignore

Ensure your `.gitignore` includes:

```
terraform/terraform.tfvars
terraform/.terraform/
terraform/.terraform.lock.hcl
terraform/terraform.tfstate*
src/lambda/crypto-news/dist/
src/lambda/crypto-news/node_modules/
```

## Deployment

### 1. Build Lambda Function

```bash
cd src/lambda/crypto-news
npm install
npm run build
cd ../../../
```

### 2. Initialize Terraform

```bash
cd terraform
terraform init
```

### 3. Plan Deployment

```bash
terraform plan -var-file=terraform.tfvars
```

Review the plan to ensure:
- ✅ DynamoDB table is created
- ✅ Lambda function is packaged
- ✅ API Gateway is configured
- ✅ IAM roles have necessary permissions

### 4. Deploy Infrastructure

```bash
terraform apply -var-file=terraform.tfvars
```

Type `yes` when prompted.

### 5. Get API Endpoint

After deployment, Terraform outputs the API endpoint:

```bash
terraform output api_gateway_url
# Output: https://abcdef123.execute-api.us-east-1.amazonaws.com/prod/news
```

Save this URL for frontend integration.

### Verify Deployment

```bash
# Test the API
curl "https://your-api-endpoint/news?sentiment=all"

# Should return JSON with articles:
{
  "query": "cryptocurrency AND ...",
  "fetchedAt": "2025-10-19T12:34:56Z",
  "cacheUntil": "2025-10-19T12:49:56Z",
  "articles": [...]
}
```

## API Usage

### Endpoint

```
GET /news?sentiment={sentiment}
```

### Query Parameters

| Parameter | Type | Values | Default | Description |
|-----------|------|--------|---------|-------------|
| `sentiment` | string | `positive`, `negative`, `neutral`, `all` | `all` | Filter articles by sentiment |

### Request Examples

**Get all articles:**
```bash
curl "https://api.example.com/news"
```

**Get only positive articles:**
```bash
curl "https://api.example.com/news?sentiment=positive"
```

**Get negative articles (bearish news):**
```bash
curl "https://api.example.com/news?sentiment=negative"
```

### Response Format

```json
{
  "query": "cryptocurrency AND (Regulation OR Investigation OR ...)",
  "fetchedAt": "2025-10-19T12:34:56Z",
  "cacheUntil": "2025-10-19T12:49:56Z",
  "articles": [
    {
      "title": "SEC approves spot bitcoin ETF",
      "url": "https://coindesk.com/...",
      "source": "CoinDesk",
      "pubDate": "2025-10-19T10:00:00Z",
      "tickers": ["BTC", "ETH"],
      "snippet": "The Securities and Exchange Commission approved...",
      "sentiment": "Positive",
      "score": 0.92,
      "emoji": "🐂"
    },
    {
      "title": "Crypto exchange hack results in $50M loss",
      "url": "https://cointelegraph.com/...",
      "source": "Cointelegraph",
      "pubDate": "2025-10-19T09:30:00Z",
      "tickers": ["ETH"],
      "snippet": "A major cryptocurrency exchange suffered a security breach...",
      "sentiment": "Negative",
      "score": 0.15,
      "emoji": "🐻"
    }
  ]
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `query` | string | The crypto news query used |
| `fetchedAt` | ISO 8601 | When articles were fetched |
| `cacheUntil` | ISO 8601 | When cache expires |
| `articles` | array | Array of enriched article objects |
| `title` | string | Article headline |
| `url` | string | Direct link to article |
| `source` | string | News source name (e.g., CoinDesk) |
| `pubDate` | ISO 8601 | Publication date |
| `tickers` | array | Cryptocurrency tickers mentioned (BTC, ETH, etc.) |
| `snippet` | string | Article excerpt/description |
| `sentiment` | enum | `Positive`, `Negative`, or `Neutral` |
| `score` | number | Sentiment confidence score (0.0 - 1.0) |
| `emoji` | string | Visual sentiment indicator |

### Status Codes

| Code | Meaning | Example |
|------|---------|---------|
| `200` | ✅ Success | Articles returned |
| `400` | ❌ Invalid request | Invalid sentiment parameter |
| `429` | ⏱️ Rate limited | Too many requests (retried internally) |
| `503` | 🔧 Unavailable | NewsData.io or Bedrock unavailable |

### CORS Support

All responses include CORS headers allowing cross-origin requests:

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Headers: Content-Type
```

## Sentiment Analysis

### How It Works

1. **Model-based (Preferred)**: AWS Bedrock Claude 3 Haiku
   - Analyzes article title + snippet
   - Returns JSON: `{ "sentiment": "Positive", "score": 0.92 }`
   - Score mapped to labels (≥0.65 = Positive, ≤0.35 = Negative)

2. **Fallback (if Bedrock unavailable)**: Keyword-based
   - Counts positive keywords: "approval", "investment", "surge", "record", etc.
   - Counts negative keywords: "hack", "exploit", "lawsuit", "ban", etc.
   - Compares to classify sentiment

### Sentiment Labels

| Label | Emoji | Meaning | Score Range |
|-------|-------|---------|-------------|
| **Positive** | 🐂 | Bullish news (adoption, records, partnerships) | ≥ 0.65 |
| **Negative** | 🐻 | Bearish news (hacks, crashes, investigations) | ≤ 0.35 |
| **Neutral** | ⚪ | Factual news without clear sentiment | 0.35 - 0.65 |

### Example Classifications

```
Title: "Bitcoin hits all-time high above $100k"
Snippet: "Institutional investment surge drives record price"
→ Sentiment: Positive (🐂), Score: 0.94

Title: "Cryptocurrency exchange suffers major security breach"
Snippet: "Hack investigation underway, $50M in losses reported"
→ Sentiment: Negative (🐻), Score: 0.08

Title: "Crypto market cap reaches $2 trillion"
Snippet: "Current market data released for analysis"
→ Sentiment: Neutral (⚪), Score: 0.50
```

## Caching Strategy

### TTL Configuration

- **Default TTL**: 15 minutes (900 seconds)
- **Configurable via**: `cache_ttl` Terraform variable

### Cache Key

Articles are cached using a SHA256 hash of the query string:

```
queryKey = SHA256(query + language + category)
```

This means:
- Same query from different users returns cached result
- Different queries create separate cache entries
- Cache automatically expires after TTL

### Benefits

1. **Avoid Rate Limits**: NewsData.io allows ~100-200 requests/day on free tier
2. **Reduce Latency**: Cached results return in <100ms
3. **Cost Savings**: Fewer Bedrock API calls for sentiment analysis
4. **User Experience**: Faster page loads

### Cache Miss Scenario

```
Time: 12:34:00 - User A requests news
  → No cache → Fetch from NewsData.io → Analyze sentiment → Store in DynamoDB
  → Return results (2-3 seconds)

Time: 12:38:00 - User B requests news (same query)
  → Cache hit → Return from DynamoDB
  → Return results (<100ms)

Time: 12:50:00 - User C requests news (cache expired)
  → Cache miss (TTL exceeded) → Repeat full process
```

## Testing

### Unit Tests

```bash
cd src/lambda/crypto-news
npm run test
npm run test:coverage
```

Test coverage includes:
- ✅ Sentiment analysis (keyword fallback)
- ✅ Article deduplication
- ✅ Cache key generation
- ✅ Query parameter validation

### Integration Tests (Manual)

#### Test 1: Basic API Call

```bash
curl "https://your-api-url/news"
```

**Expected**: Returns 10 articles with sentiment data

#### Test 2: Sentiment Filtering

```bash
curl "https://your-api-url/news?sentiment=positive" | jq '.articles | length'
curl "https://your-api-url/news?sentiment=negative" | jq '.articles | length'
```

**Expected**: Filtered counts match sentiment

#### Test 3: Cache Hit

```bash
# First call (cache miss)
time curl "https://your-api-url/news" > /dev/null

# Second call within 15 minutes (cache hit - should be faster)
time curl "https://your-api-url/news" > /dev/null
```

**Expected**: Second call completes faster

#### Test 4: CloudWatch Logs

```bash
aws logs tail /aws/lambda/crypto-news-enricher --follow
```

**Expected**: See INFO/ERROR logs from Lambda execution

## Monitoring

### CloudWatch Logs

```bash
# View recent logs
aws logs tail /aws/lambda/crypto-news-enricher --follow

# Filter for errors
aws logs tail /aws/lambda/crypto-news-enricher --follow --filter-pattern "ERROR"

# Get statistics
aws logs describe-log-groups --log-group-name-prefix /aws/lambda/crypto-news
```

### Lambda Metrics

```bash
# View invocation count
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Invocations \
  --dimensions Name=FunctionName,Value=crypto-news-enricher \
  --start-time 2025-10-19T00:00:00Z \
  --end-time 2025-10-20T00:00:00Z \
  --period 3600 \
  --statistics Sum
```

### DynamoDB Metrics

```bash
aws cloudwatch get-metric-statistics \
  --namespace AWS/DynamoDB \
  --metric-name ConsumedReadCapacityUnits \
  --dimensions Name=TableName,Value=crypto-news-cache \
  --start-time 2025-10-19T00:00:00Z \
  --end-time 2025-10-20T00:00:00Z \
  --period 3600 \
  --statistics Sum
```

## Troubleshooting

### Issue: "NEWSDATA_API_KEY not set"

**Cause**: Environment variable not configured

**Fix**:
```bash
# Check terraform.tfvars
grep newsdata_api_key terraform/terraform.tfvars

# Redeploy
terraform apply -var-file=terraform.tfvars
```

### Issue: API returns 503 Service Unavailable

**Cause**: NewsData.io or Bedrock temporarily unavailable

**Fix**:
1. Check NewsData.io status: https://status.newsdata.io
2. Verify Bedrock region availability
3. Check Lambda CloudWatch logs:
   ```bash
   aws logs tail /aws/lambda/crypto-news-enricher --follow
   ```

### Issue: Articles not showing sentiment emoji

**Cause**: Sentiment analysis failed, using fallback

**Expected behavior**: Fallback keyword-based classifier still assigns sentiment

**Check logs**:
```bash
aws logs tail /aws/lambda/crypto-news-enricher --follow --filter-pattern "sentiment"
```

### Issue: Cache not working (always fetching fresh)

**Cause**: TTL setting too low or DynamoDB misconfigured

**Fix**:
```bash
# Verify cache TTL setting
terraform state show aws_dynamodb_table.crypto_news_cache

# Check if TTL enabled
aws dynamodb describe-table --table-name crypto-news-cache | jq '.Table.TTLDescription'

# Should return: TimeToLiveStatus: "ENABLED"
```

### Issue: Lambda timeout (>30 seconds)

**Cause**: NewsData.io or Bedrock taking too long

**Fix**:
```hcl
# Increase timeout in lambda.tf
timeout = 60  # seconds (default: 30)

# Redeploy
terraform apply
```

### Issue: High costs ($50+ per month)

**Cause**: Likely Bedrock overuse (no caching hitting TTL frequently)

**Optimization**:
1. Increase cache TTL: `cache_ttl = 3600` (1 hour)
2. Monitor Bedrock usage:
   ```bash
   aws cloudwatch get-metric-statistics \
     --namespace AWS/Bedrock \
     --metric-name InputTokens \
     --start-time 2025-10-01T00:00:00Z \
     --end-time 2025-10-30T00:00:00Z \
     --period 86400 \
     --statistics Sum
   ```

---

## Quick Reference

### URLs

| Resource | URL |
|----------|-----|
| API Endpoint | `terraform output api_gateway_url` |
| Lambda Function | AWS Console → Lambda → `crypto-news-enricher` |
| DynamoDB Table | AWS Console → DynamoDB → `crypto-news-cache` |
| CloudWatch Logs | AWS Console → CloudWatch → `/aws/lambda/crypto-news-enricher` |

### Common Commands

```bash
# Deploy updates
cd terraform && terraform apply -var-file=terraform.tfvars

# View recent logs
aws logs tail /aws/lambda/crypto-news-enricher --follow

# Clear cache (delete DynamoDB items)
aws dynamodb scan --table-name crypto-news-cache --projection-expression "queryKey" \
  | jq '.Items[].queryKey.S' -r \
  | xargs -I {} aws dynamodb delete-item --table-name crypto-news-cache --key "{\"queryKey\": {\"S\": \"{}\"}}"

# Get API metrics
aws cloudwatch get-metric-statistics --namespace AWS/Lambda --metric-name Duration --dimensions Name=FunctionName,Value=crypto-news-enricher --start-time 2025-10-19T00:00:00Z --end-time 2025-10-20T00:00:00Z --period 3600 --statistics Average

# Rebuild Lambda
cd src/lambda/crypto-news && npm run build && cd ../../../
```

---

**Last Updated**: October 2025
**Version**: 1.0.0
**Maintained**: bullcycle-binoculars project
