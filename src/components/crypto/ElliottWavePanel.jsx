import React from 'react'
import { Waves } from 'lucide-react'
import { fmt } from './utils'

// Detailed Elliott Wave count — a wave-by-wave table (level + status) plus a narrative
// and projected Wave 5 target, mirroring the Cycle Analysis section (item 6).
const STATUS_STYLE = {
  'Complete':    'bg-green-500/15 text-green-400',
  'In Progress': 'bg-amber-500/15 text-amber-300',
  'Pending':     'bg-gray-500/15 text-gray-400',
}

const lvl = (n) => (n == null || n === 0 ? '—' : fmt(n, 2))

export default function ElliottWavePanel({ analysis }) {
  const ew = analysis?.elliottWave

  if (!ew || !ew.detected || !Array.isArray(ew.waves) || ew.waves.length === 0) {
    return (
      <div className="glass-effect rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <Waves className="w-4 h-4 text-teal-400" />
          <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Elliott Wave Count</h3>
        </div>
        <p className="text-gray-500 text-sm">
          {ew?.narrative || 'No clear five-wave structure on the current timeframe yet.'}
        </p>
      </div>
    )
  }

  const dirColor = ew.direction === 'Bullish' ? 'text-green-400'
    : ew.direction === 'Bearish' ? 'text-red-400' : 'text-amber-400'

  return (
    <div className="glass-effect rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Waves className="w-4 h-4 text-teal-400" />
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Elliott Wave Count</h3>
        <span className={`ml-auto text-xs font-bold ${dirColor}`}>{ew.direction}</span>
        {ew.confidence != null && (
          <span className="text-[11px] text-gray-500">· {Math.round(ew.confidence * 100)}% conf</span>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-500 text-xs uppercase tracking-wider border-b border-white/10">
              <th className="text-left py-2 pr-3 font-medium">Wave</th>
              <th className="text-right py-2 pr-3 font-medium">Level</th>
              <th className="text-left py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {ew.waves.map((w, i) => (
              <tr key={i} className="border-b border-white/5 last:border-0">
                <td className="py-2 pr-3 text-gray-200 italic">{w.wave}</td>
                <td className="py-2 pr-3 text-right text-gray-300 whitespace-nowrap">
                  {lvl(w.fromPrice)} → {lvl(w.toPrice)}
                </td>
                <td className="py-2">
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${STATUS_STYLE[w.status] || STATUS_STYLE.Pending}`}>
                    {w.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(ew.targetLow != null && ew.targetHigh != null) && (
        <div className="mt-3 text-xs text-gray-400">
          <span className="uppercase tracking-wider text-gray-500">Wave 5 target:</span>{' '}
          <span className="text-teal-300 font-semibold">{lvl(ew.targetLow)} – {lvl(ew.targetHigh)}</span>
        </div>
      )}

      {ew.narrative && (
        <div className="mt-3 pt-3 border-t border-white/10">
          <p className="text-xs text-gray-400 leading-relaxed">{ew.narrative}</p>
        </div>
      )}
    </div>
  )
}
