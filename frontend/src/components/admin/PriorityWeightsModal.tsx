import React, { useState } from 'react';
import { Sliders, X, CheckCircle2, RotateCcw, AlertTriangle, ShieldCheck } from 'lucide-react';
import { incidentsApi } from '../../services/api';
import { useToast } from '../common/Toast';

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
  const { success, error, warning } = useToast();
  const [wSev, setWSev] = useState(0.30);
  const [wPeo, setWPeo] = useState(0.25);
  const [wVul, setWVul] = useState(0.15);
  const [wAcc, setWAcc] = useState(0.10);
  const [wCnf, setWCnf] = useState(0.10);
  const [wTim, setWTim] = useState(0.10);

  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  function roundVal(v: number) {
    return Math.round(v * 100) / 100;
  }

  const totalSum = roundVal(wSev + wPeo + wVul + wAcc + wCnf + wTim);

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
    if (totalSum > 1.05 || totalSum < 0.95) {
      warning('Weight Calibration Notice', `Weights sum to ${totalSum}. Standard normalized sum is 1.00.`);
    }

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
      success('Priority Weights Updated', `Recalculated priority scores across ${res.recalculated_incidents} incidents!`);
      onRefresh();
      onClose();
    } catch (err: any) {
      error('Recalculation Failed', err?.message || 'Could not update weights');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-red-600/20 text-red-400 border border-red-500/40">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white uppercase tracking-wider">
                ADMIN PRIORITY FORMULA WEIGHTS
              </h3>
              <p className="text-xs text-slate-400 font-mono">Dynamic Multi-Factor Decision Formula Tuning</p>
            </div>
          </div>

          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formula Status Banner */}
        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-300 space-y-1">
          <div className="flex items-center justify-between font-bold">
            <span>Weights Sum Total:</span>
            <span className={totalSum === 1.00 ? 'text-emerald-400 font-black' : 'text-amber-400 font-black'}>
              {totalSum.toFixed(2)} / 1.00
            </span>
          </div>
          <div className="text-[10px] text-slate-500">
            Priority = (w1*Severity + w2*People + w3*Vuln + w4*Access + w5*Conf + w6*Time)
          </div>
        </div>

        {/* Sliders Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          
          <div>
            <div className="flex justify-between font-bold text-slate-300 mb-1">
              <span>Threat Severity Weight</span>
              <span className="font-mono text-red-400 font-bold">{wSev.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="0.6"
              step="0.05"
              value={wSev}
              onChange={(e) => setWSev(parseFloat(e.target.value))}
              className="w-full accent-red-500"
            />
          </div>

          <div>
            <div className="flex justify-between font-bold text-slate-300 mb-1">
              <span>People at Risk Weight</span>
              <span className="font-mono text-amber-400 font-bold">{wPeo.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="0.6"
              step="0.05"
              value={wPeo}
              onChange={(e) => setWPeo(parseFloat(e.target.value))}
              className="w-full accent-amber-500"
            />
          </div>

          <div>
            <div className="flex justify-between font-bold text-slate-300 mb-1">
              <span>Vulnerability Index Weight</span>
              <span className="font-mono text-blue-400 font-bold">{wVul.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="0.4"
              step="0.05"
              value={wVul}
              onChange={(e) => setWVul(parseFloat(e.target.value))}
              className="w-full accent-blue-500"
            />
          </div>

          <div>
            <div className="flex justify-between font-bold text-slate-300 mb-1">
              <span>Access Blockage Weight</span>
              <span className="font-mono text-purple-400 font-bold">{wAcc.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="0.3"
              step="0.05"
              value={wAcc}
              onChange={(e) => setWAcc(parseFloat(e.target.value))}
              className="w-full accent-purple-500"
            />
          </div>

          <div>
            <div className="flex justify-between font-bold text-slate-300 mb-1">
              <span>Confidence Score Weight</span>
              <span className="font-mono text-cyan-400 font-bold">{wCnf.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="0.3"
              step="0.05"
              value={wCnf}
              onChange={(e) => setWCnf(parseFloat(e.target.value))}
              className="w-full accent-cyan-500"
            />
          </div>

          <div>
            <div className="flex justify-between font-bold text-slate-300 mb-1">
              <span>Time Criticality Weight</span>
              <span className="font-mono text-emerald-400 font-bold">{wTim.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="0.3"
              step="0.05"
              value={wTim}
              onChange={(e) => setWTim(parseFloat(e.target.value))}
              className="w-full accent-emerald-500"
            />
          </div>

          <div className="pt-2 flex items-center justify-between">
            <button
              type="button"
              onClick={handleReset}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1 font-semibold"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Defaults</span>
            </button>

            <button
              type="submit"
              disabled={loading}
              className="bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-xs font-black px-5 py-2.5 rounded-lg shadow-lg flex items-center gap-1.5 transition-colors"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{loading ? 'RECALCULATING...' : 'APPLY & RECALCULATE'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
