import React from 'react'
import { TrendingUp, TrendingDown, DollarSign, Activity } from 'lucide-react'

const MarketOverview = ({ data = [], isLoading = false }) => {
  // Default data for when no data is provided
  const defaultData = [
    { symbol: 'BTCUSDT', price: 43250.50, change: 2.5 },
    { symbol: 'ETHUSDT', price: 2680.75, change: 1.8 },
    { symbol: 'BNBUSDT', price: 315.20, change: 3.2 },
    { symbol: 'ADAUSDT', price: 0.485, change: -1.2 },
    { symbol: 'XRPUSDT', price: 0.625, change: -0.8 },
    { symbol: 'SOLUSDT', price: 98.45, change: -2.1 }
  ]

  const marketData = data && data.length > 0 ? data : defaultData

  if (isLoading) {
    return (
      <div className="glass-effect rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Market Overview</h3>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-700 rounded mb-2"></div>
              <div className="h-3 bg-gray-800 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Filter gainers and losers
  const gainers = marketData.filter(coin => coin.change > 0).slice(0, 3)
  const losers = marketData.filter(coin => coin.change < 0).slice(0, 3)

  return (
    <div className="glass-effect rounded-lg p-6">
      <div className="flex items-center space-x-2 mb-4">
        <Activity className="h-5 w-5 text-green-500" />
        <h3 className="text-lg font-semibold text-white">Market Overview</h3>
      </div>
      
      <div className="space-y-4">
        {/* Market Cap */}
        <div className="p-4 bg-gray-800/50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Total Market Cap</span>
            <DollarSign className="h-4 w-4 text-green-500" />
          </div>
          <div className="text-xl font-bold text-white">$2.1T</div>
          <div className="text-sm text-green-400">+2.3%</div>
        </div>

        {/* Top Gainers */}
        <div>
          <h4 className="text-sm font-semibold text-gray-300 mb-3">🟢 Top Gainers</h4>
          <div className="space-y-2">
            {gainers.length > 0 ? gainers.map((coin, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-800/30 rounded">
                <div>
                  <div className="font-medium text-white text-sm">{coin.symbol}</div>
                  <div className="text-xs text-gray-400">${coin.price.toFixed(4)}</div>
                </div>
                <div className="flex items-center space-x-1 text-green-400 text-sm">
                  <TrendingUp className="h-3 w-3" />
                  <span>+{coin.change.toFixed(1)}%</span>
                </div>
              </div>
            )) : (
              <div className="text-gray-400 text-sm">No gainers available</div>
            )}
          </div>
        </div>

        {/* Top Losers */}
        <div>
          <h4 className="text-sm font-semibold text-gray-300 mb-3">🔴 Top Losers</h4>
          <div className="space-y-2">
            {losers.length > 0 ? losers.map((coin, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-800/30 rounded">
                <div>
                  <div className="font-medium text-white text-sm">{coin.symbol}</div>
                  <div className="text-xs text-gray-400">${coin.price.toFixed(4)}</div>
                </div>
                <div className="flex items-center space-x-1 text-red-400 text-sm">
                  <TrendingDown className="h-3 w-3" />
                  <span>{coin.change.toFixed(1)}%</span>
                </div>
              </div>
            )) : (
              <div className="text-gray-400 text-sm">No losers available</div>
            )}
          </div>
        </div>

        {/* Fear & Greed Index */}
        <div className="p-4 bg-gradient-to-r from-yellow-500/20 to-green-500/20 rounded-lg">
          <div className="text-sm text-gray-300 mb-2">Fear & Greed Index</div>
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold text-yellow-400">72</div>
            <div className="text-sm text-green-400">Greed</div>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
            <div className="bg-gradient-to-r from-yellow-400 to-green-400 h-2 rounded-full" style={{width: '72%'}}></div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MarketOverview