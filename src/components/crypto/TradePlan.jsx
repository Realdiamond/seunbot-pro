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
  const currentPrice = Number(analysis?.currentPrice) || 0

  // Derive trade parameters dynamically if tp is missing or zeroed out
  const rawEntry = Number(tp?.entryPrice) || currentPrice
  const rawDirection = tp?.direction || analysis?.direction || 'BUY'
  const isBuy = rawDirection.toUpperCase() === 'BUY'
  
  const score = Math.abs(Number(analysis?.finalScore) || 5.0)
  const atr = Number(analysis?.indicators?.atr) || (rawEntry * 0.004)
  
  const entryPrice = rawEntry > 0 ? rawEntry : 1.0
  const stopLoss = (Number(tp?.stopLoss) > 0) 
    ? Number(tp.stopLoss) 
    : (isBuy ? Math.max(0.0001, entryPrice - atr * 1.5) : entryPrice + atr * 1.5)
    
  const takeProfit1 = (Number(tp?.takeProfit1) > 0)
    ? Number(tp.takeProfit1)
    : (isBuy ? entryPrice + atr * 3.0 : Math.max(0.0001, entryPrice - atr * 3.0))

  const takeProfit2 = (Number(tp?.takeProfit2) > 0)
    ? Number(tp.takeProfit2)
    : (isBuy ? entryPrice + atr * 5.0 : Math.max(0.0001, entryPrice - atr * 5.0))

  const riskDist = Math.abs(entryPrice - stopLoss)
  const reward1 = Math.abs(takeProfit1 - entryPrice)
  const reward2 = Math.abs(takeProfit2 - entryPrice)

  const rr1 = (Number(tp?.riskRewardRatio1) > 0) 
    ? Number(tp.riskRewardRatio1) 
    : (riskDist > 0 ? (reward1 / riskDist) : 2.0)

  const rr2 = (Number(tp?.riskRewardRatio2) > 0) 
    ? Number(tp.riskRewardRatio2) 
    : (riskDist > 0 ? (reward2 / riskDist) : 3.33)

  const posSizePct = (Number(tp?.positionSizePct) > 0) ? Number(tp.positionSizePct) : 1.5
  const riskAmount = (Number(tp?.riskAmount) > 0) ? Number(tp.riskAmount) : (10000 * (posSizePct / 100))

  const strength = tp?.signalStrength ?? analysis?.finalScore ?? 5.0
  const isStrong = tp?.isStrongSignal ?? (score >= 7.0)
  const timeframe = tp?.timeframe || analysis?.interval || '1d'
  const reason = tp?.reason || `${rawDirection} trade plan structured with ATR risk management and ${rr1.toFixed(1)}:1 R:R.`

  return (
    <div className={`glass-effect rounded-2xl p-5 border ${isBuy ? 'border-green-500/30' : 'border-red-500/30'}`}>
      <div className="flex items-center gap-2 mb-4">
        <ShieldCheck className={`w-5 h-5 ${isBuy ? 'text-green-400' : 'text-red-400'}`} />
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Trade Plan</h3>
        <span
          title="Signal strength drives position size and risk:reward"
          className={`ml-auto px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
            isStrong ? 'bg-purple-500/20 text-purple-300' : 'bg-blue-500/20 text-blue-300'
          }`}
        >
          {isStrong ? 'STRONG' : 'NORMAL'} · {fmt(strength, 1)}
        </span>
        <span className={`px-3 py-0.5 rounded-full text-xs font-bold ${
          isBuy ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
        }`}>
          {isBuy ? 'BUY' : 'SELL'}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
        <div>
          <Row label="Entry Price"   value={fmtPrice(entryPrice)} />
          <Row label="Stop Loss"     value={fmtPrice(stopLoss)}  valueClass="text-red-400" />
          <Row label="Take Profit 1" value={fmtPrice(takeProfit1)} valueClass="text-green-400" />
          <Row label="Take Profit 2" value={fmtPrice(takeProfit2)} valueClass="text-emerald-400" />
        </div>
        <div>
          <Row label="Position Size" value={`${fmt(posSizePct, 1)}%`} valueClass={isStrong ? 'text-purple-300' : 'text-white'} />
          <Row label="Risk Amount"   value={fmtPrice(riskAmount)} valueClass="text-amber-400" />
          <Row label="R:R to TP1"   value={`1 : ${fmt(rr1, 2)}`} />
          <Row label="R:R to TP2"   value={`1 : ${fmt(rr2, 2)}`} />
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2 text-xs text-gray-400">
        <span className="uppercase tracking-wider">Plan window:</span>
        <HorizonPill predictedAt={analysis?.analysisTimestamp} timeframe={timeframe} />
        {timeframe && <span className="text-gray-500">· {timeframe}</span>}
      </div>

      {reason && (
        <div className="mt-4 pt-3 border-t border-white/10">
          <p className="text-xs text-gray-400 leading-relaxed">{reason}</p>
        </div>
      )}
    </div>
  )
}
