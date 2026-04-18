import axios from 'axios';

class AIAnalysisEndpointService {
  constructor() {
    this.baseUrl = import.meta.env?.VITE_SEUNBOT_API_BASE_URL || 'https://seun-bot-4fb16422b74d.herokuapp.com';
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
    for (const candidate of candidates) {
      const value = this.toNumber(candidate, null);
      if (value !== null) return value;
    }
    return fallback;
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

  mapSentiment(label, score) {
    const text = String(label || '').toUpperCase();
    if (text.includes('BULL')) return 'Bullish';
    if (text.includes('BEAR')) return 'Bearish';

    const numericScore = this.toNumber(score, null);
    if (numericScore === null) return 'Neutral';
    if (numericScore > 0.2) return 'Bullish';
    if (numericScore < -0.2) return 'Bearish';
    return 'Neutral';
  }

  deriveRiskLevel(prediction, sentiment) {
    const predictionRisks = Array.isArray(prediction?.risks) ? prediction.risks.length : 0;
    const sentimentRisks = Array.isArray(sentiment?.risks) ? sentiment.risks.length : 0;
    const totalRisks = predictionRisks + sentimentRisks;

    if (sentiment?.errorMessage) return 'High';
    if (totalRisks >= 4) return 'High';
    if (totalRisks >= 2) return 'Medium';
    return 'Low';
  }

  deriveTimeHorizon(analysis) {
    const signalStrength = this.toNumber(analysis?.analysis?.signalStrength, null);

    if (signalStrength === null) return 'Medium-term';
    if (signalStrength >= 3.5) return 'Short-term';
    if (signalStrength <= 1.2) return 'Medium-term';
    return 'Medium-term';
  }

  deriveKeyLevels(stock, currentPrice, analysis, prediction) {
    const atr = this.toNumber(analysis?.analysis?.multiTimeframeResult?.dailyAnalysis?.atr, null);
    if (atr !== null && atr > 0) {
      return {
        strongResistance: currentPrice + (atr * 2),
        weakResistance: currentPrice + atr,
        weakSupport: Math.max(0, currentPrice - atr),
        strongSupport: Math.max(0, currentPrice - (atr * 2))
      };
    }

    const high = this.firstNumber([stock?.high], this.firstNumber([prediction?.currentPrice], currentPrice * 1.02));
    const low = this.firstNumber([stock?.low], this.firstNumber([prediction?.currentPrice], currentPrice * 0.98));

    const top = Math.max(high, low);
    const bottom = Math.min(high, low);
    const spread = Math.max(top - bottom, currentPrice * 0.02);

    return {
      strongResistance: top,
      weakResistance: currentPrice + (spread * 0.25),
      weakSupport: Math.max(0, currentPrice - (spread * 0.25)),
      strongSupport: bottom
    };
  }

  extractReportInsights(report = '') {
    if (!report) return [];

    const lines = report
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    const bulletLines = lines
      .filter((line) => line.startsWith('•') || line.startsWith('-') || line.startsWith('*') || line.startsWith('\t•'))
      .map((line) => line.replace(/^[\t ]*[•*-]\s*/, ''))
      .filter(Boolean);

    if (bulletLines.length > 0) {
      return bulletLines.slice(0, 5);
    }

    return lines.slice(0, 5);
  }

  buildReasoning(prediction, sentiment, analysis) {
    const parts = [];

    if (prediction?.recommendation) {
      parts.push(`Prediction endpoint recommends ${String(prediction.recommendation).toUpperCase()}.`);
    }

    const confidence = this.toNumber(prediction?.confidence, null);
    if (confidence !== null) {
      const confidencePercent = confidence <= 1 ? Math.round(confidence * 100) : Math.round((confidence / 5) * 100);
      parts.push(`Confidence is approximately ${confidencePercent}%.`);
    }

    if (sentiment?.sentimentLabel) {
      parts.push(`Sentiment endpoint is ${String(sentiment.sentimentLabel).toUpperCase()}.`);
    }

    if (analysis?.analysis?.direction) {
      parts.push(`Comprehensive analysis direction is ${String(analysis.analysis.direction).toUpperCase()}.`);
    }

    if (sentiment?.errorMessage) {
      parts.push('Sentiment provider reported an error, so sentiment details are limited.');
    }

    return parts.join(' ').trim();
  }

  buildTradingStrategy(analysis, prediction, entryPoint, priceTarget, stopLoss) {
    const tradePlan = analysis?.analysis?.tradingSignal?.tradePlan;

    const planEntry = this.toNumber(tradePlan?.entryPrice, null);
    const planTarget = this.toNumber(tradePlan?.takeProfit1, null);
    const planStop = this.toNumber(tradePlan?.stopLoss, null);

    if (planEntry !== null && planTarget !== null && planStop !== null) {
      return `Trade plan from Analysis API: Entry ₦${planEntry.toFixed(2)}, Target ₦${planTarget.toFixed(2)}, Stop ₦${planStop.toFixed(2)}.`;
    }

    const recommendation = String(prediction?.recommendation || '').toUpperCase();
    if (recommendation === 'BUY' || recommendation === 'SELL') {
      return `${recommendation} setup: Entry ₦${entryPoint.toFixed(2)}, Target ₦${priceTarget.toFixed(2)}, Stop ₦${stopLoss.toFixed(2)}.`;
    }

    return 'Await clearer confirmation across analysis and sentiment endpoints before entering a position.';
  }

  mapNewsItems(recentNews = []) {
    if (!Array.isArray(recentNews)) return [];

    return recentNews.map((item) => {
      if (typeof item === 'string') return item;

      const title = item?.title || 'Untitled update';
      const source = item?.source ? ` (${item.source})` : '';
      return `${title}${source}`;
    });
  }

  async fetchComprehensiveReport(nsengSymbol, stock) {
    try {
      const assetName = encodeURIComponent(stock?.name || this.normalizeSymbol(nsengSymbol));
      const exchange = encodeURIComponent(stock?.exchange || 'NSENG');
      const query = `assetName=${assetName}&exchange=${exchange}&accountBalance=10000&fundamentalScore=0&sentimentScore=0`;
      const url = `${this.baseUrl}/api/Analysis/comprehensive-report/${encodeURIComponent(nsengSymbol)}?${query}`;

      const response = await axios.post(url, null, { timeout: 45000 });
      return response.data;
    } catch (error) {
      console.warn(`Comprehensive report unavailable for ${nsengSymbol}:`, error?.message || error);
      return null;
    }
  }

  async fetchPrediction(nsengSymbol) {
    try {
      const response = await axios.get(`${this.baseUrl}/api/Prediction/${encodeURIComponent(nsengSymbol)}`, {
        timeout: 20000
      });

      return response.data;
    } catch (error) {
      console.warn(`Prediction endpoint unavailable for ${nsengSymbol}:`, error?.message || error);
      return null;
    }
  }

  async fetchSentiment(nsengSymbol) {
    try {
      const response = await axios.get(`${this.baseUrl}/api/Prediction/${encodeURIComponent(nsengSymbol)}/sentiment`, {
        timeout: 20000
      });

      return response.data;
    } catch (error) {
      console.warn(`Prediction sentiment endpoint unavailable for ${nsengSymbol}:`, error?.message || error);
      return null;
    }
  }

  async analyzeStock(stock) {
    const normalizedSymbol = this.normalizeSymbol(stock?.rawSymbol || stock?.symbol || '');
    if (!normalizedSymbol) {
      throw new Error('Stock symbol is required for AI analysis.');
    }

    const nsengSymbol = this.toNsengSymbol(normalizedSymbol);
    const cached = this.getCached(nsengSymbol);
    if (cached) return cached;

    const [analysisData, predictionData, sentimentData] = await Promise.all([
      this.fetchComprehensiveReport(nsengSymbol, stock),
      this.fetchPrediction(nsengSymbol),
      this.fetchSentiment(nsengSymbol)
    ]);

    if (!analysisData && !predictionData && !sentimentData) {
      throw new Error('AI analysis endpoints are currently unavailable.');
    }

    const currentPrice = this.firstNumber([
      predictionData?.currentPrice,
      analysisData?.analysis?.currentPrice,
      stock?.price
    ], this.firstNumber([stock?.price], 1));

    const rawConfidence = this.toNumber(predictionData?.confidence, null);
    let confidence = 3;
    if (rawConfidence !== null) {
      const mapped = rawConfidence <= 1 ? Math.round(rawConfidence * 5) : Math.round(rawConfidence);
      confidence = Math.min(5, Math.max(1, mapped));
    }

    const recommendation = this.mapRecommendation(predictionData?.recommendation || analysisData?.analysis?.direction);
    const sentiment = this.mapSentiment(sentimentData?.sentimentLabel, predictionData?.sentimentScore);

    const entryPoint = this.firstNumber([
      predictionData?.suggestedEntry,
      analysisData?.analysis?.tradingSignal?.tradePlan?.entryPrice,
      currentPrice
    ], currentPrice);

    const priceTarget = this.firstNumber([
      predictionData?.takeProfit,
      analysisData?.analysis?.tradingSignal?.tradePlan?.takeProfit1,
      currentPrice * 1.02
    ], currentPrice * 1.02);

    const stopLoss = this.firstNumber([
      predictionData?.stopLoss,
      analysisData?.analysis?.tradingSignal?.tradePlan?.stopLoss,
      currentPrice * 0.98
    ], currentPrice * 0.98);

    const keyLevels = this.deriveKeyLevels(stock, currentPrice, analysisData, predictionData);

    const predictionRisks = Array.isArray(predictionData?.risks) ? predictionData.risks : [];
    const sentimentRisks = Array.isArray(sentimentData?.risks) ? sentimentData.risks : [];
    const riskFactors = this.uniqueStrings([
      ...predictionRisks,
      ...sentimentRisks,
      sentimentData?.errorMessage ? `Sentiment API issue: ${sentimentData.errorMessage}` : ''
    ]);

    const catalysts = this.uniqueStrings([
      ...(Array.isArray(sentimentData?.opportunities) ? sentimentData.opportunities : []),
      ...(Array.isArray(predictionData?.keyFactors) ? predictionData.keyFactors : [])
    ]);

    const concerns = this.uniqueStrings([
      ...predictionRisks,
      ...sentimentRisks,
      sentimentData?.errorMessage ? `Sentiment API issue: ${sentimentData.errorMessage}` : ''
    ]);

    const reportInsights = this.extractReportInsights(analysisData?.report || '');
    const apiInsights = this.uniqueStrings([
      analysisData?.analysis?.direction ? `Comprehensive analysis direction: ${String(analysisData.analysis.direction).toUpperCase()}.` : '',
      predictionData?.recommendation ? `Prediction recommendation: ${String(predictionData.recommendation).toUpperCase()}.` : '',
      this.toNumber(predictionData?.finalScore, null) !== null ? `Prediction final score: ${this.toNumber(predictionData.finalScore, 0).toFixed(3)}.` : '',
      sentimentData?.sentimentLabel ? `Sentiment endpoint: ${String(sentimentData.sentimentLabel).toUpperCase()}.` : '',
      ...(Array.isArray(predictionData?.keyFactors) ? predictionData.keyFactors : [])
    ]);

    const insights = this.uniqueStrings([...apiInsights, ...reportInsights]);

    const result = {
      symbol: normalizedSymbol,
      name: stock?.name || normalizedSymbol,
      currentPrice,
      priceSource: this.toNumber(predictionData?.currentPrice, null) !== null
        ? 'Prediction API'
        : (this.toNumber(analysisData?.analysis?.currentPrice, null) !== null ? 'Analysis API' : 'Market Data'),
      webDataUsed: false,
      recommendation,
      confidence,
      insights: insights.length > 0
        ? insights.slice(0, 10)
        : ['No detailed insight lines returned by the current endpoints.'],
      technicalAnalysis: analysisData?.report || 'No comprehensive report text returned by Analysis endpoint.',
      fundamentalAnalysis: predictionData?.breakdown?.fundamentalSummary || 'No fundamental summary returned by Prediction endpoint.',
      riskLevel: this.deriveRiskLevel(predictionData, sentimentData),
      riskFactors: riskFactors.length > 0
        ? riskFactors
        : ['No explicit risk factors returned by current endpoints.'],
      priceTarget,
      stopLoss,
      entryPoint,
      sentiment,
      reasoning: this.buildReasoning(predictionData, sentimentData, analysisData),
      keyLevels,
      tradingStrategy: this.buildTradingStrategy(analysisData, predictionData, entryPoint, priceTarget, stopLoss),
      timeHorizon: this.deriveTimeHorizon(analysisData),
      catalysts: catalysts.length > 0
        ? catalysts.slice(0, 8)
        : ['No explicit opportunity/catalyst list returned by current endpoints.'],
      concerns: concerns.length > 0
        ? concerns.slice(0, 8)
        : ['No explicit concern list returned by current endpoints.'],
      recentNews: this.mapNewsItems(sentimentData?.recentNews).slice(0, 10),
      analystRatings: 'No analyst ratings available',
      timestamp: analysisData?.analysis?.analysisTimestamp || predictionData?.analyzedAt || sentimentData?.analyzedAt || new Date().toISOString(),
      isAI: true,
      dataQuality: 'Real-time',
      sources: this.uniqueStrings([
        analysisData ? 'Analysis API' : '',
        predictionData ? 'Prediction API' : '',
        sentimentData ? 'Prediction Sentiment API' : ''
      ])
    };

    this.setCached(nsengSymbol, result);
    return result;
  }

  clearCache() {
    this.cache.clear();
  }
}

export default new AIAnalysisEndpointService();