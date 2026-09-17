import React, { useState, useMemo } from 'react';
import {
  SalesInvoiceItem,
  SalesInvoiceStatus,
  SalesDeliveryItem,
  CompanySettings,
  AppUser,
  ExchangeRates
} from '../types';
import {
  Receipt,
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
  DollarSign,
  Truck,
  X,
  CreditCard,
  Building2
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface SalesInvoiceViewProps {
  invoiceItems: SalesInvoiceItem[];
  deliveryItems?: SalesDeliveryItem[];
  ratesByYear: Record<string, ExchangeRates>;
  onAddInvoice: (item: Omit<SalesInvoiceItem, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateInvoice: (id: string, updates: Partial<SalesInvoiceItem>) => void;
  onDeleteInvoice: (id: string) => void;
  currentUser: AppUser | null;
  companySettings?: CompanySettings;
  activeSalesTab?: 'sales-plan' | 'sales-delivery' | 'sales-invoice';
  onSwitchSalesTab?: (tab: 'sales-plan' | 'sales-delivery' | 'sales-invoice') => void;
}

const STATUS_COLORS: Record<SalesInvoiceStatus, { bg: string; text: string; border: string }> = {
  Draft: { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300' },
  Sent: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  'Partially Paid': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  Paid: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  Overdue: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-300' },
  Cancelled: { bg: 'bg-slate-50', text: 'text-slate-500', border: 'border-slate-200' }
};

export const SalesInvoiceView: React.FC<SalesInvoiceViewProps> = ({
  invoiceItems = [],
  deliveryItems = [],
  ratesByYear = {},
  onAddInvoice,
  onUpdateInvoice,
  onDeleteInvoice,
  currentUser,
  companySettings,
  activeSalesTab = 'sales-invoice',
  onSwitchSalesTab
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [customerFilter, setCustomerFilter] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SalesInvoiceItem | null>(null);
  const [printItem, setPrintItem] = useState<SalesInvoiceItem | null>(null);

  // Current year exchange rate
  const currentYear = '2026';
  const usdToIdrRate = ratesByYear[currentYear]?.IDR || 16273.56;

  // Form State
  const [formData, setFormData] = useState({
    invoiceNo: '',
    taxInvoiceNo: '',
    deliveryNo: '',
    poNumber: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    customer: '',
    customerTaxId: '',
    customerAddress: '',
    description: '',
    currency: 'USD',
    rate: usdToIdrRate,
    subtotal: 10000,
    taxRatePercent: 11,
    taxAmount: 1100,
    totalAmount: 11100,
    status: 'Sent' as SalesInvoiceStatus,
    paymentDate: '',
    bankAccount: 'BTM USD A/C 665-894622',
    notes: 'Pembayaran ditransfer sesuai nomor rekening tertera (TOP 30 Hari)'
  });

  // Unique customers
  const customers = useMemo(() => {
    const set = new Set<string>();
    invoiceItems.forEach(inv => {
      if (inv.customer) set.add(inv.customer);
    });
    return Array.from(set).sort();
  }, [invoiceItems]);

  // Filtered invoices
  const filteredInvoices = useMemo(() => {
    return invoiceItems.filter(item => {
      if (statusFilter !== 'ALL' && item.status !== statusFilter) return false;
      if (customerFilter !== 'ALL' && item.customer !== customerFilter) return false;
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchInv = item.invoiceNo?.toLowerCase().includes(query);
        const matchTax = item.taxInvoiceNo?.toLowerCase().includes(query);
        const matchDo = item.deliveryNo?.toLowerCase().includes(query);
        const matchPo = item.poNumber?.toLowerCase().includes(query);
        const matchCust = item.customer?.toLowerCase().includes(query);
        const matchDesc = item.description?.toLowerCase().includes(query);
        if (!matchInv && !matchTax && !matchDo && !matchPo && !matchCust && !matchDesc) {
          return false;
        }
      }
      return true;
    });
  }, [invoiceItems, statusFilter, customerFilter, searchTerm]);

  // Financial Stats
  const stats = useMemo(() => {
    const totalCount = invoiceItems.length;
    let totalBilledUSD = 0;
    let totalPaidUSD = 0;
    let totalOutstandingUSD = 0;
    let overdueCount = 0;

    invoiceItems.forEach(inv => {
      const amountUSD = inv.totalAmountUSD || inv.totalAmount || 0;
      totalBilledUSD += amountUSD;

      if (inv.status === 'Paid') {
        totalPaidUSD += amountUSD;
      } else {
        totalOutstandingUSD += amountUSD;
        if (inv.status === 'Overdue') {
          overdueCount++;
        }
      }
    });

    return {
      totalCount,
      totalBilledUSD,
      totalPaidUSD,
      totalOutstandingUSD,
      overdueCount,
      totalBilledIDR: totalBilledUSD * usdToIdrRate,
      totalPaidIDR: totalPaidUSD * usdToIdrRate,
      totalOutstandingIDR: totalOutstandingUSD * usdToIdrRate
    };
  }, [invoiceItems, usdToIdrRate]);

  // Handle DO Selection to Autofill
  const handleSelectDeliveryOrder = (doNo: string) => {
    const foundDo = deliveryItems.find(d => d.deliveryNo === doNo);
    if (foundDo) {
      const estimatedSubtotal = foundDo.totalAmountUSD || ((foundDo.qty || 1000) * (foundDo.unitPriceUSD || 3.5));
      const taxAmt = Math.round(estimatedSubtotal * 0.11 * 100) / 100;
      const grandTot = Math.round((estimatedSubtotal + taxAmt) * 100) / 100;

      setFormData(prev => ({
        ...prev,
        deliveryNo: foundDo.deliveryNo,
        poNumber: foundDo.poNumber || prev.poNumber,
        customer: foundDo.customer || prev.customer,
        description: `Penjualan ${foundDo.qty?.toLocaleString('id-ID')} ${foundDo.uom || 'PCS'} ${foundDo.itemName} (Part: ${foundDo.partNo || '-'})`,
        subtotal: estimatedSubtotal,
        taxAmount: taxAmt,
        totalAmount: grandTot
      }));
    }
  };

  const handleOpenAddModal = () => {
    const nextSeq = invoiceItems.length + 1;
    const monthStr = String(new Date().getMonth() + 1).padStart(2, '0');
    const defaultInvoiceNo = `INV/${new Date().getFullYear()}/${monthStr}/${String(nextSeq).padStart(4, '0')}`;
    const defaultTaxNo = `010.002-${String(new Date().getFullYear()).slice(-2)}.${String(77192830 + nextSeq)}`;

    setEditingItem(null);
    setFormData({
      invoiceNo: defaultInvoiceNo,
      taxInvoiceNo: defaultTaxNo,
      deliveryNo: '',
      poNumber: '',
      invoiceDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 1000 * 60 * 60).toISOString().split('T')[0],
      customer: customers[0] || 'PT Astra Honda Motor',
      customerTaxId: '01.328.948.2-054.000',
      customerAddress: 'Jl. Laksda Yos Sudarso, Sunter 1, Jakarta Utara 14350',
      description: 'Penjualan Komponen Otomotif Presisi',
      currency: 'USD',
      rate: usdToIdrRate,
      subtotal: 15000,
      taxRatePercent: 11,
      taxAmount: 1650,
      totalAmount: 16650,
      status: 'Sent',
      paymentDate: '',
      bankAccount: 'BTM USD A/C 665-894622',
      notes: 'Pembayaran ditransfer sesuai nomor rekening tertera (TOP 30 Hari)'
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: SalesInvoiceItem) => {
    setEditingItem(item);
    setFormData({
      invoiceNo: item.invoiceNo || '',
      taxInvoiceNo: item.taxInvoiceNo || '',
      deliveryNo: item.deliveryNo || '',
      poNumber: item.poNumber || '',
      invoiceDate: item.invoiceDate || new Date().toISOString().split('T')[0],
      dueDate: item.dueDate || new Date().toISOString().split('T')[0],
      customer: item.customer || '',
      customerTaxId: item.customerTaxId || '',
      customerAddress: item.customerAddress || '',
      description: item.description || '',
      currency: item.currency || 'USD',
      rate: item.rate || usdToIdrRate,
      subtotal: item.subtotal || 0,
      taxRatePercent: item.taxRatePercent !== undefined ? item.taxRatePercent : 11,
      taxAmount: item.taxAmount || 0,
      totalAmount: item.totalAmount || 0,
      status: item.status || 'Sent',
      paymentDate: item.paymentDate || '',
      bankAccount: item.bankAccount || 'BTM USD A/C 665-894622',
      notes: item.notes || ''
    });
    setIsModalOpen(true);
  };

  // Recalculate tax and total on form change
  const handleAmountChange = (subtotalVal: number, taxRateVal: number) => {
    const taxAmt = Math.round((subtotalVal * (taxRateVal / 100)) * 100) / 100;
    const totalAmt = Math.round((subtotalVal + taxAmt) * 100) / 100;
    setFormData(prev => ({
      ...prev,
      subtotal: subtotalVal,
      taxRatePercent: taxRateVal,
      taxAmount: taxAmt,
      totalAmount: totalAmt
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.invoiceNo.trim() || !formData.customer.trim() || !formData.description.trim()) {
      alert('Mohon lengkapi No. Invoice, Customer, dan Deskripsi Tagihan!');
      return;
    }

    const rate = formData.currency === 'USD' ? 1 : formData.rate;
    const totalUSD = formData.currency === 'USD' ? formData.totalAmount : formData.totalAmount / (formData.rate || usdToIdrRate);
    const totalIDR = formData.currency === 'USD' ? formData.totalAmount * usdToIdrRate : formData.totalAmount;

    if (editingItem) {
      onUpdateInvoice(editingItem.id, {
        ...formData,
        totalAmountUSD: Math.round(totalUSD * 100) / 100,
        totalAmountIDR: Math.round(totalIDR)
      });
    } else {
      onAddInvoice({
        ...formData,
        totalAmountUSD: Math.round(totalUSD * 100) / 100,
        totalAmountIDR: Math.round(totalIDR)
      });
    }

    setIsModalOpen(false);
  };

  const handleMarkAsPaid = (item: SalesInvoiceItem) => {
    const today = new Date().toISOString().split('T')[0];
    onUpdateInvoice(item.id, {
      status: 'Paid',
      paymentDate: today
    });
  };

  // Export Excel
  const handleExportExcel = () => {
    const dataToExport = filteredInvoices.map((item, idx) => ({
      'No': idx + 1,
      'No. Invoice': item.invoiceNo,
      'No. Faktur Pajak': item.taxInvoiceNo || '-',
      'Tanggal Invoice': item.invoiceDate,
      'Jatuh Tempo (Due Date)': item.dueDate,
      'Customer': item.customer,
      'NPWP Customer': item.customerTaxId || '-',
      'No. PO Customer': item.poNumber || '-',
      'Ref. Surat Jalan (DO)': item.deliveryNo || '-',
      'Deskripsi / Barang': item.description,
      'Mata Uang': item.currency,
      'DPP (Subtotal)': item.subtotal,
      'Tarif PPN (%)': item.taxRatePercent,
      'Nilai PPN': item.taxAmount,
      'Total Tagihan': item.totalAmount,
      'Total Tagihan (USD)': item.totalAmountUSD,
      'Total Tagihan (IDR)': item.totalAmountIDR,
      'Status Pembayaran': item.status,
      'Tanggal Pembayaran': item.paymentDate || '-',
      'Rekening Penerima': item.bankAccount || '-',
      'Catatan': item.notes || ''
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sales Invoices');
    XLSX.writeFile(wb, `Sales_Invoices_${new Date().toISOString().split('T')[0]}.xlsx`);
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
            <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl">
              <Receipt className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Sales Invoice (Faktur Penjualan)</h1>
              <p className="text-sm text-slate-500">
                Penerbitan commercial invoice, faktur pajak, kontrol piutang usaha (A/R), dan status pelunasan customer
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
            <span>+ Buat Invoice Baru</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">Total Faktur Diterbitkan</span>
            <span className="text-2xl font-bold text-slate-800 mt-1 block">{stats.totalCount} Invoice</span>
            <span className="text-xs text-slate-500">Seluruh dokumen komersial</span>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <FileText className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">Total Nilai Tagihan</span>
            <span className="text-2xl font-bold text-indigo-600 mt-1 block">
              ${stats.totalBilledUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-xs text-indigo-600/80">
              ≈ Rp {Math.round(stats.totalBilledIDR).toLocaleString('id-ID')}
            </span>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">Sudah Terbayar (Lunas)</span>
            <span className="text-2xl font-bold text-emerald-600 mt-1 block">
              ${stats.totalPaidUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-xs text-emerald-600/80">
              Dana masuk ke rekening kas/bank
            </span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">Sisa Piutang (Outstanding)</span>
            <span className="text-2xl font-bold text-amber-600 mt-1 block">
              ${stats.totalOutstandingUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-xs text-rose-600 font-semibold">
              {stats.overdueCount > 0 ? `${stats.overdueCount} Invoice Jatuh Tempo (Overdue)` : 'Belum jatuh tempo'}
            </span>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <CreditCard className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari No. Invoice, Faktur Pajak, DO, Customer, No. PO..."
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
            <option value="Sent">Sent (Terkirim / Belum Bayar)</option>
            <option value="Paid">Paid (Lunas)</option>
            <option value="Overdue">Overdue (Jatuh Tempo)</option>
            <option value="Partially Paid">Partially Paid</option>
            <option value="Draft">Draft</option>
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

      {/* Table Invoices */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50/80 text-slate-700 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-4 py-3.5">No. Invoice & Faktur Pajak</th>
                <th className="px-4 py-3.5">Tanggal & Due Date</th>
                <th className="px-4 py-3.5">Customer & Ref PO / DO</th>
                <th className="px-4 py-3.5">Rincian Penjualan</th>
                <th className="px-4 py-3.5 text-right">DPP (Subtotal)</th>
                <th className="px-4 py-3.5 text-right">PPN (11%)</th>
                <th className="px-4 py-3.5 text-right">Total Tagihan</th>
                <th className="px-4 py-3.5 text-center">Status</th>
                <th className="px-4 py-3.5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-slate-400">
                    <Receipt className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    <p className="font-medium">Tidak ada data Faktur Invoice yang ditemukan</p>
                    <p className="text-xs text-slate-400 mt-1">Coba sesuaikan filter pencarian atau buat invoice baru</p>
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((item) => {
                  const statusStyle = STATUS_COLORS[item.status] || STATUS_COLORS.Sent;
                  const isOverdue = item.status === 'Overdue';

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="font-bold text-slate-800 flex items-center gap-1.5">
                          <Receipt className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>{item.invoiceNo}</span>
                        </div>
                        <div className="text-xs font-mono text-slate-400 mt-0.5">
                          FP: {item.taxInvoiceNo || '-'}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs">
                        <div className="text-slate-700 font-medium">{item.invoiceDate}</div>
                        <div className={`mt-0.5 flex items-center gap-1 font-semibold ${isOverdue ? 'text-rose-600' : 'text-slate-400'}`}>
                          <Clock className="w-3 h-3" />
                          <span>Due: {item.dueDate}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 min-w-[200px]">
                        <div className="font-semibold text-slate-800">{item.customer}</div>
                        <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                          {item.poNumber && <span>PO: {item.poNumber}</span>}
                          {item.deliveryNo && <span className="font-mono text-indigo-600">DO: {item.deliveryNo}</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3 min-w-[220px]">
                        <div className="text-slate-800 text-xs font-medium line-clamp-2">{item.description}</div>
                        {item.bankAccount && (
                          <div className="text-[11px] text-slate-400 mt-0.5 truncate">
                            Bank: {item.bankAccount}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap font-medium text-slate-700">
                        {item.currency === 'USD' ? '$' : 'Rp '}{item.subtotal?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap text-xs text-slate-500">
                        {item.currency === 'USD' ? '$' : 'Rp '}{item.taxAmount?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        <div className="text-[10px] text-slate-400">({item.taxRatePercent}%)</div>
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="font-bold text-slate-900 text-sm">
                          {item.currency === 'USD' ? '$' : 'Rp '}{item.totalAmount?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </div>
                        {item.currency === 'USD' && item.totalAmountIDR && (
                          <div className="text-[11px] text-slate-400">
                            ≈ Rp {Math.round(item.totalAmountIDR).toLocaleString('id-ID')}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
                          {item.status === 'Paid' && <CheckCircle2 className="w-3 h-3" />}
                          {item.status === 'Overdue' && <AlertTriangle className="w-3 h-3" />}
                          {item.status}
                        </span>
                        {item.paymentDate && item.status === 'Paid' && (
                          <div className="text-[10px] text-emerald-600 mt-0.5">
                            Lunas: {item.paymentDate}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Print Invoice Button */}
                          <button
                            type="button"
                            onClick={() => setPrintItem(item)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                            title="Cetak Faktur Penjualan (Commercial Invoice)"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          {/* Quick Mark as Paid Button */}
                          {item.status !== 'Paid' && (
                            <button
                              type="button"
                              onClick={() => handleMarkAsPaid(item)}
                              className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition cursor-pointer"
                              title="Tandai Sudah Dibayar (Lunas)"
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
                              if (confirm(`Yakin ingin menghapus Invoice "${item.invoiceNo}"?`)) {
                                onDeleteInvoice(item.id);
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

      {/* Modal Add / Edit Invoice */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
                  <Receipt className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-800 text-lg">
                  {editingItem ? 'Edit Faktur Penjualan' : 'Buat Faktur Penjualan Baru'}
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
              {/* Tarik data dari Surat Jalan (DO) */}
              {!editingItem && deliveryItems.length > 0 && (
                <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-800 uppercase tracking-wide">
                    <Truck className="w-3.5 h-3.5" />
                    <span>Tarik Data Otomatis dari Surat Jalan (DO)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      onChange={(e) => {
                        if (e.target.value) handleSelectDeliveryOrder(e.target.value);
                      }}
                      className="w-full px-3 py-1.5 rounded-lg border border-indigo-200 text-xs text-slate-800 bg-white focus:outline-hidden"
                    >
                      <option value="">-- Pilih Surat Jalan (DO) yang akan ditagihkan --</option>
                      {deliveryItems.map(d => (
                        <option key={d.id} value={d.deliveryNo}>
                          {d.deliveryNo} - {d.customer} ({d.itemName}, {d.qty} {d.uom})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    No. Invoice *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.invoiceNo}
                    onChange={(e) => setFormData({ ...formData, invoiceNo: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono"
                    placeholder="INV/2026/03/0042"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    No. Faktur Pajak (FP)
                  </label>
                  <input
                    type="text"
                    value={formData.taxInvoiceNo}
                    onChange={(e) => setFormData({ ...formData, taxInvoiceNo: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono"
                    placeholder="010.002-26.77192831"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Tanggal Invoice *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.invoiceDate}
                    onChange={(e) => setFormData({ ...formData, invoiceDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Jatuh Tempo (Due Date) *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
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
                    value={formData.customer}
                    onChange={(e) => setFormData({ ...formData, customer: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    placeholder="PT Astra Honda Motor"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    NPWP Customer
                  </label>
                  <input
                    type="text"
                    value={formData.customerTaxId}
                    onChange={(e) => setFormData({ ...formData, customerTaxId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    placeholder="01.328.948.2-054.000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Ref. No. Surat Jalan (DO)
                  </label>
                  <input
                    type="text"
                    value={formData.deliveryNo}
                    onChange={(e) => setFormData({ ...formData, deliveryNo: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono"
                    placeholder="DO/2026/03/001"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Ref. No. PO Customer
                  </label>
                  <input
                    type="text"
                    value={formData.poNumber}
                    onChange={(e) => setFormData({ ...formData, poNumber: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    placeholder="PO-AHM-2026-042"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Rincian Penjualan / Deskripsi Barang *
                </label>
                <textarea
                  rows={2}
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  placeholder="Penjualan 5,000 PCS Flange Collar Comp 12mm (Part: 10110-AHM-001)"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    DPP (Subtotal) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.subtotal}
                    onChange={(e) => handleAmountChange(Number(e.target.value), formData.taxRatePercent)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Tarif PPN (%)
                  </label>
                  <select
                    value={formData.taxRatePercent}
                    onChange={(e) => handleAmountChange(formData.subtotal, Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:border-indigo-500"
                  >
                    <option value={11}>11% (Standar)</option>
                    <option value={0}>0% (Kawasan Berikat / Ekspor)</option>
                    <option value={12}>12%</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Total Tagihan
                  </label>
                  <input
                    type="number"
                    disabled
                    value={formData.totalAmount}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-slate-50 font-bold text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Status Pembayaran
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as SalesInvoiceStatus })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:border-indigo-500"
                  >
                    <option value="Sent">Sent (Terkirim / Belum Bayar)</option>
                    <option value="Paid">Paid (Lunas)</option>
                    <option value="Overdue">Overdue (Jatuh Tempo)</option>
                    <option value="Partially Paid">Partially Paid</option>
                    <option value="Draft">Draft</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Tanggal Lunas (Jika Paid)
                  </label>
                  <input
                    type="date"
                    value={formData.paymentDate}
                    onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Rekening Bank Tujuan Transfer
                </label>
                <input
                  type="text"
                  value={formData.bankAccount}
                  onChange={(e) => setFormData({ ...formData, bankAccount: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  placeholder="BTM USD A/C 665-894622"
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
                  {editingItem ? 'Simpan Perubahan' : 'Terbitkan Faktur'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Official Print Modal Commercial Invoice */}
      {printItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[95vh] overflow-y-auto shadow-2xl p-6 border border-slate-200">
            {/* Action Bar */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-6 print:hidden">
              <span className="text-sm font-bold text-slate-700">Preview Cetak Faktur Penjualan (Commercial Invoice)</span>
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
                  <h1 className="text-xl font-black text-slate-900 tracking-wider uppercase">COMMERCIAL INVOICE</h1>
                  <p className="text-xs font-mono font-bold text-emerald-700">FAKTUR PENJUALAN</p>
                </div>
              </div>

              {/* Invoice Meta */}
              <div className="grid grid-cols-2 gap-4 text-xs mb-6">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
                  <div className="font-bold text-slate-700 uppercase tracking-wide text-[10px] mb-1">Tagihan Kepada (Bill To):</div>
                  <div className="text-sm font-bold text-slate-900">{printItem.customer}</div>
                  <div className="text-slate-600 font-mono text-[11px]">
                    NPWP: {printItem.customerTaxId || '-'}
                  </div>
                  <div className="text-slate-600 text-[11px]">
                    {printItem.customerAddress || 'Alamat Kantor Customer'}
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Nomor Invoice:</span>
                    <span className="font-mono font-bold text-slate-900">{printItem.invoiceNo}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Faktur Pajak No:</span>
                    <span className="font-mono font-semibold text-slate-800">{printItem.taxInvoiceNo || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Tanggal Invoice:</span>
                    <span className="font-semibold text-slate-800">{printItem.invoiceDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Jatuh Tempo (Due Date):</span>
                    <span className="font-bold text-rose-600">{printItem.dueDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Ref. DO & PO:</span>
                    <span className="font-mono text-slate-800">
                      {printItem.deliveryNo || '-'} / {printItem.poNumber || '-'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <table className="w-full text-xs border border-slate-300 mb-6">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-300 font-bold text-slate-800 text-center">
                    <th className="py-2 px-2 border-r border-slate-300 w-10">No</th>
                    <th className="py-2 px-3 border-r border-slate-300 text-left">Deskripsi Barang / Penjualan</th>
                    <th className="py-2 px-3 border-r border-slate-300 w-28 text-center">Ref DO / PO</th>
                    <th className="py-2 px-3 text-right w-36">Jumlah (Amount USD)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-slate-200">
                    <td className="py-3 px-2 text-center border-r border-slate-300">1</td>
                    <td className="py-3 px-3 font-semibold text-slate-900 border-r border-slate-300">
                      {printItem.description}
                    </td>
                    <td className="py-3 px-3 text-center border-r border-slate-300 font-mono text-[11px] text-slate-600">
                      {printItem.deliveryNo || '-'}<br />{printItem.poNumber || '-'}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-sm">
                      ${printItem.subtotal?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Totals Section */}
              <div className="flex justify-end mb-6 text-xs">
                <div className="w-64 space-y-1.5 border border-slate-200 bg-slate-50 p-3 rounded-lg">
                  <div className="flex justify-between text-slate-600">
                    <span>DPP (Subtotal):</span>
                    <span className="font-semibold">${printItem.subtotal?.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>PPN ({printItem.taxRatePercent}%):</span>
                    <span className="font-semibold">${printItem.taxAmount?.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="border-t border-slate-300 pt-1.5 flex justify-between font-extrabold text-sm text-slate-900">
                    <span>Total Tagihan:</span>
                    <span className="text-indigo-700">${printItem.totalAmount?.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  </div>
                  {printItem.totalAmountIDR && (
                    <div className="text-[11px] text-slate-500 text-right italic">
                      ≈ Rp {Math.round(printItem.totalAmountIDR).toLocaleString('id-ID')}
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Instructions */}
              <div className="bg-indigo-50/60 p-3 rounded-lg border border-indigo-100 text-xs mb-8 space-y-1">
                <div className="font-bold text-indigo-900">Instruksi Rekening Pembayaran (Payment Details):</div>
                <div className="text-slate-700">
                  Mohon melakukan transfer pembayaran penuh ke rekening bank resmi kami:
                </div>
                <div className="font-mono font-bold text-slate-900">
                  {printItem.bankAccount || 'BTM USD A/C 665-894622 a/n PT KANETA INDONESIA'}
                </div>
                <div className="text-[11px] text-slate-500">
                  Cantumkan nomor invoice <strong>{printItem.invoiceNo}</strong> pada berita transfer bank.
                </div>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-2 gap-8 text-center text-xs">
                <div className="border border-slate-200 p-3 rounded-lg">
                  <div className="text-[10px] font-semibold text-slate-500 mb-16">Dibuat Oleh (Finance & Billing):</div>
                  <div className="border-t border-slate-400 pt-1 font-bold text-slate-800">
                    {currentUser?.name || 'Staff Finance & Accounting'}
                  </div>
                </div>

                <div className="border border-slate-200 p-3 rounded-lg">
                  <div className="text-[10px] font-semibold text-slate-500 mb-16">Menyetujui (Finance Director / Dept Head):</div>
                  <div className="border-t border-slate-400 pt-1 font-bold text-slate-800">
                    Finance & Accounting Manager
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
