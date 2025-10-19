# Deploy Website - bullcycle-binoculars

**Current Status**: API is live ✅ | Website needs deployment ⏳

---

## Current Infrastructure

✅ **API Gateway**: https://rex64qt8w9.execute-api.us-east-1.amazonaws.com/prod/news
✅ **Lambda**: crypto-news-enricher (Active)
✅ **DynamoDB**: crypto-news-cache (Active)
❌ **Website**: Not deployed yet

---

## Why Website Isn't Deployed

The S3 bucket already exists from previous deployments. To deploy the website, we need to:

1. **Option A**: Deploy to existing S3 bucket (Recommended - Faster)
2. **Option B**: Destroy and recreate all infrastructure (Takes longer)

---

## Option A: Deploy to Existing S3 Bucket (⚡ Recommended)

### Step 1: Check Bucket Name

```bash
aws s3 ls | grep bullcycle-binoculars
```

Output should show:
```
2025-10-19 15:20:53 bullcycle-binoculars-049475639513
```

### Step 2: Upload Website Files

```bash
# Navigate to project directory
cd /Users/tg3/dev/bullcycle-binoculars

# Upload the index.html to S3
aws s3 cp src/index.html s3://bullcycle-binoculars-049475639513/index.html --acl public-read --cache-control "max-age=3600"

# Verify upload
aws s3 ls s3://bullcycle-binoculars-049475639513/
```

### Step 3: Get Website URL

```bash
# Get S3 website endpoint
aws s3api get-bucket-website --bucket bullcycle-binoculars-049475639513 --region us-east-1
```

Or directly access:
```
http://bullcycle-binoculars-049475639513.s3-website-us-east-1.amazonaws.com/index.html
```

### Step 4: Update API Endpoint

The `src/index.html` already has the API endpoint configured:

```javascript
const CRYPTO_NEWS_API_URL = 'https://rex64qt8w9.execute-api.us-east-1.amazonaws.com/prod/news';
```

This is already in the file, so the website will automatically connect to the live API!

### Step 5: Test Website

```bash
# Get the exact S3 website URL
aws s3api get-bucket-website --bucket bullcycle-binoculars-049475639513

# Open in browser:
# http://bullcycle-binoculars-049475639513.s3-website-us-east-1.amazonaws.com/
```

---

## Option B: Clean Deploy with CloudFront (Recommended for Production)

If you want to use CloudFront and have a cleaner setup:

### Step 1: Destroy Current Infrastructure

```bash
cd terraform

# This will delete Lambda, DynamoDB, API Gateway, but keep S3
terraform destroy -var-file=terraform.tfvars -auto-approve
```

### Step 2: Empty S3 Bucket

```bash
aws s3 rm s3://bullcycle-binoculars-049475639513 --recursive

# Or use force_destroy already configured in Terraform
```

### Step 3: Re-deploy Everything

```bash
# Rebuild Lambda package
cd ../
bash deploy-lambda.sh
```

This will:
- Rebuild Lambda function
- Recreate DynamoDB cache
- Recreate API Gateway
- Create S3 bucket
- Create CloudFront distribution
- Deploy website

---

## Quick Deploy Script

Here's a one-liner to deploy the website to S3:

```bash
aws s3 cp src/index.html s3://bullcycle-binoculars-049475639513/index.html --acl public-read && \
echo "Website uploaded!" && \
echo "Access at: http://bullcycle-binoculars-049475639513.s3-website-us-east-1.amazonaws.com/"
```

---

## Verify Website Deployment

### Check S3 Bucket Configuration

```bash
aws s3api get-bucket-website --bucket bullcycle-binoculars-049475639513
```

Should return:
```json
{
  "IndexDocument": { "Suffix": "index.html" },
  "ErrorDocument": { "Key": "index.html" }
}
```

### Check File in Bucket

```bash
aws s3 ls s3://bullcycle-binoculars-049475639513/ --recursive
```

Should show:
```
2025-10-19 16:00:00          31000 index.html
```

### Test CORS from API

```bash
curl -H "Origin: http://bullcycle-binoculars-049475639513.s3-website-us-east-1.amazonaws.com" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -X OPTIONS https://rex64qt8w9.execute-api.us-east-1.amazonaws.com/prod/news
```

---

## Website Features Once Deployed

Once deployed, users will see:

1. ✅ **Real-time crypto prices** (CoinGecko API)
2. ✅ **Live crypto news** (Your Lambda API)
3. ✅ **Sentiment analysis** (Claude 3 Haiku)
4. ✅ **Sentiment emojis** (🐂🐻⚪)
5. ✅ **Sentiment filters** (All, Bullish, Bearish, Neutral)
6. ✅ **Add/remove cryptos** (Interactive)
7. ✅ **Beautiful UI** (Green-on-black terminal style)

---

## API Endpoint Already Configured

✅ The `src/index.html` file already has:

```javascript
const CRYPTO_NEWS_API_URL = 'https://rex64qt8w9.execute-api.us-east-1.amazonaws.com/prod/news';
```

So when you deploy the website, it will automatically:
- Fetch news from your Lambda
- Display sentiment emojis
- Allow filtering by sentiment
- Show error messages if API fails

---

## Recommended Next Steps

### Fastest (5 minutes):
```bash
# 1. Upload HTML to S3
aws s3 cp src/index.html s3://bullcycle-binoculars-049475639513/index.html --acl public-read

# 2. Visit website
# http://bullcycle-binoculars-049475639513.s3-website-us-east-1.amazonaws.com/
```

### Production (15 minutes):
```bash
# 1. Destroy current setup
cd terraform && terraform destroy -var-file=terraform.tfvars -auto-approve

# 2. Clean deploy with CloudFront
cd .. && bash deploy-lambda.sh

# 3. Get CloudFront URL
terraform output cloudfront_domain_name
```

---

## Troubleshooting

### Website Shows Blank Page

1. Check browser console (F12) for errors
2. Verify API endpoint: `https://rex64qt8w9.execute-api.us-east-1.amazonaws.com/prod/news?sentiment=all`
3. Check browser CORS errors

### News Not Loading

1. Test API directly:
   ```bash
   curl "https://rex64qt8w9.execute-api.us-east-1.amazonaws.com/prod/news?sentiment=all"
   ```

2. Check Lambda logs:
   ```bash
   aws logs tail /aws/lambda/crypto-news-enricher --follow
   ```

3. Verify API endpoint in `src/index.html`:
   ```bash
   grep CRYPTO_NEWS_API_URL src/index.html
   ```

### S3 Access Denied

Make sure bucket has public read access:
```bash
aws s3api put-bucket-acl --bucket bullcycle-binoculars-049475639513 --acl public-read
```

---

## Summary

| Component | Status | URL |
|-----------|--------|-----|
| API | ✅ Live | https://rex64qt8w9.execute-api.us-east-1.amazonaws.com/prod/news |
| Lambda | ✅ Active | crypto-news-enricher |
| DynamoDB | ✅ Active | crypto-news-cache |
| Website | ⏳ Ready to deploy | S3 bucket ready |
| HTML | ✅ Ready | src/index.html configured |

**To deploy website now:**

```bash
aws s3 cp src/index.html s3://bullcycle-binoculars-049475639513/index.html --acl public-read
```

**Then visit:**

```
http://bullcycle-binoculars-049475639513.s3-website-us-east-1.amazonaws.com/
```

---

**Next**: Choose Option A or Option B above and deploy! 🚀
