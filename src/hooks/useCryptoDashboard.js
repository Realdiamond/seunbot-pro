/**
 * useCryptoDashboard.js
 * Polls GET /api/CryptoAnalysis/dashboard every 60 seconds.
 */
import { useState, useEffect, useCallback } from 'react'
import { fetchCryptoDashboard } from '../services/CryptoAPIService'

const REFRESH_MS = 60 * 1000 // 60 seconds

export function useCryptoDashboard() {
  const [market, setMarket] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdate, setLastUpdate] = useState(null)

  const load = useCallback(async () => {
    try {
      setError(null)
      const data = await fetchCryptoDashboard()
      setMarket(data)
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

  return { market, loading, error, lastUpdate, refetch: load }
}
