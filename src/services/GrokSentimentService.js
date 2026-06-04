// Grok Sentiment Service
// Wraps the /api/GrokSentiment endpoints from the SeunBot backend.
//
// ⚠️  CAUTION: These endpoints perform live Grok AI web searches.
//     They can take 20-30 seconds and may return HTTP 503 on timeout.
//     This service includes automatic retry logic for 503 errors.

import axios from 'axios';

class GrokSentimentService {
  constructor() {
    this.baseUrl = import.meta.env?.VITE_SEUNBOT_API_BASE_URL || '';
    this.cache = new Map();
    this.cacheTtlMs = 5 * 60 * 1000; // 5 min — Grok results are expensive
    this.timeout = 35000;
    this.retryDelay = 3000;
    this._sectorsCache = null;
    this._sectorsCachedAt = 0;
  }

  normalizeSymbol(symbol = '') {
    return String(symbol).replace(/^NSENG_/i, '').trim().toUpperCase();
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

  async _getWithRetry(url, retries = 1) {
    try {
      const res = await axios.get(url, { timeout: this.timeout });
      return res.data;
    } catch (err) {
      if (err?.response?.status === 503 && retries > 0) {
        console.warn(`GrokSentiment 503 — retrying in ${this.retryDelay}ms...`);
        await new Promise(r => setTimeout(r, this.retryDelay));
        return this._getWithRetry(url, retries - 1);
      }
      throw err;
    }
  }

  /**
   * GET /api/GrokSentiment/stock/{symbol}
   * Scrapes internet + Twitter via Grok AI for real-time sentiment on a stock.
   * Returns: { sentimentLabel, sentimentScore, risks[], opportunities[], recentNews[], analyzedAt }
   */
  async getStockSentiment(symbol) {
    const bare = this.normalizeSymbol(symbol);
    if (!bare) throw new Error('Symbol is required for Grok sentiment.');

    const cached = this.getCached(`stock:${bare}`);
    if (cached) return cached;

    try {
      const data = await this._getWithRetry(
        `${this.baseUrl}/api/GrokSentiment/stock/${encodeURIComponent(bare)}`
      );
      this.setCached(`stock:${bare}`, data);
      return data;
    } catch (err) {
      console.warn(`GrokSentiment unavailable for ${bare}:`, err?.message);
      return null;
    }
  }

  /**
   * GET /api/GrokSentiment/sectors
   * Returns list of available sector names for sentiment analysis.
   */
  async getSectors() {
    if (this._sectorsCache && Date.now() - this._sectorsCachedAt < 10 * 60 * 1000) {
      return this._sectorsCache;
    }
    try {
      const data = await this._getWithRetry(`${this.baseUrl}/api/GrokSentiment/sectors`);
      this._sectorsCache = data;
      this._sectorsCachedAt = Date.now();
      return data;
    } catch (err) {
      console.warn('GrokSentiment sectors unavailable:', err?.message);
      return [];
    }
  }

  /**
   * GET /api/GrokSentiment/sector/{sector}
   * Returns Grok AI sentiment for an entire NGX sector (e.g. "Banking").
   */
  async getSectorSentiment(sector) {
    if (!sector) throw new Error('Sector name is required.');

    const cacheKey = `sector:${sector}`;
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    try {
      const data = await this._getWithRetry(
        `${this.baseUrl}/api/GrokSentiment/sector/${encodeURIComponent(sector)}`
      );
      this.setCached(cacheKey, data);
      return data;
    } catch (err) {
      console.warn(`GrokSentiment sector unavailable for ${sector}:`, err?.message);
      return null;
    }
  }

  clearCache() {
    this.cache.clear();
    this._sectorsCache = null;
  }
}

export default new GrokSentimentService();
