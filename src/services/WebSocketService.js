// WebSocket Service for Real-Time Price Streaming
// Supports Polygon.io and TwelveData WebSocket APIs with auto-reconnect
// Falls back to HTTP polling when WebSocket is unavailable

class WebSocketService {
  constructor() {
    this.ws = null;
    this.provider = null; // 'polygon' or 'twelvedata'
    this.apiKeys = {
      polygon: import.meta.env.VITE_POLYGON_API_KEY,
      twelvedata: import.meta.env.VITE_TWELVEDATA_API_KEY
    };

    // Connection state
    this.connected = false;
    this.authenticated = false;
    this.reconnecting = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.reconnectTimer = null;

    // Subscriptions: symbol -> Set of callback functions
    this.subscriptions = new Map();

    // Status listeners: callback(status) where status = 'connected' | 'disconnected' | 'reconnecting' | 'error'
    this.statusListeners = new Set();

    // Polling fallback
    this.pollingIntervals = new Map();
    this.pollingMode = false;

    // Price cache for latest values
    this.priceCache = new Map();

    // Market type tracking
    this.marketType = null; // 'sp500' or 'ngx'
  }

  // ==================== Public API ====================

  /**
   * Connect to WebSocket for a specific market
   * @param {'sp500' | 'ngx'} marketType
   * @param {string[]} symbols - Array of stock symbols to subscribe to
   */
  async connect(marketType, symbols = []) {
    this.marketType = marketType;

    // Try Polygon first, then TwelveData
    if (this.apiKeys.polygon) {
      try {
        await this._connectPolygon(symbols);
        return;
      } catch (error) {
        console.warn('⚠️ Polygon WebSocket failed, trying TwelveData...', error.message);
      }
    }

    if (this.apiKeys.twelvedata) {
      try {
        await this._connectTwelveData(symbols);
        return;
      } catch (error) {
        console.warn('⚠️ TwelveData WebSocket failed, falling back to HTTP polling...', error.message);
      }
    }

    // Fallback to HTTP polling
    console.warn('⚠️ All WebSocket providers failed, using HTTP polling');
    this._startPolling(symbols);
  }

  /**
   * Subscribe to price updates for a symbol
   * @param {string} symbol
   * @param {function} callback - Called with { symbol, price, change, changePercent, volume, timestamp, source }
   */
  subscribe(symbol, callback) {
    if (!this.subscriptions.has(symbol)) {
      this.subscriptions.set(symbol, new Set());
    }
    this.subscriptions.get(symbol).add(callback);

    // If already connected, subscribe on the wire
    if (this.connected && this.ws) {
      this._subscribeOnWire([symbol]);
    }

    // Return cached price immediately if available
    const cached = this.priceCache.get(symbol);
    if (cached) {
      callback(cached);
    }
  }

  /**
   * Unsubscribe from price updates
   * @param {string} symbol
   * @param {function} callback
   */
  unsubscribe(symbol, callback) {
    const subs = this.subscriptions.get(symbol);
    if (subs) {
      subs.delete(callback);
      if (subs.size === 0) {
        this.subscriptions.delete(symbol);
        this._unsubscribeOnWire([symbol]);
      }
    }
  }

  /**
   * Add a status listener
   * @param {function} callback - Called with status string
   */
  onStatusChange(callback) {
    this.statusListeners.add(callback);
    // Immediately notify current status
    const status = this.connected ? 'connected' : (this.reconnecting ? 'reconnecting' : 'disconnected');
    callback(status);
    return () => this.statusListeners.delete(callback);
  }

  /**
   * Get current connection status
   */
  getStatus() {
    if (this.connected) return 'connected';
    if (this.reconnecting) return 'reconnecting';
    if (this.pollingMode) return 'polling';
    return 'disconnected';
  }

  /**
   * Get the active provider name
   */
  getProvider() {
    if (this.pollingMode) return 'HTTP Polling';
    return this.provider || 'None';
  }

  /**
   * Disconnect and clean up
   */
  disconnect() {
    this._cleanup();
  }

  // ==================== Polygon.io WebSocket ====================

  _connectPolygon(symbols) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Polygon WebSocket connection timeout'));
      }, 10000);

      try {
        this.ws = new WebSocket('wss://socket.polygon.io/stocks');
        this.provider = 'Polygon.io';

        this.ws.onopen = () => {
          console.log('🔌 Polygon WebSocket opened, authenticating...');
          // Authenticate
          this.ws.send(JSON.stringify({
            action: 'auth',
            params: this.apiKeys.polygon
          }));
        };

        this.ws.onmessage = (event) => {
          try {
            const messages = JSON.parse(event.data);
            const msgArray = Array.isArray(messages) ? messages : [messages];

            for (const msg of msgArray) {
              // Authentication response
              if (msg.ev === 'status') {
                if (msg.status === 'auth_success') {
                  console.log('✅ Polygon WebSocket authenticated');
                  this.authenticated = true;
                  this.connected = true;
                  this.reconnecting = false;
                  this.reconnectAttempts = 0;
                  clearTimeout(timeout);
                  this._notifyStatus('connected');

                  // Subscribe to symbols
                  if (symbols.length > 0) {
                    this._subscribeOnWire(symbols);
                  }
                  resolve();
                } else if (msg.status === 'auth_failed') {
                  console.error('❌ Polygon auth failed:', msg.message);
                  clearTimeout(timeout);
                  reject(new Error('Polygon auth failed'));
                } else if (msg.status === 'success' && msg.message?.includes('subscribed')) {
                  console.log('✅ Polygon subscription confirmed:', msg.message);
                }
              }

              // Trade update (T = trade)
              if (msg.ev === 'T' && msg.sym) {
                this._handlePriceUpdate({
                  symbol: msg.sym,
                  price: msg.p,
                  volume: msg.s || 0,
                  timestamp: msg.t,
                  source: 'Polygon.io WebSocket'
                });
              }

              // Aggregate (per-second) update (A = aggregate)
              if (msg.ev === 'A' && msg.sym) {
                this._handlePriceUpdate({
                  symbol: msg.sym,
                  price: msg.c || msg.vw,
                  volume: msg.v || 0,
                  high: msg.h,
                  low: msg.l,
                  open: msg.o,
                  timestamp: msg.s,
                  source: 'Polygon.io WebSocket'
                });
              }

              // Quote update (Q = quote)
              if (msg.ev === 'Q' && msg.sym) {
                const midPrice = (msg.bp + msg.ap) / 2;
                this._handlePriceUpdate({
                  symbol: msg.sym,
                  price: midPrice,
                  bid: msg.bp,
                  ask: msg.ap,
                  timestamp: msg.t,
                  source: 'Polygon.io WebSocket'
                });
              }
            }
          } catch (err) {
            console.error('Polygon message parse error:', err);
          }
        };

        this.ws.onerror = (error) => {
          console.error('❌ Polygon WebSocket error:', error);
          clearTimeout(timeout);
          if (!this.connected) {
            reject(new Error('Polygon WebSocket error'));
          }
        };

        this.ws.onclose = (event) => {
          console.log('🔌 Polygon WebSocket closed:', event.code, event.reason);
          this.connected = false;
          this.authenticated = false;
          clearTimeout(timeout);

          if (!this.reconnecting && this.subscriptions.size > 0) {
            this._scheduleReconnect();
          }
        };
      } catch (error) {
        clearTimeout(timeout);
        reject(error);
      }
    });
  }

  // ==================== TwelveData WebSocket ====================

  _connectTwelveData(symbols) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('TwelveData WebSocket connection timeout'));
      }, 10000);

      try {
        this.ws = new WebSocket(`wss://ws.twelvedata.com/v1/quotes/price?apikey=${this.apiKeys.twelvedata}`);
        this.provider = 'TwelveData';

        this.ws.onopen = () => {
          console.log('🔌 TwelveData WebSocket opened');
          this.connected = true;
          this.reconnecting = false;
          this.reconnectAttempts = 0;
          clearTimeout(timeout);
          this._notifyStatus('connected');

          // Subscribe to symbols
          if (symbols.length > 0) {
            this._subscribeOnWire(symbols);
          }
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data);

            // Price update
            if (msg.event === 'price') {
              this._handlePriceUpdate({
                symbol: msg.symbol,
                price: parseFloat(msg.price),
                volume: parseInt(msg.day_volume || 0),
                timestamp: msg.timestamp ? msg.timestamp * 1000 : Date.now(),
                source: 'TwelveData WebSocket'
              });
            }

            // Subscription confirmation
            if (msg.event === 'subscribe-status') {
              if (msg.status === 'ok') {
                console.log('✅ TwelveData subscription confirmed');
              } else {
                console.warn('⚠️ TwelveData subscription issue:', msg);
              }
            }

            // Heartbeat
            if (msg.event === 'heartbeat') {
              // Connection is alive
            }
          } catch (err) {
            console.error('TwelveData message parse error:', err);
          }
        };

        this.ws.onerror = (error) => {
          console.error('❌ TwelveData WebSocket error:', error);
          clearTimeout(timeout);
          if (!this.connected) {
            reject(new Error('TwelveData WebSocket error'));
          }
        };

        this.ws.onclose = (event) => {
          console.log('🔌 TwelveData WebSocket closed:', event.code, event.reason);
          this.connected = false;
          clearTimeout(timeout);

          if (!this.reconnecting && this.subscriptions.size > 0) {
            this._scheduleReconnect();
          }
        };
      } catch (error) {
        clearTimeout(timeout);
        reject(error);
      }
    });
  }

  // ==================== Wire Protocol ====================

  _subscribeOnWire(symbols) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    if (this.provider === 'Polygon.io') {
      // Polygon: subscribe to trades and aggregates
      // Use AM.* for per-minute aggregates (available on free tier)
      const tradeChannels = symbols.map(s => `T.${s}`).join(',');
      const aggChannels = symbols.map(s => `AM.${s}`).join(',');

      this.ws.send(JSON.stringify({
        action: 'subscribe',
        params: `${tradeChannels},${aggChannels}`
      }));
      console.log(`📡 Polygon: subscribed to ${symbols.length} symbols`);
    } else if (this.provider === 'TwelveData') {
      // TwelveData: subscribe to price updates
      this.ws.send(JSON.stringify({
        action: 'subscribe',
        params: {
          symbols: symbols.join(',')
        }
      }));
      console.log(`📡 TwelveData: subscribed to ${symbols.length} symbols`);
    }
  }

  _unsubscribeOnWire(symbols) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    if (this.provider === 'Polygon.io') {
      const channels = symbols.map(s => `T.${s},AM.${s}`).join(',');
      this.ws.send(JSON.stringify({
        action: 'unsubscribe',
        params: channels
      }));
    } else if (this.provider === 'TwelveData') {
      this.ws.send(JSON.stringify({
        action: 'unsubscribe',
        params: {
          symbols: symbols.join(',')
        }
      }));
    }
  }

  // ==================== Price Update Handler ====================

  _handlePriceUpdate(update) {
    const { symbol } = update;

    // Merge with cached data to preserve fields
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

    // Notify all subscribers for this symbol
    const subs = this.subscriptions.get(symbol);
    if (subs) {
      subs.forEach(callback => {
        try {
          callback(merged);
        } catch (err) {
          console.error('Subscriber callback error:', err);
        }
      });
    }
  }

  // ==================== Reconnection ====================

  _scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.warn('⚠️ Max reconnect attempts reached, falling back to HTTP polling');
      this._startPolling(Array.from(this.subscriptions.keys()));
      return;
    }

    this.reconnecting = true;
    this._notifyStatus('reconnecting');

    // Exponential backoff: 1s, 2s, 4s, 8s, 16s, 30s max
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    this.reconnectAttempts++;

    console.log(`🔄 Reconnecting in ${delay / 1000}s (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);

    this.reconnectTimer = setTimeout(async () => {
      const symbols = Array.from(this.subscriptions.keys());
      try {
        await this.connect(this.marketType, symbols);
      } catch (error) {
        console.error('Reconnect failed:', error.message);
        this._scheduleReconnect();
      }
    }, delay);
  }

  // ==================== HTTP Polling Fallback ====================

  _startPolling(symbols) {
    this.pollingMode = true;
    this._notifyStatus('polling');
    console.log(`📡 Starting HTTP polling for ${symbols.length} symbols (every 30s)`);

    // Clear any existing polling
    this._stopPolling();

    const pollFn = async () => {
      try {
        if (this.marketType === 'sp500') {
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
              source: 'HTTP Polling'
            });
          });
        } else if (this.marketType === 'ngx') {
          const { default: FinancialDataAPI } = await import('./FinancialDataAPI');
          const data = await FinancialDataAPI.fetchNGXData();
          if (data && data.stocks) {
            data.stocks.forEach(stock => {
              if (this.subscriptions.has(stock.symbol)) {
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
                  source: 'HTTP Polling'
                });
              }
            });
          }
        }
      } catch (error) {
        console.error('Polling error:', error.message);
      }
    };

    // Initial poll
    pollFn();

    // Set interval
    const intervalId = setInterval(pollFn, 30000);
    this.pollingIntervals.set('main', intervalId);
  }

  _stopPolling() {
    this.pollingIntervals.forEach((intervalId) => {
      clearInterval(intervalId);
    });
    this.pollingIntervals.clear();
  }

  // ==================== Status Notifications ====================

  _notifyStatus(status) {
    this.statusListeners.forEach(callback => {
      try {
        callback(status);
      } catch (err) {
        console.error('Status listener error:', err);
      }
    });
  }

  // ==================== Cleanup ====================

  _cleanup() {
    // Clear reconnect timer
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    // Stop polling
    this._stopPolling();
    this.pollingMode = false;

    // Close WebSocket
    if (this.ws) {
      try {
        this.ws.onclose = null; // Prevent reconnect on intentional close
        this.ws.onerror = null;
        this.ws.close();
      } catch (e) {
        // Ignore close errors
      }
      this.ws = null;
    }

    this.connected = false;
    this.authenticated = false;
    this.reconnecting = false;
    this.reconnectAttempts = 0;
    this.provider = null;
    this.subscriptions.clear();
    this.statusListeners.clear();
    this._notifyStatus('disconnected');
  }

  /**
   * Seed the price cache with initial data from HTTP fetch
   * This ensures change/changePercent are available for WebSocket updates
   * @param {Array} stocks - Array of stock objects with symbol, price, previousClose, etc.
   */
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