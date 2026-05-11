import React from 'react'
import { coinSymbol, coinColor } from './utils'

export default function CoinBadge({ symbol, size = 'md' }) {
  const coin  = coinSymbol(symbol)
  const color = coinColor(symbol)
  const sz = size === 'sm'
    ? 'w-7 h-7 text-[10px]'
    : size === 'lg'
    ? 'w-12 h-12 text-sm'
    : 'w-10 h-10 text-xs'

  return (
    <div
      className={`${sz} rounded-full flex items-center justify-center font-bold text-white flex-shrink-0`}
      style={{
        background: `linear-gradient(135deg, ${color}cc, ${color}44)`,
        border: `1.5px solid ${color}55`,
        boxShadow: `0 0 12px ${color}33`,
      }}
    >
      {coin.slice(0, 3)}
    </div>
  )
}
