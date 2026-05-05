import axios from 'axios';

class AIMarketInsightsService {
  constructor() {
    this.baseUrl = import.meta.env?.VITE_SEUNBOT_API_BASE_URL || 'https://seun-trading-bot-api-2026-28f6d6f40e1b.herokuapp.com';
    this.cache = new Map();
    this.cacheTtlMs = 2 * 60 * 1000;
    this.batchChunkSize = 5; // concurrent prediction calls
  }

  normalizeSymbol(symbol = '') {
    return String(symbol).replace(/^NSENG_/i, '').trim().toUpperCase();
  }

  toNsengSymbol(symbol = '') {
    const n = this.normalizeSymbol(symbol);
    return n ? `NSENG_${n}` : '';
  }

  toNumber(value, fallback = null) {
    if (value === null || value === undefined) return fallback;
    if (typeof value === 'string' && value.trim() === '') return fallback;
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }

  uniqueStrings(values = []) {
    return Array.from(new Set(
      values.filter(v => typeof v === 'string').map(v => v.trim()).filter(Boolean)
    ));
  }

  getCached(key) {
    const c = this.cache.get(key);
    if (!c) return null;
    if ((Date.now() - c.timestamp) > this.cacheTtlMs) { this.cache.delete(key); return null; }
    return c.data;
  }

  setCached(key, data) {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  mapRecommendation(value) {
    const t = String(value || '').toUpperCase();
    if (t.includes('BUY')) return 'Buy';
    if (t.includes('SELL')) return 'Sell';
    return 'Hold';
  }

  mapSentiment(score) {
    const n = this.toNumber(score, 0);
    if (n > 0.2) return 'Bullish';
    if (n < -0.2) return 'Bearish';
    return 'Neutral';
  }

  mapConfidenceToStars(raw) {
    const n = this.toNumber(raw, null);
    if (n === null) return 3;
    const normalized = n <= 1 ? n * 5 : n;
    return Math.min(5, Math.max(1, Math.round(normalized)));
  }

  deriveRiskLevel(pred = {}) {
    const risks = Array.isArray(pred.risks) ? pred.risks.length : 0;
    if (pred.errorMessage) return 'High';
    if (risks >= 5) return 'High';
    if (risks >= 2) return 'Medium';
    return 'Low';
  }

  buildReasoning(pred = {}) {
    const factors = Array.isArray(pred.keyFactors) ? pred.keyFactors : [];
    const first = factors.find(f => typeof f === 'string' && f.trim());
    if (first) return first.trim();
    const summary = pred?.breakdown?.sentimentSummary;
    if (typeof summary === 'string' && summary.trim()) return summary.trim();
    return `Prediction API currently classifies this as ${this.mapRecommendation(pred.recommendation)}.`;
  }

  // ── GET /api/Prediction/watchlist — returns string[] of bare symbols ─────────
  async fetchWatchlist() {
    try {
      const res = await axios.get(`${this.baseUrl}/api/Prediction/watchlist`, { timeout: 15000 });
      return Array.isArray(res.data) ? res.data : [];
    } catch (err) {
      console.warn('Watchlist unavailable:', err?.message);
      return [];
    }
  }

  // ── GET /api/Prediction/{symbol} — individual call ───────────────────────────
  async fetchOnePrediction(bareSymbol) {
    try {
      const res = await axios.get(`${this.baseUrl}/api/Prediction/${encodeURIComponent(bareSymbol)}`, { timeout: 20000 });
      return res.data;
    } catch (err) {
      console.warn(`Prediction unavailable for ${bareSymbol}:`, err?.message);
      return null;
    }
  }

  // ── Batch individual predictions with concurrency limit ─────────────────────
  async fetchPredictionBatch(bareSymbols = []) {
    const unique = Array.from(new Set(bareSymbols.map(s => this.normalizeSymbol(s)).filter(Boolean)));
    if (unique.length === 0) return [];

    const results = [];
    for (let i = 0; i < unique.length; i += this.batchChunkSize) {
      const chunk = unique.slice(i, i + this.batchChunkSize);
      const settled = await Promise.allSettled(chunk.map(s => this.fetchOnePrediction(s)));
      settled.forEach(outcome => {
        if (outcome.status === 'fulfilled' && outcome.value) results.push(outcome.value);
      });
    }
    return results;
  }

  createAnalysisItem(prediction = {}, stockBySymbol = new Map()) {
    const sym = this.normalizeSymbol(prediction.symbol);
    const stock = stockBySymbol.get(sym);
    return {
      symbol: sym || this.normalizeSymbol(stock?.symbol || ''),
      name: stock?.name || prediction.companyName || sym || 'Unknown Asset',
      recommendation: this.mapRecommendation(prediction.recommendation),
      confidence: this.mapConfidenceToStars(prediction.confidence),
      sentiment: this.mapSentiment(prediction.sentimentScore),
      riskLevel: this.deriveRiskLevel(prediction),
      reasoning: this.buildReasoning(prediction),
      finalScore: this.toNumber(prediction.finalScore, 0),
      analyzedAt: prediction.analyzedAt || null
    };
  }

  // Chat endpoint is no longer in the backend API — returns null gracefully
  async fetchChatBrief() {
    return null;
  }

  async getMarketSummary(stocks = []) {
    const stockList = Array.isArray(stocks) ? stocks : [];
    const bareSymbols = Array.from(new Set(
      stockList
        .map(s => this.normalizeSymbol(s?.rawSymbol || s?.symbol))
        .filter(Boolean)
    ));

    if (bareSymbols.length === 0) {
      return {
        totalStocks: 0, buyRecommendations: 0, holdRecommendations: 0,
        sellRecommendations: 0, bullishStocks: 0, bearishStocks: 0,
        highRiskStocks: 0, topBuys: [], topSells: [], analyses: [],
        chatBrief: null, timestamp: new Date().toISOString(), sources: []
      };
    }

    const cacheKey = `market-summary:${bareSymbols.join('|')}`;
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    const stockBySymbol = new Map();
    stockList.forEach(s => {
      const sym = this.normalizeSymbol(s?.rawSymbol || s?.symbol);
      if (sym && !stockBySymbol.has(sym)) stockBySymbol.set(sym, s);
    });

    const predictionRows = await this.fetchPredictionBatch(bareSymbols);
    if (predictionRows.length === 0) throw new Error('Prediction endpoints unavailable.');

    const analyses = predictionRows
      .map(p => this.createAnalysisItem(p, stockBySymbol))
      .filter(item => Boolean(item.symbol));

    const buyRecommendations = analyses.filter(i => i.recommendation === 'Buy').length;
    const holdRecommendations = analyses.filter(i => i.recommendation === 'Hold').length;
    const sellRecommendations = analyses.filter(i => i.recommendation === 'Sell').length;
    const bullishStocks = analyses.filter(i => i.sentiment === 'Bullish').length;
    const bearishStocks = analyses.filter(i => i.sentiment === 'Bearish').length;
    const highRiskStocks = analyses.filter(i => i.riskLevel === 'High').length;

    const topBuys = analyses
      .filter(i => i.recommendation === 'Buy')
      .sort((a, b) => b.finalScore - a.finalScore || b.confidence - a.confidence)
      .slice(0, 5);

    const topSells = analyses
      .filter(i => i.recommendation === 'Sell')
      .sort((a, b) => a.finalScore - b.finalScore || b.confidence - a.confidence)
      .slice(0, 5);

    const result = {
      totalStocks: analyses.length,
      buyRecommendations, holdRecommendations, sellRecommendations,
      bullishStocks, bearishStocks, highRiskStocks,
      topBuys, topSells, analyses,
      chatBrief: null,
      timestamp: analyses.map(i => i.analyzedAt).filter(Boolean).sort().reverse()[0] || new Date().toISOString(),
      sources: this.uniqueStrings(['Prediction API (individual calls)'])
    };

    this.setCached(cacheKey, result);
    return result;
  }

  clearCache() { this.cache.clear(); }
}

export default new AIMarketInsightsService();