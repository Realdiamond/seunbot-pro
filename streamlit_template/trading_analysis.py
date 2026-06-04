"""Trading analysis module based on Seun Bot algorithms"""

import pandas as pd
import numpy as np
from scipy.signal import argrelextrema
from sklearn.linear_model import LinearRegression
from datetime import datetime, timedelta
from config import *
from utils import heikin_ashi

class TradingAnalyzer:
    def __init__(self):
        self.pattern_sensitivity = PATTERN_SENSITIVITY
        self.zigzag_length = ZIGZAG_LENGTH
        self.lookback = PATTERN_LOOKBACK
    
    def calculate_rsi(self, prices, period=14):
        """Calculate RSI manually"""
        delta = pd.Series(prices).diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()
        rs = gain / loss
        rsi = 100 - (100 / (1 + rs))
        return rsi.fillna(50).values
    
    def calculate_macd(self, prices, fast=12, slow=26, signal=9):
        """Calculate MACD manually"""
        prices_series = pd.Series(prices)
        ema_fast = prices_series.ewm(span=fast).mean()
        ema_slow = prices_series.ewm(span=slow).mean()
        macd = ema_fast - ema_slow
        macd_signal = macd.ewm(span=signal).mean()
        macd_hist = macd - macd_signal
        return macd.values, macd_signal.values, macd_hist.values
    
    def calculate_bollinger_bands(self, prices, period=20, std_dev=2):
        """Calculate Bollinger Bands manually"""
        prices_series = pd.Series(prices)
        sma = prices_series.rolling(window=period).mean()
        std = prices_series.rolling(window=period).std()
        upper_band = sma + (std * std_dev)
        lower_band = sma - (std * std_dev)
        return upper_band.values, sma.values, lower_band.values
    
    def calculate_atr(self, high, low, close, period=14):
        """Calculate ATR manually"""
        high_low = pd.Series(high) - pd.Series(low)
        high_close = np.abs(pd.Series(high) - pd.Series(close).shift())
        low_close = np.abs(pd.Series(low) - pd.Series(close).shift())
        ranges = pd.concat([high_low, high_close, low_close], axis=1).max(axis=1)
        atr = ranges.rolling(window=period).mean()
        return atr.fillna(0).values
    
    def detect_zigzag_pivots(self, data):
        """Detect significant pivot points using zigzag algorithm"""
        prices = data['Close'].values if 'HA_Close' not in data.columns else data['HA_Close'].values
        
        # Find local maxima and minima
        pivot_highs = argrelextrema(prices, np.greater, order=self.zigzag_length)[0]
        pivot_lows = argrelextrema(prices, np.less, order=self.zigzag_length)[0]
        
        # Combine and sort pivots
        all_pivots = list(pivot_highs) + list(pivot_lows)
        all_pivots.sort()
        
        # Filter by significance
        filtered_pivots = []
        for i in all_pivots:
            if len(filtered_pivots) < 2:
                filtered_pivots.append(i)
            else:
                last_price = prices[filtered_pivots[-1]]
                current_price = prices[i]
                change = abs(current_price - last_price) / last_price
                if change > self.pattern_sensitivity:
                    filtered_pivots.append(i)
        
        # Classify pivots
        pivot_data = []
        for idx in filtered_pivots:
            pivot_type = 'high' if idx in pivot_highs else 'low'
            pivot_data.append((idx, prices[idx], pivot_type))
        
        return pivot_data[-10:]  # Return last 10 pivots
    
    def detect_patterns(self, df, pivots):
        """Detect chart patterns"""
        patterns = {
            'rising_wedge': False,
            'falling_wedge': False,
            'ascending_triangle': False,
            'descending_triangle': False,
            'head_shoulders': False,
            'inverse_head_shoulders': False,
            'double_top': False,
            'double_bottom': False,
            'bull_flag': False,
            'bear_flag': False,
            'cup_handle': False,
            'symmetrical_triangle': False
        }
        
        if len(pivots) < 5:
            return patterns
        
        # Extract recent pivots
        recent = pivots[-5:]
        prices = [p[1] for p in recent]
        types = [p[2] for p in recent]
        
        # Pattern detection logic
        # Rising Wedge: Higher lows, lower highs
        if len([p for p in recent if p[2] == 'low']) >= 2 and len([p for p in recent if p[2] == 'high']) >= 2:
            lows = [p[1] for p in recent if p[2] == 'low']
            highs = [p[1] for p in recent if p[2] == 'high']
            
            if len(lows) >= 2 and len(highs) >= 2:
                # Rising wedge: higher lows, lower highs
                if lows[-1] > lows[0] and highs[-1] < highs[0]:
                    patterns['rising_wedge'] = True
                # Falling wedge: lower lows, higher highs
                elif lows[-1] < lows[0] and highs[-1] > highs[0]:
                    patterns['falling_wedge'] = True
        
        # Head and Shoulders pattern
        if len(recent) >= 5 and types == ['low', 'high', 'low', 'high', 'low']:
            left_shoulder, head, valley, right_shoulder, neckline = prices
            if head > left_shoulder and head > right_shoulder and abs(left_shoulder - right_shoulder) < head * 0.05:
                patterns['head_shoulders'] = True
        
        # Double Top/Bottom
        if len(recent) >= 3:
            if types[-3:] == ['high', 'low', 'high']:
                if abs(prices[-3] - prices[-1]) / prices[-3] < 0.02:  # Within 2%
                    patterns['double_top'] = True
            elif types[-3:] == ['low', 'high', 'low']:
                if abs(prices[-3] - prices[-1]) / prices[-3] < 0.02:
                    patterns['double_bottom'] = True
        
        return patterns
    
    def detect_elliott_waves(self, pivots):
        """Detect Elliott Wave patterns"""
        waves = {
            'impulse_wave': False,
            'corrective_wave': False,
            'wave_count': 0,
            'current_wave': None
        }
        
        if len(pivots) < 5:
            return waves
        
        # Simplified Elliott Wave detection
        # Look for 5-wave impulse pattern
        if len(pivots) >= 5:
            types = [p[2] for p in pivots[-5:]]
            if types == ['low', 'high', 'low', 'high', 'low']:
                waves['impulse_wave'] = True
                waves['wave_count'] = 5
                waves['current_wave'] = 'Wave 5'
        
        return waves
    
    def detect_smart_money_concepts(self, df):
        """Detect Smart Money Concepts (Order Blocks, FVGs, etc.)"""
        smc = {
            'order_blocks': [],
            'fair_value_gaps': [],
            'liquidity_zones': [],
            'market_structure': 'Unknown'
        }
        
        if len(df) < 20:
            return smc
        
        # Order Blocks detection
        for i in range(10, len(df)-5):
            # Bullish Order Block: Strong bullish candle followed by consolidation
            if (df['Close'].iloc[i] > df['Open'].iloc[i] and 
                (df['Close'].iloc[i] - df['Open'].iloc[i]) / df['Open'].iloc[i] > 0.02):
                smc['order_blocks'].append({
                    'type': 'bullish',
                    'price': df['Low'].iloc[i],
                    'index': i
                })
        
        # Fair Value Gaps detection
        for i in range(2, len(df)-1):
            # Bullish FVG: Gap between previous high and next low
            if df['Low'].iloc[i+1] > df['High'].iloc[i-1]:
                smc['fair_value_gaps'].append({
                    'type': 'bullish',
                    'upper': df['Low'].iloc[i+1],
                    'lower': df['High'].iloc[i-1],
                    'index': i
                })
        
        # Market Structure
        recent_highs = df['High'].tail(20).max()
        recent_lows = df['Low'].tail(20).min()
        current_price = df['Close'].iloc[-1]
        
        if current_price > recent_highs * 0.95:
            smc['market_structure'] = 'Bullish'
        elif current_price < recent_lows * 1.05:
            smc['market_structure'] = 'Bearish'
        else:
            smc['market_structure'] = 'Sideways'
        
        return smc
    
    def calculate_technical_indicators(self, df):
        """Calculate technical indicators"""
        indicators = {}
        
        # Basic indicators using manual calculations
        indicators['RSI'] = self.calculate_rsi(df['Close'].values)
        indicators['MACD'], indicators['MACD_signal'], indicators['MACD_hist'] = self.calculate_macd(df['Close'].values)
        indicators['BB_upper'], indicators['BB_middle'], indicators['BB_lower'] = self.calculate_bollinger_bands(df['Close'].values)
        indicators['ATR'] = self.calculate_atr(df['High'].values, df['Low'].values, df['Close'].values)
        
        # Moving averages
        indicators['SMA_20'] = df['Close'].rolling(window=20).mean().values
        indicators['SMA_50'] = df['Close'].rolling(window=50).mean().values
        indicators['EMA_12'] = df['Close'].ewm(span=12).mean().values
        indicators['EMA_26'] = df['Close'].ewm(span=26).mean().values
        
        # ADX calculation (simplified)
        high_low = df['High'] - df['Low']
        high_close = np.abs(df['High'] - df['Close'].shift())
        low_close = np.abs(df['Low'] - df['Close'].shift())
        ranges = pd.concat([high_low, high_close, low_close], axis=1).max(axis=1)
        indicators['ADX'] = ranges.rolling(window=14).mean().fillna(25).values
        
        return indicators
    
    def generate_cycle_analysis(self, df, symbol):
        """Generate cycle analysis similar to Seun Bot"""
        if len(df) < 30:
            return "Insufficient data for cycle analysis"
        
        # Determine current phase
        current_price = df['Close'].iloc[-1]
        ma_20 = df['Close'].rolling(20).mean().iloc[-1]
        ma_50 = df['Close'].rolling(50).mean().iloc[-1] if len(df) >= 50 else ma_20
        
        if current_price > ma_20 > ma_50:
            phase = "Bull"
            stage = "Momentum Phase"
        elif current_price > ma_20:
            phase = "Bull"
            stage = "Early Phase"
        elif current_price < ma_20 < ma_50:
            phase = "Bear"
            stage = "Distribution Phase"
        else:
            phase = "Bear"
            stage = "Late Phase"
        
        # Calculate momentum
        price_change = (current_price - df['Close'].iloc[-20]) / df['Close'].iloc[-20]
        momentum = min(1.0, max(0.0, abs(price_change) * 5))
        
        # Generate probabilities
        bull_prob = 70 if phase == "Bull" else 30
        bear_prob = 100 - bull_prob
        
        # Risk assessment
        volatility = df['Close'].pct_change().std() * np.sqrt(252)
        if volatility > 0.5:
            risk_level = "High"
        elif volatility > 0.3:
            risk_level = "Medium"
        else:
            risk_level = "Low"
        
        cycle_box = f"""
┌─────────────────────────────────────────┐
│        CYCLE ANALYSIS: {symbol:<8}        │
├─────────────────────────────────────────┤
│  Phase: {phase} ({stage})               │
│  Momentum: {'▲' * int(momentum * 10)}   │
│  Bull Probability: {bull_prob}%         │
│  Bear Probability: {bear_prob}%         │
│  Risk Level: {risk_level}               │
│  Current Price: ${current_price:.4f}    │
└─────────────────────────────────────────┘
"""
        return cycle_box
    
    def generate_trading_signal(self, df, patterns, waves, smc, indicators):
        """Generate comprehensive trading signal"""
        signal_score = 0.0
        
        # Pattern scoring
        bullish_patterns = ['rising_wedge', 'ascending_triangle', 'inverse_head_shoulders', 
                           'double_bottom', 'bull_flag', 'cup_handle']
        bearish_patterns = ['falling_wedge', 'descending_triangle', 'head_shoulders', 
                           'double_top', 'bear_flag']
        
        for pattern in bullish_patterns:
            if patterns.get(pattern, False):
                signal_score += 1.0
        
        for pattern in bearish_patterns:
            if patterns.get(pattern, False):
                signal_score -= 1.0
        
        # Elliott Wave scoring
        if waves['impulse_wave']:
            signal_score += 1.5
        
        # SMC scoring
        if smc['market_structure'] == 'Bullish':
            signal_score += 1.0
        elif smc['market_structure'] == 'Bearish':
            signal_score -= 1.0
        
        # Technical indicator scoring
        current_rsi = indicators['RSI'][-1] if len(indicators['RSI']) > 0 else 50
        if current_rsi < 30:
            signal_score += 0.5  # Oversold
        elif current_rsi > 70:
            signal_score -= 0.5  # Overbought
        
        # MACD scoring
        if len(indicators['MACD']) > 1 and len(indicators['MACD_signal']) > 1:
            if indicators['MACD'][-1] > indicators['MACD_signal'][-1]:
                signal_score += 0.5
            else:
                signal_score -= 0.5
        
        # Generate final signal
        if signal_score >= 3.0:
            return 'Strong Buy', signal_score
        elif signal_score >= 1.5:
            return 'Buy', signal_score
        elif signal_score <= -3.0:
            return 'Strong Sell', signal_score
        elif signal_score <= -1.5:
            return 'Sell', signal_score
        else:
            return 'Neutral', signal_score
    
    def analyze_symbol(self, df, symbol):
        """Complete analysis for a symbol"""
        if df is None or len(df) < 20:
            return None
        
        # Convert to Heikin-Ashi if needed
        if 'HA_Close' not in df.columns:
            df = heikin_ashi(df)
        
        # Detect pivots and patterns
        pivots = self.detect_zigzag_pivots(df)
        patterns = self.detect_patterns(df, pivots)
        waves = self.detect_elliott_waves(pivots)
        smc = self.detect_smart_money_concepts(df)
        indicators = self.calculate_technical_indicators(df)
        
        # Generate signal
        signal, score = self.generate_trading_signal(df, patterns, waves, smc, indicators)
        
        # Generate cycle analysis
        cycle_analysis = self.generate_cycle_analysis(df, symbol)
        
        return {
            'symbol': symbol,
            'signal': signal,
            'score': round(score, 2),
            'current_price': df['Close'].iloc[-1],
            'patterns': patterns,
            'waves': waves,
            'smc': smc,
            'indicators': indicators,
            'cycle_analysis': cycle_analysis,
            'pivots': pivots
        }