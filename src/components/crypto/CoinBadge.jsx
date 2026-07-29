import React, { useState } from 'react'
import { coinColor } from './utils'

// Reliable free crypto logo CDNs (tried in sequence on error)
function getCryptoLogoUrls(symbol) {
  // Extract base symbol: "BTCUSDT" -> "btc", "BTC/USDT" -> "btc"
  const base = (symbol || '')
    .replace(/\/.*$/, '')      // remove /USDT etc.
    .replace(/USDT$|BUSD$|USD$|BTC$|ETH$|BNB$/, '') // strip quote asset suffix
    .toLowerCase()
    || (symbol || '').toLowerCase()

  // Fallback: use cleaned full symbol too
  const full = (symbol || '').replace('/', '').replace('-', '').toLowerCase()

  return [
    // jsdelivr spothq/cryptocurrency-icons (most comprehensive, ~400 coins, free, no CORS)
    `https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/32/color/${base}.png`,
    // Cryptoicons alternative
    `https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/32/color/${full}.png`,
    // Cryptologos.cc (SVG, very broad coverage)
    `https://cryptologos.cc/logos/${base}-logo.png`,
  ]
}

export default function CoinBadge({ symbol, size = 'md' }) {
  const [urlIndex, setUrlIndex] = useState(0)
  const [imgFailed, setImgFailed] = useState(false)

  const color = coinColor(symbol)
  const sz = size === 'sm'
    ? 'w-7 h-7 text-[10px]'
    : size === 'lg'
    ? 'w-12 h-12 text-sm'
    : 'w-10 h-10 text-xs'

  // Display text: first 3-4 chars of base symbol
  const base = (symbol || '')
    .replace(/\/.*$/, '')
    .replace(/USDT$|BUSD$|USD$|BTC$|ETH$|BNB$/, '') || symbol
  const displayText = (base || symbol || '???').slice(0, 4).toUpperCase()

  const urls = getCryptoLogoUrls(symbol)
  const currentUrl = urls[urlIndex]

  const handleError = () => {
    if (urlIndex < urls.length - 1) {
      setUrlIndex(urlIndex + 1)
    } else {
      setImgFailed(true)
    }
  }

  return (
    <div
      className={`${sz} rounded-full flex items-center justify-center font-bold text-white flex-shrink-0 overflow-hidden relative`}
      style={{
        background: `linear-gradient(135deg, ${color}cc, ${color}44)`,
        border: `1.5px solid ${color}55`,
        boxShadow: `0 0 12px ${color}33`,
      }}
    >
      {/* Text fallback always behind */}
      <span className="absolute inset-0 flex items-center justify-center text-[inherit] font-bold text-white select-none">
        {displayText.slice(0, 3)}
      </span>

      {/* Try image CDNs, fall back to text */}
      {!imgFailed && (
        <img
          src={currentUrl}
          alt={`${symbol} logo`}
          className="absolute inset-0 w-full h-full object-cover rounded-full"
          onError={handleError}
          loading="lazy"
        />
      )}
    </div>
  )
}
