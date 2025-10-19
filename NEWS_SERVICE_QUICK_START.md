# Crypto News Service - Quick Start (5 minutes)

**Skip the long docs?** Here's the condensed version.

## TL;DR Setup

```bash
# 1. Get NewsData.io API key from https://newsdata.io/register
# 2. Configure terraform
cd terraform
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars: add your newsdata_api_key

# 3. Build and deploy (5 minutes)
cd ../
bash deploy-lambda.sh
# Follow prompts, type "yes" to deploy

# 4. Get API endpoint from output
API_URL=$(cd terraform && terraform output -raw api_gateway_url)
echo $API_URL

# 5. Add to frontend src/index.html:
# const API_URL = "your-api-url/news"
# (Copy HTML/CSS/JS from FRONTEND_INTEGRATION.md)
```

## API Usage

```javascript
// All articles
fetch("https://your-api/news").then(r => r.json())

// Bullish only
fetch("https://your-api/news?sentiment=positive").then(r => r.json())

// Bearish only
fetch("https://your-api/news?sentiment=negative").then(r => r.json())

// Neutral only
fetch("https://your-api/news?sentiment=neutral").then(r => r.json())
```

## Response Format

```json
{
  "query": "cryptocurrency AND ...",
  "fetchedAt": "2025-10-19T12:34:56Z",
  "cacheUntil": "2025-10-19T12:49:56Z",
  "articles": [
    {
      "title": "Bitcoin hits ATH",
      "url": "https://...",
      "source": "CoinDesk",
      "pubDate": "2025-10-19T10:00:00Z",
      "tickers": ["BTC", "ETH"],
      "snippet": "Bitcoin surges past...",
      "sentiment": "Positive",
      "score": 0.94,
      "emoji": "🐂"
    }
  ]
}
```

## Sentiment Emojis

| Emoji | Sentiment | Score |
|-------|-----------|-------|
| 🐂 | Positive (Bullish) | ≥ 0.65 |
| 🐻 | Negative (Bearish) | ≤ 0.35 |
| ⚪ | Neutral | 0.35-0.65 |

## Testing

```bash
# Check API works
curl "https://your-api/news"

# View logs
aws logs tail /aws/lambda/crypto-news-enricher --follow

# Check cache
aws dynamodb scan --table-name crypto-news-cache
```

## Costs (Monthly)

| Service | Cost |
|---------|------|
| Lambda | ~$0.20 |
| API Gateway | ~$0.35 |
| DynamoDB | ~$1.25 |
| Bedrock | ~$2-5 |
| **Total** | **$5-15** |

(Estimates for 1K daily requests)

## Common Issues

**"Model not found"**
→ Change `aws_region` in terraform.tfvars to us-east-1 or us-west-2

**"API returns empty"**
→ Check newsdata_api_key in terraform.tfvars

**"Slow first call (2-3s)"**
→ Normal - fetching + sentiment analysis. 2nd call cached (<100ms)

## Full Documentation

- **Setup**: See [SETUP_NEWS_SERVICE.md](./SETUP_NEWS_SERVICE.md) (30 min complete guide)
- **API Reference**: See [CRYPTO_NEWS_API.md](./CRYPTO_NEWS_API.md)
- **Frontend Integration**: See [FRONTEND_INTEGRATION.md](./FRONTEND_INTEGRATION.md)

## Architecture in 30 Seconds

```
Frontend (bullcycle-binoculars)
    ↓ GET /news?sentiment=positive
API Gateway (REST endpoint)
    ↓
Lambda Function (crypto-news-enricher)
    ├→ NewsData.io (fetch articles)
    ├→ Bedrock (sentiment analysis)
    └→ DynamoDB (cache 15 min)
    ↓ Returns JSON
Frontend (display articles with 🐂🐻⚪)
```

## Deploy in One Command

```bash
bash deploy-lambda.sh
```

That's it! The script handles everything.

---

**First time?** Start with [SETUP_NEWS_SERVICE.md](./SETUP_NEWS_SERVICE.md)
