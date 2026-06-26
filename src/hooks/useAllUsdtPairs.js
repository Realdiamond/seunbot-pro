import { useState, useEffect, useCallback } from 'react'
import binanceService from '../services/binanceService'

export const useAllUsdtPairs = (autoRefresh = true, refreshInterval = 1200000) => { // 20 minutes
  const [allPairs, setAllPairs] = useState([])
  const [topPairs, setTopPairs] = useState([])
  const [marketSummary, setMarketSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdate, setLastUpdate] = useState(null)

  const fetchAllData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('Fetching all USDT pairs from Binance...')
      
      // Fetch all USDT pairs
      const pairs = await binanceService.getAllUsdtPairs()
      setAllPairs(pairs)
      
      // Fetch top pairs by volume
      const top = await binanceService.getTopUsdtPairs(50)
      setTopPairs(top)
      
      // Fetch market summary
      const summary = await binanceService.getMarketSummary()
      setMarketSummary(summary)
      
      setLastUpdate(new Date())
      console.log(`Loaded ${pairs.length} USDT pairs, top ${top.length} by volume`)
      
    } catch (err) {
      console.error('Error fetching USDT pairs:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAllData()
    
    if (autoRefresh) {
      const interval = setInterval(fetchAllData, refreshInterval)
      return () => clearInterval(interval)
    }
  }, [fetchAllData, autoRefresh, refreshInterval])

  return {
    allPairs,
    topPairs,
    marketSummary,
    loading,
    error,
    lastUpdate,
    refetch: fetchAllData
  }
}

export const useRealTimePrices = (symbols, enabled = true) => {
  const [prices, setPrices] = useState(new Map())
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    if (!enabled || !symbols || symbols.length === 0) return

    let ws = null
    
    try {
      ws = binanceService.createWebSocket(symbols.slice(0, 20), (update) => {
        setPrices(prev => new Map(prev.set(update.symbol, update)))
      })
      
      ws.onopen = () => setConnected(true)
      ws.onclose = () => setConnected(false)
      ws.onerror = () => setConnected(false)
      
    } catch (error) {
      console.error('WebSocket setup error:', error)
    }

    return () => {
      if (ws) {
        ws.close()
        setConnected(false)
      }
    }
  }, [symbols, enabled])

  return { prices, connected }
}