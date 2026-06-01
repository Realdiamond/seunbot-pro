import React, { useState, useMemo } from 'react'
import {
  Repeat, BarChart3, TrendingUp, TrendingDown, Zap,
  RefreshCw, AlertCircle, Search, Activity, ChevronRight
} from 'lucide-react'
import { useForexPairs } from '../../hooks/useForexPairs'
import StatCard from '../crypto/StatCard'
import ForexMiniPairCards from './ForexMiniPairCards'
import ForexPairTable from './ForexPairTable'
import { fmtVol, formatPair, fmt, fmtPrice } from './utils'

export default function ForexDashboard({ onSelectPair }) {
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)

  const { pairs, metadata, loading, error, lastUpdate, refetch } = useForexPairs(page, pageSize)

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
          {metadata?.serverTime && (
            <span className="text-xs text-gray-500">Server {new Date(metadata.serverTime).toLocaleTimeString()}</span>
          )}
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
        <StatCard label="24h Volume" value={fmtVol(totalVol)} sub="Across this page" color="blue" icon={BarChart3} />
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

      <ForexMiniPairCards items={pairs} loading={loading} selectedPair={selected} onSelect={handleSelect} />

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

        <ForexPairTable
          rows={filtered}
          loading={loading}
          sortBy={sortBy}
          sortDir={sortDir}
          onSort={handleSort}
          selectedPair={selected}
          onSelect={handleSelect}
        />

        {selected && (
          <div className="p-4 border-t border-white/10 bg-cyan-500/5 space-y-3">
            <button
              onClick={() => onSelectPair?.(selected)}
              className="flex items-center gap-2 text-sm text-cyan-300 hover:text-cyan-200 font-medium transition-colors"
            >
              <Zap className="w-4 h-4" />
              Run full analysis for {formatPair(selected)}
              <ChevronRight className="w-4 h-4" />
            </button>
            {pairs.find(p => p.symbol === selected) && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-gray-400">
                {(() => {
                  const pair = pairs.find(p => p.symbol === selected)
                  return (
                    <>
                      <div>
                        <div className="text-gray-500">ID</div>
                        <div className="text-white break-all">{pair.id ?? '—'}</div>
                      </div>
                      <div>
                        <div className="text-gray-500">Exchange</div>
                        <div className="text-white">{pair.exchange ?? '—'}</div>
                      </div>
                      <div>
                        <div className="text-gray-500">Sector</div>
                        <div className="text-white">{pair.sector ?? '—'}</div>
                      </div>
                      <div>
                        <div className="text-gray-500">Last Updated</div>
                        <div className="text-white">{pair.lastUpdated ? new Date(pair.lastUpdated).toLocaleString() : '—'}</div>
                      </div>
                      <div>
                        <div className="text-gray-500">24h Change</div>
                        <div className="text-white">{fmt(pair.priceChange24h, 6)}</div>
                      </div>
                      <div>
                        <div className="text-gray-500">24h %</div>
                        <div className="text-white">{(pair.priceChangePercent24h ?? 0).toFixed(2)}%</div>
                      </div>
                      <div>
                        <div className="text-gray-500">Price</div>
                        <div className="text-white">{fmtPrice(pair.currentPrice)}</div>
                      </div>
                      <div>
                        <div className="text-gray-500">Image URL</div>
                        <div className="text-white">{pair.imageUrl ?? '—'}</div>
                      </div>
                    </>
                  )
                })()}
              </div>
            )}
          </div>
        )}
      </div>

      {metadata && metadata.totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 px-2">
          <div className="text-sm text-gray-400">
            Page {metadata.page} of {metadata.totalPages} ({metadata.totalItems} total · {metadata.pageSize} per page)
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-sm font-medium text-white disabled:opacity-50 transition-colors"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(p => Math.min(metadata.totalPages, p + 1))}
              disabled={page === metadata.totalPages || loading}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-sm font-medium text-white disabled:opacity-50 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
