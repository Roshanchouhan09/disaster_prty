import React, { useState, useEffect } from 'react';
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

import { incidentsApi, analyticsApi, resourcesApi, missionsApi } from './services/api';
import { Incident, AnalyticsSummary, Resource, RescueMission, User, IncidentConflict } from './types';

const DEFAULT_USER: User = {
  id: 2,
  username: 'eoc_operator',
  email: 'eoc@disasterfog.ai',
  full_name: 'EOC Controller Lead',
  role: 'eoc',
  is_active: true,
  created_at: new Date().toISOString()
};

export function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentUser, setCurrentUser] = useState<User | null>(DEFAULT_USER);
  const [showDemoBar, setShowDemoBar] = useState(true);
  const [isWsConnected, setIsWsConnected] = useState(false);

  // Modals state
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [showBriefingModal, setShowBriefingModal] = useState(false);
  const [showWeightsModal, setShowWeightsModal] = useState(false);
  const [selectedConflict, setSelectedConflict] = useState<IncidentConflict | null>(null);

  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [missions, setMissions] = useState<RescueMission[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);

  const loadData = async () => {
    try {
      const [incData, anaData, resData, misData] = await Promise.all([
        incidentsApi.list(),
        analyticsApi.getSummary(),
        resourcesApi.list(),
        missionsApi.list()
      ]);
      setIncidents(incData);
      setAnalytics(anaData);
      setResources(resData);
      setMissions(misData);
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
        const msg = JSON.parse(evt.data);
        if (['NEW_REPORT', 'INCIDENT_VERIFIED', 'MISSION_CREATED', 'SIMULATION_TICK'].includes(msg.type)) {
          loadData();
        }
      };
    } catch (err) {
      console.log('WS connection error, fallback to polling');
    }

    const interval = setInterval(loadData, 5000);
    return () => {
      clearInterval(interval);
      if (ws) ws.close();
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-dark-900 text-gray-100 font-sans">
      
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
      />

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && (
          <CommandCenter
            analytics={analytics}
            incidents={incidents}
            onSelectIncident={(inc) => setSelectedIncident(inc)}
            onNavigate={(tab) => setActiveTab(tab)}
          />
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
      <footer className="border-t border-gray-800 bg-dark-800/60 py-4 text-center text-xs text-gray-500 font-mono">
        DISASTERFOG AI PLATFORM v1.0.0 &copy; 2026 Emergency Operations Command | Production-Grade Decision Support System
      </footer>

    </div>
  );
}

export default App;
