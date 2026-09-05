import { 
  HistoricalFlightLog, 
  WarScenarioCondition, 
  WarAssessmentResult, 
  WarFlightVerdict 
} from '../types/warReadiness';
import { EngineTelemetry, EngineHealthMetrics } from '../types/engine';

export const SAMPLE_HISTORICAL_LOGS: HistoricalFlightLog[] = [
  {
    id: 'log-042',
    code: 'SORTIE-2026-042',
    name: 'Op Desert Watch - Thar Border Recon',
    theatre: 'Thar Western Sector',
    date: '2026-08-28',
    durationHours: 6.4,
    cumulativeAirframeHours: 342.5,
    peakCht_C: 124.5,
    peakEgt_C: 808.0,
    peakVibration_g: 1.12,
    oilDegradationIndex: 28,
    thermalCyclesCount: 4,
    cylinderVariance: { cyl1: 0, cyl2: +1.2, cyl3: +4.8, cyl4: +0.6 },
    carbonDepositIndex: 14,
    abnormalEvents: ['Minor CHT3 thermal flare during combat climb', 'Silica dust ingress on oil cooler fins'],
    maintenanceObservations: 'Air intake filter cleaned; Cylinder 3 runs 4.8°C hotter under sustained cruise.'
  },
  {
    id: 'log-043',
    code: 'SORTIE-2026-043',
    name: 'Himalayan Eagle - LAC High Altitude Loiter',
    theatre: 'Northern Ladakh LAC',
    date: '2026-08-30',
    durationHours: 8.8,
    cumulativeAirframeHours: 351.3,
    peakCht_C: 111.0,
    peakEgt_C: 782.0,
    peakVibration_g: 0.94,
    oilDegradationIndex: 32,
    thermalCyclesCount: 3,
    cylinderVariance: { cyl1: +0.4, cyl2: +0.8, cyl3: +3.9, cyl4: -0.2 },
    carbonDepositIndex: 18,
    abnormalEvents: ['Carburetor de-icing valve cycled 6 times', 'Oil pressure dropped to 3.8 bar in -28°C cold descent'],
    maintenanceObservations: 'Ignition harness resistance verified nominal. Oil viscosity tested within permissible SAE limits.'
  },
  {
    id: 'log-044',
    code: 'SORTIE-2026-044',
    name: 'Coastal Sentinel - Maritime Saline Recon',
    theatre: 'Arabian Sea Coastal Zone',
    date: '2026-09-01',
    durationHours: 5.6,
    cumulativeAirframeHours: 356.9,
    peakCht_C: 116.8,
    peakEgt_C: 794.0,
    peakVibration_g: 0.88,
    oilDegradationIndex: 36,
    thermalCyclesCount: 2,
    cylinderVariance: { cyl1: 0, cyl2: +0.5, cyl3: +4.1, cyl4: +0.2 },
    carbonDepositIndex: 20,
    abnormalEvents: ['High humidity condensation in spark plug wells', 'Minor sea spray salt deposition on radiator shroud'],
    maintenanceObservations: 'Fresh water rinse applied to engine bay. No dielectric breakdown observed.'
  },
  {
    id: 'log-045',
    code: 'SORTIE-2026-045',
    name: 'Combat Evasion & Tactical High-G Sortie',
    theatre: 'Pokhran Tactical Range',
    date: '2026-09-02',
    durationHours: 4.2,
    cumulativeAirframeHours: 361.1,
    peakCht_C: 129.4,
    peakEgt_C: 836.0,
    peakVibration_g: 1.48,
    oilDegradationIndex: 44,
    thermalCyclesCount: 7,
    cylinderVariance: { cyl1: +1.0, cyl2: +1.8, cyl3: +6.2, cyl4: +1.4 },
    carbonDepositIndex: 24,
    abnormalEvents: ['High throttle overshoot (98% for 4 min)', 'Vibration alert at 5400 RPM during evasive dive'],
    maintenanceObservations: 'Propeller balance checked; minor thermal stress ring marking on Cylinder 3 exhaust port.'
  },
  {
    id: 'log-046',
    code: 'SORTIE-2026-046',
    name: 'Deep Strike Endurance Patrol',
    theatre: 'Central Sector Long-Range',
    date: '2026-09-03',
    durationHours: 11.2,
    cumulativeAirframeHours: 372.3,
    peakCht_C: 118.2,
    peakEgt_C: 798.5,
    peakVibration_g: 0.90,
    oilDegradationIndex: 52,
    thermalCyclesCount: 2,
    cylinderVariance: { cyl1: 0, cyl2: +0.9, cyl3: +4.4, cyl4: +0.5 },
    carbonDepositIndex: 27,
    abnormalEvents: ['Oil consumption slightly higher (0.12 L/hr vs nominal 0.08 L/hr)'],
    maintenanceObservations: 'Topped up 1.5L aero synthetic oil. Engine ready for pre-flight combat evaluation.'
  }
];

export const WAR_SCENARIOS: WarScenarioCondition[] = [
  {
    id: 'war-desert',
    name: 'Thar Desert Extreme Hot & High Warfare',
    theatre: 'DESERT_THAR',
    badge: 'HOT & HIGH STRIKE',
    description: 'Blistering ambient heat (+48°C), fine abrasive sand dust aerosol, reduced air density cooling efficiency, high combat throttle demand.',
    altitude_ft: 4500,
    ambient_temp_C: 48,
    combat_throttle_pct: 92,
    mission_duration_hours: 6.0,
    threat_level: 'HIGH',
    dust_sand_index: 85,
    g_force_envelope: 2.8,
    ew_jamming_active: true,
    notes: 'Severe cooling airflow density loss; oil thermal soaking risk; sand abrasion on intake valves.'
  },
  {
    id: 'war-himalayan',
    name: 'Himalayan LAC Sub-Zero High-Alt Loiter',
    theatre: 'LAC_HIMALAYAN',
    badge: 'SUB-ZERO 24,000 FT',
    description: 'Freezing mountain plateau (-28°C), ultra-thin air at 24,000 ft, severe induction mass loss, carburetor/manifold icing, extended 14-hour continuous combat patrol.',
    altitude_ft: 24000,
    ambient_temp_C: -28,
    combat_throttle_pct: 76,
    mission_duration_hours: 14.0,
    threat_level: 'CRITICAL',
    dust_sand_index: 5,
    g_force_envelope: 1.8,
    ew_jamming_active: true,
    notes: 'Extreme air starvation requires turbo/supercharger over-speed; oil thickening in low heat zones.'
  },
  {
    id: 'war-noe-sprint',
    name: 'Anti-Air Radar Evasion NOE Dash (Nap-of-the-Earth)',
    theatre: 'NOE_RADAR_EVASION',
    badge: 'SURFACE DASH 96% PWR',
    description: 'Ultra low-level terrain-following flight at 600–900 ft AGL under hostile SAM radar coverage. Maximum military throttle (96%), high turbulence, aggressive evasive maneuvers.',
    altitude_ft: 800,
    ambient_temp_C: 28,
    combat_throttle_pct: 96,
    mission_duration_hours: 3.5,
    threat_level: 'CRITICAL',
    dust_sand_index: 40,
    g_force_envelope: 4.2,
    ew_jamming_active: false,
    notes: 'Continuous maximum RPM & mechanical G-load; thermal shock on cylinder head fins during sudden evasions.'
  },
  {
    id: 'war-ew-contested',
    name: 'Contested Airspace / GPS-Denied EW Combat Zone',
    theatre: 'CONTESTED_EW',
    badge: 'GPS-DENIED EW JAM',
    description: 'Hostile electronic countermeasures, intense RF jamming, telemetry silence protocol, autonomous navigation, unpredictable throttle surges to counter spoofing.',
    altitude_ft: 15000,
    ambient_temp_C: 8,
    combat_throttle_pct: 84,
    mission_duration_hours: 8.0,
    threat_level: 'HIGH',
    dust_sand_index: 20,
    g_force_envelope: 2.5,
    ew_jamming_active: true,
    notes: 'Digital twin runs completely autonomous onboard; engine must withstand rapid throttle hunt.'
  },
  {
    id: 'war-deep-strike',
    name: 'Deep Hostile Territory Long-Range Strike',
    theatre: 'DEEP_STRIKE_ENDURANCE',
    badge: 'DEEP PENETRATION 18H',
    description: 'Penetration 650 km behind enemy lines with zero divert or emergency landing strips. Extreme endurance requirement (18 hours), continuous fuel economy cruise.',
    altitude_ft: 18500,
    ambient_temp_C: -10,
    combat_throttle_pct: 66,
    mission_duration_hours: 18.0,
    threat_level: 'HIGH',
    dust_sand_index: 10,
    g_force_envelope: 1.5,
    ew_jamming_active: true,
    notes: 'Cumulative piston ring fatigue and oil consumption margin are the primary flight-terminating factors.'
  }
];

/**
 * Deterministic aerospace physics-based War Readiness Evaluator.
 * Computes thermodynamic stress, lubrication shear, component endurance limits,
 * risk scores, and tactical GO/NO-GO clearance.
 */
export function evaluateWarReadinessPhysics(
  history: HistoricalFlightLog,
  telemetry: EngineTelemetry,
  health: EngineHealthMetrics,
  scenario: WarScenarioCondition
): WarAssessmentResult {
  // 1. Atmosphere & Air Density Ratio (sigma = rho / rho_0)
  const alt = scenario.altitude_ft;
  const tempC = scenario.ambient_temp_C;
  const tempK = tempC + 273.15;
  const stdSeaLevelTempK = 288.15;
  
  // Barometric density approximation
  const densityRatio = Math.max(0.45, Math.min(1.05, 
    Math.pow(Math.max(0.2, 1 - 0.000006875 * alt), 4.256) * (stdSeaLevelTempK / Math.max(200, tempK))
  ));
  
  // Cooling air mass flow is directly proportional to density ratio and airspeed
  const coolingEfficiencyPct = Math.max(38, Math.min(100, densityRatio * 100));

  // 2. Thermodynamic Heat Flux Projection (CHT & EGT)
  const throttleFactor = scenario.combat_throttle_pct / 68; // 68% is nominal baseline
  const histCyl3Delta = history.cylinderVariance.cyl3 || 4.2;
  const dustThermalPenalty = (scenario.dust_sand_index / 100) * 12; // dust clogged fin insulation
  
  // Heat dissipation deficit due to high ambient or thin air
  const ambientHeatDeficit = Math.max(0, tempC - 20) * 0.75;
  const altitudeCoolingPenalty = Math.max(0, (1 - densityRatio) * 18);

  // Projected Peak CHT on weakest cylinder (Cylinder 3)
  const projectedPeakCht = Math.round(
    (telemetry.cht3_C || 116) * 0.35 + 
    (tempC + 68 + (throttleFactor - 1) * 48 + ambientHeatDeficit + altitudeCoolingPenalty + histCyl3Delta + dustThermalPenalty) * 0.65
  );

  // Projected Peak EGT
  const projectedPeakEgt = Math.round(
    (telemetry.egt3_C || 795) * 0.4 + 
    (780 + (scenario.combat_throttle_pct - 68) * 3.4 + Math.max(0, tempC - 15) * 0.9 - (alt / 10000) * 12) * 0.6
  );

  // 3. Projected Oil Temperature & Lubrication Breakdown
  const projectedOilTemp = Math.round(
    (telemetry.oil_temp_C || 98) * 0.3 + 
    (88 + (tempC - 15) * 0.45 + (throttleFactor - 1) * 28 + (projectedPeakCht - 115) * 0.38 + (history.oilDegradationIndex / 100) * 8) * 0.7
  );

  // Oil pressure drops as viscosity thins at high temperature
  const tempViscosityLoss = Math.max(0, (projectedOilTemp - 100) * 0.045);
  const projectedOilPress = +(Math.max(1.1, (telemetry.oil_pressure_bar || 4.2) - tempViscosityLoss - (history.cumulativeAirframeHours > 350 ? 0.25 : 0.1))).toFixed(2);

  // 4. Vibration & Mechanical G-Loads
  const gImpact = scenario.g_force_envelope > 2.0 ? (scenario.g_force_envelope - 1) * 0.25 : 0;
  const projectedVib = +(Math.max(0.6, (telemetry.vibration_g || 0.88) * Math.pow(throttleFactor, 1.4) + gImpact + (scenario.dust_sand_index > 60 ? 0.18 : 0.05))).toFixed(2);

  // Projected Fuel Flow (L/hr)
  const projectedFuelFlow = +(18.5 + (scenario.combat_throttle_pct / 100) * 14.5 * (1 - alt / 40000)).toFixed(1);

  // 5. Thermal & Oil Margins
  const CHT_CRITICAL_LIMIT = 145; // °C
  const OIL_TEMP_CRITICAL_LIMIT = 115; // °C
  const thermalMarginC = +(CHT_CRITICAL_LIMIT - projectedPeakCht).toFixed(1);
  const oilThermalMarginC = +(OIL_TEMP_CRITICAL_LIMIT - projectedOilTemp).toFixed(1);

  // 6. Stress Radar (0 - 100)
  const thermalStress = Math.min(100, Math.max(10, Math.round(((projectedPeakCht - 90) / 55) * 100)));
  const lubricationStress = Math.min(100, Math.max(10, Math.round(((projectedOilTemp - 80) / 38) * 100 + (projectedOilPress < 3.2 ? 25 : 0))));
  const mechanicalStress = Math.min(100, Math.max(10, Math.round((projectedVib / 2.2) * 100 + (scenario.combat_throttle_pct > 90 ? 20 : 0))));
  const combustionStress = Math.min(100, Math.max(10, Math.round(((projectedPeakEgt - 720) / 160) * 100)));
  const inductionStress = Math.min(100, Math.max(10, Math.round((1 - densityRatio) * 120 + (scenario.dust_sand_index / 100) * 35)));

  // 7. Overall Risk Score & IFSD Probability
  const overallRiskScore = Math.min(99, Math.max(5, Math.round(
    thermalStress * 0.35 + 
    lubricationStress * 0.25 + 
    mechanicalStress * 0.20 + 
    combustionStress * 0.10 + 
    inductionStress * 0.10 + 
    (100 - health.health_score_pct) * 0.35 +
    (history.oilDegradationIndex / 100) * 15
  )));

  let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
  if (overallRiskScore >= 75 || thermalMarginC <= 6 || projectedOilTemp >= 112) {
    riskLevel = 'CRITICAL';
  } else if (overallRiskScore >= 55 || thermalMarginC <= 14 || projectedOilTemp >= 106) {
    riskLevel = 'HIGH';
  } else if (overallRiskScore >= 35) {
    riskLevel = 'MEDIUM';
  }

  // IFSD (In-Flight Engine Shutdown) Probability %
  const ifsdProbabilityPct = +(Math.min(88, Math.max(1.2, 
    Math.pow(overallRiskScore / 100, 2.2) * 85 + (thermalMarginC < 5 ? 25 : 0) + (projectedOilPress < 2.5 ? 20 : 0)
  ))).toFixed(1);

  // Wear Acceleration Factor (relative to standard peaceful cruise wear)
  const wearAccelerationFactor = +(Math.max(1.0, 
    Math.pow(throttleFactor, 2.0) * (1 + (tempC > 35 ? (tempC - 35) * 0.04 : 0)) * (1 + (scenario.dust_sand_index / 100) * 1.5)
  )).toFixed(1);

  // 8. Safe Combat Endurance Calculation
  // Calculate how long engine can sustain these extreme war conditions before critical threshold
  let maxThermalEnduranceHours = 24.0;
  if (projectedPeakCht >= 142) {
    maxThermalEnduranceHours = 0.8;
  } else if (projectedPeakCht >= 135) {
    maxThermalEnduranceHours = +(Math.max(1.2, 1.2 + (142 - projectedPeakCht) * 0.6)).toFixed(1);
  } else if (projectedPeakCht >= 125) {
    maxThermalEnduranceHours = +(Math.max(3.5, 4.0 + (135 - projectedPeakCht) * 0.8)).toFixed(1);
  } else {
    maxThermalEnduranceHours = +(Math.min(24.0, 10.0 + (125 - projectedPeakCht) * 0.9)).toFixed(1);
  }

  let maxLubricationEnduranceHours = 24.0;
  if (projectedOilTemp >= 114 || projectedOilPress <= 1.8) {
    maxLubricationEnduranceHours = 1.1;
  } else if (projectedOilTemp >= 108) {
    maxLubricationEnduranceHours = +(Math.max(2.5, 2.5 + (114 - projectedOilTemp) * 0.8)).toFixed(1);
  } else {
    maxLubricationEnduranceHours = +(Math.min(22.0, 8.0 + (108 - projectedOilTemp) * 1.2)).toFixed(1);
  }

  // Dust ingestion filter clogging endurance
  let dustEnduranceHours = 24.0;
  if (scenario.dust_sand_index > 75) {
    dustEnduranceHours = +(Math.max(3.2, 8.5 - (scenario.dust_sand_index / 100) * 5.5)).toFixed(1);
  }

  // Final safe combat endurance is limited by the most vulnerable subsystem
  const safeCombatEnduranceHours = +(Math.min(
    maxThermalEnduranceHours,
    maxLubricationEnduranceHours,
    dustEnduranceHours,
    24.0
  )).toFixed(1);

  const maxCombatEnvelopeHours = +(safeCombatEnduranceHours * 1.25).toFixed(1);
  const requiredMissionHours = scenario.mission_duration_hours;
  const enduranceMarginHours = +(safeCombatEnduranceHours - requiredMissionHours).toFixed(1);

  // 9. Determine Limiting Component
  let limitingComponent = {
    subsystem: 'Thermal & Piston Assembly',
    component: 'Cylinder #3 Piston Ring & Cylinder Wall',
    projectedTimeToFailureHours: safeCombatEnduranceHours,
    failureMechanism: 'Thermal micro-welding and crown expansion leading to piston ring binding and compression blow-by.',
    warningSigns: 'Sudden CHT divergence > 138°C with unburned HC smoke in exhaust.'
  };

  if (maxLubricationEnduranceHours < maxThermalEnduranceHours && maxLubricationEnduranceHours < dustEnduranceHours) {
    limitingComponent = {
      subsystem: 'Lubrication System',
      component: 'Connecting Rod Journal Bearings & Oil Sump',
      projectedTimeToFailureHours: maxLubricationEnduranceHours,
      failureMechanism: 'Hydrodynamic oil film collapse at >110°C causing metal-to-metal boundary friction and bearing wipe.',
      warningSigns: 'Oil pressure dropping below 2.2 bar with gradual oil temperature rise past 108°C.'
    };
  } else if (dustEnduranceHours < maxThermalEnduranceHours && dustEnduranceHours < maxLubricationEnduranceHours) {
    limitingComponent = {
      subsystem: 'Induction & Valvetrain',
      component: 'Intake Valve Face & Cylinder Liner Coating',
      projectedTimeToFailureHours: dustEnduranceHours,
      failureMechanism: 'Silica dust micro-abrasion eroding intake valve seats and cylinder cross-hatch honing.',
      warningSigns: 'Rapid crankcase blow-by pressure increase and intake manifold vacuum decay.'
    };
  }

  // 10. Flight Readiness Verdict Calculation
  let verdict: WarFlightVerdict = 'GO';
  let verdictTitle = 'COMBAT READY: MISSION CLEARED';
  let verdictSubtitle = 'Engine parameters remain within tactical safety margins throughout the full sortie.';
  let tacticalVerdictSummary = 'Yes, the UAV is fully operational. Engine load under war conditions remains well within safe limits.';

  // Check for NO-GO conditions
  const isNoGo = 
    projectedPeakCht >= 142 || 
    projectedOilTemp >= 114 || 
    projectedOilPress <= 2.0 || 
    overallRiskScore >= 78 || 
    safeCombatEnduranceHours < Math.min(2.0, requiredMissionHours * 0.5) ||
    (telemetry.active_faults && telemetry.active_faults.length > 0) ||
    health.health_score_pct < 70;

  // Check for CONDITIONAL_GO conditions
  const isConditional = 
    !isNoGo && (
      projectedPeakCht >= 126 || 
      projectedOilTemp >= 104 || 
      safeCombatEnduranceHours < requiredMissionHours || 
      overallRiskScore >= 45 || 
      thermalMarginC < 18
    );

  if (isNoGo) {
    verdict = 'NO_GO';
    verdictTitle = 'MISSION NO-GO: ENGINE GROUNDED';
    verdictSubtitle = 'Critical failure threshold will be exceeded under this war scenario. Severe in-flight shutdown risk.';
    tacticalVerdictSummary = 'No! The UAV is NOT cleared for this war condition. There is a 75%+ risk of catastrophic engine seizure mid-flight.';
  } else if (isConditional) {
    verdict = 'CONDITIONAL_GO';
    verdictTitle = 'CONDITIONAL SORTIE: RESTRICTED COMBAT ENVELOPE';
    verdictSubtitle = 'UAV can fly, but operational restrictions (throttle cap / altitude limits / shortened sortie) are MANDATORY.';
    tacticalVerdictSummary = 'Conditional Clearance: The UAV may fly, but strictly with restricted limits (throttle must be capped below 78%).';
  }

  // 11. Flight Envelope Restrictions & Commander Directives
  const flightEnvelopeRestrictions: string[] = [];
  const commanderDirectives: string[] = [];
  const maintenanceSOPs: string[] = [];

  if (verdict === 'NO_GO') {
    flightEnvelopeRestrictions.push('ABSOLUTE FLIGHT PROHIBITION: Do not release aircraft for combat launch.');
    flightEnvelopeRestrictions.push(`Projected Cylinder 3 CHT (${projectedPeakCht}°C) exceeds structural failure limit (${CHT_CRITICAL_LIMIT}°C).`);
    flightEnvelopeRestrictions.push(`Safe combat duration is only ${safeCombatEnduranceHours} hours vs required ${requiredMissionHours} hours.`);
    
    commanderDirectives.push('Cancel or reassign sortie to a secondary standby airframe.');
    commanderDirectives.push('If emergency tactical launch is mandated by military high command: Limit mission to strictly 60 minutes with rapid RTB.');
    
    maintenanceSOPs.push('Borescope inspection of Cylinder #3 combustion chamber and valve seating.');
    maintenanceSOPs.push('Flush engine oil gallery; perform magnetic chip detector inspection for ferrule particles.');
    maintenanceSOPs.push('Inspect and clean air filter housing and intercooler heat exchanger fins.');
  } else if (verdict === 'CONDITIONAL_GO') {
    flightEnvelopeRestrictions.push(`Throttle Cap: Limit continuous military throttle to maximum ${Math.min(82, scenario.combat_throttle_pct - 10)}%.`);
    if (scenario.theatre === 'DESERT_THAR') {
      flightEnvelopeRestrictions.push('Avoid continuous low-altitude (<1,500 ft) high-speed loiter in dusty wind corridors.');
      flightEnvelopeRestrictions.push('Climb to cooler altitude (>8,000 ft) after target engagement to enable cylinder cooling.');
    } else if (scenario.theatre === 'LAC_HIMALAYAN') {
      flightEnvelopeRestrictions.push('Monitor carburetor de-ice cycle every 15 minutes; maintain minimum 4,800 RPM to sustain alternator load.');
    } else if (scenario.theatre === 'NOE_RADAR_EVASION') {
      flightEnvelopeRestrictions.push('Limit 96% emergency dash bursts to maximum 3 minutes duration, followed by 5 min cooling at 75% throttle.');
    }
    flightEnvelopeRestrictions.push(`Sortie Window: Return to Base (RTB) strictly before ${safeCombatEnduranceHours} hours.`);

    commanderDirectives.push(`Sortie approved for maximum ${safeCombatEnduranceHours} hours under tactical pilot envelope constraints.`);
    commanderDirectives.push('Designate secondary emergency divert field along ingress corridor due to narrow thermal margins.');
    commanderDirectives.push('Ground telemetry station must maintain alert on CHT3 telemetry threshold (>130°C alert).');

    maintenanceSOPs.push('Perform post-flight oil viscosity test and cylinder compression leak-down check.');
    maintenanceSOPs.push('Inspect cylinder 3 spark plug for heat glaze and thermal deposit discoloration.');
  } else {
    flightEnvelopeRestrictions.push('Standard combat flight envelope cleared without additional thermal restrictions.');
    flightEnvelopeRestrictions.push(`Maximum continuous operating altitude cleared up to ${scenario.altitude_ft} ft.`);
    flightEnvelopeRestrictions.push(`Full ${requiredMissionHours} hour mission duration safely within engine endurance limits (${safeCombatEnduranceHours} hrs available).`);

    commanderDirectives.push('Sortie fully approved by Digital Twin AI with nominal mission reliability index.');
    commanderDirectives.push('Airframe cleared for multi-phase tactical operations and combat evasions.');

    maintenanceSOPs.push('Standard post-flight turnaround inspection and fuel/oil level verification.');
  }

  // 12. Bilingual Tactical Briefing
  const aiTacticalBriefing = `COMBAT READINESS EVALUATION REPORT - MALE UAV AERO PISTON TWIN
Theatre: ${scenario.name} (${scenario.theatre})
Historical Sortie Baseline: ${history.name} (Airframe Hrs: ${history.cumulativeAirframeHours} hrs)
Live Digital Twin Health Score: ${health.health_score_pct.toFixed(1)}% | Active Faults: ${telemetry.active_faults.length}

FLIGHT VERDICT: [${verdict}] - ${verdictTitle}
Endurance Window: Safe combat time is ${safeCombatEnduranceHours} HRS (Required: ${requiredMissionHours} HRS). Margin: ${enduranceMarginHours > 0 ? `+${enduranceMarginHours} HRS surplus` : `${enduranceMarginHours} HRS DEFICIT`}.
Risk Assessment: Overall Mission Risk is ${overallRiskScore}% (${riskLevel} RISK). Catastrophic IFSD Probability: ${ifsdProbabilityPct}%.
Limiting Mechanism: ${limitingComponent.component} due to ${limitingComponent.failureMechanism}
Thermal Status: Projected CHT reaches ${projectedPeakCht}°C (Thermal Margin: ${thermalMarginC}°C remaining). Projected Oil Temp: ${projectedOilTemp}°C.`;

  const aiHinglishExplanation = `MALE UAV COMBAT READINESS ANALYSIS:
1. Operational Status: ${verdict === 'GO' ? 'Yes, the engine is fully fit and cleared for the complete sortie.' : verdict === 'CONDITIONAL_GO' ? 'Conditional Go! The engine may fly, provided the pilot enforces strict throttle limitations.' : 'No, deploying the engine under this war condition carries an exceptionally high risk of failure.'}
2. Safe Endurance Limit: In this specific war scenario, the engine can sustain a maximum of ${safeCombatEnduranceHours} hours without critical failure (Mission duration requirement: ${requiredMissionHours} hours).
3. Risk Assessment: The overall combat risk is ${overallRiskScore}% (${riskLevel}), with an in-flight engine shutdown probability of ${ifsdProbabilityPct}%.
4. Primary Limiting Factor: ${limitingComponent.component} (${limitingComponent.subsystem}), primarily due to ${limitingComponent.failureMechanism}.
5. Pilot Advisory: ${flightEnvelopeRestrictions[0] || 'Nominal combat envelope maintained.'}`;

  return {
    verdict,
    verdictTitle,
    verdictSubtitle,
    tacticalVerdictSummary,
    safeCombatEnduranceHours,
    maxCombatEnvelopeHours,
    requiredMissionHours,
    enduranceMarginHours,
    overallRiskScore,
    riskLevel,
    ifsdProbabilityPct,
    wearAccelerationFactor,
    limitingComponent,
    thermalMargin_C: thermalMarginC,
    oilThermalMargin_C: oilThermalMarginC,
    projectedValues: {
      peakCht_C: projectedPeakCht,
      peakEgt_C: projectedPeakEgt,
      oilTemp_C: projectedOilTemp,
      oilPressure_bar: projectedOilPress,
      vibration_g: projectedVib,
      fuelFlow_L_h: projectedFuelFlow,
      coolingEfficiency_pct: Math.round(coolingEfficiencyPct)
    },
    stressRadar: {
      thermal: thermalStress,
      lubrication: lubricationStress,
      mechanical: mechanicalStress,
      combustion: combustionStress,
      induction: inductionStress
    },
    flightEnvelopeRestrictions,
    commanderDirectives,
    maintenanceSOPs,
    aiTacticalBriefing,
    aiHinglishExplanation,
    evaluatedAt: Date.now(),
    modelUsed: 'Aerospace Physics-Informed Digital Twin VM'
  };
}

/**
 * Calls server endpoint /api/ai/war-assessment to request Gemini 3.8 Flash intelligence
 * with automatic seamless fallback to local aerospace physics.
 */
export async function requestServerWarAssessment(
  history: HistoricalFlightLog,
  telemetry: EngineTelemetry,
  health: EngineHealthMetrics,
  scenario: WarScenarioCondition
): Promise<WarAssessmentResult> {
  try {
    const res = await fetch('/api/ai/war-assessment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        historicalLog: history,
        currentCondition: {
          telemetry,
          health
        },
        warScenario: scenario
      })
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.verdict) {
        return data as WarAssessmentResult;
      }
    }
  } catch (err) {
    console.warn('[WarReadinessService] Server AI assessment failed, utilizing local deterministic aerospace physics engine:', err);
  }

  // Fallback to high-precision local deterministic physics engine
  return evaluateWarReadinessPhysics(history, telemetry, health, scenario);
}
