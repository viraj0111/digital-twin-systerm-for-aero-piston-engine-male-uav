import React, { useState } from 'react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Legend 
} from 'recharts';
import { DigitalTwinState } from '../types/engine';
import { Activity, Gauge, Flame, Droplet } from 'lucide-react';

interface LiveTelemetryChartsProps {
  state: DigitalTwinState;
}

export const LiveTelemetryCharts: React.FC<LiveTelemetryChartsProps> = ({ state }) => {
  const [activeChartGroup, setActiveChartGroup] = useState<'all' | 'health_rul' | 'thermal' | 'mechanical'>('all');
  const { telemetryHistory, healthHistory } = state;

  // Format data for recharts
  const chartData = telemetryHistory.map((t, idx) => {
    const h = healthHistory[idx] || healthHistory[healthHistory.length - 1];
    return {
      time: `${t.timestamp_s}s`,
      timestamp: t.timestamp_s,
      health: h?.health_pct || 98,
      rul: h?.rul_hours || 450,
      rpm: t.rpm,
      cht1: t.cht1_C,
      cht2: t.cht2_C,
      cht3: t.cht3_C,
      cht4: t.cht4_C,
      egt1: t.egt1_C,
      egt2: t.egt2_C,
      egt3: t.egt3_C,
      egt4: t.egt4_C,
      oilPress: t.oil_pressure_bar,
      oilTemp: t.oil_temp_C,
      vibration: t.vibration_g,
      fuelFlow: t.fuel_flow_L_h
    };
  });

  const customTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 border border-slate-700 p-2.5 rounded-lg shadow-xl text-xs font-mono">
          <p className="text-slate-400 font-bold border-b border-slate-800 pb-1 mb-1.5">
            Mission Time: {label}
          </p>
          <div className="space-y-1">
            {payload.map((entry: any, index: number) => (
              <div key={`item-${index}`} className="flex items-center justify-between gap-3">
                <span style={{ color: entry.color }} className="font-semibold">
                  {entry.name}:
                </span>
                <span className="text-white font-bold">{entry.value}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl">
      {/* Header & Chart Filter Toggles */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-semibold font-mono text-white">
            Real-Time Aero Telemetry & Prognostic Trends
          </h3>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
            {telemetryHistory.length} Telemetry Epochs
          </span>
        </div>

        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-mono">
          <button
            onClick={() => setActiveChartGroup('all')}
            className={`px-2.5 py-1 rounded transition ${
              activeChartGroup === 'all' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Multi-Grid View
          </button>
          <button
            onClick={() => setActiveChartGroup('health_rul')}
            className={`px-2.5 py-1 rounded transition ${
              activeChartGroup === 'health_rul' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Health & RUL
          </button>
          <button
            onClick={() => setActiveChartGroup('thermal')}
            className={`px-2.5 py-1 rounded transition ${
              activeChartGroup === 'thermal' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            CHT & EGT Heat
          </button>
          <button
            onClick={() => setActiveChartGroup('mechanical')}
            className={`px-2.5 py-1 rounded transition ${
              activeChartGroup === 'mechanical' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Oil & Vibration
          </button>
        </div>
      </div>

      {/* Chart Grid */}
      <div className={`grid gap-4 ${activeChartGroup === 'all' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
        {/* Chart 1: Engine Health & RUL Prognostics */}
        {(activeChartGroup === 'all' || activeChartGroup === 'health_rul') && (
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between mb-2 font-mono">
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5" /> Engine Health Score (%) & RUL Trend
              </span>
              <span className="text-[10px] text-slate-400">
                Current: <strong className="text-emerald-400">{state.health.health_score_pct.toFixed(1)}%</strong>
              </span>
            </div>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="time" stroke="#64748b" fontSize={10} tickLine={false} />
                  <YAxis yAxisId="left" domain={[0, 100]} stroke="#10b981" fontSize={10} tickLine={false} />
                  <YAxis yAxisId="right" orientation="right" stroke="#06b6d4" fontSize={10} tickLine={false} />
                  <Tooltip content={customTooltip} />
                  <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace' }} />
                  <Line yAxisId="left" type="monotone" dataKey="health" name="Health (%)" stroke="#10b981" strokeWidth={2} dot={false} isAnimationActive={false} />
                  <Line yAxisId="right" type="monotone" dataKey="rul" name="RUL (Hours)" stroke="#06b6d4" strokeWidth={2} strokeDasharray="4 4" dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Chart 2: Cylinder Head Temperatures (CHT 1-4) */}
        {(activeChartGroup === 'all' || activeChartGroup === 'thermal') && (
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between mb-2 font-mono">
              <span className="text-xs font-bold text-orange-400 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5" /> Multi-Cylinder CHT Array (1-4) [°C]
              </span>
              <span className="text-[10px] text-slate-400">Warning Limit: 135°C</span>
            </div>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="time" stroke="#64748b" fontSize={10} tickLine={false} />
                  <YAxis domain={[80, 170]} stroke="#f97316" fontSize={10} tickLine={false} />
                  <Tooltip content={customTooltip} />
                  <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace' }} />
                  <Line type="monotone" dataKey="cht1" name="CHT 1" stroke="#38bdf8" strokeWidth={1.5} dot={false} isAnimationActive={false} />
                  <Line type="monotone" dataKey="cht2" name="CHT 2" stroke="#a855f7" strokeWidth={1.5} dot={false} isAnimationActive={false} />
                  <Line type="monotone" dataKey="cht3" name="CHT 3" stroke="#ef4444" strokeWidth={2} dot={false} isAnimationActive={false} />
                  <Line type="monotone" dataKey="cht4" name="CHT 4" stroke="#eab308" strokeWidth={1.5} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Chart 3: Lubrication Pressure & Vibration */}
        {(activeChartGroup === 'all' || activeChartGroup === 'mechanical') && (
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between mb-2 font-mono">
              <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                <Droplet className="w-3.5 h-3.5" /> Oil Pressure (bar) & RMS Vibration (g)
              </span>
              <span className="text-[10px] text-slate-400">Nominal: 4.2 bar / 0.8g</span>
            </div>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="time" stroke="#64748b" fontSize={10} tickLine={false} />
                  <YAxis yAxisId="press" domain={[0, 6]} stroke="#f59e0b" fontSize={10} tickLine={false} />
                  <YAxis yAxisId="vib" orientation="right" domain={[0, 4]} stroke="#ec4899" fontSize={10} tickLine={false} />
                  <Tooltip content={customTooltip} />
                  <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace' }} />
                  <Line yAxisId="press" type="monotone" dataKey="oilPress" name="Oil Press (bar)" stroke="#f59e0b" strokeWidth={2} dot={false} isAnimationActive={false} />
                  <Line yAxisId="vib" type="monotone" dataKey="vibration" name="Vibration (g)" stroke="#ec4899" strokeWidth={2} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Chart 4: RPM Dynamics & Exhaust Gas Temp (EGT) */}
        {(activeChartGroup === 'all' || activeChartGroup === 'thermal') && (
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between mb-2 font-mono">
              <span className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                <Gauge className="w-3.5 h-3.5" /> Engine RPM & EGT 1-4 Exhaust Array
              </span>
              <span className="text-[10px] text-slate-400">Redline: 5800 RPM</span>
            </div>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="time" stroke="#64748b" fontSize={10} tickLine={false} />
                  <YAxis domain={[650, 1000]} stroke="#06b6d4" fontSize={10} tickLine={false} />
                  <Tooltip content={customTooltip} />
                  <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace' }} />
                  <Line type="monotone" dataKey="egt1" name="EGT 1" stroke="#38bdf8" strokeWidth={1.5} dot={false} isAnimationActive={false} />
                  <Line type="monotone" dataKey="egt2" name="EGT 2" stroke="#a855f7" strokeWidth={1.5} dot={false} isAnimationActive={false} />
                  <Line type="monotone" dataKey="egt3" name="EGT 3" stroke="#ef4444" strokeWidth={2} dot={false} isAnimationActive={false} />
                  <Line type="monotone" dataKey="egt4" name="EGT 4" stroke="#eab308" strokeWidth={1.5} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
