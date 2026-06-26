import React, { useState, useEffect } from 'react'
import { Brain, TrendingUp, TrendingDown, Zap, RefreshCw, AlertCircle } from 'lucide-react'
import realCryptoDataService from '../services/realCryptoDataService'

const SeunBotAnalysisPanel = ({ selectedPair = 'BTCUSDT', priceData = null }) => {
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (selectedPair && priceData) {
      performAnalysis()
    }
  }, [selectedPair, priceData])

  const performAnalysis = async () => {
    setLoading(true)
    setError(null)

    try {
      // Use real price data from props
      const currentPrice = priceData?.price || 0
      const change = priceData?.priceChangePercent || 0
      const volume = priceData?.volume || 0

      // Fetch comprehensive market data
      const comprehensiveData = await realCryptoDataService.getComprehensiveMarketData(selectedPair)

      const analysisResult = {
        symbol: selectedPair,
        currentPrice,
        change,
        volume,
        timestamp: Date.now(),
        source: priceData?.source || 'Real-Time API',
        
        technicalScore: calculateTechnicalScore(comprehensiveData),
        sentiment: analyzeSentiment(change, volume),
        signals: generateSignals(comprehensiveData),
        recommendation: generateRecommendation(comprehensiveData, change),
        
        indicators: comprehensiveData?.indicators || {
          rsi: 50,
          macd: 0,
          sma20: currentPrice,
          sma50: currentPrice
        }
      }

      setAnalysis(analysisResult)
    } catch (err) {
      console.error('Analysis error:', err)
      setError('Failed to perform analysis. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const calculateTechnicalScore = (data) => {
    if (!data || !data.indicators) return 50

    const { rsi, macd, sma20, sma50 } = data.indicators
    const currentPrice = data.price

    let score = 50

    // RSI scoring
    if (rsi > 30 && rsi < 70) score += 15
    else if (rsi > 70) score -= 10
    else if (rsi < 30) score += 20

    // MACD scoring
    if (macd > 0) score += 15
    else score -= 10

    // SMA scoring
    if (currentPrice > sma20) score += 10
    if (currentPrice > sma50) score += 10

    return Math.max(0, Math.min(100, score))
  }

  const analyzeSentiment = (change, volume) => {
    if (change > 5 && volume > 10000000) return { label: 'Very Bullish', color: 'text-green-500' }
    if (change > 2) return { label: 'Bullish', color: 'text-green-400' }
    if (change < -5 && volume > 10000000) return { label: 'Very Bearish', color: 'text-red-500' }
    if (change < -2) return { label: 'Bearish', color: 'text-red-400' }
    return { label: 'Neutral', color: 'text-gray-400' }
  }

  const generateSignals = (data) => {
    const signals = []
    
    if (!data || !data.indicators) return signals

    const { rsi, macd } = data.indicators

    if (rsi < 30 && macd > 0) {
      signals.push({ type: 'BUY', strength: 'Strong', reason: 'Oversold + Bullish MACD' })
    } else if (rsi > 70 && macd < 0) {
      signals.push({ type: 'SELL', strength: 'Strong', reason: 'Overbought + Bearish MACD' })
    } else if (rsi < 40) {
      signals.push({ type: 'BUY', strength: 'Medium', reason: 'Approaching oversold' })
    } else if (rsi > 60) {
      signals.push({ type: 'SELL', strength: 'Medium', reason: 'Approaching overbought' })
    }

    return signals
  }

  const generateRecommendation = (data, change) => {
    if (!data) return 'HOLD'

    const score = calculateTechnicalScore(data)

    if (score > 70 && change > 0) return 'STRONG BUY'
    if (score > 60) return 'BUY'
    if (score < 30 && change < 0) return 'STRONG SELL'
    if (score < 40) return 'SELL'
    return 'HOLD'
  }

  if (loading) {
    return (
      <div className="glass-effect rounded-lg p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Brain className="h-5 w-5 text-blue-500 animate-pulse" />
          <h3 className="text-lg font-semibold text-white">SeunBot Analysis</h3>
        </div>
        <div className="flex items-center justify-center h-32">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 text-blue-500 animate-spin mx-auto mb-2" />
            <p className="text-gray-400">Analyzing {selectedPair}...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="glass-effect rounded-lg p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Brain className="h-5 w-5 text-red-500" />
          <h3 className="text-lg font-semibold text-white">SeunBot Analysis</h3>
        </div>
        <div className="flex items-center space-x-2 text-red-400">
          <AlertCircle className="h-5 w-5" />
          <p>{error}</p>
        </div>
        <button
          onClick={performAnalysis}
          className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition-colors"
        >
          Retry Analysis
        </button>
      </div>
    )
  }

  if (!analysis) {
    return (
      <div className="glass-effect rounded-lg p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Brain className="h-5 w-5 text-blue-500" />
          <h3 className="text-lg font-semibold text-white">SeunBot Analysis</h3>
        </div>
        <p className="text-gray-400">Select a trading pair to begin analysis</p>
      </div>
    )
  }

  const sentiment = analysis.sentiment
  const recommendationColor = 
    analysis.recommendation.includes('BUY') ? 'text-green-400' :
    analysis.recommendation.includes('SELL') ? 'text-red-400' : 'text-gray-400'

  return (
    <div className="glass-effect rounded-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Brain className="h-5 w-5 text-blue-500" />
          <h3 className="text-lg font-semibold text-white">SeunBot Analysis</h3>
          <div className="px-2 py-1 bg-green-500/20 rounded text-xs text-green-400">
            {analysis.source}
          </div>
        </div>
        <button
          onClick={performAnalysis}
          className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-gray-400 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* Current Price */}
      <div className="mb-6 p-4 bg-gray-800/50 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-gray-400 text-sm mb-1">{analysis.symbol}</div>
            <div className="text-2xl font-bold text-white">
              ${analysis.currentPrice.toFixed(4)}
            </div>
          </div>
          <div className={`text-right ${analysis.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            <div className="flex items-center space-x-1">
              {analysis.change >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              <span className="font-bold">{analysis.change >= 0 ? '+' : ''}{analysis.change.toFixed(2)}%</span>
            </div>
            <div className="text-xs text-gray-400">24h Change</div>
          </div>
        </div>
      </div>

      {/* Technical Score */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-gray-400">Technical Score</span>
          <span className="text-white font-bold">{analysis.technicalScore}/100</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div
            className={`h-2 rounded-full ${
              analysis.technicalScore > 70 ? 'bg-green-500' :
              analysis.technicalScore > 40 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            style={{ width: `${analysis.technicalScore}%` }}
          ></div>
        </div>
      </div>

      {/* Indicators */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-3 bg-gray-800/30 rounded-lg">
          <div className="text-gray-400 text-xs mb-1">RSI (14)</div>
          <div className="text-white font-bold">{analysis.indicators.rsi.toFixed(2)}</div>
        </div>
        <div className="p-3 bg-gray-800/30 rounded-lg">
          <div className="text-gray-400 text-xs mb-1">MACD</div>
          <div className={`font-bold ${analysis.indicators.macd >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {analysis.indicators.macd.toFixed(2)}
          </div>
        </div>
        <div className="p-3 bg-gray-800/30 rounded-lg">
          <div className="text-gray-400 text-xs mb-1">SMA 20</div>
          <div className="text-white font-bold">${analysis.indicators.sma20.toFixed(2)}</div>
        </div>
        <div className="p-3 bg-gray-800/30 rounded-lg">
          <div className="text-gray-400 text-xs mb-1">SMA 50</div>
          <div className="text-white font-bold">${analysis.indicators.sma50.toFixed(2)}</div>
        </div>
      </div>

      {/* Sentiment & Recommendation */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-4 bg-gray-800/30 rounded-lg">
          <div className="text-gray-400 text-sm mb-2">Market Sentiment</div>
          <div className={`text-lg font-bold ${sentiment.color}`}>
            {sentiment.label}
          </div>
        </div>
        <div className="p-4 bg-gray-800/30 rounded-lg">
          <div className="text-gray-400 text-sm mb-2">Recommendation</div>
          <div className={`text-lg font-bold ${recommendationColor}`}>
            {analysis.recommendation}
          </div>
        </div>
      </div>

      {/* Trading Signals */}
      {analysis.signals && analysis.signals.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-white font-medium mb-2">Trading Signals</h4>
          {analysis.signals.map((signal, index) => (
            <div
              key={index}
              className={`p-3 rounded-lg border ${
                signal.type === 'BUY'
                  ? 'bg-green-500/10 border-green-500/20'
                  : 'bg-red-500/10 border-red-500/20'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Zap className={`h-4 w-4 ${signal.type === 'BUY' ? 'text-green-400' : 'text-red-400'}`} />
                  <span className={`font-bold ${signal.type === 'BUY' ? 'text-green-400' : 'text-red-400'}`}>
                    {signal.type}
                  </span>
                  <span className="text-gray-400 text-sm">• {signal.strength}</span>
                </div>
              </div>
              <div className="text-xs text-gray-400 mt-1">{signal.reason}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default SeunBotAnalysisPanel