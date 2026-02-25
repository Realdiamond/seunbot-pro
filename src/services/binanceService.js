// Binance service for fetching cryptocurrency data
import axios from 'axios'

class BinanceService {
  constructor() {
    this.baseUrl = 'https://api.binance.com/api/v3'
    this.wsBaseUrl = 'wss://stream.binance.com:9443/ws'
  }

  // Get all USDT trading pairs
  async getAllUsdtPairs() {
    try {
      const response = await axios.get(`${this.baseUrl}/ticker/24hr`)
      const usdtPairs = response.data
        .filter(ticker => ticker.symbol.endsWith('USDT'))
        .map(ticker => ({
          symbol: ticker.symbol,
          price: parseFloat(ticker.lastPrice),
          priceChangePercent: parseFloat(ticker.priceChangePercent),
          volume: parseFloat(ticker.volume),
          quoteVolume: parseFloat(ticker.quoteVolume),
          highPrice: parseFloat(ticker.highPrice),
          lowPrice: parseFloat(ticker.lowPrice),
          openPrice: parseFloat(ticker.openPrice),
          count: parseInt(ticker.count)
        }))
      
      return usdtPairs
    } catch (error) {
      console.error('Error fetching USDT pairs:', error)
      return this.getFallbackUsdtPairs()
    }
  }

  // Get top USDT pairs by volume
  async getTopUsdtPairs(limit = 50) {
    try {
      const allPairs = await this.getAllUsdtPairs()
      return allPairs
        .sort((a, b) => b.quoteVolume - a.quoteVolume)
        .slice(0, limit)
    } catch (error) {
      console.error('Error fetching top USDT pairs:', error)
      return this.getFallbackUsdtPairs().slice(0, limit)
    }
  }

  // Get market summary
  async getMarketSummary() {
    try {
      const pairs = await this.getAllUsdtPairs()
      const totalPairs = pairs.length
      const gainers = pairs.filter(p => p.priceChangePercent > 0).length
      const losers = pairs.filter(p => p.priceChangePercent < 0).length
      const totalVolume = pairs.reduce((sum, p) => sum + p.quoteVolume, 0)

      return {
        totalPairs,
        gainers,
        losers,
        totalVolume,
        timestamp: Date.now()
      }
    } catch (error) {
      console.error('Error fetching market summary:', error)
      return {
        totalPairs: 0,
        gainers: 0,
        losers: 0,
        totalVolume: 0,
        timestamp: Date.now()
      }
    }
  }

  // Create WebSocket connection for real-time data
  createWebSocket(symbols, onUpdate) {
    if (!symbols || symbols.length === 0) return null

    const streams = symbols.slice(0, 20).map(symbol => 
      `${symbol.toLowerCase()}@ticker`
    ).join('/')
    
    const wsUrl = `${this.wsBaseUrl}/${streams}`
    
    try {
      const ws = new WebSocket(wsUrl)
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          if (data.stream && data.data) {
            const ticker = data.data
            const update = {
              symbol: ticker.s,
              price: parseFloat(ticker.c),
              priceChangePercent: parseFloat(ticker.P),
              volume: parseFloat(ticker.v),
              quoteVolume: parseFloat(ticker.q),
              timestamp: Date.now()
            }
            onUpdate(update)
          }
        } catch (err) {
          console.error('WebSocket message parse error:', err)
        }
      }
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error)
      }
      
      return ws
    } catch (error) {
      console.error('WebSocket creation error:', error)
      return null
    }
  }

  // Fallback data when API fails
  getFallbackUsdtPairs() {
    return [
      {
        symbol: 'BTCUSDT',
        price: 43250.50,
        priceChangePercent: 2.5,
        volume: 15000000,
        quoteVolume: 650000000000,
        highPrice: 44000,
        lowPrice: 42500,
        openPrice: 42800,
        count: 1500000
      },
      {
        symbol: 'ETHUSDT',
        price: 2680.75,
        priceChangePercent: 1.8,
        volume: 8000000,
        quoteVolume: 21000000000,
        highPrice: 2720,
        lowPrice: 2650,
        openPrice: 2665,
        count: 800000
      },
      {
        symbol: 'BNBUSDT',
        price: 315.20,
        priceChangePercent: 3.2,
        volume: 2000000,
        quoteVolume: 630000000,
        highPrice: 320,
        lowPrice: 310,
        openPrice: 312,
        count: 200000
      },
      {
        symbol: 'ADAUSDT',
        price: 0.485,
        priceChangePercent: -1.2,
        volume: 50000000,
        quoteVolume: 24000000,
        highPrice: 0.495,
        lowPrice: 0.480,
        openPrice: 0.491,
        count: 150000
      },
      {
        symbol: 'XRPUSDT',
        price: 0.625,
        priceChangePercent: -0.8,
        volume: 30000000,
        quoteVolume: 18750000,
        highPrice: 0.635,
        lowPrice: 0.620,
        openPrice: 0.630,
        count: 120000
      },
      {
        symbol: 'SOLUSDT',
        price: 98.45,
        priceChangePercent: -2.1,
        volume: 5000000,
        quoteVolume: 492250000,
        highPrice: 102,
        lowPrice: 96,
        openPrice: 100.5,
        count: 180000
      },
      {
        symbol: 'DOGEUSDT',
        price: 0.0785,
        priceChangePercent: 4.2,
        volume: 200000000,
        quoteVolume: 15700000,
        highPrice: 0.082,
        lowPrice: 0.075,
        openPrice: 0.0753,
        count: 300000
      },
      {
        symbol: 'MATICUSDT',
        price: 0.8950,
        priceChangePercent: 0.5,
        volume: 25000000,
        quoteVolume: 22375000,
        highPrice: 0.905,
        lowPrice: 0.885,
        openPrice: 0.891,
        count: 95000
      }
    ]
  }
}

export default new BinanceService()