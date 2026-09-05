import {
  EngineTelemetry,
  DigitalTwinState,
  SimulationConfig,
  MissionPhase,
  EngineThresholds
} from '../types/engine';
import { AiEngine } from './aiEngine';
import { DEFAULT_THRESHOLDS } from '../data/constants';
import { PRESET_DATASETS } from '../data/datasets';

export class DigitalTwinService {
  private aiEngine: AiEngine;
  private state: DigitalTwinState;
  private config: SimulationConfig;
  private simulationInterval: any = null;
  private subscribers: ((state: DigitalTwinState) => void)[] = [];
  
  // Track last known healthy physical sensor readings before failure
  private lastHealthySensorValues: Record<string, number> = {};

  // Replay mode buffer
  private replayDataset: EngineTelemetry[] = [];
  private replayIndex: number = 0;

  constructor(thresholds: EngineThresholds = DEFAULT_THRESHOLDS) {
    this.aiEngine = new AiEngine(thresholds);
    
    // Initial nominal state
    const initialTelemetry: EngineTelemetry = {
      timestamp_s: 0,
      mission_phase: 'CRUISE',
      altitude_ft: 12500,
      ambient_temp_C: 14.5,
      throttle_pct: 68,
      rpm: 4980,
      cht1_C: 112.4,
      cht2_C: 114.1,
      cht3_C: 115.8,
      cht4_C: 113.2,
      egt1_C: 786.0,
      egt2_C: 791.5,
      egt3_C: 797.2,
      egt4_C: 789.0,
      oil_temp_C: 98.4,
      oil_pressure_bar: 4.25,
      fuel_flow_L_h: 22.8,
      vibration_g: 0.88,
      battery_V: 28.1,
      sensor_failures: [],
      active_faults: [],
      is_synthetic: true
    };

    this.lastHealthySensorValues = {
      rpm: 4980,
      cht1: 112.4,
      cht2: 114.1,
      cht3: 115.8,
      cht4: 113.2,
      egt1: 786.0,
      egt2: 791.5,
      egt3: 797.2,
      egt4: 789.0,
      oil_pressure: 4.25,
      oil_temp: 98.4,
      fuel_flow: 22.8,
      vibration: 0.88,
      battery_v: 28.1
    };

    const { cleanTelemetry, sensorStatuses } = this.aiEngine.evaluateSensors(
      initialTelemetry, 
      [], 
      this.lastHealthySensorValues
    );
    const health = this.aiEngine.estimateHealth(cleanTelemetry, []);
    const faults = this.aiEngine.detectFaults(cleanTelemetry, health);
    const rul = this.aiEngine.predictRUL(health, cleanTelemetry, faults);
    const recommendations = this.aiEngine.generateRecommendations(faults, health, cleanTelemetry);
    const risk = this.aiEngine.assessRisk(health, rul, faults, cleanTelemetry);

    this.state = {
      telemetry: cleanTelemetry,
      health,
      rul,
      faults,
      recommendations,
      risk,
      sensors: sensorStatuses,
      telemetryHistory: [cleanTelemetry],
      healthHistory: [{ timestamp_s: 0, health_pct: health.health_score_pct, rul_hours: rul.estimated_hours }],
      isSyntheticData: true,
      activeDatasetName: 'Internal Digital Twin Model'
    };

    this.config = {
      isRunning: true,
      isPaused: false,
      speedMultiplier: 1,
      mode: 'SIMULATION',
      scenario: 'nominal_cruise',
      duration_s: 3600,
      current_time_s: 0,
      injectedFaults: [],
      injectedSensorFailures: [],
      failedPistons: []
    };

    // Auto-start simulation loop on initialization
    this.startSimulation();
  }

  public subscribe(cb: (state: DigitalTwinState) => void): () => void {
    this.subscribers.push(cb);
    cb(this.state);
    return () => {
      this.subscribers = this.subscribers.filter(s => s !== cb);
    };
  }

  private notify() {
    this.subscribers.forEach(cb => cb(this.state));
  }

  public getState(): DigitalTwinState {
    return this.state;
  }

  public getConfig(): SimulationConfig {
    return this.config;
  }

  public updateThresholds(newThresholds: EngineThresholds) {
    this.aiEngine.updateThresholds(newThresholds);
    this.recalculateState();
  }

  /**
   * Start or resume simulation loop
   */
  public start() {
    this.startSimulation();
  }

  public pause() {
    this.pauseSimulation();
  }

  public reset() {
    this.resetSimulation();
  }

  public setEnvironment(inputs: {
    altitude_ft?: number;
    ambient_temp_C?: number;
    throttle_pct?: number;
    mission_phase?: MissionPhase;
  }) {
    this.setEnvironmentalInputs(inputs);
  }

  public clearFaults() {
    this.clearAllFaults();
  }

  public restoreAllSensors() {
    this.config.injectedSensorFailures = [];
    this.recalculateState();
  }

  public setMode(mode: 'SIMULATION' | 'CSV_REPLAY' | 'WOKWI_LIVE') {
    this.config.mode = mode;
    this.state.isSyntheticData = (mode === 'SIMULATION');
    this.notify();
  }

  public ingestExternalTelemetry(rawTelemetry: any) {
    const normalized = this.normalizeExternalTelemetry(rawTelemetry);
    this.state.isSyntheticData = false;
    this.ingestTelemetry(normalized);
  }

  public normalizeExternalTelemetry(raw: any): Partial<EngineTelemetry> {
    if (!raw || typeof raw !== 'object') return {};

    const res: Partial<EngineTelemetry> = {};

    // RPM / Speed
    const rpmVal = raw.rpm ?? raw.RPM ?? raw.speed ?? raw.engine_speed;
    if (rpmVal !== undefined && !isNaN(Number(rpmVal))) res.rpm = Number(rpmVal);

    // Throttle %
    const thVal = raw.throttle_pct ?? raw.throttle ?? raw.th ?? raw.throttle_pos;
    if (thVal !== undefined && !isNaN(Number(thVal))) res.throttle_pct = Number(thVal);

    // Cylinder Head Temperature (CHT)
    const cht1Val = raw.cht1_C ?? raw.cht_C ?? raw.cht1 ?? raw.cht ?? raw.temp ?? raw.temperature ?? raw.temp_C;
    if (cht1Val !== undefined && !isNaN(Number(cht1Val))) {
      const t = Number(cht1Val);
      res.cht1_C = t;
      res.cht2_C = (raw.cht2_C !== undefined && !isNaN(Number(raw.cht2_C))) ? Number(raw.cht2_C) : +(t + 1.2).toFixed(1);
      res.cht3_C = (raw.cht3_C !== undefined && !isNaN(Number(raw.cht3_C))) ? Number(raw.cht3_C) : +(t + 2.5).toFixed(1);
      res.cht4_C = (raw.cht4_C !== undefined && !isNaN(Number(raw.cht4_C))) ? Number(raw.cht4_C) : +(t + 0.8).toFixed(1);
    }

    // Exhaust Gas Temperature (EGT)
    const egt1Val = raw.egt1_C ?? raw.egt_C ?? raw.egt1 ?? raw.egt;
    if (egt1Val !== undefined && !isNaN(Number(egt1Val))) {
      const eg = Number(egt1Val);
      res.egt1_C = eg;
      res.egt2_C = (raw.egt2_C !== undefined && !isNaN(Number(raw.egt2_C))) ? Number(raw.egt2_C) : +(eg + 5.0).toFixed(1);
      res.egt3_C = (raw.egt3_C !== undefined && !isNaN(Number(raw.egt3_C))) ? Number(raw.egt3_C) : +(eg + 11.0).toFixed(1);
      res.egt4_C = (raw.egt4_C !== undefined && !isNaN(Number(raw.egt4_C))) ? Number(raw.egt4_C) : +(eg + 3.0).toFixed(1);
    }

    // Oil Pressure (bar)
    const opVal = raw.oil_pressure_bar ?? raw.oil_pressure ?? raw.pressure ?? raw.oil_press ?? raw.oil_bar;
    if (opVal !== undefined && !isNaN(Number(opVal))) res.oil_pressure_bar = Number(opVal);

    // Oil Temperature (C)
    const otVal = raw.oil_temp_C ?? raw.oil_temp ?? raw.oilTemp;
    if (otVal !== undefined && !isNaN(Number(otVal))) res.oil_temp_C = Number(otVal);

    // Fuel Flow (L/h)
    const ffVal = raw.fuel_flow_L_h ?? raw.fuel_flow ?? raw.fuelFlow;
    if (ffVal !== undefined && !isNaN(Number(ffVal))) res.fuel_flow_L_h = Number(ffVal);

    // Vibration (g)
    const vibVal = raw.vibration_g ?? raw.vibration ?? raw.vib;
    if (vibVal !== undefined && !isNaN(Number(vibVal))) res.vibration_g = Number(vibVal);

    // Battery (V)
    const batVal = raw.battery_V ?? raw.battery ?? raw.voltage ?? raw.volt;
    if (batVal !== undefined && !isNaN(Number(batVal))) res.battery_V = Number(batVal);

    // Altitude (ft)
    const altVal = raw.altitude_ft ?? raw.altitude ?? raw.alt;
    if (altVal !== undefined && !isNaN(Number(altVal))) res.altitude_ft = Number(altVal);

    // Timestamp
    if (raw.timestamp_s !== undefined && !isNaN(Number(raw.timestamp_s))) {
      res.timestamp_s = Number(raw.timestamp_s);
    }

    // Mission Phase
    if (typeof raw.mission_phase === 'string') {
      res.mission_phase = raw.mission_phase;
    }

    return res;
  }

  public startSimulation() {
    if (this.simulationInterval) clearInterval(this.simulationInterval);
    this.config.isRunning = true;
    this.config.isPaused = false;

    const baseIntervalMs = 1000;
    this.simulationInterval = setInterval(() => {
      this.tick();
    }, baseIntervalMs / this.config.speedMultiplier);

    this.notify();
  }

  public pauseSimulation() {
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }
    this.config.isRunning = false;
    this.config.isPaused = true;
    this.notify();
  }

  public resetSimulation() {
    this.pauseSimulation();
    this.config.current_time_s = 0;
    this.config.injectedFaults = [];
    this.config.injectedSensorFailures = [];
    this.replayIndex = 0;
    
    // Reset to nominal initial telemetry
    const initialTelemetry: EngineTelemetry = {
      timestamp_s: 0,
      mission_phase: 'CRUISE',
      altitude_ft: 12500,
      ambient_temp_C: 14.5,
      throttle_pct: 68,
      rpm: 4980,
      cht1_C: 112.4,
      cht2_C: 114.1,
      cht3_C: 115.8,
      cht4_C: 113.2,
      egt1_C: 786.0,
      egt2_C: 791.5,
      egt3_C: 797.2,
      egt4_C: 789.0,
      oil_temp_C: 98.4,
      oil_pressure_bar: 4.25,
      fuel_flow_L_h: 22.8,
      vibration_g: 0.88,
      battery_V: 28.1,
      sensor_failures: [],
      active_faults: [],
      is_synthetic: true
    };

    const { cleanTelemetry, sensorStatuses } = this.aiEngine.evaluateSensors(initialTelemetry, []);
    const health = this.aiEngine.estimateHealth(cleanTelemetry, []);
    const faults = this.aiEngine.detectFaults(cleanTelemetry, health);
    const rul = this.aiEngine.predictRUL(health, cleanTelemetry, faults);
    const recommendations = this.aiEngine.generateRecommendations(faults, health, cleanTelemetry);
    const risk = this.aiEngine.assessRisk(health, rul, faults, cleanTelemetry);

    this.state = {
      telemetry: cleanTelemetry,
      health,
      rul,
      faults,
      recommendations,
      risk,
      sensors: sensorStatuses,
      telemetryHistory: [cleanTelemetry],
      healthHistory: [{ timestamp_s: 0, health_pct: health.health_score_pct, rul_hours: rul.estimated_hours }],
      isSyntheticData: true,
      activeDatasetName: 'Internal Digital Twin Model'
    };

    this.notify();
  }

  public setSpeed(multiplier: number) {
    this.config.speedMultiplier = multiplier;
    if (this.config.isRunning) {
      this.startSimulation();
    }
  }

  public setEnvironmentalInputs(inputs: {
    altitude_ft?: number;
    ambient_temp_C?: number;
    throttle_pct?: number;
    mission_phase?: MissionPhase;
  }) {
    if (inputs.altitude_ft !== undefined) this.state.telemetry.altitude_ft = inputs.altitude_ft;
    if (inputs.ambient_temp_C !== undefined) this.state.telemetry.ambient_temp_C = inputs.ambient_temp_C;
    if (inputs.throttle_pct !== undefined) this.state.telemetry.throttle_pct = inputs.throttle_pct;
    if (inputs.mission_phase !== undefined) {
      if (this.state.telemetry.mission_phase !== inputs.mission_phase) {
        this.clearAllFaults();
      }
      this.state.telemetry.mission_phase = inputs.mission_phase;
    }
    this.recalculateState();
  }

  /**
   * Inject or toggle faults
   */
  public injectFault(faultType: string) {
    if (!this.config.injectedFaults.includes(faultType)) {
      this.config.injectedFaults.push(faultType);
    } else {
      this.config.injectedFaults = this.config.injectedFaults.filter(f => f !== faultType);
    }
    this.recalculateState();
  }

  public clearAllFaults() {
    this.config.injectedFaults = [];
    this.config.injectedSensorFailures = [];
    this.config.failedPistons = [];
    this.recalculateState();
  }

  public resolveFault(faultId: string) {
    this.config.injectedFaults = this.config.injectedFaults.filter(f => f !== faultId && !faultId.toLowerCase().includes(f.toLowerCase()));
    this.config.injectedSensorFailures = this.config.injectedSensorFailures.filter(s => !faultId.toLowerCase().includes(s.toLowerCase()));
    
    // Normalize telemetry to healthy nominal ranges so faults don't immediately re-trigger
    const tel = this.state.telemetry;
    tel.cht1_C = 112.0;
    tel.cht2_C = 114.0;
    tel.cht3_C = 113.0;
    tel.cht4_C = 115.0;
    tel.oil_pressure_bar = 4.5;
    tel.oil_temp_C = 92.0;
    tel.vibration_g = 0.65;
    tel.rpm = 4500;
    
    this.recalculateState();
  }

  public resolveAllFaults() {
    this.clearAllFaults();
    const tel = this.state.telemetry;
    tel.cht1_C = 112.0;
    tel.cht2_C = 114.0;
    tel.cht3_C = 113.0;
    tel.cht4_C = 115.0;
    tel.oil_pressure_bar = 4.5;
    tel.oil_temp_C = 92.0;
    tel.vibration_g = 0.65;
    tel.rpm = 4500;
    this.recalculateState();
  }

  /**
   * Toggle mechanical failure / seizure of a specific piston (Cylinder 1, 2, 3, or 4)
   */
  public togglePistonFailure(cylinderNum: number) {
    if (!this.config.failedPistons) {
      this.config.failedPistons = [];
    }
    if (this.config.failedPistons.includes(cylinderNum)) {
      this.config.failedPistons = this.config.failedPistons.filter(c => c !== cylinderNum);
      if (this.config.failedPistons.length === 0) {
        this.config.injectedFaults = this.config.injectedFaults.filter(f => f !== 'PISTON_SEIZURE');
      }
    } else {
      this.config.failedPistons.push(cylinderNum);
      if (!this.config.injectedFaults.includes('PISTON_SEIZURE')) {
        this.config.injectedFaults.push('PISTON_SEIZURE');
      }
    }
    this.recalculateState();
  }

  /**
   * Restore all pistons to active nominal reciprocation
   */
  public restoreAllPistons() {
    this.config.failedPistons = [];
    this.config.injectedFaults = this.config.injectedFaults.filter(f => f !== 'PISTON_SEIZURE');
    this.recalculateState();
  }

  /**
   * Fail a specific sensor
   */
  public toggleSensorFailure(sensorId: string) {
    if (!this.config.injectedSensorFailures.includes(sensorId)) {
      this.config.injectedSensorFailures.push(sensorId);
    } else {
      this.config.injectedSensorFailures = this.config.injectedSensorFailures.filter(id => id !== sensorId);
    }
    this.recalculateState();
  }

  /**
   * Load dataset for replay
   */
  public loadReplayDataset(dataset: EngineTelemetry[], name: string) {
    this.pauseSimulation();
    this.config.mode = 'CSV_REPLAY';
    this.replayDataset = dataset;
    this.replayIndex = 0;
    this.state.activeDatasetName = name;

    if (dataset.length > 0) {
      this.ingestTelemetry(dataset[0]);
    }
  }

  /**
   * Ingest external packet (e.g. from Wokwi ESP32 or external script)
   */
  public ingestTelemetry(rawTelemetry: Partial<EngineTelemetry>) {
    const prev = this.state.telemetry;
    const merged: EngineTelemetry = {
      timestamp_s: rawTelemetry.timestamp_s ?? prev.timestamp_s + 1,
      mission_phase: rawTelemetry.mission_phase ?? prev.mission_phase,
      altitude_ft: rawTelemetry.altitude_ft ?? prev.altitude_ft,
      ambient_temp_C: rawTelemetry.ambient_temp_C ?? prev.ambient_temp_C,
      throttle_pct: rawTelemetry.throttle_pct ?? prev.throttle_pct,
      rpm: rawTelemetry.rpm ?? prev.rpm,
      cht1_C: rawTelemetry.cht1_C ?? prev.cht1_C,
      cht2_C: rawTelemetry.cht2_C ?? prev.cht2_C,
      cht3_C: rawTelemetry.cht3_C ?? prev.cht3_C,
      cht4_C: rawTelemetry.cht4_C ?? prev.cht4_C,
      egt1_C: rawTelemetry.egt1_C ?? prev.egt1_C,
      egt2_C: rawTelemetry.egt2_C ?? prev.egt2_C,
      egt3_C: rawTelemetry.egt3_C ?? prev.egt3_C,
      egt4_C: rawTelemetry.egt4_C ?? prev.egt4_C,
      oil_temp_C: rawTelemetry.oil_temp_C ?? prev.oil_temp_C,
      oil_pressure_bar: rawTelemetry.oil_pressure_bar ?? prev.oil_pressure_bar,
      fuel_flow_L_h: rawTelemetry.fuel_flow_L_h ?? prev.fuel_flow_L_h,
      vibration_g: rawTelemetry.vibration_g ?? prev.vibration_g,
      battery_V: rawTelemetry.battery_V ?? prev.battery_V,
      sensor_failures: rawTelemetry.sensor_failures ?? this.config.injectedSensorFailures,
      active_faults: rawTelemetry.active_faults ?? this.config.injectedFaults,
      is_synthetic: true
    };

    this.processNewTelemetry(merged);
  }

  /**
   * Internal simulation physics step
   */
  private tick() {
    this.config.current_time_s += 1;

    // If in External Stream mode, synthetic physics ticks yield priority to incoming external simulation stream
    if (this.config.mode === 'WOKWI_LIVE') {
      return;
    }

    if (this.config.mode === 'CSV_REPLAY' && this.replayDataset.length > 0) {
      if (this.replayIndex >= this.replayDataset.length) {
        this.replayIndex = 0; // loop or stop
      }
      const dataPoint = this.replayDataset[this.replayIndex];
      this.replayIndex++;
      this.ingestTelemetry(dataPoint);
      return;
    }

    // Default Physics Model
    const t = this.config.current_time_s;
    let throttle = this.state.telemetry.throttle_pct;
    let altitude = this.state.telemetry.altitude_ft;
    let ambTemp = this.state.telemetry.ambient_temp_C;

    // Apply dynamic mission scenario perturbations
    if (this.state.telemetry.mission_phase === 'WAR_SCENARIO') {
        // Tactical evasion: surging throttle between 40% and 100%, erratic altitude
        throttle = 40 + 60 * Math.abs(Math.sin(t * 0.15));
        altitude += Math.sin(t * 0.05) * 1500;
        
        // Auto-inject some temporary faults during heavy stress periodically
        if (t % 15 === 0 && Math.random() > 0.5 && !this.config.injectedFaults.includes('ABNORMAL_VIBRATION')) {
           this.injectFault('ABNORMAL_VIBRATION');
        }
        if (t % 22 === 0 && this.config.injectedFaults.includes('ABNORMAL_VIBRATION')) {
           // Clear it to simulate temporary issue
           this.config.injectedFaults = this.config.injectedFaults.filter(f => f !== 'ABNORMAL_VIBRATION');
        }
    } else if (this.state.telemetry.mission_phase === 'TAKEOFF') {
        throttle = 100;
        // Introduce high thermal stress and overheating randomly during takeoff
        if (t % 10 === 0 && Math.random() > 0.6 && !this.config.injectedFaults.includes('OVERHEATING')) {
           this.injectFault('OVERHEATING');
        }
    } else if (this.state.telemetry.mission_phase === 'LOITER') {
        throttle = 75;
        // In thin air, occasionally cause combustion instability
        if (t % 20 === 0 && Math.random() > 0.7 && !this.config.injectedFaults.includes('COMBUSTION_INSTABILITY')) {
           this.injectFault('COMBUSTION_INSTABILITY');
        }
    }

    // Update telemetry state to reflect dynamics if in dynamic scenarios so UI updates
    if (this.state.telemetry.mission_phase === 'WAR_SCENARIO' || this.state.telemetry.mission_phase === 'TAKEOFF' || this.state.telemetry.mission_phase === 'LOITER') {
        this.state.telemetry.throttle_pct = Math.round(throttle);
    }

    // Atmospheric density factor (approx ISA)
    const airDensityRatio = Math.max(0.4, 1 - (altitude / 75000));

    // Dynamic Target RPM based on throttle and governor hunt
    const targetRpm = 1800 + (throttle / 100) * 3800 + Math.sin(t * 0.35) * 16 + Math.cos(t * 0.75) * 8;
    let currentRpm = this.state.telemetry.rpm + (targetRpm - this.state.telemetry.rpm) * 0.25;

    // Fuel Flow (L/h) with injection pulse breathing
    const targetFuelFlow = 8 + (throttle / 100) * 26 + Math.sin(t * 0.42) * 0.35 + (Math.random() - 0.5) * 0.25;
    const currentFuelFlow = this.state.telemetry.fuel_flow_L_h + (targetFuelFlow - this.state.telemetry.fuel_flow_L_h) * 0.2;

    // Base CHT & EGT heat generation with realistic cooling fin convective oscillation
    const thermalLoad = (throttle / 100) * 85 + (ambTemp - 15) * 0.6;
    const finThermalBreathing = Math.sin(t * 0.25) * 0.7 + Math.cos(t * 0.55) * 0.35;
    let baseCht = 90 + thermalLoad * 0.45 + finThermalBreathing;

    // Combustion cycle exhaust turbulence & runner breathing
    const egtPulse = Math.sin(t * 0.48) * 4.5 + Math.cos(t * 0.95) * 2.8;
    let baseEgt = 720 + (throttle / 100) * 110 + egtPulse;

    // Individual cylinder head temperatures (dynamic thermodynamics)
    let cht1 = baseCht + 2.1 + Math.sin(t * 0.22 + 0.3) * 0.6 + (Math.random() - 0.5) * 0.3;
    let cht2 = baseCht + 4.2 + Math.sin(t * 0.26 + 1.5) * 0.7 + (Math.random() - 0.5) * 0.3;
    let cht3 = baseCht + 6.3 + Math.sin(t * 0.24 + 2.8) * 0.8 + (Math.random() - 0.5) * 0.35;
    let cht4 = baseCht + 3.5 + Math.sin(t * 0.27 + 4.2) * 0.6 + (Math.random() - 0.5) * 0.3;

    // Individual cylinder exhaust temperatures (dynamic exhaust flow)
    let egt1 = baseEgt - 5.1 + Math.sin(t * 0.55 + 0.4) * 3.2 + (Math.random() - 0.5) * 2.2;
    let egt2 = baseEgt + 3.2 + Math.sin(t * 0.62 + 1.8) * 3.6 + (Math.random() - 0.5) * 2.2;
    let egt3 = baseEgt + 8.4 + Math.sin(t * 0.58 + 3.2) * 4.2 + (Math.random() - 0.5) * 2.5;
    let egt4 = baseEgt - 2.0 + Math.sin(t * 0.64 + 4.8) * 3.4 + (Math.random() - 0.5) * 2.2;

    // Oil pressure: 4.2 bar nominal, proportional to pump RPM, dynamic viscosity decay, hydrodynamic ripple
    let oilTemp = 85 + thermalLoad * 0.3 + Math.sin(t * 0.18) * 0.5;
    let oilPress = 4.2 + (currentRpm - 5000) * 0.00035 - (oilTemp - 90) * 0.012 + Math.sin(t * 0.65) * 0.04 + (Math.random() - 0.5) * 0.02;
    oilPress = Math.max(1.0, Math.min(6.5, oilPress));

    // Vibration: 0.8g baseline + rotational orders & acoustic jitter
    let vib = 0.75 + (currentRpm / 5800) * 0.35 + Math.sin(t * 1.1) * 0.04 + (Math.random() - 0.5) * 0.03;

    // Battery bus regulated voltage with alternator diode ripple
    let batt = 28.1 + Math.sin(t * 0.32) * 0.05 + (Math.random() - 0.5) * 0.03;

    // Apply Active Injected Faults
    const activeFaults = [...this.config.injectedFaults];

    if (activeFaults.includes('OVERHEATING')) {
      cht1 += 28;
      cht2 += 31;
      cht3 += 42; // Cylinder 3 highest
      cht4 += 32;
      egt1 += 90;
      egt2 += 105;
      egt3 += 140;
      egt4 += 95;
      oilTemp += 32;
      oilPress -= 0.6;
    }

    if (activeFaults.includes('LOW_OIL_PRESSURE')) {
      oilPress = Math.max(1.15, oilPress - 2.8);
      oilTemp += 34;
      vib += 1.8;
    }

    if (activeFaults.includes('CYLINDER_MISFIRE')) {
      cht3 -= 26; // Cold unburnt cylinder
      egt3 += 145; // Exhaust header afterburning
      vib += 2.2; // Torsional imbalance
      oilPress -= 0.2;
    }

    if (activeFaults.includes('ABNORMAL_VIBRATION')) {
      vib += 2.6;
    }

    if (activeFaults.includes('COMBUSTION_INSTABILITY')) {
      egt1 += 50;
      egt3 -= 45;
      vib += 1.4;
    }

    // Apply Piston Mechanical Seizure / Reciprocation Failure
    const failedPistons = this.config.failedPistons || [];
    if (failedPistons.length > 0) {
      currentRpm = Math.max(850, currentRpm - failedPistons.length * 650);
      vib += failedPistons.length * 1.65;
      failedPistons.forEach(cyl => {
        if (cyl === 1) { cht1 += 36; egt1 = 180; }
        if (cyl === 2) { cht2 += 36; egt2 = 180; }
        if (cyl === 3) { cht3 += 36; egt3 = 180; }
        if (cyl === 4) { cht4 += 36; egt4 = 180; }
      });
    }

    // Record pre-failure healthy sensor readings before any channel zeroing occurs
    const sensorPairs: [string, number][] = [
      ['rpm', currentRpm],
      ['cht1', cht1],
      ['cht2', cht2],
      ['cht3', cht3],
      ['cht4', cht4],
      ['egt1', egt1],
      ['egt2', egt2],
      ['egt3', egt3],
      ['egt4', egt4],
      ['oil_temp', oilTemp],
      ['oil_pressure', oilPress],
      ['fuel_flow', currentFuelFlow],
      ['vibration', vib],
      ['battery_v', batt]
    ];

    for (const [id, val] of sensorPairs) {
      if (!this.config.injectedSensorFailures.includes(id) && val > 0) {
        this.lastHealthySensorValues[id] = Math.round(val * 10) / 10;
      }
    }

    // Apply Injected Sensor Failures (open circuit, zero reading, or spike)
    const rawTelemetry: EngineTelemetry = {
      timestamp_s: t,
      mission_phase: this.state.telemetry.mission_phase,
      altitude_ft: Math.round(altitude),
      ambient_temp_C: Math.round(ambTemp * 10) / 10,
      throttle_pct: Math.round(throttle),
      rpm: Math.round(currentRpm),
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
      fuel_flow_L_h: Math.round(currentFuelFlow * 10) / 10,
      vibration_g: Math.round(vib * 100) / 100,
      battery_V: Math.round(batt * 10) / 10,
      sensor_failures: [...this.config.injectedSensorFailures],
      active_faults: activeFaults,
      failed_pistons: [...failedPistons],
      is_synthetic: true
    };

    // If sensor failure injected, zero out raw hardware channel to simulate sensor disconnect/failure
    if (this.config.injectedSensorFailures.includes('rpm')) rawTelemetry.rpm = 0;
    if (this.config.injectedSensorFailures.includes('cht1')) rawTelemetry.cht1_C = 0;
    if (this.config.injectedSensorFailures.includes('cht2')) rawTelemetry.cht2_C = 0;
    if (this.config.injectedSensorFailures.includes('cht3')) rawTelemetry.cht3_C = 0;
    if (this.config.injectedSensorFailures.includes('cht4')) rawTelemetry.cht4_C = 0;
    if (this.config.injectedSensorFailures.includes('egt1')) rawTelemetry.egt1_C = 0;
    if (this.config.injectedSensorFailures.includes('egt2')) rawTelemetry.egt2_C = 0;
    if (this.config.injectedSensorFailures.includes('egt3')) rawTelemetry.egt3_C = 0;
    if (this.config.injectedSensorFailures.includes('egt4')) rawTelemetry.egt4_C = 0;
    if (this.config.injectedSensorFailures.includes('oil_pressure')) rawTelemetry.oil_pressure_bar = 0;
    if (this.config.injectedSensorFailures.includes('oil_temp')) rawTelemetry.oil_temp_C = 0;
    if (this.config.injectedSensorFailures.includes('fuel_flow')) rawTelemetry.fuel_flow_L_h = 0;
    if (this.config.injectedSensorFailures.includes('vibration')) rawTelemetry.vibration_g = 0;
    if (this.config.injectedSensorFailures.includes('battery_v')) rawTelemetry.battery_V = 0;

    this.processNewTelemetry(rawTelemetry);
  }

  private recalculateState() {
    const failedPistons = this.config.failedPistons || [];
    const updated: EngineTelemetry = {
      ...this.state.telemetry,
      active_faults: [...this.config.injectedFaults],
      sensor_failures: [...this.config.injectedSensorFailures],
      failed_pistons: [...failedPistons]
    };
    if (failedPistons.length > 0) {
      updated.vibration_g = Math.max(2.4, updated.vibration_g + failedPistons.length * 1.2);
      updated.rpm = Math.max(850, updated.rpm - failedPistons.length * 550);
    }
    // Zero out channels for active injected sensor failures
    if (this.config.injectedSensorFailures.includes('rpm')) updated.rpm = 0;
    if (this.config.injectedSensorFailures.includes('cht1')) updated.cht1_C = 0;
    if (this.config.injectedSensorFailures.includes('cht2')) updated.cht2_C = 0;
    if (this.config.injectedSensorFailures.includes('cht3')) updated.cht3_C = 0;
    if (this.config.injectedSensorFailures.includes('cht4')) updated.cht4_C = 0;
    if (this.config.injectedSensorFailures.includes('egt1')) updated.egt1_C = 0;
    if (this.config.injectedSensorFailures.includes('egt2')) updated.egt2_C = 0;
    if (this.config.injectedSensorFailures.includes('egt3')) updated.egt3_C = 0;
    if (this.config.injectedSensorFailures.includes('egt4')) updated.egt4_C = 0;
    if (this.config.injectedSensorFailures.includes('oil_pressure')) updated.oil_pressure_bar = 0;
    if (this.config.injectedSensorFailures.includes('oil_temp')) updated.oil_temp_C = 0;
    if (this.config.injectedSensorFailures.includes('fuel_flow')) updated.fuel_flow_L_h = 0;
    if (this.config.injectedSensorFailures.includes('vibration')) updated.vibration_g = 0;
    if (this.config.injectedSensorFailures.includes('battery_v')) updated.battery_V = 0;

    this.processNewTelemetry(updated);
  }

  private processNewTelemetry(raw: EngineTelemetry) {
    // 1. Evaluate Sensor Status & Run Soft-Sensing Virtual Sensors with pre-failure baseline
    const { cleanTelemetry, sensorStatuses } = this.aiEngine.evaluateSensors(
      raw,
      this.config.injectedSensorFailures,
      this.lastHealthySensorValues
    );

    // 2. Health Estimation with Explainable Factors
    const health = this.aiEngine.estimateHealth(cleanTelemetry, this.state.telemetryHistory);

    // 3. Multi-Variate Fault Classification
    const detectedFaults = this.aiEngine.detectFaults(cleanTelemetry, health);

    // 4. RUL Prediction
    const rul = this.aiEngine.predictRUL(health, cleanTelemetry, detectedFaults);

    // 5. Actionable Recommendations
    const recommendations = this.aiEngine.generateRecommendations(detectedFaults, health, cleanTelemetry);

    // 6. Aerospace Risk Assessment
    const risk = this.aiEngine.assessRisk(health, rul, detectedFaults, cleanTelemetry);

    // Maintain historical sliding window of last 60 data points for responsive charts
    const history = [...this.state.telemetryHistory, cleanTelemetry];
    if (history.length > 60) history.shift();

    const healthHist = [...this.state.healthHistory, {
      timestamp_s: cleanTelemetry.timestamp_s,
      health_pct: health.health_score_pct,
      rul_hours: rul.estimated_hours
    }];
    if (healthHist.length > 60) healthHist.shift();

    this.state = {
      telemetry: cleanTelemetry,
      health,
      rul,
      faults: detectedFaults,
      recommendations,
      risk,
      sensors: sensorStatuses,
      telemetryHistory: history,
      healthHistory: healthHist,
      isSyntheticData: true,
      activeDatasetName: this.state.activeDatasetName
    };

    this.notify();
  }
}

export const digitalTwinService = new DigitalTwinService();
