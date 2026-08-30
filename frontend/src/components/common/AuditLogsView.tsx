import React, { useState, useEffect } from 'react';
import { History, Shield, Search, User, Download, FileSpreadsheet, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { auditApi, exportDataAsCsv } from '../../services/api';
import { AuditLog } from '../../types';

export const AuditLogsView: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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

  const filteredLogs = logs.filter(l => {
    const q = searchTerm.toLowerCase();
    return !searchTerm ||
      l.user_name.toLowerCase().includes(q) ||
      l.action.toLowerCase().includes(q) ||
      l.target_type.toLowerCase().includes(q) ||
      (l.target_id && l.target_id.toLowerCase().includes(q));
  });

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage) || 1;
  const paginatedLogs = filteredLogs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleExport = () => {
    const rows = filteredLogs.map(l => ({
      timestamp: l.timestamp,
      operator: l.user_name,
      action: l.action,
      target_type: l.target_type,
      target_id: l.target_id,
      details: l.details ? JSON.stringify(l.details) : ''
    }));
    exportDataAsCsv('disasterfog_audit_trail', rows);
  };

  return (
    <div className="space-y-4">
      
      {/* Header */}
      <div className="glass-panel p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 font-bold text-white uppercase text-sm tracking-wider">
          <History className="w-5 h-5 text-emerald-400" />
          <span>System Compliance Audit Trail & Operations Log ({filteredLogs.length})</span>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search action, operator, target..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-lg pl-9 pr-8 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            onClick={handleExport}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-700 flex items-center gap-1.5 transition-colors shrink-0"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 font-mono border-b border-slate-800 uppercase text-[10px]">
              <tr>
                <th className="p-3.5">Timestamp</th>
                <th className="p-3.5">Operator / Actor</th>
                <th className="p-3.5">Action Executed</th>
                <th className="p-3.5">Target Asset / ID</th>
                <th className="p-3.5">Telemetry & Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {paginatedLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-900/60 transition-colors">
                  <td className="p-3.5 font-mono text-slate-400 whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="p-3.5 font-semibold text-white">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>{log.user_name}</span>
                    </div>
                  </td>
                  <td className="p-3.5">
                    <span className="bg-slate-950 text-amber-300 font-mono text-[10px] font-bold px-2 py-0.5 rounded border border-slate-800">
                      {log.action}
                    </span>
                  </td>
                  <td className="p-3.5 font-mono text-slate-300">
                    {log.target_type}: <strong className="text-white">{log.target_id || '-'}</strong>
                  </td>
                  <td className="p-3.5 text-slate-400 font-mono text-[11px] max-w-xs truncate">
                    {log.details ? JSON.stringify(log.details) : '-'}
                  </td>
                </tr>
              ))}

              {paginatedLogs.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500 font-mono">
                    No audit records match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Page {currentPage} of {totalPages}</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="p-1 rounded bg-slate-900 border border-slate-700 disabled:opacity-30"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="p-1 rounded bg-slate-900 border border-slate-700 disabled:opacity-30"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};
