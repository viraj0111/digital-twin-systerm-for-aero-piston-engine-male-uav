import React, { useState, useRef } from 'react';
import { 
  Upload, 
  Download, 
  FileText, 
  Play, 
  CheckCircle2, 
  AlertCircle, 
  Database, 
  FolderArchive,
  RotateCcw
} from 'lucide-react';
import { EngineTelemetry } from '../types/engine';
import { PRESET_DATASETS, parseCsvToTelemetry, telemetryToCsv } from '../data/datasets';

interface CsvDataStudioProps {
  currentTelemetryHistory: EngineTelemetry[];
  activeDatasetName?: string;
  onLoadDataset: (dataset: EngineTelemetry[], name: string) => void;
}

export const CsvDataStudio: React.FC<CsvDataStudioProps> = ({
  currentTelemetryHistory,
  activeDatasetName,
  onLoadDataset
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (file: File) => {
    setUploadError(null);
    setUploadSuccess(null);

    if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
      setUploadError('Please select a valid .csv file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = parseCsvToTelemetry(text);
        if (parsed.length === 0) {
          setUploadError('Failed to parse telemetry rows from CSV. Check headers.');
          return;
        }
        onLoadDataset(parsed, file.name);
        setUploadSuccess(`Successfully loaded ${parsed.length} telemetry records from "${file.name}"!`);
      } catch (err: any) {
        setUploadError(`CSV Parse Error: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const downloadCurrentSessionCsv = () => {
    const csvContent = telemetryToCsv(currentTelemetryHistory);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `male_uav_telemetry_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadSampleTemplate = () => {
    const sample = PRESET_DATASETS[0].getData();
    const csvContent = telemetryToCsv(sample.slice(0, 10));
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'male_uav_template_sample.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-950 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <Upload className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold font-mono text-white flex items-center gap-2">
              CSV Telemetry Ingestion & Mission Replay Studio
              <span className="text-[10px] font-sans px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                Hardware-Independent
              </span>
            </h3>
            <p className="text-xs text-slate-400 font-mono">
              Upload custom UAV flight test recordings or replay pre-packaged aerospace demonstration datasets
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={downloadSampleTemplate}
            className="flex items-center gap-1.5 px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono transition border border-slate-700"
            title="Download CSV template format"
          >
            <FileText className="w-3.5 h-3.5 text-cyan-400" /> Download Template CSV
          </button>

          <button
            onClick={downloadCurrentSessionCsv}
            className="flex items-center gap-1.5 px-3 py-1 rounded bg-cyan-700 hover:bg-cyan-600 text-white text-xs font-mono transition font-bold shadow-sm"
            title="Export live telemetry run to CSV"
          >
            <Download className="w-3.5 h-3.5" /> Export Active Run
          </button>
        </div>
      </div>

      {/* Upload Drag-and-Drop Zone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 ${
          dragActive 
            ? 'border-cyan-400 bg-cyan-950/40 ring-2 ring-cyan-500/30' 
            : 'border-slate-700 hover:border-cyan-500/60 bg-slate-950/60 hover:bg-slate-950/90'
        }`}
      >
        <input 
          ref={fileInputRef}
          type="file" 
          accept=".csv,text/csv" 
          onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
          className="hidden" 
        />
        <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center mx-auto mb-2 text-cyan-400">
          <Upload className="w-6 h-6" />
        </div>
        <h4 className="text-sm font-bold font-mono text-white mb-1">
          Drop CSV Flight Telemetry File Here, or Click to Browse
        </h4>
        <p className="text-xs text-slate-400 font-mono max-w-md mx-auto leading-relaxed">
          Supports standard aerospace telemetry columns (<code className="text-cyan-300">timestamp_s</code>, <code className="text-cyan-300">rpm</code>, <code className="text-cyan-300">cht1_C..cht4_C</code>, <code className="text-cyan-300">egt1_C..egt4_C</code>, <code className="text-cyan-300">oil_pressure_bar</code>, etc.)
        </p>

        {uploadSuccess && (
          <div className="mt-3 p-2 bg-emerald-950/60 border border-emerald-500/60 text-emerald-300 rounded-lg text-xs font-mono flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> {uploadSuccess}
          </div>
        )}

        {uploadError && (
          <div className="mt-3 p-2 bg-red-950/60 border border-red-500/60 text-red-300 rounded-lg text-xs font-mono flex items-center justify-center gap-2">
            <AlertCircle className="w-4 h-4" /> {uploadError}
          </div>
        )}
      </div>

      {/* Pre-Packaged Benchmark Datasets */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-bold font-mono text-slate-300 uppercase flex items-center gap-2">
            <Database className="w-3.5 h-3.5 text-cyan-400" /> Pre-Packaged Demonstration Mission Datasets
          </h4>
          <span className="text-[11px] font-mono text-slate-400">
            Active Dataset: <strong className="text-cyan-300">{activeDatasetName || 'Internal Simulation'}</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {PRESET_DATASETS.map(item => {
            const isActive = activeDatasetName === item.meta.name;
            return (
              <div 
                key={item.meta.id}
                className={`rounded-xl p-3.5 border text-xs font-mono transition flex flex-col justify-between ${
                  isActive 
                    ? 'bg-cyan-950/30 border-cyan-500/70 ring-1 ring-cyan-500/30 shadow-lg' 
                    : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-white text-xs">{item.meta.name}</span>
                    {isActive && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 font-bold">
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-cyan-400 font-semibold mb-1">
                    Scenario: {item.meta.scenario}
                  </div>
                  <p className="text-[11px] text-slate-400 leading-snug mb-3">
                    {item.meta.description}
                  </p>

                  <div className="space-y-1 mb-3">
                    {item.meta.features.map((f, idx) => (
                      <div key={idx} className="text-[10px] text-slate-300 flex items-center gap-1">
                        <span className="w-1 h-1 rounded-full bg-cyan-400" /> {f}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-[10px] text-slate-500">
                    {item.meta.recordCount} Epochs ({item.meta.duration_s}s)
                  </span>
                  <button
                    onClick={() => {
                      const data = item.getData();
                      onLoadDataset(data, item.meta.name);
                    }}
                    className="px-3 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs font-mono transition flex items-center gap-1 shadow-sm"
                  >
                    <Play className="w-3 h-3 fill-current" /> Replay Dataset
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Transparent Disclaimer Notice */}
      <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg text-[11px] font-mono text-slate-400">
        <strong className="text-slate-300">Aerospace Verification Notice:</strong> The built-in demonstration datasets are synthetic thermodynamic flight tracks modeled on Rotax 914/915 MALE UAV piston engine characteristics. They do NOT represent classified defense flight recordings.
      </div>
    </div>
  );
};
