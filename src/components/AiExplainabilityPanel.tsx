import React from 'react';
import { 
  Activity, 
  Cpu, 
  AlertCircle, 
  ShieldCheck, 
  Clock, 
  TrendingDown, 
  Layers, 
  HelpCircle,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { DigitalTwinState } from '../types/engine';

interface AiExplainabilityPanelProps {
  state: DigitalTwinState;
}

export const AiExplainabilityPanel: React.FC<AiExplainabilityPanelProps> = ({ state }) => {
  const { health, rul, risk, telemetry } = state;

  const getHealthBadge = (score: number) => {
    if (score >= 95) return { label: 'HEALTHY NOMINAL', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' };
    if (score >= 85) return { label: 'SLIGHT DEGRADATION', color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40' };
    if (score >= 70) return { label: 'MODERATE DEGRADATION', color: 'bg-amber-500/20 text-amber-400 border-amber-500/40' };
    return { label: 'SEVERE DEGRADATION', color: 'bg-red-500/20 text-red-400 border-red-500/40' };
  };

  const badge = getHealthBadge(health.health_score_pct);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-purple-950 border border-purple-500/40 flex items-center justify-center text-purple-400">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold font-mono text-white flex items-center gap-2">
              Explainable AI Prognostics & Health Index
              <span className="text-[10px] font-sans px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800">
                Transparent Inference
              </span>
            </h3>
            <p className="text-xs text-slate-400 font-mono">
              Thermodynamic fatigue decomposition & degradation driver attribution
            </p>
          </div>
        </div>

        <div className={`px-3 py-1 rounded-lg border text-xs font-mono font-bold tracking-wide ${badge.color}`}>
          {badge.label}
        </div>
      </div>

      {/* Primary Metrics: Health Score & RUL Prediction */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Health Score Subsystem Breakdown */}
        <div className="bg-slate-950/70 rounded-xl p-3.5 border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-emerald-400" />
              Calculated Engine Health Index
            </span>
            <span className="text-lg font-bold font-mono text-emerald-400">
              {health.health_score_pct.toFixed(1)}%
            </span>
          </div>

          <p className="text-[11px] text-slate-400 font-mono mb-3">
            Multi-parameter synthesis of thermal stress, boundary lubrication, mechanical vibration, and combustion balance.
          </p>

          {/* Subsystem Health Sliders */}
          <div className="space-y-2 text-xs font-mono">
            {/* Thermal Health */}
            <div>
              <div className="flex justify-between text-[11px] mb-0.5">
                <span className="text-slate-400">Thermal Subsystem (CHT/EGT):</span>
                <span className={health.thermal_health_pct < 80 ? 'text-red-400 font-bold' : 'text-slate-200'}>
                  {health.thermal_health_pct}%
                </span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${health.thermal_health_pct < 70 ? 'bg-red-500' : health.thermal_health_pct < 85 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                  style={{ width: `${health.thermal_health_pct}%` }}
                />
              </div>
            </div>

            {/* Lubrication Health */}
            <div>
              <div className="flex justify-between text-[11px] mb-0.5">
                <span className="text-slate-400">Lubrication Circuit (Oil P/T):</span>
                <span className={health.lubrication_health_pct < 80 ? 'text-red-400 font-bold' : 'text-slate-200'}>
                  {health.lubrication_health_pct}%
                </span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${health.lubrication_health_pct < 70 ? 'bg-red-500' : health.lubrication_health_pct < 85 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                  style={{ width: `${health.lubrication_health_pct}%` }}
                />
              </div>
            </div>

            {/* Mechanical Health */}
            <div>
              <div className="flex justify-between text-[11px] mb-0.5">
                <span className="text-slate-400">Mechanical & Vibration (RMS):</span>
                <span className={health.mechanical_health_pct < 80 ? 'text-red-400 font-bold' : 'text-slate-200'}>
                  {health.mechanical_health_pct}%
                </span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${health.mechanical_health_pct < 70 ? 'bg-red-500' : health.mechanical_health_pct < 85 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                  style={{ width: `${health.mechanical_health_pct}%` }}
                />
              </div>
            </div>

            {/* Combustion Health */}
            <div>
              <div className="flex justify-between text-[11px] mb-0.5">
                <span className="text-slate-400">Combustion Balance (Spread):</span>
                <span className={health.combustion_health_pct < 80 ? 'text-red-400 font-bold' : 'text-slate-200'}>
                  {health.combustion_health_pct}%
                </span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${health.combustion_health_pct < 70 ? 'bg-red-500' : health.combustion_health_pct < 85 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                  style={{ width: `${health.combustion_health_pct}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* AI RUL Prediction Box */}
        <div className="bg-slate-950/70 rounded-xl p-3.5 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-mono font-bold text-cyan-300 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-cyan-400" />
                AI Remaining Useful Life (RUL) Prediction
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                Confidence: {rul.confidence_pct}%
              </span>
            </div>

            <div className="my-2 bg-slate-900 border border-slate-800 rounded-lg p-3">
              <div className="text-[10px] uppercase font-mono text-slate-400">
                Estimated Remaining Flight Hours to Major Overhaul
              </div>
              <div className="text-2xl font-bold font-mono text-cyan-300 flex items-baseline gap-2">
                <span>{rul.estimated_hours.toFixed(0)} <span className="text-sm font-normal text-slate-400">HOURS</span></span>
                <span className="text-xs font-normal text-slate-400">
                  (95% CI: {rul.lower_bound_hours.toFixed(0)} - {rul.upper_bound_hours.toFixed(0)} hrs)
                </span>
              </div>
            </div>

            <div className="space-y-1 text-xs font-mono">
              <div className="flex justify-between text-slate-300">
                <span className="text-slate-400">Limiting Subsystem:</span>
                <strong className="text-white">{rul.limiting_subsystem}</strong>
              </div>
              <div className="flex justify-between text-slate-300">
                <span className="text-slate-400">Projected Failure Mode:</span>
                <strong className="text-amber-300">{rul.projected_failure_mode}</strong>
              </div>
              <div className="flex justify-between text-slate-300">
                <span className="text-slate-400">Current Degradation Rate:</span>
                <strong className="text-slate-200">{rul.degradation_rate_per_hr}% / flight hr</strong>
              </div>
            </div>
          </div>

          <div className="mt-3 p-2 rounded bg-slate-900/80 border border-slate-800 text-[10px] text-slate-400 font-mono leading-relaxed">
            <strong className="text-slate-300">Prognostics Notice:</strong> {rul.disclaimer}
          </div>
        </div>
      </div>

      {/* Explainable AI Decision Tree / Factor Decomposition */}
      <div className="bg-slate-950/70 rounded-xl p-3.5 border border-slate-800">
        <div className="flex items-center gap-2 mb-3">
          <HelpCircle className="w-4 h-4 text-cyan-400" />
          <h4 className="text-xs font-bold font-mono text-white uppercase tracking-wider">
            Explainable AI Reasoning: Why Engine Health & RUL Were Adjusted
          </h4>
        </div>

        <div className="space-y-2">
          {health.explanation_factors.map((exp, idx) => (
            <div 
              key={idx}
              className="bg-slate-900 border border-slate-800 rounded-lg p-2.5 flex flex-col md:flex-row items-start md:items-center justify-between gap-2 text-xs font-mono"
            >
              <div className="flex items-start gap-2.5">
                <div className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${
                  exp.impact_score > 20 ? 'bg-red-500' : exp.impact_score > 0 ? 'bg-amber-500' : 'bg-emerald-400'
                }`} />
                <div>
                  <div className="font-bold text-white flex items-center gap-2">
                    <span>{exp.factor}</span>
                    {exp.impact_score > 0 && (
                      <span className="text-[10px] text-red-400 font-semibold px-1.5 py-0.2 bg-red-950/50 rounded border border-red-900/50">
                        -{exp.impact_score}% Health Impact
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                    {exp.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-right text-[11px] flex-shrink-0">
                <div className="bg-slate-950 px-2 py-1 rounded border border-slate-800">
                  <span className="text-slate-500 block text-[9px] uppercase">{exp.parameter}</span>
                  <span className="font-bold text-cyan-300">{exp.observed_value}</span>
                </div>
                <div className="bg-slate-950 px-2 py-1 rounded border border-slate-800">
                  <span className="text-slate-500 block text-[9px] uppercase">Nominal Range</span>
                  <span className="text-slate-300">{exp.nominal_range}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
