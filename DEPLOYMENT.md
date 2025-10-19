# Deployment Guide - Bullcycle Binoculars

This guide walks you through deploying the Bullcycle Binoculars crypto tracker to AWS S3 with CloudFront CDN and automated CI/CD.

---

## 🚀 Quick Start

### Prerequisites

- AWS Account
- Terraform installed (v1.0+)
- AWS CLI configured
- GitHub account with this repository
- Basic knowledge of AWS console

---

## 📋 Step 1: Set Up AWS Credentials

### Create IAM User for Deployment

1. Go to [AWS IAM Console](https://console.aws.amazon.com/iam/)
2. Click **Users** → **Create user**
3. Name it: `bullcycle-github-deploy`
4. Skip optional settings
5. Click **Attach policies directly**
6. Add these permissions:
   - `AmazonS3FullAccess`
   - `CloudFrontFullAccess`
7. Click **Create user**

### Generate Access Keys

1. Click the newly created user
2. Go to **Security credentials** tab
3. Click **Create access key** → select **GitHub Actions** → **Next**
4. Copy the **Access Key ID** and **Secret Access Key**
5. Store these securely (you'll need them in the next step)

---

## 🏗️ Step 2: Deploy Infrastructure with Terraform

### Option A: Deploy Locally (Recommended First Time)

```bash
# Navigate to terraform directory
cd terraform

# Initialize Terraform
terraform init

# Review what will be created
terraform plan

# Deploy infrastructure
terraform apply

# Note the outputs (especially 'live_url')
```

**What this creates:**
- ✅ S3 bucket for hosting
- ✅ CloudFront distribution (CDN)
- ✅ Bucket policies for public access
- ✅ CORS configuration

**Terraform Outputs:**
After applying, you'll see:
```
Outputs:

s3_bucket_name = "bullcycle-binoculars-123456789012"
cloudfront_domain_name = "d1234abcd.cloudfront.net"
live_url = "https://d1234abcd.cloudfront.net"
```

**⏳ Wait 5-10 minutes** for CloudFront to fully deploy.

### Option B: Destroy Infrastructure

If you need to remove everything and start over:

```bash
cd terraform
terraform destroy
# Type 'yes' to confirm
```

---

## 🔐 Step 3: Configure GitHub Secrets

Add AWS credentials to GitHub so CI/CD can deploy automatically.

1. Go to your GitHub repository
2. Settings → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add these secrets:

| Secret Name | Value |
|---|---|
| `AWS_ACCESS_KEY_ID` | From IAM user access key |
| `AWS_SECRET_ACCESS_KEY` | From IAM user secret key |

**Example:**
```
AWS_ACCESS_KEY_ID = AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY = wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
```

---

## 🚀 Step 4: Automated Deployments with CI/CD

### How It Works

Every time you push to the `main` branch:

1. **GitHub Actions** automatically runs `.github/workflows/deploy.yml`
2. Files from `src/` are synced to S3
3. CloudFront cache is invalidated (fresh content served globally)
4. Deployment completes in ~2-3 minutes

### Manual Deployment

```bash
# Push changes to GitHub
git add .
git commit -m "Update UI"
git push origin main

# Watch deployment in GitHub Actions
# Go to: Actions tab → Latest workflow run → View logs
```

### View Deployment Status

1. Go to your GitHub repository
2. Click **Actions** tab
3. See latest deployment status
4. Click workflow to see detailed logs

---

## 📊 Infrastructure Overview

```
┌─────────────────────────────────────────────┐
│          Your Local Machine                 │
│  ┌─────────────────────────────────────┐   │
│  │  Code (index.html, CSS, JavaScript) │   │
│  └─────────────────────────────────────┘   │
└─────────────────┬──────────────────────────┘
                  │ git push
                  │
┌─────────────────▼──────────────────────────┐
│        GitHub Repository                    │
│  ┌─────────────────────────────────────┐   │
│  │   GitHub Actions (CI/CD)            │   │
│  │   - Syncs to S3                     │   │
│  │   - Invalidates CloudFront          │   │
│  └─────────────────────────────────────┘   │
└─────────────────┬──────────────────────────┘
                  │
                  ├────────────────────┬──────────────────┐
                  │                    │                  │
        ┌─────────▼────────┐  ┌───────▼──────┐  ┌────────▼──────┐
        │   AWS S3 Bucket  │  │  CloudFront  │  │  AWS Account  │
        │  (Static Files)  │  │   (CDN)      │  │  ID: 12345... │
        └──────────────────┘  └──────┬───────┘  └───────────────┘
                                     │
                                     │ HTTPS
                                     │
                          ┌──────────▼─────────┐
                          │   User Browser     │
                          │ (Sees fast, global│
                          │  content delivery)│
                          └────────────────────┘
```

---

## 🔧 Customization

### Change AWS Region

Edit `terraform/terraform.tfvars`:
```hcl
aws_region = "eu-west-1"  # Change to your preferred region
```

Then reapply:
```bash
cd terraform
terraform apply
```

### Change Bucket Name

Edit `terraform/terraform.tfvars`:
```hcl
bucket_name = "my-custom-name"
```

Then reapply:
```bash
cd terraform
terraform apply
```

### Disable CloudFront (Use S3 directly)

Edit `terraform/terraform.tfvars`:
```hcl
enable_cloudfront = false
```

Then reapply:
```bash
cd terraform
terraform apply
```

---

## 🧪 Testing

### Verify S3 Upload

```bash
# List files in S3 bucket
aws s3 ls s3://YOUR_BUCKET_NAME/ --recursive

# Test downloading a file
aws s3 cp s3://YOUR_BUCKET_NAME/index.html - | head -20
```

### Test CloudFront

```bash
# Get CloudFront domain
aws cloudfront list-distributions --query "DistributionList.Items[0].DomainName" --output text

# Test the domain
curl -I https://YOUR_CLOUDFRONT_DOMAIN.cloudfront.net/
```

### Verify Site Works

1. Open CloudFront URL in browser: `https://your-domain.cloudfront.net`
2. Check that:
   - ✅ Page loads
   - ✅ Prices display
   - ✅ News articles show
   - ✅ Green cursor glow works
   - ✅ Add/remove crypto buttons work

---

## 📈 Monitoring & Costs

### CloudWatch Metrics

Monitor in AWS Console:
- S3 bucket size
- CloudFront requests/bandwidth
- Cache hit ratio

### Cost Estimation (Monthly)

| Service | Cost | Notes |
|---|---|---|
| S3 Storage | <$0.01 | Your app is ~50KB |
| S3 Requests | <$0.01 | ~1,000 requests/month |
| CloudFront | $0-5 | Depends on traffic |
| **Total** | **~$0-5/month** | Within AWS Free Tier |

---

## 🆘 Troubleshooting

### Problem: "Bucket already exists"

**Solution:** Bucket names are globally unique. Edit `terraform.tfvars` with a unique name:
```hcl
bucket_name = "bullcycle-binoculars-thomas-123"
```

### Problem: CloudFront says "Access Denied"

**Solution:** Wait 5-10 minutes for CloudFront to fully deploy. Check S3 bucket policy in AWS console.

### Problem: CI/CD deployment fails

**Check:**
1. GitHub Secrets are set correctly (Settings → Secrets)
2. AWS credentials have proper permissions (S3FullAccess)
3. S3 bucket still exists (wasn't deleted)

### Problem: Files not updating after push

**Solution:** CloudFront cache may be stale. The workflow should auto-invalidate, but you can manually:
```bash
cd terraform
DIST_ID=$(aws cloudfront list-distributions --query "DistributionList.Items[0].Id" --output text)
aws cloudfront create-invalidation --distribution-id $DIST_ID --paths "/*"
```

---

## 📝 Common Commands

```bash
# Check Terraform state
terraform show

# Plan changes before applying
terraform plan

# Apply infrastructure changes
terraform apply

# Destroy everything
terraform destroy

# Manually sync files to S3
aws s3 sync src/ s3://YOUR_BUCKET_NAME/ --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id DIST_ID --paths "/*"

# View CloudFront distributions
aws cloudfront list-distributions

# Check S3 bucket size
aws s3 ls s3://YOUR_BUCKET_NAME/ --recursive --summarize
```

---

## 🎯 Next Steps

1. ✅ Deploy infrastructure with Terraform
2. ✅ Configure GitHub Secrets
3. ✅ Push to `main` branch to trigger CI/CD
4. ✅ Verify deployment in GitHub Actions
5. ✅ Test live URL
6. ✅ Share CloudFront URL as your portfolio project!

---

## 📚 Resources

- [Terraform AWS Provider Docs](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [AWS S3 Static Website Hosting](https://docs.aws.amazon.com/AmazonS3/latest/userguide/WebsiteHosting.html)
- [CloudFront Documentation](https://docs.aws.amazon.com/cloudfront/)
- [GitHub Actions AWS Documentation](https://github.com/aws-actions)

---

**Questions?** Check the troubleshooting section or review the Terraform code in the `/terraform` directory.
