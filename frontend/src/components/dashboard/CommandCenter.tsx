import React, { useState } from 'react';
import { 
  ShieldAlert, Activity, Users, AlertTriangle, CheckCircle, 
  Clock, Truck, Radio, MapPin, ArrowRight, Eye, AlertOctagon,
  Sparkles, Filter, CheckCircle2, XCircle, ArrowUpRight, Siren,
  Smartphone, Cpu, ChevronDown, ChevronUp
} from 'lucide-react';
import { AnalyticsSummary, Incident, SystemWorkflowState } from '../../types';
import { SystemWorkflow3D } from '../visualization/SystemWorkflow3D';

interface CommandCenterProps {
  analytics: AnalyticsSummary | null;
  incidents: Incident[];
  onSelectIncident: (inc: Incident) => void;
  onNavigate: (tab: string) => void;
  onQuickVerify?: (inc: Incident) => void;
  onOpenSOS?: () => void;
  activeSosCount?: number;
  workflowState?: SystemWorkflowState;
  onWorkflowStateChange?: (state: SystemWorkflowState) => void;
}

export const CommandCenter: React.FC<CommandCenterProps> = ({
  analytics,
  incidents,
  onSelectIncident,
  onNavigate,
  onQuickVerify,
  onOpenSOS,
  activeSosCount = 0,
  workflowState = 'idle',
  onWorkflowStateChange
}) => {
  const [filterMode, setFilterMode] = useState<'ALL' | 'CRITICAL' | 'UNVERIFIED'>('ALL');
  const [show3DPipeline, setShow3DPipeline] = useState(true);

  const safeIncidents = incidents || [];
  const criticalIncidents = safeIncidents.filter(i => i?.severity === 'CRITICAL' || i?.is_high_mortality_zone);
  const unverifiedIncidents = safeIncidents.filter(i => i?.verification_status === 'UNVERIFIED' || i?.verification_status === 'ESCALATED');

  const displayedIncidents = filterMode === 'CRITICAL'
    ? criticalIncidents
    : filterMode === 'UNVERIFIED'
    ? unverifiedIncidents
    : safeIncidents;

  return (
    <div className="space-y-6">
      
      {/* Top Emergency Operations Ticker Banner */}
      <div className="bg-gradient-to-r from-red-950 via-slate-900 to-slate-900 border border-red-500/40 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-center justify-between gap-4 shadow-2xl shadow-red-950/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-full bg-gradient-to-l from-red-600/10 to-transparent pointer-events-none"></div>
        
        <div className="flex items-center gap-3.5 z-10">
          <div className="bg-gradient-to-br from-red-600 to-rose-700 text-white p-3 rounded-xl border border-red-400/50 shadow-lg shadow-red-600/30 pulse-critical shrink-0">
            <AlertOctagon className="w-7 h-7" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-white tracking-wide">ACTIVE DISASTER SITUATION</h2>
              <span className="bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded tracking-widest uppercase shadow">
                DEFCON LEVEL 1 EMERGENCY
              </span>
              {activeSosCount > 0 && (
                <span className="bg-rose-500 text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded animate-pulse">
                  {activeSosCount} LIVE SOS SIGNALS
                </span>
              )}
            </div>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              North River Administrative District — Combined Seismic Tremor & High-Volume River Embankment Breach. Multi-agency triage in effect.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 z-10 w-full md:w-auto justify-end flex-wrap sm:flex-nowrap">
          {onOpenSOS && (
            <button
              onClick={onOpenSOS}
              className="w-full sm:w-auto bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-rose-500 text-white text-xs font-black px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-red-950 transition-all pulse-critical active:scale-95"
            >
              <AlertOctagon className="w-4 h-4 text-white animate-pulse" />
              <span>TRIGGER SOS RESCUE</span>
            </button>
          )}

          <button
            onClick={() => onNavigate('map')}
            className="w-full sm:w-auto bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            <span>LIVE GIS MAP</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Embedded 3D System Workflow Architecture Showcase */}
      <div className="glass-panel rounded-2xl border border-purple-500/30 overflow-hidden shadow-2xl bg-slate-900/60">
        <div className="p-3.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Cpu className="w-4 h-4 text-purple-400" />
            <h3 className="text-xs sm:text-sm font-bold text-white tracking-wide">
              REAL-TIME 3D INTELLIGENCE PIPELINE & RESCUE FLOW
            </h3>
            <span className="text-[10px] font-mono bg-purple-950 text-purple-300 px-2 py-0.5 rounded border border-purple-500/30 hidden sm:inline">
              WebGL Accelerated
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('workflow3d')}
              className="text-xs text-purple-400 hover:text-purple-300 font-bold px-2 py-1 rounded hover:bg-purple-950/40 transition-colors flex items-center gap-1"
            >
              <span>Full Screen</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setShow3DPipeline(!show3DPipeline)}
              className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors"
              title={show3DPipeline ? 'Collapse 3D Visualizer' : 'Expand 3D Visualizer'}
            >
              {show3DPipeline ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {show3DPipeline && (
          <div className="p-2 sm:p-3">
            <SystemWorkflow3D
              workflowState={workflowState}
              onStateSelect={onWorkflowStateChange}
              className="h-[380px] sm:h-[440px]"
            />
          </div>
        )}
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        
        {/* KPI 1: Ingested Reports */}
        <div className="glass-panel p-4 rounded-xl border border-slate-800/90 hover:border-blue-500/50 transition-all group">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-1">
            <span className="truncate">INGESTED REPORTS</span>
            <Activity className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white font-mono">{analytics?.total_reports_count || incidents.length * 4}</div>
          <div className="text-[10px] text-emerald-400 mt-1.5 flex items-center gap-1 font-semibold">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
            <span>Live Stream Ingestion</span>
          </div>
        </div>

        {/* KPI 2: Verified Incidents */}
        <div className="glass-panel p-4 rounded-xl border border-slate-800/90 hover:border-emerald-500/50 transition-all group">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-1">
            <span className="truncate">VERIFIED INCIDENTS</span>
            <CheckCircle className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">{analytics?.verified_incidents_count || 14}</div>
          <div className="text-[10px] text-slate-400 mt-1.5 font-mono">
            {unverifiedIncidents.length} Pending Review
          </div>
        </div>

        {/* KPI 3: Critical Mortality Zones */}
        <div className="glass-panel p-4 rounded-xl border border-red-500/50 bg-red-950/20 transition-all pulse-critical group">
          <div className="flex items-center justify-between text-red-400 text-xs font-bold mb-1">
            <span className="truncate">CRITICAL ZONES</span>
            <ShieldAlert className="w-4 h-4 text-red-500 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-red-500 font-mono">{criticalIncidents.length}</div>
          <div className="text-[10px] text-red-300 mt-1.5 font-bold uppercase tracking-wider">
            High Mortality Risk
          </div>
        </div>

        {/* KPI 4: Affected Population */}
        <div className="glass-panel p-4 rounded-xl border border-slate-800/90 hover:border-amber-500/50 transition-all group">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-1">
            <span className="truncate">PEOPLE AT RISK</span>
            <Users className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-400 font-mono">
            ~{analytics?.estimated_affected_population || 850}
          </div>
          <div className="text-[10px] text-slate-400 mt-1.5 font-mono">
            {analytics?.missing_persons_count || 18} Triage Requests
          </div>
        </div>

        {/* KPI 5: Rescue Operations */}
        <div className="glass-panel p-4 rounded-xl border border-slate-800/90 hover:border-purple-500/50 transition-all group">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-1">
            <span className="truncate">ACTIVE MISSIONS</span>
            <Truck className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-purple-300 font-mono">{analytics?.active_missions_count || 4}</div>
          <div className="text-[10px] text-slate-400 mt-1.5 font-mono">
            {analytics?.deployed_resources_count || 3} Assets Deployed
          </div>
        </div>

        {/* KPI 6: AI Confidence */}
        <div className="glass-panel p-4 rounded-xl border border-slate-800/90 hover:border-cyan-500/50 transition-all group">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-1">
            <span className="truncate">AI CONFIDENCE</span>
            <Sparkles className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-cyan-400 font-mono">
            {analytics?.overall_confidence_score || 93.4}%
          </div>
          <div className="text-[10px] text-slate-400 mt-1.5 font-mono">
            Avg Dispatch ~14m
          </div>
        </div>

      </div>

      {/* Main Content Grid: Prioritized Incident Feed & Action Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Incident Queue Feed with Filter Chips */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Siren className="w-4 h-4 text-red-500" />
              <h3 className="text-sm font-black text-white uppercase tracking-wider">
                Prioritized Incident Feed ({displayedIncidents.length})
              </h3>
            </div>

            {/* Filter Chips */}
            <div className="flex items-center gap-1.5 bg-slate-900/80 p-1 rounded-lg border border-slate-800 text-xs">
              <button
                onClick={() => setFilterMode('ALL')}
                className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                  filterMode === 'ALL' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                All ({incidents.length})
              </button>
              <button
                onClick={() => setFilterMode('CRITICAL')}
                className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                  filterMode === 'CRITICAL' ? 'bg-red-600 text-white shadow' : 'text-red-400 hover:text-red-300'
                }`}
              >
                Critical ({criticalIncidents.length})
              </button>
              <button
                onClick={() => setFilterMode('UNVERIFIED')}
                className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                  filterMode === 'UNVERIFIED' ? 'bg-amber-600 text-white shadow' : 'text-amber-400 hover:text-amber-300'
                }`}
              >
                Pending Review ({unverifiedIncidents.length})
              </button>
            </div>
          </div>

          {/* Incidents Card List */}
          <div className="space-y-3">
            {displayedIncidents.slice(0, 6).map((inc) => {
              const isCritical = inc.severity === 'CRITICAL' || inc.is_high_mortality_zone;
              return (
                <div 
                  key={inc.id}
                  onClick={() => onSelectIncident(inc)}
                  className={`glass-panel p-4 rounded-xl border transition-all cursor-pointer hover:scale-[1.008] group ${
                    isCritical 
                      ? 'border-red-500/40 bg-gradient-to-r from-red-950/20 via-slate-900 to-slate-900' 
                      : 'border-slate-800 hover:border-slate-700 bg-slate-900/60'
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
                            HIGH MORTALITY RISK ZONE
                          </span>
                        )}
                        <span className="text-[10px] font-mono font-bold bg-slate-800 text-slate-200 px-2 py-0.5 rounded">
                          PRIORITY SCORE: {inc.priority_score}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-white mt-2 group-hover:text-red-400 transition-colors flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-red-400 shrink-0" />
                        {inc.location_name}
                      </h4>

                      <p className="text-xs text-slate-300 mt-1 line-clamp-2 leading-relaxed">
                        {inc.ai_reasoning || `Emergency event affecting ~${inc.estimated_affected} people.`}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <button className="text-xs bg-slate-800 hover:bg-red-600 text-slate-200 hover:text-white px-3 py-1.5 rounded-lg flex items-center gap-1 font-semibold transition-all shadow">
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect</span>
                      </button>
                    </div>
                  </div>

                  {/* Card Bottom Meta Bar */}
                  <div className="flex flex-wrap items-center justify-between mt-3 pt-2.5 border-t border-slate-800/80 text-[11px] text-slate-400 gap-2">
                    <div className="flex items-center gap-3 sm:gap-4 font-mono">
                      <span className="flex items-center gap-1 text-amber-300 font-semibold">
                        <Users className="w-3.5 h-3.5 text-amber-400" />
                        ~{inc.estimated_affected} civilians
                      </span>
                      <span className="flex items-center gap-1 text-blue-300 font-semibold">
                        <Radio className="w-3.5 h-3.5 text-blue-400" />
                        {inc.reports_count || 1} reports fused
                      </span>
                      {inc.conflicts_count > 0 && (
                        <span className="text-amber-400 font-bold flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5 animate-bounce" />
                          {inc.conflicts_count} Conflict Flagged
                        </span>
                      )}
                    </div>
                    <span className="font-mono text-slate-500 text-[10px]">
                      {new Date(inc.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              );
            })}

            {displayedIncidents.length === 0 && (
              <div className="glass-panel p-12 text-center rounded-2xl border border-slate-800 text-slate-400 space-y-2">
                <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto" />
                <p className="font-bold text-sm text-white">No incidents match the active filter.</p>
                <p className="text-xs text-slate-500">All emergency operations are clear for this selection.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Human-in-the-Loop Verification Queue + Quick Action Panels */}
        <div className="space-y-5">
          
          {/* Pending Verification Panel */}
          <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-amber-400" />
                <span>Verification Action Queue ({unverifiedIncidents.length})</span>
              </h3>
            </div>

            <div className="space-y-2.5">
              {unverifiedIncidents.slice(0, 3).map((inc) => (
                <div key={inc.id} className="bg-slate-900/90 p-3 rounded-lg border border-slate-800 space-y-2 hover:border-slate-700 transition-colors">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-bold text-amber-400">{inc.code}</span>
                    <span className="text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded uppercase font-bold">
                      {inc.category.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="text-xs text-slate-200 font-semibold truncate">{inc.location_name}</div>
                  <div className="flex items-center gap-2 pt-1">
                    <button 
                      onClick={() => onSelectIncident(inc)}
                      className="flex-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/40 text-[11px] font-bold py-1.5 rounded-lg transition-colors text-center flex items-center justify-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Verify Incident
                    </button>
                    <button 
                      onClick={() => onSelectIncident(inc)}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold px-2.5 py-1.5 rounded-lg transition-colors"
                    >
                      Review
                    </button>
                  </div>
                </div>
              ))}

              {unverifiedIncidents.length === 0 && (
                <div className="text-center py-6 text-xs text-slate-400 font-mono flex flex-col items-center gap-1.5">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                  <span>All incoming reports verified by EOC Controller.</span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Mission Dispatch Box */}
          <div className="bg-gradient-to-br from-purple-950/40 via-slate-900 to-slate-900 p-4 rounded-xl border border-purple-500/30 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-purple-400" />
                Resource Dispatch Status
              </span>
              <span className="bg-purple-600/30 text-purple-300 border border-purple-500/40 text-[9px] font-black px-1.5 py-0.5 rounded uppercase font-mono">
                {analytics?.available_resources_count || 6} AVAILABLE
              </span>
            </div>
            <p className="text-[11px] text-slate-300 leading-snug">
              Specialized rescue assets (Inflatable boats, heavy crawl excavators, trauma ambulances) staged at District Command.
            </p>
            <button 
              onClick={() => onNavigate('resources')}
              className="w-full bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold py-2 rounded-lg transition-colors shadow flex items-center justify-center gap-1.5"
            >
              <span>Manage Rescue Assets</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Field Submission Offline Mode Card */}
          <div className="bg-gradient-to-br from-blue-950/40 via-slate-900 to-slate-900 p-4 rounded-xl border border-blue-500/30 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-300 uppercase tracking-wider flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-blue-400" />
                Field Recon Mobile App
              </span>
              <span className="bg-blue-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded uppercase">
                OFFLINE READY
              </span>
            </div>
            <p className="text-[11px] text-slate-300 leading-snug">
              Field officers in zero-connectivity zones can capture multi-lingual evidence and sync automatically upon reconnection.
            </p>
            <button 
              onClick={() => onNavigate('reports')}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-2 rounded-lg transition-colors shadow flex items-center justify-center gap-1.5"
            >
              <span>Open Field Submission Tool</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};
