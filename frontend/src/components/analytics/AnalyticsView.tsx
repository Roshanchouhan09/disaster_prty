import React from 'react';
import { BarChart3, TrendingUp, PieChart as PieIcon, Activity, CheckCircle, ShieldAlert } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar, Cell } from 'recharts';
import { AnalyticsSummary } from '../../types';

interface AnalyticsViewProps {
  analytics: AnalyticsSummary | null;
}

const COLORS = ['#EF4444', '#F97316', '#EAB308', '#22C55E'];

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ analytics }) => {
  if (!analytics) return null;

  const severityData = [
    { name: 'Critical', value: analytics.severity_distribution.CRITICAL || 5 },
    { name: 'High', value: analytics.severity_distribution.HIGH || 8 },
    { name: 'Medium', value: analytics.severity_distribution.MEDIUM || 4 },
    { name: 'Low', value: analytics.severity_distribution.LOW || 2 }
  ];

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="glass-panel p-4 rounded-xl flex items-center justify-between">
        <div className="flex items-center gap-2 font-bold text-white uppercase text-sm tracking-wider">
          <BarChart3 className="w-5 h-5 text-cyan-400" />
          Post-Disaster Intelligence Analytics & Model Performance
        </div>
      </div>

      {/* Top Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="glass-panel p-4 rounded-xl space-y-1">
          <div className="text-xs text-gray-400 font-bold uppercase">AI-HUMAN AGREEMENT</div>
          <div className="text-2xl font-black text-emerald-400 font-mono">{analytics.ai_human_agreement_rate}%</div>
          <div className="text-[10px] text-gray-400">High classification alignment</div>
        </div>

        <div className="glass-panel p-4 rounded-xl space-y-1">
          <div className="text-xs text-gray-400 font-bold uppercase">FALSE REPORT RATE</div>
          <div className="text-2xl font-black text-amber-400 font-mono">{analytics.false_report_rate}%</div>
          <div className="text-[10px] text-gray-400">Deduplicated & filtered</div>
        </div>

        <div className="glass-panel p-4 rounded-xl space-y-1">
          <div className="text-xs text-gray-400 font-bold uppercase">AVG RESPONSE TIME</div>
          <div className="text-2xl font-black text-cyan-400 font-mono">{analytics.average_response_time_minutes}m</div>
          <div className="text-[10px] text-gray-400 font-mono">From report to dispatch</div>
        </div>

        <div className="glass-panel p-4 rounded-xl space-y-1">
          <div className="text-xs text-gray-400 font-bold uppercase">TOTAL INCIDENTS FUSED</div>
          <div className="text-2xl font-black text-purple-300 font-mono">{analytics.verified_incidents_count + analytics.unverified_incidents_count}</div>
          <div className="text-[10px] text-gray-400">Fused from {analytics.total_reports_count} reports</div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Chart 1: Reports Over Time */}
        <div className="glass-panel p-5 rounded-xl border border-gray-800 space-y-3">
          <h3 className="text-xs font-bold text-gray-200 uppercase tracking-wider flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-400" />
            Report Ingestion & Verification Volume Over Time
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
                <XAxis dataKey="time" stroke="#6B7280" fontSize={11} />
                <YAxis stroke="#6B7280" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '8px' }} />
                <Area type="monotone" dataKey="reports" stroke="#3B82F6" fillOpacity={1} fill="url(#colorReports)" name="Total Reports" />
                <Area type="monotone" dataKey="verified" stroke="#10B981" fill="none" name="Verified Incidents" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Severity Distribution */}
        <div className="glass-panel p-5 rounded-xl border border-gray-800 space-y-3">
          <h3 className="text-xs font-bold text-gray-200 uppercase tracking-wider flex items-center gap-2">
            <PieIcon className="w-4 h-4 text-red-500" />
            Incident Severity Breakdown
          </h3>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={severityData}>
                <XAxis dataKey="name" stroke="#6B7280" fontSize={11} />
                <YAxis stroke="#6B7280" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '8px' }} />
                <Bar dataKey="value">
                  {severityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  );
};
