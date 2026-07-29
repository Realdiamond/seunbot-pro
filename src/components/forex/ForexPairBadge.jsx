import React, { useState } from 'react'

// Maps currency code -> ISO 3166-1 alpha-2 country code for flagcdn.com
const CURRENCY_FLAG = {
  USD: 'us', EUR: 'eu', GBP: 'gb', JPY: 'jp', AUD: 'au',
  CAD: 'ca', CHF: 'ch', NZD: 'nz', CNY: 'cn', SEK: 'se',
  NOK: 'no', DKK: 'dk', SGD: 'sg', HKD: 'hk', MXN: 'mx',
  ZAR: 'za', TRY: 'tr', BRL: 'br', PLN: 'pl', HUF: 'hu',
  CZK: 'cz', INR: 'in', RON: 'ro', IDR: 'id', THB: 'th',
  MYR: 'my', PHP: 'ph', KRW: 'kr', NGN: 'ng',
}

const CURRENCY_COLOR = {
  USD: '#22c55e', EUR: '#3b82f6', GBP: '#8b5cf6', JPY: '#f59e0b',
  AUD: '#06b6d4', CAD: '#ef4444', CHF: '#64748b', NZD: '#10b981',
  CNY: '#dc2626', SEK: '#0ea5e9', NOK: '#2563eb', default: '#6366f1',
}

function getBase(symbol) {
  const clean = (symbol || '').replace(/^FOREX_/i, '').replace(/[/_\-]/, '').toUpperCase()
  return clean.slice(0, 3)
}

function getQuote(symbol) {
  const clean = (symbol || '').replace(/^FOREX_/i, '').replace(/[/_\-]/, '').toUpperCase()
  return clean.slice(3, 6)
}

/**
 * ForexPairBadge - Shows dual country flags for a forex pair symbol (e.g. "EURUSD")
 * Falls back to colored text badge on flag load error.
 */
export default function ForexPairBadge({ symbol, size = 'md' }) {
  const [baseErr, setBaseErr] = useState(false)
  const [quoteErr, setQuoteErr] = useState(false)

  const base = getBase(symbol)
  const quote = getQuote(symbol)
  const baseCC = CURRENCY_FLAG[base]
  const quoteCC = CURRENCY_FLAG[quote]
  const baseColor = CURRENCY_COLOR[base] || CURRENCY_COLOR.default

  const sz = size === 'sm' ? 32 : size === 'lg' ? 52 : 40

  // Dual flag layout
  if (baseCC && quoteCC) {
    return (
      <div
        className="relative flex-shrink-0"
        style={{ width: sz, height: sz * 0.75 }}
        title={`${base}/${quote}`}
      >
        {/* Base currency flag (left/behind) */}
        <div
          className="absolute left-0 top-0 rounded-sm overflow-hidden shadow-sm border border-gray-600/40"
          style={{ width: sz * 0.65, height: sz * 0.48 }}
        >
          {!baseErr ? (
            <img
              src={`https://flagcdn.com/${sz}x${Math.round(sz * 0.75)}/${baseCC}.png`}
              alt={base}
              className="w-full h-full object-cover"
              onError={() => setBaseErr(true)}
              loading="lazy"
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center text-[8px] font-bold text-white"
              style={{ background: baseColor }}
            >
              {base}
            </div>
          )}
        </div>

        {/* Quote currency flag (right/front) */}
        <div
          className="absolute rounded-sm overflow-hidden shadow border border-gray-600/40"
          style={{
            width: sz * 0.65,
            height: sz * 0.48,
            right: 0,
            bottom: 0,
          }}
        >
          {!quoteErr ? (
            <img
              src={`https://flagcdn.com/${sz}x${Math.round(sz * 0.75)}/${quoteCC}.png`}
              alt={quote}
              className="w-full h-full object-cover"
              onError={() => setQuoteErr(true)}
              loading="lazy"
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center text-[8px] font-bold text-white bg-blue-700"
            >
              {quote}
            </div>
          )}
        </div>
      </div>
    )
  }

  // Single flag or text fallback
  const cc = baseCC || quoteCC
  const displayText = base || (symbol || '???').slice(0, 3)

  return (
    <div
      className="flex-shrink-0 rounded-full overflow-hidden flex items-center justify-center font-bold text-white text-xs shadow-sm border border-gray-600/40"
      style={{
        width: sz * 0.75,
        height: sz * 0.75,
        background: baseColor,
        minWidth: sz * 0.75,
      }}
    >
      {cc && !baseErr ? (
        <img
          src={`https://flagcdn.com/40x30/${cc}.png`}
          alt={base}
          className="w-full h-full object-cover"
          onError={() => setBaseErr(true)}
          loading="lazy"
        />
      ) : (
        <span>{displayText.slice(0, 3)}</span>
      )}
    </div>
  )
}
