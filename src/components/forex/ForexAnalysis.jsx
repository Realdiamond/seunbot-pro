import React, { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { Brain, RefreshCw, Clock } from 'lucide-react'
import { useForexPairs } from '../../hooks/useForexPairs'
import { useForexAnalysis } from '../../hooks/useForexAnalysis'
import CoinBadge from '../crypto/CoinBadge'
import SyncState from '../crypto/SyncState'
import ScoreCards from '../crypto/ScoreCards'
import IndicatorsPanel from '../crypto/IndicatorsPanel'
import MultiTimeframe from '../crypto/MultiTimeframe'
import CyclePanel from '../crypto/CyclePanel'
import TradePlan from '../crypto/TradePlan'
import SignalsList from '../crypto/SignalsList'
import CryptoPatterns from '../crypto/CryptoPatterns'
import SignalHistory from '../SignalHistory'
import ElliottWavePanel from '../crypto/ElliottWavePanel'
import { fmtPrice, formatPair } from './utils'

const INTERVALS = ['1m', '1h', '1d']

export default function ForexAnalysis({ initialSymbol = 'AUDCAD' }) {
  const location = useLocation()
  const routeSymbol = location.state?.symbol

  const [symbol, setSymbol] = useState(routeSymbol || initialSymbol)
  const [interval, setInterval] = useState('1d')

  useEffect(() => {
    if (routeSymbol) setSymbol(routeSymbol)
  }, [routeSymbol])

  const { pairs } = useForexPairs(1, 100)
  const { analysis, loading, syncing, syncProgress, error, refetch } = useForexAnalysis(symbol, interval)

  const isLoading = loading || syncing

  return (
    <div className="space-y-6 fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          {symbol && <CoinBadge symbol={symbol} size="lg" />}
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-2">
              <Brain className="w-7 h-7 text-cyan-300" />
              {formatPair(symbol)} Analysis
            </h1>
            <p className="text-gray-400 text-sm mt-0.5">
              Comprehensive multi-timeframe forex breakdown
            </p>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          <select
            value={symbol}
            onChange={e => setSymbol(e.target.value)}
            className="px-3 py-2 bg-gray-800 border border-gray-600/60 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500"
          >
            {(pairs.length ? pairs : [{ symbol }]).map(p => (
              <option key={p.symbol} value={p.symbol}>
                {formatPair(p.symbol)}
              </option>
            ))}
          </select>

          

          <div className="flex bg-gray-800 border border-gray-600/60 rounded-xl overflow-hidden">
            {INTERVALS.map(iv => (
              <button
                key={iv}
                onClick={() => setInterval(iv)}
                className={`px-3 py-2 text-xs font-semibold transition-colors ${
                  interval === iv
                    ? 'bg-cyan-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
              >
                {iv}
              </button>
            ))}
          </div>

          <button
            onClick={refetch}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-600/20 hover:bg-cyan-600/40 border border-cyan-500/30 rounded-xl text-cyan-300 text-sm font-medium transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {analysis?.analysisTimestamp && (
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Clock className="w-3.5 h-3.5" />
          Analysis as of {new Date(analysis.analysisTimestamp).toLocaleString()}
          {analysis.typeOfAnalysis && ` · ${analysis.typeOfAnalysis}`}
        </div>
      )}

      {analysis && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-gray-400">
          <div className="glass-effect rounded-xl p-3">
            <div className="text-gray-500">Symbol</div>
            <div className="text-white font-semibold">{analysis.symbol ?? symbol}</div>
          </div>
          <div className="glass-effect rounded-xl p-3">
            <div className="text-gray-500">Category</div>
            <div className="text-white font-semibold">{analysis.category ?? '—'}</div>
          </div>
          <div className="glass-effect rounded-xl p-3">
            <div className="text-gray-500">Interval</div>
            <div className="text-white font-semibold">{analysis.interval ?? interval}</div>
          </div>
          <div className="glass-effect rounded-xl p-3">
            <div className="text-gray-500">Current Price</div>
            <div className="text-white font-semibold">{fmtPrice(analysis.currentPrice)}</div>
          </div>
        </div>
      )}

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
          <ScoreCards analysis={analysis} />

          <div>
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Technical Indicators</h2>
            <IndicatorsPanel analysis={analysis} />
          </div>

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

          <ElliottWavePanel analysis={analysis} />

          <SignalsList analysis={analysis} />

          <SignalHistory market="forex" symbol={symbol} title="Prediction History" />
        </div>
      ) : null}
    </div>
  )
}
