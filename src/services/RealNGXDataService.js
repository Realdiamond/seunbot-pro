// Real NGX Data Service
// Asset identity fields are sourced from GET /api/Assets.
import axios from 'axios';

class RealNGXDataService {
  constructor() {
    this.assetsApiBaseUrl = import.meta.env.VITE_SEUNBOT_API_BASE_URL || '';
    // Increased cache TTLs to reduce API calls
    this.assetsCache = {
      data: null,
      timestamp: 0,
      ttl: 5 * 60 * 1000  // 5 minutes (assets rarely change)
    };
    this.livePricesCache = {
      data: null,
      timestamp: 0,
      ttl: 60 * 1000  // 1 minute for live prices
    };
    this.predictionCache = new Map();
    this.verifyCache = new Map();
    this.predictionCacheTTL = 5 * 60 * 1000;  // 5 minutes
    this.verifyCacheTTL = 5 * 60 * 1000;      // 5 minutes
    // Request deduplication: track in-flight requests to prevent duplicate API calls
    this._inflightAssets = null;
    this._inflightLivePrices = null;
    this._inflightBatchPrediction = null;
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

    // Request deduplication: if a fetch is already in-flight, wait for it
    if (this._inflightAssets) {
      return this._inflightAssets;
    }

    this._inflightAssets = (async () => {
      try {
        const response = await axios.get(`${this.assetsApiBaseUrl}/api/Assets`, {
          params: {
            pageSize: 1000 // Fetch all assets since the endpoint is paginated (default 50)
          },
          timeout: 15000
        });

    // Handle both { data: [...] } and direct [...] arrays just in case, plus parse string if backend sends bad Content-Type
    let payload = response.data;
    if (typeof payload === 'string') {
      try { payload = JSON.parse(payload); } catch { /* ignore parse errors, keep original */ }
    }
    const raw = Array.isArray(payload?.data) ? payload.data : (Array.isArray(payload) ? payload : []);

    // Filter to keep ONLY NGX assets!
    const ngxRaw = raw.filter(asset => 
      asset.exchange === 'NSENG' || 
      String(asset.symbol).startsWith('NSENG_')
    );

    // Deduplicate: API returns both bare symbols (DANGCEM) and NSENG_-prefixed
    // (NSENG_DANGCEM) for the same stock. Prefer the NSENG_ version (richer metadata).
    const seen = new Map();
    for (const asset of ngxRaw) {
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

        this.assetsCache = { data: assets, timestamp: Date.now(), ttl: this.assetsCache.ttl };
        return assets;
      } finally {
        this._inflightAssets = null;
      }
    })();

    return this._inflightAssets;
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
      changePercent: this.pickNumber(record, ['changePercent', 'change24hPct', 'priceChangePercent', 'dailyChangePercent', 'percentChange']),
      volume: this.pickNumber(record, ['volume', 'volume24h', 'totalVolume', 'latestVolume', 'tradeVolume']),
      open: this.pickNumber(record, ['open', 'openPrice', 'dayOpen']),
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

    // Request deduplication: if a fetch is already in-flight, wait for it
    if (this._inflightLivePrices) {
      return this._inflightLivePrices;
    }

    this._inflightLivePrices = (async () => {
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
          timestamp: Date.now(),
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
          timestamp: Date.now(),
          ttl: this.livePricesCache.ttl
        };

        return fallback;
      } finally {
        this._inflightLivePrices = null;
      }
    })();

    return this._inflightLivePrices;
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

  /**
   * Fetch predictions for multiple symbols using the batch endpoint.
   * Falls back to individual requests if batch fails.
   */
  async fetchPredictionPricesForSymbols(nsengSymbols = []) {
    const resultMap = new Map();
    const normalizedInput = nsengSymbols
      .map((symbol) => this.toNsengSymbol(symbol))
      .filter(Boolean);

    if (normalizedInput.length === 0) return resultMap;

    // Check cache first and collect uncached symbols
    const uncachedSymbols = [];
    for (const symbol of normalizedInput) {
      const cached = this.getCached(this.predictionCache, symbol, this.predictionCacheTTL);
      if (cached) {
        resultMap.set(symbol, cached);
      } else {
        uncachedSymbols.push(symbol);
      }
    }

    if (uncachedSymbols.length === 0) return resultMap;

    // Use lightweight bulk-prices endpoint first (much faster than full prediction batch)
    try {
      // Strip NSENG_ prefix for API call
      const bareSymbols = uncachedSymbols.map(s => s.replace(/^NSENG_/i, ''));
      const response = await axios.get(`${this.assetsApiBaseUrl}/api/Prediction/bulk-prices`, {
        params: { symbols: bareSymbols.join(',') },
        timeout: 15000
      });

      const prices = Array.isArray(response.data) ? response.data : [];
      for (const priceData of prices) {
        if (!priceData || !priceData.symbol || !priceData.isSuccess) continue;
        const nsengSymbol = this.toNsengSymbol(priceData.symbol);
        const prediction = {
          symbol: nsengSymbol,
          currentPrice: this.pickNumber(priceData, ['currentPrice', 'price']),
          high: this.pickNumber(priceData, ['high']),
          low: this.pickNumber(priceData, ['low']),
          volume: this.pickNumber(priceData, ['volume']),
          analyzedAt: priceData.timestamp || null
        };
        this.setCached(this.predictionCache, nsengSymbol, prediction);
        resultMap.set(nsengSymbol, prediction);
      }
      console.log(`✅ Bulk prices fetched ${prices.filter(p => p?.isSuccess).length} results for ${uncachedSymbols.length} symbols`);
    } catch (error) {
      console.warn('Bulk prices endpoint failed, trying prediction batch:', error?.message);
      // Fallback: try the full prediction batch endpoint
      try {
        const bareSymbols = uncachedSymbols.map(s => s.replace(/^NSENG_/i, ''));
        const response = await axios.get(`${this.assetsApiBaseUrl}/api/Prediction/batch`, {
          params: { symbols: bareSymbols.join(',') },
          timeout: 30000
        });

        const predictions = Array.isArray(response.data) ? response.data : [];
        for (const pred of predictions) {
          if (!pred || !pred.symbol) continue;
          const nsengSymbol = this.toNsengSymbol(pred.symbol);
          const prediction = {
            symbol: nsengSymbol,
            currentPrice: this.pickNumber(pred, ['currentPrice', 'price', 'lastPrice']),
            analyzedAt: pred.analyzedAt || null
          };
          this.setCached(this.predictionCache, nsengSymbol, prediction);
          resultMap.set(nsengSymbol, prediction);
        }
        console.log(`✅ Batch prediction fetched ${predictions.length} results`);
      } catch (batchError) {
        console.warn('Batch prediction also failed, using parallel individual requests:', batchError?.message);
        // Final fallback: parallel individual requests
        const fallbackResults = await Promise.allSettled(
          uncachedSymbols.map((symbol) => this.fetchPredictionBySymbol(symbol))
        );
        uncachedSymbols.forEach((symbol, idx) => {
          const result = fallbackResults[idx];
          if (result.status === 'fulfilled' && result.value) {
            resultMap.set(symbol, result.value);
          }
        });
      }
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
      type: asset?.assetType || (asset?.sector === 'ETF' ? 'ETF' : 'Stock'),
      price,
      change,
      changePercent,
      volume,
      high,
      low,
      // Real session open from the live feed (ngnmarket.com now supplies it); falls back to
      // previousClose so the card shows a sensible value instead of a bare "-".
      open: this.firstNumber([this.toNumber(livePrice?.open, null), previousClose], null),
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

  /**
   * Whole-market NGX snapshot (All-Share Index, market volume, value traded, market cap,
   * breadth, top gainers/losers) from the backend, which scrapes it live from ngnmarket.com.
   * Returns null if the endpoint is unavailable so callers can fall back gracefully.
   */
  async fetchNgxMarketSnapshot() {
    try {
      const response = await axios.get(`${this.assetsApiBaseUrl}/api/Assets/ngx-market-snapshot`, {
        timeout: 15000
      });
      return response.data?.data || null;
    } catch (error) {
      console.warn('NGX market snapshot unavailable:', error?.message);
      return null;
    }
  }

  // Fetch NGX market summary
  async fetchMarketSummary() {
    try {
      const [assets, livePrices, snapshot] = await Promise.all([
        this.fetchAssets(),
        this.fetchLivePrices(),
        this.fetchNgxMarketSnapshot()
      ]);

      const totalStocks = assets.length;
      const priceRows = Array.from(livePrices.bySymbol.values());
      const rowVolume = priceRows.reduce((sum, row) => sum + this.firstNumber([row.volume], 0), 0);

      const rowAdvancers = priceRows.filter((row) => this.toNumber(row.changePercent, 0) > 0).length;
      const rowDecliners = priceRows.filter((row) => this.toNumber(row.changePercent, 0) < 0).length;

      // Prefer the authoritative whole-market snapshot (ASI, market-wide volume/breadth) when
      // available; otherwise derive breadth/volume from the per-stock live-price rows we have.
      const index = this.toNumber(snapshot?.index, 0) || null;
      const indexChangePercent = this.toNumber(snapshot?.indexChangePercent, 0);
      const totalMarketCap = this.toNumber(snapshot?.totalMarketCap, 0);
      const totalVolume = this.toNumber(snapshot?.totalVolume, 0) || rowVolume;
      const advancers = snapshot?.advancers != null ? this.toNumber(snapshot.advancers, 0) : rowAdvancers;
      const decliners = snapshot?.decliners != null ? this.toNumber(snapshot.decliners, 0) : rowDecliners;
      const unchanged = Math.max(totalStocks - advancers - decliners, 0);

      const sources = ['Assets API'];
      if (livePrices.isDataAvailable) sources.push('Assets Live Prices');
      if (snapshot) sources.push('NGX Market Snapshot');

      return {
        index,
        indexChange: index != null ? (index * indexChangePercent) / 100 : 0,
        indexChangePercent,
        totalMarketCap,
        totalVolume,
        valueTraded: this.toNumber(snapshot?.valueTraded, 0),
        deals: this.toNumber(snapshot?.deals, 0),
        advancers,
        decliners,
        unchanged,
        topGainers: snapshot?.topGainers || [],
        topLosers: snapshot?.topLosers || [],
        timestamp: new Date().toISOString(),
        sources,
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

      // Resolve missing live prices via the prediction fallback. Requests are already
      // chunked (predictionBatchSize at a time) inside fetchPredictionPricesForSymbols,
      // so we can safely process the full set instead of skipping when >15 — skipping
      // was leaving most NGX stocks without a price. A generous cap guards against
      // pathological cases; anything beyond it still renders via verify/last-close.
      const MAX_PREDICTION_FALLBACK = 120;
      let predictionFallbackMap = new Map();
      if (symbolsMissingLivePrice.length > 0) {
        const toResolve = symbolsMissingLivePrice.slice(0, MAX_PREDICTION_FALLBACK);
        if (symbolsMissingLivePrice.length > MAX_PREDICTION_FALLBACK) {
          console.warn(`⚠️ ${symbolsMissingLivePrice.length} symbols missing live prices; resolving the first ${MAX_PREDICTION_FALLBACK} via prediction fallback.`);
        }
        predictionFallbackMap = await this.fetchPredictionPricesForSymbols(toResolve);
      }

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



  // Clear cache and reset inflight requests
  clearCache() {
    this.assetsCache.data = null;
    this.assetsCache.timestamp = 0;
    this.livePricesCache.data = null;
    this.livePricesCache.timestamp = 0;
    this.predictionCache.clear();
    this.verifyCache.clear();
    // Reset inflight requests
    this._inflightAssets = null;
    this._inflightLivePrices = null;
    this._inflightBatchPrediction = null;
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

  // ── GET /api/NGXAnalysis/dashboard/setups — weekly high-probability setups ──
  // Replaces the removed web-scraper feed. Returns the panel-ready shape
  // { totalScanned, highProbabilityCount, scanTime, setups: [...] }.
  async fetchWeeklySetups(params = {}) {
    try {
      const minProb = params.minProbability || 30;
      const maxRes = params.maxResults || 50;
      const res = await axios.get(`${this.assetsApiBaseUrl}/api/NGXAnalysis/dashboard/setups?minProbability=${minProb}&maxResults=${maxRes}`, { timeout: 30000 });
      const data = res.data || {};
      const setups = Array.isArray(data.setups) ? data.setups.map(s => {
        const currentPrice = this.toNumber(s.currentPrice, 0);
        const targetPrice = this.toNumber(s.targetPrice, 0);
        const stopLoss = this.toNumber(s.stopLoss, 0);
        return {
          ...s,
          currentPrice,
          targetPrice,
          stopLoss,
          volume: this.toNumber(s.volume, 0),
          // Recompute R:R defensively (direction-agnostic) so the displayed
          // ratio is always correct even when the API omits/garbles it.
          riskReward: this.computeRiskReward(currentPrice, targetPrice, stopLoss, s.riskReward)
        };
      }) : [];
      return {
        setups,
        totalScanned: data.totalScanned || setups.length,
        highProbabilityCount: data.highProbabilityCount || setups.length,
        scanTime: data.scanTime || new Date().toISOString()
      };
    } catch (err) {
      console.warn('NGX weekly setups unavailable:', err?.message);
      return { setups: [], totalScanned: 0, highProbabilityCount: 0, scanTime: new Date().toISOString() };
    }
  }

  // Direction-agnostic R:R. Falls back to the API-provided value only when
  // prices are unusable.
  computeRiskReward(currentPrice, targetPrice, stopLoss, apiValue = null) {
    if (currentPrice > 0 && targetPrice > 0 && stopLoss > 0) {
      const reward = Math.abs(targetPrice - currentPrice);
      const risk = Math.abs(currentPrice - stopLoss);
      if (risk > 0) return (reward / risk).toFixed(1);
    }
    const parsed = this.toNumber(apiValue, null);
    return parsed != null ? parsed.toFixed(1) : '—';
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