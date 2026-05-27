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
 * GET /api/CryptoAnalysis/{symbol}?interval={interval}
 * Full technical analysis. Handles syncing (202) by polling.
 *
 * @param {string} symbol
 * @param {string} interval     - one of: 1m 5m 15m 1h 4h 1d
 * @param {object} [opts]
 * @param {number} [opts.maxRetries=8]       - max polling attempts before giving up
 * @param {number} [opts.retryDelayMs=4000]  - ms between retries
 * @param {function} [opts.onSyncing]        - called on each 202 with sync progress body
 */
export async function fetchCryptoAnalysis(symbol, interval = '1d', opts = {}) {
  const { maxRetries = 8, retryDelayMs = 4000, onSyncing } = opts
  const url = `${BASE}/${symbol}?interval=${interval}`

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    let res
    try {
      res = await fetchWithTimeout(url, 15000)
    } catch (err) {
      if (err.name === 'AbortError') {
        // Network timeout — wait and retry
        await SLEEP(retryDelayMs)
        continue
      }
      throw err
    }

    if (res.status === 200) return res.json()

    if (res.status === 202) {
      const body = await res.json()
      if (onSyncing) onSyncing(body)
      await SLEEP(retryDelayMs)
      continue
    }

    const text = await res.text().catch(() => '')
    throw new Error(`fetchCryptoAnalysis(${symbol}): ${res.status} — ${text}`)
  }

  throw new Error(`fetchCryptoAnalysis(${symbol}): timed out after ${maxRetries} retries`)
}
