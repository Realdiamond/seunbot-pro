import React from 'react'
import { ShieldCheck, ShieldOff } from 'lucide-react'
import { fmt, fmtPrice, HorizonPill } from './utils'

function Row({ label, value, valueClass = 'text-white' }) {
  return (
    <div className="flex justify-between py-2.5 border-b border-white/5 last:border-0">
      <span className="text-gray-400 text-sm">{label}</span>
      <span className={`text-sm font-semibold ${valueClass}`}>{value ?? '—'}</span>
    </div>
  )
}

export default function TradePlan({ analysis }) {
  const tp = analysis?.tradePlan

  if (!tp) {
    return (
      <div className="glass-effect rounded-2xl p-5 flex items-start gap-3">
        <ShieldOff className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" />
        <div>
          <div className="text-gray-300 font-semibold mb-1">No Trade Plan</div>
          <p className="text-gray-500 text-sm">
            Signal strength below threshold (requires |score| ≥ 3.0). Monitor for confirmation.
          </p>
        </div>
      </div>
    )
  }

  const isBuy = tp.direction === 'BUY'
  const strength = tp.signalStrength
  const hasStrength = strength != null && !Number.isNaN(Number(strength))

  return (
    <div className={`glass-effect rounded-2xl p-5 border ${isBuy ? 'border-green-500/30' : 'border-red-500/30'}`}>
      <div className="flex items-center gap-2 mb-4">
        <ShieldCheck className={`w-5 h-5 ${isBuy ? 'text-green-400' : 'text-red-400'}`} />
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Trade Plan</h3>
        {hasStrength && (
          <span
            title="Signal strength drives position size and risk:reward"
            className={`ml-auto px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
              tp.isStrongSignal ? 'bg-purple-500/20 text-purple-300' : 'bg-blue-500/20 text-blue-300'
            }`}
          >
            {tp.isStrongSignal ? 'STRONG' : 'NORMAL'} · {fmt(strength, 1)}
          </span>
        )}
        <span className={`${hasStrength ? '' : 'ml-auto'} px-3 py-0.5 rounded-full text-xs font-bold ${
          isBuy ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
        }`}>
          {tp.direction}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
        <div>
          <Row label="Entry Price"   value={fmtPrice(tp.entryPrice)} />
          <Row label="Stop Loss"     value={fmtPrice(tp.stopLoss)}  valueClass="text-red-400" />
          <Row label="Take Profit 1" value={fmtPrice(tp.takeProfit1)} valueClass="text-green-400" />
          <Row label="Take Profit 2" value={fmtPrice(tp.takeProfit2)} valueClass="text-emerald-400" />
        </div>
        <div>
          <Row label="Position Size" value={`${fmt(tp.positionSizePct, 1)}%`} valueClass={tp.isStrongSignal ? 'text-purple-300' : 'text-white'} />
          <Row label="Risk Amount"   value={fmtPrice(tp.riskAmount)} valueClass="text-amber-400" />
          <Row label="R:R to TP1"   value={`1 : ${fmt(tp.riskRewardRatio1, 2)}`} />
          <Row label="R:R to TP2"   value={`1 : ${fmt(tp.riskRewardRatio2, 2)}`} />
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2 text-xs text-gray-400">
        <span className="uppercase tracking-wider">Plan window:</span>
        <HorizonPill predictedAt={analysis?.analysisTimestamp} timeframe={tp.timeframe} />
        {tp.timeframe && <span className="text-gray-500">· {tp.timeframe}</span>}
      </div>

      {tp.reason && (
        <div className="mt-4 pt-3 border-t border-white/10">
          <p className="text-xs text-gray-400 leading-relaxed">{tp.reason}</p>
        </div>
      )}
    </div>
  )
}
