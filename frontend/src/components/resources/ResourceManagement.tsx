import React, { useState } from 'react';
import { 
  Truck, Plus, Anchor, Activity, CheckCircle2, AlertOctagon, 
  MapPin, Search, LifeBuoy, HeartPulse, Box, Wrench
} from 'lucide-react';
import { Resource } from '../../types';
import { resourcesApi } from '../../services/api';
import { useToast } from '../common/Toast';

interface ResourceManagementProps {
  resources: Resource[];
  onRefresh: () => void;
}

export const ResourceManagement: React.FC<ResourceManagementProps> = ({ resources, onRefresh }) => {
  const { success, error } = useToast();
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState('');
  const [type, setType] = useState('boat');
  const [capacity, setCapacity] = useState(8);

  const filteredResources = resources.filter(r => {
    const matchesStatus = filterStatus === 'ALL' || r.status === filterStatus;
    const matchesType = filterType === 'ALL' || r.resource_type === filterType;
    const matchesSearch = !searchTerm || 
                          r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          r.code.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesType && matchesSearch;
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const code = `RES-${Math.floor(100 + Math.random() * 900)}`;
      await resourcesApi.create({
        code,
        name,
        resource_type: type as any,
        status: 'AVAILABLE',
        location_lat: 26.120,
        location_lng: 85.450,
        capacity
      });
      success('Resource Registered', `${name} (${code}) added to inventory.`);
      setName('');
      setShowAddForm(false);
      onRefresh();
    } catch (err: any) {
      error('Registration Failed', err?.message || 'Could not register asset');
    } finally {
      setSubmitting(false);
    }
  };

  const getTypeIcon = (resourceType: string) => {
    switch (resourceType) {
      case 'boat':
        return <Anchor className="w-4 h-4 text-blue-400" />;
      case 'ambulance':
      case 'medical_team':
        return <HeartPulse className="w-4 h-4 text-red-400" />;
      case 'shelter_kit':
      case 'food_water_unit':
        return <Box className="w-4 h-4 text-amber-400" />;
      case 'excavator':
      default:
        return <Truck className="w-4 h-4 text-purple-400" />;
    }
  };

  return (
    <div className="space-y-4">
      
      {/* Header & Controls */}
      <div className="glass-panel p-4 rounded-xl flex flex-col lg:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 font-bold text-white uppercase text-sm tracking-wider w-full lg:w-auto">
          <Truck className="w-5 h-5 text-purple-400" />
          <span>Disaster Rescue Asset & Equipment Inventory ({filteredResources.length})</span>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          {/* Search Box */}
          <div className="relative flex-1 sm:w-56">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search asset or code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
          >
            <option value="ALL">All Statuses</option>
            <option value="AVAILABLE">Available Only</option>
            <option value="DEPLOYED">Deployed Only</option>
            <option value="MAINTENANCE">Maintenance</option>
          </select>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
          >
            <option value="ALL">All Types</option>
            <option value="boat">Boats</option>
            <option value="excavator">Excavators</option>
            <option value="ambulance">Ambulances</option>
            <option value="medical_team">Medical Teams</option>
            <option value="food_water_unit">Food/Water</option>
            <option value="shelter_kit">Shelters</option>
          </select>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors shadow"
          >
            <Plus className="w-4 h-4" />
            <span>Register Asset</span>
          </button>
        </div>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <form onSubmit={handleCreate} className="glass-panel p-5 rounded-2xl border border-purple-500/40 space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-purple-300 uppercase tracking-wider">Register New Rescue Equipment / Team</h3>
            <button type="button" onClick={() => setShowAddForm(false)} className="text-slate-400 hover:text-white text-xs">
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block text-slate-300 font-bold mb-1">Asset Description Name</label>
              <input
                type="text"
                placeholder="e.g. Inflatable Heavy Motor Boat #04"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white"
                required
              />
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">Asset Category</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white"
              >
                <option value="boat">Rescue Motor Boat</option>
                <option value="excavator">Heavy Crawling Excavator</option>
                <option value="ambulance">ALS Trauma Ambulance</option>
                <option value="medical_team">Trauma Medical Response Team</option>
                <option value="food_water_unit">Emergency Food / Water Unit</option>
                <option value="shelter_kit">Disaster Relief Shelter Kits</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">Capacity / Batch Size</label>
              <input
                type="number"
                placeholder="Capacity"
                value={capacity}
                onChange={(e) => setCapacity(parseInt(e.target.value) || 1)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-bold px-5 py-2.5 rounded-lg shadow transition-colors"
          >
            {submitting ? 'Saving...' : 'Save Asset to Active Inventory'}
          </button>
        </form>
      )}

      {/* Inventory Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredResources.map((res) => (
          <div key={res.id} className="glass-panel p-4 rounded-xl border border-slate-800 space-y-3 hover:border-purple-500/40 transition-colors">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-black text-purple-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                {res.code}
              </span>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider ${
                res.status === 'AVAILABLE' ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/40' :
                res.status === 'DEPLOYED' ? 'bg-purple-600/20 text-purple-300 border border-purple-500/40 animate-pulse' : 'bg-slate-800 text-slate-400'
              }`}>
                {res.status}
              </span>
            </div>

            <div className="flex items-start gap-2">
              <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 shrink-0">
                {getTypeIcon(res.resource_type)}
              </div>
              <div>
                <h4 className="text-sm font-bold text-white leading-tight">{res.name}</h4>
                <div className="text-[11px] text-slate-400 uppercase font-mono mt-0.5">
                  {res.resource_type.replace('_', ' ')}
                </div>
              </div>
            </div>

            <div className="text-xs text-slate-300 space-y-1 bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 font-mono">
              <div className="flex justify-between">
                <span className="text-slate-400">Capacity:</span>
                <strong className="text-white">{res.capacity} units</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Assignment:</span>
                <span className={res.assigned_mission_id ? 'text-purple-400 font-bold' : 'text-slate-500'}>
                  {res.assigned_mission_id ? `MIS-${res.assigned_mission_id}` : 'Unassigned'}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-400 flex items-center justify-between font-mono">
              <span className="flex items-center gap-1 text-slate-400">
                <MapPin className="w-3 h-3 text-purple-400" />
                ({res.location_lat.toFixed(3)}, {res.location_lng.toFixed(3)})
              </span>
              <span className="text-slate-500">Staging Base</span>
            </div>
          </div>
        ))}
      </div>

      {filteredResources.length === 0 && (
        <div className="glass-panel p-12 text-center rounded-2xl border border-slate-800 text-slate-400 space-y-2">
          <Truck className="w-8 h-8 text-slate-500 mx-auto" />
          <p className="font-bold text-sm text-white">No resources match your filter.</p>
          <p className="text-xs text-slate-500">Click Register Asset to add new emergency equipment.</p>
        </div>
      )}

    </div>
  );
};
