import React from 'react';
import { 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  Wrench, 
  Navigation, 
  ChevronRight, 
  ShieldCheck, 
  Radio, 
  Flame, 
  Droplet, 
  Activity 
} from 'lucide-react';
import { DigitalTwinState, EngineFault, OperationalRecommendation } from '../types/engine';

interface FaultAlertsAndRecommendationsProps {
  state: DigitalTwinState;
  onOpenRemediation?: () => void;
  onSelectFault?: (fault: EngineFault) => void;
  onNavigateTab?: (tab: string) => void;
}

export const FaultAlertsAndRecommendations: React.FC<FaultAlertsAndRecommendationsProps> = ({ 
  state, 
  onOpenRemediation,
  onSelectFault,
  onNavigateTab
}) => {
  const { faults, recommendations, risk, health, rul, telemetry } = state;

  const getSeverityStyle = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-red-500/20 text-red-300 border-red-500/60 ring-1 ring-red-500/30 animate-pulse';
      case 'WARNING':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/60 ring-1 ring-amber-500/20';
      default:
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'IMMEDIATE':
        return 'bg-red-950 text-red-300 border-red-800 animate-pulse';
      case 'CAUTION':
        return 'bg-amber-950 text-amber-300 border-amber-800';
      case 'SCHEDULED_MAINTENANCE':
        return 'bg-blue-950 text-blue-300 border-blue-800';
      default:
        return 'bg-emerald-950 text-emerald-300 border-emerald-800';
    }
  };

  return (
    <div className="space-y-4">
      {/* Composite Flight Risk Assessment Card */}
      <div className={`rounded-xl p-4 border transition-all duration-300 ${
        risk.level === 'CRITICAL'
          ? 'bg-red-950/40 border-red-500/80 shadow-2xl shadow-red-900/40 ring-1 ring-red-500'
          : risk.level === 'HIGH'
          ? 'bg-amber-950/30 border-amber-500/60 shadow-xl shadow-amber-900/20'
          : risk.level === 'MEDIUM'
          ? 'bg-yellow-950/20 border-yellow-500/50'
          : 'bg-slate-900 border-slate-800'
      }`}>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-2">
            <ShieldAlert className={`w-5 h-5 ${
              risk.level === 'CRITICAL' ? 'text-red-400 animate-bounce' : risk.level === 'HIGH' ? 'text-amber-400' : 'text-emerald-400'
            }`} />
            <div>
              <h3 className="text-sm font-bold font-mono text-white flex items-center gap-2">
                MISSION FLIGHT RISK ASSESSMENT: <span className="underline">{risk.level} RISK</span>
                <span className="text-xs px-2 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800">
                  Risk Score: {risk.score}/100
                </span>
              </h3>
            </div>
          </div>

          {risk.mission_abort_recommended && (
            <div className="bg-red-600 text-white font-bold text-xs px-3 py-1 rounded-md font-mono animate-pulse shadow-md flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 fill-current" />
              MISSION ABORT & DIVERT LANDING RECOMMENDED
            </div>
          )}
        </div>

        {/* Risk Justification & Causal Drivers */}
        <p className="text-xs font-mono text-slate-300 leading-relaxed mb-3">
          {risk.justification}
        </p>

        {risk.critical_drivers.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono">
            <span className="text-[10px] text-slate-500 uppercase font-bold">Key Risk Drivers:</span>
            {risk.critical_drivers.map((drv, idx) => (
              <span key={idx} className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300 text-[11px]">
                {drv}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Autonomous AI Remediation Quick Trigger */}
      {onOpenRemediation && (
        <div 
          onClick={onOpenRemediation}
          className="group cursor-pointer rounded-xl border border-emerald-500/50 bg-gradient-to-r from-emerald-950/40 via-slate-900 to-cyan-950/40 p-3.5 shadow-lg flex flex-wrap items-center justify-between gap-3 hover:border-emerald-400 transition"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-950 border border-emerald-500/60 flex items-center justify-center text-emerald-400 shrink-0">
              <Wrench className="w-4 h-4 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold font-mono text-emerald-300">
                  AI PROBLEM DETECTED? TEST SOLUTIONS TO MAXIMIZE TIME OF FLIGHT (ToF)
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-900/60 text-emerald-200 border border-emerald-700">
                  AUTO-SOLVER
                </span>
              </div>
              <p className="text-[11px] text-slate-300 font-sans mt-0.5">
                The AI system will autonomously simulate multiple remediation strategies to determine the optimal configuration for maximizing remaining flight time.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs font-mono font-bold text-emerald-400 group-hover:text-emerald-300 transition">
            <span>LAUNCH AI SOLVER</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left Column: Active Faults & Multi-Variate Anomaly Log */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-semibold font-mono text-white">
                Detected Faults & Multi-Variate Anomalies
              </h3>
            </div>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800">
              {faults.length} Active
            </span>
          </div>

          {faults.length === 0 ? (
            <div className="bg-slate-950/60 rounded-lg p-6 text-center border border-slate-800/80">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <h4 className="text-xs font-bold font-mono text-emerald-300 uppercase">
                All Propulsion Systems Nominal
              </h4>
              <p className="text-[11px] text-slate-400 font-mono mt-1">
                Continuous 20Hz sensor pattern monitoring indicates zero thermodynamic, lubrication, or mechanical anomalies.
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
              {faults.map(fault => (
                <div 
                  key={fault.id}
                  onClick={() => onSelectFault && onSelectFault(fault)}
                  className={`rounded-lg p-3 border text-xs font-mono transition-all cursor-pointer hover:shadow-lg hover:scale-[1.01] ${getSeverityStyle(fault.severity)}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-white text-sm">{fault.name}</span>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.2 rounded font-bold border border-current">
                      {fault.severity} • {fault.confidence_pct}% CONF
                    </span>
                  </div>

                  <p className="text-[11px] opacity-90 mb-2 leading-relaxed">
                    {fault.root_cause}
                  </p>

                  <div className="bg-slate-950/80 p-2 rounded border border-slate-800 mb-2">
                    <div className="text-[10px] text-slate-400 uppercase mb-0.5 font-bold">Affected Parameters:</div>
                    <div className="flex flex-wrap gap-1">
                      {fault.affected_parameters.map((p, i) => (
                        <span key={i} className="text-[10px] px-1.5 py-0.2 rounded bg-slate-900 border border-slate-700 text-cyan-300">
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mb-2.5">
                    <div className="text-[10px] uppercase font-bold text-slate-300 mb-1">Emergency Actions:</div>
                    <ul className="space-y-1 text-[11px] text-slate-300">
                      {fault.recommended_actions.slice(0, 2).map((act, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <ChevronRight className="w-3 h-3 text-cyan-400 mt-0.5 flex-shrink-0" />
                          <span>{act}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Interactive Direct Navigation Strip */}
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onSelectFault) onSelectFault(fault);
                      }}
                      className="text-[11px] text-cyan-300 hover:text-cyan-100 flex items-center gap-1 font-bold underline underline-offset-2"
                    >
                      <span>🔍 Full Diagnosis & SOP</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onNavigateTab) {
                          onNavigateTab('ai_remediation');
                        } else if (onOpenRemediation) {
                          onOpenRemediation();
                        }
                      }}
                      className="px-2.5 py-1 rounded bg-emerald-600/90 hover:bg-emerald-500 text-white text-[11px] font-bold flex items-center gap-1 shadow-sm transition"
                    >
                      <Wrench className="w-3 h-3" />
                      <span>Solve with AI ➔</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Actionable Operational & Maintenance Recommendations */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Wrench className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-semibold font-mono text-white">
                Actionable Aeronautical Recommendations
              </h3>
            </div>
            <span className="text-[10px] font-mono text-slate-400">
              UAV Pilot / Maintenance SOP
            </span>
          </div>

          <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
            {recommendations.map(rec => (
              <div 
                key={rec.id}
                className="bg-slate-950/80 border border-slate-800 hover:border-slate-700 rounded-lg p-3 text-xs font-mono transition shadow-md"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-[10px] px-2 py-0.5 rounded border font-bold ${getPriorityBadge(rec.priority)}`}>
                    {rec.priority}
                  </span>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">
                    Target: <strong className="text-cyan-300">{rec.target_role.replace('_', ' ')}</strong>
                  </span>
                </div>

                <h4 className="text-xs font-bold text-white mb-1">
                  {rec.title}
                </h4>

                <div className="bg-slate-900/90 p-2 rounded border border-slate-800 mb-2">
                  <div className="text-[10px] text-cyan-400 font-semibold mb-0.5">Mandated Action:</div>
                  <p className="text-[11px] text-slate-200 leading-snug">
                    {rec.action}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400">
                  <div>
                    <span className="block text-slate-500 uppercase">Subsystem:</span>
                    <span className="text-slate-300 font-semibold">{rec.system}</span>
                  </div>
                  <div>
                    <span className="block text-slate-500 uppercase">Expected Outcome:</span>
                    <span className="text-emerald-400 font-semibold">{rec.expected_outcome}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
