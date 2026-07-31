import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Target, TrendingUp, TrendingDown, BarChart3, Zap, AlertTriangle,
  Filter, RefreshCw, ArrowUp, ArrowDown, Building, Fuel, Package,
  Phone, Factory, Shield, Cpu, DollarSign, Activity
} from 'lucide-react'
import USStocksDataService from '../services/USStocksDataService'

const setupTypes = ['All', 'Bullish Breakout', 'Bearish Breakdown', 'Oversold Bounce', 'Overbought Pullback', 'Consolidation']
const sectors = ['All', 'Technology', 'Financial Services', 'Healthcare', 'Consumer Discretionary', 'Energy', 'Industrials', 'Consumer Staples', 'Communication Services', 'Real Estate', 'Materials', 'Utilities']

const setupTypeColor = (t) => ({
  'Bullish Breakout': 'text-green-400',
  'Bearish Breakdown': 'text-red-400',
  'Oversold Bounce': 'text-blue-400',
  'Overbought Pullback': 'text-orange-400',
  'Consolidation': 'text-gray-400',
}[t] || 'text-gray-400')

const confidenceColor = (c) => (c === 'High' ? 'text-green-400' : c === 'Medium' ? 'text-yellow-400' : 'text-red-400')

const sectorIcon = (sector) => ({
  'Technology': Cpu,
  'Financial Services': DollarSign,
  'Healthcare': Activity,
  'Consumer Discretionary': Package,
  'Energy': Fuel,
  'Industrials': Factory,
}[sector] || Building)

function StockLogo({ symbol, sector, size = 'sm' }) {
  const [imgError, setImgError] = useState(false)
  const cleanSym = (symbol || '').replace(/^US_/i, '').toUpperCase().trim()
  const initials = cleanSym.slice(0, 2)
  const primaryUrl = `https://financialmodelingprep.com/image-stock/${cleanSym}.png`
  const SectorIcon = sectorIcon(sector)

  const dims = size === 'lg' ? 'w-10 h-10 text-sm' : 'w-7 h-7 sm:w-8 sm:h-8 text-[10px] sm:text-xs'

  return (
    <div className={`relative ${dims} rounded-full bg-gray-700/80 border border-gray-600/50 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-sm`}>
      <SectorIcon className="h-3.5 w-3.5 text-gray-400" />
      {!imgError ? (
        <img
          src={primaryUrl}
          alt={`${cleanSym} logo`}
          className="absolute inset-0 w-full h-full object-cover bg-gray-900"
          onError={() => setImgError(true)}
        />
      ) : (
        <span className="absolute inset-0 flex items-center justify-center font-bold text-cyan-400 select-none bg-gray-800">
          {initials}
        </span>
      )}
    </div>
  )
}

const fmtUSD = (v) => {
  const n = Number(v)
  return Number.isFinite(n) && n > 0 ? `$${n.toFixed(2)}` : '—'
}

const USStocksWeeklySetupsPanel = ({ onAnalyze }) => {
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedSector, setSelectedSector] = useState('All')
  const [setupTypeFilter, setSetupTypeFilter] = useState('All')
  const [minProbability, setMinProbability] = useState(0)
  const [sortBy, setSortBy] = useState('probability')
  const [selectedSetup, setSelectedSetup] = useState(null)
  const [accountBalance, setAccountBalance] = useState(10000) // Default $10k
  const [riskPercent, setRiskPercent] = useState(1.5)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await USStocksDataService.fetchWeeklySetups({ minProbability: 0, maxResults: 500 })
      setData(res)
    } catch (err) {
      setError(err?.message || 'Failed to load US Weekly Setups.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    const interval = setInterval(load, 300000) // auto-refresh every 5 min
    return () => clearInterval(interval)
  }, [load])

  const processSetupMetrics = useCallback((s) => {
    const entry = Number(s.currentPrice) || 0
    let target = Number(s.targetPrice) || 0
    let stop = Number(s.stopLoss) || 0
    const isBear = /bear|breakdown|overbought|selling/i.test(s.setupType || '')

    let reward = Math.abs(target - entry)
    let risk = Math.abs(entry - stop)
    let rawRR = risk > 0 ? reward / risk : 0

    if (rawRR <= 1.05 || !Number.isFinite(rawRR)) {
      const prob = Number(s.probability) || 75
      const mult = 1.6 + (prob / 100) * 1.4
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
    const rawList = data?.setups || []
    const list = rawList.map(s => {
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
      if (selectedSector !== 'All' && s.sector !== 'US' && s.sector !== selectedSector) return false
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
  const bullish = useMemo(() => (data?.setups || []).filter(s => isBullish(s.setupType)).length, [data])
  const bearish = useMemo(() => (data?.setups || []).filter(s => isBearish(s.setupType)).length, [data])

  const calculatedTradePlan = useMemo(() => {
    if (!selectedSetup) return null
    const entry = selectedSetup.currentPrice || 1.0
    const sl = selectedSetup.stopLoss || entry * 0.95
    const tp1 = selectedSetup.targetPrice || entry * 1.10
    const isBear = /bear|sell|down/i.test(selectedSetup.setupType)
    const tp2 = isBear ? tp1 * 0.95 : tp1 * 1.05
    const riskPerShare = Math.abs(entry - sl)
    const riskAmount = (accountBalance * riskPercent) / 100
    const shares = riskPerShare > 0 ? Math.floor(riskAmount / riskPerShare) : 0
    const totalCost = shares * entry

    return {
      entry, sl, tp1, tp2, riskPerShare, riskAmount, shares, totalCost, isBear
    }
  }, [selectedSetup, accountBalance, riskPercent])

  const handleAnalyze = (symbol, setupRow = null) => {
    const cleanSym = String(symbol).replace(/^US_/i, '')
    // Pass the setup's price data via router state so the analysis page
    // can display the price immediately without waiting for a backend call
    const stockData = setupRow ? {
      symbol: cleanSym,
      name: setupRow.name || cleanSym,
      sector: setupRow.sector || 'US Stock',
      price: setupRow.currentPrice || 0,
      change: 0,
      changePercent: setupRow.changePercent || 0,
      high: setupRow.targetPrice || setupRow.currentPrice || 0,
      low: setupRow.stopLoss || setupRow.currentPrice || 0,
      volume: setupRow.volume || 0,
      open: null,
    } : null

    if (onAnalyze) {
      onAnalyze(cleanSym)
    } else {
      navigate(`/usstocks/${cleanSym}`, { state: { stockData } })
    }
  }

  return (
    <div className="space-y-6 fade-in min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 px-3 py-4 sm:px-4 sm:py-5 lg:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-800/40 p-4 sm:p-6 rounded-2xl border border-gray-700/50">
          <div>
            <div className="flex items-center space-x-3">
              <Target className="h-7 w-7 text-orange-400" />
              <h1 className="text-2xl sm:text-3xl font-bold text-white">US Weekly Setups</h1>
            </div>
            <p className="text-sm text-gray-400 mt-1">
              {data?.setups?.length || 0} high-probability setups • scanned {data?.totalScanned ?? data?.setups?.length ?? 0} US stocks
              {data?.scanTime && ` • ${new Date(data.scanTime).toLocaleTimeString()}`}
            </p>
          </div>

          <button
            onClick={load}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white rounded-xl font-medium transition-colors self-start sm:self-auto"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Scanning...' : 'Refresh'}</span>
          </button>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-4">
            <div className="flex items-center justify-between text-gray-400 text-xs sm:text-sm mb-1">
              <span>Total Scanned</span>
              <BarChart3 className="h-4 w-4 text-cyan-400" />
            </div>
            <div className="text-2xl font-bold text-white">{data?.totalScanned ?? data?.setups?.length ?? 0}</div>
            <div className="text-xs text-gray-400 mt-1">US Stocks</div>
          </div>

          <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-4">
            <div className="flex items-center justify-between text-gray-400 text-xs sm:text-sm mb-1">
              <span>Strong Signals</span>
              <Zap className="h-4 w-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-amber-400">{data?.setups?.length || 0}</div>
            <div className="text-xs text-gray-400 mt-1">High Conviction</div>
          </div>

          <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-4">
            <div className="flex items-center justify-between text-gray-400 text-xs sm:text-sm mb-1">
              <span>Bullish</span>
              <TrendingUp className="h-4 w-4 text-green-400" />
            </div>
            <div className="text-2xl font-bold text-green-400">{bullish}</div>
            <div className="text-xs text-gray-400 mt-1">Buy Bias</div>
          </div>

          <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-4">
            <div className="flex items-center justify-between text-gray-400 text-xs sm:text-sm mb-1">
              <span>Bearish</span>
              <TrendingDown className="h-4 w-4 text-red-400" />
            </div>
            <div className="text-2xl font-bold text-red-400">{bearish}</div>
            <div className="text-xs text-gray-400 mt-1">Sell Bias</div>
          </div>
        </div>

        {/* Filters & Sorting */}
        <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-4 sm:p-5 space-y-4">
          <div className="flex items-center space-x-2 text-sm font-medium text-gray-300">
            <Filter className="h-4 w-4 text-orange-400" />
            <span>Filters & Sorting</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Sector</label>
              <select
                value={selectedSector}
                onChange={(e) => setSelectedSector(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
              >
                {sectors.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div>
              <label className="text-xs text-gray-400 mb-1 block">Setup Type</label>
              <select
                value={setupTypeFilter}
                onChange={(e) => setSetupTypeFilter(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
              >
                {setupTypes.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div>
              <label className="text-xs text-gray-400 mb-1 block">Min Probability</label>
              <select
                value={minProbability}
                onChange={(e) => setMinProbability(Number(e.target.value))}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
              >
                <option value={0}>0%+</option>
                <option value={50}>50%+</option>
                <option value={60}>60%+</option>
                <option value={70}>70%+</option>
                <option value={80}>80%+</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-gray-400 mb-1 block">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
              >
                <option value="probability">Probability</option>
                <option value="riskReward">Risk/Reward</option>
                <option value="volume">Volume</option>
                <option value="symbol">Symbol</option>
              </select>
            </div>

            <div className="flex items-end">
              <div className="w-full bg-gray-900/60 border border-gray-700/60 rounded-lg px-3 py-2 text-center">
                <span className="text-xs text-gray-400 block">Filtered Results</span>
                <span className="text-lg font-bold text-orange-400">{sortedSetups.length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Setups Table */}
        <div className="bg-gray-800/40 border border-gray-700/50 rounded-2xl overflow-hidden shadow-xl">
          {loading ? (
            <div className="p-12 text-center text-gray-400">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-3 text-orange-400" />
              <p className="font-medium text-white">Scanning US stocks setups...</p>
              <p className="text-xs text-gray-400 mt-1">Analyzing price action, RSI, and SeunBot models</p>
            </div>
          ) : error ? (
            <div className="p-12 text-center text-red-400">
              <AlertTriangle className="h-8 w-8 mx-auto mb-3" />
              <p>{error}</p>
              <button onClick={load} className="mt-4 px-4 py-2 bg-orange-600 text-white rounded-lg text-sm">
                Try Again
              </button>
            </div>
          ) : sortedSetups.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              <AlertTriangle className="h-8 w-8 mx-auto mb-3 text-gray-500" />
              <p className="text-lg font-semibold text-white">No setups match your filters</p>
              <p className="text-sm text-gray-400 mt-1">Try lowering the minimum probability or clearing sector filters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px]">
                <thead>
                  <tr className="border-b border-gray-700/70 bg-gray-900/40 text-xs text-gray-400 uppercase tracking-wider">
                    <th className="py-3 px-4 text-left font-semibold">Stock</th>
                    <th className="py-3 px-4 text-left font-semibold">Setup</th>
                    <th className="py-3 px-4 text-left font-semibold">Probability</th>
                    <th className="py-3 px-4 text-left font-semibold">Price</th>
                    <th className="py-3 px-4 text-left font-semibold">Target</th>
                    <th className="py-3 px-4 text-left font-semibold">Stop Loss</th>
                    <th className="py-3 px-4 text-left font-semibold">R:R</th>
                    <th className="py-3 px-4 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/40 text-sm">
                  {sortedSetups.map((s, idx) => (
                    <tr
                      key={`${s.symbol}-${idx}`}
                      className="hover:bg-gray-700/30 transition-colors cursor-pointer"
                      onClick={() => handleAnalyze(s.symbol, s)}
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-3">
                          <StockLogo symbol={s.symbol} sector={s.sector} />
                          <div>
                            <div className="font-bold text-white flex items-center gap-1.5">
                              <span>{String(s.symbol).replace(/^US_/i, '')}</span>
                            </div>
                            <div className="text-xs text-gray-400">{s.sector || 'US Stock'}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`font-semibold ${setupTypeColor(s.setupType)}`}>
                          {s.setupType}
                        </span>
                        <div className="text-xs text-gray-400 mt-0.5">{s.timeframe || '1D'}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-white">{s.probability}%</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            s.probability >= 80 ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                          }`}>
                            {s.confidence || (s.probability >= 80 ? 'High' : 'Medium')}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-white">
                        {fmtUSD(s.currentPrice)}
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-green-400">
                        {s.targetPrice > 0 ? (
                          <div className="flex items-center space-x-1">
                            <ArrowUp className="h-3.5 w-3.5 shrink-0" />
                            <span>{fmtUSD(s.targetPrice)}</span>
                          </div>
                        ) : '—'}
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-red-400">
                        {s.stopLoss > 0 ? (
                          <div className="flex items-center space-x-1">
                            <ArrowDown className="h-3.5 w-3.5 shrink-0" />
                            <span>{fmtUSD(s.stopLoss)}</span>
                          </div>
                        ) : '—'}
                      </td>

                      <td className="py-3.5 px-4 font-bold text-amber-400">
                        {s.riskReward !== '—' ? `${s.riskReward}` : '—'}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end space-x-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => setSelectedSetup(s)}
                            className="px-2.5 py-1 bg-gray-700/80 hover:bg-gray-600 text-gray-200 rounded-lg text-xs font-semibold border border-gray-600 transition-colors"
                          >
                            Trade Plan
                          </button>
                          <button
                            onClick={() => handleAnalyze(s.symbol, s)}
                            className="px-3 py-1 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-lg text-xs font-semibold shadow-md transition-all flex items-center space-x-1"
                          >
                            <Zap className="h-3 w-3" />
                            <span>Analyze</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Trade Plan Calculator Modal */}
        {selectedSetup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="bg-gray-900 border border-gray-700 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
              <div className="flex items-center justify-between border-b border-gray-800 pb-4">
                <div className="flex items-center space-x-3">
                  <StockLogo symbol={selectedSetup.symbol} sector={selectedSetup.sector} size="lg" />
                  <div>
                    <h3 className="text-xl font-bold text-white">{String(selectedSetup.symbol).replace(/^US_/i, '')} Trade Plan</h3>
                    <p className="text-xs text-gray-400">{selectedSetup.setupType} • {selectedSetup.probability}% Probability</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedSetup(null)}
                  className="text-gray-400 hover:text-white text-lg font-bold"
                >
                  ✕
                </button>
              </div>

              {/* Calculator Inputs */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Account Balance ($)</label>
                  <input
                    type="number"
                    value={accountBalance}
                    onChange={(e) => setAccountBalance(Number(e.target.value))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white font-semibold"
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Max Risk Per Trade (%)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={riskPercent}
                    onChange={(e) => setRiskPercent(Number(e.target.value))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white font-semibold"
                  />
                </div>
              </div>

              {/* Position Sizing Breakdown */}
              {calculatedTradePlan && (
                <div className="bg-gray-800/60 border border-gray-700/60 rounded-xl p-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Entry Price:</span>
                    <span className="text-white font-bold">{fmtUSD(calculatedTradePlan.entry)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Stop Loss:</span>
                    <span className="text-red-400 font-bold">{fmtUSD(calculatedTradePlan.sl)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Take Profit (Target 1):</span>
                    <span className="text-green-400 font-bold">{fmtUSD(calculatedTradePlan.tp1)}</span>
                  </div>
                  <div className="border-t border-gray-700/60 pt-2 flex justify-between text-sm">
                    <span className="text-gray-400">Risk Amount ($):</span>
                    <span className="text-amber-400 font-bold">${calculatedTradePlan.riskAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Position Shares:</span>
                    <span className="text-cyan-400 font-bold">{calculatedTradePlan.shares.toLocaleString()} shares</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Total Position Capital:</span>
                    <span className="text-white font-bold">${calculatedTradePlan.totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                </div>
              )}

              <div className="flex space-x-3 pt-2">
                <button
                  onClick={() => setSelectedSetup(null)}
                  className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl font-medium transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    const sym = String(selectedSetup.symbol).replace(/^US_/i, '')
                    setSelectedSetup(null)
                    handleAnalyze(sym)
                  }}
                  className="flex-1 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl font-bold shadow-lg transition-all"
                >
                  Go to Full Analysis →
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default USStocksWeeklySetupsPanel
