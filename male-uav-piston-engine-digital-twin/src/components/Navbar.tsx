import React from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  AlertTriangle, 
  Flame, 
  Zap, 
  Activity, 
  Cpu, 
  ShieldAlert, 
  Gauge, 
  Settings as SettingsIcon, 
  Upload, 
  Radio, 
  Crosshair, 
  Sliders,
  Download,
  Wrench
} from 'lucide-react';
import { DigitalTwinState, SimulationConfig, EngineFault } from '../types/engine';

interface NavbarProps {
  state: DigitalTwinState;
  config: SimulationConfig;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  onSpeedChange: (speed: number) => void;
  onQuickFault: (fault: string) => void;
  onQuickSensorFail: (sensor: string) => void;
  onQuickScenario: () => void;
  onOpenFaultModal?: (fault?: EngineFault) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  state,
  config,
  activeTab,
  setActiveTab,
  onStart,
  onPause,
  onReset,
  onSpeedChange,
  onQuickFault,
  onQuickSensorFail,
  onQuickScenario,
  onOpenFaultModal,
}) => {
  const { health, rul, risk, faults, telemetry } = state;

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'CRITICAL': return 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse';
      case 'HIGH': return 'bg-amber-500/20 text-amber-400 border-amber-500/40';
      case 'MEDIUM': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40';
      default: return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
    }
  };

  const getHealthColor = (score: number) => {
    if (score < 70) return 'text-red-400';
    if (score < 85) return 'text-amber-400';
    if (score < 95) return 'text-yellow-300';
    return 'text-emerald-400';
  };

  return (
    <header className="bg-slate-900/95 border-b border-slate-800 sticky top-0 z-40 backdrop-blur">
      {/* Top Bar: Title & Vital Telemetry HUD */}
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Project Branding */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-inner">
            <Cpu className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold tracking-tight text-white font-mono flex items-center gap-2">
                AERO-TWIN <span className="text-cyan-400 font-sans font-semibold text-xs px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/30">MALE UAV PISTON TWIN</span>
              </h1>
              <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                SIH 2026
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              AI Health Monitoring, Fault Prognosis & Digital Twin System
            </p>
          </div>
        </div>

        {/* Vital Status Indicators */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Health Index */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-lg px-3 py-1.5 flex items-center gap-2.5">
            <Activity className="w-4 h-4 text-slate-400" />
            <div>
              <div className="text-[10px] uppercase tracking-wider text-slate-400 font-mono">Engine Health</div>
              <div className={`text-sm font-bold font-mono ${getHealthColor(health.health_score_pct)}`}>
                {health.health_score_pct.toFixed(1)}%
              </div>
            </div>
          </div>

          {/* RUL Hours */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-lg px-3 py-1.5 flex items-center gap-2.5">
            <Gauge className="w-4 h-4 text-cyan-400" />
            <div>
              <div className="text-[10px] uppercase tracking-wider text-slate-400 font-mono">Estimated RUL</div>
              <div className="text-sm font-bold font-mono text-cyan-300">
                {rul.estimated_hours.toFixed(0)} <span className="text-[10px] text-slate-400">HRS</span>
              </div>
            </div>
          </div>

          {/* Risk Level Badge */}
          <div className={`border rounded-lg px-3 py-1.5 flex items-center gap-2 ${getRiskColor(risk.level)}`}>
            <ShieldAlert className="w-4 h-4" />
            <div>
              <div className="text-[10px] uppercase tracking-wider opacity-80 font-mono">Flight Risk</div>
              <div className="text-xs font-bold font-mono tracking-wide">{risk.level}</div>
            </div>
          </div>

          {/* Active Faults Interactive Indicator */}
          <button
            id="navbar-fault-indicator"
            onClick={() => {
              if (faults.length > 0 && onOpenFaultModal) {
                onOpenFaultModal(faults[0]);
              } else {
                setActiveTab('dashboard');
              }
            }}
            className={`rounded-lg px-3 py-1.5 flex items-center gap-2 transition text-left cursor-pointer ${
              faults.length > 0
                ? 'bg-red-950/80 border border-red-500/70 hover:bg-red-900/80 shadow-md shadow-red-950/50'
                : 'bg-slate-950/80 border border-slate-800 hover:border-slate-700'
            }`}
            title={faults.length > 0 ? `Active Fault: ${faults[0].name} (Click to inspect & solve)` : 'Propulsion systems nominal'}
          >
            <AlertTriangle className={`w-4 h-4 ${faults.length > 0 ? 'text-red-400 animate-bounce' : 'text-slate-500'}`} />
            <div>
              <div className="text-[10px] uppercase tracking-wider text-slate-400 font-mono flex items-center gap-1">
                <span>Faults</span>
                {faults.length > 0 && (
                  <span className="text-[9px] bg-red-600 text-white px-1 rounded font-bold">CLICK</span>
                )}
              </div>
              <div className={`text-xs font-bold font-mono ${faults.length > 0 ? 'text-red-300' : 'text-slate-200'}`}>
                {faults.length > 0 ? `${faults.length} ACTIVE` : 'NOMINAL'}
              </div>
            </div>
          </button>

          {/* Server Live Status */}
          <div 
            id="server-online-indicator"
            className="bg-slate-950/80 border border-emerald-500/40 rounded-lg px-2.5 py-1.5 flex items-center gap-2 font-mono"
            title="MALE UAV Backend Server: Online & Listening on Port 3000"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <div>
              <div className="text-[9px] uppercase tracking-wider text-slate-400">Server</div>
              <div className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                ONLINE <span className="text-[9px] text-slate-500 font-normal">:3000</span>
              </div>
            </div>
          </div>

          {/* Current Mission Phase */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-lg px-3 py-1.5 hidden md:flex items-center gap-2 font-mono">
            <Crosshair className="w-4 h-4 text-cyan-400" />
            <div>
              <div className="text-[10px] uppercase tracking-wider text-slate-400">Phase</div>
              <div className="text-xs font-bold text-cyan-300">{telemetry.mission_phase}</div>
            </div>
          </div>

          {/* Engine Mode Indicator (Click to open Settings Remote Sim) */}
          <button
            id="navbar-mode-indicator"
            onClick={() => setActiveTab('settings')}
            className={`border rounded-lg px-2.5 py-1.5 hidden md:flex items-center gap-2 font-mono transition text-left cursor-pointer ${
              config.mode === 'WOKWI_LIVE'
                ? 'bg-amber-950/70 border-amber-500/50 hover:bg-amber-900/60'
                : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
            }`}
            title="Current Digital Twin Engine Mode (Click to configure in Settings)"
          >
            <Radio className={`w-3.5 h-3.5 ${config.mode === 'WOKWI_LIVE' ? 'text-amber-400 animate-pulse' : 'text-cyan-400'}`} />
            <div>
              <div className="text-[9px] uppercase tracking-wider text-slate-400">Mode</div>
              <div className={`text-[11px] font-bold ${config.mode === 'WOKWI_LIVE' ? 'text-amber-300' : 'text-cyan-300'}`}>
                {config.mode === 'WOKWI_LIVE' ? 'EXTERNAL STREAM' : 'LOCAL PHYSICS'}
              </div>
            </div>
          </button>
        </div>

        {/* Master Simulation Controls */}
        <div className="flex items-center gap-2 bg-slate-950/80 p-1.5 rounded-lg border border-slate-800">
          {!config.isRunning ? (
            <button
              id="btn-start-sim"
              onClick={onStart}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-3 py-1.5 rounded text-xs transition font-mono shadow-sm"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              START SIMULATION
            </button>
          ) : (
            <button
              id="btn-pause-sim"
              onClick={onPause}
              className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-500 text-white font-medium px-3 py-1.5 rounded text-xs transition font-mono shadow-sm"
            >
              <Pause className="w-3.5 h-3.5 fill-current" />
              PAUSE
            </button>
          )}

          <button
            id="btn-reset-sim"
            onClick={onReset}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1.5 rounded text-xs transition font-mono"
            title="Reset Simulation to Nominal"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            RESET
          </button>

          {/* Speed Multipliers */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded p-0.5">
            {[1, 2, 5, 10].map(s => (
              <button
                key={s}
                onClick={() => onSpeedChange(s)}
                className={`px-1.5 py-0.5 text-[10px] font-mono rounded ${
                  config.speedMultiplier === s 
                    ? 'bg-cyan-600 text-white font-bold' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>

          {/* Direct Download ZIP Button */}
          <a
            href="/api/download-project-zip"
            download="male-uav-digital-twin.zip"
            className="flex items-center gap-1 bg-cyan-600/90 hover:bg-cyan-500 text-white font-medium px-2.5 py-1.5 rounded text-xs transition font-mono shadow-sm"
            title="Download Complete Source Code ZIP"
          >
            <Download className="w-3.5 h-3.5" />
            <span>DOWNLOAD ZIP</span>
          </a>
        </div>
      </div>

      {/* Quick Action Injectors & Sub-Navigation */}
      <div className="bg-slate-950/60 border-t border-slate-800/80 px-4 py-1.5 flex flex-wrap items-center justify-between gap-2">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto py-0.5 text-xs">
          {[
            { id: 'dashboard', label: 'Twin Dashboard', icon: Gauge },
            { id: 'ai_remediation', label: 'AI Problem Solver (Max ToF)', icon: Wrench, isRemediation: true },
            { id: 'war_readiness', label: 'War & Mission Readiness AI', icon: Flame, isSpecial: true },
            { id: 'schematic', label: 'Engine Schematic', icon: Cpu },
            { id: 'ai_prognostics', label: 'AI Prognostics & RUL', icon: Activity },
            { id: 'virtual_sensors', label: 'Virtual Sensors', icon: Radio },
            { id: 'mission_sim', label: 'Mission Studio', icon: Crosshair },
            { id: 'csv_studio', label: 'CSV Telemetry Replay', icon: Upload },
            { id: 'wokwi_bridge', label: 'External Simulation / IoT Bridge', icon: Zap },
            { id: 'settings', label: 'Thresholds & Settings', icon: SettingsIcon },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded font-medium transition whitespace-nowrap ${
                  isActive
                    ? tab.isSpecial 
                      ? 'bg-red-600/30 text-red-300 border border-red-500/50 shadow-sm font-bold'
                      : (tab as any).isRemediation
                      ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/50 shadow-sm font-bold'
                      : 'bg-cyan-600/20 text-cyan-300 border border-cyan-500/40 shadow-sm font-bold'
                    : tab.isSpecial
                      ? 'text-red-400/90 hover:text-red-300 hover:bg-red-950/40 border border-red-900/30'
                      : (tab as any).isRemediation
                      ? 'text-emerald-400/90 hover:text-emerald-300 hover:bg-emerald-950/40 border border-emerald-900/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${tab.isSpecial ? 'text-red-400' : (tab as any).isRemediation ? 'text-emerald-400' : ''}`} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Quick Fault & Anomaly Injection Triggers */}
        <div className="flex items-center gap-1.5 text-xs font-mono">
          <span className="text-[10px] uppercase text-slate-500 font-semibold mr-1 flex items-center gap-1">
            <Sliders className="w-3 h-3" /> Quick Demo:
          </span>

          <button
            id="quick-overheat"
            onClick={() => onQuickFault('OVERHEATING')}
            className="px-2 py-0.5 rounded text-[11px] bg-red-950/60 text-red-300 border border-red-800/50 hover:bg-red-900/60 transition flex items-center gap-1"
            title="Inject Thermal Overheating Fault"
          >
            <Flame className="w-3 h-3 text-red-400" />
            + Overheat
          </button>

          <button
            id="quick-oil-press"
            onClick={() => onQuickFault('LOW_OIL_PRESSURE')}
            className="px-2 py-0.5 rounded text-[11px] bg-amber-950/60 text-amber-300 border border-amber-800/50 hover:bg-amber-900/60 transition flex items-center gap-1"
            title="Inject Oil Pressure Drop"
          >
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            - Oil Press
          </button>

          <button
            id="quick-misfire"
            onClick={() => onQuickFault('CYLINDER_MISFIRE')}
            className="px-2 py-0.5 rounded text-[11px] bg-purple-950/60 text-purple-300 border border-purple-800/50 hover:bg-purple-900/60 transition flex items-center gap-1"
            title="Inject Cylinder 3 Misfire"
          >
            <Activity className="w-3 h-3 text-purple-400" />
            Misfire
          </button>

          <button
            id="quick-fail-sensor"
            onClick={() => onQuickSensorFail('egt3')}
            className="px-2 py-0.5 rounded text-[11px] bg-cyan-950/60 text-cyan-300 border border-cyan-800/50 hover:bg-cyan-900/60 transition flex items-center gap-1"
            title="Disconnect EGT3 Sensor to trigger Virtual Sensor"
          >
            <Radio className="w-3 h-3 text-cyan-400" />
            Fail EGT3
          </button>

          <button
            id="quick-scenario-war"
            onClick={onQuickScenario}
            className="px-2 py-0.5 rounded text-[11px] bg-orange-950/60 text-orange-300 border border-orange-800/50 hover:bg-orange-900/60 transition flex items-center gap-1"
            title="Run High-Stress War Operating Scenario"
          >
            <Crosshair className="w-3 h-3 text-orange-400" />
            War Scenario
          </button>
        </div>
      </div>
    </header>
  );
};
