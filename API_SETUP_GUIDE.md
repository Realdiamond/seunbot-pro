# NGX Real Data API Setup Guide

## Overview
This guide will help you set up real-time Nigerian Stock Exchange (NGX) data using financial data APIs.

## Recommended API Providers

### 1. **Twelve Data** (BEST FOR NGX) ⭐ RECOMMENDED
- **Free Tier**: 800 API calls per day
- **NGX Coverage**: Excellent (supports Nigerian stocks)
- **Pricing**: Free tier available
- **Sign Up**: https://twelvedata.com/pricing

**Why Twelve Data?**
- Best coverage for African markets including NGX
- Generous free tier (800 calls/day)
- Real-time and historical data
- Easy to use REST API

### 2. **Alpha Vantage**
- **Free Tier**: 25 API calls per day
- **NGX Coverage**: Limited
- **Pricing**: Free tier available
- **Sign Up**: https://www.alphavantage.co/support/#api-key

### 3. **Financial Modeling Prep (FMP)**
- **Free Tier**: 250 API calls per day
- **NGX Coverage**: Good
- **Pricing**: Free tier available
- **Sign Up**: https://site.financialmodelingprep.com/developer/docs/pricing

### 4. **Polygon.io**
- **Free Tier**: 5 calls per minute
- **NGX Coverage**: Limited
- **Pricing**: Free tier available
- **Sign Up**: https://polygon.io/pricing

## Setup Instructions

### Step 1: Get API Keys

1. **Twelve Data (Recommended)**:
   - Go to https://twelvedata.com/
   - Click "Get API Key"
   - Sign up with email
   - Copy your API key

2. **Alpha Vantage (Backup)**:
   - Go to https://www.alphavantage.co/support/#api-key
   - Enter your email
   - Copy the API key from your email

3. **Financial Modeling Prep (Optional)**:
   - Go to https://site.financialmodelingprep.com/developer/docs
   - Sign up for free account
   - Copy your API key from dashboard

### Step 2: Configure Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your API keys:
   ```env
   VITE_TWELVEDATA_API_KEY=your_actual_key_here
   VITE_ALPHAVANTAGE_API_KEY=your_actual_key_here
   VITE_FMP_API_KEY=your_actual_key_here
   ```

3. **IMPORTANT**: Never commit `.env` to git (it's in `.gitignore`)

### Step 3: Restart Development Server

```bash
pnpm run dev
```

### Step 4: Verify Setup

1. Open the NGX Dashboard
2. Check the browser console (F12)
3. Look for messages like:
   ```
   ✅ Twelve Data API: Successfully fetched 29 stocks
   ```
4. The data indicator should show "Live Data" (green) instead of "Mock Data"

## API Call Limits

### Free Tier Limits:
- **Twelve Data**: 800 calls/day (~33 calls/hour)
- **Alpha Vantage**: 25 calls/day (~1 call/hour)
- **FMP**: 250 calls/day (~10 calls/hour)
- **Polygon**: 5 calls/minute

### Optimization:
- Dashboard caches data for 5 minutes
- Only fetches when user opens NGX section
- Manual refresh button available
- Automatic fallback to next provider if limit reached

## Troubleshooting

### "Mock Data" Still Showing

**Possible Causes:**
1. API key not set in `.env`
2. API key is invalid
3. API rate limit exceeded
4. Network/CORS issues

**Solutions:**
1. Verify API key is correct in `.env`
2. Check browser console for error messages
3. Wait for rate limit to reset (usually 24 hours)
4. Try a different API provider

### CORS Errors

Some APIs may have CORS restrictions. The code includes:
- Proper headers for CORS
- Multiple provider fallbacks
- Proxy options if needed

### Rate Limit Exceeded

If you see "Rate limit exceeded":
1. Wait for the limit to reset (check API provider docs)
2. The system will automatically use fallback data
3. Consider upgrading to a paid tier for more calls
4. Use multiple API providers for redundancy

## NGX Stock Symbols

The system tracks 29 major NGX stocks:
- **Banking**: GTCO, ZENITHBANK, UBA, ACCESSCORP, FBNH, STANBIC, FIDELITYBK, STERLNBANK, WEMABANK
- **Industrial Goods**: DANGCEM, BUACEMENT, WAPCO, DANGSUGAR
- **Telecommunications**: MTNN, AIRTELAFRI
- **Oil & Gas**: SEPLAT, TOTAL, OANDO, CONOIL
- **Consumer Goods**: BUAFOODS, NESTLE, FLOURMILL, NASCON, NB, INTBREW, GUINNESS
- **Conglomerates**: TRANSCORP
- **Insurance**: MANSARD, AIICO

## API Response Examples

### Twelve Data Response:
```json
{
  "symbol": "DANGCEM",
  "name": "Dangote Cement",
  "exchange": "NGX",
  "currency": "NGN",
  "price": 285.50,
  "change": 5.20,
  "percent_change": 1.85,
  "volume": 1250000
}
```

### Alpha Vantage Response:
```json
{
  "Global Quote": {
    "01. symbol": "DANGCEM.LG",
    "05. price": "285.50",
    "09. change": "5.20",
    "10. change percent": "1.85%"
  }
}
```

## Support

If you encounter issues:
1. Check the browser console for detailed error messages
2. Verify your API keys are correct
3. Check API provider status pages
4. Review rate limit documentation

## Cost Estimation

### Free Tier Usage:
- **5-minute cache**: ~12 API calls per hour
- **8-hour trading day**: ~96 calls per day
- **Twelve Data free tier**: 800 calls/day ✅ Sufficient
- **Alpha Vantage free tier**: 25 calls/day ❌ Not sufficient

### Recommendation:
Use **Twelve Data** as primary provider with **Alpha Vantage** as backup.

## Paid Tier Comparison

| Provider | Price/Month | Calls/Day | NGX Coverage |
|----------|-------------|-----------|--------------|
| Twelve Data | $0 (Free) | 800 | ⭐⭐⭐⭐⭐ |
| Twelve Data | $29 | 8,000 | ⭐⭐⭐⭐⭐ |
| Alpha Vantage | $0 (Free) | 25 | ⭐⭐⭐ |
| Alpha Vantage | $49.99 | Unlimited | ⭐⭐⭐ |
| FMP | $0 (Free) | 250 | ⭐⭐⭐⭐ |
| FMP | $14 | 10,000 | ⭐⭐⭐⭐ |

## Next Steps

1. ✅ Get Twelve Data API key (recommended)
2. ✅ Add key to `.env` file
3. ✅ Restart dev server
4. ✅ Open NGX Dashboard
5. ✅ Verify "Live Data" indicator
6. ✅ Monitor API usage in provider dashboard

**For production deployment**, consider:
- Paid tier for higher limits
- Multiple API providers for redundancy
- Backend caching layer
- WebSocket connections for real-time updates