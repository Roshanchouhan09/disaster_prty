import React, { useState } from 'react';
import { 
  ShieldAlert, Search, Filter, Eye, AlertTriangle, CheckCircle, 
  Users, Download, FileSpreadsheet, FileCode, ArrowUpDown, X,
  MapPin, Clock, Radio
} from 'lucide-react';
import { Incident } from '../../types';
import { exportDataAsCsv, exportDataAsJson } from '../../services/api';

interface IncidentQueueProps {
  incidents: Incident[];
  onSelectIncident: (inc: Incident) => void;
}

export const IncidentQueue: React.FC<IncidentQueueProps> = ({ incidents, onSelectIncident }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'priority' | 'affected' | 'recent'>('priority');

  const filteredIncidents = (incidents || [])
    .filter(inc => {
      if (!inc) return false;
      const q = (searchTerm || '').toLowerCase();
      const locName = (inc.location_name || '').toLowerCase();
      const code = (inc.code || '').toLowerCase();
      const category = (inc.category || '').toLowerCase();
      const aiReason = (inc.ai_reasoning || '').toLowerCase();

      const matchesSearch = !searchTerm || 
                            locName.includes(q) ||
                            code.includes(q) ||
                            category.includes(q) ||
                            aiReason.includes(q);
      const matchesSeverity = severityFilter === 'ALL' || inc.severity === severityFilter;
      const matchesStatus = statusFilter === 'ALL' || inc.verification_status === statusFilter;
      return matchesSearch && matchesSeverity && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'priority') return b.priority_score - a.priority_score;
      if (sortBy === 'affected') return b.estimated_affected - a.estimated_affected;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  const handleExportCsv = () => {
    const exportRows = filteredIncidents.map(i => ({
      code: i.code,
      location: i.location_name,
      category: i.category,
      severity: i.severity,
      priority_score: i.priority_score,
      estimated_affected: i.estimated_affected,
      verification_status: i.verification_status,
      is_high_mortality_zone: i.is_high_mortality_zone,
      reports_count: i.reports_count,
      latitude: i.latitude,
      longitude: i.longitude,
      created_at: i.created_at
    }));
    exportDataAsCsv('disasterfog_incidents_export', exportRows);
  };

  const handleExportJson = () => {
    exportDataAsJson('disasterfog_incidents_export', filteredIncidents);
  };

  return (
    <div className="space-y-4">
      
      {/* Top Filter & Export Bar */}
      <div className="glass-panel p-4 rounded-xl flex flex-col lg:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 font-bold text-white uppercase text-sm tracking-wider w-full lg:w-auto">
          <ShieldAlert className="w-5 h-5 text-red-500 shrink-0" />
          <span>Incident Decision Queue ({filteredIncidents.length})</span>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          {/* Search Box */}
          <div className="relative flex-1 sm:w-64 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search location, code, hazard..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-lg pl-9 pr-8 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')} 
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Severity Filter */}
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-red-500 font-medium"
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
            className="bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-red-500 font-medium"
          >
            <option value="ALL">All Statuses</option>
            <option value="UNVERIFIED">Unverified Only</option>
            <option value="VERIFIED">Verified Only</option>
            <option value="ESCALATED">Escalated Only</option>
            <option value="REJECTED">Rejected Only</option>
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-red-500 font-medium"
          >
            <option value="priority">Sort: Highest Priority</option>
            <option value="affected">Sort: Most Affected</option>
            <option value="recent">Sort: Most Recent</option>
          </select>

          {/* Export Buttons */}
          <div className="flex items-center gap-1.5 ml-auto sm:ml-0">
            <button
              onClick={handleExportCsv}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-700 flex items-center gap-1 transition-colors"
              title="Export as CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">CSV</span>
            </button>
            <button
              onClick={handleExportJson}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-700 flex items-center gap-1 transition-colors"
              title="Export as JSON"
            >
              <FileCode className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden sm:inline">JSON</span>
            </button>
          </div>
        </div>
      </div>

      {/* Incident Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredIncidents.map((inc) => {
          const isCritical = inc.severity === 'CRITICAL' || inc.is_high_mortality_zone;
          return (
            <div
              key={inc.id}
              onClick={() => onSelectIncident(inc)}
              className={`glass-panel p-4 sm:p-5 rounded-xl border transition-all cursor-pointer hover:border-red-500/60 hover:scale-[1.008] group ${
                isCritical ? 'border-red-500/40 bg-gradient-to-r from-red-950/20 via-slate-900 to-slate-900' : 'border-slate-800'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-black text-slate-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                      {inc.code}
                    </span>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider ${
                      inc.severity === 'CRITICAL' ? 'bg-red-600 text-white pulse-critical' :
                      inc.severity === 'HIGH' ? 'bg-amber-600 text-white' :
                      inc.severity === 'MEDIUM' ? 'bg-yellow-600 text-black' : 'bg-emerald-600 text-white'
                    }`}>
                      {inc.severity}
                    </span>
                    {inc.is_high_mortality_zone && (
                      <span className="bg-red-950 text-red-300 text-[9px] font-black px-2 py-0.5 rounded border border-red-500/50 tracking-wider">
                        HIGH MORTALITY ZONE
                      </span>
                    )}
                  </div>
                  
                  <h4 className="text-sm font-bold text-white mt-2 group-hover:text-red-400 transition-colors flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-red-400 shrink-0" />
                    {inc.location_name}
                  </h4>
                  
                  <p className="text-xs text-slate-300 mt-1 line-clamp-2 leading-relaxed">
                    {inc.ai_reasoning || `Emergency incident recorded in ${inc.location_name}.`}
                  </p>
                </div>

                <div className="text-right shrink-0 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                  <div className="text-[10px] font-mono font-bold text-slate-400 uppercase">PRIORITY</div>
                  <div className="text-xl font-black text-red-400 font-mono">{inc.priority_score}</div>
                </div>
              </div>

              {/* Card Meta Row */}
              <div className="flex flex-wrap items-center justify-between mt-3 pt-3 border-t border-slate-800 text-[11px] text-slate-400 gap-2">
                <div className="flex items-center gap-3 font-mono">
                  <span className="flex items-center gap-1 text-amber-300 font-semibold">
                    <Users className="w-3.5 h-3.5 text-amber-400" />
                    ~{inc.estimated_affected}
                  </span>
                  <span className={`flex items-center gap-1 font-bold ${
                    inc.verification_status === 'VERIFIED' ? 'text-emerald-400' :
                    inc.verification_status === 'ESCALATED' ? 'text-amber-400' : 'text-slate-400'
                  }`}>
                    <CheckCircle className="w-3.5 h-3.5" />
                    {inc.verification_status}
                  </span>
                  {inc.conflicts_count > 0 && (
                    <span className="text-amber-400 font-bold flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      {inc.conflicts_count} Conflict
                    </span>
                  )}
                </div>

                <button className="text-xs text-red-400 group-hover:text-red-300 font-bold flex items-center gap-1">
                  <span>Inspect</span>
                  <Eye className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredIncidents.length === 0 && (
        <div className="glass-panel p-12 text-center rounded-2xl border border-slate-800 text-slate-400 space-y-2">
          <ShieldAlert className="w-8 h-8 text-slate-500 mx-auto" />
          <p className="font-bold text-sm text-white">No incidents match your filter criteria.</p>
          <p className="text-xs text-slate-500">Try adjusting your search query or severity filters.</p>
        </div>
      )}

    </div>
  );
};
