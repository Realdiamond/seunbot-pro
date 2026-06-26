// Sample data generation for the trading dashboard

export const generateSampleData = (symbol = 'BTCUSDT') => {
  const data = []
  const basePrice = getBasePrice(symbol)
  let currentPrice = basePrice
  
  for (let i = 0; i < 100; i++) {
    const date = new Date()
    date.setDate(date.getDate() - (99 - i))
    
    // Generate realistic price movement
    const volatility = 0.02 // 2% daily volatility
    const trend = Math.sin(i / 20) * 0.001 // Slight trend
    const randomChange = (Math.random() - 0.5) * volatility + trend
    
    currentPrice = currentPrice * (1 + randomChange)
    
    // Generate OHLC data
    const high = currentPrice * (1 + Math.random() * 0.01)
    const low = currentPrice * (1 - Math.random() * 0.01)
    const open = i === 0 ? basePrice : data[i-1]?.close || currentPrice
    
    data.push({
      date: date.toISOString().split('T')[0],
      open: parseFloat(open.toFixed(4)),
      high: parseFloat(high.toFixed(4)),
      low: parseFloat(low.toFixed(4)),
      close: parseFloat(currentPrice.toFixed(4)),
      volume: Math.floor(Math.random() * 1000000) + 100000
    })
  }
  
  return data
}

export const generateMarketData = () => {
  const symbols = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'ADAUSDT', 'XRPUSDT', 'SOLUSDT', 'DOGEUSDT', 'MATICUSDT']
  
  return symbols.map(symbol => {
    const basePrice = getBasePrice(symbol)
    const change = (Math.random() - 0.5) * 20 // -10% to +10%
    const price = basePrice * (1 + change / 100)
    
    return {
      symbol,
      price: parseFloat(price.toFixed(4)),
      change: parseFloat(change.toFixed(2)),
      volume: Math.floor(Math.random() * 1000000000) + 10000000
    }
  })
}

export const generateSignals = () => {
  const symbols = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'ADAUSDT']
  const signals = ['Strong Buy', 'Buy', 'Neutral', 'Sell', 'Strong Sell']
  const patterns = [
    'Rising Wedge', 'Falling Wedge', 'Head & Shoulders', 'Bull Flag', 
    'Bear Flag', 'Double Top', 'Double Bottom', 'Ascending Triangle'
  ]
  const timeframes = ['1h', '4h', '1d', '1w']
  
  return symbols.slice(0, 3).map(symbol => ({
    symbol,
    signal: signals[Math.floor(Math.random() * signals.length)],
    confidence: Math.floor(Math.random() * 40) + 60, // 60-100%
    pattern: patterns[Math.floor(Math.random() * patterns.length)],
    timeframe: timeframes[Math.floor(Math.random() * timeframes.length)],
    timestamp: new Date(Date.now() - Math.random() * 3600000).toISOString() // Last hour
  }))
}

const getBasePrice = (symbol) => {
  const basePrices = {
    'BTCUSDT': 45000,
    'ETHUSDT': 3000,
    'BNBUSDT': 400,
    'ADAUSDT': 0.5,
    'XRPUSDT': 0.6,
    'SOLUSDT': 100,
    'DOGEUSDT': 0.08,
    'MATICUSDT': 1.2
  }
  
  return basePrices[symbol] || 100
}

export const generatePatternData = () => {
  return {
    patterns: [
      { name: 'Rising Wedge', detected: true, confidence: 85, type: 'bearish' },
      { name: 'Bull Flag', detected: true, confidence: 72, type: 'bullish' },
      { name: 'Ascending Triangle', detected: true, confidence: 91, type: 'bullish' },
    ],
    smartMoney: [
      { name: 'Order Block', status: 'Bullish', level: '$45,200' },
      { name: 'Fair Value Gap', status: 'Filled', level: '$44,800' },
      { name: 'Liquidity Zone', status: 'Active', level: '$46,500' },
    ]
  }
}