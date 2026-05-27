import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  Brain, TrendingUp, TrendingDown, Activity, Volume2,
  BarChart3, Zap, Target, AlertTriangle, CheckCircle,
  Clock, DollarSign, Percent, Eye, RefreshCw, Waves,
  Triangle, Square, Hexagon, Globe, Calendar, Compass,
  ArrowUpRight, ArrowDownRight, Minus, FileText, Shield, Loader
} from 'lucide-react'
import USStocksDataService from '../services/USStocksDataService'
import { usStocksWebSocket } from '../services/WebSocketService'

// ─────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────
const fmt2 = (n) => (n == null ? '—' : Number(n).toFixed(2))
const fmtPct = (n) => (n == null ? '—' : `${Number(n).toFixed(2)}%`)
const fmtPrice = (n) => (n == null ? '—' : `$${Number(n).toFixed(2)}`)
const fmtScore = (n) => (n == null ? '—' : (Number(n) > 0 ? `+${Number(n).toFixed(3)}` : Number(n).toFixed(3)))

const directionColor = (dir) => {
  const d = String(dir || '').toUpperCase()
  if (d.includes('STRONG BUY') || d === 'STRONG BUY') return 'text-emerald-400'
  if (d === 'BUY') return 'text-green-400'
  if (d.includes('STRONG SELL') || d === 'STRONG SELL') return 'text-rose-500'
  if (d === 'SELL') return 'text-red-400'
  return 'text-yellow-400'
}

const SignalBadge = ({ signal }) => {
  const s = String(signal || '').toUpperCase()
  const color =
    s.includes('STRONG BUY') ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
    s === 'BUY' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
    s.includes('STRONG SELL') ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' :
    s === 'SELL' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
    'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold border ${color}`}>
      {signal || 'NEUTRAL'}
    </span>
  )
}

const ScoreBar = ({ label, value, max = 3, color = 'purple' }) => {
  const pct = Math.min(100, Math.max(0, ((Number(value) + max) / (max * 2)) * 100))
  const colors = {
    purple: 'bg-purple-500',
    green: 'bg-green-500',
    blue: 'bg-blue-500',
    orange: 'bg-orange-500'
  }
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-400">{label}</span>
        <span className={`font-mono font-semibold ${Number(value) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
          {fmtScore(value)}
        </span>
      </div>
      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${colors[color] || colors.purple}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

const RsiGauge = ({ value }) => {
  const v = Number(value) || 50
  const pct = Math.min(100, Math.max(0, v))
  const color = v < 30 ? 'bg-green-400' : v > 70 ? 'bg-red-400' : 'bg-yellow-400'
  const label = v < 30 ? 'Oversold' : v > 70 ? 'Overbought' : 'Neutral'
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-400">RSI</span>
        <span className={`font-mono font-semibold ${color.replace('bg-', 'text-')}`}>{fmt2(v)} — {label}</span>
      </div>
      <div className="h-2 bg-gray-700 rounded-full overflow-hidden relative">
        {/* Oversold zone */}
        <div className="absolute left-0 top-0 h-full w-[30%] bg-green-900/40 rounded-l-full" />
        {/* Overbought zone */}
        <div className="absolute right-0 top-0 h-full w-[30%] bg-red-900/40 rounded-r-full" />
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────
const USStocksAdvancedAnalysis = ({ selectedStock = 'AAPL', stockData = null }) => {
  const [activeTab, setActiveTab] = useState('overview')
  const [prediction, setPrediction] = useState(null)
  const [priceData, setPriceData] = useState(null)
  const [status, setStatus] = useState('idle') // 'idle' | 'loading' | 'syncing' | 'ready' | 'error'
  const [syncMessage, setSyncMessage] = useState('')
  const [dataSource, setDataSource] = useState('—')
  const abortRef = useRef(false)

  // WebSocket live price updates
  const handleWsUpdate = useCallback((update) => {
    setPriceData(prev => ({
      ...(prev || {}),
      price: update.price ?? prev?.price,
      change: update.change ?? prev?.change,
      changePercent: update.changePercent ?? prev?.changePercent,
      volume: update.volume ?? prev?.volume,
      high: update.high ?? prev?.high,
      low: update.low ?? prev?.low
    }))
  }, [])

  useEffect(() => {
    usStocksWebSocket.subscribe(selectedStock, handleWsUpdate)
    return () => usStocksWebSocket.unsubscribe(selectedStock, handleWsUpdate)
  }, [selectedStock, handleWsUpdate])

  // Load price data from props or service
  useEffect(() => {
    if (stockData) {
      setPriceData(stockData)
    } else {
      USStocksDataService.fetchStockData(selectedStock)
        .then(d => setPriceData(d))
        .catch(() => {})
    }
  }, [selectedStock, stockData])

  // Load full SeunBot prediction
  useEffect(() => {
    if (!selectedStock) return
    abortRef.current = false
    setStatus('loading')
    setPrediction(null)
    setSyncMessage('')

    const load = async () => {
      try {
        setStatus('syncing')
        setSyncMessage('Requesting analysis from SeunBot backend...')
        const result = await USStocksDataService.fetchUsPrediction(selectedStock, {
          maxRetries: 5,
          retryDelayMs: 5000
        })

        if (abortRef.current) return

        if (result._isSyncing) {
          setStatus('syncing')
          setSyncMessage(result.message || 'Data is still syncing. Please retry in a moment.')
          return
        }

        setPrediction(result)
        setStatus('ready')
        setDataSource(`✅ Live — ${result.analysisTimestamp ? new Date(result.analysisTimestamp).toLocaleTimeString() : 'just now'}`)
      } catch (err) {
        if (abortRef.current) return
        setStatus('error')
        setDataSource('❌ Unavailable')
      }
    }

    load()
    return () => { abortRef.current = true }
  }, [selectedStock])

  const handleRefresh = () => {
    abortRef.current = false
    setStatus('loading')
    setPrediction(null)
    setSyncMessage('')

    USStocksDataService.fetchUsPrediction(selectedStock, { maxRetries: 5, retryDelayMs: 5000 })
      .then(result => {
        if (abortRef.current) return
        if (result._isSyncing) {
          setStatus('syncing')
          setSyncMessage(result.message || 'Still syncing.')
          return
        }
        setPrediction(result)
        setStatus('ready')
        setDataSource(`✅ Live — ${result.analysisTimestamp ? new Date(result.analysisTimestamp).toLocaleTimeString() : 'just now'}`)
      })
      .catch(() => {
        if (!abortRef.current) setStatus('error')
      })
  }

  // ── Price bar shown in all states ──────────────────
  const PriceBar = () => {
    const d = priceData || stockData
    if (!d) return null
    return (
      <div className="mb-4 p-3 bg-gray-700/40 border border-gray-600/40 rounded-lg flex flex-wrap gap-6 items-center">
        <div>
          <div className="text-xs text-gray-400 mb-0.5">Current Price</div>
          <div className="text-2xl font-bold text-white">{fmtPrice(d.price)}</div>
        </div>
        <div>
          <div className="text-xs text-gray-400 mb-0.5">24h Change</div>
          <div className={`text-lg font-semibold flex items-center gap-1 ${d.changePercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {d.changePercent >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
            {d.changePercent >= 0 ? '+' : ''}{fmtPct(d.changePercent)}
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-400 mb-0.5">Volume</div>
          <div className="text-lg font-semibold text-white">{d.volume ? `${(d.volume / 1e6).toFixed(2)}M` : '—'}</div>
        </div>
        <div>
          <div className="text-xs text-gray-400 mb-0.5">High / Low</div>
          <div className="text-sm text-white">{fmtPrice(d.high)} / {fmtPrice(d.low)}</div>
        </div>
        <div className="ml-auto text-xs text-gray-500">{dataSource}</div>
      </div>
    )
  }

  // ── Loading / Syncing ──────────────────────────────
  if (status === 'loading' || (status === 'syncing' && !prediction)) {
    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <Header selectedStock={selectedStock} dataSource={dataSource} onRefresh={handleRefresh} />
        <PriceBar />
        <div className="flex flex-col items-center justify-center h-48 gap-4">
          <Loader className="w-10 h-10 text-purple-400 animate-spin" />
          <div className="text-center">
            <p className="text-white font-medium">
              {status === 'loading' ? 'Connecting to SeunBot backend...' : 'Syncing historical data...'}
            </p>
            {syncMessage && (
              <p className="text-sm text-gray-400 mt-1 max-w-sm text-center">{syncMessage}</p>
            )}
            <p className="text-xs text-gray-500 mt-2">This may take up to 30 seconds for a fresh symbol</p>
          </div>
        </div>
      </div>
    )
  }

  // ── Error / Still syncing after retries ───────────
  if (status === 'error' || (status === 'syncing' && !prediction)) {
    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <Header selectedStock={selectedStock} dataSource={dataSource} onRefresh={handleRefresh} />
        <PriceBar />
        <div className="flex flex-col items-center justify-center h-48 gap-4">
          <AlertTriangle className="w-12 h-12 text-yellow-400 opacity-70" />
          <div className="text-center">
            <p className="text-white font-medium">
              {status === 'syncing' ? 'Data still syncing — please try again shortly' : 'Analysis temporarily unavailable'}
            </p>
            {syncMessage && <p className="text-sm text-gray-400 mt-1 max-w-sm">{syncMessage}</p>}
            <button
              onClick={handleRefresh}
              className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white text-sm transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Full analysis ─────────────────────────────────
  const ind = prediction?.indicators || {}
  const scores = prediction?.scores || {}
  const tradePlan = prediction?.tradePlan
  const weeklySetup = prediction?.weeklyTradeSetup
  const geometricPattern = prediction?.geometricPattern
  const elliottWave = prediction?.elliottWavesPattern

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'indicators', label: 'Indicators', icon: Activity },
    { id: 'tradePlan', label: 'Trade Plan', icon: Target },
    { id: 'patterns', label: 'Patterns', icon: Triangle },
    { id: 'narrative', label: 'Narrative', icon: FileText }
  ]

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      {/* Header */}
      <Header selectedStock={selectedStock} dataSource={dataSource} onRefresh={handleRefresh} />

      {/* Price Bar */}
      <PriceBar />

      {/* ── SEUN BOT Master Signal ── */}
      <div className="mb-6 p-5 rounded-xl bg-gradient-to-r from-purple-900/40 via-blue-900/30 to-gray-800 border border-purple-500/30">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-400" />
            <span className="text-white font-bold text-lg">SeunBot Signal</span>
            <span className="text-xs text-gray-400 bg-gray-700/60 px-2 py-0.5 rounded">{selectedStock}</span>
          </div>
          <SignalBadge signal={prediction?.overallMtfSignal || prediction?.direction} />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div className="bg-gray-800/60 rounded-lg p-3 text-center">
            <div className="text-xs text-gray-400 mb-1">Direction</div>
            <div className={`text-lg font-bold ${directionColor(prediction?.direction)}`}>
              {prediction?.direction || '—'}
            </div>
          </div>
          <div className="bg-gray-800/60 rounded-lg p-3 text-center">
            <div className="text-xs text-gray-400 mb-1">Final Score</div>
            <div className={`text-lg font-bold ${Number(prediction?.finalScore) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {fmtScore(prediction?.finalScore)}
            </div>
          </div>
          <div className="bg-gray-800/60 rounded-lg p-3 text-center">
            <div className="text-xs text-gray-400 mb-1">Signal Strength</div>
            <div className="text-lg font-bold text-white">
              {fmt2(prediction?.signalStrength)} / 3
            </div>
          </div>
          <div className="bg-gray-800/60 rounded-lg p-3 text-center">
            <div className="text-xs text-gray-400 mb-1">Strong Signal</div>
            <div className={`text-lg font-bold ${prediction?.isStrongSignal ? 'text-emerald-400' : 'text-gray-400'}`}>
              {prediction?.isStrongSignal ? '✓ Yes' : '✗ No'}
            </div>
          </div>
        </div>

        {/* Score breakdown bars */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <ScoreBar label="Technical" value={scores.technical} color="purple" />
          <ScoreBar label="Gann" value={scores.gann} color="blue" />
          <ScoreBar label="Sentiment" value={scores.sentiment} color="orange" />
          <ScoreBar label="Fundamental" value={scores.fundamental} color="green" />
        </div>

        {scores.weights && (
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-500">
            {Object.entries(scores.weights).map(([k, v]) => (
              <span key={k} className="bg-gray-700/40 px-2 py-0.5 rounded">{k}: {v}</span>
            ))}
          </div>
        )}
      </div>

      {/* ── Tabs ── */}
      <div className="flex flex-wrap gap-1 mb-5 bg-gray-700/40 rounded-lg p-1">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-purple-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-600'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Tab Content ── */}
      <div>
        {activeTab === 'overview' && (
          <OverviewTab
            weeklySetup={weeklySetup}
            geometricPattern={geometricPattern}
            elliottWave={elliottWave}
            prediction={prediction}
          />
        )}
        {activeTab === 'indicators' && <IndicatorsTab ind={ind} />}
        {activeTab === 'tradePlan' && <TradePlanTab tradePlan={tradePlan} prediction={prediction} />}
        {activeTab === 'patterns' && (
          <PatternsTab
            geometricPattern={geometricPattern}
            elliottWave={elliottWave}
            weeklySetup={weeklySetup}
          />
        )}
        {activeTab === 'narrative' && <NarrativeTab narrative={prediction?.tradeNarrative} />}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────

const Header = ({ selectedStock, dataSource, onRefresh }) => (
  <div className="flex items-center justify-between mb-4">
    <div className="flex items-center gap-2">
      <Brain className="w-5 h-5 text-purple-400" />
      <h3 className="text-lg font-semibold text-white">SeunBot Advanced Analysis</h3>
      <span className="px-2 py-0.5 bg-purple-500/20 rounded text-xs text-purple-400">{selectedStock}</span>
    </div>
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-500">{dataSource}</span>
      <button
        onClick={onRefresh}
        className="p-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-gray-400 transition-colors"
        title="Refresh analysis"
      >
        <RefreshCw className="w-4 h-4" />
      </button>
    </div>
  </div>
)

const OverviewTab = ({ weeklySetup, geometricPattern, elliottWave, prediction }) => (
  <div className="space-y-4">
    {/* Weekly Trade Setup */}
    {weeklySetup && (
      <div className="p-4 bg-gray-700/30 rounded-lg border border-gray-600/30">
        <h4 className="text-white font-medium mb-3 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-blue-400" />
          Weekly Trade Setup
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="bg-gray-800/60 rounded-lg p-3">
            <div className="text-xs text-gray-400 mb-1">Setup Name</div>
            <div className={`text-base font-bold ${weeklySetup.setupName === 'Bull' ? 'text-green-400' : weeklySetup.setupName === 'Bear' ? 'text-red-400' : 'text-yellow-400'}`}>
              {weeklySetup.setupName || '—'}
            </div>
          </div>
          <div className="bg-gray-800/60 rounded-lg p-3 md:col-span-2">
            <div className="text-xs text-gray-400 mb-1">Description</div>
            <div className="text-sm text-white">{weeklySetup.description || '—'}</div>
          </div>
          <div className="bg-gray-800/60 rounded-lg p-3">
            <div className="text-xs text-gray-400 mb-1">Setup Confidence</div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-gray-700 rounded-full">
                <div
                  className="h-full bg-blue-500 rounded-full"
                  style={{ width: `${Math.round((weeklySetup.setupConfidence || 0) * 100)}%` }}
                />
              </div>
              <span className="text-sm font-semibold text-blue-400">
                {Math.round((weeklySetup.setupConfidence || 0) * 100)}%
              </span>
            </div>
          </div>
        </div>
      </div>
    )}

    {/* Geometric Pattern */}
    {geometricPattern && (
      <div className="p-4 bg-gray-700/30 rounded-lg border border-gray-600/30">
        <h4 className="text-white font-medium mb-3 flex items-center gap-2">
          <Triangle className="w-4 h-4 text-orange-400" />
          Chart Pattern
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="bg-gray-800/60 rounded-lg p-3">
            <div className="text-xs text-gray-400 mb-1">Pattern</div>
            <div className="text-base font-bold text-orange-400">{geometricPattern.name || '—'}</div>
          </div>
          <div className="bg-gray-800/60 rounded-lg p-3">
            <div className="text-xs text-gray-400 mb-1">Confidence</div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-gray-700 rounded-full">
                <div
                  className="h-full bg-orange-500 rounded-full"
                  style={{ width: `${Math.round((geometricPattern.confidence || 0) * 100)}%` }}
                />
              </div>
              <span className="text-sm font-semibold text-orange-400">
                {Math.round((geometricPattern.confidence || 0) * 100)}%
              </span>
            </div>
          </div>
          <div className="bg-gray-800/60 rounded-lg p-3 md:col-span-3">
            <div className="text-xs text-gray-400 mb-1">Description</div>
            <div className="text-sm text-gray-300">{geometricPattern.description || '—'}</div>
          </div>
        </div>
      </div>
    )}

    {/* Elliott Wave */}
    {elliottWave && elliottWave !== 'No clear Elliott Wave pattern' && (
      <div className="p-4 bg-gray-700/30 rounded-lg border border-gray-600/30">
        <h4 className="text-white font-medium mb-2 flex items-center gap-2">
          <Waves className="w-4 h-4 text-purple-400" />
          Elliott Wave Pattern
        </h4>
        <div className="text-sm text-gray-300">{elliottWave}</div>
      </div>
    )}

    {/* Analysis Timestamp */}
    {prediction?.analysisTimestamp && (
      <div className="flex items-center gap-2 text-xs text-gray-500 pt-2">
        <Clock className="w-3 h-3" />
        Analysis generated: {new Date(prediction.analysisTimestamp).toLocaleString()}
      </div>
    )}
  </div>
)

const IndicatorsTab = ({ ind }) => {
  const macd = ind?.macd || {}
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* RSI */}
        <div className="p-4 bg-gray-700/30 rounded-lg border border-gray-600/30">
          <h4 className="text-white font-medium mb-3">RSI (14)</h4>
          <RsiGauge value={ind?.rsi} />
          <div className="mt-3 text-2xl font-bold text-center">
            <span className={ind?.rsi < 30 ? 'text-green-400' : ind?.rsi > 70 ? 'text-red-400' : 'text-yellow-400'}>
              {fmt2(ind?.rsi)}
            </span>
          </div>
        </div>

        {/* ADX */}
        <div className="p-4 bg-gray-700/30 rounded-lg border border-gray-600/30">
          <h4 className="text-white font-medium mb-3">ADX (Trend Strength)</h4>
          <div className="text-xs text-gray-400 mb-2 flex justify-between">
            <span>Ranging (&lt;20)</span>
            <span>Trending (&gt;25)</span>
          </div>
          <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${ind?.adx > 25 ? 'bg-purple-500' : 'bg-gray-500'}`}
              style={{ width: `${Math.min(100, Number(ind?.adx) || 0)}%` }}
            />
          </div>
          <div className="mt-3 text-2xl font-bold text-center">
            <span className={ind?.adx > 25 ? 'text-purple-400' : 'text-gray-400'}>
              {fmt2(ind?.adx)}
            </span>
          </div>
          <div className="text-xs text-center text-gray-500 mt-1">
            {ind?.adx > 40 ? 'Very Strong Trend' : ind?.adx > 25 ? 'Trending' : ind?.adx > 20 ? 'Weak Trend' : 'Ranging / Choppy'}
          </div>
        </div>
      </div>

      {/* ATR */}
      <div className="p-4 bg-gray-700/30 rounded-lg border border-gray-600/30">
        <h4 className="text-white font-medium mb-3">ATR (Average True Range)</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-gray-400">ATR Value (Volatility)</div>
            <div className="text-2xl font-bold text-blue-400">{fmt2(ind?.atr)}</div>
            <div className="text-xs text-gray-500 mt-1">Daily average price range</div>
          </div>
          <div>
            <div className="text-xs text-gray-400">Volatility Level</div>
            <div className={`text-lg font-semibold ${ind?.atr > 50 ? 'text-red-400' : ind?.atr > 20 ? 'text-yellow-400' : 'text-green-400'}`}>
              {ind?.atr > 50 ? '🔴 High' : ind?.atr > 20 ? '🟡 Medium' : '🟢 Low'}
            </div>
          </div>
        </div>
      </div>

      {/* MACD */}
      <div className="p-4 bg-gray-700/30 rounded-lg border border-gray-600/30">
        <h4 className="text-white font-medium mb-3 flex items-center gap-2">
          <Activity className="w-4 h-4 text-blue-400" />
          MACD
          {macd.status && (
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              macd.status === 'Bullish' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
            }`}>
              {macd.status}
            </span>
          )}
        </h4>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-gray-800/60 rounded-lg p-3 text-center">
            <div className="text-xs text-gray-400 mb-1">MACD Line</div>
            <div className={`text-lg font-bold ${Number(macd.macdLine) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {fmt2(macd.macdLine)}
            </div>
          </div>
          <div className="bg-gray-800/60 rounded-lg p-3 text-center">
            <div className="text-xs text-gray-400 mb-1">Signal Line</div>
            <div className="text-lg font-bold text-blue-400">{fmt2(macd.signalLine)}</div>
          </div>
          <div className="bg-gray-800/60 rounded-lg p-3 text-center">
            <div className="text-xs text-gray-400 mb-1">Histogram</div>
            <div className={`text-lg font-bold ${Number(macd.histogram) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {fmt2(macd.histogram)}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const TradePlanTab = ({ tradePlan, prediction }) => {
  if (!tradePlan) {
    return (
      <div className="flex flex-col items-center justify-center h-40 gap-3">
        <Shield className="w-12 h-12 text-gray-600" />
        <p className="text-gray-400 text-center">
          No trade plan generated — signal strength is below threshold for a recommended trade.
        </p>
        <p className="text-xs text-gray-500">SeunBot requires a minimum score to publish a trade plan.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Is Recommended */}
      <div className={`flex items-center gap-3 p-4 rounded-lg border ${
        tradePlan.isRecommended
          ? 'bg-green-500/10 border-green-500/30'
          : 'bg-yellow-500/10 border-yellow-500/30'
      }`}>
        {tradePlan.isRecommended
          ? <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
          : <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
        }
        <div>
          <div className={`font-semibold ${tradePlan.isRecommended ? 'text-green-400' : 'text-yellow-400'}`}>
            {tradePlan.isRecommended ? 'Trade Recommended by SeunBot' : 'Trade Not Recommended — Monitor Only'}
          </div>
          <div className="text-sm text-gray-300 mt-0.5">
            Direction: <strong>{tradePlan.direction || prediction?.direction || '—'}</strong>
          </div>
        </div>
      </div>

      {/* Entry / Stop / Targets */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
          <div className="text-xs text-gray-400 mb-1">Entry Price</div>
          <div className="text-xl font-bold text-blue-400">{fmtPrice(tradePlan.entryPrice)}</div>
        </div>
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
          <div className="text-xs text-gray-400 mb-1">Stop Loss</div>
          <div className="text-xl font-bold text-red-400">{fmtPrice(tradePlan.stopLoss)}</div>
          {tradePlan.entryPrice && tradePlan.stopLoss && (
            <div className="text-xs text-gray-500 mt-1">
              Risk: {fmtPct(Math.abs((tradePlan.stopLoss - tradePlan.entryPrice) / tradePlan.entryPrice * 100))}
            </div>
          )}
        </div>
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
          <div className="text-xs text-gray-400 mb-1">Take Profit 1</div>
          <div className="text-xl font-bold text-green-400">{fmtPrice(tradePlan.takeProfit1)}</div>
          {tradePlan.riskRewardRatio1 && (
            <div className="text-xs text-gray-400 mt-1">RR: {fmt2(tradePlan.riskRewardRatio1)}</div>
          )}
        </div>
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4">
          <div className="text-xs text-gray-400 mb-1">Take Profit 2</div>
          <div className="text-xl font-bold text-emerald-400">{fmtPrice(tradePlan.takeProfit2)}</div>
          {tradePlan.riskRewardRatio2 && (
            <div className="text-xs text-gray-400 mt-1">RR: {fmt2(tradePlan.riskRewardRatio2)}</div>
          )}
        </div>
      </div>

      {/* Reason */}
      {tradePlan.reason && (
        <div className="p-4 bg-gray-700/30 rounded-lg border border-gray-600/30">
          <h4 className="text-white font-medium mb-2 flex items-center gap-2">
            <Brain className="w-4 h-4 text-purple-400" />
            SeunBot Reasoning
          </h4>
          <p className="text-sm text-gray-300 leading-relaxed">{tradePlan.reason}</p>
        </div>
      )}
    </div>
  )
}

const PatternsTab = ({ geometricPattern, elliottWave, weeklySetup }) => (
  <div className="space-y-4">
    {geometricPattern && (
      <div className="p-4 bg-gray-700/30 rounded-lg border border-gray-600/30">
        <h4 className="text-white font-medium mb-3 flex items-center gap-2">
          <Triangle className="w-4 h-4 text-orange-400" />
          Geometric Pattern — {geometricPattern.name}
        </h4>
        <div className="flex items-center gap-4 mb-2">
          <div className="text-sm text-gray-400">Confidence</div>
          <div className="flex-1 h-2 bg-gray-700 rounded-full">
            <div
              className="h-full bg-orange-500 rounded-full"
              style={{ width: `${Math.round((geometricPattern.confidence || 0) * 100)}%` }}
            />
          </div>
          <div className="text-sm font-semibold text-orange-400">
            {Math.round((geometricPattern.confidence || 0) * 100)}%
          </div>
        </div>
        <p className="text-sm text-gray-300">{geometricPattern.description}</p>
      </div>
    )}

    {elliottWave && (
      <div className="p-4 bg-gray-700/30 rounded-lg border border-gray-600/30">
        <h4 className="text-white font-medium mb-3 flex items-center gap-2">
          <Waves className="w-4 h-4 text-purple-400" />
          Elliott Wave Pattern
        </h4>
        <p className="text-sm text-gray-300">{elliottWave}</p>
      </div>
    )}

    {weeklySetup && (
      <div className="p-4 bg-gray-700/30 rounded-lg border border-gray-600/30">
        <h4 className="text-white font-medium mb-3 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-blue-400" />
          Weekly Setup
        </h4>
        <div className="space-y-2">
          <div>
            <span className="text-xs text-gray-400">Type: </span>
            <span className={`font-semibold ${weeklySetup.setupName === 'Bull' ? 'text-green-400' : weeklySetup.setupName === 'Bear' ? 'text-red-400' : 'text-yellow-400'}`}>
              {weeklySetup.setupName}
            </span>
          </div>
          <p className="text-sm text-gray-300">{weeklySetup.description}</p>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-xs text-gray-400">Confidence:</span>
            <div className="flex-1 h-1.5 bg-gray-700 rounded-full">
              <div
                className="h-full bg-blue-500 rounded-full"
                style={{ width: `${Math.round((weeklySetup.setupConfidence || 0) * 100)}%` }}
              />
            </div>
            <span className="text-xs font-semibold text-blue-400">
              {Math.round((weeklySetup.setupConfidence || 0) * 100)}%
            </span>
          </div>
        </div>
      </div>
    )}

    {!geometricPattern && !elliottWave && !weeklySetup && (
      <div className="flex flex-col items-center justify-center h-40 gap-3">
        <Hexagon className="w-12 h-12 text-gray-600" />
        <p className="text-gray-400">No pattern data available for this symbol yet.</p>
      </div>
    )}
  </div>
)

const NarrativeTab = ({ narrative }) => {
  if (!narrative) {
    return (
      <div className="flex flex-col items-center justify-center h-40 gap-3">
        <FileText className="w-12 h-12 text-gray-600" />
        <p className="text-gray-400">No trade narrative available.</p>
      </div>
    )
  }
  return (
    <div className="p-4 bg-gray-700/30 rounded-lg border border-gray-600/30">
      <h4 className="text-white font-medium mb-3 flex items-center gap-2">
        <FileText className="w-4 h-4 text-purple-400" />
        SeunBot Trade Narrative
      </h4>
      <pre className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap font-sans">
        {narrative}
      </pre>
    </div>
  )
}

export default USStocksAdvancedAnalysis
