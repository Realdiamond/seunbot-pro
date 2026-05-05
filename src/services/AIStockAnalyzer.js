// AI Stock Analyzer
// OpenAI API calls have been removed.
// AI analysis is now sourced exclusively from the SeunBot Heroku backend
// via AIAnalysisEndpointService.js and AIMarketInsightsService.js.

class AIStockAnalyzer {
  async analyzeStock(_stock) {
    console.warn('AIStockAnalyzer: OpenAI removed. Use AIAnalysisEndpointService instead.');
    throw new Error('Direct OpenAI analysis has been removed. Please use the SeunBot backend AI endpoints.');
  }

  isConfigured() {
    return false;
  }
}

export default new AIStockAnalyzer();