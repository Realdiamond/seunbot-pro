import React from 'react'
import { Eye, TrendingUp, Triangle, Zap } from 'lucide-react'

const PatternAnalysis = ({ symbol, isLoading }) => {
  const patterns = [
    { name: 'Rising Wedge', detected: true, confidence: 85, type: 'bearish' },
    { name: 'Head & Shoulders', detected: false, confidence: 45, type: 'bearish' },
    { name: 'Bull Flag', detected: true, confidence: 72, type: 'bullish' },
    { name: 'Double Bottom', detected: false, confidence: 38, type: 'bullish' },
    { name: 'Ascending Triangle', detected: true, confidence: 91, type: 'bullish' },
  ]

  const smartMoneyConcepts = [
    { name: 'Order Block', status: 'Bullish', level: '$45,200' },
    { name: 'Fair Value Gap', status: 'Filled', level: '$44,800' },
    { name: 'Liquidity Zone', status: 'Active', level: '$46,500' },
  ]

  if (isLoading) {
    return (
      <div className="glass-effect rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Pattern Analysis</h3>
        <div className="animate-pulse space-y-4">
          <div className="h-20 bg-gray-700 rounded"></div>
          <div className="h-20 bg-gray-700 rounded"></div>
          <div className="h-20 bg-gray-700 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="glass-effect rounded-lg p-6">
      <div className="flex items-center space-x-2 mb-4">
        <Eye className="h-5 w-5 text-green-500" />
        <h3 className="text-lg font-semibold text-white">Pattern Analysis</h3>
      </div>
      
      {/* Chart Patterns */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-gray-300 mb-3 flex items-center space-x-2">
          <Triangle className="h-4 w-4" />
          <span>Chart Patterns</span>
        </h4>
        
        <div className="space-y-3">
          {patterns.map((pattern, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${
                  pattern.detected ? 'bg-green-500 animate-pulse' : 'bg-gray-600'
                }`}></div>
                <div>
                  <div className="text-sm font-medium text-white">{pattern.name}</div>
                  <div className={`text-xs ${
                    pattern.type === 'bullish' ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {pattern.type === 'bullish' ? '📈 Bullish' : '📉 Bearish'}
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-sm font-semibold text-white">{pattern.confidence}%</div>
                <div className="text-xs text-gray-400">
                  {pattern.detected ? 'Detected' : 'Monitoring'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Smart Money Concepts */}
      <div>
        <h4 className="text-sm font-semibold text-gray-300 mb-3 flex items-center space-x-2">
          <Zap className="h-4 w-4" />
          <span>Smart Money Concepts</span>
        </h4>
        
        <div className="space-y-3">
          {smartMoneyConcepts.map((concept, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
              <div>
                <div className="text-sm font-medium text-white">{concept.name}</div>
                <div className="text-xs text-gray-400">{concept.level}</div>
              </div>
              
              <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                concept.status === 'Bullish' ? 'bg-green-500/20 text-green-400' :
                concept.status === 'Active' ? 'bg-blue-500/20 text-blue-400' :
                'bg-gray-500/20 text-gray-400'
              }`}>
                {concept.status}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cycle Analysis */}
      <div className="mt-6 p-4 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-lg">
        <h4 className="text-sm font-semibold text-white mb-2">Cycle Analysis</h4>
        <div className="text-xs text-gray-300 mb-2">
          Current Phase: <span className="text-green-400 font-semibold">Bull Market - Early Phase</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-400">Duration: 45 days</span>
          <span className="text-blue-400">Risk: Medium</span>
        </div>
        <div className="mt-2">
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>Bull Probability</span>
            <span>78%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div className="bg-gradient-to-r from-green-400 to-blue-400 h-2 rounded-full" style={{width: '78%'}}></div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PatternAnalysis