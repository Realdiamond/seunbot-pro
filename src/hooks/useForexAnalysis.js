/**
 * useForexAnalysis.js
 * Fetches GET /api/ForexAnalysis/{symbol}?interval={interval}
 */
import { useState, useEffect, useCallback, useRef } from 'react'
import { fetchForexAnalysis } from '../services/ForexAPIService'

export function useForexAnalysis(symbol, interval = '1d') {
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const abortRef = useRef(false)

  const load = useCallback(async () => {
    if (!symbol) return
    abortRef.current = false
    setLoading(true)
    setError(null)

    try {
      const data = await fetchForexAnalysis(symbol, interval)
      if (!abortRef.current) setAnalysis(data)
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

  return {
    analysis,
    loading,
    syncing: false,
    syncProgress: null,
    error,
    refetch: load,
  }
}
