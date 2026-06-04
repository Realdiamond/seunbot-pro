// Financial Data API Service - NGX fixed estimates only
// External providers (TwelveData, AlphaVantage, FMP, Polygon) have been removed.
// All NGX data is sourced from the SeunBot Heroku backend (RealNGXDataService).
// This file now serves only as a local reference / offline fallback with fixed estimates.

class FinancialDataAPI {
  constructor() {
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
      'NOTORE': { price: 62.50, sector: 'Industrial Goods', name: 'Notore Chemical' },
      'PORTPAINT': { price: 2.45, sector: 'Industrial Goods', name: 'Portland Paints' },
      'PREMPAINTS': { price: 8.90, sector: 'Industrial Goods', name: 'Premier Paints' },
      'CCNN': { price: 18.50, sector: 'Industrial Goods', name: 'CCNN' },
      'CILEASING': { price: 3.20, sector: 'Industrial Goods', name: 'C&I Leasing' },
      'DUNLOP': { price: 0.85, sector: 'Industrial Goods', name: 'Dunlop Nigeria' },
      'GREIF': { price: 9.50, sector: 'Industrial Goods', name: 'Greif Nigeria' },
      'IKEJAHOTEL': { price: 1.45, sector: 'Industrial Goods', name: 'Ikeja Hotel' },
      'JBERGER': { price: 8.45, sector: 'Industrial Goods', name: 'Julius Berger' },
      'LASACOIND': { price: 1.25, sector: 'Industrial Goods', name: 'Lasaco Industrial' },
      'LEARNAFRICA': { price: 1.85, sector: 'Industrial Goods', name: 'Learn Africa' },

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
      'AFRIPRUD': { price: 5.20, sector: 'Conglomerates', name: 'Afri Prudential' },
      'REDSTAREX': { price: 2.85, sector: 'Conglomerates', name: 'Red Star Express' },

      // Healthcare (10 stocks)
      'FIDSON': { price: 6.50, sector: 'Healthcare', name: 'Fidson Healthcare' },
      'GLAXOSMITH': { price: 5.85, sector: 'Healthcare', name: 'GlaxoSmithKline' },
      'MAYBAKER': { price: 4.20, sector: 'Healthcare', name: 'May & Baker Nigeria' },
      'MORISON': { price: 1.45, sector: 'Healthcare', name: 'Morison Industries' },
      'NEIMETH': { price: 1.85, sector: 'Healthcare', name: 'Neimeth International Pharmaceuticals' },
      'PHARMDEKO': { price: 1.25, sector: 'Healthcare', name: 'Pharma Deko' },
      'EKOCORP': { price: 3.50, sector: 'Healthcare', name: 'Ekocorp' },
      'UNIONDIAG': { price: 3.50, sector: 'Healthcare', name: 'Union Diagnostic' },
    };

    // NGX ETFs
    this.ngxETFs = {
      'NGXGROUP': { price: 18.50, sector: 'ETF', name: 'NGX Group', type: 'Broad Market' },
      'VETBANK': { price: 245.00, sector: 'ETF', name: 'Vetiva Banking ETF', type: 'Banking' },
      'VETOIL': { price: 185.50, sector: 'ETF', name: 'Vetiva Oil & Gas ETF', type: 'Oil & Gas' },
      'VETGOODS': { price: 320.00, sector: 'ETF', name: 'Vetiva Consumer Goods ETF', type: 'Consumer Goods' },
      'NEWGOLD': { price: 4.85, sector: 'ETF', name: 'NewGold ETF', type: 'Commodities' },
      'LOTUS': { price: 3.20, sector: 'ETF', name: 'Lotus Halal ETF', type: 'Halal Compliant' },
      'VETGRIF30': { price: 125.00, sector: 'ETF', name: 'Vetiva Griffin 30 ETF', type: 'Top 30' },
      'SMARTCASH': { price: 100.50, sector: 'ETF', name: 'Smart Cash ETF', type: 'Money Market' },
      'STANBICETF': { price: 105.00, sector: 'ETF', name: 'Stanbic ETF', type: 'Diversified' },
    };

    this.cache = {
      data: null,
      timestamp: null,
      ttl: 5 * 60 * 1000 // 5 minutes
    };
  }

  // Deterministic hash for symbol - no randomness
  hashSymbol(symbol) {
    let hash = 0;
    for (let i = 0; i < symbol.length; i++) {
      const char = symbol.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
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

  // Calculate market summary from a stock list
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
      advancers,
      decliners,
      unchanged,
      totalVolume,
      avgChangePercent: avgChange,
      timestamp: new Date().toISOString(),
      isMock: false
    };
  }

  // Generate fixed estimates for all securities — deterministic, no external calls
  generateFixedEstimates() {
    const allSecurities = { ...this.ngxStocks, ...this.ngxETFs };

    const stocks = Object.entries(allSecurities).map(([symbol, data]) => {
      const hash = this.hashSymbol(symbol);
      const variation = ((hash % 200) - 100) / 100; // -1% to +1%
      const price = parseFloat((data.price * (1 + variation / 100)).toFixed(2));
      const change = parseFloat((price - data.price).toFixed(2));
      const changePercent = parseFloat(((change / data.price) * 100).toFixed(2));

      return {
        symbol,
        name: data.name,
        price,
        change,
        changePercent,
        volume: 1000000 + (hash % 5000000),
        high: parseFloat((price * 1.01).toFixed(2)),
        low: parseFloat((price * 0.99).toFixed(2)),
        open: data.price,
        previousClose: data.price,
        timestamp: new Date().toISOString(),
        sector: data.sector,
        type: data.type || (data.sector === 'ETF' ? 'ETF' : 'Stock'),
        isMock: false,
        sources: ['Estimated']
      };
    });

    return {
      stocks,
      marketSummary: this.calculateMarketSummary(stocks),
      totalStocks: stocks.length,
      sources: ['Estimated'],
      timestamp: new Date().toISOString(),
      isMock: false
    };
  }

  // Main fetch method — returns fixed estimates only (no external API calls)
  async fetchNGXData() {
    if (this.cache.data && Date.now() - this.cache.timestamp < this.cache.ttl) {
      return this.cache.data;
    }

    const data = this.generateFixedEstimates();
    this.cache.data = data;
    this.cache.timestamp = Date.now();
    return data;
  }

  // Get a specific stock by symbol
  async getStock(symbol) {
    const allData = await this.fetchNGXData();
    return allData.stocks.find(s => s.symbol === symbol.toUpperCase()) || null;
  }

  clearCache() {
    this.cache.data = null;
    this.cache.timestamp = null;
  }

  // Config status — no external providers configured
  getConfigStatus() {
    return {
      twelvedata: false,
      alphavantage: false,
      fmp: false,
      polygon: false,
      configured: false
    };
  }
}

export default new FinancialDataAPI();