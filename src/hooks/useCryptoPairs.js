/**
 * useCryptoPairs.js
 * Polls GET /api/CryptoAnalysis/pairs every 5 minutes.
 */
import { useState, useEffect, useCallback } from 'react'
import { fetchCryptoPairs } from '../services/CryptoAPIService'

const REFRESH_MS = 5 * 60 * 1000 // 5 minutes (API caches for 5 min)

export function useCryptoPairs() {
  const [pairs, setPairs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdate, setLastUpdate] = useState(null)

  const load = useCallback(async () => {
    try {
      setError(null)
      const data = await fetchCryptoPairs()
      setPairs(data)
      setLastUpdate(new Date())
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    const id = setInterval(load, REFRESH_MS)
    return () => clearInterval(id)
  }, [load])

  return { pairs, loading, error, lastUpdate, refetch: load }
}
