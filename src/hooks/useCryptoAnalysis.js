/**
 * useCryptoAnalysis.js
 * Fetches GET /api/CryptoAnalysis/{symbol}?interval={interval}
 * Handles the 202 syncing state with polling and exposes progress.
 * Includes client-side caching with 3-minute TTL for instant loads.
 */
import { useState, useEffect, useCallback, useRef } from 'react'
import { fetchCryptoAnalysis } from '../services/CryptoAPIService'

// Client-side analysis cache (3 min TTL - shorter than backend's 5 min)
const analysisCache = new Map()
const CACHE_TTL_MS = 3 * 60 * 1000

function getCachedAnalysis(symbol, interval) {
  const key = `${symbol?.toUpperCase()}_${interval?.toLowerCase()}`
  const entry = analysisCache.get(key)
  if (entry && Date.now() - entry.timestamp < CACHE_TTL_MS) {
    return entry.data
  }
  analysisCache.delete(key)
  return null
}

function setCachedAnalysis(symbol, interval, data) {
  const key = `${symbol?.toUpperCase()}_${interval?.toLowerCase()}`
  analysisCache.set(key, { data, timestamp: Date.now() })
}

export function useCryptoAnalysis(symbol, interval = '1d') {
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [syncProgress, setSyncProgress] = useState(null) // { candlesAvailable, candlesRequired, message }
  const [error, setError] = useState(null)

  // Keep a ref so the cleanup can abort in-progress polls
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
        setSyncing(false)
        return
      }
    }
    
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
        setCachedAnalysis(symbol, interval, data)
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

  // refetch forces a fresh fetch, bypassing cache
  const refetch = useCallback(() => load(true), [load])

  return { analysis, loading, syncing, syncProgress, error, refetch }
}
