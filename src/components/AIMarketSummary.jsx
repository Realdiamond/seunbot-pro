import React, { useState, useEffect, useCallback } from 'react';
import {
  Brain, TrendingUp, TrendingDown, AlertCircle, RefreshCw,
  Sparkles, Star, Shield, Activity, Target, Clock, List
} from 'lucide-react';
import axios from 'axios';

const BASE_URL = import.meta.env?.VITE_SEUNBOT_API_BASE_URL || '';

// Calls GET /api/Prediction/{symbol} for a single stock
async function fetchPrediction(bareSymbol) {
  const res = await axios.get(`${BASE_URL}/api/Prediction/${encodeURIComponent(bareSymbol)}`, {
    timeout: 20000
  });
  return res.data;
}

function normalize(symbol = '') {
  return String(symbol).replace(/^NSENG_/i, '').trim().toUpperCase();
}

function toNumber(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function recColor(rec = '') {
  const r = String(rec).toUpperCase();
  if (r.includes('BUY'))  return { bg: 'bg-green-500/15', border: 'border-green-500/40', text: 'text-green-400' };
  if (r.includes('SELL')) return { bg: 'bg-red-500/15',   border: 'border-red-500/40',   text: 'text-red-400'   };
  return                         { bg: 'bg-yellow-500/15', border: 'border-yellow-500/40', text: 'text-yellow-400' };
}

function sentimentColor(score) {
  const n = toNumber(score, 0);
  if (n > 0.2)  return 'text-green-400';
  if (n < -0.2) return 'text-red-400';
  return 'text-yellow-400';
}

// ──────────────────────────────────────────────────────────────────────────────

const AIMarketSummary = ({ stock }) => {
  const [pred, setPred]       = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [symbol, setSymbol]   = useState('');

  const load = useCallback(async (sym) => {
    if (!sym) return;
    setLoading(true);
    setError('');
    setPred(null);
    try {
      const data = await fetchPrediction(sym);
      setPred(data);
    } catch (err) {
      console.warn('AI Insights prediction failed:', err?.message);
      setError('Prediction endpoint unavailable for this symbol.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const sym = normalize(stock?.rawSymbol || stock?.symbol || '');
    if (sym && sym !== symbol) {
      setSymbol(sym);
      load(sym);
    }
  }, [stock?.symbol, stock?.rawSymbol]);

  const handleRefresh = () => load(symbol);

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 rounded-lg p-6 border border-purple-500/20">
        <div className="flex items-center gap-3 mb-4">
          <Brain className="w-6 h-6 text-purple-400 animate-pulse" />
          <h3 className="text-lg font-semibold text-white">AI Insights — {symbol}</h3>
        </div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-700 rounded w-3/4 animate-pulse" />
          <div className="h-4 bg-gray-700 rounded w-1/2 animate-pulse" />
          <div className="h-4 bg-gray-700 rounded w-2/3 animate-pulse" />
        </div>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────────
  if (error || !pred) {
    return (
      <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 rounded-lg p-6 border border-purple-500/20 text-center">
        <Brain className="w-12 h-12 mx-auto mb-2 text-purple-400 opacity-50" />
        <p className="text-gray-400 text-sm">{error || `Select a stock to view AI insights.`}</p>
        {error && (
          <button
            onClick={handleRefresh}
            className="mt-3 px-4 py-2 bg-purple-600/30 hover:bg-purple-600/50 rounded-lg text-purple-300 text-sm"
          >
            Retry
          </button>
        )}
      </div>
    );
  }

  // ── Data ─────────────────────────────────────────────────────────────────────
  const rec     = pred.recommendation || pred.signalStrength || 'Hold';
  const colors  = recColor(rec);
  const score   = toNumber(pred.finalScore, null);
  const conf    = toNumber(pred.confidence, null);
  const sentScore = toNumber(pred.sentimentScore, 0);
  const keyFactors = Array.isArray(pred.keyFactors) ? pred.keyFactors : [];
  const risks      = Array.isArray(pred.risks)      ? pred.risks      : [];
  const opportunities = Array.isArray(pred.opportunities) ? pred.opportunities : [];
  const breakdown  = pred.breakdown || {};

  return (
    <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 rounded-lg p-6 border border-purple-500/20 space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Brain className="w-6 h-6 text-purple-400" />
            <Sparkles className="w-3 h-3 text-yellow-400 absolute -top-1 -right-1" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">AI Insights</h3>
            <p className="text-xs text-gray-400">
              {stock?.name || symbol} · Prediction
            </p>
          </div>
        </div>
        <button
          onClick={handleRefresh}
          className="p-2 hover:bg-purple-500/10 rounded-lg transition-colors"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4 text-purple-400" />
        </button>
      </div>

      {/* Recommendation Badge */}
      <div className={`border-2 rounded-xl p-4 ${colors.bg} ${colors.border}`}>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-gray-400 uppercase tracking-wide">Recommendation</span>
          {conf !== null && (
            <div className="flex items-center gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className={`w-3 h-3 ${i < Math.round(conf <= 1 ? conf * 5 : conf) ? `fill-current ${colors.text}` : 'text-gray-600'}`} />
              ))}
              <span className="text-xs text-gray-400 ml-1">({toNumber(conf <= 1 ? conf * 5 : conf, 0).toFixed(1)}/5)</span>
            </div>
          )}
        </div>
        <div className={`text-3xl font-bold ${colors.text}`}>{rec}</div>
        {pred.direction && (
          <div className="text-xs text-gray-400 mt-1 capitalize">Direction: {pred.direction}</div>
        )}
      </div>

      {/* Scores Row */}
      <div className="grid grid-cols-3 gap-3">
        {score !== null && (
          <div className="bg-gray-700/40 rounded-lg p-3 text-center">
            <Target className="w-4 h-4 text-blue-400 mx-auto mb-1" />
            <div className="text-lg font-bold text-white">{score.toFixed(2)}</div>
            <div className="text-xs text-gray-400">Final Score</div>
          </div>
        )}
        <div className="bg-gray-700/40 rounded-lg p-3 text-center">
          <Activity className="w-4 h-4 mx-auto mb-1 text-yellow-400" />
          <div className={`text-lg font-bold ${sentimentColor(sentScore)}`}>
            {sentScore > 0.2 ? 'Bullish' : sentScore < -0.2 ? 'Bearish' : 'Neutral'}
          </div>
          <div className="text-xs text-gray-400">Sentiment</div>
        </div>
        <div className="bg-gray-700/40 rounded-lg p-3 text-center">
          <Shield className={`w-4 h-4 mx-auto mb-1 ${risks.length >= 5 ? 'text-red-400' : risks.length >= 2 ? 'text-yellow-400' : 'text-green-400'}`} />
          <div className={`text-lg font-bold ${risks.length >= 5 ? 'text-red-400' : risks.length >= 2 ? 'text-yellow-400' : 'text-green-400'}`}>
            {risks.length >= 5 ? 'High' : risks.length >= 2 ? 'Medium' : 'Low'}
          </div>
          <div className="text-xs text-gray-400">Risk</div>
        </div>
      </div>

      {/* Key Factors */}
      {keyFactors.length > 0 && (
        <div className="bg-gray-700/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <List className="w-4 h-4 text-purple-400" />
            <span className="text-xs font-semibold text-purple-400 uppercase tracking-wide">Key Factors</span>
          </div>
          <ul className="space-y-2">
            {keyFactors.slice(0, 5).map((f, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                <span className="text-purple-400 mt-0.5 font-bold">•</span>
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Risks & Opportunities */}
      {(risks.length > 0 || opportunities.length > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {risks.length > 0 && (
            <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-red-400" />
                <span className="text-xs font-semibold text-red-400 uppercase tracking-wide">Risks</span>
              </div>
              <ul className="space-y-1">
                {risks.slice(0, 4).map((r, i) => (
                  <li key={i} className="text-xs text-gray-300 flex items-start gap-1">
                    <span className="text-red-400 mt-0.5">⚠</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {opportunities.length > 0 && (
            <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-green-400" />
                <span className="text-xs font-semibold text-green-400 uppercase tracking-wide">Opportunities</span>
              </div>
              <ul className="space-y-1">
                {opportunities.slice(0, 4).map((o, i) => (
                  <li key={i} className="text-xs text-gray-300 flex items-start gap-1">
                    <span className="text-green-400 mt-0.5">✓</span>
                    <span>{o}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Breakdown summary if available */}
      {breakdown.sentimentSummary && (
        <div className="bg-gray-700/30 rounded-lg p-3">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Summary</span>
          <p className="text-sm text-gray-300 mt-1 leading-relaxed">{breakdown.sentimentSummary}</p>
        </div>
      )}

      {/* Timestamp */}
      {pred.analyzedAt && (
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <Clock className="w-3 h-3" />
          Analyzed {new Date(pred.analyzedAt).toLocaleString()}
        </div>
      )}
    </div>
  );
};

export default AIMarketSummary;