// Real Crypto Data Service
// Binance REST, CoinGecko, and WebSocket connections have been removed.
// Returns empty data. Crypto market is not active in production.
// Technical indicator calculations are kept for potential future use.

class RealCryptoDataService {
  constructor() {
    this.cache = new Map();
  }

  async fetchRealTimePrices(_symbols = []) {
    console.warn('RealCryptoDataService: external APIs removed. Returning empty array.');
    return [];
  }

  getCachedPrices(_symbols) {
    return [];
  }

  async fetchHistoricalData(_symbol, _interval = '1d', _limit = 100) {
    console.warn('RealCryptoDataService: external APIs removed. Returning empty array.');
    return [];
  }

  async getComprehensiveMarketData(_symbol) {
    console.warn('RealCryptoDataService: external APIs removed. Returning null.');
    return null;
  }

  // Technical indicator helpers — kept for future use
  calculateTechnicalIndicators(data) {
    if (!data || data.length < 20) {
      return { rsi: 50, macd: 0, sma20: 0, sma50: 0, ema12: 0, ema26: 0 };
    }
    const closes = data.map(d => d.close);
    return {
      rsi: this.calculateRSI(closes, 14),
      macd: this.calculateMACD(closes),
      sma20: this.calculateSMA(closes, 20),
      sma50: this.calculateSMA(closes, Math.min(50, closes.length)),
      ema12: this.calculateEMA(closes, 12),
      ema26: this.calculateEMA(closes, 26)
    };
  }

  calculateRSI(prices, period = 14) {
    if (prices.length < period + 1) return 50;
    let gains = 0, losses = 0;
    for (let i = prices.length - period; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1];
      if (change > 0) gains += change;
      else losses += Math.abs(change);
    }
    const avgGain = gains / period;
    const avgLoss = losses / period;
    if (avgLoss === 0) return 100;
    return 100 - (100 / (1 + avgGain / avgLoss));
  }

  calculateSMA(prices, period) {
    if (prices.length < period) return prices[prices.length - 1];
    const slice = prices.slice(-period);
    return slice.reduce((a, b) => a + b, 0) / period;
  }

  calculateEMA(prices, period) {
    if (prices.length < period) return prices[prices.length - 1];
    const multiplier = 2 / (period + 1);
    let ema = prices[0];
    for (let i = 1; i < prices.length; i++) {
      ema = (prices[i] * multiplier) + (ema * (1 - multiplier));
    }
    return ema;
  }

  calculateMACD(prices) {
    const ema12 = this.calculateEMA(prices, 12);
    const ema26 = this.calculateEMA(prices, 26);
    return ema12 - ema26;
  }

  // WebSocket stub — no real connection
  createWebSocket(_symbols, _onUpdate) {
    console.warn('RealCryptoDataService: WebSocket disabled — external APIs removed.');
    return null;
  }

  closeAllConnections() {
    // No-op
  }
}

export default new RealCryptoDataService();