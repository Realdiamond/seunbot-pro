import React, { useState, useCallback } from 'react'
import { 
  Target, TrendingUp, TrendingDown, Activity, Volume2, 
  BarChart3, Zap, AlertTriangle, CheckCircle, Clock, 
  DollarSign, Percent, Eye, RefreshCw, Star, Filter,
  ArrowUp, ArrowDown, Calendar, Bell, Search, Loader
} from 'lucide-react'
import USStocksDataService from '../services/USStocksDataService'

const USStocksWeeklySetupsPanel = () => {
  const [weeklySetups, setWeeklySetups] = useState(null)
  const [loading, setLoading] = useState(false)   // NOT auto-loading on mount
  const [selectedSector, setSelectedSector] = useState('All')
  const [selectedSetupType, setSelectedSetupType] = useState('All')
  const [minProbability, setMinProbability] = useState(60)
  const [sortBy, setSortBy] = useState('probability')
  const [watchlist, setWatchlist] = useState([])
  const [scanProgress, setScanProgress] = useState({ done: 0, total: 0 })

  const sectors = ['All', 'Technology', 'Financial Services', 'Healthcare', 'Consumer Discretionary', 'Energy', 'Industrials', 'Consumer Staples', 'Communication Services', 'Real Estate', 'Materials', 'Utilities']
  const setupTypes = ['All', 'Bullish Breakout', 'Bearish Breakdown', 'Oversold Bounce', 'Overbought Pullback', 'Consolidation']

  /**
   * Run prediction scan — called only on user action, never on mount.
   * Scans up to 20 ready stocks, 5 at a time to avoid hammering the API.
   */
  const runScan = useCallback(async () => {
    setLoading(true)
    setWeeklySetups(null)
    setScanProgress({ done: 0, total: 14 }) // watchlist is 14 stocks

    try {
      // Single call to POST /api/UsPrediction/watchlist/analyze (Ep.6)
      // Returns buySignals[], sellSignals[], holdSignals[] — all pre-analyzed
      setScanProgress({ done: 7, total: 14 })
      const result = await USStocksDataService.analyzeWatchlist()
      setScanProgress({ done: 14, total: 14 })

      const highProbabilitySetups = []

      // Process BUY signals
      for (const pred of result.buySignals || []) {
        if (!pred || pred._isSyncing) continue
        const setup = buildSetup(pred)
        if (setup) highProbabilitySetups.push(setup)
      }

      // Process SELL signals
      for (const pred of result.sellSignals || []) {
        if (!pred || pred._isSyncing) continue
        const setup = buildSetup(pred)
        if (setup) highProbabilitySetups.push(setup)
      }

      setWeeklySetups({
        setups: highProbabilitySetups.sort((a, b) => b.probability - a.probability),
        totalScanned: result.totalStocks || 14,
        highProbabilityCount: highProbabilitySetups.length,
        scanTime: result.analyzedAt || new Date().toISOString(),
        durationSeconds: result.durationSeconds
      })
    } catch (error) {
      console.error('Error running weekly setups scan:', error)
      // Fallback: run individual predictions on the first 10 ready stocks
      try {
        const stocks = await USStocksDataService.getAllStocks()
        const candidates = stocks.filter(s => s.isReadyForPrediction !== false).slice(0, 10)
        setScanProgress({ done: 0, total: candidates.length })
        const highProbabilitySetups = []

        const results = await Promise.allSettled(
          candidates.map(stock =>
            USStocksDataService.fetchUsPrediction(stock.symbol, { maxRetries: 0, retryDelayMs: 0 })
              .then(pred => ({ stock, pred }))
          )
        )
        setScanProgress({ done: candidates.length, total: candidates.length })

        for (const r of results) {
          if (r.status !== 'fulfilled') continue
          const { stock, pred } = r.value
          if (!pred || pred._isSyncing || pred.recommendation === 'HOLD') continue
          const setup = buildSetup(pred, stock)
          if (setup) highProbabilitySetups.push(setup)
        }

        setWeeklySetups({
          setups: highProbabilitySetups.sort((a, b) => b.probability - a.probability),
          totalScanned: candidates.length,
          highProbabilityCount: highProbabilitySetups.length,
          scanTime: new Date().toISOString()
        })
      } catch (fallbackErr) {
        console.error('Fallback scan also failed:', fallbackErr)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  // Build a setup entry from a normalized prediction
  const buildSetup = (pred, stockOverride = null) => {
    const rec = String(pred.recommendation || 'HOLD').toUpperCase()
    if (rec === 'HOLD') return null  // Skip HOLDs — they aren't setups

    const currentPrice = pred.currentPrice || stockOverride?.price || 0
    const tradePlan = pred.tradePlan
    const targetPrice = tradePlan?.takeProfit1 || (rec === 'BUY' ? currentPrice * 1.15 : currentPrice * 0.85)
    const stopLoss = tradePlan?.stopLoss || (rec === 'BUY' ? currentPrice * 0.95 : currentPrice * 1.05)
    const confidence = pred.confidence || 0
    const probability = Math.min(95, Math.max(55, Math.round(confidence * 100)))
    const confidenceLabel = probability >= 80 ? 'High' : probability >= 65 ? 'Medium' : 'Low'

    return {
      symbol: pred.symbol,
      sector: stockOverride?.sector || 'US',
      setupType: determineSetupType(pred),
      probability,
      confidence: confidenceLabel,
      currentPrice,
      targetPrice,
      stopLoss,
      riskReward: calcRR(currentPrice, targetPrice, stopLoss),
      volume: stockOverride?.volume || 0,
      timeframe: '1W',
      seunBotSignal: pred.overallMtfSignal || pred.direction || rec,
      weeklySetupName: rec,
      finalScore: pred.finalScore,
      isMock: false
    }
  }



  const determineSetupType = (pred) => {
    const dir = String(pred?.direction || '').toUpperCase()
    const rsi = Number(pred?.indicators?.rsi) || 50
    const weeklyName = String(pred?.weeklyTradeSetup?.setupName || '').toLowerCase()
    if (dir === 'BUY' || dir === 'STRONG BUY') {
      if (rsi < 35) return 'Oversold Bounce'
      if (weeklyName === 'bull') return 'Bullish Breakout'
      return 'Bullish Breakout'
    }
    if (dir === 'SELL' || dir === 'STRONG SELL') {
      if (rsi > 65) return 'Overbought Pullback'
      return 'Bearish Breakdown'
    }
    return 'Consolidation'
  }

  const calcRR = (currentPrice, target, stopLoss) => {
    if (!target || !stopLoss || currentPrice <= 0) return '—'
    const reward = target - currentPrice
    const risk = currentPrice - stopLoss
    if (risk <= 0) return '—'
    return (reward / risk).toFixed(1)
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
      case 'probability': return b.probability - a.probability
      case 'riskReward': return parseFloat(b.riskReward) - parseFloat(a.riskReward)
      case 'volume': return b.volume - a.volume
      case 'symbol': return a.symbol.localeCompare(b.symbol)
      default: return b.probability - a.probability
    }
  })

  const addToWatchlist = (symbol) => {
    if (!watchlist.includes(symbol)) setWatchlist([...watchlist, symbol])
  }
  const removeFromWatchlist = (symbol) => {
    setWatchlist(watchlist.filter(s => s !== symbol))
  }

  // ── Empty / Pre-scan state ───────────────────────────
  if (!loading && !weeklySetups) {
    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="flex items-center space-x-2 mb-6">
          <Target className="h-5 w-5 text-orange-500" />
          <h3 className="text-lg font-semibold text-white">US Stocks Weekly High Probability Setups</h3>
        </div>

        <div className="flex flex-col items-center justify-center py-16 gap-5">
          <div className="w-20 h-20 rounded-full bg-orange-500/10 flex items-center justify-center">
            <Search className="w-9 h-9 text-orange-400" />
          </div>
          <div className="text-center">
            <h4 className="text-white font-semibold text-lg mb-2">Ready to Scan US Stocks</h4>
            <p className="text-gray-400 text-sm max-w-md">
              Click <strong className="text-orange-400">Scan Now</strong> to screen up to 20 stocks
              using SeunBot's real-time prediction engine. This typically takes 15–30 seconds.
            </p>
          </div>
          <button
            onClick={runScan}
            className="flex items-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 rounded-xl text-white font-semibold transition-colors shadow-lg shadow-orange-500/20"
          >
            <Zap className="w-5 h-5" />
            Scan Now
          </button>
        </div>
      </div>
    )
  }

  // ── Scanning progress ────────────────────────────────
  if (loading) {
    const pct = scanProgress.total > 0
      ? Math.round((scanProgress.done / scanProgress.total) * 100)
      : 0
    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="flex items-center space-x-2 mb-6">
          <Target className="h-5 w-5 text-orange-500 animate-pulse" />
          <h3 className="text-lg font-semibold text-white">Scanning US Stocks...</h3>
        </div>
        <div className="flex flex-col items-center justify-center py-12 gap-5">
          <Loader className="w-12 h-12 text-orange-400 animate-spin" />
          <div className="text-center">
            <p className="text-white font-medium mb-1">
              {scanProgress.total > 0
                ? `Analyzed ${scanProgress.done} of ${scanProgress.total} stocks`
                : 'Loading stock list...'}
            </p>
            <p className="text-sm text-gray-400">Fetching live predictions from SeunBot backend</p>
          </div>
          {scanProgress.total > 0 && (
            <div className="w-64">
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>Progress</span>
                <span>{pct}%</span>
              </div>
              <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-orange-500 rounded-full transition-all duration-300"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── Results ──────────────────────────────────────────
  return (
    <div className="bg-gray-800 rounded-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Target className="h-5 w-5 text-orange-500" />
          <h3 className="text-lg font-semibold text-white">US Stocks Weekly High Probability Setups</h3>
          <div className="px-2 py-1 bg-orange-500/20 rounded text-xs text-orange-400">
            {weeklySetups?.highProbabilityCount || 0} Setups Found
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={runScan}
            className="flex items-center gap-1.5 p-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-gray-400 transition-colors"
            title="Re-scan"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <div className="text-xs text-gray-400">
            Scanned: {weeklySetups?.scanTime ? new Date(weeklySetups.scanTime).toLocaleTimeString() : 'N/A'}
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
          <div className="text-xs text-gray-400">US Stocks</div>
        </div>

        <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Target className="h-4 w-4 text-orange-400" />
            <span className="text-orange-400 font-medium text-sm">Signals Found</span>
          </div>
          <div className="text-white text-xl font-bold">{weeklySetups?.highProbabilityCount || 0}</div>
          <div className="text-xs text-gray-400">Strong Signals</div>
        </div>

        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <TrendingUp className="h-4 w-4 text-green-400" />
            <span className="text-green-400 font-medium text-sm">Bullish</span>
          </div>
          <div className="text-white text-xl font-bold">
            {weeklySetups?.setups?.filter(s => s.setupType.includes('Bullish') || s.setupType === 'Oversold Bounce').length || 0}
          </div>
          <div className="text-xs text-gray-400">Buy Setups</div>
        </div>

        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <TrendingDown className="h-4 w-4 text-red-400" />
            <span className="text-red-400 font-medium text-sm">Bearish</span>
          </div>
          <div className="text-white text-xl font-bold">
            {weeklySetups?.setups?.filter(s => s.setupType.includes('Bearish') || s.setupType === 'Overbought Pullback').length || 0}
          </div>
          <div className="text-xs text-gray-400">Sell Setups</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-700/30 rounded-lg p-4 mb-6">
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
      <div className="bg-gray-700/30 rounded-lg overflow-hidden">
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
                <th className="text-right py-3 px-4 text-gray-300 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedSetups.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-gray-400">
                    <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No setups found matching current filters</p>
                    <p className="text-sm">Try adjusting filter criteria or click Re-scan</p>
                  </td>
                </tr>
              ) : (
                sortedSetups.map((setup, index) => (
                  <tr key={index} className="border-b border-gray-700 hover:bg-gray-700/20 transition-colors">
                    <td className="py-3 px-4">
                      <div>
                        <div className="text-white font-medium">{setup.symbol}</div>
                        <div className="text-xs text-gray-400">{setup.sector}</div>
                      </div>
                    </td>
                    
                    <td className="py-3 px-4">
                      <div className={`font-medium text-sm ${getSetupTypeColor(setup.setupType)}`}>
                        {setup.setupType}
                      </div>
                      <div className="text-xs text-gray-400">{setup.seunBotSignal}</div>
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
                      <div className="text-white font-medium">
                        {setup.currentPrice > 0 ? `$${setup.currentPrice.toFixed(2)}` : '—'}
                      </div>
                    </td>
                    
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-1">
                        <ArrowUp className="h-3 w-3 text-green-400" />
                        <span className="text-green-400 font-medium">
                          {setup.targetPrice > 0 ? `$${setup.targetPrice.toFixed(2)}` : '—'}
                        </span>
                      </div>
                    </td>
                    
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-1">
                        <ArrowDown className="h-3 w-3 text-red-400" />
                        <span className="text-red-400 font-medium">
                          {setup.stopLoss > 0 ? `$${setup.stopLoss.toFixed(2)}` : '—'}
                        </span>
                      </div>
                    </td>
                    
                    <td className="py-3 px-4">
                      <div className={`font-bold text-lg ${
                        parseFloat(setup.riskReward) >= 2 ? 'text-green-400' :
                        parseFloat(setup.riskReward) >= 1.5 ? 'text-yellow-400' : 'text-gray-400'
                      }`}>
                        {setup.riskReward}
                      </div>
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
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default USStocksWeeklySetupsPanel
