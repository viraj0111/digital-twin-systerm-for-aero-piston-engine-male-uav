import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  Flame, 
  Crosshair, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Thermometer, 
  Activity, 
  Zap, 
  Wind, 
  Compass, 
  Layers, 
  Sliders, 
  RefreshCw, 
  FileText, 
  Radio, 
  AlertOctagon,
  ChevronRight,
  ShieldCheck,
  Cpu
} from 'lucide-react';
import { 
  SAMPLE_HISTORICAL_LOGS, 
  WAR_SCENARIOS, 
  evaluateWarReadinessPhysics, 
  requestServerWarAssessment 
} from '../services/warReadinessService';
import { 
  HistoricalFlightLog, 
  WarScenarioCondition, 
  WarAssessmentResult 
} from '../types/warReadiness';
import { EngineTelemetry, EngineHealthMetrics } from '../types/engine';

interface WarReadinessStudioProps {
  telemetry: EngineTelemetry;
  health: EngineHealthMetrics;
}

export const WarReadinessStudio: React.FC<WarReadinessStudioProps> = ({ telemetry, health }) => {
  const [selectedLogId, setSelectedLogId] = useState<string>(SAMPLE_HISTORICAL_LOGS[0].id);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>(WAR_SCENARIOS[0].id);
  const [isCustomScenario, setIsCustomScenario] = useState<boolean>(false);
  const [isLoadingAi, setIsLoadingAi] = useState<boolean>(false);

  // Custom scenario sliders state
  const [customScenario, setCustomScenario] = useState<WarScenarioCondition>({
    id: 'war-custom',
    name: 'Custom War Theatre Sandbox',
    theatre: 'CUSTOM',
    badge: 'OPERATOR DEFINED',
    description: 'User-configured combat parameters: adjust altitude, temperature, combat throttle and mission requirements.',
    altitude_ft: 14000,
    ambient_temp_C: 38,
    combat_throttle_pct: 88,
    mission_duration_hours: 6.0,
    threat_level: 'HIGH',
    dust_sand_index: 60,
    g_force_envelope: 3.0,
    ew_jamming_active: true,
    notes: 'Real-time custom sandbox'
  });

  const selectedLog = SAMPLE_HISTORICAL_LOGS.find(l => l.id === selectedLogId) || SAMPLE_HISTORICAL_LOGS[0];
  const activeScenario = isCustomScenario 
    ? customScenario 
    : (WAR_SCENARIOS.find(s => s.id === selectedScenarioId) || WAR_SCENARIOS[0]);

  // Assessment results
  const [assessment, setAssessment] = useState<WarAssessmentResult>(() => 
    evaluateWarReadinessPhysics(selectedLog, telemetry, health, activeScenario)
  );

  // Recalculate on input changes
  useEffect(() => {
    const physicsResult = evaluateWarReadinessPhysics(selectedLog, telemetry, health, activeScenario);
    setAssessment(physicsResult);
  }, [selectedLogId, selectedScenarioId, isCustomScenario, customScenario, telemetry, health]);

  // Request advanced Gemini assessment via server endpoint
  const handleRunAiEvaluation = async () => {
    setIsLoadingAi(true);
    try {
      const serverResult = await requestServerWarAssessment(selectedLog, telemetry, health, activeScenario);
      setAssessment(serverResult);
    } catch (err) {
      console.error('Failed to run AI evaluation:', err);
    } finally {
      setIsLoadingAi(false);
    }
  };

  const getVerdictStyles = (verdict: string) => {
    switch (verdict) {
      case 'GO':
        return {
          bg: 'bg-emerald-950/70',
          border: 'border-emerald-500/60',
          text: 'text-emerald-400',
          badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
          icon: CheckCircle2,
          glow: 'shadow-emerald-950/50'
        };
      case 'CONDITIONAL_GO':
        return {
          bg: 'bg-amber-950/70',
          border: 'border-amber-500/60',
          text: 'text-amber-400',
          badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          icon: AlertTriangle,
          glow: 'shadow-amber-950/50'
        };
      case 'NO_GO':
      default:
        return {
          bg: 'bg-red-950/70',
          border: 'border-red-500/60',
          text: 'text-red-400',
          badge: 'bg-red-500/20 text-red-300 border-red-500/40',
          icon: XCircle,
          glow: 'shadow-red-950/50'
        };
    }
  };

  const verdictStyle = getVerdictStyles(assessment.verdict);
  const VerdictIcon = verdictStyle.icon;

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-red-950 border border-red-500/40 flex items-center justify-center text-red-400 shadow-lg">
            <Flame className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold font-mono text-white">
                WAR READINESS & COMBAT SORTIE EVALUATOR
              </h2>
              <span className="text-[10px] font-sans px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-800">
                AERO DEFENSE AI
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              Historical Flight Wear Logs + Live Telemetry ➔ Multi-theatre War Stress Evaluation
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-run-gemini-eval"
            onClick={handleRunAiEvaluation}
            disabled={isLoadingAi}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-mono font-bold text-xs shadow-lg transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingAi ? 'animate-spin' : ''}`} />
            {isLoadingAi ? 'ANALYZING WAR STRESS...' : 'RUN GEMINI DEEP ANALYSIS'}
          </button>
        </div>
      </div>

      {/* Primary Flight Feasibility Banner */}
      <div className={`rounded-xl border p-5 shadow-2xl transition-all ${verdictStyle.bg} ${verdictStyle.border} ${verdictStyle.glow}`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div className="flex items-start gap-3">
            <VerdictIcon className={`w-8 h-8 ${verdictStyle.text} shrink-0 mt-1`} />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                  Mission Flight Feasibility Verdict
                </span>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase font-bold ${verdictStyle.badge}`}>
                  {assessment.verdict}
                </span>
              </div>
              <h1 className={`text-xl md:text-2xl font-black font-mono tracking-tight mt-0.5 ${verdictStyle.text}`}>
                {assessment.verdictTitle}
              </h1>
              <p className="text-xs text-slate-300 font-mono mt-1">
                {assessment.verdictSubtitle}
              </p>
            </div>
          </div>

          {/* Quick Stats Pill */}
          <div className="flex items-center gap-3 bg-black/40 border border-white/10 p-3 rounded-lg font-mono text-xs">
            <div>
              <div className="text-[10px] text-slate-400 uppercase">Combat Endurance</div>
              <div className="text-base font-bold text-cyan-300">
                {assessment.safeCombatEnduranceHours} <span className="text-[10px] text-slate-400">HRS</span>
              </div>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div>
              <div className="text-[10px] text-slate-400 uppercase">Combat Risk</div>
              <div className={`text-base font-bold ${
                assessment.overallRiskScore >= 70 ? 'text-red-400' :
                assessment.overallRiskScore >= 45 ? 'text-amber-400' : 'text-emerald-400'
              }`}>
                {assessment.overallRiskScore}%
              </div>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div>
              <div className="text-[10px] text-slate-400 uppercase">IFSD Risk</div>
              <div className="text-base font-bold text-red-400">
                {assessment.ifsdProbabilityPct}%
              </div>
            </div>
          </div>
        </div>

        {/* Tactical Summary Box */}
        <div className="mt-3.5 bg-black/30 border border-white/10 rounded-lg p-3">
          <div className="text-[11px] font-mono font-bold text-amber-300 flex items-center gap-1.5 mb-1">
            <Radio className="w-3.5 h-3.5 animate-pulse" /> COMMANDER TACTICAL DIRECTIVE:
          </div>
          <p className="text-xs text-slate-200 font-sans leading-relaxed">
            {assessment.tacticalVerdictSummary}
          </p>
        </div>
      </div>

      {/* 3 Core Questions Answers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Operational Endurance */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
              <span className="flex items-center gap-1 text-cyan-400 font-bold">
                <Clock className="w-3.5 h-3.5" /> 1. OPERATIONAL ENDURANCE
              </span>
              <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded">Combat Window</span>
            </div>

            <div className="mt-2">
              <div className="text-3xl font-black font-mono text-white flex items-baseline gap-1.5">
                {assessment.safeCombatEnduranceHours}
                <span className="text-sm font-normal text-slate-400">HOURS</span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-1">
                Safe war flight limit before critical thermal/lubrication runaway.
              </p>
            </div>

            {/* Endurance vs Required bar */}
            <div className="mt-4 space-y-1.5 font-mono text-[11px]">
              <div className="flex justify-between text-slate-400">
                <span>Safe Endurance:</span>
                <span className="text-cyan-300 font-bold">{assessment.safeCombatEnduranceHours}h</span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full ${
                    assessment.enduranceMarginHours < 0 ? 'bg-red-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(100, (assessment.safeCombatEnduranceHours / assessment.requiredMissionHours) * 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-slate-500 text-[10px]">
                <span>Required Sortie: {assessment.requiredMissionHours}h</span>
                <span className={assessment.enduranceMarginHours >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                  {assessment.enduranceMarginHours >= 0 ? `+${assessment.enduranceMarginHours}h surplus` : `${assessment.enduranceMarginHours}h DEFICIT`}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-800/80 text-[11px] font-mono text-slate-400">
            Max Combat Envelope: <strong className="text-slate-200">{assessment.maxCombatEnvelopeHours} hrs</strong> (with degraded margins)
          </div>
        </div>

        {/* Card 2: Mission Risk Assessment */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
              <span className="flex items-center gap-1 text-red-400 font-bold">
                <AlertOctagon className="w-3.5 h-3.5" /> 2. MISSION RISK ASSESSMENT
              </span>
              <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                assessment.riskLevel === 'CRITICAL' ? 'bg-red-950 text-red-300 border border-red-800' :
                assessment.riskLevel === 'HIGH' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                'bg-emerald-950 text-emerald-300 border border-emerald-800'
              }`}>
                {assessment.riskLevel} RISK
              </span>
            </div>

            <div className="mt-2">
              <div className="text-3xl font-black font-mono text-white flex items-baseline gap-1.5">
                {assessment.overallRiskScore}%
                <span className="text-sm font-normal text-slate-400">MISSION RISK</span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-1">
                Probability of mission failure or forced abort under this theatre stress.
              </p>
            </div>

            {/* Key Risk Drivers */}
            <div className="mt-3 space-y-1.5 font-mono text-xs">
              <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                <span className="text-slate-400">In-Flight Shutdown (IFSD):</span>
                <span className="text-red-400 font-bold">{assessment.ifsdProbabilityPct}%</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Thermal Seizure Buffer:</span>
                <span className={assessment.thermalMargin_C < 10 ? 'text-red-400 font-bold' : 'text-emerald-400 font-bold'}>
                  +{assessment.thermalMargin_C}°C
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-400">Wear Acceleration:</span>
                <span className="text-amber-300 font-bold">{assessment.wearAccelerationFactor}x Normal</span>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-800/80 text-[11px] font-mono text-slate-400">
            Oil Safety Buffer: <strong className={assessment.oilThermalMargin_C < 5 ? 'text-red-300' : 'text-slate-200'}>
              +{assessment.oilThermalMargin_C}°C before breakdown
            </strong>
          </div>
        </div>

        {/* Card 3: Primary Limiting Component */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
              <span className="flex items-center gap-1 text-amber-400 font-bold">
                <Cpu className="w-3.5 h-3.5" /> 3. PRIMARY LIMITING COMPONENT
              </span>
              <span className="text-[10px] bg-amber-950 text-amber-300 border border-amber-800/60 px-2 py-0.5 rounded">
                Critical Failure Mode
              </span>
            </div>

            <div className="mt-2">
              <div className="text-sm font-bold font-mono text-white text-cyan-300">
                {assessment.limitingComponent.component}
              </div>
              <div className="text-[11px] font-mono text-amber-400 mt-0.5">
                Subsystem: {assessment.limitingComponent.subsystem}
              </div>
              <p className="text-[11px] text-slate-300 font-sans mt-2 leading-relaxed bg-slate-950/60 p-2.5 rounded border border-slate-800">
                {assessment.limitingComponent.failureMechanism}
              </p>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-800/80 text-[10px] font-mono text-slate-400">
            <span className="text-amber-400 font-bold">Early Warning Sign:</span> {assessment.limitingComponent.warningSigns}
          </div>
        </div>
      </div>

      {/* Main Configuration & Stress Analysis Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Historical Flight Data & War Theatre Selector (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Step 1: Historical Flight Data Selection (Purani Flight ke Logs) */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
              <span className="text-xs font-bold font-mono text-white flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-cyan-400" /> 1. HISTORICAL FLIGHT LOGS (PURANI FLIGHTS)
              </span>
              <span className="text-[10px] font-mono text-slate-400">Baseline Wear</span>
            </div>

            <div className="space-y-2">
              {SAMPLE_HISTORICAL_LOGS.map(log => {
                const isSelected = selectedLogId === log.id;
                return (
                  <div
                    key={log.id}
                    onClick={() => setSelectedLogId(log.id)}
                    className={`p-2.5 rounded-lg border cursor-pointer transition flex items-center justify-between ${
                      isSelected
                        ? 'bg-cyan-950/50 border-cyan-500/50 text-white'
                        : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold font-mono flex items-center gap-1.5">
                        <span>{log.code}</span>
                        <span className="text-[10px] text-cyan-400 font-normal">({log.theatre})</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Airframe: {log.cumulativeAirframeHours}h | CHT Peak: {log.peakCht_C}°C | Oil Wear: {log.oilDegradationIndex}%
                      </div>
                    </div>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />}
                  </div>
                );
              })}
            </div>

            {/* Selected Historical Summary */}
            <div className="mt-3 p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-400 space-y-1">
              <div><strong>Selected:</strong> {selectedLog.name}</div>
              <div><strong>Maintenance Observation:</strong> {selectedLog.maintenanceObservations}</div>
              <div><strong>Cylinder 3 Variance:</strong> +{selectedLog.cylinderVariance.cyl3}°C hotter historically</div>
            </div>
          </div>

          {/* Step 2: Current MALE UAV Live Condition (Current Halat) */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
              <span className="text-xs font-bold font-mono text-white flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-emerald-400" /> 2. CURRENT UAV LIVE CONDITION (CURRENT HALAT)
              </span>
              <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live Twin
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="bg-slate-950 p-2 rounded border border-slate-800">
                <div className="text-[10px] text-slate-400">ENGINE HEALTH SCORE</div>
                <div className="text-base font-bold text-emerald-400">{health.health_score_pct.toFixed(1)}%</div>
              </div>
              <div className="bg-slate-950 p-2 rounded border border-slate-800">
                <div className="text-[10px] text-slate-400">ACTIVE FAULTS COUNT</div>
                <div className={`text-base font-bold ${telemetry.active_faults.length > 0 ? 'text-red-400' : 'text-slate-200'}`}>
                  {telemetry.active_faults.length} Active
                </div>
              </div>
              <div className="bg-slate-950 p-2 rounded border border-slate-800">
                <div className="text-[10px] text-slate-400">PEAK CHT (CYL 3)</div>
                <div className="text-sm font-bold text-cyan-300">{(telemetry.cht3_C || 116).toFixed(1)}°C</div>
              </div>
              <div className="bg-slate-950 p-2 rounded border border-slate-800">
                <div className="text-[10px] text-slate-400">OIL PRESSURE / TEMP</div>
                <div className="text-sm font-bold text-cyan-300">
                  {(telemetry.oil_pressure_bar || 4.2).toFixed(1)} bar / {(telemetry.oil_temp_C || 98).toFixed(1)}°C
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: War Scenarios & Projected Performance (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Step 3: War Scenarios Selector */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
              <span className="text-xs font-bold font-mono text-white flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-red-400" /> 3. APPLY WAR CONDITIONS (YUDDH PARISITHITIYAN)
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsCustomScenario(false)}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono transition ${
                    !isCustomScenario ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  PRESET THEATRES
                </button>
                <button
                  onClick={() => setIsCustomScenario(true)}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono transition ${
                    isCustomScenario ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  CUSTOM SANDBOX
                </button>
              </div>
            </div>

            {!isCustomScenario ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {WAR_SCENARIOS.map(scen => {
                  const isSelected = selectedScenarioId === scen.id;
                  return (
                    <div
                      key={scen.id}
                      onClick={() => setSelectedScenarioId(scen.id)}
                      className={`p-3 rounded-lg border cursor-pointer transition flex flex-col justify-between ${
                        isSelected
                          ? 'bg-red-950/40 border-red-500/60 shadow-md'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-800 text-amber-300">
                            {scen.badge}
                          </span>
                          <span className={`text-[9px] font-mono font-bold ${
                            scen.threat_level === 'CRITICAL' ? 'text-red-400' : 'text-amber-400'
                          }`}>
                            {scen.threat_level} THREAT
                          </span>
                        </div>
                        <h4 className="text-xs font-bold font-mono text-white mt-1">
                          {scen.name}
                        </h4>
                        <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">
                          {scen.description}
                        </p>
                      </div>

                      <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-400">
                        <span>{scen.altitude_ft} ft | {scen.ambient_temp_C}°C</span>
                        <span className="text-cyan-300 font-bold">{scen.combat_throttle_pct}% Throttle</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Custom Scenario Tuning Sliders */
              <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between text-slate-300">
                  <span>Custom War Scenario Parameters:</span>
                  <span className="text-[10px] text-amber-400">Live Dynamic Recalculation</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                      <span>Combat Throttle:</span>
                      <span className="text-cyan-300 font-bold">{customScenario.combat_throttle_pct}%</span>
                    </div>
                    <input
                      type="range"
                      min={50}
                      max={100}
                      value={customScenario.combat_throttle_pct}
                      onChange={e => setCustomScenario({ ...customScenario, combat_throttle_pct: +e.target.value })}
                      className="w-full accent-cyan-500"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                      <span>Ambient Temperature:</span>
                      <span className="text-cyan-300 font-bold">{customScenario.ambient_temp_C}°C</span>
                    </div>
                    <input
                      type="range"
                      min={-35}
                      max={55}
                      value={customScenario.ambient_temp_C}
                      onChange={e => setCustomScenario({ ...customScenario, ambient_temp_C: +e.target.value })}
                      className="w-full accent-cyan-500"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                      <span>Flight Altitude:</span>
                      <span className="text-cyan-300 font-bold">{customScenario.altitude_ft} ft</span>
                    </div>
                    <input
                      type="range"
                      min={500}
                      max={26000}
                      step={500}
                      value={customScenario.altitude_ft}
                      onChange={e => setCustomScenario({ ...customScenario, altitude_ft: +e.target.value })}
                      className="w-full accent-cyan-500"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                      <span>Mission Duration Requirement:</span>
                      <span className="text-cyan-300 font-bold">{customScenario.mission_duration_hours} hrs</span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={24}
                      step={0.5}
                      value={customScenario.mission_duration_hours}
                      onChange={e => setCustomScenario({ ...customScenario, mission_duration_hours: +e.target.value })}
                      className="w-full accent-cyan-500"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                      <span>Sand/Dust Ingestion Factor:</span>
                      <span className="text-cyan-300 font-bold">{customScenario.dust_sand_index}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={customScenario.dust_sand_index}
                      onChange={e => setCustomScenario({ ...customScenario, dust_sand_index: +e.target.value })}
                      className="w-full accent-cyan-500"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                      <span>Maneuver G-Force Envelope:</span>
                      <span className="text-cyan-300 font-bold">{customScenario.g_force_envelope}g</span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={4.5}
                      step={0.1}
                      value={customScenario.g_force_envelope}
                      onChange={e => setCustomScenario({ ...customScenario, g_force_envelope: +e.target.value })}
                      className="w-full accent-cyan-500"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Subsystems Stress Radar / Projected Telemetry Gauges */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
              <span className="text-xs font-bold font-mono text-white flex items-center gap-1.5">
                <Thermometer className="w-4 h-4 text-amber-400" /> PROJECTED THERMODYNAMIC & SUBSYSTEM STRESS
              </span>
              <span className="text-[10px] font-mono text-slate-400">War Environment Impact</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4 text-xs font-mono">
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                <div className="text-[10px] text-slate-400">PROJECTED CHT</div>
                <div className={`text-base font-bold ${
                  assessment.projectedValues.peakCht_C > 138 ? 'text-red-400' :
                  assessment.projectedValues.peakCht_C > 125 ? 'text-amber-400' : 'text-cyan-300'
                }`}>
                  {assessment.projectedValues.peakCht_C}°C
                </div>
                <div className="text-[9px] text-slate-500 mt-0.5">Limit: 145°C</div>
              </div>

              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                <div className="text-[10px] text-slate-400">PROJECTED OIL TEMP</div>
                <div className={`text-base font-bold ${
                  assessment.projectedValues.oilTemp_C > 110 ? 'text-red-400' :
                  assessment.projectedValues.oilTemp_C > 104 ? 'text-amber-400' : 'text-cyan-300'
                }`}>
                  {assessment.projectedValues.oilTemp_C}°C
                </div>
                <div className="text-[9px] text-slate-500 mt-0.5">Limit: 115°C</div>
              </div>

              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                <div className="text-[10px] text-slate-400">OIL PRESSURE</div>
                <div className={`text-base font-bold ${
                  assessment.projectedValues.oilPressure_bar < 2.5 ? 'text-red-400' : 'text-cyan-300'
                }`}>
                  {assessment.projectedValues.oilPressure_bar} bar
                </div>
                <div className="text-[9px] text-slate-500 mt-0.5">Min: 2.0 bar</div>
              </div>

              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                <div className="text-[10px] text-slate-400">VIBRATION G-LOAD</div>
                <div className={`text-base font-bold ${
                  assessment.projectedValues.vibration_g > 1.8 ? 'text-red-400' : 'text-cyan-300'
                }`}>
                  {assessment.projectedValues.vibration_g} g
                </div>
                <div className="text-[9px] text-slate-500 mt-0.5">Limit: 2.2g</div>
              </div>
            </div>

            {/* Stress Bars */}
            <div className="space-y-2 font-mono text-xs">
              <div>
                <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                  <span>Thermal Subsystem Stress:</span>
                  <span className="font-bold text-amber-300">{assessment.stressRadar.thermal}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${assessment.stressRadar.thermal > 75 ? 'bg-red-500' : 'bg-amber-500'}`}
                    style={{ width: `${assessment.stressRadar.thermal}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                  <span>Lubrication Hydrodynamic Film Stress:</span>
                  <span className="font-bold text-amber-300">{assessment.stressRadar.lubrication}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${assessment.stressRadar.lubrication > 75 ? 'bg-red-500' : 'bg-amber-500'}`}
                    style={{ width: `${assessment.stressRadar.lubrication}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                  <span>Mechanical / Reciprocating Piston Fatigue:</span>
                  <span className="font-bold text-amber-300">{assessment.stressRadar.mechanical}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${assessment.stressRadar.mechanical > 75 ? 'bg-red-500' : 'bg-amber-500'}`}
                    style={{ width: `${assessment.stressRadar.mechanical}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Flight Envelope Restrictions & Commander Directives */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Pilot Envelope Restrictions */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg">
          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-800 text-xs font-bold font-mono text-white">
            <ShieldAlert className="w-4 h-4 text-amber-400" /> PILOT FLIGHT ENVELOPE RESTRICTIONS
          </div>
          <ul className="space-y-2 text-xs font-mono text-slate-300">
            {assessment.flightEnvelopeRestrictions.map((restriction, idx) => (
              <li key={idx} className="flex items-start gap-2 bg-slate-950/60 p-2 rounded border border-slate-800">
                <span className="text-amber-400 font-bold shrink-0">#{idx + 1}</span>
                <span>{restriction}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Commander Tactical Directives */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg">
          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-800 text-xs font-bold font-mono text-white">
            <Compass className="w-4 h-4 text-cyan-400" /> TACTICAL COMMANDER DIRECTIVES & SOPs
          </div>
          <ul className="space-y-2 text-xs font-mono text-slate-300">
            {assessment.commanderDirectives.map((directive, idx) => (
              <li key={idx} className="flex items-start gap-2 bg-slate-950/60 p-2 rounded border border-slate-800">
                <span className="text-cyan-400 font-bold shrink-0">#{idx + 1}</span>
                <span>{directive}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* AI Deep Reasoning Technical Intelligence Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
          <span className="text-xs font-bold font-mono text-white flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-400" /> AI TACTICAL INTELLIGENCE BRIEFING & REASONING
            <span className="text-[10px] font-sans px-2 py-0.5 rounded bg-yellow-950 text-yellow-300 border border-yellow-800">
              {assessment.modelUsed}
            </span>
          </span>
          <span className="text-[10px] font-mono text-slate-400">
            Evaluated at: {new Date(assessment.evaluatedAt).toLocaleTimeString()}
          </span>
        </div>

        <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 text-xs font-mono text-slate-300 whitespace-pre-line leading-relaxed max-h-72 overflow-y-auto">
          {assessment.aiTacticalBriefing}
        </div>
      </div>
    </div>
  );
};
