import React, { useEffect, useMemo, useState, useCallback } from 'react'
import { Target, RefreshCw, AlertTriangle, Filter, Zap, ArrowUp, ArrowDown, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { fetchForexSetups, triggerForexScan } from '../../services/ForexAPIService'
import { formatPair } from './utils'
import ForexPairBadge from './ForexPairBadge'

const setupTypes = ['All', 'Bullish Breakout', 'Bearish Breakdown', 'Oversold Bounce', 'Overbought Pullback', 'Consolidation']

const setupTypeColor = (t) => ({
  'Bullish Breakout': 'text-green-400',
  'Bearish Breakdown': 'text-red-400',
  'Oversold Bounce': 'text-blue-400',
  'Overbought Pullback': 'text-orange-400',
  'Consolidation': 'text-gray-400',
}[t] || 'text-gray-400')

const confidenceColor = (c) => (c === 'High' ? 'text-green-400' : c === 'Medium' ? 'text-yellow-400' : 'text-red-400')

export default function ForexSetups() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [setupTypeFilter, setSetupTypeFilter] = useState('All')
  const [minProbability, setMinProbability] = useState(70)
  const [sortBy, setSortBy] = useState('probability')
  const [selectedSetup, setSelectedSetup] = useState(null)
  const [accountBalance, setAccountBalance] = useState(10000)
  const [riskPercent, setRiskPercent] = useState(1.5)
  const navigate = useNavigate()

  const load = useCallback(async (forceTrigger = false) => {
    setLoading(true)
    setError(null)
    try {
      if (forceTrigger) {
        await triggerForexScan().catch(() => null)
      }
      const res = await fetchForexSetups()
      setData(res)
    } catch (err) {
      setError(err.message || 'Failed to load forex setups.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const sortedSetups = useMemo(() => {
    const list = (data?.setups || []).filter(s => {
      const matchesType = setupTypeFilter === 'All' || s.setupType === setupTypeFilter
      const matchesProb = (s.probability ?? 0) >= minProbability
      return matchesType && matchesProb
    })

    return [...list].sort((a, b) => {
      if (sortBy === 'probability') return (b.probability ?? 0) - (a.probability ?? 0)
      if (sortBy === 'riskReward') return (parseFloat(b.riskReward) || 0) - (parseFloat(a.riskReward) || 0)
      return (a.symbol || '').localeCompare(b.symbol || '')
    })
  }, [data, setupTypeFilter, minProbability, sortBy])

  // Trade Plan Position Sizing calculation
  const calculatedTradePlan = useMemo(() => {
    if (!selectedSetup) return null
    const entry = selectedSetup.currentPrice || 1.0
    const sl = selectedSetup.stopLoss || entry * 0.98
    const tp1 = selectedSetup.targetPrice || entry * 1.04
    const isBearish = /bear|sell|down/i.test(selectedSetup.setupType)
    const tp2 = isBearish ? tp1 * 0.98 : tp1 * 1.02
    const riskPerShare = Math.abs(entry - sl)
    const riskAmount = (accountBalance * riskPercent) / 100
    const units = riskPerShare > 0 ? Math.round(riskAmount / riskPerShare) : 0
    const lots = riskPerShare > 0 ? (riskAmount / (riskPerShare * 100000)).toFixed(2) : '0.00'

    return {
      entry,
      sl,
      tp1,
      tp2,
      riskPerShare,
      riskAmount,
      units,
      lots,
      isBearish
    }
  }, [selectedSetup, accountBalance, riskPercent])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-800/40 p-4 sm:p-6 rounded-2xl border border-gray-700/50">
        <div>
          <div className="flex items-center gap-2">
            <Target className="h-6 w-6 text-cyan-400" />
            <h1 className="text-xl sm:text-2xl font-bold text-white">Forex Weekly Setups</h1>
          </div>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            {data?.highProbabilityCount ?? 0} high-probability setups · scanned {data?.totalScanned ?? 0} pairs
            {data?.scanTime && (
              <span className="ml-2 text-gray-500">• Updated {new Date(data.scanTime).toLocaleTimeString()}</span>
            )}
          </p>
        </div>
        <button
          onClick={() => load(true)}
          disabled={loading}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white rounded-xl text-xs sm:text-sm font-medium transition-colors"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-gray-800/30 border border-gray-700/50 p-4 rounded-xl">
          <div className="text-xs text-gray-400">Total Scanned</div>
          <div className="text-lg sm:text-2xl font-bold text-white mt-1">{data?.totalScanned ?? 0}</div>
          <div className="text-[10px] text-gray-500 mt-0.5">Forex Pairs</div>
        </div>
        <div className="bg-gray-800/30 border border-gray-700/50 p-4 rounded-xl">
          <div className="text-xs text-gray-400">Signals Found</div>
          <div className="text-lg sm:text-2xl font-bold text-cyan-400 mt-1">{data?.highProbabilityCount ?? 0}</div>
          <div className="text-[10px] text-gray-500 mt-0.5">Strong Signals</div>
        </div>
        <div className="bg-gray-800/30 border border-gray-700/50 p-4 rounded-xl">
          <div className="text-xs text-gray-400">Bullish</div>
          <div className="text-lg sm:text-2xl font-bold text-green-400 mt-1">
            {(data?.setups || []).filter(s => !/bear|sell|down/i.test(s.setupType)).length}
          </div>
          <div className="text-[10px] text-gray-500 mt-0.5">Buy Setups</div>
        </div>
        <div className="bg-gray-800/30 border border-gray-700/50 p-4 rounded-xl">
          <div className="text-xs text-gray-400">Bearish</div>
          <div className="text-lg sm:text-2xl font-bold text-red-400 mt-1">
            {(data?.setups || []).filter(s => /bear|sell|down/i.test(s.setupType)).length}
          </div>
          <div className="text-[10px] text-gray-500 mt-0.5">Sell Setups</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-800/40 p-4 rounded-xl border border-gray-700/50 space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-300 uppercase tracking-wider">
          <Filter className="h-3.5 w-3.5 text-cyan-400" />
          <span>Filters & Sorting</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Setup Type</label>
            <select value={setupTypeFilter} onChange={(e) => setSetupTypeFilter(e.target.value)}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500">
              {setupTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Min Probability</label>
            <select value={minProbability} onChange={(e) => setMinProbability(Number(e.target.value))}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500">
              {[50, 60, 70, 80, 90].map(p => <option key={p} value={p}>{p}%+</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Sort By</label>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500">
              <option value="probability">Probability</option>
              <option value="riskReward">Risk/Reward</option>
              <option value="symbol">Symbol</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">{error}</div>
      )}

      {/* Setups table */}
      <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-700/40 border-b border-gray-600">
                <th className="text-left py-3 px-4 text-gray-300 font-medium text-xs sm:text-sm">Pair</th>
                <th className="text-left py-3 px-4 text-gray-300 font-medium text-xs sm:text-sm">Setup</th>
                <th className="text-left py-3 px-4 text-gray-300 font-medium text-xs sm:text-sm">Probability</th>
                <th className="text-left py-3 px-4 text-gray-300 font-medium text-xs sm:text-sm hidden sm:table-cell">Price</th>
                <th className="text-left py-3 px-4 text-gray-300 font-medium text-xs sm:text-sm hidden md:table-cell">Target</th>
                <th className="text-left py-3 px-4 text-gray-300 font-medium text-xs sm:text-sm hidden md:table-cell">Stop Loss</th>
                <th className="text-left py-3 px-4 text-gray-300 font-medium text-xs sm:text-sm">R:R</th>
                <th className="text-right py-3 px-4 text-gray-300 font-medium text-xs sm:text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="text-center py-10 text-gray-400">
                  <RefreshCw className="h-6 w-6 mx-auto mb-2 animate-spin opacity-60" />
                  Loading forex setups…
                </td></tr>
              ) : sortedSetups.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-10 text-gray-400">
                  <AlertTriangle className="h-6 w-6 mx-auto mb-2 opacity-50" />
                  No setups match the current filters.
                </td></tr>
              ) : (
                sortedSetups.map((s, i) => (
                  <tr
                    key={`${s.symbol}-${i}`}
                    onClick={() => setSelectedSetup(s)}
                    className="border-b border-gray-700 hover:bg-gray-700/30 transition-colors cursor-pointer"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <ForexPairBadge symbol={s.symbol} size="sm" />
                        <div>
                          <div className="text-white font-medium text-xs sm:text-sm">{formatPair(s.symbol)}</div>
                          <div className="text-[10px] text-gray-400">{s.sector || 'Forex'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className={`font-medium text-xs sm:text-sm ${setupTypeColor(s.setupType)}`}>{s.setupType}</div>
                      <div className="text-[10px] text-gray-400">{s.timeframe}</div>
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
                      <div className="text-white font-medium text-xs sm:text-sm">{s.currentPrice > 0 ? s.currentPrice.toFixed(4) : '—'}</div>
                    </td>
                    <td className="py-3 px-4 hidden md:table-cell">
                      <div className="flex items-center gap-1"><ArrowUp className="h-3 w-3 text-green-400" />
                        <span className="text-green-400 font-medium text-xs sm:text-sm">{s.targetPrice > 0 ? s.targetPrice.toFixed(4) : '—'}</span></div>
                    </td>
                    <td className="py-3 px-4 hidden md:table-cell">
                      <div className="flex items-center gap-1"><ArrowDown className="h-3 w-3 text-red-400" />
                        <span className="text-red-400 font-medium text-xs sm:text-sm">{s.stopLoss > 0 ? s.stopLoss.toFixed(4) : '—'}</span></div>
                    </td>
                    <td className="py-3 px-4">
                      <div className={`font-bold text-sm sm:text-lg ${
                        parseFloat(s.riskReward) >= 2 ? 'text-green-400' :
                        parseFloat(s.riskReward) >= 1.5 ? 'text-yellow-400' : 'text-gray-400'
                      }`}>{s.riskReward}</div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setSelectedSetup(s)}
                          className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-cyan-400 text-[10px] sm:text-xs font-medium transition-colors"
                        >
                          Trade Plan
                        </button>
                        <button
                          onClick={() => navigate('/forex-analysis', { state: { symbol: s.symbol } })}
                          className="flex items-center gap-1 px-2 py-1 bg-cyan-600 hover:bg-cyan-700 rounded text-white text-[10px] sm:text-xs transition-colors"
                          title={`Run full analysis for ${s.symbol}`}
                        >
                          <Zap className="h-3 w-3" />
                          <span className="hidden sm:inline">Analyze</span>
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

      {/* Dynamic Trade Plan Modal */}
      {selectedSetup && calculatedTradePlan && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl max-w-2xl w-full p-6 space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/20 rounded-xl text-cyan-400">
                  <Target className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-white">{formatPair(selectedSetup.symbol)}</h2>
                    <span className={`text-xs px-2 py-0.5 rounded font-semibold ${
                      calculatedTradePlan.isBearish ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'
                    }`}>
                      {calculatedTradePlan.isBearish ? 'SELL PLAN' : 'BUY PLAN'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {selectedSetup.setupType} • {selectedSetup.probability}% Probability ({selectedSetup.confidence} Confidence)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedSetup(null)}
                className="text-gray-400 hover:text-white text-xl font-bold p-1 rounded-lg hover:bg-gray-800"
              >
                ✕
              </button>
            </div>

            {/* Trade Parameters Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-gray-800/40 p-3 rounded-xl border border-gray-700/50">
                <div className="text-[10px] text-gray-400">Entry Price</div>
                <div className="text-base font-bold text-white mt-1">{calculatedTradePlan.entry.toFixed(4)}</div>
                <div className="text-[10px] text-gray-500">Market Price</div>
              </div>
              <div className="bg-gray-800/40 p-3 rounded-xl border border-gray-700/50">
                <div className="text-[10px] text-gray-400">Take Profit 1</div>
                <div className="text-base font-bold text-green-400 mt-1">{calculatedTradePlan.tp1.toFixed(4)}</div>
                <div className="text-[10px] text-green-500/80">Primary Target</div>
              </div>
              <div className="bg-gray-800/40 p-3 rounded-xl border border-gray-700/50">
                <div className="text-[10px] text-gray-400">Take Profit 2</div>
                <div className="text-base font-bold text-emerald-300 mt-1">{calculatedTradePlan.tp2.toFixed(4)}</div>
                <div className="text-[10px] text-emerald-500/80">Extended Target</div>
              </div>
              <div className="bg-gray-800/40 p-3 rounded-xl border border-gray-700/50">
                <div className="text-[10px] text-gray-400">Stop Loss</div>
                <div className="text-base font-bold text-red-400 mt-1">{calculatedTradePlan.sl.toFixed(4)}</div>
                <div className="text-[10px] text-red-500/80">Risk Limit</div>
              </div>
            </div>

            {/* Position Calculator */}
            <div className="bg-gray-800/30 p-4 rounded-xl border border-gray-700/50 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">Risk & Position Calculator</h3>
                <span className="text-xs font-bold text-cyan-400">R:R Ratio {selectedSetup.riskReward}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Account Capital ($)</label>
                  <input
                    type="number"
                    value={accountBalance}
                    onChange={(e) => setAccountBalance(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Risk Per Trade (%)</label>
                  <select
                    value={riskPercent}
                    onChange={(e) => setRiskPercent(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500"
                  >
                    <option value={0.5}>0.5% (Conservative)</option>
                    <option value={1.0}>1.0% (Standard)</option>
                    <option value={1.5}>1.5% (Balanced)</option>
                    <option value={2.0}>2.0% (Aggressive)</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-700/50">
                <div>
                  <div className="text-[10px] text-gray-400">Max Risk Amount</div>
                  <div className="text-sm font-bold text-yellow-400">${calculatedTradePlan.riskAmount.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-400">Recommended Lot Size</div>
                  <div className="text-sm font-bold text-cyan-400">{calculatedTradePlan.lots} Standard Lots</div>
                </div>
              </div>
            </div>

            {/* Technical Signals & Catalyst */}
            {selectedSetup.technicalSignals && selectedSetup.technicalSignals.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs text-gray-400 font-medium">Technical Confluence Signals</div>
                <div className="flex flex-wrap gap-2">
                  {selectedSetup.technicalSignals.map((sig, idx) => (
                    <span key={idx} className="text-xs px-2.5 py-1 bg-cyan-950/60 border border-cyan-700/40 text-cyan-300 rounded-lg">
                      ✓ {sig}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {selectedSetup.catalyst && (
              <div className="p-3 bg-gray-800/40 border border-gray-700/40 rounded-xl text-xs text-gray-300">
                <span className="font-semibold text-white">Setup Catalyst: </span>
                {selectedSetup.catalyst}
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setSelectedSetup(null)}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-xs font-medium transition-colors"
              >
                Close Plan
              </button>
              <button
                onClick={() => {
                  setSelectedSetup(null)
                  navigate('/forex-analysis', { state: { symbol: selectedSetup.symbol } })
                }}
                className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-medium transition-colors"
              >
                <Zap className="h-4 w-4" />
                <span>Full Chart Analysis</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
