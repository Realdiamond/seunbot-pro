/**
 * useForexAnalysis.js
 * Fetches GET /api/ForexAnalysis/{symbol}?interval={interval}
 * Includes client-side caching with 3-minute TTL for instant loads.
 */
import { useState, useEffect, useCallback, useRef } from 'react'
import { fetchForexAnalysis } from '../services/ForexAPIService'

// Client-side analysis cache (3 min TTL - shorter than backend's 5 min)
const forexCache = new Map()
const CACHE_TTL_MS = 3 * 60 * 1000

function getCachedAnalysis(symbol, interval) {
  const key = `${symbol?.toUpperCase()}_${interval?.toLowerCase()}`
  const entry = forexCache.get(key)
  if (entry && Date.now() - entry.timestamp < CACHE_TTL_MS) {
    return entry.data
  }
  forexCache.delete(key)
  return null
}

function setCachedAnalysis(symbol, interval, data) {
  const key = `${symbol?.toUpperCase()}_${interval?.toLowerCase()}`
  forexCache.set(key, { data, timestamp: Date.now() })
}

export function useForexAnalysis(symbol, interval = '1d') {
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const abortRef = useRef(false)

  const load = useCallback(async (skipCache = false) => {
    if (!symbol) return
    abortRef.current = false
    
    // Check cache first (unless explicitly skipped via refetch)
    if (!skipCache) {
      const cached = getCachedAnalysis(symbol, interval)
      if (cached) {
        setAnalysis(cached)
        setLoading(false)
        return
      }
    }
    
    setLoading(true)
    setError(null)

    try {
      const data = await fetchForexAnalysis(symbol, interval)
      if (!abortRef.current) {
        setAnalysis(data)
        setCachedAnalysis(symbol, interval, data)
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

  // refetch forces a fresh fetch, bypassing cache
  const refetch = useCallback(() => load(true), [load])

  return {
    analysis,
    loading,
    syncing: false,
    syncProgress: null,
    error,
    refetch,
  }
}
