/**
 * ForexAPIService.js
 * Wraps the Seun Trading Bot Forex Analysis API.
 * All requests go through the Vite proxy (/api).
 */

const BASE = '/api/ForexAnalysis'
const SLEEP = (ms) => new Promise((r) => setTimeout(r, ms))

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
 * GET /api/ForexAnalysis/pairs?page={page}&pageSize={pageSize}
 */
export async function fetchForexPairs({ page = 1, pageSize = 20 } = {}) {
  const url = `${BASE}/pairs?page=${page}&pageSize=${pageSize}`
  const res = await fetchWithTimeout(url)
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`fetchForexPairs: ${res.status} ${res.statusText} ${text}`.trim())
  }
  return res.json()
}

/**
 * GET /api/ForexAnalysis/dashboard/setups
 * Returns weekly high-probability setups with entry/target/stop and R:R.
 * R:R is recomputed defensively (direction-agnostic) so bearish setups don't
 * collapse to '—' and any garbled API value is corrected.
 */
export async function fetchForexSetups() {
  const url = `${BASE}/dashboard/setups`
  const res = await fetchWithTimeout(url, 30000)
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`fetchForexSetups: ${res.status} ${res.statusText} ${text}`.trim())
  }
  const data = await res.json()
  const num = (v, f = 0) => (Number.isFinite(Number(v)) ? Number(v) : f)
  const setups = Array.isArray(data?.setups) ? data.setups.map((s) => {
    const currentPrice = num(s.currentPrice)
    const targetPrice = num(s.targetPrice)
    const stopLoss = num(s.stopLoss)
    let riskReward = s.riskReward
    if (currentPrice > 0 && targetPrice > 0 && stopLoss > 0) {
      const reward = Math.abs(targetPrice - currentPrice)
      const risk = Math.abs(currentPrice - stopLoss)
      riskReward = risk > 0 ? (reward / risk).toFixed(1) : '—'
    } else {
      const parsed = Number(riskReward)
      riskReward = Number.isFinite(parsed) ? parsed.toFixed(1) : '—'
    }
    return { ...s, currentPrice, targetPrice, stopLoss, volume: num(s.volume), riskReward }
  }) : []
  return {
    setups,
    totalScanned: data?.totalScanned ?? setups.length,
    highProbabilityCount: data?.highProbabilityCount ?? setups.length,
    scanTime: data?.scanTime ?? new Date().toISOString(),
  }
}

/**
 * GET /api/ForexAnalysis/{symbol}?interval={interval}
 */
export async function fetchForexAnalysis(symbol, interval = '1d', opts = {}) {
  const { retryDelayMs = 4000, maxRetries = 1 } = opts
  const url = `${BASE}/${encodeURIComponent(symbol)}?interval=${interval}`

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    let res
    try {
      res = await fetchWithTimeout(url, 15000)
    } catch (err) {
      if (err.name === 'AbortError') {
        await SLEEP(retryDelayMs)
        continue
      }
      throw err
    }

    if (res.status === 200) return res.json()

    if (res.status === 404) {
      const body = await res.json().catch(() => null)
      if (body?.status === 'sync_required') {
        throw new Error(body.message || 'Forex data sync required for this pair.')
      }
      const message = body?.message || res.statusText
      throw new Error(`fetchForexAnalysis(${symbol}): ${res.status} — ${message}`)
    }

    const text = await res.text().catch(() => '')
    throw new Error(`fetchForexAnalysis(${symbol}): ${res.status} — ${text}`)
  }

  throw new Error(`fetchForexAnalysis(${symbol}): timed out after ${maxRetries} retries`)
}

/**
 * POST /api/ForexAnalysis/trigger-scan
 * Triggers immediate live price poll from Massive API and recalculates weekly setups on-demand.
 */
export async function triggerForexScan() {
  const url = `${BASE}/trigger-scan`
  const res = await fetch(url, { method: 'POST' })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`triggerForexScan: ${res.status} ${res.statusText} ${text}`.trim())
  }
  return res.json()
}
