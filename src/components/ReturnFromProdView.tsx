import React, { useState, useMemo } from 'react';
import {
  RotateCcw,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileSpreadsheet,
  Printer,
  Edit2,
  Trash2,
  Eye,
  ShieldCheck,
  CheckSquare,
  Building2,
  Calendar,
  Layers,
  Boxes,
  Package,
  Clock,
  ArrowRight,
  Sparkles,
  Info,
  ChevronRight,
  X
} from 'lucide-react';
import * as XLSX from 'xlsx';
import {
  ReturnFromProdItem,
  ReturnCondition,
  ReturnStatus,
  AppUser,
  Department,
  InventoryItem,
  InventoryCategory
} from '../types';

interface ReturnFromProdViewProps {
  returnItems: ReturnFromProdItem[];
  inventoryItems?: InventoryItem[];
  departments: Department[];
  currentUser?: AppUser | null;
  onAddReturnItem: (item: Omit<ReturnFromProdItem, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateReturnItem: (id: string, updates: Partial<ReturnFromProdItem>) => void;
  onDeleteReturnItem: (id: string) => void;
  onCheckReturnItem: (id: string) => void;
  onApproveReturnItem: (id: string) => void;
  onRejectReturnItem: (id: string, reason: string) => void;
}

export const ReturnFromProdView: React.FC<ReturnFromProdViewProps> = ({
  returnItems,
  inventoryItems = [],
  departments,
  currentUser,
  onAddReturnItem,
  onUpdateReturnItem,
  onDeleteReturnItem,
  onCheckReturnItem,
  onApproveReturnItem,
  onRejectReturnItem
}) => {
  // Permission checks
  const isAdmin = currentUser?.role === 'admin';
  const canCheck = isAdmin || (currentUser?.actionPermissions && currentUser.actionPermissions.includes('check'));
  const canApprove = isAdmin || (currentUser?.actionPermissions && currentUser.actionPermissions.includes('approve'));
  const canReject = isAdmin || (currentUser?.actionPermissions && currentUser.actionPermissions.includes('reject'));

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [conditionFilter, setConditionFilter] = useState<string>('all');
  const [deptFilter, setDeptFilter] = useState<string>('all');

  // Modals
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ReturnFromProdItem | null>(null);
  const [detailItem, setDetailItem] = useState<ReturnFromProdItem | null>(null);
  const [rejectingItem, setRejectingItem] = useState<ReturnFromProdItem | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Form Fields
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [deptCode, setDeptCode] = useState<string>('CF');
  const [productionBatchNo, setProductionBatchNo] = useState<string>('');
  const [workOrderNo, setWorkOrderNo] = useState<string>('');
  const [shift, setShift] = useState<string>('Shift 1 (Pagi)');
  const [itemCode, setItemCode] = useState<string>('');
  const [partNo, setPartNo] = useState<string>('');
  const [itemName, setItemName] = useState<string>('');
  const [category, setCategory] = useState<InventoryCategory>('raw_material');
  const [uom, setUom] = useState<string>('KG');
  const [qty, setQty] = useState<number>(1);
  const [condition, setCondition] = useState<ReturnCondition>('good');
  const [reason, setReason] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [receivedLocation, setReceivedLocation] = useState<string>('WH-RM-RACK-01');
  const [formError, setFormError] = useState<string>('');

  // Auto-generate Return No
  const generateReturnNo = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const count = (returnItems.length + 1).toString().padStart(3, '0');
    return `RET/PRD/${year}/${month}/${count}`;
  };

  // Open Add Modal
  const handleOpenAddModal = () => {
    setEditingItem(null);
    setDate(new Date().toISOString().split('T')[0]);
    setDeptCode(departments[0]?.code || 'CF');
    setProductionBatchNo(`LOT-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-01`);
    setWorkOrderNo(`WO-${Date.now().toString().slice(-4)}`);
    setShift('Shift 1 (Pagi)');
    setItemCode('');
    setPartNo('');
    setItemName('');
    setCategory('raw_material');
    setUom('KG');
    setQty(1);
    setCondition('good');
    setReason('');
    setNotes('');
    setReceivedLocation('WH-RM-RACK-01');
    setFormError('');
    setIsFormModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (item: ReturnFromProdItem) => {
    setEditingItem(item);
    setDate(item.date);
    setDeptCode(item.deptCode);
    setProductionBatchNo(item.productionBatchNo || '');
    setWorkOrderNo(item.workOrderNo || '');
    setShift(item.shift || 'Shift 1 (Pagi)');
    setItemCode(item.itemCode);
    setPartNo(item.partNo || '');
    setItemName(item.itemName);
    setCategory(item.category);
    setUom(item.uom);
    setQty(item.qty);
    setCondition(item.condition);
    setReason(item.reason);
    setNotes(item.notes || '');
    setReceivedLocation(item.receivedLocation);
    setFormError('');
    setIsFormModalOpen(true);
  };

  // Select Item from Inventory suggestions
  const handleSelectInventoryItem = (inv: InventoryItem) => {
    setItemCode(inv.itemCode);
    setPartNo(inv.partNo || '');
    setItemName(inv.name);
    setUom(inv.uom);
    if (inv.category === 'raw_material') {
      setCategory('raw_material');
      setReceivedLocation(inv.location || 'WH-RM-RACK-01');
    } else if (inv.category === 'mold_sparepart') {
      setCategory('mold_sparepart');
      setReceivedLocation(inv.location || 'WH-MOLD-AREA');
    } else if (inv.category === 'wip') {
      setCategory('wip');
      setReceivedLocation(inv.location || 'WH-WIP-HOLD');
    } else if (inv.category === 'finish_good') {
      setCategory('finish_good');
      setReceivedLocation(inv.location || 'WH-FG-RACK-01');
    } else {
      setCategory('raw_material');
      setReceivedLocation(inv.location || 'WH-MAIN');
    }
  };

  // Form Submit
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!itemCode.trim() || !itemName.trim() || !reason.trim() || qty <= 0) {
      setFormError('Mohon lengkapi kode item, nama item, kuantitas (> 0), dan alasan pengembalian.');
      return;
    }

    const deptObj = departments.find(d => d.code === deptCode);

    if (editingItem) {
      onUpdateReturnItem(editingItem.id, {
        date,
        deptCode,
        deptName: deptObj?.name || deptCode,
        productionBatchNo: productionBatchNo.trim(),
        workOrderNo: workOrderNo.trim(),
        shift,
        itemCode: itemCode.trim(),
        partNo: partNo.trim(),
        itemName: itemName.trim(),
        category,
        uom: uom.trim().toUpperCase(),
        qty: Number(qty),
        condition,
        reason: reason.trim(),
        notes: notes.trim(),
        receivedLocation: receivedLocation.trim()
      });
    } else {
      onAddReturnItem({
        returnNo: generateReturnNo(),
        date,
        deptCode,
        deptName: deptObj?.name || deptCode,
        productionBatchNo: productionBatchNo.trim(),
        workOrderNo: workOrderNo.trim(),
        shift,
        itemCode: itemCode.trim(),
        partNo: partNo.trim(),
        itemName: itemName.trim(),
        category,
        uom: uom.trim().toUpperCase(),
        qty: Number(qty),
        condition,
        reason: reason.trim(),
        notes: notes.trim(),
        receivedLocation: receivedLocation.trim(),
        returnedBy: currentUser?.name || 'Staff Produksi',
        receivedBy: 'Warehouse Staff',
        status: 'draft'
      });
    }

    setIsFormModalOpen(false);
  };

  // Open Reject Modal
  const handleOpenRejectModal = (item: ReturnFromProdItem) => {
    setRejectingItem(item);
    setRejectReason('');
  };

  const handleConfirmReject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingItem) return;
    if (!rejectReason.trim()) {
      alert('Alasan penolakan (Reject) wajib diisi.');
      return;
    }
    onRejectReturnItem(rejectingItem.id, rejectReason.trim());
    setRejectingItem(null);
  };

  // Filtered Items
  const filteredItems = useMemo(() => {
    return returnItems.filter(item => {
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        item.returnNo.toLowerCase().includes(q) ||
        item.itemCode.toLowerCase().includes(q) ||
        (item.partNo && item.partNo.toLowerCase().includes(q)) ||
        item.itemName.toLowerCase().includes(q) ||
        (item.productionBatchNo && item.productionBatchNo.toLowerCase().includes(q)) ||
        (item.workOrderNo && item.workOrderNo.toLowerCase().includes(q)) ||
        item.reason.toLowerCase().includes(q);

      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      const matchesCondition = conditionFilter === 'all' || item.condition === conditionFilter;
      const matchesDept = deptFilter === 'all' || item.deptCode === deptFilter;

      return matchesSearch && matchesStatus && matchesCondition && matchesDept;
    });
  }, [returnItems, searchTerm, statusFilter, conditionFilter, deptFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = returnItems.length;
    const draft = returnItems.filter(i => i.status === 'draft').length;
    const checked = returnItems.filter(i => i.status === 'checked').length;
    const approved = returnItems.filter(i => i.status === 'approved').length;
    const rejected = returnItems.filter(i => i.status === 'rejected').length;
    return { total, draft, checked, approved, rejected };
  }, [returnItems]);

  // Export to Excel
  const handleExportExcel = () => {
    const dataToExport = filteredItems.map(item => ({
      'No. Dokumen': item.returnNo,
      'Tanggal': item.date,
      'Departemen': `${item.deptCode} - ${item.deptName || ''}`,
      'No. Batch / Lot': item.productionBatchNo || '-',
      'No. SPK / WO': item.workOrderNo || '-',
      'Shift': item.shift || '-',
      'Kode Item': item.itemCode,
      'Part No': item.partNo || '-',
      'Nama Item': item.itemName,
      'Kategori': item.category,
      'Qty': item.qty,
      'Satuan': item.uom,
      'Kondisi': item.condition === 'good' ? 'Baik (Sisa)' : item.condition === 'rework' ? 'Rework' : item.condition === 'sortir' ? 'Sortir' : item.condition === 'damaged' ? 'Rusak' : 'Scrap',
      'Alasan Pengembalian': item.reason,
      'Lokasi Simpan': item.receivedLocation,
      'Status': item.status.toUpperCase(),
      'Diperiksa Oleh': item.checkedBy || '-',
      'Tanggal Periksa': item.checkedAt ? new Date(item.checkedAt).toLocaleString('id-ID') : '-',
      'Disetujui Oleh': item.approvedBy || '-',
      'Tanggal Setuju': item.approvedAt ? new Date(item.approvedAt).toLocaleString('id-ID') : '-',
      'Ditolak Oleh': item.rejectedBy || '-',
      'Alasan Ditolak': item.rejectionReason || '-'
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Return_From_Prod');
    XLSX.writeFile(wb, `Pengembalian_Inventory_Produksi_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // Helper Badge Colors
  const getStatusBadge = (status: ReturnStatus) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Approved</span>
          </span>
        );
      case 'checked':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <CheckSquare className="w-3.5 h-3.5 text-blue-600" />
            <span>Checked</span>
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            <span>Rejected</span>
          </span>
        );
      case 'draft':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>Draft</span>
          </span>
        );
    }
  };

  const getConditionBadge = (cond: ReturnCondition) => {
    switch (cond) {
      case 'good':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800">
            Baik (Sisa Material)
          </span>
        );
      case 'sortir':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-100 text-amber-800">
            Perlu Sortir
          </span>
        );
      case 'rework':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-100 text-blue-800">
            Perlu Rework
          </span>
        );
      case 'damaged':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-orange-100 text-orange-800">
            Rusak
          </span>
        );
      case 'scrap':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-100 text-rose-800">
            Scrap / Afval
          </span>
        );
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Banner & Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center shrink-0">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-slate-900">
                  Return from Prod (Pengembalian Inventory Produksi)
                </h1>
                <span className="bg-teal-100 text-teal-800 text-xs font-bold px-2.5 py-0.5 rounded-full border border-teal-200">
                  Submenu Inventory
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 max-w-3xl leading-relaxed">
                Pencatatan serah terima fisik pengembalian sisa bahan baku, cetakan/tooling mesin aus,
                atau produk WIP dari lini produksi ke gudang penyimpanan, dilengkapi hak otorisasi Check, Approve, dan Reject.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-center">
            <button
              onClick={handleExportExcel}
              className="px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Unduh laporan Excel"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Export Excel</span>
            </button>
            <button
              onClick={handleOpenAddModal}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-sm hover:shadow"
            >
              <Plus className="w-4 h-4" />
              <span>Input Pengembalian Baru</span>
            </button>
          </div>
        </div>

        {/* User Permission Awareness Strip */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-600">
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            <span className="font-semibold text-slate-700">Wewenang Akun Anda ({currentUser?.name || 'User'}):</span>
            <div className="flex items-center gap-1.5">
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold ${
                  canCheck
                    ? 'bg-blue-100 text-blue-800 border border-blue-200'
                    : 'bg-slate-100 text-slate-400 line-through'
                }`}
              >
                <CheckSquare className="w-3 h-3" />
                <span>Check (Pemeriksa)</span>
              </span>
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold ${
                  canApprove
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : 'bg-slate-100 text-slate-400 line-through'
                }`}
              >
                <CheckCircle2 className="w-3 h-3" />
                <span>Approve (Penyetuju)</span>
              </span>
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold ${
                  canReject
                    ? 'bg-rose-100 text-rose-800 border border-rose-200'
                    : 'bg-slate-100 text-slate-400 line-through'
                }`}
              >
                <XCircle className="w-3 h-3" />
                <span>Reject (Penolak)</span>
              </span>
            </div>
          </div>
          <span className="text-[11px] text-slate-400">
            *Dapat dikonfigurasi melalui menu <strong>Manajemen User</strong>
          </span>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Retur</div>
          <div className="text-xl font-bold text-slate-900 mt-1">{stats.total}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Semua dokumen</div>
        </div>

        <div className="bg-white border border-amber-200 rounded-xl p-3.5 shadow-xs bg-amber-50/20">
          <div className="text-[11px] font-bold text-amber-700 uppercase tracking-wider flex items-center justify-between">
            <span>Draft</span>
            <Clock className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="text-xl font-bold text-amber-900 mt-1">{stats.draft}</div>
          <div className="text-[11px] text-amber-600 mt-0.5">Menunggu dicek</div>
        </div>

        <div className="bg-white border border-blue-200 rounded-xl p-3.5 shadow-xs bg-blue-50/20">
          <div className="text-[11px] font-bold text-blue-700 uppercase tracking-wider flex items-center justify-between">
            <span>Checked</span>
            <CheckSquare className="w-3.5 h-3.5 text-blue-500" />
          </div>
          <div className="text-xl font-bold text-blue-900 mt-1">{stats.checked}</div>
          <div className="text-[11px] text-blue-600 mt-0.5">Siap di-approve</div>
        </div>

        <div className="bg-white border border-emerald-200 rounded-xl p-3.5 shadow-xs bg-emerald-50/20">
          <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider flex items-center justify-between">
            <span>Approved</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div className="text-xl font-bold text-emerald-900 mt-1">{stats.approved}</div>
          <div className="text-[11px] text-emerald-600 mt-0.5">Masuk stok gudang</div>
        </div>

        <div className="bg-white border border-rose-200 rounded-xl p-3.5 shadow-xs bg-rose-50/20 col-span-2 sm:col-span-1">
          <div className="text-[11px] font-bold text-rose-700 uppercase tracking-wider flex items-center justify-between">
            <span>Rejected</span>
            <XCircle className="w-3.5 h-3.5 text-rose-500" />
          </div>
          <div className="text-xl font-bold text-rose-900 mt-1">{stats.rejected}</div>
          <div className="text-[11px] text-rose-600 mt-0.5">Ditolak verifikasi</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari No. Retur, item, batch..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:outline-hidden focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto flex-wrap">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-500 text-[11px] font-medium">Status:</span>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-teal-500 cursor-pointer"
            >
              <option value="all">Semua Status</option>
              <option value="draft">Draft (Menunggu Cek)</option>
              <option value="checked">Checked (Siap Approve)</option>
              <option value="approved">Approved (Disetujui)</option>
              <option value="rejected">Rejected (Ditolak)</option>
            </select>
          </div>

          {/* Condition Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-500 text-[11px] font-medium">Kondisi:</span>
            <select
              value={conditionFilter}
              onChange={e => setConditionFilter(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-teal-500 cursor-pointer"
            >
              <option value="all">Semua Kondisi</option>
              <option value="good">Baik (Sisa Material)</option>
              <option value="rework">Perlu Rework</option>
              <option value="damaged">Rusak</option>
              <option value="scrap">Scrap / Afval</option>
            </select>
          </div>

          {/* Dept Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-500 text-[11px] font-medium">Dept:</span>
            <select
              value={deptFilter}
              onChange={e => setDeptFilter(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-teal-500 cursor-pointer"
            >
              <option value="all">Semua Dept</option>
              {departments.map(d => (
                <option key={d.code} value={d.code}>
                  {d.code} - {d.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-700 font-bold">
                <th className="p-3">No. Dokumen &amp; Tgl</th>
                <th className="p-3">Dept &amp; Shift</th>
                <th className="p-3">Item &amp; Part No</th>
                <th className="p-3">Qty Retur</th>
                <th className="p-3">Kondisi</th>
                <th className="p-3">Alasan Pengembalian</th>
                <th className="p-3">Lokasi WH</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-center">Otorisasi (Check / Approve / Reject)</th>
                <th className="p-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-400 italic">
                    Belum ada data pengembalian inventory dari produksi yang sesuai dengan filter.
                  </td>
                </tr>
              ) : (
                filteredItems.map(item => {
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition">
                      {/* No & Tgl */}
                      <td className="p-3">
                        <div className="font-bold text-teal-800 font-mono">{item.returnNo}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">{item.date}</div>
                        {item.workOrderNo && (
                          <div className="text-[10px] text-slate-400">WO: {item.workOrderNo}</div>
                        )}
                      </td>

                      {/* Dept & Shift */}
                      <td className="p-3">
                        <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                          {item.deptCode}
                        </span>
                        <div className="text-[11px] text-slate-500 mt-1">{item.shift || '-'}</div>
                        {item.productionBatchNo && (
                          <div className="text-[10px] text-slate-400 font-mono">Lot: {item.productionBatchNo}</div>
                        )}
                      </td>

                      {/* Item & Part No */}
                      <td className="p-3">
                        <div className="font-bold text-slate-900">{item.itemName}</div>
                        <div className="text-[11px] text-slate-500 font-mono">Kode: {item.itemCode}</div>
                        {item.partNo && (
                          <div className="text-[11px] text-slate-400">Part: {item.partNo}</div>
                        )}
                      </td>

                      {/* Qty & UOM */}
                      <td className="p-3">
                        <span className="font-bold text-slate-900 text-sm">{item.qty.toLocaleString('id-ID')}</span>{' '}
                        <span className="text-slate-500 font-medium">{item.uom}</span>
                      </td>

                      {/* Kondisi */}
                      <td className="p-3 whitespace-nowrap">
                        {getConditionBadge(item.condition)}
                      </td>

                      {/* Alasan */}
                      <td className="p-3 max-w-xs">
                        <p className="line-clamp-2 text-slate-700" title={item.reason}>
                          {item.reason}
                        </p>
                      </td>

                      {/* Lokasi Simpan */}
                      <td className="p-3 font-mono text-[11px] text-slate-600">
                        {item.receivedLocation}
                      </td>

                      {/* Status */}
                      <td className="p-3 text-center whitespace-nowrap">
                        {getStatusBadge(item.status)}
                      </td>

                      {/* Otorisasi Workflow Buttons */}
                      <td className="p-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* CHECK BUTTON */}
                          {item.status === 'draft' ? (
                            <button
                              onClick={() => onCheckReturnItem(item.id)}
                              disabled={!canCheck}
                              className={`px-2 py-1 rounded text-xs font-bold flex items-center gap-1 transition ${
                                canCheck
                                  ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer shadow-xs'
                                  : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60'
                              }`}
                              title={canCheck ? 'Klik untuk verifikasi fisik (Check)' : 'Anda tidak memiliki wewenang Check'}
                            >
                              <CheckSquare className="w-3.5 h-3.5" />
                              <span>Check</span>
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">
                              {item.checkedBy ? `Checked: ${item.checkedBy.split(' ')[0]}` : '-'}
                            </span>
                          )}

                          {/* APPROVE BUTTON */}
                          {item.status === 'checked' ? (
                            <button
                              onClick={() => onApproveReturnItem(item.id)}
                              disabled={!canApprove}
                              className={`px-2 py-1 rounded text-xs font-bold flex items-center gap-1 transition ${
                                canApprove
                                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-xs'
                                  : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60'
                              }`}
                              title={canApprove ? 'Klik untuk menyetujui (Approve) & masukkan ke stok' : 'Anda tidak memiliki wewenang Approve'}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Approve</span>
                            </button>
                          ) : null}

                          {/* REJECT BUTTON */}
                          {(item.status === 'draft' || item.status === 'checked') ? (
                            <button
                              onClick={() => handleOpenRejectModal(item)}
                              disabled={!canReject}
                              className={`px-2 py-1 rounded text-xs font-bold flex items-center gap-1 transition ${
                                canReject
                                  ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 cursor-pointer'
                                  : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60'
                              }`}
                              title={canReject ? 'Klik untuk menolak (Reject) dokumen' : 'Anda tidak memiliki wewenang Reject'}
                            >
                              <XCircle className="w-3.5 h-3.5 text-rose-600" />
                              <span>Reject</span>
                            </button>
                          ) : null}
                        </div>
                      </td>

                      {/* Actions (View, Edit, Delete) */}
                      <td className="p-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setDetailItem(item)}
                            className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded transition cursor-pointer"
                            title="Lihat Detail & Bukti Serah Terima"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {item.status !== 'approved' && (
                            <button
                              onClick={() => handleOpenEditModal(item)}
                              className="p-1 text-slate-500 hover:text-teal-600 hover:bg-slate-100 rounded transition cursor-pointer"
                              title="Edit Data Pengembalian"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}

                          {item.status !== 'approved' && (
                            <button
                              onClick={() => {
                                if (window.confirm(`Hapus dokumen retur ${item.returnNo}?`)) {
                                  onDeleteReturnItem(item.id);
                                }
                              }}
                              className="p-1 text-slate-500 hover:text-rose-600 hover:bg-slate-100 rounded transition cursor-pointer"
                              title="Hapus Dokumen"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
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

      {/* ===================== ADD / EDIT MODAL ===================== */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden my-8">
            <div className="px-6 py-4 bg-teal-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-5 h-5" />
                <h3 className="font-bold text-sm">
                  {editingItem ? 'Edit Dokumen Pengembalian Produksi' : 'Input Pengembalian Inventory dari Produksi'}
                </h3>
              </div>
              <button
                onClick={() => setIsFormModalOpen(false)}
                className="text-teal-100 hover:text-white rounded-lg p-1 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Suggestions from Inventory */}
              {inventoryItems.length > 0 && !editingItem && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                    <span>Pilih Cepat dari Master Inventory yang Tersedia:</span>
                  </label>
                  <select
                    onChange={e => {
                      const found = inventoryItems.find(inv => inv.id === e.target.value);
                      if (found) handleSelectInventoryItem(found);
                    }}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-teal-500 cursor-pointer"
                    defaultValue=""
                  >
                    <option value="">-- Pilih item untuk otomatis mengisi data --</option>
                    {inventoryItems.map(inv => (
                      <option key={inv.id} value={inv.id}>
                        [{inv.category.toUpperCase()}] {inv.itemCode} - {inv.name} ({inv.uom})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal Retur *</label>
                  <input
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    required
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Departemen Produksi *</label>
                  <select
                    value={deptCode}
                    onChange={e => setDeptCode(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-teal-500"
                  >
                    {departments.map(d => (
                      <option key={d.code} value={d.code}>
                        {d.code} - {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Shift Kerja</label>
                  <select
                    value={shift}
                    onChange={e => setShift(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="Shift 1 (Pagi)">Shift 1 (Pagi)</option>
                    <option value="Shift 2 (Siang)">Shift 2 (Siang)</option>
                    <option value="Shift 3 (Malam)">Shift 3 (Malam)</option>
                    <option value="Non-Shift">Non-Shift</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">No. Batch / Lot Produksi</label>
                  <input
                    type="text"
                    placeholder="Contoh: LOT-20260318-CF1"
                    value={productionBatchNo}
                    onChange={e => setProductionBatchNo(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-teal-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">No. SPK / Work Order</label>
                  <input
                    type="text"
                    placeholder="Contoh: WO-CF-0089"
                    value={workOrderNo}
                    onChange={e => setWorkOrderNo(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-teal-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Kode Item *</label>
                  <input
                    type="text"
                    placeholder="Kode item..."
                    value={itemCode}
                    onChange={e => setItemCode(e.target.value)}
                    required
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-teal-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Part Number</label>
                  <input
                    type="text"
                    placeholder="Part number..."
                    value={partNo}
                    onChange={e => setPartNo(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-teal-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Kategori Barang *</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value as any)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="raw_material">Raw Material (Bahan Baku)</option>
                    <option value="mold_sparepart">Mold &amp; Spare Part (Dies/Tooling)</option>
                    <option value="wip">Work In Process (Setengah Jadi)</option>
                    <option value="other">Lain-lain / Consumables</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Deskripsi Item *</label>
                <input
                  type="text"
                  placeholder="Nama lengkap barang..."
                  value={itemName}
                  onChange={e => setItemName(e.target.value)}
                  required
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Kuantitas Retur *</label>
                  <input
                    type="number"
                    step="any"
                    min="0.001"
                    value={qty}
                    onChange={e => setQty(parseFloat(e.target.value) || 0)}
                    required
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Satuan (UOM) *</label>
                  <input
                    type="text"
                    placeholder="KG / PCS / SET / SHEET"
                    value={uom}
                    onChange={e => setUom(e.target.value)}
                    required
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono uppercase focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Kondisi Barang *</label>
                  <select
                    value={condition}
                    onChange={e => setCondition(e.target.value as ReturnCondition)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="good">Baik (Sisa Material)</option>
                    <option value="rework">Perlu Rework (Aus/Polishing)</option>
                    <option value="damaged">Rusak (Karantina MRB)</option>
                    <option value="scrap">Scrap / Afval</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Alasan Pengembalian *</label>
                  <textarea
                    rows={2}
                    placeholder="Contoh: Sisa material batch running selesai, kelebihan penimbangan..."
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                    required
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Lokasi Gudang Penerimaan *</label>
                  <input
                    type="text"
                    placeholder="Contoh: WH-RM-RACK-01, WH-MOLD-2R..."
                    value={receivedLocation}
                    onChange={e => setReceivedLocation(e.target.value)}
                    required
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-teal-500 mb-2"
                  />
                  <label className="block text-xs font-bold text-slate-700 mb-1">Catatan Tambahan</label>
                  <input
                    type="text"
                    placeholder="Keterangan pengemasan, label, dsb."
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 text-xs font-medium cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-lg transition shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{editingItem ? 'Simpan Perubahan' : 'Buat Dokumen Pengembalian'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== REJECT MODAL ===================== */}
      {rejectingItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-5 py-4 bg-rose-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <XCircle className="w-5 h-5" />
                <h3 className="font-bold text-sm">Tolak Dokumen Pengembalian (Reject)</h3>
              </div>
              <button
                onClick={() => setRejectingItem(null)}
                className="text-rose-100 hover:text-white rounded-lg p-1 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmReject} className="p-5 space-y-4">
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
                <p className="font-bold">{rejectingItem.returnNo}</p>
                <p className="text-[11px] mt-0.5 text-rose-700">
                  {rejectingItem.itemName} ({rejectingItem.qty} {rejectingItem.uom})
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Alasan Penolakan (Wajib Diisi) *
                </label>
                <textarea
                  rows={3}
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  placeholder="Jelaskan alasan mengapa pengembalian barang ini ditolak (misal: jumlah fisik tidak sesuai, cacat di luar toleransi, label hilang)..."
                  required
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setRejectingItem(null)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 text-xs font-medium cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg transition shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Konfirmasi Reject</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== DETAIL / PRINT MODAL ===================== */}
      {detailItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden my-8">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-teal-400" />
                <h3 className="font-bold text-sm">
                  Bukti Pengembalian Barang Produksi (BPBP) - {detailItem.returnNo}
                </h3>
              </div>
              <button
                onClick={() => setDetailItem(null)}
                className="text-slate-400 hover:text-white rounded-lg p-1 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 text-xs">
              {/* Header Box */}
              <div className="flex items-start justify-between border-b border-slate-200 pb-4">
                <div>
                  <div className="text-base font-bold text-slate-900">{detailItem.returnNo}</div>
                  <div className="text-slate-500 mt-0.5">Tanggal: {detailItem.date}</div>
                  <div className="text-slate-500">Departemen: {detailItem.deptCode} - {detailItem.deptName}</div>
                </div>
                <div className="text-right">
                  <div>{getStatusBadge(detailItem.status)}</div>
                  <div className="mt-1">{getConditionBadge(detailItem.condition)}</div>
                </div>
              </div>

              {/* Specs Grid */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <div className="text-[11px] text-slate-400">Nama Barang</div>
                  <div className="font-bold text-slate-900 text-sm mt-0.5">{detailItem.itemName}</div>
                  <div className="text-[11px] text-slate-500 font-mono mt-1">Kode: {detailItem.itemCode}</div>
                  {detailItem.partNo && <div className="text-[11px] text-slate-500">Part No: {detailItem.partNo}</div>}
                </div>

                <div>
                  <div className="text-[11px] text-slate-400">Jumlah Dikembalikan</div>
                  <div className="font-bold text-teal-700 text-base mt-0.5">
                    {detailItem.qty.toLocaleString('id-ID')} {detailItem.uom}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">Lokasi Masuk: {detailItem.receivedLocation}</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Informasi Produksi &amp; Alasan
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-2 bg-slate-100 rounded-lg">
                    <span className="text-slate-400 block text-[10px]">No. Lot/Batch:</span>
                    <span className="font-mono font-bold text-slate-800">{detailItem.productionBatchNo || '-'}</span>
                  </div>
                  <div className="p-2 bg-slate-100 rounded-lg">
                    <span className="text-slate-400 block text-[10px]">No. Work Order:</span>
                    <span className="font-mono font-bold text-slate-800">{detailItem.workOrderNo || '-'}</span>
                  </div>
                  <div className="p-2 bg-slate-100 rounded-lg">
                    <span className="text-slate-400 block text-[10px]">Shift:</span>
                    <span className="font-bold text-slate-800">{detailItem.shift || '-'}</span>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl mt-2">
                  <span className="text-slate-500 font-semibold block mb-0.5">Alasan Pengembalian:</span>
                  <p className="text-slate-800">{detailItem.reason}</p>
                  {detailItem.notes && (
                    <p className="text-slate-500 mt-1 italic text-[11px]">Catatan: {detailItem.notes}</p>
                  )}
                </div>
              </div>

              {/* Approval History Matrix */}
              <div>
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Matriks Jejak Otorisasi &amp; Serah Terima
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  {/* Step 1: Dibuat */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">1. Pengaju (Produksi)</div>
                    <div className="font-bold text-slate-800 mt-1">{detailItem.deptCode}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{detailItem.date}</div>
                    <span className="inline-block mt-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                      Tercatat
                    </span>
                  </div>

                  {/* Step 2: Checked */}
                  <div className={`p-3 border rounded-xl ${
                    detailItem.checkedBy ? 'bg-blue-50/50 border-blue-200' : 'bg-slate-50 border-slate-200 opacity-60'
                  }`}>
                    <div className="text-[10px] text-slate-400 font-bold uppercase">2. Diperiksa (Checker)</div>
                    <div className="font-bold text-slate-800 mt-1">{detailItem.checkedBy || '-'}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {detailItem.checkedAt ? new Date(detailItem.checkedAt).toLocaleDateString('id-ID') : 'Menunggu'}
                    </div>
                    {detailItem.checkedBy ? (
                      <span className="inline-block mt-1 text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                        Verified
                      </span>
                    ) : (
                      <span className="inline-block mt-1 text-[10px] text-slate-400">Pending</span>
                    )}
                  </div>

                  {/* Step 3: Approved / Rejected */}
                  <div className={`p-3 border rounded-xl ${
                    detailItem.status === 'approved'
                      ? 'bg-emerald-50/50 border-emerald-200'
                      : detailItem.status === 'rejected'
                      ? 'bg-rose-50/50 border-rose-200'
                      : 'bg-slate-50 border-slate-200 opacity-60'
                  }`}>
                    <div className="text-[10px] text-slate-400 font-bold uppercase">3. Disetujui (Approver)</div>
                    <div className="font-bold text-slate-800 mt-1">
                      {detailItem.approvedBy || detailItem.rejectedBy || '-'}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {detailItem.approvedAt
                        ? new Date(detailItem.approvedAt).toLocaleDateString('id-ID')
                        : detailItem.rejectedAt
                        ? new Date(detailItem.rejectedAt).toLocaleDateString('id-ID')
                        : 'Menunggu'}
                    </div>
                    {detailItem.status === 'approved' && (
                      <span className="inline-block mt-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                        Approved
                      </span>
                    )}
                    {detailItem.status === 'rejected' && (
                      <span className="inline-block mt-1 text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded">
                        Rejected
                      </span>
                    )}
                  </div>
                </div>

                {detailItem.rejectionReason && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl mt-3 text-xs text-rose-800">
                    <span className="font-bold block">Catatan Penolakan (Rejection Reason):</span>
                    <p className="mt-0.5">{detailItem.rejectionReason}</p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak Dokumen</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDetailItem(null)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 text-xs font-medium cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
