import React from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { TrendingUp, DollarSign, Target, Award } from 'lucide-react'

const PerformanceMetrics = ({ isLoading }) => {
  const performanceData = [
    { name: 'Jan', profit: 2400, loss: -400 },
    { name: 'Feb', profit: 1398, loss: -600 },
    { name: 'Mar', profit: 9800, loss: -200 },
    { name: 'Apr', profit: 3908, loss: -800 },
    { name: 'May', profit: 4800, loss: -300 },
    { name: 'Jun', profit: 3800, loss: -500 },
  ]

  const winRateData = [
    { name: 'Wins', value: 68, color: '#10B981' },
    { name: 'Losses', value: 32, color: '#EF4444' },
  ]

  if (isLoading) {
    return (
      <div className="glass-effect rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Performance Metrics</h3>
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-gray-700 rounded"></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-20 bg-gray-700 rounded"></div>
            <div className="h-20 bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="glass-effect rounded-lg p-6">
      <div className="flex items-center space-x-2 mb-6">
        <Award className="h-5 w-5 text-green-500" />
        <h3 className="text-lg font-semibold text-white">Performance Metrics</h3>
      </div>
      
      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <DollarSign className="h-4 w-4 text-green-400" />
            <span className="text-xs text-gray-400">Total P&L</span>
          </div>
          <div className="text-xl font-bold text-green-400">+$24,580</div>
          <div className="text-xs text-green-300">+15.2%</div>
        </div>
        
        <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <Target className="h-4 w-4 text-blue-400" />
            <span className="text-xs text-gray-400">Win Rate</span>
          </div>
          <div className="text-xl font-bold text-blue-400">68%</div>
          <div className="text-xs text-blue-300">+2.1%</div>
        </div>
        
        <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <TrendingUp className="h-4 w-4 text-purple-400" />
            <span className="text-xs text-gray-400">Avg Win</span>
          </div>
          <div className="text-xl font-bold text-purple-400">$1,245</div>
          <div className="text-xs text-purple-300">+8.5%</div>
        </div>
        
        <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <Award className="h-4 w-4 text-yellow-400" />
            <span className="text-xs text-gray-400">Sharpe Ratio</span>
          </div>
          <div className="text-xl font-bold text-yellow-400">2.34</div>
          <div className="text-xs text-yellow-300">Excellent</div>
        </div>
      </div>

      {/* Performance Chart */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-gray-300 mb-3">Monthly Performance</h4>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" stroke="#9CA3AF" fontSize={12} />
              <YAxis stroke="#9CA3AF" fontSize={12} />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#F9FAFB'
                }}
              />
              <Bar dataKey="profit" fill="#10B981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="loss" fill="#EF4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Win Rate Pie Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h4 className="text-sm font-semibold text-gray-300 mb-3">Win/Loss Ratio</h4>
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={winRateData}
                  cx="50%"
                  cy="50%"
                  innerRadius={30}
                  outerRadius={60}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {winRateData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div>
          <h4 className="text-sm font-semibold text-gray-300 mb-3">Recent Trades</h4>
          <div className="space-y-2">
            <div className="flex justify-between items-center p-2 bg-gray-800/50 rounded text-sm">
              <span className="text-gray-300">BTCUSDT</span>
              <span className="text-green-400">+$420</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-gray-800/50 rounded text-sm">
              <span className="text-gray-300">ETHUSDT</span>
              <span className="text-red-400">-$180</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-gray-800/50 rounded text-sm">
              <span className="text-gray-300">BNBUSDT</span>
              <span className="text-green-400">+$290</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PerformanceMetrics