import React, { useState, useMemo } from 'react'
import { Globe, BarChart3, TrendingUp, TrendingDown, Zap,
         RefreshCw, AlertCircle, Search, Activity, ChevronRight } from 'lucide-react'
import { useCryptoDashboard }    from '../../hooks/useCryptoDashboard'
import { useCryptoPairs }        from '../../hooks/useCryptoPairs'
import { useLivePriceStream }    from '../../hooks/useLivePriceStream'
import StatCard      from './StatCard'
import MiniPairCards from './MiniPairCards'
import PairTable     from './PairTable'
import { fmtVol, coinSymbol, Skeleton } from './utils'

export default function CryptoDashboard({ onSelectPair }) {
  const { market, loading: mktLoading, error: mktErr, lastUpdate, refetch } = useCryptoDashboard()
  const { pairs,  loading: pairsLoading } = useCryptoPairs()

  const [search,     setSearch]     = useState('')
  const [sortBy,     setSortBy]     = useState('volume24h')
  const [sortDir,    setSortDir]    = useState('desc')
  const [selected,   setSelected]   = useState(null)
  const [refreshing, setRefreshing] = useState(false)

  const merged = useMemo(() => {
    const dataSource = market.length > 0 ? market : pairs;
    if (!dataSource || !dataSource.length) return []
    const pairMap = Object.fromEntries((pairs ?? []).map(p => [p.symbol, p]))
    return dataSource.map(m => ({ ...m, name: pairMap[m.symbol]?.name ?? m.symbol }))
  }, [market, pairs])

  // SSE — only watch the symbols currently in the merged list (visible on screen)
  const visibleSymbols = useMemo(() => merged.map(m => m.symbol), [merged])
  const { prices: ssePrices, connected: sseConnected } = useLivePriceStream(visibleSymbols)


  const filtered = useMemo(() => {
    let d = [...merged]
    // Overlay SSE live prices — replaces polling-fetched price with push-updated price
    if (Object.keys(ssePrices).length > 0) {
      d = d.map(row => {
        const live = ssePrices[row.symbol]
        return live != null ? { ...row, currentPrice: live } : row
      })
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      d = d.filter(r => r.symbol.toLowerCase().includes(q))
    }
    d.sort((a, b) => {
      const av = a[sortBy] ?? 0; const bv = b[sortBy] ?? 0
      return sortDir === 'desc' ? bv - av : av - bv
    })
    return d
  }, [merged, ssePrices, search, sortBy, sortDir])

  const totalVol   = useMemo(() => merged.reduce((s, m) => s + (m.volume24h || 0), 0), [merged])
  const gainers    = useMemo(() => merged.filter(m => (m.priceChangePercent24h ?? 0) > 0).length, [merged])
  const losers     = useMemo(() => merged.filter(m => (m.priceChangePercent24h ?? 0) < 0).length, [merged])
  const topGainer  = useMemo(() =>
    [...merged].sort((a,b) => (b.priceChangePercent24h??0)-(a.priceChangePercent24h??0))[0], [merged])

  const handleSort = (col) => {
    if (sortBy === col) setSortDir(d => d === 'desc' ? 'asc' : 'desc')
    else { setSortBy(col); setSortDir('desc') }
  }

  const handleSelect = (coin) => {
    setSelected(coin)
    onSelectPair?.(coin + 'USDT')
  }

  const handleRefresh = async () => {
    setRefreshing(true); await refetch(); setRefreshing(false)
  }

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <Globe className="w-8 h-8 text-blue-400" /> Crypto Markets
          </h1>
          <p className="text-gray-400 text-sm mt-1">22 tracked USDT pairs · Real-time SeunBot data</p>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdate && <span className="text-xs text-gray-500">Updated {lastUpdate.toLocaleTimeString()}</span>}
          <button
            onClick={handleRefresh} disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/30 rounded-xl text-blue-400 text-sm font-medium transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
      </div>

      {/* Error */}
      {mktErr && (
        <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm">{mktErr}</span>
        </div>
      )}

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="24h Volume"  value={fmtVol(totalVol)} sub="Across all 22 pairs" color="blue"   icon={BarChart3} />
        <StatCard label="Gainers"     value={mktLoading ? '…' : `${gainers} / ${merged.length}`} sub="Positive 24h" color="green"  icon={TrendingUp} />
        <StatCard label="Losers"      value={mktLoading ? '…' : `${losers} / ${merged.length}`}  sub="Negative 24h" color="amber"  icon={TrendingDown} />
        <StatCard
          label="Top Gainer"
          value={topGainer ? `${coinSymbol(topGainer.symbol)} +${(topGainer.priceChangePercent24h??0).toFixed(2)}%` : '…'}
          sub={topGainer ? String(topGainer.currentPrice) : ''}
          color="purple" icon={Zap}
        />
      </div>

      {/* Mini cards */}
      <MiniPairCards items={merged} loading={mktLoading} selectedCoin={selected} onSelect={handleSelect} />

      {/* Full table */}
      <div className="glass-effect rounded-2xl overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 border-b border-white/10">
          <div className="flex items-center gap-2 text-white font-semibold">
            <Activity className="w-5 h-5 text-blue-400" />
            All Pairs
            <span className="text-xs text-gray-400 font-normal">({filtered.length})</span>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text" placeholder="Search pair…" value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/60 w-48"
            />
          </div>
        </div>

        <PairTable
          rows={filtered} loading={mktLoading}
          sortBy={sortBy} sortDir={sortDir} onSort={handleSort}
          selectedCoin={selected} onSelect={handleSelect}
        />

        {selected && (
          <div className="p-4 border-t border-white/10 bg-blue-500/5">
            <button
              onClick={() => onSelectPair?.(selected + 'USDT')}
              className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 font-medium transition-colors"
            >
              <Zap className="w-4 h-4" />
              Run full analysis for {selected}USDT
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
