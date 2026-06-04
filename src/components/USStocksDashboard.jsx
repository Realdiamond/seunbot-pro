import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { TrendingUp, TrendingDown, DollarSign, Activity, BarChart3, RefreshCw, Search, Filter, Star, Brain, Target, Zap, Wifi, WifiOff, Clock, Globe } from 'lucide-react';
import USStocksDataService from '../services/USStocksDataService';

import USStocksAdvancedAnalysis from './USStocksAdvancedAnalysis';
import USStocksWeeklySetupsPanel from './USStocksWeeklySetupsPanel';
import { usStocksWebSocket } from '../services/WebSocketService';

const USStocksDashboard = () => {
  const [stocks, setStocks] = useState([]);
  const [marketSummary, setMarketSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSector, setSelectedSector] = useState('All');
  const [sortBy, setSortBy] = useState('changePercent');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedStock, setSelectedStock] = useState(null);
  const [showAnalysis, setShowAnalysis] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  const activeTab = useMemo(() => {
    if (location.pathname === '/usstocks-analysis') return 'advanced';
    if (location.pathname === '/usstocks-setups') return 'weeklySetups';
    return 'overview';
  }, [location.pathname]);

  const [wsStatus, setWsStatus] = useState('disconnected');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 30;
  const [watchlist, setWatchlist] = useState([]);
  const [viewMode, setViewMode] = useState('all'); // 'all' or 'watchlist'
  const [batchPredictions, setBatchPredictions] = useState(new Map());
  const [loadingBatch, setLoadingBatch] = useState(false);
  const stocksRef = useRef([]);

  // Keep ref in sync with state for WebSocket callbacks
  useEffect(() => {
    stocksRef.current = stocks;
  }, [stocks]);

  // Reset pagination when filter/sort changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedSector, sortBy, sortOrder]);

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

  // Track subscribed symbols so we can unsubscribe cleanly
  const subscribedSymbolsRef = useRef([]);

  useEffect(() => {
    loadData();
    return () => {
      // Clean up all subscriptions
      subscribedSymbolsRef.current.forEach(sym => {
        usStocksWebSocket.unsubscribe(sym, handleWsUpdate);
      });
      usStocksWebSocket.disconnect();
    };
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [stocksData, summary, defaultWatchlist] = await Promise.all([
        USStocksDataService.getAllStocks(),
        USStocksDataService.fetchMarketSummary(),
        USStocksDataService.fetchWatchlist().catch(() => [])
      ]);
      setStocks(stocksData);
      setMarketSummary(summary);

      // Pre-select the first stock so the analysis tab has a default selection
      if (stocksData && stocksData.length > 0 && !selectedStock) {
        setSelectedStock(stocksData[0]);
      }

      // Initialize watchlist from localStorage or defaults
      const savedWatchlist = localStorage.getItem('us_stocks_watchlist');
      let currentWatchlist = [];
      if (savedWatchlist) {
        currentWatchlist = JSON.parse(savedWatchlist);
      } else if (defaultWatchlist && defaultWatchlist.length > 0) {
        currentWatchlist = defaultWatchlist;
        localStorage.setItem('us_stocks_watchlist', JSON.stringify(defaultWatchlist));
      }
      setWatchlist(currentWatchlist);

      // Unsubscribe old symbols first
      subscribedSymbolsRef.current.forEach(sym => {
        usStocksWebSocket.unsubscribe(sym, handleWsUpdate);
      });

      // Subscribe only to a capped number of symbols to avoid handler floods
      // (live prices API returns bulk data anyway, not per-symbol streams)
      const symbols = stocksData.map(s => s.symbol).slice(0, 50);
      subscribedSymbolsRef.current = symbols;
      symbols.forEach(symbol => {
        usStocksWebSocket.subscribe(symbol, handleWsUpdate);
      });

      usStocksWebSocket.seedCache(stocksData);
      usStocksWebSocket.onStatusChange(setWsStatus);
      // Use polling with all symbols for live price refresh (every 30s via WebSocketService)
      usStocksWebSocket.connect('usstocks', symbols);
    } catch (error) {
      console.error('Error loading US Stocks data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    USStocksDataService.clearCache();
    usStocksWebSocket.disconnect();
    loadData();
  };

  const handleStockClick = (stock) => {
    setSelectedStock(stock);
    setShowAnalysis(true);
  };

  const fetchBatchData = useCallback(async () => {
    if (watchlist.length === 0) return;
    setLoadingBatch(true);
    try {
      const predictions = await USStocksDataService.fetchBatchPredictions(watchlist);
      const predictionMap = new Map();
      predictions.forEach(p => {
        predictionMap.set(p.symbol, p);
      });
      setBatchPredictions(predictionMap);
    } catch (err) {
      console.error('Error fetching batch predictions:', err);
    } finally {
      setLoadingBatch(false);
    }
  }, [watchlist]);

  useEffect(() => {
    if (viewMode === 'watchlist' && watchlist.length > 0) {
      fetchBatchData();
    }
  }, [viewMode, watchlist, fetchBatchData]);

  const toggleWatchlist = (symbol, e) => {
    if (e) e.stopPropagation();
    let updated;
    if (watchlist.includes(symbol)) {
      updated = watchlist.filter(s => s !== symbol);
    } else {
      updated = [...watchlist, symbol];
    }
    setWatchlist(updated);
    localStorage.setItem('us_stocks_watchlist', JSON.stringify(updated));
  };

  // Get unique sectors
  const sectors = ['All', ...new Set(stocks.map(s => s.sector))];

  // Filter and sort stocks
  const filteredStocks = stocks
    .filter(stock => {
      const matchesSearch = stock.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           stock.symbol.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSector = selectedSector === 'All' || stock.sector === selectedSector;
      const matchesWatchlist = viewMode === 'all' || watchlist.includes(stock.symbol);
      return matchesSearch && matchesSector && matchesWatchlist;
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

  const totalPages = Math.ceil(filteredStocks.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 4) {
        pages.push(1, 2, 3, 4, 5, '...', totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  return (
    <div className="min-h-screen bg-gray-900 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-3xl font-bold text-white flex items-center gap-2 sm:gap-3 truncate">
              <BarChart3 className="w-6 h-6 sm:w-8 sm:h-8 text-purple-400 shrink-0" />
              <span className="truncate">US Stocks Dashboard</span>
            </h1>
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-3 mt-1">
              <p className="text-xs sm:text-sm text-gray-400 truncate hidden xs:block">Real-time data with SeunBot intelligence</p>
              {wsStatus === 'connected' && (
                <span className="flex items-center gap-1.5 text-[10px] sm:text-xs font-medium text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full shrink-0">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
                  </span>
                  Live
                </span>
              )}
              {wsStatus === 'reconnecting' && (
                <span className="flex items-center gap-1.5 text-[10px] sm:text-xs font-medium text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded-full shrink-0">
                  <WifiOff className="w-3 h-3" />
                  Reconnecting...
                </span>
              )}
              {wsStatus === 'polling' && (
                <span className="flex items-center gap-1.5 text-[10px] sm:text-xs font-medium text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded-full shrink-0">
                  <Wifi className="w-3 h-3" />
                  Polling (30s)
                </span>
              )}
            </div>
          </div>
          <button
            onClick={handleRefresh}
            className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-xs sm:text-sm text-white font-semibold transition-colors shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>

        {/* Tabs */}
        <div className="flex overflow-x-auto whitespace-nowrap gap-1 bg-gray-800 rounded-lg p-1 scrollbar-none scroll-smooth">
          <button
            onClick={() => navigate('/usstocks')}
            className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'overview' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Market Overview
          </button>
          <button
            onClick={() => navigate('/usstocks-analysis')}
            className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'advanced' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Brain className="w-4 h-4" />
            SeunBot Analysis
          </button>
          <button
            onClick={() => navigate('/usstocks-setups')}
            className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
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
              <div className="bg-gray-800 rounded-lg p-4 sm:p-6">
                <h2 className="text-xl font-semibold text-white mb-4">Market Overview</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                  <div className="bg-gray-700/50 rounded-lg p-4">
                    <div className="text-sm text-gray-400 mb-1">US Stocks Index</div>
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
            <div className="bg-gray-800 rounded-lg p-4 sm:p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Sector Performance</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
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
            <div className="bg-gray-800 rounded-lg p-4 sm:p-6 space-y-6">
              <div className="flex border-b border-gray-700 pb-4 justify-between items-center flex-wrap gap-4">
                <div className="flex space-x-2">
                  <button
                    onClick={() => setViewMode('all')}
                    className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
                      viewMode === 'all' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white bg-gray-700/50'
                    }`}
                  >
                    All Securities
                  </button>
                  <button
                    onClick={() => setViewMode('watchlist')}
                    className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors flex items-center gap-2 ${
                      viewMode === 'watchlist' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white bg-gray-700/50'
                    }`}
                  >
                    <Star className="w-4 h-4 fill-current text-yellow-400" />
                    My Watchlist ({watchlist.length})
                  </button>
                </div>
                {viewMode === 'watchlist' && (
                  <button
                    onClick={fetchBatchData}
                    disabled={loadingBatch || watchlist.length === 0}
                    className="px-3 py-1.5 bg-purple-700 hover:bg-purple-600 disabled:opacity-40 rounded-lg text-xs font-semibold text-white transition-colors"
                  >
                    {loadingBatch ? 'Loading ratings...' : 'Refresh Ratings'}
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                      <th className="px-4 py-3 sm:px-6 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Symbol</th>
                      <th className="px-4 py-3 sm:px-6 text-left text-xs font-medium text-gray-300 uppercase tracking-wider hidden sm:table-cell">Name</th>
                      <th className="px-4 py-3 sm:px-6 text-left text-xs font-medium text-gray-300 uppercase tracking-wider hidden md:table-cell">
                        {viewMode === 'watchlist' ? 'SeunBot Rating' : 'Sector'}
                      </th>
                      <th className="px-4 py-3 sm:px-6 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">Price</th>
                      <th className="px-4 py-3 sm:px-6 text-right text-xs font-medium text-gray-300 uppercase tracking-wider hidden md:table-cell">Change</th>
                      <th className="px-4 py-3 sm:px-6 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">% Change</th>
                      <th className="px-4 py-3 sm:px-6 text-right text-xs font-medium text-gray-300 uppercase tracking-wider hidden lg:table-cell">Volume</th>
                      <th className="px-4 py-3 sm:px-6 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {filteredStocks.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-6 py-12 text-center text-gray-400">
                          <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
                          <p className="font-semibold text-lg">No US Stocks Found</p>
                          <p className="text-sm text-gray-500">Ensure the backend US assets endpoints are active or try again later.</p>
                        </td>
                      </tr>
                    ) : (
                      filteredStocks.slice(startIndex, endIndex).map((stock) => (
                        <tr
                          key={stock.symbol}
                          className="hover:bg-gray-700/50 transition-colors cursor-pointer"
                          onClick={() => handleStockClick(stock)}
                        >
                          <td className="px-4 py-4 sm:px-6 whitespace-nowrap">
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={(e) => toggleWatchlist(stock.symbol, e)}
                                  className="p-1 hover:bg-gray-700 rounded transition-colors text-gray-400 focus:outline-none"
                                >
                                  <Star
                                    className={`w-4 h-4 ${
                                      watchlist.includes(stock.symbol)
                                        ? 'text-yellow-400 fill-current'
                                        : 'text-gray-500 hover:text-yellow-400'
                                    }`}
                                  />
                                </button>
                                <span className="text-sm font-bold text-white">{stock.symbol}</span>
                                {!stock.isMock && (
                                  <span className="text-[10px] px-1 py-0.2 bg-green-500/20 text-green-400 rounded">Live</span>
                                )}
                              </div>
                              <span className="text-[10px] text-gray-400 sm:hidden pl-7 truncate max-w-[120px]">{stock.name}</span>
                              {viewMode === 'watchlist' ? (
                                batchPredictions.has(stock.symbol) && (
                                  <div className="pl-7 mt-0.5 sm:hidden">
                                    {(() => {
                                      const pred = batchPredictions.get(stock.symbol);
                                      const recVal = pred.recommendation || 'HOLD';
                                      const colors = {
                                        BUY: 'bg-green-500/20 text-green-400 border border-green-500/30',
                                        STRONG_BUY: 'bg-green-500 text-white font-bold border border-green-600',
                                        SELL: 'bg-red-500/20 text-red-400 border border-red-500/30',
                                        STRONG_SELL: 'bg-red-500 text-white font-bold border border-red-600',
                                        HOLD: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                                      };
                                      return (
                                        <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold border ${colors[recVal] || colors.HOLD}`}>
                                          {recVal}
                                        </span>
                                      );
                                    })()}
                                  </div>
                                )
                              ) : (
                                <div className="pl-7 mt-0.5 sm:hidden">
                                  <span className="text-[9px] px-1.5 py-0.2 bg-purple-500/20 text-purple-400 rounded border border-purple-500/30">
                                    {stock.sector}
                                  </span>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-4 sm:px-6 whitespace-nowrap hidden sm:table-cell">
                            <div className="text-sm text-gray-300">{stock.name}</div>
                          </td>
                          <td className="px-4 py-4 sm:px-6 whitespace-nowrap hidden md:table-cell">
                            {viewMode === 'watchlist' ? (
                              loadingBatch ? (
                                <span className="text-xs text-gray-500 animate-pulse">Loading...</span>
                              ) : batchPredictions.has(stock.symbol) ? (
                                (() => {
                                  const pred = batchPredictions.get(stock.symbol);
                                  const recVal = pred.recommendation || 'HOLD';
                                  const colors = {
                                    BUY: 'bg-green-500/20 text-green-400 border border-green-500/30',
                                    STRONG_BUY: 'bg-green-500 text-white font-bold border border-green-600',
                                    SELL: 'bg-red-500/20 text-red-400 border border-red-500/30',
                                    STRONG_SELL: 'bg-red-500 text-white font-bold border border-red-600',
                                    HOLD: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                                  };
                                  return (
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${colors[recVal] || colors.HOLD}`}>
                                      {recVal}
                                    </span>
                                  );
                                })()
                              ) : (
                                <span className="text-xs text-gray-500">—</span>
                              )
                            ) : (
                              <span className="text-xs px-2 py-1 bg-purple-500/20 text-purple-400 rounded">
                                {stock.sector}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-4 sm:px-6 whitespace-nowrap text-right">
                            <div className="text-sm font-semibold text-white">${stock.price.toFixed(2)}</div>
                            <div className={`text-[10px] md:hidden ${stock.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {stock.change >= 0 ? '+' : ''}${stock.change.toFixed(2)}
                            </div>
                          </td>
                          <td className="px-4 py-4 sm:px-6 whitespace-nowrap text-right hidden md:table-cell">
                            <div className={`text-sm font-semibold ${stock.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {stock.change >= 0 ? '+' : ''}${stock.change.toFixed(2)}
                            </div>
                          </td>
                          <td className="px-4 py-4 sm:px-6 whitespace-nowrap text-right">
                            <div className={`flex items-center justify-end gap-1 text-sm font-semibold ${stock.changePercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {stock.changePercent >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                              {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                            </div>
                          </td>
                          <td className="px-4 py-4 sm:px-6 whitespace-nowrap text-right hidden lg:table-cell">
                            <div className="text-sm text-gray-300">
                              {(stock.volume / 1000000).toFixed(2)}M
                            </div>
                          </td>
                          <td className="px-4 py-4 sm:px-6 whitespace-nowrap text-center">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStockClick(stock);
                              }}
                              className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 rounded text-white text-xs transition-colors flex items-center gap-1 mx-auto"
                              title="Analyze stock"
                            >
                              <Brain className="w-3 h-3" />
                              <span className="hidden sm:inline">Analyze</span>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-6 border-t border-gray-700 bg-gray-800/40">
                  <div className="text-sm text-gray-400">
                    Showing <span className="font-semibold text-white">{startIndex + 1}</span> to{' '}
                    <span className="font-semibold text-white">
                      {Math.min(endIndex, filteredStocks.length)}
                    </span>{' '}
                    of <span className="font-semibold text-white">{filteredStocks.length}</span> stocks
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium border border-gray-700 bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white disabled:opacity-40 disabled:hover:bg-gray-800 disabled:hover:text-gray-400 transition-colors"
                    >
                      Previous
                    </button>
                    <div className="hidden sm:flex items-center gap-1.5">
                      {getPageNumbers().map((p, idx) => (
                        p === '...' ? (
                          <span key={`ellipsis-${idx}`} className="px-2 py-1 text-gray-500">
                            ...
                          </span>
                        ) : (
                          <button
                            key={`page-${p}`}
                            onClick={() => setCurrentPage(p)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                              currentPage === p
                                ? 'bg-purple-600 text-white'
                                : 'border border-gray-700 bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                            }`}
                          >
                            {p}
                          </button>
                        )
                      ))}
                    </div>
                    <span className="sm:hidden text-xs text-gray-400 font-medium px-1">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium border border-gray-700 bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white disabled:opacity-40 disabled:hover:bg-gray-800 disabled:hover:text-gray-400 transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Top Gainers and Losers */}
            {stocks.length > 0 && (
              <div className="grid grid-cols-2 gap-3 sm:gap-6">
                {/* Top Gainers */}
                <div className="bg-gray-800 rounded-lg p-3 sm:p-6">
                  <h2 className="text-sm sm:text-xl font-semibold text-white mb-3 sm:mb-4 flex items-center gap-1.5 sm:gap-2">
                    <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-green-400 shrink-0" />
                    <span className="truncate">Top Gainers</span>
                  </h2>
                  <div className="space-y-2.5">
                    {stocks
                      .sort((a, b) => b.changePercent - a.changePercent)
                      .slice(0, 5)
                      .map((stock) => (
                        <div
                          key={stock.symbol}
                          className="flex flex-col sm:flex-row sm:items-center justify-between p-2 sm:p-3 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors cursor-pointer gap-1 sm:gap-2"
                          onClick={() => handleStockClick(stock)}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="font-semibold text-white text-xs sm:text-sm truncate">{stock.symbol}</div>
                            <div className="text-[10px] text-gray-400 truncate max-w-[70px] sm:max-w-none">{stock.name}</div>
                          </div>
                          <div className="text-left sm:text-right shrink-0">
                            <div className="text-xs sm:text-sm font-semibold text-white">${stock.price.toFixed(2)}</div>
                            <div className="text-[10px] sm:text-sm font-bold text-green-400">
                              +{stock.changePercent.toFixed(2)}%
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Top Losers */}
                <div className="bg-gray-800 rounded-lg p-3 sm:p-6">
                  <h2 className="text-sm sm:text-xl font-semibold text-white mb-3 sm:mb-4 flex items-center gap-1.5 sm:gap-2">
                    <TrendingDown className="w-4 h-4 sm:w-5 sm:h-5 text-red-400 shrink-0" />
                    <span className="truncate">Top Losers</span>
                  </h2>
                  <div className="space-y-2.5">
                    {stocks
                      .sort((a, b) => a.changePercent - b.changePercent)
                      .slice(0, 5)
                      .map((stock) => (
                        <div
                          key={stock.symbol}
                          className="flex flex-col sm:flex-row sm:items-center justify-between p-2 sm:p-3 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors cursor-pointer gap-1 sm:gap-2"
                          onClick={() => handleStockClick(stock)}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="font-semibold text-white text-xs sm:text-sm truncate">{stock.symbol}</div>
                            <div className="text-[10px] text-gray-400 truncate max-w-[70px] sm:max-w-none">{stock.name}</div>
                          </div>
                          <div className="text-left sm:text-right shrink-0">
                            <div className="text-xs sm:text-sm font-semibold text-white">${stock.price.toFixed(2)}</div>
                            <div className="text-[10px] sm:text-sm font-bold text-red-400">
                              {stock.changePercent.toFixed(2)}%
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === 'advanced' && (
          <USStocksAdvancedAnalysis
            selectedStock={selectedStock?.symbol}
            stockData={selectedStock}
            stocks={stocks}
            onSelectStock={(symbol) => {
              const found = stocks.find(s => s.symbol === symbol);
              if (found) setSelectedStock(found);
            }}
          />
        )}

        {activeTab === 'weeklySetups' && (
          <USStocksWeeklySetupsPanel />
        )}
      </div>

      {/* Stock Analysis Modal */}
      {showAnalysis && selectedStock && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-2 sm:p-4 z-50" onClick={() => setShowAnalysis(false)}>
          <div className="bg-gray-800 rounded-lg max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-gray-800 border-b border-gray-700 p-4 sm:p-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white">{selectedStock.symbol} - {selectedStock.name}</h2>
                <p className="text-sm text-gray-400">{selectedStock.sector}</p>
              </div>
              <button
                onClick={() => setShowAnalysis(false)}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>
            <div className="p-4 sm:p-6">
              <StockAnalysisPanel stock={selectedStock} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Stock Analysis Panel Component — powered by GET /api/UsPrediction/{symbol}
const StockAnalysisPanel = ({ stock }) => {
  const [prediction, setPrediction] = useState(null);
  const [verification, setVerification] = useState(null);
  const [sentiment, setSentiment] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalTab, setModalTab] = useState('signals'); // 'signals', 'sentiment', 'history', 'verification'

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setPrediction(null);
    setVerification(null);
    setSentiment(null);
    setHistory([]);

    const fetchAll = async () => {
      try {
        const [predRes, verifyRes, sentimentRes, historyRes] = await Promise.allSettled([
          USStocksDataService.fetchUsPrediction(stock.symbol, { maxRetries: 2, retryDelayMs: 3000 }),
          USStocksDataService.verifyData(stock.symbol),
          USStocksDataService.fetchSentiment(stock.symbol),
          USStocksDataService.fetchHistory(stock.symbol, 10)
        ]);

        if (cancelled) return;

        if (predRes.status === 'fulfilled') {
          const result = predRes.value;
          if (result?._isSyncing) {
            setError('Data is still syncing for this symbol. Try again shortly.');
          } else {
            setPrediction(result);
          }
        } else {
          setError('Analysis temporarily unavailable.');
        }

        if (verifyRes.status === 'fulfilled') {
          setVerification(verifyRes.value);
        }
        if (sentimentRes.status === 'fulfilled') {
          setSentiment(sentimentRes.value);
        }
        if (historyRes.status === 'fulfilled') {
          setHistory(historyRes.value || []);
        }
      } catch (err) {
        console.error('StockAnalysisPanel fetch error:', err);
        if (!cancelled) setError('Failed to load full analysis data.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchAll();

    return () => { cancelled = true; };
  }, [stock.symbol]);

  const rec = prediction?.recommendation || 'HOLD';
  const recColor = rec === 'BUY' ? 'text-green-400' : rec === 'SELL' ? 'text-red-400' : 'text-yellow-400';
  const recBg   = rec === 'BUY' ? 'bg-green-500/10 border-green-500/30' : rec === 'SELL' ? 'bg-red-500/10 border-red-500/30' : 'bg-yellow-500/10 border-yellow-500/30';

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-4 bg-gray-700 rounded w-3/4"></div>
        <div className="h-4 bg-gray-700 rounded w-1/2"></div>
        <div className="h-32 bg-gray-700 rounded"></div>
        <p className="text-center text-xs text-gray-500 mt-2">Fetching SeunBot analysis...</p>
      </div>
    );
  }

  if (error || !prediction) {
    return (
      <div className="text-center text-gray-400 py-8">
        <Brain className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p>{error || 'Analysis unavailable'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Price bar */}
      <div className="bg-gray-700/50 rounded-lg p-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div>
            <div className="text-sm text-gray-400">Current Price</div>
            <div className="text-xl sm:text-2xl font-bold text-white">${(stock.price || prediction.currentPrice || 0).toFixed(2)}</div>
          </div>
          <div>
            <div className="text-sm text-gray-400">24h Change</div>
            <div className={`text-base sm:text-lg font-semibold ${stock.changePercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {stock.changePercent >= 0 ? '+' : ''}{(stock.changePercent || 0).toFixed(2)}%
            </div>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <div className="text-sm text-gray-400">Volume</div>
            <div className="text-base sm:text-lg font-semibold text-white">
              {stock.volume > 0 ? `${(stock.volume / 1_000_000).toFixed(2)}M` : '—'}
            </div>
          </div>
        </div>
      </div>

      {/* Modal Sub-Tabs */}
      <div className="flex overflow-x-auto whitespace-nowrap gap-1 bg-gray-800/60 p-1 rounded-lg border-b border-gray-700 scrollbar-none scroll-smooth">
        {[
          { id: 'signals', label: 'SeunBot Signals' },
          { id: 'sentiment', label: 'Grok Sentiment' },
          { id: 'verification', label: 'Data Quality' },
          { id: 'history', label: 'History Timeline' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setModalTab(tab.id)}
            className={`flex-shrink-0 px-3 py-2 text-xs font-semibold rounded-md transition-colors ${
              modalTab === tab.id
                ? 'bg-purple-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Signals */}
      {modalTab === 'signals' && (
        <div className="space-y-4">
          {/* SeunBot Recommendation */}
          <div className={`rounded-lg p-4 border ${recBg}`}>
            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-400" />
              SeunBot Recommendation
            </h3>
            <div className="flex flex-wrap items-center gap-4 mb-3">
              <span className={`text-2xl font-extrabold ${recColor}`}>{rec}</span>
              <span className="text-sm text-gray-400">
                Confidence: <strong className="text-white">{Math.round((prediction.confidence || 0) * 100)}%</strong>
              </span>
              <span className="text-sm text-gray-400">
                Direction: <strong className="text-white">{prediction.direction || '—'}</strong>
              </span>
            </div>
            {prediction.keyFactors?.length > 0 && (
              <p className="text-sm text-gray-300 leading-relaxed">{prediction.keyFactors[0]}</p>
            )}
          </div>

          {/* Trade Levels */}
          {prediction.tradePlan && (
            <div className="bg-gray-700/50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-400" />
                Trade Levels
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                  <div className="text-xs text-gray-400 mb-1">Entry</div>
                  <div className="text-base sm:text-lg font-bold text-blue-400">
                    {prediction.tradePlan.entryPrice != null ? `$${prediction.tradePlan.entryPrice.toFixed(2)}` : '—'}
                  </div>
                </div>
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                  <div className="text-xs text-gray-400 mb-1">Stop Loss</div>
                  <div className="text-base sm:text-lg font-bold text-red-400">
                    {prediction.tradePlan.stopLoss != null ? `$${prediction.tradePlan.stopLoss.toFixed(2)}` : '—'}
                  </div>
                </div>
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                  <div className="text-xs text-gray-400 mb-1">Take Profit</div>
                  <div className="text-base sm:text-lg font-bold text-green-400">
                    {prediction.tradePlan.takeProfit1 != null ? `$${prediction.tradePlan.takeProfit1.toFixed(2)}` : '—'}
                  </div>
                  {prediction.tradePlan.riskRewardRatio1 != null && (
                    <div className="text-xs text-gray-400 mt-1">R:R {prediction.tradePlan.riskRewardRatio1.toFixed(1)}</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Score Breakdown */}
          <div className="bg-gray-700/50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-3">Score Breakdown</h3>
            <div className="space-y-2">
              {[
                { label: 'Technical', value: prediction.scores?.technical, color: 'bg-purple-500' },
                { label: 'Sentiment', value: prediction.scores?.sentiment, color: 'bg-orange-500' },
                { label: 'Fundamental', value: prediction.scores?.fundamental, color: 'bg-green-500' }
              ].map(({ label, value, color }) => {
                const pct = Math.min(100, Math.max(0, ((Number(value || 0) + 1) / 2) * 100));
                return (
                  <div key={label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-400">{label}</span>
                      <span className={Number(value) >= 0 ? 'text-green-400' : 'text-red-400'}>
                        {value != null ? (Number(value) > 0 ? `+${Number(value).toFixed(3)}` : Number(value).toFixed(3)) : '—'}
                      </span>
                    </div>
                    <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Key Factors */}
          {prediction.keyFactors?.length > 0 && (
            <div className="bg-gray-700/50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-3">Key Factors</h3>
              <ul className="space-y-2">
                {prediction.keyFactors.map((factor, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                    <span className="text-purple-400 mt-0.5">•</span>
                    <span>{factor}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Risks */}
          {prediction.risks?.length > 0 && (
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-yellow-400 mb-2">⚠️ Risk Factors</h3>
              <ul className="space-y-1">
                {prediction.risks.slice(0, 4).map((risk, i) => (
                  <li key={i} className="text-xs text-gray-300">• {risk}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Grok Sentiment */}
      {modalTab === 'sentiment' && (
        <div className="space-y-4">
          {sentiment ? (
            <>
              {sentiment.errorMessage && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-xs flex items-start gap-2">
                  <span className="font-semibold">Grok API Status:</span> {sentiment.errorMessage}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-700/50 rounded-lg p-4 text-center">
                  <div className="text-xs text-gray-400 mb-1">Grok Sentiment</div>
                  <span className={`text-lg font-bold ${
                    sentiment.sentimentLabel === 'BULLISH' ? 'text-green-400' :
                    sentiment.sentimentLabel === 'BEARISH' ? 'text-red-400' : 'text-yellow-400'
                  }`}>
                    {sentiment.sentimentLabel || 'NEUTRAL'}
                  </span>
                </div>
                <div className="bg-gray-700/50 rounded-lg p-4 text-center">
                  <div className="text-xs text-gray-400 mb-1">Confidence</div>
                  <span className="text-lg font-bold text-white">
                    {Math.round((sentiment.confidence || 0) * 100)}%
                  </span>
                </div>
              </div>

              {sentiment.summary && (
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-white mb-2">AI Summary</h4>
                  <p className="text-sm text-gray-300 leading-relaxed">{sentiment.summary}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-green-500/5 border border-green-500/10 rounded-lg p-3">
                  <h5 className="text-xs font-bold text-green-400 mb-2">📈 Drivers / Opportunities</h5>
                  <ul className="space-y-1.5">
                    {((sentiment.keyDrivers || []).concat(sentiment.opportunities || [])).slice(0, 5).map((item, i) => (
                      <li key={i} className="text-xs text-gray-300 flex items-start gap-1">
                        <span className="text-green-400">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                    {(!sentiment.keyDrivers?.length && !sentiment.opportunities?.length) && (
                      <li className="text-xs text-gray-500 italic">None reported</li>
                    )}
                  </ul>
                </div>

                <div className="bg-red-500/5 border border-red-500/10 rounded-lg p-3 md:col-span-2">
                  <h5 className="text-xs font-bold text-red-400 mb-2">⚠️ Risks</h5>
                  <ul className="space-y-1.5">
                    {(sentiment.risks || []).slice(0, 5).map((risk, i) => (
                      <li key={i} className="text-xs text-gray-300 flex items-start gap-1">
                        <span className="text-red-400">•</span>
                        <span>{risk}</span>
                      </li>
                    ))}
                    {!sentiment.risks?.length && (
                      <li className="text-xs text-gray-500 italic">None reported</li>
                    )}
                  </ul>
                </div>
              </div>

              {sentiment.recentNews?.length > 0 && (
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-white mb-3">Recent News</h4>
                  <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                    {sentiment.recentNews.map((news, idx) => (
                      <div key={idx} className="p-3 bg-gray-800 rounded border border-gray-700">
                        <div className="flex justify-between items-start gap-2 mb-1">
                          <a href={news.url} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-purple-400 hover:underline">
                            {news.title}
                          </a>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold shrink-0 ${
                            news.sentimentLabel === 'BULLISH' ? 'bg-green-500/15 text-green-400' :
                            news.sentimentLabel === 'BEARISH' ? 'bg-red-500/15 text-red-400' :
                            'bg-yellow-500/15 text-yellow-400'
                          }`}>
                            {news.sentimentLabel}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 mb-2">{news.summary}</p>
                        <div className="flex justify-between text-[10px] text-gray-500">
                          <span>{news.source}</span>
                          <span>{new Date(news.publishedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-6 text-gray-500 text-xs italic">
              No sentiment data available for this symbol.
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Data Quality Verification */}
      {modalTab === 'verification' && (
        <div className="space-y-4">
          {verification ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-700/50 rounded-lg p-4 text-center">
                  <div className="text-xs text-gray-400 mb-1">Data Quality Tier</div>
                  <span className={`text-lg font-bold ${
                    verification.dataQuality === 'HIGH' ? 'text-green-400' :
                    verification.dataQuality === 'MEDIUM' ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {verification.dataQuality || 'UNKNOWN'}
                  </span>
                </div>
                <div className="bg-gray-700/50 rounded-lg p-4 text-center">
                  <div className="text-xs text-gray-400 mb-1">Total Records</div>
                  <span className="text-lg font-bold text-white">
                    {verification.recordCount || 0} days
                  </span>
                </div>
              </div>

              {!verification.hasSufficientData && (
                <div className="p-3 bg-red-500/15 border border-red-500/30 rounded-lg text-xs text-red-400">
                  ⚠️ <strong>Insufficient Data:</strong> SeunBot requires at least 50 data records to make a high-confidence prediction. Predictive analytics might not run properly for this ticker.
                </div>
              )}

              <div className="bg-gray-700/50 rounded-lg p-4 space-y-2 text-sm text-gray-300">
                <div className="flex justify-between">
                  <span className="text-gray-400">Data Date Range</span>
                  <span className="text-white font-medium">
                    {verification.firstRecordDate ? new Date(verification.firstRecordDate).toLocaleDateString() : '—'} to {verification.lastRecordDate ? new Date(verification.lastRecordDate).toLocaleDateString() : '—'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Days Since Last Update</span>
                  <span className="text-white font-medium">{verification.daysSinceLastUpdate ?? '—'} days ago</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Recommended Action</span>
                  <span className="text-purple-400 font-semibold">{verification.recommendedAction || '—'}</span>
                </div>
              </div>

              <div className="bg-gray-700/50 rounded-lg p-4">
                <h4 className="text-xs font-semibold text-white mb-2">Latest Session Data</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
                  <div className="bg-gray-800 p-2 rounded">
                    <div className="text-[10px] text-gray-500">Close</div>
                    <div className="text-sm font-bold text-white">${(verification.latestClose || 0).toFixed(2)}</div>
                  </div>
                  <div className="bg-gray-800 p-2 rounded">
                    <div className="text-[10px] text-gray-500">High</div>
                    <div className="text-sm font-bold text-white">${(verification.latestHigh || 0).toFixed(2)}</div>
                  </div>
                  <div className="bg-gray-800 p-2 rounded">
                    <div className="text-[10px] text-gray-500">Low</div>
                    <div className="text-sm font-bold text-white">${(verification.latestLow || 0).toFixed(2)}</div>
                  </div>
                  <div className="bg-gray-800 p-2 rounded">
                    <div className="text-[10px] text-gray-500">Volume</div>
                    <div className="text-sm font-bold text-white">{(verification.latestVolume || 0).toLocaleString()}</div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-6 text-gray-500 text-xs italic">
              Verification info not available.
            </div>
          )}
        </div>
      )}

      {/* Tab 4: History Timeline */}
      {modalTab === 'history' && (
        <div className="space-y-4">
          {history.length > 0 ? (
            <div className="overflow-x-auto bg-gray-800 rounded-lg border border-gray-700">
              <table className="w-full text-xs text-left">
                <thead className="bg-gray-700 text-gray-300 uppercase font-semibold">
                  <tr>
                    <th className="px-4 py-2">Date</th>
                    <th className="px-4 py-2">Price</th>
                    <th className="px-4 py-2">Rating</th>
                    <th className="px-4 py-2 hidden md:table-cell">Scores (T / S / F)</th>
                    <th className="px-4 py-2 text-right">Final</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700 text-gray-300">
                  {history.map((h, i) => (
                    <tr key={i} className="hover:bg-gray-700/40">
                      <td className="px-4 py-2.5 font-medium whitespace-nowrap">
                        {new Date(h.predictedAt || h.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-2.5 font-semibold text-white">
                        ${(h.priceAtPrediction || h.suggestedEntry || 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={`px-2 py-0.5 rounded-full font-bold ${
                          h.recommendation === 'BUY' ? 'bg-green-500/10 text-green-400' :
                          h.recommendation === 'SELL' ? 'bg-red-500/10 text-red-400' : 'bg-yellow-500/10 text-yellow-400'
                        }`}>
                          {h.recommendation}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 font-mono text-[10px] text-gray-400 hidden md:table-cell">
                        {h.technicalScore != null ? h.technicalScore.toFixed(2) : '—'} /{' '}
                        {h.sentimentScore != null ? h.sentimentScore.toFixed(2) : '—'} /{' '}
                        {h.fundamentalScore != null ? h.fundamentalScore.toFixed(2) : '—'}
                      </td>
                      <td className={`px-4 py-2.5 font-bold text-right ${h.finalScore >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {h.finalScore != null ? (h.finalScore > 0 ? `+${h.finalScore.toFixed(3)}` : h.finalScore.toFixed(3)) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 text-xs italic">
              No historical predictions recorded for this symbol yet.
            </div>
          )}
        </div>
      )}

      {/* Timestamp */}
      {prediction.analyzedAt && (
        <div className="text-xs text-gray-500 text-right">
          Analyzed: {new Date(prediction.analyzedAt).toLocaleString()}
        </div>
      )}
    </div>
  );
};

export default USStocksDashboard;
