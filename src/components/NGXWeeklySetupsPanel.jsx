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

  const sortedSetups = useMemo(() => {
    const list = (data?.setups || []).filter(s => {
      if (selectedSector !== 'All' && s.sector !== selectedSector) return false
      if (setupTypeFilter !== 'All' && s.setupType !== setupTypeFilter) return false
      if ((s.probability ?? 0) < minProbability) return false
      return true
    })
    return list.sort((a, b) => {
      switch (sortBy) {
        case 'riskReward': return parseFloat(b.riskReward) - parseFloat(a.riskReward)
        case 'volume': return (b.volume ?? 0) - (a.volume ?? 0)
        case 'symbol': return a.symbol.localeCompare(b.symbol)
        default: return (b.probability ?? 0) - (a.probability ?? 0)
      }
    })
  }, [data, selectedSector, setupTypeFilter, minProbability, sortBy])

  const isBullish = (t) => /bull|oversold|breakout|momentum/i.test(t || '')
  const isBearish = (t) => /bear|breakdown|overbought|selling/i.test(t || '')
  const bullish = (data?.setups || []).filter(s => isBullish(s.setupType)).length
  const bearish = (data?.setups || []).filter(s => isBearish(s.setupType)).length

  // Route to the NGX analysis page. Prefer the parent-provided onAnalyze (keeps the
  // /ngx-analysis flow), else fall back to the per-symbol route.
  const analyze = (symbol) => {
    if (onAnalyze) onAnalyze(symbol)
    else navigate(`/ngx/${symbol}`)
  }

  return (
    <div className="space-y-6 fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <Target className="w-7 h-7 text-orange-400" />
            NGX Weekly Setups
          </h1>
          <p className="text-gray-400 text-sm mt-0.5">
            {data?.highProbabilityCount ?? 0} high-probability setups · scanned {data?.totalScanned ?? 0} stocks
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
          <div className="text-white text-xl font-bold">{data?.totalScanned ?? 0}</div>
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
                    <tr key={`${s.symbol}-${i}`} className="border-b border-gray-700 hover:bg-gray-700/20 transition-colors">
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
                        <button
                          onClick={() => analyze(s.symbol)}
                          className="flex items-center gap-1 px-2 py-1 bg-purple-600 hover:bg-purple-700 rounded text-white text-[10px] sm:text-xs transition-colors ml-auto"
                          title={`Open ${s.symbol} in NGX Analysis`}
                        >
                          <Zap className="h-3 w-3" />
                          <span className="hidden sm:inline">Analyze</span>
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default NGXWeeklySetupsPanel
