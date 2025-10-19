# Frontend Integration Guide - Crypto News API

This guide explains how to integrate the Crypto News Enrichment API into the bullcycle-binoculars frontend.

## Quick Start

### 1. Get the API Endpoint

After deploying the Lambda service, Terraform outputs the API URL:

```bash
cd terraform
terraform output api_gateway_url
# Output: https://abcdef123.execute-api.us-east-1.amazonaws.com/prod/news
```

Save this URL as an environment variable or constant in your HTML/JavaScript.

### 2. Basic API Call

```javascript
const API_URL = "https://your-api-gateway-url/news";

async function fetchCryptoNews(sentiment = "all") {
  try {
    const response = await fetch(`${API_URL}?sentiment=${sentiment}`);
    const data = await response.json();
    return data.articles;
  } catch (error) {
    console.error("Failed to fetch news:", error);
    return [];
  }
}

// Usage
const allArticles = await fetchCryptoNews();
const bullishArticles = await fetchCryptoNews("positive");
const bearishArticles = await fetchCryptoNews("negative");
```

## Complete Integration Example

### HTML Structure

```html
<!-- News section in src/index.html -->
<section class="news-section">
  <h2>Crypto News</h2>

  <div class="sentiment-filter">
    <button class="filter-btn active" data-sentiment="all">All</button>
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

### CSS Styling

```css
.news-section {
  margin-top: 2rem;
  padding: 1rem;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border-radius: 12px;
  border: 1px solid #00ff88;
}

.sentiment-filter {
  display: flex;
  gap: 0.5rem;
  margin: 1rem 0;
  flex-wrap: wrap;
}

.filter-btn {
  padding: 0.5rem 1rem;
  background: #0f3460;
  border: 1px solid #00ff88;
  color: #00ff88;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.9rem;
  font-weight: bold;
}

.filter-btn:hover,
.filter-btn.active {
  background: #00ff88;
  color: #0f3460;
  box-shadow: 0 0 20px rgba(0, 255, 136, 0.5);
}

.news-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
}

.news-card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(0, 255, 136, 0.3);
  border-radius: 8px;
  padding: 1rem;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
}

.news-card:hover {
  border-color: #00ff88;
  box-shadow: 0 0 15px rgba(0, 255, 136, 0.3);
}

.news-card a {
  color: #00ff88;
  text-decoration: none;
  font-weight: bold;
  margin-bottom: 0.5rem;
}

.news-card a:hover {
  text-decoration: underline;
}

.news-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.5rem;
}

.sentiment-badge {
  font-size: 1.5rem;
  margin-left: 0.5rem;
}

.news-source {
  font-size: 0.85rem;
  color: #888;
  margin-bottom: 0.5rem;
}

.news-date {
  font-size: 0.8rem;
  color: #666;
}

.news-snippet {
  color: #ccc;
  font-size: 0.9rem;
  flex-grow: 1;
  margin-bottom: 0.5rem;
  line-height: 1.4;
}

.news-tickers {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-top: auto;
}

.ticker-badge {
  background: rgba(0, 255, 136, 0.2);
  border: 1px solid #00ff88;
  color: #00ff88;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: bold;
}

.cache-info {
  margin-top: 1rem;
  text-align: right;
  color: #888;
  font-size: 0.85rem;
}

.news-loading {
  grid-column: 1 / -1;
  text-align: center;
  padding: 2rem;
  color: #00ff88;
}

.news-error {
  grid-column: 1 / -1;
  background: rgba(255, 0, 0, 0.1);
  border: 1px solid #ff4444;
  color: #ff8888;
  padding: 1rem;
  border-radius: 6px;
  text-align: center;
}
```

### JavaScript Implementation

```javascript
const API_URL = "https://your-api-gateway-url/news";
let currentSentiment = "all";
let newsData = null;

// Initialize news section
async function initNews() {
  const filterButtons = document.querySelectorAll(".filter-btn");
  filterButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      filterButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentSentiment = btn.dataset.sentiment;
      renderNews();
    });
  });

  await refreshNews();

  // Refresh every 15 minutes (align with API cache)
  setInterval(refreshNews, 15 * 60 * 1000);
}

async function refreshNews() {
  try {
    const container = document.getElementById("news-container");
    container.innerHTML = '<div class="news-loading">Loading news...</div>';

    const response = await fetch(`${API_URL}?sentiment=all`);
    if (!response.ok) throw new Error(`API error: ${response.status}`);

    newsData = await response.json();
    renderNews();
    updateCacheStatus(newsData.cacheUntil);
  } catch (error) {
    console.error("Failed to fetch crypto news:", error);
    const container = document.getElementById("news-container");
    container.innerHTML = `<div class="news-error">Failed to load news. Please try again.</div>`;
  }
}

function renderNews() {
  const container = document.getElementById("news-container");

  if (!newsData || !newsData.articles) {
    container.innerHTML = '<div class="news-error">No news available</div>';
    return;
  }

  const filtered = newsData.articles.filter(article => {
    if (currentSentiment === "all") return true;
    const sentimentLabel = currentSentiment.charAt(0).toUpperCase() + currentSentiment.slice(1);
    return article.sentiment === sentimentLabel;
  });

  if (filtered.length === 0) {
    container.innerHTML = `<div class="news-error">No ${currentSentiment} articles found</div>`;
    return;
  }

  container.innerHTML = filtered.map(article => `
    <article class="news-card">
      <div class="news-header">
        <a href="${article.url}" target="_blank" rel="noopener">${article.title}</a>
        <span class="sentiment-badge">${article.emoji}</span>
      </div>

      <div class="news-source">
        ${article.source} • <span class="news-date">${formatDate(article.pubDate)}</span>
      </div>

      <p class="news-snippet">${article.snippet}</p>

      ${article.tickers && article.tickers.length > 0 ? `
        <div class="news-tickers">
          ${article.tickers.map(ticker => `<span class="ticker-badge">${ticker}</span>`).join("")}
        </div>
      ` : ""}
    </article>
  `).join("");
}

function updateCacheStatus(cacheUntil) {
  const statusEl = document.getElementById("cache-status");
  const expireTime = new Date(cacheUntil);
  statusEl.textContent = `Cache expires at: ${expireTime.toLocaleTimeString()}`;
}

function formatDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
}

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", initNews);
```

## Adding to Existing index.html

### Step 1: Update HTML

Add the news section before closing `</main>` tag in `src/index.html`:

```html
<!-- Insert after cryptocurrency cards section -->
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

### Step 2: Update CSS

Add CSS to `<style>` tag (or external stylesheet).

### Step 3: Update JavaScript

Add JavaScript to `<script>` section (before closing `</body>`).

### Step 4: Set API URL

Update this line with your actual API endpoint:

```javascript
const API_URL = "https://your-actual-api-gateway-url/news";
```

## Environment Variable Strategy

### Option 1: Configuration File (Recommended)

Create `src/config.js`:

```javascript
// src/config.js
const CONFIG = {
  apiEndpoints: {
    cryptoNews: process.env.REACT_APP_NEWS_API || "https://default-api-url/news",
    priceData: "https://api.coingecko.com/api/v3",
  },
  cache: {
    ttl: 15 * 60 * 1000, // 15 minutes
  },
};

export default CONFIG;
```

Then use in `index.html`:

```html
<script src="config.js"></script>
<script>
  const API_URL = CONFIG.apiEndpoints.cryptoNews;
</script>
```

### Option 2: HTML Data Attributes

```html
<body data-news-api="https://your-api-url/news">
  <!-- ... -->
  <script>
    const API_URL = document.body.dataset.newsApi;
  </script>
</body>
```

### Option 3: Environment Variables (if using build tool)

If migrating to build tools (webpack, Vite):

```javascript
const API_URL = process.env.REACT_APP_NEWS_API;
```

Deploy to production with:

```bash
REACT_APP_NEWS_API=https://prod-api.com/news npm run deploy
```

## Advanced Features

### Auto-Refresh with Visual Feedback

```javascript
let isRefreshing = false;

async function refreshNews() {
  if (isRefreshing) return;
  isRefreshing = true;

  const container = document.getElementById("news-container");
  container.classList.add("refreshing");

  try {
    await loadNews();
  } finally {
    container.classList.remove("refreshing");
    isRefreshing = false;
  }
}

// CSS for refresh animation
.refreshing {
  opacity: 0.6;
  pointer-events: none;
}
```

### Real-time Sentiment Distribution Chart

```javascript
function updateSentimentChart() {
  if (!newsData || !newsData.articles) return;

  const sentiments = {
    positive: 0,
    negative: 0,
    neutral: 0,
  };

  newsData.articles.forEach(article => {
    const sentiment = article.sentiment.toLowerCase();
    if (sentiments[sentiment] !== undefined) {
      sentiments[sentiment]++;
    }
  });

  // Update chart display
  console.log("Sentiment distribution:", sentiments);
  // Use Chart.js or similar to visualize
}
```

### Search/Filter by Ticker

```javascript
function filterByTicker(ticker) {
  if (!newsData) return [];

  return newsData.articles.filter(article =>
    article.tickers && article.tickers.includes(ticker.toUpperCase())
  );
}

// Example: Show articles about Bitcoin
const btcArticles = filterByTicker("BTC");
```

## Error Handling

```javascript
async function fetchWithRetry(url, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url);
      if (response.ok) return response;

      if (response.status === 429) {
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      throw new Error(`HTTP ${response.status}`);
    } catch (error) {
      if (attempt === maxRetries) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
}
```

## Performance Optimization

### Lazy Loading

```javascript
// Only load news when user scrolls to section
const newsSection = document.querySelector(".news-section");
const observer = new IntersectionObserver((entries) => {
  if (entries[0].isIntersecting && !newsData) {
    initNews();
  }
}, { threshold: 0.1 });

observer.observe(newsSection);
```

### Debounced Filter Changes

```javascript
function debounce(fn, delay) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
}

const debouncedRender = debounce(() => renderNews(), 300);

filterButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    currentSentiment = btn.dataset.sentiment;
    debouncedRender();
  });
});
```

## Testing the Integration

```javascript
// Test in browser console
async function testNewsAPI() {
  console.log("Testing Crypto News API...");

  try {
    const response = await fetch(`${API_URL}?sentiment=all`);
    const data = await response.json();

    console.log("✅ API Response:", data);
    console.log(`✅ Articles count: ${data.articles.length}`);
    console.log(`✅ Sentiments:`, data.articles.reduce((acc, a) => {
      acc[a.sentiment] = (acc[a.sentiment] || 0) + 1;
      return acc;
    }, {}));

    return data;
  } catch (error) {
    console.error("❌ API Error:", error);
  }
}

// Run test
testNewsAPI();
```

---

## Troubleshooting

### "Failed to load news" Error

**Check browser console (F12)**:
- Are CORS headers present?
- Is API endpoint correct?
- Is API Gateway deployed?

**Test API endpoint**:
```bash
curl "https://your-api-url/news" -I
# Should return 200 OK
```

### Articles not showing sentiments

**Check**: Bedrock sentiment analysis may have failed but fallback keyword classifier should work

**Solution**: Wait for cache refresh or manually invoke Lambda

### Slow news loading (>3 seconds)

**Cause**: NewsData.io API slow or cache miss first time

**Solution**: Add loading state and spinner

---

**For deployment instructions, see [CRYPTO_NEWS_API.md](./CRYPTO_NEWS_API.md)**
