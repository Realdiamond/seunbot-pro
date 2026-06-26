import React from 'react'
import CoinBadge from './CoinBadge'
import { fmtPrice, coinSymbol, Skeleton } from './utils'

export default function MiniPairCards({ items, loading, selectedCoin, onSelect }) {
  const data = loading ? Array(8).fill(null) : items.slice(0, 8)

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-3">
      {data.map((item, i) => {
        if (!item) return (
          <div key={i} className="glass-effect rounded-xl p-3 space-y-2">
            <Skeleton className="h-4 w-14" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-3 w-10" />
          </div>
        )

        const coin = coinSymbol(item.symbol)
        const pct  = item.priceChangePercent24h ?? 0
        const up   = pct >= 0
        const isSelected = selectedCoin === coin

        return (
          <button
            key={item.symbol}
            onClick={() => onSelect(coin)}
            className={`glass-effect rounded-xl p-3 text-left transition-all duration-200 hover:scale-[1.04] hover:border-blue-400/40 w-full ${
              isSelected ? 'border-blue-500/60 bg-blue-500/10 ring-1 ring-blue-500/40' : ''
            }`}
          >
            <div className="flex items-center gap-1.5 mb-2">
              <CoinBadge symbol={item.symbol} size="sm" />
              <span className="text-white text-xs font-bold truncate">{coin}</span>
            </div>
            <div className="text-white font-mono text-xs font-semibold">{fmtPrice(item.currentPrice)}</div>
            <div className={`text-xs font-semibold mt-0.5 ${up ? 'text-green-400' : 'text-red-400'}`}>
              {up ? '+' : ''}{pct.toFixed(2)}%
            </div>
          </button>
        )
      })}
    </div>
  )
}
