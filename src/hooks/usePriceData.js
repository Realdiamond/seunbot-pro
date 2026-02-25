import { useState, useEffect, useCallback } from 'react'
import realCryptoDataService from '../services/realCryptoDataService'

export const usePriceData = (symbols = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'ADAUSDT', 'XRPUSDT', 'SOLUSDT', 'DOGEUSDT', 'MATICUSDT']) => {
  const [prices, setPrices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdate, setLastUpdate] = useState(new Date())

  const fetchPrices = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('Fetching real-time prices for:', symbols)
      const priceData = await realCryptoDataService.fetchRealTimePrices(symbols)
      
      setPrices(priceData)
      setLastUpdate(new Date())
      console.log('✅ Prices updated successfully:', priceData.length, 'symbols')
    } catch (err) {
      setError(err.message)
      console.error('❌ Price fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [symbols.join(',')])

  useEffect(() => {
    fetchPrices()
    
    // Set up real-time updates every 30 seconds
    const interval = setInterval(fetchPrices, 30000)
    
    // Set up WebSocket for real-time updates
    let ws = null
    try {
      ws = realCryptoDataService.createWebSocket(symbols, (priceUpdate) => {
        setPrices(prevPrices => {
          const updatedPrices = [...prevPrices]
          const index = updatedPrices.findIndex(p => p.symbol === priceUpdate.symbol)
          if (index !== -1) {
            updatedPrices[index] = { ...updatedPrices[index], ...priceUpdate }
          } else {
            updatedPrices.push(priceUpdate)
          }
          return updatedPrices
        })
        setLastUpdate(new Date())
      })
    } catch (wsError) {
      console.warn('⚠️ WebSocket connection failed, using polling only:', wsError)
    }
    
    return () => {
      clearInterval(interval)
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close()
      }
    }
  }, [fetchPrices])

  return {
    prices,
    loading,
    error,
    lastUpdate,
    refetch: fetchPrices
  }
}

export const useChartData = (symbol, timeframe = '1d') => {
  const [chartData, setChartData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchChartData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log(`Fetching chart data for ${symbol} (${timeframe})...`)
      const data = await realCryptoDataService.fetchHistoricalData(symbol, timeframe, 100)
      
      setChartData(data)
      console.log(`✅ Chart data loaded: ${data.length} candles`)
    } catch (err) {
      setError(err.message)
      console.error('❌ Chart data fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [symbol, timeframe])

  useEffect(() => {
    fetchChartData()
  }, [fetchChartData])

  return {
    chartData,
    loading,
    error,
    refetch: fetchChartData
  }
}