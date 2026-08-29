import React from 'react';
import { 
  ShieldAlert, Activity, Users, AlertTriangle, CheckCircle, 
  Clock, Truck, Radio, MapPin, ArrowRight, Eye, AlertOctagon 
} from 'lucide-react';
import { AnalyticsSummary, Incident } from '../../types';

interface CommandCenterProps {
  analytics: AnalyticsSummary | null;
  incidents: Incident[];
  onSelectIncident: (inc: Incident) => void;
  onNavigate: (tab: string) => void;
}

export const CommandCenter: React.FC<CommandCenterProps> = ({
  analytics,
  incidents,
  onSelectIncident,
  onNavigate
}) => {
  const criticalIncidents = incidents.filter(i => i.severity === 'CRITICAL' || i.is_high_mortality_zone);
  const unverifiedIncidents = incidents.filter(i => i.verification_status === 'UNVERIFIED' || i.verification_status === 'ESCALATED');

  return (
    <div className="space-y-6">
      
      {/* Top Banner Ticker */}
      <div className="bg-gradient-to-r from-red-950/80 via-dark-800 to-dark-800 border border-red-500/30 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="bg-red-600/30 text-red-500 p-3 rounded-lg border border-red-500/40 pulse-critical">
            <AlertOctagon className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white tracking-wide">ACTIVE DISASTER EVENT</h2>
              <span className="bg-red-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded tracking-widest uppercase">STAGE 4 EMERGENCY</span>
            </div>
            <p className="text-xs text-gray-300">
              North River Administrative District Flash Flood & Structural Collapse | Multi-Hazard Threat Level 4
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('map')}
            className="bg-red-600 hover:bg-red-500 text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-1.5 shadow-lg transition-all"
          >
            OPEN LIVE GIS MAP
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        
        <div className="glass-panel p-4 rounded-xl border border-gray-800 hover:border-red-500/40 transition-all">
          <div className="flex items-center justify-between text-gray-400 text-xs font-medium mb-1">
            <span>INCOMING REPORTS</span>
            <Activity className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">{analytics?.total_reports_count || 0}</div>
          <div className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1">
            <span>+12 in last 30m</span>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-gray-800 hover:border-red-500/40 transition-all">
          <div className="flex items-center justify-between text-gray-400 text-xs font-medium mb-1">
            <span>VERIFIED INCIDENTS</span>
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono">{analytics?.verified_incidents_count || 0}</div>
          <div className="text-[10px] text-gray-400 mt-1 font-mono">
            {analytics?.unverified_incidents_count || 0} Pending Review
          </div>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-red-500/40 bg-red-950/20 transition-all pulse-critical">
          <div className="flex items-center justify-between text-red-400 text-xs font-bold mb-1">
            <span>CRITICAL INCIDENTS</span>
            <ShieldAlert className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-2xl font-black text-red-500 font-mono">{analytics?.critical_incidents_count || 0}</div>
          <div className="text-[10px] text-red-400 mt-1 font-semibold">
            {analytics?.high_risk_zones_count || 0} High-Mortality Zones
          </div>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-gray-800 hover:border-amber-500/40 transition-all">
          <div className="flex items-center justify-between text-gray-400 text-xs font-medium mb-1">
            <span>PEOPLE AT RISK</span>
            <Users className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400 font-mono">~{analytics?.estimated_affected_population || 0}</div>
          <div className="text-[10px] text-red-400 mt-1 font-mono">
            {analytics?.missing_persons_count || 0} Missing Persons
          </div>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-gray-800 hover:border-purple-500/40 transition-all">
          <div className="flex items-center justify-between text-gray-400 text-xs font-medium mb-1">
            <span>RESCUE MISSIONS</span>
            <Truck className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-purple-300 font-mono">{analytics?.active_missions_count || 0}</div>
          <div className="text-[10px] text-gray-400 mt-1 font-mono">
            {analytics?.deployed_resources_count || 0} Units Deployed
          </div>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-gray-800 hover:border-cyan-500/40 transition-all">
          <div className="flex items-center justify-between text-gray-400 text-xs font-medium mb-1">
            <span>AI CONFIDENCE</span>
            <Activity className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-cyan-400 font-mono">{analytics?.overall_confidence_score || 92}%</div>
          <div className="text-[10px] text-gray-400 mt-1 font-mono">
            Avg ETA {analytics?.average_response_time_minutes || 14}m
          </div>
        </div>

      </div>

      {/* Main Content Grid: Critical High-Risk Priority Queue + Live Activity Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: High Risk / High Priority Incidents */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              High Priority & High-Mortality Risk Zones
            </h3>
            <button 
              onClick={() => onNavigate('incidents')}
              className="text-xs text-red-400 hover:text-red-300 font-semibold flex items-center gap-1"
            >
              View All Queue ({incidents.length})
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {incidents.slice(0, 4).map((inc) => (
              <div 
                key={inc.id}
                onClick={() => onSelectIncident(inc)}
                className={`glass-panel p-4 rounded-xl border transition-all cursor-pointer hover:scale-[1.01] ${
                  inc.severity === 'CRITICAL' ? 'border-red-500/40 bg-red-950/10' : 'border-gray-800 hover:border-gray-700'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-gray-400">{inc.code}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                        inc.severity === 'CRITICAL' ? 'bg-red-600 text-white pulse-critical' :
                        inc.severity === 'HIGH' ? 'bg-amber-600 text-white' :
                        inc.severity === 'MEDIUM' ? 'bg-yellow-600 text-black' : 'bg-emerald-600 text-white'
                      }`}>
                        {inc.severity}
                      </span>
                      {inc.is_high_mortality_zone && (
                        <span className="bg-red-900/80 text-red-300 text-[9px] font-extrabold px-1.5 py-0.5 rounded border border-red-500/50">
                          MORTALITY RISK ZONE
                        </span>
                      )}
                      <span className="text-[10px] font-mono bg-gray-800 text-gray-300 px-1.5 py-0.5 rounded">
                        SCORE {inc.priority_score}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-white mt-1">{inc.location_name}</h4>
                    <p className="text-xs text-gray-300 mt-0.5 line-clamp-2">{inc.ai_reasoning}</p>
                  </div>

                  <button className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-200 px-3 py-1.5 rounded-lg flex items-center gap-1 font-medium transition-colors shrink-0">
                    <Eye className="w-3.5 h-3.5" />
                    Inspect
                  </button>
                </div>

                <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-gray-800 text-[11px] text-gray-400">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-amber-400" />
                      ~{inc.estimated_affected} Affected
                    </span>
                    <span className="flex items-center gap-1">
                      <Radio className="w-3.5 h-3.5 text-blue-400" />
                      {inc.reports_count} Reports Merged
                    </span>
                    {inc.conflicts_count > 0 && (
                      <span className="text-amber-400 font-bold flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        {inc.conflicts_count} Conflict Flagged
                      </span>
                    )}
                  </div>
                  <span className="font-mono text-gray-500">{new Date(inc.created_at).toLocaleTimeString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Col: Unverified Verification Requests & Action Panel */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-amber-400" />
            Pending Human Verification ({unverifiedIncidents.length})
          </h3>

          <div className="glass-panel p-4 rounded-xl border border-gray-800 space-y-3">
            {unverifiedIncidents.slice(0, 3).map((inc) => (
              <div key={inc.id} className="bg-gray-900/80 p-3 rounded-lg border border-gray-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono font-bold text-amber-400">{inc.code}</span>
                  <span className="text-[10px] text-gray-400 font-mono">{inc.category.toUpperCase()}</span>
                </div>
                <div className="text-xs text-gray-200 font-medium">{inc.location_name}</div>
                <div className="flex items-center gap-2 pt-1">
                  <button 
                    onClick={() => onSelectIncident(inc)}
                    className="flex-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/40 text-[11px] font-bold py-1 rounded transition-colors text-center"
                  >
                    Verify Incident
                  </button>
                  <button 
                    onClick={() => onSelectIncident(inc)}
                    className="flex-1 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/40 text-[11px] font-bold py-1 rounded transition-colors text-center"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}

            {unverifiedIncidents.length === 0 && (
              <div className="text-center py-6 text-xs text-gray-500 font-mono">
                All incoming AI classifications verified.
              </div>
            )}
          </div>

          {/* Offline Mobile Sync Banner */}
          <div className="bg-gradient-to-r from-blue-950/40 to-gray-900 p-4 rounded-xl border border-blue-500/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-300">FIELD OFFICER OFFLINE MODE</span>
              <span className="bg-blue-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">READY</span>
            </div>
            <p className="text-[11px] text-gray-300">
              Field teams can submit reports in zero-connectivity sectors. Queue auto-syncs when online.
            </p>
            <button 
              onClick={() => onNavigate('reports')}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-1.5 rounded-lg transition-colors"
            >
              Open Mobile Field Tool
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};
