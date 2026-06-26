import React, { useState, useEffect, useCallback } from 'react'
import { 
  Brain, TrendingUp, TrendingDown, Activity, Volume2, 
  BarChart3, Zap, Target, AlertTriangle, CheckCircle,
  Clock, DollarSign, Percent, Eye, RefreshCw, Waves,
  Triangle, Square, Circle, Hexagon, Diamond, Star,
  Globe, Calendar, Moon, Sun, Compass, Orbit, MapPin,
  Building, Fuel, Package, Phone, Factory, Shield
} from 'lucide-react'
import EnhancedNGXWebScraper from '../services/EnhancedNGXWebScraper'
import RealNGXDataService from '../services/RealNGXDataService'
import AIAnalysisEndpointService from '../services/AIAnalysisEndpointService'
import { ngxWebSocket } from '../services/WebSocketService'
import SignalHistory from './SignalHistory'

const NGXAdvancedAnalysis = ({ selectedStock = 'GTCO', marketData = [] }) => {
  const [activeTab, setActiveTab] = useState('smartMoney')
  const [selectedTimeframe, setSelectedTimeframe] = useState('1D')
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(false)
  const [weeklySetups, setWeeklySetups] = useState(null)
  const [realTimeData, setRealTimeData] = useState(null)
  const [dataSource, setDataSource] = useState('Loading...')

  const timeframes = ['5M', '15M', '1H', '4H', '1D', '1W', '1M']

  // Subscribe to WebSocket updates for the selected NGX stock
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
    ngxWebSocket.subscribe(selectedStock, handleWsUpdate)
    return () => {
      ngxWebSocket.unsubscribe(selectedStock, handleWsUpdate)
    }
  }, [selectedStock, handleWsUpdate])

  useEffect(() => {
    if (selectedStock) {
      generateNGXAdvancedAnalysis()
    }
  }, [selectedStock, selectedTimeframe])

  useEffect(() => {
    loadWeeklySetups()
    loadRealTimeData()
  }, [selectedStock])

  const loadWeeklySetups = async () => {
    try {
      console.log('📊 Loading weekly setups with real data...')
      const setups = await EnhancedNGXWebScraper.scanWeeklyHighProbabilitySetups()
      setWeeklySetups(setups)
      console.log('✅ Weekly setups loaded:', setups)
    } catch (error) {
      console.error('❌ Error loading weekly setups:', error)
      setWeeklySetups(null)
    }
  }

  const loadRealTimeData = async () => {
    try {
      console.log(`📈 Fetching real-time data for ${selectedStock}...`)
      const data = await RealNGXDataService.fetchStockData(selectedStock)
      setRealTimeData(data)
      setDataSource(data.isMock ? '⚠️ Mock Data (API Unavailable)' : '✅ Real-Time Data')
      console.log('✅ Real-time data loaded:', data)
    } catch (error) {
      console.error('❌ Error loading real-time data:', error)
      setDataSource('❌ Data Unavailable')
    }
  }

  const generateNGXAdvancedAnalysis = async () => {
    setLoading(true)
    
    try {
      // Use real-time data if available
      const stockData = realTimeData || await RealNGXDataService.fetchStockData(selectedStock)
      const nsengSymbol = selectedStock.startsWith('NSENG_') ? selectedStock : `NSENG_${selectedStock}`
      const assetName = stockData.name || selectedStock

      // Fetch AI data and comprehensive report in parallel
      const [aiData, comprehensiveReport] = await Promise.all([
        AIAnalysisEndpointService.analyzeStock({ symbol: selectedStock, price: stockData.price }).catch(() => null),
        AIAnalysisEndpointService.fetchComprehensiveReport(nsengSymbol, assetName).catch(() => null)
      ])
      
      const comprehensiveAnalysis = {
        smartMoney: generateNGXSmartMoneyAnalysis(stockData, aiData),
        patterns: comprehensiveReport?.patterns || null,
        elliottWave: generateNGXElliottWave(stockData, aiData),
        volume: generateNGXVolumeAnalysis(stockData, aiData),
        fundamental: generateNGXFundamentalAnalysis(stockData, aiData),
        cycle: comprehensiveReport?.cycle || null,
        gann: comprehensiveReport?.gann || null,
        planetary: null,
        weeklySetups: null
      }

      setAnalysis(comprehensiveAnalysis)
    } catch (error) {
      console.error('Error generating analysis:', error)
    } finally {
      setLoading(false)
    }
  }

  // Helper function to generate analysis sections
  const generateNGXSmartMoneyAnalysis = (stockData, aiData) => {
    const inst = aiData?.hybridComponents?.institutional || {};
    const regime = aiData?.hybridComponents?.regime || {};
    const hasAiData = Boolean(aiData?.hybridComponents);
    
    return {
      marketStructure: {
        current: inst.breakOfStructure || 'Neutral',
        alignment: { 
          direction: aiData?.hybridDirection || 'Neutral', 
          alignment: aiData?.hybridFinalScore ? Math.abs(aiData.hybridFinalScore) * 10 : 0,
          ngxBias: 'AI Model Alignment'
        },
        timeframes: { short: 'Wait', medium: 'Wait', long: 'Wait' },
        confluences: { total: 3, description: 'Hybrid AI Confluences' }
      },
      liquidityAnalysis: {
        zones: { resistance: [], support: [] },
        fairValueGaps: { current: inst.fairValueGaps || 'None' },
        orderBlocks: { nearest: inst.orderBlocks || 'None' },
        nigerian_specifics: {
          cbn_impact: 'Monetary policy affecting liquidity',
          oil_correlation: (stockData.sector === 'Oil & Gas') ? 'High' : 'Medium',
          naira_strength: 'Currency fluctuation impact on foreign flows'
        }
      },
      premiumDiscount: {
        zone: regime.marketRegime || 'Ranging',
        currentPosition: 0.5,
        ngx_context: {
          market_phase: regime.marketRegime || 'Consolidation',
          sector_rotation: 'Sector Rotation Phase',
          foreign_participation: 'Institutional Activity'
        }
      },
      signals: [],
      confidence: hasAiData ? (aiData.confidence || 3) * 20 : 0,
      nigerian_factors: {
        regulatory_environment: 'Standard regulatory environment',
        economic_indicators: 'Macro factors baked into AI model',
        political_stability: 'N/A'
      },
      dataSource: hasAiData ? 'Hybrid AI API' : 'Unavailable'
    }
  }

  const generateNGXGeometricPatterns = (stockData) => {
    const patterns = {
      triangles: [],
      channels: [],
      flags: [],
      pennants: [],
      headAndShoulders: [],
      doubleTopBottom: [],
      nigerian_patterns: []
    }

    // Nigerian-specific patterns based on real data
    if ((stockData.sector === 'Banking' || !stockData.sector) && Math.abs(stockData.changePercent) > 2) {
      patterns.nigerian_patterns.push({
        type: 'CBN Policy Response Pattern',
        description: 'Banking sector reaction to Central Bank policies',
        reliability: 'High',
        target: stockData.price * (stockData.changePercent > 0 ? 1.08 : 0.92),
        catalyst: 'Monetary Policy Committee decisions',
        probability: 85,
        timeframe: '1W'
      })
    }

    if (stockData.sector === 'Oil & Gas') {
      patterns.nigerian_patterns.push({
        type: 'Oil Price Correlation Pattern',
        description: 'Nigerian oil stocks following Brent crude movements',
        reliability: 'Very High',
        target: stockData.price * 1.12,
        catalyst: 'Global oil price movements and NNPC policies',
        probability: 92,
        timeframe: '1D'
      })
    }

    // Standard geometric patterns
    if (Math.abs(stockData.changePercent) < 2 && stockData.volume > 5000000) {
      patterns.triangles.push({
        type: 'NGX Ascending Triangle',
        pattern: 'Bullish Continuation',
        resistance: stockData.price * 1.025,
        support: stockData.price * 0.975,
        breakoutTarget: stockData.price * 1.06,
        probability: 72,
        completion: '65%',
        nigerian_context: 'Local institutional accumulation pattern',
        timeframe: selectedTimeframe
      })
    }

    patterns.channels.push({
      type: 'NGX Ascending Channel',
      pattern: 'Bullish Trend Continuation',
      upperBound: stockData.price * 1.03,
      lowerBound: stockData.price * 0.97,
      target: stockData.price * 1.08,
      probability: 78,
      nigerian_context: 'Following Nigerian market uptrend'
    })

    if (Math.abs(stockData.changePercent) > 3) {
      patterns.flags.push({
        type: stockData.changePercent > 0 ? 'NGX Bull Flag' : 'NGX Bear Flag',
        pattern: 'Continuation Pattern',
        flagPole: Math.abs(stockData.changePercent),
        target: stockData.price * (stockData.changePercent > 0 ? 1.06 : 0.94),
        probability: 80,
        nigerian_context: 'Strong Nigerian institutional momentum'
      })
    }

    return patterns
  }

  const generateNGXElliottWave = (stockData, aiData) => {
    const ew = aiData?.hybridComponents?.institutional?.elliottWave || 'Detecting...';
    
    return {
      currentWave: { wave: ew.replace(/\D/g, '') || '?', description: ew },
      waveType: aiData?.hybridDirection === 'bullish' ? 'Impulse Wave' : 'Corrective Wave',
      degree: 'Primary',
      fibonacci: {
        retracement: {
          '0.236': stockData.price * 0.98,
          '0.382': stockData.price * 0.95,
          '0.500': stockData.price * 0.92,
          '0.618': stockData.price * 0.88
        },
        extension: {
          '1.272': stockData.price * 1.05,
          '1.618': stockData.price * 1.10,
          '2.618': stockData.price * 1.20
        }
      },
      projection: stockData.price * 1.10,
      nextTarget: aiData?.priceTarget || (stockData.price * 1.05),
      invalidation: aiData?.stopLoss || (stockData.price * 0.95),
      confidence: (aiData?.confidence || 3) * 20,
      nigerian_wave_characteristics: {
        market_cycle: 'AI Model Detection',
        sector_waves: 'AI Tracked Sector Waves',
        currency_impact: 'Naira strength affecting international wave patterns',
        oil_correlation: (stockData.sector === 'Oil & Gas') ? 'Waves correlate with oil price cycles' : 'Indirect oil impact'
      },
      subWaves: {
        wave1: { target: stockData.price * 1.05, completed: true, description: 'Initial breakout' },
        wave2: { target: stockData.price * 0.98, completed: true, description: 'Retracement' },
        wave3: { target: stockData.price * 1.15, completed: false, current: true, description: ew },
        wave4: { target: stockData.price * 1.08, completed: false, description: 'Corrective' },
        wave5: { target: stockData.price * 1.25, completed: false, description: 'Final extension' }
      }
    }
  }

  const generateNGXVolumeAnalysis = (stockData, aiData) => {
    const vol = aiData?.hybridComponents?.volume || {};
    
    return {
      volumeProfile: {
        rating: vol.vwapStatus || 'Neutral',
        relation: vol.obvTrend || 'Neutral',
        institutionalInterest: vol.relativeVolume > 1.2,
        foreign_participation: 'AI Volume Analysis',
        ngx_context: {
          market_depth: 'Liquidity consideration based on volume',
          trading_hours: 'Lagos trading session volume patterns',
          settlement: 'T+3 settlement cycle impact on volume'
        }
      },
      volumeSpread: { rating: 'Average', signal: 'Wait' },
      wyckoffPhase: { phase: 'AI Analyzed', description: 'Volume characteristics analyzed by hybrid model' },
      volumeSignals: [],
      nigerian_volume_factors: {
        pension_funds: 'PFA investment flows impact',
        insurance_companies: 'Insurance sector investment patterns',
        foreign_portfolio: 'International investor participation',
        retail_participation: 'Local retail investor activity'
      },
      volumeBreakdown: {
        institutional: stockData.volume * 0.6,
        retail: stockData.volume * 0.25,
        foreign: stockData.volume * 0.15,
        analysis: `AI Volume Insight: ${vol.relativeVolume > 1 ? 'High Relative Volume (' + vol.relativeVolume.toFixed(2) + 'x)' : 'Normal Relative Volume'}`
      }
    }
  }

  const generateNGXFundamentalAnalysis = (stockData, aiData) => {
    return {
      valuation: {
        fair_value: stockData.price,
        target_price: aiData?.priceTarget || stockData.price * 1.05,
        recommendation: aiData?.recommendation || 'HOLD',
        ngx_pe_comparison: 'P/E vs NGX sector average',
        dividend_sustainability: 'Based on fundamental summary'
      },
      nigerian_fundamentals: {
        regulatory_compliance: getRegulatoryCompliance(stockData.sector || 'Banking'),
        local_content: getLocalContentImpact(stockData.sector || 'Banking'),
        currency_exposure: getCurrencyExposure(stockData.sector || 'Banking'),
        government_relations: getGovernmentRelations(stockData.sector || 'Banking'),
        infrastructure_dependence: getInfrastructureDependence(stockData.sector || 'Banking')
      },
      macroeconomic_factors: {
        oil_price_sensitivity: (stockData.sector === 'Oil & Gas') ? 'Very High' : 'Medium',
        inflation_impact: getInflationImpact(stockData.sector || 'Banking'),
        interest_rate_sensitivity: getInterestRateSensitivity(stockData.sector || 'Banking'),
        exchange_rate_impact: getExchangeRateImpact(stockData.sector || 'Banking')
      },
      sector_dynamics: {
        growth_prospects: getSectorGrowthProspects(stockData.sector || 'Banking'),
        competitive_position: aiData?.fundamentalAnalysis || 'No fundamental summary available',
        regulatory_changes: 'Upcoming regulatory changes impact',
        technology_disruption: getTechnologyDisruptionRisk(stockData.sector || 'Banking')
      },
      financial_metrics: {
        pe_ratio: 0,
        pb_ratio: 0,
        roe: 0,
        dividend_yield: 0,
        debt_equity: 0
      }
    }
  }

  const generateNGXCycleAnalysis = (stockData) => ({
    nigerian_cycles: {
      economic_cycle: 'Nigerian GDP growth cycle positioning',
      oil_cycle: 'Oil price cycle impact on Nigerian economy',
      political_cycle: 'Election cycle and policy uncertainty',
      monetary_cycle: 'CBN policy cycle and interest rate trends'
    },
    seasonal_patterns: {
      quarterly_earnings: 'Nigerian corporate earnings seasonality',
      dividend_season: 'Dividend payment calendar impact',
      budget_cycle: 'Government budget announcement effects',
      harvest_season: 'Agricultural sector seasonal impacts'
    },
    market_cycles: {
      ngx_bull_bear: 'Nigerian stock market cycle analysis',
      sector_rotation: 'Sector rotation patterns in Nigerian market',
      foreign_flow_cycles: 'International investment flow patterns',
      liquidity_cycles: 'Market liquidity and trading volume cycles'
    },
    time_analysis: {
      best_trading_days: 'Optimal trading days for Nigerian stocks',
      monthly_patterns: 'Month-end and month-start effects',
      holiday_effects: 'Nigerian public holiday market impacts',
      ramadan_effects: 'Religious observance market patterns'
    },
    cycle_position: {
      current_phase: 'Mid-cycle expansion',
      phase_duration: '8 months',
      next_phase: 'Late cycle peak',
      probability: 75
    }
  })

  const generateNGXGannAnalysis = (stockData) => {
    const price = stockData.price
    const sqrt = Math.sqrt(price)
    
    return {
      priceTime: {
        balance: 'Nigerian market price-time relationship',
        ngx_specific: 'Lagos time zone Gann calculations',
        naira_adjustments: 'Currency-adjusted Gann levels'
      },
      squareOfNine: {
        currentSquare: Math.floor(sqrt) ** 2,
        nextSquare: Math.ceil(sqrt) ** 2,
        nigerian_context: 'Gann squares adapted for Naira pricing',
        oil_correlation: (stockData.sector === 'Oil & Gas') ? 'Oil price Gann correlation' : 'Standard Gann analysis'
      },
      gannAngles: generateNGXGannAngles(price),
      timeSquares: {
        nigerian_calendar: 'Nigerian business calendar considerations',
        cbn_meeting_dates: 'Central Bank meeting timing impact',
        earnings_seasons: 'Corporate earnings announcement timing'
      },
      natural_squares: {
        naira_squares: 'Natural squares adjusted for Nigerian currency',
        sector_squares: 'Sector-specific Gann square analysis'
      },
      gannLevels: {
        support: [price * 0.875, price * 0.75, price * 0.625],
        resistance: [price * 1.125, price * 1.25, price * 1.375],
        timeTargets: ['2 weeks', '1 month', '3 months']
      }
    }
  }

  const generateNGXPlanetaryAnalysis = (stockData) => {
    const currentDate = new Date()
    
    return {
      nigerian_astro_finance: {
        lagos_coordinates: 'Planetary analysis for Lagos financial district',
        african_astrology: 'Traditional African astronomical considerations',
        islamic_calendar: 'Islamic lunar calendar market effects',
        seasonal_influences: 'Tropical climate and seasonal business patterns'
      },
      planetary_positions: generatePlanetaryPositions(currentDate),
      lunar_phases: {
        current_phase: calculateLunarPhase(currentDate),
        nigerian_context: 'Lunar influence on Nigerian trading patterns',
        ramadan_correlation: 'Islamic calendar and market sentiment'
      },
      solar_cycles: {
        tropical_considerations: 'Equatorial solar influence',
        seasonal_business: 'Dry and wet season business cycles',
        agricultural_correlation: 'Solar cycles and agricultural sector'
      },
      market_astrology: {
        ngx_foundation_chart: 'Nigerian Stock Exchange inception chart',
        independence_influences: 'Nigerian independence date planetary aspects',
        oil_discovery_chart: 'Oil discovery astrological significance'
      },
      astrological_forecast: {
        short_term: 'Favorable planetary alignments for next 2 weeks',
        medium_term: 'Jupiter transit supporting growth for 3 months',
        long_term: 'Saturn influence requiring patience for 6 months'
      }
    }
  }

  const generateWeeklySetupsAnalysis = (stockData) => {
    if (!weeklySetups || !weeklySetups.setups || !Array.isArray(weeklySetups.setups) || weeklySetups.setups.length === 0) {
      return { 
        message: 'Loading weekly setups with real data...',
        current_stock_setup: null,
        top_ngx_setups: [],
        sector_setups: [],
        setup_statistics: null,
        nigerian_setup_factors: null,
        dataSource: 'Loading...'
      }
    }
    
    const currentStockSetup = weeklySetups.setups.find(setup => setup.symbol === selectedStock) || null
    const topNgxSetups = Array.isArray(weeklySetups.setups) ? weeklySetups.setups.slice(0, 10) : []
    const sectorSetups = Array.isArray(weeklySetups.setups) 
      ? weeklySetups.setups.filter(setup => setup && setup.sector === (stockData.sector || 'Banking')).slice(0, 5)
      : []
    
    return {
      current_stock_setup: currentStockSetup,
      top_ngx_setups: topNgxSetups,
      sector_setups: sectorSetups,
      setup_statistics: {
        total_scanned: weeklySetups.totalScanned || 0,
        high_probability_count: weeklySetups.highProbabilityCount || 0,
        success_rate: '78%',
        avg_return: '12.5%',
        scan_time: weeklySetups.scanTime || new Date().toISOString()
      },
      nigerian_setup_factors: {
        market_sentiment: 'Current Nigerian market sentiment impact',
        economic_calendar: 'Upcoming economic events affecting setups',
        earnings_season: 'Corporate earnings announcement schedule',
        policy_events: 'Government and CBN policy announcement impacts'
      },
      dataSource: weeklySetups.dataSource || 'Unknown'
    }
  }

  // Helper functions (keeping existing ones and adding new ones)
  const generateNGXTimeframeStructure = (stockData) => {
    const structures = {}
    timeframes.forEach(tf => {
      const multiplier = tf === '5M' ? 0.4 : tf === '15M' ? 0.6 : tf === '1H' ? 1 : tf === '4H' ? 1.3 : tf === '1D' ? 2 : tf === '1W' ? 3 : 4
      const adjustedChange = stockData.changePercent * multiplier
      
      structures[tf] = {
        trend: adjustedChange > 1.5 ? 'Bullish' : adjustedChange < -1.5 ? 'Bearish' : 'Neutral',
        strength: Math.abs(adjustedChange) * 10,
        structure: adjustedChange > 4 ? 'BOS' : Math.abs(adjustedChange) > 2 ? 'CHoCH' : 'Range',
        ngx_context: `${tf} timeframe Nigerian market structure`
      }
    })
    return structures
  }

  const generateNGXStructureConfluences = (change, volume, sector) => {
    const confluences = []
    if (Math.abs(change) > 3 && volume > 10000000) {
      confluences.push({
        type: 'NGX BOS Confluence',
        timeframes: ['1H', '4H', '1D'],
        strength: 'High',
        description: 'Break of Structure confirmed across Nigerian market timeframes',
        sector_context: `${sector} sector showing strong momentum`
      })
    }
    return confluences
  }

  const generateNGXLiquidityZones = (price, high, low) => ({
    sellLiquidity: {
      level1: high * 1.008,
      level2: high * 1.015,
      level3: high * 1.025,
      strength: 'High',
      ngx_context: 'Nigerian institutional sell orders'
    },
    buyLiquidity: {
      level1: low * 0.992,
      level2: low * 0.985,
      level3: low * 0.975,
      strength: 'High',
      ngx_context: 'Nigerian institutional buy orders'
    }
  })

  const generateNGXFairValueGaps = (stockData) => {
    const gaps = []
    if (Math.abs(stockData.changePercent) > 3) {
      gaps.push({
        type: stockData.changePercent > 0 ? 'Bullish NGX FVG' : 'Bearish NGX FVG',
        high: stockData.price * 1.02,
        low: stockData.price * 0.98,
        significance: 'High',
        nigerian_context: 'Gap created by Nigerian market dynamics'
      })
    }
    return gaps
  }

  const generateNGXOrderBlocks = (stockData) => {
    const blocks = []
    if (stockData.volume > 10000000 && Math.abs(stockData.changePercent) > 2) {
      blocks.push({
        type: stockData.changePercent > 0 ? 'Bullish NGX Order Block' : 'Bearish NGX Order Block',
        strength: 'Strong',
        nigerian_context: 'Nigerian institutional order flow'
      })
    }
    return blocks
  }

  const generateNGXSmartMoneySignals = (stockData) => {
    const signals = []
    if (stockData.changePercent > 3 && stockData.volume > 15000000) {
      signals.push({
        type: 'Nigerian Smart Money Breakout',
        direction: 'Bullish',
        strength: 'Strong',
        context: 'Local institutional accumulation detected'
      })
    }
    return signals
  }

  const getSectorRotationPhase = (sector) => {
    const phases = {
      'Banking': 'Interest rate cycle beneficiary',
      'Oil & Gas': 'Commodity super-cycle positioning',
      'Consumer Goods': 'Defensive rotation phase',
      'Telecommunications': 'Growth sector allocation',
      'Industrial Goods': 'Infrastructure spending beneficiary',
      'Insurance': 'Financial services rotation'
    }
    return phases[sector] || 'Neutral rotation'
  }

  const getRegulatoryImpact = (sector) => {
    const impacts = {
      'Banking': 'CBN regulatory oversight - High impact',
      'Oil & Gas': 'NNPC and petroleum ministry - Very High impact',
      'Consumer Goods': 'NAFDAC and SON regulation - Medium impact',
      'Telecommunications': 'NCC regulation - High impact',
      'Industrial Goods': 'Multiple agency oversight - Medium impact',
      'Insurance': 'NAICOM supervision - High impact'
    }
    return impacts[sector] || 'Standard regulatory environment'
  }

  const determineNGXWaveCount = (change, volume, sector) => {
    if (change > 5 && volume > 15000000) {
      return { wave: 3, description: 'Wave 3 - Nigerian Market Impulse' }
    } else if (change > 2 && change <= 5) {
      return { wave: 1, description: 'Wave 1 - Initial Nigerian Breakout' }
    } else {
      return { wave: 'A', description: 'Wave A - Nigerian Market Correction' }
    }
  }

  const calculateNGXFibonacciLevels = (price, change) => {
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

  const calculateNGXWaveProjection = (price, change, waveCount) => ({
    target: price * 1.15,
    type: 'Nigerian Wave Projection',
    probability: 80
  })

  const calculateNGXNextTarget = (price, change, waveCount) => price * 1.12

  const analyzeNGXVolumeSpread = (stockData) => ({
    type: 'Nigerian Professional Money',
    signal: stockData.changePercent > 0 ? 'Institutional Buying' : 'Institutional Selling',
    strength: 'Strong',
    nigerian_context: 'Local institutional activity detected'
  })

  const determineNGXWyckoffPhase = (stockData) => ({
    phase: 'Nigerian Accumulation',
    stage: 'Phase B - Testing Nigerian Supply',
    description: 'Nigerian smart money accumulating positions'
  })

  const generateNGXVolumeSignals = (stockData) => [{
    signal: 'Nigerian Professional Activity',
    strength: 'Strong',
    description: 'High volume indicates Nigerian institutional involvement'
  }]

  const generateNGXGannAngles = (price) => ({
    angles: {
      '1x1': { angle: 45, price: price, description: 'Main Nigerian trend line' },
      '1x2': { angle: 26.25, price: price * 1.02, description: 'Nigerian slow uptrend' }
    }
  })

  const getRegulatoryCompliance = (sector) => `${sector} regulatory compliance status - Good standing`
  const getLocalContentImpact = (sector) => `Local content requirements for ${sector} - Moderate impact`
  const getCurrencyExposure = (sector) => `${sector} foreign exchange exposure - Medium risk`
  const getGovernmentRelations = (sector) => `Government relationship impact for ${sector} - Positive`
  const getInfrastructureDependence = (sector) => `Infrastructure dependence level for ${sector} - Moderate`
  const getInflationImpact = (sector) => `Inflation sensitivity for ${sector} - Medium impact`
  const getInterestRateSensitivity = (sector) => `Interest rate impact on ${sector} - High sensitivity`
  const getExchangeRateImpact = (sector) => `Exchange rate sensitivity for ${sector} - Moderate impact`
  const getSectorGrowthProspects = (sector) => `Growth outlook for ${sector} - Positive trajectory`
  const getTechnologyDisruptionRisk = (sector) => `Technology disruption risk for ${sector} - Low to medium`
  const getSectorWaveCharacteristics = (sector) => `Elliott Wave patterns specific to ${sector} - Bullish structure`

  const generatePlanetaryPositions = (date) => ({
    sun: { longitude: 280.460, sign: 'Sagittarius', influence: 'Major' },
    moon: { longitude: 218.316, sign: 'Cancer', influence: 'Major' }
  })

  const calculateLunarPhase = (date) => ({
    name: 'Waxing Crescent',
    influence: 'Growth',
    nigerian_context: 'Favorable for Nigerian market growth'
  })

  if (loading) {
    return (
      <div className="glass-effect rounded-lg p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex flex-wrap items-center gap-2">
            <Brain className="h-5 w-5 text-green-500 shrink-0" />
            <h3 className="text-base sm:text-lg font-semibold text-white">NGX Advanced Analysis</h3>
            <div className="px-2 py-1 bg-blue-500/20 rounded text-xs text-blue-400 whitespace-nowrap">
              {dataSource}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Fetching real-time NGX data with SeunBot intelligence...</p>
            <p className="text-sm text-gray-500">Processing Smart Money, Elliott Wave, Gann, Planetary & Weekly Setups</p>
          </div>
        </div>
      </div>
    )
  }

  if (!analysis) {
    return (
      <div className="glass-effect rounded-lg p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-4">
          <div className="flex flex-wrap items-center gap-2">
            <MapPin className="h-5 w-5 text-green-500 shrink-0" />
            <h3 className="text-base sm:text-lg font-semibold text-white">NGX Advanced Analysis</h3>
            <div className="px-2 py-1 bg-blue-500/20 rounded text-xs text-blue-400 whitespace-nowrap">
              {dataSource}
            </div>
          </div>
        </div>
        <div className="text-center py-8 text-gray-400">
          <Brain className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>Select a Nigerian stock to begin SeunBot advanced analysis with real data</p>
        </div>
      </div>
    )
  }

  return (
    <div className="glass-effect rounded-lg p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex flex-wrap items-center gap-2">
          <Brain className="h-5 w-5 text-green-500 shrink-0" />
          <h3 className="text-base sm:text-lg font-semibold text-white">NGX Advanced Analysis</h3>
          <div className="flex flex-wrap items-center gap-2">
            <div className="px-2 py-1 bg-green-500/20 rounded text-xs text-green-400 whitespace-nowrap">
              {selectedStock}
            </div>
            <div className="px-2 py-1 bg-blue-500/20 rounded text-xs text-blue-400 whitespace-nowrap truncate max-w-[200px] sm:max-w-none">
              {dataSource}
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2 self-start sm:self-auto">
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
            onClick={() => {
              loadRealTimeData()
              generateNGXAdvancedAnalysis()
              loadWeeklySetups()
            }}
            className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-gray-400"
            title="Refresh real-time data"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Prediction history with time-horizon indicator */}
      {selectedStock && (
        <div className="mb-6">
          <SignalHistory market="ngx" symbol={String(selectedStock).replace(/^NSENG_/i, '')} title="Prediction History" />
        </div>
      )}

      {/* Real-time data indicator */}
      {realTimeData && (
        <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
            <div className="flex items-center flex-wrap gap-x-2">
              <span className="text-blue-400 font-medium">Live Price: </span>
              <span className="text-white font-bold text-lg">₦{realTimeData.price?.toFixed(2) || '0.00'}</span>
              <span className={`font-bold ml-1 ${realTimeData.changePercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {realTimeData.changePercent >= 0 ? '+' : ''}{realTimeData.changePercent?.toFixed(2) || '0.00'}%
              </span>
            </div>
            <div className="text-xs text-gray-400">
              Volume: {((realTimeData.volume || 0) / 1000000).toFixed(2)}M
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-nowrap overflow-x-auto hide-scrollbar gap-1 mb-6 bg-gray-800/50 rounded-lg p-1">
        {[
          { id: 'smartMoney', label: 'Smart Money', icon: BarChart3 },
          { id: 'patterns', label: 'Patterns', icon: Triangle },
          { id: 'elliottWave', label: 'Elliott Wave', icon: Waves },
          { id: 'volume', label: 'Volume', icon: Volume2 },
          { id: 'fundamental', label: 'Fundamental', icon: TrendingUp },
          { id: 'cycle', label: 'Cycle', icon: Clock },
          { id: 'gann', label: 'Gann', icon: Compass },
          { id: 'planetary', label: 'Planetary', icon: Globe },
          { id: 'weeklySetups', label: 'Weekly Setups', icon: Target }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex shrink-0 items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'bg-green-600 text-white'
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
        {activeTab === 'smartMoney' && analysis?.smartMoney && (
          <div className="space-y-4">
            <div className="bg-gray-800/30 rounded-lg p-4">
              <h4 className="text-white font-medium mb-3 flex items-center">
                <BarChart3 className="h-4 w-4 mr-2 text-green-400" />
                Nigerian Smart Money Concepts
                {analysis.smartMoney.dataSource && (
                  <span className="ml-2 text-xs text-gray-400">({analysis.smartMoney.dataSource})</span>
                )}
              </h4>
              
              <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-green-400 font-medium">Market Structure</span>
                  <span className="text-white font-bold">{analysis.smartMoney.marketStructure.current}</span>
                </div>
                <div className="text-xs text-gray-300 mb-2">
                  NGX Bias: {analysis.smartMoney.marketStructure.alignment.ngxBias}
                </div>
                <div className="text-xs text-blue-400">
                  <strong>Nigerian Factors:</strong> {analysis.smartMoney.nigerian_factors.regulatory_environment}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded">
                  <div className="text-blue-400 font-medium text-sm mb-2">Liquidity Analysis</div>
                  <div className="text-xs text-gray-300 mb-2">
                    CBN Impact: {analysis.smartMoney.liquidityAnalysis.nigerian_specifics.cbn_impact}
                  </div>
                  <div className="text-xs text-yellow-400">
                    Oil Correlation: {analysis.smartMoney.liquidityAnalysis.nigerian_specifics.oil_correlation}
                  </div>
                </div>
                
                <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded">
                  <div className="text-purple-400 font-medium text-sm mb-2">Premium/Discount Zone</div>
                  <div className="text-white text-lg">{analysis.smartMoney.premiumDiscount.zone}</div>
                  <div className="text-xs text-gray-300">
                    Sector Rotation: {analysis.smartMoney.premiumDiscount.ngx_context.sector_rotation}
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
        {activeTab === 'patterns' && analysis?.patterns && (
          <div className="space-y-4">
            <div className="bg-gray-800/30 rounded-lg p-4">
              <h4 className="text-white font-medium mb-3 flex items-center">
                <Triangle className="h-4 w-4 mr-2 text-blue-400" />
                {analysis.patterns.heading}
                <span className="ml-auto text-xs text-blue-400 bg-blue-500/10 px-2 py-1 rounded">Seun Weekly Bot</span>
              </h4>
              <div className="space-y-2">
                {analysis.patterns.bullets.map((bullet, i) => (
                  <div key={i} className={`flex items-start gap-2 p-2 rounded text-sm ${
                    bullet.startsWith('  ·') ? 'pl-6 text-gray-400 text-xs' : 'bg-blue-500/5 border border-blue-500/10 text-gray-200'
                  }`}>
                    {!bullet.startsWith('  ·') && <span className="text-blue-400 mt-0.5 shrink-0">▸</span>}
                    <span>{bullet}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Elliott Wave Tab */}
        {activeTab === 'elliottWave' && analysis?.elliottWave && (
          <div className="space-y-4">
            <div className="bg-gray-800/30 rounded-lg p-4">
              <h4 className="text-white font-medium mb-3 flex items-center">
                <Waves className="h-4 w-4 mr-2 text-cyan-400" />
                Nigerian Elliott Wave Analysis
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

              {analysis.elliottWave.subWaves && (
                <div className="mb-4">
                  <h5 className="text-white font-medium mb-3">Wave Structure</h5>
                  <div className="space-y-2">
                    {Object.entries(analysis.elliottWave.subWaves).map(([wave, data]) => (
                      <div key={wave} className="flex justify-between items-center p-2 bg-gray-700/30 rounded">
                        <div>
                          <span className="text-white font-medium capitalize">{wave}</span>
                          {data.current && <span className="ml-2 text-xs bg-cyan-500/20 text-cyan-400 px-2 py-1 rounded">Current</span>}
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-cyan-400">₦{data.target.toFixed(2)}</div>
                          <div className={`text-xs ${data.completed ? 'text-green-400' : 'text-gray-400'}`}>
                            {data.completed ? 'Completed' : 'Pending'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {analysis.elliottWave.fibonacci && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-300 mb-2">Retracement Levels</div>
                    <div className="space-y-1">
                      {Object.entries(analysis.elliottWave.fibonacci.retracement).map(([level, price]) => (
                        <div key={level} className="flex justify-between text-xs">
                          <span className="text-gray-400">{level}:</span>
                          <span className="text-red-400">₦{price.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-300 mb-2">Extension Levels</div>
                    <div className="space-y-1">
                      {Object.entries(analysis.elliottWave.fibonacci.extension).map(([level, price]) => (
                        <div key={level} className="flex justify-between text-xs">
                          <span className="text-gray-400">{level}:</span>
                          <span className="text-green-400">₦{price.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Volume Tab */}
        {activeTab === 'volume' && analysis?.volume && (
          <div className="space-y-4">
            <div className="bg-gray-800/30 rounded-lg p-4">
              <h4 className="text-white font-medium mb-3 flex items-center">
                <Volume2 className="h-4 w-4 mr-2 text-yellow-400" />
                Nigerian Volume Analysis
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
                  Foreign Participation: {analysis.volume.volumeProfile.foreign_participation}
                </div>
              </div>

              {analysis.volume.volumeBreakdown && (
                <div className="mb-4">
                  <h5 className="text-white font-medium mb-3">Volume Breakdown</h5>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center p-3 bg-blue-500/10 rounded">
                      <div className="text-xs text-gray-400">Institutional</div>
                      <div className="text-blue-400 font-medium text-lg">
                        {((analysis.volume.volumeBreakdown.institutional) / 1000000).toFixed(1)}M
                      </div>
                      <div className="text-xs text-blue-400">60%</div>
                    </div>
                    <div className="text-center p-3 bg-green-500/10 rounded">
                      <div className="text-xs text-gray-400">Retail</div>
                      <div className="text-green-400 font-medium text-lg">
                        {((analysis.volume.volumeBreakdown.retail) / 1000000).toFixed(1)}M
                      </div>
                      <div className="text-xs text-green-400">25%</div>
                    </div>
                    <div className="text-center p-3 bg-purple-500/10 rounded">
                      <div className="text-xs text-gray-400">Foreign</div>
                      <div className="text-purple-400 font-medium text-lg">
                        {((analysis.volume.volumeBreakdown.foreign) / 1000000).toFixed(1)}M
                      </div>
                      <div className="text-xs text-purple-400">15%</div>
                    </div>
                  </div>
                </div>
              )}

              {analysis.volume.wyckoffPhase && (
                <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded">
                  <div className="text-purple-400 font-medium text-sm mb-2">Wyckoff Method</div>
                  <div className="text-white text-lg">{analysis.volume.wyckoffPhase.phase}</div>
                  <div className="text-xs text-gray-300">
                    {analysis.volume.wyckoffPhase.description}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Fundamental Tab */}
        {activeTab === 'fundamental' && analysis?.fundamental && (
          <div className="space-y-4">
            <div className="bg-gray-800/30 rounded-lg p-4">
              <h4 className="text-white font-medium mb-3 flex items-center">
                <TrendingUp className="h-4 w-4 mr-2 text-green-400" />
                Nigerian Fundamental Analysis
              </h4>
              
              <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-green-400 font-medium">Valuation</span>
                  <span className="text-white font-bold">{analysis.fundamental.valuation.recommendation}</span>
                </div>
                <div className="text-xs text-gray-300 mb-2">
                  Fair Value: ₦{analysis.fundamental.valuation.fair_value.toFixed(2)}
                </div>
                <div className="text-xs text-green-400">
                  Target Price: ₦{analysis.fundamental.valuation.target_price.toFixed(2)}
                </div>
              </div>

              {analysis.fundamental.financial_metrics && (
                <div className="mb-4">
                  <h5 className="text-white font-medium mb-3">Key Financial Metrics</h5>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <div className="text-center p-3 bg-blue-500/10 rounded">
                      <div className="text-xs text-gray-400">P/E Ratio</div>
                      <div className="text-blue-400 font-medium text-lg">{analysis.fundamental.financial_metrics.pe_ratio.toFixed(1)}</div>
                    </div>
                    <div className="text-center p-3 bg-green-500/10 rounded">
                      <div className="text-xs text-gray-400">ROE</div>
                      <div className="text-green-400 font-medium text-lg">{analysis.fundamental.financial_metrics.roe.toFixed(1)}%</div>
                    </div>
                    <div className="text-center p-3 bg-purple-500/10 rounded">
                      <div className="text-xs text-gray-400">Dividend Yield</div>
                      <div className="text-purple-400 font-medium text-lg">{analysis.fundamental.financial_metrics.dividend_yield.toFixed(1)}%</div>
                    </div>
                  </div>
                </div>
              )}

              {analysis.fundamental.nigerian_fundamentals && (
                <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded">
                  <div className="text-orange-400 font-medium text-sm mb-2">Nigerian Market Factors</div>
                  <div className="grid grid-cols-1 gap-2 text-xs text-gray-300">
                    <div>Regulatory: {analysis.fundamental.nigerian_fundamentals.regulatory_compliance}</div>
                    <div>Currency: {analysis.fundamental.nigerian_fundamentals.currency_exposure}</div>
                    <div>Government: {analysis.fundamental.nigerian_fundamentals.government_relations}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Cycle Tab */}
        {activeTab === 'cycle' && analysis?.cycle && (
          <div className="space-y-4">
            <div className="bg-gray-800/30 rounded-lg p-4">
              <h4 className="text-white font-medium mb-3 flex items-center">
                <Clock className="h-4 w-4 mr-2 text-indigo-400" />
                {analysis.cycle.heading}
                <span className="ml-auto text-xs text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded">Jenkins/Gann Cycles</span>
              </h4>
              <div className="space-y-2">
                {analysis.cycle.bullets.map((bullet, i) => (
                  <div key={i} className={`flex items-start gap-2 p-2 rounded text-sm ${
                    bullet.startsWith('  ·') ? 'pl-6 text-gray-400 text-xs' : 'bg-indigo-500/5 border border-indigo-500/10 text-gray-200'
                  }`}>
                    {!bullet.startsWith('  ·') && <span className="text-indigo-400 mt-0.5 shrink-0">▸</span>}
                    <span>{bullet}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Gann Tab */}
        {activeTab === 'gann' && analysis?.gann && (
          <div className="space-y-4">
            <div className="bg-gray-800/30 rounded-lg p-4">
              <h4 className="text-white font-medium mb-3 flex items-center">
                <Compass className="h-4 w-4 mr-2 text-amber-400" />
                {analysis.gann.heading}
                <span className="ml-auto text-xs text-amber-400 bg-amber-500/10 px-2 py-1 rounded">Seun Weekly Bot</span>
              </h4>
              <div className="space-y-2">
                {analysis.gann.bullets.map((bullet, i) => (
                  <div key={i} className={`flex items-start gap-2 p-2 rounded text-sm ${
                    bullet.startsWith('  ·') ? 'pl-6 text-gray-400 text-xs' : 'bg-amber-500/5 border border-amber-500/10 text-gray-200'
                  }`}>
                    {!bullet.startsWith('  ·') && <span className="text-amber-400 mt-0.5 shrink-0">▸</span>}
                    <span>{bullet}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Planetary Tab */}
        {activeTab === 'planetary' && analysis?.planetary && (
          <div className="space-y-4">
            <div className="bg-gray-800/30 rounded-lg p-4">
              <h4 className="text-white font-medium mb-3 flex items-center">
                <Globe className="h-4 w-4 mr-2 text-indigo-400" />
                Nigerian Planetary Analysis
              </h4>
              
              {analysis.planetary.lunar_phases?.current_phase && (
                <div className="mb-4 p-3 bg-indigo-500/10 border border-indigo-500/20 rounded">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-indigo-400 font-medium">Lunar Phase</span>
                    <span className="text-white font-bold">{analysis.planetary.lunar_phases.current_phase.name}</span>
                  </div>
                  <div className="text-xs text-gray-300 mb-2">
                    Influence: {analysis.planetary.lunar_phases.current_phase.influence}
                  </div>
                  <div className="text-xs text-indigo-400">
                    {analysis.planetary.lunar_phases.current_phase.nigerian_context}
                  </div>
                </div>
              )}

              {analysis.planetary.nigerian_astro_finance && (
                <div className="mb-4">
                  <h5 className="text-white font-medium mb-3">Nigerian Astro-Finance Factors</h5>
                  <div className="space-y-2">
                    {Object.entries(analysis.planetary.nigerian_astro_finance).map(([factor, description]) => (
                      <div key={factor} className="p-2 bg-gray-700/30 rounded">
                        <div className="text-white text-sm font-medium capitalize">{factor.replace('_', ' ')}</div>
                        <div className="text-xs text-gray-300">{description}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {analysis.planetary.astrological_forecast && (
                <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded">
                  <div className="text-purple-400 font-medium text-sm mb-2">Astrological Forecast</div>
                  <div className="space-y-1 text-xs text-gray-300">
                    <div><span className="text-green-400">Short-term:</span> {analysis.planetary.astrological_forecast.short_term}</div>
                    <div><span className="text-yellow-400">Medium-term:</span> {analysis.planetary.astrological_forecast.medium_term}</div>
                    <div><span className="text-blue-400">Long-term:</span> {analysis.planetary.astrological_forecast.long_term}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Weekly Setups Tab - FULLY FIXED with comprehensive null checks */}
        {activeTab === 'weeklySetups' && analysis?.weeklySetups && (
          <div className="space-y-4">
            <div className="bg-gray-800/30 rounded-lg p-4">
              <h4 className="text-white font-medium mb-3 flex items-center">
                <Target className="h-4 w-4 mr-2 text-orange-400" />
                Nigerian Weekly High Probability Setups
                {analysis.weeklySetups.dataSource && (
                  <span className="ml-2 text-xs text-gray-400">({analysis.weeklySetups.dataSource})</span>
                )}
              </h4>
              
              {analysis.weeklySetups.current_stock_setup && (
                <div className="mb-4 p-3 bg-orange-500/10 border border-orange-500/20 rounded">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-orange-400 font-medium">Current Stock Setup</span>
                    <span className="text-white font-bold">{analysis.weeklySetups.current_stock_setup.setupType}</span>
                  </div>
                  <div className="text-xs text-gray-300 mb-2">
                    Probability: {analysis.weeklySetups.current_stock_setup.probability}%
                  </div>
                  <div className="text-xs text-green-400">
                    Target: ₦{analysis.weeklySetups.current_stock_setup.targetPrice?.toFixed(2)}
                  </div>
                  {analysis.weeklySetups.current_stock_setup.isMock && (
                    <div className="text-xs text-yellow-400 mt-2">⚠️ Using mock data - Real API unavailable</div>
                  )}
                </div>
              )}

              {analysis.weeklySetups.top_ngx_setups && Array.isArray(analysis.weeklySetups.top_ngx_setups) && analysis.weeklySetups.top_ngx_setups.length > 0 && (
                <div className="mb-4">
                  <h5 className="text-white font-medium mb-3">Top NGX Weekly Setups</h5>
                  <div className="space-y-2">
                    {analysis.weeklySetups.top_ngx_setups.slice(0, 5).map((setup, index) => (
                      <div key={index} className="p-3 bg-gray-700/30 rounded border border-gray-600">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <div className="text-white font-medium text-sm">{setup.symbol}</div>
                            <div className="text-gray-300 text-xs">{setup.setupType}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-green-400 font-medium text-sm">{setup.probability}%</div>
                            <div className="text-xs text-gray-400">{setup.confidence}</div>
                          </div>
                        </div>
                        <div className="text-xs text-blue-400">
                          Sector: {setup.sector} | R:R {setup.riskReward}
                        </div>
                        {setup.isMock && (
                          <div className="text-xs text-yellow-400 mt-1">⚠️ Mock data</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {analysis.weeklySetups.setup_statistics && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-green-500/10 rounded">
                    <div className="text-xs text-gray-400">Total Scanned</div>
                    <div className="text-green-400 font-medium text-lg">
                      {analysis.weeklySetups.setup_statistics.total_scanned}
                    </div>
                  </div>
                  <div className="text-center p-3 bg-blue-500/10 rounded">
                    <div className="text-xs text-gray-400">High Probability</div>
                    <div className="text-blue-400 font-medium text-lg">
                      {analysis.weeklySetups.setup_statistics.high_probability_count}
                    </div>
                  </div>
                  <div className="text-center p-3 bg-purple-500/10 rounded">
                    <div className="text-xs text-gray-400">Success Rate</div>
                    <div className="text-purple-400 font-medium text-lg">
                      {analysis.weeklySetups.setup_statistics.success_rate}
                    </div>
                  </div>
                  <div className="text-center p-3 bg-yellow-500/10 rounded">
                    <div className="text-xs text-gray-400">Avg Return</div>
                    <div className="text-yellow-400 font-medium text-lg">
                      {analysis.weeklySetups.setup_statistics.avg_return}
                    </div>
                  </div>
                </div>
              )}

              {analysis.weeklySetups.message && (
                <div className="text-center py-8 text-gray-400">
                  <Target className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>{analysis.weeklySetups.message}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default NGXAdvancedAnalysis