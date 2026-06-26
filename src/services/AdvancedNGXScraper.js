// Advanced NGX Scraper
// All external scraping (Investing.com, TradingView, Yahoo Finance, NGX Group,
// AfricanMarkets, MarketWatch, AlphaVantage, CORS proxies) has been removed.
// All NGX data is now sourced from the SeunBot Heroku backend.

class AdvancedNGXScraper {
  async fetchData() {
    console.warn('AdvancedNGXScraper: external scrapers removed. Use RealNGXDataService instead.');
    return [];
  }

  async getAllStocks() {
    return [];
  }
}

export default new AdvancedNGXScraper();