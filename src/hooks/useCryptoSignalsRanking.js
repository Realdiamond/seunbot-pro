import { useState, useEffect, useCallback } from 'react'

export function useCryptoSignalsRanking(page = 1, pageSize = 50) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchRanking = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/CryptoAnalysis/dashboard/signals/ranking?page=${page}&pageSize=${pageSize}`)
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`)
      const json = await res.json()
      setData(json)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [page, pageSize])

  useEffect(() => {
    fetchRanking()
  }, [fetchRanking])

  return { data, loading, error, refetch: fetchRanking }
}
