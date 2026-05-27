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
const USStocksAdvancedAnalysis = ({ selectedStock = '', stockData = null, stocks = [], onSelectStock }) => {
  const [activeTab, setActiveTab] = useState('overview')
  const [prediction, setPrediction] = useState(null)
  const [verification, setVerification] = useState(null)
  const [sentiment, setSentiment] = useState(null)
  const [history, setHistory] = useState([])
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

  // Load full SeunBot prediction + details
  useEffect(() => {
    if (!selectedStock) return
    abortRef.current = false
    setStatus('loading')
    setPrediction(null)
    setVerification(null)
    setSentiment(null)
    setHistory([])
    setSyncMessage('')

    const load = async () => {
      try {
        setStatus('syncing')
        setSyncMessage('Requesting analysis from SeunBot backend...')
        const [result, verifyRes, sentimentRes, historyRes] = await Promise.all([
          USStocksDataService.fetchUsPrediction(selectedStock, { maxRetries: 5, retryDelayMs: 5000 }),
          USStocksDataService.verifyData(selectedStock).catch(() => null),
          USStocksDataService.fetchSentiment(selectedStock).catch(() => null),
          USStocksDataService.fetchHistory(selectedStock, 10).catch(() => [])
        ])

        if (abortRef.current) return

        if (result._isSyncing) {
          setStatus('syncing')
          setSyncMessage(result.message || 'Data is still syncing. Please retry in a moment.')
          return
        }

        setPrediction(result)
        setVerification(verifyRes)
        setSentiment(sentimentRes)
        setHistory(historyRes || [])
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
    setVerification(null)
    setSentiment(null)
    setHistory([])
    setSyncMessage('')

    Promise.all([
      USStocksDataService.fetchUsPrediction(selectedStock, { maxRetries: 5, retryDelayMs: 5000 }),
      USStocksDataService.verifyData(selectedStock).catch(() => null),
      USStocksDataService.fetchSentiment(selectedStock).catch(() => null),
      USStocksDataService.fetchHistory(selectedStock, 10).catch(() => [])
    ])
      .then(([result, verifyRes, sentimentRes, historyRes]) => {
        if (abortRef.current) return
        if (result._isSyncing) {
          setStatus('syncing')
          setSyncMessage(result.message || 'Still syncing.')
          return
        }
        setPrediction(result)
        setVerification(verifyRes)
        setSentiment(sentimentRes)
        setHistory(historyRes || [])
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
      <div className="mb-4 p-3 bg-gray-700/40 border border-gray-600/40 rounded-lg grid grid-cols-2 sm:flex sm:flex-wrap gap-4 sm:gap-6 items-center">
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
        <div className="col-span-2 sm:ml-auto text-xs text-gray-500 text-right sm:text-left">{dataSource}</div>
      </div>
    )
  }

  // ── No Stock Selected ──────────────────────────────
  if (!selectedStock) {
    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <Header
          selectedStock=""
          dataSource=""
          onRefresh={() => {}}
          stocks={stocks}
          onSelectStock={onSelectStock}
        />
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <Brain className="w-16 h-16 text-gray-600 animate-pulse" />
          <div className="text-center">
            <p className="text-white font-medium text-lg">Select a Stock to Begin Analysis</p>
            <p className="text-sm text-gray-400 mt-1">Use the dropdown menu at the top or pick a stock from the Market Overview tab.</p>
          </div>
        </div>
      </div>
    )
  }

  // ── Loading / Syncing ──────────────────────────────
  if (status === 'loading' || (status === 'syncing' && !prediction)) {
    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <Header selectedStock={selectedStock} dataSource={dataSource} onRefresh={handleRefresh} stocks={stocks} onSelectStock={onSelectStock} />
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
        <Header selectedStock={selectedStock} dataSource={dataSource} onRefresh={handleRefresh} stocks={stocks} onSelectStock={onSelectStock} />
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
    { id: 'sentiment', label: 'AI Sentiment (Grok)', icon: Globe },
    { id: 'history', label: 'Prediction History', icon: Clock },
    { id: 'indicators', label: 'Indicators', icon: Activity },
    { id: 'tradePlan', label: 'Trade Plan', icon: Target },
    { id: 'patterns', label: 'Patterns', icon: Triangle },
    { id: 'narrative', label: 'Narrative', icon: FileText }
  ]

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      {/* Header */}
      <Header selectedStock={selectedStock} dataSource={dataSource} onRefresh={handleRefresh} verification={verification} stocks={stocks} onSelectStock={onSelectStock} />

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
      <div className="flex overflow-x-auto whitespace-nowrap gap-1 mb-5 bg-gray-700/40 rounded-lg p-1 scrollbar-none scroll-smooth">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
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
        {activeTab === 'indicators' && <IndicatorsTab ind={ind} prediction={prediction} />}
        {activeTab === 'tradePlan' && <TradePlanTab tradePlan={tradePlan} prediction={prediction} />}
        {activeTab === 'patterns' && (
          <PatternsTab
            geometricPattern={geometricPattern}
            elliottWave={elliottWave}
            weeklySetup={weeklySetup}
          />
        )}
        {activeTab === 'narrative' && <NarrativeTab narrative={prediction?.tradeNarrative} />}
        {activeTab === 'sentiment' && <SentimentTab sentiment={sentiment} />}
        {activeTab === 'history' && <HistoryTab history={history} />}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────

const Header = ({ selectedStock, dataSource, onRefresh, verification, stocks = [], onSelectStock }) => (
  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
    <div className="flex flex-wrap items-center gap-2">
      <Brain className="w-5 h-5 text-purple-400" />
      <h3 className="text-lg font-semibold text-white">SeunBot Advanced Analysis</h3>
      {stocks && stocks.length > 0 ? (
        <select
          value={selectedStock || ''}
          onChange={(e) => onSelectStock && onSelectStock(e.target.value)}
          className="px-3 py-1.5 bg-gray-700 border border-gray-600 rounded-lg text-xs text-white font-semibold focus:outline-none focus:border-purple-500 cursor-pointer max-w-[200px]"
        >
          {!selectedStock && <option value="">-- Select a Stock --</option>}
          {stocks.map(s => (
            <option key={s.symbol} value={s.symbol}>
              {s.symbol} - {s.name}
            </option>
          ))}
        </select>
      ) : (
        <span className="px-2 py-0.5 bg-purple-500/20 rounded text-xs text-purple-400 font-semibold">{selectedStock}</span>
      )}
      {verification && (
        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
          verification.dataQuality === 'HIGH' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
          verification.dataQuality === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
          'bg-red-500/20 text-red-400 border border-red-500/30'
        }`}>
          Data Quality: {verification.dataQuality || 'UNKNOWN'} ({verification.recordCount || 0} records)
        </span>
      )}
    </div>
    <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto border-t sm:border-t-0 border-gray-700/50 pt-2 sm:pt-0">
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
    {/* Score breakdown — available from API */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {[
        { label: 'Technical Score', value: prediction?.scores?.technical, color: 'purple', icon: Activity },
        { label: 'Sentiment Score', value: prediction?.scores?.sentiment, color: 'orange', icon: Globe },
        { label: 'Fundamental Score', value: prediction?.scores?.fundamental, color: 'green', icon: DollarSign }
      ].map(({ label, value, color, icon: Icon }) => {
        const n = Number(value ?? 0);
        const pct = Math.min(100, Math.max(0, ((n + 1) / 2) * 100));
        const colorMap = { purple: 'text-purple-400 bg-purple-500', orange: 'text-orange-400 bg-orange-500', green: 'text-green-400 bg-green-500' };
        const [textColor, bgColor] = colorMap[color].split(' ');
        return (
          <div key={label} className="p-4 bg-gray-700/30 rounded-lg border border-gray-600/30">
            <div className="flex items-center gap-2 mb-2">
              <Icon className={`w-4 h-4 ${textColor}`} />
              <span className="text-sm text-gray-400">{label}</span>
            </div>
            <div className={`text-2xl font-bold ${n >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {n > 0 ? `+${n.toFixed(3)}` : n.toFixed(3)}
            </div>
            <div className="mt-2 h-1.5 bg-gray-700 rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${bgColor}`} style={{ width: `${pct}%` }} />
            </div>
          </div>
        );
      })}
    </div>

    {/* Hybrid signal indicators */}
    {prediction?.breakdown?.technicalIndicators && (
      <div className="p-4 bg-gray-700/30 rounded-lg border border-gray-600/30">
        <h4 className="text-white font-medium mb-3 flex items-center gap-2">
          <Zap className="w-4 h-4 text-yellow-400" />
          Technical Signal Breakdown
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {Object.entries(prediction.breakdown.technicalIndicators)
            .filter(([k]) => !k.toLowerCase().includes('signal') && !k.toLowerCase().includes('strong'))
            .map(([key, val]) => {
              const n = Number(val);
              if (!Number.isFinite(n)) return null;
              return (
                <div key={key} className="bg-gray-800/60 rounded-lg p-3">
                  <div className="text-xs text-gray-400 mb-1">{key.replace(/([A-Z])/g, ' $1').trim()}</div>
                  <div className={`text-base font-bold ${n >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {n > 0 ? `+${n.toFixed(3)}` : n.toFixed(3)}
                  </div>
                </div>
              );
            })
          }
        </div>
      </div>
    )}

    {/* Key Factors */}
    {prediction?.keyFactors?.length > 0 && (
      <div className="p-4 bg-gray-700/30 rounded-lg border border-gray-600/30">
        <h4 className="text-white font-medium mb-3 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-400" />
          Key Factors
        </h4>
        <ul className="space-y-2">
          {prediction.keyFactors.map((f, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
              <span className="text-green-400 mt-0.5">•</span>
              <span>{f}</span>
            </li>
          ))}
        </ul>
      </div>
    )}

    {/* Risk Factors */}
    {prediction?.risks?.length > 0 && (
      <div className="p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
        <h4 className="text-yellow-400 font-medium mb-3 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          Risk Factors
        </h4>
        <ul className="space-y-2">
          {prediction.risks.map((r, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
              <span className="text-yellow-400 mt-0.5">•</span>
              <span>{r}</span>
            </li>
          ))}
        </ul>
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

const IndicatorsTab = ({ ind, prediction }) => (
  <div className="space-y-4">
    {/* Hybrid Score indicators from breakdown.technicalIndicators */}
    {prediction?.breakdown?.technicalIndicators ? (
      <>
        <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <p className="text-xs text-blue-300">
            ℹ️ RSI, ADX, ATR and MACD raw values are not included in the current API response.
            Showing SeunBot's internal composite indicator scores instead.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(prediction.breakdown.technicalIndicators).map(([key, val]) => {
            const n = Number(val);
            if (!Number.isFinite(n)) return null;
            const isSignal = key.toLowerCase().includes('signal') || key.toLowerCase().includes('strong');
            if (isSignal) return (
              <div key={key} className="p-4 bg-gray-700/30 rounded-lg border border-gray-600/30">
                <h4 className="text-sm text-gray-400 mb-2">{key.replace(/([A-Z])/g, ' $1').trim()}</h4>
                <div className="text-lg font-bold text-white">{String(val)}</div>
              </div>
            );
            const pct = Math.min(100, Math.max(0, ((n + 1) / 2) * 100));
            return (
              <div key={key} className="p-4 bg-gray-700/30 rounded-lg border border-gray-600/30">
                <ScoreBar
                  label={key.replace(/([A-Z])/g, ' $1').trim()}
                  value={n}
                  max={1}
                  color={n >= 0 ? 'green' : 'orange'}
                />
              </div>
            );
          })}
        </div>
      </>
    ) : (
      <div className="flex flex-col items-center justify-center h-40 gap-3">
        <Activity className="w-12 h-12 text-gray-600" />
        <p className="text-gray-400 text-center">Technical indicator details not available from the current API response.</p>
      </div>
    )}
  </div>
)

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

const SentimentTab = ({ sentiment }) => {
  if (!sentiment) {
    return (
      <div className="flex flex-col items-center justify-center h-40 gap-3">
        <Globe className="w-12 h-12 text-gray-600 animate-pulse" />
        <p className="text-gray-400">Loading AI Sentiment analysis...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {sentiment.errorMessage && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-xs">
          <span className="font-semibold">Grok API Status:</span> {sentiment.errorMessage}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-700/30 border border-gray-600/30 rounded-lg p-4 flex flex-col justify-center items-center text-center">
          <span className="text-sm text-gray-400 mb-1">Grok Overall Sentiment</span>
          <span className={`text-2xl font-extrabold ${
            sentiment.sentimentLabel === 'BULLISH' ? 'text-green-400' :
            sentiment.sentimentLabel === 'BEARISH' ? 'text-red-400' : 'text-yellow-400'
          }`}>
            {sentiment.sentimentLabel || 'NEUTRAL'}
          </span>
        </div>
        <div className="bg-gray-700/30 border border-gray-600/30 rounded-lg p-4 flex flex-col justify-center items-center text-center">
          <span className="text-sm text-gray-400 mb-1">Sentiment Confidence</span>
          <span className="text-2xl font-extrabold text-white">
            {Math.round((sentiment.confidence || 0) * 100)}%
          </span>
        </div>
      </div>

      {sentiment.summary && (
        <div className="p-4 bg-gray-700/30 border border-gray-600/30 rounded-lg">
          <h4 className="text-white font-medium mb-2">AI Summary</h4>
          <p className="text-sm text-gray-300 leading-relaxed">{sentiment.summary}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-green-500/5 border border-green-500/10 rounded-lg">
          <h4 className="text-green-400 font-medium mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Drivers & Opportunities
          </h4>
          <ul className="space-y-2">
            {((sentiment.keyDrivers || []).concat(sentiment.opportunities || [])).slice(0, 5).map((item, i) => (
              <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                <span className="text-green-400 mt-1">•</span>
                <span>{item}</span>
              </li>
            ))}
            {(!sentiment.keyDrivers?.length && !sentiment.opportunities?.length) && (
              <li className="text-sm text-gray-500 italic">None reported</li>
            )}
          </ul>
        </div>

        <div className="p-4 bg-red-500/5 border border-red-500/10 rounded-lg">
          <h4 className="text-red-400 font-medium mb-3 flex items-center gap-2">
            <TrendingDown className="w-4 h-4" />
            Risk Factors
          </h4>
          <ul className="space-y-2">
            {(sentiment.risks || []).slice(0, 5).map((risk, i) => (
              <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                <span className="text-red-400 mt-1">•</span>
                <span>{risk}</span>
              </li>
            ))}
            {!sentiment.risks?.length && (
              <li className="text-sm text-gray-500 italic">None reported</li>
            )}
          </ul>
        </div>
      </div>

      {sentiment.recentNews?.length > 0 && (
        <div className="p-4 bg-gray-700/30 border border-gray-600/30 rounded-lg">
          <h4 className="text-white font-medium mb-3 flex items-center gap-2">
            <Globe className="w-4 h-4 text-purple-400" />
            Recent News Coverage
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto pr-1">
            {sentiment.recentNews.map((news, idx) => (
              <div key={idx} className="p-4 bg-gray-800 rounded-lg border border-gray-700 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <a href={news.url} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-purple-400 hover:underline">
                      {news.title}
                    </a>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold border shrink-0 ${
                      news.sentimentLabel === 'BULLISH' ? 'bg-green-500/15 text-green-400 border-green-500/20' :
                      news.sentimentLabel === 'BEARISH' ? 'bg-red-500/15 text-red-400 border-red-500/20' :
                      'bg-yellow-500/15 text-yellow-400 border-yellow-500/20'
                    }`}>
                      {news.sentimentLabel}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mb-3">{news.summary}</p>
                </div>
                <div className="flex justify-between text-[10px] text-gray-500 border-t border-gray-700 pt-2">
                  <span>{news.source}</span>
                  <span>{new Date(news.publishedAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

const HistoryTab = ({ history }) => {
  if (!history || history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-40 gap-3">
        <Clock className="w-12 h-12 text-gray-600" />
        <p className="text-gray-400 font-medium">No historical predictions recorded yet.</p>
      </div>
    )
  }

  return (
    <div className="p-4 bg-gray-700/30 border border-gray-600/30 rounded-lg">
      <h4 className="text-white font-medium mb-3 flex items-center gap-2">
        <Clock className="w-4 h-4 text-purple-400" />
        Prediction History Timeline
      </h4>
      <div className="overflow-x-auto rounded-lg border border-gray-700">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-700 text-gray-300 uppercase font-semibold">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">SeunBot Recommendation</th>
              <th className="px-4 py-3 text-right">Final Score</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700 text-gray-300">
            {history.map((h, i) => (
              <tr key={i} className="hover:bg-gray-700/40">
                <td className="px-4 py-3.5 font-medium whitespace-nowrap">
                  {new Date(h.predictedAt || h.createdAt).toLocaleString()}
                </td>
                <td className="px-4 py-3.5 font-semibold text-white">
                  ${(h.priceAtPrediction || h.suggestedEntry || 0).toFixed(2)}
                </td>
                <td className="px-4 py-3.5">
                  <span className={`px-2.5 py-0.5 rounded-full font-bold border ${
                    h.recommendation === 'BUY' ? 'bg-green-500/15 text-green-400 border-green-500/20' :
                    h.recommendation === 'SELL' ? 'bg-red-500/15 text-red-400 border-red-500/20' :
                    'bg-yellow-500/15 text-yellow-400 border-yellow-500/20'
                  }`}>
                    {h.recommendation}
                  </span>
                </td>
                <td className={`px-4 py-3.5 font-bold text-right ${h.finalScore >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {h.finalScore != null ? (h.finalScore > 0 ? `+${h.finalScore.toFixed(3)}` : h.finalScore.toFixed(3)) : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default USStocksAdvancedAnalysis
