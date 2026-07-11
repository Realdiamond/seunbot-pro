/**
 * CryptoAPIService.js
 * Wraps the Seun Trading Bot Crypto Analysis API.
 * All requests go through the Vite proxy (/api → Heroku) so no CORS issues.
 */

const BASE = '/api/CryptoAnalysis'
const SLEEP = (ms) => new Promise((r) => setTimeout(r, ms))

// 15-second fetch wrapper with AbortController — prevents hung Heroku connections
async function fetchWithTimeout(url, timeoutMs = 15000) {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, { signal: controller.signal })
    clearTimeout(id)
    return res
  } catch (err) {
    clearTimeout(id)
    throw err
  }
}

/**
 * GET /api/CryptoAnalysis/pairs
 * Returns all tracked USDT pairs with live prices.
 */
export async function fetchCryptoPairs() {
  const res = await fetchWithTimeout(`${BASE}/pairs`)
  if (!res.ok) throw new Error(`fetchCryptoPairs: ${res.status} ${res.statusText}`)
  return res.json()
}

/**
 * GET /api/CryptoAnalysis/dashboard
 * Returns 24h OHLC market snapshot.
 */
export async function fetchCryptoDashboard() {
  const res = await fetchWithTimeout(`${BASE}/dashboard`)
  if (!res.ok) throw new Error(`fetchCryptoDashboard: ${res.status} ${res.statusText}`)
  return res.json()
}

/**
 * Fetches weekly crypto setups from the new backend endpoint.
 * Returns { setups, totalScanned, highProbabilityCount, scanTime }.
 * Falls back to the old signals/ranking approach if the new endpoint fails.
 */
export async function fetchCryptoSetups({ page = 1, pageSize = 25, minProbability = 50, maxResults = 50 } = {}) {
  const bust = `_ts=${Date.now()}`
  
  // Try the new backend-scanned setups endpoint first (GET /api/CryptoAnalysis/dashboard/setups)
  try {
    const res = await fetchWithTimeout(
      `${BASE}/dashboard/setups?minProbability=${minProbability}&maxResults=${maxResults}&${bust}`,
      20000
    )
    if (res.ok) {
      const data = await res.json()
      const setups = (data.setups || []).map(s => ({
        symbol: s.symbol,
        sector: s.sector || 'Crypto',
        setupType: s.setupType,
        weeklyTradeSetup: s.setupType,
        direction: /bull|oversold|breakout/i.test(s.setupType) ? 'BUY' : /bear|overbought|breakdown/i.test(s.setupType) ? 'SELL' : 'HOLD',
        timeframe: s.timeframe || '1D',
        probability: s.probability,
        confidence: s.confidence,
        signalStrength: s.probability / 10, // normalize to 0-10
        isStrongSignal: s.probability >= 75,
        currentPrice: Number(s.currentPrice) || 0,
        targetPrice: Number(s.targetPrice) || 0,
        stopLoss: Number(s.stopLoss) || 0,
        riskReward: s.riskReward || '—',
        volume: s.volume,
        elliottWavesPattern: null,
        geometricPattern: null,
        technicalSignals: s.technicalSignals || [],
        lastAnalyzed: s.scanTime,
      }))
      return {
        setups,
        totalScanned: data.totalScanned || setups.length,
        highProbabilityCount: data.highProbabilityCount || setups.filter(s => s.probability >= 70).length,
        scanTime: data.scanTime || new Date().toISOString(),
        metadata: { totalItems: data.totalScanned, page: 1, pageSize: maxResults, totalPages: 1 },
      }
    }
  } catch (err) {
    console.warn('New crypto setups endpoint failed, falling back to ranking:', err.message)
  }

  // Fallback: use the old signals/ranking endpoint
  const [rankRes, dashRes] = await Promise.allSettled([
    fetchWithTimeout(`${BASE}/dashboard/signals/ranking?page=${page}&pageSize=${pageSize}&${bust}`, 20000),
    fetchWithTimeout(`${BASE}/dashboard?${bust}`, 20000),
  ])

  if (rankRes.status !== 'fulfilled' || !rankRes.value.ok) {
    throw new Error('fetchCryptoSetups: ranking request failed')
  }
  const ranking = await rankRes.value.json()
  const signals = Array.isArray(ranking?.signals) ? ranking.signals : []

  // Price map from dashboard (currentPrice + 24h change per symbol).
  const priceMap = new Map()
  if (dashRes.status === 'fulfilled' && dashRes.value.ok) {
    const dash = await dashRes.value.json().catch(() => [])
    const rows = Array.isArray(dash) ? dash : (dash?.data || [])
    rows.forEach(r => {
      if (r?.symbol) priceMap.set(r.symbol, {
        currentPrice: Number(r.currentPrice) || 0,
        changePercent24h: Number(r.priceChangePercent24h) || 0,
      })
    })
  }

  // Map confidence (0-100) to a High/Medium/Low label like NGX.
  const confLabel = (c) => (c >= 70 ? 'High' : c >= 50 ? 'Medium' : 'Low')
  const mapSetupName = (w) => (w === 'Bull' ? 'Bullish Breakout' : w === 'Bear' ? 'Bearish Breakdown' : 'Consolidation')

  let setups = signals.map(s => {
    const price = priceMap.get(s.symbol)?.currentPrice || 0
    return {
      symbol: s.symbol,
      sector: 'Crypto',
      setupType: mapSetupName(s.weeklyTradeSetup),
      weeklyTradeSetup: s.weeklyTradeSetup,
      direction: s.direction,
      timeframe: '1D',
      probability: Math.round(Number(s.confidenceLevel) || 0),
      confidence: confLabel(Number(s.confidenceLevel) || 0),
      signalStrength: Number(s.signalStrength) || 0,
      isStrongSignal: !!s.isStrongSignal,
      currentPrice: price,
      targetPrice: 0,
      stopLoss: 0,
      riskReward: '—',
      elliottWavesPattern: s.elliottWavesPattern,
      geometricPattern: s.geometricPattern,
      lastAnalyzed: s.lastAnalyzed,
    }
  })

  // Enrich strong signals with real trade plans (bounded — strong signals are few).
  const toEnrich = setups.filter(s => s.isStrongSignal).slice(0, 12)
  const BATCH = 6
  for (let i = 0; i < toEnrich.length; i += BATCH) {
    const batch = toEnrich.slice(i, i + BATCH)
    const results = await Promise.allSettled(
      batch.map(s => fetchWithTimeout(`${BASE}/${s.symbol}?interval=1d`, 15000).then(r => (r.ok ? r.json() : null)))
    )
    results.forEach((r, idx) => {
      if (r.status !== 'fulfilled' || !r.value) return
      const a = r.value
      const tp = a.tradePlan || {}
      const current = Number(a.currentPrice) || batch[idx].currentPrice
      const target = Number(tp.takeProfit1) || 0
      const stop = Number(tp.stopLoss) || 0
      const entry = Number(tp.entryPrice) || current
      let rr = '—'
      if (entry > 0 && target > 0 && stop > 0) {
        const reward = Math.abs(target - entry)
        const risk = Math.abs(entry - stop)
        rr = risk > 0 ? (reward / risk).toFixed(1) : '—'
      } else if (Number(tp.riskRewardRatio1) > 0) {
        rr = Number(tp.riskRewardRatio1).toFixed(1)
      }
      const target0 = setups.find(x => x.symbol === batch[idx].symbol)
      if (target0) {
        target0.currentPrice = current
        target0.targetPrice = target
        target0.stopLoss = stop
        target0.riskReward = rr
      }
    })
  }

  return {
    setups,
    totalScanned: ranking?.metadata?.totalItems || setups.length,
    highProbabilityCount: setups.filter(s => s.isStrongSignal).length,
    scanTime: signals[0]?.lastAnalyzed || new Date().toISOString(),
    metadata: ranking?.metadata || null,
  }
}

/**
 * GET /api/CryptoAnalysis/{symbol}?interval={interval}&force={force}
 *
 * Single-shot fetch — no polling. The backend is now guaranteed to return
 * 200 (success) or a non-202 error (503 insufficient data, 500 server error).
 *
 * @param {string} symbol
 * @param {string} interval    - one of: 1m 5m 15m 1h 4h 1d 1w 1M
 * @param {object} [opts]
 * @param {boolean} [opts.force=false] - busts the server-side cache and re-fetches from exchange
 */
export async function fetchCryptoAnalysis(symbol, interval = '1d', opts = {}) {
  const { force = false } = opts
  const url = `${BASE}/${symbol}?interval=${interval}${force ? '&force=true' : ''}`

  let res
  try {
    res = await fetchWithTimeout(url, 20000) // 20s hard timeout
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error(`Request timed out for ${symbol} (${interval}). The server took too long to respond.`)
    }
    throw err
  }

  if (res.status === 200) return res.json()

  // Parse the error body for a user-facing message.
  let body = {}
  try { body = await res.json() } catch { /* ignore */ }

  const detail = body.message || body.detail || res.statusText

  if (res.status === 503) {
    throw new Error(`Insufficient data for ${symbol} (${interval}): ${body.message || 'Not enough historical candles available.'}`)
  }
  if (res.status === 404) {
    throw new Error(`${symbol} is not a valid trading pair or is not supported.`)
  }

  throw new Error(`Analysis failed for ${symbol} (${interval}): ${res.status} — ${detail}`)
}
