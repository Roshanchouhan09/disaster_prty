import React, { useState } from 'react';
import { 
  X, ShieldAlert, CheckCircle2, XCircle, AlertTriangle, 
  Truck, Radio, MapPin, Cpu, ArrowRight, UserCheck, Layers 
} from 'lucide-react';
import { Incident } from '../../types';
import { incidentsApi, missionsApi } from '../../services/api';

interface IncidentDetailModalProps {
  incident: Incident | null;
  onClose: () => void;
  onRefresh: () => void;
}

export const IncidentDetailModal: React.FC<IncidentDetailModalProps> = ({
  incident,
  onClose,
  onRefresh
}) => {
  const [loading, setLoading] = useState(false);
  const [verifyNotes, setVerifyNotes] = useState('');
  const [createMissionOpen, setCreateMissionOpen] = useState(false);

  const [missionTitle, setMissionTitle] = useState('');
  const [teamName, setTeamName] = useState('NDRF Battalion Alpha');

  if (!incident) return null;

  const handleVerify = async () => {
    setLoading(true);
    await incidentsApi.verify(incident.id, verifyNotes || 'Verified by Operations Controller');
    setLoading(false);
    onRefresh();
    onClose();
  };

  const handleReject = async () => {
    setLoading(true);
    await incidentsApi.reject(incident.id, verifyNotes || 'Rejected after field check');
    setLoading(false);
    onRefresh();
    onClose();
  };

  const handleEscalate = async () => {
    setLoading(true);
    await incidentsApi.escalate(incident.id, verifyNotes || 'Escalated for senior command review');
    setLoading(false);
    onRefresh();
    onClose();
  };

  const handleCreateMission = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await missionsApi.create({
      incident_id: incident.id,
      title: missionTitle || `Rescue Mission - ${incident.location_name}`,
      priority: incident.severity,
      assigned_team: teamName,
      resource_ids: [1, 2, 4],
      notes: `Targeting rooftop evacuation of ~${incident.estimated_affected} people.`
    });
    setLoading(false);
    onRefresh();
    setCreateMissionOpen(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-dark-800 border border-gray-700 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        
        {/* Header */}
        <div className="p-5 border-b border-gray-800 flex items-center justify-between sticky top-0 bg-dark-800 z-10">
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm font-bold bg-gray-900 text-red-400 px-2.5 py-1 rounded border border-gray-700">
              {incident.code}
            </span>
            <div>
              <h2 className="text-base font-bold text-white">{incident.location_name}</h2>
              <div className="text-xs text-gray-400 font-mono">
                LAT: {incident.latitude.toFixed(4)}, LNG: {incident.longitude.toFixed(4)}
              </div>
            </div>
          </div>

          <button onClick={onClose} className="text-gray-400 hover:text-white p-1 rounded-lg">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 flex-1">
          
          {/* Top Metrics Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-gray-900 p-3 rounded-xl border border-gray-800">
              <div className="text-[10px] text-gray-400 font-bold uppercase">SEVERITY</div>
              <div className={`text-sm font-extrabold mt-1 ${
                incident.severity === 'CRITICAL' ? 'text-red-500' : 'text-amber-400'
              }`}>
                {incident.severity}
              </div>
            </div>

            <div className="bg-gray-900 p-3 rounded-xl border border-gray-800">
              <div className="text-[10px] text-gray-400 font-bold uppercase">PRIORITY SCORE</div>
              <div className="text-sm font-extrabold text-red-400 mt-1 font-mono">{incident.priority_score}/100</div>
            </div>

            <div className="bg-gray-900 p-3 rounded-xl border border-gray-800">
              <div className="text-[10px] text-gray-400 font-bold uppercase">AFFECTED POPULATION</div>
              <div className="text-sm font-extrabold text-amber-300 mt-1">~{incident.estimated_affected} people</div>
            </div>

            <div className="bg-gray-900 p-3 rounded-xl border border-gray-800">
              <div className="text-[10px] text-gray-400 font-bold uppercase">STATUS</div>
              <div className="text-sm font-extrabold text-emerald-400 mt-1">{incident.verification_status}</div>
            </div>
          </div>

          {/* AI Recommendation & Explanation Box */}
          <div className="bg-gradient-to-r from-red-950/30 to-gray-900 p-4 rounded-xl border border-red-500/30 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-red-400 uppercase tracking-wider">
              <Cpu className="w-4 h-4 text-red-500" />
              Explainable AI Intelligence Assessment
            </div>
            <p className="text-xs text-gray-200 leading-relaxed font-sans">{incident.ai_reasoning}</p>

            {/* Recommended Resources List */}
            {incident.required_resources && (
              <div className="pt-2 flex flex-wrap items-center gap-2">
                <span className="text-[11px] text-gray-400 font-bold">Recommended Relief Deployment:</span>
                {Object.entries(incident.required_resources).map(([type, qty]) => (
                  <span key={type} className="bg-red-600/20 text-red-300 border border-red-500/40 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                    {qty} {type.replace('_', ' ')}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Contradiction Panel (if open conflicts exist) */}
          {incident.conflicts && incident.conflicts.length > 0 && (
            <div className="bg-amber-950/20 border border-amber-500/40 p-4 rounded-xl space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                CONTRADICTORY EVIDENCE FLAGGED ({incident.conflicts.length})
              </div>

              {incident.conflicts.map((c) => (
                <div key={c.id} className="bg-gray-900 p-3 rounded-lg border border-gray-800 text-xs space-y-2">
                  <div className="font-semibold text-amber-300">{c.description}</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                    <div className="bg-gray-800 p-2 rounded text-gray-300 border-l-2 border-red-500">
                      <span className="font-bold text-red-400 block mb-1">Claim A:</span>
                      {c.claim_a}
                    </div>
                    <div className="bg-gray-800 p-2 rounded text-gray-300 border-l-2 border-emerald-500">
                      <span className="font-bold text-emerald-400 block mb-1">Claim B:</span>
                      {c.claim_b}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Supporting Evidence Panel */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-2">
              <Radio className="w-4 h-4 text-blue-400" />
              Supporting Multi-Source Reports ({incident.reports?.length || incident.reports_count})
            </h3>

            <div className="space-y-2">
              {incident.reports?.map((rpt) => (
                <div key={rpt.id} className="bg-gray-900 p-3 rounded-xl border border-gray-800 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-blue-400">{rpt.report_code}</span>
                      <span className="bg-gray-800 text-gray-300 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                        {rpt.source_type.replace('_', ' ')}
                      </span>
                      <span className="text-[10px] text-gray-400 font-mono">By: {rpt.reporter_name}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono text-emerald-400 font-bold">
                        Reliability {(rpt.source_reliability * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>

                  <p className="text-gray-200">{rpt.description}</p>

                  {/* Transparent Reliability Factors */}
                  {rpt.reliability_breakdown?.factors && (
                    <div className="bg-gray-950 p-2 rounded border border-gray-800 text-[10px] space-y-1 font-mono text-gray-400">
                      <div className="font-bold text-gray-300">Transparent Score Factors:</div>
                      {rpt.reliability_breakdown.factors.map((f, idx) => (
                        <div key={idx} className="flex justify-between">
                          <span>{f.factor}</span>
                          <span className={f.delta >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                            {f.delta >= 0 ? `+${f.delta}` : f.delta}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Verification Actions Form */}
          <div className="bg-gray-900 p-4 rounded-xl border border-gray-800 space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-400" />
              Human-in-the-Loop Operations Controller Decision
            </h4>

            <input
              type="text"
              placeholder="Optional field observation notes..."
              value={verifyNotes}
              onChange={(e) => setVerifyNotes(e.target.value)}
              className="w-full bg-dark-900 border border-gray-700 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
            />

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                onClick={handleVerify}
                disabled={loading}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <CheckCircle2 className="w-4 h-4" />
                VERIFY & APPROVE
              </button>

              <button
                onClick={handleEscalate}
                disabled={loading}
                className="bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <AlertTriangle className="w-4 h-4" />
                ESCALATE TO COMMAND
              </button>

              <button
                onClick={handleReject}
                disabled={loading}
                className="bg-red-700 hover:bg-red-600 text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <XCircle className="w-4 h-4" />
                REJECT REPORT
              </button>

              <button
                onClick={() => setCreateMissionOpen(!createMissionOpen)}
                className="ml-auto bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <Truck className="w-4 h-4" />
                CREATE RESCUE MISSION
              </button>
            </div>
          </div>

          {/* Rescue Mission Creation Form */}
          {createMissionOpen && (
            <form onSubmit={handleCreateMission} className="bg-purple-950/20 border border-purple-500/40 p-4 rounded-xl space-y-3">
              <h4 className="text-xs font-bold text-purple-300 uppercase tracking-wider">Deploy Rescue Mission</h4>
              
              <input
                type="text"
                placeholder="Mission Title..."
                value={missionTitle}
                onChange={(e) => setMissionTitle(e.target.value)}
                className="w-full bg-dark-900 border border-gray-700 rounded-lg px-3 py-2 text-xs text-white"
                required
              />

              <input
                type="text"
                placeholder="Assigned Team (e.g. NDRF Battalion 4)"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                className="w-full bg-dark-900 border border-gray-700 rounded-lg px-3 py-2 text-xs text-white"
                required
              />

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold py-2 rounded-lg transition-colors"
              >
                DISPATCH RESCUE TEAM NOW
              </button>
            </form>
          )}

        </div>

      </div>
    </div>
  );
};
