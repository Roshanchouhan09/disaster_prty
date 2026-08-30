import React, { useState, useEffect } from 'react';
import { 
  Smartphone, MapPin, Camera, Send, Wifi, WifiOff, CheckCircle2, 
  RefreshCw, Languages, Mic, Volume2, Image, Trash2, Shield
} from 'lucide-react';
import { reportsApi } from '../../services/api';
import { useToast } from '../common/Toast';

const SAMPLE_MULTILINGUAL_REPORTS = [
  {
    lang: 'Hindi (हिंदी)',
    text: 'अत्यधिक बाढ़! प्राथमिक विद्यालय परिसर में पानी 2.5 मीटर तक भर गया है। छत पर 300 से अधिक बच्चे और ग्रामीण फंसे हुए हैं। तत्काल नाव भेजें!'
  },
  {
    lang: 'Bengali (বাংলা)',
    text: 'নদীর বাঁধ ভেঙে স্তূপীকৃত জল জমেছে। বিদ্যালয়ের ছাদে ২৫০ জন আটকে রয়েছে। পথ সম্পূর্ণ বিচ্ছিন্ন।'
  },
  {
    lang: 'Spanish (Español)',
    text: '¡Inundación severa! Más de 200 personas atrapadas en el techo del centro comunitario. Nivel de agua 2 metros.'
  },
  {
    lang: 'English',
    text: 'Flash flood water reached 2.4 meters near Jude School. 320 civilians marooned on roof top. Bridge passable with caution.'
  }
];

export const FieldReportApp: React.FC = () => {
  const { success, error, info, warning } = useToast();
  const [sourceType, setSourceType] = useState('field_officer');
  const [reporterName, setReporterName] = useState('Capt. Rahul Singh');
  const [latitude, setLatitude] = useState(26.1200);
  const [longitude, setLongitude] = useState(85.4500);
  const [locationName, setLocationName] = useState('St. Jude Sector 4 Model School');
  const [description, setDescription] = useState(SAMPLE_MULTILINGUAL_REPORTS[0].text);
  const [damageType, setDamageType] = useState('flood');
  const [waterLevel, setWaterLevel] = useState(2.4);
  const [peopleAffected, setPeopleAffected] = useState(320);
  
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [forceOffline, setForceOffline] = useState(false);
  const [offlineQueue, setOfflineQueue] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [attachedPhoto, setAttachedPhoto] = useState<string | null>("https://images.unsplash.com/photo-1547683905-f686c993aae5?w=500");

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const saved = localStorage.getItem('disasterfog_offline_queue');
    if (saved) {
      setOfflineQueue(JSON.parse(saved));
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const effectivelyOnline = isOnline && !forceOffline;

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLatitude(pos.coords.latitude);
          setLongitude(pos.coords.longitude);
          setLocationName(`GPS Position (${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)})`);
          success('GPS Coordinates Captured', `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
        },
        () => {
          warning('GPS Unavailable', 'Using simulated ground coordinates.');
        }
      );
    }
  };

  const handleVoiceSim = () => {
    setIsRecordingVoice(true);
    info('Voice Note Recording Started', 'Transcribing spoken field audio...');
    setTimeout(() => {
      setIsRecordingVoice(false);
      setDescription("Recorded Voice Telemetry: 'Urgent: Main access road submerged under 2.2m water near Sector 4 Bridge. Multiple families trapped on residential roofs.'");
      success('Audio Transcribed by AI', 'Voice input converted to structured observation.');
    }, 2000);
  };

  const syncOfflineQueue = async () => {
    if (offlineQueue.length === 0) return;
    setSubmitting(true);
    const remaining = [];
    let syncedCount = 0;
    for (const item of offlineQueue) {
      try {
        await reportsApi.submit(item);
        syncedCount++;
      } catch (err) {
        remaining.push(item);
      }
    }
    setOfflineQueue(remaining);
    localStorage.setItem('disasterfog_offline_queue', JSON.stringify(remaining));
    setSubmitting(false);
    if (syncedCount > 0) {
      success('Offline Queue Synced', `Successfully ingested ${syncedCount} queued field report(s).`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const reportData = {
      client_uuid: `UUID-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      source_type: sourceType as any,
      reporter_name: reporterName,
      latitude,
      longitude,
      location_name: locationName || 'Field Recon Sector',
      description,
      reported_damage: damageType,
      water_level: waterLevel,
      estimated_people_affected: peopleAffected,
      media_urls: attachedPhoto ? [attachedPhoto] : []
    };

    if (!effectivelyOnline) {
      const updatedQueue = [...offlineQueue, reportData];
      setOfflineQueue(updatedQueue);
      localStorage.setItem('disasterfog_offline_queue', JSON.stringify(updatedQueue));
      warning('Offline Mode Active', 'Report saved to local device queue. Will auto-sync when online.');
    } else {
      try {
        const res = await reportsApi.submit(reportData);
        success('Disaster Report Ingested', `Assigned Code: ${res.report_code} | Reliability ${(res.source_reliability * 100).toFixed(0)}%`);
        setDescription('');
      } catch (err: any) {
        const updatedQueue = [...offlineQueue, reportData];
        setOfflineQueue(updatedQueue);
        localStorage.setItem('disasterfog_offline_queue', JSON.stringify(updatedQueue));
        warning('Network Error', 'Saved to offline queue.');
      }
    }

    setSubmitting(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      
      {/* Top Mobile Status Header */}
      <div className="glass-panel p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 border border-slate-800">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="p-2.5 rounded-xl bg-red-600/20 text-red-400 border border-red-500/40 shrink-0">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-black text-white uppercase tracking-wider">FIELD OFFICER DISASTER REPORT TOOL</h2>
            <p className="text-[11px] text-slate-400 font-mono">Offline-First Multi-Lingual Recon Submission Interface</p>
          </div>
        </div>

        {/* Online / Offline Simulator Toggle */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={() => setForceOffline(!forceOffline)}
            className={`text-[10px] font-bold px-3 py-1.5 rounded-lg border flex items-center gap-1.5 transition-colors ${
              effectivelyOnline 
                ? 'bg-emerald-600/20 text-emerald-400 border-emerald-500/40 hover:bg-emerald-600/30' 
                : 'bg-amber-600/20 text-amber-400 border-amber-500/40 hover:bg-amber-600/30'
            }`}
            title="Click to toggle offline mode simulation"
          >
            {effectivelyOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5 animate-pulse" />}
            <span>{effectivelyOnline ? 'ONLINE' : 'OFFLINE MODE (ACTIVE)'}</span>
          </button>
        </div>
      </div>

      {/* Multi-Lingual Presets Bar */}
      <div className="bg-slate-950 border border-slate-800 p-3.5 rounded-xl space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-amber-400">
          <div className="flex items-center gap-1.5">
            <Languages className="w-4 h-4" />
            <span>Multi-Lingual AI Test Quick-Fills:</span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">Auto-translated by Gemini</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {SAMPLE_MULTILINGUAL_REPORTS.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setDescription(preset.text)}
              className="bg-slate-900 hover:bg-slate-800 text-slate-200 text-[11px] px-3 py-1.5 rounded-lg font-medium border border-slate-700/80 transition-colors"
            >
              {preset.lang}
            </button>
          ))}
        </div>
      </div>

      {/* Offline Queue Bar */}
      {offlineQueue.length > 0 && (
        <div className="bg-amber-950/30 border border-amber-500/40 p-3.5 rounded-xl flex items-center justify-between text-xs animate-in fade-in">
          <div className="text-amber-300 font-semibold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
            <span>{offlineQueue.length} Field Report(s) Queued Locally in Offline Storage</span>
          </div>
          {effectivelyOnline && (
            <button
              onClick={syncOfflineQueue}
              disabled={submitting}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors shadow"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${submitting ? 'animate-spin' : ''}`} />
              <span>Sync All ({offlineQueue.length})</span>
            </button>
          )}
        </div>
      )}

      {/* Submission Form */}
      <form onSubmit={handleSubmit} className="glass-panel p-5 sm:p-6 rounded-2xl space-y-4 border border-slate-800">
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">REPORTER SOURCE</label>
            <select
              value={sourceType}
              onChange={(e) => setSourceType(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
            >
              <option value="field_officer">Field Officer (Baseline 0.80)</option>
              <option value="citizen">Citizen Ground Call (Baseline 0.45)</option>
              <option value="emergency_comm">Emergency Services (Baseline 0.85)</option>
              <option value="government">Government Official (Baseline 0.90)</option>
              <option value="iot_sensor">Environmental Sensor (Baseline 0.95)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">REPORTER NAME / CALLSIGN</label>
            <input
              type="text"
              value={reporterName}
              onChange={(e) => setReporterName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
              required
            />
          </div>
        </div>

        {/* Location Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-slate-300">LOCATION & GEOLOCATION</label>
            <button
              type="button"
              onClick={handleGetLocation}
              className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 font-semibold"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Auto-Detect GPS</span>
            </button>
          </div>

          <input
            type="text"
            placeholder="Location landmark or street..."
            value={locationName}
            onChange={(e) => setLocationName(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
            required
          />

          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <input
              type="number"
              step="any"
              value={latitude}
              onChange={(e) => setLatitude(parseFloat(e.target.value) || 0)}
              className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-white"
            />
            <input
              type="number"
              step="any"
              value={longitude}
              onChange={(e) => setLongitude(parseFloat(e.target.value) || 0)}
              className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-white"
            />
          </div>
        </div>

        {/* Damage Type & Water Depth Slider */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">HAZARD / DAMAGE TYPE</label>
            <select
              value={damageType}
              onChange={(e) => setDamageType(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
            >
              <option value="flood">Flash Flood / Submerged</option>
              <option value="building_collapse">Building Structural Collapse</option>
              <option value="road_blockage">Road Blockage / Landslide</option>
              <option value="bridge_damage">Bridge Damage</option>
              <option value="trapped_persons">Trapped Civilians</option>
              <option value="medical_emergency">Mass Medical Emergency</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              WATER DEPTH: <strong className="text-amber-400 font-mono">{waterLevel} meters</strong>
            </label>
            <input
              type="range"
              min="0"
              max="5"
              step="0.1"
              value={waterLevel}
              onChange={(e) => setWaterLevel(parseFloat(e.target.value))}
              className="w-full accent-red-500"
            />
          </div>
        </div>

        {/* Affected Count */}
        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1">ESTIMATED CIVILIANS AFFECTED</label>
          <input
            type="number"
            value={peopleAffected}
            onChange={(e) => setPeopleAffected(parseInt(e.target.value) || 0)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
          />
        </div>

        {/* Description Textarea with Voice Sim */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-bold text-slate-300">FIELD OBSERVATION (ANY LANGUAGE)</label>
            <button
              type="button"
              onClick={handleVoiceSim}
              className={`text-xs flex items-center gap-1.5 font-bold ${
                isRecordingVoice ? 'text-red-500 animate-pulse' : 'text-amber-400 hover:text-amber-300'
              }`}
            >
              <Mic className="w-3.5 h-3.5" />
              <span>{isRecordingVoice ? 'Listening & Transcribing...' : 'Record Voice Note'}</span>
            </button>
          </div>

          <textarea
            rows={4}
            placeholder="Enter report description in Hindi, Bengali, Spanish, or English..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500 leading-relaxed"
            required
          />
        </div>

        {/* Attached Photo Preview / Upload */}
        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            {attachedPhoto ? (
              <img src={attachedPhoto} alt="Evidence" className="w-12 h-12 object-cover rounded-lg border border-slate-700" />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center text-slate-500">
                <Camera className="w-5 h-5" />
              </div>
            )}
            <div>
              <div className="font-bold text-slate-200">Attached Visual Evidence</div>
              <div className="text-[10px] text-slate-400 font-mono">
                {attachedPhoto ? 'Photo evidence attached (+10% reliability bonus)' : 'No media attached'}
              </div>
            </div>
          </div>

          {attachedPhoto ? (
            <button
              type="button"
              onClick={() => setAttachedPhoto(null)}
              className="text-slate-400 hover:text-red-400 p-1 rounded"
              title="Remove photo"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setAttachedPhoto("https://images.unsplash.com/photo-1547683905-f686c993aae5?w=500")}
              className="text-red-400 hover:text-red-300 font-semibold text-xs"
            >
              Attach Sample Photo
            </button>
          )}
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 disabled:opacity-50 text-white font-black text-xs py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-xl shadow-red-950 transition-all active:scale-95"
        >
          <Send className="w-4 h-4" />
          <span>{submitting ? 'PROCESSING BY GEMINI AI ENGINE...' : 'TRANSMIT DISASTER REPORT'}</span>
        </button>

      </form>

    </div>
  );
};
