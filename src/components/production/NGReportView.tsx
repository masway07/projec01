import React, { useState, useMemo } from 'react';
import {
  AlertTriangle,
  Plus,
  Search,
  Filter,
  Download,
  Printer,
  Edit2,
  Trash2,
  CheckCircle,
  Clock,
  Factory,
  CheckCircle2,
  X,
  Save,
  ShieldAlert,
  Percent,
  TrendingDown,
  Layers,
  FileSpreadsheet
} from 'lucide-react';
import { NGReport, DefectType, NGReportStatus, LotNumber, ItemStock, Department, AppUser, CompanySettings } from '../../types';

interface NGReportViewProps {
  ngReports: NGReport[];
  lotNumbers: LotNumber[];
  itemStocks: ItemStock[];
  departments: Department[];
  currentUser?: AppUser | null;
  companySettings: CompanySettings;
  onAddNGReport: (report: Omit<NGReport, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateNGReport: (id: string, report: Partial<NGReport>) => void;
  onDeleteNGReport: (id: string) => void;
  onCheckNGReport?: (id: string, userName: string) => void;
  onApproveNGReport?: (id: string, userName: string) => void;
  activeProductionTab?: string;
  onSwitchProductionTab?: (tab: string) => void;
}

const DEFECT_LABELS: Record<DefectType, string> = {
  burr_flash: 'Burr / Flash Berlebih',
  dimension_ng: 'Dimensi Out of Tolerance (NG)',
  scratch: 'Goresan Permukaan (Scratch)',
  crack: 'Retak / Keretakan (Crack)',
  dent: 'Penyok / Deformasi (Dent)',
  contamination: 'Kontaminasi Kotoran / Oli',
  deformation: 'Deformasi Bentuk / Bending',
  pinhole: 'Pinhole / Porositas',
  rust_oxidation: 'Karat / Korosi / Oksidasi',
  under_weight: 'Berat Di Bawah Standar (Under Weight)',
  other: 'Defek Lainnya'
};

const STATUS_CONFIG: Record<NGReportStatus, { label: string; bg: string; text: string; border: string }> = {
  draft: { label: 'Draft', bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300' },
  open: { label: 'Open (Terbuka)', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  investigating: { label: 'Investigasi Masalah', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  action_taken: { label: 'Tindakan Selesai', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  closed: { label: 'Closed (Selesai)', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' }
};

export const NGReportView: React.FC<NGReportViewProps> = ({
  ngReports = [],
  lotNumbers = [],
  itemStocks = [],
  departments = [],
  currentUser,
  companySettings,
  onAddNGReport,
  onUpdateNGReport,
  onDeleteNGReport,
  onCheckNGReport,
  onApproveNGReport,
  activeProductionTab = 'production-ng-report',
  onSwitchProductionTab
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterDefectType, setFilterDefectType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingReport, setEditingReport] = useState<NGReport | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    reportNumber: '',
    reportDate: new Date().toISOString().split('T')[0],
    lotNumberId: '',
    lotNumber: '',
    itemStockId: '',
    itemCode: '',
    partNo: '',
    itemName: '',
    processCode: 'PR-CF-01',
    processName: 'Cold Forging Shaping',
    defectType: 'burr_flash' as DefectType,
    defectDescription: '',
    inspectedQty: 1000,
    defectQty: 20,
    rejectQty: 5,
    reworkQty: 15,
    defectRate: 2.0,
    rootCause: '',
    correctiveAction: '',
    preventiveAction: '',
    inspectorName: currentUser?.name || 'QC Inspector',
    pic: 'Leader Produksi',
    machineLine: 'LINE-CF-01 (Komatsu Press 600T)',
    status: 'investigating' as NGReportStatus,
    notes: ''
  });

  const handleOpenAdd = () => {
    setEditingReport(null);
    const nextNo = `NGR/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, '0')}/${String(ngReports.length + 1).padStart(3, '0')}`;
    const defaultLot = lotNumbers[0] || null;
    const defaultItem = itemStocks[0] || null;

    setFormData({
      reportNumber: nextNo,
      reportDate: new Date().toISOString().split('T')[0],
      lotNumberId: defaultLot?.id || '',
      lotNumber: defaultLot?.lotNumber || 'LOT/2026/03/CF-001',
      itemStockId: defaultItem?.id || '',
      itemCode: defaultItem?.code || 'FG-PIN-01',
      partNo: defaultItem?.partNo || 'PIN-9920-A',
      itemName: defaultItem?.name || 'Shaft Pinion Gear Sub-Assy',
      processCode: 'PR-CF-01',
      processName: 'Cold Forging Shaping',
      defectType: 'burr_flash',
      defectDescription: 'Flash berlebih pada tepi leher gear melebihi standar toleransi drawing',
      inspectedQty: defaultLot?.actualQty || 5000,
      defectQty: defaultLot?.ngQty || 80,
      rejectQty: 30,
      reworkQty: 50,
      defectRate: 1.6,
      rootCause: 'Gap die clearance agak longgar setelah pemakaian stroke panjang',
      correctiveAction: 'Regrinding dan perbaikan clearance dies punch oleh tooling engineering',
      preventiveAction: 'Jadwal preventive regrinding punch setiap 2,500 stroke kerja',
      inspectorName: currentUser?.name || 'Hendra (QC Inspector)',
      pic: 'Budi Santoso (Leader CF)',
      machineLine: defaultLot?.machineLine || 'LINE-CF-01 (Komatsu Press 600T)',
      status: 'investigating',
      notes: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (rpt: NGReport) => {
    setEditingReport(rpt);
    setFormData({
      reportNumber: rpt.reportNumber,
      reportDate: rpt.reportDate,
      lotNumberId: rpt.lotNumberId,
      lotNumber: rpt.lotNumber,
      itemStockId: rpt.itemStockId,
      itemCode: rpt.itemCode,
      partNo: rpt.partNo,
      itemName: rpt.itemName,
      processCode: rpt.processCode || '',
      processName: rpt.processName || '',
      defectType: rpt.defectType,
      defectDescription: rpt.defectDescription,
      inspectedQty: rpt.inspectedQty,
      defectQty: rpt.defectQty,
      rejectQty: rpt.rejectQty,
      reworkQty: rpt.reworkQty,
      defectRate: rpt.defectRate,
      rootCause: rpt.rootCause || '',
      correctiveAction: rpt.correctiveAction || '',
      preventiveAction: rpt.preventiveAction || '',
      inspectorName: rpt.inspectorName,
      pic: rpt.pic || '',
      machineLine: rpt.machineLine,
      status: rpt.status,
      notes: rpt.notes || ''
    });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.reportNumber.trim() || !formData.defectDescription.trim()) {
      alert('Mohon isi Nomor Laporan dan Deskripsi Defek!');
      return;
    }

    const rate = formData.inspectedQty > 0 ? Number(((formData.defectQty / formData.inspectedQty) * 100).toFixed(2)) : 0;
    const finalData = { ...formData, defectRate: rate };

    if (editingReport) {
      onUpdateNGReport(editingReport.id, finalData);
    } else {
      onAddNGReport(finalData);
    }
    setIsModalOpen(false);
  };

  const filteredReports = useMemo(() => {
    return ngReports.filter(r => {
      if (filterDefectType !== 'all' && r.defectType !== filterDefectType) return false;
      if (filterStatus !== 'all' && r.status !== filterStatus) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          r.reportNumber.toLowerCase().includes(q) ||
          r.lotNumber.toLowerCase().includes(q) ||
          r.partNo.toLowerCase().includes(q) ||
          r.itemName.toLowerCase().includes(q) ||
          r.defectDescription.toLowerCase().includes(q) ||
          r.inspectorName.toLowerCase().includes(q) ||
          r.machineLine.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [ngReports, filterDefectType, filterStatus, searchQuery]);

  const kpis = useMemo(() => {
    const totalReports = ngReports.length;
    const totalDefectQty = ngReports.reduce((s, r) => s + (r.defectQty || 0), 0);
    const totalRejectQty = ngReports.reduce((s, r) => s + (r.rejectQty || 0), 0);
    const totalReworkQty = ngReports.reduce((s, r) => s + (r.reworkQty || 0), 0);
    const avgDefectRate = ngReports.length > 0 ? ngReports.reduce((s, r) => s + (r.defectRate || 0), 0) / ngReports.length : 0;
    return { totalReports, totalDefectQty, totalRejectQty, totalReworkQty, avgDefectRate };
  }, [ngReports]);

  const handleExportCSV = () => {
    const headers = ['No. Laporan', 'Tanggal', 'Nomor Lot', 'Part No', 'Nama Item', 'Jenis Defek', 'Inspected Qty', 'Defect Qty', 'Reject Qty', 'Rework Qty', 'Defect Rate (%)', 'Mesin / Line', 'Inspector', 'PIC', 'Status', 'Deskripsi & Akar Masalah'];
    const csvRows = filteredReports.map(r => [
      r.reportNumber,
      r.reportDate,
      r.lotNumber,
      r.partNo,
      `"${r.itemName}"`,
      `"${DEFECT_LABELS[r.defectType] || r.defectType}"`,
      r.inspectedQty,
      r.defectQty,
      r.rejectQty,
      r.reworkQty,
      `${r.defectRate}%`,
      `"${r.machineLine}"`,
      `"${r.inspectorName}"`,
      `"${r.pic || '-'}"`,
      r.status,
      `"${(r.defectDescription || '').replace(/"/g, '""')} | Root cause: ${(r.rootCause || '').replace(/"/g, '""')}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...csvRows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `NG_Report_Defect_Log_${new Date().toISOString().split('T')[0]}.csv`);
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
          <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">NG Report (Laporan Defek & Reject)</h1>
            <p className="text-xs text-slate-500">Pencatatan Cacat Produksi, Analisis Akar Masalah (Root Cause), dan Tindakan Korektif</p>
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
            <span className="text-xs font-bold text-slate-500 uppercase">Total Temuan NG</span>
            <div className="p-1.5 bg-rose-50 text-rose-600 rounded-lg">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-rose-600">{kpis.totalDefectQty.toLocaleString('id-ID')} PCS</div>
          <div className="text-[11px] text-slate-500 mt-1">Dari {kpis.totalReports} insiden laporan</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase">Reject / Scrap Murni</span>
            <div className="p-1.5 bg-slate-100 text-slate-700 rounded-lg">
              <Trash2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-slate-800">{kpis.totalRejectQty.toLocaleString('id-ID')} PCS</div>
          <div className="text-[11px] text-slate-500 mt-1">Barang afkir / tidak bisa rework</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase">Part Dapat Di-Rework</span>
            <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-blue-600">{kpis.totalReworkQty.toLocaleString('id-ID')} PCS</div>
          <div className="text-[11px] text-blue-600 font-semibold mt-1">Dapat diperbaiki / tumbling ulang</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase">Rata-rata Defect Rate</span>
            <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-amber-600">{kpis.avgDefectRate.toFixed(2)}%</div>
          <div className="text-[11px] text-slate-500 mt-1">Target maksimum defect &lt; 2.5%</div>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Cari no. laporan, no. lot, part no, deskripsi defek..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <select
              value={filterDefectType}
              onChange={e => setFilterDefectType(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="all">Semua Jenis Defek</option>
              {Object.entries(DEFECT_LABELS).map(([k, label]) => (
                <option key={k} value={k}>{label}</option>
              ))}
            </select>

            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="all">Semua Status</option>
              <option value="investigating">Investigasi</option>
              <option value="action_taken">Tindakan Selesai</option>
              <option value="closed">Closed</option>
              <option value="draft">Draft</option>
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
              className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Input Laporan NG</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main NG Report Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-3">No. Laporan</th>
                <th className="py-3 px-3">Tanggal & Lot</th>
                <th className="py-3 px-3 min-w-[180px]">Part No & Item Name</th>
                <th className="py-3 px-3">Jenis Defek</th>
                <th className="py-3 px-3 min-w-[200px]">Deskripsi & Tindakan</th>
                <th className="py-3 px-3 text-right">NG Qty</th>
                <th className="py-3 px-3 text-right">Defect %</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-center">Approval</th>
                <th className="py-3 px-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">
                    Tidak ada laporan NG yang cocok dengan kriteria filter.
                  </td>
                </tr>
              ) : (
                filteredReports.map(rpt => {
                  const stat = STATUS_CONFIG[rpt.status] || STATUS_CONFIG.investigating;
                  return (
                    <tr key={rpt.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-3 whitespace-nowrap font-mono font-bold text-rose-600">
                        {rpt.reportNumber}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap text-slate-700">
                        <div className="font-semibold">{rpt.reportDate}</div>
                        <div className="text-[10px] font-mono text-indigo-600">{rpt.lotNumber}</div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-800">{rpt.itemName}</div>
                        <div className="text-[10px] font-mono text-slate-500">Part No: {rpt.partNo}</div>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 font-bold text-[10px]">
                          {DEFECT_LABELS[rpt.defectType] || rpt.defectType}
                        </span>
                        <div className="text-[10px] text-slate-400 mt-0.5">{rpt.machineLine}</div>
                      </td>
                      <td className="py-3 px-3 text-slate-700">
                        <div className="font-medium text-slate-800">{rpt.defectDescription}</div>
                        {rpt.correctiveAction && (
                          <div className="text-[10px] text-emerald-700 mt-0.5">Action: {rpt.correctiveAction}</div>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-rose-600 whitespace-nowrap">
                        {rpt.defectQty.toLocaleString('id-ID')} PCS
                        <div className="text-[10px] text-slate-400">Rework: {rpt.reworkQty}</div>
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-amber-700 whitespace-nowrap">
                        {rpt.defectRate}%
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${stat.bg} ${stat.text} ${stat.border}`}>
                          {stat.label}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        {rpt.approvedBy ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" /> Approved
                          </span>
                        ) : rpt.checkedBy ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                            <CheckCircle2 className="w-3 h-3" /> Checked
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400">Pending</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          {onCheckNGReport && !rpt.checkedBy && (
                            <button
                              onClick={() => onCheckNGReport(rpt.id, currentUser?.name || 'QC Inspector')}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                              title="Check QC"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleOpenEdit(rpt)}
                            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                            title="Edit Laporan"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Hapus Laporan NG ${rpt.reportNumber}?`)) {
                                onDeleteNGReport(rpt.id);
                              }
                            }}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Hapus Laporan"
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

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  {editingReport ? `Edit Laporan NG - ${editingReport.reportNumber}` : 'Form Laporan Temuan Defek (NG Report)'}
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
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nomor Laporan (NG Report No)</label>
                  <input
                    type="text"
                    required
                    value={formData.reportNumber}
                    onChange={e => setFormData({ ...formData, reportNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal Inspeksi</label>
                  <input
                    type="date"
                    required
                    value={formData.reportDate}
                    onChange={e => setFormData({ ...formData, reportDate: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Pilih Nomor Lot Terkait</label>
                  <select
                    value={formData.lotNumberId}
                    onChange={e => {
                      const lot = lotNumbers.find(l => l.id === e.target.value);
                      if (lot) {
                        setFormData({
                          ...formData,
                          lotNumberId: lot.id,
                          lotNumber: lot.lotNumber,
                          itemStockId: lot.itemStockId,
                          itemCode: lot.itemCode,
                          partNo: lot.partNo,
                          itemName: lot.itemName,
                          machineLine: lot.machineLine,
                          inspectedQty: lot.actualQty,
                          defectQty: lot.ngQty
                        });
                      }
                    }}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold"
                  >
                    {lotNumbers.map(l => (
                      <option key={l.id} value={l.id}>{l.lotNumber} - {l.itemName} ({l.partNo})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Jenis Defek (Defect Type)</label>
                  <select
                    value={formData.defectType}
                    onChange={e => setFormData({ ...formData, defectType: e.target.value as DefectType })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold"
                  >
                    {Object.entries(DEFECT_LABELS).map(([k, label]) => (
                      <option key={k} value={k}>{label}</option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Deskripsi Defek / Visual Temuan</label>
                  <textarea
                    rows={2}
                    required
                    value={formData.defectDescription}
                    onChange={e => setFormData({ ...formData, defectDescription: e.target.value })}
                    placeholder="Contoh: Diameter over 0.05mm atau goresan pada area seal..."
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Inspected Qty (PCS)</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.inspectedQty}
                    onChange={e => setFormData({ ...formData, inspectedQty: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-rose-700 mb-1">Total Defect Qty (PCS)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.defectQty}
                    onChange={e => {
                      const def = Number(e.target.value);
                      const rej = Math.min(formData.rejectQty, def);
                      setFormData({ ...formData, defectQty: def, reworkQty: Math.max(0, def - rej) });
                    }}
                    className="w-full px-3 py-2 bg-rose-50 border border-rose-300 rounded-lg text-xs font-mono font-bold text-rose-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Reject Qty (Scrap Murni)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.rejectQty}
                    onChange={e => {
                      const rej = Number(e.target.value);
                      setFormData({ ...formData, rejectQty: rej, reworkQty: Math.max(0, formData.defectQty - rej) });
                    }}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-blue-700 mb-1">Rework Qty (Dapat Diperbaiki)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.reworkQty}
                    onChange={e => setFormData({ ...formData, reworkQty: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-blue-50 border border-blue-300 rounded-lg text-xs font-mono font-bold text-blue-800"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Akar Masalah (Root Cause Analysis)</label>
                  <input
                    type="text"
                    value={formData.rootCause}
                    onChange={e => setFormData({ ...formData, rootCause: e.target.value })}
                    placeholder="Penyebab utama timbulnya defek..."
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tindakan Korektif (Corrective Action)</label>
                  <input
                    type="text"
                    value={formData.correctiveAction}
                    onChange={e => setFormData({ ...formData, correctiveAction: e.target.value })}
                    placeholder="Tindakan penanganan langsung..."
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tindakan Pencegahan (Preventive Action)</label>
                  <input
                    type="text"
                    value={formData.preventiveAction}
                    onChange={e => setFormData({ ...formData, preventiveAction: e.target.value })}
                    placeholder="Pencegahan agar tidak terulang..."
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nama Inspector QC</label>
                  <input
                    type="text"
                    value={formData.inspectorName}
                    onChange={e => setFormData({ ...formData, inspectorName: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Status Laporan</label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value as NGReportStatus })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold"
                  >
                    <option value="investigating">Investigasi Masalah</option>
                    <option value="action_taken">Tindakan Selesai</option>
                    <option value="closed">Closed (Selesai)</option>
                    <option value="draft">Draft</option>
                  </select>
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
                  className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 transition"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Laporan NG</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
