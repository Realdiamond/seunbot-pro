import React, { lazy, Suspense, useMemo, useState, useEffect } from 'react'
import { Routes, Route, NavLink, Navigate, useNavigate, useParams } from 'react-router-dom'
import {
  BarChart3, Globe, MapPin, Target,
  Menu, X, Home, Brain, DollarSign, Repeat
} from 'lucide-react'
import NGXDashboard from './components/NGXDashboard'
import NGXAdvancedAnalysis from './components/NGXAdvancedAnalysis'
import NGXWeeklySetupsPanel from './components/NGXWeeklySetupsPanel'
import MaintenanceMode from './components/MaintenanceMode'
import './App.css'

const CryptoDashboard  = lazy(() => import('./components/crypto/CryptoDashboard'))
const CryptoAnalysis   = lazy(() => import('./components/crypto/CryptoAnalysis'))
const CryptoSetups     = lazy(() => import('./components/crypto/CryptoSetups'))
const ForexDashboard   = lazy(() => import('./components/forex/ForexDashboard'))
const ForexAnalysis    = lazy(() => import('./components/forex/ForexAnalysis'))
const ForexSetups      = lazy(() => import('./components/forex/ForexSetups'))
const USStocksDashboard = lazy(() => import('./components/USStocksDashboard'))
const USStocksWeeklySetupsPanel = lazy(() => import('./components/USStocksWeeklySetupsPanel'))

// Computes real trading-session status per market from the current UTC time, replacing the
// hard-coded "NGX Closed / everything else Open" sidebar label. Times are approximate session
// windows (DST not modelled): NGX 10:00–14:30 WAT (09:00–13:30 UTC) Mon–Fri; US cash 09:30–16:00
// ET (~14:30–21:00 UTC) Mon–Fri; Forex ~24/5 (Sun 21:00 → Fri 21:00 UTC); Crypto 24/7.
function computeMarketStatus(market, now = new Date()) {
  const day = now.getUTCDay() // 0 Sun … 6 Sat
  const minutes = now.getUTCHours() * 60 + now.getUTCMinutes()
  const isWeekday = day >= 1 && day <= 5

  switch (market) {
    case 'crypto':
      return { open: true, label: 'Crypto Markets Open' }
    case 'forex': {
      // Continuous from Sunday 21:00 UTC to Friday 21:00 UTC
      const open = (day >= 1 && day <= 4) ||
        (day === 0 && minutes >= 21 * 60) ||
        (day === 5 && minutes < 21 * 60)
      return { open, label: open ? 'Forex Markets Open' : 'Forex Markets Closed' }
    }
    case 'usstocks': {
      const open = isWeekday && minutes >= 14 * 60 + 30 && minutes < 21 * 60
      return { open, label: open ? 'US Markets Open' : 'US Markets Closed' }
    }
    case 'ngx':
    default: {
      const open = isWeekday && minutes >= 9 * 60 && minutes <= 13 * 60 + 30
      return { open, label: open ? 'NGX Open' : 'NGX Closed' }
    }
  }
}

// Inline SVG Logo for SeunBot Pro — zero HTTP requests, 100% reliable rendering
function LogoIcon({ className = "h-9 w-9" }) {
  return (
    <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="sb_bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0f172a"/>
          <stop offset="100%" stopColor="#1e293b"/>
        </linearGradient>
        <linearGradient id="sb_letter" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#38bdf8"/>
          <stop offset="100%" stopColor="#6366f1"/>
        </linearGradient>
        <linearGradient id="sb_chart" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#22d3ee"/>
          <stop offset="100%" stopColor="#818cf8"/>
        </linearGradient>
      </defs>
      <rect width="100" height="100" rx="20" fill="url(#sb_bg)"/>
      <rect width="100" height="100" rx="20" fill="none" stroke="#38bdf8" strokeWidth="1.5" opacity="0.25"/>
      <text x="50" y="66" fontFamily="'Arial Black', 'Helvetica Neue', sans-serif" fontSize="64" fontWeight="900" textAnchor="middle" fill="url(#sb_letter)">S</text>
      <polyline points="14,78 26,63 40,70 56,50 72,40 86,28" stroke="url(#sb_chart)" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.85"/>
      <circle cx="86" cy="28" r="3.5" fill="#22d3ee" opacity="0.9"/>
    </svg>
  )
}

// Time-based greeting for Adelaja Seun
function getGreeting() {
  const hour = new Date().getHours()
  if (hour >= 0  && hour < 12)  return { text: 'Good Morning',   emoji: '🌅' }
  if (hour >= 12 && hour < 17)  return { text: 'Good Afternoon', emoji: '☀️' }
  return { text: 'Good Evening', emoji: '🌆' }
}

// Wrapper component for NGX symbol-based analysis route
function NGXSymbolAnalysis({ onSelectPair }) {
  const { symbol } = useParams()
  return (
    <div className="space-y-6">
      <NGXDashboard onSelectPair={onSelectPair} initialSymbol={symbol || 'GTCO'} />
      <NGXAdvancedAnalysis selectedStock={symbol || 'GTCO'} marketData={[]} />
    </div>
  )
}

// Wrapper component for US Stocks symbol-based analysis route
function USStocksSymbolAnalysis() {
  const { symbol } = useParams()
  return <USStocksDashboard initialSymbol={symbol || 'AAPL'} viewMode="analysis" />
}

function App() {
  // Check if maintenance mode is enabled
  const maintenanceMode = import.meta.env.VITE_MAINTENANCE_MODE === 'true'

  // If maintenance mode is on, show maintenance page
  if (maintenanceMode) {
    return <MaintenanceMode />
  }

  const navigate = useNavigate()
  const enabledMarkets = useMemo(() => {
    const raw = import.meta.env.VITE_ENABLED_MARKETS || 'ngx'
    const requested = raw
      .split(',')
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean)

    const valid = requested.filter((value) => ['crypto', 'forex', 'ngx', 'usstocks'].includes(value))
    return valid.length > 0 ? Array.from(new Set(valid)) : ['ngx']
  }, [])

  const hasCrypto = enabledMarkets.includes('crypto')
  const hasForex = enabledMarkets.includes('forex')
  const hasNgx = enabledMarkets.includes('ngx')
  const hasUsStocks = enabledMarkets.includes('usstocks')
  const defaultMarket = hasCrypto ? 'crypto' : hasForex ? 'forex' : hasNgx ? 'ngx' : enabledMarkets[0]

  const getInitialMarket = () => {
    if (typeof window === 'undefined') return defaultMarket
    const path = window.location.pathname
    if (path.startsWith('/forex') && hasForex) return 'forex'
    if (path.startsWith('/ngx') && hasNgx) return 'ngx'
    if (path.startsWith('/usstocks') && hasUsStocks) return 'usstocks'
    if (hasCrypto) return 'crypto'
    return defaultMarket
  }

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [currentMarket, setCurrentMarket] = useState(getInitialMarket())
  const [selectedCryptoPair, setSelectedCryptoPair] = useState('BTCUSDT')
  const [selectedForexPair, setSelectedForexPair] = useState('AUDCAD')
  const [selectedNgxStock, setSelectedNgxStock] = useState('GTCO')
  const [selectedUsStock, setSelectedUsStock] = useState('AAPL')
  const [greeting, setGreeting] = useState(getGreeting())

  // Update greeting if the hour flips while the app is open
  useEffect(() => {
    const id = setInterval(() => setGreeting(getGreeting()), 60_000)
    return () => clearInterval(id)
  }, [])

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  const switchMarket = (market) => {
    if (!enabledMarkets.includes(market)) return
    setCurrentMarket(market)
    setSidebarOpen(false)
    if (market === 'crypto') {
      navigate('/')
    } else if (market === 'forex') {
      navigate('/forex')
    } else if (market === 'usstocks') {
      navigate('/usstocks')
    } else if (market === 'ngx') {
      navigate('/ngx')
    }
  }

  const activeMarket = enabledMarkets.includes(currentMarket) ? currentMarket : defaultMarket
  const fallbackRoute = hasCrypto ? '/' : hasForex ? '/forex' : hasNgx ? '/ngx' : '/usstocks'

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
        {/* Mobile Menu Button */}
        <div className="lg:hidden fixed top-3 left-3 z-50">
          <button
            onClick={toggleSidebar}
            className="p-2.5 bg-gray-900/80 backdrop-blur border border-gray-700/70 rounded-xl text-white hover:bg-gray-800 transition-colors"
          >
            {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Sidebar */}
        <div className={`fixed inset-y-0 left-0 z-40 w-[82vw] max-w-xs sm:w-72 lg:w-64 bg-gray-900/95 backdrop-blur-sm border-r border-gray-700 transform transition-transform duration-300 ease-in[...]
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}>
          <div className="flex flex-col h-full">
            {/* Logo + Greeting */}
            <div className="flex flex-col p-5 border-b border-gray-700/80 gap-3">
              <div className="flex items-center space-x-3">
                <div className="relative flex-shrink-0">
                  <LogoIcon className="h-9 w-9 rounded-xl ring-2 ring-blue-500/40" />
                  <span className="absolute -bottom-1 -right-1 text-[10px] leading-none">📈</span>
                </div>
                <div>
                  <h1 className="text-lg font-bold text-white leading-tight">SeunBot Pro</h1>
                  <p className="text-[11px] text-gray-400">Advanced Trading Analysis</p>
                </div>
              </div>
              {/* Admin greeting */}
              <div className="flex items-center gap-2 bg-gradient-to-r from-blue-600/20 to-cyan-600/10 border border-blue-500/20 rounded-xl px-3 py-2">
                <span className="text-lg leading-none">{greeting.emoji}</span>
                <div>
                  <p className="text-[11px] text-gray-400 leading-none mb-0.5">{greeting.text},</p>
                  <p className="text-sm font-semibold text-white leading-tight">Adelaja Seun</p>
                </div>
              </div>
            </div>

            {/* Market Selector */}
            <div className="p-4 border-b border-gray-700">
              <div className="text-xs text-gray-400 mb-2">Select Market</div>
              <div className="grid grid-cols-2 gap-2">
                {hasCrypto && (
                <button
                  onClick={() => switchMarket('crypto')}
                  className={`w-full p-3 rounded-lg text-xs font-medium transition-colors ${
                    activeMarket === 'crypto'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'
                  }`}
                >
                  <Globe className="h-4 w-4 mx-auto mb-1" />
                  Crypto
                </button>
                )}
                {hasForex && (
                <button
                  onClick={() => switchMarket('forex')}
                  className={`w-full p-3 rounded-lg text-xs font-medium transition-colors ${
                    activeMarket === 'forex'
                      ? 'bg-cyan-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'
                  }`}
                >
                  <Repeat className="h-4 w-4 mx-auto mb-1" />
                  Forex
                </button>
                )}
                {hasNgx && (
                <button
                  onClick={() => switchMarket('ngx')}
                  className={`w-full p-3 rounded-lg text-xs font-medium transition-colors ${
                    activeMarket === 'ngx'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'
                  }`}
                >
                  <MapPin className="h-4 w-4 mx-auto mb-1" />
                  NGX
                </button>
                )}
                {hasUsStocks && (
                <button
                  onClick={() => switchMarket('usstocks')}
                  className={`w-full p-3 rounded-lg text-xs font-medium transition-colors ${
                    activeMarket === 'usstocks'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'
                  }`}
                >
                  <DollarSign className="h-4 w-4 mx-auto mb-1" />
                  US Stocks
                </button>
                )}
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-2">
              {activeMarket === 'crypto' && hasCrypto ? (
                <>
                  <NavLink
                    to="/"
                    end
                    onClick={() => setSidebarOpen(false)}
                    className={({ isActive }) => `flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                      isActive ? 'bg-blue-600/20 text-blue-400 font-semibold border border-blue-500/30' : 'text-gray-400 hover:text-white hover:bg-gray-800'
                    }`}
                  >
                    <Home className="h-5 w-5" />
                    <span>Crypto Dashboard</span>
                  </NavLink>
                  <NavLink
                    to="/crypto-analysis"
                    onClick={() => setSidebarOpen(false)}
                    className={({ isActive }) => `flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                      isActive ? 'bg-blue-600/20 text-blue-400 font-semibold border border-blue-500/30' : 'text-gray-400 hover:text-white hover:bg-gray-800'
                    }`}
                  >
                    <Brain className="h-5 w-5" />
                    <span>Advanced Analysis</span>
                  </NavLink>
                  <NavLink
                    to="/crypto-setups"
                    onClick={() => setSidebarOpen(false)}
                    className={({ isActive }) => `flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                      isActive ? 'bg-blue-600/20 text-blue-400 font-semibold border border-blue-500/30' : 'text-gray-400 hover:text-white hover:bg-gray-800'
                    }`}
                  >
                    <Target className="h-5 w-5" />
                    <span>Weekly Setups</span>
                  </NavLink>
                </>
              ) : activeMarket === 'forex' && hasForex ? (
                <>
                  <NavLink
                    to="/forex"
                    end
                    onClick={() => setSidebarOpen(false)}
                    className={({ isActive }) => `flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                      isActive ? 'bg-cyan-600/20 text-cyan-300 font-semibold border border-cyan-500/30' : 'text-gray-400 hover:text-white hover:bg-gray-800'
                    }`}
                  >
                    <Home className="h-5 w-5" />
                    <span>Forex Dashboard</span>
                  </NavLink>
                  <NavLink
                    to="/forex-analysis"
                    onClick={() => setSidebarOpen(false)}
                    className={({ isActive }) => `flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                      isActive ? 'bg-cyan-600/20 text-cyan-300 font-semibold border border-cyan-500/30' : 'text-gray-400 hover:text-white hover:bg-gray-800'
                    }`}
                  >
                    <Brain className="h-5 w-5" />
                    <span>Advanced Analysis</span>
                  </NavLink>
                  <NavLink
                    to="/forex-setups"
                    onClick={() => setSidebarOpen(false)}
                    className={({ isActive }) => `flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                      isActive ? 'bg-cyan-600/20 text-cyan-300 font-semibold border border-cyan-500/30' : 'text-gray-400 hover:text-white hover:bg-gray-800'
                    }`}
                  >
                    <Target className="h-5 w-5" />
                    <span>Weekly Setups</span>
                  </NavLink>
                </>
              ) : activeMarket === 'usstocks' && hasUsStocks ? (
                <>
                  <NavLink
                    to="/usstocks"
                    end
                    onClick={() => setSidebarOpen(false)}
                    className={({ isActive }) => `flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                      isActive ? 'bg-purple-600/20 text-purple-400 font-semibold border border-purple-500/30' : 'text-gray-400 hover:text-white hover:bg-gray-800'
                    }`}
                  >
                    <BarChart3 className="h-5 w-5" />
                    <span>US Stocks Dashboard</span>
                  </NavLink>
                  <NavLink
                    to="/usstocks-analysis"
                    onClick={() => setSidebarOpen(false)}
                    className={({ isActive }) => `flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                      isActive ? 'bg-purple-600/20 text-purple-400 font-semibold border border-purple-500/30' : 'text-gray-400 hover:text-white hover:bg-gray-800'
                    }`}
                  >
                    <Brain className="h-5 w-5" />
                    <span>Stock Analysis</span>
                  </NavLink>
                  <NavLink
                    to="/usstocks-setups"
                    onClick={() => setSidebarOpen(false)}
                    className={({ isActive }) => `flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                      isActive ? 'bg-purple-600/20 text-purple-400 font-semibold border border-purple-500/30' : 'text-gray-400 hover:text-white hover:bg-gray-800'
                    }`}
                  >
                    <Target className="h-5 w-5" />
                    <span>Weekly Setups</span>
                  </NavLink>
                </>
              ) : (
                <>
                  <NavLink
                    to="/ngx"
                    end
                    onClick={() => setSidebarOpen(false)}
                    className={({ isActive }) => `flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                      isActive ? 'bg-green-600/20 text-green-400 font-semibold border border-green-500/30' : 'text-gray-400 hover:text-white hover:bg-gray-800'
                    }`}
                  >
                    <BarChart3 className="h-5 w-5" />
                    <span>NGX Dashboard</span>
                  </NavLink>
                  <NavLink
                    to="/ngx-analysis"
                    onClick={() => setSidebarOpen(false)}
                    className={({ isActive }) => `flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                      isActive ? 'bg-green-600/20 text-green-400 font-semibold border border-green-500/30' : 'text-gray-400 hover:text-white hover:bg-gray-800'
                    }`}
                  >
                    <Brain className="h-5 w-5" />
                    <span>Advanced Analysis</span>
                  </NavLink>
                  <NavLink
                    to="/ngx-setups"
                    onClick={() => setSidebarOpen(false)}
                    className={({ isActive }) => `flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                      isActive ? 'bg-green-600/20 text-green-400 font-semibold border border-green-500/30' : 'text-gray-400 hover:text-white hover:bg-gray-800'
                    }`}
                  >
                    <Target className="h-5 w-5" />
                    <span>Weekly Setups</span>
                  </NavLink>
                </>
              )}
            </nav>

            {/* Market Status */}
            <div className="p-4 border-t border-gray-700">
              <div className="text-xs text-gray-400 mb-2">Market Status</div>
              {(() => {
                const status = computeMarketStatus(activeMarket)
                return (
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${status.open ? 'bg-green-500 animate-pulse' : 'bg-orange-500'}`}></div>
                    <span className={`text-sm ${status.open ? 'text-green-400' : 'text-orange-400'}`}>{status.label}</span>
                  </div>
                )
              })()}
              <div className="text-xs text-gray-500 mt-1">
                {new Date().toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:ml-64 min-h-screen">
          {/* Overlay for mobile */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            ></div>
          )}

          {/* Content Area */}
          <div className="px-3 pb-4 pt-16 sm:px-5 sm:pb-6 sm:pt-20 lg:p-6 lg:pt-6">
            <Suspense fallback={<div className="text-gray-400">Loading market module...</div>}>
              <Routes>
                {/* Crypto Routes */}
                {hasCrypto ? (
                  <>
                    <Route path="/" element={<CryptoDashboard onSelectPair={setSelectedCryptoPair} />} />
                    <Route path="/crypto-analysis" element={<CryptoAnalysis initialSymbol={selectedCryptoPair} />} />
                    <Route path="/crypto-setups" element={<CryptoSetups />} />
                  </>
                ) : (
                  <Route path="/" element={<Navigate to={fallbackRoute} replace />} />
                )}

                {/* Forex Routes */}
                {hasForex && (
                  <>
                    <Route path="/forex" element={<ForexDashboard onSelectPair={setSelectedForexPair} />} />
                    <Route path="/forex-analysis" element={<ForexAnalysis initialSymbol={selectedForexPair} />} />
                    <Route path="/forex-setups" element={<ForexSetups />} />
                  </>
                )}

                {/* NGX Routes */}
                {hasNgx && (
                  <>
                    <Route path="/ngx" element={<NGXDashboard onSelectPair={setSelectedNgxStock} initialSymbol={selectedNgxStock} />} />
                    <Route path="/ngx/:symbol" element={<NGXSymbolAnalysis onSelectPair={setSelectedNgxStock} />} />
                    <Route
                      path="/ngx-analysis"
                      element={
                        <div className="space-y-6">
                          <NGXDashboard onSelectPair={setSelectedNgxStock} initialSymbol={selectedNgxStock} />
                          <NGXAdvancedAnalysis selectedStock={selectedNgxStock} marketData={[]} />
                        </div>
                      }
                    />
                    <Route
                      path="/ngx-setups"
                      element={
                        <NGXWeeklySetupsPanel
                          onAnalyze={(symbol) => {
                            setSelectedNgxStock(symbol)
                            navigate('/ngx-analysis')
                          }}
                        />
                      }
                    />
                  </>
                )}

                {/* US Stocks Routes */}
                {hasUsStocks && (
                  <>
                    <Route path="/usstocks" element={<USStocksDashboard onSelectPair={setSelectedUsStock} initialSymbol={selectedUsStock} />} />
                    <Route path="/usstocks/:symbol" element={<USStocksSymbolAnalysis />} />
                    <Route
                      path="/usstocks-analysis"
                      element={
                        <USStocksDashboard
                          onSelectPair={setSelectedUsStock}
                          initialSymbol={selectedUsStock}
                        />
                      }
                    />
                    <Route
                      path="/usstocks-setups"
                      element={
                        <USStocksWeeklySetupsPanel
                          onAnalyze={(symbol) => {
                            setSelectedUsStock(symbol)
                            navigate(`/usstocks/${symbol}`)
                          }}
                        />
                      }
                    />
                    <Route path="/usstocks-etfs" element={<USStocksDashboard onSelectPair={setSelectedUsStock} initialSymbol={selectedUsStock} />} />
                  </>
                )}

                <Route path="*" element={<Navigate to={fallbackRoute} replace />} />
              </Routes>
            </Suspense>
          </div>
        </div>
      </div>
  )
}

export default App
