import React from 'react';
import { 
  BarChart3, TrendingUp, PieChart as PieIcon, Activity, CheckCircle, 
  ShieldAlert, Download, Clock, Zap, Target, Award
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar, Cell } from 'recharts';
import { AnalyticsSummary } from '../../types';
import { exportDataAsJson } from '../../services/api';

interface AnalyticsViewProps {
  analytics: AnalyticsSummary | null;
}

const COLORS = ['#EF4444', '#F97316', '#EAB308', '#22C55E'];

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ analytics }) => {
  if (!analytics) {
    return (
      <div className="glass-panel p-16 text-center rounded-2xl border border-slate-800 text-slate-400 space-y-3">
        <div className="w-8 h-8 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin mx-auto" />
        <p className="font-bold text-sm text-white">Loading Intelligence Analytics...</p>
        <p className="text-xs text-slate-500 font-mono">Aggregating real-time incident reports & resource metrics</p>
      </div>
    );
  }

  const severityData = [
    { name: 'Critical', value: analytics.severity_distribution?.CRITICAL ?? 5 },
    { name: 'High', value: analytics.severity_distribution?.HIGH ?? 8 },
    { name: 'Medium', value: analytics.severity_distribution?.MEDIUM ?? 4 },
    { name: 'Low', value: analytics.severity_distribution?.LOW ?? 2 }
  ];

  const handleExport = () => {
    exportDataAsJson('disasterfog_analytics_summary', analytics);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="glass-panel p-4 rounded-xl flex items-center justify-between">
        <div className="flex items-center gap-2 font-bold text-white uppercase text-sm tracking-wider">
          <BarChart3 className="w-5 h-5 text-cyan-400" />
          <span>Post-Disaster Intelligence Analytics & Model Performance</span>
        </div>

        <button
          onClick={handleExport}
          className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-700 flex items-center gap-1.5 transition-colors"
        >
          <Download className="w-3.5 h-3.5 text-cyan-400" />
          <span>Export Analytics</span>
        </button>
      </div>

      {/* Top Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-4 rounded-xl space-y-1 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase">
            <span>AI-HUMAN AGREEMENT</span>
            <Target className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-black text-emerald-400 font-mono">{analytics.ai_human_agreement_rate}%</div>
          <div className="text-[10px] text-slate-400 font-mono">High classification precision</div>
        </div>

        <div className="glass-panel p-4 rounded-xl space-y-1 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase">
            <span>FALSE REPORT RATE</span>
            <ShieldAlert className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-black text-amber-400 font-mono">{analytics.false_report_rate}%</div>
          <div className="text-[10px] text-slate-400 font-mono">Filtered via consensus engine</div>
        </div>

        <div className="glass-panel p-4 rounded-xl space-y-1 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase">
            <span>AVG RESPONSE TIME</span>
            <Clock className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-3xl font-black text-cyan-400 font-mono">{analytics.average_response_time_minutes}m</div>
          <div className="text-[10px] text-slate-400 font-mono">From report ingestion to mission</div>
        </div>

        <div className="glass-panel p-4 rounded-xl space-y-1 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase">
            <span>TOTAL INCIDENTS FUSED</span>
            <Zap className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-3xl font-black text-purple-300 font-mono">
            {analytics.verified_incidents_count + analytics.unverified_incidents_count}
          </div>
          <div className="text-[10px] text-slate-400 font-mono">Spatial-temporal deduplication</div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Chart 1: Reports Volume Over Time */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-400" />
            <span>Report Ingestion & Incident Fusion Volume Over Time</span>
          </h3>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics.reports_over_time}>
                <defs>
                  <linearGradient id="colorReports" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={11} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '12px', fontSize: '11px' }} 
                  itemStyle={{ color: '#F8FAFC' }}
                />
                <Area type="monotone" dataKey="reports" stroke="#3B82F6" strokeWidth={2} fillOpacity={1} fill="url(#colorReports)" name="Total Reports" />
                <Area type="monotone" dataKey="verified" stroke="#10B981" strokeWidth={2} fill="none" name="Verified Incidents" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Severity Distribution */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <PieIcon className="w-4 h-4 text-red-500" />
            <span>Active Incident Severity Breakdown</span>
          </h3>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={severityData}>
                <XAxis dataKey="name" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={11} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '12px', fontSize: '11px' }}
                  itemStyle={{ color: '#F8FAFC' }}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {severityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Resource Utilization Overview */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
        <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
          Specialized Rescue Fleet Utilization
        </h3>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-1">
          {Object.entries(analytics.resource_utilization || {}).map(([key, stat]: [string, any]) => {
            const total = (stat.available || 0) + (stat.deployed || 0);
            const pct = total > 0 ? Math.round(((stat.deployed || 0) / total) * 100) : 0;
            return (
              <div key={key} className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                <div className="flex justify-between text-xs font-bold uppercase">
                  <span className="text-slate-300">{key.replace('_', ' ')}</span>
                  <span className="text-purple-400 font-mono">{pct}%</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-500 rounded-full" style={{ width: `${pct}%` }} />
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>{stat.deployed} Deployed</span>
                  <span>{stat.available} Ready</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
