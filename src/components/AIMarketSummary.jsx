import React, { useState, useEffect } from 'react';
import { Brain, TrendingUp, TrendingDown, AlertCircle, RefreshCw, Sparkles } from 'lucide-react';
import AIMarketInsightsService from '../services/AIMarketInsightsService';

const AIMarketSummary = ({ stocks }) => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (stocks && stocks.length > 0) {
      loadSummary();
    }
  }, [stocks]);

  const loadSummary = async () => {
    setLoading(true);
    setErrorMessage('');

    try {
      const result = await AIMarketInsightsService.getMarketSummary(stocks);
      setSummary(result);
    } catch (error) {
      console.error('Error loading market summary:', error);
      setSummary(null);
      setErrorMessage('Market analysis endpoint is temporarily unavailable.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    AIMarketInsightsService.clearCache();
    loadSummary();
  };

  const formatPercent = (count, total) => {
    if (!total) return '0';
    return ((count / total) * 100).toFixed(0);
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 rounded-lg p-6 border border-purple-500/20">
        <div className="flex items-center gap-3 mb-4">
          <Brain className="w-6 h-6 text-purple-400 animate-pulse" />
          <h3 className="text-lg font-semibold text-white">AI Market Analysis</h3>
        </div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-700 rounded w-3/4 animate-pulse"></div>
          <div className="h-4 bg-gray-700 rounded w-1/2 animate-pulse"></div>
          <div className="h-4 bg-gray-700 rounded w-2/3 animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 rounded-lg p-6 border border-purple-500/20 text-center">
        <Brain className="w-12 h-12 mx-auto mb-2 text-purple-400 opacity-50" />
        <p className="text-gray-400">{errorMessage || 'Market analysis unavailable'}</p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 rounded-lg p-6 border border-purple-500/20 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Brain className="w-6 h-6 text-purple-400" />
            <Sparkles className="w-3 h-3 text-yellow-400 absolute -top-1 -right-1" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">AI Market Analysis</h3>
            <p className="text-xs text-gray-400">{summary.totalStocks} stocks analyzed</p>
          </div>
        </div>
        <button
          onClick={handleRefresh}
          className="p-2 hover:bg-purple-500/10 rounded-lg transition-colors"
          title="Refresh analysis"
        >
          <RefreshCw className="w-4 h-4 text-purple-400" />
        </button>
      </div>

      {summary.chatBrief && (
        <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">{summary.chatBrief}</p>
      )}

      {/* Recommendations Overview */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-green-400" />
            <span className="text-sm text-gray-400">Buy</span>
          </div>
          <div className="text-2xl font-bold text-green-400">{summary.buyRecommendations}</div>
          <div className="text-xs text-gray-400 mt-1">
            {formatPercent(summary.buyRecommendations, summary.totalStocks)}% of stocks
          </div>
        </div>

        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-5 h-5 text-yellow-400" />
            <span className="text-sm text-gray-400">Hold</span>
          </div>
          <div className="text-2xl font-bold text-yellow-400">{summary.holdRecommendations}</div>
          <div className="text-xs text-gray-400 mt-1">
            {formatPercent(summary.holdRecommendations, summary.totalStocks)}% of stocks
          </div>
        </div>

        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="w-5 h-5 text-red-400" />
            <span className="text-sm text-gray-400">Sell</span>
          </div>
          <div className="text-2xl font-bold text-red-400">{summary.sellRecommendations}</div>
          <div className="text-xs text-gray-400 mt-1">
            {formatPercent(summary.sellRecommendations, summary.totalStocks)}% of stocks
          </div>
        </div>
      </div>

      {/* Market Sentiment */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-700/30 rounded-lg p-4">
          <div className="text-sm text-gray-400 mb-2">Market Sentiment</div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-400 rounded-full"></div>
              <span className="text-sm text-white">{summary.bullishStocks} Bullish</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-400 rounded-full"></div>
              <span className="text-sm text-white">{summary.bearishStocks} Bearish</span>
            </div>
          </div>
        </div>

        <div className="bg-gray-700/30 rounded-lg p-4">
          <div className="text-sm text-gray-400 mb-2">Risk Assessment</div>
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400" />
            <span className="text-sm text-white">{summary.highRiskStocks} High Risk Stocks</span>
          </div>
        </div>
      </div>

      {/* Top Buys */}
      {summary.topBuys.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-400 mb-3">🔥 Top Buy Recommendations</h4>
          <div className="space-y-2">
            {summary.topBuys.map((stock) => (
              <div key={stock.symbol} className="bg-green-500/5 border border-green-500/20 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-semibold">{stock.symbol}</span>
                      <span className="text-xs text-gray-400">{stock.name}</span>
                    </div>
                    <div className="text-xs text-gray-400 mt-1">{stock.reasoning}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-green-400">
                      {'⭐'.repeat(stock.confidence)}
                    </div>
                    <div className="text-xs text-gray-400">Confidence</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Sells */}
      {summary.topSells.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-400 mb-3">⚠️ Top Sell Recommendations</h4>
          <div className="space-y-2">
            {summary.topSells.slice(0, 3).map((stock) => (
              <div key={stock.symbol} className="bg-red-500/5 border border-red-500/20 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-semibold">{stock.symbol}</span>
                      <span className="text-xs text-gray-400">{stock.name}</span>
                    </div>
                    <div className="text-xs text-gray-400 mt-1">{stock.reasoning}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-red-400">
                      {'⭐'.repeat(stock.confidence)}
                    </div>
                    <div className="text-xs text-gray-400">Confidence</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Timestamp */}
      <div className="text-xs text-gray-500 text-center space-y-1">
        <div>Analysis updated: {new Date(summary.timestamp).toLocaleString()}</div>
        {Array.isArray(summary.sources) && summary.sources.length > 0 && (
          <div>Sources: {summary.sources.join(' • ')}</div>
        )}
      </div>
    </div>
  );
};

export default AIMarketSummary;