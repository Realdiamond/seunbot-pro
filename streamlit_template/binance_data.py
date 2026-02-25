"""Binance data fetching and web scraping functionality"""

import requests
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import streamlit as st
from sample_data import generate_sample_ohlcv, generate_sample_trades
import time

class BinanceDataFetcher:
    def __init__(self):
        self.base_url = "https://api.binance.com/api/v3"
        self.demo_mode = True  # Set to True for demo without API keys
    
    @st.cache_data(ttl=300)  # Cache for 5 minutes
    def get_symbol_price(_self, symbol):
        """Get current price for a symbol"""
        if _self.demo_mode:
            # Generate realistic sample price
            base_prices = {
                'BTCUSDT': 45000, 'ETHUSDT': 3000, 'BNBUSDT': 400, 'ADAUSDT': 0.5,
                'XRPUSDT': 0.6, 'SOLUSDT': 100, 'DOTUSDT': 25, 'DOGEUSDT': 0.08
            }
            base = base_prices.get(symbol, 100)
            variation = np.random.uniform(-0.05, 0.05)  # ±5% variation
            return base * (1 + variation)
        
        try:
            url = f"{_self.base_url}/ticker/price"
            params = {'symbol': symbol}
            response = requests.get(url, params=params, timeout=10)
            data = response.json()
            return float(data['price'])
        except Exception as e:
            st.error(f"Error fetching price for {symbol}: {e}")
            return None
    
    @st.cache_data(ttl=300)
    def get_24hr_stats(_self, symbol):
        """Get 24hr ticker statistics"""
        if _self.demo_mode:
            price = _self.get_symbol_price(symbol)
            return {
                'symbol': symbol,
                'priceChange': round(price * np.random.uniform(-0.1, 0.1), 4),
                'priceChangePercent': round(np.random.uniform(-10, 10), 2),
                'weightedAvgPrice': round(price * 0.99, 4),
                'prevClosePrice': round(price * 0.98, 4),
                'lastPrice': price,
                'bidPrice': round(price * 0.999, 4),
                'askPrice': round(price * 1.001, 4),
                'openPrice': round(price * 0.97, 4),
                'highPrice': round(price * 1.05, 4),
                'lowPrice': round(price * 0.95, 4),
                'volume': round(np.random.uniform(1000, 50000), 2),
                'count': np.random.randint(10000, 100000)
            }
        
        try:
            url = f"{_self.base_url}/ticker/24hr"
            params = {'symbol': symbol}
            response = requests.get(url, params=params, timeout=10)
            return response.json()
        except Exception as e:
            st.error(f"Error fetching 24hr stats for {symbol}: {e}")
            return None
    
    @st.cache_data(ttl=600)  # Cache for 10 minutes
    def get_kline_data(_self, symbol, interval='1d', limit=500):
        """Get kline/candlestick data"""
        if _self.demo_mode:
            # Generate sample OHLCV data
            days = min(limit, 365)
            return generate_sample_ohlcv(symbol, days)
        
        try:
            url = f"{_self.base_url}/klines"
            params = {
                'symbol': symbol,
                'interval': interval,
                'limit': limit
            }
            response = requests.get(url, params=params, timeout=10)
            data = response.json()
            
            df = pd.DataFrame(data, columns=[
                'Open_time', 'Open', 'High', 'Low', 'Close', 'Volume',
                'Close_time', 'Quote_asset_volume', 'Number_of_trades',
                'Taker_buy_base_asset_volume', 'Taker_buy_quote_asset_volume', 'Ignore'
            ])
            
            # Convert to proper data types
            df['Date'] = pd.to_datetime(df['Open_time'], unit='ms')
            for col in ['Open', 'High', 'Low', 'Close', 'Volume']:
                df[col] = pd.to_numeric(df[col])
            
            return df[['Date', 'Open', 'High', 'Low', 'Close', 'Volume']]
        
        except Exception as e:
            st.error(f"Error fetching kline data for {symbol}: {e}")
            return None
    
    def get_top_gainers_losers(self):
        """Get top gainers and losers"""
        symbols = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'ADAUSDT', 'XRPUSDT', 
                  'SOLUSDT', 'DOTUSDT', 'DOGEUSDT', 'AVAXUSDT', 'MATICUSDT']
        
        data = []
        for symbol in symbols:
            stats = self.get_24hr_stats(symbol)
            if stats:
                data.append({
                    'Symbol': symbol,
                    'Price': float(stats['lastPrice']),
                    'Change_24h': float(stats['priceChangePercent']),
                    'Volume': float(stats['volume'])
                })
        
        df = pd.DataFrame(data)
        if not df.empty:
            df = df.sort_values('Change_24h', ascending=False)
        
        return df
    
    def scrape_tradingview_sentiment(self, symbol):
        """Scrape sentiment data from TradingView (simulated)"""
        # In a real implementation, this would scrape TradingView
        # For demo purposes, we'll return simulated data
        sentiments = ['Strong Buy', 'Buy', 'Neutral', 'Sell', 'Strong Sell']
        return {
            'symbol': symbol,
            'technical_rating': np.random.choice(sentiments),
            'ma_rating': np.random.choice(sentiments),
            'oscillator_rating': np.random.choice(sentiments),
            'summary_rating': np.random.choice(sentiments),
            'recommendation_score': np.random.uniform(-1, 1)
        }
    
    def get_market_overview(self):
        """Get overall market overview"""
        total_market_cap = np.random.uniform(1.5e12, 2.5e12)  # $1.5T - $2.5T
        btc_dominance = np.random.uniform(40, 60)
        fear_greed = np.random.randint(20, 80)
        
        return {
            'total_market_cap': total_market_cap,
            'btc_dominance': btc_dominance,
            'fear_greed_index': fear_greed,
            'active_cryptos': np.random.randint(8000, 12000),
            'markets': np.random.randint(20000, 30000)
        }

# Web scraping functions for additional data
def scrape_crypto_news():
    """Scrape crypto news headlines (simulated)"""
    sample_news = [
        "Bitcoin reaches new monthly high amid institutional adoption",
        "Ethereum 2.0 staking rewards attract more validators",
        "DeFi protocols see increased TVL as yields improve",
        "Major exchange announces new USDT trading pairs",
        "Regulatory clarity boosts cryptocurrency market sentiment"
    ]
    
    news_data = []
    for i, headline in enumerate(sample_news):
        news_data.append({
            'headline': headline,
            'timestamp': datetime.now() - timedelta(hours=i*2),
            'sentiment': np.random.choice(['Positive', 'Neutral', 'Negative']),
            'impact': np.random.choice(['High', 'Medium', 'Low'])
        })
    
    return news_data

def scrape_social_sentiment():
    """Scrape social media sentiment (simulated)"""
    return {
        'twitter_sentiment': np.random.uniform(-1, 1),
        'reddit_sentiment': np.random.uniform(-1, 1),
        'telegram_sentiment': np.random.uniform(-1, 1),
        'overall_social_score': np.random.uniform(-1, 1),
        'mention_volume': np.random.randint(1000, 10000)
    }