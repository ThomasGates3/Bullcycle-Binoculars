# Setup: Crypto News Enrichment Microservice

Complete step-by-step guide to deploy the serverless crypto news service.

## 📋 Prerequisites Checklist

Before starting, ensure you have:

- [ ] AWS account with credentials configured: `aws configure`
- [ ] NewsData.io API key (free tier from https://newsdata.io)
- [ ] Terraform installed (`terraform version` returns version ≥ 1.0)
- [ ] Node.js 18+ installed (`node --version`)
- [ ] Git configured locally
- [ ] AWS Bedrock Claude 3 Haiku available in your region

### Verify Prerequisites

```bash
# Check AWS CLI
aws sts get-caller-identity

# Check Terraform
terraform version

# Check Node.js
node --version && npm --version

# List AWS regions with Bedrock
aws bedrock list-foundation-models --region us-east-1 | jq '.modelSummaries | length'
```

---

## 🔑 Step 1: Obtain API Keys

### NewsData.io API Key (5 minutes)

1. Go to https://newsdata.io/register
2. Sign up with email
3. Verify email
4. Copy your API key from dashboard
5. Save it safely (you'll need it for deployment)

**Example key**: `pub_123abc456def789xyz`

### AWS Bedrock Model Access (2 minutes)

1. Open AWS Console → Search for "Bedrock"
2. Click "Model access" in left sidebar
3. Look for "Anthropic Claude 3 Haiku"
4. Verify status shows "Access granted"
5. If not granted, click "Request access" and wait for approval (usually immediate)

**Alternative regions to try**:
- us-east-1 (best option)
- us-west-2
- eu-west-1 (if US unavailable)

---

## 📝 Step 2: Configure Terraform

### Create terraform.tfvars

```bash
# In project root
cd terraform

# Copy example file
cp terraform.tfvars.example terraform.tfvars

# Edit with your values
nano terraform.tfvars  # or use your preferred editor
```

### Fill in terraform.tfvars

**IMPORTANT**: This file contains secrets. Never commit to git!

```hcl
# Copy this EXACT structure and fill in your values:

aws_region  = "us-east-1"              # Must support Bedrock
environment = "prod"

# Keep as-is (these are fine)
bucket_name             = "bullcycle-binoculars"
lambda_function_name    = "crypto-news-enricher"
api_gateway_name        = "crypto-news-api"
api_stage_name          = "prod"
ddb_table_name          = "crypto-news-cache"
cache_ttl               = 900
max_retries             = 5
bedrock_model_id        = "anthropic.claude-3-haiku-20240307-v1:0"

# REQUIRED: Paste your NewsData.io API key here
newsdata_api_key = "pub_your_actual_key_from_newsdata_io"
```

### Verify .gitignore

Ensure `.gitignore` includes:

```bash
cd /Users/tg3/dev/bullcycle-binoculars

# Check if already ignored
grep "terraform.tfvars" .gitignore

# If not present, add it:
echo "terraform/terraform.tfvars" >> .gitignore
```

---

## 🏗️ Step 3: Build Lambda Function

### Install Dependencies

```bash
cd src/lambda/crypto-news
npm install
```

Expected output:
```
added 150+ packages in 2-3 minutes
```

### Compile TypeScript

```bash
npm run build
```

Expected output:
```
Successfully compiled X files
dist/ directory created
```

### Verify Build

```bash
ls -la dist/
# Should show: handler.js and other compiled files
```

---

## 🚀 Step 4: Deploy with Terraform

### Navigate to Terraform Directory

```bash
cd terraform  # (if not already there)
pwd          # Verify you're in /Users/tg3/dev/bullcycle-binoculars/terraform
```

### Initialize Terraform

```bash
terraform init
```

Expected output:
```
Terraform has been successfully configured!
```

### Plan Deployment

```bash
terraform plan -var-file=terraform.tfvars > plan.txt
cat plan.txt | head -50  # View first 50 lines
```

**Verify plan includes**:
- ✅ `aws_dynamodb_table.crypto_news_cache` will be created
- ✅ `aws_lambda_function.crypto_news` will be created
- ✅ `aws_api_gateway_rest_api.crypto_news_api` will be created
- ✅ `aws_iam_role.lambda_role` will be created

If you see errors, check:
```bash
# Verify terraform.tfvars syntax
terraform validate

# Check for required variables
grep -E "newsdata_api_key|aws_region" terraform.tfvars
```

### Apply Deployment

```bash
terraform apply -var-file=terraform.tfvars
```

**You'll be asked to confirm**. Type `yes` and press Enter.

Expected output after ~2-3 minutes:
```
Apply complete! Resources: 10 added, 0 changed, 0 destroyed.

Outputs:
api_gateway_url = "https://abcdef123.execute-api.us-east-1.amazonaws.com/prod/news"
lambda_function_name = "crypto-news-enricher"
dynamodb_table_name = "crypto-news-cache"
live_url = "https://d3e84acf01c0iv.cloudfront.net"
```

### Save API Endpoint

**Important**: Save this URL - you'll need it for frontend integration:

```bash
# Get the API URL
terraform output api_gateway_url

# Or save to file
terraform output api_gateway_url > ../API_ENDPOINT.txt
cat ../API_ENDPOINT.txt
```

---

## ✅ Step 5: Verify Deployment

### Test API Endpoint

```bash
# Get API URL from step above
API_URL="https://your-api-url-from-step-4/news"

# Test basic request
curl "$API_URL?sentiment=all"

# Should return JSON with articles or empty array
# If you get error, check Lambda logs (see below)
```

### Check Lambda Logs

```bash
# View recent logs
aws logs tail /aws/lambda/crypto-news-enricher --follow --since 5m

# Should show similar to:
# INFO Crypto news request received
# INFO Fetched crypto news
# INFO Articles cached
```

### Verify DynamoDB Table

```bash
# Check table exists and has data
aws dynamodb describe-table --table-name crypto-news-cache | jq '.Table | {Name, Status, ItemCount}'

# Expected:
# {
#   "Name": "crypto-news-cache",
#   "Status": "ACTIVE",
#   "ItemCount": 0  # (becomes 1 after first API call)
# }
```

### Test Sentiment Filtering

```bash
API_URL="https://your-api-url/news"

# Test each sentiment
curl "$API_URL?sentiment=positive" | jq '.articles | length'
curl "$API_URL?sentiment=negative" | jq '.articles | length'
curl "$API_URL?sentiment=neutral" | jq '.articles | length'
curl "$API_URL?sentiment=all" | jq '.articles | length'
```

---

## 🎯 Step 6: Integrate into Frontend

### Add News Section to HTML

Update `src/index.html`:

1. Add this HTML before closing `</main>`:

```html
<!-- Crypto News Section -->
<section class="news-section">
  <h2>📰 Crypto News Hub</h2>

  <div class="sentiment-filter">
    <button class="filter-btn active" data-sentiment="all">📊 All News</button>
    <button class="filter-btn" data-sentiment="positive">🐂 Bullish</button>
    <button class="filter-btn" data-sentiment="negative">🐻 Bearish</button>
    <button class="filter-btn" data-sentiment="neutral">⚪ Neutral</button>
  </div>

  <div id="news-container" class="news-grid">
    <div class="news-loading">Loading news...</div>
  </div>

  <div class="cache-info">
    <small id="cache-status">Cache expires at: --:--</small>
  </div>
</section>
```

2. Add CSS from `FRONTEND_INTEGRATION.md` to `<style>` tag

3. Add JavaScript from `FRONTEND_INTEGRATION.md` to `<script>` section

4. **CRITICAL**: Update API URL in JavaScript:

```javascript
// Find this line and update with your actual API endpoint
const API_URL = "https://your-actual-api-endpoint/news";
```

Get your endpoint:
```bash
cd terraform
terraform output api_gateway_url
```

### Verify Frontend Integration

1. Push to GitHub (if using CI/CD)
2. Wait for CloudFront to update (~1-2 minutes)
3. Visit your live URL: `https://your-cloudfront-url`
4. Scroll to news section
5. Verify articles load with sentiment emojis

---

## 🧪 Test Scenarios

### Scenario 1: First API Call (Cache Miss)

**Action**: Call API
```bash
curl "https://your-api-url/news"
```

**Expected**:
- Takes 2-3 seconds (fetching + sentiment analysis)
- Returns 10 articles
- Each article has sentiment + emoji
- CloudWatch logs show "Cache miss" or "Fetched crypto news"

### Scenario 2: Subsequent Calls (Cache Hit)

**Action**: Call API again within 15 minutes
```bash
curl "https://your-api-url/news"
```

**Expected**:
- Takes <100ms
- Returns same articles (from cache)
- CloudWatch logs show "Cache hit"
- Cost is minimal (only DynamoDB read, no Bedrock)

### Scenario 3: Sentiment Filtering

**Action**:
```bash
curl "https://your-api-url/news?sentiment=positive"
curl "https://your-api-url/news?sentiment=negative"
curl "https://your-api-url/news?sentiment=neutral"
```

**Expected**: Each returns only articles with that sentiment

### Scenario 4: Cache Expiration

**Action**: Wait 15 minutes, then call API
```bash
sleep 900  # Wait 15 minutes
curl "https://your-api-url/news"
```

**Expected**:
- Takes 2-3 seconds again (cache expired, fresh fetch)
- Logs show "Cache miss"
- Returns potentially different articles

---

## 🐛 Troubleshooting

### Error: "NEWSDATA_API_KEY not set"

**Cause**: API key not in terraform.tfvars

**Fix**:
```bash
cd terraform
# Verify it's set
grep newsdata_api_key terraform.tfvars

# If missing or empty, edit:
nano terraform.tfvars

# Then redeploy:
terraform apply -var-file=terraform.tfvars
```

### Error: "Model not found" or Bedrock access denied

**Cause**: Claude 3 Haiku not available in your region

**Fix**:
```bash
# Check available regions
aws bedrock list-foundation-models --region us-east-1 | jq '.modelSummaries[].modelId'

# If Haiku not available, try different region in terraform.tfvars:
aws_region = "us-west-2"

# Then redeploy
```

### Error: "HTTP 503 Service Unavailable"

**Cause**: NewsData.io or Bedrock temporarily down

**Check status**:
- NewsData.io: https://status.newsdata.io
- AWS Bedrock: AWS Console → Service Health

**Workaround**: Sentiment analysis falls back to keyword classifier

### API returns empty articles

**Cause**: NewsData.io API key invalid or rate limited

**Check**:
```bash
# Verify API key is valid
curl "https://newsdata.io/api/1/news?apikey=YOUR_KEY&q=test&size=1"

# Should return data, not error

# Check Lambda logs
aws logs tail /aws/lambda/crypto-news-enricher --follow
```

### DynamoDB table already exists

**Cause**: Table created by previous deployment

**Fix**:
```bash
# Option A: Destroy and redeploy
terraform destroy -var-file=terraform.tfvars
terraform apply -var-file=terraform.tfvars

# Option B: Import existing table
# (Advanced - only if keeping existing table)
terraform import aws_dynamodb_table.crypto_news_cache crypto-news-cache
```

### Lambda times out (30+ seconds)

**Cause**: NewsData.io or Bedrock slow

**Increase timeout in terraform/lambda.tf**:
```hcl
timeout = 60  # Increase from 30 to 60 seconds

# Then apply changes:
terraform apply -var-file=terraform.tfvars
```

---

## 📊 Monitoring & Maintenance

### View API Usage

```bash
# Lambda invocations per hour
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Invocations \
  --dimensions Name=FunctionName,Value=crypto-news-enricher \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S)Z \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S)Z \
  --period 3600 \
  --statistics Sum
```

### Check Costs

```bash
# Estimate monthly cost
echo "Lambda: ~$0.20 per 1M invocations"
echo "API Gateway: ~$0.35 per 1M requests"
echo "DynamoDB: ~$0.25 per 1M read units"
echo "Bedrock: ~$0.25 per 1M input tokens"
echo ""
echo "For 1K daily requests: ~$5-10/month"
```

### Clear Cache

```bash
# Remove all cached articles to force refresh
aws dynamodb scan --table-name crypto-news-cache --projection-expression "queryKey" \
  | jq '.Items[].queryKey.S' -r \
  | xargs -I {} aws dynamodb delete-item --table-name crypto-news-cache \
    --key "{\"queryKey\": {\"S\": \"{}\"}}"

# Next API call will fetch fresh data
```

### Update Lambda Function

```bash
# Rebuild and redeploy code
cd src/lambda/crypto-news
npm run build
cd ../../../terraform

# Redeploy
terraform apply -var-file=terraform.tfvars
```

---

## ✨ Next Steps

1. **Integrate Frontend**: Complete frontend integration from Step 6
2. **Test Thoroughly**: Run all test scenarios
3. **Monitor**: Check CloudWatch logs and metrics regularly
4. **Optimize**: Adjust cache TTL based on usage patterns
5. **Scale**: If hitting rate limits, increase cache TTL or adjust max_retries

---

## 🆘 Need Help?

### Check Logs

```bash
# Real-time logs
aws logs tail /aws/lambda/crypto-news-enricher --follow

# Last 100 lines
aws logs tail /aws/lambda/crypto-news-enricher --max-items 100

# Filter for errors
aws logs tail /aws/lambda/crypto-news-enricher --filter-pattern "ERROR"
```

### Test API Manually

```bash
# Basic test
curl -v "https://your-api-url/news?sentiment=all"

# With jq for pretty output
curl "https://your-api-url/news?sentiment=all" | jq '.'

# Check response headers
curl -i "https://your-api-url/news?sentiment=all"
```

### Verify Infrastructure

```bash
# List all Lambda functions
aws lambda list-functions | jq '.Functions[].FunctionName'

# Describe Lambda
aws lambda get-function --function-name crypto-news-enricher

# List DynamoDB tables
aws dynamodb list-tables

# Check API Gateway
aws apigateway get-rest-apis
```

---

**Deployment Time**: 30-45 minutes
**Monthly Cost**: $5-20 (within free tier range)
**Difficulty**: Intermediate
