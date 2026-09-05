import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  Radio, 
  Copy, 
  Check, 
  Terminal, 
  Code, 
  Send, 
  CheckCircle2, 
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import { DigitalTwinState } from '../types/engine';

interface WokwiBridgeStudioProps {
  state: DigitalTwinState;
  onIngestSensorData: (data: any) => void;
}

export const WokwiBridgeStudio: React.FC<WokwiBridgeStudioProps> = ({ state, onIngestSensorData }) => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [isAutoStreaming, setIsAutoStreaming] = useState<boolean>(false);
  const [serverPingStatus, setServerPingStatus] = useState<{
    status: 'IDLE' | 'CHECKING' | 'ONLINE' | 'ERROR';
    latencyMs?: number;
    message?: string;
  }>({ status: 'IDLE' });

  const currentHost = typeof window !== 'undefined' ? window.location.origin : 'https://ais-dev-rbefkxyru25eevkvlhdqza-375931819270.asia-east1.run.app';

  const [testPayload, setTestPayload] = useState<string>(JSON.stringify({
    timestamp_s: Math.round(Date.now() / 1000),
    rpm: 5120,
    cht1_C: 115.5,
    cht2_C: 116.8,
    cht3_C: 118.2,
    cht4_C: 114.9,
    egt1_C: 792.0,
    egt2_C: 798.5,
    egt3_C: 804.1,
    egt4_C: 794.0,
    oil_pressure_bar: 4.15,
    oil_temp_C: 99.2,
    fuel_flow_L_h: 23.4,
    vibration_g: 0.92,
    battery_V: 28.2,
    altitude_ft: 13000,
    ambient_temp_C: 12.0,
    throttle_pct: 70,
    mission_phase: "CRUISE"
  }, null, 2));

  const [testResult, setTestResult] = useState<string | null>(null);
  const [streamStats, setStreamStats] = useState<{
    connected: boolean;
    packetCount: number;
    lastReceivedMsAgo: number | null;
  }>({
    connected: false,
    packetCount: 0,
    lastReceivedMsAgo: null
  });

  // Ping Server function
  const handlePingServer = async () => {
    setServerPingStatus({ status: 'CHECKING' });
    const start = performance.now();
    try {
      const res = await fetch('/api/health-check');
      const latency = Math.round(performance.now() - start);
      if (res.ok) {
        const data = await res.json();
        setServerPingStatus({
          status: 'ONLINE',
          latencyMs: latency,
          message: `${data.service || 'MALE UAV Server'} (${latency}ms) - Uptime: ${data.uptime_s || 0}s`
        });
      } else {
        setServerPingStatus({
          status: 'ERROR',
          message: `Server returned HTTP ${res.status}`
        });
      }
    } catch (err: any) {
      setServerPingStatus({
        status: 'ERROR',
        message: err.message || 'Connection failed'
      });
    }
  };

  // Poll external stream stats
  useEffect(() => {
    const checkStream = async () => {
      try {
        const res = await fetch('/api/external-stream');
        if (res.ok) {
          const data = await res.json();
          setStreamStats({
            connected: data.connected,
            packetCount: data.packetCount,
            lastReceivedMsAgo: data.lastReceivedMsAgo
          });
          if (data.latestData) {
            onIngestSensorData(data.latestData);
          }
        }
      } catch (err) {
        // quiet fallback
      }
    };

    checkStream();
    const interval = setInterval(checkStream, 2000);
    return () => clearInterval(interval);
  }, [onIngestSensorData]);

  // Simulated 1Hz live stream loop if user activates it
  useEffect(() => {
    if (!isAutoStreaming) return;
    const streamInterval = setInterval(async () => {
      try {
        const packet = {
          timestamp_s: Math.round(Date.now() / 1000),
          rpm: Math.round(5000 + (Math.random() - 0.5) * 60),
          cht1_C: +(112 + Math.random() * 3).toFixed(1),
          cht2_C: +(114 + Math.random() * 3).toFixed(1),
          cht3_C: +(116 + Math.random() * 3).toFixed(1),
          cht4_C: +(113 + Math.random() * 3).toFixed(1),
          egt1_C: +(785 + Math.random() * 15).toFixed(1),
          egt2_C: +(792 + Math.random() * 15).toFixed(1),
          egt3_C: +(798 + Math.random() * 15).toFixed(1),
          egt4_C: +(790 + Math.random() * 15).toFixed(1),
          oil_pressure_bar: +(4.2 + (Math.random() - 0.5) * 0.2).toFixed(2),
          oil_temp_C: 98.6,
          fuel_flow_L_h: 22.9,
          vibration_g: +(0.86 + Math.random() * 0.08).toFixed(2),
          battery_V: 28.1,
          altitude_ft: 12500,
          ambient_temp_C: 14.5,
          throttle_pct: 68,
          mission_phase: "CRUISE"
        };
        await fetch('/api/sensor-data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(packet)
        });
      } catch (e) {
        // quiet
      }
    }, 1000);

    return () => clearInterval(streamInterval);
  }, [isAutoStreaming]);

  const copyToClipboard = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const handleSendTestPayload = async () => {
    try {
      const parsed = JSON.parse(testPayload);
      const res = await fetch('/api/sensor-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: testPayload
      });
      const data = await res.json();
      if (res.ok) {
        onIngestSensorData(parsed);
        setTestResult(`Success: Packet received and processed by Digital Twin (Total packets: ${data.packetCount})`);
      } else {
        setTestResult(`API Error: ${data.error || 'Failed to post'}`);
      }
    } catch (err: any) {
      setTestResult(`JSON Syntax Error: ${err.message}`);
    }
  };

  const esp32Code = `/*
 * MALE UAV Aero Piston Engine - ESP32 Wokwi Telemetry Client
 * Smart India Hackathon (SIH) 2026
 * Transmits 14 Aero Sensor Channels via Wi-Fi HTTP POST to Digital Twin Server
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

const char* ssid = "Wokwi-GUEST";
const char* password = "";

// Live Cloud Run Digital Twin Ingress Server Endpoint
const char* serverUrl = "${currentHost}/api/sensor-data";

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("[ESP32] Connecting to Wi-Fi...");
  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\\n[ESP32] Wi-Fi Connected! IP: " + WiFi.localIP().toString());
}

void loop() {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(serverUrl);
    http.addHeader("Content-Type", "application/json");

    // Read physical or simulated engine sensor signals
    StaticJsonDocument<512> doc;
    doc["timestamp_s"] = millis() / 1000;
    doc["rpm"] = 5000 + random(-50, 50);
    doc["cht1_C"] = 112.5 + (random(0, 30) / 10.0);
    doc["cht2_C"] = 114.2 + (random(0, 30) / 10.0);
    doc["cht3_C"] = 115.8 + (random(0, 30) / 10.0);
    doc["cht4_C"] = 113.1 + (random(0, 30) / 10.0);
    doc["egt1_C"] = 786.0 + random(-10, 10);
    doc["egt2_C"] = 792.0 + random(-10, 10);
    doc["egt3_C"] = 798.0 + random(-10, 10);
    doc["egt4_C"] = 789.0 + random(-10, 10);
    doc["oil_pressure_bar"] = 4.2 + (random(-15, 15) / 100.0);
    doc["oil_temp_C"] = 98.5;
    doc["fuel_flow_L_h"] = 22.8;
    doc["vibration_g"] = 0.88 + (random(0, 15) / 100.0);
    doc["battery_V"] = 28.1;
    doc["altitude_ft"] = 12500;
    doc["ambient_temp_C"] = 14.5;
    doc["throttle_pct"] = 68;
    doc["mission_phase"] = "CRUISE";

    String jsonString;
    serializeJson(doc, jsonString);

    int httpCode = http.POST(jsonString);
    if (httpCode > 0) {
      Serial.println("[ESP32] Telemetry sent! HTTP " + String(httpCode));
    } else {
      Serial.println("[ESP32] Error on sending POST: " + String(httpCode));
    }
    http.end();
  }
  delay(1000); // 1Hz transmission rate
}
`;

  const pythonCode = `import requests
import time

# Target Cloud Digital Twin Ingress Endpoint (Run this on your 2nd laptop simulation)
URL = "${currentHost}/api/sensor-data"

print("Starting MALE UAV Telemetry Stream from External Simulation...")

while True:
    # Read sensor values from your Python simulation, MATLAB, Simulink, ROS, or testbench
    sensor_packet = {
        "timestamp_s": int(time.time()),
        "rpm": 5100,
        "cht1_C": 113.5,
        "cht2_C": 115.0,
        "cht3_C": 116.8,
        "cht4_C": 114.2,
        "egt1_C": 788.0,
        "egt2_C": 794.0,
        "egt3_C": 801.0,
        "egt4_C": 790.0,
        "oil_pressure_bar": 4.18,
        "oil_temp_C": 98.2,
        "fuel_flow_L_h": 22.5,
        "vibration_g": 0.89,
        "battery_V": 28.2,
        "altitude_ft": 12500,
        "ambient_temp_C": 15.0,
        "throttle_pct": 68,
        "mission_phase": "CRUISE"
    }
    
    try:
        response = requests.post(URL, json=sensor_packet)
        print(f"Packet sent successfully! HTTP Status: {response.status_code}")
    except Exception as e:
        print("Connection failed:", e)
        
    time.sleep(1.0) # 1Hz streaming rate
`;

  const tinkercadCode = `// ====================================================
// AUTODESK TINKERCAD CIRCUITS - ARDUINO SENSOR CODE
// Paste into Tinkercad Circuits "Code" tab (choose C++)
// Setup: Connect Potentiometers to A0 (CHT), A1 (Oil Pressure), A2 (Throttle)
// ====================================================

void setup() {
  Serial.begin(9600);
}

void loop() {
  // Read Potentiometers / Analog Sensors
  int rawTemp = analogRead(A0);
  int rawPressure = analogRead(A1);
  int rawThrottle = analogRead(A2);

  // Map raw 0-1023 values to aero engine engineering units
  float cht1 = 95.0 + (rawTemp * (40.0 / 1023.0));     // 95°C - 135°C
  float oilPres = 2.0 + (rawPressure * (4.0 / 1023.0)); // 2.0 - 6.0 bar
  int throttle = (rawThrottle * 100) / 1023;           // 0% - 100%
  int rpm = 1200 + (throttle * 40);                    // 1200 - 5200 RPM

  // Print 1-line standard JSON packet to Serial Monitor
  Serial.print("{\\"rpm\\":");
  Serial.print(rpm);
  Serial.print(",\\"cht1_C\\":");
  Serial.print(cht1, 1);
  Serial.print(",\\"cht2_C\\":");
  Serial.print(cht1 + 1.2, 1);
  Serial.print(",\\"cht3_C\\":");
  Serial.print(cht1 + 2.5, 1);
  Serial.print(",\\"cht4_C\\":");
  Serial.print(cht1 + 0.8, 1);
  Serial.print(",\\"oil_pressure_bar\\":");
  Serial.print(oilPres, 2);
  Serial.print(",\\"throttle_pct\\":");
  Serial.print(throttle);
  Serial.println("}");

  delay(1000); // 1Hz telemetry frequency
}
`;

  const tinkercadConsoleBridge = `// =======================================================
// TINKERCAD 1-CLICK DEVTOOLS CONSOLE FORWARDER
// 1. Open your Tinkercad simulation browser tab
// 2. Press F12 (or right click -> Inspect -> Console)
// 3. Paste this code and press Enter
// It will stream Serial Monitor lines directly to Digital Twin!
// =======================================================
const TARGET = "${currentHost}/api/sensor-data";
console.log("🚀 Tinkercad -> Aero Digital Twin Bridge Active!");

setInterval(() => {
  const container = document.querySelector('.code_panel__serial_output_text, pre, code');
  if (!container) return;
  const lines = container.innerText.trim().split('\\n');
  const lastLine = lines[lines.length - 1];
  if (lastLine && lastLine.startsWith('{') && lastLine.endsWith('}')) {
    try {
      const data = JSON.parse(lastLine);
      fetch(TARGET, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      console.log("[Tinkercad -> Aero Twin] Ingested:", data);
    } catch(e) {}
  }
}, 1000);`;

  const [activeCodeTab, setActiveCodeTab] = useState<'tinkercad' | 'python' | 'esp32'>('tinkercad');

  const curlCommand = `curl -X POST ${currentHost}/api/sensor-data \\
  -H "Content-Type: application/json" \\
  -d '{"timestamp_s": 120, "rpm": 5050, "cht1_C": 113.2, "cht2_C": 114.5, "cht3_C": 116.1, "cht4_C": 113.8, "egt1_C": 788, "egt2_C": 794, "egt3_C": 800, "egt4_C": 790, "oil_pressure_bar": 4.25, "oil_temp_C": 98.5, "fuel_flow_L_h": 22.8, "vibration_g": 0.89, "battery_V": 28.1, "altitude_ft": 12500, "ambient_temp_C": 14.5, "throttle_pct": 68, "mission_phase": "CRUISE"}'`;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-yellow-950 border border-yellow-500/40 flex items-center justify-center text-yellow-400">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold font-mono text-white flex items-center gap-2">
              External Laptop & IoT Sensor Bridge (Live Connection Status)
              <span className={`text-[10px] font-sans px-2 py-0.5 rounded border ${
                streamStats.connected 
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-600 animate-pulse' 
                  : 'bg-amber-950 text-amber-300 border-amber-600'
              }`}>
                {streamStats.connected ? '🟢 LIVE CONNECTED FROM 2ND LAPTOP' : '🟡 WAITING FOR EXTERNAL STREAM'}
              </span>
            </h3>
            <p className="text-xs text-slate-400 font-mono">
              Stream live sensor data from a Python simulation, MATLAB, or another laptop directly to this digital twin via REST API.
            </p>
          </div>
        </div>

        {/* Live Bridge Status & Server Health Check */}
        <div className="flex items-center gap-2 flex-wrap text-xs font-mono">
          <button
            id="btn-wake-server"
            onClick={handlePingServer}
            disabled={serverPingStatus.status === 'CHECKING'}
            className="px-3 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition flex items-center gap-1.5 shadow-sm"
          >
            <Zap className={`w-3.5 h-3.5 ${serverPingStatus.status === 'CHECKING' ? 'animate-spin' : ''}`} />
            {serverPingStatus.status === 'CHECKING' ? 'PINGING...' : 'PING / WAKE SERVER'}
          </button>

          <button
            id="btn-auto-stream-toggle"
            onClick={() => setIsAutoStreaming(!isAutoStreaming)}
            className={`px-3 py-1 rounded-lg font-bold border transition flex items-center gap-1.5 ${
              isAutoStreaming
                ? 'bg-emerald-600 border-emerald-400 text-white'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Radio className={`w-3.5 h-3.5 ${isAutoStreaming ? 'animate-pulse text-white' : 'text-slate-400'}`} />
            {isAutoStreaming ? 'STREAMING ACTIVE (1Hz)' : 'SIMULATE 1Hz STREAM'}
          </button>

          <div className={`px-3 py-1 rounded-lg border flex items-center gap-1.5 ${
            streamStats.connected 
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50' 
              : 'bg-slate-950 text-slate-400 border-slate-800'
          }`}>
            <Radio className={`w-3.5 h-3.5 ${streamStats.connected ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`} />
            <span>Packets: <strong className="text-cyan-300">{streamStats.packetCount}</strong></span>
          </div>
        </div>
      </div>

      {/* Big Prominent Connection Status Banner for 2nd Laptop */}
      <div className={`p-4 rounded-xl border flex flex-wrap items-center justify-between gap-4 font-mono ${
        streamStats.connected
          ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-200'
          : 'bg-slate-950 border-amber-500/50 text-amber-200'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
            streamStats.connected ? 'bg-emerald-900 border-emerald-400 text-emerald-300 animate-bounce' : 'bg-amber-900 border-amber-400 text-amber-300 animate-pulse'
          }`}>
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-bold flex items-center gap-2">
              <span>Live Connection Status:</span>
              <span className={streamStats.connected ? 'text-emerald-300 font-extrabold' : 'text-amber-300 font-extrabold'}>
                {streamStats.connected ? 'CONNECTED (Receiving Live Telemetry)' : 'WAITING FOR PACKETS FROM 2ND LAPTOP...'}
              </span>
            </div>
            <div className="text-xs text-slate-300 mt-1">
              Endpoint URL to send from 2nd laptop: <code className="bg-black/50 px-2 py-0.5 rounded text-cyan-300 font-bold">{currentHost}/api/sensor-data</code>
              {streamStats.lastReceivedMsAgo !== null && (
                <span className="ml-2 text-slate-400">({Math.round(streamStats.lastReceivedMsAgo / 1000)}s ago)</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] bg-black/60 px-3 py-1.5 rounded border border-slate-700 text-slate-300">
            {streamStats.packetCount > 0 ? `${streamStats.packetCount} Total Packets Processed` : 'No external packets yet'}
          </span>
        </div>
      </div>

      {serverPingStatus.message && (
        <div className={`p-2.5 rounded-lg text-xs font-mono border flex items-center justify-between ${
          serverPingStatus.status === 'ONLINE'
            ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-300'
            : 'bg-red-950/60 border-red-500/60 text-red-300'
        }`}>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Server Response: <strong>{serverPingStatus.message}</strong></span>
          </div>
          <span className="text-[10px] bg-black/40 px-2 py-0.5 rounded border border-emerald-500/30">
            Port 3000 Active
          </span>
        </div>
      )}

      {/* Available REST API Endpoints Overview */}
      <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 text-xs font-mono">
        <div className="text-slate-300 font-bold mb-2">Available System REST Endpoints:</div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          <div className="bg-slate-900 p-2 rounded border border-slate-800">
            <span className="text-emerald-400 font-bold">POST</span> <code className="text-white">/api/sensor-data</code>
            <p className="text-[10px] text-slate-400 mt-0.5">Ingests live JSON telemetry from ESP32 / Wokwi.</p>
          </div>
          <div className="bg-slate-900 p-2 rounded border border-slate-800">
            <span className="text-cyan-400 font-bold">GET</span> <code className="text-white">/api/engine-status</code>
            <p className="text-[10px] text-slate-400 mt-0.5">Returns current digital twin state and telemetry.</p>
          </div>
          <div className="bg-slate-900 p-2 rounded border border-slate-800">
            <span className="text-cyan-400 font-bold">GET</span> <code className="text-white">/api/health</code>
            <p className="text-[10px] text-slate-400 mt-0.5">Returns calculated Health Score and explanations.</p>
          </div>
          <div className="bg-slate-900 p-2 rounded border border-slate-800">
            <span className="text-cyan-400 font-bold">GET</span> <code className="text-white">/api/rul</code>
            <p className="text-[10px] text-slate-400 mt-0.5">Returns AI Remaining Useful Life prediction.</p>
          </div>
          <div className="bg-slate-900 p-2 rounded border border-slate-800">
            <span className="text-cyan-400 font-bold">GET</span> <code className="text-white">/api/faults</code>
            <p className="text-[10px] text-slate-400 mt-0.5">Returns active and historical fault classifications.</p>
          </div>
          <div className="bg-slate-900 p-2 rounded border border-slate-800">
            <span className="text-cyan-400 font-bold">GET</span> <code className="text-white">/api/recommendations</code>
            <p className="text-[10px] text-slate-400 mt-0.5">Returns actionable operator & maintenance SOPs.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left Side: Live In-Browser Packet Injector / Tester */}
        <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold font-mono text-white flex items-center gap-1.5">
                <Terminal className="w-4 h-4 text-cyan-400" /> In-Browser Hardware Packet Injector
              </span>
              <span className="text-[10px] font-mono text-slate-400">Test API Ingestion</span>
            </div>
            <p className="text-[11px] font-mono text-slate-400 mb-2">
              Send a simulated JSON payload directly to the running backend to verify real-time processing:
            </p>
            <textarea
              value={testPayload}
              onChange={e => setTestPayload(e.target.value)}
              rows={12}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 font-mono text-xs text-cyan-300 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="mt-3">
            <button
              onClick={handleSendTestPayload}
              className="w-full py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs font-mono transition shadow-md flex items-center justify-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" /> POST Sensor Packet to /api/sensor-data
            </button>

            {testResult && (
              <div className={`mt-2 p-2 rounded text-[11px] font-mono border ${
                testResult.startsWith('Success') 
                  ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300' 
                  : 'bg-red-950/60 border-red-500/50 text-red-300'
              }`}>
                {testResult}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Python / ESP32 Code Snippet */}
        <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4 text-yellow-400" />
                <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded border border-slate-800">
                  <button
                    onClick={() => setActiveCodeTab('tinkercad')}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition ${
                      activeCodeTab === 'tinkercad' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Tinkercad Circuits (Arduino)
                  </button>
                  <button
                    onClick={() => setActiveCodeTab('python')}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition ${
                      activeCodeTab === 'python' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Python (2nd Laptop)
                  </button>
                  <button
                    onClick={() => setActiveCodeTab('esp32')}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition ${
                      activeCodeTab === 'esp32' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    ESP32 / Wokwi
                  </button>
                </div>
              </div>
              <button
                onClick={() => {
                  const codeToCopy = activeCodeTab === 'tinkercad' 
                    ? tinkercadCode 
                    : (activeCodeTab === 'python' ? pythonCode : esp32Code);
                  copyToClipboard(codeToCopy, activeCodeTab);
                }}
                className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 text-[10px] font-mono transition"
              >
                {copiedSection === activeCodeTab ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                {copiedSection === activeCodeTab ? 'Copied!' : 'Copy Code'}
              </button>
            </div>
            
            {activeCodeTab === 'tinkercad' && (
              <div className="mb-2 p-2 rounded bg-cyan-950/40 border border-cyan-500/30 text-[10px] font-mono text-cyan-200">
                <span className="font-bold">Step 1:</span> Paste Arduino code below into your Tinkercad Circuit. Click "Start Simulation".
              </div>
            )}

            <pre className="bg-slate-900 border border-slate-800 rounded-lg p-2.5 font-mono text-[10px] text-slate-300 overflow-x-auto max-h-[220px]">
              {activeCodeTab === 'tinkercad' ? tinkercadCode : (activeCodeTab === 'python' ? pythonCode : esp32Code)}
            </pre>

            {activeCodeTab === 'tinkercad' && (
              <div className="mt-3 pt-3 border-t border-slate-800">
                <div className="flex items-center justify-between mb-1 text-[10px] font-mono text-amber-300">
                  <span className="font-bold">Step 2: Tinkercad Browser Console Auto-Streamer (F12):</span>
                  <button
                    onClick={() => copyToClipboard(tinkercadConsoleBridge, 'tk_console')}
                    className="flex items-center gap-1 text-cyan-400 hover:underline"
                  >
                    {copiedSection === 'tk_console' ? 'Copied!' : 'Copy Console Bridge'}
                  </button>
                </div>
                <pre className="bg-slate-900 p-2 rounded text-[9px] font-mono text-slate-300 overflow-x-auto max-h-24">
                  {tinkercadConsoleBridge}
                </pre>
              </div>
            )}
          </div>

          {/* cURL command snippet */}
          <div className="mt-3 pt-3 border-t border-slate-800">
            <div className="flex items-center justify-between mb-1 text-[10px] font-mono text-slate-400">
              <span>Test via Command Line / Terminal (cURL):</span>
              <button
                onClick={() => copyToClipboard(curlCommand, 'curl')}
                className="flex items-center gap-1 text-cyan-400 hover:underline"
              >
                {copiedSection === 'curl' ? 'Copied!' : 'Copy cURL'}
              </button>
            </div>
            <pre className="bg-slate-900 p-2 rounded text-[9px] font-mono text-cyan-200 overflow-x-auto">
              {curlCommand}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
