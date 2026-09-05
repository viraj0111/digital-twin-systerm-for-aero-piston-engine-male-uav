export type MissionPhase = 
  | 'PRE_FLIGHT'
  | 'TAXI'
  | 'TAKEOFF'
  | 'CLIMB'
  | 'CRUISE'
  | 'LOITER'
  | 'DESCENT'
  | 'LANDING'
  | 'WAR_SCENARIO';

export type SeverityLevel = 'NORMAL' | 'WARNING' | 'CRITICAL';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type SensorState = 'HEALTHY' | 'DEGRADED' | 'FAILED' | 'VIRTUAL';

export interface ContributingSensor {
  id: string;
  name: string;
  value: number;
  unit: string;
}

export interface SensorStatus {
  id: string;
  name: string;
  unit: string;
  currentValue: number;
  state: SensorState;
  isVirtual: boolean;
  virtualValue?: number;
  confidence: number; // 0 to 100%
  lastUpdated: number;
  estimationFormula?: string;
  beforeFailureValue?: number;
  aiExpectedValue?: number;
  variance?: number;
  variancePct?: number;
  contributingSensors?: ContributingSensor[];
}

export interface EngineTelemetry {
  timestamp_s: number;
  mission_phase: MissionPhase;
  altitude_ft: number;
  ambient_temp_C: number;
  throttle_pct: number;
  rpm: number;
  cht1_C: number;
  cht2_C: number;
  cht3_C: number;
  cht4_C: number;
  egt1_C: number;
  egt2_C: number;
  egt3_C: number;
  egt4_C: number;
  oil_temp_C: number;
  oil_pressure_bar: number;
  fuel_flow_L_h: number;
  vibration_g: number;
  battery_V: number;
  // Metadata & flags
  sensor_failures: string[]; // List of failed sensor IDs
  active_faults: string[];
  failed_pistons?: number[]; // Cylinders with failed / seized pistons [1, 2, 3, 4]
  is_synthetic?: boolean;
}

export interface EngineHealthMetrics {
  health_score_pct: number; // 0 to 100%
  degradation_trend_pct_per_hr: number;
  thermal_health_pct: number;
  mechanical_health_pct: number;
  lubrication_health_pct: number;
  combustion_health_pct: number;
  explanation_factors: HealthFactorExplanation[];
}

export interface HealthFactorExplanation {
  factor: string;
  impact_score: number; // negative impact on health
  parameter: string;
  observed_value: string;
  nominal_range: string;
  description: string;
}

export interface RULPrediction {
  estimated_hours: number;
  lower_bound_hours: number;
  upper_bound_hours: number;
  confidence_pct: number;
  limiting_subsystem: string;
  degradation_rate_per_hr: number;
  projected_failure_mode: string;
  disclaimer: string;
}

export interface EngineFault {
  id: string;
  fault_type: 
    | 'OVERHEATING'
    | 'LOW_OIL_PRESSURE'
    | 'CYLINDER_MISFIRE'
    | 'ABNORMAL_VIBRATION'
    | 'COMBUSTION_INSTABILITY'
    | 'INJECTOR_FAILURE'
    | 'SENSOR_FAILURE'
    | 'PISTON_SEIZURE'
    | 'GENERAL_ANOMALY';
  name: string;
  severity: SeverityLevel;
  detection_time_s: number;
  affected_parameters: string[];
  confidence_pct: number;
  status: 'ACTIVE' | 'RESOLVING' | 'CLEARED';
  root_cause: string;
  recommended_actions: string[];
}

export interface OperationalRecommendation {
  id: string;
  priority: 'IMMEDIATE' | 'CAUTION' | 'SCHEDULED_MAINTENANCE' | 'ADVISORY';
  title: string;
  target_role: 'UAV_OPERATOR' | 'FLIGHT_CONTROLLER' | 'GROUND_CREW';
  action: string;
  system: string;
  expected_outcome: string;
  rationale: string;
  timestamp_s: number;
}

export interface RiskAssessment {
  level: RiskLevel;
  score: number; // 0 to 100
  justification: string;
  critical_drivers: string[];
  mission_abort_recommended: boolean;
}

export interface EngineThresholds {
  cht_warning_C: number;
  cht_critical_C: number;
  egt_warning_C: number;
  egt_critical_C: number;
  oil_pressure_low_warning_bar: number;
  oil_pressure_low_critical_bar: number;
  oil_temp_warning_C: number;
  oil_temp_critical_C: number;
  vibration_warning_g: number;
  vibration_critical_g: number;
  rpm_redline: number;
  battery_low_warning_V: number;
}

export interface SimulationConfig {
  isRunning: boolean;
  isPaused: boolean;
  speedMultiplier: number; // 1, 2, 5, 10
  mode: 'SIMULATION' | 'CSV_REPLAY' | 'WOKWI_LIVE';
  scenario: string;
  duration_s: number;
  current_time_s: number;
  injectedFaults: string[];
  injectedSensorFailures: string[];
  failedPistons?: number[];
}

export interface MissionScenarioPreset {
  id: string;
  name: string;
  description: string;
  environment: {
    altitude_ft: number;
    ambient_temp_C: number;
    throttle_pct: number;
    duration_min: number;
    is_war_scenario: boolean;
    stress_factors: string[];
  };
}

export interface DigitalTwinState {
  telemetry: EngineTelemetry;
  health: EngineHealthMetrics;
  rul: RULPrediction;
  faults: EngineFault[];
  recommendations: OperationalRecommendation[];
  risk: RiskAssessment;
  sensors: Record<string, SensorStatus>;
  telemetryHistory: EngineTelemetry[];
  healthHistory: { timestamp_s: number; health_pct: number; rul_hours: number }[];
  isSyntheticData: boolean;
  activeDatasetName?: string;
}
