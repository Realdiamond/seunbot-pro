// US Stocks Data Service
// Consumes SeunBot backend endpoints for US equities.
import axios from 'axios';

class USStocksDataService {
  constructor() {
    this.assetsApiBaseUrl = import.meta.env.VITE_SEUNBOT_API_BASE_URL || '';
    this.assetsCache = {
      data: null,
      timestamp: 0,
      ttl: 2 * 60 * 1000
    };
    this.livePricesCache = {
      data: null,
      timestamp: 0,
      ttl: 60 * 1000
    };
    this.technicalConfig = {
      RSI_PERIOD: 14,
      MACD_FAST: 12,
      MACD_SLOW: 26,
      MACD_SIGNAL: 9,
      ATR_PERIOD: 14,
      ADX_PERIOD: 14,
      STRONG_SIGNAL_THRESHOLD: 4.0,
      SIGNAL_THRESHOLD: 3.0,
      STOP_LOSS_PCT: 0.05,
      TARGET1_PCT: 0.15,
      TARGET2_PCT: 0.30
    };
  }

  normalizeAssetSymbol(symbol = '') {
    return String(symbol).toUpperCase().trim();
  }

  toUsSymbol(symbol = '') {
    return this.normalizeAssetSymbol(symbol);
  }

  getDisplaySector(sector) {
    return sector && sector !== 'Unknown' ? sector : 'Unknown';
  }

  toNumber(value, fallback = null) {
    if (value === null || value === undefined) return fallback;
    if (typeof value === 'string' && value.trim() === '') return fallback;
    const num = Number(value);
    return Number.isFinite(num) ? num : fallback;
  }

  pickNumber(source, keys = [], fallback = null) {
    if (!source || typeof source !== 'object') return fallback;
    for (const key of keys) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        const value = this.toNumber(source[key], null);
        if (value !== null) return value;
      }
    }
    return fallback;
  }

  firstNumber(candidates = [], fallback = 0) {
    for (const item of candidates) {
      const value = this.toNumber(item, null);
      if (value !== null) return value;
    }
    return fallback;
  }

  /**
   * Fetch list of all tracked US stocks.
   * Primary: GET /api/UsPrediction/data-summary
   * Returns an array of { symbol, name, recordCount, isReadyForPrediction }
   */
  async fetchAssets(forceRefresh = false) {
    const now = Date.now();
    if (!forceRefresh && this.assetsCache.data && (now - this.assetsCache.timestamp) < this.assetsCache.ttl) {
      return this.assetsCache.data;
    }

    // Try the primary endpoint: /api/UsPrediction/data-summary
    try {
      const response = await axios.get(`${this.assetsApiBaseUrl}/api/UsPrediction/data-summary`, {
        timeout: 15000
      });
      const payload = response.data || {};
      // Shape: { stocks: [{ symbol, name, recordCount, firstDate, lastDate, isReadyForPrediction }] }
      const rawList = Array.isArray(payload.stocks) ? payload.stocks : [];

      const seen = new Map();
      for (const asset of rawList) {
        const symbol = this.normalizeAssetSymbol(asset.symbol || '');
        if (!symbol) continue;
        // Strip the "US_" prefix the backend sometimes returns in name
        const name = asset.name ? asset.name.replace(/^US_/, '') : symbol;
        seen.set(symbol, {
          symbol,
          name,
          exchange: 'US',
          sector: asset.sector || 'Unknown',
          imageUrl: asset.imageUrl || '',
          isReadyForPrediction: Boolean(asset.isReadyForPrediction)
        });
      }
      const assets = Array.from(seen.values());
      this.assetsCache = { data: assets, timestamp: now, ttl: this.assetsCache.ttl };
      return assets;
    } catch (error) {
      console.warn('UsPrediction/data-summary failed, trying fallback /api/UsPrediction/stocks:', error?.message || error);
    }

    // Fallback: paginated list endpoint /api/UsPrediction/stocks
    try {
      const response = await axios.get(`${this.assetsApiBaseUrl}/api/UsPrediction/stocks`, {
        params: { page: 1, pageSize: 500 },
        timeout: 15000
      });
      const payload = response.data || {};
      const rawList = Array.isArray(payload.data) ? payload.data : (Array.isArray(payload) ? payload : []);

      const seen = new Map();
      for (const asset of rawList) {
        const symbol = this.normalizeAssetSymbol(asset.symbol || '');
        if (!symbol) continue;
        seen.set(symbol, {
          symbol,
          name: asset.name || symbol,
          exchange: 'US',
          sector: asset.sector || 'Unknown',
          imageUrl: asset.imageUrl || '',
          isReadyForPrediction: true
        });
      }
      const assets = Array.from(seen.values());
      this.assetsCache = { data: assets, timestamp: now, ttl: this.assetsCache.ttl };
      return assets;
    } catch (error) {
      console.warn('UsPrediction/stocks fallback also failed:', error?.message || error);
      return [];
    }
  }

  /**
   * Fetch full SeunBot analysis for a US stock.
   * GET /api/UsPrediction/{symbol}
   *
   * If the response contains status === 'syncing' or 'sync_required',
   * we retry up to `maxRetries` times with a `retryDelayMs` pause.
   */
  async fetchUsPrediction(symbol, { maxRetries = 6, retryDelayMs = 5000 } = {}) {
    const normalized = this.normalizeAssetSymbol(symbol);
    let attempt = 0;

    while (attempt <= maxRetries) {
      try {
        const response = await axios.get(
          `${this.assetsApiBaseUrl}/api/UsPrediction/${normalized}`,
          { timeout: 20000 }
        );

        const data = response.data || {};

        // Syncing state — backend is still collecting historical data
        if (data.status === 'syncing' || data.status === 'sync_required') {
          console.log(`⏳ ${normalized} is syncing (attempt ${attempt + 1}/${maxRetries + 1}):`, data.message);
          if (attempt < maxRetries) {
            await new Promise(r => setTimeout(r, retryDelayMs));
            attempt++;
            continue;
          }
          // Exceeded retries — return the syncing state for the UI to show
          return { ...data, _isSyncing: true, symbol: normalized };
        }

        // Full analysis returned
        return { ...data, _isSyncing: false, symbol: normalized };
      } catch (error) {
        if (error?.response?.status === 404) {
          // 404 means sync_required (insufficient data)
          const body = error.response?.data || {};
          if (body.status === 'sync_required' || body.recordsAvailable !== undefined) {
            console.log(`⏳ ${normalized} needs backfill (404):`, body.message);
            if (attempt < maxRetries) {
              await new Promise(r => setTimeout(r, retryDelayMs));
              attempt++;
              continue;
            }
            return { ...body, _isSyncing: true, symbol: normalized };
          }
        }
        console.error(`❌ Error fetching UsPrediction for ${normalized}:`, error?.message || error);
        throw error;
      }
    }
  }

  extractLivePricesArray(payload) {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;

    if (payload?.data && typeof payload.data === 'object') {
      return Object.entries(payload.data).map(([symbol, value]) => {
        if (value && typeof value === 'object') {
          return { symbol, ...value };
        }
        return { symbol, value };
      });
    }

    return [];
  }

  normalizeLivePriceRecord(record) {
    if (!record || typeof record !== 'object') return null;

    const rawSymbol = record.symbol || record.assetSymbol || record.ticker || record.code || '';
    const symbol = this.normalizeAssetSymbol(rawSymbol);
    if (!symbol) return null;

    return {
      symbol,
      price: this.pickNumber(record, ['price', 'currentPrice', 'lastPrice', 'livePrice', 'latestPrice']),
      change: this.pickNumber(record, ['change', 'priceChange', 'dailyChange']),
      changePercent: this.pickNumber(record, ['changePercent', 'priceChangePercent', 'dailyChangePercent', 'percentChange']),
      volume: this.pickNumber(record, ['volume', 'totalVolume', 'latestVolume', 'tradeVolume']),
      high: this.pickNumber(record, ['high', 'dayHigh', 'latestHigh']),
      low: this.pickNumber(record, ['low', 'dayLow', 'latestLow']),
      previousClose: this.pickNumber(record, ['previousClose', 'prevClose', 'latestClose']),
      timestamp: record.timestamp || record.updatedAt || record.lastUpdated || null
    };
  }

  hasLivePrice(livePriceRecord) {
    return this.toNumber(livePriceRecord?.price, null) !== null;
  }

  async fetchLivePrices(forceRefresh = false) {
    const now = Date.now();
    if (!forceRefresh && this.livePricesCache.data && (now - this.livePricesCache.timestamp) < this.livePricesCache.ttl) {
      return this.livePricesCache.data;
    }

    try {
      const response = await axios.get(`${this.assetsApiBaseUrl}/api/Assets/live-prices`, {
        timeout: 15000
      });

      const payload = response.data || {};
      const rows = this.extractLivePricesArray(payload);
      const bySymbol = new Map();

      rows.forEach((row) => {
        const normalized = this.normalizeLivePriceRecord(row);
        if (!normalized) return;
        bySymbol.set(normalized.symbol, normalized);
      });

      const data = {
        bySymbol,
        isDataAvailable: Boolean(payload?.isDataAvailable) && bySymbol.size > 0,
        lastRefreshed: payload?.lastRefreshed || null
      };

      this.livePricesCache = {
        data,
        timestamp: now,
        ttl: this.livePricesCache.ttl
      };

      return data;
    } catch (error) {
      console.warn('US Live prices endpoint unavailable:', error?.message || error);

      const fallback = {
        bySymbol: new Map(),
        isDataAvailable: false,
        lastRefreshed: null
      };

      this.livePricesCache = {
        data: fallback,
        timestamp: now,
        ttl: this.livePricesCache.ttl
      };

      return fallback;
    }
  }

  mapAssetToStock(asset, options = {}) {
    const livePrice = options.livePrice || null;

    const symbol = this.normalizeAssetSymbol(asset?.symbol || livePrice?.symbol || '');
    
    const livePriceValue = this.toNumber(livePrice?.price, null);
    const price = this.firstNumber([livePriceValue, 0], 0);

    const previousClose = this.firstNumber([
      this.toNumber(livePrice?.previousClose, null),
      price
    ], price);

    let change = this.toNumber(livePrice?.change, null);
    if (change === null && previousClose !== null) {
      change = price - previousClose;
    }
    if (change === null) change = 0;

    let changePercent = this.toNumber(livePrice?.changePercent, null);
    if (changePercent === null && previousClose) {
      changePercent = (change / previousClose) * 100;
    }
    if (changePercent === null) changePercent = 0;

    let high = this.firstNumber([
      this.toNumber(livePrice?.high, null),
      price
    ], price);
    let low = this.firstNumber([
      this.toNumber(livePrice?.low, null),
      price
    ], price);
    if (high < low) {
      const temp = high;
      high = low;
      low = temp;
    }

    const volume = this.firstNumber([
      this.toNumber(livePrice?.volume, null)
    ], 0);

    const timestamp = livePrice?.timestamp || new Date().toISOString();
    const sources = [];
    if (this.hasLivePrice(livePrice)) sources.push('US Assets Live Prices');
    if (sources.length === 0) sources.push('US Assets API');

    return {
      symbol,
      name: asset?.name || symbol,
      exchange: asset?.exchange || 'US',
      imageUrl: asset?.imageUrl || '',
      sector: this.getDisplaySector(asset?.sector),
      type: 'Stock',
      price,
      change,
      changePercent,
      volume,
      high,
      low,
      open: null,
      previousClose,
      timestamp,
      isMock: false,
      sources: Array.from(new Set(sources))
    };
  }

  async fetchStockData(symbol) {
    try {
      const normalized = this.normalizeAssetSymbol(symbol);
      console.log(`📈 Fetching US Stock data for ${normalized}...`);

      const [assets, livePrices] = await Promise.all([
        this.fetchAssets(),
        this.fetchLivePrices()
      ]);

      const asset = assets.find((item) => this.normalizeAssetSymbol(item.symbol) === normalized);
      const livePrice = livePrices.bySymbol.get(normalized) || null;

      if (!asset && !livePrice) {
        // Not in asset list yet — build a minimal stub
        console.warn(`${normalized} not in assets list, returning stub`);
        return this.mapAssetToStock(
          { symbol: normalized, name: normalized, exchange: 'US', sector: 'Unknown', imageUrl: '' },
          { livePrice: null }
        );
      }

      return this.mapAssetToStock(
        asset || { symbol: normalized, name: normalized, exchange: 'US', sector: 'Unknown', imageUrl: '' },
        { livePrice }
      );
    } catch (error) {
      console.error(`Error fetching US Stock data for ${symbol}:`, error);
      throw error;
    }
  }

  async fetchMultipleStocks(symbols = []) {
    try {
      const allStocks = await this.getAllStocks();
      const desired = new Set(symbols.map((s) => this.normalizeAssetSymbol(s)));
      return allStocks.filter((stock) => desired.has(stock.symbol));
    } catch (error) {
      console.error('Error fetching multiple stocks:', error);
      return [];
    }
  }

  // Alias for backward compatibility / websocket compatibility
  async fetchBatchStocks(symbols = []) {
    return this.fetchMultipleStocks(symbols);
  }

  async fetchMarketSummary() {
    try {
      const [assets, livePrices] = await Promise.all([
        this.fetchAssets(),
        this.fetchLivePrices()
      ]);

      const totalStocks = assets.length;
      const priceRows = Array.from(livePrices.bySymbol.values());
      const totalVolume = priceRows.reduce((sum, row) => sum + this.firstNumber([row.volume], 0), 0);

      const advancers = priceRows.filter((row) => this.toNumber(row.changePercent, 0) > 0).length;
      const decliners = priceRows.filter((row) => this.toNumber(row.changePercent, 0) < 0).length;
      const unchanged = Math.max(totalStocks - advancers - decliners, 0);

      return {
        index: 0,
        indexChange: 0,
        indexChangePercent: 0,
        totalMarketCap: 0,
        totalVolume,
        advancers,
        decliners,
        unchanged,
        timestamp: new Date().toISOString(),
        sources: livePrices.isDataAvailable ? ['US Assets API', 'US Assets Live Prices'] : ['US Assets API'],
        totalStocks,
        isMock: false
      };
    } catch (error) {
      console.error('Failed to fetch US market summary:', error);
      throw error;
    }
  }

  async getAllStocks() {
    try {
      const [assets, livePrices] = await Promise.all([
        this.fetchAssets(),
        this.fetchLivePrices()
      ]);

      return assets.map((asset) => {
        const normalized = this.normalizeAssetSymbol(asset.symbol);
        const livePrice = livePrices.bySymbol.get(normalized) || null;
        return this.mapAssetToStock(asset, { livePrice });
      });
    } catch (error) {
      console.error('Error fetching all US stocks:', error);
      return [];
    }
  }

  calculateSeunBotSignals(stockData, historicalData) {
    try {
      if (!historicalData || historicalData.length < 50) {
        return { signal: 'HOLD', strength: 0, factors: [] };
      }
      const factors = [];
      let bullishScore = 0;
      let bearishScore = 0;

      const rsi = this.calculateRSI(historicalData, this.technicalConfig.RSI_PERIOD);
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
      if (netScore >= this.technicalConfig.STRONG_SIGNAL_THRESHOLD) signal = 'STRONG BUY';
      else if (netScore >= this.technicalConfig.SIGNAL_THRESHOLD) signal = 'BUY';
      else if (netScore <= -this.technicalConfig.STRONG_SIGNAL_THRESHOLD) signal = 'STRONG SELL';
      else if (netScore <= -this.technicalConfig.SIGNAL_THRESHOLD) signal = 'SELL';

      return {
        signal, strength: Math.abs(netScore), bullishScore, bearishScore, factors,
        stopLoss: stockData.price * (1 - this.technicalConfig.STOP_LOSS_PCT),
        target1: stockData.price * (1 + this.technicalConfig.TARGET1_PCT),
        target2: stockData.price * (1 + this.technicalConfig.TARGET2_PCT),
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
    if (data.length < 26) return { macd: 0, signal: 0, histogram: 0 };
    const closes = data.map(d => d.close);
    const ema12 = this.calculateEMA(closes, 12);
    const ema26 = this.calculateEMA(closes, 26);
    const macd = ema12 - ema26;
    const signal = this.calculateEMA([macd], 9);
    return { macd, signal, histogram: macd - signal };
  }

  calculateEMA(data, period) {
    if (data.length < period) return data[data.length - 1];
    const multiplier = 2 / (period + 1);
    let ema = data.slice(0, period).reduce((a, b) => a + b, 0) / period;
    for (let i = period; i < data.length; i++) {
      ema = (data[i] - ema) * multiplier + ema;
    }
    return ema;
  }

  clearCache() {
    this.assetsCache.data = null;
    this.assetsCache.timestamp = 0;
    this.livePricesCache.data = null;
    this.livePricesCache.timestamp = 0;
  }
}

export default new USStocksDataService();
