import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, AlertTriangle, Target, Brain, Star, RefreshCw, DollarSign, Activity, BarChart3, Shield, Clock, Zap, Globe, Newspaper } from 'lucide-react';
import AIAnalysisEndpointService from '../services/AIAnalysisEndpointService';

const AIStockAnalysis = ({ stock }) => {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!stock?.symbol) {
      setAnalysis(null);
      setLoading(false);
      return;
    }

    loadAnalysis();
  }, [stock.symbol]);

  const loadAnalysis = async () => {
    setLoading(true);
    try {
      const result = await AIAnalysisEndpointService.analyzeStock(stock);
      setAnalysis(result);
    } catch (error) {
      console.error('Error loading analysis:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    AIAnalysisEndpointService.clearCache();
    loadAnalysis();
  };

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 animate-pulse space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Globe className="w-5 h-5 text-blue-400 animate-spin" />
          <div className="text-sm text-gray-400">Loading AI analysis from API endpoints...</div>
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

  const targetUpside = analysis.currentPrice > 0
    ? ((analysis.priceTarget / analysis.currentPrice - 1) * 100)
    : 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gray-800 rounded-lg p-4 sm:p-6">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-start gap-2 min-w-0">
            <Brain className={`w-6 h-6 ${analysis.isAI ? 'text-purple-400' : 'text-blue-400'}`} />
            <div className="min-w-0">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                {analysis.isAI ? 'AI-Powered Analysis' : 'Technical Analysis'}
                {analysis.webDataUsed && (
                  <span className="flex items-center gap-1 text-xs px-2 py-1 bg-blue-500/20 text-blue-400 rounded">
                    <Globe className="w-3 h-3" />
                    Web-Enhanced
                  </span>
                )}
              </h3>
              <p className="text-xs text-gray-400 break-words">
                {analysis.dataQuality === 'Real-time' ? '🟢 API data' : 
                 analysis.dataQuality === 'Fallback' ? '🟡 Fallback data' : 
                 '⚪ Data'} • 
                Price Source: {analysis.priceSource} •
                Updated {new Date(analysis.timestamp).toLocaleTimeString()}
              </p>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            title="Refresh analysis from endpoints"
          >
            <RefreshCw className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Current Price Info */}
        <div className="bg-gray-700/50 rounded-lg p-4 mb-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-sm text-gray-400">Current Price {analysis.webDataUsed && '(Web-Verified)'}</div>
              <div className="text-2xl font-bold text-white">₦{analysis.currentPrice.toFixed(2)}</div>
            </div>
              <div className="text-left sm:text-right">
              <div className="text-sm text-gray-400">Daily Change</div>
              <div className={`text-lg font-semibold ${stock.changePercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
              </div>
            </div>
          </div>
        </div>

        {/* Recommendation Card */}
        <div className={`border-2 rounded-lg p-4 ${getRecommendationColor(analysis.recommendation)}`}>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-2">
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
            Recent News & Updates (From Sentiment API)
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

      {/* Analyst Ratings */}
      {analysis.analystRatings && !analysis.analystRatings.toLowerCase().startsWith('no analyst ratings available') && (
        <div className="bg-gray-800 rounded-lg p-6">
          <h4 className="text-sm font-medium text-purple-400 mb-3">Analyst Consensus</h4>
          <p className="text-sm text-gray-300">{analysis.analystRatings}</p>
        </div>
      )}

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
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
            {targetUpside.toFixed(1)}% upside
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
            Trading Levels
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
            Trading Strategy
          </h4>
          <p className="text-sm text-gray-300 leading-relaxed">{analysis.tradingStrategy}</p>
        </div>
      )}

      {/* Key Insights */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h4 className="text-sm font-medium text-gray-400 mb-3">
          Key Insights
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

      {/* Technical Analysis — structured HybridStrategy components */}
      {analysis.hybridComponents && (
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-medium text-gray-400 flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Hybrid Strategy Analysis
            </h4>
            {analysis.hybridFinalScore !== null && (
              <span className={`text-xs font-semibold px-2 py-1 rounded ${
                analysis.hybridSignalStrength === 'BUY' ? 'bg-green-500/20 text-green-400' :
                analysis.hybridSignalStrength === 'SELL' ? 'bg-red-500/20 text-red-400' :
                'bg-yellow-500/20 text-yellow-400'
              }`}>
                {analysis.hybridSignalStrength} · Score {analysis.hybridFinalScore.toFixed(2)}
              </span>
            )}
          </div>

          {/* Factor Score Bar */}
          {analysis.hybridFactorScores && (
            <div className="mb-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { label: 'Institutional', score: analysis.hybridFactorScores.institutionalScore, weight: analysis.hybridFactorScores.institutionalWeight },
                { label: 'Mean Rev.', score: analysis.hybridFactorScores.meanReversionScore, weight: analysis.hybridFactorScores.meanReversionWeight },
                { label: 'Momentum', score: analysis.hybridFactorScores.momentumScore, weight: analysis.hybridFactorScores.momentumWeight },
                { label: 'Volume', score: analysis.hybridFactorScores.volumeScore, weight: analysis.hybridFactorScores.volumeWeight },
              ].map(f => (
                <div key={f.label} className="bg-gray-700/50 rounded p-2 text-center">
                  <div className="text-xs text-gray-400 mb-1">{f.label}</div>
                  <div className={`text-sm font-bold ${ f.score > 0 ? 'text-green-400' : f.score < 0 ? 'text-red-400' : 'text-gray-300'}`}>
                    {f.score > 0 ? '+' : ''}{f.score?.toFixed(2) ?? '—'}
                  </div>
                  <div className="text-xs text-gray-500">wt {f.weight}%</div>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-3">
            {/* Institutional */}
            {analysis.hybridComponents.institutional && (
              <div className="bg-gray-700/40 rounded-lg p-3">
                <div className="text-xs font-semibold text-purple-400 mb-2 uppercase tracking-wide">Institutional Intelligence</div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {analysis.hybridComponents.institutional.elliottWave && (
                    <div><span className="text-gray-500">Elliott Wave </span><span className="text-gray-200">{analysis.hybridComponents.institutional.elliottWave.replace(/_/g, ' ')}</span></div>
                  )}
                  {analysis.hybridComponents.institutional.orderBlocks && (
                    <div><span className="text-gray-500">Order Blocks </span><span className="text-gray-200">{analysis.hybridComponents.institutional.orderBlocks.replace(/_/g, ' ')}</span></div>
                  )}
                  {analysis.hybridComponents.institutional.fairValueGaps && (
                    <div><span className="text-gray-500">FVGs </span><span className="text-gray-200">{analysis.hybridComponents.institutional.fairValueGaps.replace(/_/g, ' ')}</span></div>
                  )}
                  {analysis.hybridComponents.institutional.breakOfStructure && (
                    <div><span className="text-gray-500">BOS </span><span className={`font-medium ${ analysis.hybridComponents.institutional.breakOfStructure.includes('Bullish') ? 'text-green-400' : 'text-red-400'}`}>{analysis.hybridComponents.institutional.breakOfStructure.replace(/_/g, ' ')}</span></div>
                  )}
                </div>
              </div>
            )}

            {/* Mean Reversion */}
            {analysis.hybridComponents.meanReversion && (
              <div className="bg-gray-700/40 rounded-lg p-3">
                <div className="text-xs font-semibold text-blue-400 mb-2 uppercase tracking-wide">Mean Reversion · Bollinger Bands</div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  <div><span className="text-gray-500">Status </span><span className="text-gray-200">{analysis.hybridComponents.meanReversion.bollingerBands}</span></div>
                  <div><span className="text-gray-500">Upper </span><span className="text-gray-200">₦{Number(analysis.hybridComponents.meanReversion.bollingerUpper).toFixed(2)}</span></div>
                  <div><span className="text-gray-500">Middle </span><span className="text-gray-200">₦{Number(analysis.hybridComponents.meanReversion.bollingerMiddle).toFixed(2)}</span></div>
                  <div><span className="text-gray-500">Lower </span><span className="text-gray-200">₦{Number(analysis.hybridComponents.meanReversion.bollingerLower).toFixed(2)}</span></div>
                  {analysis.hybridComponents.meanReversion.zScore !== undefined && (
                    <div><span className="text-gray-500">Z-Score </span><span className={`font-medium ${ analysis.hybridComponents.meanReversion.zScoreStatus === 'Overbought' ? 'text-red-400' : analysis.hybridComponents.meanReversion.zScoreStatus === 'Oversold' ? 'text-green-400' : 'text-gray-200'}`}>{Number(analysis.hybridComponents.meanReversion.zScore).toFixed(2)} ({analysis.hybridComponents.meanReversion.zScoreStatus})</span></div>
                  )}
                </div>
              </div>
            )}

            {/* Momentum */}
            {analysis.hybridComponents.momentum && (
              <div className="bg-gray-700/40 rounded-lg p-3">
                <div className="text-xs font-semibold text-yellow-400 mb-2 uppercase tracking-wide">Momentum · RSI & MACD</div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  <div><span className="text-gray-500">RSI </span><span className={`font-medium ${ analysis.hybridComponents.momentum.rsiStatus === 'Overbought' ? 'text-red-400' : analysis.hybridComponents.momentum.rsiStatus === 'Oversold' ? 'text-green-400' : 'text-gray-200'}`}>{Number(analysis.hybridComponents.momentum.rsi).toFixed(1)} ({analysis.hybridComponents.momentum.rsiStatus})</span></div>
                  <div><span className="text-gray-500">MACD Line </span><span className="text-gray-200">{Number(analysis.hybridComponents.momentum.macdLine).toFixed(3)}</span></div>
                  <div><span className="text-gray-500">Signal </span><span className="text-gray-200">{Number(analysis.hybridComponents.momentum.macdSignal).toFixed(3)}</span></div>
                  <div><span className="text-gray-500">Histogram </span><span className={`font-medium ${Number(analysis.hybridComponents.momentum.macdHistogram) >= 0 ? 'text-green-400' : 'text-red-400'}`}>{Number(analysis.hybridComponents.momentum.macdHistogram).toFixed(3)}</span></div>
                  <div><span className="text-gray-500">MACD Status </span><span className="text-gray-200">{analysis.hybridComponents.momentum.macdStatus?.replace(/_/g, ' ')}</span></div>
                  {analysis.hybridComponents.momentum.rsiDivergenceDetected && (
                    <div><span className="text-yellow-400">⚠ RSI Divergence </span><span className="text-gray-200">{analysis.hybridComponents.momentum.rsiDivergenceType}</span></div>
                  )}
                </div>
              </div>
            )}

            {/* Volume */}
            {analysis.hybridComponents.volume && (
              <div className="bg-gray-700/40 rounded-lg p-3">
                <div className="text-xs font-semibold text-cyan-400 mb-2 uppercase tracking-wide">Volume · VWAP & OBV</div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  <div><span className="text-gray-500">VWAP </span><span className="text-gray-200">{analysis.hybridComponents.volume.vwapStatus?.replace(/_/g, ' ')}</span></div>
                  <div><span className="text-gray-500">Rel. Volume </span><span className="text-gray-200">{analysis.hybridComponents.volume.relativeVolumeStatus} ({analysis.hybridComponents.volume.relativeVolume}x)</span></div>
                  <div><span className="text-gray-500">OBV </span><span className="text-gray-200">{analysis.hybridComponents.volume.obvStatus}</span></div>
                </div>
              </div>
            )}

            {/* Market Regime */}
            {analysis.hybridComponents.regime && (
              <div className="bg-gray-700/40 rounded-lg p-3">
                <div className="text-xs font-semibold text-orange-400 mb-2 uppercase tracking-wide">Market Regime</div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  <div><span className="text-gray-500">ATR </span><span className="text-gray-200">{Number(analysis.hybridComponents.regime.atr).toFixed(2)} ({Number(analysis.hybridComponents.regime.atrPercent).toFixed(2)}%)</span></div>
                  <div><span className="text-gray-500">Volatility </span><span className="text-gray-200">{analysis.hybridComponents.regime.volatilityRegime?.replace(/_/g, ' ')}</span></div>
                  <div><span className="text-gray-500">ADX </span><span className="text-gray-200">{Number(analysis.hybridComponents.regime.adx).toFixed(1)}</span></div>
                  <div><span className="text-gray-500">Regime </span><span className="text-gray-200">{analysis.hybridComponents.regime.overallRegime}</span></div>
                  <div><span className="text-gray-500">Trend </span><span className="text-gray-200">{analysis.hybridComponents.regime.trendDirection}</span></div>
                  <div><span className="text-gray-500">Strategy </span><span className="text-orange-300 font-medium">{analysis.hybridComponents.regime.recommendedStrategy?.replace(/_/g, ' ')}</span></div>
                </div>
              </div>
            )}
          </div>
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
              Positive Catalysts
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

      {/* Last updated timestamp — no endpoint attribution shown to users */}
      <div className="text-xs text-gray-600 text-right px-1">
        Updated {new Date(analysis.timestamp).toLocaleTimeString()}
      </div>
    </div>
  );
};

export default AIStockAnalysis;