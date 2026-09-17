import React, { useState, useMemo } from 'react';
import {
  History,
  Search,
  Filter,
  Download,
  Printer,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Clock,
  User,
  Building2,
  Laptop,
  Smartphone,
  Tablet,
  FileSpreadsheet,
  Eye,
  RefreshCw,
  Calendar,
  Layers,
  ShieldCheck,
  Tag,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { AppUser, AuditAction, AuditLogEntry, AuditModule, Department } from '../types';
import * as XLSX from 'xlsx';

interface AuditLogViewProps {
  auditLogs: AuditLogEntry[];
  departments: Department[];
  currentUser?: AppUser | null;
  onClearLogs?: () => void;
  onRefreshLogs?: () => void;
  isSyncing?: boolean;
}

export const AuditLogView: React.FC<AuditLogViewProps> = ({
  auditLogs,
  departments,
  currentUser,
  onClearLogs,
  onRefreshLogs,
  isSyncing = false
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [deptFilter, setDeptFilter] = useState<string>('all');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [moduleFilter, setModuleFilter] = useState<string>('all');
  const [userTypeFilter, setUserTypeFilter] = useState<string>('all'); // 'all', 'dept_user', 'admin'
  const [dateRangeFilter, setDateRangeFilter] = useState<string>('all'); // 'today', '7days', '30days', 'all'
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState<boolean>(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);

  // Filtered logs
  const filteredLogs = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().substring(0, 10);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    return auditLogs.filter(log => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const match =
          (log.userName || '').toLowerCase().includes(q) ||
          (log.userEmail || '').toLowerCase().includes(q) ||
          (log.userDept || '').toLowerCase().includes(q) ||
          (log.deptCode || '').toLowerCase().includes(q) ||
          (log.itemCode || '').toLowerCase().includes(q) ||
          (log.itemName || '').toLowerCase().includes(q) ||
          (log.details || '').toLowerCase().includes(q) ||
          (log.module || '').toLowerCase().includes(q);
        if (!match) return false;
      }

      // 2. Dept Filter
      if (deptFilter !== 'all') {
        const logDept = (log.deptCode || log.userDept || '').toUpperCase();
        if (logDept !== deptFilter.toUpperCase()) return false;
      }

      // 3. Action Filter
      if (actionFilter !== 'all') {
        if (actionFilter === 'DELETE_GROUP') {
          if (log.action !== 'DELETE' && log.action !== 'BATCH_DELETE') return false;
        } else if (log.action !== actionFilter) {
          return false;
        }
      }

      // 4. Module Filter
      if (moduleFilter !== 'all') {
        if (log.module !== moduleFilter) return false;
      }

      // 5. User Type Filter
      if (userTypeFilter !== 'all') {
        if (userTypeFilter === 'dept_user' && log.userRole !== 'dept_user') return false;
        if (userTypeFilter === 'admin' && log.userRole !== 'admin') return false;
      }

      // 6. Date Range Filter
      if (dateRangeFilter !== 'all') {
        const logDate = new Date(log.timestamp);
        if (dateRangeFilter === 'today') {
          if (log.timestamp.substring(0, 10) !== todayStr) return false;
        } else if (dateRangeFilter === '7days') {
          if (logDate < sevenDaysAgo) return false;
        } else if (dateRangeFilter === '30days') {
          if (logDate < thirtyDaysAgo) return false;
        }
      }

      return true;
    });
  }, [auditLogs, searchQuery, deptFilter, actionFilter, moduleFilter, userTypeFilter, dateRangeFilter]);

  // Paginated records
  const totalPages = Math.ceil(filteredLogs.length / pageSize) || 1;
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredLogs.slice(start, start + pageSize);
  }, [filteredLogs, currentPage, pageSize]);

  // Summary Metrics
  const metrics = useMemo(() => {
    const todayStr = new Date().toISOString().substring(0, 10);
    const deptUserCount = auditLogs.filter(l => l.userRole === 'dept_user').length;
    const todayCount = auditLogs.filter(l => l.timestamp.startsWith(todayStr)).length;
    const deleteCount = auditLogs.filter(l => l.action === 'DELETE' || l.action === 'BATCH_DELETE').length;

    return {
      total: auditLogs.length,
      deptUser: deptUserCount,
      today: todayCount,
      deleted: deleteCount
    };
  }, [auditLogs]);

  // Format Helper
  const formatTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return isoString;
    }
  };

  // Action Badge Color
  const getActionBadge = (action: AuditAction) => {
    switch (action) {
      case 'CREATE':
        return {
          label: 'TAMBAH',
          bg: 'bg-emerald-100 text-emerald-800 border-emerald-200'
        };
      case 'UPDATE':
        return {
          label: 'EDIT',
          bg: 'bg-sky-100 text-sky-800 border-sky-200'
        };
      case 'DELETE':
        return {
          label: 'HAPUS',
          bg: 'bg-rose-100 text-rose-800 border-rose-200'
        };
      case 'BATCH_DELETE':
        return {
          label: 'HAPUS BATCH',
          bg: 'bg-rose-200 text-rose-900 border-rose-300 font-black'
        };
      case 'IMPORT':
        return {
          label: 'IMPORT EXCEL',
          bg: 'bg-indigo-100 text-indigo-800 border-indigo-200'
        };
      case 'RESET':
        return {
          label: 'RESET',
          bg: 'bg-amber-100 text-amber-800 border-amber-200'
        };
      default:
        return {
          label: action,
          bg: 'bg-slate-100 text-slate-700 border-slate-200'
        };
    }
  };

  // Device Icon
  const renderDeviceIcon = (device?: string) => {
    if (device === 'Mobile') {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200" title="Diakses lewat Handphone">
          <Smartphone className="w-3 h-3 text-emerald-600" />
          <span>HP</span>
        </span>
      );
    }
    if (device === 'Tablet') {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200" title="Diakses lewat Tablet">
          <Tablet className="w-3 h-3 text-blue-600" />
          <span>Tablet</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200" title="Diakses lewat Komputer / Laptop">
        <Laptop className="w-3 h-3 text-slate-600" />
        <span>Desktop</span>
      </span>
    );
  };

  // Export to Excel
  const handleExportExcel = () => {
    const dataToExport = filteredLogs.map((log, idx) => ({
      No: idx + 1,
      'Waktu & Tanggal': formatTime(log.timestamp),
      'Nama Pengguna': log.userName,
      'Email Pengguna': log.userEmail,
      'Role Pengguna': log.userRole,
      'Departemen User': log.userDept || '-',
      'Departemen Data': log.deptCode || '-',
      'Modul': log.module,
      'Jenis Aksi': log.action,
      'Kode Pos/Akun': log.itemCode || '-',
      'Nama Pos/Item': log.itemName || '-',
      'Rincian Perubahan': log.details,
      'Device': log.device || 'Desktop'
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Audit Logs');
    XLSX.writeFile(wb, `Log_Perubahan_Audit_${new Date().toISOString().substring(0, 10)}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-indigo-100 text-indigo-700 rounded-xl">
              <History className="w-6 h-6 text-indigo-700" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
                Log Perubahan &amp; Audit Trail
                <span className="px-2 py-0.5 text-xs bg-rose-100 text-rose-800 rounded-full font-bold border border-rose-200">
                  Khusus Admin
                </span>
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Rekam jejak seluruh aktivitas penambahan, pengeditan, penghapusan, dan import data oleh User Departemen &amp; Admin.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onRefreshLogs && (
            <button
              type="button"
              onClick={onRefreshLogs}
              disabled={isSyncing}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Perbarui data log dari server"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-indigo-600' : ''}`} />
              <span>{isSyncing ? 'Menyinkronkan...' : 'Refresh Log'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleExportExcel}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            title="Download Log Perubahan ke Excel"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Excel</span>
          </button>

          {onClearLogs && currentUser?.role === 'admin' && (
            <button
              type="button"
              onClick={() => setShowClearConfirm(true)}
              className="px-3 py-2 border border-rose-300 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-semibold transition flex items-center gap-1 cursor-pointer"
              title="Bersihkan riwayat log"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Bersihkan Log</span>
            </button>
          )}
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Log Aktivitas</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{metrics.total}</div>
          <div className="text-[11px] text-slate-400 mt-1">Tersimpan di server cloud</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Aktivitas User Dept</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <User className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-blue-700 mt-2">{metrics.deptUser}</div>
          <div className="text-[11px] text-blue-600 font-medium mt-1">Dibuat oleh user departemen</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Aktivitas Hari Ini</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-2">{metrics.today}</div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">Perubahan per hari ini</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Penghapusan Data</span>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
              <Trash2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-700 mt-2">{metrics.deleted}</div>
          <div className="text-[11px] text-rose-600 font-medium mt-1">Hapus single / batch</div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Cari user, item, no akun, rincian..."
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Filter Dept */}
          <div>
            <select
              value={deptFilter}
              onChange={e => {
                setDeptFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
            >
              <option value="all">Semua Departemen</option>
              {departments.map(d => (
                <option key={d.code} value={d.code}>
                  {d.code} - {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Filter User Type */}
          <div>
            <select
              value={userTypeFilter}
              onChange={e => {
                setUserTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
            >
              <option value="all">Semua Tipe Pengguna</option>
              <option value="dept_user">Khusus User Departemen</option>
              <option value="admin">Khusus Administrator</option>
            </select>
          </div>

          {/* Filter Action */}
          <div>
            <select
              value={actionFilter}
              onChange={e => {
                setActionFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
            >
              <option value="all">Semua Jenis Aksi</option>
              <option value="CREATE">TAMBAH (Create)</option>
              <option value="UPDATE">EDIT (Update)</option>
              <option value="DELETE_GROUP">HAPUS (Single &amp; Batch)</option>
              <option value="IMPORT">IMPORT (Excel / Template)</option>
              <option value="RESET">RESET</option>
            </select>
          </div>
        </div>

        {/* Secondary Filter Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-slate-500 font-medium flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Waktu:</span>
            </span>
            <button
              type="button"
              onClick={() => { setDateRangeFilter('all'); setCurrentPage(1); }}
              className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer ${
                dateRangeFilter === 'all'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Semua
            </button>
            <button
              type="button"
              onClick={() => { setDateRangeFilter('today'); setCurrentPage(1); }}
              className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer ${
                dateRangeFilter === 'today'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Hari Ini
            </button>
            <button
              type="button"
              onClick={() => { setDateRangeFilter('7days'); setCurrentPage(1); }}
              className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer ${
                dateRangeFilter === '7days'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              7 Hari Terakhir
            </button>
            <button
              type="button"
              onClick={() => { setDateRangeFilter('30days'); setCurrentPage(1); }}
              className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer ${
                dateRangeFilter === '30days'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              30 Hari Terakhir
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-500">Tampilkan:</span>
            <select
              value={pageSize}
              onChange={e => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2 py-1 bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700"
            >
              <option value={10}>10 baris</option>
              <option value={20}>20 baris</option>
              <option value={50}>50 baris</option>
              <option value={100}>100 baris</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Audit Log Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold">
                <th className="p-3 w-12 text-center">No</th>
                <th className="p-3 w-40">Waktu &amp; Device</th>
                <th className="p-3 w-52">Pengguna (User Dept / Admin)</th>
                <th className="p-3 w-36">Modul &amp; Dept</th>
                <th className="p-3 w-28 text-center">Aksi</th>
                <th className="p-3 w-44">Pos / Akun</th>
                <th className="p-3">Rincian Perubahan Data</th>
                <th className="p-3 w-20 text-center">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedLogs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-slate-400">
                    <History className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-600">Belum ada riwayat aktivitas yang sesuai filter</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Setiap perubahan data oleh user Departemen atau Admin akan otomatis tercatat di sini.
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedLogs.map((log, idx) => {
                  const badge = getActionBadge(log.action);
                  const rowNumber = (currentPage - 1) * pageSize + idx + 1;

                  return (
                    <tr
                      key={log.id}
                      className="hover:bg-slate-50/80 transition cursor-pointer"
                      onClick={() => setSelectedLog(log)}
                    >
                      <td className="p-3 text-center text-slate-400 font-mono text-[11px]">
                        {rowNumber}
                      </td>

                      <td className="p-3 whitespace-nowrap">
                        <div className="font-mono text-slate-800 font-medium text-[11px]">
                          {formatTime(log.timestamp)}
                        </div>
                        <div className="mt-1">
                          {renderDeviceIcon(log.device)}
                        </div>
                      </td>

                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                            log.userRole === 'admin'
                              ? 'bg-rose-100 text-rose-700 border border-rose-200'
                              : 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                          }`}>
                            {log.userName ? log.userName.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 truncate flex items-center gap-1.5">
                              <span>{log.userName}</span>
                              {log.userDept && (
                                <span className="px-1.5 py-0.2 bg-slate-100 text-slate-700 rounded text-[10px] font-bold border border-slate-200">
                                  {log.userDept}
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400 truncate">{log.userEmail}</div>
                          </div>
                        </div>
                      </td>

                      <td className="p-3">
                        <div className="font-semibold text-slate-800 text-[11px]">
                          {log.module}
                        </div>
                        {log.deptCode && (
                          <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <Building2 className="w-2.5 h-2.5 text-slate-400" />
                            <span>Dept: {log.deptCode}</span>
                          </div>
                        )}
                      </td>

                      <td className="p-3 text-center">
                        <span className={`inline-block px-2.5 py-1 rounded-lg text-[10px] font-bold border ${badge.bg}`}>
                          {badge.label}
                        </span>
                      </td>

                      <td className="p-3">
                        {log.itemCode || log.itemName ? (
                          <div className="space-y-0.5">
                            {log.itemCode && (
                              <div className="font-mono font-bold text-indigo-700 text-[11px]">
                                {log.itemCode}
                              </div>
                            )}
                            {log.itemName && (
                              <div className="text-slate-700 text-[11px] truncate max-w-[170px]" title={log.itemName}>
                                {log.itemName}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs">-</span>
                        )}
                      </td>

                      <td className="p-3">
                        <div className="text-slate-700 line-clamp-2 leading-relaxed text-[11px]" title={log.details}>
                          {log.details}
                        </div>
                      </td>

                      <td className="p-3 text-center" onClick={e => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => setSelectedLog(log)}
                          className="p-1.5 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                          title="Lihat Detail Lengkap"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {filteredLogs.length > 0 && (
          <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 bg-slate-50/50">
            <div>
              Menampilkan{' '}
              <span className="font-bold text-slate-900">
                {(currentPage - 1) * pageSize + 1}
              </span>{' '}
              sampai{' '}
              <span className="font-bold text-slate-900">
                {Math.min(currentPage * pageSize, filteredLogs.length)}
              </span>{' '}
              dari <span className="font-bold text-slate-900">{filteredLogs.length}</span> log aktivitas
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                className="px-3 py-1.5 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium"
              >
                Sebelumnya
              </button>

              <div className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg font-bold border border-indigo-200">
                Halaman {currentPage} / {totalPages}
              </div>

              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                className="px-3 py-1.5 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium"
              >
                Selanjutnya
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Log Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-100 text-indigo-700 rounded-xl">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">Detail Rekam Jejak Aktivitas</h3>
                  <p className="text-xs text-slate-500">ID: {selectedLog.id}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-400 block mb-0.5">Waktu Eksekusi:</span>
                <span className="font-bold text-slate-800 font-mono">{formatTime(selectedLog.timestamp)}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Perangkat (Device):</span>
                <div>{renderDeviceIcon(selectedLog.device)}</div>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Pengguna:</span>
                <span className="font-bold text-slate-900">{selectedLog.userName}</span>
                <span className="text-slate-500 block text-[11px]">{selectedLog.userEmail} ({selectedLog.userRole})</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Departemen Terkait:</span>
                <span className="font-bold text-indigo-700">{selectedLog.deptCode || selectedLog.userDept || '-'}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Modul Sistem:</span>
                <span className="font-semibold text-slate-800">{selectedLog.module}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Jenis Aksi:</span>
                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${getActionBadge(selectedLog.action).bg}`}>
                  {selectedLog.action}
                </span>
              </div>
              {selectedLog.itemCode && (
                <div>
                  <span className="text-slate-400 block mb-0.5">Kode Item / Pos:</span>
                  <span className="font-mono font-bold text-slate-900">{selectedLog.itemCode}</span>
                </div>
              )}
              {selectedLog.itemName && (
                <div>
                  <span className="text-slate-400 block mb-0.5">Nama Item / Pos:</span>
                  <span className="font-medium text-slate-900">{selectedLog.itemName}</span>
                </div>
              )}
            </div>

            {/* Full Description */}
            <div>
              <h4 className="text-xs font-bold text-slate-700 mb-1.5">Deskripsi Perubahan:</h4>
              <div className="p-3.5 bg-slate-100 rounded-xl text-xs text-slate-800 leading-relaxed font-sans border border-slate-200">
                {selectedLog.details}
              </div>
            </div>

            {/* Before vs After Diff if available */}
            {(selectedLog.oldValue || selectedLog.newValue) && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-700">Snapshot Nilai Data (Diff):</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  {selectedLog.oldValue && (
                    <div className="bg-rose-50 border border-rose-200 rounded-xl p-3">
                      <div className="font-bold text-rose-800 mb-1 flex items-center gap-1">
                        <span>Nilai Sebelumnya:</span>
                      </div>
                      <pre className="text-[11px] font-mono text-rose-900 overflow-x-auto whitespace-pre-wrap max-h-40">
                        {typeof selectedLog.oldValue === 'object'
                          ? JSON.stringify(selectedLog.oldValue, null, 2)
                          : String(selectedLog.oldValue)}
                      </pre>
                    </div>
                  )}

                  {selectedLog.newValue && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                      <div className="font-bold text-emerald-800 mb-1 flex items-center gap-1">
                        <span>Nilai Sesudah Perubahan:</span>
                      </div>
                      <pre className="text-[11px] font-mono text-emerald-900 overflow-x-auto whitespace-pre-wrap max-h-40">
                        {typeof selectedLog.newValue === 'object'
                          ? JSON.stringify(selectedLog.newValue, null, 2)
                          : String(selectedLog.newValue)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear Logs Confirm Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-rose-100 text-rose-600 rounded-xl shrink-0">
                <Trash2 className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">Bersihkan Riwayat Log?</h3>
                <p className="text-xs text-slate-500">Konfirmasi Pembersihan Audit Trail</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              Apakah Anda yakin ingin menghapus seluruh {auditLogs.length} rekam jejak log aktivitas? Tindakan ini tidak dapat dibatalkan.
            </p>

            <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onClearLogs) onClearLogs();
                  setShowClearConfirm(false);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Ya, Hapus Semua Log</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
