// ── Formatters ────────────────────────────────────────────────────────────────

export const fmt = (n, decimals = 2) =>
  n == null
    ? '—'
    : Number(n).toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })

export const fmtPrice = (n) => {
  if (n == null) return '—'
  if (n >= 1000) return `$${fmt(n, 2)}`
  if (n >= 1)    return `$${fmt(n, 4)}`
  return `$${Number(n).toFixed(6)}`
}

export const fmtVol = (n) => {
  if (n == null) return '—'
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`
  return `$${(n / 1e3).toFixed(1)}K`
}

export const fmtPct = (n, plus = true) => {
  if (n == null) return '—'
  const s = Number(n).toFixed(2) + '%'
  return plus && n > 0 ? '+' + s : s
}

// ── Coin helpers ──────────────────────────────────────────────────────────────

export const coinSymbol = (sym) => sym?.replace('USDT', '') ?? ''

export const COIN_COLORS = {
  BTC: '#F7931A', ETH: '#627EEA', BNB: '#F3BA2F', SOL: '#9945FF',
  XRP: '#346AA9', DOGE: '#C2A633', ADA: '#0033AD', AVAX: '#E84142',
  DOT: '#E6007A', MATIC: '#8247E5', LINK: '#2A5ADA', SHIB: '#FFA409',
  LTC: '#345D9D', TRX: '#FF060A', UNI: '#FF007A', ATOM: '#2E3148',
  NEAR: '#00C08B', APT: '#00BAFF', ARB: '#12AAFF', OP: '#FF0420',
  SUI: '#6FBCF0', PEPE: '#479349',
}

export const coinColor = (symbol) =>
  COIN_COLORS[coinSymbol(symbol)] ?? '#6366f1'

// ── Signal colours ────────────────────────────────────────────────────────────

export const SIGNAL_STYLES = {
  'STRONG BUY':  { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  'BUY':         { bg: 'bg-green-500/20',   text: 'text-green-400',   border: 'border-green-500/30'   },
  'NEUTRAL':     { bg: 'bg-gray-500/20',    text: 'text-gray-300',    border: 'border-gray-500/30'    },
  'SELL':        { bg: 'bg-orange-500/20',  text: 'text-orange-400',  border: 'border-orange-500/30'  },
  'STRONG SELL': { bg: 'bg-red-500/20',     text: 'text-red-400',     border: 'border-red-500/30'     },
}

export const signalStyle = (sig) =>
  SIGNAL_STYLES[sig] ?? SIGNAL_STYLES['NEUTRAL']

// ── Skeleton ──────────────────────────────────────────────────────────────────
export const Skeleton = ({ className = '' }) => (
  <div className={`skeleton rounded-lg ${className}`} />
)
