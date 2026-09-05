import React, { useState, useEffect, useRef } from 'react';
import { 
  Flame, 
  Zap, 
  AlertTriangle, 
  CheckCircle2, 
  Gauge, 
  Activity, 
  Wrench, 
  ShieldAlert, 
  Play, 
  Pause,
  RotateCcw,
  Sparkles,
  Info,
  Radio
} from 'lucide-react';
import { DigitalTwinState } from '../types/engine';
import { digitalTwinService } from '../services/digitalTwinService';

interface DynamicEngineKinematicsProps {
  state: DigitalTwinState;
}

export const DynamicEngineKinematics: React.FC<DynamicEngineKinematicsProps> = ({ state }) => {
  const { telemetry, sensors } = state;
  const rpm = telemetry.rpm || 4800;
  const failedPistons = telemetry.failed_pistons || [];

  // Animation & Kinematics State
  const [crankAngle, setCrankAngle] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [speedScale, setSpeedScale] = useState<number>(1.0); // 0.25x, 0.5x, 1x, 2x
  const animFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());
  const crankAngleRef = useRef<number>(0);

  // Store frozen positions when pistons seize/fail so they stop where they failed or at realistic seized stroke
  const frozenStrokeRef = useRef<Record<number, number>>({
    1: 22,
    2: 45,
    3: 15,
    4: 38
  });

  // Animation Loop driven by RPM and speed scale
  useEffect(() => {
    const updateMotion = (now: number) => {
      const dt = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;

      if (!isPaused && rpm > 100) {
        // Deg/sec = RPM * 360 / 60 = RPM * 6
        // Scale down for optical clarity if RPM is 5000+ (so human eye can appreciate the mechanical cycle)
        const opticalRpm = Math.min(rpm, 2400) * 0.45 * speedScale;
        const deltaAngle = (opticalRpm * 360 / 60) * dt;
        crankAngleRef.current = (crankAngleRef.current + deltaAngle) % 720;
        setCrankAngle(crankAngleRef.current);
      }

      animFrameRef.current = requestAnimationFrame(updateMotion);
    };

    lastTimeRef.current = performance.now();
    animFrameRef.current = requestAnimationFrame(updateMotion);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isPaused, rpm, speedScale]);

  // Cylinder Kinematics calculation
  // R = Crank radius (px), L = Connecting rod length (px)
  const CRANK_R = 24;
  const ROD_L = 68;
  const STROKE_LENGTH = 2 * CRANK_R; // 48px stroke

  // 4-Cylinder Firing order: 1 - 3 - 4 - 2
  // Cycle spans 720 degrees (4-stroke)
  const cylinderConfigs = [
    { id: 1, name: 'Cylinder #1', phaseOffset: 0, cht: telemetry.cht1_C, egt: telemetry.egt1_C },
    { id: 2, name: 'Cylinder #2', phaseOffset: 540, cht: telemetry.cht2_C, egt: telemetry.egt2_C },
    { id: 3, name: 'Cylinder #3', phaseOffset: 180, cht: telemetry.cht3_C, egt: telemetry.egt3_C },
    { id: 4, name: 'Cylinder #4', phaseOffset: 360, cht: telemetry.cht4_C, egt: telemetry.egt4_C }
  ];

  // Helper to get 4-stroke cycle phase
  const getStrokePhase = (angle720: number, isFailed: boolean) => {
    if (isFailed) {
      return {
        name: 'SEIZED / FROZEN',
        color: 'text-red-400 bg-red-950/80 border-red-500/80',
        strokeIndex: -1,
        valveIntake: false,
        valveExhaust: false,
        spark: false,
        pressure: 0.9
      };
    }

    const norm = (angle720 % 720 + 720) % 720;

    if (norm < 180) {
      // 0 - 180: Power / Expansion Stroke (TDC to BDC)
      const spark = norm < 25;
      const progress = norm / 180;
      const pressure = Math.max(8, Math.round(52 * (1 - progress * 0.75)));
      return {
        name: 'POWER STROKE',
        color: 'text-orange-400 bg-orange-950/60 border-orange-500/50',
        strokeIndex: 3,
        valveIntake: false,
        valveExhaust: false,
        spark,
        pressure
      };
    } else if (norm < 360) {
      // 180 - 360: Exhaust Stroke (BDC to TDC)
      return {
        name: 'EXHAUST STROKE',
        color: 'text-amber-400 bg-amber-950/60 border-amber-500/50',
        strokeIndex: 4,
        valveIntake: false,
        valveExhaust: true,
        spark: false,
        pressure: 3.2
      };
    } else if (norm < 540) {
      // 360 - 540: Intake Stroke (TDC to BDC)
      return {
        name: 'INTAKE STROKE',
        color: 'text-cyan-400 bg-cyan-950/60 border-cyan-500/50',
        strokeIndex: 1,
        valveIntake: true,
        valveExhaust: false,
        spark: false,
        pressure: 1.1
      };
    } else {
      // 540 - 720: Compression Stroke (BDC to TDC)
      const progress = (norm - 540) / 180;
      const pressure = Math.max(1.2, Math.round(1.2 + progress * 24));
      return {
        name: 'COMPRESSION',
        color: 'text-indigo-400 bg-indigo-950/60 border-indigo-500/50',
        strokeIndex: 2,
        valveIntake: false,
        valveExhaust: false,
        spark: false,
        pressure
      };
    }
  };

  const handleTogglePiston = (cylId: number) => {
    digitalTwinService.togglePistonFailure(cylId);
  };

  const handleRestoreAll = () => {
    digitalTwinService.restoreAllPistons();
  };

  const handleQuickSeizure = (cylId: number) => {
    if (!failedPistons.includes(cylId)) {
      digitalTwinService.togglePistonFailure(cylId);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-2xl relative overflow-hidden" id="dynamic-engine-twin">
      {/* Header with Title & Live Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-sm">
            <Activity className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold font-mono text-white tracking-wide">
                DYNAMIC 4-CYLINDER AERO ENGINE KINEMATIC TWIN
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                RECIPROCATING 4-STROKE
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Real-time slider-crank kinematics & interactive piston seizure fault simulator
            </p>
          </div>
        </div>

        {/* Playback & Motion Speed Controls */}
        <div className="flex items-center gap-2 font-mono">
          <button
            onClick={() => setIsPaused(!isPaused)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold border transition ${
              isPaused 
                ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300 hover:bg-emerald-900/60' 
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
            }`}
            title={isPaused ? 'Resume Motion' : 'Freeze Engine Animation'}
          >
            {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
            <span>{isPaused ? 'RESUME' : 'FREEZE'}</span>
          </button>

          {/* Speed Selection */}
          <div className="flex items-center bg-slate-950 rounded border border-slate-800 p-0.5 text-[10px]">
            {[
              { label: '0.25x', val: 0.25 },
              { label: '0.5x', val: 0.5 },
              { label: '1.0x', val: 1.0 },
              { label: '1.5x', val: 1.5 }
            ].map(spd => (
              <button
                key={spd.label}
                onClick={() => setSpeedScale(spd.val)}
                className={`px-1.5 py-0.5 rounded transition ${
                  speedScale === spd.val 
                    ? 'bg-cyan-600 text-white font-bold' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {spd.label}
              </button>
            ))}
          </div>

          {/* Restore All Button */}
          {failedPistons.length > 0 && (
            <button
              onClick={handleRestoreAll}
              className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm animate-pulse transition"
              title="Restore all seized pistons to normal operation"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>RESTORE ALL ({failedPistons.length} FAILED)</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Interactive 4-Cylinder Cross-Section Graphic */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 my-4">
        {cylinderConfigs.map(cyl => {
          const isFailed = failedPistons.includes(cyl.id);
          const localCrankDeg = (crankAngle + cyl.phaseOffset) % 720;
          const thetaRad = (localCrankDeg * Math.PI) / 180;
          
          // Slider-crank displacement from TDC (y: 0 = Top, STROKE_LENGTH = Bottom)
          // When failed, lock piston displacement at frozen position
          let pistonY = isFailed 
            ? frozenStrokeRef.current[cyl.id] || 25
            : (CRANK_R * (1 - Math.cos(thetaRad)) + (Math.pow(CRANK_R, 2) / (2 * ROD_L)) * Math.pow(Math.sin(thetaRad), 2));
          
          // Connecting rod angle beta
          const rodAngleDeg = isFailed ? 0 : (Math.asin((CRANK_R / ROD_L) * Math.sin(thetaRad)) * 180) / Math.PI;

          const strokeInfo = getStrokePhase(localCrankDeg, isFailed);

          return (
            <div 
              key={cyl.id}
              className={`rounded-xl border transition-all duration-300 relative overflow-hidden flex flex-col justify-between ${
                isFailed 
                  ? 'bg-red-950/40 border-red-500 shadow-lg shadow-red-950/50 ring-1 ring-red-500/50' 
                  : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Cylinder Top Bar: Name, Status & Interactive Toggle Button */}
              <div className="p-3 pb-2 border-b border-slate-800/80 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold font-mono text-white">{cyl.name}</span>
                    {isFailed ? (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-extrabold bg-red-600 text-white animate-pulse">
                        SEIZED
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-semibold bg-emerald-950 text-emerald-400 border border-emerald-500/40">
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                    {isFailed ? (
                      <span className="text-red-300 font-bold">⛔ MOTION STOPPED</span>
                    ) : (
                      <span className="text-slate-300">Phase Angle: {Math.round(localCrankDeg)}°</span>
                    )}
                  </div>
                </div>

                {/* Direct Action Button to Fail / Stop or Restore This Piston */}
                <button
                  onClick={() => handleTogglePiston(cyl.id)}
                  className={`px-2 py-1 rounded text-[10px] font-mono font-bold transition flex items-center gap-1 shadow-sm ${
                    isFailed 
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white' 
                      : 'bg-red-900/80 hover:bg-red-700 text-red-100 border border-red-600/60'
                  }`}
                  title={isFailed ? 'Click to restart and unfreeze this piston' : 'Click to simulate failure and stop this piston'}
                >
                  {isFailed ? (
                    <>
                      <CheckCircle2 className="w-3 h-3" />
                      <span>RESTART</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-3 h-3 text-red-300" />
                      <span>FAIL PISTON</span>
                    </>
                  )}
                </button>
              </div>

              {/* Dynamic Animated Mechanical Cylinder SVG Stage */}
              <div className="relative h-60 w-full flex items-center justify-center p-2 bg-gradient-to-b from-slate-950 via-slate-900/60 to-slate-950">
                {/* Fault Alert Watermark if Seized */}
                {isFailed && (
                  <div className="absolute inset-0 bg-red-950/60 backdrop-blur-[1px] z-20 flex flex-col items-center justify-center p-2 text-center animate-fadeIn">
                    <div className="w-9 h-9 rounded-full bg-red-900/90 border border-red-500 flex items-center justify-center text-red-200 mb-1.5 shadow-lg shadow-red-900/80 animate-bounce">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div className="text-xs font-mono font-black text-red-300 tracking-wider">
                      PISTON #{cyl.id} SEIZED
                    </div>
                    <div className="text-[10px] font-mono text-red-200/90 mt-0.5 max-w-[140px]">
                      Reciprocation Halted • Connecting Rod Locked
                    </div>
                    <button
                      onClick={() => handleTogglePiston(cyl.id)}
                      className="mt-2.5 px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-mono font-bold shadow transition"
                    >
                      CLEAR & RESUME
                    </button>
                  </div>
                )}

                {/* SVG Kinematics Engine Cross Section */}
                <svg viewBox="0 0 160 220" className="w-full h-full max-w-[170px]" style={{ overflow: 'visible' }}>
                  <defs>
                    {/* Metal cylinder wall gradient */}
                    <linearGradient id={`cylWall-${cyl.id}`} x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#334155" />
                      <stop offset="50%" stopColor="#64748b" />
                      <stop offset="100%" stopColor="#334155" />
                    </linearGradient>

                    {/* Piston body metallic gradient */}
                    <linearGradient id={`pistonGrad-${cyl.id}`} x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor={isFailed ? "#7f1d1d" : "#475569"} />
                      <stop offset="50%" stopColor={isFailed ? "#dc2626" : "#94a3b8"} />
                      <stop offset="100%" stopColor={isFailed ? "#7f1d1d" : "#475569"} />
                    </linearGradient>

                    {/* Flame expansion gradient */}
                    <radialGradient id={`flameGrad-${cyl.id}`} cx="50%" cy="30%" r="70%">
                      <stop offset="0%" stopColor="#fef08a" stopOpacity="0.95" />
                      <stop offset="40%" stopColor="#f97316" stopOpacity="0.8" />
                      <stop offset="80%" stopColor="#ef4444" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#000" stopOpacity="0" />
                    </radialGradient>
                  </defs>

                  {/* 1. Cylinder Outer Cooling Fins */}
                  {[32, 44, 56, 68, 80, 92, 104, 116].map(y => (
                    <g key={y}>
                      <rect x="18" y={y} width="10" height="4" rx="1" fill="#1e293b" stroke="#334155" strokeWidth="0.5" />
                      <rect x="132" y={y} width="10" height="4" rx="1" fill="#1e293b" stroke="#334155" strokeWidth="0.5" />
                    </g>
                  ))}

                  {/* 2. Cylinder Barrel Walls */}
                  <rect x="28" y="28" width="104" height="108" fill="#0f172a" stroke="#475569" strokeWidth="2" rx="2" />

                  {/* 3. Combustion Chamber Crown & Spark Plug */}
                  <path d="M 32 30 Q 80 22 128 30" fill="none" stroke="#64748b" strokeWidth="2" />
                  
                  {/* Left Valve: Intake */}
                  <g transform={`translate(52, ${strokeInfo.valveIntake ? 33 : 28})`}>
                    <line x1="0" y1="-8" x2="0" y2="4" stroke="#06b6d4" strokeWidth="2" />
                    <ellipse cx="0" cy="4" rx="7" ry="2.5" fill="#06b6d4" />
                    {strokeInfo.valveIntake && !isFailed && (
                      <circle cx="0" cy="8" r="4" fill="#06b6d4" opacity="0.4" className="animate-ping" />
                    )}
                  </g>

                  {/* Right Valve: Exhaust */}
                  <g transform={`translate(108, ${strokeInfo.valveExhaust ? 33 : 28})`}>
                    <line x1="0" y1="-8" x2="0" y2="4" stroke="#f97316" strokeWidth="2" />
                    <ellipse cx="0" cy="4" rx="7" ry="2.5" fill="#f97316" />
                    {strokeInfo.valveExhaust && !isFailed && (
                      <circle cx="0" cy="8" r="4" fill="#f97316" opacity="0.4" className="animate-ping" />
                    )}
                  </g>

                  {/* Center Spark Plug */}
                  <rect x="77" y="16" width="6" height="12" fill="#e2e8f0" stroke="#0f172a" strokeWidth="1" />
                  {/* Spark Discharge effect */}
                  {strokeInfo.spark && !isFailed && (
                    <g transform="translate(80, 31)">
                      <circle cx="0" cy="0" r="5" fill="#fef08a" className="animate-ping" />
                      <line x1="-4" y1="-2" x2="4" y2="2" stroke="#38bdf8" strokeWidth="2" />
                      <line x1="4" y1="-2" x2="-4" y2="2" stroke="#facc15" strokeWidth="2" />
                    </g>
                  )}

                  {/* 4. Dynamic Combustion Flame Chamber Expansion */}
                  {!isFailed && strokeInfo.strokeIndex === 3 && (
                    <rect 
                      x="30" 
                      y="30" 
                      width="100" 
                      height={Math.max(6, pistonY - 2)} 
                      fill={`url(#flameGrad-${cyl.id})`}
                      opacity="0.85"
                    />
                  )}

                  {/* 5. Moving Piston Assembly */}
                  {/* Piston Head moves from y = 32 (TDC) to y = 80 (BDC) based on pistonY */}
                  <g transform={`translate(0, ${32 + pistonY})`}>
                    {/* Piston Crown & Skirt */}
                    <rect 
                      x="32" 
                      y="0" 
                      width="96" 
                      height="36" 
                      rx="3" 
                      fill={`url(#pistonGrad-${cyl.id})`} 
                      stroke={isFailed ? "#ef4444" : "#64748b"} 
                      strokeWidth="1.5" 
                    />
                    {/* Compression Rings */}
                    <line x1="33" y1="6" x2="127" y2="6" stroke="#1e293b" strokeWidth="1.5" />
                    <line x1="33" y1="12" x2="127" y2="12" stroke="#1e293b" strokeWidth="1.5" />
                    <line x1="33" y1="18" x2="127" y2="18" stroke="#1e293b" strokeWidth="1.5" />

                    {/* Wrist Pin (Gudgeon Pin) - Piston center pivot */}
                    <circle cx="80" cy="22" r="6" fill="#334155" stroke="#94a3b8" strokeWidth="1.5" />
                  </g>

                  {/* 6. Crankshaft & Crankpin Center */}
                  {/* Crankshaft main journal center is at (80, 185) */}
                  <g transform="translate(80, 185)">
                    {/* Crankcase boundary circle */}
                    <circle cx="0" cy="0" r="32" fill="#090d16" stroke="#334155" strokeWidth="1" />
                    
                    {/* Crankshaft Counterweight (rotates with local crank angle) */}
                    <g transform={`rotate(${isFailed ? 0 : localCrankDeg})`}>
                      {/* Counterweight counter balance */}
                      <path d="M -16 0 A 16 16 0 0 0 16 0 L 22 18 A 24 24 0 0 1 -22 18 Z" fill="#475569" stroke="#64748b" strokeWidth="1" />
                      {/* Crank web arm */}
                      <rect x="-6" y="-24" width="12" height="24" fill="#64748b" rx="2" />
                      {/* Crankpin circle */}
                      <circle cx="0" cy="-24" r="5" fill="#f1f5f9" stroke="#0f172a" strokeWidth="1.5" />
                    </g>
                    {/* Main journal stationary center pin */}
                    <circle cx="0" cy="0" r="7" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.5" />
                  </g>

                  {/* 7. Articulating Connecting Rod */}
                  {/* Connects Wrist Pin (80, 32 + pistonY + 22 = 54 + pistonY) to Crankpin */}
                  {(() => {
                    const wristPinY = 54 + pistonY;
                    const crankpinAngleRad = ((isFailed ? 0 : localCrankDeg) * Math.PI) / 180;
                    const crankpinX = isFailed ? 80 : 80 + CRANK_R * Math.sin(crankpinAngleRad);
                    const crankpinY = isFailed ? 185 - CRANK_R : 185 - CRANK_R * Math.cos(crankpinAngleRad);

                    return (
                      <g>
                        {/* Connecting rod beam */}
                        <line 
                          x1="80" 
                          y1={wristPinY} 
                          x2={crankpinX} 
                          y2={crankpinY} 
                          stroke={isFailed ? "#ef4444" : "#94a3b8"} 
                          strokeWidth="5" 
                          strokeLinecap="round"
                        />
                        {/* Connecting rod I-beam highlight */}
                        <line 
                          x1="80" 
                          y1={wristPinY} 
                          x2={crankpinX} 
                          y2={crankpinY} 
                          stroke={isFailed ? "#fee2e2" : "#f8fafc"} 
                          strokeWidth="1.5" 
                          strokeLinecap="round"
                        />
                        {/* Big end journal bearing cap */}
                        <circle cx={crankpinX} cy={crankpinY} r="7" fill="none" stroke={isFailed ? "#ef4444" : "#cbd5e1"} strokeWidth="2.5" />
                        
                        {/* If failed, show fracture / seizure warning cross icon */}
                        {isFailed && (
                          <g transform={`translate(${ (80 + crankpinX)/2 }, ${ (wristPinY + crankpinY)/2 })`}>
                            <circle cx="0" cy="0" r="8" fill="#7f1d1d" stroke="#ef4444" strokeWidth="1.5" />
                            <line x1="-4" y1="-4" x2="4" y2="4" stroke="#ffffff" strokeWidth="2" />
                            <line x1="4" y1="-4" x2="-4" y2="4" stroke="#ffffff" strokeWidth="2" />
                          </g>
                        )}
                      </g>
                    );
                  })()}
                </svg>
              </div>

              {/* Cylinder Thermal & Cycle Metrics Footer */}
              <div className="p-3 pt-2 bg-slate-950 border-t border-slate-800/80 space-y-2">
                {/* 4-Stroke Phase Badge */}
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${strokeInfo.color}`}>
                    {strokeInfo.name}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    Press: <strong className={isFailed ? "text-red-400" : "text-cyan-300"}>{strokeInfo.pressure.toFixed(1)} bar</strong>
                  </span>
                </div>

                {/* CHT & EGT Real-Time Reading */}
                {(() => {
                  const chtSensor = sensors[`cht${cyl.id}`];
                  const egtSensor = sensors[`egt${cyl.id}`];

                  return (
                    <div className="grid grid-cols-2 gap-2 text-[10px] font-mono pt-1">
                      <div className={`rounded p-1.5 border transition ${
                        chtSensor?.isVirtual 
                          ? 'bg-amber-950/40 border-amber-500/50 ring-1 ring-amber-500/30' 
                          : 'bg-slate-900/90 border-slate-800'
                      }`}>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 block text-[9px]">HEAD TEMP</span>
                          {chtSensor?.isVirtual && (
                            <span className="text-[8px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold">AI SOFT-SENSE</span>
                          )}
                        </div>
                        <span className={`font-bold block ${cyl.cht > 140 ? 'text-red-400' : 'text-slate-200'}`}>
                          {cyl.cht.toFixed(1)}°C
                        </span>
                        {chtSensor?.isVirtual && (
                          <span className="text-[8px] text-amber-300 block leading-tight mt-0.5">
                            Pre: {chtSensor.beforeFailureValue}°C • AI: {chtSensor.aiExpectedValue}°C
                          </span>
                        )}
                      </div>

                      <div className={`rounded p-1.5 border transition ${
                        egtSensor?.isVirtual 
                          ? 'bg-amber-950/40 border-amber-500/50 ring-1 ring-amber-500/30' 
                          : 'bg-slate-900/90 border-slate-800'
                      }`}>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 block text-[9px]">EXHAUST EGT</span>
                          {egtSensor?.isVirtual && (
                            <span className="text-[8px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold">AI SOFT-SENSE</span>
                          )}
                        </div>
                        <span className={`font-bold block ${isFailed ? 'text-slate-500' : 'text-orange-300'}`}>
                          {isFailed ? '150°C (COLD)' : `${cyl.egt.toFixed(0)}°C`}
                        </span>
                        {egtSensor?.isVirtual && (
                          <span className="text-[8px] text-amber-300 block leading-tight mt-0.5">
                            Pre: {egtSensor.beforeFailureValue}°C • AI: {egtSensor.aiExpectedValue}°C
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          );
        })}
      </div>

      {/* Interactive Quick Simulation Scenario Bar */}
      <div className="bg-slate-950/90 border border-slate-800 rounded-lg p-3 space-y-2.5 font-mono text-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-cyan-400" />
            <span className="text-slate-300 font-bold">
              Mechanical Seizure Simulation:
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleQuickSeizure(2)}
              disabled={failedPistons.includes(2)}
              className={`px-2.5 py-1 rounded text-[11px] font-bold transition flex items-center gap-1 ${
                failedPistons.includes(2)
                  ? 'bg-red-950/40 text-red-400 border border-red-800/60 cursor-not-allowed'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
              }`}
            >
              <AlertTriangle className="w-3 h-3 text-amber-400" />
              <span>Fail Cyl #2 (Seize Piston)</span>
            </button>

            <button
              onClick={() => handleQuickSeizure(3)}
              disabled={failedPistons.includes(3)}
              className={`px-2.5 py-1 rounded text-[11px] font-bold transition flex items-center gap-1 ${
                failedPistons.includes(3)
                  ? 'bg-red-950/40 text-red-400 border border-red-800/60 cursor-not-allowed'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
              }`}
            >
              <AlertTriangle className="w-3 h-3 text-red-400" />
              <span>Fail Cyl #3 (Seize Piston)</span>
            </button>

            {failedPistons.length > 0 ? (
              <button
                onClick={handleRestoreAll}
                className="px-3 py-1 rounded text-[11px] font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition flex items-center gap-1.5 shadow-sm"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Restore All Pistons</span>
              </button>
            ) : (
              <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-semibold px-2 py-0.5 rounded bg-emerald-950/50 border border-emerald-500/30">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>All 4 Pistons Synchronized & Reciprocating</span>
              </div>
            )}
          </div>
        </div>

        {/* Quick Sensor Cutout Buttons */}
        <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
          <span className="text-slate-400 text-[11px] flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-amber-400" />
            <strong className="text-slate-300">Sensor Cutout AI Test:</strong>
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => digitalTwinService.toggleSensorFailure('cht2')}
              className={`px-2 py-0.5 rounded text-[10px] border transition ${
                sensors['cht2']?.isVirtual
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
            >
              {sensors['cht2']?.isVirtual ? 'Reconnect CHT #2' : 'Test Cutout: CHT #2'}
            </button>
            <button
              onClick={() => digitalTwinService.toggleSensorFailure('egt3')}
              className={`px-2 py-0.5 rounded text-[10px] border transition ${
                sensors['egt3']?.isVirtual
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
            >
              {sensors['egt3']?.isVirtual ? 'Reconnect EGT #3' : 'Test Cutout: EGT #3'}
            </button>
            <button
              onClick={() => digitalTwinService.toggleSensorFailure('oil_pressure')}
              className={`px-2 py-0.5 rounded text-[10px] border transition ${
                sensors['oil_pressure']?.isVirtual
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
            >
              {sensors['oil_pressure']?.isVirtual ? 'Reconnect Oil Press' : 'Test Cutout: Oil Press'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
