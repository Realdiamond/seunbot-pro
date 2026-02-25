// Enhanced Real-Time Crypto Data Service with Multiple API Sources
import axios from 'axios'

class RealCryptoDataService {
  constructor() {
    this.binanceBaseUrl = 'https://api.binance.com/api/v3'
    this.coingeckoBaseUrl = 'https://api.coingecko.com/api/v3'
    this.cache = new Map()
    this.cacheTimeout = 30000 // 30 seconds
    this.wsConnections = new Map()
  }

  // Fetch real-time accurate prices from Binance
  async fetchRealTimePrices(symbols = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'ADAUSDT', 'XRPUSDT', 'SOLUSDT', 'DOGEUSDT', 'MATICUSDT']) {
    try {
      console.log('Fetching real-time prices from Binance API...')
      
      // Fetch 24hr ticker data for all symbols
      const symbolString = symbols.map(s => `"${s}"`).join(',')
      const response = await axios.get(`${this.binanceBaseUrl}/ticker/24hr`, {
        params: { symbols: `[${symbolString}]` },
        timeout: 10000
      })

      const prices = response.data.map(ticker => ({
        symbol: ticker.symbol,
        price: parseFloat(ticker.lastPrice),
        priceChangePercent: parseFloat(ticker.priceChangePercent),
        volume: parseFloat(ticker.volume),
        quoteVolume: parseFloat(ticker.quoteVolume),
        highPrice: parseFloat(ticker.highPrice),
        lowPrice: parseFloat(ticker.lowPrice),
        openPrice: parseFloat(ticker.openPrice),
        timestamp: Date.now(),
        source: 'Binance API'
      }))

      // Cache the results
      prices.forEach(price => {
        this.cache.set(price.symbol, { data: price, timestamp: Date.now() })
      })

      console.log(`✅ Successfully fetched ${prices.length} real-time prices from Binance`)
      return prices
    } catch (error) {
      console.error('❌ Binance API error:', error.message)
      
      // Try to use cached data
      const cachedPrices = this.getCachedPrices(symbols)
      if (cachedPrices.length > 0) {
        console.log('⚠️ Using cached prices due to API error')
        return cachedPrices
      }
      
      // Last resort: use CoinGecko as backup
      return this.fetchFromCoinGecko(symbols)
    }
  }

  // Backup: Fetch from CoinGecko
  async fetchFromCoinGecko(symbols) {
    try {
      console.log('Attempting to fetch from CoinGecko as backup...')
      
      const coinIds = {
        'BTCUSDT': 'bitcoin',
        'ETHUSDT': 'ethereum',
        'BNBUSDT': 'binancecoin',
        'ADAUSDT': 'cardano',
        'XRPUSDT': 'ripple',
        'SOLUSDT': 'solana',
        'DOGEUSDT': 'dogecoin',
        'MATICUSDT': 'matic-network'
      }

      const ids = symbols.map(s => coinIds[s]).filter(Boolean).join(',')
      const response = await axios.get(`${this.coingeckoBaseUrl}/simple/price`, {
        params: {
          ids,
          vs_currencies: 'usd',
          include_24hr_change: true,
          include_24hr_vol: true
        },
        timeout: 10000
      })

      const prices = symbols.map(symbol => {
        const coinId = coinIds[symbol]
        const data = response.data[coinId]
        
        if (!data) return null

        return {
          symbol,
          price: data.usd,
          priceChangePercent: data.usd_24h_change || 0,
          volume: data.usd_24h_vol || 0,
          quoteVolume: data.usd_24h_vol || 0,
          highPrice: data.usd * 1.02,
          lowPrice: data.usd * 0.98,
          openPrice: data.usd / (1 + (data.usd_24h_change || 0) / 100),
          timestamp: Date.now(),
          source: 'CoinGecko API'
        }
      }).filter(Boolean)

      console.log(`✅ Fetched ${prices.length} prices from CoinGecko backup`)
      return prices
    } catch (error) {
      console.error('❌ CoinGecko API also failed:', error.message)
      return []
    }
  }

  // Get cached prices
  getCachedPrices(symbols) {
    const now = Date.now()
    return symbols
      .map(symbol => {
        const cached = this.cache.get(symbol)
        if (cached && (now - cached.timestamp) < this.cacheTimeout) {
          return cached.data
        }
        return null
      })
      .filter(Boolean)
  }

  // Fetch historical kline/candlestick data
  async fetchHistoricalData(symbol, interval = '1d', limit = 100) {
    try {
      console.log(`Fetching historical data for ${symbol}...`)
      
      const response = await axios.get(`${this.binanceBaseUrl}/klines`, {
        params: { symbol, interval, limit },
        timeout: 10000
      })

      const data = response.data.map(kline => ({
        timestamp: kline[0],
        date: new Date(kline[0]).toISOString().split('T')[0],
        open: parseFloat(kline[1]),
        high: parseFloat(kline[2]),
        low: parseFloat(kline[3]),
        close: parseFloat(kline[4]),
        volume: parseFloat(kline[5])
      }))

      console.log(`✅ Fetched ${data.length} historical data points for ${symbol}`)
      return data
    } catch (error) {
      console.error(`❌ Error fetching historical data for ${symbol}:`, error.message)
      return []
    }
  }

  // Create WebSocket connection for real-time updates
  createWebSocket(symbols, onUpdate) {
    if (!symbols || symbols.length === 0) {
      console.warn('No symbols provided for WebSocket connection')
      return null
    }

    const streams = symbols.map(s => `${s.toLowerCase()}@ticker`).join('/')
    const wsUrl = `wss://stream.binance.com:9443/ws/${streams}`

    try {
      console.log(`Creating WebSocket connection for ${symbols.length} symbols...`)
      
      const ws = new WebSocket(wsUrl)

      ws.onopen = () => {
        console.log('✅ WebSocket connected successfully')
      }

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
              highPrice: parseFloat(ticker.h),
              lowPrice: parseFloat(ticker.l),
              openPrice: parseFloat(ticker.o),
              timestamp: Date.now(),
              source: 'Binance WebSocket'
            }
            
            // Update cache
            this.cache.set(update.symbol, { data: update, timestamp: Date.now() })
            
            // Callback with update
            onUpdate(update)
          }
        } catch (err) {
          console.error('WebSocket message parse error:', err)
        }
      }

      ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error)
      }

      ws.onclose = () => {
        console.log('WebSocket connection closed')
      }

      return ws
    } catch (error) {
      console.error('❌ WebSocket creation error:', error)
      return null
    }
  }

  // Get comprehensive market data with technical indicators
  async getComprehensiveMarketData(symbol) {
    try {
      const [priceData, historicalData] = await Promise.all([
        this.fetchRealTimePrices([symbol]),
        this.fetchHistoricalData(symbol, '1h', 50)
      ])

      if (priceData.length === 0 || historicalData.length === 0) {
        throw new Error('Failed to fetch market data')
      }

      const currentPrice = priceData[0]
      const indicators = this.calculateTechnicalIndicators(historicalData)

      return {
        ...currentPrice,
        indicators,
        historicalData,
        timestamp: Date.now()
      }
    } catch (error) {
      console.error(`Error fetching comprehensive data for ${symbol}:`, error)
      return null
    }
  }

  // Calculate technical indicators from historical data
  calculateTechnicalIndicators(data) {
    if (!data || data.length < 20) {
      return {
        rsi: 50,
        macd: 0,
        sma20: 0,
        sma50: 0,
        ema12: 0,
        ema26: 0
      }
    }

    const closes = data.map(d => d.close)
    
    return {
      rsi: this.calculateRSI(closes, 14),
      macd: this.calculateMACD(closes),
      sma20: this.calculateSMA(closes, 20),
      sma50: this.calculateSMA(closes, Math.min(50, closes.length)),
      ema12: this.calculateEMA(closes, 12),
      ema26: this.calculateEMA(closes, 26)
    }
  }

  calculateRSI(prices, period = 14) {
    if (prices.length < period + 1) return 50

    let gains = 0
    let losses = 0

    for (let i = prices.length - period; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1]
      if (change > 0) gains += change
      else losses += Math.abs(change)
    }

    const avgGain = gains / period
    const avgLoss = losses / period
    
    if (avgLoss === 0) return 100
    const rs = avgGain / avgLoss
    return 100 - (100 / (1 + rs))
  }

  calculateSMA(prices, period) {
    if (prices.length < period) return prices[prices.length - 1]
    const slice = prices.slice(-period)
    return slice.reduce((a, b) => a + b, 0) / period
  }

  calculateEMA(prices, period) {
    if (prices.length < period) return prices[prices.length - 1]
    
    const multiplier = 2 / (period + 1)
    let ema = prices[0]

    for (let i = 1; i < prices.length; i++) {
      ema = (prices[i] * multiplier) + (ema * (1 - multiplier))
    }

    return ema
  }

  calculateMACD(prices) {
    const ema12 = this.calculateEMA(prices, 12)
    const ema26 = this.calculateEMA(prices, 26)
    return ema12 - ema26
  }

  // Close all WebSocket connections
  closeAllConnections() {
    this.wsConnections.forEach((ws, symbol) => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close()
        console.log(`Closed WebSocket for ${symbol}`)
      }
    })
    this.wsConnections.clear()
  }
}

export default new RealCryptoDataService()