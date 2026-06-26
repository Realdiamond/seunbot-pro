import React, { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { Brain, RefreshCw, Clock } from 'lucide-react'
import { useCryptoPairs }    from '../../hooks/useCryptoPairs'
import { useCryptoAnalysis } from '../../hooks/useCryptoAnalysis'
import CoinBadge        from './CoinBadge'
import SyncState        from './SyncState'
import ScoreCards       from './ScoreCards'
import IndicatorsPanel  from './IndicatorsPanel'
import MultiTimeframe   from './MultiTimeframe'
import CyclePanel       from './CyclePanel'
import TradePlan        from './TradePlan'
import SignalsList      from './SignalsList'
import SignalHistory    from '../SignalHistory'
import ElliottWavePanel from './ElliottWavePanel'
import CryptoPatterns   from './CryptoPatterns'
import { coinSymbol }   from './utils'

const INTERVALS = ['1m','5m','15m','1h','4h','1d','1w','1M']
const INTERVAL_LABELS = { '1d': 'Daily', '1w': 'Weekly', '1M': 'Monthly' }

export default function CryptoAnalysis({ initialSymbol = 'BTCUSDT' }) {
  const location = useLocation()
  const routeSymbol = location.state?.symbol

  const [symbol,   setSymbol]   = useState(routeSymbol || initialSymbol)
  const [interval, setInterval] = useState('1d')

  useEffect(() => {
    if (routeSymbol) setSymbol(routeSymbol)
  }, [routeSymbol])

  const { pairs } = useCryptoPairs()
  const { analysis, loading, syncing, syncProgress, error, refetch } = useCryptoAnalysis(symbol, interval)

  const coin = coinSymbol(symbol)
  const isLoading = loading || syncing

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          {symbol && <CoinBadge symbol={symbol} size="lg" />}
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-2">
              <Brain className="w-7 h-7 text-purple-400" />
              {coin} Analysis
            </h1>
            <p className="text-gray-400 text-sm mt-0.5">
              Full technical + multi-timeframe breakdown
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Pair selector */}
          <select
            value={symbol}
            onChange={e => setSymbol(e.target.value)}
            className="px-3 py-2 bg-gray-800 border border-gray-600/60 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500"
          >
            {(pairs.length ? pairs : [{ symbol }]).map(p => (
              <option key={p.symbol} value={p.symbol}>{p.symbol}</option>
            ))}
          </select>

          {/* Interval selector */}
          <div className="flex bg-gray-800 border border-gray-600/60 rounded-xl overflow-hidden">
            {INTERVALS.map(iv => (
              <button
                key={iv}
                onClick={() => setInterval(iv)}
                className={`px-3 py-2 text-xs font-semibold transition-colors ${
                  interval === iv
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
                title={INTERVAL_LABELS[iv] || iv}
              >
                {INTERVAL_LABELS[iv] || iv}
              </button>
            ))}
          </div>

          <button
            onClick={refetch} disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600/20 hover:bg-purple-600/40 border border-purple-500/30 rounded-xl text-purple-400 text-sm font-medium transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Timestamp */}
      {analysis?.analysisTimestamp && (
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Clock className="w-3.5 h-3.5" />
          Analysis as of {new Date(analysis.analysisTimestamp).toLocaleString()}
          {analysis.typeOfAnalysis && ` · ${analysis.typeOfAnalysis}`}
        </div>
      )}

      {/* Loading / syncing / error */}
      {isLoading || error ? (
        <SyncState 
          syncing={syncing} 
          syncProgress={syncProgress} 
          error={error} 
          onRetry={refetch}
          symbol={symbol}
          interval={interval}
        />
      ) : analysis ? (
        <div className="space-y-6">
          {/* 1 — Signal + score breakdown */}
          <ScoreCards analysis={analysis} />

          {/* 2 — Technical indicators */}
          <div>
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Technical Indicators</h2>
            <IndicatorsPanel analysis={analysis} />
          </div>

          {/* 3 — Multi-timeframe & Patterns */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2">
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Multi-Timeframe</h2>
              <MultiTimeframe analysis={analysis} />
            </div>
            <div>
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Structure</h2>
              <CryptoPatterns analysis={analysis} />
            </div>
          </div>

          {/* 4 — Cycle + Trade plan side by side */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div>
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Cycle Analysis</h2>
              <CyclePanel analysis={analysis} />
            </div>
            <div>
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Trade Plan</h2>
              <TradePlan analysis={analysis} />
            </div>
          </div>

          {/* 4b — Elliott Wave count */}
          <ElliottWavePanel analysis={analysis} />

          {/* 5 — Signals list */}
          <SignalsList analysis={analysis} />

          {/* 6 — Prediction history */}
          <SignalHistory market="crypto" symbol={symbol} title="Prediction History" />
        </div>
      ) : null}
    </div>
  )
}
