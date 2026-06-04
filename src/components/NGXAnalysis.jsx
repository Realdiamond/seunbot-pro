import React, { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, Volume2, BarChart3, Calendar, DollarSign, Activity, AlertCircle } from 'lucide-react'
import RealNGXDataService from '../services/RealNGXDataService'
import AIStockAnalysis from './AIStockAnalysis'

const NGXAnalysis = ({ selectedStock, marketData }) => {
  const [stockData, setStockData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('technical')

  useEffect(() => {
    loadStockData()
  }, [selectedStock])

  const loadStockData = async () => {
    setLoading(true)
    try {
      const data = marketData.find(stock => stock.symbol === selectedStock)
      if (data) {
        setStockData(data)
      }

      // Always refresh selected symbol from service so fallback chain applies
      const fetchedData = await RealNGXDataService.fetchStockData(selectedStock)
      setStockData(fetchedData)
    } catch (error) {
      console.error('Error loading stock data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
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

  if (!stockData) {
    return (
      <div className="glass-effect rounded-lg p-6 text-center">
        <AlertCircle className="h-12 w-12 mx-auto mb-3 text-gray-400" />
        <p className="text-gray-400">Stock data not available</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stock Header */}
      <div className="glass-effect rounded-lg p-4 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-4">
          <div className="min-w-0">
            <div className="flex items-center space-x-3 min-w-0">
              <div className="relative h-12 w-12 rounded-xl bg-gray-700/50 flex items-center justify-center overflow-hidden">
                <Activity className="h-5 w-5 text-gray-400" />
                {stockData.imageUrl && (
                  <img
                    src={stockData.imageUrl}
                    alt={`${stockData.symbol} logo`}
                    className="absolute inset-0 h-full w-full object-cover"
                    onError={(e) => { e.currentTarget.style.display = 'none' }}
                  />
                )}
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white truncate">{stockData.symbol}</h2>
              {stockData.type === 'ETF' && (
                <span className="px-2 py-1 text-xs bg-purple-500/20 text-purple-400 rounded">ETF</span>
              )}
            </div>
            <p className="text-gray-400 mt-1 break-words">{stockData.name}</p>
            <p className="text-sm text-gray-500">{stockData.sector}</p>
          </div>
          
          <div className="text-left sm:text-right">
            <div className="text-2xl sm:text-3xl font-bold text-white">₦{stockData.price.toFixed(2)}</div>
            <div className={`flex items-center sm:justify-end space-x-1 mt-1 ${
              stockData.changePercent >= 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              {stockData.changePercent >= 0 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
              <span className="text-lg font-semibold">
                {stockData.changePercent >= 0 ? '+' : ''}{stockData.changePercent.toFixed(2)}%
              </span>
            </div>
            <div className={`text-sm ${stockData.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {stockData.change >= 0 ? '+' : ''}₦{stockData.change.toFixed(2)}
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
              {stockData.open === null || stockData.open === undefined ? '-' : `₦${stockData.open.toFixed(2)}`}
            </div>
          </div>

          <div className="bg-gray-700/30 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <TrendingUp className="h-4 w-4 text-green-400" />
              <span className="text-xs text-gray-400">High</span>
            </div>
            <div className="text-lg font-semibold text-white">₦{stockData.high.toFixed(2)}</div>
          </div>

          <div className="bg-gray-700/30 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <TrendingDown className="h-4 w-4 text-red-400" />
              <span className="text-xs text-gray-400">Low</span>
            </div>
            <div className="text-lg font-semibold text-white">₦{stockData.low.toFixed(2)}</div>
          </div>

          <div className="bg-gray-700/30 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Volume2 className="h-4 w-4 text-purple-400" />
              <span className="text-xs text-gray-400">Volume</span>
            </div>
            <div className="text-lg font-semibold text-white">
              {(stockData.volume / 1e6).toFixed(2)}M
            </div>
          </div>
        </div>

        {/* Data Source Info */}
        {stockData.sources && stockData.sources.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-700">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between text-xs text-gray-400">
              <span className="break-words">Data Sources: {stockData.sources.join(', ')}</span>
              <span>Updated: {new Date(stockData.timestamp).toLocaleString()}</span>
            </div>
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="grid grid-cols-2 bg-gray-800 rounded-lg p-1 gap-1">
        <button
          onClick={() => setActiveTab('technical')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'technical' ? 'bg-green-600 text-white' : 'text-gray-400 hover:text-white'
          }`}
        >
          Technical Analysis
        </button>
        <button
          onClick={() => setActiveTab('ai')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'ai' ? 'bg-green-600 text-white' : 'text-gray-400 hover:text-white'
          }`}
        >
          AI Analysis
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
                  {stockData.changePercent >= 0 ? 'Bullish' : 'Bearish'} momentum with {Math.abs(stockData.changePercent).toFixed(2)}% {stockData.changePercent >= 0 ? 'gain' : 'loss'} today.
                  {stockData.open === null || stockData.open === undefined
                    ? ' Opening price is currently unavailable.'
                    : ` Current price is trading ${stockData.price > stockData.open ? 'above' : 'below'} the opening price.`}
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
                    <span className="text-red-400 font-semibold">₦{stockData.high.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Current Price:</span>
                    <span className="text-white font-semibold">₦{stockData.price.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Support (Low):</span>
                    <span className="text-green-400 font-semibold">₦{stockData.low.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Volume Analysis */}
            <div>
              <h4 className="text-sm font-medium text-gray-400 mb-2">Volume Analysis</h4>
              <div className="bg-gray-700/30 rounded-lg p-4">
                <p className="text-white">
                  Trading volume of {(stockData.volume / 1e6).toFixed(2)}M shares indicates {
                    stockData.volume > 5000000 ? 'high' : stockData.volume > 2000000 ? 'moderate' : 'low'
                  } market interest. {
                    stockData.changePercent >= 0 && stockData.volume > 3000000 
                      ? 'Strong buying pressure with high volume.'
                      : stockData.changePercent < 0 && stockData.volume > 3000000
                      ? 'Selling pressure with high volume.'
                      : 'Normal trading activity.'
                  }
                </p>
              </div>
            </div>

            {/* Volatility */}
            <div>
              <h4 className="text-sm font-medium text-gray-400 mb-2">Volatility</h4>
              <div className="bg-gray-700/30 rounded-lg p-4">
                <p className="text-white">
                  Daily range: ₦{(stockData.high - stockData.low).toFixed(2)} ({((stockData.high - stockData.low) / stockData.low * 100).toFixed(2)}%).
                  {Math.abs(stockData.changePercent) > 5 ? ' High volatility - exercise caution.' : ' Moderate volatility levels.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'ai' && (
        <AIStockAnalysis stock={stockData} />
      )}
    </div>
  )
}

export default NGXAnalysis