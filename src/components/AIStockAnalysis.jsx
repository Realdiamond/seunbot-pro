import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, AlertTriangle, Target, Brain, Star, RefreshCw, DollarSign, Activity, BarChart3, Shield, Clock, Zap, Globe, Newspaper } from 'lucide-react';
import AIStockAnalyzer from '../services/AIStockAnalyzer';

const AIStockAnalysis = ({ stock }) => {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalysis();
  }, [stock.symbol]);

  const loadAnalysis = async () => {
    setLoading(true);
    try {
      const result = await AIStockAnalyzer.analyzeStock(stock);
      setAnalysis(result);
    } catch (error) {
      console.error('Error loading analysis:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    AIStockAnalyzer.clearCache();
    loadAnalysis();
  };

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 animate-pulse space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Globe className="w-5 h-5 text-blue-400 animate-spin" />
          <div className="text-sm text-gray-400">Searching web for real-time data...</div>
        </div>
        <div className="h-4 bg-gray-700 rounded w-3/4 mb-4"></div>
        <div className="h-4 bg-gray-700 rounded w-1/2 mb-2"></div>
        <div className="h-4 bg-gray-700 rounded w-2/3"></div>
        <div className="h-32 bg-gray-700 rounded"></div>
        <div className="h-24 bg-gray-700 rounded"></div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 text-center text-gray-400">
        <Brain className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p>Analysis unavailable</p>
        <button
          onClick={loadAnalysis}
          className="mt-4 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white"
        >
          Retry Analysis
        </button>
      </div>
    );
  }

  const getRecommendationColor = (rec) => {
    switch (rec) {
      case 'Buy': return 'text-green-400 bg-green-400/10 border-green-400/30';
      case 'Sell': return 'text-red-400 bg-red-400/10 border-red-400/30';
      default: return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30';
    }
  };

  const getSentimentIcon = (sentiment) => {
    switch (sentiment) {
      case 'Bullish': return <TrendingUp className="w-5 h-5 text-green-400" />;
      case 'Bearish': return <TrendingDown className="w-5 h-5 text-red-400" />;
      default: return <Activity className="w-5 h-5 text-yellow-400" />;
    }
  };

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'High': return 'text-red-400';
      case 'Low': return 'text-green-400';
      default: return 'text-yellow-400';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Brain className={`w-6 h-6 ${analysis.isAI ? 'text-purple-400' : 'text-blue-400'}`} />
            <div>
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                {analysis.isAI ? 'AI-Powered Analysis' : 'Technical Analysis'}
                {analysis.webDataUsed && (
                  <span className="flex items-center gap-1 text-xs px-2 py-1 bg-blue-500/20 text-blue-400 rounded">
                    <Globe className="w-3 h-3" />
                    Web-Enhanced
                  </span>
                )}
              </h3>
              <p className="text-xs text-gray-400">
                {analysis.dataQuality === 'Web-Enhanced' ? '🌐 Web search data' : 
                 analysis.dataQuality === 'Real-time' ? '🟢 Real-time data' : 
                 '🟡 Simulated data'} • 
                Price Source: {analysis.priceSource} •
                Updated {new Date(analysis.timestamp).toLocaleTimeString()}
              </p>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            title="Refresh analysis with new web search"
          >
            <RefreshCw className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Current Price Info */}
        <div className="bg-gray-700/50 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-400">Current Price {analysis.webDataUsed && '(Web-Verified)'}</div>
              <div className="text-2xl font-bold text-white">₦{analysis.currentPrice.toFixed(2)}</div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-400">Daily Change</div>
              <div className={`text-lg font-semibold ${stock.changePercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
              </div>
            </div>
          </div>
        </div>

        {/* Recommendation Card */}
        <div className={`border-2 rounded-lg p-4 ${getRecommendationColor(analysis.recommendation)}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Recommendation</span>
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${i < analysis.confidence ? 'fill-current' : 'opacity-30'}`}
                />
              ))}
              <span className="text-xs ml-1">({analysis.confidence}/5)</span>
            </div>
          </div>
          <div className="text-3xl font-bold mb-2">{analysis.recommendation}</div>
          <div className="text-sm opacity-90">{analysis.reasoning}</div>
        </div>
      </div>

      {/* Recent News (if available from web search) */}
      {analysis.recentNews && analysis.recentNews.length > 0 && (
        <div className="bg-gray-800 rounded-lg p-6">
          <h4 className="text-sm font-medium text-blue-400 mb-3 flex items-center gap-2">
            <Newspaper className="w-4 h-4" />
            Recent News & Updates (From Web Search)
          </h4>
          <ul className="space-y-2">
            {analysis.recentNews.map((news, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-gray-300">
                <span className="text-blue-400 mt-1">📰</span>
                <span>{news}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Analyst Ratings (if available from web search) */}
      {analysis.analystRatings && analysis.analystRatings !== 'No analyst ratings available' && (
        <div className="bg-gray-800 rounded-lg p-6">
          <h4 className="text-sm font-medium text-purple-400 mb-3">Analyst Consensus (From Web Search)</h4>
          <p className="text-sm text-gray-300">{analysis.analystRatings}</p>
        </div>
      )}

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            {getSentimentIcon(analysis.sentiment)}
            <span className="text-xs text-gray-400">Sentiment</span>
          </div>
          <div className="text-lg font-semibold text-white">{analysis.sentiment}</div>
        </div>

        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Shield className={`w-5 h-5 ${getRiskColor(analysis.riskLevel)}`} />
            <span className="text-xs text-gray-400">Risk Level</span>
          </div>
          <div className={`text-lg font-semibold ${getRiskColor(analysis.riskLevel)}`}>
            {analysis.riskLevel}
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-5 h-5 text-blue-400" />
            <span className="text-xs text-gray-400">Price Target</span>
          </div>
          <div className="text-lg font-semibold text-white">
            ₦{analysis.priceTarget.toFixed(2)}
          </div>
          <div className="text-xs text-gray-400">
            {((analysis.priceTarget / analysis.currentPrice - 1) * 100).toFixed(1)}% upside
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-purple-400" />
            <span className="text-xs text-gray-400">Time Horizon</span>
          </div>
          <div className="text-lg font-semibold text-white">{analysis.timeHorizon}</div>
        </div>
      </div>

      {/* Trading Levels */}
      {analysis.entryPoint && analysis.stopLoss && (
        <div className="bg-gray-800 rounded-lg p-6">
          <h4 className="text-sm font-medium text-gray-400 mb-4 flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Trading Levels {analysis.webDataUsed && '(Web-Verified)'}
          </h4>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-xs text-gray-400 mb-1">Entry Point</div>
              <div className="text-lg font-semibold text-green-400">₦{analysis.entryPoint.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-xs text-gray-400 mb-1">Price Target</div>
              <div className="text-lg font-semibold text-blue-400">₦{analysis.priceTarget.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-xs text-gray-400 mb-1">Stop Loss</div>
              <div className="text-lg font-semibold text-red-400">₦{analysis.stopLoss.toFixed(2)}</div>
            </div>
          </div>
        </div>
      )}

      {/* Key Support & Resistance Levels */}
      {analysis.keyLevels && (
        <div className="bg-gray-800 rounded-lg p-6">
          <h4 className="text-sm font-medium text-gray-400 mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Key Price Levels
          </h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-2 bg-red-500/10 rounded">
              <span className="text-sm text-gray-300">Strong Resistance</span>
              <span className="text-sm font-semibold text-red-400">₦{analysis.keyLevels.strongResistance.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-red-500/5 rounded">
              <span className="text-sm text-gray-300">Weak Resistance</span>
              <span className="text-sm font-semibold text-red-300">₦{analysis.keyLevels.weakResistance.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-blue-500/10 rounded border-2 border-blue-500/30">
              <span className="text-sm text-gray-300">Current Price</span>
              <span className="text-sm font-bold text-blue-400">₦{analysis.currentPrice.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-green-500/5 rounded">
              <span className="text-sm text-gray-300">Weak Support</span>
              <span className="text-sm font-semibold text-green-300">₦{analysis.keyLevels.weakSupport.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-green-500/10 rounded">
              <span className="text-sm text-gray-300">Strong Support</span>
              <span className="text-sm font-semibold text-green-400">₦{analysis.keyLevels.strongSupport.toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Trading Strategy */}
      {analysis.tradingStrategy && (
        <div className="bg-gray-800 rounded-lg p-6">
          <h4 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Trading Strategy {analysis.webDataUsed && '(Based on Web Data)'}
          </h4>
          <p className="text-sm text-gray-300 leading-relaxed">{analysis.tradingStrategy}</p>
        </div>
      )}

      {/* Key Insights */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h4 className="text-sm font-medium text-gray-400 mb-3">
          Key Insights {analysis.webDataUsed && '(Web-Enhanced)'}
        </h4>
        <ul className="space-y-2">
          {analysis.insights.map((insight, index) => (
            <li key={index} className="flex items-start gap-2 text-sm text-gray-300">
              <span className="text-blue-400 mt-1 font-bold">•</span>
              <span>{insight}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Technical Analysis */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h4 className="text-sm font-medium text-gray-400 mb-3">Technical Analysis</h4>
        <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">{analysis.technicalAnalysis}</p>
      </div>

      {/* Fundamental Analysis */}
      {analysis.fundamentalAnalysis && (
        <div className="bg-gray-800 rounded-lg p-6">
          <h4 className="text-sm font-medium text-gray-400 mb-3">Fundamental Analysis</h4>
          <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">{analysis.fundamentalAnalysis}</p>
        </div>
      )}

      {/* Risk Factors */}
      {analysis.riskFactors && analysis.riskFactors.length > 0 && (
        <div className="bg-gray-800 rounded-lg p-6">
          <h4 className="text-sm font-medium text-red-400 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Risk Factors
          </h4>
          <ul className="space-y-2">
            {analysis.riskFactors.map((risk, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-gray-300">
                <span className="text-red-400 mt-1">⚠</span>
                <span>{risk}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Catalysts & Concerns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Positive Catalysts */}
        {analysis.catalysts && analysis.catalysts.length > 0 && (
          <div className="bg-gray-800 rounded-lg p-6">
            <h4 className="text-sm font-medium text-green-400 mb-3">
              Positive Catalysts {analysis.webDataUsed && '(From Web)'}
            </h4>
            <ul className="space-y-2">
              {analysis.catalysts.map((catalyst, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-gray-300">
                  <span className="text-green-400 mt-1">✓</span>
                  <span>{catalyst}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Concerns */}
        {analysis.concerns && analysis.concerns.length > 0 && (
          <div className="bg-gray-800 rounded-lg p-6">
            <h4 className="text-sm font-medium text-yellow-400 mb-3">Key Concerns</h4>
            <ul className="space-y-2">
              {analysis.concerns.map((concern, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-gray-300">
                  <span className="text-yellow-400 mt-1">!</span>
                  <span>{concern}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="bg-gray-800/50 rounded-lg p-4">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <span>Analysis Type: {analysis.isAI ? 'AI-Powered (ChatGPT)' : 'Technical Indicators'}</span>
            {analysis.webDataUsed && (
              <span className="flex items-center gap-1 px-2 py-1 bg-blue-500/10 text-blue-400 rounded">
                <Globe className="w-3 h-3" />
                Web Search Enabled
              </span>
            )}
          </div>
          <div>
            Last Updated: {new Date(analysis.timestamp).toLocaleString()}
          </div>
        </div>
        {analysis.isAI && (
          <div className="text-xs text-gray-500 mt-2">
            💡 This analysis uses real-time web search for accurate market data and is cached for 30 minutes. Click refresh to search the web again.
          </div>
        )}
      </div>
    </div>
  );
};

export default AIStockAnalysis;