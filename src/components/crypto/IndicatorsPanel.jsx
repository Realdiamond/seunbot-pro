import React from 'react'
import { Activity } from 'lucide-react'
import { fmt } from './utils'

function Gauge({ value, min = 0, max = 100, low, high, label }) {
  const pct = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100))
  const color =
    value < low  ? '#f87171' :   // red — oversold / weak
    value > high ? '#34d399' :   // green — overbought / strong
    '#94a3b8'                    // neutral

  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-400">{label}</span>
        <span className="font-bold" style={{ color }}>{fmt(value, 1)}</span>
      </div>
      <div className="w-full bg-gray-700/60 rounded-full h-2 overflow-hidden">
        <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
      <div className="flex justify-between text-[10px] text-gray-600 mt-0.5">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  )
}

function InfoRow({ label, value, sub, valueClass = 'text-white' }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
      <span className="text-gray-400 text-sm">{label}</span>
      <div className="text-right">
        <span className={`text-sm font-semibold ${valueClass}`}>{value ?? '—'}</span>
        {sub && <div className="text-xs text-gray-500">{sub}</div>}
      </div>
    </div>
  )
}

export default function IndicatorsPanel({ analysis }) {
  const ind = analysis?.indicators ?? {}
  const div = analysis?.divergences ?? {}
  const con = analysis?.confluence ?? {}

  const macdColor =
    ind.macd?.status === 'Bullish' ? 'text-green-400' :
    ind.macd?.status === 'Bearish' ? 'text-red-400'   : 'text-gray-300'

  const cycleColor =
    ind.cyclePhase?.includes('Bull') ? 'text-green-400' :
    ind.cyclePhase?.includes('Bear') ? 'text-red-400'   : 'text-amber-400'

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">

      {/* RSI + ADX gauges */}
      <div className="glass-effect rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Activity className="w-4 h-4 text-blue-400" />
          <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Momentum</h3>
        </div>
        <Gauge label="RSI (14)"  value={ind.rsi  ?? 50} min={0}  max={100} low={30} high={70} />
        <Gauge label="ADX (14)"  value={ind.adx  ?? 0}  min={0}  max={60}  low={15} high={25} />
        <InfoRow label="ATR (14)" value={fmt(ind.atr, 2)} sub="Average True Range" />
      </div>

      {/* MACD */}
      <div className="glass-effect rounded-2xl p-5 space-y-2">
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3">MACD</h3>
        <InfoRow label="MACD Line"   value={fmt(ind.macd?.macdLine, 2)} />
        <InfoRow label="Signal Line" value={fmt(ind.macd?.signalLine, 2)} />
        <InfoRow label="Histogram"   value={fmt(ind.macd?.histogram, 2)}
          valueClass={ind.macd?.histogram >= 0 ? 'text-green-400' : 'text-red-400'} />
        <InfoRow label="Status"      value={ind.macd?.status} valueClass={macdColor} />
      </div>

      {/* Cycle */}
      <div className="glass-effect rounded-2xl p-5 space-y-2">
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3">Cycle</h3>
        <InfoRow label="Phase"    value={ind.cyclePhase}   valueClass={cycleColor} />
        <InfoRow label="Duration" value={`${ind.cycleDuration ?? '—'} bars`} />
        <InfoRow label="Momentum" value={fmt(ind.cycleMomentum, 4)} />

        {/* Divergences */}
        <div className="pt-3 border-t border-white/10">
          <div className="text-xs text-gray-500 mb-2 uppercase tracking-wider">Divergences (Daily)</div>
          {[
            ['Bullish MACD', div.bullishMacd],
            ['Bearish MACD', div.bearishMacd],
            ['Bullish RSI',  div.bullishRsi],
            ['Bearish RSI',  div.bearishRsi],
          ].map(([lbl, active]) => (
            <div key={lbl} className="flex justify-between text-xs py-1">
              <span className="text-gray-400">{lbl}</span>
              <span className={active ? 'text-yellow-400 font-bold' : 'text-gray-600'}>
                {active ? '⚡ Active' : 'None'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Confluence */}
      {(con.factors?.length > 0 || con.bullish || con.bearish) && (
        <div className="glass-effect rounded-2xl p-5 md:col-span-2 xl:col-span-3 space-y-3">
          <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">SMC Confluence</h3>
          <div className="flex flex-wrap gap-2">
            {con.bullish && (
              <span className="px-3 py-1 bg-green-500/20 border border-green-500/30 text-green-400 text-xs rounded-full font-medium">
                ✅ Bullish Confluence
              </span>
            )}
            {con.bearish && (
              <span className="px-3 py-1 bg-red-500/20 border border-red-500/30 text-red-400 text-xs rounded-full font-medium">
                ⛔ Bearish Confluence
              </span>
            )}
            {(con.factors ?? []).map((f, i) => (
              <span key={i} className="px-3 py-1 bg-white/5 border border-white/10 text-gray-300 text-xs rounded-full">
                {f}
              </span>
            ))}
          </div>
          {con.pivotCount != null && (
            <p className="text-xs text-gray-500">
              {con.pivotCount} ZigZag pivots detected
              {con.lastPivot ? ` · Last pivot: ${new Date(con.lastPivot).toLocaleDateString()}` : ''}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
