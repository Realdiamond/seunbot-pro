import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { 
  MapPin, Building, Fuel, Package, Phone, Factory, Shield, 
  TrendingUp, TrendingDown, Volume2, BarChart3, RefreshCw,
  Search, Filter, Star, Eye, Download, Share2, Bell,
  Globe, Calendar, Clock, AlertCircle, CheckCircle, Info, Layers,
  Wifi, WifiOff
} from 'lucide-react'
import NGXAnalysis from './NGXAnalysis'
import AIMarketSummary from './AIMarketSummary'
import RealNGXDataService from '../services/RealNGXDataService'
import { ngxWebSocket } from '../services/WebSocketService'

const NGXDashboard = () => {
  const [selectedStock, setSelectedStock] = useState('GTCO')
  const [allStocks, setAllStocks] = useState([])
  const [marketSummary, setMarketSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSector, setSelectedSector] = useState('All')
  const [selectedType, setSelectedType] = useState('All') // New: Stock vs ETF filter
  const [viewMode, setViewMode] = useState('analysis')
  const [watchlist, setWatchlist] = useState(['GTCO', 'DANGCEM', 'MTNN', 'ZENITHBANK'])
  const [lastUpdate, setLastUpdate] = useState(null)
  const [wsStatus, setWsStatus] = useState('disconnected')
  const [mobileAssetQuery, setMobileAssetQuery] = useState('')
  const [showMobileAssetPicker, setShowMobileAssetPicker] = useState(false)
  const mobileAssetPickerRef = useRef(null)

  const sectors = ['All', 'Banking', 'Oil & Gas', 'Consumer Goods', 'Telecommunications', 'Industrial Goods', 'Insurance', 'Conglomerates', 'Healthcare', 'ETF']
  const types = ['All', 'Stock', 'ETF']

  // WebSocket price update handler
  const handleWsUpdate = useCallback((update) => {
    setAllStocks(prev => {
      const idx = prev.findIndex(s => s.symbol === update.symbol)
      if (idx === -1) return prev
      const updated = [...prev]
      updated[idx] = {
        ...updated[idx],
        price: update.price ?? updated[idx].price,
        change: update.change ?? updated[idx].change,
        changePercent: update.changePercent ?? updated[idx].changePercent,
        volume: update.volume ?? updated[idx].volume,
        high: update.high ?? updated[idx].high,
        low: update.low ?? updated[idx].low,
        timestamp: update.timestamp ? new Date(update.timestamp).toISOString() : updated[idx].timestamp,
        sources: Array.isArray(update.sources) && update.sources.length > 0
          ? update.sources
          : (update.source ? [update.source] : updated[idx].sources)
      }
      return updated
    })
  }, [])

  useEffect(() => {
    loadNGXData()
    
    // Refresh market summary every 5 minutes
    const interval = setInterval(async () => {
      try {
        const summary = await RealNGXDataService.fetchMarketSummary()
        setMarketSummary(summary)
      } catch (e) { /* ignore */ }
    }, 5 * 60 * 1000)

    return () => {
      clearInterval(interval)
      ngxWebSocket.disconnect()
    }
  }, [])

  useEffect(() => {
    const closePicker = (event) => {
      if (!mobileAssetPickerRef.current) return
      if (!mobileAssetPickerRef.current.contains(event.target)) {
        setShowMobileAssetPicker(false)
      }
    }

    document.addEventListener('mousedown', closePicker)
    document.addEventListener('touchstart', closePicker)

    return () => {
      document.removeEventListener('mousedown', closePicker)
      document.removeEventListener('touchstart', closePicker)
    }
  }, [])

  const [visibleCount, setVisibleCount] = useState(30)

  useEffect(() => {
    setVisibleCount(30)
  }, [searchTerm, selectedSector, selectedType, viewMode])

  const loadNGXData = async () => {
    setLoading(true)
    try {
      console.log('📊 Loading real NGX data (145 stocks + 15 ETFs)...')
      
      const [stocks, summary] = await Promise.all([
        RealNGXDataService.getAllStocks(),
        RealNGXDataService.fetchMarketSummary()
      ])

      console.log(`✅ Loaded ${stocks.length} securities from sources:`, summary.sources)

      setAllStocks(stocks)
      setMarketSummary(summary)
      setLastUpdate(new Date())

      // Seed WebSocket cache and connect
      ngxWebSocket.seedCache(stocks)
      const symbols = stocks.map(s => s.symbol)
      symbols.forEach(symbol => {
        ngxWebSocket.subscribe(symbol, handleWsUpdate)
      })
      ngxWebSocket.onStatusChange(setWsStatus)
      ngxWebSocket.connect('ngx', symbols)
    } catch (error) {
      console.error('❌ Error loading NGX data:', error)
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
      'Insurance': Shield,
      'ETF': Layers
    }
    return icons[sector] || Building
  }

  const filteredStocks = allStocks.filter(stock => {
    const matchesSearch = stock.symbol.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         stock.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesSector = selectedSector === 'All' || stock.sector === selectedSector
    const matchesType = selectedType === 'All' || stock.type === selectedType || 
                       (selectedType === 'Stock' && !stock.type) ||
                       (selectedType === 'ETF' && stock.sector === 'ETF')
    return matchesSearch && matchesSector && matchesType
  })

  const addToWatchlist = (symbol) => {
    if (!watchlist.includes(symbol)) {
      setWatchlist([...watchlist, symbol])
    }
  }

  const removeFromWatchlist = (symbol) => {
    setWatchlist(watchlist.filter(s => s !== symbol))
  }

  const mobileAssetMatches = useMemo(() => {
    const query = mobileAssetQuery.trim().toLowerCase()

    if (!query) {
      return allStocks.slice(0, 80)
    }

    return allStocks
      .filter((stock) => (
        stock.symbol.toLowerCase().includes(query)
        || stock.name.toLowerCase().includes(query)
      ))
      .slice(0, 80)
  }, [allStocks, mobileAssetQuery])

  const handleMobileAssetSelect = (stock) => {
    setSelectedStock(stock.symbol)
    setViewMode('analysis')
    setSearchTerm(stock.symbol)
    setMobileAssetQuery(stock.symbol)
    setShowMobileAssetPicker(false)
  }

  // Resolve the full stock object for the selected symbol
  const selectedStockObj = allStocks.find(s => s.symbol === selectedStock) || null

  // Calculate statistics
  const stockCount = allStocks.filter(s => s.type !== 'ETF' && s.sector !== 'ETF').length
  const etfCount = allStocks.filter(s => s.type === 'ETF' || s.sector === 'ETF').length

  // Calculate top movers from real data
  const topGainers = [...allStocks]
    .filter(s => s.changePercent > 0)
    .sort((a, b) => b.changePercent - a.changePercent)
    .slice(0, 5)

  const topLosers = [...allStocks]
    .filter(s => s.changePercent < 0)
    .sort((a, b) => a.changePercent - b.changePercent)
    .slice(0, 5)

    if (loading) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 px-3 py-4 sm:px-4 sm:py-5 lg:p-6">
          <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
              <p className="text-gray-400">Loading NGX market data...</p>
              <p className="text-xs text-gray-500 mt-2">Fetching live securities from backend</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 px-3 py-4 sm:px-4 sm:py-5 lg:p-6">
        <div className="max-w-7xl mx-auto space-y-5 sm:space-y-6">
          {/* Header */}
          <div className="mb-6 sm:mb-8 rounded-2xl border border-blue-800/40 bg-slate-950/35 backdrop-blur-sm p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2.5 min-w-0">
                  <MapPin className="h-7 w-7 text-green-500 flex-shrink-0" />
                  <h1 className="text-2xl sm:text-3xl font-bold text-white leading-tight truncate">Nigerian Stock Exchange</h1>
                </div>
                <p className="text-sm sm:text-base text-gray-300 mt-2">
                  {stockCount} Stocks • {etfCount} ETFs • {marketSummary?.sources?.length || 0} Data Sources
                </p>
              </div>

              <button
                onClick={() => { ngxWebSocket.disconnect(); loadNGXData(); }}
                className="p-2 bg-gray-700/80 hover:bg-gray-600 rounded-xl text-gray-300 transition-colors"
                title="Refresh data"
              >
                <RefreshCw className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              {wsStatus === 'connected' && (
                <span className="flex items-center gap-1.5 text-xs font-medium text-green-300 bg-green-500/15 px-2.5 py-1 rounded-full">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                  Live
                </span>
              )}
              {wsStatus === 'reconnecting' && (
                <span className="flex items-center gap-1.5 text-xs font-medium text-yellow-300 bg-yellow-500/15 px-2.5 py-1 rounded-full">
                  <WifiOff className="w-3 h-3" />
                  Reconnecting...
                </span>
              )}
              {wsStatus === 'polling' && (
                <span className="flex items-center gap-1.5 text-xs font-medium text-blue-300 bg-blue-500/15 px-2.5 py-1 rounded-full">
                  <Wifi className="w-3 h-3" />
                  Polling (30s)
                </span>
              )}

              <span className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/20 text-sm font-medium text-green-300">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                Assets API
              </span>

              {lastUpdate && (
                <span className="text-xs text-gray-400">Updated: {lastUpdate.toLocaleTimeString()}</span>
              )}
            </div>

            <div className="mt-4 grid grid-cols-2 sm:flex sm:flex-wrap gap-2 bg-gray-900/55 rounded-xl p-1">
              <button
                onClick={() => setViewMode('analysis')}
                className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                  viewMode === 'analysis' ? 'bg-green-600 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                Analysis
              </button>
              <button
                onClick={() => setViewMode('ai-insights')}
                className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                  viewMode === 'ai-insights' ? 'bg-green-600 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                AI Insights
              </button>
              <button
                onClick={() => setViewMode('watchlist')}
                className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                  viewMode === 'watchlist' ? 'bg-green-600 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                Watchlist
              </button>
              <button
                onClick={() => setViewMode('screener')}
                className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                  viewMode === 'screener' ? 'bg-green-600 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                Screener
              </button>
            </div>

            <div className="mt-4 lg:hidden" ref={mobileAssetPickerRef}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={mobileAssetQuery}
                  onFocus={() => setShowMobileAssetPicker(true)}
                  onClick={() => setShowMobileAssetPicker(true)}
                  onChange={(event) => {
                    const value = event.target.value
                    setMobileAssetQuery(value)
                    setSearchTerm(value)
                    setShowMobileAssetPicker(true)
                  }}
                  placeholder={`Search assets (current: ${selectedStock})`}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-700 bg-gray-900/80 text-white placeholder-gray-400 focus:outline-none focus:border-green-500"
                />
              </div>

              {showMobileAssetPicker && (
                <div className="mt-2 max-h-72 overflow-y-auto rounded-xl border border-gray-700 bg-gray-900/95 shadow-xl shadow-black/30">
                  {mobileAssetMatches.length === 0 ? (
                    <div className="px-3 py-3 text-sm text-gray-400">No assets found</div>
                  ) : (
                    mobileAssetMatches.map((stock) => (
                      <button
                        key={`mobile-search-${stock.symbol}`}
                        type="button"
                        onClick={() => handleMobileAssetSelect(stock)}
                        className={`w-full px-3 py-2.5 border-b border-gray-800 last:border-b-0 text-left transition-colors ${
                          selectedStock === stock.symbol ? 'bg-green-500/15' : 'hover:bg-gray-800/70'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-white truncate">{stock.symbol}</div>
                            <div className="text-xs text-gray-400 truncate">{stock.name}</div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className="text-sm text-white">₦{stock.price.toFixed(2)}</div>
                            <div className={`text-xs ${stock.changePercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                            </div>
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

        {/* Market Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6 mb-8">
          {/* NGX All Share Index */}
          <div className="glass-effect rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5 text-green-500" />
                <h3 className="text-lg font-semibold text-white">NGX All Share</h3>
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-white">
                {marketSummary?.index?.toFixed(2) || 'N/A'}
              </div>
              <div className={`flex items-center space-x-1 ${
                (marketSummary?.indexChangePercent || 0) >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {(marketSummary?.indexChangePercent || 0) >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                <span>{(marketSummary?.indexChangePercent || 0) >= 0 ? '+' : ''}{(marketSummary?.indexChangePercent || 0).toFixed(2)}%</span>
              </div>
              <div className="text-sm text-gray-400">
                {(marketSummary?.indexChange || 0) >= 0 ? '+' : ''}{(marketSummary?.indexChange || 0).toFixed(0)} pts
              </div>
            </div>
          </div>

          {/* Market Breadth */}
          <div className="glass-effect rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Volume2 className="h-5 w-5 text-blue-500" />
                <h3 className="text-lg font-semibold text-white">Market Breadth</h3>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Advancers</span>
                <span className="text-green-400 font-bold">{marketSummary?.advancers || 0}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Decliners</span>
                <span className="text-red-400 font-bold">{marketSummary?.decliners || 0}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Unchanged</span>
                <span className="text-gray-400 font-bold">{marketSummary?.unchanged || 0}</span>
              </div>
            </div>
          </div>

          {/* Total Volume */}
          <div className="glass-effect rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5 text-purple-500" />
                <h3 className="text-lg font-semibold text-white">Total Volume</h3>
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-white">
                {((marketSummary?.totalVolume || 0) / 1e6).toFixed(1)}M
              </div>
              <div className="text-sm text-gray-400">
                Shares Traded
              </div>
              <div className="text-xs text-gray-500">
                Across {marketSummary?.totalStocks || 0} securities
              </div>
            </div>
          </div>

          {/* Securities Count */}
          <div className="glass-effect rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Layers className="h-5 w-5 text-orange-500" />
                <h3 className="text-lg font-semibold text-white">Securities</h3>
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-white">
                {allStocks.length}
              </div>
              <div className="text-sm text-gray-400">
                {stockCount} Stocks • {etfCount} ETFs
              </div>
              <div className="text-xs text-gray-500">
                {marketSummary?.sources?.length || 0} data sources active
              </div>
            </div>
          </div>
        </div>

        {/* AI Insights - per selected symbol, not market-wide */}
        {viewMode === 'ai-insights' && (
          <AIMarketSummary stock={selectedStockObj} />
        )}

        {/* Main Content Area */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-6">
          {/* Left Sidebar - Stock List */}
          <div className="order-2 lg:order-1 lg:col-span-1">
            <div className="glass-effect rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">
                  {viewMode === 'watchlist' ? 'My Watchlist' : 'Securities'}
                </h3>
                <div className="flex items-center space-x-2">
                  <Filter className="h-4 w-4 text-gray-400" />
                </div>
              </div>

              {/* Search and Filter */}
              <div className="space-y-3 mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search stocks/ETFs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-green-500"
                  />
                </div>

                {viewMode !== 'watchlist' && (
                  <>
                    <select
                      value={selectedType}
                      onChange={(e) => setSelectedType(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-green-500"
                    >
                      {types.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>

                    <select
                      value={selectedSector}
                      onChange={(e) => setSelectedSector(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-green-500"
                    >
                      {sectors.map(sector => (
                        <option key={sector} value={sector}>{sector}</option>
                      ))}
                    </select>
                  </>
                )}

                <div className="text-xs text-gray-500">
                  Showing {filteredStocks.length} of {allStocks.length} securities
                </div>
              </div>

              {/* Stock List */}
              {(() => {
                const list = viewMode === 'watchlist' 
                  ? allStocks.filter(stock => watchlist.includes(stock.symbol))
                  : filteredStocks;
                return (
                  <>
                    <div className="space-y-2 max-h-[60vh] lg:max-h-96 overflow-y-auto">
                      {list.slice(0, visibleCount).map((stock) => {
                        const SectorIcon = getSectorIcon(stock.sector)
                        return (
                          <div
                            key={stock.symbol}
                            onClick={() => setSelectedStock(stock.symbol)}
                            className={`p-3 rounded-lg cursor-pointer transition-colors ${
                              selectedStock === stock.symbol
                                ? 'bg-green-500/20 border border-green-500/40'
                                : 'bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-2 min-w-0">
                                <div className="relative h-5 w-5 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden flex-shrink-0">
                                  <SectorIcon className="h-3.5 w-3.5 text-gray-400" />
                                  {stock.imageUrl && (
                                    <img
                                      src={stock.imageUrl}
                                      alt={`${stock.symbol} logo`}
                                      className="absolute inset-0 h-full w-full object-cover"
                                      onError={(e) => { e.currentTarget.style.display = 'none' }}
                                    />
                                  )}
                                </div>
                                <span className="font-medium text-white truncate">{stock.symbol}</span>
                                {stock.type === 'ETF' && (
                                  <span className="text-xs px-1 py-0.5 bg-purple-500/20 text-purple-400 rounded">ETF</span>
                                )}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    if (watchlist.includes(stock.symbol)) {
                                      removeFromWatchlist(stock.symbol)
                                    } else {
                                      addToWatchlist(stock.symbol)
                                    }
                                  }}
                                  className="ml-auto flex-shrink-0"
                                >
                                  <Star className={`h-4 w-4 ${
                                    watchlist.includes(stock.symbol) ? 'text-yellow-400 fill-current' : 'text-gray-400'
                                  }`} />
                                </button>
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="text-sm text-white font-medium">
                                ₦{stock.price.toFixed(2)}
                              </div>
                              <div className={`text-sm ${
                                stock.changePercent >= 0 ? 'text-green-400' : 'text-red-400'
                              }`}>
                                {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                              </div>
                            </div>
                            {stock.sources && stock.sources.length > 0 && (
                              <div className="text-xs text-gray-500 mt-1">
                                Sources: {stock.sources.length}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                    {list.length > visibleCount && (
                      <div className="flex items-center justify-center pt-3 mt-2 border-t border-gray-700 bg-gray-800/10">
                        <button
                          onClick={() => setVisibleCount(c => c + 30)}
                          className="px-4 py-2 text-xs text-gray-400 hover:text-white bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700 rounded-lg transition-colors"
                        >
                          Show more ({list.length - visibleCount} remaining)
                        </button>
                      </div>
                    )}
                  </>
                )
              })()}
            </div>

            {/* Top Movers */}
            {(topGainers.length > 0 || topLosers.length > 0) && (
              <div className="glass-effect rounded-lg p-6 mt-6">
                <h3 className="text-lg font-semibold text-white mb-4">Top Movers</h3>
                
                <div className="space-y-4">
                  {/* Top Gainers */}
                  {topGainers.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-green-400 mb-2">Top Gainers</h4>
                      <div className="space-y-2">
                        {topGainers.map((stock) => (
                          <div key={stock.symbol} className="flex items-center justify-between p-2 bg-green-500/10 rounded">
                            <span className="text-white text-sm">{stock.symbol}</span>
                            <span className="text-green-400 text-sm">+{stock.changePercent.toFixed(1)}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Top Losers */}
                  {topLosers.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-red-400 mb-2">Top Losers</h4>
                      <div className="space-y-2">
                        {topLosers.map((stock) => (
                          <div key={stock.symbol} className="flex items-center justify-between p-2 bg-red-500/10 rounded">
                            <span className="text-white text-sm">{stock.symbol}</span>
                            <span className="text-red-400 text-sm">{stock.changePercent.toFixed(1)}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Main Analysis Area */}
          <div className="order-1 lg:order-2 lg:col-span-3">
            {(viewMode === 'analysis' || viewMode === 'ai-insights') && (
              <NGXAnalysis 
                selectedStock={selectedStock}
                marketData={allStocks}
              />
            )}

            {viewMode === 'screener' && (
              <div className="glass-effect rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Stock Screener</h3>
                <div className="text-center py-8 text-gray-400">
                  <Info className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Advanced stock screening functionality coming soon...</p>
                  <p className="text-sm">Filter {stockCount} stocks and {etfCount} ETFs by P/E, dividend yield, market cap, and more</p>
                </div>
              </div>
            )}

            {viewMode === 'watchlist' && (
              <div className="glass-effect rounded-lg p-6">
                <div className="flex items-center justify-between gap-3 mb-6">
                  <h3 className="text-lg font-semibold text-white">Watchlist Overview</h3>
                  <div className="flex items-center space-x-2">
                    <button className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-gray-400">
                      <Download className="h-4 w-4" />
                    </button>
                    <button className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-gray-400">
                      <Share2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {watchlist.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <Star className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Your watchlist is empty</p>
                    <p className="text-sm">Add stocks to track their performance</p>
                  </div>
                ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[760px]">
                      <thead>
                        <tr className="border-b border-gray-700">
                          <th className="text-left py-3 px-4 text-gray-400 font-medium">Symbol</th>
                          <th className="text-left py-3 px-4 text-gray-400 font-medium">Type</th>
                          <th className="text-left py-3 px-4 text-gray-400 font-medium">Price</th>
                          <th className="text-left py-3 px-4 text-gray-400 font-medium">Change</th>
                          <th className="text-left py-3 px-4 text-gray-400 font-medium">Volume</th>
                          <th className="text-left py-3 px-4 text-gray-400 font-medium">Sector</th>
                          <th className="text-right py-3 px-4 text-gray-400 font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allStocks.filter(stock => watchlist.includes(stock.symbol)).map((stock) => {
                          const SectorIcon = getSectorIcon(stock.sector)
                          return (
                          <tr key={stock.symbol} className="border-b border-gray-800 hover:bg-gray-800/30">
                            <td className="py-3 px-4">
                              <div className="flex items-center space-x-2">
                                <div className="relative h-6 w-6 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden flex-shrink-0">
                                  <SectorIcon className="h-4 w-4 text-gray-400" />
                                  {stock.imageUrl && (
                                    <img
                                      src={stock.imageUrl}
                                      alt={`${stock.symbol} logo`}
                                      className="absolute inset-0 h-full w-full object-cover"
                                      onError={(e) => { e.currentTarget.style.display = 'none' }}
                                    />
                                  )}
                                </div>
                                <div className="text-white font-medium">{stock.symbol}</div>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              {stock.type === 'ETF' ? (
                                <span className="text-xs px-2 py-1 bg-purple-500/20 text-purple-400 rounded">ETF</span>
                              ) : (
                                <span className="text-xs px-2 py-1 bg-blue-500/20 text-blue-400 rounded">Stock</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-white">₦{stock.price.toFixed(2)}</td>
                            <td className="py-3 px-4">
                              <div className={`${stock.changePercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                              </div>
                            </td>
                            <td className="py-3 px-4 text-gray-300">{(stock.volume / 1e6).toFixed(1)}M</td>
                            <td className="py-3 px-4 text-gray-300">{stock.sector}</td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end space-x-2">
                                <button
                                  onClick={() => setSelectedStock(stock.symbol)}
                                  className="p-1 text-blue-400 hover:text-blue-300"
                                >
                                  <Eye className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => removeFromWatchlist(stock.symbol)}
                                  className="p-1 text-red-400 hover:text-red-300"
                                >
                                  <Star className="h-4 w-4 fill-current" />
                                </button>
                              </div>
                            </td>
                          </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}

export default NGXDashboard