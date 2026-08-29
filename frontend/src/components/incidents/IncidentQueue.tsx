import React, { useState } from 'react';
import { ShieldAlert, Search, Filter, Eye, AlertTriangle, CheckCircle, Users } from 'lucide-react';
import { Incident } from '../../types';

interface IncidentQueueProps {
  incidents: Incident[];
  onSelectIncident: (inc: Incident) => void;
}

export const IncidentQueue: React.FC<IncidentQueueProps> = ({ incidents, onSelectIncident }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const filteredIncidents = incidents.filter(inc => {
    const matchesSearch = inc.location_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          inc.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          inc.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSeverity = severityFilter === 'ALL' || inc.severity === severityFilter;
    const matchesStatus = statusFilter === 'ALL' || inc.verification_status === statusFilter;
    return matchesSearch && matchesSeverity && matchesStatus;
  });

  return (
    <div className="space-y-4">
      
      {/* Header & Filter Controls */}
      <div className="glass-panel p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 font-bold text-white uppercase text-sm tracking-wider">
          <ShieldAlert className="w-5 h-5 text-red-500" />
          Prioritized Incident Decision Queue ({filteredIncidents.length})
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Search Box */}
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search location, code, hazard..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-dark-900 border border-gray-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
            />
          </div>

          {/* Severity Filter */}
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-dark-900 border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical Only</option>
            <option value="HIGH">High Only</option>
            <option value="MEDIUM">Medium Only</option>
            <option value="LOW">Low Only</option>
          </select>

          {/* Verification Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-dark-900 border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="UNVERIFIED">Unverified Only</option>
            <option value="VERIFIED">Verified Only</option>
            <option value="ESCALATED">Escalated Only</option>
          </select>
        </div>
      </div>

      {/* Incident Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredIncidents.map((inc) => (
          <div
            key={inc.id}
            onClick={() => onSelectIncident(inc)}
            className={`glass-panel p-4 rounded-xl border transition-all cursor-pointer hover:border-red-500/60 ${
              inc.severity === 'CRITICAL' ? 'border-red-500/40 bg-red-950/10' : 'border-gray-800'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-gray-400">{inc.code}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                    inc.severity === 'CRITICAL' ? 'bg-red-600 text-white pulse-critical' :
                    inc.severity === 'HIGH' ? 'bg-amber-600 text-white' : 'bg-yellow-600 text-black'
                  }`}>
                    {inc.severity}
                  </span>
                  {inc.is_high_mortality_zone && (
                    <span className="bg-red-950 text-red-300 text-[9px] font-extrabold px-1.5 py-0.5 rounded border border-red-500/50">
                      HIGH MORTALITY ZONE
                    </span>
                  )}
                </div>
                <h4 className="text-sm font-bold text-white mt-1.5">{inc.location_name}</h4>
                <p className="text-xs text-gray-300 mt-1 line-clamp-2">{inc.ai_reasoning}</p>
              </div>

              <div className="text-right shrink-0">
                <div className="text-xs font-mono font-bold text-red-400">PRIORITY</div>
                <div className="text-lg font-black text-white font-mono">{inc.priority_score}</div>
              </div>
            </div>

            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-800 text-[11px] text-gray-400">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-amber-400" />
                  ~{inc.estimated_affected}
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  {inc.verification_status}
                </span>
                {inc.conflicts_count > 0 && (
                  <span className="text-amber-400 font-bold flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    {inc.conflicts_count} Conflict
                  </span>
                )}
              </div>

              <button className="text-xs text-red-400 hover:text-red-300 font-semibold flex items-center gap-1">
                Inspect <Eye className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
