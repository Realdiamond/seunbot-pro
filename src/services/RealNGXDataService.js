// Real NGX Data Service
// Asset identity fields are sourced from GET /api/Assets.
import axios from 'axios';

class RealNGXDataService {
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
    this.predictionCache = new Map();
    this.verifyCache = new Map();
    this.predictionCacheTTL = 2 * 60 * 1000;
    this.verifyCacheTTL = 2 * 60 * 1000;
    this.predictionBatchSize = 8;
  }

  normalizeAssetSymbol(symbol = '') {
    return String(symbol).replace(/^NSENG_/, '').toUpperCase();
  }

  toNsengSymbol(symbol = '') {
    const normalized = this.normalizeAssetSymbol(symbol);
    return normalized ? `NSENG_${normalized}` : '';
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

  getCached(map, key, ttl) {
    const cached = map.get(key);
    if (!cached) return null;
    if ((Date.now() - cached.timestamp) > ttl) {
      map.delete(key);
      return null;
    }
    return cached.data;
  }

  setCached(map, key, data) {
    map.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  async fetchAssets(forceRefresh = false) {
    const now = Date.now();
    if (!forceRefresh && this.assetsCache.data && (now - this.assetsCache.timestamp) < this.assetsCache.ttl) {
      return this.assetsCache.data;
    }

    const response = await axios.get(`${this.assetsApiBaseUrl}/api/Assets`, {
      timeout: 15000
    });

    const raw = Array.isArray(response.data?.data) ? response.data.data : [];

    // Deduplicate: API returns both bare symbols (DANGCEM) and NSENG_-prefixed
    // (NSENG_DANGCEM) for the same stock. Prefer the NSENG_ version (richer metadata).
    const seen = new Map();
    for (const asset of raw) {
      const normalized = this.normalizeAssetSymbol(asset.symbol);
      if (!normalized) continue;
      const existing = seen.get(normalized);
      if (!existing) {
        seen.set(normalized, asset);
      } else {
        const isNseng = String(asset.symbol).startsWith('NSENG_');
        const existingIsNseng = String(existing.symbol).startsWith('NSENG_');
        if (isNseng && !existingIsNseng) seen.set(normalized, asset);
      }
    }
    const assets = Array.from(seen.values());

    this.assetsCache = { data: assets, timestamp: now, ttl: this.assetsCache.ttl };
    return assets;
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
      rawSymbol: this.toNsengSymbol(symbol),
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
      console.warn('Live prices endpoint unavailable:', error?.message || error);

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

  async fetchPredictionBySymbol(symbol) {
    const nsengSymbol = this.toNsengSymbol(symbol);
    if (!nsengSymbol) return null;

    const cached = this.getCached(this.predictionCache, nsengSymbol, this.predictionCacheTTL);
    if (cached) return cached;

    try {
      const response = await axios.get(`${this.assetsApiBaseUrl}/api/Prediction/${encodeURIComponent(nsengSymbol)}`, {
        timeout: 15000
      });

      const prediction = {
        symbol: nsengSymbol,
        currentPrice: this.pickNumber(response.data, ['currentPrice', 'price', 'lastPrice']),
        analyzedAt: response.data?.analyzedAt || null
      };

      this.setCached(this.predictionCache, nsengSymbol, prediction);
      return prediction;
    } catch (error) {
      console.warn(`Prediction fallback unavailable for ${nsengSymbol}:`, error?.message || error);
      return null;
    }
  }

  async fetchVerifyDataBySymbol(symbol) {
    const nsengSymbol = this.toNsengSymbol(symbol);
    if (!nsengSymbol) return null;

    const cached = this.getCached(this.verifyCache, nsengSymbol, this.verifyCacheTTL);
    if (cached) return cached;

    try {
      const response = await axios.get(`${this.assetsApiBaseUrl}/api/Prediction/${encodeURIComponent(nsengSymbol)}/verify-data`, {
        timeout: 15000
      });

      const verifyData = {
        symbol: nsengSymbol,
        latestClose: this.pickNumber(response.data, ['latestClose']),
        latestHigh: this.pickNumber(response.data, ['latestHigh']),
        latestLow: this.pickNumber(response.data, ['latestLow']),
        latestVolume: this.pickNumber(response.data, ['latestVolume']),
        daysSinceLastUpdate: this.pickNumber(response.data, ['daysSinceLastUpdate'])
      };

      this.setCached(this.verifyCache, nsengSymbol, verifyData);
      return verifyData;
    } catch (error) {
      console.warn(`Verify-data fallback unavailable for ${nsengSymbol}:`, error?.message || error);
      return null;
    }
  }

  async fetchPredictionPricesForSymbols(nsengSymbols = []) {
    const resultMap = new Map();
    const normalizedInput = nsengSymbols
      .map((symbol) => this.toNsengSymbol(symbol))
      .filter(Boolean);

    for (let i = 0; i < normalizedInput.length; i += this.predictionBatchSize) {
      const chunk = normalizedInput.slice(i, i + this.predictionBatchSize);
      const chunkResults = await Promise.all(
        chunk.map((symbol) => this.fetchPredictionBySymbol(symbol))
      );

      chunk.forEach((symbol, idx) => {
        if (chunkResults[idx]) {
          resultMap.set(symbol, chunkResults[idx]);
        }
      });
    }

    return resultMap;
  }

  mapAssetToStock(asset, options = {}) {
    const livePrice = options.livePrice || null;
    const prediction = options.prediction || null;
    const verify = options.verify || null;

    const symbol = this.normalizeAssetSymbol(
      asset?.symbol || livePrice?.rawSymbol || prediction?.symbol || verify?.symbol || ''
    );
    const rawSymbol = asset?.symbol || this.toNsengSymbol(symbol);

    const livePriceValue = this.toNumber(livePrice?.price, null);
    const predictionPrice = this.toNumber(prediction?.currentPrice, null);
    const latestClose = this.toNumber(verify?.latestClose, null);
    const price = this.firstNumber([livePriceValue, predictionPrice, latestClose], 0);

    const previousClose = this.firstNumber([
      this.toNumber(livePrice?.previousClose, null),
      latestClose,
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
      this.toNumber(verify?.latestHigh, null),
      price
    ], price);
    let low = this.firstNumber([
      this.toNumber(livePrice?.low, null),
      this.toNumber(verify?.latestLow, null),
      price
    ], price);
    if (high < low) {
      const temp = high;
      high = low;
      low = temp;
    }

    const volume = this.firstNumber([
      this.toNumber(livePrice?.volume, null),
      this.toNumber(verify?.latestVolume, null)
    ], 0);

    const timestamp = livePrice?.timestamp || prediction?.analyzedAt || new Date().toISOString();
    const sources = [];
    if (this.hasLivePrice(livePrice)) sources.push('Assets Live Prices');
    if (predictionPrice !== null) sources.push('Prediction API');
    if (verify) sources.push('Prediction Verify Data');
    if (sources.length === 0) sources.push('Assets API');

    return {
      symbol,
      rawSymbol,
      name: asset?.name || symbol,
      exchange: asset?.exchange || 'NSENG',
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
      staleDays: this.toNumber(verify?.daysSinceLastUpdate, null),
      isMock: false,
      sources: Array.from(new Set(sources))
    };
  }

  // Fetch NGX stock data by symbol
  async fetchStockData(symbol) {
    try {
      const normalized = this.normalizeAssetSymbol(symbol);
      const nsengSymbol = this.toNsengSymbol(normalized);
      console.log(`📈 Fetching NGX data for ${nsengSymbol}...`);

      const [assets, livePrices, prediction, verify] = await Promise.all([
        this.fetchAssets(),
        this.fetchLivePrices(),
        this.fetchPredictionBySymbol(nsengSymbol),
        this.fetchVerifyDataBySymbol(nsengSymbol)
      ]);

      const asset = assets.find((item) => this.normalizeAssetSymbol(item.symbol) === normalized);
      const livePrice = livePrices.bySymbol.get(normalized) || null;

      if (!asset && !livePrice && !prediction && !verify) {
        throw new Error(`Asset not found for symbol: ${normalized}`);
      }

      return this.mapAssetToStock(
        asset || { symbol: nsengSymbol, name: normalized, exchange: 'NSENG', sector: 'Unknown', imageUrl: '' },
        { livePrice, prediction, verify }
      );
    } catch (error) {
      console.error(`Error fetching stock data for ${symbol}:`, error);
      throw error;
    }
  }

  // Fetch multiple stocks by symbols
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

  // Fetch NGX market summary
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
        index: null,
        indexChange: 0,
        indexChangePercent: 0,
        totalMarketCap: 0,
        totalVolume,
        advancers,
        decliners,
        unchanged,
        timestamp: new Date().toISOString(),
        sources: livePrices.isDataAvailable ? ['Assets API', 'Assets Live Prices'] : ['Assets API'],
        totalStocks,
        isMock: false
      };
    } catch (error) {
      console.error('Failed to fetch market summary:', error);
      throw error;
    }
  }

  // Get all available stocks
  async getAllStocks() {
    try {
      const [assets, livePrices] = await Promise.all([
        this.fetchAssets(),      // already deduplicated
        this.fetchLivePrices()
      ]);

      const symbolsMissingLivePrice = assets
        .filter((asset) => {
          const normalized = this.normalizeAssetSymbol(asset.symbol);
          const livePrice = livePrices.bySymbol.get(normalized) || null;
          return !this.hasLivePrice(livePrice);
        })
        .map((asset) => this.toNsengSymbol(asset.symbol));

      const predictionFallbackMap = await this.fetchPredictionPricesForSymbols(symbolsMissingLivePrice);

      return assets.map((asset) => {
        const normalized = this.normalizeAssetSymbol(asset.symbol);
        const nsengSymbol = this.toNsengSymbol(normalized);
        const livePrice = livePrices.bySymbol.get(normalized) || null;
        const prediction = !this.hasLivePrice(livePrice)
          ? (predictionFallbackMap.get(nsengSymbol) || null)
          : null;

        return this.mapAssetToStock(asset, { livePrice, prediction, verify: null });
      });
    } catch (error) {
      console.error('Error fetching all stocks:', error);
      return [];
    }
  }



  // Clear cache
  clearCache() {
    this.assetsCache.data = null;
    this.assetsCache.timestamp = 0;
    this.livePricesCache.data = null;
    this.livePricesCache.timestamp = 0;
    this.predictionCache.clear();
    this.verifyCache.clear();
  }

  // ── GET /health ──────────────────────────────────────────────────────────────
  async healthCheck() {
    try {
      const res = await axios.get(`${this.assetsApiBaseUrl}/health`, { timeout: 8000 });
      return { healthy: true, message: res.data };
    } catch (err) {
      console.warn('Health check failed:', err?.message);
      return { healthy: false, message: err?.message || 'Unreachable' };
    }
  }

  // ── GET /api/Prediction/watchlist — returns bare symbol string[] ──────────
  async fetchWatchlist() {
    try {
      const res = await axios.get(`${this.assetsApiBaseUrl}/api/Prediction/watchlist`, { timeout: 15000 });
      return Array.isArray(res.data) ? res.data : [];
    } catch (err) {
      console.warn('Watchlist unavailable:', err?.message);
      return [];
    }
  }

  // ── GET /api/Prediction/data-summary — macro DB health view ──────────────
  async fetchDataSummary() {
    try {
      const res = await axios.get(`${this.assetsApiBaseUrl}/api/Prediction/data-summary`, { timeout: 15000 });
      return res.data;
    } catch (err) {
      console.warn('Data summary unavailable:', err?.message);
      return null;
    }
  }

  // Get API configuration status
  getAPIStatus() {
    return {
      assetsBaseUrl: this.assetsApiBaseUrl,
      assetsEndpoints: ['/api/Assets', '/api/Assets/live-prices'],
      predictionEndpoints: [
        '/api/Prediction/{symbol}',
        '/api/Prediction/watchlist',
        '/api/Prediction/{symbol}/verify-data',
        '/api/Prediction/data-summary'
      ],
      hybridStrategyEndpoints: [
        '/api/HybridStrategy/analyze/{NSENG_symbol}',
        '/api/HybridStrategy/compare/{NSENG_symbol}',
        '/api/HybridStrategy/assets'
      ],
      grokSentimentEndpoints: [
        '/api/GrokSentiment/stock/{symbol}',
        '/api/GrokSentiment/sectors',
        '/api/GrokSentiment/sector/{sector}'
      ],
      udfEndpoints: ['/udf/config', '/udf/symbols', '/udf/search', '/udf/history'],
      cacheTTL: this.assetsCache.ttl,
      marketDataProvider: 'SeunBot API'
    };
  }
}

export default new RealNGXDataService();