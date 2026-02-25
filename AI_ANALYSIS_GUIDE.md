# AI Stock Analysis Setup Guide

## Overview
This guide explains how to set up AI-powered stock analysis using ChatGPT to analyze Nigerian Stock Exchange (NGX) stocks and ETFs.

## Features

### AI Analysis Capabilities
- **Fundamental Analysis**: P/E ratios, market cap, sector performance
- **Technical Analysis**: Price trends, support/resistance levels, momentum indicators
- **Risk Assessment**: Volatility analysis, market sentiment, risk levels
- **Recommendations**: Buy/Hold/Sell with confidence ratings (1-5 stars)
- **Price Targets**: 30-day price predictions
- **Key Insights**: Actionable bullet points for each stock
- **Market Summary**: Overview of all NGX stocks with top recommendations

### What You'll Get
1. **Individual Stock Analysis**:
   - Buy/Hold/Sell recommendation
   - Confidence level (1-5 stars)
   - Bullish/Neutral/Bearish sentiment
   - Risk level (Low/Medium/High)
   - Price target for next 30 days
   - 3 key insights
   - Technical analysis summary

2. **Market Summary**:
   - Total buy/hold/sell recommendations
   - Bullish vs bearish stock count
   - High-risk stock identification
   - Top 5 buy recommendations
   - Top 3 sell recommendations

## Setup Instructions

### Step 1: Get OpenAI API Key

1. **Sign up for OpenAI**:
   - Go to https://platform.openai.com/signup
   - Create an account (free)
   - Verify your email

2. **Get API Key**:
   - Go to https://platform.openai.com/api-keys
   - Click "Create new secret key"
   - Copy the key (starts with "sk-...")
   - **IMPORTANT**: Save it securely, you won't see it again!

3. **Add Credits** (Optional):
   - New accounts get $5 free credit
   - Each analysis costs ~$0.01-0.02
   - $5 = ~250-500 analyses
   - Add more at: https://platform.openai.com/account/billing

### Step 2: Configure Environment Variable

1. **Copy environment template**:
   ```bash
   cp .env.example .env
   ```

2. **Edit `.env` file** and add your OpenAI key:
   ```env
   VITE_OPENAI_API_KEY=sk-your-actual-openai-key-here
   ```

3. **Save the file**

### Step 3: Restart Development Server

```bash
pnpm run dev
```

### Step 4: Verify It's Working

1. Open the NGX Dashboard
2. Look for the "AI Market Analysis" section
3. Check browser console (F12) for:
   ```
   🤖 Analyzing DANGCEM with AI...
   ✅ AI analysis complete for DANGCEM
   ```
4. You should see AI-powered recommendations and insights

## Usage

### Individual Stock Analysis

The `AIStockAnalysis` component shows AI analysis for a single stock:

```jsx
import AIStockAnalysis from './components/AIStockAnalysis';

<AIStockAnalysis stock={stockData} />
```

**Features**:
- Recommendation badge (Buy/Hold/Sell)
- Confidence rating (1-5 stars)
- Sentiment indicator (Bullish/Neutral/Bearish)
- Risk level (Low/Medium/High)
- Price target
- Key insights (3 bullet points)
- Technical analysis summary
- Refresh button

### Market Summary

The `AIMarketSummary` component shows analysis for all stocks:

```jsx
import AIMarketSummary from './components/AIMarketSummary';

<AIMarketSummary stocks={allStocks} />
```

**Features**:
- Buy/Hold/Sell distribution
- Market sentiment overview
- High-risk stock count
- Top 5 buy recommendations
- Top 3 sell recommendations
- Refresh button

### Integration Example

```jsx
import React, { useState, useEffect } from 'react';
import RealNGXDataService from './services/RealNGXDataService';
import AIMarketSummary from './components/AIMarketSummary';
import AIStockAnalysis from './components/AIStockAnalysis';

function NGXDashboard() {
  const [stocks, setStocks] = useState([]);
  const [selectedStock, setSelectedStock] = useState(null);

  useEffect(() => {
    loadStocks();
  }, []);

  const loadStocks = async () => {
    const data = await RealNGXDataService.getAllStocks();
    setStocks(data);
  };

  return (
    <div>
      {/* Market Summary */}
      <AIMarketSummary stocks={stocks} />

      {/* Individual Stock Analysis */}
      {selectedStock && (
        <AIStockAnalysis stock={selectedStock} />
      )}
    </div>
  );
}
```

## Cost Estimation

### OpenAI API Pricing (GPT-4o-mini)
- **Input**: $0.150 per 1M tokens
- **Output**: $0.600 per 1M tokens

### Per Analysis Cost
- Average input: ~500 tokens
- Average output: ~300 tokens
- **Cost per analysis**: ~$0.01-0.02

### Usage Scenarios

**Free Tier ($5 credit)**:
- 250-500 stock analyses
- Sufficient for testing and initial use

**Light Usage** (10 analyses/day):
- ~$3-6 per month
- Good for personal use

**Heavy Usage** (100 analyses/day):
- ~$30-60 per month
- Suitable for professional traders

**Production** (1000 analyses/day):
- ~$300-600 per month
- Enterprise-level usage

### Optimization Tips

1. **Caching** (Already Implemented):
   - Analyses cached for 30 minutes
   - Reduces API calls by ~95%
   - Example: 100 stocks × 20 views/day = 2,000 potential calls
   - With cache: Only ~48 actual API calls

2. **Batch Processing**:
   - Analyze multiple stocks in one session
   - Rate limiting prevents excessive costs

3. **Selective Analysis**:
   - Only analyze stocks you're interested in
   - Use market summary for overview

## Fallback System

If OpenAI API is unavailable or not configured, the system automatically uses **technical analysis fallback**:

- Analyzes price trends and volatility
- Generates recommendations based on technical indicators
- Provides risk assessment
- Shows "Technical Analysis" instead of "AI Analysis"
- **No API costs**, works offline

## Troubleshooting

### "Analysis unavailable"
**Cause**: OpenAI API key not configured or invalid
**Solution**: 
1. Check `.env` file has correct API key
2. Verify key starts with "sk-"
3. Check API key is active at https://platform.openai.com/api-keys

### "Rate limit exceeded"
**Cause**: Too many API calls
**Solution**:
1. Wait a few minutes
2. OpenAI free tier: 3 requests/minute, 200 requests/day
3. Upgrade to paid tier for higher limits

### "Insufficient credits"
**Cause**: OpenAI account has no credits
**Solution**:
1. Add credits at https://platform.openai.com/account/billing
2. $10 minimum, lasts for ~500-1000 analyses

### Analysis shows "Technical Analysis" instead of "AI Analysis"
**Cause**: Fallback mode active (API key not configured or failed)
**Solution**:
1. Configure OpenAI API key in `.env`
2. Restart dev server
3. Check browser console for error messages

## API Response Format

The AI returns structured JSON:

```json
{
  "recommendation": "Buy",
  "confidence": 4,
  "insights": [
    "Strong upward momentum with 5.2% gain",
    "Trading above key support level",
    "High volume indicates strong buying interest"
  ],
  "technicalAnalysis": "Stock showing bullish momentum...",
  "riskLevel": "Medium",
  "priceTarget": 299.50,
  "sentiment": "Bullish",
  "reasoning": "Based on current price action and market conditions"
}
```

## Best Practices

1. **Cache Management**:
   - Don't refresh too frequently (wastes credits)
   - 30-minute cache is optimal for most use cases

2. **Batch Analysis**:
   - Analyze all stocks at once for market summary
   - Individual analyses on-demand

3. **Monitor Usage**:
   - Check OpenAI dashboard: https://platform.openai.com/usage
   - Set up billing alerts

4. **Combine with Real Data**:
   - Use financial data APIs for prices
   - Use AI for analysis and insights
   - Best of both worlds!

## Security

### API Key Protection
- ✅ Never commit `.env` to git (already in `.gitignore`)
- ✅ Use environment variables (not hardcoded)
- ✅ Rotate keys regularly
- ✅ Use separate keys for dev/production

### Rate Limiting
- ✅ Implemented in code (2-second delays between batches)
- ✅ Caching reduces API calls
- ✅ Graceful fallback if limits exceeded

## Advanced Features

### Custom Analysis Prompts
Edit `AIStockAnalyzer.js` to customize the analysis prompt:

```javascript
buildAnalysisPrompt(stockData) {
  return `Analyze this stock with focus on:
  - Dividend yield
  - Growth potential
  - Competitive advantage
  ...`;
}
```

### Different AI Models
Change the model in `AIStockAnalyzer.js`:

```javascript
this.model = 'gpt-4o-mini'; // Fast and cheap
// or
this.model = 'gpt-4o'; // More accurate, more expensive
```

### Extended Cache Time
Adjust cache TTL in `AIStockAnalyzer.js`:

```javascript
this.cache = {
  ttl: 60 * 60 * 1000 // 1 hour instead of 30 minutes
};
```

## Support

### OpenAI Documentation
- API Reference: https://platform.openai.com/docs/api-reference
- Pricing: https://openai.com/pricing
- Community: https://community.openai.com/

### Troubleshooting
1. Check browser console for error messages
2. Verify API key is correct
3. Check OpenAI usage dashboard
4. Review this guide's troubleshooting section

## Next Steps

1. ✅ Get OpenAI API key
2. ✅ Configure `.env` file
3. ✅ Restart dev server
4. ✅ Test with a few stocks
5. ✅ Monitor usage and costs
6. ✅ Customize prompts if needed
7. ✅ Deploy to production

**The AI analysis system is ready to use once you add your OpenAI API key!** 🚀