import React from 'react'

const COLORS = {
  blue:   ['from-blue-500/20 to-blue-600/5',    'text-blue-400',   'border-blue-500/20'],
  green:  ['from-green-500/20 to-green-600/5',  'text-green-400',  'border-green-500/20'],
  purple: ['from-purple-500/20 to-purple-600/5','text-purple-400', 'border-purple-500/20'],
  amber:  ['from-amber-500/20 to-amber-600/5',  'text-amber-400',  'border-amber-500/20'],
  red:    ['from-red-500/20 to-red-600/5',      'text-red-400',    'border-red-500/20'],
}

export default function StatCard({ label, value, sub, color = 'blue', icon: Icon }) {
  const [grad, iconClr, border] = COLORS[color] ?? COLORS.blue
  return (
    <div className={`glass-effect rounded-2xl p-5 bg-gradient-to-br ${grad} border ${border}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">{label}</span>
        {Icon && <Icon className={`w-4 h-4 ${iconClr}`} />}
      </div>
      <div className="text-2xl font-bold text-white leading-tight">{value ?? '—'}</div>
      {sub && <div className="text-xs text-gray-400 mt-1">{sub}</div>}
    </div>
  )
}
