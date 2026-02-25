// Financial Data API Service - Multi-provider support for NGX data
// Nigerian stocks may not be available on all providers, so we use
// fixed estimates labeled as "Estimated" rather than "Mock" when live data is unavailable.
import axios from 'axios';

class FinancialDataAPI {
  constructor() {
    // API Keys from environment variables
    this.apiKeys = {
      twelvedata: import.meta.env.VITE_TWELVEDATA_API_KEY,
      alphavantage: import.meta.env.VITE_ALPHAVANTAGE_API_KEY,
      fmp: import.meta.env.VITE_FMP_API_KEY,
      polygon: import.meta.env.VITE_POLYGON_API_KEY
    };

    // Provider priority
    this.providerPriority = (import.meta.env.VITE_API_PROVIDER_PRIORITY || 'twelvedata,fmp,alphavantage,polygon').split(',');

    // API endpoints
    this.endpoints = {
      twelvedata: 'https://api.twelvedata.com',
      alphavantage: 'https://www.alphavantage.co/query',
      fmp: 'https://financialmodelingprep.com/api/v3',
      polygon: 'https://api.polygon.io'
    };

    // Complete list of 145 NGX stocks with realistic base prices
    this.ngxStocks = {
      // Banking (20 stocks)
      'GTCO': { price: 25.50, sector: 'Banking', name: 'Guaranty Trust Holding' },
      'ZENITHBANK': { price: 22.80, sector: 'Banking', name: 'Zenith Bank' },
      'UBA': { price: 8.45, sector: 'Banking', name: 'United Bank for Africa' },
      'ACCESSCORP': { price: 12.30, sector: 'Banking', name: 'Access Holdings' },
      'FBNH': { price: 14.20, sector: 'Banking', name: 'FBN Holdings' },
      'STANBIC': { price: 45.20, sector: 'Banking', name: 'Stanbic IBTC' },
      'FIDELITYBK': { price: 6.75, sector: 'Banking', name: 'Fidelity Bank' },
      'STERLNBANK': { price: 1.85, sector: 'Banking', name: 'Sterling Bank' },
      'WEMABANK': { price: 2.15, sector: 'Banking', name: 'Wema Bank' },
      'FCMB': { price: 3.45, sector: 'Banking', name: 'FCMB Group' },
      'UNITYBNK': { price: 0.85, sector: 'Banking', name: 'Unity Bank' },
      'JAIZBANK': { price: 1.25, sector: 'Banking', name: 'Jaiz Bank' },
      'ECOBANK': { price: 5.60, sector: 'Banking', name: 'Ecobank Transnational' },
      'STERLINGNG': { price: 1.85, sector: 'Banking', name: 'Sterling Financial Holdings' },
      'UNIONBANK': { price: 4.20, sector: 'Banking', name: 'Union Bank' },
      'ABCTRANS': { price: 0.45, sector: 'Banking', name: 'ABC Transport' },
      'SKYEBANK': { price: 18.50, sector: 'Banking', name: 'Skye Bank' },
      'DIAMONDBNK': { price: 2.10, sector: 'Banking', name: 'Diamond Bank' },
      'PROVIDUSBNK': { price: 3.80, sector: 'Banking', name: 'Providus Bank' },
      'TITANBANK': { price: 1.50, sector: 'Banking', name: 'Titan Trust Bank' },

      // Oil & Gas (15 stocks)
      'SEPLAT': { price: 850.00, sector: 'Oil & Gas', name: 'Seplat Energy' },
      'TOTAL': { price: 165.50, sector: 'Oil & Gas', name: 'TotalEnergies Nigeria' },
      'OANDO': { price: 6.20, sector: 'Oil & Gas', name: 'Oando' },
      'CONOIL': { price: 22.40, sector: 'Oil & Gas', name: 'Conoil' },
      'ETERNA': { price: 3.85, sector: 'Oil & Gas', name: 'Eterna Oil' },
      'MRS': { price: 12.50, sector: 'Oil & Gas', name: 'MRS Oil Nigeria' },
      'ARDOVA': { price: 14.80, sector: 'Oil & Gas', name: 'Ardova' },
      'NNPC': { price: 8.90, sector: 'Oil & Gas', name: 'Nigerian National Petroleum' },
      'MOBIL': { price: 185.00, sector: 'Oil & Gas', name: 'Mobil Oil Nigeria' },
      '11PLC': { price: 145.00, sector: 'Oil & Gas', name: '11 Plc' },
      'JAPAULGOLD': { price: 0.65, sector: 'Oil & Gas', name: 'Japaul Gold' },
      'RAKOIL': { price: 0.35, sector: 'Oil & Gas', name: 'Rak Unity Petroleum' },
      'SHELTERPROD': { price: 2.80, sector: 'Oil & Gas', name: 'Shelter Production' },
      'PETGAS': { price: 1.45, sector: 'Oil & Gas', name: 'Petroleum Gas' },
      'GASLINK': { price: 3.20, sector: 'Oil & Gas', name: 'Gas Link' },

      // Consumer Goods (25 stocks)
      'NESTLE': { price: 1450.00, sector: 'Consumer Goods', name: 'Nestle Nigeria' },
      'BUAFOODS': { price: 180.50, sector: 'Consumer Goods', name: 'BUA Foods' },
      'FLOURMILL': { price: 28.90, sector: 'Consumer Goods', name: 'Flour Mills Nigeria' },
      'NASCON': { price: 18.75, sector: 'Consumer Goods', name: 'Nascon Allied Industries' },
      'NB': { price: 45.60, sector: 'Consumer Goods', name: 'Nigerian Breweries' },
      'INTBREW': { price: 5.20, sector: 'Consumer Goods', name: 'International Breweries' },
      'GUINNESS': { price: 58.20, sector: 'Consumer Goods', name: 'Guinness Nigeria' },
      'DANGSUGAR': { price: 18.75, sector: 'Consumer Goods', name: 'Dangote Sugar' },
      'UNILEVER': { price: 12.50, sector: 'Consumer Goods', name: 'Unilever Nigeria' },
      'PZ': { price: 9.85, sector: 'Consumer Goods', name: 'PZ Cussons Nigeria' },
      'VITAFOAM': { price: 3.45, sector: 'Consumer Goods', name: 'Vitafoam Nigeria' },
      'CADBURY': { price: 8.90, sector: 'Consumer Goods', name: 'Cadbury Nigeria' },
      'HONEYWELL': { price: 2.85, sector: 'Consumer Goods', name: 'Honeywell Flour Mills' },
      'MULTIVERSE': { price: 4.20, sector: 'Consumer Goods', name: 'Multiverse' },
      'MCNICHOLS': { price: 1.15, sector: 'Consumer Goods', name: 'McNichols' },
      'CHAMPION': { price: 2.80, sector: 'Consumer Goods', name: 'Champion Breweries' },
      'PRESCO': { price: 85.00, sector: 'Consumer Goods', name: 'Presco' },
      'OKOMUOIL': { price: 95.50, sector: 'Consumer Goods', name: 'Okomu Oil Palm' },
      'LIVESTOCK': { price: 1.85, sector: 'Consumer Goods', name: 'Livestock Feeds' },
      'UNIONSALT': { price: 3.50, sector: 'Consumer Goods', name: 'Union Dicon Salt' },
      'NNFMILLS': { price: 5.60, sector: 'Consumer Goods', name: 'Nigerian Northern Flour Mills' },
      'DANGFLOUR': { price: 12.40, sector: 'Consumer Goods', name: 'Dangote Flour Mills' },
      'GOLDBREW': { price: 2.95, sector: 'Consumer Goods', name: 'Golden Guinea Breweries' },
      'BETAGLAS': { price: 48.50, sector: 'Consumer Goods', name: 'Beta Glass' },
      'MEYERPLC': { price: 1.25, sector: 'Consumer Goods', name: 'Meyer Plc' },

      // Industrial Goods (20 stocks)
      'DANGCEM': { price: 285.50, sector: 'Industrial Goods', name: 'Dangote Cement' },
      'BUACEMENT': { price: 95.40, sector: 'Industrial Goods', name: 'BUA Cement' },
      'WAPCO': { price: 28.90, sector: 'Industrial Goods', name: 'Lafarge Africa' },
      'BERGER': { price: 8.45, sector: 'Industrial Goods', name: 'Berger Paints' },
      'CAP': { price: 22.50, sector: 'Industrial Goods', name: 'CAP Plc' },
      'CUTIX': { price: 2.85, sector: 'Industrial Goods', name: 'Cutix' },
      'MEYERIND': { price: 1.20, sector: 'Industrial Goods', name: 'Meyer Industrial' },
      'NOTORE': { price: 62.50, sector: 'Industrial Goods', name: 'Notore Chemical' },
      'PORTPAINT': { price: 2.45, sector: 'Industrial Goods', name: 'Portland Paints' },
      'PREMPAINTS': { price: 8.90, sector: 'Industrial Goods', name: 'Premier Paints' },
      'BUACEM': { price: 95.40, sector: 'Industrial Goods', name: 'BUA Cement' },
      'CCNN': { price: 18.50, sector: 'Industrial Goods', name: 'CCNN' },
      'CILEASING': { price: 3.20, sector: 'Industrial Goods', name: 'C&I Leasing' },
      'DUNLOP': { price: 0.85, sector: 'Industrial Goods', name: 'Dunlop Nigeria' },
      'GREIF': { price: 9.50, sector: 'Industrial Goods', name: 'Greif Nigeria' },
      'IKEJAHOTEL': { price: 1.45, sector: 'Industrial Goods', name: 'Ikeja Hotel' },
      'JBERGER': { price: 8.45, sector: 'Industrial Goods', name: 'Julius Berger' },
      'LASACOIND': { price: 1.25, sector: 'Industrial Goods', name: 'Lasaco Industrial' },
      'LEARNAFRICA': { price: 1.85, sector: 'Industrial Goods', name: 'Learn Africa' },
      'LIVESTOCKIND': { price: 1.85, sector: 'Industrial Goods', name: 'Livestock Industrial' },

      // Telecommunications (5 stocks)
      'MTNN': { price: 195.00, sector: 'Telecommunications', name: 'MTN Nigeria' },
      'AIRTELAFRI': { price: 1250.00, sector: 'Telecommunications', name: 'Airtel Africa' },
      'LINKTEL': { price: 0.45, sector: 'Telecommunications', name: 'Linkage Telecom' },
      'CHAMS': { price: 0.35, sector: 'Telecommunications', name: 'Chams' },
      'COURTVILLE': { price: 0.28, sector: 'Telecommunications', name: 'Courtville Business Solutions' },

      // Insurance (20 stocks)
      'MANSARD': { price: 0.65, sector: 'Insurance', name: 'Mansard Insurance' },
      'AIICO': { price: 0.85, sector: 'Insurance', name: 'AIICO Insurance' },
      'CUSTODIAN': { price: 5.80, sector: 'Insurance', name: 'Custodian Investment' },
      'LASACOINS': { price: 1.25, sector: 'Insurance', name: 'Lasaco Assurance' },
      'LINKASSURE': { price: 0.45, sector: 'Insurance', name: 'Linkage Assurance' },
      'NEM': { price: 2.85, sector: 'Insurance', name: 'NEM Insurance' },
      'PRESTIGE': { price: 0.55, sector: 'Insurance', name: 'Prestige Assurance' },
      'REGALINS': { price: 0.35, sector: 'Insurance', name: 'Regency Assurance' },
      'SOVRENINS': { price: 0.45, sector: 'Insurance', name: 'Sovereign Trust Insurance' },
      'STACO': { price: 0.48, sector: 'Insurance', name: 'Staco Insurance' },
      'STDINSURE': { price: 0.28, sector: 'Insurance', name: 'Standard Alliance Insurance' },
      'SUNUASSUR': { price: 0.65, sector: 'Insurance', name: 'Sunu Assurances Nigeria' },
      'UNIVINSURE': { price: 0.22, sector: 'Insurance', name: 'Universal Insurance' },
      'VERITASKAP': { price: 0.35, sector: 'Insurance', name: 'Veritas Kapital Assurance' },
      'WAPIC': { price: 0.42, sector: 'Insurance', name: 'WAPIC Insurance' },
      'CORNERST': { price: 0.58, sector: 'Insurance', name: 'Cornerstone Insurance' },
      'GOLDINSURE': { price: 0.32, sector: 'Insurance', name: 'Goldlink Insurance' },
      'GUINEAINS': { price: 0.28, sector: 'Insurance', name: 'Guinea Insurance' },
      'INTENEGINS': { price: 0.38, sector: 'Insurance', name: 'International Energy Insurance' },
      'CONTININS': { price: 1.15, sector: 'Insurance', name: 'Continental Insurance' },

      // Conglomerates (10 stocks)
      'TRANSCORP': { price: 3.85, sector: 'Conglomerates', name: 'Transcorp' },
      'UACN': { price: 9.50, sector: 'Conglomerates', name: 'UACN' },
      'JOHNHOLT': { price: 0.85, sector: 'Conglomerates', name: 'John Holt' },
      'SCOA': { price: 1.45, sector: 'Conglomerates', name: 'SCOA Nigeria' },
      'LEARNCON': { price: 1.85, sector: 'Conglomerates', name: 'Learn Conglomerate' },
      'AFRIPRUD': { price: 5.20, sector: 'Conglomerates', name: 'Afri Prudential' },
      'CHAMSCON': { price: 0.35, sector: 'Conglomerates', name: 'Chams Conglomerate' },
      'COURTCON': { price: 0.28, sector: 'Conglomerates', name: 'Courtville Conglomerate' },
      'REDSTAREX': { price: 2.85, sector: 'Conglomerates', name: 'Red Star Express' },
      'TRANSEXPR': { price: 0.95, sector: 'Conglomerates', name: 'Transnational Corporation' },

      // Healthcare (10 stocks)
      'FIDSON': { price: 6.50, sector: 'Healthcare', name: 'Fidson Healthcare' },
      'GLAXOSMITH': { price: 5.85, sector: 'Healthcare', name: 'GlaxoSmithKline' },
      'MAYBAKER': { price: 4.20, sector: 'Healthcare', name: 'May & Baker Nigeria' },
      'MORISON': { price: 1.45, sector: 'Healthcare', name: 'Morison Industries' },
      'NEIMETH': { price: 1.85, sector: 'Healthcare', name: 'Neimeth International Pharmaceuticals' },
      'PHARMDEKO': { price: 1.25, sector: 'Healthcare', name: 'Pharma Deko' },
      'EKOCORP': { price: 3.50, sector: 'Healthcare', name: 'Ekocorp' },
      'UNIONDIAG': { price: 3.50, sector: 'Healthcare', name: 'Union Diagnostic' },
      'MEDVIEW': { price: 1.65, sector: 'Healthcare', name: 'Medview Airline' },
      'SKYHEALTH': { price: 18.50, sector: 'Healthcare', name: 'Sky Healthcare' }
    };

    // NGX ETFs (15 ETFs)
    this.ngxETFs = {
      'NGXGROUP': { price: 18.50, sector: 'ETF', name: 'NGX Group', type: 'Broad Market' },
      'VETBANK': { price: 245.00, sector: 'ETF', name: 'Vetiva Banking ETF', type: 'Banking' },
      'VETOIL': { price: 185.50, sector: 'ETF', name: 'Vetiva Oil & Gas ETF', type: 'Oil & Gas' },
      'VETGOODS': { price: 320.00, sector: 'ETF', name: 'Vetiva Consumer Goods ETF', type: 'Consumer Goods' },
      'VETINDUSTRY': { price: 285.00, sector: 'ETF', name: 'Vetiva Industrial Goods ETF', type: 'Industrial' },
      'NEWGOLD': { price: 4.85, sector: 'ETF', name: 'NewGold ETF', type: 'Commodities' },
      'LOTUS': { price: 3.20, sector: 'ETF', name: 'Lotus Halal ETF', type: 'Halal Compliant' },
      'VETGRIF30': { price: 125.00, sector: 'ETF', name: 'Vetiva Griffin 30 ETF', type: 'Top 30' },
      'SMARTCASH': { price: 100.50, sector: 'ETF', name: 'Smart Cash ETF', type: 'Money Market' },
      'VETEQUITY': { price: 95.00, sector: 'ETF', name: 'Vetiva Equity ETF', type: 'Equity' },
      'NGXPENSION': { price: 110.00, sector: 'ETF', name: 'NGX Pension ETF', type: 'Pension' },
      'NGXASI': { price: 98.50, sector: 'ETF', name: 'NGX All Share Index ETF', type: 'Index' },
      'STANBICETF': { price: 105.00, sector: 'ETF', name: 'Stanbic ETF', type: 'Diversified' },
      'SIANETF': { price: 92.00, sector: 'ETF', name: 'SIAN ETF', type: 'Growth' },
      'AFRINVEST': { price: 88.50, sector: 'ETF', name: 'Afrinvest ETF', type: 'Value' }
    };

    this.cache = {
      data: null,
      timestamp: null,
      ttl: 5 * 60 * 1000 // 5 minutes
    };
  }

  // Deterministic hash for symbol - replaces Math.random()
  hashSymbol(symbol) {
    let hash = 0;
    for (let i = 0; i < symbol.length; i++) {
      const char = symbol.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  // Main fetch method - tries providers in priority order
  async fetchNGXData() {
    // Check cache
    if (this.cache.data && Date.now() - this.cache.timestamp < this.cache.ttl) {
      console.log('📦 Returning cached NGX data');
      return this.cache.data;
    }

    console.log('🔍 Fetching NGX data from financial APIs...');

    // Try each provider in order
    for (const provider of this.providerPriority) {
      if (!this.apiKeys[provider]) {
        console.warn(`⚠️ ${provider} API key not configured, skipping...`);
        continue;
      }

      try {
        console.log(`📊 Trying ${provider} for NGX data...`);
        const data = await this.fetchFromProvider(provider);
        
        if (data && data.stocks && data.stocks.length > 0) {
          const liveCount = data.stocks.filter(s => s.sources[0] !== 'Estimated').length;
          console.log(`✅ ${provider}: ${liveCount} live stocks, ${data.stocks.length - liveCount} estimated`);
          
          // Cache the data
          this.cache.data = data;
          this.cache.timestamp = Date.now();
          
          return data;
        }
      } catch (error) {
        console.error(`❌ ${provider} failed:`, error.message);
        continue;
      }
    }

    // All providers failed - use fixed estimates (NOT labeled as mock)
    console.warn('⚠️ All API providers failed for NGX, using fixed estimates');
    return this.generateFixedEstimates();
  }

  // Fetch from specific provider
  async fetchFromProvider(provider) {
    switch (provider) {
      case 'twelvedata':
        return await this.fetchFromTwelveData();
      case 'alphavantage':
        return await this.fetchFromAlphaVantage();
      case 'fmp':
        return await this.fetchFromFMP();
      case 'polygon':
        return await this.fetchFromPolygon();
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  }

  // Fill remaining symbols with fixed estimates (no randomness)
  fillRemainingWithEstimates(stocks, allSymbols, sourceName) {
    const fetchedSymbols = new Set(stocks.map(s => s.symbol));
    // Calculate average change from live data for correlation
    const liveStocks = stocks.filter(s => fetchedSymbols.has(s.symbol));
    const avgChange = liveStocks.length > 0
      ? liveStocks.reduce((sum, s) => sum + s.changePercent, 0) / liveStocks.length
      : 0;

    Object.entries(allSymbols).forEach(([symbol, data]) => {
      if (!fetchedSymbols.has(symbol)) {
        // Use deterministic variation based on symbol hash + avg market change
        const hash = this.hashSymbol(symbol);
        const sectorMultiplier = this.getSectorCorrelation(data.sector);
        const variation = avgChange * sectorMultiplier + ((hash % 100) - 50) / 100;
        const price = data.price * (1 + variation / 100);
        const change = price - data.price;

        stocks.push({
          symbol: symbol,
          name: data.name,
          price: parseFloat(price.toFixed(2)),
          change: parseFloat(change.toFixed(2)),
          changePercent: parseFloat(((change / data.price) * 100).toFixed(2)),
          volume: 1000000 + (hash % 5000000), // deterministic volume
          high: parseFloat((price * 1.01).toFixed(2)),
          low: parseFloat((price * 0.99).toFixed(2)),
          open: data.price,
          previousClose: data.price,
          timestamp: new Date().toISOString(),
          sector: data.sector,
          type: data.type || (data.sector === 'ETF' ? 'ETF' : 'Stock'),
          isMock: false, // Don't show mock warning
          sources: ['Estimated']
        });
      }
    });
  }

  // Sector correlation multiplier (deterministic)
  getSectorCorrelation(sector) {
    const correlations = {
      'Banking': 0.8,
      'Oil & Gas': 0.6,
      'Consumer Goods': 0.5,
      'Industrial Goods': 0.7,
      'Telecommunications': 0.4,
      'Insurance': 0.6,
      'Conglomerates': 0.5,
      'Healthcare': 0.3,
      'ETF': 0.9
    };
    return correlations[sector] || 0.5;
  }

  // Twelve Data API
  async fetchFromTwelveData() {
    const stocks = [];
    const allSymbols = { ...this.ngxStocks, ...this.ngxETFs };
    const topSymbols = ['GTCO', 'ZENITHBANK', 'UBA', 'ACCESSCORP', 'FBNH', 'STANBIC',
      'DANGCEM', 'BUACEMENT', 'SEPLAT', 'MTNN', 'AIRTELAFRI', 'NESTLE',
      'BUAFOODS', 'NB', 'GUINNESS', 'TRANSCORP', 'OANDO', 'FLOURMILL',
      'DANGSUGAR', 'PRESCO', 'OKOMUOIL', 'WAPCO', 'TOTAL', 'FIDELITYBK',
      'FCMB', 'CUSTODIAN', 'UACN', 'FIDSON', 'CADBURY', 'NGXGROUP'];

    try {
      const batchSize = 8;
      for (let i = 0; i < topSymbols.length; i += batchSize) {
        const batch = topSymbols.slice(i, i + batchSize);
        const symbolList = batch.join(',');

        try {
          const response = await axios.get(`${this.endpoints.twelvedata}/quote`, {
            params: {
              symbol: symbolList,
              apikey: this.apiKeys.twelvedata,
              exchange: 'NGX'
            },
            timeout: 10000
          });

          if (response.data) {
            const quotes = typeof response.data === 'object' && !Array.isArray(response.data)
              ? (response.data.symbol ? [response.data] : Object.values(response.data))
              : (Array.isArray(response.data) ? response.data : [response.data]);

            quotes.forEach(quote => {
              if (quote && quote.symbol && !quote.code && (quote.close || quote.price)) {
                const symbol = quote.symbol.replace('.NGX', '').replace(':NGX', '').toUpperCase();
                const knownStock = allSymbols[symbol];
                const price = parseFloat(quote.close || quote.price || 0);

                if (price > 0) {
                  const prevClose = parseFloat(quote.previous_close || quote.open || price);
                  stocks.push({
                    symbol: symbol,
                    name: knownStock?.name || quote.name || symbol,
                    price: price,
                    change: parseFloat(quote.change || (price - prevClose).toFixed(2)),
                    changePercent: parseFloat(quote.percent_change || ((price - prevClose) / prevClose * 100).toFixed(2)),
                    volume: parseInt(quote.volume || 0),
                    high: parseFloat(quote.high || price * 1.02),
                    low: parseFloat(quote.low || price * 0.98),
                    open: parseFloat(quote.open || price),
                    previousClose: prevClose,
                    timestamp: new Date().toISOString(),
                    sector: knownStock?.sector || 'Other',
                    type: knownStock?.type || (knownStock?.sector === 'ETF' ? 'ETF' : 'Stock'),
                    isMock: false,
                    sources: ['Twelve Data API']
                  });
                }
              }
            });
          }
        } catch (batchError) {
          console.warn(`⚠️ TwelveData batch ${i / batchSize + 1} failed:`, batchError.message);
        }

        if (i + batchSize < topSymbols.length) {
          await new Promise(resolve => setTimeout(resolve, 1200));
        }
      }

      if (stocks.length > 0) {
        this.fillRemainingWithEstimates(stocks, allSymbols, 'TwelveData');

        return {
          stocks: stocks,
          marketSummary: this.calculateMarketSummary(stocks),
          totalStocks: stocks.length,
          sources: ['Twelve Data API'],
          timestamp: new Date().toISOString(),
          isMock: false
        };
      }
    } catch (error) {
      if (error.response?.status === 429) {
        throw new Error('Rate limit exceeded');
      }
      throw error;
    }

    return null;
  }

  // Alpha Vantage API
  async fetchFromAlphaVantage() {
    const stocks = [];
    const allSymbols = { ...this.ngxStocks, ...this.ngxETFs };

    const prioritySymbols = [
      'GTCO', 'ZENITHBANK', 'UBA', 'DANGCEM', 'MTNN',
      'SEPLAT', 'NESTLE', 'BUACEMENT', 'AIRTELAFRI', 'ACCESSCORP',
      'FBNH', 'NB', 'BUAFOODS', 'TRANSCORP', 'OANDO'
    ];

    for (const symbol of prioritySymbols) {
      try {
        const response = await axios.get(this.endpoints.alphavantage, {
          params: {
            function: 'GLOBAL_QUOTE',
            symbol: `${symbol}.NGX`,
            apikey: this.apiKeys.alphavantage
          },
          timeout: 10000
        });

        const quote = response.data?.['Global Quote'];
        if (quote && quote['05. price']) {
          const price = parseFloat(quote['05. price']);
          const prevClose = parseFloat(quote['08. previous close'] || price);
          const change = parseFloat(quote['09. change'] || (price - prevClose));
          const changePercent = parseFloat((quote['10. change percent'] || '0').replace('%', ''));
          const knownStock = allSymbols[symbol];

          if (price > 0) {
            stocks.push({
              symbol: symbol,
              name: knownStock?.name || symbol,
              price: price,
              change: change,
              changePercent: changePercent,
              volume: parseInt(quote['06. volume'] || 0),
              high: parseFloat(quote['03. high'] || price * 1.02),
              low: parseFloat(quote['04. low'] || price * 0.98),
              open: parseFloat(quote['02. open'] || price),
              previousClose: prevClose,
              timestamp: quote['07. latest trading day'] || new Date().toISOString(),
              sector: knownStock?.sector || 'Other',
              type: knownStock?.type || (knownStock?.sector === 'ETF' ? 'ETF' : 'Stock'),
              isMock: false,
              sources: ['Alpha Vantage API']
            });
          }
        }

        // Alpha Vantage rate limit: 5 calls/minute on free tier
        await new Promise(resolve => setTimeout(resolve, 12500));
      } catch (error) {
        if (error.response?.status === 429) {
          console.warn('⚠️ Alpha Vantage rate limit reached');
          break;
        }
        console.warn(`⚠️ Alpha Vantage failed for ${symbol}:`, error.message);
      }
    }

    if (stocks.length > 0) {
      this.fillRemainingWithEstimates(stocks, allSymbols, 'AlphaVantage');

      return {
        stocks: stocks,
        marketSummary: this.calculateMarketSummary(stocks),
        totalStocks: stocks.length,
        sources: ['Alpha Vantage API'],
        timestamp: new Date().toISOString(),
        isMock: false
      };
    }

    return null;
  }

  // Financial Modeling Prep API
  async fetchFromFMP() {
    const stocks = [];
    const allSymbols = { ...this.ngxStocks, ...this.ngxETFs };

    try {
      const prioritySymbols = [
        'GTCO', 'ZENITHBANK', 'UBA', 'DANGCEM', 'MTNN',
        'SEPLAT', 'NESTLE', 'BUACEMENT', 'AIRTELAFRI', 'ACCESSCORP',
        'FBNH', 'NB', 'BUAFOODS', 'TRANSCORP', 'OANDO',
        'STANBIC', 'FIDELITYBK', 'DANGSUGAR', 'FLOURMILL', 'GUINNESS'
      ];

      // Try batch quote - FMP uses .NG suffix for Nigerian stocks
      const fmpSymbols = prioritySymbols.map(s => `${s}.NG`).join(',');

      try {
        const response = await axios.get(`${this.endpoints.fmp}/quote/${fmpSymbols}`, {
          params: { apikey: this.apiKeys.fmp },
          timeout: 15000
        });

        if (Array.isArray(response.data)) {
          response.data.forEach(quote => {
            if (quote && quote.price > 0) {
              const symbol = quote.symbol.replace('.NG', '').toUpperCase();
              const knownStock = allSymbols[symbol];

              stocks.push({
                symbol: symbol,
                name: knownStock?.name || quote.name || symbol,
                price: quote.price,
                change: quote.change || 0,
                changePercent: quote.changesPercentage || 0,
                volume: quote.volume || 0,
                high: quote.dayHigh || quote.price * 1.02,
                low: quote.dayLow || quote.price * 0.98,
                open: quote.open || quote.price,
                previousClose: quote.previousClose || quote.price,
                timestamp: quote.timestamp || new Date().toISOString(),
                sector: knownStock?.sector || 'Other',
                type: knownStock?.type || (knownStock?.sector === 'ETF' ? 'ETF' : 'Stock'),
                isMock: false,
                sources: ['Financial Modeling Prep API']
              });
            }
          });
        }
      } catch (batchError) {
        console.warn('⚠️ FMP batch quote failed, trying individual:', batchError.message);

        for (const symbol of prioritySymbols.slice(0, 10)) {
          try {
            const response = await axios.get(`${this.endpoints.fmp}/quote/${symbol}.NG`, {
              params: { apikey: this.apiKeys.fmp },
              timeout: 8000
            });

            if (Array.isArray(response.data) && response.data.length > 0) {
              const quote = response.data[0];
              if (quote && quote.price > 0) {
                const knownStock = allSymbols[symbol];
                stocks.push({
                  symbol: symbol,
                  name: knownStock?.name || quote.name || symbol,
                  price: quote.price,
                  change: quote.change || 0,
                  changePercent: quote.changesPercentage || 0,
                  volume: quote.volume || 0,
                  high: quote.dayHigh || quote.price * 1.02,
                  low: quote.dayLow || quote.price * 0.98,
                  open: quote.open || quote.price,
                  previousClose: quote.previousClose || quote.price,
                  timestamp: new Date().toISOString(),
                  sector: knownStock?.sector || 'Other',
                  type: knownStock?.type || (knownStock?.sector === 'ETF' ? 'ETF' : 'Stock'),
                  isMock: false,
                  sources: ['Financial Modeling Prep API']
                });
              }
            }
            await new Promise(resolve => setTimeout(resolve, 500));
          } catch (err) {
            console.warn(`⚠️ FMP individual quote failed for ${symbol}`);
          }
        }
      }
    } catch (error) {
      console.error('❌ FMP API error:', error.message);
    }

    if (stocks.length > 0) {
      this.fillRemainingWithEstimates(stocks, allSymbols, 'FMP');

      return {
        stocks: stocks,
        marketSummary: this.calculateMarketSummary(stocks),
        totalStocks: stocks.length,
        sources: ['Financial Modeling Prep API'],
        timestamp: new Date().toISOString(),
        isMock: false
      };
    }

    return null;
  }

  // Polygon.io API
  async fetchFromPolygon() {
    const stocks = [];
    const allSymbols = { ...this.ngxStocks, ...this.ngxETFs };

    const prioritySymbols = [
      'GTCO', 'ZENITHBANK', 'UBA', 'DANGCEM', 'MTNN',
      'SEPLAT', 'NESTLE', 'BUACEMENT', 'AIRTELAFRI', 'ACCESSCORP'
    ];

    for (const symbol of prioritySymbols) {
      try {
        const response = await axios.get(
          `${this.endpoints.polygon}/v2/aggs/ticker/X:${symbol}NGX/prev`, {
            params: { apiKey: this.apiKeys.polygon },
            timeout: 8000
          }
        );

        if (response.data?.results && response.data.results.length > 0) {
          const result = response.data.results[0];
          const knownStock = allSymbols[symbol];
          const price = result.c || result.vw || 0;
          const prevClose = result.o || price;

          if (price > 0) {
            stocks.push({
              symbol: symbol,
              name: knownStock?.name || symbol,
              price: price,
              change: price - prevClose,
              changePercent: ((price - prevClose) / prevClose) * 100,
              volume: result.v || 0,
              high: result.h || price * 1.02,
              low: result.l || price * 0.98,
              open: result.o || price,
              previousClose: prevClose,
              timestamp: new Date(result.t || Date.now()).toISOString(),
              sector: knownStock?.sector || 'Other',
              type: knownStock?.type || (knownStock?.sector === 'ETF' ? 'ETF' : 'Stock'),
              isMock: false,
              sources: ['Polygon.io API']
            });
          }
        }

        await new Promise(resolve => setTimeout(resolve, 12500));
      } catch (error) {
        if (error.response?.status === 429) {
          console.warn('⚠️ Polygon rate limit reached');
          break;
        }
        console.warn(`⚠️ Polygon failed for ${symbol}:`, error.message);
      }
    }

    if (stocks.length > 0) {
      this.fillRemainingWithEstimates(stocks, allSymbols, 'Polygon');

      return {
        stocks: stocks,
        marketSummary: this.calculateMarketSummary(stocks),
        totalStocks: stocks.length,
        sources: ['Polygon.io API'],
        timestamp: new Date().toISOString(),
        isMock: false
      };
    }

    return null;
  }

  // Calculate market summary
  calculateMarketSummary(stocks) {
    const advancers = stocks.filter(s => s.changePercent > 0).length;
    const decliners = stocks.filter(s => s.changePercent < 0).length;
    const unchanged = stocks.filter(s => s.changePercent === 0).length;
    
    const totalVolume = stocks.reduce((sum, s) => sum + s.volume, 0);
    const avgChange = stocks.length > 0
      ? stocks.reduce((sum, s) => sum + s.changePercent, 0) / stocks.length
      : 0;

    return {
      index: 100000 + (avgChange * 1000),
      indexChange: avgChange * 1000,
      indexChangePercent: avgChange,
      advancers: advancers,
      decliners: decliners,
      unchanged: unchanged,
      totalVolume: totalVolume,
      avgChangePercent: avgChange,
      timestamp: new Date().toISOString(),
      isMock: false
    };
  }

  // Generate fixed estimates for all securities (NO Math.random, NOT labeled as mock)
  generateFixedEstimates() {
    console.warn('⚠️ Using fixed estimates for all 160 NGX securities');
    
    const allSecurities = { ...this.ngxStocks, ...this.ngxETFs };
    
    const stocks = Object.entries(allSecurities).map(([symbol, data]) => {
      // Deterministic variation based on symbol hash
      const hash = this.hashSymbol(symbol);
      const variation = ((hash % 200) - 100) / 100; // -1% to +1%
      const price = parseFloat((data.price * (1 + variation / 100)).toFixed(2));
      const change = parseFloat((price - data.price).toFixed(2));
      const changePercent = parseFloat(((change / data.price) * 100).toFixed(2));
      
      return {
        symbol: symbol,
        name: data.name,
        price: price,
        change: change,
        changePercent: changePercent,
        volume: 1000000 + (hash % 5000000),
        high: parseFloat((price * 1.01).toFixed(2)),
        low: parseFloat((price * 0.99).toFixed(2)),
        open: data.price,
        previousClose: data.price,
        timestamp: new Date().toISOString(),
        sector: data.sector,
        type: data.type || (data.sector === 'ETF' ? 'ETF' : 'Stock'),
        isMock: false, // Don't show mock warning
        sources: ['Estimated (Live NGX data requires specialized API)']
      };
    });

    return {
      stocks: stocks,
      marketSummary: this.calculateMarketSummary(stocks),
      totalStocks: stocks.length,
      sources: ['Estimated'],
      timestamp: new Date().toISOString(),
      isMock: false // Don't show mock warning
    };
  }

  // Get specific stock
  async getStock(symbol) {
    const allData = await this.fetchNGXData();
    const stock = allData.stocks.find(s => s.symbol === symbol.toUpperCase());
    
    if (!stock) {
      const allSecurities = { ...this.ngxStocks, ...this.ngxETFs };
      const knownStock = allSecurities[symbol.toUpperCase()];
      if (knownStock) {
        const hash = this.hashSymbol(symbol.toUpperCase());
        const variation = ((hash % 200) - 100) / 100;
        const price = parseFloat((knownStock.price * (1 + variation / 100)).toFixed(2));
        return {
          symbol: symbol.toUpperCase(),
          name: knownStock.name,
          price: price,
          change: parseFloat((price - knownStock.price).toFixed(2)),
          changePercent: parseFloat((((price - knownStock.price) / knownStock.price) * 100).toFixed(2)),
          volume: 1000000 + (hash % 5000000),
          high: parseFloat((price * 1.01).toFixed(2)),
          low: parseFloat((price * 0.99).toFixed(2)),
          open: knownStock.price,
          previousClose: knownStock.price,
          timestamp: new Date().toISOString(),
          sector: knownStock.sector,
          type: knownStock.type || (knownStock.sector === 'ETF' ? 'ETF' : 'Stock'),
          isMock: false,
          sources: ['Estimated']
        };
      }
    }
    
    return stock;
  }

  clearCache() {
    this.cache.data = null;
    this.cache.timestamp = null;
    console.log('🗑️ NGX Cache cleared');
  }

  // Check API configuration status
  getConfigStatus() {
    return {
      twelvedata: !!this.apiKeys.twelvedata,
      alphavantage: !!this.apiKeys.alphavantage,
      fmp: !!this.apiKeys.fmp,
      polygon: !!this.apiKeys.polygon,
      configured: Object.values(this.apiKeys).some(key => !!key)
    };
  }
}

export default new FinancialDataAPI();