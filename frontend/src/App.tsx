import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/common/Header';
import { ApiKeyModal } from './components/common/ApiKeyModal';
import { SimulationControls } from './components/simulation/SimulationControls';
import { CommandCenter } from './components/dashboard/CommandCenter';
import { DisasterMap } from './components/map/DisasterMap';
import { IncidentQueue } from './components/incidents/IncidentQueue';
import { IncidentDetailModal } from './components/incidents/IncidentDetailModal';
import { ConflictResolverModal } from './components/incidents/ConflictResolverModal';
import { ExecutiveBriefingModal } from './components/dashboard/ExecutiveBriefingModal';
import { PriorityWeightsModal } from './components/admin/PriorityWeightsModal';
import { FieldReportApp } from './components/offline/FieldReportApp';
import { ResourceManagement } from './components/resources/ResourceManagement';
import { RescueMissions } from './components/missions/RescueMissions';
import { AnalyticsView } from './components/analytics/AnalyticsView';
import { AuditLogsView } from './components/common/AuditLogsView';
import { ToastProvider, useToast } from './components/common/Toast';
import { SOSModal } from './components/sos/SOSModal';
import { SOSManagementView } from './components/sos/SOSManagementView';
import { SystemWorkflow3D } from './components/visualization/SystemWorkflow3D';

import { incidentsApi, analyticsApi, resourcesApi, missionsApi, sosApi } from './services/api';
import { Incident, AnalyticsSummary, Resource, RescueMission, User, IncidentConflict, SOSAlert, SystemWorkflowState } from './types';

const DEFAULT_USER: User = {
  id: 2,
  username: 'eoc_operator',
  email: 'eoc@disasterfog.ai',
  full_name: 'Commander Sharma',
  role: 'eoc',
  is_active: true,
  created_at: new Date().toISOString()
};

function MainApp() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentUser, setCurrentUser] = useState<User | null>(DEFAULT_USER);
  const [showDemoBar, setShowDemoBar] = useState(true);
  const [isWsConnected, setIsWsConnected] = useState(false);

  // Modals state
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [showBriefingModal, setShowBriefingModal] = useState(false);
  const [showWeightsModal, setShowWeightsModal] = useState(false);
  const [showSOSModal, setShowSOSModal] = useState(false);
  const [selectedConflict, setSelectedConflict] = useState<IncidentConflict | null>(null);

  // Workflow State for 3D System Architecture
  const [workflowState, setWorkflowState] = useState<SystemWorkflowState>('idle');

  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [missions, setMissions] = useState<RescueMission[]>([]);
  const [sosAlerts, setSosAlerts] = useState<SOSAlert[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);

  const loadData = async () => {
    try {
      const [incData, anaData, resData, misData, sosData] = await Promise.all([
        incidentsApi.list(),
        analyticsApi.getSummary(),
        resourcesApi.list(),
        missionsApi.list(),
        sosApi.list()
      ]);
      setIncidents(incData);
      setAnalytics(anaData);
      setResources(resData);
      setMissions(misData);
      setSosAlerts(sosData);
    } catch (err) {
      console.error('Data loading error:', err);
    }
  };

  useEffect(() => {
    loadData();

    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${wsProtocol}//${window.location.host}/ws/events`;
    
    let ws: WebSocket | null = null;
    try {
      ws = new WebSocket(wsUrl);
      ws.onopen = () => setIsWsConnected(true);
      ws.onclose = () => setIsWsConnected(false);
      ws.onmessage = (evt) => {
        try {
          const msg = JSON.parse(evt.data);
          if ([
            'NEW_REPORT', 'INCIDENT_VERIFIED', 'MISSION_CREATED', 
            'SIMULATION_TICK', 'NEW_SOS_ALERT', 'SOS_STATUS_UPDATED'
          ].includes(msg.type)) {
            loadData();
          }
        } catch (e) {
          // ignore parsing error
        }
      };
    } catch (err) {
      console.log('WS connection fallback to polling');
    }

    const interval = setInterval(loadData, 5000);
    return () => {
      clearInterval(interval);
      if (ws) ws.close();
    };
  }, []);

  const criticalCount = useMemo(() => {
    return incidents.filter(i => i.severity === 'CRITICAL' || i.is_high_mortality_zone).length;
  }, [incidents]);

  const unverifiedCount = useMemo(() => {
    return incidents.filter(i => i.verification_status === 'UNVERIFIED').length;
  }, [incidents]);

  const conflictsCount = useMemo(() => {
    return incidents.reduce((acc, curr) => acc + (curr.conflicts_count || 0), 0);
  }, [incidents]);

  const activeSosCount = useMemo(() => {
    return sosAlerts.filter(a => ['PENDING', 'LOCATION_VERIFIED', 'DISPATCHED', 'ACTIVE'].includes(a.status)).length;
  }, [sosAlerts]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans antialiased selection:bg-red-500 selection:text-white">
      
      {/* Simulation Demo Controls Bar */}
      {showDemoBar && (
        <SimulationControls onSimulationUpdate={loadData} />
      )}

      {/* Main App Navigation Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        setCurrentUser={setCurrentUser}
        isWsConnected={isWsConnected}
        onOpenDemo={() => setShowDemoBar(!showDemoBar)}
        onOpenApiKey={() => setShowApiKeyModal(true)}
        onOpenBriefing={() => setShowBriefingModal(true)}
        onOpenWeights={() => setShowWeightsModal(true)}
        onOpenSOS={() => setShowSOSModal(true)}
        criticalCount={criticalCount}
        unverifiedCount={unverifiedCount}
        conflictsCount={conflictsCount}
        activeSosCount={activeSosCount}
      />

      {/* Main Body Layout */}
      <main className="flex-1 w-full max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-5 sm:py-6">
        {activeTab === 'dashboard' && (
          <CommandCenter
            analytics={analytics}
            incidents={incidents}
            onSelectIncident={(inc) => setSelectedIncident(inc)}
            onNavigate={(tab) => setActiveTab(tab)}
            onOpenSOS={() => setShowSOSModal(true)}
            activeSosCount={activeSosCount}
            workflowState={workflowState}
            onWorkflowStateChange={setWorkflowState}
          />
        )}

        {activeTab === 'sos' && (
          <SOSManagementView onRefreshParent={loadData} />
        )}

        {activeTab === 'workflow3d' && (
          <div className="space-y-4">
            <SystemWorkflow3D
              workflowState={workflowState}
              onStateSelect={setWorkflowState}
              className="min-h-[580px]"
            />
          </div>
        )}

        {activeTab === 'map' && (
          <DisasterMap
            incidents={incidents}
            onSelectIncident={(inc) => setSelectedIncident(inc)}
          />
        )}

        {activeTab === 'incidents' && (
          <IncidentQueue
            incidents={incidents}
            onSelectIncident={(inc) => setSelectedIncident(inc)}
          />
        )}

        {activeTab === 'reports' && (
          <FieldReportApp />
        )}

        {activeTab === 'resources' && (
          <ResourceManagement
            resources={resources}
            onRefresh={loadData}
          />
        )}

        {activeTab === 'missions' && (
          <RescueMissions
            missions={missions}
            onRefresh={loadData}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsView analytics={analytics} />
        )}

        {activeTab === 'audit' && (
          <AuditLogsView />
        )}
      </main>

      {/* SOS Emergency Workflow Modal */}
      <SOSModal
        isOpen={showSOSModal}
        onClose={() => setShowSOSModal(false)}
        onSOSCreated={() => { loadData(); }}
        onWorkflowStateChange={setWorkflowState}
      />

      {/* Incident Detailed Inspection Modal */}
      {selectedIncident && (
        <IncidentDetailModal
          incident={selectedIncident}
          onClose={() => setSelectedIncident(null)}
          onRefresh={loadData}
        />
      )}

      {/* Contradiction Resolver Modal */}
      {selectedConflict && (
        <ConflictResolverModal
          conflict={selectedConflict}
          onClose={() => setSelectedConflict(null)}
          onRefresh={loadData}
        />
      )}

      {/* Live API Key Modal */}
      <ApiKeyModal
        isOpen={showApiKeyModal}
        onClose={() => setShowApiKeyModal(false)}
      />

      {/* Executive Briefing Modal */}
      <ExecutiveBriefingModal
        isOpen={showBriefingModal}
        onClose={() => setShowBriefingModal(false)}
      />

      {/* Admin Priority Weights Configurator Modal */}
      <PriorityWeightsModal
        isOpen={showWeightsModal}
        onClose={() => setShowWeightsModal(false)}
        onRefresh={loadData}
      />

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/80 py-5 text-center text-xs text-slate-400 font-mono">
        <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>DISASTERFOG AI &copy; 2026 Emergency Operations Command</span>
          <span className="text-slate-400">Production-Ready AI Decision Intelligence Platform</span>
        </div>
      </footer>

    </div>
  );
}

export function App() {
  return (
    <ToastProvider>
      <MainApp />
    </ToastProvider>
  );
}

export default App;
