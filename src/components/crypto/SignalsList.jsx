import React from 'react'
import { Radio } from 'lucide-react'

export default function SignalsList({ analysis }) {
  const signals = analysis?.signals ?? []

  return (
    <div className="glass-effect rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Radio className="w-4 h-4 text-yellow-400" />
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Signal Summary</h3>
      </div>

      {signals.length === 0 ? (
        <p className="text-gray-500 text-sm">No signals available.</p>
      ) : (
        <ul className="space-y-2">
          {signals.map((s, i) => {
            const isBull = /buy|bullish|bull|oversold|strong buy/i.test(s)
            const isBear = /sell|bearish|bear|overbought|strong sell/i.test(s)
            return (
              <li
                key={i}
                className={`flex items-start gap-2.5 text-sm px-3 py-2 rounded-lg ${
                  isBull ? 'bg-green-500/10 text-green-300' :
                  isBear ? 'bg-red-500/10 text-red-300' :
                  'bg-white/5 text-gray-300'
                }`}
              >
                <span className="mt-0.5 flex-shrink-0">
                  {isBull ? '📈' : isBear ? '📉' : '•'}
                </span>
                {s}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
