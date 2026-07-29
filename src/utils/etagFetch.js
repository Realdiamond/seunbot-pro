/**
 * etagFetch.js — ETag-aware fetch utility for SeunBot Pro polling hooks.
 *
 * How it works:
 *  1. Client stores the ETag from the last successful response (per URL key).
 *  2. On the next poll, it sends `If-None-Match: <saved-etag>`.
 *  3. If the server returns 304 → data hasn't changed → return cached data.
 *  4. If the server returns 200 → new data → store ETag + return fresh data.
 *
 * This means:
 *  - When the scanner hasn't re-run (which is 99% of polls since it runs every 6h),
 *    the response is ~200 bytes (304 headers) instead of 20–80 KB of JSON.
 *  - Railway compute is saved on every single poll across all markets.
 */

// In-memory store: url → { etag, data }
const cache = new Map()

/**
 * ETag-aware fetch. Returns parsed JSON data or cached data on 304.
 * @param {string} url
 * @param {RequestInit} [options]
 * @returns {Promise<any>} parsed JSON
 */
export async function etagFetch(url, options = {}) {
  const cached = cache.get(url)
  const headers = { ...(options.headers || {}) }

  if (cached?.etag) {
    headers['If-None-Match'] = cached.etag
  }

  const res = await fetch(url, { ...options, headers })

  // 304 Not Modified — return cached data
  if (res.status === 304 && cached?.data !== undefined) {
    return cached.data
  }

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${res.statusText}`)
  }

  const data = await res.json()
  const etag = res.headers.get('ETag')
  if (etag) {
    cache.set(url, { etag, data })
  }
  return data
}
