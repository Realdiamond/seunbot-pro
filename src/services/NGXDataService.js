// NGX Data Service
// External references (TradingView, NGNMarket, TradingEconomics, Investing.com)
// have been removed. All live NGX data is now sourced exclusively from the
// SeunBot Heroku backend via RealNGXDataService.js.
// This file retains static reference data and helper methods only.

class NGXDataService {
  constructor() {
    this.ngxStocks = {
      banking: [
        { symbol: 'GTCO', name: 'Guaranty Trust Holding Company', sector: 'Banking' },
        { symbol: 'ZENITHBANK', name: 'Zenith Bank Plc', sector: 'Banking' },
        { symbol: 'UBA', name: 'United Bank for Africa Plc', sector: 'Banking' },
        { symbol: 'ACCESSCORP', name: 'Access Holdings Plc', sector: 'Banking' },
        { symbol: 'FBNH', name: 'FBN Holdings Plc', sector: 'Banking' },
        { symbol: 'STERLNBANK', name: 'Sterling Bank Plc', sector: 'Banking' },
        { symbol: 'FIDELITYBK', name: 'Fidelity Bank Plc', sector: 'Banking' }
      ],
      oilGas: [
        { symbol: 'SEPLAT', name: 'Seplat Petroleum Development Company', sector: 'Oil & Gas' },
        { symbol: 'TOTAL', name: 'Total Nigeria Plc', sector: 'Oil & Gas' },
        { symbol: 'OANDO', name: 'Oando Plc', sector: 'Oil & Gas' },
        { symbol: 'CONOIL', name: 'Conoil Plc', sector: 'Oil & Gas' }
      ],
      consumerGoods: [
        { symbol: 'DANGCEM', name: 'Dangote Cement Plc', sector: 'Consumer Goods' },
        { symbol: 'NESTLE', name: 'Nestle Nigeria Plc', sector: 'Consumer Goods' },
        { symbol: 'UNILEVER', name: 'Unilever Nigeria Plc', sector: 'Consumer Goods' },
        { symbol: 'NB', name: 'Nigerian Breweries Plc', sector: 'Consumer Goods' },
        { symbol: 'GUINNESS', name: 'Guinness Nigeria Plc', sector: 'Consumer Goods' },
        { symbol: 'CADBURY', name: 'Cadbury Nigeria Plc', sector: 'Consumer Goods' }
      ],
      telecommunications: [
        { symbol: 'MTNN', name: 'MTN Nigeria Communications Plc', sector: 'Telecommunications' },
        { symbol: 'AIRTELAFRI', name: 'Airtel Africa Plc', sector: 'Telecommunications' }
      ],
      industrials: [
        { symbol: 'DANGSUGAR', name: 'Dangote Sugar Refinery Plc', sector: 'Industrial Goods' },
        { symbol: 'WAPCO', name: 'Lafarge Africa Plc', sector: 'Industrial Goods' },
        { symbol: 'BUACEMENT', name: 'BUA Cement Plc', sector: 'Industrial Goods' }
      ],
      insurance: [
        { symbol: 'AIICO', name: 'AIICO Insurance Plc', sector: 'Insurance' },
        { symbol: 'MANSARD', name: 'Mansard Insurance Plc', sector: 'Insurance' }
      ]
    };
  }

  getSectorForStock(symbol) {
    for (const sector in this.ngxStocks) {
      const found = this.ngxStocks[sector].find(stock => stock.symbol === symbol);
      if (found) return found.sector;
    }
    return 'Unknown';
  }

  getAllSymbols() {
    return Object.values(this.ngxStocks).flat().map(s => s.symbol);
  }
}

export default new NGXDataService();