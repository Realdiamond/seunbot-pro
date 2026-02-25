// Real NGX Data Service - Now uses Financial Data APIs
import FinancialDataAPI from './FinancialDataAPI';

class RealNGXDataService {
  constructor() {
    this.api = FinancialDataAPI;
  }

  // Fetch real-time NGX stock data
  async fetchStockData(symbol) {
    try {
      console.log(`📈 Fetching real-time data for ${symbol}...`);
      const stock = await this.api.getStock(symbol);
      
      return {
        symbol: stock.symbol,
        name: stock.name,
        price: stock.price,
        change: stock.change,
        changePercent: stock.changePercent,
        volume: stock.volume,
        high: stock.high,
        low: stock.low,
        open: stock.open,
        previousClose: stock.previousClose,
        timestamp: stock.timestamp,
        isMock: stock.isMock || false,
        sources: stock.sources || [],
        sector: stock.sector
      };
    } catch (error) {
      console.error(`Error fetching stock data for ${symbol}:`, error);
      throw error;
    }
  }

  // Fetch multiple stocks
  async fetchMultipleStocks(symbols) {
    try {
      const allData = await this.api.fetchNGXData();
      
      return symbols.map(symbol => {
        const stock = allData.stocks.find(s => s.symbol === symbol.toUpperCase());
        
        if (stock) {
          return {
            symbol: stock.symbol,
            name: stock.name,
            price: stock.price,
            change: stock.change,
            changePercent: stock.changePercent,
            volume: stock.volume,
            high: stock.high,
            low: stock.low,
            open: stock.open,
            previousClose: stock.previousClose,
            timestamp: stock.timestamp,
            isMock: stock.isMock || false,
            sources: stock.sources || [],
            sector: stock.sector
          };
        }
        
        return null;
      }).filter(Boolean);
    } catch (error) {
      console.error('Error fetching multiple stocks:', error);
      return [];
    }
  }

  // Fetch NGX market summary
  async fetchMarketSummary() {
    try {
      const allData = await this.api.fetchNGXData();
      
      return {
        index: allData.marketSummary.index,
        indexChange: allData.marketSummary.indexChange,
        indexChangePercent: allData.marketSummary.indexChangePercent,
        totalMarketCap: allData.marketSummary.index * 1000000000,
        totalVolume: allData.marketSummary.totalVolume,
        advancers: allData.marketSummary.advancers,
        decliners: allData.marketSummary.decliners,
        unchanged: allData.marketSummary.unchanged,
        timestamp: allData.marketSummary.timestamp,
        sources: allData.sources,
        totalStocks: allData.totalStocks,
        isMock: allData.isMock || false
      };
    } catch (error) {
      console.error('Failed to fetch market summary:', error);
      throw error;
    }
  }

  // Get all available stocks
  async getAllStocks() {
    try {
      const allData = await this.api.fetchNGXData();
      return allData.stocks.map(stock => ({
        symbol: stock.symbol,
        name: stock.name,
        price: stock.price,
        change: stock.change,
        changePercent: stock.changePercent,
        volume: stock.volume,
        high: stock.high,
        low: stock.low,
        open: stock.open,
        previousClose: stock.previousClose,
        timestamp: stock.timestamp,
        isMock: stock.isMock || false,
        sources: stock.sources || [],
        sector: stock.sector
      }));
    } catch (error) {
      console.error('Error fetching all stocks:', error);
      return [];
    }
  }

  // Clear cache
  clearCache() {
    this.api.clearCache();
  }

  // Get API configuration status
  getAPIStatus() {
    return this.api.getConfigStatus();
  }
}

export default new RealNGXDataService();