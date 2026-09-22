import React, { useState, useMemo } from 'react';
import {
  CalendarDays,
  Plus,
  Search,
  Filter,
  Download,
  Printer,
  Edit2,
  Trash2,
  CheckCircle,
  Clock,
  AlertTriangle,
  Factory,
  CheckCircle2,
  X,
  Save,
  Play,
  CheckSquare,
  Building2,
  TrendingUp,
  Activity
} from 'lucide-react';
import { ProductionSchedule, SchedulePriority, ScheduleStatus, ItemStock, Department, AppUser, CompanySettings } from '../../types';

interface ProductionScheduleViewProps {
  productionSchedules?: ProductionSchedule[];
  schedules?: ProductionSchedule[];
  itemStocks: ItemStock[];
  departments: Department[];
  currentUser?: AppUser | null;
  companySettings: CompanySettings;
  onAddSchedule: (schedule: Omit<ProductionSchedule, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateSchedule: (id: string, schedule: Partial<ProductionSchedule>) => void;
  onDeleteSchedule: (id: string) => void;
  onStatusChange?: (id: string, status: ScheduleStatus) => void;
  activeProductionTab?: string;
  onSwitchProductionTab?: (tab: string) => void;
}

const PRIORITY_BADGE: Record<SchedulePriority, { label: string; bg: string; text: string }> = {
  urgent: { label: 'URGENT', bg: 'bg-rose-50 border-rose-200', text: 'text-rose-700' },
  high: { label: 'TINGGI', bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700' },
  medium: { label: 'SEDANG', bg: 'bg-blue-50 border-blue-200', text: 'text-blue-700' },
  low: { label: 'RENDAH', bg: 'bg-slate-50 border-slate-200', text: 'text-slate-700' }
};

const STATUS_BADGE: Record<ScheduleStatus, { label: string; bg: string; text: string }> = {
  draft: { label: 'Draft', bg: 'bg-slate-100', text: 'text-slate-700' },
  scheduled: { label: 'Terjadwal', bg: 'bg-indigo-50 border border-indigo-200', text: 'text-indigo-700' },
  in_production: { label: 'Dalam Produksi', bg: 'bg-blue-50 border border-blue-200', text: 'text-blue-700' },
  delayed: { label: 'Tertunda (Delayed)', bg: 'bg-amber-50 border border-amber-200', text: 'text-amber-700' },
  completed: { label: 'Selesai', bg: 'bg-emerald-50 border border-emerald-200', text: 'text-emerald-700' },
  cancelled: { label: 'Dibatalkan', bg: 'bg-rose-50 border border-rose-200', text: 'text-rose-700' }
};

export const ProductionScheduleView: React.FC<ProductionScheduleViewProps> = ({
  productionSchedules: propSchedules = [],
  schedules = [],
  itemStocks = [],
  departments = [],
  currentUser,
  companySettings,
  onAddSchedule,
  onUpdateSchedule,
  onDeleteSchedule,
  onStatusChange,
  activeProductionTab = 'production-schedule',
  onSwitchProductionTab
}) => {
  const productionSchedules = propSchedules.length > 0 ? propSchedules : schedules;
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterDept, setFilterDept] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingSchedule, setEditingSchedule] = useState<ProductionSchedule | null>(null);

  // Form State
  const [formData, setFormData] = useState<{
    scheduleNumber: string;
    startDate: string;
    endDate: string;
    deptCode: string;
    deptName: string;
    itemStockId: string;
    itemCode: string;
    partNo: string;
    itemName: string;
    plannedQty: number;
    actualProducedQty: number;
    uom: string;
    machineLine: string;
    targetFinishDate: string;
    priority: SchedulePriority;
    shift: 'Shift 1' | 'Shift 2' | 'Shift 3' | 'All Shift';
    status: ScheduleStatus;
    progressPercentage: number;
    notes: string;
  }>({
    scheduleNumber: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
    deptCode: 'CF',
    deptName: 'Cold Forging',
    itemStockId: '',
    itemCode: '',
    partNo: '',
    itemName: '',
    plannedQty: 10000,
    actualProducedQty: 0,
    uom: 'PCS',
    machineLine: 'LINE-CF-01 (Komatsu Press 600T)',
    targetFinishDate: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
    priority: 'high' as SchedulePriority,
    shift: 'All Shift',
    status: 'scheduled' as ScheduleStatus,
    progressPercentage: 0,
    notes: ''
  });

  const handleOpenAdd = () => {
    setEditingSchedule(null);
    const nextNo = `MPS/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, '0')}/${String(productionSchedules.length + 1).padStart(3, '0')}`;
    const defaultItem = itemStocks[0] || null;

    setFormData({
      scheduleNumber: nextNo,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      deptCode: 'CF',
      deptName: 'Cold Forging',
      itemStockId: defaultItem?.id || '',
      itemCode: defaultItem?.code || 'FG-PIN-01',
      partNo: defaultItem?.partNo || 'PIN-9920-A',
      itemName: defaultItem?.name || 'Shaft Pinion Gear Sub-Assy',
      plannedQty: 15000,
      actualProducedQty: 0,
      uom: defaultItem?.uom || 'PCS',
      machineLine: 'LINE-CF-01 (Komatsu Press 600T)',
      targetFinishDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      priority: 'high',
      shift: 'All Shift',
      status: 'scheduled',
      progressPercentage: 0,
      notes: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (sched: ProductionSchedule) => {
    setEditingSchedule(sched);
    setFormData({
      scheduleNumber: sched.scheduleNumber,
      startDate: sched.startDate,
      endDate: sched.endDate,
      deptCode: sched.deptCode,
      deptName: sched.deptName,
      itemStockId: sched.itemStockId,
      itemCode: sched.itemCode,
      partNo: sched.partNo,
      itemName: sched.itemName,
      plannedQty: sched.plannedQty,
      actualProducedQty: sched.actualProducedQty,
      uom: sched.uom,
      machineLine: sched.machineLine,
      targetFinishDate: sched.targetFinishDate,
      priority: sched.priority,
      shift: sched.shift,
      status: sched.status,
      progressPercentage: sched.progressPercentage,
      notes: sched.notes || ''
    });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.scheduleNumber.trim() || !formData.itemName.trim()) {
      alert('Mohon lengkapi No. Jadwal dan Nama Item!');
      return;
    }

    const progress = formData.plannedQty > 0 ? Math.min(100, Math.round((formData.actualProducedQty / formData.plannedQty) * 100)) : 0;
    const finalData = { ...formData, progressPercentage: progress };

    if (editingSchedule) {
      onUpdateSchedule(editingSchedule.id, finalData);
    } else {
      onAddSchedule(finalData);
    }
    setIsModalOpen(false);
  };

  const filteredSchedules = useMemo(() => {
    return productionSchedules.filter(s => {
      if (filterDept !== 'all' && s.deptCode !== filterDept) return false;
      if (filterStatus !== 'all' && s.status !== filterStatus) return false;
      if (filterPriority !== 'all' && s.priority !== filterPriority) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          s.scheduleNumber.toLowerCase().includes(q) ||
          s.partNo.toLowerCase().includes(q) ||
          s.itemName.toLowerCase().includes(q) ||
          s.machineLine.toLowerCase().includes(q) ||
          s.deptName.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [productionSchedules, filterDept, filterStatus, filterPriority, searchQuery]);

  const kpis = useMemo(() => {
    const totalSchedules = productionSchedules.length;
    const inProduction = productionSchedules.filter(s => s.status === 'in_production').length;
    const completed = productionSchedules.filter(s => s.status === 'completed').length;
    const totalPlanned = productionSchedules.reduce((s, p) => s + (p.plannedQty || 0), 0);
    const totalProduced = productionSchedules.reduce((s, p) => s + (p.actualProducedQty || 0), 0);
    const overallProgress = totalPlanned > 0 ? (totalProduced / totalPlanned) * 100 : 0;
    return { totalSchedules, inProduction, completed, totalPlanned, totalProduced, overallProgress };
  }, [productionSchedules]);

  const handleExportCSV = () => {
    const headers = ['No Jadwal', 'Tanggal Mulai', 'Target Selesai', 'Departemen', 'Part No', 'Nama Item', 'Rencana Qty', 'Realisasi Qty', 'Progress %', 'UOM', 'Mesin / Line', 'Prioritas', 'Status', 'Catatan'];
    const csvRows = filteredSchedules.map(s => [
      s.scheduleNumber,
      s.startDate,
      s.targetFinishDate,
      `"${s.deptName}"`,
      s.partNo,
      `"${s.itemName}"`,
      s.plannedQty,
      s.actualProducedQty,
      `${s.progressPercentage}%`,
      s.uom,
      `"${s.machineLine}"`,
      s.priority,
      s.status,
      `"${(s.notes || '').replace(/"/g, '""')}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...csvRows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Production_Schedule_MPS_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const productionTabs = [
    { id: 'production-lot-number', label: 'Lot Number (Traceability)' },
    { id: 'production-schedule', label: 'Production Schedule (MPS)' },
    { id: 'production-ng-report', label: 'NG Report (Defect Log)' }
  ];

  return (
    <div className="space-y-5">
      {/* Submenu Tabs Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3 bg-white p-4 rounded-xl shadow-xs">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
            <CalendarDays className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">Master Production Schedule (MPS)</h1>
            <p className="text-xs text-slate-500">Jadwal Rencana dan Pemantauan Progres Lini Produksi</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
          {productionTabs.map(t => (
            <button
              key={t.id}
              onClick={() => onSwitchProductionTab && onSwitchProductionTab(t.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeProductionTab === t.id
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase">Total Rencana Jadwal</span>
            <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
              <CalendarDays className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-slate-900">{kpis.totalSchedules} Work Order</div>
          <div className="text-[11px] text-slate-500 mt-1">Total batch yang dijadwalkan</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase">Sedang Berjalan</span>
            <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
              <Play className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-blue-600">{kpis.inProduction} Jadwal</div>
          <div className="text-[11px] text-blue-600 font-semibold mt-1">Lini mesin aktif memproduksi</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase">Jadwal Selesai</span>
            <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-emerald-600">{kpis.completed} Jadwal</div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-1">100% output tercapai</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase">Akumulasi Output Progres</span>
            <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-indigo-600">{kpis.overallProgress.toFixed(1)}%</div>
          <div className="text-[11px] text-slate-500 mt-1">
            {kpis.totalProduced.toLocaleString('id-ID')} dari {kpis.totalPlanned.toLocaleString('id-ID')} PCS
          </div>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Cari no jadwal, part no, nama item, lini mesin..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <select
              value={filterDept}
              onChange={e => setFilterDept(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="all">Semua Departemen</option>
              {departments.map(d => (
                <option key={d.code} value={d.code}>{d.code} - {d.name}</option>
              ))}
            </select>

            <select
              value={filterPriority}
              onChange={e => setFilterPriority(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="all">Semua Prioritas</option>
              <option value="urgent">Urgent</option>
              <option value="high">Tinggi</option>
              <option value="medium">Sedang</option>
              <option value="low">Rendah</option>
            </select>

            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="all">Semua Status</option>
              <option value="scheduled">Terjadwal</option>
              <option value="in_production">Dalam Produksi</option>
              <option value="completed">Selesai</option>
              <option value="draft">Draft</option>
              <option value="cancelled">Dibatalkan</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Jadwalkan Produksi</span>
            </button>
          </div>
        </div>
      </div>

      {/* Schedule Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-3">No. Jadwal</th>
                <th className="py-3 px-3">Periode & Target</th>
                <th className="py-3 px-3">Dept & Mesin</th>
                <th className="py-3 px-3 min-w-[200px]">Part No & Item</th>
                <th className="py-3 px-3 text-right">Rencana</th>
                <th className="py-3 px-3 text-right">Realisasi</th>
                <th className="py-3 px-3 min-w-[130px]">Progres (%)</th>
                <th className="py-3 px-3 text-center">Prioritas</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSchedules.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">
                    Tidak ada jadwal produksi yang cocok dengan filter.
                  </td>
                </tr>
              ) : (
                filteredSchedules.map(sched => {
                  const prio = PRIORITY_BADGE[sched.priority] || PRIORITY_BADGE.medium;
                  const stat = STATUS_BADGE[sched.status] || STATUS_BADGE.scheduled;
                  return (
                    <tr key={sched.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-3 whitespace-nowrap font-mono font-bold text-indigo-600">
                        {sched.scheduleNumber}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap text-slate-700">
                        <div className="font-semibold">{sched.startDate} s/d {sched.endDate}</div>
                        <div className="text-[10px] text-slate-400">Target: {sched.targetFinishDate}</div>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap text-slate-700">
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-bold text-[10px] mr-1">
                          {sched.deptCode}
                        </span>
                        <div className="text-[10px] text-slate-500">{sched.machineLine}</div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-800">{sched.itemName}</div>
                        <div className="text-[10px] font-mono text-slate-500">Part No: {sched.partNo}</div>
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-800 whitespace-nowrap">
                        {sched.plannedQty.toLocaleString('id-ID')} {sched.uom}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-emerald-700 whitespace-nowrap">
                        {sched.actualProducedQty.toLocaleString('id-ID')}
                      </td>
                      <td className="py-3 px-3">
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden mb-1">
                          <div
                            className={`h-2 rounded-full ${
                              sched.progressPercentage >= 100
                                ? 'bg-emerald-500'
                                : sched.progressPercentage >= 50
                                ? 'bg-indigo-600'
                                : 'bg-amber-500'
                            }`}
                            style={{ width: `${Math.min(100, sched.progressPercentage)}%` }}
                          />
                        </div>
                        <div className="text-[10px] font-bold text-slate-600 text-right">
                          {sched.progressPercentage}%
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${prio.bg} ${prio.text}`}>
                          {prio.label}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${stat.bg} ${stat.text}`}>
                          {stat.label}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(sched)}
                            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                            title="Edit Jadwal"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Hapus Jadwal Produksi ${sched.scheduleNumber}?`)) {
                                onDeleteSchedule(sched.id);
                              }
                            }}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Hapus Jadwal"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                  <CalendarDays className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  {editingSchedule ? `Edit Jadwal - ${editingSchedule.scheduleNumber}` : 'Buat Rencana Jadwal Produksi (MPS)'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nomor Rencana Jadwal (MPS No)</label>
                  <input
                    type="text"
                    required
                    value={formData.scheduleNumber}
                    onChange={e => setFormData({ ...formData, scheduleNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Departemen Produksi</label>
                  <select
                    value={formData.deptCode}
                    onChange={e => {
                      const d = departments.find(dept => dept.code === e.target.value);
                      setFormData({
                        ...formData,
                        deptCode: e.target.value,
                        deptName: d?.name || ''
                      });
                    }}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold"
                  >
                    {departments.map(d => (
                      <option key={d.code} value={d.code}>{d.code} - {d.name}</option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Pilih Part / Item Barang Jadi</label>
                  <select
                    value={formData.itemStockId}
                    onChange={e => {
                      const selected = itemStocks.find(i => i.id === e.target.value);
                      if (selected) {
                        setFormData({
                          ...formData,
                          itemStockId: selected.id,
                          itemCode: selected.code,
                          partNo: selected.partNo,
                          itemName: selected.name,
                          uom: selected.uom
                        });
                      }
                    }}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold"
                  >
                    {itemStocks.map(i => (
                      <option key={i.id} value={i.id}>{i.partNo} - {i.name} ({i.code})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal Mulai Produksi</label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Target Selesai Produksi</label>
                  <input
                    type="date"
                    required
                    value={formData.targetFinishDate}
                    onChange={e => setFormData({ ...formData, targetFinishDate: e.target.value, endDate: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mesin / Line Produksi</label>
                  <input
                    type="text"
                    value={formData.machineLine}
                    onChange={e => setFormData({ ...formData, machineLine: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tingkat Prioritas</label>
                  <select
                    value={formData.priority}
                    onChange={e => setFormData({ ...formData, priority: e.target.value as SchedulePriority })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold"
                  >
                    <option value="urgent">Urgent / Mendesak</option>
                    <option value="high">Tinggi (High)</option>
                    <option value="medium">Sedang (Medium)</option>
                    <option value="low">Rendah (Low)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Rencana Kuantitas (Planned Qty)</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.plannedQty}
                    onChange={e => setFormData({ ...formData, plannedQty: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Realisasi Output (Produced Qty)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.actualProducedQty}
                    onChange={e => setFormData({ ...formData, actualProducedQty: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Status Pengerjaan</label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value as ScheduleStatus })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold"
                  >
                    <option value="scheduled">Terjadwal</option>
                    <option value="in_production">Dalam Produksi</option>
                    <option value="completed">Selesai</option>
                    <option value="draft">Draft</option>
                    <option value="cancelled">Dibatalkan</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Catatan Jadwal / PO Customer Terkait</label>
                  <textarea
                    rows={2}
                    value={formData.notes}
                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Keterangan alokasi PO atau maintenance..."
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Jadwal Produksi</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
