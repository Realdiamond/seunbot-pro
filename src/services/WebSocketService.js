// WebSocket Service for Real-Time Price Streaming
// External WebSocket providers (Polygon.io, TwelveData) have been removed.
// US Stocks uses HTTP polling against the SeunBot backend.
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
    // Only NGX and US Stocks use polling against our backend
    if (marketType === 'ngx' || marketType === 'usstocks') {
      this._startPolling(symbols);
    } else {
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

    // Don't start polling if nothing to watch
    if (!symbols || symbols.length === 0) return;

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
        } else if (this.marketType === 'usstocks') {
          // Single bulk call to /api/Assets/live-prices — far cheaper than one call per symbol
          const { default: USStocksDataService } = await import('./USStocksDataService');
          // Use the cached stock list (2-min TTL) rather than forcing a full
          // multi-page refetch every poll — there is no cheap US bulk-price API.
          const livePrices = await USStocksDataService.fetchLivePrices(false);
          const symbolSet = new Set(symbols);
          livePrices.bySymbol.forEach((priceData, sym) => {
            if (!symbolSet.has(sym)) return;
            if (priceData.price == null) return;
            this._handlePriceUpdate({
              symbol: sym,
              price: priceData.price,
              volume: priceData.volume,
              high: priceData.high,
              low: priceData.low,
              previousClose: priceData.previousClose,
              change: priceData.change,
              changePercent: priceData.changePercent,
              timestamp: Date.now(),
              source: 'Live Prices API'
            });
          });
        }
      } catch (error) {
        console.error('Polling error:', error.message);
      }
    };

    pollFn();
    // usstocks: 60s (API is cached 60s server-side anyway, hitting faster is wasteful)
    // ngx: 30s
    const intervalMs = this.marketType === 'usstocks' ? 60000 : 30000;
    const intervalId = setInterval(pollFn, intervalMs);
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

// Export separate instances for US Stocks and NGX to avoid conflicts
export const usStocksWebSocket = new WebSocketService();
export const ngxWebSocket = new WebSocketService();

export default WebSocketService;