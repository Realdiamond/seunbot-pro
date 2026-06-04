import React, { useState, useEffect } from 'react'
import { 
  Calendar, TrendingUp, TrendingDown, Target, Star, Filter, 
  BarChart3, Activity, Clock, DollarSign, Percent, Eye,
  AlertCircle, CheckCircle, RefreshCw, Download, Bookmark
} from 'lucide-react'
import weeklySetupAnalyzer from '../services/weeklySetupAnalyzer'

const WeeklySetupsPanel = ({ isLoading: parentLoading }) => {
  const [weeklySetups, setWeeklySetups] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filters, setFilters] = useState({
    minProbability: 70,
    setupType: 'All',
    sector: 'All',
    marketCap: 'All'
  })
  const [sortBy, setSortBy] = useState('probability')
  const [selectedSetup, setSelectedSetup] = useState(null)
  const [watchlist, setWatchlist] = useState(new Set())

  useEffect(() => {
    fetchWeeklySetups()
  }, [])

  const fetchWeeklySetups = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('Fetching high-probability weekly setups with real Binance data...')
      const setupsData = await weeklySetupAnalyzer.analyzeWeeklySetups()
      setWeeklySetups(setupsData)
      
      console.log(`Found ${setupsData.highProbabilitySetups.length} high-probability setups`)
    } catch (err) {
      console.error('Error fetching weekly setups:', err)
      setError(err.message)
      
      // Generate fallback data if Binance API fails
      setWeeklySetups(generateFallbackData())
    } finally {
      setLoading(false)
    }
  }

  const generateFallbackData = () => {
    console.log('Using fallback data due to API error')
    return {
      totalAnalyzed: 150,
      highProbabilitySetups: [
        {
          symbol: 'BTCUSDT',
          setupType: 'Bullish Breakout',
          probability: 87,
          entry: 43250.00,
          targets: [45800.00, 48500.00, 52000.00],
          stopLoss: 41100.00,
          riskReward: 2.1,
          currentPrice: 43280.00,
          change24h: 2.8,
          volume24h: 1250000000,
          high24h: 43850.00,
          low24h: 42100.00,
          sector: 'Store of Value',
          marketCap: 'Large',
          confidence: 'High',
          signals: ['High volume confirmation', 'Resistance level break', 'Strong bullish momentum', 'Volume breakout pattern'],
          fundamentalScore: 88,
          technicalScore: 86,
          timestamp: Date.now()
        }
      ],
      setupsByType: {},
      marketOverview: {
        totalPairs: 150,
        totalVolume: 8500000000,
        gainers: 92,
        losers: 58,
        avgChange: 1.8
      },
      lastUpdate: Date.now()
    }
  }

  const filteredSetups = weeklySetups?.highProbabilitySetups?.filter(setup => {
    if (setup.probability < filters.minProbability) return false
    if (filters.setupType !== 'All' && setup.setupType !== filters.setupType) return false
    if (filters.sector !== 'All' && setup.sector !== filters.sector) return false
    if (filters.marketCap !== 'All' && setup.marketCap !== filters.marketCap) return false
    return true
  }).sort((a, b) => {
    switch (sortBy) {
      case 'probability':
        return b.probability - a.probability
      case 'riskReward':
        return b.riskReward - a.riskReward
      case 'volume':
        return b.volume24h - a.volume24h
      default:
        return 0
    }
  }) || []

  const toggleWatchlist = (symbol) => {
    const newWatchlist = new Set(watchlist)
    if (newWatchlist.has(symbol)) {
      newWatchlist.delete(symbol)
    } else {
      newWatchlist.add(symbol)
    }
    setWatchlist(newWatchlist)
  }

  const getProbabilityColor = (probability) => {
    if (probability >= 85) return 'text-green-400'
    if (probability >= 75) return 'text-yellow-400'
    return 'text-orange-400'
  }

  const getProbabilityBg = (probability) => {
    if (probability >= 85) return 'bg-green-500/20 border-green-500/30'
    if (probability >= 75) return 'bg-yellow-500/20 border-yellow-500/30'
    return 'bg-orange-500/20 border-orange-500/30'
  }

  const getSetupIcon = (setupType) => {
    if (setupType.includes('Bullish') || setupType.includes('Bull')) {
      return <TrendingUp className="h-4 w-4 text-green-400" />
    }
    if (setupType.includes('Bearish') || setupType.includes('Bear')) {
      return <TrendingDown className="h-4 w-4 text-red-400" />
    }
    return <BarChart3 className="h-4 w-4 text-blue-400" />
  }

  const formatPrice = (price) => {
    if (price >= 1) {
      return price.toFixed(2)
    } else if (price >= 0.01) {
      return price.toFixed(4)
    } else {
      return price.toFixed(6)
    }
  }

  if (loading || parentLoading) {
    return (
      <div className="glass-effect rounded-lg p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Calendar className="h-5 w-5 text-blue-500 animate-pulse" />
          <h3 className="text-lg font-semibold text-white">Weekly High-Probability Setups</h3>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Analyzing all USDT pairs with real Binance data...</p>
            <p className="text-sm text-gray-500">Scanning for high-probability weekly setups</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="glass-effect rounded-lg p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Calendar className="h-5 w-5 text-blue-500" />
          <h3 className="text-lg font-semibold text-white">Weekly High-Probability Setups</h3>
        </div>
        <div className="text-center py-8">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-3" />
          <p className="text-red-400 mb-2">Binance API Error</p>
          <p className="text-gray-400 text-sm mb-4">{error}</p>
          <button 
            onClick={fetchWeeklySetups}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          >
            Retry with Binance Data
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="glass-effect rounded-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Calendar className="h-5 w-5 text-blue-500" />
          <h3 className="text-lg font-semibold text-white">Weekly High-Probability Setups</h3>
          <div className="px-2 py-1 bg-blue-500/20 rounded text-xs text-blue-400">
            {weeklySetups?.totalAnalyzed || 0} pairs analyzed
          </div>
          <div className="px-2 py-1 bg-green-500/20 rounded text-xs text-green-400">
            Live Binance Data
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={fetchWeeklySetups}
            disabled={loading}
            className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-gray-400"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-gray-400">
            <Download className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Market Overview */}
      {weeklySetups?.marketOverview && (
        <div className="mb-6 grid grid-cols-4 gap-3">
          <div className="text-center p-3 bg-gray-800/50 rounded-lg">
            <div className="text-xs text-gray-400">Total Volume</div>
            <div className="text-sm font-semibold text-white">
              ${(weeklySetups.marketOverview.totalVolume / 1e9).toFixed(1)}B
            </div>
          </div>
          <div className="text-center p-3 bg-green-500/10 rounded-lg">
            <div className="text-xs text-gray-400">Gainers</div>
            <div className="text-sm font-semibold text-green-400">
              {weeklySetups.marketOverview.gainers}
            </div>
          </div>
          <div className="text-center p-3 bg-red-500/10 rounded-lg">
            <div className="text-xs text-gray-400">Losers</div>
            <div className="text-sm font-semibold text-red-400">
              {weeklySetups.marketOverview.losers}
            </div>
          </div>
          <div className="text-center p-3 bg-blue-500/10 rounded-lg">
            <div className="text-xs text-gray-400">Avg Change</div>
            <div className={`text-sm font-semibold ${
              weeklySetups.marketOverview.avgChange >= 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              {weeklySetups.marketOverview.avgChange >= 0 ? '+' : ''}{weeklySetups.marketOverview.avgChange.toFixed(1)}%
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 space-y-4">
        <div className="flex items-center space-x-2 mb-3">
          <Filter className="h-4 w-4 text-blue-400" />
          <span className="text-blue-400 font-medium">Setup Filters</span>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <select
            value={filters.setupType}
            onChange={(e) => setFilters(prev => ({ ...prev, setupType: e.target.value }))}
            className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm"
          >
            <option value="All">All Setup Types</option>
            <option value="Bullish Breakout">Bullish Breakout</option>
            <option value="Bull Flag Continuation">Bull Flag</option>
            <option value="Reversal from Oversold">Reversal</option>
            <option value="Pullback to Support">Pullback</option>
            <option value="Ascending Triangle">Triangle</option>
            <option value="Cup and Handle">Cup & Handle</option>
            <option value="Double Bottom">Double Bottom</option>
          </select>
          
          <select
            value={filters.sector}
            onChange={(e) => setFilters(prev => ({ ...prev, sector: e.target.value }))}
            className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm"
          >
            <option value="All">All Sectors</option>
            <option value="Store of Value">Store of Value</option>
            <option value="Smart Contracts">Smart Contracts</option>
            <option value="DeFi">DeFi</option>
            <option value="Layer 2">Layer 2</option>
            <option value="Oracle">Oracle</option>
            <option value="Exchange">Exchange</option>
            <option value="Gaming">Gaming</option>
            <option value="Infrastructure">Infrastructure</option>
          </select>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm"
          >
            <option value="probability">Sort by Probability</option>
            <option value="riskReward">Sort by Risk/Reward</option>
            <option value="volume">Sort by Volume</option>
          </select>
          
          <select
            value={filters.marketCap}
            onChange={(e) => setFilters(prev => ({ ...prev, marketCap: e.target.value }))}
            className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm"
          >
            <option value="All">All Market Caps</option>
            <option value="Large">Large Cap</option>
            <option value="Mid">Mid Cap</option>
            <option value="Small">Small Cap</option>
          </select>
        </div>
        
        <div className="flex items-center space-x-3">
          <span className="text-gray-400 text-sm">Min Probability:</span>
          <input
            type="range"
            min="60"
            max="95"
            value={filters.minProbability}
            onChange={(e) => setFilters(prev => ({ ...prev, minProbability: parseInt(e.target.value) }))}
            className="flex-1"
          />
          <span className="text-white text-sm font-medium">{filters.minProbability}%</span>
        </div>
      </div>

      {/* Setups List */}
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {filteredSetups.map((setup, index) => (
          <div
            key={setup.symbol}
            className={`p-4 border rounded-lg transition-all duration-200 cursor-pointer ${
              selectedSetup === setup.symbol 
                ? getProbabilityBg(setup.probability)
                : 'border-gray-700 hover:border-gray-600'
            }`}
            onClick={() => setSelectedSetup(selectedSetup === setup.symbol ? null : setup.symbol)}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                {getSetupIcon(setup.setupType)}
                <span className="font-medium text-white">{setup.symbol}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleWatchlist(setup.symbol)
                  }}
                  className={`p-1 rounded ${
                    watchlist.has(setup.symbol) 
                      ? 'text-yellow-400 hover:text-yellow-300' 
                      : 'text-gray-400 hover:text-yellow-400'
                  }`}
                >
                  <Star className={`h-4 w-4 ${watchlist.has(setup.symbol) ? 'fill-current' : ''}`} />
                </button>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className={`text-lg font-bold ${getProbabilityColor(setup.probability)}`}>
                  {setup.probability}%
                </div>
                <div className="text-xs text-gray-400">
                  {setup.confidence}
                </div>
              </div>
            </div>

            {/* Current Price & Change */}
            <div className="mb-3 p-2 bg-gray-800/30 rounded">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-gray-400">Current Price</div>
                  <div className="text-lg font-semibold text-white">${formatPrice(setup.currentPrice)}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-400">24h Change</div>
                  <div className={`text-lg font-semibold ${setup.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {setup.change24h >= 0 ? '+' : ''}{setup.change24h.toFixed(2)}%
                  </div>
                </div>
              </div>
            </div>

            {/* Setup Info */}
            <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
              <div>
                <div className="text-gray-400">Setup Type</div>
                <div className="text-blue-400 font-medium">{setup.setupType}</div>
              </div>
              <div>
                <div className="text-gray-400">Risk:Reward</div>
                <div className="text-green-400 font-medium">{setup.riskReward}:1</div>
              </div>
              <div>
                <div className="text-gray-400">Sector</div>
                <div className="text-purple-400 font-medium">{setup.sector}</div>
              </div>
              <div>
                <div className="text-gray-400">24h Volume</div>
                <div className="text-white font-medium">${(setup.volume24h / 1e6).toFixed(0)}M</div>
              </div>
            </div>

            {/* Price Levels */}
            <div className="grid grid-cols-4 gap-2 mb-3 text-xs">
              <div>
                <div className="text-gray-400">Entry</div>
                <div className="text-white font-medium">${formatPrice(setup.entry)}</div>
              </div>
              <div>
                <div className="text-gray-400">Target 1</div>
                <div className="text-green-400 font-medium">${formatPrice(setup.targets[0])}</div>
              </div>
              <div>
                <div className="text-gray-400">Target 2</div>
                <div className="text-green-400 font-medium">${formatPrice(setup.targets[1])}</div>
              </div>
              <div>
                <div className="text-gray-400">Stop Loss</div>
                <div className="text-red-400 font-medium">${formatPrice(setup.stopLoss)}</div>
              </div>
            </div>

            {/* Expanded Details */}
            {selectedSetup === setup.symbol && (
              <div className="mt-4 pt-4 border-t border-gray-700 space-y-3">
                <div>
                  <div className="text-sm font-medium text-gray-300 mb-2">Key Signals</div>
                  <div className="space-y-1">
                    {setup.signals.map((signal, idx) => (
                      <div key={idx} className="flex items-center space-x-2 text-xs">
                        <CheckCircle className="h-3 w-3 text-green-400" />
                        <span className="text-gray-300">{signal}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-medium text-gray-300 mb-2">Scores</div>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Technical:</span>
                        <span className="text-blue-400 font-medium">{setup.technicalScore}/100</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Fundamental:</span>
                        <span className="text-purple-400 font-medium">{setup.fundamentalScore}/100</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm font-medium text-gray-300 mb-2">Price Range</div>
                    <div className="text-xs space-y-1">
                      <div className="flex justify-between">
                        <span className="text-gray-400">24h High:</span>
                        <span className="text-white font-medium">${formatPrice(setup.high24h)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">24h Low:</span>
                        <span className="text-white font-medium">${formatPrice(setup.low24h)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Probability Bar */}
            <div className="mt-3">
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${
                    setup.probability >= 85 ? 'bg-green-400' : 
                    setup.probability >= 75 ? 'bg-yellow-400' : 'bg-orange-400'
                  }`}
                  style={{ width: `${setup.probability}%` }}
                ></div>
              </div>
            </div>
          </div>
        ))}
        
        {filteredSetups.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            <Target className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No setups match current filters</p>
            <button 
              onClick={() => setFilters({ minProbability: 70, setupType: 'All', sector: 'All', marketCap: 'All' })}
              className="mt-2 text-blue-400 hover:text-blue-300 text-sm"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="mt-6 pt-4 border-t border-gray-700">
        <div className="grid grid-cols-3 gap-4 text-center text-sm">
          <div>
            <div className="text-gray-400">High Prob Setups</div>
            <div className="text-green-400 font-semibold">
              {weeklySetups?.highProbabilitySetups?.length || 0}
            </div>
          </div>
          <div>
            <div className="text-gray-400">Avg Probability</div>
            <div className="text-blue-400 font-semibold">
              {filteredSetups.length > 0 ? 
                (filteredSetups.reduce((sum, s) => sum + s.probability, 0) / filteredSetups.length).toFixed(0) + '%' 
                : '0%'
              }
            </div>
          </div>
          <div>
            <div className="text-gray-400">Watchlist</div>
            <div className="text-yellow-400 font-semibold">{watchlist.size}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default WeeklySetupsPanel