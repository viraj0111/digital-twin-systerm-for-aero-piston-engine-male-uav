import React from 'react';
import { 
  Activity, 
  Flame, 
  Droplet, 
  Zap, 
  Gauge, 
  AlertTriangle, 
  CheckCircle2, 
  Radio, 
  TrendingUp 
} from 'lucide-react';
import { DigitalTwinState } from '../types/engine';

interface VitalMetricsGridProps {
  state: DigitalTwinState;
}

export const VitalMetricsGrid: React.FC<VitalMetricsGridProps> = ({ state }) => {
  const { telemetry, sensors } = state;

  const getSensorTag = (id: string) => {
    const s = sensors[id];
    if (!s) return null;
    if (s.isVirtual) {
      return (
        <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/50 font-mono font-bold">
          AI VIRTUAL
        </span>
      );
    }
    return (
      <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-mono">
        REAL
      </span>
    );
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
      {/* 1. Engine RPM */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-md">
        <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono mb-1">
          <span className="flex items-center gap-1.5 font-bold text-slate-300">
            <Gauge className="w-3.5 h-3.5 text-cyan-400" /> RPM
          </span>
          {getSensorTag('rpm')}
        </div>
        <div className="text-xl font-bold font-mono text-white tracking-tight">
          {telemetry.rpm}
        </div>
        <div className="mt-2 w-full bg-slate-800 h-1.5 rounded-full overflow-hidden flex">
          <div 
            className="bg-emerald-500 h-full" 
            style={{ width: `${Math.min(100, (telemetry.rpm / 5800) * 100)}%` }} 
          />
        </div>
        <div className="flex justify-between text-[9px] font-mono text-slate-500 mt-1">
          <span>0</span>
          <span>5000 (CRUISE)</span>
          <span className="text-red-400">5800 (REDLINE)</span>
        </div>
        {sensors['rpm']?.isVirtual && (
          <div className="mt-1.5 px-1.5 py-0.5 rounded bg-amber-500/15 border border-amber-500/40 text-[9px] font-mono text-amber-300 flex items-center justify-between">
            <span className="text-slate-400">Pre-Fail: {sensors['rpm'].beforeFailureValue}</span>
            <span className="font-bold text-amber-300">AI: {sensors['rpm'].aiExpectedValue}</span>
          </div>
        )}
      </div>

      {/* 2. Peak Cylinder Head Temp (CHT) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-md">
        <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono mb-1">
          <span className="flex items-center gap-1.5 font-bold text-slate-300">
            <Flame className="w-3.5 h-3.5 text-orange-400" /> PEAK CHT
          </span>
          <span className="text-[9px] font-mono text-slate-400">CYL 1-4</span>
        </div>
        {(() => {
          const maxCht = Math.max(telemetry.cht1_C, telemetry.cht2_C, telemetry.cht3_C, telemetry.cht4_C);
          const isWarning = maxCht > 135;
          const isCrit = maxCht > 150;
          const virtualChts = ['cht1', 'cht2', 'cht3', 'cht4'].filter(id => sensors[id]?.isVirtual);

          return (
            <>
              <div className={`text-xl font-bold font-mono tracking-tight ${
                isCrit ? 'text-red-400 animate-pulse' : isWarning ? 'text-amber-400' : 'text-emerald-400'
              }`}>
                {maxCht.toFixed(1)} <span className="text-xs text-slate-400 font-normal">°C</span>
              </div>
              <div className="mt-2 flex gap-1 h-1.5">
                {[telemetry.cht1_C, telemetry.cht2_C, telemetry.cht3_C, telemetry.cht4_C].map((c, idx) => (
                  <div 
                    key={idx} 
                    className={`flex-1 rounded-sm ${c > 150 ? 'bg-red-500' : c > 135 ? 'bg-amber-500' : 'bg-emerald-500'}`} 
                    title={`Cyl #${idx + 1}: ${c}°C`}
                  />
                ))}
              </div>
              <div className="flex justify-between text-[9px] font-mono text-slate-500 mt-1">
                <span>C1: {telemetry.cht1_C.toFixed(0)}</span>
                <span>C2: {telemetry.cht2_C.toFixed(0)}</span>
                <span>C3: {telemetry.cht3_C.toFixed(0)}</span>
                <span>C4: {telemetry.cht4_C.toFixed(0)}</span>
              </div>
              {virtualChts.length > 0 && (
                <div className="mt-1.5 px-1.5 py-0.5 rounded bg-amber-500/15 border border-amber-500/40 text-[9px] font-mono text-amber-300 space-y-0.5">
                  {virtualChts.map(id => (
                    <div key={id} className="flex justify-between items-center">
                      <span className="text-slate-400">{id.toUpperCase()} (Pre: {sensors[id]?.beforeFailureValue}°C)</span>
                      <span className="font-bold text-amber-300">AI: {sensors[id]?.aiExpectedValue}°C</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          );
        })()}
      </div>

      {/* 3. Peak Exhaust Gas Temp (EGT) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-md">
        <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono mb-1">
          <span className="flex items-center gap-1.5 font-bold text-slate-300">
            <Flame className="w-3.5 h-3.5 text-cyan-400" /> PEAK EGT
          </span>
          <span className="text-[9px] font-mono text-slate-400">CYL 1-4</span>
        </div>
        {(() => {
          const maxEgt = Math.max(telemetry.egt1_C, telemetry.egt2_C, telemetry.egt3_C, telemetry.egt4_C);
          const isCrit = maxEgt > 910;
          const isWarn = maxEgt > 860;
          const virtualEgts = ['egt1', 'egt2', 'egt3', 'egt4'].filter(id => sensors[id]?.isVirtual);

          return (
            <>
              <div className={`text-xl font-bold font-mono tracking-tight ${
                isCrit ? 'text-red-400 animate-pulse' : isWarn ? 'text-amber-400' : 'text-cyan-300'
              }`}>
                {maxEgt.toFixed(1)} <span className="text-xs text-slate-400 font-normal">°C</span>
              </div>
              <div className="mt-2 flex gap-1 h-1.5">
                {[telemetry.egt1_C, telemetry.egt2_C, telemetry.egt3_C, telemetry.egt4_C].map((e, idx) => (
                  <div 
                    key={idx} 
                    className={`flex-1 rounded-sm ${e > 910 ? 'bg-red-500' : e > 860 ? 'bg-amber-500' : 'bg-cyan-500'}`}
                    title={`EGT #${idx + 1}: ${e}°C`}
                  />
                ))}
              </div>
              <div className="flex justify-between text-[9px] font-mono text-slate-500 mt-1">
                <span>E1: {telemetry.egt1_C.toFixed(0)}</span>
                <span>E2: {telemetry.egt2_C.toFixed(0)}</span>
                <span>E3: {telemetry.egt3_C.toFixed(0)}</span>
                <span>E4: {telemetry.egt4_C.toFixed(0)}</span>
              </div>
              {virtualEgts.length > 0 && (
                <div className="mt-1.5 px-1.5 py-0.5 rounded bg-amber-500/15 border border-amber-500/40 text-[9px] font-mono text-amber-300 space-y-0.5">
                  {virtualEgts.map(id => (
                    <div key={id} className="flex justify-between items-center">
                      <span className="text-slate-400">{id.toUpperCase()} (Pre: {sensors[id]?.beforeFailureValue}°C)</span>
                      <span className="font-bold text-amber-300">AI: {sensors[id]?.aiExpectedValue}°C</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          );
        })()}
      </div>

      {/* 4. Lubrication Oil Pressure */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-md">
        <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono mb-1">
          <span className="flex items-center gap-1.5 font-bold text-slate-300">
            <Droplet className="w-3.5 h-3.5 text-amber-400" /> OIL PRESS
          </span>
          {getSensorTag('oil_pressure')}
        </div>
        <div className={`text-xl font-bold font-mono tracking-tight ${
          telemetry.oil_pressure_bar < 1.5 ? 'text-red-400 animate-pulse' : telemetry.oil_pressure_bar < 2.2 ? 'text-amber-400' : 'text-white'
        }`}>
          {telemetry.oil_pressure_bar.toFixed(2)} <span className="text-xs text-slate-400 font-normal">bar</span>
        </div>
        <div className="mt-2 w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
          <div 
            className={`h-full ${telemetry.oil_pressure_bar < 1.5 ? 'bg-red-500' : telemetry.oil_pressure_bar < 2.2 ? 'bg-amber-500' : 'bg-emerald-500'}`}
            style={{ width: `${Math.min(100, (telemetry.oil_pressure_bar / 6.0) * 100)}%` }}
          />
        </div>
        <div className="flex justify-between text-[9px] font-mono text-slate-500 mt-1">
          <span className="text-red-400">&lt;1.5 Crit</span>
          <span>3.0 - 5.0 Nom</span>
          <span>6.5 Max</span>
        </div>
        {sensors['oil_pressure']?.isVirtual && (
          <div className="mt-1.5 px-1.5 py-0.5 rounded bg-amber-500/15 border border-amber-500/40 text-[9px] font-mono text-amber-300 flex items-center justify-between">
            <span className="text-slate-400">Pre: {sensors['oil_pressure'].beforeFailureValue} bar</span>
            <span className="font-bold text-amber-300">AI: {sensors['oil_pressure'].aiExpectedValue} bar</span>
          </div>
        )}
      </div>

      {/* 5. Vibration RMS */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-md">
        <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono mb-1">
          <span className="flex items-center gap-1.5 font-bold text-slate-300">
            <Activity className="w-3.5 h-3.5 text-purple-400" /> VIBRATION
          </span>
          {getSensorTag('vibration')}
        </div>
        <div className={`text-xl font-bold font-mono tracking-tight ${
          telemetry.vibration_g > 3.0 ? 'text-red-400 animate-pulse' : telemetry.vibration_g > 1.8 ? 'text-amber-400' : 'text-emerald-400'
        }`}>
          {telemetry.vibration_g.toFixed(2)} <span className="text-xs text-slate-400 font-normal">g</span>
        </div>
        <div className="mt-2 w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
          <div 
            className={`h-full ${telemetry.vibration_g > 3.0 ? 'bg-red-500' : telemetry.vibration_g > 1.8 ? 'bg-amber-500' : 'bg-emerald-500'}`}
            style={{ width: `${Math.min(100, (telemetry.vibration_g / 4.0) * 100)}%` }}
          />
        </div>
        <div className="flex justify-between text-[9px] font-mono text-slate-500 mt-1">
          <span>0.6 Nom</span>
          <span>&gt;1.8 Warn</span>
          <span className="text-red-400">&gt;3.0 Crit</span>
        </div>
        {sensors['vibration']?.isVirtual && (
          <div className="mt-1.5 px-1.5 py-0.5 rounded bg-amber-500/15 border border-amber-500/40 text-[9px] font-mono text-amber-300 flex items-center justify-between">
            <span className="text-slate-400">Pre: {sensors['vibration'].beforeFailureValue} g</span>
            <span className="font-bold text-amber-300">AI: {sensors['vibration'].aiExpectedValue} g</span>
          </div>
        )}
      </div>

      {/* 6. Fuel Flow */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-md">
        <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono mb-1">
          <span className="flex items-center gap-1.5 font-bold text-slate-300">
            <Droplet className="w-3.5 h-3.5 text-blue-400" /> FUEL FLOW
          </span>
          {getSensorTag('fuel_flow')}
        </div>
        <div className="text-xl font-bold font-mono text-cyan-300 tracking-tight">
          {telemetry.fuel_flow_L_h.toFixed(1)} <span className="text-xs text-slate-400 font-normal">L/h</span>
        </div>
        <div className="mt-2 w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
          <div 
            className="bg-cyan-500 h-full"
            style={{ width: `${Math.min(100, (telemetry.fuel_flow_L_h / 40) * 100)}%` }}
          />
        </div>
        <div className="flex justify-between text-[9px] font-mono text-slate-500 mt-1">
          <span>8 Idle</span>
          <span>22.5 Cruise</span>
          <span>35 WOT</span>
        </div>
        {sensors['fuel_flow']?.isVirtual && (
          <div className="mt-1.5 px-1.5 py-0.5 rounded bg-amber-500/15 border border-amber-500/40 text-[9px] font-mono text-amber-300 flex items-center justify-between">
            <span className="text-slate-400">Pre: {sensors['fuel_flow'].beforeFailureValue} L/h</span>
            <span className="font-bold text-amber-300">AI: {sensors['fuel_flow'].aiExpectedValue} L/h</span>
          </div>
        )}
      </div>
    </div>
  );
};
