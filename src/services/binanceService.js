// Binance Service
// Live Binance REST and WebSocket connections have been removed.
// Returns fixed fallback data only. Crypto market is not active in production.

class BinanceService {
  getFallbackUsdtPairs() {
    return [
      { symbol: 'BTCUSDT', price: 43250.50, priceChangePercent: 2.5, volume: 15000000, quoteVolume: 650000000000, highPrice: 44000, lowPrice: 42500, openPrice: 42800, count: 1500000 },
      { symbol: 'ETHUSDT', price: 2680.75, priceChangePercent: 1.8, volume: 8000000, quoteVolume: 21000000000, highPrice: 2720, lowPrice: 2650, openPrice: 2665, count: 800000 },
      { symbol: 'BNBUSDT', price: 315.20, priceChangePercent: 3.2, volume: 2000000, quoteVolume: 630000000, highPrice: 320, lowPrice: 310, openPrice: 312, count: 200000 },
      { symbol: 'ADAUSDT', price: 0.485, priceChangePercent: -1.2, volume: 50000000, quoteVolume: 24000000, highPrice: 0.495, lowPrice: 0.480, openPrice: 0.491, count: 150000 },
      { symbol: 'XRPUSDT', price: 0.625, priceChangePercent: -0.8, volume: 30000000, quoteVolume: 18750000, highPrice: 0.635, lowPrice: 0.620, openPrice: 0.630, count: 120000 },
      { symbol: 'SOLUSDT', price: 98.45, priceChangePercent: -2.1, volume: 5000000, quoteVolume: 492250000, highPrice: 102, lowPrice: 96, openPrice: 100.5, count: 180000 },
      { symbol: 'DOGEUSDT', price: 0.0785, priceChangePercent: 4.2, volume: 200000000, quoteVolume: 15700000, highPrice: 0.082, lowPrice: 0.075, openPrice: 0.0753, count: 300000 },
      { symbol: 'MATICUSDT', price: 0.8950, priceChangePercent: 0.5, volume: 25000000, quoteVolume: 22375000, highPrice: 0.905, lowPrice: 0.885, openPrice: 0.891, count: 95000 }
    ];
  }

  async getAllUsdtPairs() {
    return this.getFallbackUsdtPairs();
  }

  async getTopUsdtPairs(limit = 50) {
    return this.getFallbackUsdtPairs().slice(0, limit);
  }

  async getMarketSummary() {
    const pairs = this.getFallbackUsdtPairs();
    return {
      totalPairs: pairs.length,
      gainers: pairs.filter(p => p.priceChangePercent > 0).length,
      losers: pairs.filter(p => p.priceChangePercent < 0).length,
      totalVolume: pairs.reduce((sum, p) => sum + p.quoteVolume, 0),
      timestamp: Date.now()
    };
  }

  // WebSocket stub — no real connection
  createWebSocket(_symbols, _onUpdate) {
    console.warn('Binance WebSocket disabled — external APIs removed.');
    return null;
  }
}

export default new BinanceService();