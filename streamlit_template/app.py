"""
USDT Pairs Trading Dashboard - Binance Integration
Based on Seun Bot Trading Algorithms
"""

import streamlit as st
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import plotly.graph_objects as go
import time

# Import custom modules
from binance_data import BinanceDataFetcher, scrape_crypto_news, scrape_social_sentiment
from trading_analysis import TradingAnalyzer
from chart_components import *
from sample_data import generate_sample_trades, generate_pattern_signals, generate_market_sentiment, generate_cycle_analysis
from utils import format_currency, format_percentage, get_signal_color
from config import USDT_PAIRS, COLORS

# Page configuration
st.set_page_config(
    page_title="USDT Trading Dashboard - Seun Bot",
    page_icon="📈",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS
st.markdown("""
<style>
    .main-header {
        font-size: 2.5rem;
        font-weight: bold;
        text-align: center;
        color: #00ff88;
        margin-bottom: 2rem;
    }
    .metric-card {
        background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
        padding: 1rem;
        border-radius: 10px;
        margin: 0.5rem 0;
    }
    .signal-card {
        padding: 1rem;
        border-radius: 10px;
        margin: 0.5rem 0;
        border-left: 5px solid;
    }
    .bullish { border-left-color: #00ff88; background: rgba(0, 255, 136, 0.1); }
    .bearish { border-left-color: #ff4444; background: rgba(255, 68, 68, 0.1); }
    .neutral { border-left-color: #ffaa00; background: rgba(255, 170, 0, 0.1); }
</style>
""", unsafe_allow_html=True)

# Initialize components
@st.cache_resource
def initialize_components():
    return BinanceDataFetcher(), TradingAnalyzer()

data_fetcher, analyzer = initialize_components()

# Sidebar
st.sidebar.title("🚀 Seun Bot Dashboard")
st.sidebar.markdown("---")

# Navigation
page = st.sidebar.selectbox(
    "Navigation",
    ["🏠 Dashboard", "📊 Market Analysis", "🎯 Trading Signals", "📈 Performance", "⚙️ Settings"]
)

# Symbol selection
selected_symbol = st.sidebar.selectbox("Select USDT Pair", USDT_PAIRS)

# Timeframe selection
timeframe = st.sidebar.selectbox("Timeframe", ["1h", "4h", "1d", "1w"], index=2)

# Auto-refresh
auto_refresh = st.sidebar.checkbox("Auto Refresh (5min)", value=False)
if auto_refresh:
    time.sleep(300)  # 5 minutes
    st.rerun()

st.sidebar.markdown("---")
st.sidebar.markdown("### 🤖 Seun Bot Status")
st.sidebar.success("✅ Active")
st.sidebar.info(f"📊 Analyzing {len(USDT_PAIRS)} pairs")
st.sidebar.info(f"⏰ Last update: {datetime.now().strftime('%H:%M:%S')}")

# Main content
if page == "🏠 Dashboard":
    st.markdown('<h1 class="main-header">🚀 USDT Trading Dashboard - Seun Bot</h1>', unsafe_allow_html=True)
    
    # Market overview metrics
    col1, col2, col3, col4 = st.columns(4)
    
    with col1:
        market_overview = data_fetcher.get_market_overview()
        st.metric("Total Market Cap", format_currency(market_overview['total_market_cap']), "2.3%")
    
    with col2:
        st.metric("BTC Dominance", f"{market_overview['btc_dominance']:.1f}%", "-0.5%")
    
    with col3:
        st.metric("Fear & Greed", f"{market_overview['fear_greed_index']}", "5")
    
    with col4:
        current_price = data_fetcher.get_symbol_price(selected_symbol)
        st.metric(f"{selected_symbol} Price", f"${current_price:.4f}", "1.2%")
    
    # Main dashboard layout
    col1, col2 = st.columns([2, 1])
    
    with col1:
        st.subheader(f"📊 {selected_symbol} Price Chart")
        
        # Get price data
        df = data_fetcher.get_kline_data(selected_symbol, timeframe, 200)
        if df is not None and not df.empty:
            # Create candlestick chart
            fig = create_candlestick_chart(df, f"{selected_symbol} - {timeframe}")
            st.plotly_chart(fig, use_container_width=True)
            
            # Technical analysis
            analysis = analyzer.analyze_symbol(df, selected_symbol)
            if analysis:
                st.subheader("🔍 Technical Analysis")
                
                # Signal display
                signal_class = "bullish" if "Buy" in analysis['signal'] else "bearish" if "Sell" in analysis['signal'] else "neutral"
                st.markdown(f"""
                <div class="signal-card {signal_class}">
                    <h3>Signal: {analysis['signal']}</h3>
                    <p>Score: {analysis['score']}</p>
                    <p>Current Price: ${analysis['current_price']:.4f}</p>
                </div>
                """, unsafe_allow_html=True)
                
                # Pattern detection
                active_patterns = [p for p, active in analysis['patterns'].items() if active]
                if active_patterns:
                    st.write("**Detected Patterns:**", ", ".join(active_patterns))
                
                # Cycle analysis
                st.text(analysis['cycle_analysis'])
        else:
            st.error("Unable to fetch price data")
    
    with col2:
        st.subheader("📈 Top Movers")
        
        # Get market data
        market_data = data_fetcher.get_top_gainers_losers()
        if not market_data.empty:
            # Top gainers
            st.write("**🟢 Top Gainers**")
            gainers = market_data.nlargest(3, 'Change_24h')
            for _, row in gainers.iterrows():
                st.write(f"**{row['Symbol']}**: +{row['Change_24h']:.2f}%")
            
            st.write("**🔴 Top Losers**")
            losers = market_data.nsmallest(3, 'Change_24h')
            for _, row in losers.iterrows():
                st.write(f"**{row['Symbol']}**: {row['Change_24h']:.2f}%")
        
        # Market sentiment
        st.subheader("😊 Market Sentiment")
        sentiment_data = generate_market_sentiment()
        sentiment_fig = create_sentiment_gauge(sentiment_data['Social_Sentiment'])
        st.plotly_chart(sentiment_fig, use_container_width=True)
        
        # Recent news
        st.subheader("📰 Crypto News")
        news = scrape_crypto_news()
        for item in news[:3]:
            st.write(f"• {item['headline']}")

elif page == "📊 Market Analysis":
    st.title("📊 Market Analysis")
    
    # Multi-symbol analysis
    st.subheader("Multi-Symbol Analysis")
    
    # Get data for multiple symbols
    analysis_results = []
    progress_bar = st.progress(0)
    
    for i, symbol in enumerate(USDT_PAIRS[:10]):  # Analyze first 10 pairs
        df = data_fetcher.get_kline_data(symbol, '1d', 100)
        if df is not None and not df.empty:
            analysis = analyzer.analyze_symbol(df, symbol)
            if analysis:
                analysis_results.append({
                    'Symbol': symbol,
                    'Signal': analysis['signal'],
                    'Score': analysis['score'],
                    'Price': analysis['current_price'],
                    'Patterns': len([p for p, active in analysis['patterns'].items() if active])
                })
        progress_bar.progress((i + 1) / 10)
    
    # Display results
    if analysis_results:
        results_df = pd.DataFrame(analysis_results)
        
        # Sort by score
        results_df = results_df.sort_values('Score', ascending=False)
        
        # Display table
        st.dataframe(
            results_df.style.format({
                'Score': '{:.2f}',
                'Price': '${:.4f}'
            }).applymap(
                lambda x: f'color: {get_signal_color(x)}' if isinstance(x, str) and any(word in x for word in ['Buy', 'Sell', 'Neutral']) else '',
                subset=['Signal']
            ),
            use_container_width=True
        )
        
        # Charts
        col1, col2 = st.columns(2)
        
        with col1:
            # Signal distribution
            signal_counts = results_df['Signal'].value_counts()
            fig_signals = px.pie(values=signal_counts.values, names=signal_counts.index, 
                               title="Signal Distribution")
            fig_signals.update_layout(template='plotly_dark')
            st.plotly_chart(fig_signals, use_container_width=True)
        
        with col2:
            # Score distribution
            fig_scores = px.histogram(results_df, x='Score', title="Score Distribution", 
                                    nbins=20, color_discrete_sequence=['#00ff88'])
            fig_scores.update_layout(template='plotly_dark')
            st.plotly_chart(fig_scores, use_container_width=True)

elif page == "🎯 Trading Signals":
    st.title("🎯 Trading Signals")
    
    # Generate trading signals
    st.subheader("Active Trading Signals")
    
    signals_df = generate_pattern_signals()
    
    # Filter by signal strength
    signal_filter = st.selectbox("Filter by Signal", ["All", "Strong Buy", "Buy", "Strong Sell", "Sell"])
    
    if signal_filter != "All":
        filtered_signals = signals_df[signals_df['Signal'] == signal_filter]
    else:
        filtered_signals = signals_df
    
    # Display signals
    for _, signal in filtered_signals.iterrows():
        signal_class = "bullish" if "Buy" in signal['Signal'] else "bearish" if "Sell" in signal['Signal'] else "neutral"
        
        st.markdown(f"""
        <div class="signal-card {signal_class}">
            <h4>{signal['Symbol']} - {signal['Signal']}</h4>
            <p><strong>Pattern:</strong> {signal['Pattern']}</p>
            <p><strong>Confidence:</strong> {signal['Confidence']}%</p>
            <p><strong>Timeframe:</strong> {signal['Timeframe']}</p>
            <p><strong>Detected:</strong> {signal['Detected_At'].strftime('%Y-%m-%d %H:%M')}</p>
        </div>
        """, unsafe_allow_html=True)
    
    # Signal statistics
    st.subheader("📊 Signal Statistics")
    col1, col2, col3 = st.columns(3)
    
    with col1:
        st.metric("Total Signals", len(signals_df))
    
    with col2:
        buy_signals = len(signals_df[signals_df['Signal'].str.contains('Buy')])
        st.metric("Buy Signals", buy_signals)
    
    with col3:
        sell_signals = len(signals_df[signals_df['Signal'].str.contains('Sell')])
        st.metric("Sell Signals", sell_signals)

elif page == "📈 Performance":
    st.title("📈 Trading Performance")
    
    # Generate sample trading data
    trades_df = generate_sample_trades(selected_symbol, 30)
    
    if not trades_df.empty:
        # Performance metrics
        col1, col2, col3, col4 = st.columns(4)
        
        total_pnl = trades_df['PnL'].sum()
        win_rate = len(trades_df[trades_df['PnL'] > 0]) / len(trades_df) * 100
        avg_win = trades_df[trades_df['PnL'] > 0]['PnL'].mean() if len(trades_df[trades_df['PnL'] > 0]) > 0 else 0
        avg_loss = trades_df[trades_df['PnL'] < 0]['PnL'].mean() if len(trades_df[trades_df['PnL'] < 0]) > 0 else 0
        
        with col1:
            st.metric("Total P&L", format_currency(total_pnl), 
                     f"{total_pnl/abs(total_pnl)*100:.1f}%" if total_pnl != 0 else "0%")
        
        with col2:
            st.metric("Win Rate", f"{win_rate:.1f}%")
        
        with col3:
            st.metric("Avg Win", format_currency(avg_win))
        
        with col4:
            st.metric("Avg Loss", format_currency(avg_loss))
        
        # Performance chart
        performance_fig = create_performance_chart(trades_df)
        st.plotly_chart(performance_fig, use_container_width=True)
        
        # Trade history
        st.subheader("📋 Recent Trades")
        st.dataframe(
            trades_df.tail(10).style.format({
                'Entry_Price': '${:.4f}',
                'Exit_Price': '${:.4f}',
                'PnL': '${:.2f}'
            }).applymap(
                lambda x: 'color: green' if x > 0 else 'color: red' if x < 0 else '',
                subset=['PnL']
            ),
            use_container_width=True
        )

elif page == "⚙️ Settings":
    st.title("⚙️ Settings")
    
    st.subheader("🔧 Trading Parameters")
    
    col1, col2 = st.columns(2)
    
    with col1:
        st.slider("Risk per Trade (%)", 1, 10, 3)
        st.slider("Max Positions", 1, 20, 5)
        st.selectbox("Default Timeframe", ["1h", "4h", "1d", "1w"], index=2)
    
    with col2:
        st.slider("Stop Loss (%)", 1, 20, 8)
        st.slider("Take Profit (%)", 5, 50, 15)
        st.checkbox("Enable Notifications", True)
    
    st.subheader("📊 Display Settings")
    
    col1, col2 = st.columns(2)
    
    with col1:
        st.selectbox("Chart Theme", ["Dark", "Light"], index=0)
        st.slider("Chart Height", 400, 800, 600)
    
    with col2:
        st.selectbox("Currency Display", ["USD", "BTC", "ETH"], index=0)
        st.slider("Decimal Places", 2, 8, 4)
    
    st.subheader("🤖 Bot Configuration")
    
    st.text_area("API Keys", "Configure your Binance API keys here...", height=100)
    st.checkbox("Enable Paper Trading", True)
    st.checkbox("Enable Real Trading", False)
    
    if st.button("💾 Save Settings"):
        st.success("Settings saved successfully!")

# Footer
st.markdown("---")
st.markdown(
    """
    <div style='text-align: center; color: #888888;'>
        🚀 USDT Trading Dashboard powered by Seun Bot Algorithms<br>
        Built with Streamlit • Real-time Binance Integration • Advanced Pattern Recognition
    </div>
    """, 
    unsafe_allow_html=True
)