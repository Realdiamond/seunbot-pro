/**
 * useCryptoAnalysis.js
 * Fetches GET /api/CryptoAnalysis/{symbol}?interval={interval}
 * Handles the 202 syncing state with polling and exposes progress.
 */
import { useState, useEffect, useCallback, useRef } from 'react'
import { fetchCryptoAnalysis } from '../services/CryptoAPIService'

export function useCryptoAnalysis(symbol, interval = '1d') {
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [syncProgress, setSyncProgress] = useState(null) // { candlesAvailable, candlesRequired, message }
  const [error, setError] = useState(null)

  // Keep a ref so the cleanup can abort in-progress polls
  const abortRef = useRef(false)

  const load = useCallback(async () => {
    if (!symbol) return
    abortRef.current = false
    setLoading(true)
    setSyncing(false)
    setSyncProgress(null)
    setError(null)

    try {
      const data = await fetchCryptoAnalysis(symbol, interval, {
        maxRetries: 6,       // max ~18s of polling (reduced for faster feedback)
        retryDelayMs: 3000,  // 3s between retries
        onSyncing: (body) => {
          if (abortRef.current) return
          setSyncing(true)
          setSyncProgress({
            candlesAvailable: body.candlesAvailable,
            candlesRequired: body.candlesRequired,
            message: body.message,
          })
        },
      })
      if (!abortRef.current) {
        setAnalysis(data)
        setSyncing(false)
        setSyncProgress(null)
      }
    } catch (err) {
      if (!abortRef.current) setError(err.message)
    } finally {
      if (!abortRef.current) setLoading(false)
    }
  }, [symbol, interval])

  useEffect(() => {
    load()
    return () => {
      abortRef.current = true
    }
  }, [load])

  return { analysis, loading, syncing, syncProgress, error, refetch: load }
}
