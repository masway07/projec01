import React, { useState, useMemo } from 'react';
import {
  QrCode,
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
  Layers,
  Factory,
  Calendar,
  X,
  Save,
  CheckCircle2,
  User,
  Cpu,
  FileText
} from 'lucide-react';
import { LotNumber, LotNumberStatus, ItemStock, ProductionProcess, Department, AppUser, CompanySettings } from '../../types';

interface LotNumberViewProps {
  lotNumbers: LotNumber[];
  itemStocks: ItemStock[];
  productionProcesses?: ProductionProcess[];
  processes?: ProductionProcess[];
  departments: Department[];
  currentUser?: AppUser | null;
  companySettings: CompanySettings;
  onAddLotNumber: (lot: Omit<LotNumber, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateLotNumber: (id: string, lot: Partial<LotNumber>) => void;
  onDeleteLotNumber: (id: string) => void;
  onCheckLotNumber?: (id: string, userName: string) => void;
  activeProductionTab?: string;
  onSwitchProductionTab?: (tab: string) => void;
}

const STATUS_CONFIG: Record<LotNumberStatus, { label: string; bg: string; text: string; border: string }> = {
  in_progress: { label: 'Sedang Proses', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  qc_pending: { label: 'Menunggu QC', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  completed: { label: 'Selesai (Lolos QC)', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  closed: { label: 'Ditutup (Closed)', bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300' },
  rejected: { label: 'Ditolak (NG/Reject)', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
};

export const LotNumberView: React.FC<LotNumberViewProps> = ({
  lotNumbers = [],
  itemStocks = [],
  productionProcesses: propProcesses = [],
  processes = [],
  departments = [],
  currentUser,
  companySettings,
  onAddLotNumber,
  onUpdateLotNumber,
  onDeleteLotNumber,
  onCheckLotNumber,
  activeProductionTab = 'production-lot-number',
  onSwitchProductionTab
}) => {
  const productionProcesses = propProcesses.length > 0 ? propProcesses : processes;
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterShift, setFilterShift] = useState<string>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingLot, setEditingLot] = useState<LotNumber | null>(null);
  const [viewingLot, setViewingLot] = useState<LotNumber | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    lotNumber: '',
    productionDate: new Date().toISOString().split('T')[0],
    itemStockId: '',
    itemCode: '',
    partNo: '',
    itemName: '',
    targetQty: 1000,
    actualQty: 1000,
    goodQty: 980,
    ngQty: 20,
    uom: 'PCS',
    machineLine: 'LINE-CF-01 (Komatsu Press 600T)',
    processCode: 'PR-CF-01',
    processName: 'Cold Forging Shaping',
    operatorName: currentUser?.name || 'Operator Produksi',
    shift: 'Shift 1' as const,
    rawMaterialLotNo: '',
    status: 'in_progress' as LotNumberStatus,
    notes: ''
  });

  const handleOpenAdd = () => {
    setEditingLot(null);
    const nextNo = `LOT/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, '0')}/LOT-${String(lotNumbers.length + 1).padStart(3, '0')}`;
    const defaultItem = itemStocks[0] || null;

    setFormData({
      lotNumber: nextNo,
      productionDate: new Date().toISOString().split('T')[0],
      itemStockId: defaultItem?.id || '',
      itemCode: defaultItem?.code || 'FG-PIN-01',
      partNo: defaultItem?.partNo || 'PIN-9920-A',
      itemName: defaultItem?.name || 'Shaft Pinion Gear Sub-Assy',
      targetQty: 5000,
      actualQty: 5000,
      goodQty: 4920,
      ngQty: 80,
      uom: defaultItem?.uom || 'PCS',
      machineLine: 'LINE-CF-01 (Komatsu Press 600T)',
      processCode: productionProcesses[0]?.code || 'PR-CF-01',
      processName: productionProcesses[0]?.name || 'Cold Forging Shaping',
      operatorName: currentUser?.name || 'Operator Produksi',
      shift: 'Shift 1',
      rawMaterialLotNo: 'RAW-SPCC-20260318-01',
      status: 'in_progress',
      notes: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (lot: LotNumber) => {
    setEditingLot(lot);
    setFormData({
      lotNumber: lot.lotNumber,
      productionDate: lot.productionDate,
      itemStockId: lot.itemStockId,
      itemCode: lot.itemCode,
      partNo: lot.partNo,
      itemName: lot.itemName,
      targetQty: lot.targetQty,
      actualQty: lot.actualQty,
      goodQty: lot.goodQty,
      ngQty: lot.ngQty,
      uom: lot.uom,
      machineLine: lot.machineLine,
      processCode: lot.processCode || '',
      processName: lot.processName || '',
      operatorName: lot.operatorName,
      shift: lot.shift as any,
      rawMaterialLotNo: lot.rawMaterialLotNo || '',
      status: lot.status,
      notes: lot.notes || ''
    });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.lotNumber.trim() || !formData.itemName.trim()) {
      alert('Mohon lengkapi Nomor Lot dan Nama Item!');
      return;
    }

    if (editingLot) {
      onUpdateLotNumber(editingLot.id, formData);
    } else {
      onAddLotNumber(formData);
    }
    setIsModalOpen(false);
  };

  const filteredLots = useMemo(() => {
    return lotNumbers.filter(lot => {
      if (filterStatus !== 'all' && lot.status !== filterStatus) return false;
      if (filterShift !== 'all' && lot.shift !== filterShift) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          lot.lotNumber.toLowerCase().includes(q) ||
          lot.partNo.toLowerCase().includes(q) ||
          lot.itemName.toLowerCase().includes(q) ||
          lot.machineLine.toLowerCase().includes(q) ||
          lot.operatorName.toLowerCase().includes(q) ||
          (lot.rawMaterialLotNo && lot.rawMaterialLotNo.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [lotNumbers, filterStatus, filterShift, searchQuery]);

  const kpis = useMemo(() => {
    const totalLots = lotNumbers.length;
    const totalTarget = lotNumbers.reduce((s, l) => s + (l.targetQty || 0), 0);
    const totalActual = lotNumbers.reduce((s, l) => s + (l.actualQty || 0), 0);
    const totalGood = lotNumbers.reduce((s, l) => s + (l.goodQty || 0), 0);
    const totalNG = lotNumbers.reduce((s, l) => s + (l.ngQty || 0), 0);
    const yieldRate = totalActual > 0 ? (totalGood / totalActual) * 100 : 100;
    return { totalLots, totalTarget, totalActual, totalGood, totalNG, yieldRate };
  }, [lotNumbers]);

  const handleExportCSV = () => {
    const headers = ['Nomor Lot', 'Tanggal', 'Part No', 'Nama Item', 'Target Qty', 'Actual Qty', 'Good Qty', 'NG Qty', 'UOM', 'Mesin / Line', 'Shift', 'Operator', 'Lot Bahan Baku', 'Status', 'Catatan'];
    const csvRows = filteredLots.map(l => [
      l.lotNumber,
      l.productionDate,
      l.partNo,
      `"${l.itemName}"`,
      l.targetQty,
      l.actualQty,
      l.goodQty,
      l.ngQty,
      l.uom,
      `"${l.machineLine}"`,
      l.shift,
      `"${l.operatorName}"`,
      l.rawMaterialLotNo || '-',
      l.status,
      `"${(l.notes || '').replace(/"/g, '""')}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...csvRows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Lot_Number_Produksi_${new Date().toISOString().split('T')[0]}.csv`);
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
      {/* Submenu Tabs Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3 bg-white p-4 rounded-xl shadow-xs">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
            <Factory className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">Production Control</h1>
            <p className="text-xs text-slate-500">Sistem Manufaktur, Penomoran Lot & Jadwal Rencana Produksi</p>
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

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase">Total Lot Produksi</span>
            <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
              <QrCode className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-slate-900">{kpis.totalLots} Batch</div>
          <div className="text-[11px] text-slate-500 mt-1">Aktif di lantai produksi</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase">Total Good Qty</span>
            <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-emerald-600">{kpis.totalGood.toLocaleString('id-ID')} PCS</div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-1">Lulus QC & Siap Kirim</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase">Total NG / Cacat</span>
            <div className="p-1.5 bg-rose-50 text-rose-600 rounded-lg">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-rose-600">{kpis.totalNG.toLocaleString('id-ID')} PCS</div>
          <div className="text-[11px] text-rose-600 mt-1 font-semibold">Tercatat di NG Report</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase">Yield Rate (Pencapaian)</span>
            <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
              <Cpu className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-blue-600">{kpis.yieldRate.toFixed(2)}%</div>
          <div className="text-[11px] text-slate-500 mt-1">Good Qty vs Actual Output</div>
        </div>
      </div>

      {/* Filter & Action Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Cari no. lot, part no, nama item, mesin, operator..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="all">Semua Status</option>
              <option value="in_progress">Sedang Proses</option>
              <option value="qc_pending">Menunggu QC</option>
              <option value="completed">Selesai (Lolos QC)</option>
              <option value="closed">Ditutup (Closed)</option>
              <option value="rejected">Ditolak (Reject)</option>
            </select>

            <select
              value={filterShift}
              onChange={e => setFilterShift(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="all">Semua Shift</option>
              <option value="Shift 1">Shift 1</option>
              <option value="Shift 2">Shift 2</option>
              <option value="Shift 3">Shift 3</option>
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
              <span>Buat Lot Baru</span>
            </button>
          </div>
        </div>
      </div>

      {/* Lot Number Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-3">Nomor Lot</th>
                <th className="py-3 px-3">Tanggal</th>
                <th className="py-3 px-3">Part No & Item Name</th>
                <th className="py-3 px-3">Mesin / Line</th>
                <th className="py-3 px-3">Shift / Operator</th>
                <th className="py-3 px-3 text-right">Target</th>
                <th className="py-3 px-3 text-right">Good Qty</th>
                <th className="py-3 px-3 text-right">NG Qty</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLots.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">
                    Tidak ada data nomor lot produksi yang sesuai.
                  </td>
                </tr>
              ) : (
                filteredLots.map(lot => {
                  const statusInfo = STATUS_CONFIG[lot.status] || STATUS_CONFIG.in_progress;
                  return (
                    <tr key={lot.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="font-mono font-bold text-indigo-600">{lot.lotNumber}</div>
                        <div className="text-[10px] text-slate-400">Raw: {lot.rawMaterialLotNo || '-'}</div>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap text-slate-700 font-medium">{lot.productionDate}</td>
                      <td className="py-3 px-3 min-w-[200px]">
                        <div className="font-bold text-slate-800">{lot.itemName}</div>
                        <div className="text-[10px] font-mono text-slate-500">Part No: {lot.partNo}</div>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap text-slate-700">
                        <div className="font-semibold">{lot.machineLine}</div>
                        <div className="text-[10px] text-slate-400">{lot.processName || '-'}</div>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap text-slate-700">
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-bold text-[10px] mr-1">
                          {lot.shift}
                        </span>
                        <span>{lot.operatorName}</span>
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-700">
                        {lot.targetQty.toLocaleString('id-ID')} {lot.uom}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-emerald-700">
                        {lot.goodQty.toLocaleString('id-ID')}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-rose-600">
                        {lot.ngQty.toLocaleString('id-ID')}
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${statusInfo.bg} ${statusInfo.text} ${statusInfo.border}`}>
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setViewingLot(lot)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                            title="Lihat Detail & Print Traveler"
                          >
                            <QrCode className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(lot)}
                            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                            title="Edit Lot"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Hapus Lot ${lot.lotNumber}?`)) {
                                onDeleteLotNumber(lot.id);
                              }
                            }}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Hapus Lot"
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
                  <QrCode className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  {editingLot ? `Edit Lot Produksi - ${editingLot.lotNumber}` : 'Buat Nomor Lot Baru'}
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
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nomor Lot Produksi</label>
                  <input
                    type="text"
                    required
                    value={formData.lotNumber}
                    onChange={e => setFormData({ ...formData, lotNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal Produksi</label>
                  <input
                    type="date"
                    required
                    value={formData.productionDate}
                    onChange={e => setFormData({ ...formData, productionDate: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Pilih Item Stock (Barang Jadi / Part)</label>
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
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mesin / Lini Produksi</label>
                  <input
                    type="text"
                    value={formData.machineLine}
                    onChange={e => setFormData({ ...formData, machineLine: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Proses Produksi</label>
                  <select
                    value={formData.processCode}
                    onChange={e => {
                      const proc = productionProcesses.find(p => p.code === e.target.value);
                      setFormData({
                        ...formData,
                        processCode: e.target.value,
                        processName: proc?.name || ''
                      });
                    }}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                  >
                    {productionProcesses.map(p => (
                      <option key={p.code} value={p.code}>{p.code} - {p.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Shift</label>
                  <select
                    value={formData.shift}
                    onChange={e => setFormData({ ...formData, shift: e.target.value as any })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold"
                  >
                    <option value="Shift 1">Shift 1 (07:00 - 15:30)</option>
                    <option value="Shift 2">Shift 2 (15:30 - 23:30)</option>
                    <option value="Shift 3">Shift 3 (23:30 - 07:00)</option>
                    <option value="Non-Shift">Non-Shift (Reguler)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Operator Penanggung Jawab</label>
                  <input
                    type="text"
                    value={formData.operatorName}
                    onChange={e => setFormData({ ...formData, operatorName: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Lot Bahan Baku (Traceability Ref)</label>
                  <input
                    type="text"
                    value={formData.rawMaterialLotNo}
                    onChange={e => setFormData({ ...formData, rawMaterialLotNo: e.target.value })}
                    placeholder="e.g. RAW-SPCC-20260318-01"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Status Lot</label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value as LotNumberStatus })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold"
                  >
                    <option value="in_progress">Sedang Proses</option>
                    <option value="qc_pending">Menunggu QC</option>
                    <option value="completed">Selesai (Lolos QC)</option>
                    <option value="closed">Ditutup (Closed)</option>
                    <option value="rejected">Ditolak (Reject)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Target Qty ({formData.uom})</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.targetQty}
                    onChange={e => setFormData({ ...formData, targetQty: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Actual Qty ({formData.uom})</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.actualQty}
                    onChange={e => setFormData({ ...formData, actualQty: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-emerald-700 mb-1">Good Qty ({formData.uom})</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.goodQty}
                    onChange={e => {
                      const good = Number(e.target.value);
                      const ng = Math.max(0, formData.actualQty - good);
                      setFormData({ ...formData, goodQty: good, ngQty: ng });
                    }}
                    className="w-full px-3 py-2 bg-emerald-50 border border-emerald-300 rounded-lg text-xs font-bold font-mono text-emerald-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-rose-700 mb-1">NG Qty ({formData.uom})</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.ngQty}
                    onChange={e => setFormData({ ...formData, ngQty: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-rose-50 border border-rose-300 rounded-lg text-xs font-bold font-mono text-rose-800"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Catatan Produksi</label>
                  <textarea
                    rows={2}
                    value={formData.notes}
                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Keterangan tambahan proses produksi..."
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
                  <span>Simpan Data Lot</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View / Print Lot Traveler Modal */}
      {viewingLot && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 my-8 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-extrabold text-slate-900">PRODUCTION LOT TRAVELER CARD</h3>
              </div>
              <button
                onClick={() => setViewingLot(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-slate-50 border border-dashed border-slate-300 rounded-xl space-y-3 font-mono text-xs">
              <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                <div>
                  <div className="text-[10px] text-slate-400">COMPANY</div>
                  <div className="font-bold text-slate-800">{companySettings?.companyName || 'SmartBudget Manufacturing'}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-slate-400">LOT NUMBER</div>
                  <div className="font-bold text-indigo-700 text-sm">{viewingLot.lotNumber}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-slate-400 block text-[9px]">PART NO:</span>
                  <span className="font-bold text-slate-800">{viewingLot.partNo}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9px]">PART NAME:</span>
                  <span className="font-bold text-slate-800">{viewingLot.itemName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9px]">TANGGAL / SHIFT:</span>
                  <span>{viewingLot.productionDate} ({viewingLot.shift})</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9px]">MESIN / LINE:</span>
                  <span>{viewingLot.machineLine}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9px]">OUTPUT / TARGET:</span>
                  <span className="font-bold">{viewingLot.actualQty} / {viewingLot.targetQty} {viewingLot.uom}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9px]">GOOD / NG:</span>
                  <span className="text-emerald-700 font-bold">{viewingLot.goodQty}</span> / <span className="text-rose-600 font-bold">{viewingLot.ngQty}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-400 block text-[9px]">RAW MATERIAL LOT REF:</span>
                  <span>{viewingLot.rawMaterialLotNo || '-'}</span>
                </div>
              </div>

              {/* Barcode Simulated Visual */}
              <div className="pt-3 border-t border-slate-200 text-center space-y-1">
                <div className="h-10 bg-slate-900 rounded flex items-center justify-center text-white tracking-[6px] text-xs font-bold">
                  ||||| | |||| ||| |||| | ||||| ||||
                </div>
                <div className="text-[10px] text-slate-500 font-mono">*{viewingLot.lotNumber}*</div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Kartu Traveler</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
