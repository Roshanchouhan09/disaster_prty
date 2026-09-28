import React, { useState } from 'react';
import { 
  ShieldAlert, Activity, Map, FileText, Truck, BarChart3, 
  Smartphone, History, User, LogOut, Radio, PlayCircle, 
  Key, Sliders, Sparkles, Menu, X, ChevronDown, CheckCircle,
  AlertTriangle, Bell, AlertOctagon, Cpu
} from 'lucide-react';
import { User as UserType, UserRole } from '../../types';

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
  onOpenSOS: () => void;
  criticalCount?: number;
  unverifiedCount?: number;
  conflictsCount?: number;
  activeSosCount?: number;
}

const AVAILABLE_ROLES: { role: UserRole; name: string; title: string }[] = [
  { role: 'eoc', name: 'Commander Sharma', title: 'EOC Controller Lead' },
  { role: 'admin', name: 'Admin Operations', title: 'System Administrator' },
  { role: 'field_officer', name: 'Capt. Rahul Singh', title: 'Field Recon Officer' },
  { role: 'rescue_team', name: 'NDRF Leader Vikrant', title: 'Tactical Rescue Lead' },
  { role: 'analyst', name: 'Dr. Ananya Roy', title: 'Geospatial AI Analyst' }
];

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  setCurrentUser,
  isWsConnected,
  onOpenDemo,
  onOpenApiKey,
  onOpenBriefing,
  onOpenWeights,
  onOpenSOS,
  criticalCount = 0,
  unverifiedCount = 0,
  conflictsCount = 0,
  activeSosCount = 0
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Command Center', icon: Activity, badge: null },
    { id: 'sos', label: 'SOS Beacons', icon: AlertOctagon, badge: activeSosCount > 0 ? activeSosCount : null },
    { id: 'workflow3d', label: '3D Pipeline', icon: Cpu, badge: null },
    { id: 'map', label: 'GIS Disaster Map', icon: Map, badge: null },
    { id: 'incidents', label: 'Incident Queue', icon: ShieldAlert, badge: criticalCount > 0 ? criticalCount : null },
    { id: 'reports', label: 'Field Submission', icon: Smartphone, badge: null },
    { id: 'resources', label: 'Resources', icon: Truck, badge: null },
    { id: 'missions', label: 'Rescue Missions', icon: FileText, badge: null },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, badge: null },
    { id: 'audit', label: 'Audit Trail', icon: History, badge: null },
  ];

  const handleSelectTab = (tabId: string) => {
    setActiveTab(tabId);
    setMobileMenuOpen(false);
  };

  const handleSwitchRole = (roleItem: typeof AVAILABLE_ROLES[0]) => {
    setCurrentUser({
      id: currentUser?.id || 1,
      username: roleItem.role,
      email: `${roleItem.role}@disasterfog.ai`,
      full_name: roleItem.name,
      role: roleItem.role,
      is_active: true,
      created_at: new Date().toISOString()
    });
    setUserDropdownOpen(false);
  };

  return (
    <header className="bg-slate-950/90 backdrop-blur-xl border-b border-slate-800/80 sticky top-0 z-40 shadow-xl">
      <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
        <div className="flex items-center justify-between h-16">
          
          {/* Left: Brand / Logo */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => handleSelectTab('dashboard')}
              className="flex items-center gap-3 text-left focus:outline-none group"
            >
              <div className="bg-gradient-to-br from-red-600 to-rose-700 p-2 rounded-xl border border-red-500/50 text-white shadow-lg shadow-red-600/20 pulse-critical transition-transform group-hover:scale-105">
                <ShieldAlert className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-black text-base sm:text-lg tracking-wider bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                    DISASTERFOG
                  </span>
                  <span className="bg-gradient-to-r from-red-600 to-rose-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded tracking-widest uppercase shadow">
                    AI
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
                  <span className="hidden sm:inline">DECISION SUPPORT ENGINE</span>
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-emerald-400 font-semibold">{isWsConnected ? 'LIVE WS' : 'SYNCED'}</span>
                </div>
              </div>
            </button>
          </div>

          {/* Center: Desktop Navigation Links */}
          <nav className="hidden xl:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectTab(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all relative ${
                    isActive
                      ? 'bg-gradient-to-r from-red-950/60 to-slate-900 text-red-400 border border-red-500/40 shadow-sm shadow-red-950'
                      : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-red-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                  {item.badge !== null && item.badge > 0 && (
                    <span className="bg-red-600 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full ml-1">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Action Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            
            {/* EMERGENCY SOS TRIGGER BUTTON */}
            <button
              onClick={onOpenSOS}
              className="bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-rose-500 text-white text-xs font-black px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-lg shadow-red-600/40 border border-red-400/50 pulse-critical transition-all active:scale-95"
              title="Activate Emergency SOS Rescue System"
              aria-label="Emergency SOS Dispatch"
            >
              <AlertOctagon className="w-4 h-4 text-white animate-pulse" />
              <span className="tracking-wider">SOS</span>
              {activeSosCount > 0 && (
                <span className="bg-white text-red-700 text-[10px] font-black px-1.5 py-0.2 rounded-full ml-0.5">
                  {activeSosCount}
                </span>
              )}
            </button>

            {/* AI Briefing Button */}
            <button
              onClick={onOpenBriefing}
              className="bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-500/30 text-xs font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all shadow-sm"
              title="Generate Executive AI Briefing"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden md:inline">AI Briefing</span>
            </button>

            {/* Admin Formula Weights Button */}
            <button
              onClick={onOpenWeights}
              className="bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 text-xs font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all shadow-sm"
              title="Configure Priority Weights"
            >
              <Sliders className="w-3.5 h-3.5 text-red-400" />
              <span className="hidden md:inline">Weights</span>
            </button>

            {/* API Key Modal Button */}
            <button
              onClick={onOpenApiKey}
              className="bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 text-xs font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all shadow-sm"
              title="Configure API Keys"
            >
              <Key className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden md:inline">API Key</span>
            </button>

            {/* DEMO MODE Button */}
            <button
              onClick={onOpenDemo}
              className="bg-gradient-to-r from-amber-600 via-orange-600 to-red-600 hover:from-amber-500 hover:to-red-500 text-white text-xs font-black px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-lg shadow-orange-950 transition-all active:scale-95"
            >
              <PlayCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline tracking-wider">DEMO SCENARIO</span>
            </button>

            {/* User Role Switcher Dropdown */}
            {currentUser && (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 bg-slate-900 border border-slate-700/80 hover:border-slate-600 rounded-lg px-2.5 py-1.5 text-xs transition-colors"
                >
                  <div className="w-5 h-5 rounded-full bg-red-600/30 border border-red-500/50 flex items-center justify-center text-[10px] font-bold text-red-400">
                    {currentUser.full_name?.charAt(0) || 'U'}
                  </div>
                  <div className="text-left hidden lg:block">
                    <div className="font-semibold text-slate-200 leading-tight">{currentUser.full_name?.split(' ')[0] || 'User'}</div>
                    <div className="text-[9px] text-slate-400 uppercase font-mono">{currentUser.role || 'user'}</div>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {/* Dropdown Menu */}
                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-2 z-50 animate-in fade-in-50 slide-in-from-top-2">
                    <div className="px-3 py-2 border-b border-slate-800 text-xs">
                      <div className="font-bold text-white">{currentUser.full_name || 'Current User'}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{currentUser.email || 'user@disasterfog.ai'}</div>
                      <div className="mt-1 bg-red-950/60 border border-red-500/40 text-red-400 text-[10px] font-bold px-2 py-0.5 rounded text-center uppercase">
                        Active Role: {currentUser.role || 'user'}
                      </div>
                    </div>

                    <div className="py-1">
                      <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase font-mono">Switch Role for Demo:</div>
                      {AVAILABLE_ROLES.map((r) => (
                        <button
                          key={r.role}
                          onClick={() => handleSwitchRole(r)}
                          className={`w-full text-left px-3 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors ${
                            currentUser.role === r.role ? 'bg-red-600/20 text-red-400 font-bold' : 'text-slate-300 hover:bg-slate-800'
                          }`}
                        >
                          <div>
                            <div>{r.name}</div>
                            <div className="text-[10px] text-slate-400">{r.title}</div>
                          </div>
                          {currentUser.role === r.role && <CheckCircle className="w-3.5 h-3.5 text-red-400" />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Mobile Hamburger Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="xl:hidden p-2 rounded-lg bg-slate-900 text-slate-300 hover:text-white border border-slate-800 focus:outline-none"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

          </div>

        </div>
      </div>

      {/* Mobile Drawer Navigation Menu */}
      {mobileMenuOpen && (
        <div className="xl:hidden bg-slate-950 border-b border-slate-800 px-4 py-3 space-y-2 animate-in slide-in-from-top duration-200">
          
          {/* Prominent Mobile SOS Emergency Button */}
          <button
            onClick={() => {
              onOpenSOS();
              setMobileMenuOpen(false);
            }}
            className="w-full bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white font-black text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-red-950 pulse-critical active:scale-95 transition-all"
          >
            <AlertOctagon className="w-5 h-5 text-white animate-pulse" />
            <span className="tracking-wider">ACTIVATE SOS DISTRESS BEACON</span>
          </button>

          <div className="grid grid-cols-2 gap-1.5 pb-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectTab(item.id)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-red-600/20 text-red-400 border border-red-500/40 shadow'
                      : 'text-slate-300 hover:bg-slate-900 bg-slate-900/40 border border-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4 text-red-400" />
                  <span className="truncate">{item.label}</span>
                  {item.badge !== null && item.badge > 0 && (
                    <span className="bg-red-600 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full ml-auto">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>System Status: <strong className="text-emerald-400">OPERATIONAL</strong></span>
            <span>v1.0.0</span>
          </div>
        </div>
      )}
    </header>
  );
};
