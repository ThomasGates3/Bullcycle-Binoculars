# Bullcycle Binoculars 🔭

A real-time cryptocurrency tracker that keeps you up to date in Web3. Monitor Bitcoin, Ethereum, Solana, and Hyperliquid prices with live updates, market dominance charts, and crypto news headlines—all in one sleek dashboard.

## 🌟 Features

- **Real-Time Price Tracking**: Live cryptocurrency prices updating every 15 seconds via CoinGecko API
- **Market Dominance Chart**: Interactive pie chart showing market cap distribution of tracked coins
- **AI-Powered Crypto News**: Latest news with sentiment analysis (🐂 Bullish, 🐻 Bearish, ⚪ Neutral)
- **News Sentiment Filtering**: Filter articles by bullish/bearish/neutral sentiment
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Dark Theme UI**: Modern dark interface with smooth animations and hover effects
- **Error Handling**: Graceful fallbacks and user-friendly error messages
- **Serverless Backend**: AWS Lambda microservice with DynamoDB caching

## 🚀 Quick Start

### Local Development

1. Clone the repository:
```bash
git clone https://github.com/ThomasGates3/bullcycle-binoculars.git
cd bullcycle-binoculars
```

2. Open `src/index.html` in your browser to see it in action:
```bash
open src/index.html
```

That's it! No build process, no dependencies, no setup required.

### Live Demo

**🌐 Website**: http://bullcycle-binoculars-049475639513.s3-website-us-east-1.amazonaws.com/

**✅ Features Working**:
- Real-time crypto prices (Bitcoin, Ethereum, Solana, Hyperliquid)
- Add/remove cryptocurrencies
- Market dominance chart
- Live crypto news with AI sentiment analysis
- Sentiment emoji indicators (🐂 Bullish | 🐻 Bearish | ⚪ Neutral)
- Filter news by sentiment

## 📊 Technical Architecture

```
┌─────────────────────────────────────────┐
│      Browser Application                │
│  (HTML/CSS/Vanilla JavaScript)          │
└─────────┬──────────────────────┬────────┘
          │                      │
    ┌─────▼──────┐        ┌──────▼──────────────┐
    │ CoinGecko  │        │ Lambda Microservice │
    │ Public API │        │ (Crypto News API)   │
    └────────────┘        └──────┬─────────────┘
          │                      │
          │              ┌───────▼────────┐
          │              │ DynamoDB Cache │
          │              │ (15-min TTL)   │
          │              └────────────────┘
          │                      │
          └──────────┬───────────┘
                     │
       ┌─────────────▼──────────────┐
       │ AWS S3 + CloudFront        │
       │ Static Website Hosting     │
       └────────────────────────────┘
```

### AWS Services

- **Amazon S3**: Static website hosting + source files
- **Amazon CloudFront**: CDN for global distribution and HTTPS
- **AWS Lambda**: Serverless microservice for crypto news
- **Amazon DynamoDB**: News cache with 15-minute TTL
- **AWS API Gateway**: REST endpoint for Lambda integration
- **AWS Bedrock**: Claude 3 Haiku for sentiment analysis
- **AWS IAM**: Least-privilege security roles
- **Amazon CloudWatch**: Logging and monitoring

## 🛠️ Technology Stack

| Category | Technology |
|----------|-----------|
| **Frontend** | HTML5, CSS3, Vanilla JavaScript |
| **Charting** | Chart.js |
| **Price Data** | CoinGecko API (free, no auth required) |
| **News API** | NewsData.io API |
| **Sentiment Analysis** | AWS Bedrock (Claude 3 Haiku) |
| **Backend** | Node.js 18.x Lambda (TypeScript) |
| **Caching** | DynamoDB with 15-minute TTL |
| **REST API** | AWS API Gateway |
| **Hosting** | AWS S3 + CloudFront |
| **Infrastructure** | Terraform |
| **Deployment** | AWS CLI / Terraform |

## 📈 Tracked Cryptocurrencies

1. **Bitcoin (BTC)** - The original cryptocurrency and market leader
2. **Ethereum (ETH)** - Smart contracts and Web3 ecosystem
3. **Solana (SOL)** - High-performance blockchain network
4. **Hyperliquid (HYPE)** - Decentralized perpetual futures protocol

## 🎯 Portfolio Highlights

This project demonstrates:

✅ **Frontend Development**
- Responsive design with CSS Grid and Flexbox
- DOM manipulation with vanilla JavaScript
- Event handling and state management

✅ **API Integration**
- RESTful API consumption and error handling
- Asynchronous programming with Fetch API
- Data transformation and formatting

✅ **Data Visualization**
- Interactive charts with Chart.js
- Real-time data updates and animations
- Responsive chart sizing

✅ **Cloud Deployment**
- AWS static website hosting
- CDN configuration for performance
- Infrastructure as Code patterns

✅ **Performance & UX**
- Optimized loading states
- Efficient DOM updates
- Smooth transitions and animations
- Accessibility considerations

## 🔄 How It Works

### Price Updates
1. App fetches current prices from CoinGecko API every 15 seconds
2. Prices are formatted and displayed in crypto cards
3. Market dominance is calculated and chart updates automatically
4. Error states are handled gracefully

### News with AI Sentiment Analysis
1. Frontend requests news from Lambda API endpoint
2. Lambda fetches 10 crypto news articles from NewsData.io
3. Bedrock analyzes sentiment of each article (🐂 Bullish, 🐻 Bearish, ⚪ Neutral)
4. Results cached in DynamoDB for 15 minutes (reduces costs 15x)
5. Frontend displays articles with emoji indicators
6. Users filter by sentiment with buttons

### Architecture
```
Browser → API Gateway → Lambda → NewsData.io API
                          ↓
                      Bedrock AI (Sentiment)
                          ↓
                      DynamoDB Cache
                          ↓
                      Response to Browser
```

**Cost**: $5-15/month (covered by free tier or minimal charge)

## 📦 Deployment Options

### Option A: Automated Deployment (Recommended)

**Infrastructure + CI/CD Setup:**

See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete step-by-step guide including:
- Setting up AWS credentials
- Deploying infrastructure with Terraform
- Configuring GitHub Actions CI/CD
- Automated S3 + CloudFront deployment

**Quick summary:**
1. Deploy infrastructure with Terraform (one-time)
2. Configure GitHub Secrets with AWS credentials
3. Push to main → automatic deployment to S3 + CloudFront
4. Get live URL instantly

### Option B: Manual S3 Upload

```bash
# Prerequisites: AWS account + AWS CLI configured

# 1. Create S3 bucket (replace with your name)
aws s3 mb s3://bullcycle-binoculars-yourname

# 2. Enable static website hosting
aws s3 website s3://bullcycle-binoculars-yourname \
  --index-document index.html \
  --error-document index.html

# 3. Set bucket policy for public access
aws s3api put-bucket-policy --bucket bullcycle-binoculars-yourname \
  --policy file://bucket-policy.json

# 4. Upload files
aws s3 sync src/ s3://bullcycle-binoculars-yourname/ --delete

# 5. Access site
# http://bullcycle-binoculars-yourname.s3-website-us-east-1.amazonaws.com
```

---

## ✨ What's Included

### Terraform Infrastructure (Option B Recommended)
- **S3 Bucket** with static website hosting enabled
- **CloudFront Distribution** for global CDN delivery
- **Bucket Policies** for secure public access
- **CORS Configuration** for proper file serving
- **CloudFront Origin Access Identity** for S3 security

### GitHub Actions CI/CD
- **Automatic Deployments**: Push to main → deployed to S3
- **Cache Invalidation**: CloudFront cache automatically cleared
- **Multi-Step Workflow**: Plan, sync, invalidate, verify
- **Detailed Logging**: See deployment status in GitHub Actions

---

## 🚀 Deploy in 5 Steps

1. **Set up AWS credentials** → See DEPLOYMENT.md
2. **Run Terraform** → Creates S3 + CloudFront infrastructure
3. **Add GitHub Secrets** → AWS credentials for CI/CD
4. **Push to main** → Automatic deployment starts
5. **View live URL** → Site goes live globally via CloudFront

**⏱️ Total time: ~15 minutes (5-10 for CloudFront to propagate)**

---

## 📋 Deployment Checklist

- [ ] AWS account created
- [ ] Terraform deployed infrastructure
- [ ] GitHub Secrets configured (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY)
- [ ] First push to main triggers deployment
- [ ] S3 bucket contains files
- [ ] CloudFront distribution active
- [ ] Live URL accessible globally
- [ ] Real-time price updates working
- [ ] Mobile responsiveness verified
- [ ] Share CloudFront URL with portfolio!

## 🧪 Testing

The application includes real-time error handling and graceful fallbacks:

- **Network Errors**: User-friendly error messages with retry capability
- **Image Load Failures**: Fallback to styled initial badges
- **API Rate Limits**: Automatic retry with exponential backoff (future enhancement)

## 💰 Cost Breakdown

This project stays within AWS Free Tier:

| Service | Free Tier | Project Usage |
|---------|-----------|---------------|
| S3 Storage | 5 GB/month | <1 MB |
| CloudFront Data Transfer | 50 GB/month | Minimal |
| CloudFront Requests | 2M requests/month | ~100-1K/month |
| **Monthly Cost** | - | **$0** |

## 🚀 Future Enhancements

- [ ] Add price alerts and notifications
- [ ] Implement dark/light mode toggle
- [ ] Real news integration from crypto news APIs
- [ ] Historical price charts (7d, 30d, 1y)
- [ ] User watchlist with localStorage persistence
- [ ] Portfolio tracking feature
- [ ] Advanced analytics (ATH, 24h high/low, volume)
- [ ] Performance metrics dashboard

## 🤝 Contributing

Contributions are welcome! Please feel free to:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📜 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support & Troubleshooting

### Common Issues

**Q: Prices not updating?**
- Check browser console for errors (F12 → Console tab)
- Verify internet connection
- Check if CoinGecko API is accessible (https://api.coingecko.com)

**Q: Chart not displaying?**
- Ensure Chart.js CDN is accessible
- Check browser console for JavaScript errors
- Verify canvas element is rendering

**Q: Images not loading?**
- Fallback styling should display initials automatically
- Check internet connection
- Verify CoinGecko CDN is accessible

### Getting Help

- Check the browser console (F12) for detailed error messages
- Review the GitHub Issues page
- Open a new issue with detailed error information

## 👤 Author

**Thomas Gates**
- GitHub: [@ThomasGates3](https://github.com/ThomasGates3)
- Portfolio: Check out other projects on GitHub!

## 🙏 Acknowledgments

- **CoinGecko** - Free cryptocurrency data API
- **Chart.js** - Simple yet powerful charting library
- **AWS** - Cloud infrastructure and hosting
- The Web3 community for inspiration and collaboration

---

**Last Updated**: October 2024
**Version**: 1.0.0

⭐ If you find this project useful, please consider giving it a star on GitHub!