import express from 'express';
import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

const app = express();
const PORT = 3000;

// Lazy initialization of Gemini client
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!geminiClient && process.env.GEMINI_API_KEY) {
    try {
      geminiClient = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
    } catch (err) {
      console.warn('Failed to initialize GoogleGenAI client:', err);
    }
  }
  return geminiClient;
}

async function generateContentWithRetry(ai: GoogleGenAI, prompt: string): Promise<{ text: string | null; modelUsed: string }> {
  const models = ['gemini-3.1-flash-lite', 'gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
  for (const model of models) {
    try {
      const response: any = await ai.models.generateContent({
        model,
        contents: prompt,
      });
      if (response?.text) {
        return { text: response.text, modelUsed: `Gemini (${model})` };
      }
    } catch (err: any) {
      const msg = err?.message || '';
      if (msg.includes('resource_exhausted') || msg.includes('quota') || msg.includes('429')) {
        console.warn(`[Gemini AI] Quota / rate limit reached for ${model}. Falling back to physics engine.`);
        break; // Skip other models if quota is exhausted globally
      } else {
        console.warn(`[Gemini AI] Model ${model} unavailable:`, msg);
      }
    }
  }
  return { text: null, modelUsed: 'Aerospace Physics Engine (Quota Fallback Active)' };
}

// Enable universal CORS for external clients, Wokwi, IoT devices, Python scripts
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
// Fallback parser for devices sending text/plain or raw payloads
app.use((req, res, next) => {
  if (typeof req.body === 'string' && req.body.trim().startsWith('{')) {
    try {
      req.body = JSON.parse(req.body);
    } catch {
      // keep original
    }
  }
  next();
});

// In-memory telemetry buffer for Wokwi and external APIs
let latestExternalTelemetry: any = null;
let lastExternalTimestamp = 0;
let externalPacketCount = 0;
let currentEngineState: any = null;

// Universal Health & Wake Endpoints
app.get(['/health', '/ping', '/wake', '/api/wake', '/api/ping'], (req, res) => {
  res.json({
    status: 'ONLINE',
    message: 'MALE UAV Digital Twin Server is awake, operational, and listening',
    uptime_s: Math.round(process.uptime()),
    timestamp: Date.now()
  });
});

// API ROUTES
app.get('/api/health-check', (req, res) => {
  res.json({
    status: 'ONLINE',
    service: 'MALE UAV Piston Engine Digital Twin Backend',
    version: '1.0.0',
    mode: 'SIH-2026 Aerospace Mission Grade',
    uptime_s: Math.round(process.uptime()),
    timestamp: Date.now()
  });
});

// Sync state from client or simulation
app.post('/api/sync-state', (req, res) => {
  currentEngineState = req.body;
  res.json({ status: 'OK' });
});

// Query engine status
app.get('/api/engine-status', (req, res) => {
  res.json(currentEngineState || {
    status: 'IDLE',
    message: 'Simulation state initializing...',
    telemetry: latestExternalTelemetry
  });
});

// Query health
app.get('/api/health', (req, res) => {
  if (currentEngineState?.health) {
    return res.json(currentEngineState.health);
  }
  res.json({
    health_score_pct: 98.5,
    thermal_health_pct: 99,
    lubrication_health_pct: 98,
    mechanical_health_pct: 99,
    combustion_health_pct: 98,
    status: 'NOMINAL'
  });
});

// Query RUL
app.get('/api/rul', (req, res) => {
  if (currentEngineState?.rul) {
    return res.json(currentEngineState.rul);
  }
  res.json({
    estimated_hours: 480,
    confidence_pct: 92,
    limiting_subsystem: 'LUBRICATION_BOUNDARY',
    projected_failure_mode: 'THERMAL_FATIGUE'
  });
});

// Query faults
app.get('/api/faults', (req, res) => {
  res.json(currentEngineState?.faults || []);
});

// Query recommendations
app.get('/api/recommendations', (req, res) => {
  res.json(currentEngineState?.recommendations || []);
});

// Direct ZIP download endpoint with auto-generation
app.get('/api/download-project-zip', (req, res) => {
  const tmpZip = '/tmp/male-uav-digital-twin.zip';
  try {
    const pythonScript = `
import os, zipfile
zip_filename = '${tmpZip}'
exclude_dirs = {'node_modules', '.git', 'dist', '__pycache__', '.vite'}
with zipfile.ZipFile(zip_filename, 'w', zipfile.ZIP_DEFLATED) as zipf:
    for root, dirs, files in os.walk('.'):
        dirs[:] = [d for d in dirs if d not in exclude_dirs]
        for file in files:
            file_path = os.path.join(root, file)
            arcname = os.path.relpath(file_path, '.')
            zipf.write(file_path, arcname)
`;
    execSync(`python3 -c "${pythonScript.replace(/"/g, '\\"')}"`, { cwd: process.cwd() });
    
    if (fs.existsSync(tmpZip)) {
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="male-uav-digital-twin.zip"');
      return res.sendFile(tmpZip);
    }
  } catch (err) {
    console.error('Failed to create zip on demand:', err);
  }

  // Fallback to static archive if exists
  const distZip = path.join(process.cwd(), 'dist', 'male-uav-digital-twin.zip');
  if (fs.existsSync(distZip)) {
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="male-uav-digital-twin.zip"');
    return res.sendFile(distZip);
  }

  return res.status(500).send('Error packaging zip. Please try again.');
});

// AI War Readiness & Combat Mission Feasibility Assessment Endpoint
app.post('/api/ai/war-assessment', async (req, res) => {
  try {
    const { historicalLog, currentCondition, warScenario } = req.body || {};
    
    const hist = historicalLog || {
      cumulativeAirframeHours: 342.5,
      oilDegradationIndex: 28,
      cylinderVariance: { cyl3: 4.8 }
    };
    const telem = currentCondition?.telemetry || {};
    const hlth = currentCondition?.health || { health_score_pct: 95 };
    const scen = warScenario || {
      name: 'Standard Combat Scenario',
      altitude_ft: 12000,
      ambient_temp_C: 25,
      combat_throttle_pct: 85,
      mission_duration_hours: 6.0,
      theatre: 'DESERT_THAR',
      dust_sand_index: 50,
      g_force_envelope: 2.5
    };

    // Calculate baseline deterministic physics
    const alt = scen.altitude_ft || 10000;
    const tempC = scen.ambient_temp_C || 25;
    const throttleFactor = (scen.combat_throttle_pct || 80) / 68;
    const densityRatio = Math.max(0.45, Math.min(1.05, Math.pow(Math.max(0.2, 1 - 0.000006875 * alt), 4.256) * (288.15 / Math.max(200, tempC + 273.15))));
    const histCyl3Delta = hist.cylinderVariance?.cyl3 || 4.2;
    const dustPenalty = ((scen.dust_sand_index || 0) / 100) * 12;

    const projectedCht = Math.round((telem.cht3_C || 116) * 0.35 + (tempC + 68 + (throttleFactor - 1) * 48 + Math.max(0, tempC - 20) * 0.75 + (1 - densityRatio) * 18 + histCyl3Delta + dustPenalty) * 0.65);
    const projectedEgt = Math.round((telem.egt3_C || 795) * 0.4 + (780 + (scen.combat_throttle_pct - 68) * 3.4 + Math.max(0, tempC - 15) * 0.9) * 0.6);
    const projectedOilTemp = Math.round((telem.oil_temp_C || 98) * 0.3 + (88 + (tempC - 15) * 0.45 + (throttleFactor - 1) * 28 + (projectedCht - 115) * 0.38 + ((hist.oilDegradationIndex || 25) / 100) * 8) * 0.7);
    const projectedOilPress = +(Math.max(1.1, (telem.oil_pressure_bar || 4.2) - Math.max(0, (projectedOilTemp - 100) * 0.045) - 0.15)).toFixed(2);
    const projectedVib = +(Math.max(0.6, (telem.vibration_g || 0.88) * Math.pow(throttleFactor, 1.4) + ((scen.g_force_envelope || 2) > 2 ? ((scen.g_force_envelope || 2) - 1) * 0.25 : 0))).toFixed(2);
    const projectedFuelFlow = +(18.5 + ((scen.combat_throttle_pct || 80) / 100) * 14.5).toFixed(1);

    const thermalMargin = +(145 - projectedCht).toFixed(1);
    const oilMargin = +(115 - projectedOilTemp).toFixed(1);

    // Endurance calculation
    let safeCombatEnduranceHours = 24.0;
    if (projectedCht >= 142) safeCombatEnduranceHours = 0.8;
    else if (projectedCht >= 135) safeCombatEnduranceHours = +(Math.max(1.2, 1.2 + (142 - projectedCht) * 0.6)).toFixed(1);
    else if (projectedCht >= 125) safeCombatEnduranceHours = +(Math.max(3.5, 4.0 + (135 - projectedCht) * 0.8)).toFixed(1);
    else safeCombatEnduranceHours = +(Math.min(24.0, 10.0 + (125 - projectedCht) * 0.9)).toFixed(1);

    if (projectedOilTemp >= 114 || projectedOilPress <= 1.8) safeCombatEnduranceHours = Math.min(safeCombatEnduranceHours, 1.1);
    else if (projectedOilTemp >= 108) safeCombatEnduranceHours = Math.min(safeCombatEnduranceHours, +(Math.max(2.5, 2.5 + (114 - projectedOilTemp) * 0.8)).toFixed(1));

    if ((scen.dust_sand_index || 0) > 75) safeCombatEnduranceHours = Math.min(safeCombatEnduranceHours, +(Math.max(3.2, 8.5 - ((scen.dust_sand_index || 0) / 100) * 5.5)).toFixed(1));

    const overallRiskScore = Math.min(99, Math.max(8, Math.round(
      (Math.min(100, Math.max(10, ((projectedCht - 90) / 55) * 100))) * 0.35 +
      (Math.min(100, Math.max(10, ((projectedOilTemp - 80) / 38) * 100))) * 0.25 +
      (Math.min(100, Math.max(10, (projectedVib / 2.2) * 100))) * 0.20 +
      (100 - (hlth.health_score_pct || 90)) * 0.35
    )));

    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
    if (overallRiskScore >= 75 || thermalMargin <= 6 || projectedOilTemp >= 112) riskLevel = 'CRITICAL';
    else if (overallRiskScore >= 55 || thermalMargin <= 14) riskLevel = 'HIGH';
    else if (overallRiskScore >= 35) riskLevel = 'MEDIUM';

    const ifsdProbabilityPct = +(Math.min(88, Math.max(1.2, Math.pow(overallRiskScore / 100, 2.2) * 85))).toFixed(1);

    let verdict: 'GO' | 'CONDITIONAL_GO' | 'NO_GO' = 'GO';
    let verdictTitle = 'COMBAT READY: MISSION CLEARED';
    let verdictSubtitle = 'Engine parameters remain within tactical safety margins throughout the full sortie.';
    let verdictHinglish = 'Yes, the UAV is fully operational. Engine load under war conditions remains well within safe limits.';

    if (projectedCht >= 142 || projectedOilTemp >= 114 || overallRiskScore >= 78 || safeCombatEnduranceHours < Math.min(2.0, (scen.mission_duration_hours || 4) * 0.5)) {
      verdict = 'NO_GO';
      verdictTitle = 'MISSION NO-GO: ENGINE GROUNDED';
      verdictSubtitle = 'Critical failure threshold will be exceeded under this war scenario. Severe in-flight shutdown risk.';
      verdictHinglish = 'No! The UAV is NOT cleared for this war condition. There is a 75%+ risk of catastrophic engine seizure mid-flight.';
    } else if (projectedCht >= 126 || projectedOilTemp >= 104 || safeCombatEnduranceHours < (scen.mission_duration_hours || 4) || overallRiskScore >= 45) {
      verdict = 'CONDITIONAL_GO';
      verdictTitle = 'CONDITIONAL SORTIE: RESTRICTED COMBAT ENVELOPE';
      verdictSubtitle = 'UAV can fly, but operational restrictions (throttle cap / altitude limits / shortened sortie) are MANDATORY.';
      verdictHinglish = 'Conditional Clearance: The UAV may fly, but strictly with restricted limits (throttle must be capped below 78%).';
    }

    let aiBriefing = `COMBAT READINESS BRIEFING [${verdict}]: Safe combat endurance is ${safeCombatEnduranceHours} hours. Overall risk: ${overallRiskScore}% (${riskLevel}). Projected Peak CHT: ${projectedCht}°C (Margin: ${thermalMargin}°C). Projected Oil Temp: ${projectedOilTemp}°C.`;
    let aiHinglish = verdictHinglish + ` Safe combat endurance: Maximum ${safeCombatEnduranceHours} hours. Risk score: ${overallRiskScore}% (${riskLevel}).`;
    let modelUsed = 'Aerospace Physics-Informed Digital Twin VM';

    // If Gemini client is active, query Gemini for advanced tactical analysis
    const ai = getGeminiClient();
    if (ai) {
      try {
        const prompt = `You are a Senior Aerospace Propulsion Combat Reliability Specialist for a MALE UAV military piston engine.
Analyze the following engine condition and war theatre stress:
- Historical Airframe Hours: ${hist.cumulativeAirframeHours} hrs, Historical CHT3 variance: +${histCyl3Delta}°C, Past Oil Degradation: ${hist.oilDegradationIndex}%
- Live Engine Health: ${hlth.health_score_pct}%, Active Faults: ${JSON.stringify(telem.active_faults || [])}
- War Condition: "${scen.name}" (${scen.theatre})
- Ambient Temp: ${tempC}°C, Altitude: ${alt} ft, Combat Throttle: ${scen.combat_throttle_pct}%, Dust/Sand: ${scen.dust_sand_index}%, G-Force: ${scen.g_force_envelope}g
- Calculated Physics: Projected CHT: ${projectedCht}°C, Oil Temp: ${projectedOilTemp}°C, Vibration: ${projectedVib}g, Safe Endurance: ${safeCombatEnduranceHours} hrs vs Required: ${scen.mission_duration_hours} hrs.
- Physics Baseline Verdict: ${verdict} (${verdictTitle})

Provide an authoritative military tactical flight clearance assessment. Include:
1. Short Tactical Summary (2-3 sentences in English).
2. Clear Direct English explanation for ground commanders answering: Is it airworthy? What is the safe endurance? What is the risk profile? What component will fail first?
3. 2-3 specific flight envelope restrictions or pilot directives.`;

        const resAi = await generateContentWithRetry(ai, prompt);
        if (resAi.text) {
          aiBriefing = resAi.text;
          modelUsed = `${resAi.modelUsed} (Aerospace Combat Prognosis Agent)`;
        }
      } catch (geminiErr: any) {
        console.warn('[Gemini AI] generateContent deferred, falling back to local physics briefing:', geminiErr?.message || geminiErr);
      }
    }

    const result = {
      verdict,
      verdictTitle,
      verdictSubtitle,
      verdictHinglish,
      safeCombatEnduranceHours,
      maxCombatEnvelopeHours: +(safeCombatEnduranceHours * 1.25).toFixed(1),
      requiredMissionHours: scen.mission_duration_hours || 6.0,
      enduranceMarginHours: +(safeCombatEnduranceHours - (scen.mission_duration_hours || 6.0)).toFixed(1),
      overallRiskScore,
      riskLevel,
      ifsdProbabilityPct,
      wearAccelerationFactor: +(Math.pow(throttleFactor, 2.0)).toFixed(1),
      limitingComponent: {
        subsystem: projectedCht > 132 ? 'Thermal & Piston Assembly' : 'Lubrication System',
        component: projectedCht > 132 ? 'Cylinder #3 Piston Ring & Cylinder Wall' : 'Connecting Rod Journal Bearings',
        projectedTimeToFailureHours: safeCombatEnduranceHours,
        failureMechanism: projectedCht > 132 ? 'Thermal micro-welding causing piston ring binding and compression loss.' : 'Oil viscosity thinning leading to boundary friction and journal wipe.',
        warningSigns: projectedCht > 132 ? 'Rapid CHT divergence > 138°C with unburned HC smoke.' : 'Oil pressure decay below 2.2 bar with oil temp exceeding 108°C.'
      },
      thermalMargin_C: thermalMargin,
      oilThermalMargin_C: oilMargin,
      projectedValues: {
        peakCht_C: projectedCht,
        peakEgt_C: projectedEgt,
        oilTemp_C: projectedOilTemp,
        oilPressure_bar: projectedOilPress,
        vibration_g: projectedVib,
        fuelFlow_L_h: projectedFuelFlow,
        coolingEfficiency_pct: Math.round(densityRatio * 100)
      },
      stressRadar: {
        thermal: Math.min(100, Math.max(10, Math.round(((projectedCht - 90) / 55) * 100))),
        lubrication: Math.min(100, Math.max(10, Math.round(((projectedOilTemp - 80) / 38) * 100))),
        mechanical: Math.min(100, Math.max(10, Math.round((projectedVib / 2.2) * 100))),
        combustion: Math.min(100, Math.max(10, Math.round(((projectedEgt - 720) / 160) * 100))),
        induction: Math.min(100, Math.max(10, Math.round((1 - densityRatio) * 120 + ((scen.dust_sand_index || 0) / 100) * 35)))
      },
      flightEnvelopeRestrictions: verdict === 'NO_GO' 
        ? ['ABSOLUTE FLIGHT PROHIBITION: Do not release aircraft for combat launch.', `Safe endurance (${safeCombatEnduranceHours}h) is insufficient for mission (${scen.mission_duration_hours}h).`]
        : [`Cap continuous combat throttle at ≤${Math.min(82, (scen.combat_throttle_pct || 80) - 8)}%.`, `Strictly return to base before ${safeCombatEnduranceHours} hours.`],
      commanderDirectives: verdict === 'NO_GO'
        ? ['Reassign sortie to secondary standby UAV.', 'Perform teardown and borescope inspection of Cylinder 3.']
        : [`Sortie approved with maximum ${safeCombatEnduranceHours} hours ceiling envelope.`, 'Maintain continuous telemetry alert on ground control station.'],
      maintenanceSOPs: [
        'Post-flight oil viscosity and magnetic chip detector check.',
        'Inspect cylinder cooling fin airflow channels for dust buildup.'
      ],
      aiTacticalBriefing: aiBriefing,
      aiHinglishExplanation: aiHinglish,
      evaluatedAt: Date.now(),
      modelUsed
    };

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'War assessment computation failed' });
  }
});

/**
 * AI Autonomous Fault Diagnosis & Multi-Solution Time-of-Flight (ToF) Maximizer
 */
app.post('/api/ai/optimize-remediation', async (req, res) => {
  try {
    const { problem, telemetry, strategies } = req.body || {};

    if (!problem || !strategies || !Array.isArray(strategies)) {
      return res.status(400).json({ error: 'Missing required problem diagnostic or strategy payload' });
    }

    const bestStrat = strategies[0] || {};
    let aiSummaryEnglish = `Autonomous diagnostic system confirmed "${problem.title}". Without intervention, engine failure was projected in ${problem.baselineToFMinutes} minutes. The AI has evaluated ${strategies.length} remediation profiles. Strategy "${bestStrat.shortTitle || bestStrat.title}" provides the MAXIMUM Time of Flight of ${bestStrat.tof_hours} hours (+${bestStrat.tof_gain}h gain) by reducing thermal saturation and fuel burn.`;
    let aiGroundStationSummary = `AI Diagnosis: An anomaly classified as "${problem.title}" has been detected. Under baseline flight conditions, engine failure is projected in ${problem.baselineToFMinutes} minutes. The AI has evaluated multiple strategies and selected "${bestStrat.shortTitle || bestStrat.title}" as the optimal mitigation, successfully extending flight time to ${bestStrat.tof_hours} hours (+${bestStrat.tof_gain} hours extra).`;
    let modelUsed = 'Aerospace Multi-Strategy Physics Engine';

    const ai = getGeminiClient();
    if (ai) {
      try {
        const prompt = `You are a Military MALE UAV Autonomous Propulsion Reliability & Flight Envelope Optimization Specialist.
A fault was diagnosed on the UAV piston engine during flight:
- Problem: ${problem.title} (${problem.severity})
- Affected Subsystem: ${problem.subsystem}
- Primary Limiting Component: ${problem.primaryComponent}
- Root Cause: ${problem.rootCauseEnglish}
- Unmitigated Baseline Time of Flight (ToF): ${problem.baselineToFMinutes} minutes before catastrophic engine failure!
- Live Vitals: Peak CHT: ${telemetry?.cht_peak}°C, Oil Temp: ${telemetry?.oil_temp}°C, Oil Press: ${telemetry?.oil_pressure} bar, Vibration: ${telemetry?.vibration}g, RPM: ${telemetry?.rpm}, Throttle: ${telemetry?.throttle}%, Alt: ${telemetry?.altitude} ft.

Candidate Remediation Solutions Tested by the System to Maximize Time of Flight (ToF):
${strategies.map((s: any, idx: number) => `${idx + 1}. [${s.shortTitle}]: Projected ToF: ${s.tof_hours} hrs (+${s.tof_gain} hrs gain), Risk Score: ${s.risk_score}%, CHT: ${s.cht}°C, Oil Temp: ${s.oil_temp}°C, Fuel Flow: ${s.fuel_burn} L/h`).join('\n')}

Generate an authoritative operational flight controller evaluation:
1. Executive Tactical Summary in English: Why the top strategy achieves maximum endurance and how the thermodynamic/mechanical relief prevents in-flight engine shutdown.
2. Direct clear explanation for Ground Station Commander:
   - What anomaly occurred?
   - Which solution was implemented and how much Time of Flight did it yield?
   - How did the strategy save the engine and what directives were passed to the autopilot?
3. 3 specific automated autopilot commands.`;

        const resAi = await generateContentWithRetry(ai, prompt);
        if (resAi.text) {
          aiSummaryEnglish = resAi.text;
          modelUsed = `${resAi.modelUsed} (Autonomous Combat Flight Controller Agent)`;
        }
      } catch (geminiErr: any) {
        console.warn('[Gemini AI] optimize-remediation deferred, using physics report:', geminiErr?.message || geminiErr);
      }
    }

    res.json({
      status: 'SUCCESS',
      aiSummaryEnglish,
      aiGroundStationSummary,
      modelUsed,
      evaluatedAt: Date.now()
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Remediation optimization failed' });
  }
});

// Sensor data receiver - supports POST and GET (query params)
app.all('/api/sensor-data', (req, res) => {
  let telemetry: any = null;

  if (req.method === 'GET') {
    // Support GET query parameters e.g. /api/sensor-data?rpm=5200&temp=115&pressure=4.2
    if (Object.keys(req.query).length > 0) {
      telemetry = { ...req.query };
    }
  } else {
    telemetry = req.body;
  }
  
  if (typeof telemetry === 'string') {
    try {
      telemetry = JSON.parse(telemetry);
    } catch {
      // try regex or key-value format
      try {
        const jsonMatch = telemetry.match(/\{.*\}/);
        if (jsonMatch) {
          telemetry = JSON.parse(jsonMatch[0]);
        }
      } catch {}
    }
  }

  if (!telemetry || typeof telemetry !== 'object') {
    return res.status(400).json({ error: 'Invalid sensor packet payload. Expected JSON object or query params.' });
  }

  latestExternalTelemetry = telemetry;
  lastExternalTimestamp = Date.now();
  externalPacketCount++;

  res.header('Access-Control-Allow-Origin', '*');
  res.json({
    status: 'SUCCESS',
    message: 'Sensor packet ingested by Digital Twin pipeline',
    packetCount: externalPacketCount,
    timestamp: lastExternalTimestamp,
    dataReceived: telemetry
  });
});

// Query latest external stream status
app.get('/api/external-stream', (req, res) => {
  const isFresh = (Date.now() - lastExternalTimestamp) < 10000;
  res.json({
    connected: isFresh && externalPacketCount > 0,
    packetCount: externalPacketCount,
    lastReceivedMsAgo: lastExternalTimestamp > 0 ? (Date.now() - lastExternalTimestamp) : null,
    latestData: latestExternalTelemetry
  });
});

// Remote Simulation Configuration Buffer
let remoteSimConfig = {
  protocol: 'http',
  ip: '127.0.0.1',
  port: 5000,
  path: '/api/sensor-data',
  mode: 'LOCAL_PHYSICS'
};

app.get('/api/remote-sim/config', (req, res) => {
  res.json(remoteSimConfig);
});

app.post('/api/remote-sim/config', (req, res) => {
  if (req.body && typeof req.body === 'object') {
    remoteSimConfig = { ...remoteSimConfig, ...req.body };
  }
  res.json({ status: 'SUCCESS', config: remoteSimConfig });
});

// Test connectivity to external simulation server
app.post('/api/remote-sim/test-connection', async (req, res) => {
  const { ip, port, protocol = 'http', path: endpointPath = '/api/sensor-data' } = req.body || {};
  if (!ip || !port) {
    return res.status(400).json({ success: false, error: 'Simulation server IP and Port are required' });
  }

  const cleanPath = endpointPath.startsWith('/') ? endpointPath : `/${endpointPath}`;
  const targetUrl = `${protocol}://${ip}:${port}${cleanPath}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);
    const startTime = Date.now();

    const response = await fetch(targetUrl, {
      method: 'GET',
      signal: controller.signal,
      headers: { 'Accept': 'application/json' }
    });
    clearTimeout(timeoutId);

    const latencyMs = Date.now() - startTime;
    let payloadSample: any = null;
    try {
      payloadSample = await response.json();
    } catch {
      payloadSample = await response.text();
    }

    res.json({
      success: true,
      statusCode: response.status,
      latencyMs,
      targetUrl,
      payloadSample,
      message: `Successfully reached external simulation at ${ip}:${port} (${latencyMs}ms)`
    });
  } catch (err: any) {
    const isTimeout = err.name === 'AbortError';
    res.json({
      success: false,
      targetUrl,
      error: isTimeout ? 'Connection timed out (3.5s). Server not responding.' : (err.message || 'Connection failed'),
      hint: 'Ensure your simulation server script on the 2nd laptop is running, bound to 0.0.0.0, and port is open in firewall.'
    });
  }
});

// Actively poll sensor data from remote simulation server
app.post('/api/remote-sim/poll', async (req, res) => {
  const { ip, port, protocol = 'http', path: endpointPath = '/api/sensor-data' } = req.body || {};
  if (!ip || !port) {
    return res.status(400).json({ success: false, error: 'Missing IP or Port' });
  }

  const cleanPath = endpointPath.startsWith('/') ? endpointPath : `/${endpointPath}`;
  const targetUrl = `${protocol}://${ip}:${port}${cleanPath}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);
    const response = await fetch(targetUrl, {
      method: 'GET',
      signal: controller.signal,
      headers: { 'Accept': 'application/json' }
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      return res.status(response.status).json({ success: false, error: `Remote server returned HTTP ${response.status}` });
    }

    const data: any = await response.json();
    if (data && typeof data === 'object') {
      latestExternalTelemetry = data;
      lastExternalTimestamp = Date.now();
      externalPacketCount++;
    }

    res.json({
      success: true,
      packetCount: externalPacketCount,
      timestamp: lastExternalTimestamp,
      telemetry: data
    });
  } catch (err: any) {
    res.status(502).json({
      success: false,
      error: err.name === 'AbortError' ? 'Remote simulation poll timed out' : (err.message || 'Failed to poll remote simulation')
    });
  }
});

// Mount Vite middleware or Static build
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true, allowedHosts: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`MALE UAV Digital Twin Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
