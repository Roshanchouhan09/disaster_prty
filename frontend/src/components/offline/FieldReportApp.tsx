import React, { useState, useEffect } from 'react';
import { Smartphone, MapPin, Camera, Send, Wifi, WifiOff, CheckCircle2, RefreshCw, Languages, Mic } from 'lucide-react';
import { reportsApi } from '../../services/api';

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
  const [sourceType, setSourceType] = useState('field_officer');
  const [reporterName, setReporterName] = useState('Capt. Rahul Singh');
  const [latitude, setLatitude] = useState(26.1200);
  const [longitude, setLongitude] = useState(85.4500);
  const [locationName, setLocationName] = useState('St. Jude Sector 4');
  const [description, setDescription] = useState(SAMPLE_MULTILINGUAL_REPORTS[0].text);
  const [damageType, setDamageType] = useState('flood');
  const [waterLevel, setWaterLevel] = useState(2.4);
  const [peopleAffected, setPeopleAffected] = useState(320);
  
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [offlineQueue, setOfflineQueue] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);

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

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLatitude(pos.coords.latitude);
          setLongitude(pos.coords.longitude);
          if (!locationName) {
            setLocationName(`GPS Position (${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)})`);
          }
        },
        (err) => alert('Could not fetch GPS location. Please enter manually.')
      );
    }
  };

  const handleVoiceSim = () => {
    setIsRecordingVoice(true);
    setTimeout(() => {
      setIsRecordingVoice(false);
      setDescription("Recorded Voice Note: 'Bridge damaged near river overpass, water level rising rapidly to 2 meters.'");
    }, 2000);
  };

  const syncOfflineQueue = async () => {
    if (offlineQueue.length === 0) return;
    setSubmitting(true);
    const remaining = [];
    for (const item of offlineQueue) {
      try {
        await reportsApi.submit(item);
      } catch (err) {
        remaining.push(item);
      }
    }
    setOfflineQueue(remaining);
    localStorage.setItem('disasterfog_offline_queue', JSON.stringify(remaining));
    setSubmitting(false);
    setSuccessMsg('Offline queue synced successfully!');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const reportData = {
      client_uuid: `UUID-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      source_type: sourceType,
      reporter_name: reporterName,
      latitude,
      longitude,
      location_name: locationName || 'Field Sector',
      description,
      reported_damage: damageType,
      water_level: waterLevel,
      estimated_people_affected: peopleAffected,
      media_urls: ["https://images.unsplash.com/photo-1547683905-f686c993aae5?w=500"]
    };

    if (!isOnline) {
      const updatedQueue = [...offlineQueue, reportData];
      setOfflineQueue(updatedQueue);
      localStorage.setItem('disasterfog_offline_queue', JSON.stringify(updatedQueue));
      setSuccessMsg('No internet connection. Saved to offline queue! Will auto-sync when online.');
    } else {
      try {
        await reportsApi.submit(reportData);
        setSuccessMsg('Multi-Lingual Report submitted & processed by Gemini AI Engine successfully!');
        setDescription('');
      } catch (err) {
        const updatedQueue = [...offlineQueue, reportData];
        setOfflineQueue(updatedQueue);
        localStorage.setItem('disasterfog_offline_queue', JSON.stringify(updatedQueue));
        setSuccessMsg('Network error. Saved to offline queue.');
      }
    }

    setSubmitting(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      
      {/* Top Mobile Status Header */}
      <div className="glass-panel p-4 rounded-xl flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Smartphone className="w-5 h-5 text-red-500" />
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">FIELD OFFICER DISASTER REPORT TOOL</h2>
            <p className="text-[11px] text-gray-400">Multi-Lingual Offline-First Mobile Submission Interface</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1 ${
            isOnline ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/40' : 'bg-amber-600/20 text-amber-400 border border-amber-500/40'
          }`}>
            {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            {isOnline ? 'ONLINE' : 'OFFLINE MODE'}
          </span>
        </div>
      </div>

      {/* Multi-Lingual Presets Bar */}
      <div className="bg-gray-900 border border-gray-800 p-3 rounded-xl space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
          <Languages className="w-4 h-4" />
          <span>Multi-Lingual AI Test Presets:</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {SAMPLE_MULTILINGUAL_REPORTS.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setDescription(preset.text)}
              className="bg-gray-800 hover:bg-gray-700 text-gray-200 text-[11px] px-2.5 py-1 rounded font-medium border border-gray-700"
            >
              {preset.lang}
            </button>
          ))}
        </div>
      </div>

      {/* Offline Queue Bar */}
      {offlineQueue.length > 0 && (
        <div className="bg-amber-950/40 border border-amber-500/40 p-3 rounded-xl flex items-center justify-between text-xs">
          <div className="text-amber-300 font-semibold">
            {offlineQueue.length} Field Report(s) Pending Offline Sync
          </div>
          {isOnline && (
            <button
              onClick={syncOfflineQueue}
              disabled={submitting}
              className="bg-amber-600 hover:bg-amber-500 text-white font-bold px-3 py-1 rounded flex items-center gap-1 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Sync Now
            </button>
          )}
        </div>
      )}

      {/* Submission Form */}
      <form onSubmit={handleSubmit} className="glass-panel p-6 rounded-xl space-y-4">
        
        {successMsg && (
          <div className="bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 p-3 rounded-lg text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-300 mb-1">REPORTER SOURCE</label>
            <select
              value={sourceType}
              onChange={(e) => setSourceType(e.target.value)}
              className="w-full bg-dark-900 border border-gray-700 rounded-lg px-3 py-2 text-xs text-white"
            >
              <option value="field_officer">Field Officer (Baseline 0.80)</option>
              <option value="citizen">Citizen Ground Call (Baseline 0.45)</option>
              <option value="emergency_comm">Emergency Services (Baseline 0.85)</option>
              <option value="government">Government Official (Baseline 0.90)</option>
              <option value="iot_sensor">Environmental Sensor (Baseline 0.95)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-300 mb-1">REPORTER NAME</label>
            <input
              type="text"
              value={reporterName}
              onChange={(e) => setReporterName(e.target.value)}
              className="w-full bg-dark-900 border border-gray-700 rounded-lg px-3 py-2 text-xs text-white"
              required
            />
          </div>
        </div>

        {/* Location Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-gray-300">LOCATION & GEOLOCATION</label>
            <button
              type="button"
              onClick={handleGetLocation}
              className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 font-semibold"
            >
              <MapPin className="w-3.5 h-3.5" />
              Auto-Detect GPS
            </button>
          </div>

          <input
            type="text"
            placeholder="Location name or landmark..."
            value={locationName}
            onChange={(e) => setLocationName(e.target.value)}
            className="w-full bg-dark-900 border border-gray-700 rounded-lg px-3 py-2 text-xs text-white"
            required
          />

          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <input
              type="number"
              step="any"
              value={latitude}
              onChange={(e) => setLatitude(parseFloat(e.target.value))}
              className="bg-dark-900 border border-gray-700 rounded-lg px-3 py-1.5 text-white"
            />
            <input
              type="number"
              step="any"
              value={longitude}
              onChange={(e) => setLongitude(parseFloat(e.target.value))}
              className="bg-dark-900 border border-gray-700 rounded-lg px-3 py-1.5 text-white"
            />
          </div>
        </div>

        {/* Damage Type & Water Depth Slider */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-300 mb-1">HAZARD / DAMAGE TYPE</label>
            <select
              value={damageType}
              onChange={(e) => setDamageType(e.target.value)}
              className="w-full bg-dark-900 border border-gray-700 rounded-lg px-3 py-2 text-xs text-white"
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
            <label className="block text-xs font-bold text-gray-300 mb-1">WATER DEPTH ({waterLevel} meters)</label>
            <input
              type="range"
              min="0"
              max="5"
              step="0.1"
              value={waterLevel}
              onChange={(e) => setWaterLevel(parseFloat(e.target.value))}
              className="w-full text-red-600"
            />
          </div>
        </div>

        {/* Affected Count */}
        <div>
          <label className="block text-xs font-bold text-gray-300 mb-1">ESTIMATED PEOPLE AFFECTED</label>
          <input
            type="number"
            value={peopleAffected}
            onChange={(e) => setPeopleAffected(parseInt(e.target.value) || 0)}
            className="w-full bg-dark-900 border border-gray-700 rounded-lg px-3 py-2 text-xs text-white"
          />
        </div>

        {/* Description Textarea with Voice Sim */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-bold text-gray-300">FIELD OBSERVATION (ANY LANGUAGE)</label>
            <button
              type="button"
              onClick={handleVoiceSim}
              className={`text-xs flex items-center gap-1 font-semibold ${isRecordingVoice ? 'text-red-500 animate-pulse' : 'text-amber-400 hover:text-amber-300'}`}
            >
              <Mic className="w-3.5 h-3.5" />
              {isRecordingVoice ? 'Listening Voice Note...' : 'Record Voice Note'}
            </button>
          </div>

          <textarea
            rows={4}
            placeholder="Enter report description in Hindi, Bengali, Spanish, or English..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-dark-900 border border-gray-700 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
            required
          />
        </div>

        {/* Photo Upload Placeholder */}
        <div className="border border-dashed border-gray-700 rounded-lg p-3 text-center text-xs text-gray-400 flex items-center justify-center gap-2 cursor-pointer hover:border-gray-500">
          <Camera className="w-4 h-4 text-red-400" />
          <span>Attach Photo / Video Evidence</span>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-red-600 hover:bg-red-500 text-white font-bold text-xs py-3 rounded-lg flex items-center justify-center gap-2 shadow-lg transition-all"
        >
          <Send className="w-4 h-4" />
          {submitting ? 'PROCESSING BY GEMINI AI...' : 'SUBMIT DISASTER REPORT'}
        </button>

      </form>

    </div>
  );
};
