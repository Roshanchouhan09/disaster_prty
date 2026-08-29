import React, { useState } from 'react';
import { AlertTriangle, X, CheckCircle2, ShieldCheck } from 'lucide-react';
import { IncidentConflict } from '../../types';
import { conflictsApi } from '../../services/api';

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
      onRefresh();
      onClose();
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-dark-800 border border-amber-500/40 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/40">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white uppercase tracking-wider">CONTRADICTION RESOLUTION INTERFACE</h3>
              <p className="text-xs text-gray-400 font-mono">Resolve Contradictory Evidence Claims</p>
            </div>
          </div>

          <button onClick={onClose} className="text-gray-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Conflict Description */}
        <div className="bg-amber-950/20 border border-amber-500/30 p-3 rounded-xl text-xs text-amber-300">
          <span className="font-bold">Issue Flagged:</span> {conflict.description}
        </div>

        {/* Side-by-Side Claim Selection */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          
          <div 
            onClick={() => setSelectedClaim('a')}
            className={`p-3 rounded-xl border cursor-pointer transition-all ${
              selectedClaim === 'a' ? 'border-red-500 bg-red-950/20 ring-1 ring-red-500' : 'border-gray-800 bg-gray-900'
            }`}
          >
            <div className="flex items-center justify-between font-bold text-red-400 mb-1">
              <span>EVIDENCE CLAIM A</span>
              {selectedClaim === 'a' && <CheckCircle2 className="w-4 h-4 text-red-400" />}
            </div>
            <p className="text-gray-200">{conflict.claim_a}</p>
          </div>

          <div 
            onClick={() => setSelectedClaim('b')}
            className={`p-3 rounded-xl border cursor-pointer transition-all ${
              selectedClaim === 'b' ? 'border-emerald-500 bg-emerald-950/20 ring-1 ring-emerald-500' : 'border-gray-800 bg-gray-900'
            }`}
          >
            <div className="flex items-center justify-between font-bold text-emerald-400 mb-1">
              <span>EVIDENCE CLAIM B</span>
              {selectedClaim === 'b' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
            </div>
            <p className="text-gray-200">{conflict.claim_b}</p>
          </div>

        </div>

        {/* Resolution Form */}
        <form onSubmit={handleResolve} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-300 mb-1">RESOLUTION JUSTIFICATION NOTES</label>
            <textarea
              rows={3}
              placeholder="Enter operator resolution rationale..."
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              className="w-full bg-dark-900 border border-gray-700 rounded-lg p-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
              required
            />
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-semibold rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-black text-xs font-extrabold rounded-lg flex items-center gap-1.5 shadow-lg"
            >
              <ShieldCheck className="w-4 h-4" />
              CONFIRM & MARK RESOLVED
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
