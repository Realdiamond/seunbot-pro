import React from 'react'
import { Loader2, AlertCircle, RefreshCw, WifiOff, Database } from 'lucide-react'

/**
 * SyncState — shows a loading spinner or a clear error.
 * The "syncing" / progress-bar state has been removed because the backend
 * now either succeeds immediately or returns a clean error. No more polling.
 */
export default function SyncState({ loading, error, onRetry, symbol, interval }) {
  if (error) {
    const isTimeout    = error.includes('timed out') || error.includes('timeout')
    const isNetwork    = error.includes('network') || error.includes('fetch')
    const isNoData     = error.includes('Insufficient') || error.includes('candles') || error.includes('insufficient_data')
    const isNotFound   = error.includes('not a valid') || error.includes('not supported')

    let Icon       = AlertCircle
    let title      = 'Analysis Failed'
    let message    = error
    let suggestion = 'Please try again.'

    if (isTimeout) {
      Icon       = WifiOff
      title      = 'Request Timed Out'
      message    = `The server took too long to respond for ${symbol || 'this pair'} (${interval || '1d'}).`
      suggestion = 'Try again in a moment. If it persists, select a more actively-traded pair.'
    } else if (isNetwork) {
      Icon       = WifiOff
      title      = 'Network Error'
      message    = 'Unable to reach the analysis server.'
      suggestion = 'Check your internet connection and try again.'
    } else if (isNoData) {
      Icon       = Database
      title      = 'Data Not Available'
      message    = `Not enough historical data for ${symbol || 'this pair'} on the ${interval || '1d'} timeframe.`
      suggestion = 'Try the 1D timeframe, or select a more actively-traded pair.'
    } else if (isNotFound) {
      Icon       = AlertCircle
      title      = 'Pair Not Found'
      message    = `${symbol || 'This pair'} is not supported on the selected exchange.`
      suggestion = 'Select a different pair from the list.'
    }

    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <div className="flex items-start gap-3 p-5 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 max-w-lg w-full">
          <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <div>
            <div className="font-semibold mb-1">{title}</div>
            <div className="text-sm opacity-80 mb-2">{message}</div>
            <div className="text-xs text-gray-400">{suggestion}</div>
          </div>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600/20 hover:bg-purple-600/40 border border-purple-500/30 rounded-xl text-purple-400 text-sm font-medium transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
        )}
      </div>
    )
  }

  // Loading state
  return (
    <div className="flex items-center justify-center py-20 gap-3 text-gray-400">
      <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
      <span className="text-sm">Fetching analysis…</span>
    </div>
  )
}
