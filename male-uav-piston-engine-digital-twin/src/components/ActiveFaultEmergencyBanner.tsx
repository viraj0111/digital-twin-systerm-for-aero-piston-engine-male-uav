import React from 'react';
import { 
  AlertTriangle, 
  ShieldAlert, 
  Wrench, 
  ArrowRight, 
  Flame, 
  Droplet, 
  Activity, 
  CheckCircle2, 
  Radio, 
  ExternalLink,
  ChevronRight,
  Info
} from 'lucide-react';
import { EngineFault, DigitalTwinState } from '../types/engine';

interface ActiveFaultEmergencyBannerProps {
  faults: EngineFault[];
  state: DigitalTwinState;
  onSelectFault: (fault: EngineFault) => void;
  onNavigateTab: (tab: string) => void;
}

export const ActiveFaultEmergencyBanner: React.FC<ActiveFaultEmergencyBannerProps> = ({
  faults,
  state,
  onSelectFault,
  onNavigateTab
}) => {
  const { telemetry, health, rul } = state;

  if (faults.length === 0) {
    return (
      <div className="rounded-xl border border-emerald-500/30 bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 px-4 py-2.5 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-emerald-300 font-bold">ALL PROPULSION SYSTEMS NOMINAL:</span>
          <span className="text-slate-300">
            CHT/EGT balanced across 4 cylinders • Oil pressure {telemetry.oil_pressure_bar.toFixed(2)} bar • Vibration {telemetry.vibration_g.toFixed(2)}g
          </span>
        </div>
        <div className="flex items-center gap-2 text-slate-400 text-[11px]">
          <span>Health: <strong className="text-emerald-300">{health.health_score_pct.toFixed(0)}%</strong></span>
          <span>•</span>
          <span>RUL: <strong className="text-cyan-300">{rul.estimated_hours.toFixed(0)} hrs</strong></span>
        </div>
      </div>
    );
  }

  // Active faults exist!
  const primaryFault = faults[0];
  const isCritical = faults.some(f => f.severity === 'CRITICAL');

  // Simple diagnostic breakdown of what's happening
  const getSimpleDiagnosticSummary = (f: EngineFault) => {
    const txt = (f.name + ' ' + f.root_cause + ' ' + f.fault_type).toLowerCase();
    if (txt.includes('thermal') || txt.includes('overheat') || txt.includes('cht')) {
      const maxCht = Math.max(telemetry.cht1_C, telemetry.cht2_C, telemetry.cht3_C, telemetry.cht4_C);
      return `Cylinder temperature has reached ${maxCht.toFixed(1)}°C (Safe limit: 135°C). Critical engine overheat detected!`;
    }
    if (txt.includes('oil') || txt.includes('lubrication')) {
      return `Oil pressure dropped to ${telemetry.oil_pressure_bar.toFixed(2)} bar. Critical bearing lubrication failure!`;
    }
    if (txt.includes('misfire') || txt.includes('combustion')) {
      return `Cylinder misfire detected. Severe torsional vibration escalated to ${telemetry.vibration_g.toFixed(2)}g!`;
    }
    return `${f.name}: ${f.root_cause}`;
  };

  return (
    <div 
      className={`rounded-xl border p-4 shadow-xl transition-all duration-300 ${
        isCritical
          ? 'bg-gradient-to-r from-red-950/80 via-slate-900 to-red-950/60 border-red-500/80 ring-1 ring-red-500/40 shadow-red-950/50'
          : 'bg-gradient-to-r from-amber-950/80 via-slate-900 to-amber-950/60 border-amber-500/80 ring-1 ring-amber-500/40 shadow-amber-950/50'
      }`}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left Side: Fault Identity & Plain Explanation */}
        <div className="space-y-1.5 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-mono font-black uppercase tracking-wider flex items-center gap-1.5 shadow ${
              isCritical
                ? 'bg-red-600 text-white animate-pulse'
                : 'bg-amber-600 text-white'
            }`}>
              <ShieldAlert className="w-3.5 h-3.5 fill-current" />
              {isCritical ? 'CRITICAL ENGINE FAULT ACTIVE' : 'PROPULSION FAULT WARNING'}
            </span>

            <span className="text-xs font-mono font-bold text-white bg-slate-950/90 px-2 py-0.5 rounded border border-slate-800">
              {faults.length} Fault{faults.length > 1 ? 's' : ''} Detected
            </span>

            <span className="text-[11px] font-mono text-cyan-300">
              Affected: <strong className="text-white">{primaryFault.affected_parameters.join(', ')}</strong>
            </span>
          </div>

          <div className="flex items-start gap-2 pt-1">
            <div>
              <h3 className="text-sm md:text-base font-bold font-mono text-white flex items-center gap-2">
                <span>{primaryFault.name}</span>
                <span className="text-xs font-normal text-slate-400 font-mono">
                  ({primaryFault.confidence_pct}% AI Confidence)
                </span>
              </h3>
              
              {/* Clear summary */}
              <p className="text-xs text-amber-200 font-sans mt-0.5 font-medium flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span>{getSimpleDiagnosticSummary(primaryFault)}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Right Side: Direct Interactive Navigation Buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* Button 1: Click to Inspect Fault Details Modal */}
          <button
            id="btn-inspect-active-fault"
            onClick={() => onSelectFault(primaryFault)}
            className="px-3 py-2 rounded-lg bg-slate-950/90 hover:bg-slate-800 text-white border border-slate-700 text-xs font-mono font-bold transition flex items-center gap-1.5 shadow-md group"
            title="Open complete fault diagnosis, physics root cause, and SOP"
          >
            <Info className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
            <span>INSPECT FAULT</span>
          </button>

          {/* Button 2: Click to directly open AI Problem Solver */}
          <button
            id="btn-solve-with-ai-direct"
            onClick={() => onNavigateTab('ai_remediation')}
            className="px-3.5 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white text-xs font-mono font-bold transition flex items-center gap-1.5 shadow-lg shadow-emerald-950/60 animate-pulse"
            title="Open AI Autonomous Problem Solver to find maximum flight endurance solution"
          >
            <Wrench className="w-4 h-4" />
            <span>SOLVE WITH AI (MAX ToF)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* If more than 1 fault, list the other faults as clickable pills */}
      {faults.length > 1 && (
        <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex flex-wrap items-center gap-2 text-xs font-mono">
          <span className="text-[10px] text-slate-400 uppercase font-bold">Also Active:</span>
          {faults.slice(1).map(f => (
            <button
              key={f.id}
              onClick={() => onSelectFault(f)}
              className="px-2 py-0.5 rounded bg-slate-950/90 hover:bg-slate-800 border border-slate-700 text-slate-200 text-[11px] flex items-center gap-1 transition"
            >
              <span className={`w-1.5 h-1.5 rounded-full ${f.severity === 'CRITICAL' ? 'bg-red-400' : 'bg-amber-400'}`} />
              <span>{f.name}</span>
              <ChevronRight className="w-3 h-3 text-slate-500" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
