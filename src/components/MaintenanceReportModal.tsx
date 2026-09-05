import React from 'react';
import { 
  X, 
  Printer, 
  Download, 
  FileCheck, 
  ShieldCheck, 
  AlertTriangle, 
  Activity, 
  Clock, 
  Wrench,
  CheckCircle2
} from 'lucide-react';
import { DigitalTwinState } from '../types/engine';

interface MaintenanceReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  state: DigitalTwinState;
}

export const MaintenanceReportModal: React.FC<MaintenanceReportModalProps> = ({
  isOpen,
  onClose,
  state
}) => {
  if (!isOpen) return null;

  const { telemetry, health, rul, risk, faults, recommendations, telemetryHistory } = state;

  // Compute flight extremes
  const maxRpm = Math.max(...telemetryHistory.map(t => t.rpm), telemetry.rpm);
  const maxCht1 = Math.max(...telemetryHistory.map(t => t.cht1_C), telemetry.cht1_C);
  const maxCht2 = Math.max(...telemetryHistory.map(t => t.cht2_C), telemetry.cht2_C);
  const maxCht3 = Math.max(...telemetryHistory.map(t => t.cht3_C), telemetry.cht3_C);
  const maxCht4 = Math.max(...telemetryHistory.map(t => t.cht4_C), telemetry.cht4_C);
  const peakChtOverall = Math.max(maxCht1, maxCht2, maxCht3, maxCht4);

  const maxEgtOverall = Math.max(
    ...telemetryHistory.flatMap(t => [t.egt1_C, t.egt2_C, t.egt3_C, t.egt4_C]),
    telemetry.egt1_C, telemetry.egt2_C, telemetry.egt3_C, telemetry.egt4_C
  );

  const minOilPressure = Math.min(...telemetryHistory.map(t => t.oil_pressure_bar), telemetry.oil_pressure_bar);
  const maxVibration = Math.max(...telemetryHistory.map(t => t.vibration_g), telemetry.vibration_g);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadTextReport = () => {
    const reportText = `================================================================================
MALE UAV AERO PISTON ENGINE - MISSION HEALTH & DEBRIEF REPORT
Project: AI-Enabled Digital Twin System (SIH 2026)
Report Generation Date: ${new Date().toISOString()}
================================================================================

1. MISSION OVERVIEW
--------------------------------------------------------------------------------
Mission Flight Duration: ${telemetry.timestamp_s} seconds (${(telemetry.timestamp_s / 60).toFixed(1)} mins)
Operational Phase: ${telemetry.mission_phase}
Flight Altitude: ${telemetry.altitude_ft} ft
Ambient Temperature: ${telemetry.ambient_temp_C} °C
Total Telemetry Data Epochs: ${telemetryHistory.length}

2. ENGINE HEALTH & PROGNOSTICS (AI ESTIMATION)
--------------------------------------------------------------------------------
Calculated Engine Health Score: ${health.health_score_pct.toFixed(1)}%
  - Thermal Health: ${health.thermal_health_pct}%
  - Lubrication Health: ${health.lubrication_health_pct}%
  - Mechanical / Vibration Health: ${health.mechanical_health_pct}%
  - Combustion Balance: ${health.combustion_health_pct}%

AI Estimated Remaining Useful Life (RUL): ${rul.estimated_hours.toFixed(0)} hours
  - 95% Confidence Interval: ${rul.lower_bound_hours.toFixed(0)} - ${rul.upper_bound_hours.toFixed(0)} hours
  - Model Confidence: ${rul.confidence_pct}%
  - Limiting Subsystem: ${rul.limiting_subsystem}
  - Projected Failure Mode: ${rul.projected_failure_mode}
  - Overall Mission Risk: ${risk.level} (${risk.score}/100)

3. PEAK OPERATIONAL TELEMETRY RECORDINGS
--------------------------------------------------------------------------------
Peak Engine Speed: ${maxRpm} RPM
Peak Cylinder Head Temperature (CHT): ${peakChtOverall.toFixed(1)} °C
Peak Exhaust Gas Temperature (EGT): ${maxEgtOverall.toFixed(1)} °C
Minimum Lubrication Pressure: ${minOilPressure.toFixed(2)} bar
Peak RMS Block Vibration: ${maxVibration.toFixed(2)} g

4. DETECTED ANOMALIES & FAULT CLASSIFICATIONS (${faults.length} ACTIVE)
--------------------------------------------------------------------------------
${faults.length === 0 ? 'All propulsion systems nominal. Zero anomalies detected.' : faults.map((f, i) => `[Fault #${i + 1}] ${f.name} (${f.severity})
  - Root Cause: ${f.root_cause}
  - Affected: ${f.affected_parameters.join(', ')}
  - AI Confidence: ${f.confidence_pct}%
  - Immediate Action: ${f.recommended_actions.join('; ')}`).join('\n\n')}

5. ACTIONABLE MAINTENANCE SOP RECOMMENDATIONS
--------------------------------------------------------------------------------
${recommendations.map((r, i) => `[Action #${i + 1}] ${r.title} (Priority: ${r.priority}, Target: ${r.target_role})
  - SOP Directive: ${r.action}
  - Expected Outcome: ${r.expected_outcome}`).join('\n\n')}

================================================================================
END OF REPORT - AUTONOMOUS AERO DIGITAL TWIN PLATFORM
================================================================================`;

    const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `male_uav_mission_report_${Date.now()}.txt`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-slate-950 p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-cyan-400" />
            <div>
              <h3 className="text-base font-bold font-mono text-white">
                MALE UAV Engine Mission Health & Debrief Report
              </h3>
              <p className="text-xs font-mono text-slate-400">
                Aeronautical inspection document generated from Digital Twin telemetry
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono transition border border-slate-700"
            >
              <Printer className="w-4 h-4 text-cyan-400" /> Print
            </button>
            <button
              onClick={handleDownloadTextReport}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-mono transition font-bold"
            >
              <Download className="w-4 h-4" /> Download .TXT
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-6 overflow-y-auto font-mono text-xs space-y-6 text-slate-300">
          {/* Top Metadata Box */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
            <div>
              <span className="text-slate-500 uppercase text-[10px] block">Mission Elapsed</span>
              <strong className="text-white text-sm">{telemetry.timestamp_s}s ({(telemetry.timestamp_s / 60).toFixed(1)}m)</strong>
            </div>
            <div>
              <span className="text-slate-500 uppercase text-[10px] block">Flight Altitude</span>
              <strong className="text-white text-sm">{telemetry.altitude_ft.toLocaleString()} FT</strong>
            </div>
            <div>
              <span className="text-slate-500 uppercase text-[10px] block">Calculated Health</span>
              <strong className="text-emerald-400 text-sm">{health.health_score_pct.toFixed(1)}%</strong>
            </div>
            <div>
              <span className="text-slate-500 uppercase text-[10px] block">AI RUL Prediction</span>
              <strong className="text-cyan-300 text-sm">{rul.estimated_hours.toFixed(0)} Hours</strong>
            </div>
          </div>

          {/* Operational Extremes */}
          <div>
            <h4 className="font-bold text-white uppercase text-xs mb-2 pb-1 border-b border-slate-800">
              Flight Operational Extremes & Load Metrics
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                <span className="text-slate-500 text-[10px] block">Peak Engine RPM</span>
                <span className="text-white font-bold text-sm">{maxRpm} RPM</span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                <span className="text-slate-500 text-[10px] block">Peak CHT Head Temp</span>
                <span className={`font-bold text-sm ${peakChtOverall > 145 ? 'text-red-400' : 'text-slate-200'}`}>
                  {peakChtOverall.toFixed(1)} °C
                </span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                <span className="text-slate-500 text-[10px] block">Peak EGT Gas Temp</span>
                <span className="text-cyan-300 font-bold text-sm">{maxEgtOverall.toFixed(1)} °C</span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                <span className="text-slate-500 text-[10px] block">Min Oil Pressure</span>
                <span className={`font-bold text-sm ${minOilPressure < 2.0 ? 'text-red-400' : 'text-slate-200'}`}>
                  {minOilPressure.toFixed(2)} bar
                </span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                <span className="text-slate-500 text-[10px] block">Peak Vibration</span>
                <span className={`font-bold text-sm ${maxVibration > 2.0 ? 'text-amber-400' : 'text-slate-200'}`}>
                  {maxVibration.toFixed(2)} g
                </span>
              </div>
            </div>
          </div>

          {/* Subsystem Health Breakdown */}
          <div>
            <h4 className="font-bold text-white uppercase text-xs mb-2 pb-1 border-b border-slate-800">
              Subsystem Degradation Attribution
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Thermal Subsystem</span>
                <span className="text-sm font-bold text-white">{health.thermal_health_pct}%</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Lubrication Circuit</span>
                <span className="text-sm font-bold text-white">{health.lubrication_health_pct}%</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Mechanical Integrity</span>
                <span className="text-sm font-bold text-white">{health.mechanical_health_pct}%</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Combustion Balance</span>
                <span className="text-sm font-bold text-white">{health.combustion_health_pct}%</span>
              </div>
            </div>
          </div>

          {/* Faults & Recommendations */}
          <div>
            <h4 className="font-bold text-white uppercase text-xs mb-2 pb-1 border-b border-slate-800">
              Actionable Directives for Maintenance Crew
            </h4>
            <div className="space-y-2">
              {recommendations.map(r => (
                <div key={r.id} className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <div className="flex items-center justify-between mb-1">
                    <strong className="text-white text-xs">{r.title}</strong>
                    <span className="text-[10px] text-cyan-400 font-bold">Priority: {r.priority}</span>
                  </div>
                  <p className="text-slate-400 leading-snug">{r.action}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-950 p-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-mono text-xs font-bold transition"
          >
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
};
