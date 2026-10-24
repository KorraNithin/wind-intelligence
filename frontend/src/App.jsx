import { useEffect, useMemo, useState } from "react";
import {
  Area, AreaChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer,
  Tooltip, XAxis, YAxis
} from "recharts";
import {
  Activity, AlertTriangle, ArrowDownRight, ArrowUpRight, CalendarDays,
  CheckCircle2, ChevronDown, Clock3, Download, Gauge, RefreshCw, Wind, Zap
} from "lucide-react";
import { fetchDashboard } from "./api";

const fmt = (value, digits = 0) => value == null || Number.isNaN(Number(value))
  ? "—" : Number(value).toLocaleString("en-GB", { maximumFractionDigits: digits, minimumFractionDigits: digits });
const shortTime = (iso) => new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" });
const cutoffOptions = [
  { label: "Day before · 10:00 UTC", value: (day) => `${day}T10:00:00Z` },
  { label: "Day before · 12:00 UTC", value: (day) => `${day}T12:00:00Z` },
  { label: "Day before · 16:00 UTC", value: (day) => `${day}T16:00:00Z` },
  { label: "Day before · 23:00 UTC", value: (day) => `${day}T23:00:00Z` },
];

function MetricCard({ label, value, unit, icon: Icon, hint, tone = "" }) {
  return <div className="metric-card">
    <div className="metric-top"><span>{label}</span><span className={`metric-icon ${tone}`}><Icon size={17}/></span></div>
    <div className="metric-value">{value}<small>{unit}</small></div>
    <div className="metric-hint">{hint}</div>
  </div>;
}

function App() {
  const [deliveryDate, setDeliveryDate] = useState("2026-01-15");
  const [cutoffIndex, setCutoffIndex] = useState(0);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("overview");
  const [query, setQuery] = useState("");
  const cutoff = cutoffOptions[cutoffIndex].value(deliveryDate);

  async function load() {
    setLoading(true); setError("");
    try {
      const result = await fetchDashboard(deliveryDate, cutoff);
      setData(result);
    } catch (e) {
      setError(e.message || "Unable to load dashboard.");
      setData(null);
    } finally { setLoading(false); }
  }
  useEffect(() => { load(); }, [deliveryDate, cutoffIndex]);

  const rows = data?.rows || [];
  const chartRows = useMemo(() => rows.map((r) => ({
    ...r, time: shortTime(r.startTime), forecast: Number(r.forecast), actual: Number(r.actual),
    error: Number(r.error)
  })), [rows]);
  const filteredRows = useMemo(() => chartRows.filter((r) => r.time.includes(query.trim())), [chartRows, query]);
  const avgForecast = rows.length ? rows.reduce((s, r) => s + Number(r.forecast), 0) / rows.length : null;
  const avgActual = rows.length ? rows.reduce((s, r) => s + Number(r.actual), 0) / rows.length : null;

  function exportCsv() {
    const header = ["startTime", "publishTime", "forecast_MW", "actual_MW", "error_MW", "absoluteError_MW"];
    const csv = [header.join(","), ...rows.map(r => [
      r.startTime, r.publishTime, r.forecast, r.actual, r.error, r.absoluteError
    ].map(v => `"${String(v ?? "").replaceAll('"', '""')}"`).join(","))].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const a = document.createElement("a"); a.href = url; a.download = `wind-analysis-${deliveryDate}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark"><Wind size={23}/></div><div><strong>windwise</strong><span>ENERGY INTELLIGENCE</span></div></div>
      <div className="side-label">WORKSPACE</div>
      <button className="nav-item active"><Activity size={17}/> Forecast monitor</button>
      <button className="nav-item" onClick={() => setTab("accuracy")}><Gauge size={17}/> Accuracy analysis</button>
      <button className="nav-item" onClick={() => setTab("data")}><Activity size={17}/> Half-hourly data</button>
      <div className="sidebar-bottom">
        <div className="live-dot"></div>
        <div><strong>Data workspace</strong><span>January 2026 pilot</span></div>
      </div>
    </aside>

    <main className="main">
      <header className="topbar">
        <div className="breadcrumb">UK POWER MARKET <span>/</span> WIND GENERATION</div>
        <div className="top-actions"><span className="period-chip"><CalendarDays size={14}/> JAN 2026</span><div className="avatar">WI</div></div>
      </header>

      <section className="page-heading">
        <div><div className="eyebrow">RENEWABLES · DAY-AHEAD ANALYSIS</div><h1>Wind forecast monitor</h1><p>Understand forecast confidence before the day-ahead procurement decision.</p></div>
        <button className="button secondary" onClick={load} disabled={loading}><RefreshCw size={15} className={loading ? "spin" : ""}/> Refresh data</button>
      </section>

      {data?.isDemo && <div className="notice demo"><AlertTriangle size={17}/><div><strong>Illustrative demo data</strong><span>These values are synthetic UI examples, not real Elexon market data. Check the backend status and live API configuration before citing any numbers.</span></div></div>}
      {data && !data.isDemo && <div className="notice live"><CheckCircle2 size={17}/><div><strong>Live Elexon response</strong><span>Data returned by the configured Elexon API. Confirm coverage and publication-time filtering before operational use.</span></div></div>}
      {error && <div className="notice error"><AlertTriangle size={17}/><div><strong>Unable to load data</strong><span>{error}</span></div></div>}

      <section className="control-panel">
        <div className="control-intro"><span className="control-symbol"><CalendarDays size={18}/></span><div><strong>Analysis parameters</strong><span>Choose a delivery date and the information cutoff.</span></div></div>
        <div className="controls">
          <label>DELIVERY DATE<select value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)}>{Array.from({length:31}, (_,i) => `2026-01-${String(i+1).padStart(2,"0")}`).map(d => <option key={d} value={d}>{new Date(`${d}T12:00:00Z`).toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric",timeZone:"UTC"})}</option>)}</select></label>
          <label>FORECAST CUTOFF<select value={cutoffIndex} onChange={e => setCutoffIndex(Number(e.target.value))}>{cutoffOptions.map((c,i) => <option key={c.label} value={i}>{c.label}</option>)}</select></label>
          <div className="cutoff-note"><Clock3 size={14}/><span>Cutoff: {new Date(cutoff).toLocaleString("en-GB",{timeZone:"UTC",dateStyle:"medium",timeStyle:"short"})} UTC</span></div>
        </div>
      </section>

      <div className="section-title"><div><h2>Performance snapshot</h2><p>{new Date(`${deliveryDate}T12:00:00Z`).toLocaleDateString("en-GB",{weekday:"long",day:"numeric",month:"long",year:"numeric",timeZone:"UTC"})} · national wind generation</p></div><span className="data-status">{loading ? "Loading…" : data ? `${rows.length} matched periods` : "No data"}</span></div>

      <section className="metrics-grid">
        <MetricCard label="Mean absolute error" value={fmt(data?.summary?.mae)} unit=" MW" icon={Activity} hint="Average absolute forecast miss" tone="blue"/>
        <MetricCard label="Forecast bias" value={data?.summary?.bias == null ? "—" : `${data.summary.bias > 0 ? "+" : ""}${fmt(data.summary.bias)}`} unit=" MW" icon={data?.summary?.bias >= 0 ? ArrowUpRight : ArrowDownRight} hint={data?.summary?.bias > 0 ? "Forecasts lean high" : data?.summary?.bias < 0 ? "Forecasts lean low" : "Mean signed error"} tone="purple"/>
        <MetricCard label="Root mean square error" value={fmt(data?.summary?.rmse)} unit=" MW" icon={Gauge} hint="Penalises larger forecast misses" tone="amber"/>
        <MetricCard label="Average forecast" value={fmt(avgForecast)} unit=" MW" icon={Wind} hint={`Average actual: ${fmt(avgActual)} MW`} tone="green"/>
      </section>

      <div className="tabs">
        <button className={tab === "overview" ? "selected" : ""} onClick={() => setTab("overview")}>Forecast overview</button>
        <button className={tab === "accuracy" ? "selected" : ""} onClick={() => setTab("accuracy")}>Error analysis</button>
        <button className={tab === "data" ? "selected" : ""} onClick={() => setTab("data")}>Half-hourly records</button>
      </div>

      {tab === "overview" && <section className="panel chart-panel">
        <div className="panel-heading"><div><h3>Forecast vs actual generation</h3><p>Half-hourly wind generation · MW</p></div><div className="legend-inline"><span><i className="legend-dot forecast-dot"></i> Forecast</span><span><i className="legend-dot actual-dot"></i> Actual</span></div></div>
        <div className="chart-wrap">{loading ? <div className="loading-state"><RefreshCw className="spin"/> Loading generation series…</div> : chartRows.length ? <ResponsiveContainer width="100%" height="100%"><AreaChart data={chartRows} margin={{top:10,right:12,left:0,bottom:0}}><defs><linearGradient id="forecastFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#4f8df7" stopOpacity={0.22}/><stop offset="100%" stopColor="#4f8df7" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 5" vertical={false} stroke="#e9edf3"/><XAxis dataKey="time" tickLine={false} axisLine={false} tick={{fontSize:11,fill:"#8590a2"}} interval={5}/><YAxis tickLine={false} axisLine={false} tick={{fontSize:11,fill:"#8590a2"}} tickFormatter={v => `${(v/1000).toFixed(0)}k`} width={44}/><Tooltip formatter={(v,n)=>[`${fmt(v)} MW`,n]} labelFormatter={v=>`${v} UTC`} contentStyle={{borderRadius:12,border:"1px solid #e5eaf1",fontSize:12}}/><Area type="monotone" dataKey="forecast" name="Forecast" stroke="#4f8df7" strokeWidth={2.5} fill="url(#forecastFill)" dot={false}/><Line type="monotone" dataKey="actual" name="Actual" stroke="#14a88b" strokeWidth={2.5} dot={false}/></AreaChart></ResponsiveContainer> : <div className="empty-state">No matched periods are available for this selection.</div>}</div>
        <div className="chart-foot"><span><i className="legend-dot forecast-dot"></i> Forecast generation</span><span><i className="legend-dot actual-dot"></i> Actual generation</span><span className="chart-foot-note">All timestamps displayed in UTC</span></div>
      </section>}

      {tab === "accuracy" && <section className="panel chart-panel"><div className="panel-heading"><div><h3>Forecast error by settlement period</h3><p>Positive values mean forecast exceeded actual generation.</p></div></div><div className="chart-wrap"><ResponsiveContainer width="100%" height="100%"><LineChart data={chartRows} margin={{top:10,right:12,left:0,bottom:0}}><CartesianGrid strokeDasharray="3 5" vertical={false} stroke="#e9edf3"/><XAxis dataKey="time" tickLine={false} axisLine={false} tick={{fontSize:11,fill:"#8590a2"}} interval={5}/><YAxis tickLine={false} axisLine={false} tick={{fontSize:11,fill:"#8590a2"}} tickFormatter={v => `${(v/1000).toFixed(1)}k`} width={48}/><Tooltip formatter={(v)=>[`${fmt(v)} MW`,"Error"]} labelFormatter={v=>`${v} UTC`}/><Line type="monotone" dataKey="error" name="Forecast error" stroke="#8b73e6" strokeWidth={2} dot={false}/></LineChart></ResponsiveContainer></div><div className="analysis-note"><Zap size={16}/><span><strong>Interpretation:</strong> MAE describes typical error magnitude; RMSE highlights large misses; signed bias shows systematic over- or under-forecasting. These metrics do not, by themselves, determine a procurement volume.</span></div></section>}

      {tab === "data" && <section className="panel table-panel"><div className="panel-heading"><div><h3>Settlement period detail</h3><p>Forecast, actual and calculated error for each matched interval.</p></div><div className="table-actions"><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Filter time e.g. 10:30"/><button className="button secondary small" onClick={exportCsv} disabled={!rows.length}><Download size={14}/> Export CSV</button></div></div><div className="table-scroll"><table><thead><tr><th>START TIME (UTC)</th><th>PUBLISHED AT (UTC)</th><th>FORECAST MW</th><th>ACTUAL MW</th><th>ERROR MW</th><th>ABS. ERROR</th></tr></thead><tbody>{filteredRows.map((r,i)=><tr key={`${r.startTime}-${i}`}><td>{r.time}</td><td>{r.publishTime ? new Date(r.publishTime).toLocaleString("en-GB",{timeZone:"UTC",day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"}) : "—"}</td><td>{fmt(r.forecast)}</td><td>{fmt(r.actual)}</td><td className={r.error > 0 ? "positive" : r.error < 0 ? "negative" : ""}>{r.error > 0 ? "+" : ""}{fmt(r.error)}</td><td>{fmt(Math.abs(r.error))}</td></tr>)}</tbody></table>{!filteredRows.length && <div className="empty-state">No rows match this filter.</div>}</div><div className="table-footer">Showing {filteredRows.length} of {rows.length} matched records <span>Generation values in MW</span></div></section>}

      <footer className="footer"><span>WINDWISE <b>·</b> PILOT ANALYTICS</span><span>Data scope: Elexon FUELHH + WINDFOR · January 2026</span></footer>
    </main>
  </div>;
}

export default App;
