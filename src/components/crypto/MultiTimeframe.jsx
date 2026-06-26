import React from 'react'
import { Layers } from 'lucide-react'
import { fmt, signalStyle } from './utils'

const TF_ORDER = ['monthly', 'weekly', 'daily', 'h4']
const TF_LABELS = { monthly: 'Monthly', weekly: 'Weekly', daily: 'Daily', h4: 'H4 (Synthetic)' }
const TF_WEIGHTS = { monthly: '5%', weekly: '50%', daily: '45%', h4: '0%' }

function Flag({ active, label, positive }) {
  if (!active) return null
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
      positive
        ? 'bg-green-500/20 text-green-400 border border-green-500/20'
        : 'bg-red-500/20 text-red-400 border border-red-500/20'
    }`}>
      {label}
    </span>
  )
}

export default function MultiTimeframe({ analysis }) {
  const mtf = analysis?.multiTimeframe ?? {}

  return (
    <div className="glass-effect rounded-2xl overflow-hidden">
      <div className="flex items-center gap-2 p-5 border-b border-white/10">
        <Layers className="w-4 h-4 text-purple-400" />
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
          Multi-Timeframe Breakdown
        </h3>
        <span className="ml-auto text-xs text-gray-500">
          MTF Signal: <span className={`font-bold ${signalStyle(mtf.overallSignal).text}`}>
            {mtf.overallSignal ?? '—'}
          </span>
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5">
              <th className="py-3 pl-5 text-left text-xs text-gray-500 font-semibold uppercase tracking-wider">Timeframe</th>
              <th className="py-3 text-right text-xs text-gray-500 font-semibold uppercase tracking-wider">Weight</th>
              <th className="py-3 text-right text-xs text-gray-500 font-semibold uppercase tracking-wider">Score</th>
              <th className="py-3 text-right text-xs text-gray-500 font-semibold uppercase tracking-wider">RSI</th>
              <th className="py-3 text-right text-xs text-gray-500 font-semibold uppercase tracking-wider">MACD Hist</th>
              <th className="py-3 pr-5 text-right text-xs text-gray-500 font-semibold uppercase tracking-wider">Cycle</th>
              <th className="py-3 pr-5 text-left text-xs text-gray-500 font-semibold uppercase tracking-wider pl-4">Flags</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {TF_ORDER.map((tf) => {
              const d = mtf[tf]
              if (!d) return null
              const score  = d.technicalScore ?? 0
              const histUp = (d.macdHistogram ?? 0) >= 0
              const cycleColor =
                d.cyclePhase?.includes('Bull') ? 'text-green-400' :
                d.cyclePhase?.includes('Bear') ? 'text-red-400'   : 'text-amber-400'

              return (
                <tr key={tf} className={tf === 'h4' ? 'opacity-50' : ''}>
                  <td className="py-3 pl-5 font-medium text-white">
                    {TF_LABELS[tf]}
                    {d.isSynthetic && <span className="ml-1 text-[10px] text-gray-500">(resampled)</span>}
                  </td>
                  <td className="py-3 text-right text-gray-400">{TF_WEIGHTS[tf]}</td>
                  <td className={`py-3 text-right font-semibold ${score >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {score >= 0 ? '+' : ''}{fmt(score, 2)}
                  </td>
                  <td className="py-3 text-right text-gray-300">{fmt(d.rsi, 1)}</td>
                  <td className={`py-3 text-right font-mono ${histUp ? 'text-green-400' : 'text-red-400'}`}>
                    {histUp ? '+' : ''}{fmt(d.macdHistogram, 2)}
                  </td>
                  <td className={`py-3 pr-5 text-right font-semibold ${cycleColor}`}>{d.cyclePhase ?? '—'}</td>
                  <td className="py-3 pr-5 pl-4">
                    <div className="flex flex-wrap gap-1">
                      <Flag active={d.bullishConfluence} label="Bull Conf" positive={true} />
                      <Flag active={d.bearishConfluence} label="Bear Conf" positive={false} />
                      <Flag active={d.bullishMacdDiv}    label="Bull MACD Div" positive={true} />
                      <Flag active={d.bearishMacdDiv}    label="Bear MACD Div" positive={false} />
                      <Flag active={d.bullishRsiDiv}     label="Bull RSI Div"  positive={true} />
                      <Flag active={d.bearishRsiDiv}     label="Bear RSI Div"  positive={false} />
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
