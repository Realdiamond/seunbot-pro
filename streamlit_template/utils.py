"""Utility functions for the trading dashboard"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import streamlit as st

def format_currency(value, decimals=2):
    """Format currency values"""
    if value >= 1e9:
        return f"${value/1e9:.{decimals}f}B"
    elif value >= 1e6:
        return f"${value/1e6:.{decimals}f}M"
    elif value >= 1e3:
        return f"${value/1e3:.{decimals}f}K"
    else:
        return f"${value:.{decimals}f}"

def format_percentage(value, decimals=2):
    """Format percentage values"""
    return f"{value:.{decimals}f}%"

def calculate_returns(prices):
    """Calculate returns from price series"""
    return prices.pct_change().fillna(0)

def calculate_volatility(returns, periods=252):
    """Calculate annualized volatility"""
    return returns.std() * np.sqrt(periods)

def calculate_sharpe_ratio(returns, risk_free_rate=0.02):
    """Calculate Sharpe ratio"""
    excess_returns = returns.mean() - risk_free_rate/252
    return excess_returns / returns.std() if returns.std() != 0 else 0

def get_signal_color(signal):
    """Get color for trading signal"""
    if 'Strong Buy' in signal:
        return '#00ff00'
    elif 'Buy' in signal:
        return '#88ff88'
    elif 'Strong Sell' in signal:
        return '#ff0000'
    elif 'Sell' in signal:
        return '#ff8888'
    else:
        return '#ffaa00'

def create_metric_card(title, value, delta=None, delta_color="normal"):
    """Create a metric card for display"""
    col1, col2 = st.columns([3, 1])
    with col1:
        st.metric(title, value, delta, delta_color=delta_color)

def heikin_ashi(df):
    """Convert dataframe to Heikin-Ashi candles"""
    df = df.copy()
    df['HA_Close'] = (df['Open'] + df['High'] + df['Low'] + df['Close']) / 4
    ha_open = [(df['Open'].iloc[0] + df['Close'].iloc[0]) / 2]
    for i in range(1, len(df)):
        ha_open.append((ha_open[i-1] + df['HA_Close'].iloc[i-1]) / 2)
    df['HA_Open'] = ha_open
    df['HA_High'] = df[['High', 'HA_Open', 'HA_Close']].max(axis=1)
    df['HA_Low'] = df[['Low', 'HA_Open', 'HA_Close']].min(axis=1)
    return df

def detect_support_resistance(prices, window=20):
    """Detect support and resistance levels"""
    highs = prices.rolling(window=window, center=True).max()
    lows = prices.rolling(window=window, center=True).min()
    
    resistance_levels = []
    support_levels = []
    
    for i in range(len(prices)):
        if prices.iloc[i] == highs.iloc[i]:
            resistance_levels.append(prices.iloc[i])
        if prices.iloc[i] == lows.iloc[i]:
            support_levels.append(prices.iloc[i])
    
    return {
        'resistance': list(set(resistance_levels))[-5:],  # Last 5 resistance levels
        'support': list(set(support_levels))[-5:]  # Last 5 support levels
    }

@st.cache_data(ttl=300)  # Cache for 5 minutes
def cached_analysis(symbol, timeframe):
    """Cache analysis results to improve performance"""
    return f"Cached analysis for {symbol} on {timeframe}"