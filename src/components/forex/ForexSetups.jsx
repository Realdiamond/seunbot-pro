import React, { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { Target, RefreshCw, AlertTriangle, Filter, Zap } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useForexPairs } from '../../hooks/useForexPairs'
import ForexPairTable from './ForexPairTable'

const API_BASE = import.meta.env?.VITE_SEUNBOT_API_BASE_URL || ''

const setupColor = (type = '') =>
  /bull|oversold|breakout/i.test(type) && !/bear|breakdown|overbought/i.test(type) ? 'text-green-400'
    : /bear|breakdown|overbought|selling/i.test(type) ? 'text-red-400'
    : 'text-gray-300'

const confColor = (c) => (c === 'High' ? 'text-green-400' : c === 'Medium' ? 'text-yellow-400' : 'text-gray-400')
const fmt = (n, d = 4) => (n == null ? '—' : Number(n).toLocaleString('en-US', { maximumFractionDigits: d }))

export default function ForexSetups() {
  // Kept for the fallback 24h-movers view + the "run full analysis" navigation.
  const { pairs, metadata, loading: pairsLoading, error: pairsError, refetch } = useForexPairs(1, 100)
  const [directionFilter, setDirectionFilter] = useState('All')
  const [selected, setSelected] = useState(null)
  const navigate = useNavigate()

  const [setups, setSetups] = useState(null)
  const [setupsLoading, setSetupsLoading] = useState(false)
  const [setupsMeta, setSetupsMeta] = useState(null)

  const loadSetups = async () => {
    setSetupsLoading(true)
    try {
      const res = await axios.get(`${API_BASE}/api/ForexAnalysis/dashboard/setups`, {
        params: { minProbability: 50, maxResults: 50 }, timeout: 90000
      })
      const data = res.data || {}
      setSetups(Array.isArray(data.setups) ? data.setups : [])
      setSetupsMeta({ totalScanned: data.totalScanned, count: data.highProbabilityCount })
    } catch (err) {
      console.warn('Forex setups unavailable, falling back to 24h movers:', err?.message)
      setSetups(null) // null => use fallback pairs view
    } finally {
      setSetupsLoading(false)
    }
  }

  useEffect(() => { loadSetups() }, [])

  const filteredSetups = useMemo(() => {
    if (!Array.isArray(setups)) return []
    let data = [...setups]
    if (directionFilter === 'Up') data = data.filter(s => setupColor(s.setupType) === 'text-green-400')
    if (directionFilter === 'Down') data = data.filter(s => setupColor(s.setupType) === 'text-red-400')
    return data.sort((a, b) => (b.probability ?? 0) - (a.probability ?? 0))
  }, [setups, directionFilter])

  const filteredPairs = useMemo(() => {
    let data = [...pairs]
    if (directionFilter === 'Up') data = data.filter(p => (p.priceChangePercent24h ?? 0) > 0)
    if (directionFilter === 'Down') data = data.filter(p => (p.priceChangePercent24h ?? 0) < 0)
    data.sort((a, b) => Math.abs(b.priceChangePercent24h ?? 0) - Math.abs(a.priceChangePercent24h ?? 0))
    return data
  }, [pairs, directionFilter])

  const usingSetups = Array.isArray(setups)
  const loading = usingSetups ? setupsLoading : pairsLoading

  return (
    <div className="space-y-6 fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <Target className="w-7 h-7 text-cyan-300" />
            Forex Weekly Setups
          </h1>
          <p className="text-gray-400 text-sm mt-0.5">
            {usingSetups
              ? `${setupsMeta?.count ?? filteredSetups.length} high-probability setups from ${setupsMeta?.totalScanned ?? '—'} pairs scanned`
              : `Showing top 24h movers for ${metadata?.totalItems ?? pairs.length} forex pairs`}
          </p>
        </div>

        <button
          onClick={() => (usingSetups ? loadSetups() : refetch())}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/40 border border-cyan-500/30 rounded-xl text-cyan-300 text-sm font-medium transition-all disabled:opacity-50"
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
              className="w-32 px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500"
            >
              <option value="All">All</option>
              <option value="Up">Bullish</option>
              <option value="Down">Bearish</option>
            </select>
          </div>
        </div>
      </div>

      {pairsError && !usingSetups && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
          {pairsError}
        </div>
      )}

      {usingSetups ? (
        <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 text-xs uppercase tracking-wider border-b border-gray-700/60">
                <th className="text-left py-3 px-4 font-medium">Pair</th>
                <th className="text-left py-3 px-4 font-medium">Setup</th>
                <th className="text-right py-3 px-4 font-medium">Probability</th>
                <th className="text-right py-3 px-4 font-medium">Price</th>
                <th className="text-right py-3 px-4 font-medium">Target</th>
                <th className="text-right py-3 px-4 font-medium">Stop</th>
                <th className="text-right py-3 px-4 font-medium">R:R</th>
                <th className="py-3 px-4"></th>
              </tr>
            </thead>
            <tbody>
              {filteredSetups.map((s, i) => (
                <tr key={i} className="border-b border-gray-700/40 last:border-0 hover:bg-gray-700/20">
                  <td className="py-3 px-4 font-semibold text-white">{s.symbol}</td>
                  <td className={`py-3 px-4 font-medium ${setupColor(s.setupType)}`}>{s.setupType}</td>
                  <td className="py-3 px-4 text-right">
                    <span className={confColor(s.confidence)}>{s.probability}%</span>
                  </td>
                  <td className="py-3 px-4 text-right text-gray-200">{fmt(s.currentPrice)}</td>
                  <td className="py-3 px-4 text-right text-green-400/80">{fmt(s.targetPrice)}</td>
                  <td className="py-3 px-4 text-right text-red-400/80">{fmt(s.stopLoss)}</td>
                  <td className="py-3 px-4 text-right text-gray-300">1:{s.riskReward}</td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => navigate('/forex-analysis', { state: { symbol: s.symbol } })}
                      className="text-cyan-300 hover:text-cyan-200"
                      title={`Run full analysis for ${s.symbol}`}
                    >
                      <Zap className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && filteredSetups.length === 0 && (
            <div className="py-10 text-center text-gray-400">
              <AlertTriangle className="w-6 h-6 mx-auto mb-2 opacity-50" />
              No forex setups match the current filter.
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl overflow-hidden">
            <ForexPairTable
              rows={filteredPairs}
              loading={loading}
              sortBy="priceChangePercent24h"
              sortDir="desc"
              onSort={() => {}}
              selectedPair={selected}
              onSelect={(pair) => setSelected(pair)}
            />
          </div>
          {!loading && filteredPairs.length === 0 && (
            <div className="py-10 text-center text-gray-400">
              <AlertTriangle className="w-6 h-6 mx-auto mb-2 opacity-50" />
              No forex pairs match the current filters.
            </div>
          )}
          {selected && (
            <div className="p-4 border border-cyan-500/20 rounded-xl bg-cyan-500/5">
              <button
                onClick={() => navigate('/forex-analysis', { state: { symbol: selected } })}
                className="flex items-center gap-2 text-sm text-cyan-300 hover:text-cyan-200 font-medium transition-colors"
              >
                <Zap className="w-4 h-4" />
                Run full analysis for {selected}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
