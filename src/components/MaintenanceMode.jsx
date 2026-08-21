import React from 'react'

function MaintenanceMode() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        {/* Maintenance Icon */}
        <div className="mb-6 flex justify-center">
          <div className="relative">
            <div className="text-6xl animate-pulse">🔧</div>
            <div className="absolute -bottom-2 -right-2 text-3xl animate-bounce">⚠️</div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-gray-800/50 backdrop-blur border border-gray-700/50 rounded-2xl p-8 space-y-4">
          <h1 className="text-3xl font-bold text-white">Under Maintenance</h1>
          
          <p className="text-gray-300 text-base leading-relaxed">
            We're currently upgrading and improving our service to give you a better experience.
          </p>

          <div className="bg-blue-600/10 border border-blue-500/30 rounded-lg p-4 my-6">
            <p className="text-sm text-gray-400 mb-1">Estimated return:</p>
            <p className="text-lg font-semibold text-blue-400">Coming Soon</p>
          </div>

          <p className="text-sm text-gray-500">
            Thank you for your patience. We appreciate your business!
          </p>

          {/* Loading Animation */}
          <div className="flex justify-center gap-1 mt-6">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
            <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-gray-500 text-xs mt-6">
          © 2024 SeunBot Pro. All rights reserved.
        </p>
      </div>
    </div>
  )
}

export default MaintenanceMode
