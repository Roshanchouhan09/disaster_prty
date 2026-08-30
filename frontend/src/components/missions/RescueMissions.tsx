import React, { useState } from 'react';
import { 
  FileText, Truck, Clock, CheckCircle2, Navigation, 
  AlertTriangle, Filter, Search, ChevronRight, ShieldCheck,
  CheckCircle, ArrowRight
} from 'lucide-react';
import { RescueMission, MissionStatus } from '../../types';
import { missionsApi } from '../../services/api';
import { useToast } from '../common/Toast';

interface RescueMissionsProps {
  missions: RescueMission[];
  onRefresh: () => void;
}

const STAGES: { key: MissionStatus; label: string }[] = [
  { key: 'PLANNED', label: 'Planned' },
  { key: 'ASSIGNED', label: 'Assigned' },
  { key: 'EN_ROUTE', label: 'En Route' },
  { key: 'ARRIVED', label: 'Arrived' },
  { key: 'IN_PROGRESS', label: 'In Progress' },
  { key: 'COMPLETED', label: 'Completed' }
];

export const RescueMissions: React.FC<RescueMissionsProps> = ({ missions, onRefresh }) => {
  const { success, error } = useToast();
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingId, setLoadingId] = useState<number | null>(null);

  const handleStatusChange = async (id: number, status: string) => {
    setLoadingId(id);
    try {
      await missionsApi.updateStatus(id, status, `Field update: Stage changed to ${status}`);
      success('Mission Stage Updated', `Transitioned to ${status.replace('_', ' ')}`);
      onRefresh();
    } catch (err: any) {
      error('Update Failed', err?.message || 'Could not update mission stage');
    } finally {
      setLoadingId(null);
    }
  };

  const filteredMissions = missions.filter(m => {
    const matchesFilter = statusFilter === 'ALL' || m.status === statusFilter;
    const matchesSearch = !searchTerm || 
                          m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          m.mission_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          m.assigned_team.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getStageIndex = (status: MissionStatus) => {
    return STAGES.findIndex(s => s.key === status);
  };

  return (
    <div className="space-y-4">
      
      {/* Header & Filter Bar */}
      <div className="glass-panel p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 font-bold text-white uppercase text-sm tracking-wider">
          <FileText className="w-5 h-5 text-purple-400" />
          <span>Active Rescue Operations & Operations Tracker ({filteredMissions.length})</span>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          {/* Search Box */}
          <div className="relative flex-1 sm:w-56">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search mission or team..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
          >
            <option value="ALL">All Stages</option>
            <option value="PLANNED">Planned</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="EN_ROUTE">En Route</option>
            <option value="ARRIVED">Arrived</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>
      </div>

      {/* Missions List */}
      <div className="space-y-4">
        {filteredMissions.map((m) => {
          const currentStageIdx = getStageIndex(m.status);
          return (
            <div key={m.id} className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4 hover:border-purple-500/40 transition-colors">
              
              {/* Top Row: Mission Code, Title, Priority, ETA */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-black text-purple-400 bg-slate-950 px-2 py-0.5 rounded border border-purple-500/30">
                      {m.mission_code}
                    </span>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider ${
                      m.status === 'COMPLETED' ? 'bg-emerald-600 text-white' :
                      m.status === 'IN_PROGRESS' ? 'bg-red-600 text-white pulse-critical' :
                      m.status === 'EN_ROUTE' ? 'bg-amber-600 text-white animate-pulse' :
                      'bg-purple-600 text-white'
                    }`}>
                      {m.status.replace('_', ' ')}
                    </span>
                    <span className="bg-red-950 text-red-300 border border-red-500/40 text-[10px] font-black px-2 py-0.5 rounded uppercase font-mono">
                      {m.priority} PRIORITY
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white mt-1.5">{m.title}</h3>
                  <div className="text-xs text-slate-300 font-mono mt-0.5">
                    Assigned Unit: <strong className="text-amber-300">{m.assigned_team}</strong>
                  </div>
                </div>

                <div className="text-right shrink-0 bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
                  <div className="text-[10px] text-slate-400 font-mono">ESTIMATED ETA</div>
                  <div className="text-xl font-black text-white font-mono">{m.eta_minutes} mins</div>
                </div>
              </div>

              {/* Progress Stepper Visual Bar */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                <div className="grid grid-cols-6 gap-1 text-[10px] font-bold text-center">
                  {STAGES.map((s, idx) => {
                    const isDone = idx <= currentStageIdx;
                    const isCurrent = idx === currentStageIdx;
                    return (
                      <div key={s.key} className="space-y-1">
                        <div className={`h-1.5 rounded-full transition-all ${
                          isCurrent ? 'bg-purple-500 shadow-md shadow-purple-500' :
                          isDone ? 'bg-emerald-500' : 'bg-slate-800'
                        }`} />
                        <span className={`block truncate text-[9px] sm:text-[10px] ${
                          isCurrent ? 'text-purple-300 font-black' :
                          isDone ? 'text-emerald-400' : 'text-slate-500'
                        }`}>
                          {s.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Hazard Routing Notice */}
              {m.route_data?.hazard_warning && (
                <div className="bg-amber-950/20 border border-amber-500/30 p-3 rounded-xl text-xs text-amber-300 flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>{m.route_data.hazard_warning}</span>
                </div>
              )}

              {/* Stage Transition Action Buttons */}
              <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-800">
                <span className="text-[11px] text-slate-400 font-bold mr-2">Transition Stage:</span>

                {STAGES.map((s) => (
                  <button
                    key={s.key}
                    onClick={() => handleStatusChange(m.id, s.key)}
                    disabled={m.status === s.key || loadingId === m.id}
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-lg transition-all ${
                      m.status === s.key
                        ? 'bg-purple-600 text-white cursor-default shadow'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

            </div>
          );
        })}

        {filteredMissions.length === 0 && (
          <div className="glass-panel p-12 text-center rounded-2xl border border-slate-800 text-slate-400 space-y-2">
            <FileText className="w-8 h-8 text-slate-500 mx-auto" />
            <p className="font-bold text-sm text-white">No rescue operations in this view.</p>
            <p className="text-xs text-slate-500">Dispatch a new mission from the Incident Inspection modal.</p>
          </div>
        )}
      </div>

    </div>
  );
};
