import React from 'react';
import { 
  Radio, 
  CheckCircle2, 
  AlertTriangle, 
  Zap, 
  Cpu, 
  RotateCcw, 
  Info,
  ArrowRight,
  Gauge,
  Flame,
  Droplet,
  Activity,
  Layers,
  Sparkles
} from 'lucide-react';
import { DigitalTwinState, SensorStatus } from '../types/engine';

interface VirtualSensorPanelProps {
  state: DigitalTwinState;
  onToggleFailure: (sensorId: string) => void;
  onRestoreAll: () => void;
}

export const VirtualSensorPanel: React.FC<VirtualSensorPanelProps> = ({
  state,
  onToggleFailure,
  onRestoreAll
}) => {
  const { sensors, telemetry } = state;
  const sensorList: SensorStatus[] = Object.values(sensors);
  const virtualSensors = sensorList.filter(s => s.isVirtual);

  const getSensorIcon = (id: string) => {
    if (id.startsWith('cht') || id.startsWith('egt')) return <Flame className="w-4 h-4 text-orange-400" />;
    if (id.startsWith('oil')) return <Droplet className="w-4 h-4 text-amber-400" />;
    if (id === 'rpm') return <Gauge className="w-4 h-4 text-cyan-400" />;
    if (id === 'vibration') return <Activity className="w-4 h-4 text-purple-400" />;
    if (id === 'fuel_flow') return <Droplet className="w-4 h-4 text-blue-400" />;
    return <Zap className="w-4 h-4 text-emerald-400" />;
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl space-y-5">
      {/* Header & Mission Readiness Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
            <Radio className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold font-mono text-white flex items-center gap-2">
              Sensor Health & AI Soft-Sensing Virtual Sensor Matrix
              <span className="text-[10px] font-sans px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                Fault-Tolerant Avionics
              </span>
            </h3>
            <p className="text-xs text-slate-400 font-mono">
              Hardware failure isolation & cross-channel physics-informed AI value reconstruction
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {virtualSensors.length > 0 && (
            <button
              id="btn-restore-all-sensors"
              onClick={onRestoreAll}
              className="flex items-center gap-1.5 px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono transition border border-slate-700"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Restore All Sensors
            </button>
          )}

          <div className="text-xs font-mono px-3 py-1 rounded bg-slate-950 border border-slate-800 flex items-center gap-2">
            <span className="text-slate-400">Active Sensors:</span>
            <span className="text-emerald-400 font-bold">{sensorList.length - virtualSensors.length} Real</span>
            <span className="text-slate-500">•</span>
            <span className="text-amber-400 font-bold">{virtualSensors.length} Virtual</span>
          </div>
        </div>
      </div>

      {/* Hero: Active AI Reconstruction / Comparison Section */}
      {virtualSensors.length > 0 ? (
        <div className="rounded-xl border border-amber-500/60 bg-amber-950/20 p-4 shadow-xl ring-1 ring-amber-500/30 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-amber-500/30">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
              </span>
              <h4 className="text-xs font-bold font-mono text-amber-300 tracking-wide uppercase flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-amber-400" />
                Active AI Sensor Reconstruction: Before Failure vs. AI Expected Value
              </h4>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-200 border border-amber-500/40">
              {virtualSensors.length} Sensor{virtualSensors.length > 1 ? 's' : ''} Offline • Replaced by Soft-Sensing
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {virtualSensors.map(sensor => {
              const beforeVal = sensor.beforeFailureValue ?? sensor.currentValue;
              const expectedVal = sensor.aiExpectedValue ?? sensor.currentValue;
              const variance = sensor.variance ?? Math.round((expectedVal - beforeVal) * 10) / 10;
              const variancePct = sensor.variancePct ?? (beforeVal !== 0 ? Math.round((variance / beforeVal) * 1000) / 10 : 0);
              const contributing = sensor.contributingSensors || [];

              return (
                <div 
                  key={sensor.id}
                  className="bg-slate-950/90 border border-amber-500/40 rounded-lg p-3.5 space-y-3"
                >
                  {/* Title Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded bg-slate-900 border border-slate-700">
                        {getSensorIcon(sensor.id)}
                      </div>
                      <div>
                        <span className="text-xs font-bold font-mono text-white flex items-center gap-2">
                          {sensor.name} <span className="text-slate-400 text-[10px]">({sensor.id})</span>
                          <span className="text-[9px] font-sans px-1.5 py-0.2 rounded bg-red-950 text-red-300 border border-red-800">
                            HARDWARE OFFLINE
                          </span>
                        </span>
                      </div>
                    </div>

                    <button
                      id={`btn-reconnect-${sensor.id}`}
                      onClick={() => onToggleFailure(sensor.id)}
                      className="px-2.5 py-1 rounded bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/60 text-xs font-mono transition flex items-center gap-1.5"
                    >
                      <RotateCcw className="w-3 h-3" /> Reconnect Sensor
                    </button>
                  </div>

                  {/* 3-Way Comparison Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {/* Card 1: Before Failure Value */}
                    <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-2.5">
                      <div className="text-[10px] font-mono text-slate-400 mb-1 flex items-center justify-between">
                        <span>BEFORE FAILURE VALUE</span>
                        <span className="text-[9px] px-1 py-0.2 rounded bg-slate-800 text-slate-400">LAST REAL</span>
                      </div>
                      <div className="text-lg font-bold font-mono text-slate-200">
                        {beforeVal} <span className="text-xs font-normal text-slate-400">{sensor.unit}</span>
                      </div>
                      <p className="text-[9px] font-mono text-slate-400 mt-0.5">
                        Recorded prior to sensor cut-off
                      </p>
                    </div>

                    {/* Card 2: AI Expected Value */}
                    <div className="bg-amber-950/30 border border-amber-500/50 rounded-lg p-2.5 relative overflow-hidden">
                      <div className="text-[10px] font-mono text-amber-300 mb-1 flex items-center justify-between">
                        <span className="flex items-center gap-1.5 font-bold">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                          </span>
                          <Sparkles className="w-3 h-3 text-amber-400" /> AI EXPECTED VALUE
                        </span>
                        <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          {sensor.confidence}% CONF
                        </span>
                      </div>
                      <div className="text-lg font-bold font-mono text-amber-300 flex items-baseline gap-1.5">
                        <span>{expectedVal}</span>
                        <span className="text-xs font-normal text-amber-400/70">{sensor.unit}</span>
                        <span className="text-[9px] text-amber-400/80 font-normal ml-auto bg-amber-900/40 px-1 rounded border border-amber-600/30 animate-pulse">
                          LIVE
                        </span>
                      </div>
                      <p className="text-[9px] font-mono text-amber-300/80 mt-0.5">
                        Dynamic soft-sensing from healthy sensors
                      </p>
                    </div>

                    {/* Card 3: Shift / Variance */}
                    <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-2.5">
                      <div className="text-[10px] font-mono text-slate-400 mb-1 flex items-center justify-between">
                        <span>DRIFT / VARIANCE</span>
                        <span className="text-[9px] px-1 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-bold">
                          Δ LIVE SHIFT
                        </span>
                      </div>
                      <div className={`text-lg font-bold font-mono ${
                        Math.abs(variancePct) > 5 ? 'text-amber-400' : 'text-cyan-300'
                      }`}>
                        {variance > 0 ? `+${variance}` : variance} <span className="text-xs font-normal text-slate-400">{sensor.unit}</span>
                        <span className="text-xs ml-1.5 font-normal text-slate-400">({variancePct > 0 ? `+${variancePct}` : variancePct}%)</span>
                      </div>
                      <p className="text-[9px] font-mono text-slate-400 mt-0.5">
                        Live drift from pre-failure state
                      </p>
                    </div>
                  </div>

                  {/* AI Derivation Basis & Correlated Sensors */}
                  <div className="bg-slate-900/60 border border-slate-800/80 rounded-lg p-2.5 space-y-1.5">
                    <div className="text-[10px] font-mono text-slate-300 flex items-center gap-1.5">
                      <Layers className="w-3 h-3 text-cyan-400" />
                      <strong>AI Reconstruction Basis & Active Correlated Sensors:</strong>
                    </div>

                    {contributing.length > 0 ? (
                      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                        <span className="text-[9px] font-mono text-slate-400">Signals used:</span>
                        {contributing.map(c => (
                          <span 
                            key={c.id} 
                            className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-200 flex items-center gap-1"
                          >
                            <span className="text-cyan-400">{c.name}:</span>
                            <strong className="text-white">{c.value} {c.unit}</strong>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[9px] font-mono text-slate-400">
                        Inferred using engine thermodynamics and cross-channel physical regression.
                      </span>
                    )}

                    {sensor.estimationFormula && (
                      <div className="text-[9px] font-mono text-amber-200/80 pt-1 border-t border-slate-800">
                        <span className="text-slate-400">Physical ML Model: </span>
                        {sensor.estimationFormula}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Standby Notification & Quick Simulation Bar */
        <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-3.5 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-mono font-bold text-emerald-300">
                ALL 14 SENSORS OPERATIONAL • AI SOFT-SENSING STANDBY READY
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-400">
              Click any button below to simulate an immediate sensor disconnect:
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-[10px] font-mono text-slate-400">Test Cutouts:</span>
            {[
              { id: 'cht2', label: 'Fail CHT #2 (Head Temp)' },
              { id: 'egt3', label: 'Fail EGT #3 (Exhaust Gas)' },
              { id: 'oil_pressure', label: 'Fail Oil Pressure' },
              { id: 'rpm', label: 'Fail Engine RPM' },
              { id: 'vibration', label: 'Fail Vibration Sensor' },
              { id: 'fuel_flow', label: 'Fail Fuel Flow' },
              { id: 'battery_v', label: 'Fail Battery Bus' }
            ].map(btn => (
              <button
                key={btn.id}
                id={`btn-quick-fail-${btn.id}`}
                onClick={() => onToggleFailure(btn.id)}
                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-mono transition border border-slate-700 hover:border-amber-500/50"
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Educational Notice */}
      <div className="bg-cyan-950/30 border border-cyan-500/30 rounded-lg p-3 text-xs font-mono text-cyan-200/90 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
        <div>
          <strong className="text-white">SIH 2026 AI Soft-Sensing Architecture:</strong> When a physical aero sensor loses signal or open-circuits (e.g. EGT3 thermocouple disconnect), the AI engine isolates the channel as <strong>FAILED</strong> to prevent false emergency aborts. The missing value is dynamically estimated from adjacent cylinder thermodynamics and engine load, tracking both the <strong>before-failure baseline</strong> and the <strong>AI-expected live reconstruction</strong>.
        </div>
      </div>

      {/* Sensor Channels Grid (All 14 Sensors) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-mono text-slate-400">
          <span>Complete 14-Channel Sensor Array:</span>
          <span>Click "Simulate Cutout" on any sensor to see AI recovery</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {sensorList.map(sensor => {
            const isVirtual = sensor.isVirtual;
            const beforeVal = sensor.beforeFailureValue ?? sensor.currentValue;
            const expectedVal = sensor.aiExpectedValue ?? sensor.currentValue;

            return (
              <div 
                key={sensor.id}
                className={`rounded-xl p-3 border transition-all duration-200 ${
                  isVirtual 
                    ? 'bg-amber-950/30 border-amber-500/60 ring-1 ring-amber-500/40 shadow-lg' 
                    : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Channel Header */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 font-mono">
                    <div className="p-1 rounded bg-slate-900 border border-slate-800">
                      {getSensorIcon(sensor.id)}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white uppercase block leading-tight">{sensor.name}</span>
                      <span className="text-[10px] text-slate-400">({sensor.id})</span>
                    </div>
                  </div>

                  {isVirtual ? (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/50 font-mono font-bold flex items-center gap-1 animate-pulse">
                      <Radio className="w-2.5 h-2.5 text-amber-400" /> AI VIRTUAL
                    </span>
                  ) : (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-mono flex items-center gap-1">
                      <CheckCircle2 className="w-2.5 h-2.5" /> REAL SENSOR
                    </span>
                  )}
                </div>

                {/* Value Display */}
                {isVirtual ? (
                  <div className="space-y-1.5 mb-2 font-mono">
                    <div className="flex items-baseline justify-between">
                      <div>
                        <span className="text-[10px] text-amber-400 block">AI EXPECTED VALUE:</span>
                        <div className="text-xl font-bold text-amber-300">
                          {expectedVal} <span className="text-xs font-normal text-amber-400/70">{sensor.unit}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block">BEFORE FAILURE:</span>
                        <div className="text-sm font-bold text-slate-300">
                          {beforeVal} <span className="text-[10px] text-slate-500">{sensor.unit}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-[10px] font-mono text-amber-200/80 bg-slate-900/80 p-1 rounded border border-amber-500/20">
                      Confidence: {sensor.confidence}% • Reconstructed via active sensors
                    </div>
                  </div>
                ) : (
                  <div className="flex items-baseline justify-between mb-2 font-mono">
                    <div className="text-xl font-bold text-white">
                      {sensor.currentValue} <span className="text-xs font-normal text-slate-400">{sensor.unit}</span>
                    </div>
                    <div className="text-[10px] text-emerald-400 font-mono">
                      Signal Nominal (100%)
                    </div>
                  </div>
                )}

                {/* Virtual Estimation Formula */}
                {isVirtual && sensor.estimationFormula && (
                  <div className="mb-2 p-1.5 rounded bg-slate-900 border border-amber-500/20 text-[10px] font-mono text-amber-200/80">
                    <strong className="text-slate-400 block text-[9px]">Model Derivation:</strong>
                    {sensor.estimationFormula}
                  </div>
                )}

                {/* Action: Toggle Sensor Failure Button */}
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-[10px] font-mono text-slate-500">
                    Channel: {isVirtual ? 'Soft-Sensing Active' : 'Hardware Signal'}
                  </span>
                  <button
                    id={`btn-toggle-sensor-${sensor.id}`}
                    onClick={() => onToggleFailure(sensor.id)}
                    className={`text-[10px] font-mono px-2.5 py-0.5 rounded border transition ${
                      isVirtual 
                        ? 'bg-emerald-950/60 text-emerald-300 border-emerald-700/50 hover:bg-emerald-900/60' 
                        : 'bg-red-950/60 text-red-300 border-red-700/50 hover:bg-red-900/60'
                    }`}
                  >
                    {isVirtual ? 'Reconnect Sensor' : 'Simulate Cutout'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
