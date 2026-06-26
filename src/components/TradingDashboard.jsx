import React, { useState, useEffect } from 'react'
import { 
  BarChart3, TrendingUp, TrendingDown, Activity, Volume2, 
  DollarSign, Percent, Clock, RefreshCw, AlertTriangle,
  Target, Zap, Eye, Bell, Star, Filter, ArrowUp, ArrowDown, X
} from 'lucide-react'
import TradingChart from './TradingChart'
import MarketOverview from './MarketOverview'
import SignalPanel from './SignalPanel'
import PatternAnalysis from './PatternAnalysis'
import PerformanceMetrics from './PerformanceMetrics'
import SeunBotAnalysisPanel from './SeunBotAnalysisPanel'
import WeeklySetupsPanel from './WeeklySetupsPanel'
import SeunBotAnalysis from './SeunBotAnalysis'
import { usePriceData } from '../hooks/usePriceData'
import { useAllUsdtPairs } from '../hooks/useAllUsdtPairs'

const TradingDashboard = () => {
  const [selectedPair, setSelectedPair] = useState('BTCUSDT')
  const [timeframe, setTimeframe] = useState('1h')
  const [activeTab, setActiveTab] = useState('overview')
  const [isAnalysisExpanded, setIsAnalysisExpanded] = useState(false)
  
  const { prices, loading: priceLoading } = usePriceData([selectedPair])
  const { topPairs, loading: pairsLoading } = useAllUsdtPairs()

  const priceData = prices?.find(p => p.symbol === selectedPair)

  const tabs = [
    { id: 'overview', label: 'Market Overview', icon: BarChart3 },
    { id: 'signals', label: 'Trading Signals', icon: Target },
    { id: 'patterns', label: 'Pattern Analysis', icon: Activity },
    { id: 'performance', label: 'Performance', icon: TrendingUp },
    { id: 'seunbot', label: 'SeunBot Analysis', icon: Zap },
    { id: 'setups', label: 'Weekly Setups', icon: Eye }
  ]

  const displayPairs = topPairs?.slice(0, 8) || []

  return (
    <div className="min-h-screen p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Crypto Trading Dashboard
          </h1>
          <p className="text-gray-400">
            Advanced analysis powered by SeunBot AI • Real-time market data
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 px-3 py-2 bg-green-500/20 rounded-lg">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-green-400 text-sm font-medium">Live Data</span>
          </div>
          
          <select
            value={selectedPair}
            onChange={(e) => setSelectedPair(e.target.value)}
            className="px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
          >
            {topPairs?.map(pair => (
              <option key={pair.symbol} value={pair.symbol}>
                {pair.symbol}
              </option>
            ))}
          </select>
          
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
          >
            <option value="5m">5m</option>
            <option value="15m">15m</option>
            <option value="1h">1h</option>
            <option value="4h">4h</option>
            <option value="1d">1d</option>
          </select>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {displayPairs.map((pair, index) => (
          <div
            key={pair.symbol}
            className={`glass-effect rounded-lg p-4 cursor-pointer transition-all hover:scale-105 ${
              selectedPair === pair.symbol ? 'ring-2 ring-blue-500' : ''
            }`}
            onClick={() => setSelectedPair(pair.symbol)}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-white font-medium text-sm">{pair.symbol}</span>
              <div className={`text-xs px-2 py-1 rounded ${
                pair.priceChangePercent >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
              }`}>
                {pair.priceChangePercent >= 0 ? '+' : ''}{pair.priceChangePercent}%
              </div>
            </div>
            <div className="text-white text-lg font-bold">
              ${parseFloat(pair.price).toFixed(4)}
            </div>
            <div className="text-xs text-gray-400">
              Vol: ${(pair.volume / 1e6).toFixed(1)}M
            </div>
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Chart Section */}
        <div className="xl:col-span-2 space-y-6">
          <TradingChart 
            symbol={selectedPair} 
            timeframe={timeframe}
            priceData={priceData}
          />
          
          {/* Navigation Tabs */}
          <div className="glass-effect rounded-lg p-1">
            <div className="flex flex-wrap gap-1">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-400 hover:text-white hover:bg-gray-700'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Tab Content */}
          <div className="space-y-6">
            {activeTab === 'overview' && <MarketOverview />}
            {activeTab === 'signals' && <SignalPanel />}
            {activeTab === 'patterns' && <PatternAnalysis />}
            {activeTab === 'performance' && <PerformanceMetrics />}
            {activeTab === 'seunbot' && <SeunBotAnalysisPanel selectedPair={selectedPair} priceData={priceData} />}
            {activeTab === 'setups' && <WeeklySetupsPanel />}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Current Price Info */}
          <div className="glass-effect rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">{selectedPair}</h3>
              <RefreshCw className="h-5 w-5 text-gray-400 animate-spin" />
            </div>
            
            {priceData && (
              <div className="space-y-4">
                <div>
                  <div className="text-2xl font-bold text-white">
                    ${parseFloat(priceData.price).toFixed(4)}
                  </div>
                  <div className={`text-sm flex items-center space-x-1 ${
                    priceData.priceChangePercent >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {priceData.priceChangePercent >= 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                    <span>{priceData.priceChangePercent >= 0 ? '+' : ''}{priceData.priceChangePercent}%</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-gray-400">24h High</div>
                    <div className="text-white font-medium">${parseFloat(priceData.highPrice || priceData.price).toFixed(4)}</div>
                  </div>
                  <div>
                    <div className="text-gray-400">24h Low</div>
                    <div className="text-white font-medium">${parseFloat(priceData.lowPrice || priceData.price).toFixed(4)}</div>
                  </div>
                  <div>
                    <div className="text-gray-400">Volume</div>
                    <div className="text-white font-medium">{((priceData.volume || 0) / 1e6).toFixed(1)}M</div>
                  </div>
                  <div>
                    <div className="text-gray-400">Market Cap</div>
                    <div className="text-white font-medium">${((priceData.quoteVolume || 0) / 1e9).toFixed(1)}B</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="glass-effect rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button
                onClick={() => setIsAnalysisExpanded(!isAnalysisExpanded)}
                className="w-full flex items-center justify-between p-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition-colors"
              >
                <span>Advanced Analysis</span>
                <Zap className="h-4 w-4" />
              </button>
              
              <button className="w-full flex items-center justify-between p-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition-colors">
                <span>Set Price Alert</span>
                <Bell className="h-4 w-4" />
              </button>
              
              <button className="w-full flex items-center justify-between p-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition-colors">
                <span>Add to Watchlist</span>
                <Star className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Market Sentiment */}
          <div className="glass-effect rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Market Sentiment</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Fear & Greed Index</span>
                <span className="text-orange-400 font-bold">72</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div className="bg-orange-500 h-2 rounded-full" style={{ width: '72%' }}></div>
              </div>
              <div className="text-sm text-gray-400">Greed - Market is optimistic</div>
              
              <div className="pt-4 border-t border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400">Social Sentiment</span>
                  <span className="text-green-400">Bullish</span>
                </div>
                <div className="flex space-x-2">
                  <div className="flex-1 bg-green-500/20 rounded px-2 py-1 text-center text-xs text-green-400">
                    65% Bullish
                  </div>
                  <div className="flex-1 bg-red-500/20 rounded px-2 py-1 text-center text-xs text-red-400">
                    35% Bearish
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Top Movers */}
          <div className="glass-effect rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Top Movers</h3>
            <div className="space-y-3">
              {displayPairs.slice(0, 5).map((pair, index) => (
                <div key={pair.symbol} className="flex items-center justify-between">
                  <div>
                    <div className="text-white font-medium text-sm">{pair.symbol}</div>
                    <div className="text-xs text-gray-400">${parseFloat(pair.price).toFixed(4)}</div>
                  </div>
                  <div className={`text-sm font-bold ${
                    pair.priceChangePercent >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {pair.priceChangePercent >= 0 ? '+' : ''}{pair.priceChangePercent}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Expanded Analysis Modal - FIXED: Now passes priceData prop */}
      {isAnalysisExpanded && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Advanced SeunBot Analysis</h2>
                <button
                  onClick={() => setIsAnalysisExpanded(false)}
                  className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="h-6 w-6 text-gray-400" />
                </button>
              </div>
              <SeunBotAnalysis selectedPair={selectedPair} priceData={priceData} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TradingDashboard