import React, { useState } from 'react'
import { Target, RefreshCw, AlertTriangle, Filter, Waves, Triangle } from 'lucide-react'
import { useCryptoSignalsRanking } from '../../hooks/useCryptoSignalsRanking'
import { useNavigate } from 'react-router-dom'
import CoinBadge from './CoinBadge'

export default function CryptoSetups() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(100)
  const [directionFilter, setDirectionFilter] = useState('All') // All, BUY, SELL
  const [setupFilter, setSetupFilter] = useState('All') // All, Bull, Bear, Neutral

  const { data, loading, error, refetch } = useCryptoSignalsRanking(page, pageSize)
  const navigate = useNavigate()

  const signals = data?.signals || []
  
  const filteredSignals = signals.filter(s => {
    if (directionFilter !== 'All' && s.direction !== directionFilter) return false
    if (setupFilter !== 'All' && s.weeklyTradeSetup !== setupFilter) return false
    return true
  })

  // Sort by signal strength then confidence
  const sortedSignals = [...filteredSignals].sort((a, b) => b.signalStrength - a.signalStrength || b.confidenceLevel - a.confidenceLevel)

  return (
    <div className="space-y-6 fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <Target className="w-7 h-7 text-orange-400" />
            Crypto Weekly Setups
          </h1>
          <p className="text-gray-400 text-sm mt-0.5">
            Market-wide screener tracking {data?.metadata?.totalItems || 0} crypto assets
          </p>
        </div>
        
        <button
          onClick={refetch} disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500/20 hover:bg-orange-500/40 border border-orange-500/30 rounded-xl text-orange-400 text-sm font-medium transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="bg-gray-800/30 rounded-xl p-4 border border-gray-700/50">
        <div className="flex items-center space-x-2 mb-3">
          <Filter className="w-4 h-4 text-gray-400" />
          <span className="text-white font-medium text-sm">Filters</span>
        </div>
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Direction</label>
            <select
              value={directionFilter}
              onChange={(e) => setDirectionFilter(e.target.value)}
              className="w-32 px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-orange-500"
            >
              <option value="All">All</option>
              <option value="BUY">BUY</option>
              <option value="SELL">SELL</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Weekly Setup</label>
            <select
              value={setupFilter}
              onChange={(e) => setSetupFilter(e.target.value)}
              className="w-32 px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-orange-500"
            >
              <option value="All">All</option>
              <option value="Bull">Bullish</option>
              <option value="Bear">Bearish</option>
              <option value="Neutral">Neutral</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-900/50 border-b border-gray-700">
                <th className="text-left py-4 px-5 text-gray-400 font-medium text-sm">Asset</th>
                <th className="text-left py-4 px-5 text-gray-400 font-medium text-sm">Signal</th>
                <th className="text-left py-4 px-5 text-gray-400 font-medium text-sm">Strength</th>
                <th className="text-left py-4 px-5 text-gray-400 font-medium text-sm">Weekly Setup</th>
                <th className="text-left py-4 px-5 text-gray-400 font-medium text-sm">Pattern</th>
                <th className="text-left py-4 px-5 text-gray-400 font-medium text-sm">Elliott Wave</th>
              </tr>
            </thead>
            <tbody>
              {loading && !data ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-gray-400">Loading setups...</td>
                </tr>
              ) : sortedSignals.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-gray-400">
                    <AlertTriangle className="w-6 h-6 mx-auto mb-2 opacity-50" />
                    No setups found matching filters.
                  </td>
                </tr>
              ) : (
                sortedSignals.map(s => (
                  <tr key={s.symbol} className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors group cursor-pointer" onClick={() => navigate('/crypto-analysis', { state: { symbol: s.symbol }})}>
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <CoinBadge symbol={s.symbol} size="sm" />
                        <span className="font-bold text-white group-hover:text-purple-400 transition-colors">{s.symbol}</span>
                      </div>
                    </td>
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-2">
                        <span className={`font-bold ${s.direction === 'BUY' ? 'text-green-400' : 'text-red-400'}`}>
                          {s.direction}
                        </span>
                        {s.isStrongSignal && (
                          <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-[10px] uppercase font-bold rounded-full">
                            Strong
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-5">
                      <div className="text-white font-medium">{s.signalStrength}/10</div>
                      <div className="text-xs text-gray-500">Conf: {s.confidenceLevel}%</div>
                    </td>
                    <td className="py-4 px-5">
                      <div className={`flex items-center gap-1.5 font-medium ${s.weeklyTradeSetup === 'Bull' ? 'text-green-400' : s.weeklyTradeSetup === 'Bear' ? 'text-red-400' : 'text-gray-400'}`}>
                        <Target className="w-3.5 h-3.5" />
                        {s.weeklyTradeSetup}
                      </div>
                    </td>
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-1.5 text-blue-300 text-sm">
                        <Triangle className="w-3.5 h-3.5" />
                        {s.geometricPattern || 'N/A'}
                      </div>
                    </td>
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-1.5 text-cyan-300 text-sm">
                        <Waves className="w-3.5 h-3.5" />
                        {s.elliottWavesPattern && s.elliottWavesPattern !== 'No clear Elliott Wave pattern' ? s.elliottWavesPattern : 'N/A'}
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
