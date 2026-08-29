import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, FastForward, Activity, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { simulationApi } from '../../services/api';
import { SimulationStatus } from '../../types';

interface SimulationControlsProps {
  onSimulationUpdate?: () => void;
}

export const SimulationControls: React.FC<SimulationControlsProps> = ({ onSimulationUpdate }) => {
  const [status, setStatus] = useState<SimulationStatus | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchStatus = async () => {
    try {
      const data = await simulationApi.getStatus();
      setStatus(data);
    } catch (err) {
      console.error('Failed to fetch simulation status', err);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleStart = async () => {
    setLoading(true);
    const data = await simulationApi.start();
    setStatus(data);
    setLoading(false);
    onSimulationUpdate?.();
  };

  const handlePause = async () => {
    setLoading(true);
    const data = await simulationApi.pause();
    setStatus(data);
    setLoading(false);
  };

  const handleStep = async () => {
    setLoading(true);
    const data = await simulationApi.step();
    setStatus(data);
    setLoading(false);
    onSimulationUpdate?.();
  };

  const handleReset = async () => {
    setLoading(true);
    const data = await simulationApi.reset();
    setStatus(data);
    setLoading(false);
    onSimulationUpdate?.();
  };

  const handleSpeed = async (speed: number) => {
    const data = await simulationApi.setSpeed(speed);
    setStatus(data);
  };

  if (!status) return null;

  return (
    <div className="bg-dark-800 border-b border-amber-500/30 px-4 py-2.5 shadow-lg">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        
        {/* Left Status & Scenario Info */}
        <div className="flex items-center gap-3">
          <span className="bg-amber-500/20 text-amber-400 border border-amber-500/40 px-2 py-0.5 rounded font-bold uppercase tracking-wider flex items-center gap-1 text-[11px]">
            <Activity className="w-3.5 h-3.5 animate-pulse" />
            HACKATHON SIMULATION SCENARIO
          </span>
          <span className="text-gray-200 font-medium truncate max-w-xs">{status.scenario_name}</span>
        </div>

        {/* Center Control Buttons */}
        <div className="flex items-center gap-2">
          {!status.is_running ? (
            <button
              onClick={handleStart}
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1 rounded font-semibold flex items-center gap-1 transition-all shadow"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              START SCENARIO
            </button>
          ) : (
            <button
              onClick={handlePause}
              disabled={loading}
              className="bg-amber-600 hover:bg-amber-500 text-white px-3 py-1 rounded font-semibold flex items-center gap-1 transition-all shadow"
            >
              <Pause className="w-3.5 h-3.5 fill-current" />
              PAUSE
            </button>
          )}

          <button
            onClick={handleStep}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-500 text-white px-2.5 py-1 rounded font-medium flex items-center gap-1 transition-all"
            title="Advance 1 Time Step"
          >
            <FastForward className="w-3.5 h-3.5" />
            NEXT STEP
          </button>

          <button
            onClick={handleReset}
            disabled={loading}
            className="bg-gray-700 hover:bg-gray-600 text-gray-200 px-2.5 py-1 rounded font-medium flex items-center gap-1 transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            RESET
          </button>

          {/* Speed Multipliers */}
          <div className="flex items-center gap-1 ml-2 bg-gray-900 border border-gray-700 rounded p-0.5">
            {[1, 5, 10].map((s) => (
              <button
                key={s}
                onClick={() => handleSpeed(s)}
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                  status.speed_multiplier === s ? 'bg-amber-500 text-black' : 'text-gray-400 hover:text-white'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>

        {/* Right Event Ticker Banner */}
        <div className="flex items-center gap-2 text-gray-300 font-mono text-[11px] truncate max-w-sm bg-gray-900 px-2.5 py-1 rounded border border-gray-700">
          <span className="text-amber-400 font-bold">{status.current_time_step}</span>
          <span className="text-gray-500">|</span>
          <span className="truncate">{status.messages[status.messages.length - 1]}</span>
        </div>

      </div>
    </div>
  );
};
