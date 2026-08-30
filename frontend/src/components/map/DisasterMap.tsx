import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { 
  ShieldAlert, Layers, MapPin, Eye, CheckCircle2, AlertTriangle, 
  Building, Cross as HospitalIcon, Navigation, Globe, Map as MapIcon,
  RotateCcw, ZoomIn, Info
} from 'lucide-react';
import { Incident } from '../../types';

interface DisasterMapProps {
  incidents: Incident[];
  onSelectIncident: (inc: Incident) => void;
}

const createCustomIcon = (color: string, label: string = '') => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="34" height="34">
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000000" flood-opacity="0.8"/>
    </filter>
    <path filter="url(#shadow)" fill="${color}" stroke="#ffffff" stroke-width="1.5" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
    <circle cx="12" cy="9" r="3.2" fill="#ffffff"/>
  </svg>`;
  return L.icon({
    iconUrl: `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`,
    iconSize: [34, 34],
    iconAnchor: [17, 34],
    popupAnchor: [0, -34]
  });
};

const icons = {
  CRITICAL: createCustomIcon('#EF4444'),
  HIGH: createCustomIcon('#F97316'),
  MEDIUM: createCustomIcon('#EAB308'),
  LOW: createCustomIcon('#22C55E'),
  UNKNOWN: createCustomIcon('#64748B'),
  HOSPITAL: createCustomIcon('#3B82F6'),
  SHELTER: createCustomIcon('#A855F7')
};

const DEMO_HOSPITALS = [
  { id: 1, name: 'District Central Hospital', lat: 26.135, lng: 85.430, icu_beds: 18, total_beds: 250 },
  { id: 2, name: 'Apex Trauma & Surgical Center', lat: 26.095, lng: 85.460, icu_beds: 4, total_beds: 120 }
];

const DEMO_SHELTERS = [
  { id: 1, name: 'State Emergency Relief Camp #1', lat: 26.150, lng: 85.475, cap: 800, occ: 340 },
  { id: 2, name: 'Sector 4 Sports Complex Shelter', lat: 26.110, lng: 85.415, cap: 1200, occ: 720 }
];

type BaseMapType = 'google_hybrid' | 'google_satellite' | 'google_terrain' | 'google_roadmap' | 'esri_satellite' | 'carto_dark' | 'osm_street';

// Helper component that lives strictly inside MapContainer
function MapControls({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  const handleRecenter = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    map.flyTo([lat, lng], 13, { duration: 1.2 });
  };

  return (
    <div className="leaflet-top leaflet-right" style={{ pointerEvents: 'auto', margin: '12px' }}>
      <button
        onClick={handleRecenter}
        className="bg-slate-950/90 hover:bg-slate-900 text-slate-200 border border-slate-700/80 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xl transition-all hover:scale-105 cursor-pointer"
        title="Reset view to Disaster Epicenter"
      >
        <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
        <span>Center Epicenter</span>
      </button>
    </div>
  );
}

export const DisasterMap: React.FC<DisasterMapProps> = ({ incidents, onSelectIncident }) => {
  const [baseMap, setBaseMap] = useState<BaseMapType>('google_hybrid');
  const [showIncidents, setShowIncidents] = useState(true);
  const [showRiskZones, setShowRiskZones] = useState(true);
  const [showHospitals, setShowHospitals] = useState(true);
  const [showShelters, setShowShelters] = useState(true);
  const [severityFilter, setSeverityFilter] = useState('ALL');

  const centerLat = 26.120;
  const centerLng = 85.450;

  const displayedIncidents = (incidents || []).filter(i => 
    i && (severityFilter === 'ALL' || i.severity === severityFilter)
  );

  const getTileUrl = () => {
    switch (baseMap) {
      case 'google_hybrid':
        return 'https://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}';
      case 'google_satellite':
        return 'https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}';
      case 'google_terrain':
        return 'https://{s}.google.com/vt/lyrs=p&x={x}&y={y}&z={z}';
      case 'google_roadmap':
        return 'https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}';
      case 'esri_satellite':
        return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      case 'osm_street':
        return 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
      case 'carto_dark':
      default:
        return 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
    }
  };

  const getSubdomains = () => {
    if (baseMap.startsWith('google')) {
      return ['mt0', 'mt1', 'mt2', 'mt3'];
    }
    if (baseMap === 'esri_satellite') {
      return [];
    }
    return ['a', 'b', 'c', 'd'];
  };

  const getTileAttribution = () => {
    if (baseMap.startsWith('google')) {
      return '&copy; <a href="https://maps.google.com" target="_blank" rel="noreferrer">Google Maps Platform</a> Imagery';
    }
    if (baseMap === 'esri_satellite') {
      return '&copy; <a href="https://www.esri.com" target="_blank" rel="noreferrer">Esri</a> World Imagery';
    }
    if (baseMap === 'osm_street') {
      return '&copy; <a href="https://openstreetmap.org" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors';
    }
    return '&copy; <a href="https://carto.com/" target="_blank" rel="noreferrer">CARTO</a>';
  };

  return (
    <div className="space-y-4">
      
      {/* Top Layer & Filter Bar */}
      <div className="glass-panel p-3.5 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs border border-slate-800">
        <div className="flex items-center gap-2 font-bold text-white uppercase tracking-wider">
          <Layers className="w-4 h-4 text-red-500" />
          <span>GIS Spatial Triage & Satellite Layers</span>
          <span className="bg-emerald-600/20 text-emerald-400 border border-emerald-500/40 text-[9px] font-black px-1.5 py-0.5 rounded uppercase font-mono">
            High-Res Live
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Base Map Selector */}
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1">
            <Globe className="w-3.5 h-3.5 text-blue-400" />
            <select
              value={baseMap}
              onChange={(e) => setBaseMap(e.target.value as BaseMapType)}
              className="bg-transparent text-xs text-white focus:outline-none font-bold cursor-pointer"
            >
              <option value="google_hybrid" className="bg-slate-900 text-white">🛰️ Google Satellite Hybrid (Recommended)</option>
              <option value="google_satellite" className="bg-slate-900 text-white">📷 Google Pure Satellite</option>
              <option value="google_terrain" className="bg-slate-900 text-white">🏔️ Google Terrain (Topography)</option>
              <option value="google_roadmap" className="bg-slate-900 text-white">🛣️ Google Street Roadmap</option>
              <option value="esri_satellite" className="bg-slate-900 text-white">🌍 Esri High-Res Satellite</option>
              <option value="osm_street" className="bg-slate-900 text-white">🗺️ OpenStreetMap Standard</option>
              <option value="carto_dark" className="bg-slate-900 text-white">⬛ Carto Dark Tactical</option>
            </select>
          </div>

          {/* Severity Quick Filter */}
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1 text-xs text-white font-medium"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical Pins Only</option>
            <option value="HIGH">High Pins Only</option>
            <option value="MEDIUM">Medium Pins Only</option>
          </select>

          <label className="flex items-center gap-1.5 cursor-pointer bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
            <input 
              type="checkbox" 
              checked={showIncidents} 
              onChange={(e) => setShowIncidents(e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-red-600 focus:ring-0"
            />
            <span className="text-slate-200">Incident Pins ({displayedIncidents.length})</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
            <input 
              type="checkbox" 
              checked={showRiskZones} 
              onChange={(e) => setShowRiskZones(e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-red-600 focus:ring-0"
            />
            <span className="text-red-400 font-semibold">High Mortality Zones</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
            <input 
              type="checkbox" 
              checked={showHospitals} 
              onChange={(e) => setShowHospitals(e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-0"
            />
            <span className="text-blue-300">Hospitals</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
            <input 
              type="checkbox" 
              checked={showShelters} 
              onChange={(e) => setShowShelters(e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-purple-600 focus:ring-0"
            />
            <span className="text-purple-300">Shelters</span>
          </label>
        </div>
      </div>

      {/* Map Container Canvas */}
      <div className="glass-panel p-2 rounded-2xl h-[640px] relative overflow-hidden border border-slate-800 shadow-2xl">
        <MapContainer 
          key={baseMap}
          center={[centerLat, centerLng]} 
          zoom={13} 
          scrollWheelZoom={true}
          style={{ width: '100%', height: '100%', borderRadius: '1rem' }}
        >
          <TileLayer
            attribution={getTileAttribution()}
            url={getTileUrl()}
            subdomains={getSubdomains()}
            maxZoom={20}
          />

          {/* Map Recenter & Zoom Controller (Inside MapContainer context) */}
          <MapControls lat={centerLat} lng={centerLng} />

          {/* High Mortality Risk Zone Circles */}
          {showRiskZones && incidents.filter(i => i.is_high_mortality_zone).map((inc) => (
            <Circle
              key={`risk-${inc.id}`}
              center={[inc.latitude, inc.longitude]}
              radius={1200}
              pathOptions={{
                color: '#EF4444',
                fillColor: '#EF4444',
                fillOpacity: 0.28,
                weight: 2.5,
                dashArray: '6, 6'
              }}
            />
          ))}

          {/* Incident Markers */}
          {showIncidents && displayedIncidents.map((inc) => (
            <Marker 
              key={inc.id} 
              position={[inc.latitude, inc.longitude]}
              icon={icons[inc.severity] || icons.UNKNOWN}
            >
              <Popup>
                <div className="space-y-2.5 p-1 min-w-[260px] text-slate-100 font-sans">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                    <span className="font-mono font-black text-xs text-red-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                      {inc.code}
                    </span>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase ${
                      inc.severity === 'CRITICAL' ? 'bg-red-600 text-white' : 'bg-amber-600 text-white'
                    }`}>
                      {inc.severity}
                    </span>
                  </div>

                  <div className="font-bold text-xs text-white leading-tight">{inc.location_name}</div>
                  
                  <div className="text-[11px] text-slate-300 space-y-1 font-mono">
                    <div>Category: <span className="font-bold text-amber-300">{inc.category.replace('_', ' ').toUpperCase()}</span></div>
                    <div>Affected: <span className="font-bold text-white">~{inc.estimated_affected} people</span></div>
                    <div>Priority Score: <span className="font-black text-red-400">{inc.priority_score}/100</span></div>
                  </div>

                  <button
                    onClick={() => onSelectIncident(inc)}
                    className="w-full mt-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold py-2 rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow-lg"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Inspect & Dispatch Rescue
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Hospital Markers */}
          {showHospitals && DEMO_HOSPITALS.map((h) => (
            <Marker key={`hosp-${h.id}`} position={[h.lat, h.lng]} icon={icons.HOSPITAL}>
              <Popup>
                <div className="text-xs space-y-1.5 p-1 min-w-[200px] font-sans">
                  <div className="font-bold text-blue-400 flex items-center gap-1">
                    <HospitalIcon className="w-3.5 h-3.5" />
                    {h.name}
                  </div>
                  <div className="text-[11px] text-slate-300 font-mono">
                    <div>ICU Beds Available: <strong className="text-emerald-400">{h.icu_beds}</strong></div>
                    <div>Total Capacity: {h.total_beds} beds</div>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Shelter Markers */}
          {showShelters && DEMO_SHELTERS.map((s) => (
            <Marker key={`shelt-${s.id}`} position={[s.lat, s.lng]} icon={icons.SHELTER}>
              <Popup>
                <div className="text-xs space-y-1.5 p-1 min-w-[200px] font-sans">
                  <div className="font-bold text-purple-400 flex items-center gap-1">
                    <Building className="w-3.5 h-3.5" />
                    {s.name}
                  </div>
                  <div className="text-[11px] text-slate-300 font-mono">
                    <div>Occupancy: {s.occ} / {s.cap}</div>
                    <div className="text-emerald-400 font-bold">Relief Space Available</div>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

        </MapContainer>

        {/* Map Legend Pill */}
        <div className="absolute bottom-4 left-4 z-[1000] bg-slate-950/90 backdrop-blur-md p-3 rounded-xl border border-slate-800 text-[11px] space-y-1.5 font-mono shadow-2xl">
          <div className="font-bold text-slate-300 text-[10px] uppercase">Map Triage Legend:</div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow"></span> Critical</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow"></span> High</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-yellow-500 shadow"></span> Med</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow"></span> Hospital</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-purple-500 shadow"></span> Shelter</span>
          </div>
        </div>

      </div>

    </div>
  );
};
