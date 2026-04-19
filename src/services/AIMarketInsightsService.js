import axios from 'axios';

class AIMarketInsightsService {
  constructor() {
    this.baseUrl = import.meta.env?.VITE_SEUNBOT_API_BASE_URL || 'https://seun-bot-4fb16422b74d.herokuapp.com';
    this.cache = new Map();
    this.cacheTtlMs = 2 * 60 * 1000;
    this.batchChunkSize = 25;
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

    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? numericValue : fallback;
  }

  uniqueStrings(values = []) {
    const cleaned = values
      .filter((value) => typeof value === 'string')
      .map((value) => value.trim())
      .filter(Boolean);

    return Array.from(new Set(cleaned));
  }

  getCached(key) {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if ((Date.now() - cached.timestamp) > this.cacheTtlMs) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  setCached(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  mapRecommendation(value) {
    const text = String(value || '').toUpperCase();
    if (text.includes('BUY')) return 'Buy';
    if (text.includes('SELL')) return 'Sell';
    return 'Hold';
  }

  mapSentiment(score) {
    const numericScore = this.toNumber(score, 0);
    if (numericScore > 0.2) return 'Bullish';
    if (numericScore < -0.2) return 'Bearish';
    return 'Neutral';
  }

  mapConfidenceToStars(rawConfidence) {
    const numericConfidence = this.toNumber(rawConfidence, null);
    if (numericConfidence === null) return 3;

    const normalized = numericConfidence <= 1 ? (numericConfidence * 5) : numericConfidence;
    return Math.min(5, Math.max(1, Math.round(normalized)));
  }

  deriveRiskLevel(prediction = {}) {
    const riskCount = Array.isArray(prediction.risks) ? prediction.risks.length : 0;

    if (prediction.errorMessage) return 'High';
    if (riskCount >= 5) return 'High';
    if (riskCount >= 2) return 'Medium';
    return 'Low';
  }

  buildReasoning(prediction = {}) {
    const keyFactors = Array.isArray(prediction.keyFactors) ? prediction.keyFactors : [];
    const firstFactor = keyFactors.find((item) => typeof item === 'string' && item.trim());
    if (firstFactor) {
      return firstFactor.trim();
    }

    const sentimentSummary = prediction?.breakdown?.sentimentSummary;
    if (typeof sentimentSummary === 'string' && sentimentSummary.trim()) {
      return sentimentSummary.trim();
    }

    const recommendation = this.mapRecommendation(prediction.recommendation);
    return `Prediction API currently classifies this symbol as ${recommendation}.`;
  }

  async fetchPredictionBatchChunk(nsengSymbols = []) {
    if (!Array.isArray(nsengSymbols) || nsengSymbols.length === 0) return [];

    const response = await axios.get(`${this.baseUrl}/api/Prediction/batch`, {
      params: {
        symbols: nsengSymbols.join(',')
      },
      timeout: 45000
    });

    return Array.isArray(response.data) ? response.data : [];
  }

  async fetchPredictionBatch(nsengSymbols = []) {
    const uniqueSymbols = Array.from(
      new Set(
        nsengSymbols
          .map((symbol) => this.toNsengSymbol(symbol))
          .filter(Boolean)
      )
    );

    if (uniqueSymbols.length === 0) return [];

    const allPredictions = [];

    for (let index = 0; index < uniqueSymbols.length; index += this.batchChunkSize) {
      const chunk = uniqueSymbols.slice(index, index + this.batchChunkSize);

      try {
        const chunkPredictions = await this.fetchPredictionBatchChunk(chunk);
        allPredictions.push(...chunkPredictions);
      } catch (error) {
        console.warn('Prediction batch chunk failed:', error?.message || error);
      }
    }

    return allPredictions;
  }

  createAnalysisItem(prediction = {}, stockBySymbol = new Map()) {
    const normalizedSymbol = this.normalizeSymbol(prediction.symbol);
    const mappedStock = stockBySymbol.get(normalizedSymbol);

    return {
      symbol: normalizedSymbol || this.normalizeSymbol(mappedStock?.symbol || ''),
      name: mappedStock?.name || prediction.companyName || normalizedSymbol || 'Unknown Asset',
      recommendation: this.mapRecommendation(prediction.recommendation),
      confidence: this.mapConfidenceToStars(prediction.confidence),
      sentiment: this.mapSentiment(prediction.sentimentScore),
      riskLevel: this.deriveRiskLevel(prediction),
      reasoning: this.buildReasoning(prediction),
      finalScore: this.toNumber(prediction.finalScore, 0),
      analyzedAt: prediction.analyzedAt || null
    };
  }

  async fetchChatBrief({ totalStocks, bullishStocks, bearishStocks, topBuys, topSells }) {
    const buyList = (topBuys || []).slice(0, 3).map((item) => item.symbol).join(', ') || 'none';
    const sellList = (topSells || []).slice(0, 3).map((item) => item.symbol).join(', ') || 'none';

    const message = `Summarize NGX market outlook in exactly 2 concise sentences. Data snapshot: analyzed ${totalStocks} stocks, bullish ${bullishStocks}, bearish ${bearishStocks}, top buys ${buyList}, top sells ${sellList}. Keep it practical for a trader.`;

    try {
      const response = await axios.post(`${this.baseUrl}/api/Chat`, {
        message,
        includeMarketData: true,
        includeAnalysis: true,
        includeSentiment: true,
        maxSources: 4
      }, {
        timeout: 25000
      });

      const chatMessage = typeof response.data?.message === 'string'
        ? response.data.message.replace(/\s+/g, ' ').trim()
        : '';

      return chatMessage || null;
    } catch (error) {
      console.warn('Chat market brief unavailable:', error?.message || error);
      return null;
    }
  }

  async getMarketSummary(stocks = []) {
    const stockList = Array.isArray(stocks) ? stocks : [];

    const nsengSymbols = Array.from(
      new Set(
        stockList
          .map((stock) => stock?.rawSymbol || stock?.symbol)
          .map((symbol) => this.toNsengSymbol(symbol))
          .filter(Boolean)
      )
    );

    if (nsengSymbols.length === 0) {
      return {
        totalStocks: 0,
        buyRecommendations: 0,
        holdRecommendations: 0,
        sellRecommendations: 0,
        bullishStocks: 0,
        bearishStocks: 0,
        highRiskStocks: 0,
        topBuys: [],
        topSells: [],
        analyses: [],
        chatBrief: null,
        timestamp: new Date().toISOString(),
        sources: []
      };
    }

    const cacheKey = `market-summary:${nsengSymbols.join('|')}`;
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    const stockBySymbol = new Map();
    stockList.forEach((stock) => {
      const normalizedSymbol = this.normalizeSymbol(stock?.rawSymbol || stock?.symbol);
      if (normalizedSymbol && !stockBySymbol.has(normalizedSymbol)) {
        stockBySymbol.set(normalizedSymbol, stock);
      }
    });

    const predictionRows = await this.fetchPredictionBatch(nsengSymbols);
    if (predictionRows.length === 0) {
      throw new Error('Prediction batch endpoint unavailable.');
    }

    const analyses = predictionRows
      .map((prediction) => this.createAnalysisItem(prediction, stockBySymbol))
      .filter((item) => Boolean(item.symbol));

    const buyRecommendations = analyses.filter((item) => item.recommendation === 'Buy').length;
    const holdRecommendations = analyses.filter((item) => item.recommendation === 'Hold').length;
    const sellRecommendations = analyses.filter((item) => item.recommendation === 'Sell').length;
    const bullishStocks = analyses.filter((item) => item.sentiment === 'Bullish').length;
    const bearishStocks = analyses.filter((item) => item.sentiment === 'Bearish').length;
    const highRiskStocks = analyses.filter((item) => item.riskLevel === 'High').length;

    const topBuys = analyses
      .filter((item) => item.recommendation === 'Buy')
      .sort((left, right) => {
        if (right.finalScore !== left.finalScore) {
          return right.finalScore - left.finalScore;
        }
        return right.confidence - left.confidence;
      })
      .slice(0, 5);

    const topSells = analyses
      .filter((item) => item.recommendation === 'Sell')
      .sort((left, right) => {
        if (left.finalScore !== right.finalScore) {
          return left.finalScore - right.finalScore;
        }
        return right.confidence - left.confidence;
      })
      .slice(0, 5);

    const sortedTimestamps = analyses
      .map((item) => item.analyzedAt)
      .filter(Boolean)
      .sort((left, right) => new Date(right).getTime() - new Date(left).getTime());

    const chatBrief = await this.fetchChatBrief({
      totalStocks: analyses.length,
      bullishStocks,
      bearishStocks,
      topBuys,
      topSells
    });

    const result = {
      totalStocks: analyses.length,
      buyRecommendations,
      holdRecommendations,
      sellRecommendations,
      bullishStocks,
      bearishStocks,
      highRiskStocks,
      topBuys,
      topSells,
      analyses,
      chatBrief,
      timestamp: sortedTimestamps[0] || new Date().toISOString(),
      sources: this.uniqueStrings([
        'Prediction Batch API',
        chatBrief ? 'Chat API' : ''
      ])
    };

    this.setCached(cacheKey, result);
    return result;
  }

  clearCache() {
    this.cache.clear();
  }
}

export default new AIMarketInsightsService();