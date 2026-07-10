import React, { useState, memo } from 'react'
import { ArrowUpRight, ArrowDownRight } from 'lucide-react'
import CoinBadge from './CoinBadge'
import { fmtPrice, fmtVol, coinSymbol, Skeleton } from './utils'

function SortTh({ col, label, sortBy, sortDir, onSort, align = 'right' }) {
  const active = sortBy === col
  return (
    <th
      role="button"
      tabIndex={0}
      onClick={() => onSort(col)}
      onKeyDown={(e) => e.key === 'Enter' && onSort(col)}
      className={`py-3 text-${align} text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer select-none hover:text-white transition-colors pr-4`}
    >
      {label}
      {active && <span className="ml-1 opacity-80">{sortDir === 'desc' ? '↓' : '↑'}</span>}
    </th>
  )
}

// memo — only re-renders when its own props change, not when parent re-renders
const PairRow = memo(function PairRow({ item, rank, selected, onSelect }) {
  const pct = item.priceChangePercent24h ?? 0
  const up  = pct >= 0
  return (
    <tr
      role="button"
      tabIndex={0}
      onClick={() => onSelect(coinSymbol(item.symbol))}
      onKeyDown={(e) => e.key === 'Enter' && onSelect(coinSymbol(item.symbol))}
      className={`group cursor-pointer transition-colors hover:bg-white/5 ${selected ? 'bg-blue-500/10' : ''}`}
    >
      <td className="py-3 pl-4 pr-2 text-gray-500 text-sm">{rank}</td>
      <td className="py-3 pr-4">
        <div className="flex items-center gap-2.5">
          <CoinBadge symbol={item.symbol} size="sm" />
          <div>
            <div className="text-white font-semibold text-sm">{coinSymbol(item.symbol)}</div>
            <div className="text-gray-500 text-xs">{item.symbol}</div>
          </div>
        </div>
      </td>
      <td className="py-3 pr-4 text-right text-white font-mono text-sm">{fmtPrice(item.currentPrice)}</td>
      <td className="py-3 pr-4 text-right">
        <span className={`inline-flex items-center gap-0.5 text-sm font-semibold ${up ? 'text-green-400' : 'text-red-400'}`}>
          {up ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
          {Math.abs(pct).toFixed(2)}%
        </span>
      </td>
      <td className="py-3 pr-4 text-right text-gray-400 text-sm">{fmtVol(item.volume24h)}</td>
      <td className="py-3 pr-4 text-right text-gray-500 text-xs leading-relaxed">
        <div className="text-gray-300">{fmtPrice(item.high24h)}</div>
        <div>{fmtPrice(item.low24h)}</div>
      </td>
    </tr>
  )
})

const PAGE_SIZE = 30

export default function PairTable({ rows, loading, sortBy, sortDir, onSort, selectedCoin, onSelect }) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  // Reset visible count when rows change (new search / sort)
  const visibleRows = rows.slice(0, visibleCount)
  const hasMore = rows.length > visibleCount

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="border-b border-white/10">
          <tr>
            <th className="py-3 pl-4 text-left text-xs text-gray-400 w-8">#</th>
            <SortTh col="symbol"               label="Asset"   align="left" sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
            <SortTh col="currentPrice"         label="Price"               sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
            <SortTh col="priceChangePercent24h" label="24h %"              sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
            <SortTh col="volume24h"            label="Volume"              sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
            <th className="py-3 pr-4 text-right text-xs text-gray-400 font-semibold uppercase tracking-wider">High / Low</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {loading
            ? Array(10).fill(null).map((_, i) => (
                <tr key={i}>
                  {Array(6).fill(null).map((_, j) => (
                    <td key={j} className="py-4 px-4"><Skeleton className="h-4 w-full" /></td>
                  ))}
                </tr>
              ))
            : visibleRows.map((item, idx) => (
                <PairRow
                  key={item.symbol}
                  item={item}
                  rank={idx + 1}
                  selected={selectedCoin === coinSymbol(item.symbol)}
                  onSelect={onSelect}
                />
              ))
          }
          {!loading && rows.length === 0 && (
            <tr>
              <td colSpan={6} className="text-center py-16 text-gray-500">No pairs found</td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Load more — avoids rendering hundreds of DOM nodes at once */}
      {!loading && hasMore && (
        <div className="flex items-center justify-center py-4 border-t border-white/5">
          <button
            onClick={() => setVisibleCount(c => c + PAGE_SIZE)}
            className="px-5 py-2 text-sm text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
          >
            Show more ({rows.length - visibleCount} remaining)
          </button>
        </div>
      )}
    </div>
  )
}
