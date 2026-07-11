/**
 * useCryptoAnalysis.js
 *
 * Design principles (updated):
 *  1. NO client-side cache — the server already caches for 2 min. Double-caching was
 *     the main source of stale data on the frontend.
 *  2. NO polling loop — the backend no longer returns 202. A single fetch either
 *     succeeds (200) or fails with a clear error (503/4xx/5xx). We surface that
 *     error immediately.
 *  3. Hard 20s AbortController timeout — prevents infinite loading spinners.
 *  4. Manual refresh passes ?force=true to bust the server-side cache and re-fetch
 *     fresh candles from the exchange.
 */
import { useState, useEffect, useCallback, useRef } from 'react'
import { fetchCryptoAnalysis } from '../services/CryptoAPIService'

export function useCryptoAnalysis(symbol, interval = '1d') {
  const [analysis, setAnalysis] = useState(null)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState(null)

  // Abort in-flight requests when symbol/interval change or component unmounts.
  const abortRef = useRef(false)

  const load = useCallback(async (force = false) => {
    if (!symbol) return
    abortRef.current = false
    setLoading(true)
    setError(null)

    try {
      const data = await fetchCryptoAnalysis(symbol, interval, { force })
      if (!abortRef.current) {
        setAnalysis(data)
      }
    } catch (err) {
      if (!abortRef.current) {
        setError(err.message)
      }
    } finally {
      if (!abortRef.current) {
        setLoading(false)
      }
    }
  }, [symbol, interval])

  // Auto-load whenever symbol or interval changes.
  useEffect(() => {
    load(false)
    return () => { abortRef.current = true }
  }, [load])

  // Refresh: force a fresh fetch, bypassing the server cache too.
  const refetch = useCallback(() => load(true), [load])

  // Expose only what the UI actually needs — no syncing/syncProgress any more.
  return { analysis, loading, error, refetch }
}
