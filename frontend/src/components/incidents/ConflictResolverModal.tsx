import React, { useState } from 'react';
import { AlertTriangle, X, CheckCircle2, ShieldCheck, Check } from 'lucide-react';
import { IncidentConflict } from '../../types';
import { conflictsApi } from '../../services/api';
import { useToast } from '../common/Toast';

interface ConflictResolverModalProps {
  conflict: IncidentConflict | null;
  onClose: () => void;
  onRefresh: () => void;
}

export const ConflictResolverModal: React.FC<ConflictResolverModalProps> = ({
  conflict,
  onClose,
  onRefresh
}) => {
  const { success, error } = useToast();
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [selectedClaim, setSelectedClaim] = useState<'a' | 'b'>('b');
  const [loading, setLoading] = useState(false);

  if (!conflict) return null;

  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const winningId = selectedClaim === 'a' ? conflict.report_a_id : conflict.report_b_id;
      const finalNotes = resolutionNotes || `Accepted Claim ${selectedClaim.toUpperCase()} as ground truth after operator review.`;
      await conflictsApi.resolve(conflict.id, finalNotes, winningId);
      success('Contradiction Resolved', `Accepted Claim ${selectedClaim.toUpperCase()} as authoritative truth.`);
      onRefresh();
      onClose();
    } catch (err: any) {
      error('Resolution Failed', err?.message || 'Could not resolve conflict');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-amber-500/40 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white uppercase tracking-wider">
                CONTRADICTION RESOLUTION PANEL
              </h3>
              <p className="text-xs text-slate-400 font-mono">Resolve Conflicting Evidence from Ground Sources</p>
            </div>
          </div>

          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Conflict Description */}
        <div className="bg-amber-950/20 border border-amber-500/30 p-3.5 rounded-xl text-xs text-amber-300">
          <span className="font-bold text-white">Discrepancy Detected: </span>
          {conflict.description || `Conflicting claims between Report ${conflict.report_a_id} and Report ${conflict.report_b_id}`}
        </div>

        {/* Side-by-Side Claim Selection Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          
          <div 
            onClick={() => setSelectedClaim('a')}
            className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
              selectedClaim === 'a' 
                ? 'border-red-500 bg-red-950/30 ring-2 ring-red-500/50 shadow-lg shadow-red-950' 
                : 'border-slate-800 bg-slate-950/80 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between font-bold text-red-400 mb-1.5">
              <span>EVIDENCE CLAIM A</span>
              {selectedClaim === 'a' && (
                <span className="bg-red-600 text-white p-0.5 rounded-full">
                  <Check className="w-3 h-3" />
                </span>
              )}
            </div>
            <p className="text-slate-200 text-[11px] leading-relaxed font-sans">{conflict.claim_a}</p>
          </div>

          <div 
            onClick={() => setSelectedClaim('b')}
            className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
              selectedClaim === 'b' 
                ? 'border-emerald-500 bg-emerald-950/30 ring-2 ring-emerald-500/50 shadow-lg shadow-emerald-950' 
                : 'border-slate-800 bg-slate-950/80 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between font-bold text-emerald-400 mb-1.5">
              <span>EVIDENCE CLAIM B</span>
              {selectedClaim === 'b' && (
                <span className="bg-emerald-600 text-white p-0.5 rounded-full">
                  <Check className="w-3 h-3" />
                </span>
              )}
            </div>
            <p className="text-slate-200 text-[11px] leading-relaxed font-sans">{conflict.claim_b}</p>
          </div>

        </div>

        {/* Resolution Form */}
        <form onSubmit={handleResolve} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">OPERATOR RESOLUTION RATIONALE</label>
            <textarea
              rows={3}
              placeholder="e.g. Verified by Field Officer via live telemetry; rejecting unverified social media claim..."
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              required
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-lg flex items-center gap-1.5 shadow-lg transition-all"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{loading ? 'RESOLVING...' : 'CONFIRM & MARK RESOLVED'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
