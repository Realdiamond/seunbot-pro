import React, { useState, useEffect, useRef, useCallback } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Activity, BarChart3, RefreshCw, Search, Filter, Star, Brain, Target, Zap, Wifi, WifiOff } from 'lucide-react';
import SP500DataService from '../services/SP500DataService';
import AIStockAnalyzer from '../services/AIStockAnalyzer';
import SP500AdvancedAnalysis from './SP500AdvancedAnalysis';
import SP500WeeklySetupsPanel from './SP500WeeklySetupsPanel';
import { sp500WebSocket } from '../services/WebSocketService';

const SP500Dashboard = () => {
  const [stocks, setStocks] = useState([]);
  const [marketSummary, setMarketSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSector, setSelectedSector] = useState('All');
  const [sortBy, setSortBy] = useState('changePercent');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedStock, setSelectedStock] = useState(null);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [wsStatus, setWsStatus] = useState('disconnected');
  const stocksRef = useRef([]);

  // Keep ref in sync with state for WebSocket callbacks
  useEffect(() => {
    stocksRef.current = stocks;
  }, [stocks]);

  // WebSocket price update handler
  const handleWsUpdate = useCallback((update) => {
    setStocks(prev => {
      const idx = prev.findIndex(s => s.symbol === update.symbol);
      if (idx === -1) return prev;
      const updated = [...prev];
      updated[idx] = {
        ...updated[idx],
        price: update.price ?? updated[idx].price,
        change: update.change ?? updated[idx].change,
        changePercent: update.changePercent ?? updated[idx].changePercent,
        volume: update.volume ?? updated[idx].volume,
        high: update.high ?? updated[idx].high,
        low: update.low ?? updated[idx].low,
        timestamp: update.timestamp ? new Date(update.timestamp).toISOString() : updated[idx].timestamp,
        sources: update.source ? [update.source] : updated[idx].sources
      };
      return updated;
    });
  }, []);

  useEffect(() => {
    loadData();
    // No need for HTTP polling interval - WebSocket handles real-time updates
    // Fallback: refresh every 5 minutes for market summary
    const interval = setInterval(async () => {
      try {
        const summary = await SP500DataService.fetchMarketSummary();
        setMarketSummary(summary);
      } catch (e) { /* ignore */ }
    }, 5 * 60 * 1000);

    return () => {
      clearInterval(interval);
      sp500WebSocket.disconnect();
    };
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [stocksData, summary] = await Promise.all([
        SP500DataService.getAllStocks(),
        SP500DataService.fetchMarketSummary()
      ]);
      setStocks(stocksData);
      setMarketSummary(summary);

      // Seed WebSocket cache with initial data and connect
      sp500WebSocket.seedCache(stocksData);
      const symbols = stocksData.map(s => s.symbol);

      // Subscribe to all symbols for real-time updates
      symbols.forEach(symbol => {
        sp500WebSocket.subscribe(symbol, handleWsUpdate);
      });

      // Connect WebSocket (tries Polygon → TwelveData → HTTP polling)
      sp500WebSocket.onStatusChange(setWsStatus);
      sp500WebSocket.connect('sp500', symbols);
    } catch (error) {
      console.error('Error loading S&P 500 data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    SP500DataService.clearCache();
    sp500WebSocket.disconnect();
    loadData();
  };

  const handleStockClick = (stock) => {
    setSelectedStock(stock);
    setShowAnalysis(true);
  };

  // Get unique sectors
  const sectors = ['All', ...new Set(stocks.map(s => s.sector))];

  // Filter and sort stocks
  const filteredStocks = stocks
    .filter(stock => {
      const matchesSearch = stock.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           stock.symbol.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSector = selectedSector === 'All' || stock.sector === selectedSector;
      return matchesSearch && matchesSector;
    })
    .sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];
      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
    });

  // Calculate sector performance
  const sectorPerformance = sectors
    .filter(s => s !== 'All')
    .map(sector => {
      const sectorStocks = stocks.filter(s => s.sector === sector);
      const avgChange = sectorStocks.reduce((sum, s) => sum + s.changePercent, 0) / sectorStocks.length;
      return { sector, avgChange, count: sectorStocks.length };
    })
    .sort((a, b) => b.avgChange - a.avgChange);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-800 rounded w-1/4"></div>
            <div className="h-32 bg-gray-800 rounded"></div>
            <div className="h-64 bg-gray-800 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-purple-400" />
              S&P 500 Stock Dashboard
            </h1>
            <div className="flex items-center gap-3 mt-1">
              <p className="text-gray-400">Real-time data with SeunBot intelligence</p>
              {wsStatus === 'connected' && (
                <span className="flex items-center gap-1.5 text-xs font-medium text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                  Live
                </span>
              )}
              {wsStatus === 'reconnecting' && (
                <span className="flex items-center gap-1.5 text-xs font-medium text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded-full">
                  <WifiOff className="w-3 h-3" />
                  Reconnecting...
                </span>
              )}
              {wsStatus === 'polling' && (
                <span className="flex items-center gap-1.5 text-xs font-medium text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded-full">
                  <Wifi className="w-3 h-3" />
                  Polling (30s)
                </span>
              )}
            </div>
          </div>
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {/* Tabs */}
        <div className="flex space-x-2 bg-gray-800 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'overview' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Market Overview
          </button>
          <button
            onClick={() => setActiveTab('advanced')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'advanced' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Brain className="w-4 h-4" />
            SeunBot Analysis
          </button>
          <button
            onClick={() => setActiveTab('weeklySetups')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'weeklySetups' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Target className="w-4 h-4" />
            Weekly Setups
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <>
            {/* Market Summary */}
            {marketSummary && (
              <div className="bg-gray-800 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-white mb-4">Market Overview</h2>
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                  <div className="bg-gray-700/50 rounded-lg p-4">
                    <div className="text-sm text-gray-400 mb-1">S&P 500 Index</div>
                    <div className="text-2xl font-bold text-white">{marketSummary.index.toFixed(2)}</div>
                    <div className={`text-sm font-semibold ${marketSummary.indexChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {marketSummary.indexChange >= 0 ? '+' : ''}{marketSummary.indexChange.toFixed(2)} ({marketSummary.indexChangePercent.toFixed(2)}%)
                    </div>
                  </div>
                  
                  <div className="bg-gray-700/50 rounded-lg p-4">
                    <div className="text-sm text-gray-400 mb-1">Total Stocks</div>
                    <div className="text-2xl font-bold text-white">{marketSummary.totalStocks}</div>
                    <div className="text-sm text-gray-400">Tracked</div>
                  </div>

                  <div className="bg-gray-700/50 rounded-lg p-4">
                    <div className="text-sm text-gray-400 mb-1">Advancers</div>
                    <div className="text-2xl font-bold text-green-400">{stocks.filter(s => s.changePercent > 0).length}</div>
                    <div className="text-sm text-gray-400">Stocks Up</div>
                  </div>

                  <div className="bg-gray-700/50 rounded-lg p-4">
                    <div className="text-sm text-gray-400 mb-1">Decliners</div>
                    <div className="text-2xl font-bold text-red-400">{stocks.filter(s => s.changePercent < 0).length}</div>
                    <div className="text-sm text-gray-400">Stocks Down</div>
                  </div>

                  <div className="bg-gray-700/50 rounded-lg p-4">
                    <div className="text-sm text-gray-400 mb-1">Data Quality</div>
                    <div className="text-lg font-semibold text-white">
                      {marketSummary.isMock ? '🟡 Simulated' : '🟢 Live'}
                    </div>
                    <div className="text-xs text-gray-400">
                      {marketSummary.sources?.length || 0} source(s)
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Sector Performance */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Sector Performance</h2>
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                {sectorPerformance.slice(0, 10).map(({ sector, avgChange, count }) => (
                  <div
                    key={sector}
                    className="bg-gray-700/50 rounded-lg p-3 cursor-pointer hover:bg-gray-700 transition-colors"
                    onClick={() => setSelectedSector(sector)}
                  >
                    <div className="text-sm font-medium text-white mb-1">{sector}</div>
                    <div className={`text-lg font-bold ${avgChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {avgChange >= 0 ? '+' : ''}{avgChange.toFixed(2)}%
                    </div>
                    <div className="text-xs text-gray-400">{count} stocks</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Filters and Search */}
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                {/* Search */}
                <div className="lg:col-span-2">
                  <label className="block text-sm text-gray-400 mb-2">Search Stocks</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search by name or symbol..."
                      className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                {/* Sector Filter */}
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Sector</label>
                  <select
                    value={selectedSector}
                    onChange={(e) => setSelectedSector(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                  >
                    {sectors.map(sector => (
                      <option key={sector} value={sector}>{sector}</option>
                    ))}
                  </select>
                </div>

                {/* Sort By */}
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Sort By</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="changePercent">% Change</option>
                    <option value="price">Price</option>
                    <option value="volume">Volume</option>
                    <option value="marketCap">Market Cap</option>
                  </select>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-4">
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white text-sm transition-colors"
                >
                  {sortOrder === 'asc' ? '↑ Ascending' : '↓ Descending'}
                </button>
                <div className="text-sm text-gray-400">
                  Showing {filteredStocks.length} of {stocks.length} stocks
                </div>
              </div>
            </div>

            {/* Stock List */}
            <div className="bg-gray-800 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Symbol</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Sector</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">Price</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">Change</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">% Change</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">Volume</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {filteredStocks.map((stock) => (
                      <tr
                        key={stock.symbol}
                        className="hover:bg-gray-700/50 transition-colors cursor-pointer"
                        onClick={() => handleStockClick(stock)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-white">{stock.symbol}</span>
                            {!stock.isMock && (
                              <span className="text-xs px-1.5 py-0.5 bg-green-500/20 text-green-400 rounded">Live</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-300">{stock.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-xs px-2 py-1 bg-purple-500/20 text-purple-400 rounded">
                            {stock.sector}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="text-sm font-semibold text-white">${stock.price.toFixed(2)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className={`text-sm font-semibold ${stock.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {stock.change >= 0 ? '+' : ''}${stock.change.toFixed(2)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className={`flex items-center justify-end gap-1 text-sm font-semibold ${stock.changePercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {stock.changePercent >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                            {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="text-sm text-gray-300">
                            {(stock.volume / 1000000).toFixed(2)}M
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStockClick(stock);
                            }}
                            className="px-3 py-1 bg-purple-600 hover:bg-purple-700 rounded text-white text-xs transition-colors flex items-center gap-1 mx-auto"
                          >
                            <Brain className="w-3 h-3" />
                            Analyze
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Top Gainers and Losers */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Gainers */}
              <div className="bg-gray-800 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                  Top Gainers
                </h2>
                <div className="space-y-3">
                  {stocks
                    .sort((a, b) => b.changePercent - a.changePercent)
                    .slice(0, 5)
                    .map((stock) => (
                      <div
                        key={stock.symbol}
                        className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors cursor-pointer"
                        onClick={() => handleStockClick(stock)}
                      >
                        <div>
                          <div className="font-semibold text-white">{stock.symbol}</div>
                          <div className="text-xs text-gray-400">{stock.name}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold text-white">${stock.price.toFixed(2)}</div>
                          <div className="text-sm font-bold text-green-400">
                            +{stock.changePercent.toFixed(2)}%
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Top Losers */}
              <div className="bg-gray-800 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                  <TrendingDown className="w-5 h-5 text-red-400" />
                  Top Losers
                </h2>
                <div className="space-y-3">
                  {stocks
                    .sort((a, b) => a.changePercent - b.changePercent)
                    .slice(0, 5)
                    .map((stock) => (
                      <div
                        key={stock.symbol}
                        className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors cursor-pointer"
                        onClick={() => handleStockClick(stock)}
                      >
                        <div>
                          <div className="font-semibold text-white">{stock.symbol}</div>
                          <div className="text-xs text-gray-400">{stock.name}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold text-white">${stock.price.toFixed(2)}</div>
                          <div className="text-sm font-bold text-red-400">
                            {stock.changePercent.toFixed(2)}%
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'advanced' && selectedStock && (
          <SP500AdvancedAnalysis selectedStock={selectedStock.symbol} stockData={selectedStock} />
        )}

        {activeTab === 'advanced' && !selectedStock && (
          <div className="bg-gray-800 rounded-lg p-12 text-center">
            <Brain className="w-16 h-16 mx-auto mb-4 text-gray-600" />
            <h3 className="text-xl font-semibold text-white mb-2">Select a Stock for SeunBot Analysis</h3>
            <p className="text-gray-400">Click on any stock from the Market Overview tab to see advanced analysis</p>
          </div>
        )}

        {activeTab === 'weeklySetups' && (
          <SP500WeeklySetupsPanel />
        )}
      </div>

      {/* Stock Analysis Modal */}
      {showAnalysis && selectedStock && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setShowAnalysis(false)}>
          <div className="bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-gray-800 border-b border-gray-700 p-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">{selectedStock.symbol} - {selectedStock.name}</h2>
                <p className="text-gray-400">{selectedStock.sector}</p>
              </div>
              <button
                onClick={() => setShowAnalysis(false)}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>
            <div className="p-6">
              <StockAnalysisPanel stock={selectedStock} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Stock Analysis Panel Component
const StockAnalysisPanel = ({ stock }) => {
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

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-700 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-700 rounded w-1/2 mb-2"></div>
          <div className="h-32 bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="text-center text-gray-400 py-8">
        <Brain className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p>Analysis unavailable</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Current Price */}
      <div className="bg-gray-700/50 rounded-lg p-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <div className="text-sm text-gray-400">Current Price</div>
            <div className="text-2xl font-bold text-white">${stock.price.toFixed(2)}</div>
          </div>
          <div>
            <div className="text-sm text-gray-400">Change</div>
            <div className={`text-lg font-semibold ${stock.changePercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-400">Volume</div>
            <div className="text-lg font-semibold text-white">
              {(stock.volume / 1000000).toFixed(2)}M
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-400">Market Cap</div>
            <div className="text-lg font-semibold text-white">
              ${(stock.marketCap / 1000000000).toFixed(2)}B
            </div>
          </div>
        </div>
      </div>

      {/* AI Recommendation */}
      <div className="bg-gray-700/50 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
          <Brain className="w-5 h-5 text-purple-400" />
          AI Analysis
        </h3>
        <div className="space-y-3">
          <div>
            <span className="text-sm text-gray-400">Recommendation: </span>
            <span className={`text-lg font-bold ${
              analysis.recommendation === 'Buy' ? 'text-green-400' :
              analysis.recommendation === 'Sell' ? 'text-red-400' :
              'text-yellow-400'
            }`}>
              {analysis.recommendation}
            </span>
            <span className="ml-2 text-sm text-gray-400">
              ({analysis.confidence}/5 confidence)
            </span>
          </div>
          <div>
            <span className="text-sm text-gray-400">Sentiment: </span>
            <span className="text-white font-semibold">{analysis.sentiment}</span>
          </div>
          <div>
            <span className="text-sm text-gray-400">Price Target: </span>
            <span className="text-white font-semibold">${analysis.priceTarget?.toFixed(2)}</span>
          </div>
          <p className="text-sm text-gray-300 leading-relaxed">{analysis.reasoning}</p>
        </div>
      </div>

      {/* Key Insights */}
      {analysis.insights && analysis.insights.length > 0 && (
        <div className="bg-gray-700/50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-white mb-3">Key Insights</h3>
          <ul className="space-y-2">
            {analysis.insights.map((insight, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-gray-300">
                <span className="text-purple-400 mt-1">•</span>
                <span>{insight}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default SP500Dashboard;