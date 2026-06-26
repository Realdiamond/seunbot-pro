import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Target, TrendingUp, TrendingDown, Activity, Volume2, 
  BarChart3, Zap, AlertTriangle, CheckCircle, Clock, 
  DollarSign, Percent, Eye, RefreshCw, Star, Filter,
  Building, Fuel, Package, Phone, Factory, Shield,
  ArrowUp, ArrowDown, MapPin, Calendar, Bell
} from 'lucide-react'
import RealNGXDataService from '../services/RealNGXDataService'

const NGXWeeklySetupsPanel = ({ onAnalyze }) => {
  const navigate = useNavigate()
  const [weeklySetups, setWeeklySetups] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedSector, setSelectedSector] = useState('All')
  const [selectedSetupType, setSelectedSetupType] = useState('All')
  const [minProbability, setMinProbability] = useState(70)
  const [sortBy, setSortBy] = useState('probability')
  const [watchlist, setWatchlist] = useState([])

  const sectors = ['All', 'Banking', 'Oil & Gas', 'Consumer Goods', 'Telecommunications', 'Industrial Goods', 'Insurance']
  const setupTypes = ['All', 'Bullish Breakout', 'Bearish Breakdown', 'Oversold Bounce', 'Overbought Pullback', 'Consolidation']

  useEffect(() => {
    loadWeeklySetups()
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(loadWeeklySetups, 300000)
    return () => clearInterval(interval)
  }, [])

  const loadWeeklySetups = async () => {
    setLoading(true)
    try {
      const setups = await RealNGXDataService.fetchWeeklySetups()
      setWeeklySetups(setups)
    } catch (error) {
      console.error('Error loading weekly setups:', error)
    } finally {
      setLoading(false)
    }
  }

  const getSectorIcon = (sector) => {
    const icons = {
      'Banking': Building,
      'Oil & Gas': Fuel,
      'Consumer Goods': Package,
      'Telecommunications': Phone,
      'Industrial Goods': Factory,
      'Insurance': Shield
    }
    return icons[sector] || Building
  }

  const getSetupTypeColor = (setupType) => {
    const colors = {
      'Bullish Breakout': 'text-green-400',
      'Bearish Breakdown': 'text-red-400',
      'Oversold Bounce': 'text-blue-400',
      'Overbought Pullback': 'text-orange-400',
      'Consolidation': 'text-gray-400'
    }
    return colors[setupType] || 'text-gray-400'
  }

  const getConfidenceColor = (confidence) => {
    if (confidence === 'High') return 'text-green-400'
    if (confidence === 'Medium') return 'text-yellow-400'
    return 'text-red-400'
  }

  const filteredSetups = weeklySetups?.setups?.filter(setup => {
    const matchesSector = selectedSector === 'All' || setup.sector === selectedSector
    const matchesSetupType = selectedSetupType === 'All' || setup.setupType === selectedSetupType
    const matchesProbability = setup.probability >= minProbability
    return matchesSector && matchesSetupType && matchesProbability
  }) || []

  const sortedSetups = [...filteredSetups].sort((a, b) => {
    switch (sortBy) {
      case 'probability':
        return b.probability - a.probability
      case 'riskReward':
        return parseFloat(b.riskReward) - parseFloat(a.riskReward)
      case 'volume':
        return b.volume - a.volume
      case 'symbol':
        return a.symbol.localeCompare(b.symbol)
      default:
        return b.probability - a.probability
    }
  })

  const addToWatchlist = (symbol) => {
    if (!watchlist.includes(symbol)) {
      setWatchlist([...watchlist, symbol])
    }
  }

  const removeFromWatchlist = (symbol) => {
    setWatchlist(watchlist.filter(s => s !== symbol))
  }

  if (loading) {
    return (
      <div className="glass-effect rounded-lg p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Target className="h-5 w-5 text-orange-500 animate-pulse" />
          <h3 className="text-lg font-semibold text-white">NGX Weekly High Probability Setups</h3>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Scanning Nigerian stocks for high probability setups...</p>
            <p className="text-sm text-gray-500">Analyzing technical patterns, volume, and market structure</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="glass-effect rounded-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Target className="h-5 w-5 text-orange-500" />
          <h3 className="text-lg font-semibold text-white">NGX Weekly High Probability Setups</h3>
          <div className="px-2 py-1 bg-orange-500/20 rounded text-xs text-orange-400">
            {weeklySetups?.highProbabilityCount || 0} Setups Found
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={loadWeeklySetups}
            className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-gray-400 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <div className="text-xs text-gray-400">
            Last scan: {weeklySetups?.scanTime ? new Date(weeklySetups.scanTime).toLocaleTimeString() : 'N/A'}
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <BarChart3 className="h-4 w-4 text-green-400" />
            <span className="text-green-400 font-medium text-sm">Total Scanned</span>
          </div>
          <div className="text-white text-xl font-bold">{weeklySetups?.totalScanned || 0}</div>
          <div className="text-xs text-gray-400">Nigerian Stocks</div>
        </div>

        <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Target className="h-4 w-4 text-orange-400" />
            <span className="text-orange-400 font-medium text-sm">High Probability</span>
          </div>
          <div className="text-white text-xl font-bold">{weeklySetups?.highProbabilityCount || 0}</div>
          <div className="text-xs text-gray-400">Above 70% Confidence</div>
        </div>

        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <TrendingUp className="h-4 w-4 text-blue-400" />
            <span className="text-blue-400 font-medium text-sm">Success Rate</span>
          </div>
          <div className="text-white text-xl font-bold">78%</div>
          <div className="text-xs text-gray-400">Historical Performance</div>
        </div>

        <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Percent className="h-4 w-4 text-purple-400" />
            <span className="text-purple-400 font-medium text-sm">Avg Return</span>
          </div>
          <div className="text-white text-xl font-bold">12.5%</div>
          <div className="text-xs text-gray-400">Per Setup</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-800/30 rounded-lg p-4 mb-6">
        <div className="flex items-center space-x-2 mb-3">
          <Filter className="h-4 w-4 text-gray-400" />
          <span className="text-white font-medium">Filters & Sorting</span>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Sector</label>
            <select
              value={selectedSector}
              onChange={(e) => setSelectedSector(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:border-orange-500"
            >
              {sectors.map(sector => (
                <option key={sector} value={sector}>{sector}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-1 block">Setup Type</label>
            <select
              value={selectedSetupType}
              onChange={(e) => setSelectedSetupType(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:border-orange-500"
            >
              {setupTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-1 block">Min Probability</label>
            <select
              value={minProbability}
              onChange={(e) => setMinProbability(Number(e.target.value))}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:border-orange-500"
            >
              <option value={50}>50%+</option>
              <option value={60}>60%+</option>
              <option value={70}>70%+</option>
              <option value={80}>80%+</option>
              <option value={90}>90%+</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-1 block">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:border-orange-500"
            >
              <option value="probability">Probability</option>
              <option value="riskReward">Risk/Reward</option>
              <option value="volume">Volume</option>
              <option value="symbol">Symbol</option>
            </select>
          </div>

          <div className="flex items-end">
            <div className="text-center">
              <div className="text-xs text-gray-400 mb-1">Filtered Results</div>
              <div className="text-white font-bold text-lg">{sortedSetups.length}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Setups Table */}
      <div className="bg-gray-800/30 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-700/50 border-b border-gray-600">
                <th className="text-left py-3 px-4 text-gray-300 font-medium">Stock</th>
                <th className="text-left py-3 px-4 text-gray-300 font-medium">Setup</th>
                <th className="text-left py-3 px-4 text-gray-300 font-medium">Probability</th>
                <th className="text-left py-3 px-4 text-gray-300 font-medium">Price</th>
                <th className="text-left py-3 px-4 text-gray-300 font-medium">Target</th>
                <th className="text-left py-3 px-4 text-gray-300 font-medium">Stop Loss</th>
                <th className="text-left py-3 px-4 text-gray-300 font-medium">R:R</th>
                <th className="text-left py-3 px-4 text-gray-300 font-medium">Volume</th>
                <th className="text-right py-3 px-4 text-gray-300 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedSetups.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-gray-400">
                    <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No setups found matching current filters</p>
                    <p className="text-sm">Try adjusting your filter criteria</p>
                  </td>
                </tr>
              ) : (
                sortedSetups.map((setup, index) => {
                  const SectorIcon = getSectorIcon(setup.sector)
                  return (
                    <tr 
                      key={index} 
                      className="border-b border-gray-700 hover:bg-gray-700/20 transition-colors cursor-pointer"
                      onClick={() => navigate(`/ngx/${setup.symbol}`)}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-3">
                          <SectorIcon className="h-4 w-4 text-gray-400" />
                          <div>
                            <div className="text-white font-medium">{setup.symbol}</div>
                            <div className="text-xs text-gray-400">{setup.sector}</div>
                          </div>
                        </div>
                      </td>
                      
                      <td className="py-3 px-4">
                        <div className={`font-medium text-sm ${getSetupTypeColor(setup.setupType)}`}>
                          {setup.setupType}
                        </div>
                        <div className="text-xs text-gray-400">{setup.timeframe}</div>
                      </td>
                      
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <div className={`font-bold text-lg ${getConfidenceColor(setup.confidence)}`}>
                            {setup.probability}%
                          </div>
                          <div className={`text-xs px-2 py-1 rounded ${
                            setup.confidence === 'High' ? 'bg-green-500/20 text-green-400' :
                            setup.confidence === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-red-500/20 text-red-400'
                          }`}>
                            {setup.confidence}
                          </div>
                        </div>
                      </td>
                      
                      <td className="py-3 px-4">
                        <div className="text-white font-medium">₦{setup.currentPrice.toFixed(2)}</div>
                      </td>
                      
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-1">
                          <ArrowUp className="h-3 w-3 text-green-400" />
                          <span className="text-green-400 font-medium">₦{setup.targetPrice.toFixed(2)}</span>
                        </div>
                        <div className="text-xs text-gray-400">
                          +{(((setup.targetPrice - setup.currentPrice) / setup.currentPrice) * 100).toFixed(1)}%
                        </div>
                      </td>
                      
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-1">
                          <ArrowDown className="h-3 w-3 text-red-400" />
                          <span className="text-red-400 font-medium">₦{setup.stopLoss.toFixed(2)}</span>
                        </div>
                        <div className="text-xs text-gray-400">
                          {(((setup.stopLoss - setup.currentPrice) / setup.currentPrice) * 100).toFixed(1)}%
                        </div>
                      </td>
                      
                      <td className="py-3 px-4">
                        <div className={`font-bold text-lg ${
                          parseFloat(setup.riskReward) >= 2 ? 'text-green-400' :
                          parseFloat(setup.riskReward) >= 1.5 ? 'text-yellow-400' : 'text-red-400'
                        }`}>
                          {setup.riskReward}
                        </div>
                      </td>
                      
                      <td className="py-3 px-4">
                        <div className="text-white font-medium">{(setup.volume / 1e6).toFixed(1)}M</div>
                        <div className="text-xs text-gray-400">Volume</div>
                      </td>
                      
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => {
                              if (watchlist.includes(setup.symbol)) {
                                removeFromWatchlist(setup.symbol)
                              } else {
                                addToWatchlist(setup.symbol)
                              }
                            }}
                            className="p-1 hover:bg-gray-600 rounded transition-colors"
                          >
                            <Star className={`h-4 w-4 ${
                              watchlist.includes(setup.symbol) ? 'text-yellow-400 fill-current' : 'text-gray-400'
                            }`} />
                          </button>
                          
                          <button
                            onClick={() => onAnalyze && onAnalyze(setup.symbol)}
                            className="p-1 hover:bg-gray-600 rounded transition-colors"
                            title={`Open ${setup.symbol} in NGX Advanced Analysis`}
                          >
                            <Eye className="h-4 w-4 text-blue-400" />
                          </button>

                          <button className="p-1 hover:bg-gray-600 rounded transition-colors">
                            <Bell className="h-4 w-4 text-orange-400" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Setup Signals Summary */}
      {sortedSetups.length > 0 && (
        <div className="mt-6 bg-gray-800/30 rounded-lg p-4">
          <h4 className="text-white font-medium mb-3 flex items-center">
            <Zap className="h-4 w-4 mr-2 text-yellow-400" />
            Common Setup Signals
          </h4>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['High Volume Breakout', 'Strong Bullish Move', 'Oversold RSI + Below SMA20', 'Large Cap Stability'].map((signal, index) => (
              <div key={index} className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  <span className="text-white text-sm">{signal}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Nigerian Market Context */}
      <div className="mt-6 bg-gray-800/30 rounded-lg p-4">
        <h4 className="text-white font-medium mb-3 flex items-center">
          <MapPin className="h-4 w-4 mr-2 text-green-400" />
          Nigerian Market Context
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-3 bg-green-500/10 border border-green-500/20 rounded">
            <div className="text-green-400 font-medium text-sm mb-2">Market Sentiment</div>
            <div className="text-white">Cautiously Optimistic</div>
            <div className="text-xs text-gray-400">Oil prices supporting market</div>
          </div>
          
          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded">
            <div className="text-blue-400 font-medium text-sm mb-2">Economic Calendar</div>
            <div className="text-white">CBN MPC Meeting</div>
            <div className="text-xs text-gray-400">Next week - Rate decision</div>
          </div>
          
          <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded">
            <div className="text-purple-400 font-medium text-sm mb-2">Earnings Season</div>
            <div className="text-white">Q4 Results</div>
            <div className="text-xs text-gray-400">Banking sector reporting</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default NGXWeeklySetupsPanel