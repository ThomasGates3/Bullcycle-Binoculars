# Deployment Checklist - Crypto News Microservice

Use this checklist to verify your deployment at each stage.

## 📋 Pre-Deployment

### Prerequisites

- [ ] AWS account created and verified
- [ ] AWS CLI installed: `aws --version` ✅
- [ ] AWS credentials configured: `aws sts get-caller-identity` ✅
- [ ] Terraform installed: `terraform version` ✅ (v1.0+)
- [ ] Node.js 18+ installed: `node --version` ✅
- [ ] Git configured: `git config --global user.name` ✅

### API Keys

- [ ] NewsData.io API key obtained from https://newsdata.io/register
- [ ] Stored securely (NOT committed to git)
- [ ] Bedrock Claude 3 Haiku available in target region
- [ ] AWS account has Bedrock access verified

### Repository Setup

- [ ] On `news-filter` branch: `git branch | grep news-filter` ✅
- [ ] No uncommitted changes: `git status` clean ✅
- [ ] CLAUDE.local.md in .gitignore ✅
- [ ] terraform.tfvars in .gitignore ✅

---

## 🔧 Configuration Phase

### Terraform Setup

- [ ] Copied `terraform/terraform.tfvars.example` to `terraform/terraform.tfvars`
- [ ] Filled in all required variables in terraform.tfvars
- [ ] Set `newsdata_api_key = "your-actual-key"`
- [ ] Set `aws_region = "us-east-1"` (or another Bedrock region)
- [ ] Verified no secrets in terraform.tfvars match .gitignore pattern

### Verification

```bash
# Verify terraform.tfvars
cd terraform
cat terraform.tfvars | grep newsdata_api_key
# Should show: newsdata_api_key = "pub_xxx..."

# Verify won't be committed
git status
# Should NOT list terraform.tfvars
```

✅ Checks:
- [ ] terraform.tfvars exists and populated
- [ ] API key matches your NewsData.io account
- [ ] Region supports Bedrock (us-east-1 preferred)
- [ ] terraform.tfvars not in git status output

---

## 🏗️ Build Phase

### Lambda Function Build

```bash
cd src/lambda/crypto-news
npm install
npm run build
```

✅ Checks:
- [ ] npm install completes without errors
- [ ] No security vulnerabilities reported
- [ ] TypeScript compilation succeeds
- [ ] `dist/` directory created
- [ ] `dist/handler.js` exists

### Verify Build Artifacts

```bash
ls -la src/lambda/crypto-news/dist/
# Should list: handler.js, handler.js.map, services/, utils/
```

✅ Checks:
- [ ] dist/handler.js exists (compiled Lambda entry point)
- [ ] dist/services/ directory exists
- [ ] dist/utils/ directory exists
- [ ] No compilation errors in output

### Run Tests (Optional but Recommended)

```bash
npm run test
npm run test:coverage
```

✅ Checks:
- [ ] All tests pass
- [ ] Coverage > 70% if run
- [ ] No test failures in output

---

## ☁️ Infrastructure Deployment Phase

### Terraform Initialization

```bash
cd terraform
terraform init
```

✅ Checks:
- [ ] "Terraform has been successfully configured" message
- [ ] `.terraform/` directory created
- [ ] `.terraform.lock.hcl` created
- [ ] No errors in output

### Terraform Validation

```bash
terraform validate
```

✅ Checks:
- [ ] "Success! The configuration is valid." message
- [ ] No validation errors
- [ ] terraform.tfvars has no syntax errors

### Terraform Plan

```bash
terraform plan -var-file=terraform.tfvars
```

**Review plan output for**:
- [ ] `aws_dynamodb_table.crypto_news_cache` will be created
- [ ] `aws_lambda_function.crypto_news` will be created
- [ ] `aws_api_gateway_rest_api.crypto_news_api` will be created
- [ ] `aws_iam_role.lambda_role` will be created
- [ ] `aws_iam_role_policy.lambda_policy` will be created
- [ ] No resources being destroyed
- [ ] Total resources to add: ~10

**If you see errors**:
- [ ] Check terraform.tfvars for missing variables
- [ ] Verify AWS credentials: `aws sts get-caller-identity`
- [ ] Verify Bedrock access in your region

### Terraform Apply

```bash
terraform apply -var-file=terraform.tfvars
```

When prompted: **Type `yes` and press Enter**

⏳ Wait 2-5 minutes for deployment

✅ Checks:
- [ ] "Apply complete! Resources: 10 added" message
- [ ] No errors during resource creation
- [ ] Terraform outputs displayed:
  - [ ] `api_gateway_url`
  - [ ] `lambda_function_name`
  - [ ] `dynamodb_table_name`
  - [ ] `live_url`

---

## ✅ Post-Deployment Verification

### Save Outputs

```bash
# Save API endpoint for later reference
terraform output api_gateway_url > API_ENDPOINT.txt
cat API_ENDPOINT.txt
# Should show: https://abcdef123.execute-api.region.amazonaws.com/prod/news
```

✅ Checks:
- [ ] API endpoint URL saved
- [ ] URL format is valid (https://.../news)

### Verify Lambda Function

```bash
aws lambda get-function --function-name crypto-news-enricher --region us-east-1
```

✅ Checks:
- [ ] Function exists
- [ ] Status: "Active"
- [ ] Handler: "dist/handler.handler"
- [ ] Runtime: "nodejs18.x"
- [ ] Memory: 512 MB

### Verify DynamoDB Table

```bash
aws dynamodb describe-table --table-name crypto-news-cache --region us-east-1
```

✅ Checks:
- [ ] Table exists
- [ ] TableStatus: "ACTIVE"
- [ ] BillingMode: "PAY_PER_REQUEST"
- [ ] TTL attribute exists: "ttl"

### Verify API Gateway

```bash
aws apigateway get-rest-apis --region us-east-1 | jq '.items[] | select(.name=="crypto-news-api")'
```

✅ Checks:
- [ ] API exists with name "crypto-news-api"
- [ ] API status: "Active"

### Verify IAM Role

```bash
aws iam get-role --role-name crypto-news-lambda-role
```

✅ Checks:
- [ ] Role exists
- [ ] AssumeRolePolicyDocument has Lambda service

---

## 🧪 API Testing

### Test 1: Basic API Call

```bash
API_URL=$(cd terraform && terraform output -raw api_gateway_url)
echo "Testing: $API_URL"

curl -v "$API_URL?sentiment=all" | jq '.'
```

✅ Checks:
- [ ] HTTP 200 response
- [ ] Response has "articles" array
- [ ] Response has "query" field
- [ ] Response has "fetchedAt" timestamp
- [ ] Response has "cacheUntil" timestamp

### Test 2: Sentiment Filtering

```bash
# Test positive
curl "$API_URL?sentiment=positive" | jq '.articles | length'

# Test negative
curl "$API_URL?sentiment=negative" | jq '.articles | length'

# Test neutral
curl "$API_URL?sentiment=neutral" | jq '.articles | length'
```

✅ Checks:
- [ ] All three requests return HTTP 200
- [ ] Each returns a number (count of articles)
- [ ] At least one sentiment has articles

### Test 3: Article Structure

```bash
curl "$API_URL?sentiment=all" | jq '.articles[0]'
```

✅ Checks Article has all fields:
- [ ] `title` (string)
- [ ] `url` (valid URL)
- [ ] `source` (string)
- [ ] `pubDate` (ISO 8601 format)
- [ ] `tickers` (array of strings)
- [ ] `snippet` (string)
- [ ] `sentiment` (Positive/Negative/Neutral)
- [ ] `score` (number between 0-1)
- [ ] `emoji` (🐂 or 🐻 or ⚪)

### Test 4: Invalid Sentiment Parameter

```bash
curl "$API_URL?sentiment=invalid"
```

✅ Checks:
- [ ] Returns HTTP 400 (Bad Request)
- [ ] Response contains "Invalid sentiment parameter" error message

### Test 5: Cache Performance

```bash
# First call (cache miss)
time curl "$API_URL" > /dev/null

# Second call (cache hit) - within same minute
time curl "$API_URL" > /dev/null
```

✅ Checks:
- [ ] First call takes 2-4 seconds
- [ ] Second call takes <500ms
- [ ] Second call is significantly faster (proof of caching)

---

## 📊 Monitoring & Logs

### Check Lambda Logs

```bash
aws logs tail /aws/lambda/crypto-news-enricher --follow --since 5m
```

✅ Checks:
- [ ] Logs appear within 30 seconds
- [ ] No ERROR lines visible
- [ ] See "INFO Crypto news request received"
- [ ] See "INFO Articles cached" or "INFO Cache hit"

### Check CloudWatch Metrics

```bash
# Lambda invocation count
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Invocations \
  --dimensions Name=FunctionName,Value=crypto-news-enricher \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S)Z \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S)Z \
  --period 300 \
  --statistics Sum
```

✅ Checks:
- [ ] Metric has data points (if API was called)
- [ ] No errors in output

### Verify DynamoDB Cache

```bash
aws dynamodb scan --table-name crypto-news-cache --limit 1
```

✅ Checks:
- [ ] If called API before: Item exists in table
- [ ] Item has "queryKey", "articles", "ttl" fields
- [ ] TTL is in future (epoch timestamp > current time)

---

## 🌐 Frontend Integration

### Add API Endpoint to Frontend

```bash
# Get endpoint
API_URL=$(cd terraform && terraform output -raw api_gateway_url)
echo "Add this to src/index.html:"
echo "const API_URL = \"$API_URL\";"
```

✅ Checks:
- [ ] Copied API URL from above
- [ ] Added to JavaScript section in src/index.html
- [ ] URL format is correct (https://...../news)

### Add News Section HTML

Per [FRONTEND_INTEGRATION.md](./FRONTEND_INTEGRATION.md):

✅ Checks:
- [ ] Added sentiment filter buttons
- [ ] Added news container div
- [ ] Added cache info display

### Add News CSS

Per [FRONTEND_INTEGRATION.md](./FRONTEND_INTEGRATION.md):

✅ Checks:
- [ ] Added .news-section styles
- [ ] Added .news-grid styles
- [ ] Added .news-card styles
- [ ] Added emoji styles

### Add News JavaScript

Per [FRONTEND_INTEGRATION.md](./FRONTEND_INTEGRATION.md):

✅ Checks:
- [ ] Added fetchCryptoNews function
- [ ] Added renderNews function
- [ ] Added event listeners for filter buttons
- [ ] Added auto-refresh interval

### Test Frontend Integration

1. Push changes to GitHub (if using CI/CD)
2. Wait for CloudFront to update (1-2 minutes)
3. Visit your live URL
4. Scroll to news section

✅ Checks:
- [ ] News section loads
- [ ] Articles display with titles
- [ ] Sentiment emojis appear (🐂, 🐻, ⚪)
- [ ] Filter buttons work (click positive/negative/neutral)
- [ ] Articles filter correctly
- [ ] No console errors (F12 → Console)

---

## 🔍 Final Verification

### End-to-End Test

1. Call API directly via curl ✅
2. Verify articles have all fields ✅
3. Check CloudWatch logs ✅
4. Verify DynamoDB cached data ✅
5. Test frontend integration ✅

### Production Readiness Checklist

- [ ] All API tests pass
- [ ] No ERROR logs in CloudWatch
- [ ] DynamoDB table active with TTL enabled
- [ ] Frontend displays news correctly
- [ ] Cache is working (second call faster)
- [ ] Sentiment filtering works
- [ ] Cost estimates reasonable (<$20/month)
- [ ] Error handling graceful (fallback works)
- [ ] API accessible from frontend
- [ ] CORS headers present

### Security Checklist

- [ ] API key not in git history
- [ ] terraform.tfvars in .gitignore
- [ ] IAM role has least-privilege permissions
- [ ] No hardcoded secrets in source code
- [ ] Lambda environment variables secure
- [ ] API Gateway CORS configured correctly

---

## 🚀 Success Criteria

You have successfully deployed if:

✅ **Deployment Phase**
- Terraform apply completes without errors
- All AWS resources created (Lambda, DynamoDB, API Gateway, IAM)
- No resource creation failures

✅ **Testing Phase**
- API endpoint returns HTTP 200
- Articles display with sentiment data
- Cache works (2nd call faster than 1st)
- Sentiment filtering works
- CloudWatch logs show no errors

✅ **Frontend Phase**
- News section displays on website
- Articles load with sentiment emojis
- Filter buttons work
- No console errors

✅ **Production Readiness**
- Monitoring in place (CloudWatch)
- Cost within estimates
- Documentation complete
- Team trained on operations

---

## 📞 Troubleshooting Quick Links

| Issue | Check | Reference |
|-------|-------|-----------|
| API endpoint not working | Lambda logs, API Gateway | SETUP_NEWS_SERVICE.md |
| No articles returned | NewsData.io API key, rate limits | CRYPTO_NEWS_API.md |
| Sentiment not analyzing | Bedrock access, fallback logs | CRYPTO_NEWS_API.md |
| Frontend not loading news | API endpoint URL, CORS headers | FRONTEND_INTEGRATION.md |
| High costs | Cache TTL, Bedrock usage | CRYPTO_NEWS_API.md |

---

## 📝 Sign-Off

Once all checks pass, sign off on deployment:

```
Deployment Completed Successfully: [Date]
Deployed By: [Your Name]
API Endpoint: [Your API URL]
Region: [AWS Region]
Status: ✅ Ready for Production
```

---

**Print this checklist and keep it handy during deployment!**
