"""Generate sample data for demonstration purposes"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import random

def generate_sample_ohlcv(symbol, days=365):
    """Generate sample OHLCV data for a symbol"""
    np.random.seed(hash(symbol) % 2**32)  # Consistent data per symbol
    
    # Base prices for different symbols
    base_prices = {
        'BTCUSDT': 45000, 'ETHUSDT': 3000, 'BNBUSDT': 400, 'ADAUSDT': 0.5,
        'XRPUSDT': 0.6, 'SOLUSDT': 100, 'DOTUSDT': 25, 'DOGEUSDT': 0.08,
        'AVAXUSDT': 35, 'SHIBUSDT': 0.00002, 'MATICUSDT': 1.2, 'LTCUSDT': 150,
        'UNIUSDT': 25, 'LINKUSDT': 15, 'ATOMUSDT': 12
    }
    
    base_price = base_prices.get(symbol, 100)
    dates = pd.date_range(start=datetime.now() - timedelta(days=days), 
                         end=datetime.now(), freq='D')
    
    # Generate price movements with trend
    price_changes = np.random.normal(0, 0.02, len(dates))  # 2% daily volatility
    trend = np.linspace(-0.1, 0.3, len(dates))  # Overall upward trend
    price_changes += trend * 0.001  # Add trend component
    
    prices = [base_price]
    for change in price_changes[1:]:
        new_price = prices[-1] * (1 + change)
        prices.append(max(new_price, base_price * 0.1))  # Prevent extreme drops
    
    # Generate OHLCV data
    data = []
    for i, (date, close) in enumerate(zip(dates, prices)):
        daily_vol = abs(np.random.normal(0, 0.015))  # Daily volatility
        high = close * (1 + daily_vol)
        low = close * (1 - daily_vol)
        open_price = prices[i-1] if i > 0 else close
        volume = random.randint(1000000, 50000000)
        
        data.append({
            'Date': date,
            'Open': open_price,
            'High': high,
            'Low': low,
            'Close': close,
            'Volume': volume
        })
    
    return pd.DataFrame(data)

def generate_sample_trades(symbol, num_trades=50):
    """Generate sample trading history"""
    trades = []
    base_price = 100
    
    for i in range(num_trades):
        entry_date = datetime.now() - timedelta(days=random.randint(1, 365))
        exit_date = entry_date + timedelta(days=random.randint(1, 30))
        
        entry_price = base_price * (1 + random.uniform(-0.2, 0.2))
        exit_price = entry_price * (1 + random.uniform(-0.1, 0.15))
        
        quantity = random.uniform(0.1, 10)
        side = random.choice(['BUY', 'SELL'])
        
        pnl = (exit_price - entry_price) * quantity if side == 'BUY' else (entry_price - exit_price) * quantity
        
        trades.append({
            'Symbol': symbol,
            'Side': side,
            'Entry_Date': entry_date,
            'Exit_Date': exit_date,
            'Entry_Price': round(entry_price, 4),
            'Exit_Price': round(exit_price, 4),
            'Quantity': round(quantity, 4),
            'PnL': round(pnl, 2),
            'Status': 'Closed'
        })
    
    return pd.DataFrame(trades)

def generate_pattern_signals():
    """Generate sample pattern detection signals"""
    patterns = [
        'Rising Wedge', 'Falling Wedge', 'Ascending Triangle', 'Descending Triangle',
        'Head and Shoulders', 'Inverse Head and Shoulders', 'Bull Flag', 'Bear Flag',
        'Double Top', 'Double Bottom', 'Cup and Handle', 'Symmetrical Triangle'
    ]
    
    signals = []
    for i in range(20):
        signal = {
            'Symbol': random.choice(['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'ADAUSDT']),
            'Pattern': random.choice(patterns),
            'Signal': random.choice(['Buy', 'Sell', 'Strong Buy', 'Strong Sell', 'Neutral']),
            'Confidence': random.randint(60, 95),
            'Timeframe': random.choice(['1h', '4h', '1d', '1w']),
            'Detected_At': datetime.now() - timedelta(hours=random.randint(1, 72))
        }
        signals.append(signal)
    
    return pd.DataFrame(signals)

def generate_market_sentiment():
    """Generate sample market sentiment data"""
    return {
        'Fear_Greed_Index': random.randint(20, 80),
        'Social_Sentiment': random.uniform(-1, 1),
        'News_Sentiment': random.uniform(-1, 1),
        'Technical_Sentiment': random.uniform(-1, 1),
        'Overall_Sentiment': random.choice(['Bullish', 'Bearish', 'Neutral'])
    }

def generate_cycle_analysis(symbol):
    """Generate sample cycle analysis"""
    phases = ['Early Bull', 'Mid Bull', 'Late Bull', 'Early Bear', 'Mid Bear', 'Late Bear']
    current_phase = random.choice(phases)
    duration = random.randint(10, 90)
    
    return {
        'symbol': symbol,
        'current_phase': current_phase,
        'duration': duration,
        'momentum': random.uniform(0, 1),
        'bull_probability': random.randint(30, 90),
        'bear_probability': random.randint(10, 70),
        'risk_level': random.choice(['Low', 'Medium', 'High']),
        'expected_continuation': f"{random.randint(5, 60)} days"
    }