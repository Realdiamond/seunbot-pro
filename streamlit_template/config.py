"""Configuration settings for the USDT Trading Dashboard"""

# Binance API Configuration (Demo mode - no real API keys needed)
BINANCE_API_KEY = "demo_key"
BINANCE_SECRET_KEY = "demo_secret"
BINANCE_BASE_URL = "https://api.binance.com"

# Trading Configuration
USDT_PAIRS = [
    'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'ADAUSDT', 'XRPUSDT',
    'SOLUSDT', 'DOTUSDT', 'DOGEUSDT', 'AVAXUSDT', 'SHIBUSDT',
    'MATICUSDT', 'LTCUSDT', 'UNIUSDT', 'LINKUSDT', 'ATOMUSDT'
]

# Analysis Parameters (from Seun Bot)
RISK_FREE_RATE = 0.02
PATTERN_SENSITIVITY = 0.05
FIBONACCI_TOLERANCE = 0.05
PATTERN_LOOKBACK = 20
ZIGZAG_LENGTH = 5
ZIGZAG_DEPTH = 10
MIN_TRENDLINE_R2 = 0.75
CONFIRMATION_VOL_RATIO = 1.2

# Weights for signal generation
FUNDAMENTAL_WEIGHT = 0.3
SENTIMENT_WEIGHT = 0.2
TECHNICAL_WEIGHT = 0.5
MONTHLY_WEIGHT = 0.1
WEEKLY_WEIGHT = 0.8
DAILY_WEIGHT = 0.1

# Dashboard Settings
DEFAULT_TIMEFRAME = '1d'
DEFAULT_PERIOD = '1y'
CHART_HEIGHT = 600
UPDATE_INTERVAL = 300  # 5 minutes

# Colors for UI
COLORS = {
    'bullish': '#00ff88',
    'bearish': '#ff4444',
    'neutral': '#ffaa00',
    'background': '#0e1117',
    'text': '#ffffff'
}