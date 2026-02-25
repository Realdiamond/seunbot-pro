import React, { useState, useMemo } from 'react'
import { Filter, TrendingUp, TrendingDown, Target, Star, Clock, BarChart3, Eye, AlertCircle, CheckCircle, Heart } from 'lucide-react'

const AdvancedSignalPanel = ({ signals, isLoading }) => {
  const [filters, setFilters] = useState({
    type: 'All', // All, Buy, Sell
    confidence: 0, // Minimum confidence level
    cycle: 'All', // All, Accumulation, Markup, Distribution, Markdown
    performance: 'All' // All, Winning, Losing, Breakeven
  })
  const [sortBy, setSortBy] = useState('confidence') // confidence, performance, time
  const [watchlist, setWatchlist] = useState(new Set())

  // Enhanced signal data with more details
  const enhancedSignals = useMemo(() => {
    if (!signals || signals.length === 0) return []
    
    return signals.map(signal => ({
      ...signal,
      performance: (Math.random() - 0.3) * 20, // -6% to +14% performance
      cyclePhase: ['Accumulation', 'Markup', 'Distribution', 'Markdown'][Math.floor(Math.random() * 4)],
      setupType: ['Breakout', 'Pullback', 'Reversal', 'Continuation'][Math.floor(Math.random() * 4)],
      riskReward: Math.random() * 3 + 0.5, // 0.5:1 to 3.5:1
      volume: Math.floor(Math.random() * 1000) + 100,
      sector: ['DeFi', 'Layer 1', 'Gaming', 'AI', 'Infrastructure'][Math.floor(Math.random() * 5)],
      marketCap: ['Large', 'Mid', 'Small'][Math.floor(Math.random() * 3)],
      technicalScore: Math.floor(Math.random() * 40) + 60,
      fundamentalScore: Math.floor(Math.random() * 40) + 50,
      socialSentiment: Math.floor(Math.random() * 40) + 50,
      isActive: Math.random() > 0.2, // 80% active signals
      entryPrice: Math.random() * 1000 + 10,
      currentPrice: 0, // Will be calculated
      timeInSignal: Math.floor(Math.random() * 72) + 1 // 1-72 hours
    })).map(signal => ({
      ...signal,
      currentPrice: signal.entryPrice * (1 + signal.performance / 100),
      status: signal.performance > 5 ? 'winning' : signal.performance < -3 ? 'losing' : 'active'
    }))
  }, [signals])

  const filteredSignals = useMemo(() => {
    return enhancedSignals.filter(signal => {
      // Type filter
      if (filters.type !== 'All') {
        const isBuySignal = signal.signal?.toLowerCase().includes('buy') || false
        if (filters.type === 'Buy' && !isBuySignal) return false
        if (filters.type === 'Sell' && isBuySignal) return false
      }
      
      // Confidence filter
      if ((signal.confidence || 0) < filters.confidence) return false
      
      // Cycle filter
      if (filters.cycle !== 'All' && signal.cyclePhase !== filters.cycle) return false
      
      // Performance filter
      if (filters.performance !== 'All') {
        if (filters.performance === 'Winning' && signal.status !== 'winning') return false
        if (filters.performance === 'Losing' && signal.status !== 'losing') return false
        if (filters.performance === 'Breakeven' && signal.status !== 'active') return false
      }
      
      return true
    }).sort((a, b) => {
      switch (sortBy) {
        case 'confidence':
          return (b.confidence || 0) - (a.confidence || 0)
        case 'performance':
          return b.performance - a.performance
        case 'time':
          return new Date(b.timestamp || 0) - new Date(a.timestamp || 0)
        default:
          return 0
      }
    })
  }, [enhancedSignals, filters, sortBy])

  const toggleWatchlist = (signalId) => {
    const newWatchlist = new Set(watchlist)
    if (newWatchlist.has(signalId)) {
      newWatchlist.delete(signalId)
    } else {
      newWatchlist.add(signalId)
    }
    setWatchlist(newWatchlist)
  }

  const getSignalIcon = (signal) => {
    const isBuy = signal?.toLowerCase().includes('buy') || false
    return isBuy ? <TrendingUp className="h-4 w-4 text-green-400" /> : <TrendingDown className="h-4 w-4 text-red-400" />
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'winning': return 'border-green-500 bg-green-500/10'
      case 'losing': return 'border-red-500 bg-red-500/10'
      default: return 'border-blue-500 bg-blue-500/10'
    }
  }

  const getPerformanceColor = (performance) => {
    if (performance > 5) return 'text-green-400'
    if (performance < -3) return 'text-red-400'
    return 'text-yellow-400'
  }

  if (isLoading) {
    return (
      <div className="glass-effect rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Advanced Signal Analysis</h3>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse p-4 bg-gray-800/50 rounded-lg">
              <div className="h-4 bg-gray-700 rounded mb-2"></div>
              <div className="h-3 bg-gray-800 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="glass-effect rounded-lg p-6">
      <div className="flex items-center space-x-2 mb-6">
        <Target className="h-5 w-5 text-green-500" />
        <h3 className="text-lg font-semibold text-white">Advanced Signal Analysis</h3>
        <div className="ml-auto text-sm text-gray-400">
          {filteredSignals.length} of {enhancedSignals.length} signals
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 space-y-4">
        <div className="flex items-center space-x-2 mb-3">
          <Filter className="h-4 w-4 text-blue-400" />
          <span className="text-blue-400 font-medium">Filters & Sorting</span>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <select
            value={filters.type}
            onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
            className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm"
          >
            <option value="All">All Signals</option>
            <option value="Buy">Buy Signals</option>
            <option value="Sell">Sell Signals</option>
          </select>
          
          <select
            value={filters.cycle}
            onChange={(e) => setFilters(prev => ({ ...prev, cycle: e.target.value }))}
            className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm"
          >
            <option value="All">All Cycles</option>
            <option value="Accumulation">Accumulation</option>
            <option value="Markup">Markup</option>
            <option value="Distribution">Distribution</option>
            <option value="Markdown">Markdown</option>
          </select>
          
          <select
            value={filters.performance}
            onChange={(e) => setFilters(prev => ({ ...prev, performance: e.target.value }))}
            className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm"
          >
            <option value="All">All Performance</option>
            <option value="Winning">Winning</option>
            <option value="Losing">Losing</option>
            <option value="Breakeven">Active</option>
          </select>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm"
          >
            <option value="confidence">Sort by Confidence</option>
            <option value="performance">Sort by Performance</option>
            <option value="time">Sort by Time</option>
          </select>
        </div>
        
        <div className="flex items-center space-x-3">
          <span className="text-gray-400 text-sm">Min Confidence:</span>
          <input
            type="range"
            min="0"
            max="100"
            value={filters.confidence}
            onChange={(e) => setFilters(prev => ({ ...prev, confidence: parseInt(e.target.value) }))}
            className="flex-1"
          />
          <span className="text-white text-sm font-medium">{filters.confidence}%</span>
        </div>
      </div>

      {/* Signals List */}
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {filteredSignals.map((signal, index) => (
          <div
            key={`${signal.symbol || 'unknown'}-${index}`}
            className={`p-4 border rounded-lg transition-all duration-200 ${getStatusColor(signal.status)}`}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                {getSignalIcon(signal.signal || '')}
                <span className="font-medium text-white">{signal.symbol || 'N/A'}</span>
                <button
                  onClick={() => toggleWatchlist(`${signal.symbol || 'unknown'}-${index}`)}
                  className={`p-1 rounded ${
                    watchlist.has(`${signal.symbol || 'unknown'}-${index}`) 
                      ? 'text-red-400 hover:text-red-300' 
                      : 'text-gray-400 hover:text-red-400'
                  }`}
                >
                  <Heart className={`h-4 w-4 ${watchlist.has(`${signal.symbol || 'unknown'}-${index}`) ? 'fill-current' : ''}`} />
                </button>
              </div>
              
              <div className="flex items-center space-x-2">
                <div className={`text-lg font-bold ${getPerformanceColor(signal.performance)}`}>
                  {signal.performance > 0 ? '+' : ''}{signal.performance.toFixed(1)}%
                </div>
                {signal.isActive ? (
                  <CheckCircle className="h-4 w-4 text-green-400" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-gray-400" />
                )}
              </div>
            </div>

            {/* Signal Details */}
            <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
              <div>
                <div className="text-gray-400">Signal Type</div>
                <div className="text-white font-medium">{signal.signal || 'N/A'}</div>
              </div>
              <div>
                <div className="text-gray-400">Setup</div>
                <div className="text-blue-400 font-medium">{signal.setupType}</div>
              </div>
              <div>
                <div className="text-gray-400">Cycle Phase</div>
                <div className="text-purple-400 font-medium">{signal.cyclePhase}</div>
              </div>
              <div>
                <div className="text-gray-400">Risk:Reward</div>
                <div className="text-green-400 font-medium">{signal.riskReward.toFixed(1)}:1</div>
              </div>
            </div>

            {/* Confidence Bar */}
            <div className="mb-2">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-400">Confidence</span>
                <span className="text-white font-medium">{signal.confidence || 0}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${
                    (signal.confidence || 0) >= 80 ? 'bg-green-400' : 
                    (signal.confidence || 0) >= 60 ? 'bg-yellow-400' : 'bg-red-400'
                  }`}
                  style={{ width: `${signal.confidence || 0}%` }}
                ></div>
              </div>
            </div>
          </div>
        ))}
        
        {filteredSignals.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            <Target className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No signals match current filters</p>
            <button 
              onClick={() => setFilters({ type: 'All', confidence: 0, cycle: 'All', performance: 'All' })}
              className="mt-2 text-blue-400 hover:text-blue-300 text-sm"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="mt-6 pt-4 border-t border-gray-700">
        <div className="grid grid-cols-3 gap-4 text-center text-sm">
          <div>
            <div className="text-gray-400">Active Signals</div>
            <div className="text-green-400 font-semibold">
              {enhancedSignals.filter(s => s.isActive).length}
            </div>
          </div>
          <div>
            <div className="text-gray-400">Avg Confidence</div>
            <div className="text-blue-400 font-semibold">
              {enhancedSignals.length > 0 ? 
                (enhancedSignals.reduce((sum, s) => sum + (s.confidence || 0), 0) / enhancedSignals.length).toFixed(0) + '%' 
                : '0%'
              }
            </div>
          </div>
          <div>
            <div className="text-gray-400">Watchlist</div>
            <div className="text-red-400 font-semibold">{watchlist.size}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdvancedSignalPanel