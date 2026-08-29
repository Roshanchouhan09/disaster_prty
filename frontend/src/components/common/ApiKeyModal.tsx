import React, { useState, useEffect } from 'react';
import { Key, X, CheckCircle2, ShieldCheck, Sparkles, Cpu } from 'lucide-react';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DEFAULT_GEMINI_KEY = "AIzaSyDrQwNGJgcbiQs6gZu6Fz0l81w0gF7Uswo";
const DEFAULT_MAPS_KEY = "AIzaSyCjKQHHYbSlFklAva69Nf2ah-gujRWzzI0";

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose }) => {
  const [geminiKey, setGeminiKey] = useState('');
  const [mapsKey, setMapsKey] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    const k1 = localStorage.getItem('disasterfog_gemini_key') || DEFAULT_GEMINI_KEY;
    const k2 = localStorage.getItem('disasterfog_maps_key') || DEFAULT_MAPS_KEY;
    setGeminiKey(k1);
    setMapsKey(k2);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('disasterfog_gemini_key', geminiKey.trim());
    localStorage.setItem('disasterfog_maps_key', mapsKey.trim());
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-dark-800 border border-gray-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/40">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">LIVE API KEY CONFIGURATION</h3>
              <p className="text-xs text-gray-400 font-mono">Configured with Active Google API Keys</p>
            </div>
          </div>

          <button onClick={onClose} className="text-gray-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {savedSuccess && (
          <div className="bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 p-3 rounded-lg text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>API Keys updated & saved! Gemini LLM & Map features active.</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSave} className="space-y-4">
          
          <div>
            <label className="block text-xs font-bold text-gray-300 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                GOOGLE AI STUDIO API KEY (Gemini 1.5/2.5)
              </span>
              <span className="text-[10px] text-emerald-400 font-mono font-bold">ACTIVE</span>
            </label>
            <input
              type="text"
              placeholder="AIzaSy..."
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
              className="w-full bg-dark-900 border border-emerald-500/40 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-amber-500 font-mono"
            />
            <p className="text-[10px] text-gray-400 mt-1">
              Powers real-time Gemini LLM multi-lingual report translation (Hindi/Bengali/Spanish) & Executive Briefings.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-300 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Cpu className="w-3.5 h-3.5 text-blue-400" />
                GOOGLE MAPS PLATFORM API KEY
              </span>
              <span className="text-[10px] text-emerald-400 font-mono font-bold">ACTIVE</span>
            </label>
            <input
              type="text"
              placeholder="AIzaSy..."
              value={mapsKey}
              onChange={(e) => setMapsKey(e.target.value)}
              className="w-full bg-dark-900 border border-emerald-500/40 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 font-mono"
            />
            <p className="text-[10px] text-gray-400 mt-1">
              Powers high-performance GIS vector mapping and disaster markers.
            </p>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-semibold rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-black text-xs font-extrabold rounded-lg transition-colors flex items-center gap-1.5 shadow-lg"
            >
              <ShieldCheck className="w-4 h-4" />
              SAVE KEYS
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
