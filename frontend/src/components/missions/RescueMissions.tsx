import React from 'react';
import { FileText, Truck, Clock, CheckCircle2, Navigation, AlertTriangle } from 'lucide-react';
import { RescueMission } from '../../types';
import { missionsApi } from '../../services/api';

interface RescueMissionsProps {
  missions: RescueMission[];
  onRefresh: () => void;
}

export const RescueMissions: React.FC<RescueMissionsProps> = ({ missions, onRefresh }) => {
  const handleStatusChange = async (id: number, status: string) => {
    await missionsApi.updateStatus(id, status, `Field update: Transitioned to ${status}`);
    onRefresh();
  };

  const statusColors: Record<string, string> = {
    PLANNED: 'bg-gray-800 text-gray-300 border-gray-700',
    ASSIGNED: 'bg-blue-600/20 text-blue-300 border-blue-500/40',
    EN_ROUTE: 'bg-amber-600/20 text-amber-300 border-amber-500/40 animate-pulse',
    ARRIVED: 'bg-purple-600/20 text-purple-300 border-purple-500/40',
    IN_PROGRESS: 'bg-red-600/20 text-red-300 border-red-500/40',
    COMPLETED: 'bg-emerald-600/20 text-emerald-300 border-emerald-500/40'
  };

  return (
    <div className="space-y-4">
      
      {/* Header */}
      <div className="glass-panel p-4 rounded-xl flex items-center justify-between">
        <div className="flex items-center gap-2 font-bold text-white uppercase text-sm tracking-wider">
          <FileText className="w-5 h-5 text-purple-400" />
          Active Rescue Operations & Mission Lifecycle ({missions.length})
        </div>
      </div>

      {/* Missions List */}
      <div className="space-y-4">
        {missions.map((m) => (
          <div key={m.id} className="glass-panel p-5 rounded-xl border border-gray-800 space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-purple-400">{m.mission_code}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${statusColors[m.status] || ''}`}>
                    {m.status.replace('_', ' ')}
                  </span>
                  <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                    {m.priority} PRIORITY
                  </span>
                </div>

                <h3 className="text-base font-bold text-white mt-1">{m.title}</h3>
                <p className="text-xs text-gray-300 mt-1 font-mono">Assigned Team: <span className="text-amber-300 font-semibold">{m.assigned_team}</span></p>
              </div>

              <div className="text-right shrink-0">
                <div className="text-xs text-gray-400 font-mono">ESTIMATED ETA</div>
                <div className="text-lg font-black text-white font-mono">{m.eta_minutes} mins</div>
              </div>
            </div>

            {/* Route & Hazards Info */}
            {m.route_data?.hazard_warning && (
              <div className="bg-amber-950/20 border border-amber-500/30 p-2.5 rounded-lg text-xs text-amber-300 flex items-center gap-2">
                <Navigation className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{m.route_data.hazard_warning}</span>
              </div>
            )}

            {/* Mission Status Transition Controls */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-800">
              <span className="text-[11px] text-gray-400 font-bold mr-2">Update Stage:</span>

              {['PLANNED', 'ASSIGNED', 'EN_ROUTE', 'ARRIVED', 'IN_PROGRESS', 'COMPLETED'].map((st) => (
                <button
                  key={st}
                  onClick={() => handleStatusChange(m.id, st)}
                  disabled={m.status === st}
                  className={`text-[10px] font-bold px-2.5 py-1 rounded transition-colors ${
                    m.status === st
                      ? 'bg-purple-600 text-white cursor-default'
                      : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                  }`}
                >
                  {st.replace('_', ' ')}
                </button>
              ))}
            </div>

          </div>
        ))}
      </div>

    </div>
  );
};
