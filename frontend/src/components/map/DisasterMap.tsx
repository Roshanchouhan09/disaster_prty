import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polygon } from 'react-leaflet';
import L from 'leaflet';
import { ShieldAlert, Layers, MapPin, Eye, CheckCircle2, AlertTriangle, Building, Cross as HospitalIcon } from 'lucide-react';
import { Incident } from '../../types';

interface DisasterMapProps {
  incidents: Incident[];
  onSelectIncident: (inc: Incident) => void;
}

const createCustomIcon = (color: string) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" width="32" height="32"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>`;
  return L.icon({
    iconUrl: `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  });
};

const icons = {
  CRITICAL: createCustomIcon('#EF4444'),
  HIGH: createCustomIcon('#F97316'),
  MEDIUM: createCustomIcon('#EAB308'),
  LOW: createCustomIcon('#22C55E'),
  UNKNOWN: createCustomIcon('#6B7280'),
  HOSPITAL: createCustomIcon('#3B82F6'),
  SHELTER: createCustomIcon('#A855F7')
};

const DEMO_HOSPITALS = [
  { id: 1, name: 'District Central Hospital', lat: 26.135, lng: 85.430, icu_beds: 18 },
  { id: 2, name: 'Apex Trauma Center', lat: 26.095, lng: 85.460, icu_beds: 4 }
];

const DEMO_SHELTERS = [
  { id: 1, name: 'Government Relief Camp #1', lat: 26.150, lng: 85.475, cap: 800 },
  { id: 2, name: 'Sports Complex Shelter', lat: 26.110, lng: 85.415, cap: 1200 }
];

export const DisasterMap: React.FC<DisasterMapProps> = ({ incidents, onSelectIncident }) => {
  const [showIncidents, setShowIncidents] = useState(true);
  const [showRiskZones, setShowRiskZones] = useState(true);
  const [showHospitals, setShowHospitals] = useState(true);
  const [showShelters, setShowShelters] = useState(true);

  const centerLat = 26.120;
  const centerLng = 85.450;

  return (
    <div className="space-y-4">
      
      {/* Top Map Layer Control Bar */}
      <div className="glass-panel p-3 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 font-bold text-white uppercase tracking-wider">
          <Layers className="w-4 h-4 text-red-500" />
          GIS Layer Controls
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input 
              type="checkbox" 
              checked={showIncidents} 
              onChange={(e) => setShowIncidents(e.target.checked)}
              className="rounded bg-gray-800 border-gray-700 text-red-600 focus:ring-0"
            />
            <span className="text-gray-200">Incident Pins</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer">
            <input 
              type="checkbox" 
              checked={showRiskZones} 
              onChange={(e) => setShowRiskZones(e.target.checked)}
              className="rounded bg-gray-800 border-gray-700 text-red-600 focus:ring-0"
            />
            <span className="text-red-400 font-semibold">High Mortality Risk Zones</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer">
            <input 
              type="checkbox" 
              checked={showHospitals} 
              onChange={(e) => setShowHospitals(e.target.checked)}
              className="rounded bg-gray-800 border-gray-700 text-blue-600 focus:ring-0"
            />
            <span className="text-blue-300">Hospitals</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer">
            <input 
              type="checkbox" 
              checked={showShelters} 
              onChange={(e) => setShowShelters(e.target.checked)}
              className="rounded bg-gray-800 border-gray-700 text-purple-600 focus:ring-0"
            />
            <span className="text-purple-300">Relief Shelters</span>
          </label>
        </div>
      </div>

      {/* Map Canvas Box */}
      <div className="glass-panel p-2 rounded-xl h-[650px] relative overflow-hidden border border-gray-800 shadow-2xl">
        <MapContainer 
          center={[centerLat, centerLng]} 
          zoom={13} 
          scrollWheelZoom={true}
          style={{ width: '100%', height: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />

          {showRiskZones && incidents.filter(i => i.is_high_mortality_zone).map((inc) => (
            <Circle
              key={`risk-${inc.id}`}
              center={[inc.latitude, inc.longitude]}
              radius={1200}
              pathOptions={{
                color: '#EF4444',
                fillColor: '#EF4444',
                fillOpacity: 0.25,
                weight: 2,
                dashArray: '6, 6'
              }}
            />
          ))}

          {showIncidents && incidents.map((inc) => (
            <Marker 
              key={inc.id} 
              position={[inc.latitude, inc.longitude]}
              icon={icons[inc.severity] || icons.UNKNOWN}
            >
              <Popup>
                <div className="space-y-2 p-1 min-w-[240px]">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-xs text-red-400">{inc.code}</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                      inc.severity === 'CRITICAL' ? 'bg-red-600 text-white' : 'bg-amber-600 text-white'
                    }`}>
                      {inc.severity}
                    </span>
                  </div>

                  <div className="font-bold text-xs text-gray-100">{inc.location_name}</div>
                  
                  <div className="text-[11px] text-gray-300">
                    <div>Category: <span className="font-semibold text-amber-300">{inc.category.replace('_', ' ').toUpperCase()}</span></div>
                    <div>Affected: <span className="font-semibold text-white">~{inc.estimated_affected} people</span></div>
                    <div>Priority Score: <span className="font-mono font-bold text-red-400">{inc.priority_score}/100</span></div>
                  </div>

                  <button
                    onClick={() => onSelectIncident(inc)}
                    className="w-full mt-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold py-1.5 rounded flex items-center justify-center gap-1 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Inspect & Allocate Rescue
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}

          {showHospitals && DEMO_HOSPITALS.map((h) => (
            <Marker key={`hosp-${h.id}`} position={[h.lat, h.lng]} icon={icons.HOSPITAL}>
              <Popup>
                <div className="text-xs space-y-1">
                  <div className="font-bold text-blue-400 flex items-center gap-1">
                    <HospitalIcon className="w-3.5 h-3.5" />
                    {h.name}
                  </div>
                  <div>ICU Beds Available: <span className="font-bold text-emerald-400">{h.icu_beds}</span></div>
                </div>
              </Popup>
            </Marker>
          ))}

          {showShelters && DEMO_SHELTERS.map((s) => (
            <Marker key={`shelt-${s.id}`} position={[s.lat, s.lng]} icon={icons.SHELTER}>
              <Popup>
                <div className="text-xs space-y-1">
                  <div className="font-bold text-purple-400 flex items-center gap-1">
                    <Building className="w-3.5 h-3.5" />
                    {s.name}
                  </div>
                  <div>Capacity: <span className="font-bold text-white">{s.cap} persons</span></div>
                </div>
              </Popup>
            </Marker>
          ))}

        </MapContainer>
      </div>

    </div>
  );
};
