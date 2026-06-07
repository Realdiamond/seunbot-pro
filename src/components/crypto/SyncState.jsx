import React from 'react'
import { Loader2, AlertCircle, RefreshCw, Clock, Database } from 'lucide-react'

export default function SyncState({ syncing, syncProgress, error, onRetry, symbol, interval }) {
  if (error) {
    // Parse error to show user-friendly message
    const isTimeout = error.includes('timed out') || error.includes('timeout')
    const isNetworkError = error.includes('network') || error.includes('fetch')
    const isDataUnavailable = error.includes('syncing') || error.includes('candles')
    
    let title = 'Analysis Failed'
    let message = error
    let suggestion = 'Please try again later'
    
    if (isTimeout) {
      title = 'Data Sync Timeout'
      message = `Historical data for ${symbol || 'this pair'} (${interval || '1d'}) is taking longer than expected to load.`
      suggestion = 'The server may be fetching data from exchange. Try again in a moment or select a different pair.'
    } else if (isNetworkError) {
      title = 'Network Error'
      message = 'Unable to connect to the analysis server.'
      suggestion = 'Check your internet connection and try again.'
    } else if (isDataUnavailable) {
      title = 'Data Not Available'
      message = `Insufficient historical data for ${symbol || 'this pair'} on ${interval || '1d'} timeframe.`
      suggestion = 'Try a different timeframe or select a more actively traded pair.'
    }
    
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <div className="flex items-start gap-3 p-5 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 max-w-lg">
          <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <div>
            <div className="font-semibold mb-1">{title}</div>
            <div className="text-sm opacity-80 mb-2">{message}</div>
            <div className="text-xs text-gray-400">{suggestion}</div>
          </div>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/30 rounded-xl text-blue-400 text-sm font-medium transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
        )}
      </div>
    )
  }

  if (syncing && syncProgress) {
    const { candlesAvailable, candlesRequired, message } = syncProgress
    const pct = candlesRequired > 0
      ? Math.min(100, Math.round((candlesAvailable / candlesRequired) * 100))
      : 0

    return (
      <div className="flex flex-col items-center justify-center py-16 gap-5 text-center">
        <div className="relative">
          <Loader2 className="w-12 h-12 text-blue-400 animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-blue-300">
            {pct}%
          </div>
        </div>
        <div>
          <div className="text-white font-semibold text-lg mb-1">⏳ Syncing Live Data…</div>
          <div className="text-gray-400 text-sm max-w-sm">{message}</div>
        </div>
        <div className="w-64">
          <div className="flex justify-between text-xs text-gray-500 mb-1.5">
            <span>{candlesAvailable} candles collected</span>
            <span>{candlesRequired} required</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
            <div
              className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
        <p className="text-xs text-gray-500">Retrying every 3 seconds…</p>
      </div>
    )
  }

  // Generic loading
  return (
    <div className="flex items-center justify-center py-20 gap-3 text-gray-400">
      <Loader2 className="w-6 h-6 animate-spin" />
      <span>Loading analysis…</span>
    </div>
  )
}
