import React, { useState, useEffect } from 'react';
import { History, Shield, Search, User } from 'lucide-react';
import { auditApi } from '../../services/api';
import { AuditLog } from '../../types';

export const AuditLogsView: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchLogs = async () => {
    try {
      const data = await auditApi.list();
      setLogs(data);
    } catch (err) {
      console.error('Failed to load audit logs', err);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(l =>
    l.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.target_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      
      {/* Header */}
      <div className="glass-panel p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 font-bold text-white uppercase text-sm tracking-wider">
          <History className="w-5 h-5 text-emerald-400" />
          System Audit Trail & Operations Log ({filteredLogs.length})
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search action, user, target..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-dark-900 border border-gray-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-gray-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="glass-panel rounded-xl overflow-hidden border border-gray-800">
        <table className="w-full text-left text-xs">
          <thead className="bg-gray-900/80 text-gray-400 font-mono border-b border-gray-800 uppercase text-[10px]">
            <tr>
              <th className="p-3">Timestamp</th>
              <th className="p-3">Operator / Actor</th>
              <th className="p-3">Action</th>
              <th className="p-3">Target</th>
              <th className="p-3">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {filteredLogs.map((log) => (
              <tr key={log.id} className="hover:bg-gray-900/50 transition-colors">
                <td className="p-3 font-mono text-gray-400">{new Date(log.timestamp).toLocaleString()}</td>
                <td className="p-3 font-semibold text-white flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-emerald-400" />
                  {log.user_name}
                </td>
                <td className="p-3">
                  <span className="bg-gray-800 text-amber-300 font-mono text-[10px] font-bold px-2 py-0.5 rounded border border-gray-700">
                    {log.action}
                  </span>
                </td>
                <td className="p-3 font-mono text-gray-300">
                  {log.target_type}: <span className="text-white font-bold">{log.target_id}</span>
                </td>
                <td className="p-3 text-gray-400 font-mono text-[11px]">
                  {log.details ? JSON.stringify(log.details) : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
};
