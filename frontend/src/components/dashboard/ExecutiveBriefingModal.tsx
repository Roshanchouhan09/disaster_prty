import React, { useState, useEffect } from 'react';
import { FileText, X, Download, Printer, Sparkles, RefreshCw, Copy, Check } from 'lucide-react';
import { incidentsApi } from '../../services/api';
import { useToast } from '../common/Toast';

interface ExecutiveBriefingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExecutiveBriefingModal: React.FC<ExecutiveBriefingModalProps> = ({ isOpen, onClose }) => {
  const { success, error } = useToast();
  const [briefingText, setBriefingText] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchBriefing = async () => {
    setLoading(true);
    try {
      const res = await incidentsApi.generateBriefing();
      setBriefingText(res.briefing);
    } catch (err: any) {
      error('Generation Failed', err?.message || 'Could not synthesize briefing');
    } finally {
      setLoading(false);
    }
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

  const handleCopy = () => {
    navigator.clipboard.writeText(briefingText);
    setCopied(true);
    success('Copied to Clipboard', 'Executive briefing markdown copied.');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-3xl w-full max-h-[88vh] overflow-y-auto p-5 sm:p-6 shadow-2xl flex flex-col space-y-4 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-red-600/20 text-red-400 border border-red-500/40">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <span>EXECUTIVE EOC SITUATIONAL BRIEFING</span>
                <Sparkles className="w-4 h-4 text-amber-400" />
              </h3>
              <p className="text-xs text-slate-400 font-mono">AI Synthesized Incident Intelligence & Resource Mandate</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchBriefing}
              disabled={loading}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1 font-semibold transition-colors"
              title="Regenerate with AI"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Box */}
        <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 font-mono text-xs text-slate-200 whitespace-pre-wrap leading-relaxed flex-1 overflow-y-auto max-h-[55vh] shadow-inner">
          {loading ? (
            <div className="py-16 text-center text-slate-400 flex flex-col items-center gap-3">
              <div className="w-8 h-8 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
              <span className="font-bold text-slate-300">Synthesizing Real-Time Briefing with Gemini AI...</span>
            </div>
          ) : (
            briefingText
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-between pt-2 border-t border-slate-800 gap-2">
          <span className="text-[11px] text-slate-400 font-mono">Operations Command Briefing</span>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
              <span>{copied ? 'Copied' : 'Copy Text'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-4 h-4 text-blue-400" />
              <span>Print / PDF</span>
            </button>

            <button
              onClick={onClose}
              className="bg-red-600 hover:bg-red-500 text-white text-xs font-bold px-5 py-2 rounded-lg shadow transition-colors"
            >
              Done
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
