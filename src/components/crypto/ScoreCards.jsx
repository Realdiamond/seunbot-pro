import React from 'react'
import { Target, Zap } from 'lucide-react'
import { signalStyle, fmtPrice } from './utils'

function ScoreBar({ label, value, weight, max = 5 }) {
  const pct = Math.min(100, (Math.abs(value ?? 0) / max) * 100)
  const positive = (value ?? 0) >= 0
  return (
    <div>
      <div className="flex justify-between text-xs text-gray-400 mb-1">
        <span>{label} <span className="text-gray-600">({weight})</span></span>
        <span className={positive ? 'text-green-400' : 'text-red-400'}>
          {positive ? '+' : ''}{(value ?? 0).toFixed(2)}
        </span>
      </div>
      <div className="w-full bg-gray-700/60 rounded-full h-1.5 overflow-hidden">
        <div
          className={`h-1.5 rounded-full ${positive ? 'bg-green-400' : 'bg-red-400'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

export default function ScoreCards({ analysis }) {
  const { direction, finalScore, signalStrength, isStrongSignal, overallMtfSignal, scores, currentPrice } = analysis
  const sStyle = signalStyle(overallMtfSignal)
  const dirUp  = direction === 'BUY'

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Signal summary */}
      <div className="glass-effect rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Signal</h3>
          <Zap className="w-4 h-4 text-yellow-400" />
        </div>

        <div className="flex items-center gap-3">
          <span className={`text-3xl font-black ${dirUp ? 'text-green-400' : 'text-red-400'}`}>
            {direction}
          </span>
          {isStrongSignal && (
            <span className="px-2 py-0.5 bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 text-xs font-bold rounded-full">
              STRONG
            </span>
          )}
        </div>

        <div className="text-sm text-gray-400 flex items-center gap-3">
          <div>
            Score: <span className={`font-bold ${finalScore >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {finalScore >= 0 ? '+' : ''}{(finalScore ?? 0).toFixed(2)}
            </span>
          </div>
          <div className="w-px h-3 bg-gray-700"></div>
          <div>
            Strength: <span className="text-white font-semibold">{(signalStrength ?? 0).toFixed(1)}/10</span>
          </div>
        </div>

        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-sm font-semibold ${sStyle.bg} ${sStyle.border} ${sStyle.text}`}>
          <Target className="w-3.5 h-3.5" />
          MTF: {overallMtfSignal}
        </div>

        {currentPrice != null && (
          <div className="text-gray-400 text-sm pt-1 border-t border-white/10">
            Current price: <span className="text-white font-mono font-semibold">{fmtPrice(currentPrice)}</span>
          </div>
        )}
      </div>

      {/* Score breakdown */}
      <div className="glass-effect rounded-2xl p-5 space-y-4">
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Score Breakdown</h3>
        <div className="space-y-3">
          <ScoreBar label="Technical"   value={scores?.technical}   weight={scores?.weights?.technical   ?? '40%'} />
          <ScoreBar label="Fundamental" value={scores?.fundamental} weight={scores?.weights?.fundamental ?? '30%'} />
          <ScoreBar label="Sentiment"   value={scores?.sentiment}   weight={scores?.weights?.sentiment   ?? '20%'} />
          <ScoreBar label="Gann"        value={scores?.gann}        weight={scores?.weights?.gann        ?? '10%'} />
        </div>
      </div>
    </div>
  )
}
