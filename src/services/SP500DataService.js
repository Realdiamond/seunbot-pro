// S&P 500 Real-Time Data Service - Fetches data from Yahoo Finance, Google Finance, and Alpha Vantage
import axios from 'axios';

class SP500DataService {
  constructor() {
    // Multiple API endpoints for redundancy
    this.yahooFinanceAPI = 'https://query1.finance.yahoo.com/v8/finance/chart/';
    this.yahooQuoteAPI = 'https://query1.finance.yahoo.com/v7/finance/quote';
    this.googleFinanceAPI = 'https://www.google.com/finance/quote/';
    this.alphaVantageAPI = 'https://www.alphavantage.co/query';
    this.alphaVantageKey = 'demo'; // Replace with actual key if available
    
    // Cache for API responses
    this.cache = {
      stocks: new Map(),
      summary: null,
      ttl: 2 * 60 * 1000 // 2 minutes cache for more frequent updates
    };

    // SEUN BOT Technical Analysis Parameters (from SEUN BOT WEEKLY)
    this.technicalConfig = {
      RSI_PERIOD: 14,
      MACD_FAST: 12,
      MACD_SLOW: 26,
      MACD_SIGNAL: 9,
      ATR_PERIOD: 14,
      ADX_PERIOD: 14,
      PATTERN_LOOKBACK: 20,
      STRONG_SIGNAL_THRESHOLD: 4.0,
      SIGNAL_THRESHOLD: 3.0,
      STOP_LOSS_PCT: 0.05,
      TARGET1_PCT: 0.15,
      TARGET2_PCT: 0.30
    };

    // Top 100 S&P 500 stocks by market cap
    this.sp500Stocks = [
      // Technology
      { symbol: 'AAPL', name: 'Apple Inc.', sector: 'Technology' },
      { symbol: 'MSFT', name: 'Microsoft Corporation', sector: 'Technology' },
      { symbol: 'GOOGL', name: 'Alphabet Inc.', sector: 'Technology' },
      { symbol: 'AMZN', name: 'Amazon.com Inc.', sector: 'Technology' },
      { symbol: 'NVDA', name: 'NVIDIA Corporation', sector: 'Technology' },
      { symbol: 'META', name: 'Meta Platforms Inc.', sector: 'Technology' },
      { symbol: 'TSLA', name: 'Tesla Inc.', sector: 'Technology' },
      { symbol: 'AVGO', name: 'Broadcom Inc.', sector: 'Technology' },
      { symbol: 'ORCL', name: 'Oracle Corporation', sector: 'Technology' },
      { symbol: 'ADBE', name: 'Adobe Inc.', sector: 'Technology' },
      { symbol: 'CRM', name: 'Salesforce Inc.', sector: 'Technology' },
      { symbol: 'CSCO', name: 'Cisco Systems Inc.', sector: 'Technology' },
      { symbol: 'INTC', name: 'Intel Corporation', sector: 'Technology' },
      { symbol: 'AMD', name: 'Advanced Micro Devices', sector: 'Technology' },
      { symbol: 'QCOM', name: 'Qualcomm Inc.', sector: 'Technology' },
      
      // Financial Services
      { symbol: 'BRK-B', name: 'Berkshire Hathaway', sector: 'Financial Services' },
      { symbol: 'JPM', name: 'JPMorgan Chase & Co.', sector: 'Financial Services' },
      { symbol: 'V', name: 'Visa Inc.', sector: 'Financial Services' },
      { symbol: 'MA', name: 'Mastercard Inc.', sector: 'Financial Services' },
      { symbol: 'BAC', name: 'Bank of America Corp', sector: 'Financial Services' },
      { symbol: 'WFC', name: 'Wells Fargo & Company', sector: 'Financial Services' },
      { symbol: 'GS', name: 'Goldman Sachs Group', sector: 'Financial Services' },
      { symbol: 'MS', name: 'Morgan Stanley', sector: 'Financial Services' },
      { symbol: 'AXP', name: 'American Express Company', sector: 'Financial Services' },
      { symbol: 'BLK', name: 'BlackRock Inc.', sector: 'Financial Services' },
      
      // Healthcare
      { symbol: 'UNH', name: 'UnitedHealth Group', sector: 'Healthcare' },
      { symbol: 'JNJ', name: 'Johnson & Johnson', sector: 'Healthcare' },
      { symbol: 'LLY', name: 'Eli Lilly and Company', sector: 'Healthcare' },
      { symbol: 'ABBV', name: 'AbbVie Inc.', sector: 'Healthcare' },
      { symbol: 'MRK', name: 'Merck & Co. Inc.', sector: 'Healthcare' },
      { symbol: 'PFE', name: 'Pfizer Inc.', sector: 'Healthcare' },
      { symbol: 'TMO', name: 'Thermo Fisher Scientific', sector: 'Healthcare' },
      { symbol: 'ABT', name: 'Abbott Laboratories', sector: 'Healthcare' },
      { symbol: 'DHR', name: 'Danaher Corporation', sector: 'Healthcare' },
      { symbol: 'BMY', name: 'Bristol-Myers Squibb', sector: 'Healthcare' },
      
      // Consumer Discretionary
      { symbol: 'HD', name: 'Home Depot Inc.', sector: 'Consumer Discretionary' },
      { symbol: 'MCD', name: "McDonald's Corporation", sector: 'Consumer Discretionary' },
      { symbol: 'NKE', name: 'Nike Inc.', sector: 'Consumer Discretionary' },
      { symbol: 'SBUX', name: 'Starbucks Corporation', sector: 'Consumer Discretionary' },
      { symbol: 'TGT', name: 'Target Corporation', sector: 'Consumer Discretionary' },
      { symbol: 'LOW', name: "Lowe's Companies Inc.", sector: 'Consumer Discretionary' },
      { symbol: 'TJX', name: 'TJX Companies Inc.', sector: 'Consumer Discretionary' },
      
      // Communication Services
      { symbol: 'NFLX', name: 'Netflix Inc.', sector: 'Communication Services' },
      { symbol: 'DIS', name: 'Walt Disney Company', sector: 'Communication Services' },
      { symbol: 'CMCSA', name: 'Comcast Corporation', sector: 'Communication Services' },
      { symbol: 'T', name: 'AT&T Inc.', sector: 'Communication Services' },
      { symbol: 'VZ', name: 'Verizon Communications', sector: 'Communication Services' },
      
      // Energy
      { symbol: 'XOM', name: 'Exxon Mobil Corporation', sector: 'Energy' },
      { symbol: 'CVX', name: 'Chevron Corporation', sector: 'Energy' },
      { symbol: 'COP', name: 'ConocoPhillips', sector: 'Energy' },
      { symbol: 'SLB', name: 'Schlumberger Limited', sector: 'Energy' },
      { symbol: 'EOG', name: 'EOG Resources Inc.', sector: 'Energy' },
      
      // Industrials
      { symbol: 'BA', name: 'Boeing Company', sector: 'Industrials' },
      { symbol: 'CAT', name: 'Caterpillar Inc.', sector: 'Industrials' },
      { symbol: 'GE', name: 'General Electric Company', sector: 'Industrials' },
      { symbol: 'UPS', name: 'United Parcel Service', sector: 'Industrials' },
      { symbol: 'HON', name: 'Honeywell International', sector: 'Industrials' },
      { symbol: 'RTX', name: 'Raytheon Technologies', sector: 'Industrials' },
      { symbol: 'LMT', name: 'Lockheed Martin Corp', sector: 'Industrials' },
      
      // Consumer Staples
      { symbol: 'PG', name: 'Procter & Gamble Company', sector: 'Consumer Staples' },
      { symbol: 'KO', name: 'Coca-Cola Company', sector: 'Consumer Staples' },
      { symbol: 'PEP', name: 'PepsiCo Inc.', sector: 'Consumer Staples' },
      { symbol: 'WMT', name: 'Walmart Inc.', sector: 'Consumer Staples' },
      { symbol: 'COST', name: 'Costco Wholesale Corp', sector: 'Consumer Staples' },
      { symbol: 'PM', name: 'Philip Morris International', sector: 'Consumer Staples' },
      
      // Real Estate
      { symbol: 'AMT', name: 'American Tower Corporation', sector: 'Real Estate' },
      { symbol: 'PLD', name: 'Prologis Inc.', sector: 'Real Estate' },
      { symbol: 'CCI', name: 'Crown Castle Inc.', sector: 'Real Estate' },
      { symbol: 'EQIX', name: 'Equinix Inc.', sector: 'Real Estate' },
      
      // Materials
      { symbol: 'LIN', name: 'Linde plc', sector: 'Materials' },
      { symbol: 'APD', name: 'Air Products and Chemicals', sector: 'Materials' },
      { symbol: 'SHW', name: 'Sherwin-Williams Company', sector: 'Materials' },
      { symbol: 'FCX', name: 'Freeport-McMoRan Inc.', sector: 'Materials' },
      
      // Utilities
      { symbol: 'NEE', name: 'NextEra Energy Inc.', sector: 'Utilities' },
      { symbol: 'DUK', name: 'Duke Energy Corporation', sector: 'Utilities' },
      { symbol: 'SO', name: 'Southern Company', sector: 'Utilities' },
      { symbol: 'D', name: 'Dominion Energy Inc.', sector: 'Utilities' },
      
      // Additional Top Stocks
      { symbol: 'PYPL', name: 'PayPal Holdings Inc.', sector: 'Financial Services' },
      { symbol: 'IBM', name: 'IBM Corporation', sector: 'Technology' },
      { symbol: 'UBER', name: 'Uber Technologies Inc.', sector: 'Technology' },
      { symbol: 'ABNB', name: 'Airbnb Inc.', sector: 'Consumer Discretionary' },
      { symbol: 'SQ', name: 'Block Inc.', sector: 'Financial Services' },
      { symbol: 'SHOP', name: 'Shopify Inc.', sector: 'Technology' },
      { symbol: 'ZM', name: 'Zoom Video Communications', sector: 'Technology' },
      { symbol: 'SNAP', name: 'Snap Inc.', sector: 'Communication Services' },
      { symbol: 'SPOT', name: 'Spotify Technology', sector: 'Communication Services' },
      { symbol: 'RBLX', name: 'Roblox Corporation', sector: 'Communication Services' },
      { symbol: 'COIN', name: 'Coinbase Global Inc.', sector: 'Financial Services' },
      { symbol: 'HOOD', name: 'Robinhood Markets Inc.', sector: 'Financial Services' },
      { symbol: 'PLTR', name: 'Palantir Technologies', sector: 'Technology' },
      { symbol: 'SNOW', name: 'Snowflake Inc.', sector: 'Technology' }
    ];
  }

  // Fetch from Google Finance (web scraping alternative)
  async fetchFromGoogleFinance(symbol) {
    try {
      // Google Finance doesn't have a public API, but we can use their quote page
      const url = `https://www.google.com/finance/quote/${symbol}:NASDAQ`;
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 5000
      });

      // Parse HTML to extract price data (simplified - in production use proper HTML parser)
      const html = response.data;
      const priceMatch = html.match(/data-last-price="([^"]+)"/);
      const changeMatch = html.match(/data-last-change="([^"]+)"/);
      
      if (priceMatch && changeMatch) {
        return {
          price: parseFloat(priceMatch[1]),
          change: parseFloat(changeMatch[1]),
          source: 'Google Finance'
        };
      }
      return null;
    } catch (error) {
      console.warn(`Google Finance fetch failed for ${symbol}`);
      return null;
    }
  }

  // Fetch real-time stock data with multiple fallbacks
  async fetchStockData(symbol) {
    const cacheKey = `${symbol}_${Date.now() - (Date.now() % this.cache.ttl)}`;
    
    if (this.cache.stocks.has(cacheKey)) {
      return this.cache.stocks.get(cacheKey);
    }

    let stockData = null;
    const sources = [];

    // Try Yahoo Finance first
    try {
      const response = await axios.get(`${this.yahooFinanceAPI}${symbol}`, {
        params: {
          interval: '1d',
          range: '1d',
          includePrePost: true
        },
        timeout: 8000
      });

      const result = response.data.chart.result[0];
      const quote = result.indicators.quote[0];
      const meta = result.meta;

      const currentPrice = meta.regularMarketPrice || quote.close[quote.close.length - 1];
      const previousClose = meta.previousClose || meta.chartPreviousClose;

      stockData = {
        symbol: symbol,
        name: this.sp500Stocks.find(s => s.symbol === symbol)?.name || symbol,
        sector: this.sp500Stocks.find(s => s.symbol === symbol)?.sector || 'Unknown',
        price: currentPrice,
        open: quote.open[0] || currentPrice,
        high: Math.max(...quote.high.filter(v => v !== null)),
        low: Math.min(...quote.low.filter(v => v !== null && v > 0)),
        close: currentPrice,
        volume: quote.volume.reduce((a, b) => (a || 0) + (b || 0), 0),
        previousClose: previousClose,
        change: currentPrice - previousClose,
        changePercent: ((currentPrice - previousClose) / previousClose) * 100,
        marketCap: meta.marketCap || 0,
        timestamp: new Date(meta.regularMarketTime * 1000).toISOString(),
        isMock: false,
        sources: ['Yahoo Finance']
      };
      sources.push('Yahoo Finance');
    } catch (error) {
      console.warn(`Yahoo Finance failed for ${symbol}, trying Google Finance`);
    }

    // Fallback to Google Finance if Yahoo fails
    if (!stockData) {
      const googleData = await this.fetchFromGoogleFinance(symbol);
      if (googleData) {
        const previousClose = googleData.price - googleData.change;
        stockData = {
          symbol: symbol,
          name: this.sp500Stocks.find(s => s.symbol === symbol)?.name || symbol,
          sector: this.sp500Stocks.find(s => s.symbol === symbol)?.sector || 'Unknown',
          price: googleData.price,
          open: googleData.price,
          high: googleData.price * 1.02,
          low: googleData.price * 0.98,
          close: googleData.price,
          volume: 1000000,
          previousClose: previousClose,
          change: googleData.change,
          changePercent: (googleData.change / previousClose) * 100,
          marketCap: 0,
          timestamp: new Date().toISOString(),
          isMock: false,
          sources: ['Google Finance']
        };
        sources.push('Google Finance');
      }
    }

    // Final fallback to realistic simulated data
    if (!stockData) {
      console.warn(`All APIs failed for ${symbol}, using fallback data`);
      stockData = this.generateFallbackData(symbol);
    }

    this.cache.stocks.set(cacheKey, stockData);
    return stockData;
  }

  // Fetch multiple stocks in batch with improved error handling
  async fetchBatchStocks(symbols) {
    try {
      const symbolsString = symbols.join(',');
      const response = await axios.get(this.yahooQuoteAPI, {
        params: {
          symbols: symbolsString
        },
        timeout: 15000
      });

      const quotes = response.data.quoteResponse.result;
      return quotes.map(quote => {
        const currentPrice = quote.regularMarketPrice || quote.price;
        const previousClose = quote.regularMarketPreviousClose || currentPrice;
        
        return {
          symbol: quote.symbol,
          name: this.sp500Stocks.find(s => s.symbol === quote.symbol)?.name || quote.shortName || quote.symbol,
          sector: this.sp500Stocks.find(s => s.symbol === quote.symbol)?.sector || 'Unknown',
          price: currentPrice,
          open: quote.regularMarketOpen || currentPrice,
          high: quote.regularMarketDayHigh || currentPrice * 1.01,
          low: quote.regularMarketDayLow || currentPrice * 0.99,
          close: currentPrice,
          volume: quote.regularMarketVolume || 0,
          previousClose: previousClose,
          change: quote.regularMarketChange || (currentPrice - previousClose),
          changePercent: quote.regularMarketChangePercent || ((currentPrice - previousClose) / previousClose * 100),
          marketCap: quote.marketCap || 0,
          timestamp: new Date((quote.regularMarketTime || Date.now() / 1000) * 1000).toISOString(),
          isMock: false,
          sources: ['Yahoo Finance']
        };
      });

    } catch (error) {
      console.warn('Batch fetch failed, fetching individually');
      return Promise.all(symbols.map(symbol => this.fetchStockData(symbol)));
    }
  }

  // Get all S&P 500 stocks with improved reliability
  async getAllStocks() {
    console.log('📊 Fetching S&P 500 stocks data from multiple sources...');
    
    try {
      const batchSize = 50;
      const allStocks = [];

      for (let i = 0; i < this.sp500Stocks.length; i += batchSize) {
        const batch = this.sp500Stocks.slice(i, i + batchSize);
        const symbols = batch.map(s => s.symbol);
        
        try {
          const stocksData = await this.fetchBatchStocks(symbols);
          allStocks.push(...stocksData);
        } catch (error) {
          console.warn(`Batch ${i / batchSize + 1} failed, using fallback`);
          const fallbackData = batch.map(stock => this.generateFallbackData(stock.symbol));
          allStocks.push(...fallbackData);
        }
        
        // Rate limiting
        if (i + batchSize < this.sp500Stocks.length) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      console.log(`✅ Fetched ${allStocks.length} S&P 500 stocks`);
      return allStocks;

    } catch (error) {
      console.error('❌ Error fetching S&P 500 stocks:', error);
      return this.sp500Stocks.map(stock => this.generateFallbackData(stock.symbol));
    }
  }

  // Fetch market summary with improved accuracy
  async fetchMarketSummary() {
    const cacheKey = `summary_${Date.now() - (Date.now() % this.cache.ttl)}`;
    
    if (this.cache.summary && this.cache.summary.key === cacheKey) {
      return this.cache.summary.data;
    }

    try {
      const response = await axios.get(`${this.yahooFinanceAPI}^GSPC`, {
        params: {
          interval: '1d',
          range: '1d'
        },
        timeout: 10000
      });

      const result = response.data.chart.result[0];
      const meta = result.meta;
      const currentPrice = meta.regularMarketPrice;
      const previousClose = meta.previousClose || meta.chartPreviousClose;

      const summary = {
        index: currentPrice,
        indexChange: currentPrice - previousClose,
        indexChangePercent: ((currentPrice - previousClose) / previousClose) * 100,
        totalVolume: 0,
        totalStocks: this.sp500Stocks.length,
        advancers: 0,
        decliners: 0,
        unchanged: 0,
        sources: ['Yahoo Finance'],
        isMock: false,
        timestamp: new Date(meta.regularMarketTime * 1000).toISOString()
      };

      this.cache.summary = { key: cacheKey, data: summary };
      return summary;

    } catch (error) {
      console.warn('⚠️ Market summary fetch failed, using fallback');
      return {
        index: 4850.00,
        indexChange: 32.50,
        indexChangePercent: 0.67,
        totalVolume: 3800000000,
        totalStocks: this.sp500Stocks.length,
        advancers: 340,
        decliners: 150,
        unchanged: 10,
        sources: [],
        isMock: true,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Generate realistic fallback data
  generateFallbackData(symbol) {
    const stock = this.sp500Stocks.find(s => s.symbol === symbol);
    const basePrice = this.getBasePrice(symbol);
    const changePercent = (Math.random() - 0.5) * 4; // -2% to +2%
    const change = basePrice * (changePercent / 100);
    const currentPrice = basePrice + change;

    return {
      symbol: symbol,
      name: stock?.name || symbol,
      sector: stock?.sector || 'Unknown',
      price: currentPrice,
      open: basePrice,
      high: currentPrice * (1 + Math.random() * 0.02),
      low: currentPrice * (1 - Math.random() * 0.02),
      close: currentPrice,
      volume: Math.floor(Math.random() * 40000000) + 10000000,
      previousClose: basePrice,
      change: change,
      changePercent: changePercent,
      marketCap: basePrice * 1000000000,
      timestamp: new Date().toISOString(),
      isMock: true,
      sources: []
    };
  }

  // Get base price for fallback (more accurate prices)
  getBasePrice(symbol) {
    const prices = {
      'AAPL': 182.50, 'MSFT': 385.20, 'GOOGL': 142.30, 'AMZN': 175.80, 'NVDA': 510.40,
      'META': 358.90, 'TSLA': 248.60, 'BRK-B': 365.70, 'V': 255.30, 'UNH': 528.90,
      'JPM': 165.40, 'JNJ': 162.80, 'WMT': 165.50, 'MA': 408.70, 'PG': 152.30,
      'HD': 335.60, 'CVX': 162.40, 'LLY': 568.90, 'ABBV': 165.80, 'MRK': 112.40,
      'KO': 61.20, 'PEP': 172.50, 'COST': 658.30, 'AVGO': 925.40, 'TMO': 548.70,
      'ORCL': 112.80, 'ADBE': 558.90, 'NKE': 112.60, 'CRM': 245.80, 'CSCO': 51.20,
      'NFLX': 458.70, 'DIS': 102.50, 'INTC': 46.80, 'AMD': 155.30, 'QCOM': 145.60,
      'XOM': 112.90, 'BAC': 36.80, 'WFC': 52.40, 'PFE': 31.20, 'ABT': 112.80
    };
    return prices[symbol] || 125.00;
  }

  // Calculate SEUN BOT technical signals
  calculateSeunBotSignals(stockData, historicalData) {
    try {
      if (!historicalData || historicalData.length < 50) {
        return { signal: 'HOLD', strength: 0, factors: [] };
      }

      const factors = [];
      let bullishScore = 0;
      let bearishScore = 0;

      // RSI Analysis
      const rsi = this.calculateRSI(historicalData, this.technicalConfig.RSI_PERIOD);
      if (rsi < 30) {
        factors.push('Oversold RSI');
        bullishScore += 1;
      } else if (rsi > 70) {
        factors.push('Overbought RSI');
        bearishScore += 1;
      }

      // MACD Analysis
      const macd = this.calculateMACD(historicalData);
      if (macd.histogram > 0 && macd.macd > macd.signal) {
        factors.push('Bullish MACD');
        bullishScore += 1.5;
      } else if (macd.histogram < 0 && macd.macd < macd.signal) {
        factors.push('Bearish MACD');
        bearishScore += 1.5;
      }

      // Price Action
      const priceChange = stockData.changePercent;
      if (priceChange > 2) {
        factors.push('Strong Upward Momentum');
        bullishScore += 1;
      } else if (priceChange < -2) {
        factors.push('Strong Downward Momentum');
        bearishScore += 1;
      }

      // Volume Analysis
      const avgVolume = historicalData.slice(-20).reduce((sum, d) => sum + d.volume, 0) / 20;
      if (stockData.volume > avgVolume * 1.5) {
        factors.push('High Volume Confirmation');
        if (priceChange > 0) bullishScore += 0.5;
        else bearishScore += 0.5;
      }

      const netScore = bullishScore - bearishScore;
      let signal = 'HOLD';
      
      if (netScore >= this.technicalConfig.STRONG_SIGNAL_THRESHOLD) {
        signal = 'STRONG BUY';
      } else if (netScore >= this.technicalConfig.SIGNAL_THRESHOLD) {
        signal = 'BUY';
      } else if (netScore <= -this.technicalConfig.STRONG_SIGNAL_THRESHOLD) {
        signal = 'STRONG SELL';
      } else if (netScore <= -this.technicalConfig.SIGNAL_THRESHOLD) {
        signal = 'SELL';
      }

      return {
        signal,
        strength: Math.abs(netScore),
        bullishScore,
        bearishScore,
        factors,
        stopLoss: stockData.price * (1 - this.technicalConfig.STOP_LOSS_PCT),
        target1: stockData.price * (1 + this.technicalConfig.TARGET1_PCT),
        target2: stockData.price * (1 + this.technicalConfig.TARGET2_PCT),
        rsi,
        macd: macd.histogram
      };
    } catch (error) {
      console.error('Error calculating SEUN BOT signals:', error);
      return { signal: 'HOLD', strength: 0, factors: [] };
    }
  }

  // Simple RSI calculation
  calculateRSI(data, period = 14) {
    if (data.length < period + 1) return 50;
    
    const changes = data.slice(-period - 1).map((d, i, arr) => 
      i > 0 ? d.close - arr[i - 1].close : 0
    ).slice(1);
    
    const gains = changes.map(c => c > 0 ? c : 0);
    const losses = changes.map(c => c < 0 ? -c : 0);
    
    const avgGain = gains.reduce((a, b) => a + b, 0) / period;
    const avgLoss = losses.reduce((a, b) => a + b, 0) / period;
    
    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }

  // Simple MACD calculation
  calculateMACD(data) {
    if (data.length < 26) return { macd: 0, signal: 0, histogram: 0 };
    
    const closes = data.map(d => d.close);
    const ema12 = this.calculateEMA(closes, 12);
    const ema26 = this.calculateEMA(closes, 26);
    const macd = ema12 - ema26;
    const signal = this.calculateEMA([macd], 9);
    const histogram = macd - signal;
    
    return { macd, signal, histogram };
  }

  // Simple EMA calculation
  calculateEMA(data, period) {
    if (data.length < period) return data[data.length - 1];
    
    const multiplier = 2 / (period + 1);
    let ema = data.slice(0, period).reduce((a, b) => a + b, 0) / period;
    
    for (let i = period; i < data.length; i++) {
      ema = (data[i] - ema) * multiplier + ema;
    }
    
    return ema;
  }

  // Clear cache
  clearCache() {
    this.cache.stocks.clear();
    this.cache.summary = null;
    console.log('🗑️ S&P 500 data cache cleared');
  }
}

export default new SP500DataService();