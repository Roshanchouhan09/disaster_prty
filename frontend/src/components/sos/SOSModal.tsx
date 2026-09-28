import React, { useState, useEffect } from 'react';
import { 
  AlertOctagon, PhoneCall, MapPin, ShieldAlert, CheckCircle, 
  X, AlertTriangle, Loader2, Navigation, HeartHandshake, 
  Flame, Waves, Building2, Stethoscope, HelpCircle, Check,
  Clock, ArrowRight, ShieldCheck, RefreshCw, Send
} from 'lucide-react';
import { sosApi } from '../../services/api';
import { SOSAlert, SOSEmergencyType, SystemWorkflowState } from '../../types';
import { useToast } from '../common/Toast';

interface SOSModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSOSCreated?: (alert: SOSAlert) => void;
  onWorkflowStateChange?: (state: SystemWorkflowState) => void;
}

const EMERGENCY_TYPES: { id: SOSEmergencyType; label: string; desc: string; icon: any; color: string }[] = [
  { id: 'flood', label: 'Flood / Waterlogging', desc: 'Rising water, stranded on roof or vehicle', icon: Waves, color: 'text-cyan-400 border-cyan-500/40 bg-cyan-950/20' },
  { id: 'trapped', label: 'Trapped / Cut Off', desc: 'Collapsed structures, debris blockage, impassable route', icon: Building2, color: 'text-amber-400 border-amber-500/40 bg-amber-950/20' },
  { id: 'medical', label: 'Medical Emergency', desc: 'Critical injury, trauma, oxygen shortage, cardiac distress', icon: Stethoscope, color: 'text-rose-400 border-rose-500/40 bg-rose-950/20' },
  { id: 'fire', label: 'Fire / Hazmat', desc: 'Explosion, chemical fumes, spreading structural blaze', icon: Flame, color: 'text-orange-400 border-orange-500/40 bg-orange-950/20' },
  { id: 'general', label: 'Immediate Evacuation', desc: 'Imminent danger, isolation, emergency assistance needed', icon: HelpCircle, color: 'text-purple-400 border-purple-500/40 bg-purple-950/20' }
];

export const SOSModal: React.FC<SOSModalProps> = ({
  isOpen,
  onClose,
  onSOSCreated,
  onWorkflowStateChange
}) => {
  const { success, error, warning } = useToast();

  // Step 1: confirm, Step 2: details/location, Step 3: active_status
  const [step, setStep] = useState<'confirm' | 'form' | 'active'>('confirm');
  const [countdown, setCountdown] = useState<number>(3);
  const [isCountingDown, setIsCountingDown] = useState(false);

  // Form State
  const [emergencyType, setEmergencyType] = useState<SOSEmergencyType>('flood');
  const [reporterName, setReporterName] = useState(() => localStorage.getItem('disasterfog_sos_name') || '');
  const [contactPhone, setContactPhone] = useState(() => localStorage.getItem('disasterfog_sos_phone') || '');
  const [message, setMessage] = useState('');
  const [contactName, setContactName] = useState(() => localStorage.getItem('disasterfog_sos_rel_name') || '');
  const [contactPhoneSecondary, setContactPhoneSecondary] = useState(() => localStorage.getItem('disasterfog_sos_rel_phone') || '');

  // Geolocation state
  const [isLocating, setIsLocating] = useState(false);
  const [locationName, setLocationName] = useState('Guwahati Disaster Sector 4');
  const [latitude, setLatitude] = useState<number>(26.1855);
  const [longitude, setLongitude] = useState<number>(91.7505);
  const [locationAccuracy, setLocationAccuracy] = useState<number | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Submission & Active Alert state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeAlert, setActiveAlert] = useState<SOSAlert | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Check if existing active SOS stored locally
      const storedSos = localStorage.getItem('disasterfog_active_sos');
      if (storedSos) {
        try {
          const parsed = JSON.parse(storedSos);
          if (parsed && parsed.status !== 'RESOLVED' && parsed.status !== 'CANCELLED') {
            setActiveAlert(parsed);
            setStep('active');
            onWorkflowStateChange?.('emergency_active');
            return;
          }
        } catch (e) {
          // ignore
        }
      }
      setStep('confirm');
      setCountdown(3);
      setIsCountingDown(false);
      onWorkflowStateChange?.('sos_confirm');
      detectLocation();
    }
  }, [isOpen]);

  const detectLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Browser Geolocation is not supported. Please specify location manually.');
      return;
    }

    setIsLocating(true);
    setLocationError(null);
    onWorkflowStateChange?.('location_detecting');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(Number(pos.coords.latitude.toFixed(6)));
        setLongitude(Number(pos.coords.longitude.toFixed(6)));
        setLocationAccuracy(Math.round(pos.coords.accuracy));
        setLocationName(`GPS Detected (${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)})`);
        setIsLocating(false);
      },
      (err) => {
        setIsLocating(false);
        let msg = 'Could not retrieve precise GPS location.';
        if (err.code === 1) msg = 'Location permission denied. Please allow location access or specify coordinates.';
        if (err.code === 2) msg = 'Position unavailable. Defaulted to District Emergency Center coordinates.';
        if (err.code === 3) msg = 'Location request timed out. Using last known coordinate.';
        setLocationError(msg);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 }
    );
  };

  const handleStartCountdown = () => {
    setIsCountingDown(true);
    let current = 3;
    setCountdown(current);
    const interval = setInterval(() => {
      current -= 1;
      setCountdown(current);
      if (current <= 0) {
        clearInterval(interval);
        setStep('form');
        setIsCountingDown(false);
        onWorkflowStateChange?.('location_detecting');
      }
    }, 1000);
  };

  const handleSubmitSOS = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!contactPhone.trim() || contactPhone.trim().length < 7) {
      error('Valid Contact Phone Required', 'Please enter a valid phone number for rescue coordination.');
      return;
    }

    setIsSubmitting(true);
    onWorkflowStateChange?.('request_processing');

    // Save preferences
    localStorage.setItem('disasterfog_sos_name', reporterName);
    localStorage.setItem('disasterfog_sos_phone', contactPhone);
    if (contactName) localStorage.setItem('disasterfog_sos_rel_name', contactName);
    if (contactPhoneSecondary) localStorage.setItem('disasterfog_sos_rel_phone', contactPhoneSecondary);

    const emergencyContacts = [];
    if (contactPhoneSecondary) {
      emergencyContacts.push({
        name: contactName || 'Next of Kin',
        phone: contactPhoneSecondary,
        relation: 'Family Emergency Contact'
      });
    }

    try {
      onWorkflowStateChange?.('notification_processing');

      const alert = await sosApi.activate({
        reporter_name: reporterName || 'Citizen in Distress',
        contact_phone: contactPhone,
        emergency_type: emergencyType,
        severity: 'CRITICAL',
        latitude,
        longitude,
        location_name: locationName,
        message: message || `Urgent ${emergencyType.toUpperCase()} rescue assistance requested.`,
        emergency_contacts: emergencyContacts,
        device_telemetry: {
          accuracy: locationAccuracy || 20,
          userAgent: navigator.userAgent
        }
      });

      setActiveAlert(alert);
      localStorage.setItem('disasterfog_active_sos', JSON.stringify(alert));
      setStep('active');
      success('SOS Emergency Alert Dispatched!', `Alert Code: ${alert.sos_code}. Rescue teams notified.`);
      onSOSCreated?.(alert);
      onWorkflowStateChange?.('emergency_active');
    } catch (err: any) {
      if (err.response?.status === 409) {
        const detail = err.response.data?.detail;
        warning('Active SOS Already Registered', detail?.message || 'You already have an active SOS in progress.');
        if (detail?.existing_sos_code) {
          // Switch to active view
          setActiveAlert({
            id: 0,
            sos_code: detail.existing_sos_code,
            reporter_name: reporterName,
            contact_phone: contactPhone,
            emergency_type: emergencyType,
            severity: 'CRITICAL',
            status: detail.status || 'DISPATCHED',
            latitude,
            longitude,
            location_name: locationName,
            dispatched_service: detail.dispatched_service || 'State Disaster Response Force',
            created_at: detail.created_at || new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
          setStep('active');
          onWorkflowStateChange?.('emergency_active');
        }
      } else {
        error('SOS Activation Error', err.response?.data?.detail || 'Failed to transmit SOS alert. Please dial 112 immediately.');
        onWorkflowStateChange?.('idle');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelSOS = async () => {
    if (!activeAlert) return;
    setIsCancelling(true);
    try {
      if (activeAlert.id > 0) {
        await sosApi.cancel(activeAlert.id, 'Cancelled by user / false alarm resolved');
      }
      localStorage.removeItem('disasterfog_active_sos');
      setActiveAlert(null);
      setStep('confirm');
      success('SOS Alert Cancelled', 'Emergency request has been closed.');
      onWorkflowStateChange?.('resolved');
      setTimeout(() => {
        onWorkflowStateChange?.('idle');
        onClose();
      }, 1000);
    } catch (err: any) {
      error('Cancel Error', 'Unable to cancel alert automatically. Please notify 112.');
    } finally {
      setIsCancelling(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div 
        className="bg-slate-900 border-2 border-red-600/80 rounded-2xl w-full max-w-xl shadow-2xl shadow-red-950/60 overflow-hidden flex flex-col my-auto transition-all"
        role="dialog"
        aria-modal="true"
        aria-labelledby="sos-modal-title"
      >
        {/* Header Bar */}
        <div className="bg-gradient-to-r from-red-900 via-rose-900 to-red-950 p-4 sm:p-5 border-b border-red-500/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-red-600/90 text-white shadow-lg animate-pulse">
              <AlertOctagon className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>
            <div>
              <h2 id="sos-modal-title" className="text-base sm:text-lg font-black tracking-wide text-white flex items-center gap-2">
                EMERGENCY SOS SYSTEM
                <span className="text-[10px] bg-red-500/80 text-white font-mono px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Tactical Link
                </span>
              </h2>
              <p className="text-xs text-red-200/90 font-medium">
                Direct Emergency Operations Command (EOC) Dispatch
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              onWorkflowStateChange?.('idle');
              onClose();
            }}
            className="text-white/80 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Close SOS Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 space-y-5 text-slate-200">

          {/* STEP 1: Deliberate Confirmation Step to prevent accidental activation */}
          {step === 'confirm' && (
            <div className="space-y-6 text-center py-2">
              <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/30 text-left space-y-2">
                <div className="flex items-center gap-2 text-red-400 font-bold text-sm">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
                  <span>CRITICAL EMERGENCY NOTICE</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Activating SOS alerts nearest Emergency Response Teams (NDRF, SDRF, EMS Ambulance, Fire & Police Dispatch). 
                  Your exact GPS coordinates will be captured and broadcast to the Tactical Command Center.
                </p>
              </div>

              {/* Large Push Button */}
              <div className="flex flex-col items-center justify-center pt-2 pb-4">
                <button
                  onClick={handleStartCountdown}
                  disabled={isCountingDown}
                  className={`w-36 h-36 sm:w-44 sm:h-44 rounded-full font-black text-xl sm:text-2xl text-white flex flex-col items-center justify-center gap-2 border-4 transition-all transform shadow-2xl ${
                    isCountingDown 
                      ? 'bg-amber-600 border-amber-300 scale-95 animate-pulse shadow-amber-900/50' 
                      : 'bg-gradient-to-br from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 border-red-300 hover:scale-105 active:scale-95 shadow-red-700/50 cursor-pointer'
                  }`}
                >
                  <AlertOctagon className="w-10 h-10 sm:w-12 sm:h-12" />
                  <span>{isCountingDown ? `WAIT ${countdown}S` : 'TAP TO ACTIVATE'}</span>
                </button>
                <p className="text-xs text-slate-400 mt-3 font-mono">
                  {isCountingDown ? 'Confirming emergency intent...' : 'Tap above to begin emergency dispatch verification'}
                </p>
              </div>

              {/* Instant Helpline Quick Dial Option */}
              <div className="border-t border-slate-800 pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
                <span>Immediate phone assistance:</span>
                <a 
                  href="tel:112" 
                  className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30 px-3 py-1.5 rounded-lg font-bold transition-colors"
                >
                  <PhoneCall className="w-4 h-4" />
                  <span>Dial National Helpline 112</span>
                </a>
              </div>
            </div>
          )}

          {/* STEP 2: Emergency Form & Location Verification */}
          {step === 'form' && (
            <form onSubmit={handleSubmitSOS} className="space-y-4">
              
              {/* Emergency Type Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2 uppercase tracking-wide">
                  1. Select Emergency Type
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {EMERGENCY_TYPES.map((t) => {
                    const Icon = t.icon;
                    const isSelected = emergencyType === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setEmergencyType(t.id)}
                        className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all ${
                          isSelected 
                            ? `${t.color} ring-2 ring-red-500 shadow-md font-bold` 
                            : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <Icon className="w-5 h-5 shrink-0 mt-0.5" />
                        <div>
                          <div className="text-xs font-bold text-slate-100">{t.label}</div>
                          <div className="text-[10px] text-slate-400 leading-tight mt-0.5">{t.desc}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Location Details with Live GPS */}
              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-red-400" />
                    2. Location Detection
                  </span>
                  <button
                    type="button"
                    onClick={detectLocation}
                    disabled={isLocating}
                    className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-mono font-medium disabled:opacity-50"
                  >
                    {isLocating ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                    <span>{isLocating ? 'Detecting GPS...' : 'Re-detect GPS'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Landmark / Sector Name</label>
                    <input
                      type="text"
                      value={locationName}
                      onChange={(e) => setLocationName(e.target.value)}
                      required
                      placeholder="e.g. Near Brahmaputra Embankment"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">GPS Coordinates</label>
                    <div className="flex items-center gap-1 text-slate-300 font-mono text-[11px] bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5">
                      <Navigation className="w-3 h-3 text-emerald-400 shrink-0" />
                      <span>{latitude}, {longitude}</span>
                      {locationAccuracy && (
                        <span className="ml-auto text-[9px] text-emerald-400 font-sans">±{locationAccuracy}m</span>
                      )}
                    </div>
                  </div>
                </div>

                {locationError && (
                  <p className="text-[11px] text-amber-400/90 font-mono">{locationError}</p>
                )}
              </div>

              {/* Phone & Reporter Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Your Contact Phone <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    required
                    placeholder="+91 98765 43210"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Your Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={reporterName}
                    onChange={(e) => setReporterName(e.target.value)}
                    placeholder="Citizen Name"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              {/* Secondary Emergency Contact */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 mb-1">
                    Emergency Contact Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="e.g. Family Member / Neighbor"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 mb-1">
                    Emergency Contact Phone (Optional)
                  </label>
                  <input
                    type="tel"
                    value={contactPhoneSecondary}
                    onChange={(e) => setContactPhoneSecondary(e.target.value)}
                    placeholder="+91 98112 33445"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-red-500 font-mono"
                  />
                </div>
              </div>

              {/* Situation Message */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Brief Situation / Trapped Count (Optional)
                </label>
                <textarea
                  rows={2}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="e.g. Water is 5 feet high, 4 family members stranded on first floor, elderly patient present."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-red-500"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setStep('confirm');
                    onWorkflowStateChange?.('sos_confirm');
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-rose-500 text-white text-xs sm:text-sm font-black py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-red-950 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>DISPATCHING SOS...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>TRANSMIT IMMEDIATE SOS ALERT</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: Live Active SOS Status State */}
          {step === 'active' && activeAlert && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-gradient-to-r from-red-950/70 to-slate-900 border border-red-500/50 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
                    <span className="text-xs font-mono font-bold text-red-400 uppercase tracking-widest">
                      ACTIVE EMERGENCY BEACON
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold bg-slate-950 border border-slate-800 px-2 py-0.5 rounded text-white">
                    {activeAlert.sos_code}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs pt-1">
                  <div>
                    <span className="text-slate-400 text-[10px] block">Status</span>
                    <span className="font-bold text-emerald-400 uppercase">{activeAlert.status}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Dispatched Unit</span>
                    <span className="font-bold text-cyan-300 truncate block">{activeAlert.dispatched_service || 'Tactical Team'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Location</span>
                    <span className="font-medium text-slate-200 truncate block">{activeAlert.location_name}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Emergency Type</span>
                    <span className="font-bold text-amber-400 uppercase">{activeAlert.emergency_type}</span>
                  </div>
                </div>

                {activeAlert.dispatcher_notes && (
                  <div className="p-2.5 rounded bg-slate-950/80 border border-slate-800 text-[11px] text-slate-300 font-mono whitespace-pre-line">
                    {activeAlert.dispatcher_notes}
                  </div>
                )}
              </div>

              {/* Instructions while waiting */}
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs text-slate-300 space-y-2">
                <div className="font-bold text-slate-200 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Immediate Survival Protocol:</span>
                </div>
                <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-400">
                  <li>Keep this mobile device on and battery conserved.</li>
                  <li>Signal rescuers using a whistle, flashlight, or brightly colored cloth.</li>
                  <li>Do not enter moving water or unstable structures.</li>
                </ul>
              </div>

              {/* Control Buttons: Cancel or Direct Call */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <a
                  href="tel:112"
                  className="w-full sm:w-auto flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md transition-colors"
                >
                  <PhoneCall className="w-4 h-4" />
                  <span>Call 112 Helpline</span>
                </a>
                
                <button
                  type="button"
                  onClick={handleCancelSOS}
                  disabled={isCancelling}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors disabled:opacity-50"
                >
                  {isCancelling ? 'Cancelling...' : 'Cancel / False Alarm'}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
