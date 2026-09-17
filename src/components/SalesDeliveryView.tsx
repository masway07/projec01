import React, { useState, useMemo } from 'react';
import { SalesDeliveryItem, SalesDeliveryStatus, CompanySettings, AppUser } from '../types';
import {
  Truck,
  Plus,
  FileSpreadsheet,
  Printer,
  Search,
  CheckCircle2,
  Clock,
  MapPin,
  FileText,
  Edit2,
  Trash2,
  Receipt,
  X,
  Send,
  AlertCircle
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface SalesDeliveryViewProps {
  deliveryItems: SalesDeliveryItem[];
  onAddDelivery: (item: Omit<SalesDeliveryItem, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateDelivery: (id: string, updates: Partial<SalesDeliveryItem>) => void;
  onDeleteDelivery: (id: string) => void;
  onGenerateInvoice?: (delivery: SalesDeliveryItem) => void;
  currentUser: AppUser | null;
  companySettings?: CompanySettings;
  activeSalesTab?: 'sales-plan' | 'sales-delivery' | 'sales-invoice';
  onSwitchSalesTab?: (tab: 'sales-plan' | 'sales-delivery' | 'sales-invoice') => void;
}

const STATUS_COLORS: Record<SalesDeliveryStatus, { bg: string; text: string; border: string }> = {
  Draft: { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300' },
  Scheduled: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  'In Transit': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  Delivered: { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' },
  Received: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  Cancelled: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' }
};

export const SalesDeliveryView: React.FC<SalesDeliveryViewProps> = ({
  deliveryItems = [],
  onAddDelivery,
  onUpdateDelivery,
  onDeleteDelivery,
  onGenerateInvoice,
  currentUser,
  companySettings,
  activeSalesTab = 'sales-delivery',
  onSwitchSalesTab
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [customerFilter, setCustomerFilter] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SalesDeliveryItem | null>(null);
  const [printItem, setPrintItem] = useState<SalesDeliveryItem | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    deliveryNo: '',
    poNumber: '',
    deliveryDate: new Date().toISOString().split('T')[0],
    customer: '',
    partNo: '',
    itemName: '',
    qty: 1000,
    uom: 'PCS',
    vehiclePlate: '',
    driverName: '',
    destinationAddress: '',
    recipientName: '',
    status: 'Scheduled' as SalesDeliveryStatus,
    notes: '',
    unitPriceUSD: 0,
    totalAmountUSD: 0
  });

  // Unique customers
  const customers = useMemo(() => {
    const set = new Set<string>();
    deliveryItems.forEach(d => {
      if (d.customer) set.add(d.customer);
    });
    return Array.from(set).sort();
  }, [deliveryItems]);

  // Filtered deliveries
  const filteredDeliveries = useMemo(() => {
    return deliveryItems.filter(item => {
      if (statusFilter !== 'ALL' && item.status !== statusFilter) return false;
      if (customerFilter !== 'ALL' && item.customer !== customerFilter) return false;
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchNo = item.deliveryNo?.toLowerCase().includes(query);
        const matchPo = item.poNumber?.toLowerCase().includes(query);
        const matchCust = item.customer?.toLowerCase().includes(query);
        const matchPart = item.partNo?.toLowerCase().includes(query);
        const matchName = item.itemName?.toLowerCase().includes(query);
        const matchDriver = item.driverName?.toLowerCase().includes(query);
        const matchPlate = item.vehiclePlate?.toLowerCase().includes(query);
        if (!matchNo && !matchPo && !matchCust && !matchPart && !matchName && !matchDriver && !matchPlate) {
          return false;
        }
      }
      return true;
    });
  }, [deliveryItems, statusFilter, customerFilter, searchTerm]);

  // Statistics
  const stats = useMemo(() => {
    const totalCount = deliveryItems.length;
    const inTransitCount = deliveryItems.filter(d => d.status === 'In Transit' || d.status === 'Scheduled').length;
    const completedCount = deliveryItems.filter(d => d.status === 'Delivered' || d.status === 'Received').length;
    const totalQty = deliveryItems.reduce((acc, curr) => acc + (Number(curr.qty) || 0), 0);
    const uninvoicedCount = deliveryItems.filter(d => !d.invoiced && (d.status === 'Delivered' || d.status === 'Received')).length;

    return { totalCount, inTransitCount, completedCount, totalQty, uninvoicedCount };
  }, [deliveryItems]);

  const handleOpenAddModal = () => {
    const nextSeq = deliveryItems.length + 1;
    const monthStr = String(new Date().getMonth() + 1).padStart(2, '0');
    const defaultDeliveryNo = `DO/${new Date().getFullYear()}/${monthStr}/${String(nextSeq).padStart(3, '0')}`;

    setEditingItem(null);
    setFormData({
      deliveryNo: defaultDeliveryNo,
      poNumber: '',
      deliveryDate: new Date().toISOString().split('T')[0],
      customer: customers[0] || 'PT Astra Honda Motor',
      partNo: '',
      itemName: '',
      qty: 1000,
      uom: 'PCS',
      vehiclePlate: 'B 9482 TYN',
      driverName: 'Budi Santoso',
      destinationAddress: '',
      recipientName: '',
      status: 'Scheduled',
      notes: '',
      unitPriceUSD: 0,
      totalAmountUSD: 0
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: SalesDeliveryItem) => {
    setEditingItem(item);
    setFormData({
      deliveryNo: item.deliveryNo || '',
      poNumber: item.poNumber || '',
      deliveryDate: item.deliveryDate || new Date().toISOString().split('T')[0],
      customer: item.customer || '',
      partNo: item.partNo || '',
      itemName: item.itemName || '',
      qty: item.qty || 0,
      uom: item.uom || 'PCS',
      vehiclePlate: item.vehiclePlate || '',
      driverName: item.driverName || '',
      destinationAddress: item.destinationAddress || '',
      recipientName: item.recipientName || '',
      status: item.status || 'Scheduled',
      notes: item.notes || '',
      unitPriceUSD: item.unitPriceUSD || 0,
      totalAmountUSD: item.totalAmountUSD || 0
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.deliveryNo.trim() || !formData.customer.trim() || !formData.itemName.trim()) {
      alert('Mohon lengkapi No. Surat Jalan, Customer, dan Nama Barang!');
      return;
    }

    const totalUSD = (Number(formData.qty) || 0) * (Number(formData.unitPriceUSD) || 0);

    if (editingItem) {
      onUpdateDelivery(editingItem.id, {
        ...formData,
        totalAmountUSD: totalUSD
      });
    } else {
      onAddDelivery({
        ...formData,
        totalAmountUSD: totalUSD,
        invoiced: false
      });
    }

    setIsModalOpen(false);
  };

  const handleQuickStatusChange = (id: string, newStatus: SalesDeliveryStatus) => {
    onUpdateDelivery(id, { status: newStatus });
  };

  // Export Excel
  const handleExportExcel = () => {
    const dataToExport = filteredDeliveries.map((item, idx) => ({
      'No': idx + 1,
      'No. Surat Jalan (DO)': item.deliveryNo,
      'No. PO Customer': item.poNumber,
      'Tanggal Pengiriman': item.deliveryDate,
      'Customer': item.customer,
      'Part Number': item.partNo || '-',
      'Nama Barang / Part': item.itemName,
      'Qty': item.qty,
      'Satuan': item.uom,
      'No. Polisi Kendaraan': item.vehiclePlate || '-',
      'Nama Supir': item.driverName || '-',
      'Penerima Gudang': item.recipientName || '-',
      'Alamat Tujuan': item.destinationAddress || '-',
      'Status': item.status,
      'Sudah Ditagih (Invoiced)': item.invoiced ? 'Sudah' : 'Belum',
      'No. Invoice': item.invoiceNo || '-',
      'Catatan': item.notes || ''
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sales Delivery');
    XLSX.writeFile(wb, `Sales_Delivery_Orders_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* Sub-Navigation Tabs for Sales */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onSwitchSalesTab && onSwitchSalesTab('sales-plan')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition cursor-pointer flex items-center gap-2 ${
              activeSalesTab === 'sales-plan'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Sales Plan</span>
          </button>
          <button
            type="button"
            onClick={() => onSwitchSalesTab && onSwitchSalesTab('sales-delivery')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition cursor-pointer flex items-center gap-2 ${
              activeSalesTab === 'sales-delivery'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>Sales Delivery (Surat Jalan)</span>
          </button>
          <button
            type="button"
            onClick={() => onSwitchSalesTab && onSwitchSalesTab('sales-invoice')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition cursor-pointer flex items-center gap-2 ${
              activeSalesTab === 'sales-invoice'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>Sales Invoice (Faktur Penjualan)</span>
          </button>
        </div>
      </div>

      {/* Header Info & Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-indigo-100 text-indigo-700 rounded-xl">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Sales Delivery (Surat Jalan)</h1>
              <p className="text-sm text-slate-500">
                Pengelolaan dokumen pengiriman barang, nomor surat jalan (DO), tracking armada, dan status penerimaan customer
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportExcel}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-xl transition flex items-center gap-2 shadow-xs cursor-pointer"
            title="Download Excel"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export Excel</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAddModal}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition flex items-center gap-2 shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Buat Surat Jalan</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">Total Pengiriman</span>
            <span className="text-2xl font-bold text-slate-800 mt-1 block">{stats.totalCount} DO</span>
            <span className="text-xs text-slate-500">Seluruh dokumen surat jalan</span>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <FileText className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">Dalam Perjalanan</span>
            <span className="text-2xl font-bold text-amber-600 mt-1 block">{stats.inTransitCount} DO</span>
            <span className="text-xs text-amber-600/80">Scheduled & In Transit</span>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">Sukses Diterima</span>
            <span className="text-2xl font-bold text-emerald-600 mt-1 block">{stats.completedCount} DO</span>
            <span className="text-xs text-emerald-600/80">Telah sampai di customer</span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">Total Qty Terkirim</span>
            <span className="text-2xl font-bold text-indigo-600 mt-1 block">
              {stats.totalQty.toLocaleString('id-ID')}
            </span>
            <span className="text-xs text-indigo-600/80">
              {stats.uninvoicedCount > 0 ? `${stats.uninvoicedCount} DO belum dibuat faktur` : 'Semua sudah ditagih'}
            </span>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Truck className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari No. DO, No. PO, Customer, Part No, Supir, Plat Mobil..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-700 bg-white focus:outline-hidden focus:border-indigo-500"
          >
            <option value="ALL">Semua Status</option>
            <option value="Scheduled">Scheduled</option>
            <option value="In Transit">In Transit</option>
            <option value="Delivered">Delivered</option>
            <option value="Received">Received</option>
            <option value="Cancelled">Cancelled</option>
          </select>

          <select
            value={customerFilter}
            onChange={(e) => setCustomerFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-700 bg-white focus:outline-hidden focus:border-indigo-500 max-w-[200px] truncate"
          >
            <option value="ALL">Semua Customer</option>
            {customers.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table Data */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50/80 text-slate-700 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-4 py-3.5">No. DO / Surat Jalan</th>
                <th className="px-4 py-3.5">Tanggal</th>
                <th className="px-4 py-3.5">Customer & No. PO</th>
                <th className="px-4 py-3.5">Part & Item Barang</th>
                <th className="px-4 py-3.5 text-right">Qty</th>
                <th className="px-4 py-3.5">Armada / Driver</th>
                <th className="px-4 py-3.5 text-center">Status</th>
                <th className="px-4 py-3.5 text-center">Faktur (Invoice)</th>
                <th className="px-4 py-3.5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDeliveries.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-slate-400">
                    <Truck className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    <p className="font-medium">Tidak ada data Surat Jalan yang ditemukan</p>
                    <p className="text-xs text-slate-400 mt-1">Coba sesuaikan kata kunci pencarian atau buat surat jalan baru</p>
                  </td>
                </tr>
              ) : (
                filteredDeliveries.map((item) => {
                  const statusStyle = STATUS_COLORS[item.status] || STATUS_COLORS.Scheduled;
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition">
                      <td className="px-4 py-3 font-semibold text-slate-800 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-indigo-500 shrink-0" />
                          <span>{item.deliveryNo}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-slate-600">
                        {item.deliveryDate}
                      </td>
                      <td className="px-4 py-3 min-w-[200px]">
                        <div className="font-semibold text-slate-800">{item.customer}</div>
                        <div className="text-xs text-slate-400 font-mono">PO: {item.poNumber || '-'}</div>
                      </td>
                      <td className="px-4 py-3 min-w-[220px]">
                        <div className="font-medium text-slate-800">{item.itemName}</div>
                        <div className="text-xs text-slate-400 font-mono">{item.partNo || '-'}</div>
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <span className="font-bold text-slate-800">{item.qty?.toLocaleString('id-ID')}</span>{' '}
                        <span className="text-xs text-slate-500 uppercase">{item.uom}</span>
                      </td>
                      <td className="px-4 py-3 text-xs whitespace-nowrap">
                        <div className="font-semibold text-slate-700">{item.vehiclePlate || '-'}</div>
                        <div className="text-slate-400">{item.driverName || '-'}</div>
                      </td>
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        {item.invoiced ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            {item.invoiceNo || 'Invoiced'}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                            Belum Ditagih
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Print DO Button */}
                          <button
                            type="button"
                            onClick={() => setPrintItem(item)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                            title="Cetak Surat Jalan Resmi"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          {/* Quick Invoice Button if delivered & uninvoiced */}
                          {!item.invoiced && onGenerateInvoice && (
                            <button
                              type="button"
                              onClick={() => onGenerateInvoice(item)}
                              className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition cursor-pointer"
                              title="Buat Invoice dari DO ini"
                            >
                              <Receipt className="w-4 h-4" />
                            </button>
                          )}

                          {/* Status cycle button */}
                          {item.status === 'Scheduled' && (
                            <button
                              type="button"
                              onClick={() => handleQuickStatusChange(item.id, 'In Transit')}
                              className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition cursor-pointer text-xs font-semibold"
                              title="Kirim (In Transit)"
                            >
                              <Send className="w-4 h-4" />
                            </button>
                          )}
                          {item.status === 'In Transit' && (
                            <button
                              type="button"
                              onClick={() => handleQuickStatusChange(item.id, 'Received')}
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition cursor-pointer"
                              title="Tandai Diterima Customer"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                          )}

                          {/* Edit Button */}
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(item)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {/* Delete Button */}
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Yakin ingin menghapus Surat Jalan "${item.deliveryNo}"?`)) {
                                onDeleteDelivery(item.id);
                              }
                            }}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
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

      {/* Modal Add / Edit Delivery Order */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-100 text-indigo-700 rounded-xl">
                  <Truck className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-800 text-lg">
                  {editingItem ? 'Edit Surat Jalan' : 'Buat Surat Jalan Baru'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    No. Surat Jalan (DO) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.deliveryNo}
                    onChange={(e) => setFormData({ ...formData, deliveryNo: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono"
                    placeholder="DO/2026/03/001"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Tanggal Pengiriman *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.deliveryDate}
                    onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Customer *
                  </label>
                  <input
                    type="text"
                    required
                    list="customer-suggestions"
                    value={formData.customer}
                    onChange={(e) => setFormData({ ...formData, customer: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    placeholder="PT Astra Honda Motor"
                  />
                  <datalist id="customer-suggestions">
                    <option value="PT Astra Honda Motor" />
                    <option value="Jatco (Guangzhou)" />
                    <option value="PT FCC Indonesia" />
                    <option value="HPPM" />
                    <option value="PT Aichikiki Autoparts" />
                    <option value="PT Honda Trading" />
                    <option value="Kaneta Kogyo Co., Ltd" />
                  </datalist>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    No. PO Customer
                  </label>
                  <input
                    type="text"
                    value={formData.poNumber}
                    onChange={(e) => setFormData({ ...formData, poNumber: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    placeholder="PO-AHM-2026-088"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Part Number
                  </label>
                  <input
                    type="text"
                    value={formData.partNo}
                    onChange={(e) => setFormData({ ...formData, partNo: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono"
                    placeholder="10110-AHM-001"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Nama Barang / Deskripsi *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.itemName}
                    onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    placeholder="Flange Collar Comp 12mm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Kuantitas (Qty) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.qty}
                    onChange={(e) => setFormData({ ...formData, qty: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Satuan (UoM)
                  </label>
                  <input
                    type="text"
                    value={formData.uom}
                    onChange={(e) => setFormData({ ...formData, uom: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    placeholder="PCS"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Status Pengiriman
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as SalesDeliveryStatus })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:border-indigo-500"
                  >
                    <option value="Scheduled">Scheduled</option>
                    <option value="In Transit">In Transit</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Received">Received</option>
                    <option value="Draft">Draft</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    No. Polisi Kendaraan
                  </label>
                  <input
                    type="text"
                    value={formData.vehiclePlate}
                    onChange={(e) => setFormData({ ...formData, vehiclePlate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    placeholder="B 9842 TYN (Box Truck)"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Nama Pengemudi (Driver)
                  </label>
                  <input
                    type="text"
                    value={formData.driverName}
                    onChange={(e) => setFormData({ ...formData, driverName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    placeholder="Budi Santoso"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Alamat Tujuan Pengiriman
                </label>
                <input
                  type="text"
                  value={formData.destinationAddress}
                  onChange={(e) => setFormData({ ...formData, destinationAddress: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  placeholder="Kawasan Industri MM2100 Cikarang Barat"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Penerima Gudang Customer
                  </label>
                  <input
                    type="text"
                    value={formData.recipientName}
                    onChange={(e) => setFormData({ ...formData, recipientName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    placeholder="Hendra (Incoming QC)"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Estimasi Unit Price USD (Opsional)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.unitPriceUSD}
                    onChange={(e) => setFormData({ ...formData, unitPriceUSD: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    placeholder="3.50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Catatan Pengiriman
                </label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  placeholder="Instruksi handling khusus, nomor pallet, atau catatan ekspedisi"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition cursor-pointer"
                >
                  {editingItem ? 'Simpan Perubahan' : 'Terbitkan Surat Jalan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Official Print Modal */}
      {printItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[95vh] overflow-y-auto shadow-2xl p-6 border border-slate-200">
            {/* Action Bar */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-6 print:hidden">
              <span className="text-sm font-bold text-slate-700">Preview Cetak Surat Jalan (Delivery Order)</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak / Print</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPrintItem(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Print Document Content */}
            <div className="border border-slate-300 p-6 rounded-lg font-sans text-slate-900">
              {/* Header Company */}
              <div className="flex items-start justify-between border-b-2 border-slate-800 pb-4 mb-4">
                <div className="flex items-center gap-3">
                  {companySettings?.logoUrl ? (
                    <img
                      src={companySettings.logoUrl}
                      alt="Logo"
                      className="h-12 w-auto max-w-[120px] object-contain"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-indigo-700 text-white rounded-lg flex items-center justify-center font-bold text-lg">
                      KI
                    </div>
                  )}
                  <div>
                    <h2 className="font-extrabold text-base tracking-tight text-slate-900">
                      {companySettings?.companyName || 'PT. KANETA INDONESIA'}
                    </h2>
                    <p className="text-[11px] text-slate-600 max-w-md leading-tight">
                      {companySettings?.address || 'Jl. Maligi VI, Kawasan Industri KIIC, Sukaluyu, Telukjambe Timur, Karawang 41361'}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <h1 className="text-xl font-black text-slate-900 tracking-wider uppercase">SURAT JALAN</h1>
                  <p className="text-xs font-mono font-bold text-indigo-700">DELIVERY ORDER</p>
                </div>
              </div>

              {/* Delivery Meta */}
              <div className="grid grid-cols-2 gap-4 text-xs mb-6">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
                  <div className="font-bold text-slate-700 uppercase tracking-wide text-[10px] mb-1">Kepada (Customer):</div>
                  <div className="text-sm font-bold text-slate-900">{printItem.customer}</div>
                  <div className="text-slate-600 flex items-start gap-1">
                    <MapPin className="w-3 h-3 text-slate-400 mt-0.5 shrink-0" />
                    <span>{printItem.destinationAddress || 'Alamat Pabrik Customer'}</span>
                  </div>
                  <div className="text-slate-600">
                    <span className="font-semibold">UP / Penerima:</span> {printItem.recipientName || '-'}
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500">No. Surat Jalan:</span>
                    <span className="font-mono font-bold text-slate-900">{printItem.deliveryNo}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Tanggal Kirim:</span>
                    <span className="font-semibold text-slate-800">{printItem.deliveryDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">No. PO Customer:</span>
                    <span className="font-mono font-semibold text-slate-800">{printItem.poNumber || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Armada / No. Pol:</span>
                    <span className="font-semibold text-slate-800">{printItem.vehiclePlate || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Pengemudi:</span>
                    <span className="font-semibold text-slate-800">{printItem.driverName || '-'}</span>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <table className="w-full text-xs border border-slate-300 mb-6">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-300 font-bold text-slate-800 text-center">
                    <th className="py-2 px-2 border-r border-slate-300 w-10">No</th>
                    <th className="py-2 px-3 border-r border-slate-300 w-36">Part Number</th>
                    <th className="py-2 px-3 border-r border-slate-300 text-left">Nama Barang / Spesifikasi</th>
                    <th className="py-2 px-3 border-r border-slate-300 w-24">Jumlah (Qty)</th>
                    <th className="py-2 px-3 border-r border-slate-300 w-16">Satuan</th>
                    <th className="py-2 px-3 text-left">Keterangan</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-slate-200">
                    <td className="py-3 px-2 text-center border-r border-slate-300">1</td>
                    <td className="py-3 px-3 font-mono font-semibold border-r border-slate-300">{printItem.partNo || '-'}</td>
                    <td className="py-3 px-3 font-semibold text-slate-900 border-r border-slate-300">
                      {printItem.itemName}
                      {printItem.notes && <div className="text-[10px] text-slate-500 font-normal italic mt-0.5">{printItem.notes}</div>}
                    </td>
                    <td className="py-3 px-3 text-right font-bold border-r border-slate-300 text-sm">
                      {printItem.qty?.toLocaleString('id-ID')}
                    </td>
                    <td className="py-3 px-3 text-center uppercase border-r border-slate-300">{printItem.uom}</td>
                    <td className="py-3 px-3 text-slate-600">Baik / Original Factory Sealed</td>
                  </tr>
                </tbody>
              </table>

              {/* Note / Terms */}
              <div className="text-[11px] text-slate-500 mb-8 space-y-0.5">
                <p><strong>Perhatian:</strong></p>
                <p>1. Barang-barang yang tertera di atas telah diperiksa dalam kondisi baik dan lengkap.</p>
                <p>2. Surat jalan asli harus ditandatangani dan dicap stempel oleh pihak penerima gudang customer.</p>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                <div className="border border-slate-200 p-2 rounded-lg">
                  <div className="text-[10px] font-semibold text-slate-500 mb-14">Dibuat Oleh (Gudang):</div>
                  <div className="border-t border-slate-400 pt-1 font-bold text-slate-800">
                    {currentUser?.name || 'Staff Logistik'}
                  </div>
                </div>

                <div className="border border-slate-200 p-2 rounded-lg">
                  <div className="text-[10px] font-semibold text-slate-500 mb-14">Mengetahui (PPC/Dept Head):</div>
                  <div className="border-t border-slate-400 pt-1 font-bold text-slate-800">
                    Spv / Dept Head
                  </div>
                </div>

                <div className="border border-slate-200 p-2 rounded-lg">
                  <div className="text-[10px] font-semibold text-slate-500 mb-14">Pengemudi (Driver):</div>
                  <div className="border-t border-slate-400 pt-1 font-bold text-slate-800">
                    {printItem.driverName || 'Driver'}
                  </div>
                </div>

                <div className="border border-slate-200 p-2 rounded-lg">
                  <div className="text-[10px] font-semibold text-slate-500 mb-14">Diterima Oleh (Customer):</div>
                  <div className="border-t border-slate-400 pt-1 font-bold text-slate-800">
                    {printItem.recipientName || 'Tanda Tangan & Cap'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
