/**
 * CryptoAPIService.js
 * Wraps the Seun Trading Bot Crypto Analysis API.
 * All requests go through the Vite proxy (/api → Heroku) so no CORS issues.
 */

const BASE = '/api/CryptoAnalysis'
const SLEEP = (ms) => new Promise((r) => setTimeout(r, ms))

/**
 * GET /api/CryptoAnalysis/pairs
 * Returns all 22 tracked USDT pairs with live prices.
 * @returns {Promise<Array>}
 */
export async function fetchCryptoPairs() {
  const res = await fetch(`${BASE}/pairs`)
  if (!res.ok) throw new Error(`fetchCryptoPairs: ${res.status} ${res.statusText}`)
  return res.json()
}

/**
 * GET /api/CryptoAnalysis/dashboard
 * Returns high-level 24h OHLC market snapshot for all pairs.
 * @returns {Promise<Array>}
 */
export async function fetchCryptoDashboard() {
  const res = await fetch(`${BASE}/dashboard`)
  if (!res.ok) throw new Error(`fetchCryptoDashboard: ${res.status} ${res.statusText}`)
  return res.json()
}

/**
 * GET /api/CryptoAnalysis/{symbol}?interval={interval}
 * Full technical analysis for a single pair. Handles 202 syncing by polling.
 *
 * @param {string} symbol   - e.g. "BTCUSDT"
 * @param {string} interval - one of: 1m 5m 15m 1h 4h 1d  (default: "1d")
 * @param {object} [opts]
 * @param {number} [opts.maxRetries=20]   - how many 3-second polls before giving up
 * @param {function} [opts.onSyncing]     - called on each 202 with { candlesAvailable, candlesRequired, message }
 * @returns {Promise<object>} full analysis object
 */
export async function fetchCryptoAnalysis(symbol, interval = '1d', opts = {}) {
  const { maxRetries = 20, onSyncing } = opts
  const url = `${BASE}/${symbol}?interval=${interval}`

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const res = await fetch(url)

    if (res.status === 200) return res.json()

    if (res.status === 202) {
      const body = await res.json()
      if (onSyncing) onSyncing(body)
      await SLEEP(3000)
      continue
    }

    const text = await res.text().catch(() => '')
    throw new Error(`fetchCryptoAnalysis(${symbol}): ${res.status} — ${text}`)
  }

  throw new Error(`fetchCryptoAnalysis(${symbol}): timed out after ${maxRetries} retries`)
}
