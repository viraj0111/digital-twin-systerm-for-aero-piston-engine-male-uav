import { EngineTelemetry } from '../types/engine';

export interface DatasetMeta {
  id: string;
  name: string;
  scenario: string;
  description: string;
  recordCount: number;
  duration_s: number;
  features: string[];
}

export function generateSyntheticFlightData(
  scenarioType: 'nominal' | 'overheat' | 'oil_leak' | 'sensor_fault' | 'misfire',
  points: number = 80
): EngineTelemetry[] {
  const records: EngineTelemetry[] = [];

  for (let i = 0; i < points; i++) {
    const t = i * 5; // 5 second increments
    const progress = i / points;
    
    // Default nominal physics base
    let phase: any = 'CRUISE';
    let alt = 12000;
    let ambTemp = 15;
    let throttle = 68;
    let rpm = 4950 + Math.sin(i * 0.2) * 40 + (Math.random() - 0.5) * 25;
    let cht1 = 112 + Math.sin(i * 0.1) * 2;
    let cht2 = 114 + Math.cos(i * 0.1) * 2;
    let cht3 = 116 + Math.sin(i * 0.15) * 2;
    let cht4 = 113 + Math.cos(i * 0.15) * 2;
    let egt1 = 785 + Math.sin(i * 0.1) * 6;
    let egt2 = 792 + Math.cos(i * 0.1) * 5;
    let egt3 = 798 + Math.sin(i * 0.15) * 6;
    let egt4 = 788 + Math.cos(i * 0.15) * 5;
    let oilTemp = 98 + Math.sin(i * 0.05) * 3;
    let oilPress = 4.2 + Math.sin(i * 0.1) * 0.15;
    let fuelFlow = 22.5 + (throttle / 100) * 8 + (Math.random() - 0.5) * 0.4;
    let vib = 0.85 + Math.sin(i * 0.3) * 0.1;
    let batt = 28.1 + (Math.random() - 0.5) * 0.15;
    let failures: string[] = [];
    let faults: string[] = [];

    // Flight mission phases
    if (i < 10) {
      phase = 'TAKEOFF';
      alt = 1000 + i * 400;
      throttle = 95;
      rpm = 5400 + Math.random() * 30;
      fuelFlow = 31.0;
    } else if (i < 25) {
      phase = 'CLIMB';
      alt = 5000 + (i - 10) * 600;
      throttle = 85;
      rpm = 5200;
      fuelFlow = 27.5;
    } else if (i < 65) {
      phase = 'CRUISE';
      alt = 14000;
      throttle = 68;
    } else {
      phase = 'DESCENT';
      alt = Math.max(2000, 14000 - (i - 65) * 700);
      throttle = 45;
      rpm = 3800;
      fuelFlow = 14.5;
    }

    // Scenario specific injected anomalies
    if (scenarioType === 'overheat' && i >= 30) {
      // Hot day climb causing cooling breakdown & CHT/EGT surge
      const factor = (i - 30) / (points - 30);
      ambTemp = 42;
      cht1 += factor * 32;
      cht2 += factor * 35;
      cht3 += factor * 44; // Cylinder 3 critical
      cht4 += factor * 36;
      egt1 += factor * 90;
      egt2 += factor * 110;
      egt3 += factor * 145;
      egt4 += factor * 100;
      oilTemp += factor * 38;
      oilPress -= factor * 0.8;
      faults.push('OVERHEATING');
      if (cht3 > 148) faults.push('COMBUSTION_INSTABILITY');
    } else if (scenarioType === 'oil_leak' && i >= 25) {
      // Gradual oil gallery pressure drop and mechanical bearing wear
      const factor = (i - 25) / (points - 25);
      oilPress = Math.max(1.2, 4.2 - factor * 2.8);
      oilTemp += factor * 35;
      vib += factor * 2.6; // High vibration from unlubricated bearings
      if (oilPress < 2.5) faults.push('LOW_OIL_PRESSURE');
      if (vib > 1.8) faults.push('ABNORMAL_VIBRATION');
    } else if (scenarioType === 'sensor_fault' && i >= 20) {
      // EGT3 thermocouple disconnects / open-circuits
      failures.push('egt3');
      egt3 = 0; // sensor dead reading
      faults.push('SENSOR_FAILURE');
    } else if (scenarioType === 'misfire' && i >= 28) {
      // Cylinder 3 injector nozzle partially clogged causing lean misfire
      const factor = Math.min(1.0, (i - 28) / 15);
      cht3 -= factor * 22; // cold misfiring cylinder
      egt3 += factor * 130; // afterburning unburnt mixture in exhaust header
      rpm -= factor * 280 + Math.sin(i * 1.5) * 120; // erratic RPM
      vib += factor * 2.3; // heavy rotational imbalance
      faults.push('CYLINDER_MISFIRE');
      faults.push('ABNORMAL_VIBRATION');
    }

    records.push({
      timestamp_s: t,
      mission_phase: phase,
      altitude_ft: Math.round(alt),
      ambient_temp_C: Math.round(ambTemp * 10) / 10,
      throttle_pct: Math.round(throttle),
      rpm: Math.round(rpm),
      cht1_C: Math.round(cht1 * 10) / 10,
      cht2_C: Math.round(cht2 * 10) / 10,
      cht3_C: Math.round(cht3 * 10) / 10,
      cht4_C: Math.round(cht4 * 10) / 10,
      egt1_C: Math.round(egt1 * 10) / 10,
      egt2_C: Math.round(egt2 * 10) / 10,
      egt3_C: Math.round(egt3 * 10) / 10,
      egt4_C: Math.round(egt4 * 10) / 10,
      oil_temp_C: Math.round(oilTemp * 10) / 10,
      oil_pressure_bar: Math.round(oilPress * 100) / 100,
      fuel_flow_L_h: Math.round(fuelFlow * 10) / 10,
      vibration_g: Math.round(vib * 100) / 100,
      battery_V: Math.round(batt * 10) / 10,
      sensor_failures: failures,
      active_faults: faults,
      is_synthetic: true
    });
  }

  return records;
}

export const PRESET_DATASETS: { meta: DatasetMeta; getData: () => EngineTelemetry[] }[] = [
  {
    meta: {
      id: 'ds_nominal',
      name: 'Nominal MALE UAV Long-Endurance Sortie',
      scenario: 'Standard 14,000 ft Mission',
      description: 'Clean baseline demonstration of nominal takeoff, climb, 14,000 ft cruise, and descent without mechanical anomalies.',
      recordCount: 80,
      duration_s: 400,
      features: ['Balanced multi-cylinder CHT/EGT', 'Steady 4.2 bar oil pressure', 'Low vibration < 0.95g']
    },
    getData: () => generateSyntheticFlightData('nominal', 80)
  },
  {
    meta: {
      id: 'ds_overheat',
      name: 'High-Thermal Stress & Cylinder 3 Overheating',
      scenario: 'Hot Ambient Desert Climb (+42°C)',
      description: 'Progressive cooling breakdown during high power ascent. Cylinder 3 CHT breaches 150°C critical limit with EGT surge.',
      recordCount: 80,
      duration_s: 400,
      features: ['Overheat warning at t=160s', 'Cylinder head thermal divergence', 'Dynamic AI load reduction advisory']
    },
    getData: () => generateSyntheticFlightData('overheat', 80)
  },
  {
    meta: {
      id: 'ds_oil_pressure',
      name: 'Lubrication Loss & Mechanical Vibration Anomaly',
      scenario: 'Oil Gallery Seal Leak',
      description: 'Sudden gradual oil pressure drop from 4.2 bar down to 1.4 bar triggering critical warnings and severe bearing vibration harmonics.',
      recordCount: 80,
      duration_s: 400,
      features: ['Oil pressure drop < 2.0 bar', 'Bearing friction temp spike', 'Severe risk level elevation']
    },
    getData: () => generateSyntheticFlightData('oil_leak', 80)
  },
  {
    meta: {
      id: 'ds_sensor_failure',
      name: 'In-Flight EGT3 Sensor Failure & Virtual Sensor Soft-Sensing',
      scenario: 'Thermocouple Open-Circuit',
      description: 'At t=100s, EGT3 thermocouple fails to zero. Anomaly engine detects hardware failure, marks FAILED, and estimates virtual EGT with 95% confidence.',
      recordCount: 80,
      duration_s: 400,
      features: ['Automatic sensor failure isolation', 'AI virtual sensor estimation', 'Continuity of mission without false abort']
    },
    getData: () => generateSyntheticFlightData('sensor_fault', 80)
  },
  {
    meta: {
      id: 'ds_misfire',
      name: 'Cylinder 3 Injector Clog & Dynamic Misfire',
      scenario: 'Combustion Instability',
      description: 'Injector starvation on Cylinder 3 causing lean misfire, RPM hesitation, exhaust backfire, and high torsional vibration.',
      recordCount: 80,
      duration_s: 400,
      features: ['Multi-variate correlation detection', 'RPM instability tracking', 'Cylinder isolation diagnostic']
    },
    getData: () => generateSyntheticFlightData('misfire', 80)
  }
];

// CSV Converter helper
export function telemetryToCsv(telemetryList: EngineTelemetry[]): string {
  const headers = [
    'timestamp_s',
    'mission_phase',
    'altitude_ft',
    'ambient_temp_C',
    'throttle_pct',
    'rpm',
    'cht1_C',
    'cht2_C',
    'cht3_C',
    'cht4_C',
    'egt1_C',
    'egt2_C',
    'egt3_C',
    'egt4_C',
    'oil_temp_C',
    'oil_pressure_bar',
    'fuel_flow_L_h',
    'vibration_g',
    'battery_V',
    'sensor_failure',
    'fault_label',
    'is_synthetic'
  ];

  const rows = telemetryList.map(t => [
    t.timestamp_s,
    t.mission_phase,
    t.altitude_ft,
    t.ambient_temp_C,
    t.throttle_pct,
    t.rpm,
    t.cht1_C,
    t.cht2_C,
    t.cht3_C,
    t.cht4_C,
    t.egt1_C,
    t.egt2_C,
    t.egt3_C,
    t.egt4_C,
    t.oil_temp_C,
    t.oil_pressure_bar,
    t.fuel_flow_L_h,
    t.vibration_g,
    t.battery_V,
    t.sensor_failures.join(';') || 'NONE',
    t.active_faults.join(';') || 'NOMINAL',
    'true'
  ].join(','));

  return [headers.join(','), ...rows].join('\n');
}

export function parseCsvToTelemetry(csvContent: string): EngineTelemetry[] {
  const lines = csvContent.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  const records: EngineTelemetry[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    if (values.length < headers.length) continue;

    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx];
    });

    const num = (key: string, def: number = 0) => {
      const val = parseFloat(row[key]);
      return isNaN(val) ? def : val;
    };

    records.push({
      timestamp_s: num('timestamp_s', i * 5),
      mission_phase: (row['mission_phase'] as any) || 'CRUISE',
      altitude_ft: num('altitude_ft', 12000),
      ambient_temp_C: num('ambient_temp_c', 15),
      throttle_pct: num('throttle_pct', 70),
      rpm: num('rpm', 5000),
      cht1_C: num('cht1_c', num('cht1', 112)),
      cht2_C: num('cht2_c', num('cht2', 114)),
      cht3_C: num('cht3_c', num('cht3', 116)),
      cht4_C: num('cht4_c', num('cht4', 113)),
      egt1_C: num('egt1_c', num('egt1', 785)),
      egt2_C: num('egt2_c', num('egt2', 792)),
      egt3_C: num('egt3_c', num('egt3', 798)),
      egt4_C: num('egt4_c', num('egt4', 788)),
      oil_temp_C: num('oil_temp_c', num('oil_temp', 98)),
      oil_pressure_bar: num('oil_pressure_bar', num('oil_pressure', 4.2)),
      fuel_flow_L_h: num('fuel_flow_l_h', num('fuel_flow', 22.5)),
      vibration_g: num('vibration_g', num('vibration', 0.85)),
      battery_V: num('battery_v', num('battery', 28.1)),
      sensor_failures: (row['sensor_failure'] && row['sensor_failure'] !== 'NONE') ? row['sensor_failure'].split(';') : [],
      active_faults: (row['fault_label'] && row['fault_label'] !== 'NOMINAL') ? row['fault_label'].split(';') : [],
      is_synthetic: true
    });
  }

  return records;
}
