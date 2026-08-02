// US Stocks Data Service
// Consumes SeunBot backend endpoints for US equities.
import axios from 'axios';

class USStocksDataService {
  constructor() {
    this.baseUrl = import.meta.env.VITE_SEUNBOT_API_BASE_URL || '';
    this.stocksCache = { data: null, timestamp: 0, ttl: 2 * 60 * 1000 };
    this.summaryCache = { data: null, timestamp: 0, ttl: 5 * 60 * 1000 };
  }

  // ─── Utilities ────────────────────────────────────────────

  normalizeSymbol(symbol = '') {
    return String(symbol).toUpperCase().trim();
  }

  toNumber(value, fallback = null) {
    if (value === null || value === undefined) return fallback;
    if (typeof value === 'string' && value.trim() === '') return fallback;
    const num = Number(value);
    return Number.isFinite(num) ? num : fallback;
  }

  cleanStockName(name) {
    if (!name) return '';
    return name
      .replace(/\s+US\s+Stock$/i, '')
      .replace(/\s+US$/i, '')
      .trim();
  }

  clearCache() {
    this.stocksCache.data = null;
    this.stocksCache.timestamp = 0;
    this.summaryCache.data = null;
    this.summaryCache.timestamp = 0;
  }

  // ─── Endpoint 9: GET /api/UsPrediction/stocks (paginated) ─
  // Primary source for stock list + real-time prices.
  async fetchStocksPage(page = 1, pageSize = 25, search = '', sector = '') {
    const params = { page, pageSize };
    if (search) params.search = search;
    if (sector && sector !== 'All') params.sector = sector;

    const response = await axios.get(`${this.baseUrl}/api/UsPrediction/stocks`, {
      params,
      timeout: 30000
    });
    return response.data || {};
  }

  // ─── Endpoint 8: GET /api/UsPrediction/data-summary ───────
  // Returns aggregated symbol metadata + prediction readiness.
  async fetchDataSummary(forceRefresh = false) {
    const now = Date.now();
    if (!forceRefresh && this.summaryCache.data && (now - this.summaryCache.timestamp) < this.summaryCache.ttl) {
      return this.summaryCache.data;
    }
    try {
      const response = await axios.get(`${this.baseUrl}/api/UsPrediction/data-summary`, { timeout: 30000 });
      const data = response.data || {};
      data.totalSymbols = data.totalSymbols || 0;
      this.summaryCache = { data, timestamp: now, ttl: this.summaryCache.ttl };
      return data;
    } catch (err) {
      console.warn('data-summary failed:', err?.message);
      return { totalSymbols: 0, totalRecords: 0, symbolsReadyForPrediction: 0, symbols: [] };
    }
  }

  // ─── getAllStocks ──────────────────────────────────────────
  // Returns a flat array of stock objects with real prices
  // sourced directly from Endpoint 9 — no live-prices merge needed.
  async getAllStocks(forceRefresh = false) {
    const now = Date.now();
    if (!forceRefresh && this.stocksCache.data && (now - this.stocksCache.timestamp) < this.stocksCache.ttl) {
      return this.stocksCache.data;
    }

    try {
      // Fetch top 250 stocks in 1 fast request
      const first = await this.fetchStocksPage(1, 250);
      const stocks = [...(first?.stocks || [])];
      const mapped = stocks.map(s => this.mapStockListItem(s));
      this.stocksCache = { data: mapped, timestamp: now, ttl: this.stocksCache.ttl };
      return mapped;
    } catch (err) {
      console.error('getAllStocks failed:', err?.message);
      // Fallback: try data-summary for symbol list (no prices)
      try {
        const summary = await this.fetchDataSummary(forceRefresh);
        return (summary.symbols || []).map(s => ({
          symbol: this.normalizeSymbol(s.symbol),
          name: this.cleanStockName(s.name || s.symbol),
          exchange: 'US',
          sector: 'US',
          price: 0, change: 0, changePercent: 0,
          volume: 0, high: 0, low: 0,
          imageUrl: null,
          isMock: false,
          isReadyForPrediction: Boolean(s.isReadyForPrediction),
          timestamp: s.lastDate || new Date().toISOString(),
          sources: ['data-summary fallback']
        }));
      } catch {
        return [];
      }
    }
  }

  // Maps a StockListItem (Ep.9 shape) to the internal stock shape
  mapStockListItem(item) {
    const symbol = this.normalizeSymbol(item.symbol || '');
    const price = this.toNumber(item.currentPrice, 0);
    const change = this.toNumber(item.priceChange24h, 0);
    const changePercent = this.toNumber(item.priceChangePercent24h, 0);
    return {
      symbol,
      name: this.cleanStockName(item.name || symbol),
      exchange: item.exchange || 'US',
      sector: item.sector || 'US',
      price,
      change,
      changePercent,
      volume: this.toNumber(item.volume24h, 0),
      high: this.toNumber(item.high24h, price),
      low: this.toNumber(item.low24h, price),
      marketCap: null,           // Not returned by API
      imageUrl: item.imageUrl || null,
      isMock: false,
      isReadyForPrediction: true,
      timestamp: item.lastUpdated || new Date().toISOString(),
      sources: ['US Stocks API']
    };
  }

  // ─── fetchStockData (single stock) ────────────────────────
  // Used by advanced analysis price bar. First checks the cached
  // stocks list (top 250). If not found there, falls back to the
  // full single-stock prediction endpoint which includes currentPrice.
  async fetchStockData(symbol) {
    const normalized = this.normalizeSymbol(symbol);
    try {
      // 1. Check the cached list first (fast path)
      const all = await this.getAllStocks();
      const found = all.find(s => s.symbol === normalized);
      if (found && found.price > 0) return found;

      // 2. Fallback: call the individual prediction endpoint which always
      //    returns currentPrice regardless of cache state.
      try {
        const response = await axios.get(
          `${this.baseUrl}/api/UsPrediction/${normalized}`,
          { timeout: 30000 }
        );
        const data = response.data || {};
        const price = this.toNumber(data.currentPrice, 0);
        if (price > 0) {
          return {
            symbol: normalized,
            name: this.cleanStockName(data.companyName || normalized),
            exchange: 'US',
            sector: data.sector || 'US Stock',
            price,
            change: this.toNumber(data.priceChange, 0),
            changePercent: this.toNumber(data.priceChangePercent, 0),
            volume: this.toNumber(data.volume, 0),
            high: this.toNumber(data.high24h ?? data.high, price),
            low: this.toNumber(data.low24h ?? data.low, price),
            open: this.toNumber(data.open, null),
            imageUrl: null,
            isMock: false,
            sources: ['UsPrediction API']
          };
        }
      } catch (apiErr) {
        // Individual endpoint unavailable or returned non-200 — continue to stub
        console.warn(`fetchStockData fallback failed for ${normalized}:`, apiErr?.message);
      }

      // 3. Return found entry even if price is 0 (better than nothing)
      if (found) return found;

      // 4. Absolute last resort stub
      return {
        symbol: normalized, name: normalized, exchange: 'US', sector: 'US',
        price: 0, change: 0, changePercent: 0, volume: 0, high: 0, low: 0,
        imageUrl: null, isMock: false, sources: []
      };
    } catch {
      return {
        symbol: normalized, name: normalized, exchange: 'US', sector: 'US',
        price: 0, change: 0, changePercent: 0, volume: 0, high: 0, low: 0,
        imageUrl: null, isMock: false, sources: []
      };
    }
  }

  // ─── fetchLivePrices ───────────────────────────────────────
  // Returns { bySymbol: Map<symbol, {price, volume, high, low, change,
  // changePercent, previousClose}> } for the live-price poller.
  // NOTE: there is no cheap US bulk live-price endpoint (Assets/live-prices
  // serves NGX only), so prices are derived from the cached stocks list
  // sourced from UsPrediction/stocks. forceRefresh re-pulls that list.
  async fetchLivePrices(forceRefresh = false) {
    const stocks = await this.getAllStocks(forceRefresh);
    const bySymbol = new Map();
    stocks.forEach(s => {
      bySymbol.set(s.symbol, {
        price: s.price,
        volume: s.volume,
        high: s.high,
        low: s.low,
        previousClose: s.price - s.change,
        change: s.change,
        changePercent: s.changePercent
      });
    });
    return { bySymbol };
  }

  // ─── fetchMultipleStocks ───────────────────────────────────
  async fetchMultipleStocks(symbols = []) {
    const all = await this.getAllStocks();
    const desired = new Set(symbols.map(s => this.normalizeSymbol(s)));
    return all.filter(s => desired.has(s.symbol));
  }

  async fetchBatchStocks(symbols = []) {
    return this.fetchMultipleStocks(symbols);
  }

  // ─── fetchMarketSummary ────────────────────────────────────
  async fetchMarketSummary() {
    try {
      const [summary, stocks] = await Promise.all([
        this.fetchDataSummary(),
        this.getAllStocks()
      ]);

      const advancers = stocks.filter(s => this.toNumber(s.changePercent, 0) > 0).length;
      const decliners = stocks.filter(s => this.toNumber(s.changePercent, 0) < 0).length;
      // Total universe = full fetched stock list (~5000+), not the
      // prediction-ready subset reported by data-summary (~200).
      const totalUniverse = Math.max(stocks.length, summary.totalSymbols || 0);
      const unchanged = Math.max(totalUniverse - advancers - decliners, 0);
      const totalVolume = stocks.reduce((sum, s) => sum + this.toNumber(s.volume, 0), 0);

      // Dynamically calculate index movement based on realistic stock performance (filtering out extreme corrupt outliers)
      const validStocks = stocks.filter(s => {
        const p = this.toNumber(s.price, 0);
        const cp = this.toNumber(s.changePercent, 0);
        return p > 0 && cp >= -95 && cp <= 300;
      });

      let avgChangePercent = 0;
      if (validStocks.length > 0) {
        avgChangePercent = validStocks.reduce((sum, s) => sum + this.toNumber(s.changePercent, 0), 0) / validStocks.length;
      }
      avgChangePercent = Math.min(Math.max(avgChangePercent, -15), 15);

      const baseIndex = 15420.50; // S&P 500 / Nasdaq benchmark scale
      const indexChangePercent = Math.round(avgChangePercent * 100) / 100;
      const indexChange = Math.round(baseIndex * (indexChangePercent / 100) * 100) / 100;
      const index = Math.round((baseIndex + indexChange) * 100) / 100;

      return {
        index,
        indexChange,
        indexChangePercent,
        totalMarketCap: 0,
        totalVolume,
        advancers,
        decliners,
        unchanged,
        timestamp: new Date().toISOString(),
        sources: ['UsPrediction/stocks', 'UsPrediction/data-summary'],
        totalStocks: totalUniverse,
        symbolsReady: summary.symbolsReadyForPrediction || 0,
        isMock: false
      };
    } catch (err) {
      console.error('fetchMarketSummary failed:', err?.message);
      throw err;
    }
  }

  // ─── Endpoint 1: GET /api/UsPrediction/{symbol} ───────────
  // Fetches full SeunBot prediction and normalizes it for the UI.
  async fetchUsPrediction(symbol, { maxRetries = 6, retryDelayMs = 5000 } = {}) {
    const normalized = this.normalizeSymbol(symbol);
    let attempt = 0;

    while (attempt <= maxRetries) {
      try {
        const response = await axios.get(
          `${this.baseUrl}/api/UsPrediction/${normalized}`,
          { timeout: 60000 }
        );
        const data = response.data || {};

        if (data.status === 'syncing' || data.status === 'sync_required') {
          console.log(`⏳ ${normalized} syncing (attempt ${attempt + 1}/${maxRetries + 1}):`, data.message);
          if (attempt < maxRetries) {
            await new Promise(r => setTimeout(r, retryDelayMs));
            attempt++;
            continue;
          }
          return { ...data, _isSyncing: true, symbol: normalized };
        }

        return this.normalizeUsPrediction({ ...data, symbol: normalized });
      } catch (error) {
        if (error?.response?.status === 404) {
          const body = error.response?.data || {};
          if (body.status === 'sync_required' || body.recordsAvailable !== undefined) {
            if (attempt < maxRetries) {
              await new Promise(r => setTimeout(r, retryDelayMs));
              attempt++;
              continue;
            }
            return { ...body, _isSyncing: true, symbol: normalized };
          }
        }
        console.error(`❌ fetchUsPrediction ${normalized}:`, error?.message || error);
        throw error;
      }
    }
  }

  // ─── normalizeUsPrediction ─────────────────────────────────
  // Remaps the raw Endpoint 1 response to the shape that
  // USStocksAdvancedAnalysis.jsx and StockAnalysisPanel expect.
  normalizeUsPrediction(raw) {
    if (!raw || raw._isSyncing) return raw;

    const ind = raw.breakdown?.technicalIndicators || {};
    const rec = (raw.recommendation || 'HOLD').toUpperCase();

    // Build tradePlan from trade fields (all nullable)
    const hasTradePlan = raw.suggestedEntry != null || raw.stopLoss != null || raw.takeProfit != null;
    const tradePlan = hasTradePlan ? {
      entryPrice: this.toNumber(raw.suggestedEntry),
      stopLoss: this.toNumber(raw.stopLoss),
      takeProfit1: this.toNumber(raw.takeProfit),
      takeProfit2: null,
      riskRewardRatio1: this.toNumber(raw.riskRewardRatio),
      riskRewardRatio2: null,
      isRecommended: rec === 'BUY',
      direction: raw.breakdown?.technicalDirection || 'NEUTRAL',
      reason: Array.isArray(raw.keyFactors) && raw.keyFactors.length > 0
        ? raw.keyFactors[0]
        : 'Analysis based on available technical data'
    } : null;

    // Build trade narrative from key factors + risks + macro
    const narrativeParts = [];
    if (Array.isArray(raw.keyFactors) && raw.keyFactors.length) {
      narrativeParts.push('📊 Key Factors:\n' + raw.keyFactors.map(f => `• ${f}`).join('\n'));
    }
    if (raw.breakdown?.macroSummary) {
      narrativeParts.push('🌍 Macro: ' + raw.breakdown.macroSummary);
    }
    if (Array.isArray(raw.risks) && raw.risks.length) {
      narrativeParts.push('⚠️ Risks:\n' + raw.risks.map(r => `• ${r}`).join('\n'));
    }

    // Score mapping
    const scores = {
      technical: this.toNumber(raw.technicalScore, 0),
      sentiment: this.toNumber(raw.sentimentScore, 0),
      fundamental: this.toNumber(raw.fundamentalScore, 0),
      gann: null,  // Not returned by API
      weights: raw.weights || null
    };

    return {
      // Pass-through fields
      symbol: raw.symbol,
      companyName: this.cleanStockName(raw.companyName || raw.symbol),
      recommendation: rec,
      confidence: this.toNumber(raw.confidence, 0),
      currentPrice: this.toNumber(raw.currentPrice, 0),
      suggestedEntry: this.toNumber(raw.suggestedEntry),
      stopLoss: this.toNumber(raw.stopLoss),
      takeProfit: this.toNumber(raw.takeProfit),
      riskRewardRatio: this.toNumber(raw.riskRewardRatio),
      keyFactors: Array.isArray(raw.keyFactors) ? raw.keyFactors : [],
      risks: Array.isArray(raw.risks) ? raw.risks : [],
      analyzedAt: raw.analyzedAt,
      isSuccess: raw.isSuccess,
      errorMessage: raw.errorMessage,

      // Normalized fields for USStocksAdvancedAnalysis
      finalScore: this.toNumber(raw.finalScore, 0),
      direction: raw.breakdown?.technicalDirection || 'NEUTRAL',
      overallMtfSignal: ind.HybridSignal || rec,
      signalStrength: this.toNumber(ind.HybridScore, 0),
      isStrongSignal: Boolean(ind.IsStrongSignal),
      scores,
      tradePlan,
      tradeNarrative: narrativeParts.join('\n\n') || null,
      analysisTimestamp: raw.analyzedAt,

      // Indicator scores (raw — for potential future use)
      breakdown: raw.breakdown || {},
      indicators: {
        // Individual technical indicator scores from breakdown
        hybridScore: this.toNumber(ind.HybridScore),
        orchestratorScore: this.toNumber(ind.TradingOrchestratorScore),
        institutionalScore: this.toNumber(ind.InstitutionalScore),
        meanReversionScore: this.toNumber(ind.MeanReversionScore),
        momentumScore: this.toNumber(ind.MomentumScore),
        volumeScore: this.toNumber(ind.VolumeScore),
        // RSI / ADX / ATR / MACD not available from this endpoint
        rsi: null,
        adx: null,
        atr: null,
        macd: null
      },

      // Sections not available from this API — explicitly null
      weeklyTradeSetup: null,
      geometricPattern: null,
      elliottWavesPattern: null,

      // Internal flag
      _isSyncing: false
    };
  }

  // ─── Endpoint 6: POST /api/UsPrediction/watchlist/analyze ─
  async analyzeWatchlist() {
    const response = await axios.post(
      `${this.baseUrl}/api/UsPrediction/watchlist/analyze`,
      {},
      { timeout: 60000 }
    );
    const data = response.data || {};
    // Normalize every prediction in all signal groups
    const normalize = item => this.normalizeUsPrediction({ ...item, _isSyncing: false });
    return {
      analyzedAt: data.analyzedAt,
      durationSeconds: data.durationSeconds,
      totalStocks: data.totalStocks,
      buySignals: (data.buySignals || []).map(normalize),
      sellSignals: (data.sellSignals || []).map(normalize),
      holdSignals: (data.holdSignals || []).map(normalize),
      errors: data.errors || []
    };
  }

  // ─── GET /api/UsPrediction/dashboard/setups ─
  // Backend-scanned US weekly high-probability setups (mirrors the NGX setups endpoint).
  async fetchWeeklySetups({ minProbability = 0, maxResults = 500 } = {}) {
    const response = await axios.get(
      `${this.baseUrl}/api/UsPrediction/dashboard/setups`,
      { params: { minProbability, maxResults }, timeout: 60000 }
    );
    return response.data || {};
  }

  // ─── Endpoint 4: GET /api/UsPrediction/{symbol}/sentiment ─
  async fetchSentiment(symbol) {
    const normalized = this.normalizeSymbol(symbol);
    const response = await axios.get(
      `${this.baseUrl}/api/UsPrediction/${normalized}/sentiment`,
      { timeout: 30000 }
    );
    return response.data || {};
  }

  // ─── Endpoint 3: GET /api/UsPrediction/{symbol}/history ───
  async fetchHistory(symbol, count = 10) {
    const normalized = this.normalizeSymbol(symbol);
    const response = await axios.get(
      `${this.baseUrl}/api/UsPrediction/${normalized}/history`,
      { params: { count }, timeout: 30000 }
    );
    return response.data || [];
  }

  // ─── Endpoint 7: GET /api/UsPrediction/{symbol}/verify-data
  async verifyData(symbol) {
    const normalized = this.normalizeSymbol(symbol);
    const response = await axios.get(
      `${this.baseUrl}/api/UsPrediction/${normalized}/verify-data`,
      { timeout: 30000 }
    );
    return response.data || {};
  }

  // ─── Endpoint 5: GET /api/UsPrediction/watchlist ──────────
  async fetchWatchlist() {
    const response = await axios.get(
      `${this.baseUrl}/api/UsPrediction/watchlist`,
      { timeout: 15000 }
    );
    return Array.isArray(response.data) ? response.data : [];
  }

  // ─── Endpoint 2: GET /api/UsPrediction/batch ──────────────
  async fetchBatchPredictions(symbols = []) {
    const response = await axios.get(
      `${this.baseUrl}/api/UsPrediction/batch`,
      { params: { symbols: symbols.join(',') }, timeout: 60000 }
    );
    const data = Array.isArray(response.data) ? response.data : [];
    return data.map(item => this.normalizeUsPrediction({ ...item, _isSyncing: false }));
  }

  // ─── Legacy / technical calculation helpers ────────────────
  // Kept for backward compatibility with any component still using them.

  calculateSeunBotSignals(stockData, historicalData) {
    try {
      if (!historicalData || historicalData.length < 50) {
        return { signal: 'HOLD', strength: 0, factors: [] };
      }
      const factors = [];
      let bullishScore = 0;
      let bearishScore = 0;

      const rsi = this.calculateRSI(historicalData, 14);
      if (rsi < 30) { factors.push('Oversold RSI'); bullishScore += 1; }
      else if (rsi > 70) { factors.push('Overbought RSI'); bearishScore += 1; }

      const macd = this.calculateMACD(historicalData);
      if (macd.histogram > 0) { factors.push('Bullish MACD'); bullishScore += 1.5; }
      else if (macd.histogram < 0) { factors.push('Bearish MACD'); bearishScore += 1.5; }

      const priceChange = stockData.changePercent;
      if (priceChange > 2) { factors.push('Strong Upward Momentum'); bullishScore += 1; }
      else if (priceChange < -2) { factors.push('Strong Downward Momentum'); bearishScore += 1; }

      const netScore = bullishScore - bearishScore;
      let signal = 'HOLD';
      if (netScore >= 4.0) signal = 'STRONG BUY';
      else if (netScore >= 3.0) signal = 'BUY';
      else if (netScore <= -4.0) signal = 'STRONG SELL';
      else if (netScore <= -3.0) signal = 'SELL';

      const price = stockData.price || 0;
      return {
        signal, strength: Math.abs(netScore), bullishScore, bearishScore, factors,
        stopLoss: price * 0.95,
        target1: price * 1.15,
        target2: price * 1.30,
        rsi, macd: macd.histogram
      };
    } catch {
      return { signal: 'HOLD', strength: 0, factors: [] };
    }
  }

  calculateRSI(data, period = 14) {
    if (data.length < period + 1) return 50;
    const changes = data.slice(-period - 1).map((d, i, arr) =>
      i > 0 ? d.close - arr[i - 1].close : 0
    ).slice(1);
    const gains = changes.map(c => c > 0 ? c : 0);
    const losses = changes.map(c => c < 0 ? -c : 0);
    const avgGain = gains.reduce((a, b) => a + b, 0) / period;
    const avgLoss = losses.reduce((a, b) => a + b, 0) / period;
    if (avgLoss === 0) return 100;
    return 100 - (100 / (1 + avgGain / avgLoss));
  }

  calculateMACD(data) {
    if (data.length < 26) return { macd: 0, signal: 0, histogram: 0, macdLine: 0, signalLine: 0 };
    const closes = data.map(d => d.close);
    const ema12 = this.calculateEMA(closes, 12);
    const ema26 = this.calculateEMA(closes, 26);
    const macd = ema12 - ema26;
    const signal = this.calculateEMA([macd], 9);
    return { macd, macdLine: macd, signalLine: signal, signal, histogram: macd - signal };
  }

  calculateEMA(data, period) {
    if (data.length < period) return data[data.length - 1] || 0;
    const multiplier = 2 / (period + 1);
    let ema = data.slice(0, period).reduce((a, b) => a + b, 0) / period;
    for (let i = period; i < data.length; i++) {
      ema = (data[i] - ema) * multiplier + ema;
    }
    return ema;
  }
}

export default new USStocksDataService();
