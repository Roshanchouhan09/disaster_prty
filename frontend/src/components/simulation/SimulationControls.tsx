import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, FastForward, Activity, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { simulationApi } from '../../services/api';
import { SimulationStatus } from '../../types';
import { useToast } from '../common/Toast';
import { ConfirmModal } from '../common/ConfirmModal';

interface SimulationControlsProps {
  onSimulationUpdate?: () => void;
}

const DEFAULT_SIM_STATUS: SimulationStatus = {
  is_running: false,
  current_time_step: 'Initial State (T+00m)',
  speed_multiplier: 5,
  scenario_name: 'North River District Multi-Hazard Flash Flood & Earthquake',
  reports_generated_count: 0,
  incidents_active_count: 0,
  messages: ['Simulation engine ready. Click START SCENARIO to demonstrate timeline.']
};

export const SimulationControls: React.FC<SimulationControlsProps> = ({ onSimulationUpdate }) => {
  const { success, info, warning } = useToast();
  const [status, setStatus] = useState<SimulationStatus>(DEFAULT_SIM_STATUS);
  const [loading, setLoading] = useState(false);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);

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
    try {
      const data = await simulationApi.start();
      setStatus(data);
      success('Simulation Started', 'Executing multi-hazard disaster timeline.');
      onSimulationUpdate?.();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePause = async () => {
    setLoading(true);
    try {
      const data = await simulationApi.pause();
      setStatus(data);
      info('Simulation Paused', 'Timeline progression held.');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStep = async () => {
    setLoading(true);
    try {
      const data = await simulationApi.step();
      setStatus(data);
      info('Timeline Advanced', data.current_time_step);
      onSimulationUpdate?.();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmReset = async () => {
    setLoading(true);
    try {
      const data = await simulationApi.reset();
      setStatus(data);
      warning('Simulation Reset', 'Scenario timeline rewound to initial state.');
      setResetConfirmOpen(false);
      onSimulationUpdate?.();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSpeed = async (speed: number) => {
    try {
      const data = await simulationApi.setSpeed(speed);
      setStatus(data);
      info('Playback Speed Adjusted', `Set to ${speed}x playback speed.`);
    } catch (err) {
      console.error(err);
    }
  };

  if (!status) return null;

  return (
    <>
      <div className="bg-slate-900 border-b border-amber-500/30 px-2 sm:px-4 py-2.5 shadow-xl">
        <div className="w-full max-w-[1720px] mx-auto px-2 sm:px-4 lg:px-6 xl:px-8 flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
          
          {/* Left Status & Scenario Info */}
          <div className="flex items-center gap-2.5 w-full md:w-auto">
            <span className="bg-amber-500/20 text-amber-400 border border-amber-500/40 px-2.5 py-1 rounded-lg font-black uppercase tracking-wider flex items-center gap-1.5 text-[11px] shrink-0">
              <Activity className="w-3.5 h-3.5 animate-pulse text-amber-400" />
              <span>DEMO SCENARIO PLAYER</span>
            </span>
            <span className="text-slate-200 font-semibold truncate max-w-sm hidden sm:inline">
              {status.scenario_name}
            </span>
          </div>

          {/* Center Playback Controls */}
          <div className="flex items-center gap-2 w-full md:w-auto justify-center">
            {!status.is_running ? (
              <button
                onClick={handleStart}
                disabled={loading}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all shadow-md shadow-emerald-950 active:scale-95"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>START SCENARIO</span>
              </button>
            ) : (
              <button
                onClick={handlePause}
                disabled={loading}
                className="bg-amber-600 hover:bg-amber-500 text-white px-3.5 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all shadow-md shadow-amber-950 active:scale-95"
              >
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span>PAUSE</span>
              </button>
            )}

            <button
              onClick={handleStep}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all active:scale-95"
              title="Advance 1 Time Step"
            >
              <FastForward className="w-3.5 h-3.5" />
              <span>STEP NEXT</span>
            </button>

            <button
              onClick={() => setResetConfirmOpen(true)}
              disabled={loading}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-2.5 py-1.5 rounded-lg font-semibold flex items-center gap-1 transition-all border border-slate-700"
              title="Reset scenario"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">RESET</span>
            </button>

            {/* Speed Multipliers */}
            <div className="flex items-center gap-1 ml-1 bg-slate-950 border border-slate-800 rounded-lg p-0.5 font-mono">
              {[1, 5, 10].map((s) => (
                <button
                  key={s}
                  onClick={() => handleSpeed(s)}
                  className={`px-2 py-0.5 rounded text-[10px] font-black transition-colors ${
                    status.speed_multiplier === s 
                      ? 'bg-amber-500 text-slate-950 shadow' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>
          </div>

          {/* Right Event Ticker Banner */}
          <div className="flex items-center gap-2 text-slate-300 font-mono text-[11px] truncate max-w-sm bg-slate-950 px-3 py-1 rounded-lg border border-slate-800 w-full md:w-auto">
            <span className="text-amber-400 font-bold shrink-0">{status.current_time_step}</span>
            <span className="text-slate-600">|</span>
            <span className="truncate text-slate-300">{status.messages[status.messages.length - 1]}</span>
          </div>

        </div>
      </div>

      <ConfirmModal
        isOpen={resetConfirmOpen}
        title="Reset Disaster Scenario"
        message="Are you sure you want to reset the simulation timeline to initial T+00m state?"
        confirmLabel="Reset Simulation"
        confirmVariant="warning"
        isLoading={loading}
        onConfirm={handleConfirmReset}
        onCancel={() => setResetConfirmOpen(false)}
      />
    </>
  );
};
