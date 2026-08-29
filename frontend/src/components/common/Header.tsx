import React from 'react';
import { 
  ShieldAlert, Activity, Map, FileText, Truck, BarChart3, 
  Smartphone, History, User, LogOut, Radio, PlayCircle, 
  Key, Sliders, Sparkles 
} from 'lucide-react';
import { User as UserType } from '../../types';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: UserType | null;
  setCurrentUser: (user: UserType | null) => void;
  isWsConnected: boolean;
  onOpenDemo: () => void;
  onOpenApiKey: () => void;
  onOpenBriefing: () => void;
  onOpenWeights: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  setCurrentUser,
  isWsConnected,
  onOpenDemo,
  onOpenApiKey,
  onOpenBriefing,
  onOpenWeights
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Command Center', icon: Activity },
    { id: 'map', label: 'GIS Disaster Map', icon: Map },
    { id: 'incidents', label: 'Incident Queue', icon: ShieldAlert },
    { id: 'reports', label: 'Field Submission', icon: Smartphone },
    { id: 'resources', label: 'Resource Management', icon: Truck },
    { id: 'missions', label: 'Rescue Missions', icon: FileText },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'audit', label: 'Audit Logs', icon: History },
  ];

  return (
    <header className="bg-dark-800/90 backdrop-blur-md border-b border-gray-800 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="bg-red-600/20 p-2 rounded-lg border border-red-500/40 text-red-500 pulse-critical">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-wider text-white">DISASTERFOG</span>
                <span className="bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded tracking-widest uppercase">AI</span>
              </div>
              <p className="text-[11px] text-gray-400 font-mono">EMERGENCY OPERATIONS INTELLIGENCE</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-red-600/20 text-red-400 border border-red-500/40 shadow-sm'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2">
            
            {/* AI Briefing Button */}
            <button
              onClick={onOpenBriefing}
              className="bg-gray-800 hover:bg-gray-700 text-amber-300 border border-amber-500/30 text-xs font-bold px-2.5 py-1.5 rounded-md flex items-center gap-1 transition-all"
              title="Generate Executive AI Briefing"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">AI Briefing</span>
            </button>

            {/* Admin Formula Weights Button */}
            <button
              onClick={onOpenWeights}
              className="bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 text-xs font-bold px-2.5 py-1.5 rounded-md flex items-center gap-1 transition-all"
              title="Configure Priority Weights"
            >
              <Sliders className="w-3.5 h-3.5 text-red-400" />
              <span className="hidden sm:inline">Weights</span>
            </button>

            {/* API Key Modal Button */}
            <button
              onClick={onOpenApiKey}
              className="bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 text-xs font-bold px-2.5 py-1.5 rounded-md flex items-center gap-1 transition-all"
              title="Configure API Keys"
            >
              <Key className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">API Key</span>
            </button>

            {/* DEMO MODE Button */}
            <button
              onClick={onOpenDemo}
              className="bg-gradient-to-r from-amber-600 to-red-600 hover:from-amber-500 hover:to-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-md flex items-center gap-1.5 shadow-lg transition-all"
            >
              <PlayCircle className="w-4 h-4" />
              <span className="hidden sm:inline">DEMO MODE</span>
            </button>

            {/* User Profile Pill */}
            {currentUser && (
              <div className="hidden sm:flex items-center gap-2 bg-gray-900 border border-gray-700 rounded-lg px-2.5 py-1 text-xs">
                <User className="w-3.5 h-3.5 text-red-400" />
                <div className="text-left">
                  <div className="font-semibold text-gray-200">{currentUser.full_name.split(' ')[0]}</div>
                  <div className="text-[9px] text-gray-400 uppercase font-mono">{currentUser.role}</div>
                </div>
              </div>
            )}

          </div>

        </div>
      </div>
    </header>
  );
};
