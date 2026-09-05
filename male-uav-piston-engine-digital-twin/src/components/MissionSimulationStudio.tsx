import React, { useState } from 'react';
import { 
  Crosshair, 
  Flame, 
  Wind, 
  Sliders, 
  Mountain, 
  Thermometer, 
  Gauge, 
  Play, 
  CheckCircle2, 
  AlertTriangle 
} from 'lucide-react';
import { DigitalTwinState, MissionPhase } from '../types/engine';
import { MISSION_PRESETS } from '../data/constants';

interface MissionSimulationStudioProps {
  state: DigitalTwinState;
  onApplyEnvironment: (env: {
    altitude_ft?: number;
    ambient_temp_C?: number;
    throttle_pct?: number;
    mission_phase?: MissionPhase;
  }) => void;
  onSelectPreset: (presetId: string) => void;
}

export const MissionSimulationStudio: React.FC<MissionSimulationStudioProps> = ({
  state,
  onApplyEnvironment,
  onSelectPreset
}) => {
  const { telemetry, health, rul, risk } = state;

  const [altitude, setAltitude] = useState<number>(telemetry.altitude_ft);
  const [ambientTemp, setAmbientTemp] = useState<number>(telemetry.ambient_temp_C);
  const [throttle, setThrottle] = useState<number>(telemetry.throttle_pct);
  const [selectedPhase, setSelectedPhase] = useState<MissionPhase>(telemetry.mission_phase);

  const handleApplySliders = () => {
    onApplyEnvironment({
      altitude_ft: altitude,
      ambient_temp_C: ambientTemp,
      throttle_pct: throttle,
      mission_phase: selectedPhase
    });
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-orange-950 border border-orange-500/40 flex items-center justify-center text-orange-400">
            <Crosshair className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold font-mono text-white flex items-center gap-2">
              Mission & Operational Environment Simulation Studio
              <span className="text-[10px] font-sans px-2 py-0.5 rounded bg-orange-950 text-orange-300 border border-orange-800">
                Stress Evaluation Engine
              </span>
            </h3>
            <p className="text-xs text-slate-400 font-mono">
              Evaluate aero piston twin response across extreme thermal, altitude, and tactical load envelopes
            </p>
          </div>
        </div>

        <div className="text-xs font-mono px-3 py-1 rounded bg-slate-950 border border-slate-800 text-slate-300">
          Current Phase: <strong className="text-cyan-300">{telemetry.mission_phase}</strong>
        </div>
      </div>

      {/* Preset Mission Scenarios Grid */}
      <div>
        <h4 className="text-xs font-bold font-mono text-slate-300 uppercase mb-2 flex items-center gap-1.5">
          <Sliders className="w-3.5 h-3.5 text-cyan-400" /> Pre-Configured Operational Scenarios
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {MISSION_PRESETS.map(preset => {
            const isWar = preset.environment.is_war_scenario;
            return (
              <div 
                key={preset.id}
                className={`rounded-xl p-3 border text-xs font-mono transition flex flex-col justify-between ${
                  isWar 
                    ? 'bg-orange-950/20 border-orange-500/50 hover:border-orange-400' 
                    : 'bg-slate-950/70 border-slate-800 hover:border-cyan-500/50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-white text-xs">{preset.name}</span>
                    {isWar && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-red-500/30 text-red-300 border border-red-500/50 font-bold animate-pulse">
                        WAR
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 leading-snug mb-2">
                    {preset.description}
                  </p>
                </div>

                <div>
                  <div className="bg-slate-900/90 p-1.5 rounded border border-slate-800 text-[10px] text-slate-400 mb-2 space-y-0.5">
                    <div>Alt: <strong className="text-slate-200">{preset.environment.altitude_ft.toLocaleString()} ft</strong></div>
                    <div>Amb Temp: <strong className="text-slate-200">{preset.environment.ambient_temp_C}°C</strong></div>
                    <div>Throttle: <strong className="text-slate-200">{preset.environment.throttle_pct}%</strong></div>
                  </div>

                  <button
                    onClick={() => {
                      setAltitude(preset.environment.altitude_ft);
                      setAmbientTemp(preset.environment.ambient_temp_C);
                      setThrottle(preset.environment.throttle_pct);
                      let phase: MissionPhase = 'CRUISE';
                      if (preset.id === 'hot_desert_takeoff') phase = 'TAKEOFF';
                      else if (preset.id === 'high_altitude_loiter') phase = 'LOITER';
                      else if (isWar) phase = 'WAR_SCENARIO';

                      onApplyEnvironment({
                        altitude_ft: preset.environment.altitude_ft,
                        ambient_temp_C: preset.environment.ambient_temp_C,
                        throttle_pct: preset.environment.throttle_pct,
                        mission_phase: phase
                      });
                    }}
                    className="w-full py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition font-mono flex items-center justify-center gap-1 shadow-sm"
                  >
                    <Play className="w-3 h-3 fill-current" /> Load Scenario
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Dynamic Environmental Sliders & Real-Time Tuning */}
      <div className="bg-slate-950/70 rounded-xl p-4 border border-slate-800">
        <h4 className="text-xs font-bold font-mono text-white uppercase mb-3 flex items-center gap-1.5">
          <Sliders className="w-3.5 h-3.5 text-cyan-400" /> Interactive Environmental Parameter Controls
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Altitude Slider */}
          <div>
            <div className="flex justify-between text-xs font-mono mb-1">
              <span className="text-slate-400 flex items-center gap-1">
                <Mountain className="w-3.5 h-3.5 text-cyan-400" /> Flight Altitude:
              </span>
              <strong className="text-white">{altitude.toLocaleString()} FT</strong>
            </div>
            <input 
              type="range" 
              min="0" 
              max="25000" 
              step="500"
              value={altitude}
              onChange={e => setAltitude(parseInt(e.target.value))}
              className="w-full accent-cyan-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1">
              <span>Sea Level (0 ft)</span>
              <span>12,500 ft (Cruise)</span>
              <span>25,000 ft (Ceiling)</span>
            </div>
          </div>

          {/* Ambient Temperature Slider */}
          <div>
            <div className="flex justify-between text-xs font-mono mb-1">
              <span className="text-slate-400 flex items-center gap-1">
                <Thermometer className="w-3.5 h-3.5 text-orange-400" /> Ambient Temperature:
              </span>
              <strong className="text-white">{ambientTemp}°C</strong>
            </div>
            <input 
              type="range" 
              min="-40" 
              max="50" 
              step="1"
              value={ambientTemp}
              onChange={e => setAmbientTemp(parseInt(e.target.value))}
              className="w-full accent-orange-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1">
              <span className="text-cyan-400">-40°C Arctic</span>
              <span>+15°C ISA</span>
              <span className="text-red-400">+50°C Desert</span>
            </div>
          </div>

          {/* Throttle Position Slider */}
          <div>
            <div className="flex justify-between text-xs font-mono mb-1">
              <span className="text-slate-400 flex items-center gap-1">
                <Gauge className="w-3.5 h-3.5 text-emerald-400" /> Throttle Setting:
              </span>
              <strong className="text-white">{throttle}%</strong>
            </div>
            <input 
              type="range" 
              min="0" 
              max="100" 
              step="1"
              value={throttle}
              onChange={e => setThrottle(parseInt(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1">
              <span>0% Idle</span>
              <span>65% Economy</span>
              <span>100% Full Power</span>
            </div>
          </div>
        </div>

        {/* Mission Phase Dropdown & Apply Action */}
        <div className="mt-4 pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-slate-400">Commanded Flight Phase:</span>
            <select
              value={selectedPhase}
              onChange={e => setSelectedPhase(e.target.value as MissionPhase)}
              className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
            >
              <option value="PRE_FLIGHT">PRE_FLIGHT</option>
              <option value="TAXI">TAXI</option>
              <option value="TAKEOFF">TAKEOFF</option>
              <option value="CLIMB">CLIMB</option>
              <option value="CRUISE">CRUISE</option>
              <option value="LOITER">LOITER</option>
              <option value="DESCENT">DESCENT</option>
              <option value="LANDING">LANDING</option>
              <option value="WAR_SCENARIO">WAR_SCENARIO (HIGH STRESS)</option>
            </select>
          </div>

          <button
            onClick={handleApplySliders}
            className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs font-mono transition shadow-md flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-3.5 h-3.5" /> Apply Environmental Stress Parameters
          </button>
        </div>
      </div>
    </div>
  );
};
