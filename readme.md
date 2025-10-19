# Bullcycle Binoculars 🔭

A real-time cryptocurrency tracker that keeps you up to date in Web3. Monitor Bitcoin, Ethereum, Solana, and Hyperliquid prices with live updates, market dominance charts, and crypto news headlines—all in one sleek dashboard.

## 🌟 Features

- **Real-Time Price Tracking**: Live cryptocurrency prices updating every 15 seconds via CoinGecko API
- **Market Dominance Chart**: Interactive pie chart showing market cap distribution of tracked coins
- **Crypto News**: Latest cryptocurrency news headlines integrated from premium sources
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Dark Theme UI**: Modern dark interface with smooth animations and hover effects
- **Error Handling**: Graceful fallbacks and user-friendly error messages
- **No Dependencies**: Pure vanilla JavaScript, HTML5, and CSS3—lightweight and fast

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

View the live deployment: https://d3e84acf01c0iv.cloudfront.net/

## 📊 Technical Architecture

```
┌──────────────────────────┐
│   Browser Application    │
│  (HTML/CSS/JavaScript)   │
└──────────────┬───────────┘
               │
        ┌──────▼──────┐
        │ CoinGecko   │
        │ Public API  │
        └─────────────┘
               │
┌──────────────▼──────────────┐
│   Static Web Hosting        │
│   (AWS S3 + CloudFront)     │
└─────────────────────────────┘
```

### AWS Services

- **Amazon S3**: Static website hosting
- **Amazon CloudFront**: CDN for global distribution and HTTPS
- **AWS Certificate Manager**: Free SSL/TLS certificates

## 🛠️ Technology Stack

| Category | Technology |
|----------|-----------|
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Charting | Chart.js |
| Data Source | CoinGecko API (free, no auth required) |
| Hosting | AWS S3 + CloudFront |
| Deployment | GitHub Actions (automated) |

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

### Data Flow
```javascript
CoinGecko API → Data Processing → DOM Rendering → Browser Display
     ↑                                                    │
     └────────────────── Auto-refresh (15s) ────────────┘
```

## 📦 Deployment to AWS S3

### Prerequisites
- AWS Account with S3 and CloudFront access
- AWS CLI configured (optional, can use AWS Console)

### Steps

1. **Create S3 Bucket**
   - Go to AWS S3 Console
   - Create bucket: `bullcycle-binoculars-{your-username}`
   - Enable static website hosting in bucket properties
   - Set index document to `index.html`

2. **Upload Files**
   ```bash
   cd src
   aws s3 sync . s3://bullcycle-binoculars-{your-username}/ --acl public-read
   ```

3. **Configure CloudFront**
   - Create CloudFront distribution
   - Set S3 bucket as origin
   - Enable HTTPS and HTTP/2
   - Set default root object to `index.html`

4. **Update Bucket Policy**
   ```json
   {
       "Version": "2012-10-17",
       "Statement": [{
           "Effect": "Allow",
           "Principal": "*",
           "Action": "s3:GetObject",
           "Resource": "arn:aws:s3:::bullcycle-binoculars-{your-username}/*"
       }]
   }
   ```

## 📋 Deployment Checklist

- [ ] Create S3 bucket with static website hosting enabled
- [ ] Upload `src/index.html` to S3 root
- [ ] Create CloudFront distribution pointing to S3
- [ ] Wait for CloudFront distribution to deploy (5-10 minutes)
- [ ] Test CloudFront URL in browser
- [ ] Verify real-time price updates working
- [ ] Check mobile responsiveness
- [ ] Confirm chart rendering correctly

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