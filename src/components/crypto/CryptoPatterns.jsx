import React from 'react'
import { Eye, Triangle, Waves, Target } from 'lucide-react'

export default function CryptoPatterns({ analysis }) {
  const elliott = analysis?.elliottWavesPattern
  const geometric = analysis?.geometricPattern
  const setup = analysis?.weeklyTradeSetup

  if (!elliott && !geometric && !setup) return null

  return (
    <div className="glass-effect rounded-2xl p-5 space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Eye className="w-4 h-4 text-purple-400" />
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Patterns & Setup</h3>
      </div>

      <div className="space-y-3">
        {/* Geometric Pattern */}
        {geometric && geometric.name && (
          <div className="p-3 bg-gray-800/50 rounded-lg">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <Triangle className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-medium text-white">{geometric.name}</span>
              </div>
              {geometric.confidence != null && (
                <span className="text-xs font-semibold text-blue-400">
                  {(geometric.confidence * 100).toFixed(0)}% Conf
                </span>
              )}
            </div>
            {geometric.description && (
              <p className="text-xs text-gray-400 pl-6">{geometric.description}</p>
            )}
          </div>
        )}

        {/* Elliott Waves */}
        {elliott && elliott !== 'No clear Elliott Wave pattern' && (
          <div className="p-3 bg-gray-800/50 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Waves className="w-4 h-4 text-cyan-400" />
              <span className="text-sm font-medium text-white">Elliott Wave</span>
            </div>
            <p className="text-xs text-gray-400 pl-6">{elliott}</p>
          </div>
        )}

        {/* Weekly Setup */}
        {setup && setup.setupName && (
          <div className="p-3 bg-gray-800/50 rounded-lg">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-orange-400" />
                <span className="text-sm font-medium text-white">{setup.setupName} Setup</span>
              </div>
              {setup.setupConfidence != null && (
                <span className="text-xs font-semibold text-orange-400">
                  {(setup.setupConfidence * 100).toFixed(0)}% Conf
                </span>
              )}
            </div>
            {setup.description && (
              <p className="text-xs text-gray-400 pl-6">{setup.description}</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
