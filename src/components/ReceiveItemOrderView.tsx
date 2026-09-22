import React, { useState, useMemo } from 'react';
import {
  PackageCheck,
  Plus,
  FileSpreadsheet,
  Printer,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  Edit2,
  Trash2,
  Truck,
  X,
  Building2,
  Layers,
  ArrowRight,
  ShieldCheck,
  Check,
  XCircle,
  FileCheck2,
  Calendar,
  Eye,
  AlertCircle,
  ClipboardList,
  MapPin,
  UserCheck
} from 'lucide-react';
import * as XLSX from 'xlsx';
import {
  ReceiveItemOrder,
  ReceiveItemOrderLine,
  ReceiveItemOrderStatus,
  PurchaseOrder,
  Supplier,
  ItemStock,
  AppUser,
  CompanySettings
} from '../types';

interface ReceiveItemOrderViewProps {
  receiveOrders: ReceiveItemOrder[];
  purchaseOrders: PurchaseOrder[];
  suppliers: Supplier[];
  itemStocks?: ItemStock[];
  currentUser: AppUser | null;
  companySettings?: CompanySettings;
  onAddReceiveOrder: (order: Omit<ReceiveItemOrder, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateReceiveOrder: (id: string, updates: Partial<ReceiveItemOrder>) => void;
  onDeleteReceiveOrder: (id: string) => void;
  onCheckReceiveOrder?: (id: string, userName: string) => void;
  onApproveReceiveOrder?: (id: string, userName: string) => void;
  onRejectReceiveOrder?: (id: string, userName: string, reason: string) => void;
  activePurchaseTab?: string;
  onSwitchPurchaseTab?: (tab: string) => void;
}

const STATUS_BADGES: Record<ReceiveItemOrderStatus, { label: string; bg: string; text: string; border: string }> = {
  draft: { label: 'Draft', bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300' },
  inspected: { label: 'Telah Diinspeksi QC', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  received: { label: 'Diterima Lengkap', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  partial: { label: 'Diterima Sebagian', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  rejected: { label: 'Ditolak Gudang/QC', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
};

const QC_BADGES: Record<string, { label: string; bg: string; text: string }> = {
  passed: { label: 'QC Lolos', bg: 'bg-emerald-100', text: 'text-emerald-800' },
  partial_pass: { label: 'QC Sebagian', bg: 'bg-amber-100', text: 'text-amber-800' },
  failed: { label: 'QC Gagal', bg: 'bg-rose-100', text: 'text-rose-800' },
  pending: { label: 'Menunggu QC', bg: 'bg-slate-100', text: 'text-slate-700' },
};

export const ReceiveItemOrderView: React.FC<ReceiveItemOrderViewProps> = ({
  receiveOrders = [],
  purchaseOrders = [],
  suppliers = [],
  currentUser,
  companySettings,
  onAddReceiveOrder,
  onUpdateReceiveOrder,
  onDeleteReceiveOrder,
  onCheckReceiveOrder,
  onApproveReceiveOrder,
  onRejectReceiveOrder,
  activePurchaseTab = 'receive-item-order',
  onSwitchPurchaseTab
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSupplier, setFilterSupplier] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<ReceiveItemOrder | null>(null);
  const [viewingOrder, setViewingOrder] = useState<ReceiveItemOrder | null>(null);
  const [printOrder, setPrintOrder] = useState<ReceiveItemOrder | null>(null);
  const [rejectModalOrder, setRejectModalOrder] = useState<ReceiveItemOrder | null>(null);
  const [rejectReasonInput, setRejectReasonInput] = useState('');

  // Form State for Create/Edit Modal
  const [formData, setFormData] = useState({
    receiveNumber: '',
    date: new Date().toISOString().split('T')[0],
    poNumber: '',
    deliveryOrderNo: '',
    deliveryOrderDate: new Date().toISOString().split('T')[0],
    supplierCode: '',
    supplierName: '',
    receivedBy: currentUser?.name || 'Petugas Gudang',
    warehouseLocation: 'WH-MAIN-RAW (Gudang Utama)',
    driverName: '',
    vehiclePlateNumber: '',
    status: 'received' as ReceiveItemOrderStatus,
    qcStatus: 'passed' as 'passed' | 'partial_pass' | 'failed' | 'pending',
    qcInspector: 'Tim QC Receiving',
    notes: '',
    items: [] as ReceiveItemOrderLine[]
  });

  // Filtered List
  const filteredOrders = useMemo(() => {
    return receiveOrders.filter(ord => {
      const matchSearch =
        (ord.receiveNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (ord.deliveryOrderNo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (ord.poNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (ord.supplierName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (ord.receivedBy || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchSup = !filterSupplier || ord.supplierCode === filterSupplier;
      const matchStat = filterStatus === 'all' || ord.status === filterStatus;

      return matchSearch && matchSup && matchStat;
    });
  }, [receiveOrders, searchTerm, filterSupplier, filterStatus]);

  // Statistics
  const stats = useMemo(() => {
    const total = receiveOrders.length;
    const received = receiveOrders.filter(r => r.status === 'received').length;
    const partial = receiveOrders.filter(r => r.status === 'partial' || r.status === 'inspected').length;
    const rejected = receiveOrders.filter(r => r.status === 'rejected').length;
    const totalItemsReceived = receiveOrders.reduce((acc, curr) => {
      return acc + (curr.items || []).reduce((sum, item) => sum + (Number(item.receivedQty) || 0), 0);
    }, 0);

    return { total, received, partial, rejected, totalItemsReceived };
  }, [receiveOrders]);

  // Handle PO Selection in Form
  const handleSelectPO = (poNum: string) => {
    const po = purchaseOrders.find(p => p.poNumber === poNum);
    if (!po) {
      setFormData(prev => ({ ...prev, poNumber: poNum }));
      return;
    }

    const lines: ReceiveItemOrderLine[] = (po.items || []).map((itm, idx) => ({
      id: `rcv_line_${Date.now()}_${idx}`,
      itemCode: itm.itemCode || '',
      itemName: itm.itemName || itm.description || 'Item Barang',
      description: itm.description || '',
      poQty: Number(itm.qty) || 0,
      receivedQty: Number(itm.qty) || 0,
      acceptedQty: Number(itm.qty) || 0,
      rejectedQty: 0,
      uom: itm.uom || 'PCS',
      location: 'WH-MAIN-RAW',
      condition: 'good',
      notes: ''
    }));

    setFormData(prev => ({
      ...prev,
      poNumber: po.poNumber,
      supplierCode: po.supplierCode,
      supplierName: po.supplierName,
      items: lines
    }));
  };

  const handleOpenAdd = () => {
    setEditingOrder(null);
    const nextNo = `RCV/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, '0')}/${String(receiveOrders.length + 1).padStart(3, '0')}`;
    setFormData({
      receiveNumber: nextNo,
      date: new Date().toISOString().split('T')[0],
      poNumber: '',
      deliveryOrderNo: '',
      deliveryOrderDate: new Date().toISOString().split('T')[0],
      supplierCode: '',
      supplierName: '',
      receivedBy: currentUser?.name || 'Petugas Gudang',
      warehouseLocation: 'WH-MAIN-RAW (Gudang Utama)',
      driverName: '',
      vehiclePlateNumber: '',
      status: 'received',
      qcStatus: 'passed',
      qcInspector: 'Tim QC Receiving',
      notes: '',
      items: []
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (ord: ReceiveItemOrder) => {
    setEditingOrder(ord);
    setFormData({
      receiveNumber: ord.receiveNumber,
      date: ord.date,
      poNumber: ord.poNumber,
      deliveryOrderNo: ord.deliveryOrderNo,
      deliveryOrderDate: ord.deliveryOrderDate || ord.date,
      supplierCode: ord.supplierCode,
      supplierName: ord.supplierName,
      receivedBy: ord.receivedBy,
      warehouseLocation: ord.warehouseLocation || 'WH-MAIN-RAW (Gudang Utama)',
      driverName: ord.driverName || '',
      vehiclePlateNumber: ord.vehiclePlateNumber || '',
      status: ord.status,
      qcStatus: ord.qcStatus || 'passed',
      qcInspector: ord.qcInspector || '',
      notes: ord.notes || '',
      items: (ord.items || []).map(i => ({ ...i }))
    });
    setIsModalOpen(true);
  };

  const handleUpdateItemLine = (index: number, field: keyof ReceiveItemOrderLine, val: any) => {
    setFormData(prev => {
      const updated = [...prev.items];
      const item = { ...updated[index], [field]: val };
      
      if (field === 'receivedQty') {
        const rec = Number(val) || 0;
        const rej = Number(item.rejectedQty) || 0;
        item.acceptedQty = Math.max(0, rec - rej);
      } else if (field === 'rejectedQty') {
        const rej = Number(val) || 0;
        const rec = Number(item.receivedQty) || 0;
        item.acceptedQty = Math.max(0, rec - rej);
      }
      
      updated[index] = item;
      return { ...prev, items: updated };
    });
  };

  const handleAddItemLine = () => {
    setFormData(prev => ({
      ...prev,
      items: [
        ...prev.items,
        {
          id: `line_${Date.now()}`,
          itemCode: '',
          itemName: '',
          poQty: 0,
          receivedQty: 1,
          acceptedQty: 1,
          rejectedQty: 0,
          uom: 'PCS',
          location: 'WH-MAIN-RAW',
          condition: 'good',
          notes: ''
        }
      ]
    }));
  };

  const handleRemoveItemLine = (idx: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== idx)
    }));
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.receiveNumber || !formData.deliveryOrderNo || !formData.supplierName) {
      alert('Mohon lengkapi No Penerimaan, Surat Jalan Supplier, dan Nama Supplier.');
      return;
    }

    if (formData.items.length === 0) {
      alert('Mohon masukkan minimal 1 baris item barang yang diterima.');
      return;
    }

    if (editingOrder) {
      onUpdateReceiveOrder(editingOrder.id, formData);
    } else {
      onAddReceiveOrder(formData);
    }
    setIsModalOpen(false);
  };

  // Export to Excel
  const handleExportXLSX = () => {
    const rows = filteredOrders.flatMap(ord => {
      if (!ord.items || ord.items.length === 0) {
        return [{
          'No Penerimaan (RCV)': ord.receiveNumber,
          'Tanggal': ord.date,
          'No PO': ord.poNumber,
          'Surat Jalan DO': ord.deliveryOrderNo,
          'Supplier': ord.supplierName,
          'Petugas Penerima': ord.receivedBy,
          'Gudang': ord.warehouseLocation,
          'Status': STATUS_BADGES[ord.status]?.label || ord.status,
          'Status QC': ord.qcStatus || '-',
          'Kode Barang': '-',
          'Nama Barang': '-',
          'Qty PO': 0,
          'Qty Diterima': 0,
          'Qty Diterima Baik': 0,
          'Qty Reject': 0,
          'Satuan': '-'
        }];
      }
      return ord.items.map(itm => ({
        'No Penerimaan (RCV)': ord.receiveNumber,
        'Tanggal': ord.date,
        'No PO': ord.poNumber,
        'Surat Jalan DO': ord.deliveryOrderNo,
        'Supplier': ord.supplierName,
        'Petugas Penerima': ord.receivedBy,
        'Gudang': ord.warehouseLocation,
        'Status': STATUS_BADGES[ord.status]?.label || ord.status,
        'Status QC': ord.qcStatus || '-',
        'Kode Barang': itm.itemCode || '-',
        'Nama Barang': itm.itemName,
        'Qty PO': itm.poQty || 0,
        'Qty Diterima': itm.receivedQty || 0,
        'Qty Diterima Baik': itm.acceptedQty || 0,
        'Qty Reject': itm.rejectedQty || 0,
        'Satuan': itm.uom
      }));
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'ReceiveItemOrders');
    XLSX.writeFile(workbook, `Penerimaan_Barang_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Submenu Navigation Tabs */}
      <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-600 rounded-xl text-white shadow-md shadow-emerald-500/20">
              <PackageCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-800">Receive Item Order</h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                  Penerimaan Barang Fisik
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Pencatatan bukti penerimaan barang masuk dari supplier berdasarkan Surat Jalan (Delivery Order) & Purchase Order (PO).
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleExportXLSX}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer"
              title="Export XLSX"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Export Excel</span>
            </button>
            <button
              onClick={handleOpenAdd}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm shadow-emerald-600/30 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Catat Penerimaan Baru</span>
            </button>
          </div>
        </div>

        {/* Purchase Navigation Tabs */}
        {onSwitchPurchaseTab && (
          <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-1 sm:gap-2">
            <span className="text-xs font-bold text-slate-400 mr-2 uppercase tracking-wider">Purchase Flow:</span>
            {[
              { id: 'purchase-request', label: 'Purchase Request', icon: ClipboardList },
              { id: 'purchase-order', label: 'Purchase Order', icon: Truck },
              { id: 'receive-item-order', label: 'Receive Item Order', icon: PackageCheck },
              { id: 'purchase-invoice', label: 'Purchase Invoice', icon: FileText },
              { id: 'return-item-order', label: 'Return Item Order', icon: AlertTriangle },
              { id: 'payment-purchase', label: 'Payment Purchase', icon: ShieldCheck },
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activePurchaseTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onSwitchPurchaseTab(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition cursor-pointer ${
                    isActive
                      ? 'bg-emerald-600 text-white font-bold shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Penerimaan</span>
            <div className="p-2 bg-slate-100 rounded-lg text-slate-600">
              <ClipboardList className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-800">{stats.total}</span>
            <span className="text-xs text-slate-400 font-medium">Transaksi DO</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-emerald-100 bg-gradient-to-br from-white to-emerald-50/30 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Diterima Penuh</span>
            <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-700">{stats.received}</span>
            <span className="text-xs text-emerald-600/70 font-medium">Surat Jalan Sesuai</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-amber-100 bg-gradient-to-br from-white to-amber-50/30 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Parsial / Inspeksi</span>
            <div className="p-2 bg-amber-100 rounded-lg text-amber-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-700">{stats.partial}</span>
            <span className="text-xs text-amber-600/70 font-medium">Perlu Follow-up</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Fisik Masuk</span>
            <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-indigo-700">{stats.totalItemsReceived.toLocaleString()}</span>
            <span className="text-xs text-slate-400 font-medium">Qty Unit/Pcs</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari No Penerimaan, DO, PO, Supplier..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={filterSupplier}
            onChange={e => setFilterSupplier(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          >
            <option value="">Semua Supplier</option>
            {suppliers.map(s => (
              <option key={s.id} value={s.code}>{s.name} ({s.code})</option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          >
            <option value="all">Semua Status</option>
            <option value="received">Diterima Lengkap</option>
            <option value="partial">Diterima Sebagian</option>
            <option value="inspected">Telah Diinspeksi QC</option>
            <option value="rejected">Ditolak</option>
            <option value="draft">Draft</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">No. Penerimaan / Tanggal</th>
                <th className="px-4 py-3">Ref PO & Surat Jalan (DO)</th>
                <th className="px-4 py-3">Supplier</th>
                <th className="px-4 py-3">Gudang & Penerima</th>
                <th className="px-4 py-3 text-center">Ringkasan Item</th>
                <th className="px-4 py-3 text-center">QC Status</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400">
                    <PackageCheck className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-medium">Belum ada data penerimaan barang.</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Klik tombol "Catat Penerimaan Baru" untuk mulai mencatat Surat Jalan masuk.</p>
                  </td>
                </tr>
              ) : (
                filteredOrders.map(ord => {
                  const badge = STATUS_BADGES[ord.status] || STATUS_BADGES.draft;
                  const qcBadge = QC_BADGES[ord.qcStatus || 'pending'] || QC_BADGES.pending;
                  const totalRecQty = (ord.items || []).reduce((sum, i) => sum + (Number(i.receivedQty) || 0), 0);
                  const totalAccQty = (ord.items || []).reduce((sum, i) => sum + (Number(i.acceptedQty) || 0), 0);
                  const totalRejQty = (ord.items || []).reduce((sum, i) => sum + (Number(i.rejectedQty) || 0), 0);

                  return (
                    <tr key={ord.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-slate-800">{ord.receiveNumber}</div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3" />
                          <span>{ord.date}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-emerald-700 flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-slate-400" />
                          <span>DO: {ord.deliveryOrderNo}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 font-medium">
                          PO Ref: <span className="text-slate-700 font-semibold">{ord.poNumber || '-'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-slate-800">{ord.supplierName}</div>
                        <div className="text-[11px] text-slate-400">{ord.supplierCode}</div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-medium text-slate-700 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span className="truncate max-w-[180px]">{ord.warehouseLocation || 'Gudang Utama'}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Penerima: <span className="font-medium">{ord.receivedBy}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <div className="font-bold text-slate-800">{ord.items?.length || 0} Baris Item</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Total: <span className="text-emerald-700 font-bold">{totalAccQty} Ok</span>
                          {totalRejQty > 0 && <span className="text-rose-600 font-bold ml-1">({totalRejQty} Rej)</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${qcBadge.bg}`}>
                          {qcBadge.label}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${badge.bg} ${badge.text} ${badge.border}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setViewingOrder(ord)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                            title="Lihat Detail"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setPrintOrder(ord)}
                            className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                            title="Cetak Surat Penerimaan"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(ord)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Yakin ingin menghapus data penerimaan ${ord.receiveNumber}?`)) {
                                onDeleteReceiveOrder(ord.id);
                              }
                            }}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                            title="Hapus"
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

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-600 rounded-lg text-white">
                  <PackageCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">
                    {editingOrder ? 'Edit Penerimaan Barang' : 'Catat Penerimaan Barang Baru (Good Receipt)'}
                  </h3>
                  <p className="text-xs text-slate-500">Input verifikasi Surat Jalan (DO) dan pencocokan terhadap PO.</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Header Fields */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">No. Bukti Penerimaan *</label>
                  <input
                    type="text"
                    required
                    value={formData.receiveNumber}
                    onChange={e => setFormData({ ...formData, receiveNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal Penerimaan Fisik *</label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tautkan ke Purchase Order (PO)</label>
                  <select
                    value={formData.poNumber}
                    onChange={e => handleSelectPO(e.target.value)}
                    className="w-full px-3 py-2 bg-emerald-50/50 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  >
                    <option value="">-- Pilih Nomor PO yang Sudah Terbit --</option>
                    {purchaseOrders.map(p => (
                      <option key={p.id} value={p.poNumber}>
                        {p.poNumber} - {p.supplierName} ({p.items?.length || 0} item)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Delivery Order & Supplier Information */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">No. Surat Jalan Supplier (DO) *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: DO-SUP/2026/03/099"
                    value={formData.deliveryOrderNo}
                    onChange={e => setFormData({ ...formData, deliveryOrderNo: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Supplier *</label>
                  <select
                    required
                    value={formData.supplierCode}
                    onChange={e => {
                      const sup = suppliers.find(s => s.code === e.target.value);
                      setFormData({
                        ...formData,
                        supplierCode: e.target.value,
                        supplierName: sup?.name || ''
                      });
                    }}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  >
                    <option value="">-- Pilih Supplier --</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.code}>{s.name} ({s.code})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Lokasi Gudang Penyimpanan *</label>
                  <input
                    type="text"
                    value={formData.warehouseLocation}
                    onChange={e => setFormData({ ...formData, warehouseLocation: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Petugas Gudang Penerima</label>
                  <input
                    type="text"
                    value={formData.receivedBy}
                    onChange={e => setFormData({ ...formData, receivedBy: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">No Polisi Kendaraan Pengirim</label>
                  <input
                    type="text"
                    placeholder="Contoh: B 9283 UI"
                    value={formData.vehiclePlateNumber}
                    onChange={e => setFormData({ ...formData, vehiclePlateNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Status Inspeksi QC</label>
                  <select
                    value={formData.qcStatus}
                    onChange={e => setFormData({ ...formData, qcStatus: e.target.value as any })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  >
                    <option value="passed">QC Lolos (Passed)</option>
                    <option value="partial_pass">QC Lolos Sebagian</option>
                    <option value="failed">QC Gagal / Reject</option>
                    <option value="pending">Menunggu Inspeksi QC</option>
                  </select>
                </div>
              </div>

              {/* Items Table in Modal */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Daftar Barang yang Diterima</h4>
                  <button
                    type="button"
                    onClick={handleAddItemLine}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Baris</span>
                  </button>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="px-3 py-2">Kode / Nama Barang</th>
                        <th className="px-2 py-2 text-center w-20">Qty PO</th>
                        <th className="px-2 py-2 text-center w-24">Qty Diterima</th>
                        <th className="px-2 py-2 text-center w-24">Qty Baik (Acc)</th>
                        <th className="px-2 py-2 text-center w-20">Qty Reject</th>
                        <th className="px-2 py-2 text-center w-16">Satuan</th>
                        <th className="px-2 py-2 w-28">Kondisi</th>
                        <th className="px-2 py-2 text-center w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {formData.items.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="text-center py-6 text-slate-400">
                            Pilih Nomor PO di atas atau klik "Tambah Baris" untuk memasukkan item.
                          </td>
                        </tr>
                      ) : (
                        formData.items.map((item, idx) => (
                          <tr key={item.id || idx} className="hover:bg-slate-50">
                            <td className="px-3 py-2">
                              <input
                                type="text"
                                placeholder="Nama Item / Deskripsi"
                                value={item.itemName}
                                onChange={e => handleUpdateItemLine(idx, 'itemName', e.target.value)}
                                className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500"
                              />
                            </td>
                            <td className="px-2 py-2">
                              <input
                                type="number"
                                min="0"
                                value={item.poQty}
                                onChange={e => handleUpdateItemLine(idx, 'poQty', Number(e.target.value))}
                                className="w-full px-2 py-1 bg-slate-100 border border-slate-200 rounded text-xs text-center font-medium"
                              />
                            </td>
                            <td className="px-2 py-2">
                              <input
                                type="number"
                                min="0"
                                value={item.receivedQty}
                                onChange={e => handleUpdateItemLine(idx, 'receivedQty', Number(e.target.value))}
                                className="w-full px-2 py-1 bg-white border border-emerald-300 rounded text-xs text-center font-bold text-emerald-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                              />
                            </td>
                            <td className="px-2 py-2">
                              <input
                                type="number"
                                min="0"
                                value={item.acceptedQty}
                                onChange={e => handleUpdateItemLine(idx, 'acceptedQty', Number(e.target.value))}
                                className="w-full px-2 py-1 bg-emerald-50 border border-emerald-200 rounded text-xs text-center font-bold text-emerald-700"
                              />
                            </td>
                            <td className="px-2 py-2">
                              <input
                                type="number"
                                min="0"
                                value={item.rejectedQty}
                                onChange={e => handleUpdateItemLine(idx, 'rejectedQty', Number(e.target.value))}
                                className="w-full px-2 py-1 bg-rose-50 border border-rose-200 rounded text-xs text-center font-bold text-rose-700"
                              />
                            </td>
                            <td className="px-2 py-2">
                              <input
                                type="text"
                                value={item.uom}
                                onChange={e => handleUpdateItemLine(idx, 'uom', e.target.value)}
                                className="w-full px-1 py-1 bg-white border border-slate-200 rounded text-xs text-center font-medium"
                              />
                            </td>
                            <td className="px-2 py-2">
                              <select
                                value={item.condition || 'good'}
                                onChange={e => handleUpdateItemLine(idx, 'condition', e.target.value)}
                                className="w-full px-1.5 py-1 bg-white border border-slate-200 rounded text-xs"
                              >
                                <option value="good">Baik / OK</option>
                                <option value="damaged">Rusak Fisik</option>
                                <option value="defect">Cacat Spek</option>
                                <option value="incomplete">Kurang/Hilang</option>
                              </select>
                            </td>
                            <td className="px-2 py-2 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveItemLine(idx)}
                                className="p-1 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Catatan Tambahan Penerimaan</label>
                <textarea
                  rows={2}
                  placeholder="Keterangan kondisi kemasan, nomor seal container, atau catatan khusus lainnya..."
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/20 transition cursor-pointer"
                >
                  {editingOrder ? 'Simpan Perubahan' : 'Simpan Bukti Penerimaan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {viewingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <PackageCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-800">Detail Bukti Penerimaan Barang</h3>
              </div>
              <button
                onClick={() => setViewingOrder(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-400 block font-medium">No. Penerimaan:</span>
                  <span className="font-bold text-slate-800 text-sm">{viewingOrder.receiveNumber}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Tanggal Masuk:</span>
                  <span className="font-bold text-slate-700">{viewingOrder.date}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">No Surat Jalan (DO):</span>
                  <span className="font-bold text-emerald-700">{viewingOrder.deliveryOrderNo}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Nomor PO:</span>
                  <span className="font-bold text-slate-800">{viewingOrder.poNumber || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Supplier:</span>
                  <span className="font-bold text-slate-800">{viewingOrder.supplierName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Lokasi Gudang:</span>
                  <span className="font-bold text-slate-800">{viewingOrder.warehouseLocation || 'Gudang Utama'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Penerima Gudang:</span>
                  <span className="font-bold text-slate-800">{viewingOrder.receivedBy}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Status QC:</span>
                  <span className="font-bold text-emerald-700 uppercase">{viewingOrder.qcStatus || 'Passed'}</span>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">Item Fisik Diterima</h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-2.5">Nama Item Barang</th>
                        <th className="px-3 py-2.5 text-center">Qty PO</th>
                        <th className="px-3 py-2.5 text-center">Qty Diterima</th>
                        <th className="px-3 py-2.5 text-center">Qty Lolos (Ok)</th>
                        <th className="px-3 py-2.5 text-center">Qty Reject</th>
                        <th className="px-3 py-2.5 text-center">Satuan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(viewingOrder.items || []).map((itm, i) => (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="px-4 py-2.5 font-medium text-slate-800">
                            {itm.itemName}
                            {itm.itemCode && <span className="text-[10px] text-slate-400 block">{itm.itemCode}</span>}
                          </td>
                          <td className="px-3 py-2.5 text-center text-slate-600 font-semibold">{itm.poQty || 0}</td>
                          <td className="px-3 py-2.5 text-center font-bold text-slate-800">{itm.receivedQty}</td>
                          <td className="px-3 py-2.5 text-center font-bold text-emerald-700">{itm.acceptedQty}</td>
                          <td className="px-3 py-2.5 text-center font-bold text-rose-600">{itm.rejectedQty || 0}</td>
                          <td className="px-3 py-2.5 text-center text-slate-500 font-medium">{itm.uom}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {viewingOrder.notes && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                  <span className="font-bold text-slate-700 block mb-0.5">Catatan:</span>
                  <p className="text-slate-600">{viewingOrder.notes}</p>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between bg-slate-50">
              <button
                onClick={() => {
                  const target = viewingOrder;
                  setViewingOrder(null);
                  setPrintOrder(target);
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Bukti Penerimaan</span>
              </button>
              <button
                onClick={() => setViewingOrder(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print View Modal */}
      {printOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
            <div className="px-6 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50 no-print">
              <span className="text-xs font-bold text-slate-700">Preview Cetak Bukti Penerimaan Barang (Good Receipt Note)</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Document</span>
                </button>
                <button
                  onClick={() => setPrintOrder(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-8 overflow-y-auto print:p-0 text-slate-800 font-sans" id="print-area">
              {/* Document Header */}
              <div className="flex justify-between items-start border-b-2 border-slate-800 pb-4">
                <div>
                  <h2 className="text-lg font-black text-slate-900">{companySettings?.companyName || 'PT. KANETA INDONESIA'}</h2>
                  <p className="text-[11px] text-slate-500 max-w-md">{companySettings?.address || 'Kawasan Industri KIIC, Karawang, Jawa Barat'}</p>
                </div>
                <div className="text-right">
                  <h1 className="text-xl font-black tracking-tight text-emerald-800">BUKTI PENERIMAAN BARANG</h1>
                  <p className="text-xs font-bold text-slate-600">GOOD RECEIPT NOTE (GRN)</p>
                  <p className="text-xs font-mono font-bold text-slate-900 mt-1">{printOrder.receiveNumber}</p>
                </div>
              </div>

              {/* Meta info */}
              <div className="grid grid-cols-2 gap-4 py-4 text-xs border-b border-slate-200">
                <div className="space-y-1">
                  <div><span className="font-semibold text-slate-500">Supplier:</span> <strong className="text-slate-900">{printOrder.supplierName}</strong> ({printOrder.supplierCode})</div>
                  <div><span className="font-semibold text-slate-500">No. Surat Jalan (DO):</span> <strong className="text-emerald-800">{printOrder.deliveryOrderNo}</strong></div>
                  <div><span className="font-semibold text-slate-500">No. Purchase Order:</span> <strong className="text-slate-800">{printOrder.poNumber || '-'}</strong></div>
                </div>
                <div className="space-y-1 text-right">
                  <div><span className="font-semibold text-slate-500">Tanggal Diterima:</span> <strong>{printOrder.date}</strong></div>
                  <div><span className="font-semibold text-slate-500">Lokasi Gudang:</span> <strong>{printOrder.warehouseLocation || 'Gudang Utama'}</strong></div>
                  <div><span className="font-semibold text-slate-500">No Kendaraan / Driver:</span> <strong>{printOrder.vehiclePlateNumber || '-'} / {printOrder.driverName || '-'}</strong></div>
                </div>
              </div>

              {/* Items Table */}
              <div className="my-6">
                <table className="w-full text-xs text-left border border-slate-300">
                  <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                    <tr>
                      <th className="p-2 border-r border-slate-300 text-center w-10">No</th>
                      <th className="p-2 border-r border-slate-300">Kode & Nama Barang</th>
                      <th className="p-2 border-r border-slate-300 text-center w-20">Qty PO</th>
                      <th className="p-2 border-r border-slate-300 text-center w-24">Qty Diterima</th>
                      <th className="p-2 border-r border-slate-300 text-center w-24">Qty Lolos (Ok)</th>
                      <th className="p-2 border-r border-slate-300 text-center w-20">Qty Reject</th>
                      <th className="p-2 text-center w-16">Satuan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-300">
                    {(printOrder.items || []).map((itm, idx) => (
                      <tr key={idx}>
                        <td className="p-2 border-r border-slate-300 text-center">{idx + 1}</td>
                        <td className="p-2 border-r border-slate-300 font-medium">
                          {itm.itemName}
                          {itm.itemCode && <span className="text-[10px] text-slate-500 block">Code: {itm.itemCode}</span>}
                        </td>
                        <td className="p-2 border-r border-slate-300 text-center">{itm.poQty || 0}</td>
                        <td className="p-2 border-r border-slate-300 text-center font-bold">{itm.receivedQty}</td>
                        <td className="p-2 border-r border-slate-300 text-center font-bold text-emerald-800">{itm.acceptedQty}</td>
                        <td className="p-2 border-r border-slate-300 text-center font-bold text-rose-700">{itm.rejectedQty || 0}</td>
                        <td className="p-2 text-center">{itm.uom}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-3 gap-6 pt-8 text-center text-xs">
                <div>
                  <p className="font-semibold text-slate-500 mb-14">Diserahkan Oleh (Driver/Supplier),</p>
                  <p className="font-bold text-slate-800 border-t border-slate-400 pt-1">
                    ( {printOrder.driverName || '................................'} )
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-slate-500 mb-14">Diperiksa / QC Receiving,</p>
                  <p className="font-bold text-slate-800 border-t border-slate-400 pt-1">
                    ( {printOrder.qcInspector || '................................'} )
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-slate-500 mb-14">Diterima Petugas Gudang,</p>
                  <p className="font-bold text-slate-800 border-t border-slate-400 pt-1">
                    ( {printOrder.receivedBy || '................................'} )
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
