"""Chart components for the trading dashboard"""

import plotly.graph_objects as go
import plotly.express as px
from plotly.subplots import make_subplots
import pandas as pd
import numpy as np
import streamlit as st

def create_candlestick_chart(df, title="Price Chart", height=600):
    """Create an interactive candlestick chart"""
    fig = go.Figure()
    
    # Add candlestick
    fig.add_trace(go.Candlestick(
        x=df['Date'],
        open=df['Open'],
        high=df['High'],
        low=df['Low'],
        close=df['Close'],
        name="Price",
        increasing_line_color='#00ff88',
        decreasing_line_color='#ff4444'
    ))
    
    # Add volume
    fig.add_trace(go.Bar(
        x=df['Date'],
        y=df['Volume'],
        name="Volume",
        yaxis='y2',
        opacity=0.3,
        marker_color='#888888'
    ))
    
    # Update layout
    fig.update_layout(
        title=title,
        yaxis_title="Price (USDT)",
        yaxis2=dict(
            title="Volume",
            overlaying='y',
            side='right',
            showgrid=False
        ),
        xaxis_rangeslider_visible=False,
        height=height,
        template='plotly_dark',
        showlegend=True
    )
    
    return fig

def create_technical_indicators_chart(df, indicators, height=400):
    """Create technical indicators chart"""
    fig = make_subplots(
        rows=3, cols=1,
        subplot_titles=('RSI', 'MACD', 'Bollinger Bands'),
        vertical_spacing=0.1,
        row_heights=[0.3, 0.3, 0.4]
    )
    
    # RSI
    if 'RSI' in indicators and len(indicators['RSI']) > 0:
        fig.add_trace(
            go.Scatter(x=df['Date'], y=indicators['RSI'], name='RSI', line=dict(color='#ffaa00')),
            row=1, col=1
        )
        fig.add_hline(y=70, line_dash="dash", line_color="red", row=1, col=1)
        fig.add_hline(y=30, line_dash="dash", line_color="green", row=1, col=1)
    
    # MACD
    if 'MACD' in indicators and len(indicators['MACD']) > 0:
        fig.add_trace(
            go.Scatter(x=df['Date'], y=indicators['MACD'], name='MACD', line=dict(color='#00ff88')),
            row=2, col=1
        )
        if 'MACD_signal' in indicators:
            fig.add_trace(
                go.Scatter(x=df['Date'], y=indicators['MACD_signal'], name='Signal', line=dict(color='#ff4444')),
                row=2, col=1
            )
    
    # Bollinger Bands with Price
    fig.add_trace(
        go.Scatter(x=df['Date'], y=df['Close'], name='Close', line=dict(color='white')),
        row=3, col=1
    )
    
    if 'BB_upper' in indicators and len(indicators['BB_upper']) > 0:
        fig.add_trace(
            go.Scatter(x=df['Date'], y=indicators['BB_upper'], name='BB Upper', 
                      line=dict(color='#888888', dash='dash')),
            row=3, col=1
        )
        fig.add_trace(
            go.Scatter(x=df['Date'], y=indicators['BB_lower'], name='BB Lower', 
                      line=dict(color='#888888', dash='dash')),
            row=3, col=1
        )
    
    fig.update_layout(height=height, template='plotly_dark', showlegend=False)
    return fig

def create_pattern_visualization(df, patterns, pivots):
    """Create pattern visualization on price chart"""
    fig = go.Figure()
    
    # Add price line
    fig.add_trace(go.Scatter(
        x=df['Date'],
        y=df['Close'],
        mode='lines',
        name='Price',
        line=dict(color='white', width=2)
    ))
    
    # Add pivot points
    if pivots:
        pivot_dates = [df['Date'].iloc[p[0]] for p in pivots if p[0] < len(df)]
        pivot_prices = [p[1] for p in pivots if p[0] < len(df)]
        pivot_types = [p[2] for p in pivots if p[0] < len(df)]
        
        colors = ['red' if t == 'high' else 'green' for t in pivot_types]
        
        fig.add_trace(go.Scatter(
            x=pivot_dates,
            y=pivot_prices,
            mode='markers',
            name='Pivots',
            marker=dict(size=8, color=colors)
        ))
    
    # Add pattern annotations
    active_patterns = [p for p, active in patterns.items() if active]
    if active_patterns:
        fig.add_annotation(
            x=df['Date'].iloc[-1],
            y=df['Close'].iloc[-1],
            text=f"Patterns: {', '.join(active_patterns)}",
            showarrow=True,
            arrowhead=2,
            bgcolor='rgba(255,255,255,0.8)',
            bordercolor='black'
        )
    
    fig.update_layout(
        title="Pattern Recognition",
        template='plotly_dark',
        height=400
    )
    
    return fig

def create_market_overview_chart(market_data):
    """Create market overview charts"""
    # Create subplots
    fig = make_subplots(
        rows=2, cols=2,
        subplot_titles=('Top Gainers', 'Top Losers', 'Volume Leaders', 'Market Cap Distribution'),
        specs=[[{"type": "bar"}, {"type": "bar"}],
               [{"type": "bar"}, {"type": "pie"}]]
    )
    
    if not market_data.empty:
        # Sort data
        gainers = market_data.nlargest(5, 'Change_24h')
        losers = market_data.nsmallest(5, 'Change_24h')
        volume_leaders = market_data.nlargest(5, 'Volume')
        
        # Top Gainers
        fig.add_trace(
            go.Bar(x=gainers['Symbol'], y=gainers['Change_24h'], 
                   marker_color='green', name='Gainers'),
            row=1, col=1
        )
        
        # Top Losers
        fig.add_trace(
            go.Bar(x=losers['Symbol'], y=losers['Change_24h'], 
                   marker_color='red', name='Losers'),
            row=1, col=2
        )
        
        # Volume Leaders
        fig.add_trace(
            go.Bar(x=volume_leaders['Symbol'], y=volume_leaders['Volume'], 
                   marker_color='blue', name='Volume'),
            row=2, col=1
        )
        
        # Market Cap Distribution (simulated)
        fig.add_trace(
            go.Pie(labels=market_data['Symbol'][:5], 
                   values=market_data['Volume'][:5], name='Market Share'),
            row=2, col=2
        )
    
    fig.update_layout(height=600, template='plotly_dark', showlegend=False)
    return fig

def create_sentiment_gauge(sentiment_score):
    """Create sentiment gauge chart"""
    fig = go.Figure(go.Indicator(
        mode = "gauge+number+delta",
        value = sentiment_score * 100,
        domain = {'x': [0, 1], 'y': [0, 1]},
        title = {'text': "Market Sentiment"},
        delta = {'reference': 0},
        gauge = {
            'axis': {'range': [-100, 100]},
            'bar': {'color': "darkblue"},
            'steps': [
                {'range': [-100, -50], 'color': "red"},
                {'range': [-50, 0], 'color': "orange"},
                {'range': [0, 50], 'color': "lightgreen"},
                {'range': [50, 100], 'color': "green"}
            ],
            'threshold': {
                'line': {'color': "red", 'width': 4},
                'thickness': 0.75,
                'value': 90
            }
        }
    ))
    
    fig.update_layout(height=300, template='plotly_dark')
    return fig

def create_performance_chart(trades_df):
    """Create performance tracking chart"""
    if trades_df.empty:
        return go.Figure()
    
    # Calculate cumulative P&L
    trades_df['Cumulative_PnL'] = trades_df['PnL'].cumsum()
    
    fig = go.Figure()
    
    # Add cumulative P&L line
    fig.add_trace(go.Scatter(
        x=trades_df['Exit_Date'],
        y=trades_df['Cumulative_PnL'],
        mode='lines+markers',
        name='Cumulative P&L',
        line=dict(color='#00ff88', width=3)
    ))
    
    # Add individual trade markers
    colors = ['green' if pnl > 0 else 'red' for pnl in trades_df['PnL']]
    fig.add_trace(go.Scatter(
        x=trades_df['Exit_Date'],
        y=trades_df['PnL'],
        mode='markers',
        name='Individual Trades',
        marker=dict(size=8, color=colors),
        yaxis='y2'
    ))
    
    fig.update_layout(
        title="Trading Performance",
        yaxis_title="Cumulative P&L (USDT)",
        yaxis2=dict(
            title="Trade P&L",
            overlaying='y',
            side='right'
        ),
        template='plotly_dark',
        height=400
    )
    
    return fig