import { EngineFault, EngineTelemetry } from './engine';

export interface RemediationOperationalChanges {
  throttle_pct: number;
  altitude_ft: number;
  rpm: number;
  fuel_mixture: string; // e.g. "Rich (11.8:1)" or "Lean-of-Peak"
  target_manifold_inHg: number;
}

export interface RemediationProjectedMetrics {
  projected_cht_peak_C: number;
  projected_oil_temp_C: number;
  projected_vibration_g: number;
  projected_fuel_flow_gph: number;
  projected_tof_hours: number;
  tof_gain_hours: number;
  risk_score: number;
}

export interface RemediationStrategy {
  id: string;
  title: string;
  shortTitle: string;
  isRecommended: boolean;
  suitabilityScore: number; // 0-100%
  description: string;
  physicsMechanism: string;
  operationalChanges: RemediationOperationalChanges;
  projectedMetrics: RemediationProjectedMetrics;
  actionSteps: string[];
  tradeoffs: {
    pros: string[];
    cons: string[];
  };
  hindiSummary: string;
}

export interface FaultDiagnosticReport {
  timestamp: string;
  identifiedProblem: string;
  problemSeverity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  affectedSubsystem: string;
  primaryComponent: string;
  rootCauseEnglish: string;
  rootCauseSummary: string;
  baselineToFMinutes: number;
  baselineFailureMode: string;
  strategies: RemediationStrategy[];
  bestStrategyId: string;
  aiSummaryEnglish: string;
  aiGroundStationSummary: string;
  modelUsed: string;
}

export interface ProblemPreset {
  id: string;
  name: string;
  severity: 'MEDIUM' | 'HIGH' | 'CRITICAL';
  symptoms: string[];
  faults: EngineFault[];
  telemetryOverride: Partial<EngineTelemetry>;
}

export const PROBLEM_PRESETS: ProblemPreset[] = [
  {
    id: 'cyl3_thermal_runaway',
    name: 'Cylinder #3 Thermal Runaway & Pre-Detonation',
    severity: 'CRITICAL',
    symptoms: ['CHT Cyl #3 spike to 148.5°C', 'EGT spike to 878°C', 'High-frequency acoustic detonation vibration'],
    faults: [
      {
        id: 'FLT_THERM_CYL3',
        fault_type: 'OVERHEATING',
        name: 'Cylinder #3 Thermal Runaway & Pre-Detonation',
        severity: 'CRITICAL',
        detection_time_s: 1840,
        affected_parameters: ['cht3_C', 'egt3_C', 'vibration_g'],
        confidence_pct: 98,
        status: 'ACTIVE',
        root_cause: 'CHT Cyl 3 has breached critical 145°C limit with severe pre-detonation pressure spikes.',
        recommended_actions: ['Reduce power and trim mixture to prevent piston ring micro-welding.']
      }
    ],
    telemetryOverride: {
      cht3_C: 148.5,
      egt3_C: 878.0,
      vibration_g: 1.58,
      oil_temp_C: 114.2,
      oil_pressure_bar: 3.8
    }
  },
  {
    id: 'oil_gallery_leak',
    name: 'Main Oil Gallery Micro-Leak & Hydrodynamic Failure',
    severity: 'CRITICAL',
    symptoms: ['Oil pressure drop to 2.1 bar', 'Oil temp rise to 124°C', 'Crankshaft bearing friction heating'],
    faults: [
      {
        id: 'FLT_OIL_LOSS',
        fault_type: 'LOW_OIL_PRESSURE',
        name: 'Main Oil Gallery Pressure Depletion',
        severity: 'CRITICAL',
        detection_time_s: 2150,
        affected_parameters: ['oil_pressure_bar', 'oil_temp_C'],
        confidence_pct: 95,
        status: 'ACTIVE',
        root_cause: 'Lube pressure fallen below hydrodynamic boundary layer sustaining limit (2.5 bar).',
        recommended_actions: ['De-rate RPM to preserve hydrodynamic wedge.']
      }
    ],
    telemetryOverride: {
      oil_pressure_bar: 2.1,
      oil_temp_C: 124.0,
      vibration_g: 1.85
    }
  },
  {
    id: 'injector_lean_misfire',
    name: 'Injector Port 2 Clogging & Lean Combustion Misfire',
    severity: 'HIGH',
    symptoms: ['EGT Cyl #2 drop by 140°C', 'Air-Fuel Ratio uneven (16.2:1)', 'Low-frequency torsional surge'],
    faults: [
      {
        id: 'FLT_INJ_CLOG',
        fault_type: 'INJECTOR_FAILURE',
        name: 'Port #2 Fuel Injector Partial Orifice Blockage',
        severity: 'WARNING',
        detection_time_s: 2400,
        affected_parameters: ['egt2_C', 'fuel_flow_L_h'],
        confidence_pct: 91,
        status: 'ACTIVE',
        root_cause: 'Lean combustion misfire causing severe torque pulsation on the crankshaft.',
        recommended_actions: ['Switch to auxiliary fuel rail bias and richen global manifold.']
      }
    ],
    telemetryOverride: {
      egt2_C: 590.0,
      vibration_g: 1.42
    }
  },
  {
    id: 'high_alt_detonation',
    name: 'High-Altitude Hot-Day Turbo Surge & Knock',
    severity: 'HIGH',
    symptoms: ['High-altitude thin air cooling deficit', 'Intercooler heat saturation', 'Engine vibration surge'],
    faults: [
      {
        id: 'FLT_TURBO_SURGE',
        fault_type: 'COMBUSTION_INSTABILITY',
        name: 'Compressor Surge & Intercooler Saturation',
        severity: 'WARNING',
        detection_time_s: 2900,
        affected_parameters: ['altitude_ft', 'vibration_g'],
        confidence_pct: 88,
        status: 'ACTIVE',
        root_cause: 'High ambient temperature reducing mass airflow cooling across cylinder finning.',
        recommended_actions: ['Descend to denser sub-inversion layer or trim throttle.']
      }
    ],
    telemetryOverride: {
      altitude_ft: 18500,
      vibration_g: 1.35
    }
  },
  {
    id: 'bearing_spalling',
    name: 'Big-End Connecting Rod Bearing Spalling',
    severity: 'CRITICAL',
    symptoms: ['120Hz harmonic vibration surge (2.25g)', 'Metal friction thermal creep', 'Micro-seizure hazard'],
    faults: [
      {
        id: 'FLT_BEARING_FATIGUE',
        fault_type: 'ABNORMAL_VIBRATION',
        name: 'Big-End Conrod Journal Spalling Degradation',
        severity: 'CRITICAL',
        detection_time_s: 3100,
        affected_parameters: ['vibration_g', 'oil_temp_C'],
        confidence_pct: 97,
        status: 'ACTIVE',
        root_cause: 'Excessive mechanical contact friction. Continued full-throttle will throw rod.',
        recommended_actions: ['Immediate torque derate to prevent connecting rod failure.']
      }
    ],
    telemetryOverride: {
      vibration_g: 2.25,
      oil_temp_C: 118.0
    }
  }
];
