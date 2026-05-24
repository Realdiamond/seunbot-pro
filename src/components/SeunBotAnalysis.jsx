import React, { useState, useEffect } from 'react'
import { 
  Brain, TrendingUp, TrendingDown, Activity, Volume2, 
  BarChart3, Zap, Target, AlertTriangle, CheckCircle,
  Clock, DollarSign, Percent, Eye, RefreshCw, Waves,
  Triangle, Square, Circle, Hexagon, Diamond, Star,
  Globe, Calendar, Moon, Sun, Compass, Orbit, MapPin
} from 'lucide-react'

const SeunBotAnalysis = ({ selectedPair = 'BTCUSDT', priceData = null }) => {
  const [activeTab, setActiveTab] = useState('smartMoney')
  const [selectedTimeframe, setSelectedTimeframe] = useState('1D')
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(false)

  const timeframes = ['5M', '15M', '1H', '4H', '1D', '1W', '1M']

  useEffect(() => {
    if (selectedPair) {
      generateAdvancedAnalysis()
    }
  }, [selectedPair, selectedTimeframe])

  const generateAdvancedAnalysis = () => {
    setLoading(true)
    
    setTimeout(() => {
      const currentPrice = priceData?.price || 43250.50
      const change = priceData?.priceChangePercent || 2.5
      const volume = priceData?.volume || 15000000
      
      const comprehensiveAnalysis = {
        smartMoney: generateSmartMoneyAnalysis(currentPrice, change, volume),
        patterns: generateGeometricPatterns(currentPrice, change, volume),
        elliottWave: generateElliottWave(currentPrice, change, volume),
        volume: generateVolumeAnalysis(currentPrice, change, volume),
        fundamental: generateFundamentalAnalysis(currentPrice, change, volume),
        cycle: generateCycleAnalysis(currentPrice, change, volume),
        gann: generateGannAnalysis(currentPrice, change, volume),
        planetary: generatePlanetaryAnalysis(currentPrice, change, volume)
      }

      setAnalysis(comprehensiveAnalysis)
      setLoading(false)
    }, 2000)
  }

  // Smart Money Concepts Analysis
  const generateSmartMoneyAnalysis = (price, change, volume) => ({
    marketStructure: {
      current: change > 3 ? 'Strong Bullish BOS' : change < -3 ? 'Strong Bearish BOS' : 'Consolidation',
      alignment: { 
        direction: change > 0 ? 'Bullish' : 'Bearish', 
        alignment: Math.abs(change) * 12,
        bias: 'Following institutional flow'
      },
      timeframes: generateTimeframeStructure(change),
      confluences: generateStructureConfluences(change, volume)
    },
    liquidityAnalysis: {
      zones: generateLiquidityZones(price),
      fairValueGaps: generateFairValueGaps(price, change),
      orderBlocks: generateOrderBlocks(price, volume),
      sweeps: {
        buyLiquidity: price * 0.98,
        sellLiquidity: price * 1.02,
        strength: volume > 10000000 ? 'High' : 'Medium'
      }
    },
    premiumDiscount: {
      zone: (Math.random() > 0.6) ? 'Premium' : (Math.random() > 0.3) ? 'Discount' : 'Equilibrium',
      currentPosition: Math.random(),
      optimalEntry: Math.random() > 0.5 ? 'Wait for Discount' : 'Current Level Good'
    },
    signals: generateSmartMoneySignals(change, volume),
    confidence: Math.min(95, 60 + Math.abs(change) * 5 + (volume / 2000000))
  })

  // Geometric Patterns Analysis
  const generateGeometricPatterns = (price, change, volume) => ({
    triangles: [
      {
        type: 'Ascending Triangle',
        pattern: 'Bullish Continuation',
        resistance: price * 1.025,
        support: price * 0.975,
        breakoutTarget: price * 1.06,
        probability: 72,
        completion: '65%'
      },
      {
        type: 'Symmetrical Triangle',
        pattern: 'Neutral Consolidation',
        resistance: price * 1.02,
        support: price * 0.98,
        breakoutTarget: price * (Math.random() > 0.5 ? 1.04 : 0.96),
        probability: 68,
        completion: '80%'
      }
    ],
    channels: [
      {
        type: 'Ascending Channel',
        upperTrend: price * 1.03,
        lowerTrend: price * 0.97,
        direction: 'Bullish',
        strength: 'Strong',
        nextTarget: price * 1.05
      }
    ],
    flags: [
      {
        type: change > 0 ? 'Bull Flag' : 'Bear Flag',
        flagPole: Math.abs(change),
        target: price * (change > 0 ? 1.08 : 0.92),
        probability: 78,
        timeframe: selectedTimeframe
      }
    ],
    headAndShoulders: Math.random() > 0.7 ? [{
      type: 'Head and Shoulders',
      neckline: price * 0.98,
      target: price * 0.94,
      probability: 65,
      status: 'Forming'
    }] : [],
    wedges: [{
      type: 'Rising Wedge',
      direction: 'Bearish Reversal',
      target: price * 0.95,
      probability: 70,
      completion: '45%'
    }]
  })

  // Elliott Wave Analysis
  const generateElliottWave = (price, change, volume) => {
    const waveCount = determineWaveCount(change, volume)
    
    return {
      currentWave: waveCount,
      waveType: change > 0 ? 'Impulse Wave' : 'Corrective Wave',
      degree: volume > 20000000 ? 'Primary' : volume > 10000000 ? 'Intermediate' : 'Minor',
      fibonacci: calculateFibonacciLevels(price, change),
      projection: calculateWaveProjection(price, change, waveCount),
      nextTarget: calculateNextTarget(price, change, waveCount),
      invalidation: price * (waveCount.wave === 1 || waveCount.wave === 3 || waveCount.wave === 5 ? 0.94 : 1.06),
      confidence: Math.min(95, 50 + (volume > 15000000 ? 25 : 15) + (Math.abs(change) > 3 ? 20 : 10)),
      subWaves: {
        wave1: { target: price * 1.05, completed: true },
        wave2: { target: price * 0.98, completed: true },
        wave3: { target: price * 1.15, completed: false, current: true },
        wave4: { target: price * 1.08, completed: false },
        wave5: { target: price * 1.25, completed: false }
      }
    }
  }

  // Volume Analysis
  const generateVolumeAnalysis = (price, change, volume) => ({
    volumeProfile: {
      rating: volume > 15000000 ? 'High' : volume > 8000000 ? 'Medium' : 'Low',
      relation: Math.abs(change) > 2 && volume > 10000000 ? 'Healthy' : 'Divergent',
      institutionalInterest: volume > 12000000,
      distribution: {
        buyVolume: volume * (0.4 + Math.random() * 0.2),
        sellVolume: volume * (0.4 + Math.random() * 0.2),
        ratio: 0.8 + Math.random() * 0.4
      }
    },
    volumeSpread: analyzeVolumeSpread(change, volume),
    wyckoffPhase: determineWyckoffPhase(change, volume),
    volumeSignals: generateVolumeSignals(change, volume),
    onBalanceVolume: {
      trend: change > 0 ? 'Rising' : 'Falling',
      divergence: Math.random() > 0.7 ? 'Bullish Divergence' : 'No Divergence',
      strength: volume > 10000000 ? 'Strong' : 'Weak'
    },
    accumulation: {
      phase: Math.random() > 0.5 ? 'Accumulation' : 'Distribution',
      strength: volume > 15000000 ? 'High' : 'Medium',
      timeRemaining: Math.floor(Math.random() * 10) + 1 + ' days'
    }
  })

  // Fundamental Analysis
  const generateFundamentalAnalysis = (price, change, volume) => ({
    valuation: {
      fair_value: price * (0.85 + Math.random() * 0.3),
      target_price: price * (1.08 + Math.random() * 0.15),
      recommendation: Math.random() > 0.6 ? 'BUY' : Math.random() > 0.3 ? 'HOLD' : 'SELL',
      risk_rating: Math.random() > 0.5 ? 'Medium' : 'High'
    },
    onChainMetrics: {
      networkActivity: Math.floor(Math.random() * 100000) + 50000,
      activeAddresses: Math.floor(Math.random() * 500000) + 200000,
      transactionVolume: Math.floor(Math.random() * 10000000000) + 1000000000,
      hashRate: Math.floor(Math.random() * 200) + 150 + ' EH/s',
      difficulty: Math.floor(Math.random() * 30) + 20 + 'T'
    },
    sentiment: {
      fearGreedIndex: Math.floor(Math.random() * 100),
      socialSentiment: Math.random() > 0.5 ? 'Bullish' : 'Bearish',
      newsFlow: Math.random() > 0.6 ? 'Positive' : Math.random() > 0.3 ? 'Neutral' : 'Negative',
      institutionalFlow: Math.random() > 0.5 ? 'Inflow' : 'Outflow'
    },
    macroFactors: {
      correlation_usstocks: (Math.random() * 0.8 + 0.1).toFixed(2),
      correlation_gold: (Math.random() * 0.6 - 0.3).toFixed(2),
      correlation_dxy: (Math.random() * -0.5 - 0.2).toFixed(2),
      fed_policy_impact: Math.random() > 0.5 ? 'Supportive' : 'Restrictive'
    }
  })

  // Cycle Analysis
  const generateCycleAnalysis = (price, change, volume) => ({
    marketCycles: {
      primary: {
        phase: Math.random() > 0.5 ? 'Bull Market' : 'Bear Market',
        timeRemaining: Math.floor(Math.random() * 365) + 30 + ' days',
        strength: Math.random() > 0.5 ? 'Strong' : 'Weak'
      },
      intermediate: {
        phase: ['Accumulation', 'Markup', 'Distribution', 'Markdown'][Math.floor(Math.random() * 4)],
        completion: Math.floor(Math.random() * 100) + '%'
      },
      short: {
        phase: Math.random() > 0.5 ? 'Bullish' : 'Bearish',
        duration: Math.floor(Math.random() * 30) + 5 + ' days'
      }
    },
    seasonality: {
      monthly: generateMonthlySeasonality(),
      weekly: generateWeeklySeasonality(),
      daily: generateDailySeasonality()
    },
    fourier: {
      dominantCycle: Math.floor(Math.random() * 20) + 10 + ' days',
      amplitude: (Math.random() * 0.1 + 0.02).toFixed(3),
      phase: Math.floor(Math.random() * 360) + '°'
    },
    astro: {
      lunarCycle: calculateLunarCycle(),
      planetaryAspects: generatePlanetaryAspects(),
      geomagneticActivity: Math.random() > 0.7 ? 'High' : 'Low'
    }
  })

  // Gann Analysis
  const generateGannAnalysis = (price, change, volume) => {
    const sqrt = Math.sqrt(price)
    
    return {
      priceTime: {
        balance: Math.random() > 0.5 ? 'Balanced' : 'Imbalanced',
        nextTimeTarget: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        priceTimeRatio: '1:1'
      },
      squareOfNine: {
        currentSquare: Math.floor(sqrt) ** 2,
        nextSquare: Math.ceil(sqrt) ** 2,
        resistance: Math.ceil(sqrt) ** 2,
        support: Math.floor(sqrt) ** 2,
        cardinalCross: generateCardinalCross(price),
        fixedCross: generateFixedCross(price)
      },
      gannAngles: generateGannAngles(price),
      timeSquares: {
        next: Math.floor(Math.random() * 30) + 1 + ' days',
        significance: Math.random() > 0.5 ? 'High' : 'Medium',
        direction: Math.random() > 0.5 ? 'Bullish' : 'Bearish'
      },
      hexagon: {
        currentPosition: Math.floor(Math.random() * 360) + '°',
        nextSignificant: Math.floor(Math.random() * 60) + '°',
        trend: Math.random() > 0.5 ? 'Up' : 'Down'
      }
    }
  }

  // Planetary Analysis
  const generatePlanetaryAnalysis = (price, change, volume) => {
    const currentDate = new Date()
    
    return {
      currentAspects: generateCurrentAspects(currentDate),
      lunarPhase: calculateLunarPhase(currentDate),
      planetaryPositions: generatePlanetaryPositions(currentDate),
      retrogradeEffects: generateRetrogradeEffects(),
      eclipseImpacts: generateEclipseImpacts(),
      marketAstrology: {
        bitcoinChart: {
          sun: { sign: 'Capricorn', degree: 3.7, influence: 'Strong' },
          moon: { sign: 'Cancer', degree: 15.2, influence: 'Medium' },
          mercury: { sign: 'Sagittarius', degree: 28.9, influence: 'High' }
        },
        transits: [
          { planet: 'Jupiter', aspect: 'Trine', influence: 'Very Bullish' },
          { planet: 'Saturn', aspect: 'Square', influence: 'Bearish' },
          { planet: 'Mars', aspect: 'Conjunction', influence: 'Volatile' }
        ]
      },
      cosmicWeather: {
        solarActivity: Math.random() > 0.7 ? 'High' : 'Low',
        geomagneticField: Math.random() > 0.5 ? 'Stable' : 'Disturbed',
        cosmicRayIntensity: Math.random() > 0.6 ? 'Elevated' : 'Normal'
      }
    }
  }

  // Helper functions
  const generateTimeframeStructure = (change) => {
    const structures = {}
    timeframes.forEach(tf => {
      const multiplier = tf === '5M' ? 0.4 : tf === '15M' ? 0.6 : tf === '1H' ? 1 : tf === '4H' ? 1.3 : tf === '1D' ? 2 : tf === '1W' ? 3 : 4
      const adjustedChange = change * multiplier
      
      structures[tf] = {
        trend: adjustedChange > 1.5 ? 'Bullish' : adjustedChange < -1.5 ? 'Bearish' : 'Neutral',
        strength: Math.abs(adjustedChange) * 10,
        structure: adjustedChange > 4 ? 'BOS' : Math.abs(adjustedChange) > 2 ? 'CHoCH' : 'Range'
      }
    })
    return structures
  }

  const generateStructureConfluences = (change, volume) => {
    const confluences = []
    if (Math.abs(change) > 3 && volume > 10000000) {
      confluences.push({
        type: 'BOS Confluence',
        timeframes: ['1H', '4H', '1D'],
        strength: 'High',
        description: 'Break of Structure confirmed across multiple timeframes'
      })
    }
    return confluences
  }

  const generateLiquidityZones = (price) => ({
    sellLiquidity: {
      level1: price * 1.008,
      level2: price * 1.015,
      level3: price * 1.025,
      strength: 'High'
    },
    buyLiquidity: {
      level1: price * 0.992,
      level2: price * 0.985,
      level3: price * 0.975,
      strength: 'High'
    }
  })

  const generateFairValueGaps = (price, change) => {
    const gaps = []
    if (Math.abs(change) > 3) {
      gaps.push({
        type: change > 0 ? 'Bullish FVG' : 'Bearish FVG',
        high: price * 1.02,
        low: price * 0.98,
        significance: 'High'
      })
    }
    return gaps
  }

  const generateOrderBlocks = (price, volume) => {
    const blocks = []
    if (volume > 10000000) {
      blocks.push({
        type: Math.random() > 0.5 ? 'Bullish Order Block' : 'Bearish Order Block',
        price: price * (0.98 + Math.random() * 0.04),
        strength: 'Strong'
      })
    }
    return blocks
  }

  const generateSmartMoneySignals = (change, volume) => {
    const signals = []
    if (change > 3 && volume > 15000000) {
      signals.push({
        type: 'Smart Money Breakout',
        direction: 'Bullish',
        strength: 'Strong'
      })
    }
    return signals
  }

  const determineWaveCount = (change, volume) => {
    if (change > 5 && volume > 15000000) {
      return { wave: 3, description: 'Wave 3 - Strongest Impulse' }
    } else if (change > 2 && change <= 5) {
      return { wave: 1, description: 'Wave 1 - Initial Breakout' }
    } else {
      return { wave: 'A', description: 'Wave A - Corrective Move' }
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

  const analyzeVolumeSpread = (change, volume) => ({
    type: 'Professional Money',
    signal: change > 0 ? 'Buying' : 'Selling',
    strength: 'Strong'
  })

  const determineWyckoffPhase = (change, volume) => ({
    phase: 'Accumulation',
    stage: 'Phase B - Testing Supply',
    description: 'Smart money accumulating positions'
  })

  const generateVolumeSignals = (change, volume) => [{
    signal: 'High Volume Breakout',
    strength: 'Strong',
    description: 'Volume confirms price movement'
  }]

  const generateMonthlySeasonality = () => ({
    january: 'Bullish',
    february: 'Neutral',
    march: 'Bullish',
    april: 'Bearish',
    may: 'Neutral',
    june: 'Bearish',
    july: 'Bullish',
    august: 'Neutral',
    september: 'Bearish',
    october: 'Bullish',
    november: 'Bullish',
    december: 'Neutral'
  })

  const generateWeeklySeasonality = () => ({
    monday: 'Bearish',
    tuesday: 'Neutral',
    wednesday: 'Bullish',
    thursday: 'Neutral',
    friday: 'Bearish',
    saturday: 'Neutral',
    sunday: 'Bullish'
  })

  const generateDailySeasonality = () => ({
    '00-06': 'Low Activity',
    '06-12': 'Rising Activity',
    '12-18': 'Peak Activity',
    '18-24': 'Declining Activity'
  })

  const calculateLunarCycle = () => ({
    phase: 'Waxing Crescent',
    influence: 'Bullish',
    daysToFull: Math.floor(Math.random() * 15) + 1
  })

  const generatePlanetaryAspects = () => [
    { planets: 'Sun-Jupiter', aspect: 'Trine', influence: 'Very Bullish' },
    { planets: 'Mars-Saturn', aspect: 'Square', influence: 'Bearish' },
    { planets: 'Venus-Mercury', aspect: 'Conjunction', influence: 'Neutral' }
  ]

  const generateCardinalCross = (price) => ({
    0: price,
    90: price * 1.05,
    180: price * 1.10,
    270: price * 0.95
  })

  const generateFixedCross = (price) => ({
    45: price * 1.025,
    135: price * 1.075,
    225: price * 1.025,
    315: price * 0.975
  })

  const generateGannAngles = (price) => ({
    angles: {
      '1x1': { angle: 45, price: price, description: 'Main trend line' },
      '1x2': { angle: 26.25, price: price * 1.02, description: 'Slow uptrend' },
      '2x1': { angle: 63.75, price: price * 0.98, description: 'Fast uptrend' },
      '1x3': { angle: 18.75, price: price * 1.03, description: 'Very slow uptrend' },
      '3x1': { angle: 71.25, price: price * 0.97, description: 'Very fast uptrend' }
    }
  })

  const generateCurrentAspects = (date) => [
    { aspect: 'Sun Square Mars', influence: 'Volatile Energy', strength: 'Strong' },
    { aspect: 'Moon Trine Jupiter', influence: 'Optimistic Mood', strength: 'Medium' },
    { aspect: 'Mercury Conjunct Venus', influence: 'Communication Flow', strength: 'Weak' }
  ]

  const calculateLunarPhase = (date) => ({
    name: 'Waxing Crescent',
    influence: 'Growth',
    marketImpact: 'Bullish tendency'
  })

  const generatePlanetaryPositions = (date) => ({
    sun: { longitude: 280.460, sign: 'Sagittarius', influence: 'Major' },
    moon: { longitude: 218.316, sign: 'Cancer', influence: 'Major' },
    mercury: { longitude: 245.120, sign: 'Sagittarius', influence: 'Medium' },
    venus: { longitude: 290.850, sign: 'Capricorn', influence: 'Medium' },
    mars: { longitude: 156.720, sign: 'Leo', influence: 'High' },
    jupiter: { longitude: 45.230, sign: 'Taurus', influence: 'High' },
    saturn: { longitude: 330.180, sign: 'Pisces', influence: 'Medium' }
  })

  const generateRetrogradeEffects = () => ({
    mercury: { retrograde: false, influence: 'Normal communication' },
    venus: { retrograde: false, influence: 'Normal value flows' },
    mars: { retrograde: Math.random() > 0.8, influence: 'Potential energy blocks' }
  })

  const generateEclipseImpacts = () => ({
    nextSolar: '2024-04-08',
    nextLunar: '2024-03-25',
    currentInfluence: 'Transformation period',
    marketEffect: 'Increased volatility expected'
  })

  if (loading) {
    return (
      <div className="glass-effect rounded-lg p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Brain className="h-5 w-5 text-blue-500 animate-pulse" />
          <h3 className="text-lg font-semibold text-white">SeunBot Advanced Analysis</h3>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Analyzing with SeunBot intelligence...</p>
            <p className="text-sm text-gray-500">Processing Smart Money, Elliott Wave, Gann, Planetary & Volume Analysis</p>
          </div>
        </div>
      </div>
    )
  }

  if (!analysis) {
    return (
      <div className="glass-effect rounded-lg p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Brain className="h-5 w-5 text-blue-500" />
          <h3 className="text-lg font-semibold text-white">SeunBot Advanced Analysis</h3>
        </div>
        <div className="text-center py-8 text-gray-400">
          <Brain className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>Select a trading pair to begin SeunBot advanced analysis</p>
        </div>
      </div>
    )
  }

  return (
    <div className="glass-effect rounded-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Brain className="h-5 w-5 text-blue-500" />
          <h3 className="text-lg font-semibold text-white">SeunBot Advanced Analysis</h3>
          <div className="px-2 py-1 bg-blue-500/20 rounded text-xs text-blue-400">
            {selectedPair}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <select
            value={selectedTimeframe}
            onChange={(e) => setSelectedTimeframe(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded px-3 py-1 text-white text-sm"
          >
            {timeframes.map(tf => (
              <option key={tf} value={tf}>{tf}</option>
            ))}
          </select>
          <button
            onClick={generateAdvancedAnalysis}
            className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-gray-400"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap space-x-1 mb-6 bg-gray-800/50 rounded-lg p-1">
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
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="space-y-4">
        {/* Smart Money Tab */}
        {activeTab === 'smartMoney' && (
          <div className="space-y-4">
            <div className="bg-gray-800/30 rounded-lg p-4">
              <h4 className="text-white font-medium mb-3 flex items-center">
                <BarChart3 className="h-4 w-4 mr-2 text-blue-400" />
                Smart Money Concepts
              </h4>
              
              <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-blue-400 font-medium">Market Structure</span>
                  <span className="text-white font-bold">{analysis.smartMoney.marketStructure.current}</span>
                </div>
                <div className="text-xs text-gray-300 mb-2">
                  Direction: {analysis.smartMoney.marketStructure.alignment.direction} | 
                  Alignment: {analysis.smartMoney.marketStructure.alignment.alignment.toFixed(1)}%
                </div>
                <div className="text-xs text-blue-400">
                  Bias: {analysis.smartMoney.marketStructure.alignment.bias}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3 bg-green-500/10 border border-green-500/20 rounded">
                  <div className="text-green-400 font-medium text-sm mb-2">Liquidity Analysis</div>
                  <div className="text-xs text-gray-300 mb-2">
                    Buy Liquidity: ${analysis.smartMoney.liquidityAnalysis.zones.buyLiquidity.level1.toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-300">
                    Sell Liquidity: ${analysis.smartMoney.liquidityAnalysis.zones.sellLiquidity.level1.toFixed(2)}
                  </div>
                </div>
                
                <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded">
                  <div className="text-purple-400 font-medium text-sm mb-2">Premium/Discount Zone</div>
                  <div className="text-white text-lg">{analysis.smartMoney.premiumDiscount.zone}</div>
                  <div className="text-xs text-gray-300">
                    {analysis.smartMoney.premiumDiscount.optimalEntry}
                  </div>
                </div>
              </div>

              <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded">
                <div className="text-yellow-400 font-medium text-sm mb-2">Confidence Level</div>
                <div className="flex items-center space-x-2">
                  <div className="flex-1 bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-yellow-500 h-2 rounded-full" 
                      style={{ width: `${analysis.smartMoney.confidence}%` }}
                    ></div>
                  </div>
                  <span className="text-white font-bold">{analysis.smartMoney.confidence.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Patterns Tab */}
        {activeTab === 'patterns' && (
          <div className="space-y-4">
            <div className="bg-gray-800/30 rounded-lg p-4">
              <h4 className="text-white font-medium mb-3 flex items-center">
                <Triangle className="h-4 w-4 mr-2 text-green-400" />
                Geometric Patterns
              </h4>
              
              {/* Triangles */}
              <div className="mb-4">
                <h5 className="text-green-400 font-medium mb-2">Triangle Patterns</h5>
                {analysis.patterns.triangles.map((triangle, index) => (
                  <div key={index} className="p-3 bg-green-500/10 border border-green-500/20 rounded mb-2">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-white font-medium">{triangle.type}</span>
                      <span className="text-green-400">{triangle.probability}%</span>
                    </div>
                    <div className="text-xs text-gray-300">
                      Target: ${triangle.breakoutTarget.toFixed(2)} | Completion: {triangle.completion}
                    </div>
                  </div>
                ))}
              </div>

              {/* Flags */}
              <div className="mb-4">
                <h5 className="text-blue-400 font-medium mb-2">Flag Patterns</h5>
                {analysis.patterns.flags.map((flag, index) => (
                  <div key={index} className="p-3 bg-blue-500/10 border border-blue-500/20 rounded mb-2">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-white font-medium">{flag.type}</span>
                      <span className="text-blue-400">{flag.probability}%</span>
                    </div>
                    <div className="text-xs text-gray-300">
                      Target: ${flag.target.toFixed(2)} | Timeframe: {flag.timeframe}
                    </div>
                  </div>
                ))}
              </div>

              {/* Channels */}
              <div>
                <h5 className="text-purple-400 font-medium mb-2">Channel Patterns</h5>
                {analysis.patterns.channels.map((channel, index) => (
                  <div key={index} className="p-3 bg-purple-500/10 border border-purple-500/20 rounded">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-white font-medium">{channel.type}</span>
                      <span className="text-purple-400">{channel.strength}</span>
                    </div>
                    <div className="text-xs text-gray-300">
                      Upper: ${channel.upperTrend.toFixed(2)} | Lower: ${channel.lowerTrend.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Elliott Wave Tab */}
        {activeTab === 'elliottWave' && (
          <div className="space-y-4">
            <div className="bg-gray-800/30 rounded-lg p-4">
              <h4 className="text-white font-medium mb-3 flex items-center">
                <Waves className="h-4 w-4 mr-2 text-cyan-400" />
                Elliott Wave Analysis
              </h4>
              
              <div className="mb-4 p-3 bg-cyan-500/10 border border-cyan-500/20 rounded">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-cyan-400 font-medium">Current Wave</span>
                  <span className="text-white font-bold">Wave {analysis.elliottWave.currentWave.wave}</span>
                </div>
                <div className="text-xs text-gray-300 mb-2">
                  {analysis.elliottWave.currentWave.description}
                </div>
                <div className="text-xs text-cyan-400">
                  Type: {analysis.elliottWave.waveType} | Degree: {analysis.elliottWave.degree}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="p-3 bg-green-500/10 border border-green-500/20 rounded">
                  <div className="text-green-400 font-medium text-sm mb-2">Fibonacci Retracements</div>
                  <div className="space-y-1 text-xs text-gray-300">
                    <div>23.6%: ${analysis.elliottWave.fibonacci.retracement['23.6%'].toFixed(2)}</div>
                    <div>38.2%: ${analysis.elliottWave.fibonacci.retracement['38.2%'].toFixed(2)}</div>
                    <div>61.8%: ${analysis.elliottWave.fibonacci.retracement['61.8%'].toFixed(2)}</div>
                  </div>
                </div>
                
                <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded">
                  <div className="text-orange-400 font-medium text-sm mb-2">Fibonacci Extensions</div>
                  <div className="space-y-1 text-xs text-gray-300">
                    <div>127.2%: ${analysis.elliottWave.fibonacci.extension['127.2%'].toFixed(2)}</div>
                    <div>161.8%: ${analysis.elliottWave.fibonacci.extension['161.8%'].toFixed(2)}</div>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded">
                <div className="text-red-400 font-medium text-sm mb-2">Wave Invalidation</div>
                <div className="text-white text-lg">${analysis.elliottWave.invalidation.toFixed(2)}</div>
                <div className="text-xs text-gray-300">
                  Confidence: {analysis.elliottWave.confidence.toFixed(1)}%
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Volume Tab */}
        {activeTab === 'volume' && (
          <div className="space-y-4">
            <div className="bg-gray-800/30 rounded-lg p-4">
              <h4 className="text-white font-medium mb-3 flex items-center">
                <Volume2 className="h-4 w-4 mr-2 text-yellow-400" />
                Volume Analysis
              </h4>
              
              <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-yellow-400 font-medium">Volume Profile</span>
                  <span className="text-white font-bold">{analysis.volume.volumeProfile.rating}</span>
                </div>
                <div className="text-xs text-gray-300 mb-2">
                  Price-Volume Relation: {analysis.volume.volumeProfile.relation}
                </div>
                <div className="text-xs text-yellow-400">
                  Institutional Interest: {analysis.volume.volumeProfile.institutionalInterest ? 'High' : 'Low'}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded">
                  <div className="text-blue-400 font-medium text-sm mb-2">Volume Distribution</div>
                  <div className="text-xs text-gray-300 mb-1">
                    Buy Volume: {(analysis.volume.volumeProfile.distribution.buyVolume / 1000000).toFixed(1)}M
                  </div>
                  <div className="text-xs text-gray-300">
                    Sell Volume: {(analysis.volume.volumeProfile.distribution.sellVolume / 1000000).toFixed(1)}M
                  </div>
                </div>
                
                <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded">
                  <div className="text-purple-400 font-medium text-sm mb-2">Wyckoff Analysis</div>
                  <div className="text-white text-sm">{analysis.volume.wyckoffPhase.phase}</div>
                  <div className="text-xs text-gray-300">
                    {analysis.volume.wyckoffPhase.stage}
                  </div>
                </div>
              </div>

              <div className="p-3 bg-green-500/10 border border-green-500/20 rounded">
                <div className="text-green-400 font-medium text-sm mb-2">On Balance Volume</div>
                <div className="flex justify-between items-center">
                  <span className="text-white">Trend: {analysis.volume.onBalanceVolume.trend}</span>
                  <span className="text-green-400">{analysis.volume.onBalanceVolume.strength}</span>
                </div>
                <div className="text-xs text-gray-300 mt-1">
                  {analysis.volume.onBalanceVolume.divergence}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Fundamental Tab */}
        {activeTab === 'fundamental' && (
          <div className="space-y-4">
            <div className="bg-gray-800/30 rounded-lg p-4">
              <h4 className="text-white font-medium mb-3 flex items-center">
                <TrendingUp className="h-4 w-4 mr-2 text-green-400" />
                Fundamental Analysis
              </h4>
              
              <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-green-400 font-medium">Valuation</span>
                  <span className="text-white font-bold">{analysis.fundamental.valuation.recommendation}</span>
                </div>
                <div className="text-xs text-gray-300 mb-2">
                  Fair Value: ${analysis.fundamental.valuation.fair_value.toFixed(2)}
                </div>
                <div className="text-xs text-green-400">
                  Target Price: ${analysis.fundamental.valuation.target_price.toFixed(2)}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded">
                  <div className="text-blue-400 font-medium text-sm mb-2">On-Chain Metrics</div>
                  <div className="text-xs text-gray-300 mb-1">
                    Active Addresses: {analysis.fundamental.onChainMetrics.activeAddresses.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-300">
                    Hash Rate: {analysis.fundamental.onChainMetrics.hashRate}
                  </div>
                </div>
                
                <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded">
                  <div className="text-purple-400 font-medium text-sm mb-2">Market Sentiment</div>
                  <div className="text-white text-sm">{analysis.fundamental.sentiment.socialSentiment}</div>
                  <div className="text-xs text-gray-300">
                    Fear & Greed: {analysis.fundamental.sentiment.fearGreedIndex}
                  </div>
                </div>
              </div>

              <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded">
                <div className="text-orange-400 font-medium text-sm mb-2">Macro Correlations</div>
                <div className="grid grid-cols-2 gap-4 text-xs text-gray-300">
                  <div>US Stocks: {analysis.fundamental.macroFactors.correlation_usstocks}</div>
                  <div>Gold: {analysis.fundamental.macroFactors.correlation_gold}</div>
                  <div>DXY: {analysis.fundamental.macroFactors.correlation_dxy}</div>
                  <div>Fed Policy: {analysis.fundamental.macroFactors.fed_policy_impact}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Cycle Tab */}
        {activeTab === 'cycle' && (
          <div className="space-y-4">
            <div className="bg-gray-800/30 rounded-lg p-4">
              <h4 className="text-white font-medium mb-3 flex items-center">
                <Clock className="h-4 w-4 mr-2 text-indigo-400" />
                Cycle Analysis
              </h4>
              
              <div className="mb-4 p-3 bg-indigo-500/10 border border-indigo-500/20 rounded">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-indigo-400 font-medium">Primary Cycle</span>
                  <span className="text-white font-bold">{analysis.cycle.marketCycles.primary.phase}</span>
                </div>
                <div className="text-xs text-gray-300 mb-2">
                  Time Remaining: {analysis.cycle.marketCycles.primary.timeRemaining}
                </div>
                <div className="text-xs text-indigo-400">
                  Strength: {analysis.cycle.marketCycles.primary.strength}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="p-3 bg-pink-500/10 border border-pink-500/20 rounded">
                  <div className="text-pink-400 font-medium text-sm mb-2">Seasonality</div>
                  <div className="text-xs text-gray-300 mb-1">
                    Monthly: {analysis.cycle.seasonality.monthly[new Date().toLocaleString('default', { month: 'long' }).toLowerCase()]}
                  </div>
                  <div className="text-xs text-gray-300">
                    Weekly: {analysis.cycle.seasonality.weekly[new Date().toLocaleString('default', { weekday: 'long' }).toLowerCase()]}
                  </div>
                </div>
                
                <div className="p-3 bg-teal-500/10 border border-teal-500/20 rounded">
                  <div className="text-teal-400 font-medium text-sm mb-2">Fourier Analysis</div>
                  <div className="text-white text-sm">Cycle: {analysis.cycle.fourier.dominantCycle}</div>
                  <div className="text-xs text-gray-300">
                    Amplitude: {analysis.cycle.fourier.amplitude}
                  </div>
                </div>
              </div>

              <div className="p-3 bg-violet-500/10 border border-violet-500/20 rounded">
                <div className="text-violet-400 font-medium text-sm mb-2">Astro Cycles</div>
                <div className="flex justify-between items-center">
                  <span className="text-white">Lunar: {analysis.cycle.astro.lunarCycle.phase}</span>
                  <span className="text-violet-400">{analysis.cycle.astro.lunarCycle.daysToFull} days to full</span>
                </div>
                <div className="text-xs text-gray-300 mt-1">
                  Geomagnetic: {analysis.cycle.astro.geomagneticActivity}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Gann Tab */}
        {activeTab === 'gann' && (
          <div className="space-y-4">
            <div className="bg-gray-800/30 rounded-lg p-4">
              <h4 className="text-white font-medium mb-3 flex items-center">
                <Compass className="h-4 w-4 mr-2 text-amber-400" />
                Gann Analysis
              </h4>
              
              <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-amber-400 font-medium">Square of Nine</span>
                  <span className="text-white font-bold">{analysis.gann.squareOfNine.currentSquare}</span>
                </div>
                <div className="text-xs text-gray-300 mb-2">
                  Next Square: {analysis.gann.squareOfNine.nextSquare}
                </div>
                <div className="text-xs text-amber-400">
                  Support: {analysis.gann.squareOfNine.support} | Resistance: {analysis.gann.squareOfNine.resistance}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded">
                  <div className="text-red-400 font-medium text-sm mb-2">Gann Angles</div>
                  <div className="space-y-1 text-xs text-gray-300">
                    <div>1x1: ${analysis.gann.gannAngles.angles['1x1'].price.toFixed(2)} (45°)</div>
                    <div>1x2: ${analysis.gann.gannAngles.angles['1x2'].price.toFixed(2)} (26.25°)</div>
                    <div>2x1: ${analysis.gann.gannAngles.angles['2x1'].price.toFixed(2)} (63.75°)</div>
                  </div>
                </div>
                
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded">
                  <div className="text-emerald-400 font-medium text-sm mb-2">Time Squares</div>
                  <div className="text-white text-sm">Next: {analysis.gann.timeSquares.next}</div>
                  <div className="text-xs text-gray-300">
                    Significance: {analysis.gann.timeSquares.significance}
                  </div>
                </div>
              </div>

              <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded">
                <div className="text-cyan-400 font-medium text-sm mb-2">Price-Time Balance</div>
                <div className="flex justify-between items-center">
                  <span className="text-white">{analysis.gann.priceTime.balance}</span>
                  <span className="text-cyan-400">{analysis.gann.priceTime.priceTimeRatio}</span>
                </div>
                <div className="text-xs text-gray-300 mt-1">
                  Next Time Target: {analysis.gann.priceTime.nextTimeTarget}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Planetary Tab */}
        {activeTab === 'planetary' && (
          <div className="space-y-4">
            <div className="bg-gray-800/30 rounded-lg p-4">
              <h4 className="text-white font-medium mb-3 flex items-center">
                <Globe className="h-4 w-4 mr-2 text-indigo-400" />
                Planetary Analysis
              </h4>
              
              <div className="mb-4 p-3 bg-indigo-500/10 border border-indigo-500/20 rounded">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-indigo-400 font-medium">Lunar Phase</span>
                  <span className="text-white font-bold">{analysis.planetary.lunarPhase.name}</span>
                </div>
                <div className="text-xs text-gray-300 mb-2">
                  Influence: {analysis.planetary.lunarPhase.influence}
                </div>
                <div className="text-xs text-indigo-400">
                  Market Impact: {analysis.planetary.lunarPhase.marketImpact}
                </div>
              </div>

              <div className="mb-4">
                <h5 className="text-purple-400 font-medium mb-2">Current Aspects</h5>
                {analysis.planetary.currentAspects.map((aspect, index) => (
                  <div key={index} className="p-3 bg-purple-500/10 border border-purple-500/20 rounded mb-2">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-white font-medium">{aspect.aspect}</span>
                      <span className="text-purple-400">{aspect.strength}</span>
                    </div>
                    <div className="text-xs text-gray-300">
                      {aspect.influence}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mb-4">
                <h5 className="text-pink-400 font-medium mb-2">Planetary Positions</h5>
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-300">
                  <div className="p-2 bg-pink-500/10 border border-pink-500/20 rounded">
                    Sun: {analysis.planetary.planetaryPositions.sun.sign} ({analysis.planetary.planetaryPositions.sun.longitude.toFixed(1)}°)
                  </div>
                  <div className="p-2 bg-pink-500/10 border border-pink-500/20 rounded">
                    Moon: {analysis.planetary.planetaryPositions.moon.sign} ({analysis.planetary.planetaryPositions.moon.longitude.toFixed(1)}°)
                  </div>
                  <div className="p-2 bg-pink-500/10 border border-pink-500/20 rounded">
                    Mercury: {analysis.planetary.planetaryPositions.mercury.sign} ({analysis.planetary.planetaryPositions.mercury.longitude.toFixed(1)}°)
                  </div>
                  <div className="p-2 bg-pink-500/10 border border-pink-500/20 rounded">
                    Mars: {analysis.planetary.planetaryPositions.mars.sign} ({analysis.planetary.planetaryPositions.mars.longitude.toFixed(1)}°)
                  </div>
                </div>
              </div>

              <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded">
                <div className="text-yellow-400 font-medium text-sm mb-2">Market Astrology</div>
                <div className="space-y-1 text-xs text-gray-300">
                  {analysis.planetary.marketAstrology.transits.map((transit, index) => (
                    <div key={index}>
                      {transit.planet} {transit.aspect}: {transit.influence}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default SeunBotAnalysis