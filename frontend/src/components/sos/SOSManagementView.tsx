import React, { useState, useEffect } from 'react';
import { 
  AlertOctagon, Radio, CheckCircle, Clock, MapPin, 
  PhoneCall, Shield, Filter, Search, UserCheck, 
  Send, RefreshCw, AlertTriangle, ChevronRight, X
} from 'lucide-react';
import { sosApi } from '../../services/api';
import { SOSAlert, SOSStatus, SOSEmergencyType } from '../../types';
import { useToast } from '../common/Toast';

interface SOSManagementViewProps {
  onSelectAlertOnMap?: (alert: SOSAlert) => void;
  onRefreshParent?: () => void;
}

export const SOSManagementView: React.FC<SOSManagementViewProps> = ({
  onSelectAlertOnMap,
  onRefreshParent
}) => {
  const { success, error, info } = useToast();
  const [alerts, setAlerts] = useState<SOSAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAlert, setSelectedAlert] = useState<SOSAlert | null>(null);

  // Dispatch Action Modal State
  const [dispatcherNotes, setDispatcherNotes] = useState('');
  const [assignedService, setAssignedService] = useState('');
  const [targetStatus, setTargetStatus] = useState<SOSStatus>('ACTIVE');
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchAlerts = async () => {
    setIsLoading(true);
    try {
      const data = await sosApi.list();
      setAlerts(data);
    } catch (err) {
      console.error('Failed to load SOS alerts:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleUpdateAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAlert) return;
    setIsUpdating(true);
    try {
      const updated = await sosApi.updateStatus(
        selectedAlert.id,
        targetStatus,
        dispatcherNotes,
        assignedService || selectedAlert.dispatched_service
      );
      success('SOS Status Updated', `Alert ${updated.sos_code} marked as ${targetStatus}`);
      setSelectedAlert(null);
      setDispatcherNotes('');
      fetchAlerts();
      onRefreshParent?.();
    } catch (err: any) {
      error('Update Failed', err.response?.data?.detail || 'Could not update SOS alert.');
    } finally {
      setIsUpdating(false);
    }
  };

  const filteredAlerts = alerts.filter((a) => {
    const matchesStatus = statusFilter === 'ALL' || a.status === statusFilter;
    const matchesSearch = 
      a.sos_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.location_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.reporter_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.contact_phone.includes(searchQuery);
    return matchesStatus && matchesSearch;
  });

  const activeCount = alerts.filter(a => ['PENDING', 'LOCATION_VERIFIED', 'DISPATCHED', 'ACTIVE'].includes(a.status)).length;
  const criticalCount = alerts.filter(a => a.severity === 'CRITICAL' && a.status !== 'RESOLVED').length;

  return (
    <div className="space-y-6">
      {/* Top Header & Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 p-5 rounded-2xl border border-red-500/30 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-red-600/90 text-white shadow-lg shadow-red-600/30 animate-pulse">
              <AlertOctagon className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-wide text-white flex items-center gap-2">
                SOS EMERGENCY DISPATCH CONSOLE
                <span className="text-xs bg-red-500/40 text-red-200 border border-red-500/50 px-2 py-0.5 rounded font-mono">
                  {activeCount} ACTIVE BEACONS
                </span>
              </h1>
              <p className="text-xs text-slate-400">
                Real-time incident distress signals, tactical team assignments, and citizen distress tracking
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchAlerts}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by code, phone, location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {['ALL', 'ACTIVE', 'DISPATCHED', 'PENDING', 'RESOLVED', 'CANCELLED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                statusFilter === st
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* SOS Alerts Grid / Table */}
      <div className="grid grid-cols-1 gap-3">
        {filteredAlerts.length === 0 ? (
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
            <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3 opacity-60" />
            <p className="text-sm font-bold text-slate-200">No matching SOS distress beacons</p>
            <p className="text-xs text-slate-400 mt-1">All citizens are currently secure or verified.</p>
          </div>
        ) : (
          filteredAlerts.map((alert) => {
            const isCritical = alert.severity === 'CRITICAL';
            const isActive = ['PENDING', 'DISPATCHED', 'ACTIVE'].includes(alert.status);

            return (
              <div
                key={alert.id}
                className={`p-4 rounded-xl border backdrop-blur-md transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                  isActive
                    ? 'bg-red-950/20 border-red-500/40 hover:border-red-400 shadow-lg shadow-red-950/20'
                    : 'bg-slate-900/60 border-slate-800/80 text-slate-300'
                }`}
              >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${
                    isActive ? 'bg-red-600/30 text-red-400 border border-red-500/40' : 'bg-slate-800 text-slate-400'
                  }`}>
                    <AlertOctagon className="w-5 h-5" />
                  </div>

                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono font-bold text-white bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                        {alert.sos_code}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                        alert.status === 'ACTIVE' ? 'bg-red-600 text-white animate-pulse' :
                        alert.status === 'DISPATCHED' ? 'bg-cyan-600 text-white' :
                        alert.status === 'RESOLVED' ? 'bg-emerald-600 text-white' :
                        'bg-slate-700 text-slate-300'
                      }`}>
                        {alert.status}
                      </span>
                      <span className="text-[10px] font-mono font-bold text-amber-400 uppercase bg-amber-950/40 px-2 py-0.5 rounded border border-amber-500/30">
                        {alert.emergency_type}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(alert.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                      <MapPin className="w-3.5 h-3.5 text-red-400 shrink-0" />
                      <span className="truncate">{alert.location_name}</span>
                      <span className="text-slate-400 font-mono text-[10px]">
                        ({alert.latitude.toFixed(4)}, {alert.longitude.toFixed(4)})
                      </span>
                    </div>

                    {alert.message && (
                      <p className="text-xs text-slate-300 line-clamp-1 italic">
                        "{alert.message}"
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-[11px] text-slate-400 pt-1 flex-wrap">
                      <span className="flex items-center gap-1">
                        <PhoneCall className="w-3 h-3 text-emerald-400" />
                        <span className="font-mono text-emerald-300">{alert.contact_phone}</span>
                        {alert.reporter_name && <span>({alert.reporter_name})</span>}
                      </span>
                      {alert.dispatched_service && (
                        <span className="text-cyan-300 font-medium">
                          Assigned: {alert.dispatched_service}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Action buttons */}
                <div className="flex items-center gap-2 w-full md:w-auto shrink-0 justify-end border-t md:border-t-0 pt-2 md:pt-0 border-slate-800">
                  <a
                    href={`tel:${alert.contact_phone}`}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 text-xs font-bold transition-colors flex items-center gap-1"
                    title="Direct Citizen Call"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Call</span>
                  </a>

                  <button
                    onClick={() => {
                      setSelectedAlert(alert);
                      setTargetStatus(alert.status === 'RESOLVED' ? 'RESOLVED' : 'ACTIVE');
                      setAssignedService(alert.dispatched_service || '');
                      setDispatcherNotes('');
                    }}
                    className="px-3 py-1.5 rounded-lg bg-red-600/90 hover:bg-red-500 text-white text-xs font-bold flex items-center gap-1.5 shadow transition-colors"
                  >
                    <span>Manage Dispatch</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Dispatch Action Modal */}
      {selectedAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <AlertOctagon className="w-4 h-4 text-red-400" />
                Manage SOS Alert: {selectedAlert.sos_code}
              </h3>
              <button
                onClick={() => setSelectedAlert(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateAlert} className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Change Alert Status
                </label>
                <select
                  value={targetStatus}
                  onChange={(e) => setTargetStatus(e.target.value as SOSStatus)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-red-500"
                >
                  <option value="ACTIVE">ACTIVE (Rescue Operation In Progress)</option>
                  <option value="DISPATCHED">DISPATCHED (Units En Route)</option>
                  <option value="LOCATION_VERIFIED">LOCATION_VERIFIED (Recon Confirmed)</option>
                  <option value="RESOLVED">RESOLVED (Evacuation Complete)</option>
                  <option value="CANCELLED">CANCELLED (False Alarm / Stand Down)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Assigned Tactical Rescue Service
                </label>
                <input
                  type="text"
                  value={assignedService}
                  onChange={(e) => setAssignedService(e.target.value)}
                  placeholder="e.g. NDRF Sector 4 Inflatable Boat Squad"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Dispatcher Tactical Log Note
                </label>
                <textarea
                  rows={3}
                  value={dispatcherNotes}
                  onChange={(e) => setDispatcherNotes(e.target.value)}
                  placeholder="e.g. 2 boats deployed, rendezvous with field officer in 15 mins."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedAlert(null)}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-400 hover:text-white bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-red-600 hover:bg-red-500 transition-colors shadow disabled:opacity-50"
                >
                  {isUpdating ? 'Saving...' : 'Save & Broadcast Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
