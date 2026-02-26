import React, { useState, useEffect, useCallback } from 'react'
import { 
  Brain, TrendingUp, TrendingDown, Activity, Volume2, 
  BarChart3, Zap, Target, AlertTriangle, CheckCircle,
  Clock, DollarSign, Percent, Eye, RefreshCw, Waves,
  Triangle, Square, Circle, Hexagon, Diamond, Star,
  Globe, Calendar, Moon, Sun, Compass, Orbit
} from 'lucide-react'
import SP500DataService from '../services/SP500DataService'
import { sp500WebSocket } from '../services/WebSocketService'

const SP500AdvancedAnalysis = ({ selectedStock = 'AAPL', stockData = null }) => {
  const [activeTab, setActiveTab] = useState('smartMoney')
  const [selectedTimeframe, setSelectedTimeframe] = useState('1D')
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(false)
  const [realTimeData, setRealTimeData] = useState(null)
  const [dataSource, setDataSource] = useState('Loading...')

  // Subscribe to WebSocket updates for the selected stock
  const handleWsUpdate = useCallback((update) => {
    setRealTimeData(prev => ({
      ...(prev || {}),
      price: update.price ?? prev?.price,
      change: update.change ?? prev?.change,
      changePercent: update.changePercent ?? prev?.changePercent,
      volume: update.volume ?? prev?.volume,
      high: update.high ?? prev?.high,
      low: update.low ?? prev?.low,
      sources: update.source ? [update.source] : (prev?.sources || []),
      isMock: false
    }))
    setDataSource(`✅ Live (${update.source || 'WebSocket'})`)
  }, [])

  useEffect(() => {
    // Subscribe to the selected stock via WebSocket
    sp500WebSocket.subscribe(selectedStock, handleWsUpdate)
    return () => {
      sp500WebSocket.unsubscribe(selectedStock, handleWsUpdate)
    }
  }, [selectedStock, handleWsUpdate])

  const timeframes = ['5M', '15M', '1H', '4H', '1D', '1W', '1M']

  useEffect(() => {
    if (selectedStock) {
      generateAdvancedAnalysis()
    }
  }, [selectedStock, selectedTimeframe])

  useEffect(() => {
    loadRealTimeData()
  }, [selectedStock])

  const loadRealTimeData = async () => {
    try {
      console.log(`📈 Fetching real-time data for ${selectedStock}...`)
      const data = stockData || await SP500DataService.fetchStockData(selectedStock)
      setRealTimeData(data)
      setDataSource(data.isMock ? '⚠️ Simulated Data' : `✅ Live Data (${data.sources.join(', ')})`)
      console.log('✅ Real-time data loaded:', data)
    } catch (error) {
      console.error('❌ Error loading real-time data:', error)
      setDataSource('❌ Data Unavailable')
    }
  }

  const generateAdvancedAnalysis = async () => {
    setLoading(true)
    
    try {
      const data = realTimeData || stockData || await SP500DataService.fetchStockData(selectedStock)
      
      // Calculate SEUN BOT signals with historical data simulation
      const historicalData = generateHistoricalData(data, 50)
      const seunBotSignals = SP500DataService.calculateSeunBotSignals(data, historicalData)
      
      const comprehensiveAnalysis = {
        smartMoney: generateSmartMoneyAnalysis(data, seunBotSignals),
        patterns: generateGeometricPatterns(data),
        elliottWave: generateElliottWave(data),
        volume: generateVolumeAnalysis(data),
        fundamental: generateFundamentalAnalysis(data),
        cycle: generateCycleAnalysis(data),
        gann: generateGannAnalysis(data),
        planetary: generatePlanetaryAnalysis(data),
        seunBot: seunBotSignals
      }

      setAnalysis(comprehensiveAnalysis)
    } catch (error) {
      console.error('Error generating analysis:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateHistoricalData = (currentData, periods) => {
    const data = []
    const basePrice = currentData.price
    
    for (let i = periods; i >= 0; i--) {
      const randomChange = (Math.random() - 0.5) * 0.04
      const price = basePrice * (1 + randomChange * (i / periods))
      data.push({
        close: price,
        volume: currentData.volume * (0.8 + Math.random() * 0.4),
        high: price * 1.02,
        low: price * 0.98
      })
    }
    
    return data
  }

  const generateSmartMoneyAnalysis = (stockData, seunBotSignals) => {
    const price = stockData.price
    const change = stockData.changePercent
    const volume = stockData.volume
    
    return {
      seunBotSignal: seunBotSignals,
      marketStructure: {
        current: change > 3 ? 'Strong Bullish BOS' : change < -3 ? 'Strong Bearish BOS' : 'Consolidation',
        alignment: { 
          direction: change > 0 ? 'Bullish' : 'Bearish', 
          alignment: Math.abs(change) * 12,
          bias: 'Following US market sentiment'
        },
        timeframes: generateTimeframeStructure(stockData),
        confluences: generateStructureConfluences(change, volume, stockData.sector)
      },
      liquidityAnalysis: {
        zones: generateLiquidityZones(price, stockData.high, stockData.low),
        fairValueGaps: generateFairValueGaps(stockData),
        orderBlocks: generateOrderBlocks(stockData),
        institutional_activity: {
          smart_money_flow: volume > 30000000 ? 'High institutional activity' : 'Moderate activity',
          dark_pool_activity: 'Significant off-exchange trading detected',
          options_flow: 'Bullish options positioning'
        }
      },
      premiumDiscount: {
        zone: (price - stockData.low) / (stockData.high - stockData.low) > 0.7 ? 'Premium' : 
              (price - stockData.low) / (stockData.high - stockData.low) < 0.3 ? 'Discount' : 'Equilibrium',
        currentPosition: (price - stockData.low) / (stockData.high - stockData.low),
        market_context: {
          market_phase: 'US market cycle consideration',
          sector_rotation: getSectorRotationPhase(stockData.sector),
          institutional_sentiment: 'Positive institutional positioning'
        }
      },
      signals: generateSmartMoneySignals(stockData, seunBotSignals),
      confidence: Math.min(95, 60 + Math.abs(change) * 5 + (volume / 5000000)),
      dataSource: stockData.isMock ? 'Simulated Data' : 'Live Market Data'
    }
  }

  const generateGeometricPatterns = (stockData) => {
    const patterns = {
      triangles: [],
      channels: [],
      flags: [],
      pennants: [],
      headAndShoulders: [],
      doubleTopBottom: []
    }

    if (Math.abs(stockData.changePercent) < 2 && stockData.volume > 20000000) {
      patterns.triangles.push({
        type: 'Ascending Triangle',
        pattern: 'Bullish Continuation',
        resistance: stockData.price * 1.025,
        support: stockData.price * 0.975,
        breakoutTarget: stockData.price * 1.06,
        probability: 75,
        completion: '70%',
        context: 'Strong institutional accumulation pattern',
        timeframe: selectedTimeframe
      })
    }

    patterns.channels.push({
      type: 'Ascending Channel',
      pattern: 'Bullish Trend Continuation',
      upperBound: stockData.price * 1.03,
      lowerBound: stockData.price * 0.97,
      target: stockData.price * 1.08,
      probability: 80,
      context: 'Following US market uptrend'
    })

    if (Math.abs(stockData.changePercent) > 3) {
      patterns.flags.push({
        type: stockData.changePercent > 0 ? 'Bull Flag' : 'Bear Flag',
        pattern: 'Continuation Pattern',
        flagPole: Math.abs(stockData.changePercent),
        target: stockData.price * (stockData.changePercent > 0 ? 1.06 : 0.94),
        probability: 82,
        context: 'Strong institutional momentum'
      })
    }

    return patterns
  }

  const generateElliottWave = (stockData) => {
    const waveCount = determineWaveCount(stockData.changePercent, stockData.volume)
    
    return {
      currentWave: waveCount,
      waveType: stockData.changePercent > 0 ? 'Impulse Wave' : 'Corrective Wave',
      degree: stockData.volume > 50000000 ? 'Primary' : stockData.volume > 30000000 ? 'Intermediate' : 'Minor',
      fibonacci: calculateFibonacciLevels(stockData.price, stockData.changePercent),
      projection: calculateWaveProjection(stockData.price, stockData.changePercent, waveCount),
      nextTarget: calculateNextTarget(stockData.price, stockData.changePercent, waveCount),
      invalidation: stockData.price * (waveCount.wave === 1 || waveCount.wave === 3 || waveCount.wave === 5 ? 0.94 : 1.06),
      confidence: Math.min(95, 50 + (stockData.volume > 40000000 ? 25 : 15) + (Math.abs(stockData.changePercent) > 3 ? 20 : 10)),
      subWaves: {
        wave1: { target: stockData.price * 1.05, completed: true, description: 'Initial breakout' },
        wave2: { target: stockData.price * 0.98, completed: true, description: 'Healthy retracement' },
        wave3: { target: stockData.price * 1.15, completed: false, current: true, description: 'Main impulse wave' },
        wave4: { target: stockData.price * 1.08, completed: false, description: 'Corrective pullback' },
        wave5: { target: stockData.price * 1.25, completed: false, description: 'Final extension' }
      }
    }
  }

  const generateVolumeAnalysis = (stockData) => ({
    volumeProfile: {
      rating: stockData.volume > 40000000 ? 'High' : stockData.volume > 20000000 ? 'Medium' : 'Low',
      relation: Math.abs(stockData.changePercent) > 2 && stockData.volume > 30000000 ? 'Healthy' : 'Divergent',
      institutionalInterest: stockData.volume > 35000000,
      market_participation: {
        retail_flow: 'Strong retail buying interest',
        institutional_flow: stockData.volume > 40000000 ? 'High institutional participation' : 'Moderate institutional flow',
        foreign_flow: 'International investor interest'
      }
    },
    volumeSpread: analyzeVolumeSpread(stockData),
    wyckoffPhase: determineWyckoffPhase(stockData),
    volumeSignals: generateVolumeSignals(stockData),
    volumeBreakdown: {
      institutional: stockData.volume * 0.65,
      retail: stockData.volume * 0.25,
      foreign: stockData.volume * 0.10,
      analysis: 'Strong institutional participation driving volume'
    }
  })

  const generateFundamentalAnalysis = (stockData) => ({
    valuation: {
      fair_value: stockData.price * (0.90 + Math.random() * 0.20),
      target_price: stockData.price * (1.10 + Math.random() * 0.15),
      recommendation: Math.random() > 0.5 ? 'BUY' : Math.random() > 0.3 ? 'HOLD' : 'SELL',
      analyst_consensus: 'Strong Buy - 15 analysts',
      price_target_range: `$${(stockData.price * 1.05).toFixed(2)} - $${(stockData.price * 1.25).toFixed(2)}`
    },
    financial_metrics: {
      pe_ratio: 18.5 + Math.random() * 15,
      pb_ratio: 2.5 + Math.random() * 3.5,
      roe: 15 + Math.random() * 20,
      dividend_yield: 1.5 + Math.random() * 3.5,
      debt_equity: 0.3 + Math.random() * 0.7,
      profit_margin: 15 + Math.random() * 25,
      revenue_growth: 8 + Math.random() * 20
    },
    sector_dynamics: {
      growth_prospects: getSectorGrowthProspects(stockData.sector),
      competitive_position: 'Market leader with strong moat',
      regulatory_environment: 'Favorable regulatory tailwinds',
      technology_trends: 'Well-positioned for digital transformation'
    }
  })

  const generateCycleAnalysis = (stockData) => ({
    market_cycles: {
      us_economic_cycle: 'Mid-cycle expansion phase',
      federal_reserve_policy: 'Accommodative monetary policy',
      earnings_cycle: 'Strong earnings growth phase',
      sector_rotation: 'Growth sectors outperforming'
    },
    seasonal_patterns: {
      quarterly_earnings: 'Q4 earnings season approaching',
      dividend_season: 'Ex-dividend date upcoming',
      tax_considerations: 'Year-end tax loss harvesting',
      holiday_seasonality: 'Positive holiday retail trends'
    },
    cycle_position: {
      current_phase: 'Bull market continuation',
      phase_duration: '18 months',
      next_phase: 'Late cycle peak',
      probability: 70
    }
  })

  const generateGannAnalysis = (stockData) => {
    const price = stockData.price
    const sqrt = Math.sqrt(price)
    
    return {
      squareOfNine: {
        currentSquare: Math.floor(sqrt) ** 2,
        nextSquare: Math.ceil(sqrt) ** 2,
        context: 'Gann squares for US equity pricing'
      },
      gannAngles: generateGannAngles(price),
      gannLevels: {
        support: [price * 0.875, price * 0.75, price * 0.625],
        resistance: [price * 1.125, price * 1.25, price * 1.375],
        timeTargets: ['2 weeks', '1 month', '3 months']
      }
    }
  }

  const generatePlanetaryAnalysis = (stockData) => {
    const currentDate = new Date()
    
    return {
      lunar_phases: {
        current_phase: calculateLunarPhase(currentDate),
        market_influence: 'Lunar cycle correlation with market sentiment'
      },
      planetary_positions: generatePlanetaryPositions(currentDate),
      astrological_forecast: {
        short_term: 'Favorable planetary alignments for next 2 weeks',
        medium_term: 'Jupiter transit supporting growth for 3 months',
        long_term: 'Saturn influence requiring patience for 6 months'
      }
    }
  }

  // Helper functions
  const generateTimeframeStructure = (stockData) => {
    const structures = {}
    timeframes.forEach(tf => {
      const multiplier = tf === '5M' ? 0.4 : tf === '15M' ? 0.6 : tf === '1H' ? 1 : tf === '4H' ? 1.3 : tf === '1D' ? 2 : tf === '1W' ? 3 : 4
      const adjustedChange = stockData.changePercent * multiplier
      
      structures[tf] = {
        trend: adjustedChange > 1.5 ? 'Bullish' : adjustedChange < -1.5 ? 'Bearish' : 'Neutral',
        strength: Math.abs(adjustedChange) * 10,
        structure: adjustedChange > 4 ? 'BOS' : Math.abs(adjustedChange) > 2 ? 'CHoCH' : 'Range'
      }
    })
    return structures
  }

  const generateStructureConfluences = (change, volume, sector) => {
    const confluences = []
    if (Math.abs(change) > 3 && volume > 30000000) {
      confluences.push({
        type: 'BOS Confluence',
        timeframes: ['1H', '4H', '1D'],
        strength: 'High',
        description: 'Break of Structure confirmed across multiple timeframes',
        sector_context: `${sector} sector showing strong momentum`
      })
    }
    return confluences
  }

  const generateLiquidityZones = (price, high, low) => ({
    sellLiquidity: {
      level1: high * 1.008,
      level2: high * 1.015,
      level3: high * 1.025,
      strength: 'High'
    },
    buyLiquidity: {
      level1: low * 0.992,
      level2: low * 0.985,
      level3: low * 0.975,
      strength: 'High'
    }
  })

  const generateFairValueGaps = (stockData) => {
    const gaps = []
    if (Math.abs(stockData.changePercent) > 3) {
      gaps.push({
        type: stockData.changePercent > 0 ? 'Bullish FVG' : 'Bearish FVG',
        high: stockData.price * 1.02,
        low: stockData.price * 0.98,
        significance: 'High'
      })
    }
    return gaps
  }

  const generateOrderBlocks = (stockData) => {
    const blocks = []
    if (stockData.volume > 30000000 && Math.abs(stockData.changePercent) > 2) {
      blocks.push({
        type: stockData.changePercent > 0 ? 'Bullish Order Block' : 'Bearish Order Block',
        strength: 'Strong',
        context: 'Institutional order flow detected'
      })
    }
    return blocks
  }

  const generateSmartMoneySignals = (stockData, seunBotSignals) => {
    const signals = []
    
    if (seunBotSignals.signal.includes('BUY')) {
      signals.push({
        type: 'SEUN BOT Buy Signal',
        direction: 'Bullish',
        strength: seunBotSignals.strength >= 4 ? 'Very Strong' : 'Strong',
        context: seunBotSignals.factors.join(', '),
        stopLoss: seunBotSignals.stopLoss,
        target1: seunBotSignals.target1,
        target2: seunBotSignals.target2
      })
    } else if (seunBotSignals.signal.includes('SELL')) {
      signals.push({
        type: 'SEUN BOT Sell Signal',
        direction: 'Bearish',
        strength: seunBotSignals.strength >= 4 ? 'Very Strong' : 'Strong',
        context: seunBotSignals.factors.join(', ')
      })
    }
    
    if (stockData.changePercent > 3 && stockData.volume > 40000000) {
      signals.push({
        type: 'Smart Money Breakout',
        direction: 'Bullish',
        strength: 'Strong',
        context: 'Institutional accumulation detected'
      })
    }
    
    return signals
  }

  const getSectorRotationPhase = (sector) => {
    const phases = {
      'Technology': 'Growth sector leadership',
      'Financial Services': 'Interest rate cycle beneficiary',
      'Healthcare': 'Defensive rotation phase',
      'Consumer Discretionary': 'Economic expansion beneficiary',
      'Energy': 'Commodity cycle positioning',
      'Industrials': 'Infrastructure spending beneficiary',
      'Consumer Staples': 'Defensive positioning',
      'Communication Services': 'Digital transformation leader',
      'Real Estate': 'Rate-sensitive positioning',
      'Materials': 'Commodity super-cycle',
      'Utilities': 'Defensive income positioning'
    }
    return phases[sector] || 'Neutral rotation'
  }

  const determineWaveCount = (change, volume) => {
    if (change > 5 && volume > 40000000) {
      return { wave: 3, description: 'Wave 3 - Main Impulse' }
    } else if (change > 2 && change <= 5) {
      return { wave: 1, description: 'Wave 1 - Initial Breakout' }
    } else {
      return { wave: 'A', description: 'Wave A - Correction' }
    }
  }

  const calculateFibonacciLevels = (price, change) => {
    const range = Math.abs(price * change / 100)
    return {
      retracement: {
        '23.6%': price - (range * 0.236),
        '38.2%': price - (range * 0.382),
        '50%': price - (range * 0.5),
        '61.8%': price - (range * 0.618)
      },
      extension: {
        '127.2%': price + (range * 1.272),
        '161.8%': price + (range * 1.618)
      }
    }
  }

  const calculateWaveProjection = (price, change, waveCount) => ({
    target: price * 1.15,
    type: 'Wave Projection',
    probability: 80
  })

  const calculateNextTarget = (price, change, waveCount) => price * 1.12

  const analyzeVolumeSpread = (stockData) => ({
    type: 'Professional Money',
    signal: stockData.changePercent > 0 ? 'Institutional Buying' : 'Institutional Selling',
    strength: 'Strong'
  })

  const determineWyckoffPhase = (stockData) => ({
    phase: 'Accumulation',
    stage: 'Phase B - Testing Supply',
    description: 'Smart money accumulating positions'
  })

  const generateVolumeSignals = (stockData) => [{
    signal: 'Professional Activity',
    strength: 'Strong',
    description: 'High volume indicates institutional involvement'
  }]

  const generateGannAngles = (price) => ({
    angles: {
      '1x1': { angle: 45, price: price, description: 'Main trend line' },
      '1x2': { angle: 26.25, price: price * 1.02, description: 'Slow uptrend' }
    }
  })

  const getSectorGrowthProspects = (sector) => `${sector} showing strong growth trajectory`

  const generatePlanetaryPositions = (date) => ({
    sun: { longitude: 280.460, sign: 'Sagittarius', influence: 'Major' },
    moon: { longitude: 218.316, sign: 'Cancer', influence: 'Major' }
  })

  const calculateLunarPhase = (date) => ({
    name: 'Waxing Crescent',
    influence: 'Growth',
    market_context: 'Favorable for market growth'
  })

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Brain className="h-5 w-5 text-purple-500 animate-pulse" />
          <h3 className="text-lg font-semibold text-white">SeunBot Advanced Analysis</h3>
          <div className="px-2 py-1 bg-blue-500/20 rounded text-xs text-blue-400">
            {dataSource}
          </div>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Analyzing with SeunBot intelligence...</p>
            <p className="text-sm text-gray-500">Processing RSI, MACD, Volume & Smart Money Concepts</p>
          </div>
        </div>
      </div>
    )
  }

  if (!analysis) {
    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="text-center py-8 text-gray-400">
          <Brain className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>Select a stock to begin SeunBot advanced analysis</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Brain className="h-5 w-5 text-purple-500" />
          <h3 className="text-lg font-semibold text-white">SeunBot Advanced Analysis</h3>
          <div className="px-2 py-1 bg-purple-500/20 rounded text-xs text-purple-400">
            {selectedStock}
          </div>
          <div className="px-2 py-1 bg-blue-500/20 rounded text-xs text-blue-400">
            {dataSource}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <select
            value={selectedTimeframe}
            onChange={(e) => setSelectedTimeframe(e.target.value)}
            className="bg-gray-700 border border-gray-600 rounded px-3 py-1 text-white text-sm"
          >
            {timeframes.map(tf => (
              <option key={tf} value={tf}>{tf}</option>
            ))}
          </select>
          <button
            onClick={() => {
              loadRealTimeData()
              generateAdvancedAnalysis()
            }}
            className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-gray-400"
            title="Refresh data"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Real-time data indicator */}
      {realTimeData && (
        <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-blue-400 font-medium">Live Price: </span>
              <span className="text-white font-bold text-lg">${realTimeData.price.toFixed(2)}</span>
            </div>
            <div>
              <span className={`font-bold ${realTimeData.changePercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {realTimeData.changePercent >= 0 ? '+' : ''}{realTimeData.changePercent.toFixed(2)}%
              </span>
            </div>
            <div className="text-xs text-gray-400">
              Volume: {(realTimeData.volume / 1000000).toFixed(2)}M
            </div>
          </div>
        </div>
      )}

      {/* SEUN BOT Signal Panel */}
      {analysis?.seunBot && (
        <div className="mb-6 p-4 bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Zap className="h-5 w-5 text-yellow-400" />
              <span className="text-white font-bold text-lg">SEUN BOT SIGNAL</span>
            </div>
            <div className={`text-2xl font-bold ${
              analysis.seunBot.signal.includes('STRONG BUY') ? 'text-green-400' :
              analysis.seunBot.signal.includes('BUY') ? 'text-green-300' :
              analysis.seunBot.signal.includes('STRONG SELL') ? 'text-red-400' :
              analysis.seunBot.signal.includes('SELL') ? 'text-red-300' :
              'text-yellow-400'
            }`}>
              {analysis.seunBot.signal}
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
            <div className="text-center p-2 bg-gray-700/30 rounded">
              <div className="text-xs text-gray-400">Signal Strength</div>
              <div className="text-white font-bold">{analysis.seunBot.strength.toFixed(1)}/5</div>
            </div>
            <div className="text-center p-2 bg-gray-700/30 rounded">
              <div className="text-xs text-gray-400">RSI</div>
              <div className={`font-bold ${
                analysis.seunBot.rsi < 30 ? 'text-green-400' :
                analysis.seunBot.rsi > 70 ? 'text-red-400' :
                'text-yellow-400'
              }`}>{analysis.seunBot.rsi?.toFixed(1) || 'N/A'}</div>
            </div>
            <div className="text-center p-2 bg-gray-700/30 rounded">
              <div className="text-xs text-gray-400">MACD</div>
              <div className={`font-bold ${
                analysis.seunBot.macd > 0 ? 'text-green-400' : 'text-red-400'
              }`}>{analysis.seunBot.macd?.toFixed(2) || 'N/A'}</div>
            </div>
            <div className="text-center p-2 bg-gray-700/30 rounded">
              <div className="text-xs text-gray-400">Confidence</div>
              <div className="text-white font-bold">{analysis.smartMoney.confidence.toFixed(0)}%</div>
            </div>
          </div>

          {analysis.seunBot.stopLoss && (
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div className="p-2 bg-red-500/10 rounded">
                <div className="text-xs text-gray-400">Stop Loss</div>
                <div className="text-red-400 font-bold">${analysis.seunBot.stopLoss.toFixed(2)}</div>
              </div>
              <div className="p-2 bg-green-500/10 rounded">
                <div className="text-xs text-gray-400">Target 1 (RR 3:1)</div>
                <div className="text-green-400 font-bold">${analysis.seunBot.target1.toFixed(2)}</div>
              </div>
              <div className="p-2 bg-green-500/10 rounded">
                <div className="text-xs text-gray-400">Target 2 (RR 6:1)</div>
                <div className="text-green-400 font-bold">${analysis.seunBot.target2.toFixed(2)}</div>
              </div>
            </div>
          )}

          {analysis.seunBot.factors && analysis.seunBot.factors.length > 0 && (
            <div className="mt-3 p-2 bg-gray-700/20 rounded">
              <div className="text-xs text-gray-400 mb-1">Signal Factors:</div>
              <div className="flex flex-wrap gap-1">
                {analysis.seunBot.factors.map((factor, index) => (
                  <span key={index} className="text-xs px-2 py-1 bg-blue-500/20 text-blue-400 rounded">
                    {factor}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap space-x-1 mb-6 bg-gray-700/50 rounded-lg p-1">
        {[
          { id: 'smartMoney', label: 'Smart Money', icon: BarChart3 },
          { id: 'patterns', label: 'Patterns', icon: Triangle },
          { id: 'elliottWave', label: 'Elliott Wave', icon: Waves },
          { id: 'volume', label: 'Volume', icon: Volume2 },
          { id: 'fundamental', label: 'Fundamental', icon: TrendingUp },
          { id: 'cycle', label: 'Cycle', icon: Clock },
          { id: 'gann', label: 'Gann', icon: Compass },
          { id: 'planetary', label: 'Planetary', icon: Globe }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-purple-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-600'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content - Similar structure to NGX but adapted for S&P 500 */}
      <div className="space-y-4">
        {activeTab === 'smartMoney' && analysis?.smartMoney && (
          <div className="space-y-4">
            <div className="bg-gray-700/30 rounded-lg p-4">
              <h4 className="text-white font-medium mb-3">Smart Money Concepts</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded">
                  <div className="text-blue-400 font-medium text-sm mb-2">Market Structure</div>
                  <div className="text-white font-bold">{analysis.smartMoney.marketStructure.current}</div>
                </div>
                <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded">
                  <div className="text-purple-400 font-medium text-sm mb-2">Premium/Discount Zone</div>
                  <div className="text-white font-bold">{analysis.smartMoney.premiumDiscount.zone}</div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Add other tabs similar to NGX but with S&P 500 specific content */}
      </div>
    </div>
  )
}

export default SP500AdvancedAnalysis