import { EngineThresholds, MissionScenarioPreset } from '../types/engine';

export const DEFAULT_THRESHOLDS: EngineThresholds = {
  cht_warning_C: 135,
  cht_critical_C: 150,
  egt_warning_C: 860,
  egt_critical_C: 920,
  oil_pressure_low_warning_bar: 2.2,
  oil_pressure_low_critical_bar: 1.5,
  oil_temp_warning_C: 125,
  oil_temp_critical_C: 140,
  vibration_warning_g: 1.8,
  vibration_critical_g: 3.0,
  rpm_redline: 5800,
  battery_low_warning_V: 24.5,
};

export const MISSION_PRESETS: MissionScenarioPreset[] = [
  {
    id: 'nominal_cruise',
    name: 'Nominal Surveillance Cruise',
    description: 'Standard long-endurance patrol at 12,000 ft with moderate 65% throttle and steady ambient conditions (+15°C).',
    environment: {
      altitude_ft: 12000,
      ambient_temp_C: 15,
      throttle_pct: 65,
      duration_min: 120,
      is_war_scenario: false,
      stress_factors: ['Steady-state thermal balance', 'Nominal fuel economy']
    }
  },
  {
    id: 'hot_desert_takeoff',
    name: 'Hot & High Desert Takeoff',
    description: 'Demanding takeoff at +45°C ambient air, causing severe initial thermal stress on cylinder heads and reduced oil cooling efficiency.',
    environment: {
      altitude_ft: 3500,
      ambient_temp_C: 45,
      throttle_pct: 100,
      duration_min: 30,
      is_war_scenario: false,
      stress_factors: ['High ambient thermal load', 'Restricted cooling delta-T', '100% WOT full-power run']
    }
  },
  {
    id: 'high_altitude_loiter',
    name: 'High-Altitude Thin-Air Loiter',
    description: 'Extended loiter at 22,000 ft near engine ceiling (-25°C ambient). Turbocharger works at maximum boost pressure ratio.',
    environment: {
      altitude_ft: 22000,
      ambient_temp_C: -25,
      throttle_pct: 75,
      duration_min: 180,
      is_war_scenario: false,
      stress_factors: ['Low atmospheric air density', 'High turbo pressure ratio', 'Cold fuel line viscosity']
    }
  },
  {
    id: 'tactical_evasion_war',
    name: 'Tactical Evasion (War Condition)',
    description: 'Demanding combat maneuvering profile: repeated rapid throttle surges from 40% to 100%, high climb angles, and maximum thermal cycling.',
    environment: {
      altitude_ft: 16000,
      ambient_temp_C: 32,
      throttle_pct: 95,
      duration_min: 45,
      is_war_scenario: true,
      stress_factors: ['Aggressive transient load cycling', 'Thermal shock on exhaust headers', 'Elevated crank vibration harmonics']
    }
  },
  {
    id: 'endurance_marathon',
    name: '24-Hour Ultra-Endurance Sortie',
    description: 'Simulates extended MALE UAV perimeter coverage testing cumulative oil breakdown, slight valve seat erosion, and gradual degradation.',
    environment: {
      altitude_ft: 14000,
      ambient_temp_C: 5,
      throttle_pct: 60,
      duration_min: 240,
      is_war_scenario: false,
      stress_factors: ['Long thermal exposure', 'Viscosity shear of oil', 'Continuous high-RPM duty']
    }
  }
];

export const INITIAL_SENSOR_LIST = [
  { id: 'rpm', name: 'Engine RPM', unit: 'RPM', nominal: 5000 },
  { id: 'cht1', name: 'Cylinder 1 CHT', unit: '°C', nominal: 112 },
  { id: 'cht2', name: 'Cylinder 2 CHT', unit: '°C', nominal: 114 },
  { id: 'cht3', name: 'Cylinder 3 CHT', unit: '°C', nominal: 116 },
  { id: 'cht4', name: 'Cylinder 4 CHT', unit: '°C', nominal: 113 },
  { id: 'egt1', name: 'Cylinder 1 EGT', unit: '°C', nominal: 785 },
  { id: 'egt2', name: 'Cylinder 2 EGT', unit: '°C', nominal: 792 },
  { id: 'egt3', name: 'Cylinder 3 EGT', unit: '°C', nominal: 798 },
  { id: 'egt4', name: 'Cylinder 4 EGT', unit: '°C', nominal: 788 },
  { id: 'oil_pressure', name: 'Engine Oil Pressure', unit: 'bar', nominal: 4.2 },
  { id: 'oil_temp', name: 'Engine Oil Temp', unit: '°C', nominal: 98 },
  { id: 'fuel_flow', name: 'Fuel Consumption Rate', unit: 'L/h', nominal: 22.4 },
  { id: 'vibration', name: 'RMS Block Vibration', unit: 'g', nominal: 0.85 },
  { id: 'battery_v', name: '28V Avionics Bus', unit: 'V', nominal: 28.1 }
];
