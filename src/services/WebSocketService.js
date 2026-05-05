// WebSocket Service for Real-Time Price Streaming
// External WebSocket providers (Polygon.io, TwelveData) have been removed.
// S&P 500 uses fixed fallback data only (no live WS).
// NGX uses HTTP polling against the SeunBot Heroku backend.

class WebSocketService {
  constructor() {
    this.connected = false;
    this.reconnecting = false;
    this.subscriptions = new Map();
    this.statusListeners = new Set();
    this.pollingIntervals = new Map();
    this.pollingMode = false;
    this.priceCache = new Map();
    this.marketType = null;
  }

  // ==================== Public API ====================

  async connect(marketType, symbols = []) {
    this.marketType = marketType;
    // Only NGX uses polling against our backend; SP500 has no live source
    if (marketType === 'ngx') {
      this._startPolling(symbols);
    } else {
      // SP500 / other markets: no external WS available, use polling fallback
      this._startPolling(symbols);
    }
  }

  subscribe(symbol, callback) {
    if (!this.subscriptions.has(symbol)) {
      this.subscriptions.set(symbol, new Set());
    }
    this.subscriptions.get(symbol).add(callback);

    const cached = this.priceCache.get(symbol);
    if (cached) callback(cached);
  }

  unsubscribe(symbol, callback) {
    const subs = this.subscriptions.get(symbol);
    if (subs) {
      subs.delete(callback);
      if (subs.size === 0) this.subscriptions.delete(symbol);
    }
  }

  onStatusChange(callback) {
    this.statusListeners.add(callback);
    const status = this.pollingMode ? 'polling' : 'disconnected';
    callback(status);
    return () => this.statusListeners.delete(callback);
  }

  getStatus() {
    if (this.pollingMode) return 'polling';
    return 'disconnected';
  }

  getProvider() {
    if (this.pollingMode) return 'SeunBot API Polling';
    return 'None';
  }

  disconnect() {
    this._cleanup();
  }

  // ==================== Price Update Handler ====================

  _handlePriceUpdate(update) {
    const { symbol } = update;
    const cached = this.priceCache.get(symbol) || {};
    const merged = {
      ...cached,
      ...update,
      change: update.price && cached.previousClose
        ? update.price - cached.previousClose
        : cached.change || 0,
      changePercent: update.price && cached.previousClose
        ? ((update.price - cached.previousClose) / cached.previousClose) * 100
        : cached.changePercent || 0,
      timestamp: update.timestamp || Date.now()
    };

    this.priceCache.set(symbol, merged);

    const subs = this.subscriptions.get(symbol);
    if (subs) {
      subs.forEach(callback => {
        try { callback(merged); } catch (err) {
          console.error('Subscriber callback error:', err);
        }
      });
    }
  }

  // ==================== HTTP Polling (SeunBot backend for NGX) ====================

  _startPolling(symbols) {
    this.pollingMode = true;
    this._notifyStatus('polling');
    this._stopPolling();

    const pollFn = async () => {
      try {
        if (this.marketType === 'ngx') {
          const { default: RealNGXDataService } = await import('./RealNGXDataService');
          const results = await RealNGXDataService.fetchMultipleStocks(symbols);
          results.forEach(stock => {
            this._handlePriceUpdate({
              symbol: stock.symbol,
              price: stock.price,
              volume: stock.volume,
              open: stock.open,
              high: stock.high,
              low: stock.low,
              previousClose: stock.previousClose,
              change: stock.change,
              changePercent: stock.changePercent,
              timestamp: Date.now(),
              source: 'SeunBot API Polling',
              sources: stock.sources
            });
          });
        } else if (this.marketType === 'sp500') {
          const { default: SP500DataService } = await import('./SP500DataService');
          const results = await SP500DataService.fetchBatchStocks(symbols.slice(0, 20));
          results.forEach(stock => {
            this._handlePriceUpdate({
              symbol: stock.symbol,
              price: stock.price,
              volume: stock.volume,
              open: stock.open,
              high: stock.high,
              low: stock.low,
              previousClose: stock.previousClose,
              change: stock.change,
              changePercent: stock.changePercent,
              timestamp: Date.now(),
              source: 'Fallback Data'
            });
          });
        }
      } catch (error) {
        console.error('Polling error:', error.message);
      }
    };

    pollFn();
    const intervalId = setInterval(pollFn, 30000);
    this.pollingIntervals.set('main', intervalId);
  }

  _stopPolling() {
    this.pollingIntervals.forEach(id => clearInterval(id));
    this.pollingIntervals.clear();
  }

  _notifyStatus(status) {
    this.statusListeners.forEach(callback => {
      try { callback(status); } catch (err) {
        console.error('Status listener error:', err);
      }
    });
  }

  _cleanup() {
    this._stopPolling();
    this.pollingMode = false;
    this.connected = false;
    this.reconnecting = false;
    this.subscriptions.clear();
    this.statusListeners.clear();
    this._notifyStatus('disconnected');
  }

  seedCache(stocks) {
    stocks.forEach(stock => {
      this.priceCache.set(stock.symbol, {
        symbol: stock.symbol,
        price: stock.price,
        previousClose: stock.previousClose,
        open: stock.open,
        high: stock.high,
        low: stock.low,
        volume: stock.volume,
        change: stock.change,
        changePercent: stock.changePercent,
        name: stock.name,
        sector: stock.sector,
        sources: stock.sources
      });
    });
  }
}

// Export separate instances for SP500 and NGX to avoid conflicts
export const sp500WebSocket = new WebSocketService();
export const ngxWebSocket = new WebSocketService();

export default WebSocketService;