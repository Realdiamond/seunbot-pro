import React, { useMemo, useState } from 'react'
import { Target, RefreshCw, AlertTriangle, Filter, Zap } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useForexPairs } from '../../hooks/useForexPairs'
import PairTable from '../crypto/PairTable'

export default function ForexSetups() {
  const { pairs, metadata, loading, error, refetch } = useForexPairs()
  const [directionFilter, setDirectionFilter] = useState('All')
  const [selected, setSelected] = useState(null)
  const navigate = useNavigate()

  const filteredPairs = useMemo(() => {
    let data = [...pairs]
    if (directionFilter === 'Up') data = data.filter(p => (p.priceChangePercent24h ?? 0) > 0)
    if (directionFilter === 'Down') data = data.filter(p => (p.priceChangePercent24h ?? 0) < 0)
    data.sort((a, b) => Math.abs(b.priceChangePercent24h ?? 0) - Math.abs(a.priceChangePercent24h ?? 0))
    return data
  }, [pairs, directionFilter])

  return (
    <div className="space-y-6 fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <Target className="w-7 h-7 text-cyan-300" />
            Forex Weekly Setups
          </h1>
          <p className="text-gray-400 text-sm mt-0.5">
            Showing top 24h movers for {metadata?.totalItems ?? pairs.length} forex pairs
          </p>
        </div>

        <button
          onClick={refetch}
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
            <label className="text-xs text-gray-400 mb-1 block">Direction (24h)</label>
            <select
              value={directionFilter}
              onChange={(e) => setDirectionFilter(e.target.value)}
              className="w-32 px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500"
            >
              <option value="All">All</option>
              <option value="Up">Up</option>
              <option value="Down">Down</option>
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
        <PairTable
          rows={filteredPairs}
          loading={loading}
          sortBy="priceChangePercent24h"
          sortDir="desc"
          onSort={() => {}}
          selectedCoin={selected}
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
    </div>
  )
}
