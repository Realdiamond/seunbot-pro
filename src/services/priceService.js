// Price Service
// Binance REST, Binance WebSocket, and TradingView connections have been removed.
// Returns fixed fallback data only. Crypto market is not active in production.

class PriceService {
  constructor() {
    this.priceCache = new Map();
  }

  hashSymbol(symbol) {
    let hash = 0;
    for (let i = 0; i < symbol.length; i++) {
      const char = symbol.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  getFallbackPrices(symbols = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'ADAUSDT', 'XRPUSDT', 'SOLUSDT', 'DOGEUSDT', 'MATICUSDT']) {
    const basePrices = {
      'BTCUSDT': { price: 43250.50, change: 2.5 },
      'ETHUSDT': { price: 2680.75, change: 1.8 },
      'BNBUSDT': { price: 315.20, change: 3.2 },
      'ADAUSDT': { price: 0.4850, change: -1.2 },
      'XRPUSDT': { price: 0.6125, change: -0.8 },
      'SOLUSDT': { price: 98.45, change: -2.1 },
      'DOGEUSDT': { price: 0.0785, change: 4.2 },
      'MATICUSDT': { price: 0.8950, change: 0.5 }
    };

    return symbols.map(symbol => {
      const base = basePrices[symbol] || { price: 100, change: 0.5 };
      return {
        symbol,
        price: base.price,
        change: base.change,
        volume: 5000000 + this.hashSymbol(symbol) % 10000000,
        high: base.price * 1.03,
        low: base.price * 0.97,
        openPrice: base.price / (1 + base.change / 100),
        timestamp: Date.now()
      };
    });
  }

  generateFallbackChartData(symbol) {
    const basePrices = {
      'BTCUSDT': 43250.50, 'ETHUSDT': 2680.75, 'BNBUSDT': 315.20,
      'ADAUSDT': 0.4850, 'XRPUSDT': 0.6125, 'SOLUSDT': 98.45,
      'DOGEUSDT': 0.0785, 'MATICUSDT': 0.8950
    };

    const basePrice = basePrices[symbol] || 100;
    const data = [];
    let currentPrice = basePrice;

    for (let i = 0; i < 100; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (99 - i));
      const hash = this.hashSymbol(symbol + i);
      const trend = Math.sin(i / 20) * 0.001;
      const deterministicChange = ((hash % 200) - 100) / 10000 + trend;
      currentPrice = currentPrice * (1 + deterministicChange);
      const dayVariation = (hash % 100) / 10000;

      data.push({
        date: date.toISOString().split('T')[0],
        open: i === 0 ? basePrice : data[i - 1]?.close || currentPrice,
        high: currentPrice * (1 + dayVariation),
        low: currentPrice * (1 - dayVariation),
        close: currentPrice,
        volume: 500000 + (hash % 1000000)
      });
    }
    return data;
  }

  async fetchBinancePrices(symbols) {
    return this.getFallbackPrices(symbols);
  }

  async fetchBinanceKlines(symbol) {
    return this.generateFallbackChartData(symbol);
  }

  async getMarketData() {
    const data = this.getFallbackPrices();
    const marketCapEstimates = {
      'BTCUSDT': 850000000000, 'ETHUSDT': 320000000000, 'BNBUSDT': 48000000000,
      'ADAUSDT': 17000000000, 'XRPUSDT': 34000000000, 'SOLUSDT': 42000000000,
      'DOGEUSDT': 11000000000, 'MATICUSDT': 8000000000
    };
    return data.map(coin => ({
      ...coin,
      marketCap: marketCapEstimates[coin.symbol] || coin.price * 100000000,
      rank: 50,
      circulatingSupply: 100000000,
      totalSupply: 110000000
    }));
  }

  async getCachedPrice(symbol) {
    const prices = this.getFallbackPrices([symbol]);
    return prices[0] || null;
  }

  // WebSocket stub — no real connection
  connectBinanceWebSocket(_symbols, _onPriceUpdate) {
    console.warn('Binance WebSocket disabled — external APIs removed.');
    return null;
  }
}

export default new PriceService();