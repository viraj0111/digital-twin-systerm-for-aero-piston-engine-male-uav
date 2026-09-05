import React, { useState } from 'react';
import { 
  Cpu, 
  Activity, 
  Flame, 
  Droplet, 
  Zap, 
  Wind, 
  Gauge, 
  Radio, 
  CheckCircle2, 
  AlertTriangle,
  Layers,
  ArrowRightLeft,
  Info
} from 'lucide-react';
import { DigitalTwinState, SensorStatus, EngineFault } from '../types/engine';

interface DigitalTwinSchematicProps {
  state: DigitalTwinState;
  onSensorClick?: (sensorId: string) => void;
  onFaultClick?: (fault: EngineFault) => void;
}

export const DigitalTwinSchematic: React.FC<DigitalTwinSchematicProps> = ({ state, onSensorClick, onFaultClick }) => {
  const { telemetry, sensors, health, faults } = state;
  const [selectedSubsystem, setSelectedSubsystem] = useState<string>('cylinders');

  // Cylinder temperature color mapper
  const getChtColor = (val: number) => {
    if (val > 150) return 'text-red-400 bg-red-950/60 border-red-500';
    if (val > 135) return 'text-amber-400 bg-amber-950/60 border-amber-500';
    return 'text-emerald-400 bg-emerald-950/40 border-emerald-500/40';
  };

  const getEgtColor = (val: number) => {
    if (val > 910) return 'text-red-400 bg-red-950/60 border-red-500';
    if (val > 860) return 'text-amber-400 bg-amber-950/60 border-amber-500';
    return 'text-cyan-400 bg-cyan-950/40 border-cyan-500/40';
  };

  const getSensorBadge = (sensorId: string) => {
    const s: SensorStatus | undefined = sensors[sensorId];
    if (!s) return null;
    if (s.isVirtual) {
      return (
        <span 
          onClick={() => onSensorClick && onSensorClick(sensorId)}
          className="cursor-pointer text-[9px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/50 font-mono font-bold flex items-center gap-0.5 animate-pulse"
          title="Virtual Sensor Estimated by AI Soft-Sensing"
        >
          <Radio className="w-2.5 h-2.5 text-amber-400" /> AI VIRTUAL ({s.confidence}%)
        </span>
      );
    }
    if (s.state === 'FAILED') {
      return (
        <span className="text-[9px] px-1 py-0.2 rounded bg-red-500/20 text-red-300 border border-red-500/50 font-mono font-bold">
          FAILED
        </span>
      );
    }
    return (
      <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-mono flex items-center gap-0.5">
        <CheckCircle2 className="w-2.5 h-2.5" /> REAL
      </span>
    );
  };

  // 4 Cylinders Data
  const cylinders = [
    { id: 1, name: 'Cylinder #1', cht: telemetry.cht1_C, egt: telemetry.egt1_C, chtId: 'cht1', egtId: 'egt1' },
    { id: 2, name: 'Cylinder #2', cht: telemetry.cht2_C, egt: telemetry.egt2_C, chtId: 'cht2', egtId: 'egt2' },
    { id: 3, name: 'Cylinder #3', cht: telemetry.cht3_C, egt: telemetry.egt3_C, chtId: 'cht3', egtId: 'egt3' },
    { id: 4, name: 'Cylinder #4', cht: telemetry.cht4_C, egt: telemetry.egt4_C, chtId: 'cht4', egtId: 'egt4' }
  ];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl">
      {/* Visual System Flow Communication Banner */}
      <div className="bg-slate-950/80 border border-slate-800/90 rounded-lg p-3 mb-4 flex flex-col md:flex-row items-center justify-between gap-3 font-mono">
        {/* Physical / Simulated Node */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-950/80 border border-blue-500/40 flex items-center justify-center text-blue-400">
            <Radio className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] uppercase text-slate-400">Physical Engine / Wokwi ESP32</div>
            <div className="text-xs font-semibold text-blue-300">14 Ingress Sensor Channels (20Hz)</div>
          </div>
        </div>

        {/* Bi-directional Flow Indicator */}
        <div className="flex items-center gap-1 text-slate-500">
          <ArrowRightLeft className="w-4 h-4 text-cyan-400 animate-pulse" />
          <span className="text-[10px] text-cyan-400/80 uppercase">Continuous Telemetry Sync</span>
        </div>

        {/* Digital Twin Core */}
        <div className="flex items-center gap-2.5 bg-cyan-950/40 px-3 py-1.5 rounded-lg border border-cyan-500/30">
          <div className="w-8 h-8 rounded-lg bg-cyan-900/60 border border-cyan-400/50 flex items-center justify-center text-cyan-300">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] uppercase text-cyan-400 font-bold">Virtual Engine Twin</div>
            <div className="text-xs font-semibold text-white">4-Cyl MALE Aero Piston Twin</div>
          </div>
        </div>

        {/* Bi-directional Flow Indicator */}
        <div className="flex items-center gap-1 text-slate-500">
          <ArrowRightLeft className="w-4 h-4 text-purple-400 animate-pulse" />
          <span className="text-[10px] text-purple-400/80 uppercase">Prognostic AI Feedback</span>
        </div>

        {/* AI Analysis Node */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-purple-950/80 border border-purple-500/40 flex items-center justify-center text-purple-400">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] uppercase text-slate-400">AI / ML Diagnostic Engine</div>
            <div className="text-xs font-semibold text-purple-300">Health {health.health_score_pct}% • RUL Est</div>
          </div>
        </div>
      </div>

      {/* Main Engine Schematic Graphic */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Side: 4 Cylinders Thermal & Combustion Grid */}
        <div className="lg:col-span-8 bg-slate-950/60 rounded-xl p-4 border border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-400" />
              <h3 className="text-sm font-semibold font-mono text-white">
                4-Cylinder Thermodynamic Twin Bank
              </h3>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              EGT Spread: <span className="text-cyan-300 font-bold">
                {(Math.max(...cylinders.map(c => c.egt)) - Math.min(...cylinders.map(c => c.egt))).toFixed(1)}°C
              </span>
            </span>
          </div>

          {/* 4 Cylinders Visual Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {cylinders.map(cyl => {
              const isFailed = (telemetry.failed_pistons || []).includes(cyl.id);
              const isOverheat = cyl.cht > 145 || cyl.egt > 900 || isFailed;
              const hasVirtualSensor = sensors[cyl.chtId]?.isVirtual || sensors[cyl.egtId]?.isVirtual;

              return (
                <div 
                  key={cyl.id}
                  onClick={() => {
                    if (faults.length > 0 && onFaultClick) {
                      onFaultClick(faults[0]);
                    } else if (onSensorClick) {
                      onSensorClick(cyl.chtId);
                    }
                  }}
                  className={`rounded-lg p-3 border transition-all duration-300 relative overflow-hidden cursor-pointer hover:scale-[1.02] ${
                    isFailed
                      ? 'bg-red-950/50 border-red-500 ring-1 ring-red-500/50 shadow-md shadow-red-950/50'
                      : isOverheat 
                      ? 'bg-red-950/30 border-red-500/60 ring-1 ring-red-500/40 shadow-md' 
                      : 'bg-slate-900/90 border-slate-800 hover:border-cyan-500/40'
                  }`}
                  title={isOverheat ? 'Click to inspect cylinder thermal fault details' : 'Click to inspect sensor'}
                >
                  {/* Cylinder Header */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold font-mono text-slate-200 flex items-center gap-1">
                      CYL #{cyl.id}
                      {isFailed && <span className="text-[8px] px-1 rounded bg-red-600 text-white font-extrabold">SEIZED</span>}
                    </span>
                    {isOverheat ? (
                      <AlertTriangle className="w-3.5 h-3.5 text-red-400 animate-pulse" />
                    ) : (
                      <div className="w-2 h-2 rounded-full bg-emerald-400" />
                    )}
                  </div>

                  {/* Cylinder Schematic Cross-section simulation */}
                  <div className="h-16 w-full rounded bg-slate-950 border border-slate-800/80 mb-2.5 flex flex-col justify-between p-1.5 relative">
                    {/* Spark plug icon & combustion glow */}
                    <div className="flex justify-center">
                      <div className={`w-3 h-2 rounded-t-sm shadow-sm ${
                        isFailed ? 'bg-slate-600' : 'bg-yellow-400/80 animate-pulse shadow-yellow-500'
                      }`} />
                    </div>
                    {/* Combustion Chamber Flame Intensity based on EGT */}
                    <div 
                      className="w-full rounded h-6 transition-colors duration-500 flex items-center justify-center text-[10px] font-mono font-bold"
                      style={{
                        backgroundColor: isFailed
                          ? 'rgba(185, 28, 28, 0.4)'
                          : cyl.egt > 860 
                          ? 'rgba(239, 68, 68, 0.4)' 
                          : cyl.egt > 800 
                          ? 'rgba(249, 115, 22, 0.3)' 
                          : 'rgba(6, 182, 212, 0.25)',
                        color: isFailed ? '#fca5a5' : cyl.egt > 860 ? '#fca5a5' : '#67e8f9'
                      }}
                    >
                      {isFailed ? 'PISTON SEIZED' : `${cyl.egt.toFixed(0)}°C EGT`}
                    </div>
                    {/* Piston head & Connecting Rod */}
                    <div className="w-10 h-2 bg-slate-600 mx-auto rounded-sm" />
                  </div>

                  {/* Cylinder Head Temp (CHT) */}
                  <div className="mb-2">
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mb-0.5">
                      <span>CHT Head</span>
                      {getSensorBadge(cyl.chtId)}
                    </div>
                    <div className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded border ${getChtColor(cyl.cht)}`}>
                      {cyl.cht.toFixed(1)} °C
                    </div>
                  </div>

                  {/* Exhaust Gas Temp (EGT) */}
                  <div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mb-0.5">
                      <span>EGT Exhaust</span>
                      {getSensorBadge(cyl.egtId)}
                    </div>
                    <div className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded border ${getEgtColor(cyl.egt)}`}>
                      {cyl.egt.toFixed(1)} °C
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Crankshaft & Mechanical Drive Bar */}
          <div className="mt-4 bg-slate-900 border border-slate-800 rounded-lg p-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-slate-950 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                <Activity className={`w-4 h-4 ${telemetry.rpm > 2000 ? 'animate-spin' : ''}`} style={{ animationDuration: '3s' }} />
              </div>
              <div>
                <div className="text-[10px] uppercase font-mono text-slate-400">Crankshaft RPM & Harmonic Drive</div>
                <div className="text-sm font-bold font-mono text-white flex items-center gap-2">
                  <span>{telemetry.rpm} RPM</span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    (Target: {Math.round(1800 + (telemetry.throttle_pct / 100) * 3800)} RPM)
                  </span>
                </div>
              </div>
            </div>

            {/* Block Vibration Node */}
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-[10px] uppercase font-mono text-slate-400 flex items-center justify-end gap-1">
                  <span>Block Vibration (RMS)</span>
                  {getSensorBadge('vibration')}
                </div>
                <div className={`text-sm font-bold font-mono ${
                  telemetry.vibration_g > 3.0 ? 'text-red-400' : telemetry.vibration_g > 1.8 ? 'text-amber-400' : 'text-emerald-400'
                }`}>
                  {telemetry.vibration_g.toFixed(2)} g
                </div>
              </div>
              <div className={`w-2.5 h-8 rounded-full ${
                telemetry.vibration_g > 3.0 ? 'bg-red-500 animate-pulse' : telemetry.vibration_g > 1.8 ? 'bg-amber-500' : 'bg-emerald-500'
              }`} />
            </div>
          </div>
        </div>

        {/* Right Side: Peripheral Subsystems & Auxiliary Circuits */}
        <div className="lg:col-span-4 flex flex-col gap-3">
          {/* Lubrication Circuit Card */}
          <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-amber-300">
                <Droplet className="w-3.5 h-3.5 text-amber-400" />
                <span>Lubrication Circuit</span>
              </div>
              <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded border ${
                telemetry.oil_pressure_bar < 2.0 
                  ? 'bg-red-500/20 text-red-300 border-red-500/50' 
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              }`}>
                {telemetry.oil_pressure_bar < 2.0 ? 'LOW PRESSURE' : 'OPTIMAL'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="bg-slate-900 p-2 rounded border border-slate-800">
                <div className="text-[10px] text-slate-400 flex items-center justify-between">
                  <span>Oil Press</span>
                  {getSensorBadge('oil_pressure')}
                </div>
                <div className={`text-sm font-bold mt-0.5 ${
                  telemetry.oil_pressure_bar < 1.5 ? 'text-red-400' : telemetry.oil_pressure_bar < 2.2 ? 'text-amber-400' : 'text-cyan-300'
                }`}>
                  {telemetry.oil_pressure_bar.toFixed(2)} <span className="text-[10px] text-slate-400">bar</span>
                </div>
              </div>

              <div className="bg-slate-900 p-2 rounded border border-slate-800">
                <div className="text-[10px] text-slate-400 flex items-center justify-between">
                  <span>Oil Temp</span>
                  {getSensorBadge('oil_temp')}
                </div>
                <div className={`text-sm font-bold mt-0.5 ${
                  telemetry.oil_temp_C > 130 ? 'text-red-400' : telemetry.oil_temp_C > 115 ? 'text-amber-400' : 'text-slate-200'
                }`}>
                  {telemetry.oil_temp_C.toFixed(1)} <span className="text-[10px] text-slate-400">°C</span>
                </div>
              </div>
            </div>
          </div>

          {/* Fuel & Induction System Card */}
          <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-cyan-300">
                <Wind className="w-3.5 h-3.5 text-cyan-400" />
                <span>Induction & Fuel Rail</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                Throttle: <strong className="text-white">{telemetry.throttle_pct}%</strong>
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="bg-slate-900 p-2 rounded border border-slate-800">
                <div className="text-[10px] text-slate-400 flex items-center justify-between">
                  <span>Fuel Flow</span>
                  {getSensorBadge('fuel_flow')}
                </div>
                <div className="text-sm font-bold text-cyan-300 mt-0.5">
                  {telemetry.fuel_flow_L_h.toFixed(1)} <span className="text-[10px] text-slate-400">L/h</span>
                </div>
              </div>

              <div className="bg-slate-900 p-2 rounded border border-slate-800">
                <div className="text-[10px] text-slate-400 flex items-center justify-between">
                  <span>28V Avionics</span>
                  {getSensorBadge('battery_v')}
                </div>
                <div className="text-sm font-bold text-emerald-400 mt-0.5">
                  {telemetry.battery_V.toFixed(1)} <span className="text-[10px] text-slate-400">V</span>
                </div>
              </div>
            </div>
          </div>

          {/* Environmental Mission Context Card */}
          <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800">
            <div className="text-xs font-mono font-bold text-purple-300 mb-2 flex items-center gap-2">
              <Gauge className="w-3.5 h-3.5 text-purple-400" />
              <span>Flight Environment Context</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="bg-slate-900 p-2 rounded border border-slate-800">
                <div className="text-[10px] text-slate-400">Altitude</div>
                <div className="text-sm font-bold text-white mt-0.5">
                  {telemetry.altitude_ft.toLocaleString()} <span className="text-[10px] text-slate-400">FT</span>
                </div>
              </div>
              <div className="bg-slate-900 p-2 rounded border border-slate-800">
                <div className="text-[10px] text-slate-400">Ambient Temp</div>
                <div className="text-sm font-bold text-white mt-0.5">
                  {telemetry.ambient_temp_C.toFixed(1)} <span className="text-[10px] text-slate-400">°C</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
