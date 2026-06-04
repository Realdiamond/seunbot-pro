import axios from 'axios';

class AIAnalysisEndpointService {
  constructor() {
    this.baseUrl = import.meta.env?.VITE_SEUNBOT_API_BASE_URL || '';
    this.cache = new Map();
    this.cacheTtlMs = 2 * 60 * 1000;
  }

  normalizeSymbol(symbol = '') {
    return String(symbol).replace(/^NSENG_/i, '').trim().toUpperCase();
  }

  toNsengSymbol(symbol = '') {
    const normalized = this.normalizeSymbol(symbol);
    return normalized ? `NSENG_${normalized}` : '';
  }

  toNumber(value, fallback = null) {
    if (value === null || value === undefined) return fallback;
    if (typeof value === 'string' && value.trim() === '') return fallback;
    const num = Number(value);
    return Number.isFinite(num) ? num : fallback;
  }

  firstNumber(candidates = [], fallback = 0) {
    for (const c of candidates) {
      const v = this.toNumber(c, null);
      if (v !== null) return v;
    }
    return fallback;
  }

  uniqueStrings(values = []) {
    return Array.from(new Set(
      values.filter(v => typeof v === 'string').map(v => v.trim()).filter(Boolean)
    ));
  }

  getCached(key) {
    const cached = this.cache.get(key);
    if (!cached) return null;
    if ((Date.now() - cached.timestamp) > this.cacheTtlMs) { this.cache.delete(key); return null; }
    return cached.data;
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

  mapSentiment(label, score) {
    const t = String(label || '').toUpperCase();
    if (t.includes('BULL') || t.includes('POSITIVE')) return 'Bullish';
    if (t.includes('BEAR') || t.includes('NEGATIVE')) return 'Bearish';
    const n = this.toNumber(score, null);
    if (n === null) return 'Neutral';
    return n > 0.2 ? 'Bullish' : n < -0.2 ? 'Bearish' : 'Neutral';
  }

  deriveRiskLevel(hybrid, grok) {
    if (grok?.errorMessage) return 'High';
    const risks = Array.isArray(grok?.risks) ? grok.risks.length : 0;
    if (risks >= 4) return 'High';
    if (risks >= 2) return 'Medium';
    const score = this.toNumber(hybrid?.finalScore, null);
    if (score !== null && score >= 4.5) return 'High';
    if (score !== null && score >= 3.0) return 'Medium';
    return 'Low';
  }

  deriveKeyLevels(stock, price, hybrid) {
    const tp = hybrid?.tradePlan;
    if (tp?.entryPrice && tp?.stopLoss && tp?.takeProfit1) {
      return {
        strongResistance: this.toNumber(tp.takeProfit1, price * 1.05),
        weakResistance: price * 1.02,
        weakSupport: Math.max(0, price * 0.98),
        strongSupport: this.toNumber(tp.stopLoss, price * 0.95)
      };
    }
    const high = this.firstNumber([stock?.high], price * 1.02);
    const low = this.firstNumber([stock?.low], price * 0.98);
    const spread = Math.max(high - low, price * 0.02);
    return {
      strongResistance: high,
      weakResistance: price + spread * 0.25,
      weakSupport: Math.max(0, price - spread * 0.25),
      strongSupport: low
    };
  }

  buildReasoning(pred, grok, hybrid) {
    const parts = [];
    if (hybrid?.signalStrength) parts.push(`Hybrid signal: ${hybrid.signalStrength.toUpperCase()}.`);
    if (hybrid?.direction) parts.push(`Direction: ${hybrid.direction.toUpperCase()}.`);
    const score = this.toNumber(hybrid?.finalScore, null);
    if (score !== null) parts.push(`Score: ${score.toFixed(2)}/5.`);
    if (grok?.sentimentLabel) parts.push(`Grok: ${String(grok.sentimentLabel).toUpperCase()}.`);
    if (pred?.recommendation) parts.push(`Prediction: ${String(pred.recommendation).toUpperCase()}.`);
    if (grok?.errorMessage) parts.push('Grok timed out — based on Hybrid Strategy only.');
    return parts.join(' ').trim();
  }

  buildTradingStrategy(hybrid, entry, target, stop) {
    const tp = hybrid?.tradePlan;
    if (tp?.entryPrice && tp?.takeProfit1 && tp?.stopLoss) {
      const pos = tp.positionSize ? ` Size: ${tp.positionSize} units.` : '';
      return `Entry ₦${this.toNumber(tp.entryPrice, entry).toFixed(2)}, Target ₦${this.toNumber(tp.takeProfit1, target).toFixed(2)}, Stop ₦${this.toNumber(tp.stopLoss, stop).toFixed(2)}.${pos}`;
    }
    const rec = this.mapRecommendation(hybrid?.signalStrength);
    if (rec !== 'Hold') return `${rec}: Entry ₦${entry.toFixed(2)}, Target ₦${target.toFixed(2)}, Stop ₦${stop.toFixed(2)}.`;
    return 'Await clearer confirmation before entering.';
  }

  buildInsights(hybrid, pred, grok) {
    const items = [];
    if (hybrid?.signalStrength) items.push(`Hybrid signal: ${hybrid.signalStrength}`);
    if (hybrid?.direction) items.push(`Direction: ${hybrid.direction}`);
    if (hybrid?.components?.institutional?.signal) items.push(`Institutional: ${hybrid.components.institutional.signal}`);
    if (hybrid?.components?.momentum?.signal) items.push(`Momentum: ${hybrid.components.momentum.signal}`);
    if (hybrid?.components?.meanReversion?.signal) items.push(`Mean Reversion: ${hybrid.components.meanReversion.signal}`);
    if (pred?.recommendation) items.push(`Prediction: ${pred.recommendation}`);
    if (grok?.sentimentLabel) items.push(`Grok sentiment: ${grok.sentimentLabel}`);
    if (Array.isArray(pred?.keyFactors)) items.push(...pred.keyFactors.slice(0, 3));
    return this.uniqueStrings(items).slice(0, 10);
  }

  mapNewsItems(news = []) {
    if (!Array.isArray(news)) return [];
    return news.map(item => {
      if (typeof item === 'string') return item;
      return `${item?.title || 'Update'}${item?.source ? ` (${item.source})` : ''}`;
    });
  }

  // ── GET /api/HybridStrategy/analyze/{NSENG_symbol} ─────────────────────────
  async fetchHybridAnalysis(nsengSymbol) {
    try {
      const res = await axios.get(`${this.baseUrl}/api/HybridStrategy/analyze/${encodeURIComponent(nsengSymbol)}`, { timeout: 45000 });
      return res.data;
    } catch (err) {
      console.warn(`HybridStrategy unavailable for ${nsengSymbol}:`, err?.message);
      return null;
    }
  }

  // ── GET /api/GrokSentiment/stock/{symbol} — with 503 retry ─────────────────
  async fetchGrokSentiment(bareSymbol, retries = 1) {
    try {
      const res = await axios.get(`${this.baseUrl}/api/GrokSentiment/stock/${encodeURIComponent(bareSymbol)}`, { timeout: 35000 });
      return res.data;
    } catch (err) {
      if (err?.response?.status === 503 && retries > 0) {
        console.warn(`GrokSentiment 503 for ${bareSymbol} — retrying...`);
        await new Promise(r => setTimeout(r, 3000));
        return this.fetchGrokSentiment(bareSymbol, retries - 1);
      }
      console.warn(`GrokSentiment unavailable for ${bareSymbol}:`, err?.message);
      return null;
    }
  }

  // ── GET /api/Prediction/{symbol} ────────────────────────────────────────────
  async fetchPrediction(bareSymbol) {
    try {
      const res = await axios.get(`${this.baseUrl}/api/Prediction/${encodeURIComponent(bareSymbol)}`, { timeout: 20000 });
      return res.data;
    } catch (err) {
      console.warn(`Prediction unavailable for ${bareSymbol}:`, err?.message);
      return null;
    }
  }

  // ── POST /api/Analysis/comprehensive-report/{symbol} ────────────────────────
  // Returns a text report with Patterns, Cycle, Gann sections
  async fetchComprehensiveReport(nsengSymbol, assetName) {
    const cacheKey = `comprehensive_${nsengSymbol}`;
    const cached = this.getCached(cacheKey);
    if (cached) return cached;
    try {
      const res = await axios.post(
        `${this.baseUrl}/api/Analysis/comprehensive-report/${encodeURIComponent(nsengSymbol)}?assetName=${encodeURIComponent(assetName || nsengSymbol)}&exchange=NGX`,
        {},
        { timeout: 60000, headers: { 'Content-Type': 'application/json' } }
      );
      const data = res.data;
      if (!data || !data.report) return null;
      const parsed = {
        raw: data.report,
        patterns: this.parseReportSection(data.report, 'Geometric Patterns', ['Predictive Cycle']),
        cycle: this.parseReportSection(data.report, 'Predictive Cycle Analysis', ['Summary', '┌']),
        gann: this.parseReportSection(data.report, 'Jenkins/Gann Cycle', ['Summary', '┌', 'Gann:']),
      };
      this.setCached(cacheKey, parsed);
      return parsed;
    } catch (err) {
      console.warn(`ComprehensiveReport unavailable for ${nsengSymbol}:`, err?.message);
      return null;
    }
  }

  // Extract a named section from the report text
  parseReportSection(report, startMarker, endMarkers = []) {
    if (!report) return null;
    const startIdx = report.indexOf(startMarker);
    if (startIdx === -1) return null;
    let endIdx = report.length;
    for (const marker of endMarkers) {
      const idx = report.indexOf(marker, startIdx + startMarker.length);
      if (idx !== -1 && idx < endIdx) endIdx = idx;
    }
    const raw = report.slice(startIdx, endIdx).trim();
    // Convert tab-bullet lines into array of bullet strings
    const bullets = raw
      .split('\n')
      .map(l => l.replace(/^\t•\t/, '').replace(/^\t\t-\s*/, '  · ').trim())
      .filter(Boolean);
    return { heading: bullets[0] || startMarker, bullets: bullets.slice(1) };
  }

  // ── Main: fires all 3 in parallel ──────────────────────────────────────────

  async analyzeStock(stock) {
    const normalized = this.normalizeSymbol(stock?.rawSymbol || stock?.symbol || '');
    if (!normalized) throw new Error('Stock symbol is required for AI analysis.');

    const nseng = this.toNsengSymbol(normalized);
    const cached = this.getCached(nseng);
    if (cached) return cached;

    const [hybrid, grok, pred] = await Promise.all([
      this.fetchHybridAnalysis(nseng),       // requires NSENG_ prefix
      this.fetchGrokSentiment(normalized),    // bare symbol
      this.fetchPrediction(normalized)         // bare symbol
    ]);

    if (!hybrid && !pred && !grok) throw new Error('All AI analysis endpoints are currently unavailable.');

    const price = this.firstNumber([pred?.currentPrice, hybrid?.tradePlan?.entryPrice, stock?.price], 1);
    const recommendation = this.mapRecommendation(hybrid?.signalStrength || pred?.recommendation);
    const sentiment = this.mapSentiment(grok?.sentimentLabel, pred?.sentimentScore);

    const rawScore = this.toNumber(hybrid?.finalScore, null);
    const rawConf = this.toNumber(pred?.confidence, null);
    let confidence = 3;
    if (rawScore !== null) confidence = Math.min(5, Math.max(1, Math.round(rawScore)));
    else if (rawConf !== null) confidence = rawConf <= 1 ? Math.round(rawConf * 5) : Math.min(5, Math.max(1, Math.round(rawConf)));

    const entry = this.firstNumber([hybrid?.tradePlan?.entryPrice, pred?.suggestedEntry, price], price);
    const target = this.firstNumber([hybrid?.tradePlan?.takeProfit1, pred?.takeProfit, price * 1.05], price * 1.05);
    const stop = this.firstNumber([hybrid?.tradePlan?.stopLoss, pred?.stopLoss, price * 0.95], price * 0.95);

    const riskFactors = this.uniqueStrings([
      ...(Array.isArray(grok?.risks) ? grok.risks : []),
      ...(Array.isArray(pred?.risks) ? pred.risks : []),
      grok?.errorMessage ? `Grok API issue: ${grok.errorMessage}` : ''
    ]);

    const catalysts = this.uniqueStrings([
      ...(Array.isArray(grok?.opportunities) ? grok.opportunities : []),
      ...(Array.isArray(pred?.keyFactors) ? pred.keyFactors : [])
    ]);

    const result = {
      symbol: normalized,
      name: stock?.name || normalized,
      currentPrice: price,
      priceSource: pred?.currentPrice ? 'Prediction API' : hybrid?.tradePlan?.entryPrice ? 'Hybrid API' : 'Market Data',
      webDataUsed: Boolean(grok),
      recommendation,
      confidence,
      insights: this.buildInsights(hybrid, pred, grok),
      // Structured hybrid components for clean UI rendering
      hybridComponents: hybrid?.components || null,
      hybridDirection: hybrid?.direction || null,
      hybridSignalStrength: hybrid?.signalStrength || null,
      hybridFinalScore: this.toNumber(hybrid?.finalScore, null),
      hybridFactorScores: hybrid?.factorScores || null,
      // Legacy string field kept for backward compat
      technicalAnalysis: null,
      fundamentalAnalysis: pred?.breakdown?.fundamentalSummary || null,
      riskLevel: this.deriveRiskLevel(hybrid, grok),
      riskFactors: riskFactors.length > 0 ? riskFactors : ['No explicit risk factors returned.'],
      priceTarget: target,
      stopLoss: stop,
      entryPoint: entry,
      sentiment,
      reasoning: this.buildReasoning(pred, grok, hybrid),
      keyLevels: this.deriveKeyLevels(stock, price, hybrid),
      tradingStrategy: this.buildTradingStrategy(hybrid, entry, target, stop),
      timeHorizon: 'Short-term',
      catalysts: catalysts.length > 0 ? catalysts.slice(0, 8) : ['No explicit catalysts returned.'],
      concerns: riskFactors.length > 0 ? riskFactors.slice(0, 8) : ['No explicit concerns returned.'],
      recentNews: this.mapNewsItems(grok?.recentNews).slice(0, 10),
      analystRatings: 'No analyst ratings available',
      timestamp: grok?.analyzedAt || pred?.analyzedAt || new Date().toISOString(),
      isAI: true,
      dataQuality: 'Real-time',
      sources: this.uniqueStrings([
        hybrid ? 'HybridStrategy API' : '',
        grok ? 'GrokSentiment API' : '',
        pred ? 'Prediction API' : ''
      ])
    };

    this.setCached(nseng, result);
    return result;
  }

  clearCache() { this.cache.clear(); }
}

export default new AIAnalysisEndpointService();