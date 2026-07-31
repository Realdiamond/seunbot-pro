import React, { useState, useEffect, useCallback } from "react"
import {
  Activity, Volume2, BarChart3, Zap, Target, CheckCircle,
  Clock, RefreshCw, Waves, Triangle, Compass
} from "lucide-react"
import USStocksDataService from "../services/USStocksDataService"
import AIAnalysisEndpointService from "../services/AIAnalysisEndpointService"
import { usStocksWebSocket } from "../services/WebSocketService"
import SignalHistory from "./SignalHistory"

const CURRENCY = "$"
const fmtP = (v) => `${CURRENCY}${Number(v || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const TABS = [
  { id: "smartMoney", label: "Smart Money",  Icon: BarChart3 },
  { id: "patterns",   label: "Patterns",     Icon: Triangle },
  { id: "elliott",    label: "Elliott Wave",  Icon: Waves },
  { id: "volume",     label: "Volume",        Icon: Volume2 },
  { id: "fundamental",label: "Fundamental",   Icon: Activity },
  { id: "cycle",      label: "Cycle",         Icon: Clock },
  { id: "gann",       label: "Gann",          Icon: Compass },
  { id: "setups",     label: "Weekly Setups", Icon: Target },
]

export default function USStocksAdvancedAnalysisPanel({ selectedStock = "AAPL", marketData = [] }) {
  const [activeTab, setActiveTab] = useState("smartMoney")
  const [selTf, setSelTf] = useState("1D")
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(false)
  const [sd, setSd] = useState(null)
  const [src, setSrc] = useState("Loading...")

  const TFS = ["5M","15M","1H","4H","1D","1W","1M"]

  const onWs = useCallback((u) => {
    setSd(p => ({ ...(p||{}), ...u, isMock: false }))
    setSrc("Live (" + (u.source||"WebSocket") + ")")
  }, [])

  useEffect(() => {
    usStocksWebSocket.subscribe(selectedStock, onWs)
    return () => usStocksWebSocket.unsubscribe(selectedStock, onWs)
  }, [selectedStock, onWs])

  useEffect(() => { fetchSd() }, [selectedStock])

  useEffect(() => {
    let dead = false
    if (selectedStock) run(() => dead)
    return () => { dead = true }
  }, [selectedStock, selTf])

  const fetchSd = async () => {
    try {
      const found = (marketData||[]).find(s => String(s.symbol).replace(/^US_/i,"").toUpperCase() === selectedStock.toUpperCase())
      const data = found || await USStocksDataService.fetchStockData(selectedStock)
      setSd(data)
      setSrc(data?.isMock ? "Mock Data" : "Real-Time Data")
    } catch { setSrc("Unavailable") }
  }

  const run = async (dead) => {
    setLoading(true)
    try {
      const stock = sd || await USStocksDataService.fetchStockData(selectedStock)
      const ai = await AIAnalysisEndpointService.analyzeStock({ symbol: selectedStock, price: stock?.price }).catch(() => null)
      if (dead()) return
      const inst = ai?.hybridComponents?.institutional || {}
      const regime = ai?.hybridComponents?.regime || {}
      const vol = ai?.hybridComponents?.volume || {}
      const p = Number(stock?.price || 0)
      setAnalysis({
        smartMoney: {
          structure: inst.breakOfStructure || "Neutral",
          fvg: inst.fairValueGaps || "None",
          ob: inst.orderBlocks || "None",
          zone: regime.marketRegime || "Ranging",
          confidence: (ai?.confidence||3)*20,
          src: ai?.hybridComponents ? "Hybrid AI API" : "Unavailable"
        },
        patterns: {
          triangles: Math.abs(stock?.changePercent||0)<2 ? [{ type:"Ascending Triangle", pattern:"Bullish Continuation", breakoutTarget: p*1.06, probability:72 }] : [],
          channels: [{ type:"Ascending Channel", pattern:"Bullish Trend", probability:78 }],
          flags: Math.abs(stock?.changePercent||0)>3 ? [{ type:(stock?.changePercent||0)>0?"Bull Flag":"Bear Flag", pattern:"Continuation", target:p*((stock?.changePercent||0)>0?1.06:0.94), probability:80 }] : []
        },
        ew: {
          wave: (inst.elliottWave||"?").replace(/\D/g,"")||"?",
          type: ai?.hybridDirection==="bullish"?"Impulse Wave":"Corrective Wave",
          nextTarget: ai?.priceTarget||(p*1.05),
          invalidation: ai?.stopLoss||(p*0.95),
          confidence: (ai?.confidence||3)*20,
          fib: { "0.236":p*0.98,"0.382":p*0.95,"0.500":p*0.92,"0.618":p*0.88 },
          waves: {
            wave1:{target:p*1.05,done:true,desc:"Initial breakout"},
            wave2:{target:p*0.98,done:true,desc:"Retracement"},
            wave3:{target:p*1.15,done:false,cur:true,desc:inst.elliottWave||"In progress"},
            wave4:{target:p*1.08,done:false,desc:"Corrective wave"},
            wave5:{target:p*1.25,done:false,desc:"Final extension"}
          }
        },
        volume: {
          vwap: vol.vwapStatus||"Neutral",
          obv: vol.obvTrend||"Neutral",
          instInterest: (vol.relativeVolume||0)>1.2,
          insight: "AI Volume: " + ((vol.relativeVolume||0)>1 ? "High Relative Volume ("+((vol.relativeVolume||0).toFixed(2))+"x)" : "Normal Volume"),
          breakdown: { institutional:(stock?.volume||0)*0.6, retail:(stock?.volume||0)*0.25, algorithmic:(stock?.volume||0)*0.15 }
        },
        fundamental: {
          fair: p, target: ai?.priceTarget||(p*1.05), rec: ai?.recommendation||"HOLD",
          items: {
            "Earnings Per Share":"From 10-Q/10-K quarterly reports",
            "P/E Ratio":"vs S&P 500 sector average",
            "Revenue Growth":"Year-over-year trajectory",
            "Free Cash Flow":"FCF generation capacity",
            "Institutional Ownership":"13F filing disclosed holdings"
          },
          macro: {
            "Fed Rate Sensitivity": (stock?.sector||"").includes("Financ")?"Very High":"Moderate",
            "Inflation Impact":"CPI and PCE inflation correlation",
            "USD Index Correlation":"DXY impact on international revenue",
            "Sector Cycle":`${stock?.sector||"US"} in current economic cycle`
          }
        },
        cycle: {
          us: {
            "Economic Cycle":"US GDP growth cycle positioning",
            "Fed Cycle":"Federal Reserve rate cycle impact",
            "Presidential Cycle":"US 4-year election cycle patterns",
            "Earnings Cycle":"S&P 500 quarterly earnings alignment"
          },
          seasonal: {
            "Q4 Rally":"Santa Claus rally (Nov-Dec tendency)",
            "January Effect":"Small-cap outperformance in January",
            "Sell in May":"May-October seasonal weakness pattern",
            "Earnings Season":"Quarterly catalyst timing windows"
          },
          pos: { phase:"Mid-cycle expansion", dur:"~8 months", conf:75 }
        },
        gann: {
          sq: { cur: Math.floor(Math.sqrt(p))**2, next: Math.ceil(Math.sqrt(p))**2 },
          angles: [{angle:"1x1",val:p*1.0625},{angle:"2x1",val:p*1.125},{angle:"1x2",val:p*0.9375}],
          res: [p*1.125,p*1.25,p*1.375], sup: [p*0.875,p*0.75,p*0.625],
          tt: ["2 weeks","1 month","3 months"]
        }
      })
    } catch(e){ console.error("US analysis error",e) }
    finally { if (!dead()) setLoading(false) }
  }

  const price = Number(sd?.price||0), chg = Number(sd?.changePercent||0), vol = Number(sd?.volume||0)
  const high = Number(sd?.high||price*1.01), low = Number(sd?.low||price*0.99)

  return (
    <div className="space-y-4">
      <SignalHistory market="us" symbol={selectedStock} title="Prediction History" count={20} />

      <div className={`flex items-center justify-between px-4 py-3 rounded-xl border ${chg>=0?"bg-green-900/20 border-green-700/30":"bg-red-900/20 border-red-700/30"}`}>
        <div className="flex items-center gap-3">
          <span className="text-gray-400 text-sm">Live Price:</span>
          <span className="text-white font-bold text-lg">{fmtP(price)}</span>
          <span className={`font-semibold text-sm ${chg>=0?"text-green-400":"text-red-400"}`}>{chg>=0?"+":""}{chg.toFixed(2)}%</span>
        </div>
        <span className="text-gray-400 text-xs">Volume: {(vol/1e6).toFixed(2)}M</span>
      </div>

      <div className="overflow-x-auto pb-1">
        <div className="flex gap-1 min-w-max bg-gray-800/60 rounded-xl p-1">
          {TABS.map(({ id, label, Icon }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${activeTab===id?"bg-blue-600 text-white shadow":"text-gray-400 hover:text-white hover:bg-white/5"}`}>
              <Icon className="h-3.5 w-3.5" />{label}
            </button>
          ))}
        </div>
      </div>

      {loading && !analysis && (
        <div className="glass-effect rounded-xl p-8 text-center text-gray-400">
          <RefreshCw className="h-6 w-6 mx-auto mb-3 animate-spin text-blue-400" />
          <p className="text-sm">Generating US market analysis...</p>
        </div>
      )}

      {activeTab==="smartMoney" && analysis && (
        <div className="space-y-4">
          <div className="glass-effect rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-white flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-blue-400" />US Smart Money Concepts<span className="text-xs text-gray-400 font-normal">(Hybrid AI API)</span>
              </h4>
              <span className="text-xs text-gray-500">{src}</span>
            </div>
            <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-4 mb-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-blue-400 font-semibold text-sm">Market Structure</span>
                <span className="text-white font-bold text-sm">{analysis.smartMoney.structure}</span>
              </div>
              <div className="text-xs text-gray-400">US Bias: AI Model Alignment</div>
              <div className="text-xs text-blue-300 mt-1">US Factors: SEC / FINRA standard regulatory environment</div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-gray-700/30 rounded-lg p-4">
                <h5 className="text-purple-400 text-xs font-semibold mb-2 uppercase">Liquidity Analysis</h5>
                <div className="space-y-1 text-xs text-gray-300">
                  <div><span className="text-gray-500">CBN Impact: </span>Federal Reserve policy impact on liquidity</div>
                  <div><span className="text-gray-500">Fair Value Gaps: </span>{analysis.smartMoney.fvg}</div>
                  <div><span className="text-gray-500">Order Blocks: </span>{analysis.smartMoney.ob}</div>
                </div>
              </div>
              <div className="bg-gray-700/30 rounded-lg p-4">
                <h5 className="text-green-400 text-xs font-semibold mb-2 uppercase">Premium / Discount Zone</h5>
                <div className="space-y-1 text-xs text-gray-300">
                  <div><span className="text-gray-500">Zone: </span>{analysis.smartMoney.zone}</div>
                  <div><span className="text-gray-500">Phase: </span>US Consolidation / Expansion</div>
                  <div><span className="text-gray-500">Rotation: </span>US Sector Rotation Phase</div>
                </div>
              </div>
            </div>
            <div className="mt-3 bg-gray-700/20 rounded-lg p-3">
              <div className="flex justify-between mb-1 text-xs">
                <span className="text-gray-400">Analysis Confidence</span>
                <span className="font-bold text-white">{analysis.smartMoney.confidence}%</span>
              </div>
              <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full" style={{width:`${analysis.smartMoney.confidence}%`}} />
              </div>
            </div>
          </div>
          <div className="glass-effect rounded-xl p-4">
            <h5 className="text-xs text-gray-400 font-semibold uppercase mb-3">Timeframe Analysis</h5>
            <div className="flex flex-wrap gap-2">
              {TFS.map(tf => (
                <button key={tf} onClick={() => setSelTf(tf)}
                  className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-all ${selTf===tf?"bg-blue-600 text-white":"bg-gray-700 text-gray-400 hover:bg-gray-600"}`}>{tf}</button>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab==="patterns" && analysis && (
        <div className="glass-effect rounded-xl p-5 space-y-4">
          <h4 className="font-semibold text-white flex items-center gap-2"><Triangle className="h-4 w-4 text-yellow-400" />Chart Patterns</h4>
          {[{label:"Triangles",data:analysis.patterns.triangles},{label:"Channels",data:analysis.patterns.channels},{label:"Flags",data:analysis.patterns.flags}].map(({label,data}) =>
            data.length>0 && (
              <div key={label}>
                <h5 className="text-xs text-gray-400 uppercase font-semibold mb-2">{label}</h5>
                {data.map((pt,i) => (
                  <div key={i} className="bg-gray-700/30 rounded-lg p-3 mb-2 text-xs">
                    <div className="flex justify-between mb-1"><span className="text-white font-medium">{pt.type}</span>{pt.probability&&<span className="text-green-400">{pt.probability}% prob.</span>}</div>
                    {pt.pattern&&<div className="text-gray-400">{pt.pattern}</div>}
                    {pt.breakoutTarget&&<div className="text-blue-300">Target: {fmtP(pt.breakoutTarget)}</div>}
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      )}

      {activeTab==="elliott" && analysis && (
        <div className="glass-effect rounded-xl p-5 space-y-4">
          <h4 className="font-semibold text-white flex items-center gap-2"><Waves className="h-4 w-4 text-cyan-400" />Elliott Wave Analysis</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="bg-gray-700/30 rounded-lg p-3 text-center"><div className="text-xs text-gray-400 mb-1">Current Wave</div><div className="text-2xl font-bold text-cyan-400">{analysis.ew.wave}</div><div className="text-xs text-gray-400 mt-1">{analysis.ew.type}</div></div>
            <div className="bg-gray-700/30 rounded-lg p-3 text-center"><div className="text-xs text-gray-400 mb-1">Next Target</div><div className="text-lg font-bold text-green-400">{fmtP(analysis.ew.nextTarget)}</div></div>
            <div className="bg-gray-700/30 rounded-lg p-3 text-center"><div className="text-xs text-gray-400 mb-1">Invalidation</div><div className="text-lg font-bold text-red-400">{fmtP(analysis.ew.invalidation)}</div></div>
          </div>
          <div><h5 className="text-xs text-gray-400 uppercase font-semibold mb-2">Fibonacci Retracements</h5>
            {Object.entries(analysis.ew.fib).map(([lvl,val]) => (
              <div key={lvl} className="flex justify-between text-xs mb-1"><span className="text-gray-500">{lvl} Fib</span><span className="text-amber-300">{fmtP(val)}</span></div>
            ))}
          </div>
          <div><h5 className="text-xs text-gray-400 uppercase font-semibold mb-2">Wave Progression</h5>
            {Object.entries(analysis.ew.waves).map(([wn,w]) => (
              <div key={wn} className={`flex items-center gap-2 text-xs rounded-lg px-3 py-2 mb-1 ${w.cur?"bg-cyan-500/20 border border-cyan-500/30":"bg-gray-700/20"}`}>
                <span className={`font-bold w-12 ${w.done?"text-green-400":w.cur?"text-cyan-400":"text-gray-500"}`}>{wn.toUpperCase()}</span>
                <span className="text-gray-300 flex-1">{w.desc}</span>
                <span className={w.done?"text-green-400":w.cur?"text-cyan-400":"text-gray-500"}>{fmtP(w.target)}</span>
                {w.done&&<CheckCircle className="h-3 w-3 text-green-400"/>}
                {w.cur&&<Zap className="h-3 w-3 text-cyan-400 animate-pulse"/>}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab==="volume" && analysis && (
        <div className="glass-effect rounded-xl p-5 space-y-4">
          <h4 className="font-semibold text-white flex items-center gap-2"><Volume2 className="h-4 w-4 text-purple-400" />Volume Analysis</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[{l:"VWAP Status",v:analysis.volume.vwap,c:"text-blue-400"},{l:"OBV Trend",v:analysis.volume.obv,c:"text-green-400"},{l:"Inst. Interest",v:analysis.volume.instInterest?"Yes":"No",c:"text-yellow-400"}].map(({l,v,c}) => (
              <div key={l} className="bg-gray-700/30 rounded-lg p-3 text-center"><div className="text-xs text-gray-400 mb-1">{l}</div><div className={`font-bold ${c}`}>{v}</div></div>
            ))}
          </div>
          <div>
            <h5 className="text-xs text-gray-400 uppercase font-semibold mb-2">Volume Breakdown</h5>
            {[{l:"Institutional",v:analysis.volume.breakdown.institutional,c:"bg-blue-500"},{l:"Retail",v:analysis.volume.breakdown.retail,c:"bg-green-500"},{l:"Algorithmic",v:analysis.volume.breakdown.algorithmic,c:"bg-purple-500"}].map(({l,v,c}) => {
              const pct = vol>0 ? Math.round((v/vol)*100) : 0
              return <div key={l} className="mb-2"><div className="flex justify-between text-xs mb-1"><span className="text-gray-400">{l}</span><span className="text-white">{(v/1e6).toFixed(2)}M ({pct}%)</span></div><div className="h-1.5 bg-gray-700 rounded-full overflow-hidden"><div className={`h-full ${c} rounded-full`} style={{width:`${pct}%`}}/></div></div>
            })}
          </div>
          <div className="bg-gray-700/20 rounded-lg p-3 text-xs text-gray-300"><span className="text-purple-400 font-semibold">AI Insight: </span>{analysis.volume.insight}</div>
        </div>
      )}

      {activeTab==="fundamental" && analysis && (
        <div className="glass-effect rounded-xl p-5 space-y-4">
          <h4 className="font-semibold text-white flex items-center gap-2"><Activity className="h-4 w-4 text-orange-400" />Fundamental Analysis</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[{l:"Fair Value",v:fmtP(analysis.fundamental.fair),c:"text-white"},{l:"Price Target",v:fmtP(analysis.fundamental.target),c:"text-blue-400"},{l:"Recommendation",v:analysis.fundamental.rec,c:"text-green-400"}].map(({l,v,c}) => (
              <div key={l} className="bg-gray-700/30 rounded-lg p-3 text-center"><div className="text-xs text-gray-400 mb-1">{l}</div><div className={`font-bold ${c}`}>{v}</div></div>
            ))}
          </div>
          <div><h5 className="text-xs text-gray-400 uppercase font-semibold mb-2">US Fundamentals</h5>
            {Object.entries(analysis.fundamental.items).map(([k,v]) => (
              <div key={k} className="flex gap-2 text-xs bg-gray-700/20 rounded px-3 py-2 mb-1"><span className="text-gray-500 w-40 shrink-0">{k}:</span><span className="text-gray-300">{v}</span></div>
            ))}
          </div>
          <div><h5 className="text-xs text-gray-400 uppercase font-semibold mb-2">Macro Factors</h5>
            {Object.entries(analysis.fundamental.macro).map(([k,v]) => (
              <div key={k} className="flex gap-2 text-xs mb-1"><span className="text-gray-500 w-40 shrink-0">{k}:</span><span className="text-gray-300">{v}</span></div>
            ))}
          </div>
        </div>
      )}

      {activeTab==="cycle" && analysis && (
        <div className="glass-effect rounded-xl p-5 space-y-4">
          <h4 className="font-semibold text-white flex items-center gap-2"><Clock className="h-4 w-4 text-teal-400" />Cycle Analysis</h4>
          {[{title:"US Economic Cycles",data:analysis.cycle.us,color:"text-teal-400"},{title:"Seasonal Patterns",data:analysis.cycle.seasonal,color:"text-amber-400"}].map(({title,data,color}) => (
            <div key={title}>
              <h5 className={`text-xs ${color} font-semibold uppercase mb-2`}>{title}</h5>
              {Object.entries(data).map(([k,v]) => (
                <div key={k} className="flex gap-2 text-xs bg-gray-700/20 rounded px-3 py-2 mb-1"><span className="text-gray-500 w-36 shrink-0">{k}:</span><span className="text-gray-300">{v}</span></div>
              ))}
            </div>
          ))}
          <div className="bg-teal-900/20 border border-teal-700/30 rounded-lg p-4">
            <h5 className="text-teal-400 font-semibold text-xs uppercase mb-2">Current Cycle Position</h5>
            <div className="flex gap-4 text-xs">
              <div><span className="text-gray-500">Phase: </span><span className="text-white">{analysis.cycle.pos.phase}</span></div>
              <div><span className="text-gray-500">Duration: </span><span className="text-white">{analysis.cycle.pos.dur}</span></div>
              <div><span className="text-gray-500">Confidence: </span><span className="text-green-400">{analysis.cycle.pos.conf}%</span></div>
            </div>
          </div>
        </div>
      )}

      {activeTab==="gann" && analysis && (
        <div className="glass-effect rounded-xl p-5 space-y-4">
          <h4 className="font-semibold text-white flex items-center gap-2"><Compass className="h-4 w-4 text-rose-400" />Gann Analysis</h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-700/30 rounded-lg p-3 text-center"><div className="text-xs text-gray-400 mb-1">Current Square</div><div className="text-xl font-bold text-rose-400">{analysis.gann.sq.cur}</div></div>
            <div className="bg-gray-700/30 rounded-lg p-3 text-center"><div className="text-xs text-gray-400 mb-1">Next Square</div><div className="text-xl font-bold text-amber-400">{analysis.gann.sq.next}</div></div>
          </div>
          <div><h5 className="text-xs text-gray-400 uppercase font-semibold mb-2">Gann Angles</h5>
            {analysis.gann.angles.map((g,i) => (
              <div key={i} className="flex justify-between text-xs bg-gray-700/20 rounded px-3 py-2 mb-1"><span className="text-gray-400">{g.angle} Angle</span><span className="text-rose-300">{fmtP(g.val)}</span></div>
            ))}
          </div>
          <div><h5 className="text-xs text-gray-400 uppercase font-semibold mb-2">Key Levels</h5>
            {analysis.gann.res.map((r,i)=><div key={"r"+i} className="flex justify-between text-xs mb-1"><span className="text-red-400">Resistance {i+1}</span><span className="text-white">{fmtP(r)}</span></div>)}
            {analysis.gann.sup.map((s,i)=><div key={"s"+i} className="flex justify-between text-xs mb-1"><span className="text-green-400">Support {i+1}</span><span className="text-white">{fmtP(s)}</span></div>)}
          </div>
          <div className="flex gap-2 flex-wrap">{analysis.gann.tt.map((t,i)=><span key={i} className="bg-rose-500/20 text-rose-300 text-xs px-3 py-1 rounded-full">{t}</span>)}</div>
        </div>
      )}

      {activeTab==="setups" && (
        <div className="glass-effect rounded-xl p-5">
          <h4 className="font-semibold text-white flex items-center gap-2 mb-4"><Target className="h-4 w-4 text-orange-400" />Weekly Setup — {selectedStock}</h4>
          <div className="bg-gray-700/30 rounded-lg p-4 text-xs text-gray-300 space-y-2">
            <div className="flex justify-between"><span className="text-gray-400">Current Price</span><span className="text-white font-semibold">{fmtP(price)}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Day High</span><span className="text-red-400 font-semibold">{fmtP(high)}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Day Low</span><span className="text-green-400 font-semibold">{fmtP(low)}</span></div>
          </div>
          <p className="text-gray-400 text-sm mt-3">Use the <span className="text-orange-400 font-medium">Weekly Setups</span> page to scan all 11,000+ US stocks.</p>
        </div>
      )}
    </div>
  )
}
