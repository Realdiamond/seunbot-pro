// UDF (Universal Data Feed) Service
// Wraps the /udf endpoints from the SeunBot backend.
// These implement the TradingView UDF spec for NGX historical OHLCV chart data.
// Supported resolutions: D (Daily), W (Weekly), M (Monthly)

import axios from 'axios';

class UDFService {
  constructor() {
    this.baseUrl = import.meta.env?.VITE_SEUNBOT_API_BASE_URL || 'https://seun-trading-bot-api-2026-28f6d6f40e1b.herokuapp.com';
    this.cache = new Map();
    this.cacheTtlMs = 60 * 1000; // 1 minute for chart data
  }

  getCached(key) {
    const c = this.cache.get(key);
    if (!c) return null;
    if (Date.now() - c.timestamp > this.cacheTtlMs) { this.cache.delete(key); return null; }
    return c.data;
  }

  setCached(key, data) {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  /**
   * GET /udf/config
   * Returns the TradingView datafeed configuration object.
   */
  async getConfig() {
    const cached = this.getCached('config');
    if (cached) return cached;
    const res = await axios.get(`${this.baseUrl}/udf/config`, { timeout: 10000 });
    this.setCached('config', res.data);
    return res.data;
  }

  /**
   * GET /udf/symbols?symbol={symbol}
   * Returns symbol metadata (name, description, pricescale, etc).
   */
  async getSymbolInfo(symbol) {
    const bare = String(symbol).replace(/^NSENG_/i, '').trim().toUpperCase();
    const cached = this.getCached(`symbol:${bare}`);
    if (cached) return cached;
    const res = await axios.get(`${this.baseUrl}/udf/symbols`, {
      params: { symbol: bare },
      timeout: 10000
    });
    this.setCached(`symbol:${bare}`, res.data);
    return res.data;
  }

  /**
   * GET /udf/search?query={query}&type=stock&exchange=NGX&limit={limit}
   * Searches NGX symbols by name or ticker.
   */
  async search(query, limit = 30) {
    if (!query) return [];
    const res = await axios.get(`${this.baseUrl}/udf/search`, {
      params: { query, type: 'stock', exchange: 'NGX', limit },
      timeout: 10000
    });
    return Array.isArray(res.data) ? res.data : [];
  }

  /**
   * GET /udf/history?symbol={symbol}&resolution={D|W|M}&from={unix}&to={unix}
   * Returns OHLCV arrays: { t[], o[], h[], l[], c[], v[], s }
   * where s = 'ok' | 'no_data'
   */
  async getHistory(symbol, resolution = 'D', from = null, to = null) {
    const bare = String(symbol).replace(/^NSENG_/i, '').trim().toUpperCase();
    const now = Math.floor(Date.now() / 1000);
    const fromTs = from ?? (now - 365 * 24 * 60 * 60); // default: 1 year back
    const toTs = to ?? now;

    const cacheKey = `history:${bare}:${resolution}:${fromTs}:${toTs}`;
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    const res = await axios.get(`${this.baseUrl}/udf/history`, {
      params: { symbol: bare, resolution, from: fromTs, to: toTs },
      timeout: 20000
    });

    if (res.data?.s === 'no_data') return null;

    this.setCached(cacheKey, res.data);
    return res.data;
  }

  /**
   * Convenience: convert UDF history response to OHLCV array of objects
   * Returns: [{ date, open, high, low, close, volume }]
   */
  async getOHLCV(symbol, resolution = 'D', from = null, to = null) {
    try {
      const udf = await this.getHistory(symbol, resolution, from, to);
      if (!udf || udf.s === 'no_data' || !Array.isArray(udf.t)) return [];

      return udf.t.map((ts, i) => ({
        date: new Date(ts * 1000).toISOString().split('T')[0],
        timestamp: ts * 1000,
        open: udf.o[i],
        high: udf.h[i],
        low: udf.l[i],
        close: udf.c[i],
        volume: udf.v[i]
      }));
    } catch (err) {
      console.warn(`UDF getOHLCV failed for ${symbol}:`, err?.message);
      return [];
    }
  }

  clearCache() { this.cache.clear(); }
}

export default new UDFService();
