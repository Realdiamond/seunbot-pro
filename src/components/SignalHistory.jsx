import React, { useEffect, useState } from 'react'
import { History, RefreshCw } from 'lucide-react'
import { fetchSignalHistory } from '../services/signalHistoryService'
import { fmt, fmtPrice, HorizonPill } from './crypto/utils'

// Shared prediction/signal-history table for every market (NGX, US, Forex, Crypto).
// Columns: Date · Signal · Strength · Entry/SL/TP · R:R · Horizon (time indicator, item 1).
export default function SignalHistory({ market, symbol, title = 'Signal History', count = 20 }) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)

  const load = async () => {
    if (!symbol) return
    setLoading(true)
    const data = await fetchSignalHistory(market, symbol, count)
    setRows(data)
    setLoading(false)
  }

  useEffect(() => { load() /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [market, symbol])

  const dirTone = (d = '') =>
    /buy|bull|long/i.test(d) ? 'text-green-400' :
    /sell|bear|short/i.test(d) ? 'text-red-400' : 'text-gray-300'

  const fmtDate = (iso) => {
    if (!iso) return '—'
    const d = new Date(iso)
    return Number.isNaN(d.getTime()) ? '—'
      : d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="glass-effect rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <History className="w-4 h-4 text-indigo-400" />
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">{title}</h3>
        <button
          onClick={load}
          className="ml-auto p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition"
          title="Refresh history"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {rows.length === 0 ? (
        <p className="text-gray-500 text-sm">
          {loading ? 'Loading history…' : 'No prediction history yet for this asset.'}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-500 text-xs uppercase tracking-wider border-b border-white/10">
                <th className="text-left py-2 pr-3 font-medium">Date</th>
                <th className="text-left py-2 pr-3 font-medium">Signal</th>
                <th className="text-right py-2 pr-3 font-medium">Strength</th>
                <th className="text-right py-2 pr-3 font-medium">Entry</th>
                <th className="text-right py-2 pr-3 font-medium">SL</th>
                <th className="text-right py-2 pr-3 font-medium">TP1</th>
                <th className="text-right py-2 pr-3 font-medium">R:R</th>
                <th className="text-left py-2 font-medium">Horizon</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className="border-b border-white/5 last:border-0">
                  <td className="py-2 pr-3 text-gray-400 whitespace-nowrap">{fmtDate(r.predictedAt)}</td>
                  <td className={`py-2 pr-3 font-semibold ${dirTone(r.direction)}`}>{r.direction}</td>
                  <td className="py-2 pr-3 text-right text-gray-300">
                    {r.signalStrength != null ? fmt(Math.abs(r.signalStrength), 1)
                      : r.finalScore != null ? fmt(Math.abs(r.finalScore), 2) : '—'}
                  </td>
                  <td className="py-2 pr-3 text-right text-gray-300">{r.entryPrice != null ? fmtPrice(r.entryPrice) : '—'}</td>
                  <td className="py-2 pr-3 text-right text-red-400/80">{r.stopLoss != null ? fmtPrice(r.stopLoss) : '—'}</td>
                  <td className="py-2 pr-3 text-right text-green-400/80">{r.takeProfit1 != null ? fmtPrice(r.takeProfit1) : '—'}</td>
                  <td className="py-2 pr-3 text-right text-gray-300">{r.riskRewardRatio != null ? `1:${fmt(r.riskRewardRatio, 1)}` : '—'}</td>
                  <td className="py-2"><HorizonPill predictedAt={r.predictedAt} timeframe={r.timeframe} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
