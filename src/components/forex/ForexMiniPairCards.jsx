import React from 'react'
import { fmtPrice, fmtPct, formatPair } from './utils'

export default function ForexMiniPairCards({ items, loading, selectedPair, onSelect }) {
  const data = loading ? Array(8).fill(null) : items.slice(0, 8)

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-3">
      {data.map((item, i) => {
        if (!item) {
          return (
            <div key={i} className="glass-effect rounded-xl p-3 space-y-2">
              <div className="skeleton rounded-lg h-4 w-14" />
              <div className="skeleton rounded-lg h-5 w-full" />
              <div className="skeleton rounded-lg h-3 w-10" />
            </div>
          )
        }

        const pair = formatPair(item.symbol)
        const pct = item.priceChangePercent24h ?? 0
        const up = pct >= 0
        const isSelected = selectedPair === item.symbol

        return (
          <button
            key={item.symbol}
            onClick={() => onSelect(item.symbol)}
            className={`glass-effect rounded-xl p-3 text-left transition-all duration-200 hover:scale-[1.04] hover:border-cyan-400/40 w-full ${
              isSelected ? 'border-cyan-500/60 bg-cyan-500/10 ring-1 ring-cyan-500/40' : ''
            }`}
          >
            <div className="text-white text-xs font-bold truncate">{pair}</div>
            <div className="text-white font-mono text-xs font-semibold mt-1">{fmtPrice(item.currentPrice)}</div>
            <div className={`text-xs font-semibold mt-0.5 ${up ? 'text-green-400' : 'text-red-400'}`}>
              {fmtPct(pct)}
            </div>
          </button>
        )
      })}
    </div>
  )
}
