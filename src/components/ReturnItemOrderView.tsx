import React, { useState, useMemo } from 'react';
import {
  AlertTriangle,
  Plus,
  FileSpreadsheet,
  Printer,
  Search,
  CheckCircle2,
  Clock,
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
  RotateCcw,
  DollarSign,
  PackageCheck
} from 'lucide-react';
import * as XLSX from 'xlsx';
import {
  ReturnItemOrder,
  ReturnItemOrderLine,
  ReturnItemOrderStatus,
  PurchaseOrder,
  ReceiveItemOrder,
  Supplier,
  AppUser,
  CompanySettings
} from '../types';

interface ReturnItemOrderViewProps {
  returnOrders: ReturnItemOrder[];
  purchaseOrders: PurchaseOrder[];
  receiveOrders?: ReceiveItemOrder[];
  suppliers: Supplier[];
  currentUser: AppUser | null;
  companySettings?: CompanySettings;
  onAddReturnOrder: (order: Omit<ReturnItemOrder, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateReturnOrder: (id: string, updates: Partial<ReturnItemOrder>) => void;
  onDeleteReturnOrder: (id: string) => void;
  onCheckReturnOrder?: (id: string, userName: string) => void;
  onApproveReturnOrder?: (id: string, userName: string) => void;
  onRejectReturnOrder?: (id: string, userName: string, reason: string) => void;
  activePurchaseTab?: string;
  onSwitchPurchaseTab?: (tab: string) => void;
}

const STATUS_BADGES: Record<ReturnItemOrderStatus, { label: string; bg: string; text: string; border: string }> = {
  draft: { label: 'Draft', bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300' },
  pending_pickup: { label: 'Menunggu Pengambilan/Kirim', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  sent_to_supplier: { label: 'Terkirim ke Supplier', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  completed: { label: 'Selesai (Resolved)', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  cancelled: { label: 'Dibatalkan', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
};

const RETURN_TYPE_LABELS: Record<string, { label: string; desc: string }> = {
  replacement: { label: 'Penggantian Barang (Replacement)', desc: 'Supplier mengirimkan barang pengganti yang baru' },
  credit_note: { label: 'Potong Faktur / Debit Note', desc: 'Pemotongan nilai tagihan pada Invoice / Faktur' },
  refund: { label: 'Pengembalian Dana (Cash Refund)', desc: 'Supplier mentransfer kembali dana atas barang yang diretur' }
};

export const ReturnItemOrderView: React.FC<ReturnItemOrderViewProps> = ({
  returnOrders = [],
  purchaseOrders = [],
  receiveOrders = [],
  suppliers = [],
  currentUser,
  companySettings,
  onAddReturnOrder,
  onUpdateReturnOrder,
  onDeleteReturnOrder,
  onCheckReturnOrder,
  onApproveReturnOrder,
  onRejectReturnOrder,
  activePurchaseTab = 'return-item-order',
  onSwitchPurchaseTab
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSupplier, setFilterSupplier] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<ReturnItemOrder | null>(null);
  const [viewingOrder, setViewingOrder] = useState<ReturnItemOrder | null>(null);
  const [printOrder, setPrintOrder] = useState<ReturnItemOrder | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    returnNumber: '',
    date: new Date().toISOString().split('T')[0],
    poNumber: '',
    receiveNumber: '',
    deliveryOrderNo: '',
    supplierCode: '',
    supplierName: '',
    supplierAddress: '',
    supplierContact: '',
    reason: 'Barang tidak sesuai spesifikasi / cacat QC saat inspeksi penerimaan',
    returnType: 'replacement' as 'replacement' | 'credit_note' | 'refund',
    status: 'pending_pickup' as ReturnItemOrderStatus,
    currency: 'IDR',
    totalReturnAmount: 0,
    shippingCarrier: '',
    trackingNumber: '',
    notes: '',
    items: [] as ReturnItemOrderLine[]
  });

  // Filtered List
  const filteredOrders = useMemo(() => {
    return returnOrders.filter(ord => {
      const matchSearch =
        (ord.returnNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (ord.poNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (ord.receiveNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (ord.supplierName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (ord.reason || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchSup = !filterSupplier || ord.supplierCode === filterSupplier;
      const matchStat = filterStatus === 'all' || ord.status === filterStatus;

      return matchSearch && matchSup && matchStat;
    });
  }, [returnOrders, searchTerm, filterSupplier, filterStatus]);

  // Statistics
  const stats = useMemo(() => {
    const total = returnOrders.length;
    const pending = returnOrders.filter(r => r.status === 'pending_pickup' || r.status === 'sent_to_supplier').length;
    const completed = returnOrders.filter(r => r.status === 'completed').length;
    const totalValue = returnOrders.reduce((sum, r) => sum + (Number(r.totalReturnAmount) || 0), 0);

    return { total, pending, completed, totalValue };
  }, [returnOrders]);

  // Handle PO Selection
  const handleSelectPO = (poNum: string) => {
    const po = purchaseOrders.find(p => p.poNumber === poNum);
    if (!po) {
      setFormData(prev => ({ ...prev, poNumber: poNum }));
      return;
    }

    const lines: ReturnItemOrderLine[] = (po.items || []).map((itm, idx) => ({
      id: `ret_line_${Date.now()}_${idx}`,
      itemCode: itm.itemCode || '',
      itemName: itm.itemName || itm.description || 'Item Barang',
      description: itm.description || '',
      qty: 1,
      uom: itm.uom || 'PCS',
      unitPrice: Number(itm.unitPrice) || 0,
      totalPrice: Number(itm.unitPrice) || 0,
      defectReason: 'Cacat dimensi / tidak lolos inspeksi QC',
      condition: 'damaged',
      notes: ''
    }));

    const totalAmt = lines.reduce((acc, l) => acc + l.totalPrice, 0);

    setFormData(prev => ({
      ...prev,
      poNumber: po.poNumber,
      supplierCode: po.supplierCode,
      supplierName: po.supplierName,
      supplierAddress: po.supplierAddress || '',
      currency: po.currency || 'IDR',
      totalReturnAmount: totalAmt,
      items: lines
    }));
  };

  const handleOpenAdd = () => {
    setEditingOrder(null);
    const nextNo = `RTO/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, '0')}/${String(returnOrders.length + 1).padStart(3, '0')}`;
    setFormData({
      returnNumber: nextNo,
      date: new Date().toISOString().split('T')[0],
      poNumber: '',
      receiveNumber: '',
      deliveryOrderNo: '',
      supplierCode: '',
      supplierName: '',
      supplierAddress: '',
      supplierContact: '',
      reason: 'Barang tidak sesuai spesifikasi / cacat QC saat inspeksi penerimaan',
      returnType: 'replacement',
      status: 'pending_pickup',
      currency: 'IDR',
      totalReturnAmount: 0,
      shippingCarrier: '',
      trackingNumber: '',
      notes: '',
      items: []
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (ord: ReturnItemOrder) => {
    setEditingOrder(ord);
    setFormData({
      returnNumber: ord.returnNumber,
      date: ord.date,
      poNumber: ord.poNumber,
      receiveNumber: ord.receiveNumber || '',
      deliveryOrderNo: ord.deliveryOrderNo || '',
      supplierCode: ord.supplierCode,
      supplierName: ord.supplierName,
      supplierAddress: ord.supplierAddress || '',
      supplierContact: ord.supplierContact || '',
      reason: ord.reason,
      returnType: ord.returnType || 'replacement',
      status: ord.status,
      currency: ord.currency || 'IDR',
      totalReturnAmount: ord.totalReturnAmount,
      shippingCarrier: ord.shippingCarrier || '',
      trackingNumber: ord.trackingNumber || '',
      notes: ord.notes || '',
      items: (ord.items || []).map(i => ({ ...i }))
    });
    setIsModalOpen(true);
  };

  const handleUpdateItemLine = (index: number, field: keyof ReturnItemOrderLine, val: any) => {
    setFormData(prev => {
      const updated = [...prev.items];
      const item = { ...updated[index], [field]: val };
      
      if (field === 'qty' || field === 'unitPrice') {
        const q = field === 'qty' ? Number(val) : Number(item.qty);
        const p = field === 'unitPrice' ? Number(val) : Number(item.unitPrice);
        item.totalPrice = q * p;
      }
      
      updated[index] = item;
      const totalAmt = updated.reduce((sum, it) => sum + (Number(it.totalPrice) || 0), 0);
      return { ...prev, items: updated, totalReturnAmount: totalAmt };
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
          qty: 1,
          uom: 'PCS',
          unitPrice: 0,
          totalPrice: 0,
          defectReason: 'Cacat produksi',
          condition: 'damaged',
          notes: ''
        }
      ]
    }));
  };

  const handleRemoveItemLine = (idx: number) => {
    setFormData(prev => {
      const updated = prev.items.filter((_, i) => i !== idx);
      const totalAmt = updated.reduce((sum, it) => sum + (Number(it.totalPrice) || 0), 0);
      return { ...prev, items: updated, totalReturnAmount: totalAmt };
    });
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.returnNumber || !formData.supplierName) {
      alert('Mohon lengkapi No Retur dan Nama Supplier.');
      return;
    }

    if (formData.items.length === 0) {
      alert('Mohon masukkan minimal 1 baris item yang akan diretur.');
      return;
    }

    if (editingOrder) {
      onUpdateReturnOrder(editingOrder.id, formData);
    } else {
      onAddReturnOrder(formData);
    }
    setIsModalOpen(false);
  };

  // Export to Excel
  const handleExportXLSX = () => {
    const rows = filteredOrders.flatMap(ord => {
      if (!ord.items || ord.items.length === 0) {
        return [{
          'No Retur (RTO)': ord.returnNumber,
          'Tanggal': ord.date,
          'No PO': ord.poNumber,
          'Ref DO': ord.deliveryOrderNo || '-',
          'Supplier': ord.supplierName,
          'Alasan Retur': ord.reason,
          'Tipe Kompensasi': RETURN_TYPE_LABELS[ord.returnType]?.label || ord.returnType,
          'Status': STATUS_BADGES[ord.status]?.label || ord.status,
          'Total Nilai Retur': ord.totalReturnAmount,
          'Mata Uang': ord.currency,
          'Nama Barang': '-',
          'Qty Retur': 0,
          'Satuan': '-',
          'Harga Satuan': 0,
          'Subtotal': 0
        }];
      }
      return ord.items.map(itm => ({
        'No Retur (RTO)': ord.returnNumber,
        'Tanggal': ord.date,
        'No PO': ord.poNumber,
        'Ref DO': ord.deliveryOrderNo || '-',
        'Supplier': ord.supplierName,
        'Alasan Retur': ord.reason,
        'Tipe Kompensasi': RETURN_TYPE_LABELS[ord.returnType]?.label || ord.returnType,
        'Status': STATUS_BADGES[ord.status]?.label || ord.status,
        'Total Nilai Retur': ord.totalReturnAmount,
        'Mata Uang': ord.currency,
        'Nama Barang': itm.itemName,
        'Qty Retur': itm.qty,
        'Satuan': itm.uom,
        'Harga Satuan': itm.unitPrice,
        'Subtotal': itm.totalPrice,
        'Alasan Kerusakan': itm.defectReason
      }));
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'ReturnItemOrders');
    XLSX.writeFile(workbook, `Retur_Pembelian_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* Header & Submenu Navigation */}
      <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-500 rounded-xl text-white shadow-md shadow-amber-500/20">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-800">Return Item Order</h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                  Retur Pembelian (Debit Memo)
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Pengelolaan pengembalian barang rusak, reject QC, atau salah spesifikasi ke supplier beserta kompensasi penggantian / kredit nota.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleExportXLSX}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Export Excel</span>
            </button>
            <button
              onClick={handleOpenAdd}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm shadow-amber-500/30 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Buat Retur Barang Baru</span>
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
                      ? 'bg-amber-500 text-white font-bold shadow-xs'
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
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Retur Terbit</span>
            <div className="p-2 bg-slate-100 rounded-lg text-slate-600">
              <RotateCcw className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-800">{stats.total}</span>
            <span className="text-xs text-slate-400 font-medium">Nota Retur</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-amber-100 bg-gradient-to-br from-white to-amber-50/30 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Menunggu Pickup/Kirim</span>
            <div className="p-2 bg-amber-100 rounded-lg text-amber-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-700">{stats.pending}</span>
            <span className="text-xs text-amber-600/70 font-medium">Proses Pengembalian</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-emerald-100 bg-gradient-to-br from-white to-emerald-50/30 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Selesai / Selesai Diganti</span>
            <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-700">{stats.completed}</span>
            <span className="text-xs text-emerald-600/70 font-medium">Resolved</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Estimasi Nilai Retur</span>
            <div className="p-2 bg-rose-100 rounded-lg text-rose-600">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-black text-rose-700">Rp {stats.totalValue.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Filter & Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari No Retur, PO, Supplier, Alasan..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={filterSupplier}
            onChange={e => setFilterSupplier(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
          >
            <option value="">Semua Supplier</option>
            {suppliers.map(s => (
              <option key={s.id} value={s.code}>{s.name} ({s.code})</option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
          >
            <option value="all">Semua Status</option>
            <option value="pending_pickup">Menunggu Pickup/Kirim</option>
            <option value="sent_to_supplier">Terkirim ke Supplier</option>
            <option value="completed">Selesai</option>
            <option value="draft">Draft</option>
            <option value="cancelled">Dibatalkan</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">No. Retur / Tanggal</th>
                <th className="px-4 py-3">Ref PO & DO</th>
                <th className="px-4 py-3">Supplier & Alasan</th>
                <th className="px-4 py-3">Tipe Kompensasi</th>
                <th className="px-4 py-3 text-right">Nilai Retur</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    <RotateCcw className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-medium">Belum ada data retur barang ke supplier.</p>
                  </td>
                </tr>
              ) : (
                filteredOrders.map(ord => {
                  const badge = STATUS_BADGES[ord.status] || STATUS_BADGES.draft;
                  const typeInfo = RETURN_TYPE_LABELS[ord.returnType] || RETURN_TYPE_LABELS.replacement;

                  return (
                    <tr key={ord.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-slate-800">{ord.returnNumber}</div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3" />
                          <span>{ord.date}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-slate-800">PO: {ord.poNumber || '-'}</div>
                        {ord.receiveNumber && (
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            RCV: <span className="font-medium text-emerald-700">{ord.receiveNumber}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-slate-800">{ord.supplierName}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-1 italic text-rose-600">
                          "{ord.reason}"
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200 block max-w-fit">
                          {typeInfo.label.split('(')[0].trim()}
                        </span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">{ord.items?.length || 0} Baris Item</span>
                      </td>
                      <td className="px-4 py-3.5 text-right font-black text-rose-700">
                        {ord.currency} {(ord.totalReturnAmount || 0).toLocaleString()}
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
                            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                            title="Cetak Surat Retur"
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
                              if (confirm(`Hapus data retur ${ord.returnNumber}?`)) {
                                onDeleteReturnOrder(ord.id);
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
                <div className="p-2 bg-amber-500 rounded-lg text-white">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">
                    {editingOrder ? 'Edit Retur Pembelian' : 'Buat Surat Retur Barang (Return Item Order)'}
                  </h3>
                  <p className="text-xs text-slate-500">Formulir pengembalian barang ke supplier dan kompensasi.</p>
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">No. Surat Retur (RTO) *</label>
                  <input
                    type="text"
                    required
                    value={formData.returnNumber}
                    onChange={e => setFormData({ ...formData, returnNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal Retur *</label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tautkan ke Purchase Order (PO)</label>
                  <select
                    value={formData.poNumber}
                    onChange={e => handleSelectPO(e.target.value)}
                    className="w-full px-3 py-2 bg-amber-50/50 border border-amber-300 text-amber-900 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                  >
                    <option value="">-- Pilih PO Terkait --</option>
                    {purchaseOrders.map(p => (
                      <option key={p.id} value={p.poNumber}>
                        {p.poNumber} - {p.supplierName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Supplier & Reason Information */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
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
                        supplierName: sup?.name || '',
                        supplierAddress: sup?.address || ''
                      });
                    }}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  >
                    <option value="">-- Pilih Supplier --</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.code}>{s.name} ({s.code})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tipe Kompensasi Retur *</label>
                  <select
                    value={formData.returnType}
                    onChange={e => setFormData({ ...formData, returnType: e.target.value as any })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  >
                    <option value="replacement">Penggantian Barang Baru (Replacement)</option>
                    <option value="credit_note">Potong Tagihan / Debit Note (Credit Note)</option>
                    <option value="refund">Pengembalian Dana / Transfer Balik (Cash Refund)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Status Retur</label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  >
                    <option value="pending_pickup">Menunggu Pengambilan/Kirim</option>
                    <option value="sent_to_supplier">Terkirim ke Supplier</option>
                    <option value="completed">Selesai (Resolved)</option>
                    <option value="draft">Draft</option>
                    <option value="cancelled">Dibatalkan</option>
                  </select>
                </div>

                <div className="md:col-span-3">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Alasan Pengembalian (Defect / Discrepancy Reason) *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Dimensi ulir tidak sesuai standar gambar teknik / terdapat goresan permukaan"
                    value={formData.reason}
                    onChange={e => setFormData({ ...formData, reason: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>
              </div>

              {/* Item Lines */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Daftar Barang yang Diretur</h4>
                  <button
                    type="button"
                    onClick={handleAddItemLine}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Baris Item</span>
                  </button>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="px-3 py-2">Nama Barang & Kode</th>
                        <th className="px-2 py-2 text-center w-20">Qty Retur</th>
                        <th className="px-2 py-2 text-center w-16">Satuan</th>
                        <th className="px-2 py-2 text-right w-28">Harga Satuan</th>
                        <th className="px-2 py-2 text-right w-32">Total Nilai</th>
                        <th className="px-3 py-2 w-40">Alasan Kerusakan</th>
                        <th className="px-2 py-2 text-center w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {formData.items.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="text-center py-6 text-slate-400">
                            Pilih PO di atas atau klik "Tambah Baris Item" untuk menambahkan barang yang diretur.
                          </td>
                        </tr>
                      ) : (
                        formData.items.map((item, idx) => (
                          <tr key={item.id || idx} className="hover:bg-slate-50">
                            <td className="px-3 py-2">
                              <input
                                type="text"
                                placeholder="Nama Item"
                                value={item.itemName}
                                onChange={e => handleUpdateItemLine(idx, 'itemName', e.target.value)}
                                className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs font-medium focus:outline-none focus:ring-1 focus:ring-amber-500"
                              />
                            </td>
                            <td className="px-2 py-2">
                              <input
                                type="number"
                                min="1"
                                value={item.qty}
                                onChange={e => handleUpdateItemLine(idx, 'qty', Number(e.target.value))}
                                className="w-full px-2 py-1 bg-white border border-amber-300 rounded text-xs text-center font-bold text-amber-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                              />
                            </td>
                            <td className="px-2 py-2">
                              <input
                                type="text"
                                value={item.uom}
                                onChange={e => handleUpdateItemLine(idx, 'uom', e.target.value)}
                                className="w-full px-1 py-1 bg-white border border-slate-200 rounded text-xs text-center"
                              />
                            </td>
                            <td className="px-2 py-2">
                              <input
                                type="number"
                                min="0"
                                value={item.unitPrice}
                                onChange={e => handleUpdateItemLine(idx, 'unitPrice', Number(e.target.value))}
                                className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs text-right font-medium"
                              />
                            </td>
                            <td className="px-2 py-2 text-right font-bold text-rose-700">
                              {(item.totalPrice || 0).toLocaleString()}
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="text"
                                placeholder="Detail cacat..."
                                value={item.defectReason}
                                onChange={e => handleUpdateItemLine(idx, 'defectReason', e.target.value)}
                                className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs"
                              />
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
                    {formData.items.length > 0 && (
                      <tfoot className="bg-slate-50 font-bold border-t border-slate-200">
                        <tr>
                          <td colSpan={4} className="px-3 py-2 text-right text-slate-700">Total Nilai Pengembalian:</td>
                          <td className="px-2 py-2 text-right text-rose-700 font-black text-sm">
                            {formData.currency} {formData.totalReturnAmount.toLocaleString()}
                          </td>
                          <td colSpan={2}></td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Catatan Tambahan</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Informasi pengiriman armada supplier / deadline kompensasi penggantian..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

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
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow-md shadow-amber-500/20 transition cursor-pointer"
                >
                  {editingOrder ? 'Simpan Perubahan' : 'Terbitkan Surat Retur'}
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
                <RotateCcw className="w-5 h-5 text-amber-600" />
                <h3 className="text-base font-bold text-slate-800">Detail Surat Retur Pembelian</h3>
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
                  <span className="text-slate-400 block font-medium">No. Retur:</span>
                  <span className="font-bold text-slate-800 text-sm">{viewingOrder.returnNumber}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Tanggal:</span>
                  <span className="font-bold text-slate-700">{viewingOrder.date}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Nomor PO:</span>
                  <span className="font-bold text-slate-800">{viewingOrder.poNumber || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Total Nilai Retur:</span>
                  <span className="font-black text-rose-700 text-sm">
                    {viewingOrder.currency} {(viewingOrder.totalReturnAmount || 0).toLocaleString()}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-400 block font-medium">Supplier:</span>
                  <span className="font-bold text-slate-800">{viewingOrder.supplierName}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-400 block font-medium">Tipe Kompensasi:</span>
                  <span className="font-bold text-amber-700">{RETURN_TYPE_LABELS[viewingOrder.returnType]?.label || viewingOrder.returnType}</span>
                </div>
              </div>

              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
                <strong>Alasan Retur:</strong> {viewingOrder.reason}
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">Item Barang yang Diretur</h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-2.5">Nama Item Barang</th>
                        <th className="px-3 py-2.5 text-center">Qty Retur</th>
                        <th className="px-3 py-2.5 text-center">Satuan</th>
                        <th className="px-3 py-2.5 text-right">Harga Satuan</th>
                        <th className="px-4 py-2.5 text-right">Subtotal</th>
                        <th className="px-4 py-2.5">Alasan Cacat</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(viewingOrder.items || []).map((itm, i) => (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="px-4 py-2.5 font-medium text-slate-800">{itm.itemName}</td>
                          <td className="px-3 py-2.5 text-center font-bold text-amber-800">{itm.qty}</td>
                          <td className="px-3 py-2.5 text-center text-slate-500">{itm.uom}</td>
                          <td className="px-3 py-2.5 text-right font-medium">{(itm.unitPrice || 0).toLocaleString()}</td>
                          <td className="px-4 py-2.5 text-right font-black text-rose-700">{(itm.totalPrice || 0).toLocaleString()}</td>
                          <td className="px-4 py-2.5 text-slate-600">{itm.defectReason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between bg-slate-50">
              <button
                onClick={() => {
                  const target = viewingOrder;
                  setViewingOrder(null);
                  setPrintOrder(target);
                }}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Nota Retur</span>
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
              <span className="text-xs font-bold text-slate-700">Preview Cetak Surat Retur Pembelian</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print</span>
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
              <div className="flex justify-between items-start border-b-2 border-slate-800 pb-4">
                <div>
                  <h2 className="text-lg font-black text-slate-900">{companySettings?.companyName || 'PT. KANETA INDONESIA'}</h2>
                  <p className="text-[11px] text-slate-500 max-w-md">{companySettings?.address || 'Kawasan Industri KIIC, Karawang, Jawa Barat'}</p>
                </div>
                <div className="text-right">
                  <h1 className="text-xl font-black tracking-tight text-amber-700">SURAT PENGEMBALIAN BARANG</h1>
                  <p className="text-xs font-bold text-slate-600">PURCHASE RETURN ORDER / DEBIT NOTE</p>
                  <p className="text-xs font-mono font-bold text-slate-900 mt-1">{printOrder.returnNumber}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 py-4 text-xs border-b border-slate-200">
                <div className="space-y-1">
                  <div><span className="font-semibold text-slate-500">Kepada Supplier:</span> <strong className="text-slate-900">{printOrder.supplierName}</strong></div>
                  <div><span className="font-semibold text-slate-500">Alamat:</span> <span>{printOrder.supplierAddress || '-'}</span></div>
                  <div><span className="font-semibold text-slate-500">Ref PO No:</span> <strong>{printOrder.poNumber || '-'}</strong></div>
                </div>
                <div className="space-y-1 text-right">
                  <div><span className="font-semibold text-slate-500">Tanggal Retur:</span> <strong>{printOrder.date}</strong></div>
                  <div><span className="font-semibold text-slate-500">Kompensasi:</span> <strong>{RETURN_TYPE_LABELS[printOrder.returnType]?.label || printOrder.returnType}</strong></div>
                  <div><span className="font-semibold text-slate-500">Total Nilai:</span> <strong className="text-rose-700 font-bold">{printOrder.currency} {(printOrder.totalReturnAmount || 0).toLocaleString()}</strong></div>
                </div>
              </div>

              <div className="my-6">
                <table className="w-full text-xs text-left border border-slate-300">
                  <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                    <tr>
                      <th className="p-2 border-r border-slate-300 text-center w-10">No</th>
                      <th className="p-2 border-r border-slate-300">Nama Barang</th>
                      <th className="p-2 border-r border-slate-300 text-center w-20">Qty Retur</th>
                      <th className="p-2 border-r border-slate-300 text-center w-16">Satuan</th>
                      <th className="p-2 border-r border-slate-300 text-right w-28">Harga Satuan</th>
                      <th className="p-2 border-r border-slate-300 text-right w-32">Total Nilai</th>
                      <th className="p-2">Keterangan Kerusakan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-300">
                    {(printOrder.items || []).map((itm, idx) => (
                      <tr key={idx}>
                        <td className="p-2 border-r border-slate-300 text-center">{idx + 1}</td>
                        <td className="p-2 border-r border-slate-300 font-medium">{itm.itemName}</td>
                        <td className="p-2 border-r border-slate-300 text-center font-bold">{itm.qty}</td>
                        <td className="p-2 border-r border-slate-300 text-center">{itm.uom}</td>
                        <td className="p-2 border-r border-slate-300 text-right">{(itm.unitPrice || 0).toLocaleString()}</td>
                        <td className="p-2 border-r border-slate-300 text-right font-bold text-rose-800">{(itm.totalPrice || 0).toLocaleString()}</td>
                        <td className="p-2 text-slate-600">{itm.defectReason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="grid grid-cols-3 gap-6 pt-8 text-center text-xs">
                <div>
                  <p className="font-semibold text-slate-500 mb-14">Dibuat Oleh (Purchasing/WH),</p>
                  <p className="font-bold text-slate-800 border-t border-slate-400 pt-1">( ........................................ )</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-500 mb-14">Disetujui Manager,</p>
                  <p className="font-bold text-slate-800 border-t border-slate-400 pt-1">( ........................................ )</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-500 mb-14">Diterima Pihak Supplier,</p>
                  <p className="font-bold text-slate-800 border-t border-slate-400 pt-1">( ........................................ )</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
