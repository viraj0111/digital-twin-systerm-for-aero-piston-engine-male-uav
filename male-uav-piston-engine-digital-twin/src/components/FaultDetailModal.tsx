import React from 'react';
import { 
  AlertTriangle, 
  ShieldAlert, 
  X, 
  Wrench, 
  Activity, 
  Clock, 
  CheckCircle2, 
  ChevronRight, 
  Gauge, 
  Thermometer, 
  Flame, 
  Droplet, 
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import { EngineFault, DigitalTwinState } from '../types/engine';

interface FaultDetailModalProps {
  fault: EngineFault | null;
  isOpen: boolean;
  onClose: () => void;
  onNavigateToAiSolver: (fault?: EngineFault) => void;
  onNavigateToTab: (tab: string) => void;
  state: DigitalTwinState;
}

export const FaultDetailModal: React.FC<FaultDetailModalProps> = ({
  fault,
  isOpen,
  onClose,
  onNavigateToAiSolver,
  onNavigateToTab,
  state
}) => {
  if (!isOpen || (!fault && (!state.faults || state.faults.length === 0))) return null;

  const { telemetry, health, rul } = state;
  const activeFaults = state.faults && state.faults.length > 0 ? state.faults : (fault ? [fault] : []);

  // Determine detailed diagnostic explanation based on fault type or name
  const getDiagnosticExplanation = (f: EngineFault) => {
    const text = (f.name + ' ' + f.root_cause + ' ' + f.fault_type).toLowerCase();
    
    if (text.includes('thermal') || text.includes('overheat') || text.includes('cht')) {
      const maxCht = Math.max(telemetry.cht1_C, telemetry.cht2_C, telemetry.cht3_C, telemetry.cht4_C);
      return {
        headline: 'Cylinder Overheating & Thermal Runaway Alert!',
        summary: `The engine cylinder temperature (${maxCht.toFixed(1)}°C) has significantly exceeded the safe limit (135°C). Continued operation at full power will likely result in micro-welding of the piston rings to the cylinder wall, leading to catastrophic in-flight engine seizure.`,
        actionAdvice: 'Navigate to the AI Problem Solver and apply the "Pulse-and-Glide Loiter" or "Throttle De-rating" strategy to reduce thermal load and extend flight time.',
        failureRisk: 'High risk of piston seizure within 15 to 30 minutes.'
      };
    }

    if (text.includes('oil') || text.includes('lubrication')) {
      return {
        headline: 'Engine Oil Pressure Drop & Bearing Risk!',
        summary: `Engine oil pressure has dropped to ${telemetry.oil_pressure_bar.toFixed(2)} bar (Safe limit: >2.5 bar). The hydrodynamic film between the crankshaft bearings is failing, initiating metal-on-metal friction.`,
        actionAdvice: 'Immediately reduce RPM and transition to low-power cruise while maintaining altitude to decrease bearing load.',
        failureRisk: 'Critical risk of conrod bearing failure and crankshaft cracking within 10 to 20 minutes.'
      };
    }

    if (text.includes('misfire') || text.includes('combustion') || text.includes('injector')) {
      return {
        headline: 'Cylinder Combustion Misfire / Fuel Injection Issue!',
        summary: `Improper fuel combustion detected in one or more cylinders due to air-fuel imbalance or injector clogging. This is generating torsional vibration and uneven stress on the crankshaft, elevating vibration levels to (${telemetry.vibration_g.toFixed(2)}g).`,
        actionAdvice: 'Balance the auxiliary fuel rail or richen the global mixture to mitigate the lean burn condition.',
        failureRisk: 'Potential exhaust valve burnout and crankshaft failure due to chronic fatigue.'
      };
    }

    if (text.includes('vibration') || text.includes('bearing') || text.includes('spalling')) {
      return {
        headline: 'Abnormal Mechanical Vibration Alert!',
        summary: `Continuous mechanical vibration has escalated to ${telemetry.vibration_g.toFixed(2)}g. This indicates internal conrod bearing or piston pin spalling and excessive friction.`,
        actionAdvice: 'Utilize the AI Problem Solver to derate torque and configure a glide plan to the nearest airstrip.',
        failureRisk: 'High probability of conrod bolt failure within 20 to 40 minutes.'
      };
    }

    if (text.includes('sensor') || text.includes('disconnect') || text.includes('loss')) {
      return {
        headline: 'Sensor Hardware Disconnect / Signal Loss!',
        summary: `${f.name}: ${f.root_cause}. AI Virtual Soft-Sensor has engaged automatically to synthesize telemetry.`,
        actionAdvice: 'Verify auxiliary sensor channels and schedule hardware harness inspection upon landing.',
        failureRisk: 'Reduced telemetry observability; redundant channels compensating.'
      };
    }

    return {
      headline: 'Engine Subsystem Anomaly Detected!',
      summary: `${f.name}: ${f.root_cause}. The AI digital twin has isolated this anomaly through 20Hz sensor pattern monitoring.`,
      actionAdvice: 'Immediately consult the AI Problem Solver tab to evaluate endurance-extending remediation strategies.',
      failureRisk: 'Engine degradation will accelerate by 3x if left unaddressed.'
    };
  };

  // Key live parameters relevant to this fault
  const getRelevantParameters = () => {
    return [
      {
        label: 'Peak CHT (Cylinder Head)',
        value: `${Math.max(telemetry.cht1_C, telemetry.cht2_C, telemetry.cht3_C, telemetry.cht4_C).toFixed(1)} °C`,
        limit: 'Safe: < 135 °C (Crit: 145°C)',
        isWarn: Math.max(telemetry.cht1_C, telemetry.cht2_C, telemetry.cht3_C, telemetry.cht4_C) > 135,
        isCrit: Math.max(telemetry.cht1_C, telemetry.cht2_C, telemetry.cht3_C, telemetry.cht4_C) > 145
      },
      {
        label: 'Peak EGT (Exhaust Gas)',
        value: `${Math.max(telemetry.egt1_C, telemetry.egt2_C, telemetry.egt3_C, telemetry.egt4_C).toFixed(1)} °C`,
        limit: 'Safe: < 860 °C (Crit: 920°C)',
        isWarn: Math.max(telemetry.egt1_C, telemetry.egt2_C, telemetry.egt3_C, telemetry.egt4_C) > 860,
        isCrit: Math.max(telemetry.egt1_C, telemetry.egt2_C, telemetry.egt3_C, telemetry.egt4_C) > 920
      },
      {
        label: 'Oil Pressure',
        value: `${telemetry.oil_pressure_bar.toFixed(2)} bar`,
        limit: 'Safe: 3.0 - 5.0 bar (Crit: < 1.8)',
        isWarn: telemetry.oil_pressure_bar < 2.5,
        isCrit: telemetry.oil_pressure_bar < 1.8
      },
      {
        label: 'Engine Vibration RMS',
        value: `${telemetry.vibration_g.toFixed(2)} g`,
        limit: 'Safe: < 1.2 g (Crit: > 2.0g)',
        isWarn: telemetry.vibration_g > 1.2,
        isCrit: telemetry.vibration_g > 2.0
      },
      {
        label: 'Engine RPM',
        value: `${Math.round(telemetry.rpm)} RPM`,
        limit: 'Cruise: 4500 - 5200',
        isWarn: telemetry.rpm > 5500,
        isCrit: telemetry.rpm > 5800
      },
      {
        label: 'Oil Temperature',
        value: `${telemetry.oil_temp_C.toFixed(1)} °C`,
        limit: 'Safe: 80 - 110 °C',
        isWarn: telemetry.oil_temp_C > 115,
        isCrit: telemetry.oil_temp_C > 125
      }
    ];
  };

  const paramList = getRelevantParameters();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden my-6">
        {/* Modal Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-900/90 text-red-200 flex items-center justify-center shadow">
              <ShieldAlert className="w-6 h-6 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase border bg-red-900 text-red-200 border-red-700 animate-pulse">
                  {activeFaults.length} ACTIVE PROPULSION PROBLEM{activeFaults.length > 1 ? 'S' : ''} DETECTED
                </span>
                <span className="text-xs font-mono text-cyan-300">
                  Showing All Faults Individually
                </span>
              </div>
              <h2 className="text-base font-bold font-mono text-white mt-0.5">
                Comprehensive Multi-Fault Diagnostics & Individual Solutions
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body - Listing All Active Faults Individually */}
        <div className="p-5 space-y-6 max-h-[70vh] overflow-y-auto font-mono text-xs">
          {activeFaults.map((f, index) => {
            const diagnosticInfo = getDiagnosticExplanation(f);
            const isCritical = f.severity === 'CRITICAL';
            return (
              <div key={f.id || index} className={`rounded-xl border ${isCritical ? 'border-red-500/50 bg-red-950/20' : 'border-amber-500/50 bg-amber-950/20'} p-4 space-y-4 shadow-lg`}>
                {/* Fault Item Header */}
                <div className={`p-3 rounded-lg border flex flex-wrap items-center justify-between gap-2 ${
                  isCritical ? 'bg-red-950/70 border-red-500/60 text-red-100' : 'bg-amber-950/70 border-amber-500/60 text-amber-100'
                }`}>
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-slate-950 border border-slate-700 text-white flex items-center justify-center text-xs font-bold">
                      {index + 1}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded uppercase border ${
                          isCritical ? 'bg-red-900 text-red-200 border-red-700' : 'bg-amber-900 text-amber-200 border-amber-700'
                        }`}>
                          {f.severity}
                        </span>
                        <span className="text-[11px] text-slate-300">Confidence: {f.confidence_pct}%</span>
                        <span className="text-[11px] text-slate-400">Affected: {f.affected_parameters.join(', ')}</span>
                      </div>
                      <h3 className="text-sm font-bold font-mono text-white mt-0.5">{f.name}</h3>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      onClose();
                      onNavigateToAiSolver(f);
                    }}
                    className="px-3 py-1.5 rounded bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white text-[11px] font-bold transition flex items-center gap-1.5 shadow"
                  >
                    <Wrench className="w-3.5 h-3.5" />
                    <span>Solve This With AI</span>
                  </button>
                </div>

                {/* Diagnostic Summary */}
                <div className="rounded-lg border border-slate-800 bg-slate-900/90 p-3 space-y-2">
                  <div className="flex items-center gap-2 text-amber-300 font-bold text-xs font-sans">
                    <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] uppercase font-mono border border-amber-500/30">
                      Problem #{index + 1} Analysis
                    </span>
                    <span>{diagnosticInfo.headline}</span>
                  </div>
                  <p className="text-slate-200 font-sans text-xs leading-relaxed">
                    {diagnosticInfo.summary}
                  </p>
                  <div className="pt-2 border-t border-slate-800 flex items-center gap-2 text-red-300 font-sans text-[11px]">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                    <span><strong>Risk:</strong> {diagnosticInfo.failureRisk}</span>
                  </div>
                </div>

                {/* Root Cause */}
                <div className="bg-slate-950/80 border border-slate-800/80 rounded-lg p-3">
                  <div className="text-slate-400 uppercase font-bold text-[10px] mb-1">Engineering Root Cause</div>
                  <p className="text-slate-300 text-xs">{f.root_cause}</p>
                </div>

                {/* Recommended SOP Actions */}
                <div className="bg-slate-950/80 border border-slate-800/80 rounded-lg p-3">
                  <div className="text-cyan-400 uppercase font-bold text-[10px] mb-2 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Individual Remediation SOP Actions for Problem #{index + 1}</span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-slate-300 font-sans">
                    {f.recommended_actions.map((act, i) => (
                      <li key={i} className="flex items-start gap-2 bg-slate-900/60 p-2 rounded border border-slate-800/60">
                        <span className="w-4 h-4 rounded-full bg-cyan-950 border border-cyan-700 text-cyan-300 flex items-center justify-center text-[9px] font-mono shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <span>{act}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}

          {/* Live Sensor Metrics vs Normal Thresholds */}
          <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-4">
            <div className="text-slate-400 uppercase font-bold text-[11px] mb-3 flex items-center justify-between">
              <span>Current Live Telemetry vs Threshold Limits (All Systems)</span>
              <span className="text-[10px] text-slate-500 font-normal">20 Hz Real-Time Sampling</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {paramList.map((p, idx) => (
                <div 
                  key={idx} 
                  className={`p-2.5 rounded-lg border text-xs transition ${
                    p.isCrit 
                      ? 'bg-red-950/40 border-red-500/60 text-red-200 ring-1 ring-red-500/30' 
                      : p.isWarn 
                      ? 'bg-amber-950/30 border-amber-500/50 text-amber-200' 
                      : 'bg-slate-900 border-slate-800 text-slate-300'
                  }`}
                >
                  <div className="text-[10px] text-slate-400 truncate mb-1">{p.label}</div>
                  <div className={`text-sm font-bold font-mono ${p.isCrit ? 'text-red-400' : p.isWarn ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {p.value}
                  </div>
                  <div className="text-[9px] text-slate-500 mt-0.5">{p.limit}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer / Direct Navigation Actions */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 font-mono">
          <div className="text-xs text-slate-400">
            Current RUL: <strong className="text-cyan-300">{rul.estimated_hours.toFixed(0)} hrs</strong> | Health: <strong className="text-amber-400">{health.health_score_pct.toFixed(1)}%</strong>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onNavigateToTab('schematic');
              }}
              className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-1.5"
            >
              <span>Inspect Schematic</span>
            </button>

            <button
              id="modal-btn-solve-all-ai"
              onClick={() => {
                onClose();
                onNavigateToAiSolver(activeFaults[0]);
              }}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white text-xs font-bold transition shadow-lg flex items-center gap-2 animate-pulse"
            >
              <Wrench className="w-4 h-4" />
              <span>SOLVE ALL WITH AI (MAX FLIGHT TIME)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
