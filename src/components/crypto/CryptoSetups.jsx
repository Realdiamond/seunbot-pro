import React, { useEffect, useMemo, useState, useCallback } from 'react'
import { Target, RefreshCw, AlertTriangle, Filter, Zap, ArrowUp, ArrowDown, TrendingUp, TrendingDown, BarChart3, Waves, Triangle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { fetchCryptoSetups } from '../../services/CryptoAPIService'
import CoinBadge from './CoinBadge'

const setupTypes = ['All', 'Bullish Breakout', 'Bearish Breakdown', 'Consolidation']

const setupTypeColor = (t) => ({
  'Bullish Breakout': 'text-green-400',
  'Bearish Breakdown': 'text-red-400',
  'Consolidation': 'text-gray-400',
}[t] || 'text-gray-400')

const confidenceColor = (c) => (c === 'High' ? 'text-green-400' : c === 'Medium' ? 'text-yellow-400' : 'text-red-400')

const fmtPrice = (v) => {
  if (!v || v <= 0) return '—'
  return v >= 1 ? `$${v.toFixed(2)}` : `$${v.toPrecision(4)}`
}

export default function CryptoSetups() {
  const [page, setPage] = useState(1)
  const pageSize = 25
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [directionFilter, setDirectionFilter] = useState('All')
  const [setupTypeFilter, setSetupTypeFilter] = useState('All')
  const [minProbability, setMinProbability] = useState(0)
  const [sortBy, setSortBy] = useState('strength')
  const navigate = useNavigate()

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetchCryptoSetups({ page, pageSize })
      setData(res)
    } catch (err) {
      setError(err.message || 'Failed to load crypto setups.')
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => {
    load()
    
    // Auto-refresh every 5 minutes to match NGX pattern
    const interval = setInterval(load, 300000)
    return () => clearInterval(interval)
  }, [load])

  const sortedSetups = useMemo(() => {
    const list = (data?.setups || []).filter(s => {
      if (directionFilter !== 'All' && s.direction !== directionFilter) return false
      if (setupTypeFilter !== 'All' && s.setupType !== setupTypeFilter) return false
      if ((s.probability ?? 0) < minProbability) return false
      return true
    })
    return list.sort((a, b) => {
      switch (sortBy) {
        case 'probability': return (b.probability ?? 0) - (a.probability ?? 0)
        case 'riskReward': return parseFloat(b.riskReward) - parseFloat(a.riskReward)
        case 'symbol': return a.symbol.localeCompare(b.symbol)
        default: return (b.signalStrength ?? 0) - (a.signalStrength ?? 0)
      }
    })
  }, [data, directionFilter, setupTypeFilter, minProbability, sortBy])

  const bullish = (data?.setups || []).filter(s => s.weeklyTradeSetup === 'Bull' || s.direction === 'BUY').length
  const bearish = (data?.setups || []).filter(s => s.weeklyTradeSetup === 'Bear' || s.direction === 'SELL').length
  const totalPages = data?.metadata?.totalPages || 1

  return (
    <div className="space-y-6 fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <Target className="w-7 h-7 text-orange-400" />
            Crypto Weekly Setups
          </h1>
          <p className="text-gray-400 text-sm mt-0.5">
            {data?.highProbabilityCount ?? 0} strong signals · screening {data?.totalScanned ?? 0} crypto assets
            {data?.scanTime ? ` · ${new Date(data.scanTime).toLocaleTimeString()}` : ''}
          </p>
        </div>

        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500/20 hover:bg-orange-500/40 border border-orange-500/30 rounded-xl text-orange-400 text-sm font-medium transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stat cards — NGX style */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2"><BarChart3 className="h-4 w-4 text-orange-300" /><span className="text-orange-300 text-sm font-medium">Total Scanned</span></div>
          <div className="text-white text-xl font-bold">{data?.totalScanned ?? 0}</div>
          <div className="text-xs text-gray-400">Crypto Assets</div>
        </div>
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2"><Target className="h-4 w-4 text-yellow-400" /><span className="text-yellow-400 text-sm font-medium">Strong Signals</span></div>
          <div className="text-white text-xl font-bold">{data?.highProbabilityCount ?? 0}</div>
          <div className="text-xs text-gray-400">High Conviction</div>
        </div>
        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2"><TrendingUp className="h-4 w-4 text-green-400" /><span className="text-green-400 text-sm font-medium">Bullish</span></div>
          <div className="text-white text-xl font-bold">{bullish}</div>
          <div className="text-xs text-gray-400">Buy Bias</div>
        </div>
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2"><TrendingDown className="h-4 w-4 text-red-400" /><span className="text-red-400 text-sm font-medium">Bearish</span></div>
          <div className="text-white text-xl font-bold">{bearish}</div>
          <div className="text-xs text-gray-400">Sell Bias</div>
        </div>
      </div>

      {/* Filters — NGX style */}
      <div className="bg-gray-800/30 rounded-xl p-4 border border-gray-700/50">
        <div className="flex items-center space-x-2 mb-3">
          <Filter className="w-4 h-4 text-gray-400" />
          <span className="text-white font-medium text-sm">Filters & Sorting</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Direction</label>
            <select value={directionFilter} onChange={(e) => setDirectionFilter(e.target.value)}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-orange-500">
              {['All', 'BUY', 'SELL'].map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Setup Type</label>
            <select value={setupTypeFilter} onChange={(e) => setSetupTypeFilter(e.target.value)}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-orange-500">
              {setupTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Min Probability</label>
            <select value={minProbability} onChange={(e) => setMinProbability(Number(e.target.value))}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-orange-500">
              {[0, 25, 50, 70, 90].map(p => <option key={p} value={p}>{p}%+</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Sort By</label>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-orange-500">
              <option value="strength">Signal Strength</option>
              <option value="probability">Probability</option>
              <option value="riskReward">Risk/Reward</option>
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

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">{error}</div>
      )}

      {/* Setups table — NGX style */}
      <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-700/40 border-b border-gray-600">
                <th className="text-left py-3 px-4 text-gray-300 font-medium text-xs sm:text-sm">Asset</th>
                <th className="text-left py-3 px-4 text-gray-300 font-medium text-xs sm:text-sm">Setup</th>
                <th className="text-left py-3 px-4 text-gray-300 font-medium text-xs sm:text-sm">Probability</th>
                <th className="text-left py-3 px-4 text-gray-300 font-medium text-xs sm:text-sm hidden sm:table-cell">Price</th>
                <th className="text-left py-3 px-4 text-gray-300 font-medium text-xs sm:text-sm hidden md:table-cell">Target</th>
                <th className="text-left py-3 px-4 text-gray-300 font-medium text-xs sm:text-sm hidden md:table-cell">Stop Loss</th>
                <th className="text-left py-3 px-4 text-gray-300 font-medium text-xs sm:text-sm">R:R</th>
                <th className="text-left py-3 px-4 text-gray-300 font-medium text-xs sm:text-sm hidden lg:table-cell">Pattern</th>
                <th className="text-right py-3 px-4 text-gray-300 font-medium text-xs sm:text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && !data ? (
                <tr><td colSpan={9} className="text-center py-10 text-gray-400">
                  <RefreshCw className="h-6 w-6 mx-auto mb-2 animate-spin opacity-60" />
                  Loading crypto setups…
                </td></tr>
              ) : sortedSetups.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-10 text-gray-400">
                  <AlertTriangle className="h-6 w-6 mx-auto mb-2 opacity-50" />
                  No setups match the current filters.
                </td></tr>
              ) : (
                sortedSetups.map((s, i) => (
                  <tr key={`${s.symbol}-${i}`} className="border-b border-gray-700 hover:bg-gray-700/20 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <CoinBadge symbol={s.symbol} size="sm" />
                        <div>
                          <div className="text-white font-medium text-xs sm:text-sm">{s.symbol}</div>
                          <div className="text-[10px] text-gray-400">{s.sector}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className={`font-medium text-xs sm:text-sm ${setupTypeColor(s.setupType)}`}>{s.setupType}</div>
                      <div className="text-[10px] text-gray-400 flex items-center gap-1">
                        <span className={s.direction === 'BUY' ? 'text-green-400' : 'text-red-400'}>{s.direction}</span>
                        {s.isStrongSignal && <span className="px-1 bg-yellow-500/20 text-yellow-400 rounded text-[9px] uppercase">Strong</span>}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className={`font-bold text-sm sm:text-lg ${confidenceColor(s.confidence)}`}>{s.probability}%</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                          s.confidence === 'High' ? 'bg-green-500/20 text-green-400' :
                          s.confidence === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'
                        }`}>{s.confidence}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 hidden sm:table-cell">
                      <div className="text-white font-medium text-xs sm:text-sm">{fmtPrice(s.currentPrice)}</div>
                    </td>
                    <td className="py-3 px-4 hidden md:table-cell">
                      <div className="flex items-center gap-1"><ArrowUp className="h-3 w-3 text-green-400" />
                        <span className="text-green-400 font-medium text-xs sm:text-sm">{fmtPrice(s.targetPrice)}</span></div>
                    </td>
                    <td className="py-3 px-4 hidden md:table-cell">
                      <div className="flex items-center gap-1"><ArrowDown className="h-3 w-3 text-red-400" />
                        <span className="text-red-400 font-medium text-xs sm:text-sm">{fmtPrice(s.stopLoss)}</span></div>
                    </td>
                    <td className="py-3 px-4">
                      <div className={`font-bold text-sm sm:text-lg ${
                        parseFloat(s.riskReward) >= 2 ? 'text-green-400' :
                        parseFloat(s.riskReward) >= 1.5 ? 'text-yellow-400' : 'text-gray-400'
                      }`}>{s.riskReward}</div>
                    </td>
                    <td className="py-3 px-4 hidden lg:table-cell">
                      <div className="flex items-center gap-1.5 text-blue-300 text-xs"><Triangle className="w-3 h-3" />{s.geometricPattern || 'N/A'}</div>
                      <div className="flex items-center gap-1.5 text-cyan-300 text-xs"><Waves className="w-3 h-3" />{s.elliottWavesPattern && s.elliottWavesPattern !== 'No clear Elliott Wave pattern' ? s.elliottWavesPattern : 'N/A'}</div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => navigate('/crypto-analysis', { state: { symbol: s.symbol } })}
                        className="flex items-center gap-1 px-2 py-1 bg-purple-600 hover:bg-purple-700 rounded text-white text-[10px] sm:text-xs transition-colors ml-auto"
                        title={`Open ${s.symbol} in Crypto Analysis`}
                      >
                        <Zap className="h-3 w-3" />
                        <span className="hidden sm:inline">Analyze</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <div className="text-sm text-gray-400">
            Page {data?.metadata?.page || page} of {totalPages} ({data?.metadata?.totalItems ?? 0} total)
          </div>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1 || loading}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-sm font-medium text-white disabled:opacity-50 transition-colors">Previous</button>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages || loading}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-sm font-medium text-white disabled:opacity-50 transition-colors">Next</button>
          </div>
        </div>
      )}
    </div>
  )
}
