import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { digitalTwinService } from './services/digitalTwinService';
import { DigitalTwinState, SimulationConfig, SensorStatus } from './types/engine';
import { Navbar } from './components/Navbar';
import { VitalMetricsGrid } from './components/VitalMetricsGrid';
import { DynamicEngineKinematics } from './components/DynamicEngineKinematics';
import { DigitalTwinSchematic } from './components/DigitalTwinSchematic';
import { LiveTelemetryCharts } from './components/LiveTelemetryCharts';
import { AiExplainabilityPanel } from './components/AiExplainabilityPanel';
import { VirtualSensorPanel } from './components/VirtualSensorPanel';
import { FaultAlertsAndRecommendations } from './components/FaultAlertsAndRecommendations';
import { MissionSimulationStudio } from './components/MissionSimulationStudio';
import { CsvDataStudio } from './components/CsvDataStudio';
import { WokwiBridgeStudio } from './components/WokwiBridgeStudio';
import { SettingsPanel } from './components/SettingsPanel';
import { MaintenanceReportModal } from './components/MaintenanceReportModal';
import { WarReadinessStudio } from './components/WarReadinessStudio';
import { AiFaultRemediationStudio } from './components/AiFaultRemediationStudio';
import { FaultDetailModal } from './components/FaultDetailModal';
import { ActiveFaultEmergencyBanner } from './components/ActiveFaultEmergencyBanner';
import { EngineFault } from './types/engine';
import { MISSION_PRESETS } from './data/constants';
import { FileCheck, Sparkles, Activity, ArrowRight, Flame, Wrench, Radio, Send, PlayCircle, PauseCircle } from 'lucide-react';

export default function App() {
  const [state, setState] = useState<DigitalTwinState>(digitalTwinService.getState());
  const [config, setConfig] = useState<SimulationConfig>(digitalTwinService.getConfig());
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [reportModalOpen, setReportModalOpen] = useState<boolean>(false);
  const [selectedFault, setSelectedFault] = useState<EngineFault | null>(null);
  const [faultModalOpen, setFaultModalOpen] = useState<boolean>(false);
  const [targetAiSolverPreset, setTargetAiSolverPreset] = useState<string | null>(null);

  // External stream stats and diagnostics
  const [externalStats, setExternalStats] = useState<{
    connected: boolean;
    packetCount: number;
    lastReceivedMsAgo: number | null;
  }>({ connected: false, packetCount: 0, lastReceivedMsAgo: null });
  const [simulatingExternalStream, setSimulatingExternalStream] = useState<boolean>(false);
  const [testPacketFeedback, setTestPacketFeedback] = useState<string | null>(null);

  const handleOpenFaultModal = (fault?: EngineFault) => {
    if (fault) {
      setSelectedFault(fault);
    } else if (state.faults.length > 0) {
      setSelectedFault(state.faults[0]);
    }
    setFaultModalOpen(true);
  };

  const handleNavigateToAiSolver = (fault?: EngineFault) => {
    setFaultModalOpen(false);
    if (fault) {
      setTargetAiSolverPreset(fault.id);
    } else {
      setTargetAiSolverPreset('live_telemetry');
    }
    setActiveTab('ai_remediation');
  };

  // Subscribe to Digital Twin Service updates
  useEffect(() => {
    const unsubscribe = digitalTwinService.subscribe((newState) => {
      setState(newState);
      setConfig(digitalTwinService.getConfig());
    });
    return () => unsubscribe();
  }, []);

  // Global Real-time Poller for External Sensor Data (/api/external-stream)
  // Ensures Tinkercad, Python, IoT, or cURL data updates the twin across all tabs
  useEffect(() => {
    let lastSeenCount = -1;
    let isSubscribed = true;

    const checkExternalTelemetry = async () => {
      try {
        const res = await fetch('/api/external-stream');
        if (!res.ok || !isSubscribed) return;
        const data = await res.json();

        setExternalStats({
          connected: data.connected,
          packetCount: data.packetCount,
          lastReceivedMsAgo: data.lastReceivedMsAgo
        });

        // When a new packet arrives or packet count increments
        if (data.packetCount > 0 && data.packetCount !== lastSeenCount && data.latestData) {
          lastSeenCount = data.packetCount;
          digitalTwinService.ingestExternalTelemetry(data.latestData);
        }
      } catch {
        // quiet error fallback
      }
    };

    checkExternalTelemetry();
    const interval = setInterval(checkExternalTelemetry, 500);
    return () => {
      isSubscribed = false;
      clearInterval(interval);
    };
  }, []);

  // Quick test packet trigger
  const handleSendTestPacket = async () => {
    try {
      const testData = {
        rpm: Math.round(5050 + (Math.random() - 0.5) * 80),
        cht1_C: +(115.5 + Math.random() * 2).toFixed(1),
        oil_pressure_bar: +(4.2 + (Math.random() - 0.5) * 0.3).toFixed(2),
        throttle_pct: 72,
        vibration_g: +(0.88 + Math.random() * 0.05).toFixed(2)
      };

      const res = await fetch('/api/sensor-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testData)
      });

      if (res.ok) {
        digitalTwinService.ingestExternalTelemetry(testData);
        setTestPacketFeedback('✓ Test Packet Ingested! Gauges Updated.');
        setTimeout(() => setTestPacketFeedback(null), 3000);
      }
    } catch (e: any) {
      setTestPacketFeedback(`✕ Failed: ${e.message}`);
      setTimeout(() => setTestPacketFeedback(null), 3000);
    }
  };

  // Optional 1Hz built-in External Stream simulation loop
  useEffect(() => {
    if (!simulatingExternalStream) return;
    const interval = setInterval(() => {
      handleSendTestPacket();
    }, 1000);
    return () => clearInterval(interval);
  }, [simulatingExternalStream]);

  // Sync state to local server API buffer for external queries (/api/engine-status, /api/health, etc.)
  useEffect(() => {
    const timer = setTimeout(() => {
      fetch('/api/sync-state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telemetry: state.telemetry,
          health: state.health,
          rul: state.rul,
          risk: state.risk,
          faults: state.faults,
          recommendations: state.recommendations,
          sensors: state.sensors
        })
      }).catch(() => {});
    }, 1000);
    return () => clearTimeout(timer);
  }, [state.telemetry.timestamp_s]);

  // Handlers
  const handleStart = () => digitalTwinService.start();
  const handlePause = () => digitalTwinService.pause();
  const handleReset = () => digitalTwinService.reset();
  const handleSpeedChange = (s: number) => digitalTwinService.setSpeed(s);

  const handleQuickFault = (faultType: string) => {
    digitalTwinService.injectFault(faultType as any);
  };

  const handleQuickSensorFail = (sensorId: string) => {
    digitalTwinService.toggleSensorFailure(sensorId);
  };

  const handleQuickScenario = () => {
    const warPreset = MISSION_PRESETS.find(p => p.id === 'war_loiter');
    if (warPreset) {
      digitalTwinService.setEnvironment({
        altitude_ft: warPreset.environment.altitude_ft,
        ambient_temp_C: warPreset.environment.ambient_temp_C,
        throttle_pct: warPreset.environment.throttle_pct,
        mission_phase: 'WAR_SCENARIO'
      });
      setActiveTab('mission_sim');
    }
  };

  const handleApplyEnvironment = (env: any) => {
    digitalTwinService.setEnvironment(env);
  };

  const handleSelectPreset = (presetId: string) => {
    const p = MISSION_PRESETS.find(x => x.id === presetId);
    if (p) {
      digitalTwinService.setEnvironment({
        altitude_ft: p.environment.altitude_ft,
        ambient_temp_C: p.environment.ambient_temp_C,
        throttle_pct: p.environment.throttle_pct,
        mission_phase: p.environment.is_war_scenario ? 'WAR_SCENARIO' : 'CRUISE'
      });
    }
  };

  const handleToggleSensorFailure = (sensorId: string) => {
    digitalTwinService.toggleSensorFailure(sensorId);
  };

  const handleRestoreAllSensors = () => {
    digitalTwinService.restoreAllSensors();
  };

  const handleLoadDataset = (dataset: any[], name: string) => {
    digitalTwinService.loadReplayDataset(dataset, name);
    setActiveTab('dashboard');
  };

  const handleIngestExternal = (data: any) => {
    digitalTwinService.ingestExternalTelemetry(data);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Glass Navigation Bar */}
      <Navbar
        state={state}
        config={config}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onStart={handleStart}
        onPause={handlePause}
        onReset={handleReset}
        onSpeedChange={handleSpeedChange}
        onQuickFault={handleQuickFault}
        onQuickSensorFail={handleQuickSensorFail}
        onQuickScenario={handleQuickScenario}
        onOpenFaultModal={handleOpenFaultModal}
      />

      {/* Main Content Area */}
      {/* Main Content Area with Instagram-like Smooth Animatic Page Transitions */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 space-y-6 overflow-hidden">
        {/* EXTERNAL STREAM MODE ACTIVE BANNER */}
        {config.mode === 'WOKWI_LIVE' && (
          <div className="bg-slate-900/90 border-2 border-amber-500/60 rounded-xl p-3.5 shadow-xl space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className={`w-3.5 h-3.5 rounded-full ${externalStats.connected ? 'bg-emerald-400 animate-ping' : 'bg-amber-400 animate-pulse'}`} />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Radio className="w-4 h-4 text-amber-400" />
                      External Stream Active (Tinkercad / IoT / Python)
                    </span>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                      externalStats.connected 
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-700' 
                        : 'bg-amber-950 text-amber-300 border border-amber-700'
                    }`}>
                      {externalStats.connected ? 'LIVE TELEMETRY INGESTING' : 'WAITING FOR PACKETS'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 font-sans mt-0.5">
                    Synthetic physics paused. Ingestion listening at <code>/api/sensor-data</code>.
                  </p>
                </div>
              </div>

              {/* Status pills & action buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="text-[11px] font-mono text-slate-300 bg-slate-950 px-2.5 py-1.5 rounded border border-slate-800 flex items-center gap-2">
                  <span>Packets: <strong className="text-cyan-300">{externalStats.packetCount}</strong></span>
                  <span>•</span>
                  <span>Last: <strong className="text-cyan-300">
                    {externalStats.lastReceivedMsAgo !== null ? `${Math.round(externalStats.lastReceivedMsAgo / 1000)}s ago` : 'None yet'}
                  </strong></span>
                </div>

                <button
                  type="button"
                  id="btn-send-test-packet"
                  onClick={handleSendTestPacket}
                  className="px-2.5 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-mono font-bold flex items-center gap-1.5 transition shadow-sm"
                  title="Inject 1 realistic sensor packet into /api/sensor-data to test gauges"
                >
                  <Send className="w-3 h-3" />
                  <span>Send Test Packet</span>
                </button>

                <button
                  type="button"
                  id="btn-toggle-auto-stream"
                  onClick={() => setSimulatingExternalStream(p => !p)}
                  className={`px-2.5 py-1.5 rounded text-xs font-mono font-bold flex items-center gap-1.5 transition ${
                    simulatingExternalStream 
                      ? 'bg-amber-600 text-white border border-amber-500' 
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                  }`}
                  title="Simulate continuous 1Hz live packets right inside your browser"
                >
                  {simulatingExternalStream ? <PauseCircle className="w-3 h-3" /> : <PlayCircle className="w-3 h-3" />}
                  <span>{simulatingExternalStream ? 'Stop 1Hz Pulse' : 'Simulate 1Hz Pulse'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('wokwi_bridge')}
                  className="px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-mono transition border border-slate-700 flex items-center gap-1"
                >
                  <span>Tinkercad Bridge / Code</span>
                </button>

                <button
                  type="button"
                  onClick={() => digitalTwinService.setMode('SIMULATION')}
                  className="px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono transition border border-slate-700"
                  title="Switch back to Local Physics Engine"
                >
                  Back to Local Physics
                </button>
              </div>
            </div>

            {testPacketFeedback && (
              <div className={`text-[11px] font-mono px-3 py-1 rounded ${
                testPacketFeedback.startsWith('✓') ? 'bg-emerald-950 text-emerald-300 border border-emerald-700' : 'bg-rose-950 text-rose-300 border border-rose-700'
              }`}>
                {testPacketFeedback}
              </div>
            )}
          </div>
        )}

        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 16, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.99 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-5"
            >
              {/* Prominent Active Fault Emergency Banner (Always Visible when fault detected) */}
              <ActiveFaultEmergencyBanner
                faults={state.faults}
                state={state}
                onSelectFault={(f) => {
                  setSelectedFault(f);
                  setFaultModalOpen(true);
                }}
                onNavigateTab={(tab) => {
                  if (tab === 'ai_remediation') {
                    handleNavigateToAiSolver();
                  } else {
                    setActiveTab(tab);
                  }
                }}
              />

              {/* Quick Action Sub-Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 rounded-xl px-4 py-2.5">
                <div className="flex items-center gap-2 text-xs font-mono">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-slate-300">
                    Telemetry Stream: <strong className="text-cyan-300">
                      {state.activeDatasetName ? `Replaying "${state.activeDatasetName}"` : 'Real-Time Physics Simulation (20 Hz)'}
                    </strong>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    id="btn-goto-ai-solver"
                    onClick={() => handleNavigateToAiSolver()}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/90 hover:bg-emerald-500 text-white font-mono text-xs font-bold transition shadow-sm"
                    title="Solve Engine Problems & Maximize Flight Time"
                  >
                    <Wrench className="w-3.5 h-3.5" />
                    AI Problem Solver (Max ToF)
                  </button>
                  <button
                    id="btn-goto-war-eval"
                    onClick={() => setActiveTab('war_readiness')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600/90 hover:bg-red-500 text-white font-mono text-xs font-bold transition shadow-sm"
                    title="Evaluate Mission & War Condition Flight Feasibility"
                  >
                    <Flame className="w-3.5 h-3.5" />
                    War Readiness Evaluator AI
                  </button>
                  <button
                    onClick={() => setReportModalOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-bold transition shadow-sm"
                  >
                    <FileCheck className="w-3.5 h-3.5" />
                    Generate Flight Health Report
                  </button>
                </div>
              </div>

              {/* AI Problem Solver & Max Time-of-Flight (ToF) Quick Alert Banner */}
              <div 
                onClick={() => setActiveTab('ai_remediation')}
                className="group cursor-pointer rounded-xl border border-emerald-500/40 bg-gradient-to-r from-emerald-950/60 via-slate-900 to-cyan-950/40 p-3.5 shadow-lg flex flex-wrap items-center justify-between gap-3 hover:border-emerald-500/70 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-950 border border-emerald-500/50 flex items-center justify-center text-emerald-400 shrink-0">
                    <Wrench className="w-4 h-4 animate-bounce" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold font-mono text-white">
                        AI AUTONOMOUS ENGINE PROBLEM SOLVER & MAX TIME-OF-FLIGHT OPTIMIZER
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-900/60 text-emerald-200 border border-emerald-700">
                        AUTONOMOUS ToF EXTENSION
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 font-sans mt-0.5">
                      Upon detecting an anomaly in the MALE UAV, the AI engine dynamically evaluates multiple mitigation strategies to identify the solution providing the <strong>maximum Flight Time (Endurance)</strong>.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs font-mono font-bold text-emerald-400 group-hover:text-emerald-300 transition">
                  <span>DIAGNOSE & EXTEND FLIGHT TIME</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              {/* War Readiness AI Feasibility Quick Alert Banner */}
              <div 
                onClick={() => setActiveTab('war_readiness')}
                className="group cursor-pointer rounded-xl border border-red-500/40 bg-gradient-to-r from-red-950/60 via-slate-900 to-amber-950/40 p-3.5 shadow-lg flex flex-wrap items-center justify-between gap-3 hover:border-red-500/70 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-red-950 border border-red-500/50 flex items-center justify-center text-red-400 shrink-0">
                    <Flame className="w-4 h-4 animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold font-mono text-white">
                        AI COMBAT MISSION FEASIBILITY EVALUATOR
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-red-900/60 text-red-200 border border-red-700">
                        NEW WAR MODULE
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 font-sans mt-0.5">
                      Utilizing historical flight logs and live telemetry, the AI evaluates combat scenarios to determine: <strong>Is it airworthy? What is the safe endurance? What is the risk profile?</strong>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs font-mono font-bold text-red-400 group-hover:text-red-300 transition">
                  <span>TEST WAR SCENARIOS</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              {/* Glass Cockpit Vital Metrics Array */}
              <VitalMetricsGrid state={state} />

              {/* AI Sensor Reconstruction Live Comparison Banner (if any sensor is failed/virtual) */}
              {(() => {
                const sensorList = Object.values(state.sensors) as SensorStatus[];
                const virtualSensors = sensorList.filter(s => s.isVirtual);
                if (virtualSensors.length === 0) return null;

                return (
                  <div className="rounded-xl border border-amber-500/60 bg-amber-950/30 p-3.5 shadow-lg flex flex-wrap items-center justify-between gap-3 font-mono">
                    <div className="flex items-center gap-2.5">
                      <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                      </span>
                      <div>
                        <div className="text-xs font-bold text-amber-300 flex items-center gap-2">
                          <span>AI SENSOR RECONSTRUCTION ACTIVE:</span>
                          <span className="text-slate-300">
                            {virtualSensors.map(s => s.name).join(', ')} Offline
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-300 flex flex-wrap items-center gap-2 mt-1">
                          {virtualSensors.map(s => (
                            <span key={s.id} className="bg-slate-900/90 px-2 py-0.5 rounded border border-amber-500/30 flex items-center gap-1.5">
                              <span className="text-slate-400">{s.name}:</span>
                              <span className="text-slate-300">Pre-Fail: <strong className="text-white">{s.beforeFailureValue} {s.unit}</strong></span>
                              <span className="text-amber-400 mx-0.5">➔</span>
                              <span className="text-amber-300">AI Expected: <strong className="text-amber-200">{s.aiExpectedValue} {s.unit}</strong></span>
                              <span className="text-cyan-400 text-[10px]">({(s.variance ?? 0) > 0 ? `+${s.variance}` : s.variance} {s.unit})</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setActiveTab('virtual_sensors')}
                        className="px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 text-xs font-bold transition flex items-center gap-1"
                      >
                        <span>Inspect AI Models</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                      <button
                        onClick={handleRestoreAllSensors}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs transition"
                      >
                        Restore Sensors
                      </button>
                    </div>
                  </div>
                );
              })()}

              {/* Dynamic 4-Cylinder Aero Engine Kinematics & Reciprocating Pistons */}
              <DynamicEngineKinematics state={state} />

              {/* Digital Twin 2D Thermodynamic Schematic */}
              <DigitalTwinSchematic 
                state={state} 
                onSensorClick={(sensorId) => {
                  setActiveTab('virtual_sensors');
                }}
                onFaultClick={(f) => handleOpenFaultModal(f)}
              />

              {/* Live Telemetry & Prognostic Trend Charts */}
              <LiveTelemetryCharts state={state} />

              {/* Active Faults & Aeronautical Recommendations */}
              <FaultAlertsAndRecommendations 
                state={state} 
                onOpenRemediation={() => setActiveTab('ai_remediation')}
                onSelectFault={(f) => {
                  setSelectedFault(f);
                  setFaultModalOpen(true);
                }}
                onNavigateTab={(tab) => setActiveTab(tab)}
              />

              {/* Explainable AI Diagnostics Preview */}
              <AiExplainabilityPanel state={state} />
            </motion.div>
          )}

          {/* TAB: AI AUTONOMOUS PROBLEM SOLVER & MAX ToF OPTIMIZER */}
          {activeTab === 'ai_remediation' && (
            <motion.div
              key="ai_remediation"
              initial={{ opacity: 0, y: 16, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.99 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-5"
            >
              <AiFaultRemediationStudio
                telemetry={state.telemetry}
                health={state.health}
                faults={state.faults}
                initialPresetId={targetAiSolverPreset || 'live_telemetry'}
              />
            </motion.div>
          )}

          {/* TAB: WAR & MISSION READINESS AI EVALUATOR */}
          {activeTab === 'war_readiness' && (
            <motion.div
              key="war_readiness"
              initial={{ opacity: 0, y: 16, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.99 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-5"
            >
              <WarReadinessStudio
                telemetry={state.telemetry}
                health={state.health}
              />
            </motion.div>
          )}

          {/* TAB 2: DEDICATED DIGITAL TWIN SCHEMATIC */}
          {activeTab === 'schematic' && (
            <motion.div
              key="schematic"
              initial={{ opacity: 0, y: 16, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.99 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-5"
            >
              <DynamicEngineKinematics state={state} />
              <DigitalTwinSchematic 
                state={state} 
                onSensorClick={() => setActiveTab('virtual_sensors')}
                onFaultClick={(f) => handleOpenFaultModal(f)}
              />
              <VitalMetricsGrid state={state} />
              <AiExplainabilityPanel state={state} />
            </motion.div>
          )}

          {/* TAB 3: EXPLAINABLE AI PROGNOSTICS & RUL */}
          {activeTab === 'ai_prognostics' && (
            <motion.div
              key="ai_prognostics"
              initial={{ opacity: 0, y: 16, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.99 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-5"
            >
              <AiExplainabilityPanel state={state} />
              <LiveTelemetryCharts state={state} />
            </motion.div>
          )}

          {/* TAB 4: VIRTUAL SENSORS & SOFT-SENSING MATRIX */}
          {activeTab === 'virtual_sensors' && (
            <motion.div
              key="virtual_sensors"
              initial={{ opacity: 0, y: 16, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.99 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-5"
            >
              <VirtualSensorPanel
                state={state}
                onToggleFailure={handleToggleSensorFailure}
                onRestoreAll={handleRestoreAllSensors}
              />
            </motion.div>
          )}

          {/* TAB 5: MISSION & WAR SIMULATION STUDIO */}
          {activeTab === 'mission_sim' && (
            <motion.div
              key="mission_sim"
              initial={{ opacity: 0, y: 16, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.99 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-5"
            >
              <MissionSimulationStudio
                state={state}
                onApplyEnvironment={handleApplyEnvironment}
                onSelectPreset={handleSelectPreset}
              />
              <VitalMetricsGrid state={state} />
              <DigitalTwinSchematic 
                state={state} 
                onSensorClick={() => setActiveTab('virtual_sensors')}
                onFaultClick={(f) => handleOpenFaultModal(f)} 
              />
            </motion.div>
          )}

          {/* TAB 6: CSV TELEMETRY & DATASET REPLAY */}
          {activeTab === 'csv_studio' && (
            <motion.div
              key="csv_studio"
              initial={{ opacity: 0, y: 16, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.99 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-5"
            >
              <CsvDataStudio
                currentTelemetryHistory={state.telemetryHistory}
                activeDatasetName={state.activeDatasetName}
                onLoadDataset={handleLoadDataset}
              />
              <LiveTelemetryCharts state={state} />
            </motion.div>
          )}

          {/* TAB 7: WOKWI ESP32 BRIDGE & HARDWARE INGRESS */}
          {activeTab === 'wokwi_bridge' && (
            <motion.div
              key="wokwi_bridge"
              initial={{ opacity: 0, y: 16, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.99 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-5"
            >
              <WokwiBridgeStudio
                state={state}
                onIngestSensorData={handleIngestExternal}
              />
            </motion.div>
          )}

          {/* TAB 8: THRESHOLDS & SYSTEM SETTINGS */}
          {activeTab === 'settings' && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 16, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.99 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-5"
            >
              <SettingsPanel
                speedMultiplier={config.speedMultiplier}
                onSpeedChange={handleSpeedChange}
                onOpenReportModal={() => setReportModalOpen(true)}
                mode={config.mode}
                onModeChange={(newMode) => {
                  digitalTwinService.setMode(newMode);
                }}
                onIngestExternal={handleIngestExternal}
                currentTelemetry={state.telemetry}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Flight Inspection & Maintenance Report Modal */}
      <MaintenanceReportModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        state={state}
      />

      {/* Comprehensive Fault Detail & AI SOP Modal */}
      <FaultDetailModal
        fault={selectedFault}
        isOpen={faultModalOpen}
        onClose={() => {
          setFaultModalOpen(false);
          setSelectedFault(null);
        }}
        onNavigateToAiSolver={(f) => {
          setFaultModalOpen(false);
          setActiveTab('ai_remediation');
        }}
        onNavigateToTab={(tab) => {
          setFaultModalOpen(false);
          setActiveTab(tab);
        }}
        state={state}
      />

      {/* Bottom Aeronautical Status Footer */}
      <footer className="bg-slate-950 border-t border-slate-900 py-3 text-center text-xs font-mono text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            <span>MALE UAV Aero Piston Engine Digital Twin Platform</span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400">Smart India Hackathon (SIH) 2026</span>
          </div>

          <div className="flex items-center gap-3 text-[11px]">
            <span>Status: <strong className={config.isRunning ? 'text-emerald-400' : 'text-amber-400'}>{config.isRunning ? 'SIMULATION ACTIVE' : 'PAUSED'}</strong></span>
            <span>Speed: <strong className="text-cyan-300">{config.speedMultiplier}x</strong></span>
            <span>Epoch: <strong className="text-white">{state.telemetry.timestamp_s}s</strong></span>
          </div>
        </div>
      </footer>
    </div>
  );
}
