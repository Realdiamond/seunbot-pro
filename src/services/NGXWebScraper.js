// NGX Web Scraper
// All external scraping (ngxgroup.com and others) has been removed.
// All NGX data is now sourced from the SeunBot Heroku backend.

class NGXWebScraper {
  async fetchData() {
    console.warn('NGXWebScraper: external scrapers removed. Use RealNGXDataService instead.');
    return [];
  }

  async getAllStocks() {
    return [];
  }
}

export default new NGXWebScraper();