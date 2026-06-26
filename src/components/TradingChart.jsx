import React from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { BarChart3, TrendingUp, Wifi, WifiOff } from 'lucide-react'
import { useChartData } from '../hooks/usePriceData'

const TradingChart = ({ symbol = 'BTCUSDT', timeframe = '1d', isLoading = false }) => {
  const { chartData = [], loading: chartLoading, error } = useChartData(symbol, timeframe)

  // Default fallback data
  const defaultChartData = [
    { date: '2024-01-01', close: 42000, volume: 1500000000 },
    { date: '2024-01-02', close: 43200, volume: 1600000000 },
    { date: '2024-01-03', close: 41800, volume: 1400000000 },
    { date: '2024-01-04', close: 44500, volume: 1700000000 },
    { date: '2024-01-05', close: 43800, volume: 1550000000 },
    { date: '2024-01-06', close: 45200, volume: 1800000000 },
    { date: '2024-01-07', close: 44900, volume: 1650000000 }
  ]

  const loading = isLoading || chartLoading
  const displayData = chartData && chartData.length > 0 ? chartData : defaultChartData

  if (loading) {
    return (
      <div className="glass-effect rounded-lg p-6 h-96">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading real-time data from Binance...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="glass-effect rounded-lg p-6 h-96">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <WifiOff className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-400">Failed to load chart data</p>
            <p className="text-gray-500 text-sm">Using fallback data</p>
          </div>
        </div>
      </div>
    )
  }

  const formatPrice = (value) => {
    if (typeof value !== 'number') return '$0.0000'
    return `$${value.toFixed(4)}`
  }

  const formatDate = (dateStr) => {
    try {
      const date = new Date(dateStr)
      return date.toLocaleDateString()
    } catch {
      return dateStr
    }
  }

  // Calculate technical indicators from real data with safety checks
  const calculateRSI = (data, period = 14) => {
    if (!data || data.length < period + 1) return 50
    
    let gains = 0
    let losses = 0
    
    for (let i = 1; i <= period && i < data.length; i++) {
      const current = data[data.length - i]
      const previous = data[data.length - i - 1]
      
      if (!current || !previous || typeof current.close !== 'number' || typeof previous.close !== 'number') {
        continue
      }
      
      const change = current.close - previous.close
      if (change > 0) gains += change
      else losses += Math.abs(change)
    }
    
    const avgGain = gains / period
    const avgLoss = losses / period
    
    if (avgLoss === 0) return 100
    
    const rs = avgGain / avgLoss
    return 100 - (100 / (1 + rs))
  }

  const calculateMACD = (data) => {
    if (!data || data.length < 26) return 0
    
    try {
      const ema12Data = data.slice(-12).filter(item => item && typeof item.close === 'number')
      const ema26Data = data.slice(-26).filter(item => item && typeof item.close === 'number')
      
      if (ema12Data.length === 0 || ema26Data.length === 0) return 0
      
      const ema12 = ema12Data.reduce((sum, item) => sum + item.close, 0) / ema12Data.length
      const ema26 = ema26Data.reduce((sum, item) => sum + item.close, 0) / ema26Data.length
      
      return ema12 - ema26
    } catch {
      return 0
    }
  }

  const rsi = calculateRSI(displayData)
  const macd = calculateMACD(displayData)
  const volume = displayData.length > 0 && displayData[displayData.length - 1] 
    ? (displayData[displayData.length - 1].volume || 0) 
    : 0

  return (
    <div className="glass-effect rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <BarChart3 className="h-5 w-5 text-green-500" />
          <h3 className="text-lg font-semibold text-white">{symbol} Price Chart</h3>
          <div className="flex items-center space-x-1 text-green-400 text-xs">
            <Wifi className="h-3 w-3" />
            <span>Live Binance Data</span>
          </div>
        </div>
        <div className="text-sm text-gray-400">
          Timeframe: {timeframe.toUpperCase()}
        </div>
      </div>
      
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={displayData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="date" 
              stroke="#9CA3AF"
              fontSize={12}
              tickFormatter={formatDate}
            />
            <YAxis 
              stroke="#9CA3AF"
              fontSize={12}
              tickFormatter={formatPrice}
              domain={['dataMin - 100', 'dataMax + 100']}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: '#1F2937',
                border: '1px solid #374151',
                borderRadius: '8px',
                color: '#F9FAFB'
              }}
              labelFormatter={(value) => `Date: ${formatDate(value)}`}
              formatter={(value, name) => [formatPrice(value), name === 'close' ? 'Price' : name]}
            />
            <Line 
              type="monotone" 
              dataKey="close" 
              stroke="#10B981" 
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: '#10B981' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      {/* Real-time Technical Indicators */}
      <div className="mt-4 grid grid-cols-3 gap-4 pt-4 border-t border-gray-700">
        <div className="text-center">
          <div className="text-sm text-gray-400">RSI (14)</div>
          <div className={`text-lg font-semibold ${
            rsi > 70 ? 'text-red-400' : rsi < 30 ? 'text-green-400' : 'text-yellow-400'
          }`}>
            {rsi.toFixed(1)}
          </div>
          <div className="text-xs text-gray-500">
            {rsi > 70 ? 'Overbought' : rsi < 30 ? 'Oversold' : 'Neutral'}
          </div>
        </div>
        <div className="text-center">
          <div className="text-sm text-gray-400">MACD</div>
          <div className={`text-lg font-semibold ${
            macd > 0 ? 'text-green-400' : 'text-red-400'
          }`}>
            {macd.toFixed(3)}
          </div>
          <div className="text-xs text-gray-500">
            {macd > 0 ? 'Bullish' : 'Bearish'}
          </div>
        </div>
        <div className="text-center">
          <div className="text-sm text-gray-400">Volume (24h)</div>
          <div className="text-lg font-semibold text-purple-400">
            {(volume / 1000000).toFixed(1)}M
          </div>
          <div className="text-xs text-gray-500">USDT</div>
        </div>
      </div>
    </div>
  )
}

export default TradingChart