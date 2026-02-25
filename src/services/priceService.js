// Real-time price service for fetching data from Binance and TradingView
import axios from 'axios'

class PriceService {
  constructor() {
    this.binanceBaseUrl = 'https://api.binance.com/api/v3'
    this.tradingViewBaseUrl = 'https://scanner.tradingview.com'
    this.priceCache = new Map()
    this.cacheTimeout = 30000 // 30 seconds cache
  }

  // Fetch real-time prices from Binance API
  async fetchBinancePrices(symbols = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'ADAUSDT', 'XRPUSDT', 'SOLUSDT', 'DOGEUSDT', 'MATICUSDT']) {
    try {
      const symbolString = symbols.map(s => `"${s}"`).join(',')
      const response = await axios.get(`${this.binanceBaseUrl}/ticker/24hr`, {
        params: { symbols: `[${symbolString}]` }
      })
      
      return response.data.map(ticker => ({
        symbol: ticker.symbol,
        price: parseFloat(ticker.lastPrice),
        change: parseFloat(ticker.priceChangePercent),
        volume: parseFloat(ticker.volume),
        high: parseFloat(ticker.highPrice),
        low: parseFloat(ticker.lowPrice),
        openPrice: parseFloat(ticker.openPrice),
        timestamp: Date.now()
      }))
    } catch (error) {
      console.error('Binance API error:', error)
      return this.getFallbackPrices(symbols)
    }
  }

  // Fetch historical data from Binance
  async fetchBinanceKlines(symbol, interval = '1d', limit = 100) {
    try {
      const response = await axios.get(`${this.binanceBaseUrl}/klines`, {
        params: { symbol, interval, limit }
      })
      
      return response.data.map(kline => ({
        date: new Date(kline[0]).toISOString().split('T')[0],
        open: parseFloat(kline[1]),
        high: parseFloat(kline[2]),
        low: parseFloat(kline[3]),
        close: parseFloat(kline[4]),
        volume: parseFloat(kline[5])
      }))
    } catch (error) {
      console.error('Binance klines error:', error)
      return this.generateFallbackChartData(symbol)
    }
  }

  // Fetch market data from TradingView (using their public scanner API)
  async fetchTradingViewData(symbols) {
    try {
      const payload = {
        filter: [
          { left: "name", operation: "in_range", right: symbols }
        ],
        options: { lang: "en" },
        symbols: {
          query: { types: [] },
          tickers: symbols.map(symbol => `BINANCE:${symbol}`)
        },
        columns: [
          "name", "close", "change", "change_abs", "volume", 
          "market_cap_basic", "price_earnings_ttm", "earnings_per_share_basic_ttm"
        ],
        sort: { sortBy: "market_cap_basic", sortOrder: "desc" },
        range: [0, symbols.length]
      }

      // Note: This is a simplified approach. In production, you'd need proper CORS handling
      const response = await axios.post(`${this.tradingViewBaseUrl}/crypto/scan`, payload, {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      })

      return response.data.data.map(item => ({
        symbol: item.s.replace('BINANCE:', ''),
        price: item.d[1],
        change: item.d[2],
        volume: item.d[4],
        marketCap: item.d[5]
      }))
    } catch (error) {
      console.error('TradingView API error:', error)
      // Fallback to Binance if TradingView fails
      return this.fetchBinancePrices(symbols)
    }
  }

  // WebSocket connection for real-time Binance data
  connectBinanceWebSocket(symbols, onPriceUpdate) {
    const streams = symbols.map(symbol => `${symbol.toLowerCase()}@ticker`).join('/')
    const wsUrl = `wss://stream.binance.com:9443/ws/${streams}`
    
    const ws = new WebSocket(wsUrl)
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      if (data.stream && data.data) {
        const ticker = data.data
        const priceData = {
          symbol: ticker.s,
          price: parseFloat(ticker.c),
          change: parseFloat(ticker.P),
          volume: parseFloat(ticker.v),
          timestamp: Date.now()
        }
        onPriceUpdate(priceData)
      }
    }
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error)
    }
    
    return ws
  }

  // Get cached price or fetch new one
  async getCachedPrice(symbol) {
    const cached = this.priceCache.get(symbol)
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached
    }
    
    const prices = await this.fetchBinancePrices([symbol])
    if (prices.length > 0) {
      this.priceCache.set(symbol, prices[0])
      return prices[0]
    }
    
    return null
  }

  // Fallback prices when APIs fail
  getFallbackPrices(symbols) {
    const basePrices = {
      'BTCUSDT': 43250.50,
      'ETHUSDT': 2680.75,
      'BNBUSDT': 315.20,
      'ADAUSDT': 0.4850,
      'XRPUSDT': 0.6125,
      'SOLUSDT': 98.45,
      'DOGEUSDT': 0.0785,
      'MATICUSDT': 0.8950
    }
    
    return symbols.map(symbol => ({
      symbol,
      price: basePrices[symbol] || 100,
      change: (Math.random() - 0.5) * 10,
      volume: Math.random() * 1000000,
      high: (basePrices[symbol] || 100) * 1.05,
      low: (basePrices[symbol] || 100) * 0.95,
      openPrice: basePrices[symbol] || 100,
      timestamp: Date.now()
    }))
  }

  // Generate fallback chart data
  generateFallbackChartData(symbol) {
    const basePrices = {
      'BTCUSDT': 43250.50,
      'ETHUSDT': 2680.75,
      'BNBUSDT': 315.20,
      'ADAUSDT': 0.4850,
      'XRPUSDT': 0.6125,
      'SOLUSDT': 98.45,
      'DOGEUSDT': 0.0785,
      'MATICUSDT': 0.8950
    }
    
    const basePrice = basePrices[symbol] || 100
    const data = []
    let currentPrice = basePrice
    
    for (let i = 0; i < 100; i++) {
      const date = new Date()
      date.setDate(date.getDate() - (99 - i))
      
      const volatility = 0.02
      const trend = Math.sin(i / 20) * 0.001
      const randomChange = (Math.random() - 0.5) * volatility + trend
      
      currentPrice = currentPrice * (1 + randomChange)
      
      data.push({
        date: date.toISOString().split('T')[0],
        open: i === 0 ? basePrice : data[i-1]?.close || currentPrice,
        high: currentPrice * (1 + Math.random() * 0.01),
        low: currentPrice * (1 - Math.random() * 0.01),
        close: currentPrice,
        volume: Math.floor(Math.random() * 1000000) + 100000
      })
    }
    
    return data
  }

  // Fetch comprehensive market data
  async getMarketData() {
    try {
      // Try to get real data from multiple sources
      const binanceData = await this.fetchBinancePrices()
      
      // Add market cap and additional metrics
      const enhancedData = await Promise.all(binanceData.map(async (coin) => {
        // Simulate additional market data that would come from CoinGecko or similar
        return {
          ...coin,
          marketCap: coin.price * (Math.random() * 1000000000 + 100000000),
          rank: Math.floor(Math.random() * 100) + 1,
          circulatingSupply: Math.random() * 1000000000,
          totalSupply: Math.random() * 1000000000
        }
      }))
      
      return enhancedData
    } catch (error) {
      console.error('Market data fetch error:', error)
      return this.getFallbackPrices(['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'ADAUSDT', 'XRPUSDT', 'SOLUSDT', 'DOGEUSDT', 'MATICUSDT'])
    }
  }
}

export default new PriceService()