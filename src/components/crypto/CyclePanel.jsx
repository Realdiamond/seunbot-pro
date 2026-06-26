import React from 'react'
import { TrendingUp } from 'lucide-react'
import { fmt, fmtPrice } from './utils'

function Row({ label, value, valueClass = 'text-white' }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0">
      <span className="text-gray-400 text-sm">{label}</span>
      <span className={`text-sm font-semibold ${valueClass}`}>{value ?? '—'}</span>
    </div>
  )
}

export default function CyclePanel({ analysis }) {
  const c = analysis?.cycleAnalysis ?? {}

  const qualityColor =
    c.cycleQuality === 'Strong'     ? 'text-green-400'  :
    c.cycleQuality === 'Moderate'   ? 'text-blue-400'   :
    c.cycleQuality === 'Weak'       ? 'text-amber-400'  : 'text-red-400'

  const phaseColor =
    c.currentPhase?.includes('Bull') ? 'text-green-400' :
    c.currentPhase?.includes('Bear') ? 'text-red-400'   : 'text-amber-400'

  const strength = c.cycleStrength ?? 0

  return (
    <div className="glass-effect rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-4 h-4 text-cyan-400" />
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Cycle Analysis</h3>
      </div>

      {/* Strength bar */}
      <div className="mb-5">
        <div className="flex justify-between text-xs mb-1.5">
          <span className="text-gray-400">Cycle Strength</span>
          <span className={qualityColor}>{c.cycleQuality ?? '—'} ({fmt(strength, 1)}%)</span>
        </div>
        <div className="w-full bg-gray-700/60 rounded-full h-2.5 overflow-hidden">
          <div
            className="h-2.5 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all"
            style={{ width: `${Math.min(100, strength)}%` }}
          />
        </div>
      </div>

      {/* Completion bar */}
      <div className="mb-5">
        <div className="flex justify-between text-xs mb-1.5">
          <span className="text-gray-400">Cycle Completion</span>
          <span className="text-white">{fmt(c.cycleCompletionPct, 1)}%</span>
        </div>
        <div className="w-full bg-gray-700/60 rounded-full h-2.5 overflow-hidden">
          <div
            className="h-2.5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all"
            style={{ width: `${Math.min(100, c.cycleCompletionPct ?? 0)}%` }}
          />
        </div>
      </div>

      <Row label="Phase"             value={c.currentPhase}              valueClass={phaseColor} />
      <Row label="Duration"          value={`${c.currentPhaseDuration ?? '—'} bars`} />
      <Row label="Momentum (10-bar)" value={fmt(c.cycleMomentum, 4)} />
      <Row label="Avg Cycle Length"  value={`${c.averageCycleLength ?? '—'} bars`} />
      <Row label="Mature Phase"      value={c.isMature ? 'Yes' : 'No'} valueClass={c.isMature ? 'text-amber-400' : 'text-gray-300'} />
      <Row label="Near Cycle High"   value={c.isNearCycleHigh ? 'Yes ⚠️' : 'No'} valueClass={c.isNearCycleHigh ? 'text-red-400' : 'text-gray-300'} />
      <Row label="Near Cycle Low"    value={c.isNearCycleLow  ? 'Yes 👀' : 'No'} valueClass={c.isNearCycleLow  ? 'text-green-400' : 'text-gray-300'} />

      {c.expectedTransitionDate && (
        <div className="mt-4 pt-3 border-t border-white/10 text-xs text-gray-400">
          Expected phase flip:{' '}
          <span className="text-cyan-400 font-semibold">
            {new Date(c.expectedTransitionDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
        </div>
      )}
    </div>
  )
}
