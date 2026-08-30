import React, { useState, useEffect } from 'react';
import { Key, X, CheckCircle2, ShieldCheck, Sparkles, Cpu, Info } from 'lucide-react';
import { useToast } from './Toast';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose }) => {
  const { success } = useToast();
  const [geminiKey, setGeminiKey] = useState('');
  const [mapsKey, setMapsKey] = useState('');

  useEffect(() => {
    const k1 = localStorage.getItem('disasterfog_gemini_key') || '';
    const k2 = localStorage.getItem('disasterfog_maps_key') || '';
    setGeminiKey(k1);
    setMapsKey(k2);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (geminiKey.trim()) {
      localStorage.setItem('disasterfog_gemini_key', geminiKey.trim());
    } else {
      localStorage.removeItem('disasterfog_gemini_key');
    }

    if (mapsKey.trim()) {
      localStorage.setItem('disasterfog_maps_key', mapsKey.trim());
    } else {
      localStorage.removeItem('disasterfog_maps_key');
    }

    success('API Configuration Saved', 'Google Gemini LLM & Map preferences updated.');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white uppercase tracking-wider">
                EXTERNAL API CONFIGURATION
              </h3>
              <p className="text-xs text-slate-400 font-mono">Configure Google Gemini & Map Service Keys</p>
            </div>
          </div>

          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info Banner */}
        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs text-slate-300 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            The platform includes automatic local deterministic rule-based fallbacks. Supplying your own Gemini API key enables real-time LLM multilingual translation and dynamic executive command briefs.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="space-y-4">
          
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>GOOGLE AI STUDIO / GEMINI API KEY</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Optional</span>
            </label>
            <input
              type="password"
              placeholder="AIzaSy... (leave blank to use server environment key)"
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-blue-400" />
                <span>GOOGLE MAPS PLATFORM API KEY</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Optional</span>
            </label>
            <input
              type="password"
              placeholder="AIzaSy... (leave blank to use default Dark Leaflet tiles)"
              value={mapsKey}
              onChange={(e) => setMapsKey(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 font-mono"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-lg transition-colors flex items-center gap-1.5 shadow-lg"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>SAVE CONFIGURATION</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
