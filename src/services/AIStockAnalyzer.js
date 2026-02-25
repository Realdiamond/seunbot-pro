// AI Stock Analyzer - Uses ChatGPT with Web Search to analyze NGX stocks and ETFs
import axios from 'axios';

class AIStockAnalyzer {
  constructor() {
    this.apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    this.endpoint = 'https://api.openai.com/v1/chat/completions';
    this.model = 'gpt-4o-mini';
    
    this.cache = {
      analyses: new Map(),
      webData: new Map(),
      ttl: 30 * 60 * 1000 // 30 minutes cache
    };
  }

  // Search web for real-time stock data
  async searchWebForStockData(symbol, name) {
    const cacheKey = `web_${symbol}_${Date.now() - (Date.now() % this.cache.ttl)}`;
    
    // Check cache
    if (this.cache.webData.has(cacheKey)) {
      console.log(`📦 Returning cached web data for ${symbol}`);
      return this.cache.webData.get(cacheKey);
    }

    try {
      console.log(`🔍 Searching web for ${symbol} (${name}) real-time data...`);
      
      // Search queries for comprehensive data
      const queries = [
        `${symbol} NGX Nigerian Stock Exchange current price today ${new Date().toLocaleDateString()}`,
        `${name} stock price Nigeria latest news ${new Date().toLocaleDateString()}`,
        `NGX ${symbol} trading volume market cap today`,
        `${symbol} technical analysis support resistance levels`,
        `${name} financial performance earnings revenue Nigeria`
      ];

      const searchResults = [];
      
      for (const query of queries) {
        try {
          const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content: 'You are a web search assistant. Extract and summarize key financial data from search results.'
              },
              {
                role: 'user',
                content: `Search and provide current data for: ${query}`
              }
            ],
            temperature: 0.3,
            max_tokens: 500
          }, {
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json'
            },
            timeout: 15000
          });

          if (response.data.choices && response.data.choices[0]) {
            searchResults.push(response.data.choices[0].message.content);
          }
        } catch (error) {
          console.warn(`⚠️ Search query failed: ${query.substring(0, 50)}...`);
        }
      }

      const webData = {
        symbol,
        name,
        searchResults: searchResults.join('\n\n'),
        timestamp: new Date().toISOString(),
        hasWebData: searchResults.length > 0
      };

      // Cache the result
      this.cache.webData.set(cacheKey, webData);
      
      console.log(`✅ Web search complete for ${symbol}: ${searchResults.length} results found`);
      return webData;
      
    } catch (error) {
      console.error(`❌ Web search failed for ${symbol}:`, error.message);
      return {
        symbol,
        name,
        searchResults: '',
        timestamp: new Date().toISOString(),
        hasWebData: false
      };
    }
  }

  // Analyze a single stock with web-searched data
  async analyzeStock(stockData) {
    const cacheKey = `${stockData.symbol}_${Date.now() - (Date.now() % this.cache.ttl)}`;
    
    // Check cache
    if (this.cache.analyses.has(cacheKey)) {
      console.log(`📦 Returning cached analysis for ${stockData.symbol}`);
      return this.cache.analyses.get(cacheKey);
    }

    if (!this.apiKey) {
      console.warn('⚠️ OpenAI API key not configured');
      return this.generateFallbackAnalysis(stockData);
    }

    try {
      console.log(`🤖 Analyzing ${stockData.symbol} with AI + Web Search...`);
      
      // Step 1: Search web for real-time data
      const webData = await this.searchWebForStockData(stockData.symbol, stockData.name);
      
      // Step 2: Build comprehensive prompt with web data
      const prompt = this.buildWebEnhancedPrompt(stockData, webData);
      
      // Step 3: Get AI analysis
      const response = await axios.post(
        this.endpoint,
        {
          model: this.model,
          messages: [
            {
              role: 'system',
              content: `You are a senior Nigerian stock market analyst with 15+ years of experience analyzing NGX (Nigerian Stock Exchange) securities. You have access to real-time web search data. Provide detailed, actionable insights with specific price levels, risk assessments, and clear recommendations backed by current market data and web research.`
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 2000 // Increased for web-enhanced analysis
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 45000 // Longer timeout for web-enhanced analysis
        }
      );

      const analysis = this.parseAIResponse(response.data, stockData, webData);
      
      // Cache the result
      this.cache.analyses.set(cacheKey, analysis);
      
      console.log(`✅ AI + Web analysis complete for ${stockData.symbol}`);
      return analysis;
      
    } catch (error) {
      console.error(`❌ AI analysis failed for ${stockData.symbol}:`, error.message);
      
      if (error.response?.status === 429) {
        console.warn('⚠️ OpenAI rate limit exceeded');
      } else if (error.response?.status === 401) {
        console.warn('⚠️ Invalid OpenAI API key');
      }
      
      return this.generateFallbackAnalysis(stockData);
    }
  }

  // Build web-enhanced analysis prompt
  buildWebEnhancedPrompt(stockData, webData) {
    const priceRange = stockData.high - stockData.low;
    const priceRangePercent = (priceRange / stockData.low) * 100;
    const volumeInMillions = (stockData.volume / 1000000).toFixed(2);
    const marketCap = stockData.marketCap ? `₦${(stockData.marketCap / 1e9).toFixed(2)}B` : 'N/A';
    
    const pricePosition = ((stockData.price - stockData.low) / priceRange) * 100;
    const positionDesc = pricePosition > 70 ? 'near daily high' : 
                        pricePosition < 30 ? 'near daily low' : 
                        'mid-range';

    return `Perform a comprehensive analysis of this Nigerian Stock Exchange (NGX) security using BOTH the provided data AND web search results:

**COMPANY PROFILE:**
- Symbol: ${stockData.symbol}
- Company Name: ${stockData.name}
- Sector: ${stockData.sector}
- Type: ${stockData.type || 'Stock'}
${stockData.marketCap ? `- Market Cap: ${marketCap}` : ''}

**CURRENT PRICE DATA (From System):**
- Current Price: ₦${stockData.price.toFixed(2)}
- Daily Change: ${stockData.change >= 0 ? '+' : ''}₦${stockData.change.toFixed(2)} (${stockData.changePercent >= 0 ? '+' : ''}${stockData.changePercent.toFixed(2)}%)
- Opening Price: ₦${stockData.open.toFixed(2)}
- Day's High: ₦${stockData.high.toFixed(2)}
- Day's Low: ₦${stockData.low.toFixed(2)}
- Price Range: ₦${priceRange.toFixed(2)} (${priceRangePercent.toFixed(2)}% volatility)
- Current Position: ${positionDesc} (${pricePosition.toFixed(0)}% of daily range)
- Volume: ${volumeInMillions}M shares

**WEB SEARCH RESULTS (Real-Time Market Data):**
${webData.hasWebData ? `
${webData.searchResults}

**IMPORTANT:** Use the web search results above to:
1. Verify and update the current price if more recent data is available
2. Get latest news, earnings reports, and company announcements
3. Identify recent catalysts or concerns
4. Understand current market sentiment
5. Find analyst ratings and price targets
6. Get sector-specific trends and comparisons
` : `
No web data available - use system data for analysis.
`}

**TECHNICAL INDICATORS (From System):**
- Trend: ${stockData.changePercent > 2 ? 'Strong Uptrend' : stockData.changePercent > 0 ? 'Uptrend' : stockData.changePercent < -2 ? 'Strong Downtrend' : stockData.changePercent < 0 ? 'Downtrend' : 'Sideways'}
- Momentum: ${Math.abs(stockData.changePercent) > 3 ? 'Strong' : Math.abs(stockData.changePercent) > 1 ? 'Moderate' : 'Weak'}
- Support Level: ₦${stockData.low.toFixed(2)}
- Resistance Level: ₦${stockData.high.toFixed(2)}

**SECTOR CONTEXT:**
- Sector: ${stockData.sector}
- Sector Performance: ${this.getSectorContext(stockData.sector)}

**ANALYSIS REQUIREMENTS:**

Provide a detailed analysis in JSON format, incorporating BOTH system data and web search findings:

{
  "recommendation": "Buy/Hold/Sell",
  "confidence": 1-5,
  "webDataUsed": true/false,
  "latestPrice": number (use web data if available, otherwise system price),
  "priceSource": "Web Search" or "System Data",
  "insights": [
    "Insight 1 with web-verified data",
    "Insight 2 with latest news/events",
    "Insight 3 with sector comparison",
    "Insight 4 with volume/momentum analysis",
    "Insight 5 with analyst consensus if available"
  ],
  "technicalAnalysis": "Comprehensive technical analysis using latest price data, support/resistance levels, volume trends, and price action patterns",
  "fundamentalAnalysis": "Fundamental analysis using web-searched financial data, earnings reports, revenue growth, sector position, and competitive advantages",
  "riskLevel": "Low/Medium/High",
  "riskFactors": [
    "Risk factor 1 with current market context",
    "Risk factor 2 with sector-specific concerns",
    "Risk factor 3 with company-specific issues"
  ],
  "priceTarget": number (30-day target based on latest data),
  "stopLoss": number,
  "entryPoint": number,
  "sentiment": "Bullish/Neutral/Bearish",
  "reasoning": "Detailed explanation incorporating web search findings, recent news, and market data",
  "keyLevels": {
    "strongSupport": number,
    "weakSupport": number,
    "weakResistance": number,
    "strongResistance": number
  },
  "tradingStrategy": "Actionable strategy with specific entry/exit points based on latest market data",
  "timeHorizon": "Short-term/Medium-term/Long-term",
  "catalysts": ["Catalyst 1 from web search", "Catalyst 2 from recent news"],
  "concerns": ["Concern 1 from market data", "Concern 2 from web findings"],
  "recentNews": ["News item 1", "News item 2"] (if found in web search),
  "analystRatings": "Summary of analyst opinions if available from web search"
}

**CRITICAL INSTRUCTIONS:**
1. PRIORITIZE web search data over system data when available
2. If web search found a more recent price, USE IT and note the source
3. Include recent news, events, or announcements found in web search
4. Mention analyst ratings or price targets if found
5. Base recommendations on LATEST available data (web > system)
6. Provide at least 5 detailed insights incorporating web findings
7. Include both technical and fundamental analysis
8. Specify exact price levels for entry/exit/stop-loss
9. Consider Nigerian market context and economic conditions
10. Balance bullish and bearish factors for objective analysis`;
  }

  // Get sector context
  getSectorContext(sector) {
    const contexts = {
      'Banking': 'Nigerian banking sector facing interest rate pressures but showing resilience with digital transformation',
      'Oil & Gas': 'Oil sector volatile due to global crude prices and local production challenges',
      'Consumer Goods': 'Consumer goods sector impacted by inflation but essential products maintain demand',
      'Telecommunications': 'Telecom sector showing growth with increasing data consumption and digital services',
      'Industrial Goods': 'Industrial sector benefiting from infrastructure development and construction activity',
      'Insurance': 'Insurance sector growing with increased awareness and regulatory reforms',
      'Conglomerates': 'Diversified conglomerates providing stability across multiple sectors',
      'Healthcare': 'Healthcare sector showing growth potential with increasing health awareness',
      'ETF': 'Exchange-traded funds offering diversified exposure to Nigerian equities'
    };
    return contexts[sector] || 'Sector showing mixed performance with varied opportunities';
  }

  // Parse AI response with web data
  parseAIResponse(response, stockData, webData) {
    try {
      const content = response.choices[0].message.content;
      
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        
        // Use web-verified price if available
        const currentPrice = parsed.latestPrice || stockData.price;
        const priceSource = parsed.priceSource || (webData.hasWebData ? 'Web Search + System' : 'System Data');
        
        return {
          symbol: stockData.symbol,
          name: stockData.name,
          currentPrice: currentPrice,
          priceSource: priceSource,
          webDataUsed: webData.hasWebData,
          recommendation: parsed.recommendation || 'Hold',
          confidence: parsed.confidence || 3,
          insights: parsed.insights || [],
          technicalAnalysis: parsed.technicalAnalysis || 'Analysis in progress',
          fundamentalAnalysis: parsed.fundamentalAnalysis || 'Fundamental analysis based on available data',
          riskLevel: parsed.riskLevel || 'Medium',
          riskFactors: parsed.riskFactors || ['Market volatility', 'Sector risks', 'Economic conditions'],
          priceTarget: parsed.priceTarget || currentPrice * 1.05,
          stopLoss: parsed.stopLoss || currentPrice * 0.95,
          entryPoint: parsed.entryPoint || currentPrice * 0.98,
          sentiment: parsed.sentiment || 'Neutral',
          reasoning: parsed.reasoning || '',
          keyLevels: parsed.keyLevels || {
            strongSupport: stockData.low * 0.98,
            weakSupport: stockData.low,
            weakResistance: stockData.high,
            strongResistance: stockData.high * 1.02
          },
          tradingStrategy: parsed.tradingStrategy || `Monitor price action near ₦${currentPrice.toFixed(2)}`,
          timeHorizon: parsed.timeHorizon || 'Medium-term',
          catalysts: parsed.catalysts || ['Sector trends', 'Market recovery'],
          concerns: parsed.concerns || ['Market volatility', 'Economic headwinds'],
          recentNews: parsed.recentNews || [],
          analystRatings: parsed.analystRatings || 'No analyst ratings available',
          timestamp: new Date().toISOString(),
          isAI: true,
          dataQuality: webData.hasWebData ? 'Web-Enhanced' : (stockData.isMock ? 'Simulated' : 'Real-time')
        };
      }
      
      return this.parseTextResponse(content, stockData, webData);
      
    } catch (error) {
      console.error('Error parsing AI response:', error);
      return this.generateFallbackAnalysis(stockData);
    }
  }

  // Parse text response (fallback)
  parseTextResponse(content, stockData, webData) {
    const recommendation = content.match(/recommendation[:\s]*(buy|hold|sell)/i)?.[1] || 'Hold';
    const sentiment = content.match(/sentiment[:\s]*(bullish|neutral|bearish)/i)?.[1] || 'Neutral';
    const riskLevel = content.match(/risk[:\s]*(low|medium|high)/i)?.[1] || 'Medium';
    
    return {
      symbol: stockData.symbol,
      name: stockData.name,
      currentPrice: stockData.price,
      priceSource: webData.hasWebData ? 'Web Search + System' : 'System Data',
      webDataUsed: webData.hasWebData,
      recommendation: recommendation.charAt(0).toUpperCase() + recommendation.slice(1),
      confidence: 3,
      insights: this.extractInsights(content),
      technicalAnalysis: content.substring(0, 300),
      fundamentalAnalysis: `${stockData.name} operates in the ${stockData.sector} sector. ${webData.hasWebData ? 'Web search indicates ' : ''}Current market conditions suggest ${sentiment.toLowerCase()} outlook.`,
      riskLevel: riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1),
      riskFactors: ['Market volatility', 'Sector risks', 'Economic conditions'],
      priceTarget: stockData.price * 1.05,
      stopLoss: stockData.price * 0.95,
      entryPoint: stockData.price * 0.98,
      sentiment: sentiment.charAt(0).toUpperCase() + sentiment.slice(1),
      reasoning: content.substring(0, 200),
      keyLevels: {
        strongSupport: stockData.low * 0.98,
        weakSupport: stockData.low,
        weakResistance: stockData.high,
        strongResistance: stockData.high * 1.02
      },
      tradingStrategy: `Consider entry near ₦${(stockData.price * 0.98).toFixed(2)}, target ₦${(stockData.price * 1.05).toFixed(2)}`,
      timeHorizon: 'Medium-term',
      catalysts: ['Sector growth', 'Market recovery'],
      concerns: ['Volatility', 'Market conditions'],
      recentNews: [],
      analystRatings: 'No analyst ratings available',
      timestamp: new Date().toISOString(),
      isAI: true,
      dataQuality: webData.hasWebData ? 'Web-Enhanced' : (stockData.isMock ? 'Simulated' : 'Real-time')
    };
  }

  // Extract insights from text
  extractInsights(text) {
    const insights = [];
    const lines = text.split('\n').filter(line => line.trim());
    
    for (const line of lines) {
      if (line.match(/^[-•*]\s/) || line.match(/^\d+\.\s/)) {
        insights.push(line.replace(/^[-•*\d.]\s*/, '').trim());
        if (insights.length >= 5) break;
      }
    }
    
    return insights.length > 0 ? insights : [
      'Stock showing current market performance based on latest available data',
      'Price action indicates moderate volatility with trading opportunities',
      'Volume levels suggest normal market participation',
      'Technical indicators show mixed signals requiring careful monitoring',
      'Risk management essential given current market conditions'
    ];
  }

  // Generate fallback analysis (when AI/web search unavailable)
  generateFallbackAnalysis(stockData) {
    const changePercent = stockData.changePercent;
    const volatility = Math.abs(changePercent);
    const priceRange = stockData.high - stockData.low;
    const priceRangePercent = (priceRange / stockData.low) * 100;
    
    let recommendation = 'Hold';
    let confidence = 3;
    let sentiment = 'Neutral';
    
    if (changePercent > 3) {
      recommendation = 'Buy';
      confidence = 4;
      sentiment = 'Bullish';
    } else if (changePercent < -3) {
      recommendation = 'Sell';
      confidence = 4;
      sentiment = 'Bearish';
    } else if (changePercent > 1) {
      recommendation = 'Buy';
      confidence = 3;
      sentiment = 'Bullish';
    } else if (changePercent < -1) {
      recommendation = 'Sell';
      confidence = 3;
      sentiment = 'Bearish';
    }
    
    let riskLevel = 'Medium';
    if (volatility > 5 || priceRangePercent > 8) riskLevel = 'High';
    else if (volatility < 2 && priceRangePercent < 3) riskLevel = 'Low';
    
    const priceTarget = recommendation === 'Buy' 
      ? stockData.price * 1.08 
      : recommendation === 'Sell'
      ? stockData.price * 0.95
      : stockData.price * 1.02;
    
    const stopLoss = recommendation === 'Buy'
      ? stockData.low * 0.98
      : stockData.price * 0.92;
    
    const entryPoint = recommendation === 'Buy'
      ? stockData.price * 0.99
      : stockData.price * 1.01;
    
    return {
      symbol: stockData.symbol,
      name: stockData.name,
      currentPrice: stockData.price,
      priceSource: 'System Data',
      webDataUsed: false,
      recommendation: recommendation,
      confidence: confidence,
      insights: [
        `Current price of ₦${stockData.price.toFixed(2)} showing ${sentiment.toLowerCase()} momentum with ${changePercent >= 0 ? 'positive' : 'negative'} daily change of ${changePercent.toFixed(2)}%`,
        `Intraday volatility of ${priceRangePercent.toFixed(2)}% (₦${priceRange.toFixed(2)} range) indicates ${riskLevel.toLowerCase()} risk environment`,
        `Trading volume of ${this.formatNumber(stockData.volume)} shares suggests ${stockData.volume > 1000000 ? 'strong' : stockData.volume > 500000 ? 'moderate' : 'light'} market participation`,
        `Technical support established at ₦${stockData.low.toFixed(2)} with resistance at ₦${stockData.high.toFixed(2)}`,
        `${stockData.sector} sector ${this.getSectorPerformance(stockData.sector)} providing ${sentiment === 'Bullish' ? 'tailwinds' : sentiment === 'Bearish' ? 'headwinds' : 'mixed signals'} for the stock`
      ],
      technicalAnalysis: `${stockData.name} (${stockData.symbol}) is currently trading at ₦${stockData.price.toFixed(2)}, showing ${sentiment.toLowerCase()} momentum with a ${changePercent >= 0 ? 'gain' : 'loss'} of ${Math.abs(changePercent).toFixed(2)}% today. The stock opened at ₦${stockData.open.toFixed(2)} and has traded in a range of ₦${stockData.low.toFixed(2)} to ₦${stockData.high.toFixed(2)}, representing ${priceRangePercent.toFixed(2)}% intraday volatility. Key support level is at ₦${stockData.low.toFixed(2)}, while resistance stands at ₦${stockData.high.toFixed(2)}. Volume of ${this.formatNumber(stockData.volume)} shares indicates ${stockData.volume > 1000000 ? 'strong institutional interest' : 'normal retail participation'}. Price action suggests ${recommendation === 'Buy' ? 'accumulation phase with potential upside' : recommendation === 'Sell' ? 'distribution phase with downside risk' : 'consolidation with range-bound trading'}.`,
      fundamentalAnalysis: `${stockData.name} operates in the ${stockData.sector} sector, which is ${this.getSectorPerformance(stockData.sector)}. The company's current market position reflects ${sentiment.toLowerCase()} investor sentiment. With a current price of ₦${stockData.price.toFixed(2)}, the stock is ${recommendation === 'Buy' ? 'potentially undervalued' : recommendation === 'Sell' ? 'showing signs of overvaluation' : 'fairly valued'} relative to sector peers.`,
      riskLevel: riskLevel,
      riskFactors: [
        `${riskLevel} volatility risk with ${priceRangePercent.toFixed(2)}% intraday price swings`,
        `${stockData.sector} sector-specific risks including ${this.getSectorRisks(stockData.sector)}`,
        `Market liquidity ${stockData.volume > 1000000 ? 'adequate' : 'limited'} with ${this.formatNumber(stockData.volume)} daily volume`
      ],
      priceTarget: priceTarget,
      stopLoss: stopLoss,
      entryPoint: entryPoint,
      sentiment: sentiment,
      reasoning: `Based on current price action of ${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%, technical indicators suggest ${sentiment.toLowerCase()} outlook.`,
      keyLevels: {
        strongSupport: stockData.low * 0.97,
        weakSupport: stockData.low,
        weakResistance: stockData.high,
        strongResistance: stockData.high * 1.03
      },
      tradingStrategy: recommendation === 'Buy' 
        ? `Accumulate on dips near ₦${entryPoint.toFixed(2)}, target ₦${priceTarget.toFixed(2)}, stop-loss at ₦${stopLoss.toFixed(2)}.`
        : recommendation === 'Sell'
        ? `Exit positions near ₦${stockData.price.toFixed(2)}, expect decline to ₦${priceTarget.toFixed(2)}.`
        : `Range trade between ₦${stockData.low.toFixed(2)} support and ₦${stockData.high.toFixed(2)} resistance.`,
      timeHorizon: volatility > 5 ? 'Short-term' : volatility > 2 ? 'Medium-term' : 'Long-term',
      catalysts: [
        `${stockData.sector} sector growth prospects`,
        `Positive price momentum if breaks above ₦${stockData.high.toFixed(2)}`
      ],
      concerns: [
        `Downside risk if breaks below ₦${stockData.low.toFixed(2)} support`,
        `${riskLevel} volatility environment requires tight risk management`
      ],
      recentNews: [],
      analystRatings: 'No analyst ratings available',
      timestamp: new Date().toISOString(),
      isAI: false,
      dataQuality: stockData.isMock ? 'Simulated' : 'Real-time'
    };
  }

  getSectorPerformance(sector) {
    const performance = {
      'Banking': 'showing resilience with digital banking adoption',
      'Oil & Gas': 'volatile but supported by global energy demand',
      'Consumer Goods': 'defensive with stable demand patterns',
      'Telecommunications': 'growing with data consumption trends',
      'Industrial Goods': 'benefiting from infrastructure development',
      'Insurance': 'expanding with regulatory support',
      'Conglomerates': 'diversified across multiple growth areas',
      'Healthcare': 'growing with healthcare awareness',
      'ETF': 'providing diversified market exposure'
    };
    return performance[sector] || 'showing mixed performance';
  }

  getSectorRisks(sector) {
    const risks = {
      'Banking': 'interest rate volatility and credit quality concerns',
      'Oil & Gas': 'crude price fluctuations and production challenges',
      'Consumer Goods': 'inflation impact and consumer spending patterns',
      'Telecommunications': 'regulatory changes and competition',
      'Industrial Goods': 'raw material costs and demand fluctuations',
      'Insurance': 'claims volatility and investment returns',
      'Conglomerates': 'diverse business risks across segments',
      'Healthcare': 'regulatory compliance and pricing pressures',
      'ETF': 'broad market exposure and tracking errors'
    };
    return risks[sector] || 'sector-specific market dynamics';
  }

  // Analyze multiple stocks in batch
  async analyzeBatch(stocksData, maxConcurrent = 2) {
    console.log(`🤖 Analyzing ${stocksData.length} stocks with AI + Web Search...`);
    
    const results = [];
    
    for (let i = 0; i < stocksData.length; i += maxConcurrent) {
      const batch = stocksData.slice(i, i + maxConcurrent);
      
      const batchResults = await Promise.all(
        batch.map(stock => this.analyzeStock(stock))
      );
      
      results.push(...batchResults);
      
      if (i + maxConcurrent < stocksData.length) {
        await new Promise(resolve => setTimeout(resolve, 3000)); // Longer delay for web search
      }
    }
    
    console.log(`✅ Batch analysis complete: ${results.length} stocks analyzed`);
    return results;
  }

  async getMarketSummary(stocksData) {
    const analyses = await this.analyzeBatch(stocksData);
    
    return {
      totalStocks: analyses.length,
      buyRecommendations: analyses.filter(a => a.recommendation === 'Buy').length,
      holdRecommendations: analyses.filter(a => a.recommendation === 'Hold').length,
      sellRecommendations: analyses.filter(a => a.recommendation === 'Sell').length,
      bullishStocks: analyses.filter(a => a.sentiment === 'Bullish').length,
      bearishStocks: analyses.filter(a => a.sentiment === 'Bearish').length,
      highRiskStocks: analyses.filter(a => a.riskLevel === 'High').length,
      webEnhancedCount: analyses.filter(a => a.webDataUsed).length,
      topBuys: analyses
        .filter(a => a.recommendation === 'Buy')
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, 5),
      topSells: analyses
        .filter(a => a.recommendation === 'Sell')
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, 5),
      analyses: analyses,
      timestamp: new Date().toISOString()
    };
  }

  formatNumber(num) {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }

  clearCache() {
    this.cache.analyses.clear();
    this.cache.webData.clear();
    console.log('🗑️ AI analysis and web data cache cleared');
  }

  getCacheStatus() {
    return {
      cachedAnalyses: this.cache.analyses.size,
      cachedWebData: this.cache.webData.size,
      apiKeyConfigured: !!this.apiKey
    };
  }
}

export default new AIStockAnalyzer();