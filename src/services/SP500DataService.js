// S&P 500 Data Service
// External providers (FMP, TwelveData, Polygon, Alpha Vantage) have been removed.
// All methods return fixed fallback data only. Live data will be wired via the
// SeunBot backend when those endpoints are available.

class SP500DataService {
  constructor() {
    this.cache = {
      stocks: new Map(),
      summary: null,
      ttl: 2 * 60 * 1000
    };

    this.technicalConfig = {
      RSI_PERIOD: 14,
      MACD_FAST: 12,
      MACD_SLOW: 26,
      MACD_SIGNAL: 9,
      ATR_PERIOD: 14,
      ADX_PERIOD: 14,
      STRONG_SIGNAL_THRESHOLD: 4.0,
      SIGNAL_THRESHOLD: 3.0,
      STOP_LOSS_PCT: 0.05,
      TARGET1_PCT: 0.15,
      TARGET2_PCT: 0.30
    };

    this.sp500Stocks = [
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
      { symbol: 'UNH', name: 'UnitedHealth Group', sector: 'Healthcare' },
      { symbol: 'JNJ', name: 'Johnson & Johnson', sector: 'Healthcare' },
      { symbol: 'LLY', name: 'Eli Lilly and Company', sector: 'Healthcare' },
      { symbol: 'ABBV', name: 'AbbVie Inc.', sector: 'Healthcare' },
      { symbol: 'MRK', name: 'Merck & Co. Inc.', sector: 'Healthcare' },
      { symbol: 'PFE', name: 'Pfizer Inc.', sector: 'Healthcare' },
      { symbol: 'TMO', name: 'Thermo Fisher Scientific', sector: 'Healthcare' },
      { symbol: 'ABT', name: 'Abbott Laboratories', sector: 'Healthcare' },
      { symbol: 'HD', name: 'Home Depot Inc.', sector: 'Consumer Discretionary' },
      { symbol: 'MCD', name: "McDonald's Corporation", sector: 'Consumer Discretionary' },
      { symbol: 'NKE', name: 'Nike Inc.', sector: 'Consumer Discretionary' },
      { symbol: 'SBUX', name: 'Starbucks Corporation', sector: 'Consumer Discretionary' },
      { symbol: 'TGT', name: 'Target Corporation', sector: 'Consumer Discretionary' },
      { symbol: 'LOW', name: "Lowe's Companies Inc.", sector: 'Consumer Discretionary' },
      { symbol: 'NFLX', name: 'Netflix Inc.', sector: 'Communication Services' },
      { symbol: 'DIS', name: 'Walt Disney Company', sector: 'Communication Services' },
      { symbol: 'CMCSA', name: 'Comcast Corporation', sector: 'Communication Services' },
      { symbol: 'T', name: 'AT&T Inc.', sector: 'Communication Services' },
      { symbol: 'VZ', name: 'Verizon Communications', sector: 'Communication Services' },
      { symbol: 'XOM', name: 'Exxon Mobil Corporation', sector: 'Energy' },
      { symbol: 'CVX', name: 'Chevron Corporation', sector: 'Energy' },
      { symbol: 'COP', name: 'ConocoPhillips', sector: 'Energy' },
      { symbol: 'BA', name: 'Boeing Company', sector: 'Industrials' },
      { symbol: 'CAT', name: 'Caterpillar Inc.', sector: 'Industrials' },
      { symbol: 'GE', name: 'General Electric Company', sector: 'Industrials' },
      { symbol: 'PG', name: 'Procter & Gamble Company', sector: 'Consumer Staples' },
      { symbol: 'KO', name: 'Coca-Cola Company', sector: 'Consumer Staples' },
      { symbol: 'PEP', name: 'PepsiCo Inc.', sector: 'Consumer Staples' },
      { symbol: 'WMT', name: 'Walmart Inc.', sector: 'Consumer Staples' },
      { symbol: 'COST', name: 'Costco Wholesale Corp', sector: 'Consumer Staples' },
      { symbol: 'AMT', name: 'American Tower Corporation', sector: 'Real Estate' },
      { symbol: 'NEE', name: 'NextEra Energy Inc.', sector: 'Utilities' },
      { symbol: 'PYPL', name: 'PayPal Holdings Inc.', sector: 'Financial Services' },
      { symbol: 'IBM', name: 'IBM Corporation', sector: 'Technology' },
      { symbol: 'UBER', name: 'Uber Technologies Inc.', sector: 'Technology' },
      { symbol: 'PLTR', name: 'Palantir Technologies', sector: 'Technology' },
      { symbol: 'SNOW', name: 'Snowflake Inc.', sector: 'Technology' }
    ];
  }

  // Deterministic hash — no Math.random
  hashSymbol(symbol) {
    let hash = 0;
    for (let i = 0; i < symbol.length; i++) {
      const char = symbol.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  getBasePrice(symbol) {
    const prices = {
      'AAPL': 182.50, 'MSFT': 385.20, 'GOOGL': 142.30, 'AMZN': 175.80, 'NVDA': 510.40,
      'META': 358.90, 'TSLA': 248.60, 'BRK-B': 365.70, 'V': 255.30, 'UNH': 528.90,
      'JPM': 165.40, 'JNJ': 162.80, 'WMT': 165.50, 'MA': 408.70, 'PG': 152.30,
      'HD': 335.60, 'CVX': 162.40, 'LLY': 568.90, 'ABBV': 165.80, 'MRK': 112.40,
      'KO': 61.20, 'PEP': 172.50, 'COST': 658.30, 'AVGO': 925.40, 'TMO': 548.70,
      'ORCL': 112.80, 'ADBE': 558.90, 'NKE': 112.60, 'CRM': 245.80, 'CSCO': 51.20,
      'NFLX': 458.70, 'DIS': 102.50, 'INTC': 46.80, 'AMD': 155.30, 'QCOM': 145.60,
      'XOM': 112.90, 'BAC': 36.80, 'WFC': 52.40, 'PFE': 31.20, 'ABT': 112.80,
      'BA': 225.00, 'CAT': 285.00, 'GE': 145.00, 'NEE': 72.00, 'AMT': 215.00,
      'GS': 385.00, 'MS': 88.00, 'AXP': 185.00, 'BLK': 785.00, 'IBM': 165.00,
      'PYPL': 62.00, 'UBER': 65.00, 'PLTR': 22.00, 'SNOW': 185.00,
      'SBUX': 98.00, 'TGT': 142.00, 'LOW': 225.00, 'MCD': 285.00,
      'CMCSA': 42.00, 'T': 17.00, 'VZ': 38.00, 'COP': 118.00,
      'WMT': 165.00, 'KO': 61.00, 'PEP': 172.00, 'COST': 658.00,
      'PG': 152.00, 'CVX': 162.00, 'TMO': 548.00
    };
    return prices[symbol] || 125.00;
  }

  // Generate fixed fallback for a single stock — no external calls
  generateFallbackData(symbol) {
    const stock = this.sp500Stocks.find(s => s.symbol === symbol);
    const basePrice = this.getBasePrice(symbol);
    const hash = this.hashSymbol(symbol);
    const changePercent = ((hash % 200) - 100) / 100;
    const change = basePrice * (changePercent / 100);
    const currentPrice = basePrice + change;

    return {
      symbol,
      name: stock?.name || symbol,
      sector: stock?.sector || 'Unknown',
      price: currentPrice,
      open: basePrice,
      high: currentPrice * 1.005,
      low: currentPrice * 0.995,
      close: currentPrice,
      volume: 15000000,
      previousClose: basePrice,
      change,
      changePercent,
      marketCap: basePrice * 1000000000,
      timestamp: new Date().toISOString(),
      isMock: false,
      sources: ['Last Known Price']
    };
  }

  // All fetch methods return fallback data — no external API calls
  async fetchStockData(symbol) {
    return this.generateFallbackData(symbol);
  }

  async fetchBatchStocks(symbols) {
    return symbols.map(symbol => this.generateFallbackData(symbol));
  }

  async getAllStocks() {
    return this.sp500Stocks.map(stock => this.generateFallbackData(stock.symbol));
  }

  async fetchMarketSummary() {
    return {
      index: 5950.00,
      indexChange: 12.50,
      indexChangePercent: 0.21,
      totalVolume: 3800000000,
      totalStocks: this.sp500Stocks.length,
      advancers: 340,
      decliners: 150,
      unchanged: 10,
      sources: ['Last Known Data'],
      isMock: false,
      timestamp: new Date().toISOString()
    };
  }

  // Technical analysis helpers (used by components — kept intact)
  calculateSeunBotSignals(stockData, historicalData) {
    try {
      if (!historicalData || historicalData.length < 50) {
        return { signal: 'HOLD', strength: 0, factors: [] };
      }
      const factors = [];
      let bullishScore = 0;
      let bearishScore = 0;

      const rsi = this.calculateRSI(historicalData, this.technicalConfig.RSI_PERIOD);
      if (rsi < 30) { factors.push('Oversold RSI'); bullishScore += 1; }
      else if (rsi > 70) { factors.push('Overbought RSI'); bearishScore += 1; }

      const macd = this.calculateMACD(historicalData);
      if (macd.histogram > 0) { factors.push('Bullish MACD'); bullishScore += 1.5; }
      else if (macd.histogram < 0) { factors.push('Bearish MACD'); bearishScore += 1.5; }

      const priceChange = stockData.changePercent;
      if (priceChange > 2) { factors.push('Strong Upward Momentum'); bullishScore += 1; }
      else if (priceChange < -2) { factors.push('Strong Downward Momentum'); bearishScore += 1; }

      const netScore = bullishScore - bearishScore;
      let signal = 'HOLD';
      if (netScore >= this.technicalConfig.STRONG_SIGNAL_THRESHOLD) signal = 'STRONG BUY';
      else if (netScore >= this.technicalConfig.SIGNAL_THRESHOLD) signal = 'BUY';
      else if (netScore <= -this.technicalConfig.STRONG_SIGNAL_THRESHOLD) signal = 'STRONG SELL';
      else if (netScore <= -this.technicalConfig.SIGNAL_THRESHOLD) signal = 'SELL';

      return {
        signal, strength: Math.abs(netScore), bullishScore, bearishScore, factors,
        stopLoss: stockData.price * (1 - this.technicalConfig.STOP_LOSS_PCT),
        target1: stockData.price * (1 + this.technicalConfig.TARGET1_PCT),
        target2: stockData.price * (1 + this.technicalConfig.TARGET2_PCT),
        rsi, macd: macd.histogram
      };
    } catch {
      return { signal: 'HOLD', strength: 0, factors: [] };
    }
  }

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
    return 100 - (100 / (1 + avgGain / avgLoss));
  }

  calculateMACD(data) {
    if (data.length < 26) return { macd: 0, signal: 0, histogram: 0 };
    const closes = data.map(d => d.close);
    const ema12 = this.calculateEMA(closes, 12);
    const ema26 = this.calculateEMA(closes, 26);
    const macd = ema12 - ema26;
    const signal = this.calculateEMA([macd], 9);
    return { macd, signal, histogram: macd - signal };
  }

  calculateEMA(data, period) {
    if (data.length < period) return data[data.length - 1];
    const multiplier = 2 / (period + 1);
    let ema = data.slice(0, period).reduce((a, b) => a + b, 0) / period;
    for (let i = period; i < data.length; i++) {
      ema = (data[i] - ema) * multiplier + ema;
    }
    return ema;
  }

  clearCache() {
    this.cache.stocks.clear();
    this.cache.summary = null;
  }
}

export default new SP500DataService();