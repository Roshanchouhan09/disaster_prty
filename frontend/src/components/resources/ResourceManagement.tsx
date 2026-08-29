import React, { useState } from 'react';
import { Truck, Plus, Anchor, Activity, CheckCircle2, AlertOctagon, MapPin } from 'lucide-react';
import { Resource } from '../../types';
import { resourcesApi } from '../../services/api';

interface ResourceManagementProps {
  resources: Resource[];
  onRefresh: () => void;
}

export const ResourceManagement: React.FC<ResourceManagementProps> = ({ resources, onRefresh }) => {
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [showAddForm, setShowAddForm] = useState(false);

  const [name, setName] = useState('');
  const [type, setType] = useState('boat');
  const [capacity, setCapacity] = useState(8);

  const filteredResources = resources.filter(r => filterStatus === 'ALL' || r.status === filterStatus);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
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
    setName('');
    setShowAddForm(false);
    onRefresh();
  };

  return (
    <div className="space-y-4">
      
      {/* Header & Controls */}
      <div className="glass-panel p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 font-bold text-white uppercase text-sm tracking-wider">
          <Truck className="w-5 h-5 text-purple-400" />
          Disaster Rescue Resource Inventory ({filteredResources.length})
        </div>

        <div className="flex items-center gap-3">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-dark-900 border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-white"
          >
            <option value="ALL">All Statuses</option>
            <option value="AVAILABLE">Available Only</option>
            <option value="DEPLOYED">Deployed Only</option>
            <option value="MAINTENANCE">Maintenance</option>
          </select>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Resource Asset
          </button>
        </div>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <form onSubmit={handleCreate} className="glass-panel p-4 rounded-xl border border-purple-500/40 space-y-3">
          <h3 className="text-xs font-bold text-purple-300 uppercase">Register New Rescue Equipment / Team</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <input
              type="text"
              placeholder="Resource Name (e.g. Inflatable Boat #3)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-dark-900 border border-gray-700 rounded-lg px-3 py-2 text-white"
              required
            />
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="bg-dark-900 border border-gray-700 rounded-lg px-3 py-2 text-white"
            >
              <option value="boat">Rescue Motor Boat</option>
              <option value="excavator">Heavy Excavator</option>
              <option value="ambulance">ALS Ambulance</option>
              <option value="medical_team">Trauma Medical Unit</option>
              <option value="food_water_unit">Food / Water Unit</option>
              <option value="shelter_kit">Relief Shelter Kits</option>
            </select>
            <input
              type="number"
              placeholder="Capacity"
              value={capacity}
              onChange={(e) => setCapacity(parseInt(e.target.value) || 1)}
              className="bg-dark-900 border border-gray-700 rounded-lg px-3 py-2 text-white"
            />
          </div>
          <button
            type="submit"
            className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold px-4 py-2 rounded-lg"
          >
            Save Asset to Inventory
          </button>
        </form>
      )}

      {/* Inventory Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredResources.map((res) => (
          <div key={res.id} className="glass-panel p-4 rounded-xl border border-gray-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-purple-400">{res.code}</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                res.status === 'AVAILABLE' ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/40' :
                res.status === 'DEPLOYED' ? 'bg-purple-600/20 text-purple-300 border border-purple-500/40' : 'bg-gray-800 text-gray-400'
              }`}>
                {res.status}
              </span>
            </div>

            <h4 className="text-sm font-bold text-white">{res.name}</h4>

            <div className="text-xs text-gray-300 space-y-1">
              <div>Type: <span className="font-semibold text-gray-100 uppercase">{res.resource_type.replace('_', ' ')}</span></div>
              <div>Capacity: <span className="font-semibold text-white">{res.capacity} units</span></div>
            </div>

            <div className="pt-2 border-t border-gray-800 text-[10px] text-gray-400 flex items-center justify-between font-mono">
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3 text-purple-400" />
                ({res.location_lat.toFixed(3)}, {res.location_lng.toFixed(3)})
              </span>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
