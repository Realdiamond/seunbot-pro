// Signal / Prediction History Service
// Unifies the per-market history endpoints into a single normalized row shape so the
// shared <SignalHistory/> table can render NGX, US, Forex and Crypto identically.
//
//   NGX    → GET /api/Prediction/{symbol}/history        (PredictionLog[])
//   US     → GET /api/UsPrediction/{symbol}/history      (PredictionLog[])
//   Crypto → GET /api/CryptoAnalysis/{symbol}/history     (mapped row[])
//   Forex  → GET /api/ForexAnalysis/{symbol}/history      (mapped row[])

import axios from 'axios';

const BASE = import.meta.env?.VITE_SEUNBOT_API_BASE_URL || '';

const ENDPOINTS = {
  ngx:    (s) => `/api/Prediction/${encodeURIComponent(s)}/history`,
  us:     (s) => `/api/UsPrediction/${encodeURIComponent(s)}/history`,
  crypto: (s) => `/api/CryptoAnalysis/${encodeURIComponent(s)}/history`,
  forex:  (s) => `/api/ForexAnalysis/${encodeURIComponent(s)}/history`,
};

const num = (v) => (v == null || v === '' ? null : Number(v));

// Normalize a single record (PredictionLog OR crypto/forex mapped row) to one shape.
function normalizeRow(r) {
  return {
    symbol:          r.symbol ?? r.assetSymbol ?? '',
    direction:       r.direction ?? r.recommendation ?? 'HOLD',
    finalScore:      num(r.finalScore),
    signalStrength:  num(r.signalStrength),
    technicalScore:  num(r.technicalScore),
    sentimentScore:  num(r.sentimentScore),
    confidence:      num(r.confidence),
    entryPrice:      num(r.entryPrice ?? r.suggestedEntry ?? r.priceAtPrediction),
    stopLoss:        num(r.stopLoss),
    takeProfit1:     num(r.takeProfit1 ?? r.takeProfit),
    takeProfit2:     num(r.takeProfit2),
    riskRewardRatio: num(r.riskRewardRatio),
    timeframe:       r.timeframe ?? 'Daily',
    predictedAt:     r.predictedAt ?? r.createdAt ?? r.analyzedAt ?? null,
  };
}

const cache = new Map();
const TTL_MS = 60 * 1000;

export async function fetchSignalHistory(market, symbol, count = 20) {
  const key = String(market || '').toLowerCase();
  const build = ENDPOINTS[key];
  if (!build || !symbol) return [];

  const cacheKey = `${key}:${symbol}:${count}`;
  const hit = cache.get(cacheKey);
  if (hit && Date.now() - hit.t < TTL_MS) return hit.data;

  try {
    const res = await axios.get(`${BASE}${build(symbol)}?count=${count}`, { timeout: 20000 });
    const rows = Array.isArray(res.data) ? res.data.map(normalizeRow) : [];
    // Newest first.
    rows.sort((a, b) => new Date(b.predictedAt || 0) - new Date(a.predictedAt || 0));
    // Only surface predictions from the last 30 days — anything older is stale and misleading.
    const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const recent = rows.filter(r => {
      if (!r.predictedAt) return false;
      return new Date(r.predictedAt).getTime() >= cutoff;
    });
    cache.set(cacheKey, { data: recent, t: Date.now() });
    return recent;
  } catch (err) {
    console.warn(`Signal history unavailable for ${market}/${symbol}:`, err?.message);
    return [];
  }
}

export default { fetchSignalHistory };
