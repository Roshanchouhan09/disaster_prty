import React, { useState } from 'react';
import { 
  X, ShieldAlert, CheckCircle2, XCircle, AlertTriangle, 
  Truck, Radio, MapPin, Cpu, ArrowRight, UserCheck, Layers,
  CheckCircle, Sparkles, Navigation, Send, AlertOctagon, HelpCircle
} from 'lucide-react';
import { Incident } from '../../types';
import { incidentsApi, missionsApi } from '../../services/api';
import { useToast } from '../common/Toast';
import { ConfirmModal } from '../common/ConfirmModal';

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
  const { success, error, warning } = useToast();
  const [activeTab, setActiveTab] = useState<'ai' | 'evidence' | 'conflicts' | 'mission'>('ai');
  const [loading, setLoading] = useState(false);
  const [verifyNotes, setVerifyNotes] = useState('');
  
  // Mission Form
  const [missionTitle, setMissionTitle] = useState('');
  const [teamName, setTeamName] = useState('NDRF Battalion Alpha');
  const [missionPriority, setMissionPriority] = useState<string>('HIGH');
  const [missionNotes, setMissionNotes] = useState('');

  // Confirmation Modal
  const [confirmRejectOpen, setConfirmRejectOpen] = useState(false);

  if (!incident) return null;

  const handleVerify = async () => {
    setLoading(true);
    try {
      await incidentsApi.verify(incident.id, verifyNotes || 'Verified by Operations Controller');
      success(`Incident ${incident.code} Verified`, 'Approved for tactical rescue deployment.');
      onRefresh();
      onClose();
    } catch (err: any) {
      error('Verification Failed', err?.message || 'Could not verify incident');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmReject = async () => {
    setLoading(true);
    try {
      await incidentsApi.reject(incident.id, verifyNotes || 'Rejected after field check');
      warning(`Incident ${incident.code} Rejected`, 'Marked as discarded/false alert.');
      setConfirmRejectOpen(false);
      onRefresh();
      onClose();
    } catch (err: any) {
      error('Rejection Failed', err?.message || 'Could not reject incident');
    } finally {
      setLoading(false);
    }
  };

  const handleEscalate = async () => {
    setLoading(true);
    try {
      await incidentsApi.escalate(incident.id, verifyNotes || 'Escalated for senior command review');
      warning(`Incident ${incident.code} Escalated`, 'Flagged for High-Command Decision.');
      onRefresh();
      onClose();
    } catch (err: any) {
      error('Escalation Failed', err?.message || 'Could not escalate incident');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMission = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await missionsApi.create({
        incident_id: incident.id,
        title: missionTitle || `Rescue Operation - ${incident.location_name}`,
        priority: (missionPriority as any) || incident.severity,
        assigned_team: teamName,
        resource_ids: [1, 2, 4],
        notes: missionNotes || `Targeting rooftop evacuation of ~${incident.estimated_affected} people.`
      });
      success('Rescue Mission Dispatched', `Assigned to ${teamName}`);
      onRefresh();
      onClose();
    } catch (err: any) {
      error('Mission Dispatch Failed', err?.message || 'Could not create rescue mission');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
        <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-4xl w-full max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-200">
          
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900/95 backdrop-blur-md z-10">
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs sm:text-sm font-black bg-slate-950 text-red-400 px-3 py-1.5 rounded-lg border border-red-500/40 shadow-sm">
                {incident.code}
              </span>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-red-500 shrink-0" />
                  {incident.location_name}
                </h2>
                <div className="text-[11px] text-slate-400 font-mono">
                  Coordinates: {incident.latitude.toFixed(4)}° N, {incident.longitude.toFixed(4)}° E
                </div>
              </div>
            </div>

            <button 
              onClick={onClose} 
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Tab Navigation */}
          <div className="px-5 pt-3 border-b border-slate-800 flex items-center gap-2 overflow-x-auto text-xs font-semibold">
            <button
              onClick={() => setActiveTab('ai')}
              className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                activeTab === 'ai' ? 'border-red-500 text-red-400' : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>AI Intelligence & Plan</span>
            </button>

            <button
              onClick={() => setActiveTab('evidence')}
              className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                activeTab === 'evidence' ? 'border-red-500 text-red-400' : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Radio className="w-4 h-4" />
              <span>Ground Reports ({incident.reports?.length || incident.reports_count || 1})</span>
            </button>

            {incident.conflicts && incident.conflicts.length > 0 && (
              <button
                onClick={() => setActiveTab('conflicts')}
                className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                  activeTab === 'conflicts' ? 'border-amber-500 text-amber-400 font-bold' : 'border-transparent text-amber-500/80 hover:text-amber-400'
                }`}
              >
                <AlertTriangle className="w-4 h-4 animate-pulse" />
                <span>Contradictions ({incident.conflicts.length})</span>
              </button>
            )}

            <button
              onClick={() => setActiveTab('mission')}
              className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap ml-auto ${
                activeTab === 'mission' ? 'border-purple-500 text-purple-400 font-bold' : 'border-transparent text-purple-400/80 hover:text-purple-300'
              }`}
            >
              <Truck className="w-4 h-4" />
              <span>Deploy Rescue Mission</span>
            </button>
          </div>

          {/* Modal Body Content */}
          <div className="p-5 sm:p-6 space-y-5 flex-1">
            
            {/* Top Metrics Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div className="text-[10px] text-slate-400 font-bold uppercase">SEVERITY LEVEL</div>
                <div className={`text-sm font-black mt-1 ${
                  incident.severity === 'CRITICAL' ? 'text-red-500' : 'text-amber-400'
                }`}>
                  {incident.severity}
                </div>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div className="text-[10px] text-slate-400 font-bold uppercase">PRIORITY SCORE</div>
                <div className="text-sm font-black text-red-400 mt-1 font-mono">{incident.priority_score} / 100</div>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div className="text-[10px] text-slate-400 font-bold uppercase">AFFECTED CIVILIANS</div>
                <div className="text-sm font-black text-amber-300 mt-1">~{incident.estimated_affected} people</div>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div className="text-[10px] text-slate-400 font-bold uppercase">TRIAGE STATUS</div>
                <div className="text-sm font-black text-emerald-400 mt-1">{incident.verification_status}</div>
              </div>
            </div>

            {/* TAB 1: AI Intelligence & Resource Recommendations */}
            {activeTab === 'ai' && (
              <div className="space-y-4">
                <div className="bg-gradient-to-br from-red-950/30 via-slate-950 to-slate-950 p-4 sm:p-5 rounded-xl border border-red-500/30 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-red-400 uppercase tracking-wider">
                    <Cpu className="w-4 h-4 text-red-500" />
                    Explainable AI Intelligence Assessment
                  </div>
                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans">
                    {incident.ai_reasoning || "Comprehensive multi-source analysis completed."}
                  </p>

                  {/* Priority Breakdown Weights */}
                  {incident.priority_breakdown && (
                    <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800 text-[11px] font-mono space-y-1.5">
                      <div className="text-slate-300 font-bold">Multi-Factor Weight Scoring Breakdown:</div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[10px]">
                        <div>Severity: <strong className="text-red-400">{incident.priority_breakdown.threat_severity_score}</strong></div>
                        <div>People: <strong className="text-amber-400">{incident.priority_breakdown.people_at_risk_score}</strong></div>
                        <div>Vulnerability: <strong className="text-blue-400">{incident.priority_breakdown.vulnerability_score}</strong></div>
                        <div>Access: <strong className="text-purple-400">{incident.priority_breakdown.access_difficulty_score}</strong></div>
                        <div>Confidence: <strong className="text-cyan-400">{incident.priority_breakdown.confidence_score}</strong></div>
                        <div>Time Criticality: <strong className="text-emerald-400">{incident.priority_breakdown.time_criticality_score}</strong></div>
                      </div>
                    </div>
                  )}

                  {/* Recommended Resources List */}
                  {incident.required_resources && (
                    <div className="pt-2">
                      <span className="text-xs text-slate-300 font-bold block mb-2">Recommended Rescue Equipment Allocation:</span>
                      <div className="flex flex-wrap items-center gap-2">
                        {Object.entries(incident.required_resources).map(([type, qty]) => (
                          <span key={type} className="bg-red-600/20 text-red-300 border border-red-500/40 text-xs font-bold px-2.5 py-1 rounded-lg uppercase">
                            {qty} {type.replace('_', ' ')}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Operations Controller Decision Bar */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-emerald-400" />
                    Human-in-the-Loop Operations Controller Action
                  </h4>

                  <input
                    type="text"
                    placeholder="Optional field notes or operator justification..."
                    value={verifyNotes}
                    onChange={(e) => setVerifyNotes(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
                  />

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <button
                      onClick={handleVerify}
                      disabled={loading}
                      className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-1.5 transition-colors shadow"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      VERIFY & APPROVE INCIDENT
                    </button>

                    <button
                      onClick={handleEscalate}
                      disabled={loading}
                      className="bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-1.5 transition-colors shadow"
                    >
                      <AlertTriangle className="w-4 h-4" />
                      ESCALATE TO COMMAND
                    </button>

                    <button
                      onClick={() => setConfirmRejectOpen(true)}
                      disabled={loading}
                      className="bg-slate-800 hover:bg-red-700 disabled:opacity-50 text-slate-300 hover:text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-1.5 transition-colors"
                    >
                      <XCircle className="w-4 h-4" />
                      REJECT REPORT
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: Ground Multi-Source Evidence Reports */}
            {activeTab === 'evidence' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Fused multi-source raw evidence reports clustered into this geospatial incident.</span>
                  <span className="font-mono">{incident.reports?.length || 1} Reports</span>
                </div>

                <div className="space-y-2.5">
                  {incident.reports?.map((rpt) => (
                    <div key={rpt.id} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2.5 text-xs">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-blue-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                            {rpt.report_code}
                          </span>
                          <span className="bg-slate-800 text-slate-300 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                            {rpt.source_type.replace('_', ' ')}
                          </span>
                          <span className="text-[11px] text-slate-400">By: {rpt.reporter_name}</span>
                        </div>

                        <div className="text-[11px] font-mono text-emerald-400 font-bold bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/30">
                          Source Reliability: {(rpt.source_reliability * 100).toFixed(0)}%
                        </div>
                      </div>

                      <p className="text-slate-200 leading-relaxed font-sans">{rpt.description}</p>

                      {/* Transparent Factor Breakdown */}
                      {rpt.reliability_breakdown?.factors && (
                        <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800 text-[10px] space-y-1 font-mono text-slate-400">
                          <div className="font-bold text-slate-300">Transparent AI Scoring Breakdown:</div>
                          {rpt.reliability_breakdown.factors.map((f, idx) => (
                            <div key={idx} className="flex justify-between">
                              <span>{f.factor}</span>
                              <span className={f.delta >= 0 ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                                {f.delta >= 0 ? `+${f.delta}` : f.delta}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}

                  {(!incident.reports || incident.reports.length === 0) && (
                    <div className="text-center py-8 text-xs text-slate-500 font-mono">
                      Single ground report incident record.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: Contradictions */}
            {activeTab === 'conflicts' && incident.conflicts && (
              <div className="space-y-3">
                <div className="bg-amber-950/20 border border-amber-500/40 p-3 rounded-xl text-xs text-amber-300 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>The AI Conflict Detector identified conflicting reports for this incident. Review claims below:</span>
                </div>

                {incident.conflicts.map((c) => (
                  <div key={c.id} className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs space-y-3">
                    <div className="font-bold text-amber-300">{c.description}</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="bg-slate-900 p-3 rounded-lg border-l-4 border-red-500">
                        <span className="font-bold text-red-400 block mb-1">Claim A:</span>
                        <p className="text-slate-200">{c.claim_a}</p>
                      </div>
                      <div className="bg-slate-900 p-3 rounded-lg border-l-4 border-emerald-500">
                        <span className="font-bold text-emerald-400 block mb-1">Claim B:</span>
                        <p className="text-slate-200">{c.claim_b}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* TAB 4: Deploy Rescue Mission */}
            {activeTab === 'mission' && (
              <form onSubmit={handleCreateMission} className="bg-purple-950/20 border border-purple-500/40 p-5 rounded-xl space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold text-purple-300 uppercase tracking-wider">
                  <Truck className="w-4 h-4 text-purple-400" />
                  Dispatch Emergency Rescue Mission
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Mission Operation Title</label>
                    <input
                      type="text"
                      value={missionTitle}
                      onChange={(e) => setMissionTitle(e.target.value)}
                      placeholder={`Operation Rescue - ${incident.location_name}`}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Assigned Tactical Team</label>
                    <input
                      type="text"
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                      placeholder="NDRF Team Alpha"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1 text-xs">Operational Notes & Route Directives</label>
                  <textarea
                    rows={3}
                    value={missionNotes}
                    onChange={(e) => setMissionNotes(e.target.value)}
                    placeholder="Evacuation plan, priority rooftop targets, staging area..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-black py-2.5 rounded-lg transition-colors shadow-lg flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>{loading ? 'DISPATCHING MISSION...' : 'AUTHORIZE & DISPATCH RESCUE TEAM NOW'}</span>
                </button>
              </form>
            )}

          </div>

        </div>
      </div>

      {/* Confirmation Dialog for Rejecting Incident */}
      <ConfirmModal
        isOpen={confirmRejectOpen}
        title="Reject Disaster Incident"
        message={`Are you sure you want to reject incident ${incident.code}? This will remove it from active rescue priorities.`}
        confirmLabel="Yes, Reject Incident"
        confirmVariant="danger"
        isLoading={loading}
        onConfirm={handleConfirmReject}
        onCancel={() => setConfirmRejectOpen(false)}
      />
    </>
  );
};
