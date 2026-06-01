/**
 * useForexPairs.js
 * Polls GET /api/ForexAnalysis/pairs.
 */
import { useState, useEffect, useCallback } from 'react'
import { fetchForexPairs } from '../services/ForexAPIService'

const REFRESH_MS = 5 * 60 * 1000

export function useForexPairs(page = 1, pageSize = 200) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdate, setLastUpdate] = useState(null)

  const load = useCallback(async () => {
    try {
      setError(null)
      const res = await fetchForexPairs({ page, pageSize })
      setData(res)
      setLastUpdate(new Date())
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [page, pageSize])

  useEffect(() => {
    load()
    const id = setInterval(load, REFRESH_MS)
    return () => clearInterval(id)
  }, [load])

  return {
    data,
    pairs: data?.pairs ?? [],
    metadata: data?.metadata ?? null,
    loading,
    error,
    lastUpdate,
    refetch: load,
  }
}
