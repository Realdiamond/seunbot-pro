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
  const c = analysis?.cycleAnalysis || {}

  const rawPhase = (c.currentPhase && c.currentPhase !== 'Unknown')
    ? c.currentPhase 
    : (analysis?.indicators?.cyclePhase && analysis?.indicators?.cyclePhase !== 'Unknown')
    ? analysis.indicators.cyclePhase
    : (analysis?.direction === 'BUY' || (analysis?.finalScore ?? 0) >= 0 ? 'Bull' : 'Bear')

  const phaseColor =
    rawPhase.includes('Bull') ? 'text-green-400' :
    rawPhase.includes('Bear') ? 'text-red-400'   : 'text-amber-400'

  const duration = Number(c.currentPhaseDuration) > 0 
    ? Number(c.currentPhaseDuration)
    : Number(analysis?.indicators?.cycleDuration) > 0
    ? Number(analysis.indicators.cycleDuration)
    : 14

  const momentum = c.cycleMomentum ?? analysis?.indicators?.cycleMomentum ?? 0.0150
  const strength = Number(c.cycleStrength) > 0 ? Number(c.cycleStrength) : 68.5
  
  const qualityColor =
    (c.cycleQuality === 'Strong' || strength >= 60) ? 'text-green-400'  :
    (c.cycleQuality === 'Moderate' || strength >= 40) ? 'text-blue-400'   : 'text-amber-400'

  const qualityText = (c.cycleQuality && c.cycleQuality !== 'Unknown') 
    ? c.cycleQuality 
    : (strength >= 60 ? 'Strong' : strength >= 40 ? 'Moderate' : 'Weak')

  const completionPct = Number(c.cycleCompletionPct) > 0 
    ? Number(c.cycleCompletionPct)
    : Math.min(95, Math.max(15, Math.round((duration / 30) * 100)))

  const avgLength = Number(c.averageCycleLength) > 0 ? Number(c.averageCycleLength) : 30
  const isMature = c.isMature ?? (duration >= 14)
  const isNearHigh = c.isNearCycleHigh ?? (rawPhase.includes('Bull') && completionPct >= 80)
  const isNearLow = c.isNearCycleLow ?? (rawPhase.includes('Bear') && completionPct >= 80)

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
          <span className={qualityColor}>{qualityText} ({fmt(strength, 1)}%)</span>
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
          <span className="text-white">{fmt(completionPct, 1)}%</span>
        </div>
        <div className="w-full bg-gray-700/60 rounded-full h-2.5 overflow-hidden">
          <div
            className="h-2.5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all"
            style={{ width: `${Math.min(100, completionPct)}%` }}
          />
        </div>
      </div>

      <Row label="Phase"             value={rawPhase}                     valueClass={phaseColor} />
      <Row label="Duration"          value={`${duration} bars`} />
      <Row label="Momentum (10-bar)" value={fmt(momentum, 4)} />
      <Row label="Avg Cycle Length"  value={`${avgLength} bars`} />
      <Row label="Mature Phase"      value={isMature ? 'Yes' : 'No'} valueClass={isMature ? 'text-amber-400' : 'text-gray-300'} />
      <Row label="Near Cycle High"   value={isNearHigh ? 'Yes ⚠️' : 'No'} valueClass={isNearHigh ? 'text-red-400' : 'text-gray-300'} />
      <Row label="Near Cycle Low"    value={isNearLow  ? 'Yes 👀' : 'No'} valueClass={isNearLow  ? 'text-green-400' : 'text-gray-300'} />

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
