import React, { useState } from 'react';
import { Sliders, X, CheckCircle2, RotateCcw, AlertTriangle } from 'lucide-react';
import { incidentsApi } from '../../services/api';

interface PriorityWeightsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

export const PriorityWeightsModal: React.FC<PriorityWeightsModalProps> = ({
  isOpen,
  onClose,
  onRefresh
}) => {
  const [wSev, setWSev] = useState(0.30);
  const [wPeo, setWPeo] = useState(0.25);
  const [wVul, setWVul] = useState(0.15);
  const [wAcc, setWAcc] = useState(0.10);
  const [wCnf, setWCnf] = useState(0.10);
  const [wTim, setWTim] = useState(0.10);

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const totalSum = roundVal(wSev + wPeo + wVul + wAcc + wCnf + wTim);

  function roundVal(v: number) {
    return Math.round(v * 100) / 100;
  }

  const handleReset = () => {
    setWSev(0.30);
    setWPeo(0.25);
    setWVul(0.15);
    setWAcc(0.10);
    setWCnf(0.10);
    setWTim(0.10);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await incidentsApi.recalculateWeights({
        weight_severity: wSev,
        weight_people_at_risk: wPeo,
        weight_vulnerability: wVul,
        weight_access_difficulty: wAcc,
        weight_confidence: wCnf,
        weight_time_criticality: wTim
      });
      setSuccessMsg(`Recalculated priority scores across ${res.recalculated_incidents} incidents!`);
      setTimeout(() => {
        setSuccessMsg('');
        onRefresh();
        onClose();
      }, 1200);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-dark-800 border border-gray-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-red-600/20 text-red-400 border border-red-500/40">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white uppercase tracking-wider">ADMIN PRIORITY FORMULA WEIGHTS</h3>
              <p className="text-xs text-gray-400 font-mono">Dynamic Multi-Factor Priority Weight Configurator</p>
            </div>
          </div>

          <button onClick={onClose} className="text-gray-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {successMsg && (
          <div className="bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 p-3 rounded-lg text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Formula Display */}
        <div className="bg-gray-900 p-3 rounded-xl border border-gray-800 font-mono text-[11px] text-gray-300 space-y-1">
          <div className="font-bold text-amber-400">Formula Weights Sum: {totalSum} (Target 1.00)</div>
          <div>Priority = (w1*Sev + w2*People + w3*Vuln + w4*Access + w5*Conf + w6*Time)</div>
        </div>

        {/* Sliders Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div>
            <div className="flex justify-between text-xs font-bold text-gray-300 mb-1">
              <span>Threat Severity Weight</span>
              <span className="font-mono text-red-400">{wSev.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="0.6"
              step="0.05"
              value={wSev}
              onChange={(e) => setWSev(parseFloat(e.target.value))}
              className="w-full text-red-500"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-bold text-gray-300 mb-1">
              <span>People at Risk Weight</span>
              <span className="font-mono text-amber-400">{wPeo.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="0.6"
              step="0.05"
              value={wPeo}
              onChange={(e) => setWPeo(parseFloat(e.target.value))}
              className="w-full text-amber-500"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-bold text-gray-300 mb-1">
              <span>Vulnerability Index Weight</span>
              <span className="font-mono text-blue-400">{wVul.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="0.4"
              step="0.05"
              value={wVul}
              onChange={(e) => setWVul(parseFloat(e.target.value))}
              className="w-full text-blue-500"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-bold text-gray-300 mb-1">
              <span>Access Blockage Weight</span>
              <span className="font-mono text-purple-400">{wAcc.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="0.3"
              step="0.05"
              value={wAcc}
              onChange={(e) => setWAcc(parseFloat(e.target.value))}
              className="w-full text-purple-500"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-bold text-gray-300 mb-1">
              <span>Confidence Score Weight</span>
              <span className="font-mono text-cyan-400">{wCnf.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="0.3"
              step="0.05"
              value={wCnf}
              onChange={(e) => setWCnf(parseFloat(e.target.value))}
              className="w-full text-cyan-500"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-bold text-gray-300 mb-1">
              <span>Time Criticality Weight</span>
              <span className="font-mono text-emerald-400">{wTim.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="0.3"
              step="0.05"
              value={wTim}
              onChange={(e) => setWTim(parseFloat(e.target.value))}
              className="w-full text-emerald-500"
            />
          </div>

          <div className="pt-2 flex items-center justify-between">
            <button
              type="button"
              onClick={handleReset}
              className="text-xs text-gray-400 hover:text-white flex items-center gap-1 font-semibold"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Defaults
            </button>

            <button
              type="submit"
              disabled={loading}
              className="bg-red-600 hover:bg-red-500 text-white text-xs font-bold px-5 py-2 rounded-lg shadow-lg"
            >
              {loading ? 'RECALCULATING...' : 'APPLY & RECALCULATE INCIDENTS'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
