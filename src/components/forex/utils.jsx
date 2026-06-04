// Forex formatters and helpers

export const fmt = (n, decimals = 2) =>
  n == null
    ? '—'
    : Number(n).toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })

export const fmtPrice = (n) => {
  if (n == null) return '—'
  if (n >= 1000) return fmt(n, 2)
  if (n >= 1) return fmt(n, 4)
  return Number(n).toFixed(6)
}

export const fmtVol = (n) => {
  if (n == null) return '—'
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`
  return `${(n / 1e3).toFixed(1)}K`
}

export const fmtPct = (n, plus = true) => {
  if (n == null) return '—'
  const s = Number(n).toFixed(2) + '%'
  return plus && n > 0 ? '+' + s : s
}

export const formatPair = (symbol = '') =>
  symbol.length === 6 ? `${symbol.slice(0, 3)}/${symbol.slice(3)}` : symbol
