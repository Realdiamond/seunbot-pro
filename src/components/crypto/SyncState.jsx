import React from 'react'
import { Loader2, AlertCircle } from 'lucide-react'

export default function SyncState({ syncing, syncProgress, error }) {
  if (error) {
    return (
      <div className="flex items-start gap-3 p-5 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400">
        <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
        <div>
          <div className="font-semibold mb-1">Analysis Failed</div>
          <div className="text-sm opacity-80">{error}</div>
        </div>
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
