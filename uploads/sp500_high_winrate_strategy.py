import yfinance as yf
import pandas as pd
import numpy as np
import talib
from backtesting import Backtest, Strategy
from scipy.signal import argrelextrema
from sklearn.linear_model import LinearRegression
import pandas_datareader as pdr

# Configuration
RISK_PER_TRADE = 0.005  # 0.5% portfolio risk
STOP_LOSS_PCT = 0.015   # 1.5% stop-loss
MAX_DRAWDOWN = 0.20    # 20% max drawdown
MIN_TRENDLINE_R2 = 0.85  # Stricter R-squared
CONFIRMATION_VOL_RATIO = 1.5  # Higher volume confirmation
ZIGZAG_LENGTH = 5
ZIGZAG_NUM_PIVOTS = 10
MIN_ADX = 30  # Strong trend requirement
RSI_BUY = 25  # Deep oversold
RSI_SELL = 75 # Deep overbought
MIN_AVG_VOLUME = 1000000  # Minimum average daily volume

# Heikin-Ashi transformation
def heikin_ashi(df):
    df['HA_Close'] = (df['Open'] + df['High'] + df['Low'] + df['Close']) / 4
    df['HA_Open'] = (df['Open'].shift(1) + df['Close'].shift(1)) / 2
    df['HA_High'] = df[['High', 'HA_Open', 'HA_Close']].max(axis=1)
    df['HA_Low'] = df[['Low', 'HA_Open', 'HA_Close']].min(axis=1)
    return df

# Detect zigzag pivots
def detect_zigzag_pivots(data):
    prices = data['HA_Close'].values
    pivot_indices = argrelextrema(prices, np.greater, order=ZIGZAG_LENGTH)[0]
    pivot_types = ['high' if prices[i] == max(prices[max(0, i-10):min(len(prices), i+10)]) else 'low' for i in pivot_indices]
    return list(zip(pivot_indices, pricesungere2.5.0
System: It looks like the artifact content was cut off. Let me help complete the strategy implementation for the S&P 500 stocks with a target of 95% win rate and 20% max drawdown. Below, I'll provide the complete optimized script, continuing from where the previous artifact ended, ensuring all necessary components are included for backtesting across S&P 500 stocks.

<xaiArtifact artifact_id="ed732147-d881-4f76-a994-4a5c628de6d0" artifact_version_id="089a2b99-5b6e-459c-a67e-f71058e0d398" title="sp500_high_winrate_strategy.py" contentType="text/python">
import yfinance as yf
import pandas as pd
import numpy as np
import talib
from backtesting import Backtest, Strategy
from scipy.signal import argrelextrema
from sklearn.linear_model import LinearRegression
import pandas_datareader as pdr

# Configuration
RISK_PER_TRADE = 0.005  # 0.5% portfolio risk
STOP_LOSS_PCT = 0.015   # 1.5% stop-loss
MAX_DRAWDOWN = 0.20    # 20% max drawdown
MIN_TRENDLINE_R2 = 0.85  # Stricter R-squared
CONFIRMATION_VOL_RATIO = 1.5  # Higher volume confirmation
ZIGZAG_LENGTH = 5
ZIGZAG_NUM_PIVOTS = 10
MIN_ADX = 30  # Strong trend requirement
RSI_BUY = 25  # Deep oversold
RSI_SELL = 75 # Deep overbought
MIN_AVG_VOLUME = 1000000  # Minimum average daily volume

# Heikin-Ashi transformation
def heikin_ashi(df):
    df['HA_Close'] = (df['Open'] + df['High'] + df['Low'] + df['Close']) / 4
    df['HA_Open'] = (df['Open'].shift(1) + df['Close'].shift(1)) / 2
    df['HA_High'] = df[['High', 'HA_Open', 'HA_Close']].max(axis=1)
    df['HA_Low'] = df[['Low', 'HA_Open', 'HA_Close']].min(axis=1)
    return df

# Detect zigzag pivots
def detect_zigzag_pivots(data):
    prices = data['HA_Close'].values
    pivot_indices = argrelextrema(prices, np.greater, order=ZIGZAG_LENGTH)[0]
    pivot_types = ['high' if prices[i] == max(prices[max(0, i-10):min(len(prices), i+10)]) else 'low' for i in pivot_indices]
    return list(zip(pivot_indices, prices[pivot_indices], pivot_types))[-ZIGZAG_NUM_PIVOTS:]

# Simplified pattern detection (high-probability patterns)
def detect_geometric_patterns(df, pivots):
    patterns = {
        'ascending_contracting_triangle': False,
        'bull_pennant': False,
        'ascending_channel': False,
        'descending_contracting_triangle': False,
        'bear_asc_head_shoulders': False,
        'descending_channel': False
    }
    pattern_last_pivot = {}
    
    if len(pivots) < 6:
        return patterns, pattern_last_pivot
    
    recent_pivots = pivots[-6:]
    recent_prices = [p[1] for p in recent_pivots]
    recent_types = [p[2] for p in recent_pivots]
    recent_indices = [p[0] for p in recent_pivots]
    
    # Ascending Contracting Triangle
    if (recent_types[-1] == 'high' and recent_types[-2] == 'low' and 
        recent_types[-3] == 'high' and recent_types[-4] == 'low'):
        highs = [recent_prices[i] for i in range(len(recent_prices)) if recent_types[i] == 'high']
        lows = [recent_prices[i] for i in range(len(recent_prices)) if recent_types[i] == 'low']
        if len(highs) >= 2 and len(lows) >= 2:
            high_slope, _, high_r2 = validate_trendline(highs)
            low_slope, _, low_r2 = validate_trendline(lows)
            if (high_r2 >= MIN_TRENDLINE_R2 and low_r2 >= MIN_TRENDLINE_R2 and
                abs(high_slope) < 0.05 and low_slope > 0.05):
                patterns['ascending_contracting_triangle'] = True
                pattern_last_pivot['ascending_contracting_triangle'] = recent_indices[-1]
    
    # Bullish Pennant
    if (recent_types == ['high', 'low', 'high', 'low', 'high', 'low'] and
        recent_prices[0] > recent_prices[2] and recent_prices[1] < recent_prices[3]):
        patterns['bull_pennant'] = True
        pattern_last_pivot['bull_pennant'] = recent_indices[-1]
    
    # Ascending Channel
    if len(pivots) >= 4:
        highs = [(p[0], p[1]) for p in pivots if p[2] == 'high']
        lows = [(p[0], p[1]) for p in pivots if p[2] == 'low']
        if len(highs) >= 2 and len(lows) >= 2:
            high_x = np.array([p[0] for p in highs]).reshape(-1, 1)
            high_y = np.array([p[1] for p in highs])
            low_x = np.array([p[0] for p in lows]).reshape(-1, 1)
            low_y = np.array([p[1] for p in lows])
            high_model = LinearRegression().fit(high_x, high_y)
            low_model = LinearRegression().fit(low_x, low_y)
            high_r2 = high_model.score(high_x, high_y)
            low_r2 = low_model.score(low_x, low_y)
            if high_r2 >= MIN_TRENDLINE_R2 and low_r2 >= MIN_TRENDLINE_R2 and high_model.coef_[0] > 0 and low_model.coef_[0] > 0:
                patterns['ascending_channel'] = True
                pattern_last_pivot['ascending_channel'] = max(p[0] for p in pivots)
    
    # Descending Contracting Triangle
    if (recent_types[-1] == 'low' and recent_types[-2] == 'high' and 
        recent_types[-3] == 'low' and recent_types[-4] == 'high'):
        highs = [recent_prices[i] for i in range(len(recent_prices)) if recent_types[i] == 'high']
        lows = [recent_prices[i] for i in range(len(recent_prices)) if recent_types[i] == 'low']
        if len(highs) >= 2 and len(lows) >= 2:
            high_slope, _, high_r2 = validate_trendline(highs)
            low_slope, _, low_r2 = validate_trendline(lows)
            if (high_r2 >= MIN_TRENDLINE_R2 and low_r2 >= MIN_TRENDLINE_R2 and
                abs(low_slope) < 0.05 and high_slope < -0.05):
                patterns['descending_contracting_triangle'] = True
                pattern_last_pivot['descending_contracting_triangle'] = recent_indices[-1]
    
    # Bearish Head and Shoulders with Ascending Neckline
    if (recent_types[-6:] == ['high', 'low', 'high', 'low', 'high', 'low'] and
        recent_prices[2] > recent_prices[0] and recent_prices[2] > recent_prices[4] and
        recent_prices[3] > recent_prices[1]):
        patterns['bear_asc_head_shoulders'] = True
        pattern_last_pivot['bear_asc_head_shoulders'] = recent_indices[-1]
    
    # Descending Channel
    if len(pivots) >= 4:
        highs = [(p[0], p[1]) for p in pivots if p[2] == 'high']
        lows = [(p[0], p[1]) for p in pivots if p[2] == 'low']
        if len(highs) >= 2 and len(lows) >= 2:
            high_x = np.array([p[0] for p in highs]).reshape(-1, 1)
            high_y = np.array([p[1] for p in highs])
            low_x = np.array([p[0] for p in lows]).reshape(-1, 1)
            low_y = np.array([p[1] for p in lows])
            high_model = LinearRegression().fit(high_x, high_y)
            low_model = LinearRegression().fit(low_x, low_y)
            high_r2 = high_model.score(high_x, high_y)
            low_r2 = low_model.score(low_x, low_y)
            if high_r2 >= MIN_TRENDLINE_R2 and low_r2 >= MIN_TRENDLINE_R2 and high_model.coef_[0] < 0 and low_model.coef_[0] < 0:
                patterns['descending_channel'] = True
                pattern_last_pivot['descending_channel'] = max(p[0] for p in pivots)
    
    return patterns, pattern_last_pivot

def validate_trendline(points):
    if len(points) < 2:
        return None, 0, 0
    x = np.arange(len(points)).reshape(-1, 1)
    y = np.array(points)
    model = LinearRegression().fit(x, y)
    slope = model.coef_[0]
    angle = np.degrees(np.arctan(slope))
    r_sq = model.score(x, y)
    return slope, angle, r_sq

def confirm_pattern(df, pattern_type, pivot_index):
    if pivot_index >= len(df) - 1 or pivot_index < 3:
        return False
    start_idx = pivot_index + 1
    end_idx = min(len(df), start_idx + 5)
    confirmation_bars = df.iloc[start_idx:end_idx]
    if len(confirmation_bars) < 3:
        return False
    vol_avg = confirmation_bars['Volume'].mean()
    vol_prev = df['Volume'].iloc[pivot_index-3:pivot_index].mean()
    if vol_prev <= 0 or vol_avg <= 0:
        return False
    price_change = (confirmation_bars['HA_Close'].iloc[-1] - confirmation_bars['HA_Open'].iloc[0]) / confirmation_bars['HA_Open'].iloc[0]
    if pattern_type in ['ascending_contracting_triangle', 'bull_pennant', 'ascending_channel']:
        return (price_change > 0.02 and vol_avg > vol_prev * CONFIRMATION_VOL_RATIO)
    elif pattern_type in ['descending_contracting_triangle', 'bear_asc_head_shoulders', 'descending_channel']:
        return (price_change < -0.02 and vol_avg > vol_prev * CONFIRMATION_VOL_RATIO)
    return False

def detect_confluence(df, pivots):
    confluence = {'bullish_confluence': False, 'bearish_confluence': False, 'factors': []}
    high_ob = df['HA_High'].rolling(window=5).max().shift(1)
    low_ob = df['HA_Low'].rolling(window=5).min().shift(1)
    if df['HA_Close'].iloc[-1] > high_ob.iloc[-1]: 
        confluence['factors'].append('Bullish OB')
    elif df['HA_Close'].iloc[-1] < low_ob.iloc[-1]: 
        confluence['factors'].append('Bearish OB')
    fvg_high = df['HA_High'].rolling(window=3).max().shift(2)
    fvg_low = df['HA_Low'].rolling(window=3).min().shift(2)
    if df['HA_Close'].iloc[-1] > fvg_high.iloc[-1] and df['HA_Close'].iloc[-2] < fvg_high.iloc[-1]: 
        confluence['factors'].append('Bullish FVG')
    elif df['HA_Close'].iloc[-1] < fvg_low.iloc[-1] and df['HA_Close'].iloc[-2] > fvg_low.iloc[-1]: 
        confluence['factors'].append('Bearish FVG')
    trend = 'Uptrend' if df['HA_Close'].iloc[-1] > df['HA_Close'].iloc[-10] else 'Downtrend'
    confluence['factors'].append(trend)
    confluence['bullish_confluence'] = sum(1 for f in confluence['factors'] if 'Bullish' in f or f == 'Uptrend') >= 2
    confluence['bearish_confluence'] = sum(1 for f in confluence['factors'] if 'Bearish' in f or f == 'Downtrend') >= 2
    return confluence

def get_sp500_tickers():
    # Fetch S&P 500 tickers from Wikipedia
    url = 'https://en.wikipedia.org/wiki/List_of_S%26P_500_companies'
    tables = pd.read_html(url)
    sp500 = tables[0]
    return sp500['Symbol'].tolist()

# Backtesting strategy class
class SP500HighWinRateStrategy(Strategy):
    def init(self):
        self.rsi = self.I(talib.RSI, self.data.Close, timeperiod=14)
        self.adx = self.I(talib.ADX, self.data.High, self.data.Low, self.data.Close, timeperiod=14)
        self.atr = self.I(talib.ATR, self.data.High, self.data.Low, self.data.Close, timeperiod=14)
        self.df = heikin_ashi(self.data.df)
        # Check liquidity
        self.avg_volume = self.data.Volume[-20:].mean()
        self.is_liquid = self.avg_volume > MIN_AVG_VOLUME

    def next(self):
        if not self.is_liquid:
            return
        
        df = self.df.iloc[:len(self.data)]
        pivots = detect_zigzag_pivots(df)
        patterns, pattern_pivots = detect_geometric_patterns(df, pivots)
        confluence = detect_confluence(df, pivots)
        
        confirmed_patterns = []
        for pattern, detected in patterns.items():
            if detected and pattern in pattern_pivots:
                if confirm_pattern(df, pattern, pattern_pivots[pattern]):
                    confirmed_patterns.append(pattern)
        
        # Signal logic
        if (len(confirmed_patterns) >= 3 and
            self.rsi[-1] < RSI_BUY and
            self.adx[-1] > MIN_ADX and
            confluence['bullish_confluence'] and
            sum(1 for p in confirmed_patterns if p in ['ascending_contracting_triangle', 'bull_pennant', 'ascending_channel']) >= 2):
            size = (self.equity * RISK_PER_TRADE) / (self.data.Close[-1] * STOP_LOSS_PCT)
            self.buy(size=size, sl=self.data.Close[-1] * (1 - STOP_LOSS_PCT), tp=self.data.Close[-1] * (1 + 2 * STOP_LOSS_PCT))
        elif (len(confirmed_patterns) >= 3 and
              self.rsi[-1] > RSI_SELL and
              self.adx[-1] > MIN_ADX and
              confluence['bearish_confluence'] and
              sum(1 for p in confirmed_patterns if p in ['descending_contracting_triangle', 'bear_asc_head_shoulders', 'descending_channel']) >= 2):
            size = (self.equity * RISK_PER_TRADE) / (self.data.Close[-1] * STOP_LOSS_PCT)
            self.sell(size=size, sl=self.data.Close[-1] * (1 + STOP_LOSS_PCT), tp=self.data.Close[-1] * (1 - 2 * STOP_LOSS_PCT))
        
        # Drawdown control
        if self.equity < self._broker._initial_cash * (1 - 0.15):  # Pause at 15% drawdown
            self.position.close()
        if self.equity < self._broker._initial_cash * (1 - MAX_DRAWDOWN):  # Close all at 20%
            self.position.close()
            self._broker._trades = []  # Prevent further trades

# Fetch S&P 500 tickers
tickers = get_sp500_tickers()

# Backtest across S&P 500 stocks
results = []
for ticker in tickers[:10]:  # Limit to 10 stocks for testing; remove slice for full run
    try:
        data = yf.download(ticker, start='2020-01-01', end='2025-07-06', interval='1d')
        if data.empty:
            continue
        bt = Backtest(data, SP500HighWinRateStrategy, cash=100000, commission=.002, exclusive_orders=True)
        stats = bt.run()
        results.append({
            'Ticker': ticker,
            'Win Rate (%)': stats['Win Rate [%]'],
            'Max Drawdown (%)': stats['Max. Drawdown [%]'],
            'Return (%)': stats['Return [%]'],
            'Sharpe Ratio': stats['Sharpe Ratio'],
            'Trades': stats['# Trades']
        })
        print(f"Results for {ticker}:")
        print(f"Win Rate: {stats['Win Rate [%]']:.2f}%")
        print(f"Max Drawdown: {stats['Max. Drawdown [%]']:.2f}%")
        print(f"Return: {stats['Return [%]']:.2f}%")
        print(f"Sharpe Ratio: {stats['Sharpe Ratio']:.2f}")
        print(f"Number of Trades: {stats['# Trades']}\n")
    except Exception as e:
        print(f"Error processing {ticker}: {e}")

# Aggregate results
results_df = pd.DataFrame(results)
if not results_df.empty:
    avg_win_rate = results_df['Win Rate (%)'].mean()
    max_drawdown = results_df['Max Drawdown (%)'].max()
    avg_return = results_df['Return (%)'].mean()
    avg_sharpe = results_df['Sharpe Ratio'].mean()
    total_trades = results_df['Trades'].sum()
    print("Aggregate Results for S&P 500 Stocks:")
    print(f"Average Win Rate: {avg_win_rate:.2f}%")
    print(f"Maximum Drawdown: {max_drawdown:.2f}%")
    print(f"Average Return: {avg_return:.2f}%")
    print(f"Average Sharpe Ratio: {avg_sharpe:.2f}")
    print(f"Total Trades: {total_trades}")

# Save results to CSV
results_df.to_csv('sp500_backtest_results.csv', index=False)

# Instructions:
# 1. Install required libraries: pip install yfinance backtesting pandas numpy scipy talib-binary pandas-datareader
# 2. Run the script to backtest the strategy on S&P 500 stocks (daily timeframe)
# 3. Check 'sp500_backtest_results.csv' for detailed results per stock
# 4. Adjust MIN_TRENDLINE_R2, CONFIRMATION_VOL_RATIO, RSI_BUY, RSI_SELL, or MIN_ADX to fine-tune win rate
# 5. For full S&P 500 run, remove [:10] from tickers loop (may take significant time)