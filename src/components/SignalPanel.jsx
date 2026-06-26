import React from 'react'
import { Target, TrendingUp, TrendingDown, AlertCircle, CheckCircle } from 'lucide-react'

const SignalPanel = ({ signals, isLoading }) => {
  if (isLoading) {
    return (
      <div className="glass-effect rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Trading Signals</h3>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse p-4 bg-gray-800/50 rounded-lg">
              <div className="h-4 bg-gray-700 rounded mb-2"></div>
              <div className="h-3 bg-gray-800 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const getSignalIcon = (signal) => {
    switch (signal.toLowerCase()) {
      case 'strong buy':
        return <TrendingUp className="h-4 w-4 text-green-400" />
      case 'buy':
        return <TrendingUp className="h-4 w-4 text-green-300" />
      case 'strong sell':
        return <TrendingDown className="h-4 w-4 text-red-400" />
      case 'sell':
        return <TrendingDown className="h-4 w-4 text-red-300" />
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-400" />
    }
  }

  const getSignalColor = (signal) => {
    switch (signal.toLowerCase()) {
      case 'strong buy':
        return 'border-green-500 bg-green-500/10'
      case 'buy':
        return 'border-green-400 bg-green-400/10'
      case 'strong sell':
        return 'border-red-500 bg-red-500/10'
      case 'sell':
        return 'border-red-400 bg-red-400/10'
      default:
        return 'border-yellow-400 bg-yellow-400/10'
    }
  }

  return (
    <div className="glass-effect rounded-lg p-6">
      <div className="flex items-center space-x-2 mb-4">
        <Target className="h-5 w-5 text-green-500" />
        <h3 className="text-lg font-semibold text-white">Trading Signals</h3>
      </div>
      
      <div className="space-y-4">
        {signals.map((signal, index) => (
          <div key={index} className={`p-4 border rounded-lg ${getSignalColor(signal.signal)}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                {getSignalIcon(signal.signal)}
                <span className="font-medium text-white">{signal.symbol}</span>
              </div>
              <div className="text-sm text-gray-400">{signal.timeframe}</div>
            </div>
            
            <div className="mb-2">
              <div className="text-sm font-semibold text-white">{signal.signal}</div>
              <div className="text-xs text-gray-400">Confidence: {signal.confidence}%</div>
            </div>
            
            <div className="text-xs text-gray-300">
              Pattern: {signal.pattern}
            </div>
            
            <div className="mt-2 flex justify-between text-xs">
              <span className="text-gray-400">
                {new Date(signal.timestamp).toLocaleTimeString()}
              </span>
              <div className="flex items-center space-x-1">
                <CheckCircle className="h-3 w-3 text-green-400" />
                <span className="text-green-400">Active</span>
              </div>
            </div>
          </div>
        ))}
        
        {signals.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            <AlertCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No active signals</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default SignalPanel