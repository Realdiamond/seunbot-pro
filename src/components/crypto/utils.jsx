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

// ── Signal horizon / timing indicator ──────────────────────────────────────────
// Given when a signal/trade-plan was produced and its timeframe, describe the window
// the plan is FOR relative to today: "Yesterday", "For Today", "For Tomorrow",
// "In N days", "Coming days/weeks". Used as the signal-history time-indicator column.

const MS_PER_DAY = 86400000

const startOfDay = (d) => {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

// How far ahead a freshly-generated signal stays actionable, by timeframe.
const horizonDays = (timeframe = '') => {
  const tf = String(timeframe).toLowerCase()
  if (tf.includes('month')) return 30
  if (tf.includes('week')) return 7
  if (tf.includes('h4') || tf.includes('hour') || tf.includes('intraday')) return 1
  return 1 // daily / default → next session
}

export const signalHorizon = (predictedAt, timeframe = 'Daily') => {
  if (!predictedAt) return null
  const made = new Date(predictedAt)
  if (Number.isNaN(made.getTime())) return null

  const target = new Date(made.getTime() + horizonDays(timeframe) * MS_PER_DAY)
  const dayDiff = Math.round((startOfDay(target) - startOfDay(new Date())) / MS_PER_DAY)

  if (dayDiff < -1) return { label: `${Math.abs(dayDiff)}d ago`, tone: 'past', icon: '📁' }
  if (dayDiff === -1) return { label: 'Yesterday', tone: 'past', icon: '📁' }
  if (dayDiff === 0) return { label: 'For Today', tone: 'today', icon: '⚡' }
  if (dayDiff === 1) return { label: 'For Tomorrow', tone: 'soon', icon: '🌅' }
  if (dayDiff <= 7) return { label: `In ${dayDiff} days`, tone: 'coming', icon: '📅' }
  return { label: 'Coming weeks', tone: 'coming', icon: '📅' }
}

export const HORIZON_TONE = {
  past:   'bg-gray-500/20 text-gray-400',
  today:  'bg-amber-500/20 text-amber-300',
  soon:   'bg-sky-500/20 text-sky-300',
  coming: 'bg-violet-500/20 text-violet-300',
}

// Small inline pill for the horizon indicator.
export const HorizonPill = ({ predictedAt, timeframe, className = '' }) => {
  const h = signalHorizon(predictedAt, timeframe)
  if (!h) return null
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${HORIZON_TONE[h.tone]} ${className}`}>
      <span>{h.icon}</span>{h.label}
    </span>
  )
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
export const Skeleton = ({ className = '' }) => (
  <div className={`skeleton rounded-lg ${className}`} />
)
