// Hybrid Strategy Service
// Wraps the /api/HybridStrategy endpoints from the SeunBot backend.
//
// ⚠️  IMPORTANT: HybridStrategy endpoints REQUIRE the NSENG_ prefix.
//     Pass bare symbols (e.g. "DANGCEM") — this service adds the prefix automatically.

import axios from 'axios';

class HybridStrategyService {
  constructor() {
    this.baseUrl = import.meta.env?.VITE_SEUNBOT_API_BASE_URL || 'https://seun-trading-bot-api-2026-28f6d6f40e1b.herokuapp.com';
    this.cache = new Map();
    this.cacheTtlMs = 2 * 60 * 1000;
    this._assetsCache = null;
    this._assetsCachedAt = 0;
  }

  toNseng(symbol = '') {
    const bare = String(symbol).replace(/^NSENG_/i, '').trim().toUpperCase();
    return bare ? `NSENG_${bare}` : '';
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
   * GET /api/HybridStrategy/analyze/{NSENG_symbol}
   * Returns Elliott Wave + SMC + Bollinger + RSI multi-factor analysis.
   * Response shape:
   *   { finalScore, direction, signalStrength, tradePlan: { entryPrice, stopLoss, takeProfit1, positionSize }, components: { institutional, meanReversion, momentum } }
   */
  async analyze(symbol) {
    const nseng = this.toNseng(symbol);
    if (!nseng) throw new Error('Symbol is required for HybridStrategy analysis.');

    const cached = this.getCached(`analyze:${nseng}`);
    if (cached) return cached;

    const res = await axios.get(
      `${this.baseUrl}/api/HybridStrategy/analyze/${encodeURIComponent(nseng)}`,
      { timeout: 45000 }
    );

    this.setCached(`analyze:${nseng}`, res.data);
    return res.data;
  }

  /**
   * GET /api/HybridStrategy/compare/{symbol}
   * Compares Hybrid Strategy vs classical Institutional (Elliott Wave) side-by-side.
   */
  async compare(symbol) {
    const nseng = this.toNseng(symbol);
    if (!nseng) throw new Error('Symbol is required for strategy comparison.');

    const cached = this.getCached(`compare:${nseng}`);
    if (cached) return cached;

    const res = await axios.get(
      `${this.baseUrl}/api/HybridStrategy/compare/${encodeURIComponent(nseng)}`,
      { timeout: 30000 }
    );

    this.setCached(`compare:${nseng}`, res.data);
    return res.data;
  }

  /**
   * GET /api/HybridStrategy/assets
   * Returns list of symbols supported by the hybrid engine.
   */
  async getAssets() {
    if (this._assetsCache && Date.now() - this._assetsCachedAt < 10 * 60 * 1000) {
      return this._assetsCache;
    }

    const res = await axios.get(`${this.baseUrl}/api/HybridStrategy/assets`, { timeout: 15000 });
    this._assetsCache = res.data;
    this._assetsCachedAt = Date.now();
    return res.data;
  }

  clearCache() {
    this.cache.clear();
    this._assetsCache = null;
  }
}

export default new HybridStrategyService();
