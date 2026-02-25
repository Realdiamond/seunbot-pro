import React, { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, Target, Shield, AlertCircle, DollarSign, Percent, Clock, Activity } from 'lucide-react'

const RealTimePerformance = ({ symbol, currentPrice, isLoading }) => {
  const [performance, setPerformance] = useState(null)
  const [liveUpdates, setLiveUpdates] = useState(true)

  useEffect(() => {
    const generatePerformance = () => {
      const entryPrice = currentPrice * (0.95 + Math.random() * 0.1) // Entry within 5% of current
      const targets = [
        entryPrice * (1 + Math.random() * 0.1 + 0.05), // Target 1: 5-15%
        entryPrice * (1 + Math.random() * 0.15 + 0.1), // Target 2: 10-25%
        entryPrice * (1 + Math.random() * 0.2 + 0.15)  // Target 3: 15-35%
      ]
      const stopLoss = entryPrice * (0.9 + Math.random() * 0.05) // Stop loss 5-10% below entry

      return {
        entryPrice,
        currentPrice,
        targets,
        stopLoss,
        pnl: ((currentPrice - entryPrice) / entryPrice) * 100,
        pnlAbs: (currentPrice - entryPrice) * 100, // Assuming 100 units
        targetProgress: targets.map(target => 
          Math.min(100, Math.max(0, ((currentPrice - entryPrice) / (target - entryPrice)) * 100))
        ),
        stopLossDistance: ((currentPrice - stopLoss) / currentPrice) * 100,
        riskReward: targets.map(target => (target - entryPrice) / (entryPrice - stopLoss)),
        timeInTrade: Math.floor(Math.random() * 48) + 1, // 1-48 hours
        volume: Math.floor(Math.random() * 1000) + 100,
        fees: Math.random() * 5 + 2
      }
    }

    if (currentPrice > 0) {
      setPerformance(generatePerformance())
    }
  }, [currentPrice, symbol])

  useEffect(() => {
    if (liveUpdates && performance) {
      const interval = setInterval(() => {
        // Simulate small price movements for live updates
        const priceChange = (Math.random() - 0.5) * 0.002 // ±0.2% change
        const newPrice = currentPrice * (1 + priceChange)
        
        setPerformance(prev => ({
          ...prev,
          currentPrice: newPrice,
          pnl: ((newPrice - prev.entryPrice) / prev.entryPrice) * 100,
          pnlAbs: (newPrice - prev.entryPrice) * prev.volume,
          targetProgress: prev.targets.map(target => 
            Math.min(100, Math.max(0, ((newPrice - prev.entryPrice) / (target - prev.entryPrice)) * 100))
          ),
          stopLossDistance: ((newPrice - prev.stopLoss) / newPrice) * 100
        }))
      }, 3000) // Update every 3 seconds

      return () => clearInterval(interval)
    }
  }, [liveUpdates, performance, currentPrice])

  if (isLoading || !performance) {
    return (
      <div className="glass-effect rounded-lg p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Activity className="h-5 w-5 text-green-500 animate-pulse" />
          <h3 className="text-lg font-semibold text-white">Real-Time Performance</h3>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-16 bg-gray-700 rounded"></div>
          <div className="h-16 bg-gray-700 rounded"></div>
        </div>
      </div>
    )
  }

  const isProfitable = performance.pnl > 0
  const isAtRisk = performance.stopLossDistance < 5 // Within 5% of stop loss

  return (
    <div className="glass-effect rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Activity className="h-5 w-5 text-green-500" />
          <h3 className="text-lg font-semibold text-white">Real-Time Performance</h3>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setLiveUpdates(!liveUpdates)}
            className={`px-3 py-1 rounded-full text-xs font-medium ${
              liveUpdates 
                ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
            }`}
          >
            {liveUpdates ? 'Live' : 'Paused'}
          </button>
        </div>
      </div>

      {/* P&L Overview */}
      <div className="mb-6 p-4 rounded-lg bg-gradient-to-r from-gray-800/50 to-gray-700/50">
        <div className="flex items-center justify-between mb-3">
          <span className="text-gray-400">Current P&L</span>
          <div className="flex items-center space-x-2">
            {isProfitable ? <TrendingUp className="h-4 w-4 text-green-400" /> : <TrendingDown className="h-4 w-4 text-red-400" />}
            <span className={`text-xl font-bold ${isProfitable ? 'text-green-400' : 'text-red-400'}`}>
              {isProfitable ? '+' : ''}{performance.pnl.toFixed(2)}%
            </span>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <div className="text-gray-400 mb-1">Entry Price</div>
            <div className="text-white font-semibold">${performance.entryPrice.toFixed(4)}</div>
          </div>
          <div>
            <div className="text-gray-400 mb-1">Current Price</div>
            <div className="text-white font-semibold">${performance.currentPrice.toFixed(4)}</div>
          </div>
          <div>
            <div className="text-gray-400 mb-1">Absolute P&L</div>
            <div className={`font-semibold ${isProfitable ? 'text-green-400' : 'text-red-400'}`}>
              ${performance.pnlAbs.toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      {/* Target Progress */}
      <div className="mb-6">
        <h4 className="text-white font-semibold mb-3 flex items-center space-x-2">
          <Target className="h-4 w-4 text-blue-400" />
          <span>Target Achievement</span>
        </h4>
        
        <div className="space-y-3">
          {performance.targets.map((target, index) => (
            <div key={index} className="p-3 bg-gray-800/50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">Target {index + 1}</span>
                <div className="flex items-center space-x-2">
                  <span className="text-white font-medium">${target.toFixed(4)}</span>
                  <span className={`text-sm ${
                    performance.targetProgress[index] >= 100 ? 'text-green-400' : 
                    performance.targetProgress[index] >= 50 ? 'text-yellow-400' : 'text-gray-400'
                  }`}>
                    {performance.targetProgress[index].toFixed(1)}%
                  </span>
                </div>
              </div>
              
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    performance.targetProgress[index] >= 100 ? 'bg-green-400' : 
                    performance.targetProgress[index] >= 50 ? 'bg-yellow-400' : 'bg-blue-400'
                  }`}
                  style={{ width: `${Math.min(100, performance.targetProgress[index])}%` }}
                ></div>
              </div>
              
              <div className="mt-2 text-xs text-gray-400">
                R:R {performance.riskReward[index].toFixed(1)}:1
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Risk Management */}
      <div className="mb-6">
        <h4 className="text-white font-semibold mb-3 flex items-center space-x-2">
          <Shield className="h-4 w-4 text-yellow-400" />
          <span>Risk Management</span>
        </h4>
        
        <div className={`p-4 rounded-lg border ${
          isAtRisk 
            ? 'bg-red-500/10 border-red-500/30' 
            : 'bg-gray-800/50 border-gray-700'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-400">Stop Loss Distance</span>
            <div className="flex items-center space-x-2">
              {isAtRisk && <AlertCircle className="h-4 w-4 text-red-400" />}
              <span className={`font-semibold ${
                isAtRisk ? 'text-red-400' : 'text-green-400'
              }`}>
                {performance.stopLossDistance.toFixed(2)}%
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-gray-400 mb-1">Stop Loss</div>
              <div className="text-white font-medium">${performance.stopLoss.toFixed(4)}</div>
            </div>
            <div>
              <div className="text-gray-400 mb-1">Max Risk</div>
              <div className="text-red-400 font-medium">
                {(((performance.entryPrice - performance.stopLoss) / performance.entryPrice) * 100).toFixed(2)}%
              </div>
            </div>
          </div>
          
          {isAtRisk && (
            <div className="mt-3 p-2 bg-red-500/20 rounded text-xs text-red-300">
              ⚠️ Price is approaching stop loss level. Consider risk management.
            </div>
          )}
        </div>
      </div>

      {/* Trade Statistics */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="p-3 bg-gray-800/50 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <Clock className="h-4 w-4 text-blue-400" />
            <span className="text-gray-400">Time in Trade</span>
          </div>
          <div className="text-white font-semibold">{performance.timeInTrade}h</div>
        </div>
        
        <div className="p-3 bg-gray-800/50 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <DollarSign className="h-4 w-4 text-green-400" />
            <span className="text-gray-400">Trading Fees</span>
          </div>
          <div className="text-white font-semibold">${performance.fees.toFixed(2)}</div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="mt-6 p-4 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-lg border border-purple-500/20">
        <h5 className="text-purple-400 font-semibold mb-2">AI Recommendations</h5>
        <div className="text-sm text-gray-300 space-y-1">
          {isProfitable ? (
            <>
              <div>✅ Consider taking partial profits at current levels</div>
              <div>📈 Trail stop loss to secure gains</div>
            </>
          ) : (
            <>
              <div>⚠️ Monitor support levels closely</div>
              <div>🛡️ Stick to predetermined stop loss</div>
            </>
          )}
          <div>📊 Volume: {performance.volume} units</div>
        </div>
      </div>
    </div>
  )
}

export default RealTimePerformance