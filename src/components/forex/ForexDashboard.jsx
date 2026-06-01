import React, { useState, useMemo } from 'react'
import {
  Repeat, BarChart3, TrendingUp, TrendingDown, Zap,
  RefreshCw, AlertCircle, Search, Activity, ChevronRight
} from 'lucide-react'
import { useForexPairs } from '../../hooks/useForexPairs'
import StatCard from '../crypto/StatCard'
import MiniPairCards from '../crypto/MiniPairCards'
import PairTable from '../crypto/PairTable'
import { fmtVol, coinSymbol } from '../crypto/utils'

const formatPair = (symbol = '') =>
  symbol.length === 6 ? `${symbol.slice(0, 3)}/${symbol.slice(3)}` : symbol

export default function ForexDashboard({ onSelectPair }) {
  const { pairs, metadata, loading, error, lastUpdate, refetch } = useForexPairs()

  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('volume24h')
  const [sortDir, setSortDir] = useState('desc')
  const [selected, setSelected] = useState(null)
  const [refreshing, setRefreshing] = useState(false)

  const filtered = useMemo(() => {
    let d = [...pairs]
    if (search.trim()) {
      const q = search.toLowerCase()
      d = d.filter(r => r.symbol.toLowerCase().includes(q) || r.name?.toLowerCase().includes(q))
    }
    d.sort((a, b) => {
      const av = a[sortBy] ?? 0
      const bv = b[sortBy] ?? 0
      return sortDir === 'desc' ? bv - av : av - bv
    })
    return d
  }, [pairs, search, sortBy, sortDir])

  const totalVol = useMemo(() => pairs.reduce((s, m) => s + (m.volume24h || 0), 0), [pairs])
  const gainers = useMemo(() => pairs.filter(m => (m.priceChangePercent24h ?? 0) > 0).length, [pairs])
  const losers = useMemo(() => pairs.filter(m => (m.priceChangePercent24h ?? 0) < 0).length, [pairs])
  const topGainer = useMemo(() =>
    [...pairs].sort((a, b) => (b.priceChangePercent24h ?? 0) - (a.priceChangePercent24h ?? 0))[0], [pairs])

  const handleSort = (col) => {
    if (sortBy === col) setSortDir(d => (d === 'desc' ? 'asc' : 'desc'))
    else {
      setSortBy(col)
      setSortDir('desc')
    }
  }

  const handleSelect = (pair) => {
    setSelected(pair)
    onSelectPair?.(pair)
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await refetch()
    setRefreshing(false)
  }

  return (
    <div className="space-y-6 fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <Repeat className="w-8 h-8 text-cyan-400" /> Forex Markets
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            {metadata?.totalItems ?? pairs.length} tracked FX pairs · Real-time SeunBot data
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdate && <span className="text-xs text-gray-500">Updated {lastUpdate.toLocaleTimeString()}</span>}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-600/20 hover:bg-cyan-600/40 border border-cyan-500/30 rounded-xl text-cyan-300 text-sm font-medium transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="24h Volume" value={fmtVol(totalVol)} sub="Across all pairs" color="blue" icon={BarChart3} />
        <StatCard label="Gainers" value={loading ? '…' : `${gainers} / ${pairs.length}`} sub="Positive 24h" color="green" icon={TrendingUp} />
        <StatCard label="Losers" value={loading ? '…' : `${losers} / ${pairs.length}`} sub="Negative 24h" color="amber" icon={TrendingDown} />
        <StatCard
          label="Top Gainer"
          value={topGainer ? `${formatPair(topGainer.symbol)} +${(topGainer.priceChangePercent24h ?? 0).toFixed(2)}%` : '…'}
          sub={topGainer ? String(topGainer.currentPrice) : ''}
          color="purple"
          icon={Zap}
        />
      </div>

      <MiniPairCards items={pairs} loading={loading} selectedCoin={selected} onSelect={handleSelect} />

      <div className="glass-effect rounded-2xl overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 border-b border-white/10">
          <div className="flex items-center gap-2 text-white font-semibold">
            <Activity className="w-5 h-5 text-cyan-400" />
            All Pairs
            <span className="text-xs text-gray-400 font-normal">({filtered.length})</span>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search pair…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/60 w-48"
            />
          </div>
        </div>

        <PairTable
          rows={filtered}
          loading={loading}
          sortBy={sortBy}
          sortDir={sortDir}
          onSort={handleSort}
          selectedCoin={selected}
          onSelect={(pair) => handleSelect(coinSymbol(pair))}
        />

        {selected && (
          <div className="p-4 border-t border-white/10 bg-cyan-500/5">
            <button
              onClick={() => onSelectPair?.(selected)}
              className="flex items-center gap-2 text-sm text-cyan-300 hover:text-cyan-200 font-medium transition-colors"
            >
              <Zap className="w-4 h-4" />
              Run full analysis for {formatPair(selected)}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
