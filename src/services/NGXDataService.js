// Nigerian Stock Exchange (NGX) Data Service
// Integrates with TradingView, NGNMarket, TradingEconomics, and Investing.com

class NGXDataService {
  constructor() {
    this.baseUrls = {
      tradingView: 'https://api.tradingview.com',
      ngnMarket: 'https://www.ngnmarket.com/api',
      tradingEconomics: 'https://api.tradingeconomics.com',
      investing: 'https://api.investing.com'
    }
    
    // Major NGX stocks and their sectors
    this.ngxStocks = {
      banking: [
        { symbol: 'GTCO', name: 'Guaranty Trust Holding Company', sector: 'Banking' },
        { symbol: 'ZENITHBANK', name: 'Zenith Bank Plc', sector: 'Banking' },
        { symbol: 'UBA', name: 'United Bank for Africa Plc', sector: 'Banking' },
        { symbol: 'ACCESS', name: 'Access Holdings Plc', sector: 'Banking' },
        { symbol: 'FBNH', name: 'FBN Holdings Plc', sector: 'Banking' },
        { symbol: 'STERLNBANK', name: 'Sterling Bank Plc', sector: 'Banking' },
        { symbol: 'FIDELITYBK', name: 'Fidelity Bank Plc', sector: 'Banking' }
      ],
      oilGas: [
        { symbol: 'SEPLAT', name: 'Seplat Petroleum Development Company', sector: 'Oil & Gas' },
        { symbol: 'TOTAL', name: 'Total Nigeria Plc', sector: 'Oil & Gas' },
        { symbol: 'OANDO', name: 'Oando Plc', sector: 'Oil & Gas' },
        { symbol: 'CONOIL', name: 'Conoil Plc', sector: 'Oil & Gas' }
      ],
      consumerGoods: [
        { symbol: 'DANGCEM', name: 'Dangote Cement Plc', sector: 'Consumer Goods' },
        { symbol: 'NESTLE', name: 'Nestle Nigeria Plc', sector: 'Consumer Goods' },
        { symbol: 'UNILEVER', name: 'Unilever Nigeria Plc', sector: 'Consumer Goods' },
        { symbol: 'NIGBREW', name: 'Nigerian Breweries Plc', sector: 'Consumer Goods' },
        { symbol: 'GUINNESS', name: 'Guinness Nigeria Plc', sector: 'Consumer Goods' },
        { symbol: 'CADBURY', name: 'Cadbury Nigeria Plc', sector: 'Consumer Goods' }
      ],
      telecommunications: [
        { symbol: 'MTNN', name: 'MTN Nigeria Communications Plc', sector: 'Telecommunications' },
        { symbol: 'AIRTELAFRI', name: 'Airtel Africa Plc', sector: 'Telecommunications' }
      ],
      industrials: [
        { symbol: 'DANGSUGAR', name: 'Dangote Sugar Refinery Plc', sector: 'Industrial Goods' },
        { symbol: 'WAPCO', name: 'Lafarge Africa Plc', sector: 'Industrial Goods' },
        { symbol: 'BUACEMENT', name: 'BUA Cement Plc', sector: 'Industrial Goods' }
      ],
      insurance: [
        { symbol: 'AIICO', name: 'AIICO Insurance Plc', sector: 'Insurance' },
        { symbol: 'MANSARD', name: 'Mansard Insurance Plc', sector: 'Insurance' }
      ]
    }

    // Nigerian economic indicators
    this.economicIndicators = [
      'NGN_USD_RATE',
      'INFLATION_RATE',
      'GDP_GROWTH',
      'UNEMPLOYMENT_RATE',
      'INTEREST_RATE',
      'OIL_PRICE_BRENT',
      'FOREIGN_RESERVES',
      'MONEY_SUPPLY'
    ]
  }

  // Generate mock data for NGX stocks (in production, this would fetch real data)
  async fetchNGXStockData(symbol) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100))
    
    const basePrice = this.getBasePriceForStock(symbol)
    const change = (Math.random() - 0.5) * 10 // -5% to +5%
    const volume = Math.floor(Math.random() * 10000000) + 1000000 // 1M to 11M
    
    return {
      symbol,
      price: basePrice * (1 + change / 100),
      change: change,
      changePercent: change,
      volume: volume,
      high: basePrice * (1 + Math.abs(change) / 100),
      low: basePrice * (1 - Math.abs(change) / 100),
      marketCap: basePrice * volume * 10,
      pe: Math.random() * 20 + 5,
      dividend: Math.random() * 8,
      sector: this.getSectorForStock(symbol),
      lastUpdated: new Date().toISOString()
    }
  }

  // Get all NGX stocks data
  async fetchAllNGXStocks() {
    const allStocks = []
    
    for (const sector in this.ngxStocks) {
      for (const stock of this.ngxStocks[sector]) {
        const stockData = await this.fetchNGXStockData(stock.symbol)
        allStocks.push({
          ...stockData,
          name: stock.name,
          sector: stock.sector
        })
      }
    }
    
    return allStocks
  }

  // Fetch Nigerian economic data
  async fetchNigerianEconomicData() {
    await new Promise(resolve => setTimeout(resolve, 200))
    
    return {
      currency: {
        usdNgn: 750 + Math.random() * 50, // NGN per USD
        gbpNgn: 950 + Math.random() * 50, // NGN per GBP
        eurNgn: 820 + Math.random() * 40  // NGN per EUR
      },
      economicIndicators: {
        inflationRate: 15.5 + Math.random() * 5,
        gdpGrowth: 2.5 + Math.random() * 2,
        unemploymentRate: 33 + Math.random() * 5,
        interestRate: 18 + Math.random() * 3,
        foreignReserves: 35 + Math.random() * 5, // Billion USD
        oilPrice: 75 + Math.random() * 15, // Brent crude
        moneySupply: 45000 + Math.random() * 5000 // Billion NGN
      },
      bondYields: {
        '3Month': 8 + Math.random() * 2,
        '6Month': 9 + Math.random() * 2,
        '1Year': 10 + Math.random() * 2,
        '5Year': 12 + Math.random() * 2,
        '10Year': 13 + Math.random() * 2,
        '20Year': 14 + Math.random() * 2
      },
      sectorPerformance: {
        banking: Math.random() * 10 - 5,
        oilGas: Math.random() * 15 - 7.5,
        consumerGoods: Math.random() * 8 - 4,
        telecommunications: Math.random() * 12 - 6,
        industrials: Math.random() * 10 - 5,
        insurance: Math.random() * 6 - 3
      }
    }
  }

  // Fetch NGX index data
  async fetchNGXIndices() {
    await new Promise(resolve => setTimeout(resolve, 150))
    
    return {
      ngxAllShare: {
        value: 52000 + Math.random() * 5000,
        change: (Math.random() - 0.5) * 1000,
        changePercent: (Math.random() - 0.5) * 4
      },
      ngx30: {
        value: 1800 + Math.random() * 200,
        change: (Math.random() - 0.5) * 50,
        changePercent: (Math.random() - 0.5) * 3
      },
      ngxBanking: {
        value: 450 + Math.random() * 50,
        change: (Math.random() - 0.5) * 20,
        changePercent: (Math.random() - 0.5) * 5
      },
      ngxConsumerGoods: {
        value: 680 + Math.random() * 70,
        change: (Math.random() - 0.5) * 30,
        changePercent: (Math.random() - 0.5) * 4
      },
      ngxOilGas: {
        value: 320 + Math.random() * 40,
        change: (Math.random() - 0.5) * 25,
        changePercent: (Math.random() - 0.5) * 8
      }
    }
  }

  // Fetch market sentiment and news
  async fetchMarketSentiment() {
    await new Promise(resolve => setTimeout(resolve, 100))
    
    const sentiments = ['Bullish', 'Bearish', 'Neutral']
    const newsHeadlines = [
      'CBN maintains interest rate at 18.75%',
      'Oil prices surge on OPEC+ production cuts',
      'NGX records N2.5 trillion in market capitalization',
      'Banking sector shows strong Q3 performance',
      'Dangote Cement announces dividend payment',
      'Foreign investors increase NGX participation',
      'Naira strengthens against major currencies',
      'Consumer goods sector faces inflation pressure'
    ]
    
    return {
      overall: sentiments[Math.floor(Math.random() * sentiments.length)],
      confidence: Math.random() * 100,
      newsHeadlines: newsHeadlines.slice(0, 5),
      marketMood: {
        fear: Math.random() * 100,
        greed: Math.random() * 100,
        neutral: Math.random() * 100
      },
      institutionalFlow: Math.random() > 0.5 ? 'Inflow' : 'Outflow',
      retailSentiment: sentiments[Math.floor(Math.random() * sentiments.length)]
    }
  }

  // Helper methods
  getBasePriceForStock(symbol) {
    const basePrices = {
      'GTCO': 25.50,
      'ZENITHBANK': 22.80,
      'UBA': 8.45,
      'ACCESS': 12.30,
      'FBNH': 14.20,
      'STERLNBANK': 1.85,
      'FIDELITYBK': 6.75,
      'SEPLAT': 850.00,
      'TOTAL': 165.50,
      'OANDO': 6.20,
      'CONOIL': 22.40,
      'DANGCEM': 285.50,
      'NESTLE': 1450.00,
      'UNILEVER': 14.80,
      'NIGBREW': 45.60,
      'GUINNESS': 58.20,
      'CADBURY': 12.50,
      'MTNN': 195.00,
      'AIRTELAFRI': 1250.00,
      'DANGSUGAR': 18.75,
      'WAPCO': 28.90,
      'BUACEMENT': 95.40,
      'AIICO': 0.85,
      'MANSARD': 0.65
    }
    
    return basePrices[symbol] || 10.00
  }

  getSectorForStock(symbol) {
    for (const sector in this.ngxStocks) {
      const found = this.ngxStocks[sector].find(stock => stock.symbol === symbol)
      if (found) return found.sector
    }
    return 'Unknown'
  }

  // Real-time data simulation
  subscribeToRealTimeData(callback) {
    const interval = setInterval(async () => {
      const data = {
        stocks: await this.fetchAllNGXStocks(),
        indices: await this.fetchNGXIndices(),
        economic: await this.fetchNigerianEconomicData(),
        sentiment: await this.fetchMarketSentiment()
      }
      callback(data)
    }, 30000) // Update every 30 seconds

    return () => clearInterval(interval)
  }

  // Get top gainers and losers
  async getTopMovers() {
    const stocks = await this.fetchAllNGXStocks()
    
    const gainers = stocks
      .filter(stock => stock.change > 0)
      .sort((a, b) => b.changePercent - a.changePercent)
      .slice(0, 10)
    
    const losers = stocks
      .filter(stock => stock.change < 0)
      .sort((a, b) => a.changePercent - b.changePercent)
      .slice(0, 10)
    
    const mostActive = stocks
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 10)
    
    return { gainers, losers, mostActive }
  }

  // Sector analysis
  async getSectorAnalysis() {
    const stocks = await this.fetchAllNGXStocks()
    const sectorData = {}
    
    // Group by sector
    stocks.forEach(stock => {
      if (!sectorData[stock.sector]) {
        sectorData[stock.sector] = {
          stocks: [],
          totalMarketCap: 0,
          avgChange: 0,
          stockCount: 0
        }
      }
      
      sectorData[stock.sector].stocks.push(stock)
      sectorData[stock.sector].totalMarketCap += stock.marketCap
      sectorData[stock.sector].avgChange += stock.changePercent
      sectorData[stock.sector].stockCount++
    })
    
    // Calculate averages
    Object.keys(sectorData).forEach(sector => {
      sectorData[sector].avgChange = sectorData[sector].avgChange / sectorData[sector].stockCount
    })
    
    return sectorData
  }

  // Nigerian ETFs and mutual funds
  async fetchNigerianETFs() {
    await new Promise(resolve => setTimeout(resolve, 100))
    
    return [
      {
        symbol: 'NGXETF30',
        name: 'NGX 30 Exchange Traded Fund',
        nav: 180.50 + Math.random() * 20,
        change: (Math.random() - 0.5) * 10,
        aum: 25000000000, // Assets Under Management in NGN
        expenseRatio: 0.75,
        benchmark: 'NGX 30 Index'
      },
      {
        symbol: 'VETBANK',
        name: 'VestaBank ETF',
        nav: 95.20 + Math.random() * 10,
        change: (Math.random() - 0.5) * 8,
        aum: 15000000000,
        expenseRatio: 0.85,
        benchmark: 'NGX Banking Index'
      },
      {
        symbol: 'LOTUSHAL',
        name: 'Lotus Halal Equity Fund',
        nav: 125.80 + Math.random() * 15,
        change: (Math.random() - 0.5) * 6,
        aum: 8000000000,
        expenseRatio: 1.25,
        benchmark: 'NGX All Share Index'
      }
    ]
  }
}

export default new NGXDataService()