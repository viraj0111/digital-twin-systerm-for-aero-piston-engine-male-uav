export type WarTheatre = 
  | 'LAC_HIMALAYAN'
  | 'DESERT_THAR'
  | 'NOE_RADAR_EVASION'
  | 'CONTESTED_EW'
  | 'DEEP_STRIKE_ENDURANCE'
  | 'CUSTOM';

export type WarFlightVerdict = 'GO' | 'CONDITIONAL_GO' | 'NO_GO';

export interface HistoricalFlightLog {
  id: string;
  code: string;
  name: string;
  theatre: string;
  date: string;
  durationHours: number;
  cumulativeAirframeHours: number;
  peakCht_C: number;
  peakEgt_C: number;
  peakVibration_g: number;
  oilDegradationIndex: number; // 0 to 100
  thermalCyclesCount: number;
  cylinderVariance: {
    cyl1: number;
    cyl2: number;
    cyl3: number;
    cyl4: number;
  };
  carbonDepositIndex: number;
  abnormalEvents: string[];
  maintenanceObservations: string;
}

export interface WarScenarioCondition {
  id: string;
  name: string;
  theatre: WarTheatre;
  badge: string;
  description: string;
  altitude_ft: number;
  ambient_temp_C: number;
  combat_throttle_pct: number;
  mission_duration_hours: number;
  threat_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  dust_sand_index: number; // 0 to 100%
  g_force_envelope: number;
  ew_jamming_active: boolean;
  notes: string;
}

export interface WarAssessmentResult {
  verdict: WarFlightVerdict;
  verdictTitle: string;
  verdictSubtitle: string;
  tacticalVerdictSummary: string;
  safeCombatEnduranceHours: number;
  maxCombatEnvelopeHours: number;
  requiredMissionHours: number;
  enduranceMarginHours: number;
  overallRiskScore: number; // 0 to 100%
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  ifsdProbabilityPct: number;
  wearAccelerationFactor: number; // e.g. 3.2x normal wear
  limitingComponent: {
    subsystem: string;
    component: string;
    projectedTimeToFailureHours: number;
    failureMechanism: string;
    warningSigns: string;
  };
  thermalMargin_C: number;
  oilThermalMargin_C: number;
  projectedValues: {
    peakCht_C: number;
    peakEgt_C: number;
    oilTemp_C: number;
    oilPressure_bar: number;
    vibration_g: number;
    fuelFlow_L_h: number;
    coolingEfficiency_pct: number;
  };
  stressRadar: {
    thermal: number;
    lubrication: number;
    mechanical: number;
    combustion: number;
    induction: number;
  };
  flightEnvelopeRestrictions: string[];
  commanderDirectives: string[];
  maintenanceSOPs: string[];
  aiTacticalBriefing: string;
  aiHinglishExplanation: string;
  evaluatedAt: number;
  modelUsed: string;
}
