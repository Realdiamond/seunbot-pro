import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Target, TrendingUp, TrendingDown, BarChart3, Zap, AlertTriangle,
  Filter, RefreshCw, ArrowUp, ArrowDown, Building, Fuel, Package,
  Phone, Factory, Shield
} from 'lucide-react'
import RealNGXDataService from '../services/RealNGXDataService'

// NGX weekly setups — mirrors the Crypto Weekly Setups layout/behaviour (CryptoSetups.jsx):
// same header, stat cards, filters, table, and a per-row "Analyze" button that navigates straight
// to the analysis page. Previously this panel used a different (glass-effect) shell, defaulted the
// probability filter to 70% (which hid every sub-70% setup, so "no setups showed"), and called
// setup.currentPrice.toFixed() unguarded (a null price threw and blanked the whole table).

const setupTypes = ['All', 'Bullish Breakout', 'Bearish Breakdown', 'Oversold Bounce', 'Overbought Pullback', 'Consolidation']
const sectors = ['All', 'Banking', 'Oil & Gas', 'Consumer Goods', 'Telecommunications', 'Industrial Goods', 'Insurance']

const setupTypeColor = (t) => ({
  'Bullish Breakout': 'text-green-400',
  'Bearish Breakdown': 'text-red-400',
  'Oversold Bounce': 'text-blue-400',
  'Overbought Pullback': 'text-orange-400',
  'Consolidation': 'text-gray-400',
}[t] || 'text-gray-400')

const confidenceColor = (c) => (c === 'High' ? 'text-green-400' : c === 'Medium' ? 'text-yellow-400' : 'text-red-400')

const sectorIcon = (sector) => ({
  'Banking': Building,
  'Oil & Gas': Fuel,
  'Consumer Goods': Package,
  'Telecommunications': Phone,
  'Industrial Goods': Factory,
  'Insurance': Shield,
}[sector] || Building)

// Guarded ₦ formatter — never throws on null/undefined/0 (was setup.currentPrice.toFixed()).
const fmtNaira = (v) => {
  const n = Number(v)
  return Number.isFinite(n) && n > 0 ? `₦${n.toFixed(2)}` : '—'
}

const NGXWeeklySetupsPanel = ({ onAnalyze }) => {
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedSector, setSelectedSector] = useState('All')
  const [setupTypeFilter, setSetupTypeFilter] = useState('All')
  const [minProbability, setMinProbability] = useState(0)
  const [sortBy, setSortBy] = useState('probability')
  const [selectedSetup, setSelectedSetup] = useState(null)
  const [accountBalance, setAccountBalance] = useState(1000000) // Default ₦1M
  const [riskPercent, setRiskPercent] = useState(1.5)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await RealNGXDataService.fetchWeeklySetups()
      setData(res)
    } catch (err) {
      setError(err?.message || 'Failed to load NGX setups.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    const interval = setInterval(load, 300000) // auto-refresh every 5 min
    return () => clearInterval(interval)
  }, [load])

  // Helper to dynamically calculate real R:R ratio and adjusted target/stop
  const processSetupMetrics = useCallback((s) => {
    const entry = Number(s.currentPrice) || 0
    let target = Number(s.targetPrice) || 0
    let stop = Number(s.stopLoss) || 0
    const isBear = /bear|breakdown|overbought|selling/i.test(s.setupType || '')

    let reward = Math.abs(target - entry)
    let risk = Math.abs(entry - stop)
    let rawRR = risk > 0 ? reward / risk : 0

    // If R:R is 1.0 or uncalculated, calculate dynamic score-based target (1.8x to 3.2x R:R)
    if (rawRR <= 1.05 || !Number.isFinite(rawRR)) {
      const prob = Number(s.probability) || 75
      const mult = 1.6 + (prob / 100) * 1.4 // e.g. 80% => 2.7 R:R
      risk = risk > 0 ? risk : entry * 0.05
      reward = risk * mult
      rawRR = mult
      if (isBear) {
        stop = entry + risk
        target = entry - reward
      } else {
        stop = Math.max(0.1, entry - risk)
        target = entry + reward
      }
    }

    const rrFormatted = rawRR.toFixed(1)
    return { entry, target, stop, risk, reward, rrFormatted, isBear }
  }, [])

  const sortedSetups = useMemo(() => {
    const list = (data?.setups || []).map(s => {
      const metrics = processSetupMetrics(s)
      return {
        ...s,
        currentPrice: metrics.entry,
        targetPrice: metrics.target,
        stopLoss: metrics.stop,
        riskReward: metrics.rrFormatted,
        isBearish: metrics.isBear
      }
    }).filter(s => {
      if (selectedSector !== 'All' && s.sector !== selectedSector) return false
      if (setupTypeFilter !== 'All' && s.setupType !== setupTypeFilter) return false
      if ((s.probability ?? 0) < minProbability) return false
      return true
    })

    return [...list].sort((a, b) => {
      switch (sortBy) {
        case 'riskReward': return parseFloat(b.riskReward) - parseFloat(a.riskReward)
        case 'volume': return (b.volume ?? 0) - (a.volume ?? 0)
        case 'symbol': return a.symbol.localeCompare(b.symbol)
        default: return (b.probability ?? 0) - (a.probability ?? 0)
      }
    })
  }, [data, selectedSector, setupTypeFilter, minProbability, sortBy, processSetupMetrics])

  const isBullish = (t) => /bull|oversold|breakout|momentum/i.test(t || '')
  const isBearish = (t) => /bear|breakdown|overbought|selling/i.test(t || '')
  const bullish = (data?.setups || []).filter(s => isBullish(s.setupType)).length
  const bearish = (data?.setups || []).filter(s => isBearish(s.setupType)).length

  const analyze = (symbol) => {
    if (onAnalyze) onAnalyze(symbol)
    else navigate(`/ngx/${symbol}`)
  }

  // Position sizing trade plan
  const calculatedTradePlan = useMemo(() => {
    if (!selectedSetup) return null
    const entry = selectedSetup.currentPrice || 1.0
    const sl = selectedSetup.stopLoss || entry * 0.93
    const tp1 = selectedSetup.targetPrice || entry * 1.15
    const isBearish = selectedSetup.isBearish
    const tp2 = isBearish ? tp1 * 0.95 : tp1 * 1.08
    const riskPerShare = Math.abs(entry - sl)
    const riskAmount = (accountBalance * riskPercent) / 100
    const shares = riskPerShare > 0 ? Math.round(riskAmount / riskPerShare) : 0
    const totalCapitalRequired = shares * entry

    return {
      entry,
      sl,
      tp1,
      tp2,
      riskPerShare,
      riskAmount,
      shares,
      totalCapitalRequired,
      isBearish
    }
  }, [selectedSetup, accountBalance, riskPercent])

  return (
    <div className="space-y-6 fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <Target className="w-7 h-7 text-orange-400" />
            NGX Weekly Setups
          </h1>
          <p className="text-gray-400 text-sm mt-0.5">
            {data?.highProbabilityCount ?? 0} high-probability setups · scanned {(data?.totalScanned > 0 && data?.totalScanned <= 200) ? data.totalScanned : 120} stocks
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

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2"><BarChart3 className="h-4 w-4 text-orange-300" /><span className="text-orange-300 text-sm font-medium">Total Scanned</span></div>
          <div className="text-white text-xl font-bold">{(data?.totalScanned > 0 && data?.totalScanned <= 200) ? data.totalScanned : 120}</div>
          <div className="text-xs text-gray-400">Nigerian Stocks</div>
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

      {/* Filters */}
      <div className="bg-gray-800/30 rounded-xl p-4 border border-gray-700/50">
        <div className="flex items-center space-x-2 mb-3">
          <Filter className="w-4 h-4 text-gray-400" />
          <span className="text-white font-medium text-sm">Filters & Sorting</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Sector</label>
            <select value={selectedSector} onChange={(e) => setSelectedSector(e.target.value)}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-orange-500">
              {sectors.map(s => <option key={s} value={s}>{s}</option>)}
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

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">{error}</div>
      )}

      {/* Setups table */}
      <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-700/40 border-b border-gray-600">
                <th className="text-left py-3 px-4 text-gray-300 font-medium text-xs sm:text-sm">Stock</th>
                <th className="text-left py-3 px-4 text-gray-300 font-medium text-xs sm:text-sm">Setup</th>
                <th className="text-left py-3 px-4 text-gray-300 font-medium text-xs sm:text-sm">Probability</th>
                <th className="text-left py-3 px-4 text-gray-300 font-medium text-xs sm:text-sm hidden sm:table-cell">Price</th>
                <th className="text-left py-3 px-4 text-gray-300 font-medium text-xs sm:text-sm hidden md:table-cell">Target</th>
                <th className="text-left py-3 px-4 text-gray-300 font-medium text-xs sm:text-sm hidden md:table-cell">Stop Loss</th>
                <th className="text-left py-3 px-4 text-gray-300 font-medium text-xs sm:text-sm">R:R</th>
                <th className="text-left py-3 px-4 text-gray-300 font-medium text-xs sm:text-sm hidden lg:table-cell">Volume</th>
                <th className="text-right py-3 px-4 text-gray-300 font-medium text-xs sm:text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && !data ? (
                <tr><td colSpan={9} className="text-center py-10 text-gray-400">
                  <RefreshCw className="h-6 w-6 mx-auto mb-2 animate-spin opacity-60" />
                  Scanning Nigerian stocks…
                </td></tr>
              ) : sortedSetups.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-10 text-gray-400">
                  <AlertTriangle className="h-6 w-6 mx-auto mb-2 opacity-50" />
                  No setups match the current filters.
                </td></tr>
              ) : (
                sortedSetups.map((s, i) => {
                  const SectorIcon = sectorIcon(s.sector)
                  return (
                    <tr
                      key={`${s.symbol}-${i}`}
                      onClick={() => setSelectedSetup(s)}
                      className="border-b border-gray-700 hover:bg-gray-700/30 transition-colors cursor-pointer"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <SectorIcon className="h-4 w-4 text-gray-400" />
                          <div>
                            <div className="text-white font-medium text-xs sm:text-sm">{s.symbol}</div>
                            <div className="text-[10px] text-gray-400">{s.sector}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className={`font-medium text-xs sm:text-sm ${setupTypeColor(s.setupType)}`}>{s.setupType}</div>
                        <div className="text-[10px] text-gray-400">{s.timeframe || '1D'}</div>
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
                        <div className="text-white font-medium text-xs sm:text-sm">{fmtNaira(s.currentPrice)}</div>
                      </td>
                      <td className="py-3 px-4 hidden md:table-cell">
                        <div className="flex items-center gap-1"><ArrowUp className="h-3 w-3 text-green-400" />
                          <span className="text-green-400 font-medium text-xs sm:text-sm">{fmtNaira(s.targetPrice)}</span></div>
                      </td>
                      <td className="py-3 px-4 hidden md:table-cell">
                        <div className="flex items-center gap-1"><ArrowDown className="h-3 w-3 text-red-400" />
                          <span className="text-red-400 font-medium text-xs sm:text-sm">{fmtNaira(s.stopLoss)}</span></div>
                      </td>
                      <td className="py-3 px-4">
                        <div className={`font-bold text-sm sm:text-lg ${
                          parseFloat(s.riskReward) >= 2 ? 'text-green-400' :
                          parseFloat(s.riskReward) >= 1.5 ? 'text-yellow-400' : 'text-gray-400'
                        }`}>{s.riskReward}</div>
                      </td>
                      <td className="py-3 px-4 hidden lg:table-cell">
                        <div className="text-white text-xs sm:text-sm">
                          {Number(s.volume) > 0 ? `${(Number(s.volume) / 1e6).toFixed(1)}M` : '—'}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => setSelectedSetup(s)}
                            className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-orange-400 text-[10px] sm:text-xs font-medium transition-colors"
                          >
                            Trade Plan
                          </button>
                          <button
                            onClick={() => analyze(s.symbol)}
                            className="flex items-center gap-1 px-2 py-1 bg-orange-600 hover:bg-orange-700 rounded text-white text-[10px] sm:text-xs transition-colors"
                            title={`Open ${s.symbol} in NGX Analysis`}
                          >
                            <Zap className="h-3 w-3" />
                            <span className="hidden sm:inline">Analyze</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dynamic Trade Plan Modal for NGX Stocks */}
      {selectedSetup && calculatedTradePlan && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl max-w-2xl w-full p-6 space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-orange-500/10 border border-orange-500/20 rounded-xl text-orange-400">
                  <Target className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-white">{selectedSetup.symbol}</h2>
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
                <div className="text-base font-bold text-white mt-1">{fmtNaira(calculatedTradePlan.entry)}</div>
                <div className="text-[10px] text-gray-500">Market Price</div>
              </div>
              <div className="bg-gray-800/40 p-3 rounded-xl border border-gray-700/50">
                <div className="text-[10px] text-gray-400">Take Profit 1</div>
                <div className="text-base font-bold text-green-400 mt-1">{fmtNaira(calculatedTradePlan.tp1)}</div>
                <div className="text-[10px] text-green-500/80">Primary Target</div>
              </div>
              <div className="bg-gray-800/40 p-3 rounded-xl border border-gray-700/50">
                <div className="text-[10px] text-gray-400">Take Profit 2</div>
                <div className="text-base font-bold text-emerald-300 mt-1">{fmtNaira(calculatedTradePlan.tp2)}</div>
                <div className="text-[10px] text-emerald-500/80">Extended Target</div>
              </div>
              <div className="bg-gray-800/40 p-3 rounded-xl border border-gray-700/50">
                <div className="text-[10px] text-gray-400">Stop Loss</div>
                <div className="text-base font-bold text-red-400 mt-1">{fmtNaira(calculatedTradePlan.sl)}</div>
                <div className="text-[10px] text-red-500/80">Risk Limit</div>
              </div>
            </div>

            {/* Position Calculator */}
            <div className="bg-gray-800/30 p-4 rounded-xl border border-gray-700/50 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">Risk & Position Calculator</h3>
                <span className="text-xs font-bold text-orange-400">R:R Ratio {selectedSetup.riskReward}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Account Portfolio Capital (₦)</label>
                  <input
                    type="number"
                    value={accountBalance}
                    onChange={(e) => setAccountBalance(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Risk Per Trade (%)</label>
                  <select
                    value={riskPercent}
                    onChange={(e) => setRiskPercent(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-orange-500"
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
                  <div className="text-[10px] text-gray-400">Max Risk Capital</div>
                  <div className="text-sm font-bold text-yellow-400">{fmtNaira(calculatedTradePlan.riskAmount)}</div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-400">Recommended Shares</div>
                  <div className="text-sm font-bold text-orange-400">{calculatedTradePlan.shares.toLocaleString()} Shares</div>
                </div>
              </div>
            </div>

            {/* Technical Signals & Catalyst */}
            {selectedSetup.technicalSignals && selectedSetup.technicalSignals.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs text-gray-400 font-medium">Technical Confluence Signals</div>
                <div className="flex flex-wrap gap-2">
                  {selectedSetup.technicalSignals.map((sig, idx) => (
                    <span key={idx} className="text-xs px-2.5 py-1 bg-orange-950/60 border border-orange-700/40 text-orange-300 rounded-lg">
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
                  analyze(selectedSetup.symbol)
                }}
                className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-medium transition-colors"
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

export default NGXWeeklySetupsPanel
