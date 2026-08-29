import React, { useState, useEffect } from 'react';
import { FileText, X, Download, Printer, Sparkles, RefreshCw } from 'lucide-react';
import { incidentsApi } from '../../services/api';

interface ExecutiveBriefingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExecutiveBriefingModal: React.FC<ExecutiveBriefingModalProps> = ({ isOpen, onClose }) => {
  const [briefingText, setBriefingText] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchBriefing = async () => {
    setLoading(true);
    try {
      const res = await incidentsApi.generateBriefing();
      setBriefingText(res.briefing);
    } catch (err) {
      console.error('Failed to generate AI briefing', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      fetchBriefing();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-dark-800 border border-gray-700 rounded-2xl max-w-3xl w-full max-h-[85vh] overflow-y-auto p-6 shadow-2xl flex flex-col space-y-4">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-red-600/20 text-red-400 border border-red-500/40">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                EXECUTIVE EOC SITUATIONAL BRIEFING
                <Sparkles className="w-4 h-4 text-amber-400" />
              </h3>
              <p className="text-xs text-gray-400 font-mono">AI Synthesized Command Briefing Report</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchBriefing}
              disabled={loading}
              className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs flex items-center gap-1 font-semibold"
              title="Regenerate with AI"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-white p-1 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Box */}
        <div className="bg-gray-900/90 p-5 rounded-xl border border-gray-800 font-mono text-xs text-gray-200 whitespace-pre-wrap leading-relaxed flex-1 overflow-y-auto max-h-[50vh]">
          {loading ? (
            <div className="py-12 text-center text-gray-400 flex flex-col items-center gap-2">
              <Sparkles className="w-6 h-6 text-amber-400 animate-spin" />
              <span>Synthesizing Executive Briefing with Gemini AI...</span>
            </div>
          ) : (
            briefingText
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-800">
          <span className="text-[11px] text-gray-400 font-mono">Generated for Operations Commander</span>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4" />
              Print / Save PDF
            </button>
            <button
              onClick={onClose}
              className="bg-red-600 hover:bg-red-500 text-white text-xs font-bold px-5 py-2 rounded-lg"
            >
              Done
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
