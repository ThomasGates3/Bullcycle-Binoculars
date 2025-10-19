# Getting Started - Deploy Your Crypto Tracker

## 🎯 Overview

You now have everything you need to deploy your Bullcycle Binoculars crypto tracker to AWS with automated CI/CD. Here's what you have:

### What's Ready:
✅ **Complete Source Code** - Crypto tracker with real news, custom coins, cursor glow
✅ **Terraform Infrastructure** - S3 bucket + CloudFront CDN
✅ **GitHub Actions CI/CD** - Automatic deployment on push
✅ **Documentation** - Step-by-step deployment guide

---

## 📋 Your Action Checklist

Follow these steps in order. They should take about 15-20 minutes total.

### Step 1: Create AWS Account (5 minutes)
- [ ] Go to https://aws.amazon.com
- [ ] Click "Create AWS Account"
- [ ] Follow the registration process
- [ ] Verify email and add payment method
- [ ] **Save your AWS Account ID** (you'll need it)

### Step 2: Create IAM User for Deployment (3 minutes)
- [ ] Go to AWS Console → IAM
- [ ] Click Users → Create User
- [ ] Name: `bullcycle-github-deploy`
- [ ] Attach these permissions:
  - `AmazonS3FullAccess`
  - `CloudFrontFullAccess`
- [ ] Create access key (Security credentials tab)
- [ ] **Copy and save:**
  - `AWS_ACCESS_KEY_ID`
  - `AWS_SECRET_ACCESS_KEY`

### Step 3: Add GitHub Secrets (2 minutes)
- [ ] Go to your GitHub repo
- [ ] Settings → Secrets and variables → Actions
- [ ] Click "New repository secret"
- [ ] Add two secrets:
  ```
  Name: AWS_ACCESS_KEY_ID
  Value: AKIA... (from IAM user)

  Name: AWS_SECRET_ACCESS_KEY
  Value: wJalrX... (from IAM user)
  ```

### Step 4: Deploy Infrastructure with Terraform (5 minutes)
```bash
# In your terminal, navigate to project
cd /Users/tg3/dev/bullcycle-binoculars

# Go to terraform directory
cd terraform

# Initialize Terraform
terraform init

# Preview what will be created
terraform plan

# Deploy infrastructure (type 'yes' when prompted)
terraform apply

# ✅ Save these outputs:
# - s3_bucket_name
# - cloudfront_domain_name
# - live_url
```

**⏳ CloudFront takes 5-10 minutes to fully deploy. Be patient!**

### Step 5: Verify Deployment (3 minutes)
```bash
# After Terraform completes, test the infrastructure
aws s3 ls

# You should see your bucket listed
# Look for: bullcycle-binoculars-XXXXX

# Test S3 website
# http://bullcycle-binoculars-XXXXX.s3-website-us-east-1.amazonaws.com
```

### Step 6: Trigger First Automated Deployment (2 minutes)
```bash
# Make a small change (optional)
echo "# Deployed!" >> readme.md

# Push to GitHub (this triggers CI/CD)
git add readme.md
git commit -m "Trigger deployment"
git push origin main

# Watch the deployment:
# Go to GitHub → Actions tab → See your workflow run
```

**Once CloudFront is ready (5-10 min), your site is live at:**
```
https://YOUR_CLOUDFRONT_DOMAIN.cloudfront.net
```

---

## 🎬 What Happens After You Push

Every time you push to `main`:

```
1. GitHub Actions workflow triggers automatically
2. AWS CLI authenticates with your credentials
3. Files from src/ are synced to S3
4. CloudFront cache is invalidated
5. Your live site is updated (takes ~30-60 seconds)
6. Workflow shows success/failure status
```

---

## 🧪 Test Your Deployment

After everything is deployed, test these features:

### Core Functionality
- [ ] Page loads at live URL
- [ ] Crypto prices display and update every 15 seconds
- [ ] Green cursor glow follows your mouse
- [ ] Click "+ ADD CRYPTO" button works
- [ ] Search and add a cryptocurrency
- [ ] Remove a cryptocurrency with X button
- [ ] News articles are real and clickable

### User Experience
- [ ] Page is responsive on mobile
- [ ] No console errors (F12 → Console)
- [ ] Page loads quickly
- [ ] Prices update in real-time

### Deployment Pipeline
- [ ] Make a small code change
- [ ] Push to GitHub main branch
- [ ] Watch GitHub Actions run (Actions tab)
- [ ] See changes reflected on live site within 1-2 minutes

---

## 📊 File Structure

```
bullcycle-binoculars/
├── src/
│   └── index.html          (Main app - what gets deployed)
├── terraform/              (Infrastructure as Code)
│   ├── main.tf
│   ├── s3.tf               (S3 bucket config)
│   ├── cloudfront.tf       (CDN config)
│   ├── variables.tf
│   ├── outputs.tf
│   └── terraform.tfvars    (Configuration values)
├── .github/workflows/
│   └── deploy.yml          (CI/CD automation)
├── DEPLOYMENT.md           (Detailed deployment guide)
├── GETTING_STARTED.md      (This file)
└── bucket-policy.json      (S3 access policy template)
```

---

## 🆘 Troubleshooting

### "Bucket already exists" error
**Solution:** Bucket names are globally unique. Edit `terraform/terraform.tfvars`:
```hcl
bucket_name = "bullcycle-binoculars-thomas-2024"  # Add unique suffix
```

### CloudFront shows "Access Denied"
**Solution:** Wait 10 minutes for CloudFront to fully deploy. Check S3 bucket policy in AWS console.

### GitHub Actions deployment fails
**Check:**
1. Secrets are set correctly (Settings → Secrets)
2. AWS credentials have S3 + CloudFront permissions
3. S3 bucket still exists (wasn't accidentally deleted)

### Changes not showing after push
**Solution:** CloudFront caches files. The workflow should auto-invalidate, but manual fix:
```bash
cd terraform
DIST_ID=$(aws cloudfront list-distributions --query "DistributionList.Items[0].Id" --output text)
aws cloudfront create-invalidation --distribution-id $DIST_ID --paths "/*"
```

---

## 💰 Cost Estimate

Your deployment should be **FREE** under AWS Free Tier:

| Service | Cost | Reason |
|---|---|---|
| S3 Storage | Free | Your app is ~50KB |
| S3 Requests | Free | <1,000/month |
| CloudFront | Free | <50GB data transfer |
| **Total** | **$0/month** | Within free tier |

Even after free tier, costs would be minimal (~$1-5/month).

---

## 📚 Next Steps

### After Deployment Works:
1. **Share Your Portfolio** - Show friends the live CloudFront URL
2. **Monitor Costs** - Check AWS Billing dashboard monthly
3. **Add More Features** - You can enhance the app anytime
4. **Update Documentation** - Keep DEPLOYMENT.md current

### Potential Enhancements:
- Real news API integration (NewsAPI.org)
- Dark/light mode toggle
- User watchlists with localStorage
- More detailed price analytics
- Mobile app version

---

## 🔗 Important Links

| Link | Purpose |
|---|---|
| [AWS Console](https://console.aws.amazon.com) | Manage infrastructure |
| [GitHub Repo](https://github.com/ThomasGates3/Bullcycle-Binoculars) | Your code |
| [Terraform Docs](https://registry.terraform.io/providers/hashicorp/aws/latest/docs) | Infrastructure reference |
| [AWS S3 Docs](https://docs.aws.amazon.com/s3/) | Storage docs |
| [CloudFront Docs](https://docs.aws.amazon.com/cloudfront/) | CDN docs |

---

## ❓ Questions?

1. **Deployment stuck?** → Check DEPLOYMENT.md for detailed steps
2. **Terraform errors?** → Review terraform/ directory files
3. **CI/CD not working?** → Check .github/workflows/deploy.yml
4. **AWS questions?** → See troubleshooting section above

---

## 🎉 You're All Set!

You have:
- ✅ Production-grade infrastructure (S3 + CloudFront)
- ✅ Automated CI/CD pipeline (push → deploy)
- ✅ Professional crypto tracker app
- ✅ Portfolio-ready project

**Next action:** Follow the checklist above to deploy! 🚀

---

**Last updated:** October 2024
**Estimated deployment time:** 20-30 minutes
**Difficulty level:** Intermediate (clear steps provided)
