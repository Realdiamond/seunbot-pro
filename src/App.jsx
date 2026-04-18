import React, { lazy, Suspense, useMemo, useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom'
import {
  BarChart3, Globe, MapPin, Target,
  Menu, X, Home, Brain, DollarSign
} from 'lucide-react'
import NGXDashboard from './components/NGXDashboard'
import NGXAdvancedAnalysis from './components/NGXAdvancedAnalysis'
import NGXWeeklySetupsPanel from './components/NGXWeeklySetupsPanel'
import './App.css'

const TradingDashboard = lazy(() => import('./components/TradingDashboard'))
const SeunBotAnalysis = lazy(() => import('./components/SeunBotAnalysis'))
const SP500Dashboard = lazy(() => import('./components/SP500Dashboard'))
const SP500AdvancedAnalysis = lazy(() => import('./components/SP500AdvancedAnalysis'))
const SP500WeeklySetupsPanel = lazy(() => import('./components/SP500WeeklySetupsPanel'))

function App() {
  const enabledMarkets = useMemo(() => {
    const raw = import.meta.env.VITE_ENABLED_MARKETS || 'ngx'
    const requested = raw
      .split(',')
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean)

    const valid = requested.filter((value) => ['crypto', 'ngx', 'sp500'].includes(value))
    return valid.length > 0 ? Array.from(new Set(valid)) : ['ngx']
  }, [])

  const hasCrypto = enabledMarkets.includes('crypto')
  const hasNgx = enabledMarkets.includes('ngx')
  const hasSp500 = enabledMarkets.includes('sp500')
  const defaultMarket = hasNgx ? 'ngx' : enabledMarkets[0]

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [currentMarket, setCurrentMarket] = useState(defaultMarket)

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  const switchMarket = (market) => {
    if (!enabledMarkets.includes(market)) return
    setCurrentMarket(market)
    setSidebarOpen(false)
  }

  const activeMarket = enabledMarkets.includes(currentMarket) ? currentMarket : defaultMarket
  const marketSelectorCols = enabledMarkets.length >= 3 ? 'grid-cols-3' : enabledMarkets.length === 2 ? 'grid-cols-2' : 'grid-cols-1'
  const fallbackRoute = hasNgx ? '/ngx' : hasCrypto ? '/' : '/sp500'

  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
        {/* Mobile Menu Button */}
        <div className="lg:hidden fixed top-4 left-4 z-50">
          <button
            onClick={toggleSidebar}
            className="p-2 bg-gray-800 rounded-lg text-white hover:bg-gray-700 transition-colors"
          >
            {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Sidebar */}
        <div className={`fixed inset-y-0 left-0 z-40 w-64 bg-gray-900/95 backdrop-blur-sm border-r border-gray-700 transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}>
          <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="flex items-center space-x-3 p-6 border-b border-gray-700">
              <Brain className="h-8 w-8 text-blue-500" />
              <div>
                <h1 className="text-xl font-bold text-white">SeunBot Pro</h1>
                <p className="text-xs text-gray-400">Advanced Trading Analysis</p>
              </div>
            </div>

            {/* Market Selector */}
            <div className="p-4 border-b border-gray-700">
              <div className="text-xs text-gray-400 mb-2">Select Market</div>
              <div className={`grid ${marketSelectorCols} gap-2`}>
                {hasCrypto && (
                <button
                  onClick={() => switchMarket('crypto')}
                  className={`p-3 rounded-lg text-xs font-medium transition-colors ${
                    activeMarket === 'crypto'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'
                  }`}
                >
                  <Globe className="h-4 w-4 mx-auto mb-1" />
                  Crypto
                </button>
                )}
                {hasNgx && (
                <button
                  onClick={() => switchMarket('ngx')}
                  className={`p-3 rounded-lg text-xs font-medium transition-colors ${
                    activeMarket === 'ngx'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'
                  }`}
                >
                  <MapPin className="h-4 w-4 mx-auto mb-1" />
                  NGX
                </button>
                )}
                {hasSp500 && (
                <button
                  onClick={() => switchMarket('sp500')}
                  className={`p-3 rounded-lg text-xs font-medium transition-colors ${
                    activeMarket === 'sp500'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'
                  }`}
                >
                  <DollarSign className="h-4 w-4 mx-auto mb-1" />
                  S&P 500
                </button>
                )}
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-2">
              {activeMarket === 'crypto' && hasCrypto ? (
                <>
                  <Link
                    to="/"
                    onClick={() => setSidebarOpen(false)}
                    className="flex items-center space-x-3 p-3 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
                  >
                    <Home className="h-5 w-5" />
                    <span>Crypto Dashboard</span>
                  </Link>
                  <Link
                    to="/crypto-analysis"
                    onClick={() => setSidebarOpen(false)}
                    className="flex items-center space-x-3 p-3 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
                  >
                    <Brain className="h-5 w-5" />
                    <span>Advanced Analysis</span>
                  </Link>
                </>
              ) : activeMarket === 'sp500' && hasSp500 ? (
                <>
                  <Link
                    to="/sp500"
                    onClick={() => setSidebarOpen(false)}
                    className="flex items-center space-x-3 p-3 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
                  >
                    <BarChart3 className="h-5 w-5" />
                    <span>S&P 500 Dashboard</span>
                  </Link>
                  <Link
                    to="/sp500-analysis"
                    onClick={() => setSidebarOpen(false)}
                    className="flex items-center space-x-3 p-3 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
                  >
                    <Brain className="h-5 w-5" />
                    <span>Stock Analysis</span>
                  </Link>
                  <Link
                    to="/sp500-setups"
                    onClick={() => setSidebarOpen(false)}
                    className="flex items-center space-x-3 p-3 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
                  >
                    <Target className="h-5 w-5" />
                    <span>Weekly Setups</span>
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/ngx"
                    onClick={() => setSidebarOpen(false)}
                    className="flex items-center space-x-3 p-3 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
                  >
                    <BarChart3 className="h-5 w-5" />
                    <span>NGX Dashboard</span>
                  </Link>
                  <Link
                    to="/ngx-analysis"
                    onClick={() => setSidebarOpen(false)}
                    className="flex items-center space-x-3 p-3 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
                  >
                    <Brain className="h-5 w-5" />
                    <span>Advanced Analysis</span>
                  </Link>
                  <Link
                    to="/ngx-setups"
                    onClick={() => setSidebarOpen(false)}
                    className="flex items-center space-x-3 p-3 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
                  >
                    <Target className="h-5 w-5" />
                    <span>Weekly Setups</span>
                  </Link>
                </>
              )}
            </nav>

            {/* Market Status */}
            <div className="p-4 border-t border-gray-700">
              <div className="text-xs text-gray-400 mb-2">Market Status</div>
              {activeMarket === 'crypto' && hasCrypto ? (
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-green-400 text-sm">Crypto Markets Open</span>
                </div>
              ) : activeMarket === 'sp500' && hasSp500 ? (
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-green-400 text-sm">US Markets Open</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span className="text-orange-400 text-sm">NGX Closed</span>
                </div>
              )}
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
          <div className="px-3 pb-4 pt-20 sm:px-5 sm:pb-6 lg:p-6 lg:pt-6">
            <Suspense fallback={<div className="text-gray-400">Loading market module...</div>}>
              <Routes>
                {/* Crypto Routes */}
                {hasCrypto ? (
                  <>
                    <Route path="/" element={<TradingDashboard />} />
                    <Route path="/crypto-analysis" element={<SeunBotAnalysis />} />
                  </>
                ) : (
                  <Route path="/" element={<Navigate to={fallbackRoute} replace />} />
                )}

                {/* NGX Routes */}
                {hasNgx && (
                  <>
                    <Route path="/ngx" element={<NGXDashboard />} />
                    <Route
                      path="/ngx-analysis"
                      element={
                        <div className="space-y-6">
                          <NGXDashboard />
                          <NGXAdvancedAnalysis selectedStock="GTCO" marketData={[]} />
                        </div>
                      }
                    />
                    <Route path="/ngx-setups" element={<NGXWeeklySetupsPanel />} />
                  </>
                )}

                {/* S&P 500 Routes */}
                {hasSp500 && (
                  <>
                    <Route path="/sp500" element={<SP500Dashboard />} />
                    <Route path="/sp500-analysis" element={<SP500AdvancedAnalysis />} />
                    <Route path="/sp500-setups" element={<SP500WeeklySetupsPanel />} />
                  </>
                )}

                <Route path="*" element={<Navigate to={fallbackRoute} replace />} />
              </Routes>
            </Suspense>
          </div>
        </div>
      </div>
    </Router>
  )
}

export default App