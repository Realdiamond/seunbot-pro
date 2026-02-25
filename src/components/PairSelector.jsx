import React, { useState, useMemo } from 'react'
import { Search, TrendingUp, TrendingDown, Volume2 } from 'lucide-react'

const PairSelector = ({ pairs, selectedPair, onPairSelect, marketSummary }) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('volume') // volume, change, name
  const [showCount, setShowCount] = useState(20)

  const filteredAndSortedPairs = useMemo(() => {
    let filtered = pairs.filter(pair => 
      pair.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pair.symbol.replace('USDT', '').toLowerCase().includes(searchQuery.toLowerCase())
    )

    // Sort pairs
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'volume':
          return b.quoteVolume - a.quoteVolume
        case 'change':
          return b.change - a.change
        case 'name':
          return a.symbol.localeCompare(b.symbol)
        default:
          return 0
      }
    })

    return filtered.slice(0, showCount)
  }, [pairs, searchQuery, sortBy, showCount])

  return (
    <div className="glass-effect rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">USDT Trading Pairs</h3>
        <div className="text-sm text-gray-400">
          {pairs.length} pairs available
        </div>
      </div>

      {/* Search and Filter */}
      <div className="mb-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search pairs (e.g., BTC, ETH, BNB)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:border-green-500 focus:outline-none"
          />
        </div>
        
        <div className="flex items-center space-x-3">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded px-3 py-1 text-white text-sm"
          >
            <option value="volume">Sort by Volume</option>
            <option value="change">Sort by Change</option>
            <option value="name">Sort by Name</option>
          </select>
          
          <select
            value={showCount}
            onChange={(e) => setShowCount(Number(e.target.value))}
            className="bg-gray-800 border border-gray-700 rounded px-3 py-1 text-white text-sm"
          >
            <option value={10}>Top 10</option>
            <option value={20}>Top 20</option>
            <option value={50}>Top 50</option>
            <option value={100}>Top 100</option>
          </select>
        </div>
      </div>

      {/* Market Summary */}
      {marketSummary && (
        <div className="mb-4 grid grid-cols-3 gap-2 text-xs">
          <div className="bg-gray-800/50 rounded p-2 text-center">
            <div className="text-gray-400">Total Volume</div>
            <div className="text-white font-semibold">
              ${(marketSummary.totalVolume / 1e9).toFixed(1)}B
            </div>
          </div>
          <div className="bg-green-500/10 rounded p-2 text-center">
            <div className="text-gray-400">Gainers</div>
            <div className="text-green-400 font-semibold">{marketSummary.gainers}</div>
          </div>
          <div className="bg-red-500/10 rounded p-2 text-center">
            <div className="text-gray-400">Losers</div>
            <div className="text-red-400 font-semibold">{marketSummary.losers}</div>
          </div>
        </div>
      )}

      {/* Pairs List */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {filteredAndSortedPairs.map((pair, index) => (
          <div
            key={pair.symbol}
            onClick={() => onPairSelect(pair.symbol)}
            className={`p-3 rounded-lg cursor-pointer transition-all duration-200 ${
              selectedPair === pair.symbol
                ? 'bg-green-500/20 border border-green-500/50'
                : 'bg-gray-800/50 hover:bg-gray-700/50 border border-transparent'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="text-sm font-medium text-white">
                  {pair.symbol.replace('USDT', '')}/USDT
                </div>
                <div className="text-xs text-gray-400">#{index + 1}</div>
              </div>
              
              <div className="text-right">
                <div className="text-sm font-semibold text-white">
                  ${pair.price.toFixed(pair.price < 1 ? 6 : 2)}
                </div>
                <div className={`flex items-center space-x-1 text-xs ${
                  pair.change >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {pair.change >= 0 ? 
                    <TrendingUp className="h-3 w-3" /> : 
                    <TrendingDown className="h-3 w-3" />
                  }
                  <span>{pair.change >= 0 ? '+' : ''}{pair.change.toFixed(2)}%</span>
                </div>
              </div>
            </div>
            
            <div className="mt-2 flex items-center justify-between text-xs text-gray-400">
              <div className="flex items-center space-x-1">
                <Volume2 className="h-3 w-3" />
                <span>${(pair.quoteVolume / 1e6).toFixed(1)}M</span>
              </div>
              <div>
                H: ${pair.high.toFixed(pair.high < 1 ? 6 : 2)} | 
                L: ${pair.low.toFixed(pair.low < 1 ? 6 : 2)}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredAndSortedPairs.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          <Search className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>No pairs found matching "{searchQuery}"</p>
        </div>
      )}
    </div>
  )
}

export default PairSelector