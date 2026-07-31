import React, { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { TrendingUp, TrendingDown, Volume2, BarChart3, Calendar, DollarSign, Activity, AlertCircle } from 'lucide-react'
import USStocksDataService from '../services/USStocksDataService'
import AIStockAnalysis from './AIStockAnalysis'
import USStocksAdvancedAnalysisPanel from './USStocksAdvancedAnalysisPanel'

const USStocksAdvancedAnalysis = ({ selectedStock = 'AAPL', stockData: initialStockData, stocks = [], onSelectStock }) => {
  const location = useLocation()
  const cleanSym = String(selectedStock || 'AAPL').replace(/^US_/i, '').toUpperCase().trim()

  // Seed immediately from: 1) prop, 2) React Router navigation state (passed from weekly setups)
  const navState = location?.state?.stockData
  const seed = initialStockData || (navState?.symbol === cleanSym ? navState : null)

  const [stockData, setStockData] = useState(seed || null)
  const [loading, setLoading] = useState(!seed)
  const [activeTab, setActiveTab] = useState('technical')

  useEffect(() => {
    loadStockData()
  }, [selectedStock])

  const loadStockData = async () => {
    // If we already have valid price data from the prop or nav state, don't show spinner
    const hasSeed = seed && seed.price > 0
    if (!hasSeed) setLoading(true)
    try {
      // Check props stocks list first (fastest)
      if (stocks && stocks.length > 0) {
        const found = stocks.find(s => String(s.symbol).replace(/^US_/i, '').toUpperCase() === cleanSym)
        if (found && found.price > 0) {
          setStockData(found)
          setLoading(false)
          return
        }
      }

      // Fetch from service (checks cache → prediction endpoint fallback)
      const fetchedData = await USStocksDataService.fetchStockData(cleanSym)
      if (fetchedData) {
        setStockData(fetchedData)
      }
    } catch (error) {
      console.error('Error loading US stock analysis data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading && !stockData) {
    return (
      <div className="glass-effect rounded-lg p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-700 rounded w-1/3"></div>
          <div className="h-4 bg-gray-700 rounded w-1/2"></div>
          <div className="h-32 bg-gray-700 rounded"></div>
        </div>
      </div>
    )
  }

  const currentPrice = Number(stockData?.price || 0)
  const changePercent = Number(stockData?.changePercent || 0)
  const change = Number(stockData?.change || (currentPrice * (changePercent / 100)))
  const high = Number(stockData?.high || currentPrice * 1.02)
  const low = Number(stockData?.low || currentPrice * 0.98)
  const open = Number(stockData?.open || (currentPrice - change))
  const volume = Number(stockData?.volume || 0)

  return (
    <div className="space-y-6">
      {/* Stock Header */}
      <div className="glass-effect rounded-lg p-4 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-4">
          <div className="min-w-0">
            <div className="flex items-center space-x-3 min-w-0">
              <div className="relative h-12 w-12 rounded-xl bg-gray-700/50 flex items-center justify-center overflow-hidden flex-shrink-0 border border-gray-600">
                <img
                  src={`https://financialmodelingprep.com/image-stock/${cleanSym}.png`}
                  alt={`${cleanSym} logo`}
                  className="absolute inset-0 h-full w-full object-cover"
                  onError={(e) => { e.currentTarget.style.display = 'none' }}
                />
                <Activity className="h-5 w-5 text-gray-400" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white truncate">{cleanSym}</h2>
              {stockData?.type === 'ETF' && (
                <span className="px-2 py-1 text-xs bg-purple-500/20 text-purple-400 rounded">ETF</span>
              )}
            </div>
            <p className="text-gray-400 mt-1 break-words">{stockData?.name || cleanSym}</p>
            <p className="text-sm text-gray-500">{stockData?.sector || 'US Stock'}</p>
          </div>
          
          <div className="text-left sm:text-right">
            <div className="text-2xl sm:text-3xl font-bold text-white">${currentPrice.toFixed(2)}</div>
            <div className={`flex items-center sm:justify-end space-x-1 mt-1 ${
              changePercent >= 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              {changePercent >= 0 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
              <span className="text-lg font-semibold">
                {changePercent >= 0 ? '+' : ''}{changePercent.toFixed(2)}%
              </span>
            </div>
            <div className={`text-sm ${change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {change >= 0 ? '+' : ''}${change.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 mt-6">
          <div className="bg-gray-700/30 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <BarChart3 className="h-4 w-4 text-blue-400" />
              <span className="text-xs text-gray-400">Open</span>
            </div>
            <div className="text-lg font-semibold text-white">
              {open > 0 ? `$${open.toFixed(2)}` : '—'}
            </div>
          </div>

          <div className="bg-gray-700/30 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <TrendingUp className="h-4 w-4 text-green-400" />
              <span className="text-xs text-gray-400">High</span>
            </div>
            <div className="text-lg font-semibold text-white">${high.toFixed(2)}</div>
          </div>

          <div className="bg-gray-700/30 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <TrendingDown className="h-4 w-4 text-red-400" />
              <span className="text-xs text-gray-400">Low</span>
            </div>
            <div className="text-lg font-semibold text-white">${low.toFixed(2)}</div>
          </div>

          <div className="bg-gray-700/30 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Volume2 className="h-4 w-4 text-purple-400" />
              <span className="text-xs text-gray-400">Volume</span>
            </div>
            <div className="text-lg font-semibold text-white">
              {(volume / 1e6).toFixed(2)}M
            </div>
          </div>
        </div>

        {/* Data Source Info */}
        <div className="mt-4 pt-4 border-t border-gray-700">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between text-xs text-gray-400">
            <span className="break-words">Data Sources: Assets Live Prices, TradingView API, Prediction Engine</span>
            <span>Updated: {new Date().toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Tab Navigation - 3 tabs */}
      <div className="grid grid-cols-3 bg-gray-800 rounded-lg p-1 gap-1">
        <button
          onClick={() => setActiveTab('technical')}
          className={`px-3 py-2 rounded-md text-xs font-medium transition-colors ${
            activeTab === 'technical' ? 'bg-green-600 text-white' : 'text-gray-400 hover:text-white'
          }`}
        >
          Technical
        </button>
        <button
          onClick={() => setActiveTab('ai')}
          className={`px-3 py-2 rounded-md text-xs font-medium transition-colors ${
            activeTab === 'ai' ? 'bg-green-600 text-white' : 'text-gray-400 hover:text-white'
          }`}
        >
          AI Analysis
        </button>
        <button
          onClick={() => setActiveTab('advanced')}
          className={`px-3 py-2 rounded-md text-xs font-medium transition-colors ${
            activeTab === 'advanced' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
          }`}
        >
          SMC / Wave
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'technical' && (
        <div className="glass-effect rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Technical Indicators</h3>
          
          <div className="space-y-4">
            {/* Price Action */}
            <div>
              <h4 className="text-sm font-medium text-gray-400 mb-2">Price Action</h4>
              <div className="bg-gray-700/30 rounded-lg p-4">
                <p className="text-white">
                  {changePercent >= 0 ? 'Bullish' : 'Bearish'} momentum with {Math.abs(changePercent).toFixed(2)}% {changePercent >= 0 ? 'gain' : 'loss'} today.
                  Current price is trading {currentPrice > open ? 'above' : 'below'} the opening price of ${open.toFixed(2)}.
                </p>
              </div>
            </div>

            {/* Support & Resistance */}
            <div>
              <h4 className="text-sm font-medium text-gray-400 mb-2">Support & Resistance</h4>
              <div className="bg-gray-700/30 rounded-lg p-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Resistance (High):</span>
                    <span className="text-red-400 font-semibold">${high.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Current Price:</span>
                    <span className="text-white font-semibold">${currentPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Support (Low):</span>
                    <span className="text-green-400 font-semibold">${low.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Volume Analysis */}
            <div>
              <h4 className="text-sm font-medium text-gray-400 mb-2">Volume Analysis</h4>
              <div className="bg-gray-700/30 rounded-lg p-4">
                <p className="text-white">
                  Trading volume of {(volume / 1e6).toFixed(2)}M shares indicates {
                    volume > 10000000 ? 'high' : volume > 3000000 ? 'moderate' : 'low'
                  } market interest. {
                    changePercent >= 0 && volume > 5000000 
                      ? 'Strong institutional buying pressure with high volume.'
                      : changePercent < 0 && volume > 5000000
                      ? 'Selling pressure with high volume.'
                      : 'Normal Wall Street trading activity.'
                  }
                </p>
              </div>
            </div>

            {/* Volatility */}
            <div>
              <h4 className="text-sm font-medium text-gray-400 mb-2">Volatility</h4>
              <div className="bg-gray-700/30 rounded-lg p-4">
                <p className="text-white">
                  Daily range: ${(high - low).toFixed(2)} ({low > 0 ? ((high - low) / low * 100).toFixed(2) : '0.00'}%).
                  {Math.abs(changePercent) > 4 ? ' High volatility - exercise caution.' : ' Moderate volatility levels.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'ai' && (
        <AIStockAnalysis
          stock={stockData || { symbol: cleanSym, name: cleanSym, price: currentPrice, changePercent }}
          currency="$"
        />
      )}

      {activeTab === 'advanced' && (
        <USStocksAdvancedAnalysisPanel
          selectedStock={cleanSym}
          marketData={stocks}
        />
      )}
    </div>
  )
}

export default USStocksAdvancedAnalysis
