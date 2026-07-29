/**
 * useLivePriceStream — React hook for SSE live price updates.
 *
 * Connects to GET /api/LivePriceStream/stream?symbols=AAPL,MSFT,...
 * and returns a live Map<symbol, price> that updates every ~30 s
 * without any polling from the frontend.
 *
 * Features:
 *  - Auto-reconnects with exponential backoff (1s → 2s → 4s → max 30s)
 *  - Falls back gracefully if SSE is unsupported or the server is unreachable
 *  - Cleans up the EventSource on unmount (no memory/connection leaks)
 *  - Only connects when symbols array is non-empty
 *
 * Usage:
 *   const { prices, connected, lastUpdate } = useLivePriceStream(visibleSymbols)
 *   // prices is a plain object: { AAPL: 213.45, MSFT: 425.10 }
 *   // connected: boolean — true when SSE stream is open
 *   // lastUpdate: Date | null — when prices were last pushed by the server
 */

import { useState, useEffect, useRef, useCallback } from 'react'

const SSE_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://seunbot-pro-production.up.railway.app'
const MAX_BACKOFF_MS = 30_000

export function useLivePriceStream(symbols = []) {
  const [prices, setPrices] = useState({})
  const [connected, setConnected] = useState(false)
  const [lastUpdate, setLastUpdate] = useState(null)

  const esRef = useRef(null)
  const backoffRef = useRef(1000)
  const reconnectTimerRef = useRef(null)
  const mountedRef = useRef(true)

  const connect = useCallback(() => {
    if (!mountedRef.current) return
    if (!symbols || symbols.length === 0) return
    if (typeof EventSource === 'undefined') return // SSE not supported

    // Close any existing connection
    if (esRef.current) {
      esRef.current.close()
      esRef.current = null
    }

    const uniqueSymbols = [...new Set(symbols.map(s => String(s).toUpperCase()))].slice(0, 200)
    const url = `${SSE_BASE_URL}/api/LivePriceStream/stream?symbols=${encodeURIComponent(uniqueSymbols.join(','))}`

    const es = new EventSource(url)
    esRef.current = es

    es.addEventListener('connected', () => {
      if (!mountedRef.current) return
      setConnected(true)
      backoffRef.current = 1000 // Reset backoff on successful connection
    })

    es.addEventListener('prices', (event) => {
      if (!mountedRef.current) return
      try {
        const data = JSON.parse(event.data)
        if (data.prices && typeof data.prices === 'object') {
          setPrices(prev => ({ ...prev, ...data.prices }))
          setLastUpdate(new Date())
        }
      } catch {
        // Malformed event — ignore
      }
    })

    es.addEventListener('heartbeat', () => {
      // Keep-alive — no action needed, just confirms connection is alive
    })

    es.onerror = () => {
      if (!mountedRef.current) return
      setConnected(false)
      es.close()
      esRef.current = null

      // Exponential backoff reconnect
      const delay = Math.min(backoffRef.current, MAX_BACKOFF_MS)
      backoffRef.current = Math.min(backoffRef.current * 2, MAX_BACKOFF_MS)

      reconnectTimerRef.current = setTimeout(() => {
        if (mountedRef.current) connect()
      }, delay)
    }
  }, [symbols.join(',')])  // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    mountedRef.current = true
    connect()

    return () => {
      mountedRef.current = false
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current)
      if (esRef.current) {
        esRef.current.close()
        esRef.current = null
      }
    }
  }, [connect])

  return { prices, connected, lastUpdate }
}
