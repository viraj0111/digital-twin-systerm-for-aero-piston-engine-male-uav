import React, { useState, useEffect } from 'react';
import { 
  Wrench, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Flame, 
  ShieldAlert, 
  ShieldCheck, 
  Zap, 
  ArrowRight, 
  ChevronRight, 
  Activity, 
  Cpu, 
  Play, 
  RotateCcw, 
  Compass, 
  TrendingUp, 
  Sliders, 
  Radio, 
  Droplet,
  Sparkles
} from 'lucide-react';
import { EngineTelemetry, EngineHealthMetrics, EngineFault } from '../types/engine';
import { 
  FaultDiagnosticReport, 
  RemediationStrategy, 
  PROBLEM_PRESETS 
} from '../types/remediation';
import { remediationService } from '../services/remediationService';
import { digitalTwinService } from '../services/digitalTwinService';

interface AiFaultRemediationStudioProps {
  telemetry: EngineTelemetry;
  health: EngineHealthMetrics;
  faults: EngineFault[];
  initialPresetId?: string;
}

export const AiFaultRemediationStudio: React.FC<AiFaultRemediationStudioProps> = ({
  telemetry,
  health,
  faults,
  initialPresetId = 'live_telemetry'
}) => {
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(
    faults.length > 1 ? null : initialPresetId
  );
  const [report, setReport] = useState<FaultDiagnosticReport | null>(null);
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [appliedStrategyId, setAppliedStrategyId] = useState<string | null>(null);
  const [appliedNotification, setAppliedNotification] = useState<string | null>(null);
  const [selectedStrategyForDetail, setSelectedStrategyForDetail] = useState<string | null>(null);

  // Auto-run evaluation on mount or preset switch
  const runEvaluation = async (presetId?: string | null) => {
    if (!presetId) {
      setReport(null);
      return;
    }
    setIsEvaluating(true);
    setAppliedNotification(null);
    try {
      const activePreset = presetId !== 'live_telemetry' ? presetId : undefined;
      const res = await remediationService.evaluateRemediation(
        telemetry,
        health,
        faults,
        activePreset
      );
      setReport(res);
      setSelectedStrategyForDetail(res.bestStrategyId);
    } catch (err) {
      console.error('Failed to run remediation diagnosis:', err);
    } finally {
      setIsEvaluating(false);
    }
  };

  useEffect(() => {
    if (initialPresetId && initialPresetId !== 'live_telemetry') {
      setSelectedPresetId(initialPresetId);
    } else if (faults.length <= 1) {
      setSelectedPresetId('live_telemetry');
    } else {
      setSelectedPresetId(null);
    }
  }, [initialPresetId, faults.length]);

  useEffect(() => {
    if (selectedPresetId !== null) {
      runEvaluation(selectedPresetId);
    } else {
      setReport(null);
    }
  }, [selectedPresetId]);

  // Handle applying chosen strategy to the live digital twin
  const handleApplyStrategy = (strategy: RemediationStrategy) => {
    // Apply environmental and operational inputs to digital twin service
    digitalTwinService.setEnvironmentalInputs({
      throttle_pct: strategy.operationalChanges.throttle_pct,
      altitude_ft: strategy.operationalChanges.altitude_ft,
      mission_phase: 'LOITER'
    });

    // If a specific individual fault was selected and tested, resolve ONLY that specific fault; otherwise resolve all
    if (selectedPresetId && faults.some(f => f.id === selectedPresetId)) {
      digitalTwinService.resolveFault(selectedPresetId);
    } else if (faults.length > 0) {
      digitalTwinService.resolveAllFaults();
    } else {
      digitalTwinService.clearAllFaults();
    }

    setAppliedStrategyId(strategy.id);
    setAppliedNotification(
      `Applied "${strategy.shortTitle}" to Digital Twin: Faults successfully mitigated, engine vitals normalized, and ToF maximized!`
    );

    // Auto-clear notification after 8 seconds
    setTimeout(() => {
      setAppliedNotification(null);
    }, 8000);
  };

  const currentStrategyDetail = report?.strategies.find(
    s => s.id === (selectedStrategyForDetail || report?.bestStrategyId)
  );

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Top Banner & Control Deck */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 shadow-inner">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold font-mono text-white tracking-wide">
                  AI AUTONOMOUS FAULT DIAGNOSIS & MAX TIME-OF-FLIGHT (ToF) OPTIMIZER
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-700">
                  AUTO-SOLVER AI
                </span>
              </div>
              <p className="text-xs text-slate-400 font-sans mt-0.5">
                Upon detecting an anomaly, the AI instantly isolates the root cause, dynamically simulates multiple remediation profiles, and recommends the strategy that yields the maximum remaining Time of Flight (Endurance).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-rerun-solver"
              onClick={() => runEvaluation(selectedPresetId)}
              disabled={isEvaluating}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-mono text-xs font-bold transition shadow-sm"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isEvaluating ? 'animate-spin' : ''}`} />
              {isEvaluating ? 'Evaluating Solutions...' : 'Diagnose & Test Solutions'}
            </button>
          </div>
        </div>

        {/* Problem Scenario Switcher */}
        <div className="mt-4 pt-3 border-t border-slate-800/80">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-[11px] font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-cyan-400" />
              Select Engine Problem Scenario to Test:
            </span>
            <span className="text-[10px] font-mono text-slate-500">
              Select Live Telemetry or Pre-configured Engine Faults
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {faults.length === 0 ? (
              <button
                id="scenario-live"
                onClick={() => setSelectedPresetId('live_telemetry')}
                className={`p-2.5 rounded-lg border text-left font-mono transition flex flex-col justify-between ${
                  selectedPresetId === 'live_telemetry'
                    ? 'bg-cyan-950/60 border-cyan-500 text-cyan-300 shadow-md ring-1 ring-cyan-500/50'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold uppercase text-cyan-400">Live State</span>
                  <Radio className="w-3 h-3 text-cyan-400 animate-pulse" />
                </div>
                <div className="text-xs font-bold text-white line-clamp-1">Active Digital Twin</div>
                <div className="text-[9px] text-slate-400 mt-0.5">Live 20Hz Vitals</div>
              </button>
            ) : (
              faults.map(fault => {
                const isSelected = selectedPresetId === fault.id;
                return (
                  <button
                    key={fault.id}
                    id={`scenario-live-${fault.id}`}
                    onClick={() => setSelectedPresetId(fault.id)}
                    className={`p-2.5 rounded-lg border text-left font-mono transition flex flex-col justify-between ${
                      isSelected
                        ? 'bg-red-950/60 border-red-500 text-red-300 shadow-md ring-1 ring-red-500/50'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-bold uppercase text-red-400">Live Fault</span>
                      <Radio className="w-3 h-3 text-red-400 animate-pulse" />
                    </div>
                    <div className="text-xs font-bold text-white line-clamp-1">{fault.name}</div>
                    <div className="text-[9px] text-slate-400 mt-0.5 line-clamp-1">{fault.fault_type.replace(/_/g, ' ')}</div>
                  </button>
                );
              })
            )}

            {PROBLEM_PRESETS.map(preset => {
              const isSelected = selectedPresetId === preset.id;
              return (
                <button
                  key={preset.id}
                  id={`scenario-${preset.id}`}
                  onClick={() => setSelectedPresetId(preset.id)}
                  className={`p-2.5 rounded-lg border text-left font-mono transition flex flex-col justify-between ${
                    isSelected
                      ? 'bg-amber-950/60 border-amber-500 text-amber-300 shadow-md ring-1 ring-amber-500/50'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-[9px] font-bold px-1 rounded ${
                      preset.severity === 'CRITICAL' ? 'bg-red-950 text-red-300 border border-red-800' : 'bg-amber-950 text-amber-300 border border-amber-800'
                    }`}>
                      {preset.severity}
                    </span>
                    <AlertTriangle className="w-3 h-3 text-amber-400" />
                  </div>
                  <div className="text-xs font-bold text-white line-clamp-1">{preset.name}</div>
                  <div className="text-[9px] text-slate-400 mt-0.5 truncate">{preset.symptoms[0]}</div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Applied Strategy Confirmation Notification Banner */}
      {appliedNotification && (
        <div className="bg-emerald-950/80 border border-emerald-500 rounded-xl p-3.5 shadow-lg flex items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-900 border border-emerald-500 flex items-center justify-center text-emerald-300 shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold font-mono text-emerald-200">
                ACTIVE MITIGATION ENGAGED ON MALE UAV TWIN
              </div>
              <p className="text-[11px] font-mono text-emerald-300 mt-0.5">
                {appliedNotification}
              </p>
            </div>
          </div>
          <button 
            onClick={() => setAppliedNotification(null)}
            className="text-xs text-emerald-400 hover:text-white px-2 py-1"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* If multiple active faults exist, show all active problems and solutions individually */}
      {faults.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-xl space-y-3 font-mono">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-red-400 animate-pulse" />
              <h3 className="text-sm sm:text-base font-bold text-white">
                All Active Propulsion Problems & Individual Solutions ({faults.length} Detected)
              </h3>
            </div>
            <span className="text-[10px] text-cyan-400 px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800">
              Multi-Fault Analysis Active
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {faults.map((f, idx) => (
              <div 
                key={f.id || idx}
                className={`p-3.5 rounded-xl border text-xs space-y-2 ${
                  f.severity === 'CRITICAL' ? 'bg-red-950/40 border-red-500/60' : 'bg-amber-950/40 border-amber-500/60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                    f.severity === 'CRITICAL' ? 'bg-red-900 text-red-200' : 'bg-amber-900 text-amber-200'
                  }`}>
                    Problem #{idx + 1}: {f.severity}
                  </span>
                  <span className="text-[10px] text-slate-300">Confidence: {f.confidence_pct}%</span>
                </div>

                <div className="text-sm font-bold text-white">{f.name}</div>
                <p className="text-[11px] text-slate-300 font-sans leading-relaxed">{f.root_cause}</p>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-[10px] text-cyan-300 truncate">Affected: {f.affected_parameters.join(', ')}</span>
                  <button
                    onClick={() => setSelectedPresetId(f.id)}
                    className={`px-2.5 py-1 rounded text-[10px] font-bold transition flex items-center gap-1 ${
                      selectedPresetId === f.id ? 'bg-cyan-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                    }`}
                  >
                    <Wrench className="w-3 h-3" />
                    <span>{selectedPresetId === f.id ? 'Currently Testing' : 'Test This Solution'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Diagnostic Overview Card: System Detection Report */}
      {report && (
        <div className="bg-gradient-to-r from-red-950/40 via-slate-900 to-amber-950/30 border border-red-500/50 rounded-xl p-4 sm:p-5 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <ShieldAlert className="w-6 h-6 text-red-400 animate-pulse" />
              <div>
                <span className="text-[10px] font-mono text-red-400 uppercase tracking-wider font-bold">
                  Step 1: Autonomous Fault Diagnosis & Root Cause Isolation
                </span>
                <h3 className="text-base font-bold font-mono text-white flex items-center gap-2">
                  <span>{report.identifiedProblem}</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-red-950 text-red-200 border border-red-700 font-normal">
                    {report.problemSeverity} SEVERITY
                  </span>
                </h3>
              </div>
            </div>

            {/* Baseline Time of Flight Warning Tag */}
            <div className="bg-red-950/90 border border-red-600 rounded-lg p-2.5 text-right font-mono">
              <span className="block text-[10px] text-red-300 uppercase">
                Unmitigated Baseline Flight Time (Without Remediation):
              </span>
              <span className="text-lg font-bold text-red-400">
                ⚠️ Only {report.baselineToFMinutes} Minutes Remaining!
              </span>
              <span className="block text-[10px] text-slate-400">
                Failure: {report.baselineFailureMode}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
            <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase block mb-1">Affected Subsystem & Component</span>
              <div className="font-bold text-cyan-300">{report.affectedSubsystem}</div>
              <div className="text-slate-300 text-[11px] mt-0.5">Primary: {report.primaryComponent}</div>
            </div>

            <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800 md:col-span-2">
              <span className="text-[10px] text-amber-400 uppercase block mb-1">Ground Station Commander Explanation</span>
              <p className="text-[11px] text-slate-200 leading-relaxed">
                {report.rootCauseSummary}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Comparative Multi-Solution Grid: Different solutions tested by AI to maximize ToF */}
      {report && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Compass className="w-5 h-5 text-cyan-400" />
              <h3 className="text-sm sm:text-base font-bold font-mono text-white">
                Step 2: AI Solution Matrix (Different Solutions Evaluated to Maximize Flight Time)
              </h3>
            </div>
            <span className="text-xs font-mono text-slate-400">
              Sorted by Maximum Time of Flight (ToF) Extension
            </span>
          </div>

          {/* Time of Flight Visual Comparative Bar Graph */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl font-mono">
            <div className="text-xs font-bold text-white mb-3 flex items-center justify-between">
              <span>TIME OF FLIGHT (ENDURANCE) COMPARISON</span>
              <span className="text-slate-400 text-[11px]">Values in Operating Hours</span>
            </div>

            <div className="space-y-2.5">
              {/* Baseline Unmitigated */}
              <div>
                <div className="flex justify-between text-[11px] mb-1 text-slate-400">
                  <span className="text-red-400 font-bold">Baseline Unmitigated (No Solution Applied)</span>
                  <span className="text-red-400 font-bold">{(report.baselineToFMinutes / 60).toFixed(1)} hrs ({report.baselineToFMinutes} min)</span>
                </div>
                <div className="w-full h-3.5 bg-slate-950 rounded-full overflow-hidden border border-red-900/40">
                  <div 
                    className="h-full bg-red-600 rounded-full transition-all duration-700" 
                    style={{ width: `${Math.min(100, Math.max(6, ((report.baselineToFMinutes / 60) / 7) * 100))}%` }}
                  />
                </div>
              </div>

              {/* Each Evaluated Strategy Bar */}
              {report.strategies.map((strat, idx) => {
                const isWinner = strat.isRecommended;
                const widthPct = Math.min(100, Math.max(10, (strat.projectedMetrics.projected_tof_hours / 7) * 100));
                return (
                  <div key={strat.id}>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className={`flex items-center gap-1.5 ${isWinner ? 'text-emerald-400 font-bold' : 'text-slate-300'}`}>
                        {isWinner && <Sparkles className="w-3.5 h-3.5 text-emerald-400" />}
                        {strat.shortTitle} {isWinner && '(WINNER - MAX ToF)'}
                      </span>
                      <span className={isWinner ? 'text-emerald-400 font-bold' : 'text-slate-300'}>
                        {strat.projectedMetrics.projected_tof_hours} Hours 
                        <span className="text-emerald-400 ml-1">(+{strat.projectedMetrics.tof_gain_hours}h)</span>
                      </span>
                    </div>
                    <div className="w-full h-3.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                      <div 
                        className={`h-full rounded-full transition-all duration-700 ${
                          isWinner 
                            ? 'bg-gradient-to-r from-emerald-500 to-cyan-400 shadow-lg shadow-emerald-500/40' 
                            : 'bg-cyan-600/80'
                        }`} 
                        style={{ width: `${widthPct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Cards for each candidate solution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {report.strategies.map((strat) => {
              const isWinner = strat.isRecommended;
              const isApplied = appliedStrategyId === strat.id;

              return (
                <div 
                  key={strat.id}
                  className={`rounded-xl border p-4 transition-all duration-300 flex flex-col justify-between ${
                    isWinner 
                      ? 'bg-gradient-to-b from-emerald-950/40 via-slate-900 to-slate-900 border-emerald-500/80 shadow-2xl shadow-emerald-900/20 ring-1 ring-emerald-500/50' 
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div>
                    {/* Header with Winner Badge */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {isWinner && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-emerald-500 text-slate-950 flex items-center gap-1">
                              <Sparkles className="w-3 h-3" /> BEST SOLUTION FOR MAXIMUM ToF
                            </span>
                          )}
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800">
                            Suitability: {strat.suitabilityScore}%
                          </span>
                        </div>
                        <h4 className="text-sm font-bold font-mono text-white mt-1">
                          {strat.title}
                        </h4>
                      </div>

                      {/* Time of Flight Big Badge */}
                      <div className="bg-slate-950 border border-slate-800 rounded-lg p-2 text-right shrink-0 font-mono">
                        <span className="block text-[9px] text-slate-400 uppercase">New Flight Time</span>
                        <span className={`text-base font-bold ${isWinner ? 'text-emerald-400' : 'text-cyan-300'}`}>
                          {strat.projectedMetrics.projected_tof_hours} Hours
                        </span>
                        <span className="block text-[10px] text-emerald-400 font-bold">
                          +{strat.projectedMetrics.tof_gain_hours}h Gain
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 font-sans mb-3 leading-relaxed">
                      {strat.description}
                    </p>

                    {/* Operational Changes Grid */}
                    <div className="bg-slate-950/80 rounded-lg p-3 border border-slate-800/80 mb-3 font-mono text-xs">
                      <div className="text-[10px] text-slate-400 uppercase font-bold mb-2">Automated Control Adjustments:</div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        <div>
                          <span className="text-[10px] text-slate-500 block">Throttle:</span>
                          <span className="text-white font-bold">{strat.operationalChanges.throttle_pct}%</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block">Target Altitude:</span>
                          <span className="text-white font-bold">{strat.operationalChanges.altitude_ft} ft</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block">Prop RPM:</span>
                          <span className="text-white font-bold">{strat.operationalChanges.rpm} RPM</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block">Peak CHT Drops:</span>
                          <span className="text-emerald-400 font-bold">{strat.projectedMetrics.projected_cht_peak_C}°C</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block">Oil Temp:</span>
                          <span className="text-emerald-400 font-bold">{strat.projectedMetrics.projected_oil_temp_C}°C</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block">Risk Score:</span>
                          <span className="text-cyan-300 font-bold">{strat.projectedMetrics.risk_score}/100</span>
                        </div>
                      </div>
                    </div>

                    {/* Ground Commander Insight */}
                    <div className="bg-slate-950/50 p-2.5 rounded-lg border border-slate-800 text-[11px] text-slate-300 mb-3">
                      <span className="text-amber-400 font-bold block mb-0.5">Ground Commander Insight:</span>
                      {strat.hindiSummary}
                    </div>
                  </div>

                  {/* Apply Solution Button */}
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                    <button
                      onClick={() => setSelectedStrategyForDetail(strat.id)}
                      className="text-xs text-slate-400 hover:text-cyan-300 font-mono flex items-center gap-1"
                    >
                      <span>View Directives</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>

                    <button
                      id={`btn-apply-${strat.id}`}
                      onClick={() => handleApplyStrategy(strat)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-xs font-bold transition shadow-md ${
                        isApplied
                          ? 'bg-emerald-600 text-white'
                          : isWinner
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                      }`}
                    >
                      {isApplied ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                          <span>Active on UAV</span>
                        </>
                      ) : (
                        <>
                          <Zap className="w-3.5 h-3.5 text-amber-300" />
                          <span>Apply Solution to Twin</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Selected Strategy Directives & SOP Modal/Panel */}
      {currentStrategyDetail && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-xl font-mono text-xs">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <h4 className="font-bold text-white text-sm">
                Autopilot & Pilot Directives for "{currentStrategyDetail.shortTitle}"
              </h4>
            </div>
            <span className="text-emerald-400 font-bold">
              Time of Flight: {currentStrategyDetail.projectedMetrics.projected_tof_hours} hrs
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1.5">
                Automated Autopilot Steps:
              </span>
              <ul className="space-y-1.5 text-slate-200">
                {currentStrategyDetail.actionSteps.map((step, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <ChevronRight className="w-3.5 h-3.5 text-cyan-400 mt-0.5 shrink-0" />
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1.5">
                Tradeoffs & Flight Envelope Impact:
              </span>
              <div className="space-y-1">
                {currentStrategyDetail.tradeoffs.pros.map((p, i) => (
                  <div key={i} className="text-emerald-300 flex items-center gap-1.5">
                    <span className="text-emerald-400 font-bold">+</span>
                    <span>{p}</span>
                  </div>
                ))}
                {currentStrategyDetail.tradeoffs.cons.map((c, i) => (
                  <div key={i} className="text-slate-400 flex items-center gap-1.5">
                    <span className="text-amber-400 font-bold">-</span>
                    <span>{c}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Intelligence Briefing Box */}
      {report && (
        <div className="bg-slate-900/90 border border-cyan-500/30 rounded-xl p-4 sm:p-5 shadow-xl font-mono text-xs">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <h4 className="font-bold text-white text-sm">
                AI Autonomous Reasoning & Commander Briefing
              </h4>
            </div>
            <span className="text-[10px] text-slate-400">
              Agent: <strong className="text-cyan-300">{report.modelUsed}</strong>
            </span>
          </div>

          <div className="space-y-3">
            <div className="bg-slate-950/80 p-3.5 rounded-lg border border-slate-800">
              <span className="text-[10px] text-cyan-400 uppercase font-bold block mb-1">
                Ground Station Summary:
              </span>
              <p className="text-slate-200 leading-relaxed text-xs">
                {report.aiGroundStationSummary}
              </p>
            </div>
            <div className="bg-slate-950/80 p-3.5 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                Tactical Aerospace Assessment:
              </span>
              <div className="text-slate-300 whitespace-pre-line leading-relaxed text-[11px]">
                {report.aiSummaryEnglish}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
