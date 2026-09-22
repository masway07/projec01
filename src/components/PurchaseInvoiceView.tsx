import React, { useState, useMemo } from 'react';
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
  TrendingDown
} from 'lucide-react';
import * as XLSX from 'xlsx';
import {
  PurchaseInvoice,
  PurchaseInvoiceLine,
  PurchaseInvoiceStatus,
  PurchaseOrder,
  Supplier,
  AppUser,
  CompanySettings,
  ExchangeRates
} from '../types';

interface PurchaseInvoiceViewProps {
  invoices: PurchaseInvoice[];
  purchaseOrders: PurchaseOrder[];
  suppliers: Supplier[];
  ratesByYear: Record<string, ExchangeRates>;
  onAddInvoice: (invoice: Omit<PurchaseInvoice, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateInvoice: (id: string, updates: Partial<PurchaseInvoice>) => void;
  onDeleteInvoice: (id: string) => void;
  onCheckInvoice?: (id: string, userName: string) => void;
  onApproveInvoice?: (id: string, userName: string) => void;
  onRejectInvoice?: (id: string, userName: string, reason: string) => void;
  currentUser: AppUser | null;
  companySettings?: CompanySettings;
  activePurchaseTab?: 'purchase-request' | 'purchase-order' | 'purchase-invoice';
  onSwitchPurchaseTab?: (tab: 'purchase-request' | 'purchase-order' | 'purchase-invoice') => void;
}

const STATUS_BADGES: Record<PurchaseInvoiceStatus, { label: string; bg: string; text: string; border: string }> = {
  draft: { label: 'Draft', bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300' },
  unpaid: { label: 'Belum Dibayar (Unpaid)', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  partially_paid: { label: 'Dibayar Sebagian', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  paid: { label: 'Lunas (Paid)', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  overdue: { label: 'Jatuh Tempo (Overdue)', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-300' },
  cancelled: { label: 'Dibatalkan', bg: 'bg-slate-50', text: 'text-slate-500', border: 'border-slate-200' }
};

export const PurchaseInvoiceView: React.FC<PurchaseInvoiceViewProps> = ({
  invoices = [],
  purchaseOrders = [],
  suppliers = [],
  ratesByYear = {},
  onAddInvoice,
  onUpdateInvoice,
  onDeleteInvoice,
  onCheckInvoice,
  onApproveInvoice,
  onRejectInvoice,
  currentUser,
  companySettings,
  activePurchaseTab = 'purchase-invoice',
  onSwitchPurchaseTab
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [supplierFilter, setSupplierFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<PurchaseInvoice | null>(null);
  const [detailInvoice, setDetailInvoice] = useState<PurchaseInvoice | null>(null);
  const [printInvoice, setPrintInvoice] = useState<PurchaseInvoice | null>(null);
  const [rejectReasonModal, setRejectReasonModal] = useState<{ id: string; invoiceNo: string } | null>(null);
  const [rejectionReasonText, setRejectionReasonText] = useState('');

  // Current year exchange rate
  const currentYear = '2026';
  const usdToIdrRate = ratesByYear[currentYear]?.IDR || 16273.56;

  // Form State for Create/Edit
  const [formData, setFormData] = useState({
    invoiceNo: '',
    taxInvoiceNo: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    poNumber: '',
    poDate: '',
    deliveryOrderNo: '',
    deliveryOrderDate: new Date().toISOString().split('T')[0],
    receivedBy: '',
    supplierCode: '',
    supplierName: '',
    supplierNpwp: '',
    supplierAddress: '',
    paymentTerms: 'NET 30',
    bankAccount: '',
    currency: 'USD',
    rate: usdToIdrRate,
    taxPercent: 11,
    discountAmount: 0,
    freightCost: 0,
    status: 'unpaid' as PurchaseInvoiceStatus,
    notes: '',
    items: [] as PurchaseInvoiceLine[]
  });

  // Calculate totals
  const subtotal = useMemo(() => {
    return formData.items.reduce((sum, item) => sum + (Number(item.totalPrice) || 0), 0);
  }, [formData.items]);

  const taxAmount = useMemo(() => {
    return (subtotal * (Number(formData.taxPercent) || 0)) / 100;
  }, [subtotal, formData.taxPercent]);

  const grandTotal = useMemo(() => {
    return subtotal + taxAmount - (Number(formData.discountAmount) || 0) + (Number(formData.freightCost) || 0);
  }, [subtotal, taxAmount, formData.discountAmount, formData.freightCost]);

  // Determine 3-way match status
  const matchStatus = useMemo(() => {
    if (!formData.poNumber || !formData.deliveryOrderNo || formData.items.length === 0) {
      return 'pending_verification';
    }
    const hasDiscrepancy = formData.items.some(
      it => it.poQty !== undefined && Number(it.poQty) !== Number(it.doQty)
    );
    return hasDiscrepancy ? 'discrepancy' : 'matched';
  }, [formData.poNumber, formData.deliveryOrderNo, formData.items]);

  // Unique suppliers from invoices and master
  const supplierOptions = useMemo(() => {
    const list = [...suppliers];
    invoices.forEach(inv => {
      if (inv.supplierCode && !list.some(s => s.code === inv.supplierCode)) {
        list.push({
          id: inv.supplierCode,
          code: inv.supplierCode,
          name: inv.supplierName,
          paymentTerms: inv.paymentTerms,
          currency: inv.currency,
          isActive: true
        });
      }
    });
    return list;
  }, [suppliers, invoices]);

  // Filtered invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter(item => {
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      if (supplierFilter !== 'all' && item.supplierCode !== supplierFilter) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchNo = item.invoiceNo?.toLowerCase().includes(q);
        const matchTax = item.taxInvoiceNo?.toLowerCase().includes(q);
        const matchPO = item.poNumber?.toLowerCase().includes(q);
        const matchDO = item.deliveryOrderNo?.toLowerCase().includes(q);
        const matchSup = item.supplierName?.toLowerCase().includes(q) || item.supplierCode?.toLowerCase().includes(q);
        const matchItem = item.items?.some(it => it.itemName?.toLowerCase().includes(q) || it.itemCode?.toLowerCase().includes(q));
        if (!matchNo && !matchTax && !matchPO && !matchDO && !matchSup && !matchItem) return false;
      }
      return true;
    });
  }, [invoices, statusFilter, supplierFilter, searchTerm]);

  // Summary Metrics
  const metrics = useMemo(() => {
    const totalCount = invoices.length;
    let totalAmountUSD = 0;
    let unpaidAmountUSD = 0;
    let paidAmountUSD = 0;
    let matchedCount = 0;

    invoices.forEach(inv => {
      const amtUSD = inv.currency === 'USD' ? inv.grandTotal : inv.grandTotal / (inv.rate || usdToIdrRate);
      totalAmountUSD += amtUSD;

      if (inv.status === 'paid') {
        paidAmountUSD += amtUSD;
      } else if (inv.status === 'unpaid' || inv.status === 'overdue' || inv.status === 'partially_paid') {
        const remaining = inv.remainingAmount !== undefined ? inv.remainingAmount : inv.grandTotal;
        unpaidAmountUSD += inv.currency === 'USD' ? remaining : remaining / (inv.rate || usdToIdrRate);
      }

      if (inv.matchStatus === 'matched') {
        matchedCount++;
      }
    });

    return {
      totalCount,
      totalAmountUSD,
      unpaidAmountUSD,
      paidAmountUSD,
      matchedCount
    };
  }, [invoices, usdToIdrRate]);

  // Handle PO Selection in Form
  const handleSelectPO = (poNum: string) => {
    const po = purchaseOrders.find(p => p.poNumber === poNum);
    if (!po) return;

    // Find supplier
    const sup = suppliers.find(s => s.code === po.supplierCode || s.name === po.supplierName);

    // Build line items from PO
    const newItems: PurchaseInvoiceLine[] = (po.items || []).map((line, idx) => ({
      id: `line_${Date.now()}_${idx}`,
      itemCode: line.itemCode,
      itemName: line.itemName,
      description: line.description,
      poQty: line.qty,
      doQty: line.qty, // Default received qty matches PO qty
      uom: line.uom,
      unitPrice: line.unitPrice,
      totalPrice: line.qty * line.unitPrice,
      notes: line.notes
    }));

    setFormData(prev => ({
      ...prev,
      poNumber: po.poNumber,
      poDate: po.date,
      supplierCode: po.supplierCode,
      supplierName: po.supplierName,
      supplierNpwp: sup?.npwp || prev.supplierNpwp,
      supplierAddress: po.supplierAddress || sup?.address || prev.supplierAddress,
      paymentTerms: po.paymentTerms || sup?.paymentTerms || 'NET 30',
      currency: po.currency || 'USD',
      rate: po.rate || usdToIdrRate,
      taxPercent: po.taxPercent !== undefined ? po.taxPercent : 11,
      bankAccount: sup?.notes?.includes('Bank') ? sup.notes : prev.bankAccount,
      items: newItems
    }));
  };

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingInvoice(null);
    setFormData({
      invoiceNo: `INV-SUP/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, '0')}/${String(invoices.length + 1).padStart(3, '0')}`,
      taxInvoiceNo: `010.002-26.${Math.floor(10000000 + Math.random() * 90000000)}`,
      invoiceDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      poNumber: '',
      poDate: '',
      deliveryOrderNo: '',
      deliveryOrderDate: new Date().toISOString().split('T')[0],
      receivedBy: currentUser?.name || 'Incoming QC Staff',
      supplierCode: '',
      supplierName: '',
      supplierNpwp: '',
      supplierAddress: '',
      paymentTerms: 'NET 30',
      bankAccount: '',
      currency: 'USD',
      rate: usdToIdrRate,
      taxPercent: 11,
      discountAmount: 0,
      freightCost: 0,
      status: 'unpaid',
      notes: 'Tagihan atas penerimaan barang sesuai bukti Surat Jalan / Delivery Order dan PO',
      items: []
    });
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (inv: PurchaseInvoice) => {
    setEditingInvoice(inv);
    setFormData({
      invoiceNo: inv.invoiceNo,
      taxInvoiceNo: inv.taxInvoiceNo || '',
      invoiceDate: inv.invoiceDate,
      dueDate: inv.dueDate,
      poNumber: inv.poNumber,
      poDate: inv.poDate || '',
      deliveryOrderNo: inv.deliveryOrderNo,
      deliveryOrderDate: inv.deliveryOrderDate || '',
      receivedBy: inv.receivedBy || '',
      supplierCode: inv.supplierCode,
      supplierName: inv.supplierName,
      supplierNpwp: inv.supplierNpwp || '',
      supplierAddress: inv.supplierAddress || '',
      paymentTerms: inv.paymentTerms,
      bankAccount: inv.bankAccount || '',
      currency: inv.currency,
      rate: inv.rate || usdToIdrRate,
      taxPercent: inv.taxPercent !== undefined ? inv.taxPercent : 11,
      discountAmount: inv.discountAmount || 0,
      freightCost: inv.freightCost || 0,
      status: inv.status,
      notes: inv.notes || '',
      items: inv.items ? [...inv.items] : []
    });
    setIsModalOpen(true);
  };

  // Save Form
  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.invoiceNo.trim()) {
      alert('Nomor Invoice Supplier wajib diisi!');
      return;
    }
    if (!formData.poNumber.trim()) {
      alert('Nomor PO referensi wajib dipilih!');
      return;
    }
    if (!formData.deliveryOrderNo.trim()) {
      alert('Nomor Surat Jalan / Delivery Order (DO) wajib diisi sebagai bukti fisik penerimaan barang!');
      return;
    }
    if (formData.items.length === 0) {
      alert('Minimal harus ada 1 item barang dalam faktur pembelian!');
      return;
    }

    const calculatedGrandTotal = subtotal + taxAmount - Number(formData.discountAmount || 0) + Number(formData.freightCost || 0);
    const grandTotalUSD = formData.currency === 'USD' ? calculatedGrandTotal : calculatedGrandTotal / (formData.rate || usdToIdrRate);

    const payload: Omit<PurchaseInvoice, 'id' | 'createdAt' | 'updatedAt'> = {
      invoiceNo: formData.invoiceNo,
      taxInvoiceNo: formData.taxInvoiceNo,
      invoiceDate: formData.invoiceDate,
      dueDate: formData.dueDate,
      poNumber: formData.poNumber,
      poDate: formData.poDate,
      deliveryOrderNo: formData.deliveryOrderNo,
      deliveryOrderDate: formData.deliveryOrderDate,
      receivedBy: formData.receivedBy,
      supplierCode: formData.supplierCode,
      supplierName: formData.supplierName,
      supplierNpwp: formData.supplierNpwp,
      supplierAddress: formData.supplierAddress,
      paymentTerms: formData.paymentTerms,
      bankAccount: formData.bankAccount,
      currency: formData.currency,
      rate: formData.rate,
      subtotal,
      taxPercent: formData.taxPercent,
      taxAmount,
      discountAmount: Number(formData.discountAmount || 0),
      freightCost: Number(formData.freightCost || 0),
      grandTotal: calculatedGrandTotal,
      grandTotalUSD,
      paidAmount: editingInvoice ? editingInvoice.paidAmount : (formData.status === 'paid' ? calculatedGrandTotal : 0),
      remainingAmount: editingInvoice ? (editingInvoice.status === 'paid' ? 0 : calculatedGrandTotal - (editingInvoice.paidAmount || 0)) : (formData.status === 'paid' ? 0 : calculatedGrandTotal),
      paymentDate: formData.status === 'paid' ? (editingInvoice?.paymentDate || new Date().toISOString().split('T')[0]) : undefined,
      status: formData.status,
      matchStatus,
      items: formData.items,
      notes: formData.notes
    };

    if (editingInvoice) {
      onUpdateInvoice(editingInvoice.id, payload);
    } else {
      onAddInvoice(payload);
    }

    setIsModalOpen(false);
  };

  // Line Items Helper
  const handleItemChange = (index: number, field: keyof PurchaseInvoiceLine, value: any) => {
    const updated = [...formData.items];
    const item = { ...updated[index], [field]: value };

    if (field === 'doQty' || field === 'unitPrice') {
      const q = field === 'doQty' ? Number(value) : Number(item.doQty);
      const p = field === 'unitPrice' ? Number(value) : Number(item.unitPrice);
      item.totalPrice = q * p;
    }

    updated[index] = item;
    setFormData(prev => ({ ...prev, items: updated }));
  };

  const handleAddItem = () => {
    const newItem: PurchaseInvoiceLine = {
      id: `line_${Date.now()}`,
      itemName: '',
      uom: 'PCS',
      poQty: 1,
      doQty: 1,
      unitPrice: 0,
      totalPrice: 0
    };
    setFormData(prev => ({ ...prev, items: [...prev.items, newItem] }));
  };

  const handleRemoveItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, idx) => idx !== index)
    }));
  };

  // Mark as Paid
  const handleMarkAsPaid = (inv: PurchaseInvoice) => {
    if (window.confirm(`Konfirmasi pelunasan Purchase Invoice ${inv.invoiceNo} dari ${inv.supplierName}?`)) {
      onUpdateInvoice(inv.id, {
        status: 'paid',
        paidAmount: inv.grandTotal,
        remainingAmount: 0,
        paymentDate: new Date().toISOString().split('T')[0]
      });
    }
  };

  // Export to Excel
  const handleExportExcel = () => {
    const rows = filteredInvoices.map((inv, idx) => ({
      No: idx + 1,
      'No Invoice Supplier': inv.invoiceNo,
      'Faktur Pajak': inv.taxInvoiceNo || '-',
      'Tanggal Invoice': inv.invoiceDate,
      'Jatuh Tempo': inv.dueDate,
      'No PO': inv.poNumber,
      'No Surat Jalan (DO)': inv.deliveryOrderNo,
      'Tgl Terima DO': inv.deliveryOrderDate || '-',
      'Kode Supplier': inv.supplierCode,
      'Nama Supplier': inv.supplierName,
      '3-Way Match': inv.matchStatus === 'matched' ? 'Cocok (Matched)' : inv.matchStatus === 'discrepancy' ? 'Selisih' : 'Pending',
      MataUang: inv.currency,
      Kurs: inv.rate,
      DPP: inv.subtotal,
      PPN: inv.taxAmount,
      'Grand Total': inv.grandTotal,
      'Grand Total USD': inv.grandTotalUSD || (inv.currency === 'USD' ? inv.grandTotal : inv.grandTotal / inv.rate),
      'Sisa Tagihan': inv.remainingAmount !== undefined ? inv.remainingAmount : inv.grandTotal,
      Status: inv.status,
      'Diperiksa Oleh': inv.checkedBy || '-',
      'Disetujui Oleh': inv.approvedBy || '-',
      Catatan: inv.notes || '-'
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Purchase Invoices');
    XLSX.writeFile(wb, `Purchase_Invoices_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Check & Approval Permissions
  const canCheck = currentUser?.role === 'admin' || currentUser?.actionPermissions?.includes('check');
  const canApprove = currentUser?.role === 'admin' || currentUser?.actionPermissions?.includes('approve');
  const canReject = currentUser?.role === 'admin' || currentUser?.actionPermissions?.includes('reject');

  return (
    <div className="space-y-6">
      {/* Sub-Navigation Tabs for Purchase */}
      {onSwitchPurchaseTab && (
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
          <button
            onClick={() => onSwitchPurchaseTab('purchase-request')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition cursor-pointer flex items-center gap-2 ${
              activePurchaseTab === 'purchase-request'
                ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <FileText className="w-4 h-4" />
            Purchase Request (PR)
          </button>
          <button
            onClick={() => onSwitchPurchaseTab('purchase-order')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition cursor-pointer flex items-center gap-2 ${
              activePurchaseTab === 'purchase-order'
                ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Layers className="w-4 h-4" />
            Purchase Order (PO)
          </button>
          <button
            onClick={() => onSwitchPurchaseTab('purchase-invoice')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition cursor-pointer flex items-center gap-2 ${
              activePurchaseTab === 'purchase-invoice'
                ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Receipt className="w-4 h-4" />
            Purchase Invoice (Faktur Tagihan)
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-xs">
                <Receipt className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Purchase Invoice (Faktur Pembelian)</h1>
                <p className="text-sm text-slate-500 mt-0.5">
                  Pencatatan tagihan atas penerimaan fisik barang berdasarkan bukti Surat Jalan / Delivery Order (DO) dan Purchase Order (PO)
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleExportExcel}
              className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 font-medium text-sm transition flex items-center gap-2 cursor-pointer shadow-xs"
              title="Export data ke berkas Excel"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Export XLSX</span>
            </button>
            <button
              onClick={handleOpenCreateModal}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition flex items-center gap-2 shadow-sm shadow-indigo-600/20 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Purchase Invoice</span>
            </button>
          </div>
        </div>

        {/* 3-Way Matching Concept Bar */}
        <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
              1
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-slate-900">Purchase Order (PO)</div>
              <div className="text-[11px] text-slate-500 truncate">Persetujuan harga, termin & spek barang ke supplier</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs">
              2
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-slate-900">Delivery Order (DO Gudang)</div>
              <div className="text-[11px] text-slate-500 truncate">Bukti fisik surat jalan & kuantitas lolos QC penerimaan</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
              3
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-slate-900">Purchase Invoice (Tagihan)</div>
              <div className="text-[11px] text-slate-500 truncate">Verifikasi 3-Way Match dan jadwal pembayaran Finance</div>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Tagihan</span>
            <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Receipt className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-3">
            ${metrics.totalAmountUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
            <span className="font-semibold text-indigo-600">{metrics.totalCount} Faktur</span>
            <span>tercatat dalam sistem</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Belum Lunas (Unpaid)</span>
            <span className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-amber-600 mt-3">
            ${metrics.unpaidAmountUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Hutang usaha berjalan ke supplier
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Sudah Lunas (Paid)</span>
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-emerald-600 mt-3">
            ${metrics.paidAmountUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Pembayaran lunas via Kas & Bank
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">3-Way Match Verified</span>
            <span className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <ShieldCheck className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-blue-600 mt-3">
            {metrics.matchedCount} / {metrics.totalCount}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            PO, DO Gudang & Invoice 100% Cocok
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari No Invoice, No PO, No DO, Supplier..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">Semua Status</option>
            <option value="unpaid">Belum Dibayar (Unpaid)</option>
            <option value="paid">Lunas (Paid)</option>
            <option value="partially_paid">Dibayar Sebagian</option>
            <option value="overdue">Jatuh Tempo (Overdue)</option>
            <option value="draft">Draft</option>
          </select>

          {/* Supplier Filter */}
          <select
            value={supplierFilter}
            onChange={e => setSupplierFilter(e.target.value)}
            className="px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">Semua Supplier</option>
            {supplierOptions.map(sup => (
              <option key={sup.code} value={sup.code}>
                {sup.code} - {sup.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-3 w-10 text-center">No</th>
                <th className="py-3 px-3">Invoice & Faktur Pajak</th>
                <th className="py-3 px-3">Tanggal & Tempo</th>
                <th className="py-3 px-3">Supplier</th>
                <th className="py-3 px-3">Bukti 3-Way Match</th>
                <th className="py-3 px-3 text-right">DPP (Subtotal)</th>
                <th className="py-3 px-3 text-right">PPN</th>
                <th className="py-3 px-3 text-right">Grand Total</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-center">Otorisasi</th>
                <th className="py-3 px-3 text-center w-36">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400">
                    <Receipt className="w-10 h-10 mx-auto mb-2 text-slate-300 stroke-1" />
                    <p className="font-semibold text-slate-600">Belum ada Purchase Invoice</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Klik tombol &ldquo;Tambah Purchase Invoice&rdquo; untuk mencatat tagihan baru atas barang yang sudah diterima.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv, idx) => {
                  const badge = STATUS_BADGES[inv.status] || STATUS_BADGES.unpaid;
                  const isOverdue = inv.status === 'unpaid' && new Date(inv.dueDate) < new Date();

                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 px-3 text-center font-medium text-slate-400">{idx + 1}</td>
                      <td className="py-3.5 px-3">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <Receipt className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                          <span>{inv.invoiceNo}</span>
                        </div>
                        {inv.taxInvoiceNo && (
                          <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                            FP: {inv.taxInvoiceNo}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <div className="text-slate-700 font-medium">Inv: {inv.invoiceDate}</div>
                        <div className={`text-[11px] flex items-center gap-1 mt-0.5 ${
                          isOverdue ? 'text-rose-600 font-bold' : 'text-slate-500'
                        }`}>
                          <Calendar className="w-3 h-3 shrink-0" />
                          <span>Due: {inv.dueDate}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="font-semibold text-slate-900">{inv.supplierName}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                          <span className="font-mono">{inv.supplierCode}</span>
                          <span>•</span>
                          <span>{inv.paymentTerms}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-slate-800 font-medium">
                            <span className="text-slate-400 text-[10px]">PO:</span>
                            <span className="font-mono text-indigo-600">{inv.poNumber}</span>
                          </div>
                          <div className="flex items-center gap-1 text-slate-700 text-[11px]">
                            <Truck className="w-3 h-3 text-emerald-600 shrink-0" />
                            <span className="font-mono text-slate-600">{inv.deliveryOrderNo}</span>
                          </div>
                          <div>
                            {inv.matchStatus === 'matched' ? (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <Check className="w-2.5 h-2.5" /> 3-Way Match
                              </span>
                            ) : inv.matchStatus === 'discrepancy' ? (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                <AlertTriangle className="w-2.5 h-2.5" /> Ada Selisih
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                <Clock className="w-2.5 h-2.5" /> Verifikasi
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono text-slate-700">
                        {inv.currency === 'USD' ? '$' : 'Rp '}
                        {inv.subtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono text-slate-500">
                        {inv.currency === 'USD' ? '$' : 'Rp '}
                        {inv.taxAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        <div className="text-[10px] text-slate-400">({inv.taxPercent}%)</div>
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        <div className="font-mono font-bold text-slate-900">
                          {inv.currency === 'USD' ? '$' : 'Rp '}
                          {inv.grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        {inv.currency === 'USD' && inv.rate && (
                          <div className="text-[10px] font-mono text-slate-400">
                            ≈ Rp {(inv.grandTotal * inv.rate).toLocaleString('id-ID', { maximumFractionDigits: 0 })}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${badge.bg} ${badge.text} ${badge.border}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-center whitespace-nowrap">
                        <div className="space-y-1">
                          {inv.checkedBy ? (
                            <div className="text-[10px] text-blue-700 font-medium bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                              ✓ Ck: {inv.checkedBy.split(' ')[0]}
                            </div>
                          ) : (
                            <div className="text-[10px] text-slate-400">Belum di-check</div>
                          )}

                          {inv.approvedBy ? (
                            <div className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                              ✓ Appr: {inv.approvedBy.split(' ')[0]}
                            </div>
                          ) : inv.rejectedBy ? (
                            <div className="text-[10px] text-rose-700 font-bold bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                              ✕ Ditolak
                            </div>
                          ) : (
                            <div className="text-[10px] text-slate-400">Belum di-approve</div>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setDetailInvoice(inv)}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-indigo-600 hover:bg-slate-100 transition cursor-pointer"
                            title="Lihat Detail & 3-Way Match Verification"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => setPrintInvoice(inv)}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
                            title="Cetak Bukti Tagihan / Voucher"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          {/* Approval Actions */}
                          {canCheck && !inv.checkedBy && onCheckInvoice && (
                            <button
                              onClick={() => onCheckInvoice(inv.id, currentUser?.name || 'Reviewer')}
                              className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition cursor-pointer"
                              title="Tandai Sudah Diperiksa (Check)"
                            >
                              <FileCheck2 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {canApprove && !inv.approvedBy && onApproveInvoice && (
                            <button
                              onClick={() => onApproveInvoice(inv.id, currentUser?.name || 'Approver')}
                              className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition cursor-pointer"
                              title="Setujui Faktur Pembelian (Approve)"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {canReject && !inv.approvedBy && onRejectInvoice && (
                            <button
                              onClick={() => {
                                setRejectReasonModal({ id: inv.id, invoiceNo: inv.invoiceNo });
                                setRejectionReasonText('');
                              }}
                              className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                              title="Tolak Faktur (Reject)"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {inv.status !== 'paid' && (
                            <button
                              onClick={() => handleMarkAsPaid(inv)}
                              className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition cursor-pointer"
                              title="Tandai Lunas"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            onClick={() => handleOpenEditModal(inv)}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-indigo-600 hover:bg-slate-100 transition cursor-pointer"
                            title="Edit Faktur"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => {
                              if (window.confirm(`Hapus purchase invoice ${inv.invoiceNo}?`)) {
                                onDeleteInvoice(inv.id);
                              }
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                            title="Hapus Faktur"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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

      {/* MODAL: Tambah / Edit Purchase Invoice */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden my-auto">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {editingInvoice ? 'Edit Purchase Invoice' : 'Tambah Purchase Invoice Baru'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Kombinasikan Purchase Order (PO) dan bukti Delivery Order (DO) yang diterima
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveForm} className="overflow-y-auto p-6 space-y-6 flex-1 text-xs">
              {/* Section 1: 3-Way Match References */}
              <div className="p-4 rounded-xl bg-indigo-50/40 border border-indigo-100 space-y-4">
                <div className="flex items-center gap-2 text-indigo-900 font-bold text-xs uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  <span>1. Referensi Purchase Order & Bukti Delivery Order Fisik</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Select PO */}
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Pilih Purchase Order (PO) <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formData.poNumber}
                      onChange={e => handleSelectPO(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                      required
                    >
                      <option value="">-- Pilih Purchase Order --</option>
                      {purchaseOrders.map(po => (
                        <option key={po.id} value={po.poNumber}>
                          {po.poNumber} ({po.supplierName} - {po.currency} {po.grandTotal.toLocaleString()})
                        </option>
                      ))}
                    </select>
                    <p className="text-[10px] text-slate-500 mt-1">Memilih PO akan otomatis mengisi barang dan harga satuan</p>
                  </div>

                  {/* Delivery Order No */}
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      No. Delivery Order / Surat Jalan <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: DO-SUP/2026/03/014"
                      value={formData.deliveryOrderNo}
                      onChange={e => setFormData(prev => ({ ...prev, deliveryOrderNo: e.target.value }))}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                      required
                    />
                    <p className="text-[10px] text-slate-500 mt-1">Bukti fisik dokumen pengiriman dari supplier</p>
                  </div>

                  {/* Delivery Order Date */}
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Tanggal Terima Barang di Pabrik
                    </label>
                    <input
                      type="date"
                      value={formData.deliveryOrderDate}
                      onChange={e => setFormData(prev => ({ ...prev, deliveryOrderDate: e.target.value }))}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">Tanggal kedatangan di gudang</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Petugas Penerima Gudang / QC
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Hendra (Incoming QC) / Gudang RM"
                      value={formData.receivedBy}
                      onChange={e => setFormData(prev => ({ ...prev, receivedBy: e.target.value }))}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Status 3-Way Match
                    </label>
                    <div className="flex items-center gap-2 py-1.5 px-3 rounded-xl bg-white border border-slate-200">
                      {matchStatus === 'matched' ? (
                        <div className="text-emerald-700 font-bold flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Cocok (Matched) - Kuantitas DO sesuai PO</span>
                        </div>
                      ) : matchStatus === 'discrepancy' ? (
                        <div className="text-rose-700 font-bold flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4 text-rose-600" />
                          <span>Selisih (Discrepancy) - Qty DO berbeda dengan PO</span>
                        </div>
                      ) : (
                        <div className="text-amber-700 font-bold flex items-center gap-1.5">
                          <Clock className="w-4 h-4 text-amber-600" />
                          <span>Menunggu kelengkapan data PO & DO</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Supplier & Invoice Information */}
              <div className="space-y-4">
                <div className="text-slate-900 font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-slate-500" />
                  <span>2. Rincian Faktur Supplier & Termin</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Nomor Invoice Supplier <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: INV-DS/2026/03/089"
                      value={formData.invoiceNo}
                      onChange={e => setFormData(prev => ({ ...prev, invoiceNo: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Nomor Seri Faktur Pajak (PPN)
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: 010.002-26.49182301"
                      value={formData.taxInvoiceNo}
                      onChange={e => setFormData(prev => ({ ...prev, taxInvoiceNo: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Supplier / Vendor <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.supplierName ? `${formData.supplierCode} - ${formData.supplierName}` : ''}
                      readOnly
                      placeholder="Otomatis terisi saat memilih PO"
                      className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-xl text-slate-700 font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Tanggal Invoice <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={formData.invoiceDate}
                      onChange={e => setFormData(prev => ({ ...prev, invoiceDate: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Jatuh Tempo Pembayaran <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={formData.dueDate}
                      onChange={e => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Termin Pembayaran
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. NET 30, COD"
                      value={formData.paymentTerms}
                      onChange={e => setFormData(prev => ({ ...prev, paymentTerms: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Rekening Bank Supplier
                    </label>
                    <input
                      type="text"
                      placeholder="Nama Bank & No Rekening"
                      value={formData.bankAccount}
                      onChange={e => setFormData(prev => ({ ...prev, bankAccount: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Line Items (PO Qty vs DO Qty) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-slate-900 font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                    <Layers className="w-4 h-4 text-slate-500" />
                    <span>3. Rincian Barang Diterima (Delivery Order vs PO)</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center gap-1 transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Tambah Baris
                  </button>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                        <th className="py-2.5 px-3">Kode / Nama Barang</th>
                        <th className="py-2.5 px-2 text-center w-24">Qty di PO</th>
                        <th className="py-2.5 px-2 text-center w-28">Qty DO Diterima</th>
                        <th className="py-2.5 px-2 text-center w-20">UOM</th>
                        <th className="py-2.5 px-3 text-right w-32">Harga Satuan</th>
                        <th className="py-2.5 px-3 text-right w-36">Total Harga</th>
                        <th className="py-2.5 px-2 text-center w-12"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {formData.items.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-6 text-center text-slate-400">
                            Pilih Purchase Order di atas untuk memuat daftar barang otomatis, atau klik &ldquo;Tambah Baris&rdquo;
                          </td>
                        </tr>
                      ) : (
                        formData.items.map((item, idx) => (
                          <tr key={item.id} className="hover:bg-slate-50/50">
                            <td className="py-2 px-3">
                              <input
                                type="text"
                                placeholder="Nama barang..."
                                value={item.itemName}
                                onChange={e => handleItemChange(idx, 'itemName', e.target.value)}
                                className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs focus:ring-1 focus:ring-indigo-500"
                                required
                              />
                              {item.itemCode && (
                                <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                                  SKU: {item.itemCode}
                                </span>
                              )}
                            </td>
                            <td className="py-2 px-2 text-center">
                              <span className="font-mono text-slate-600 font-medium">
                                {item.poQty !== undefined ? item.poQty : '-'}
                              </span>
                            </td>
                            <td className="py-2 px-2">
                              <input
                                type="number"
                                step="any"
                                value={item.doQty}
                                onChange={e => handleItemChange(idx, 'doQty', parseFloat(e.target.value) || 0)}
                                className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-center font-mono font-bold text-slate-900 focus:ring-1 focus:ring-indigo-500"
                                required
                              />
                            </td>
                            <td className="py-2 px-2 text-center">
                              <input
                                type="text"
                                value={item.uom}
                                onChange={e => handleItemChange(idx, 'uom', e.target.value)}
                                className="w-full px-1 py-1 bg-white border border-slate-200 rounded text-center uppercase text-xs"
                              />
                            </td>
                            <td className="py-2 px-3 text-right">
                              <input
                                type="number"
                                step="any"
                                value={item.unitPrice}
                                onChange={e => handleItemChange(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                                className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-right font-mono text-xs focus:ring-1 focus:ring-indigo-500"
                              />
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                              {(item.totalPrice || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="py-2 px-2 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(idx)}
                                className="p-1 text-slate-400 hover:text-rose-600 rounded transition"
                                title="Hapus baris"
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

              {/* Section 4: Totals & Tax Calculation */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-slate-100">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Catatan / Memo Pembayaran
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Keterangan tambahan faktur, pengecekan QC, nomor rekening transfer..."
                    value={formData.notes}
                    onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />

                  <div className="mt-3">
                    <label className="block font-semibold text-slate-700 mb-1">
                      Status Tagihan
                    </label>
                    <select
                      value={formData.status}
                      onChange={e => setFormData(prev => ({ ...prev, status: e.target.value as PurchaseInvoiceStatus }))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    >
                      <option value="unpaid">Belum Dibayar (Unpaid)</option>
                      <option value="paid">Lunas (Paid)</option>
                      <option value="partially_paid">Dibayar Sebagian</option>
                      <option value="overdue">Jatuh Tempo (Overdue)</option>
                      <option value="draft">Draft</option>
                    </select>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2.5">
                  <div className="flex items-center justify-between text-slate-600">
                    <span>DPP (Subtotal):</span>
                    <span className="font-mono font-semibold">
                      {formData.currency} {subtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600">
                    <div className="flex items-center gap-2">
                      <span>PPN:</span>
                      <select
                        value={formData.taxPercent}
                        onChange={e => setFormData(prev => ({ ...prev, taxPercent: Number(e.target.value) }))}
                        className="px-2 py-0.5 bg-white border border-slate-300 rounded text-xs font-bold"
                      >
                        <option value={11}>11% (Standar)</option>
                        <option value={0}>0% (Kawasan Berikat)</option>
                        <option value={12}>12%</option>
                      </select>
                    </div>
                    <span className="font-mono font-semibold">
                      {formData.currency} {taxAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="border-t border-slate-200 pt-2 flex items-center justify-between text-slate-900 font-bold text-sm">
                    <span>Grand Total:</span>
                    <span className="font-mono text-indigo-600 text-base">
                      {formData.currency} {grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>

                  {formData.currency === 'USD' && (
                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200">
                      <span>Estimasi Nilai IDR (Kurs {formData.rate.toLocaleString()}):</span>
                      <span className="font-mono font-bold text-slate-700">
                        Rp {(grandTotal * formData.rate).toLocaleString('id-ID', { maximumFractionDigits: 0 })}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer Buttons */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium text-xs transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition shadow-sm cursor-pointer"
                >
                  {editingInvoice ? 'Perbarui Purchase Invoice' : 'Simpan Purchase Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Detail & 3-Way Match Verification */}
      {detailInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-3xl overflow-hidden my-auto">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Audit & Verifikasi 3-Way Match</h3>
                  <p className="text-xs text-slate-500">
                    Kesesuaian Purchase Order, Delivery Order (Surat Jalan), dan Tagihan Supplier
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDetailInvoice(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 text-xs overflow-y-auto max-h-[80vh]">
              {/* Match Banner */}
              <div className={`p-4 rounded-xl border flex items-center gap-3 ${
                detailInvoice.matchStatus === 'matched'
                  ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                  : detailInvoice.matchStatus === 'discrepancy'
                  ? 'bg-rose-50/80 border-rose-200 text-rose-900'
                  : 'bg-amber-50/80 border-amber-200 text-amber-900'
              }`}>
                {detailInvoice.matchStatus === 'matched' ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-6 h-6 text-rose-600 shrink-0" />
                )}
                <div>
                  <div className="font-bold text-sm">
                    {detailInvoice.matchStatus === 'matched'
                      ? '3-Way Matching Sempurna (Verified)'
                      : 'Terdeteksi Ketidakcocokan Antara PO dan DO'}
                  </div>
                  <div className="text-[11px] opacity-90 mt-0.5">
                    {detailInvoice.matchStatus === 'matched'
                      ? 'Kuantitas barang yang dikirim pada Delivery Order (Surat Jalan) sesuai 100% dengan Purchase Order yang diterbitkan ke supplier.'
                      : 'Kuantitas barang yang diterima fisik berbeda dari yang tertera pada dokumen PO. Harap periksa catatan penerimaan QC.'}
                  </div>
                </div>
              </div>

              {/* 3 Pillars Comparison */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center gap-2 text-indigo-700 font-bold">
                    <FileText className="w-4 h-4" />
                    <span>Purchase Order (PO)</span>
                  </div>
                  <div className="text-slate-700 space-y-1">
                    <div>No: <span className="font-mono font-bold text-slate-900">{detailInvoice.poNumber}</span></div>
                    <div>Tgl PO: {detailInvoice.poDate || '-'}</div>
                    <div>Supplier: {detailInvoice.supplierName}</div>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-700 font-bold">
                    <Truck className="w-4 h-4" />
                    <span>Delivery Order (DO Gudang)</span>
                  </div>
                  <div className="text-slate-700 space-y-1">
                    <div>No: <span className="font-mono font-bold text-slate-900">{detailInvoice.deliveryOrderNo}</span></div>
                    <div>Tgl Terima: {detailInvoice.deliveryOrderDate || '-'}</div>
                    <div>Penerima: {detailInvoice.receivedBy || 'Incoming QC'}</div>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center gap-2 text-blue-700 font-bold">
                    <Receipt className="w-4 h-4" />
                    <span>Purchase Invoice (Faktur)</span>
                  </div>
                  <div className="text-slate-700 space-y-1">
                    <div>No: <span className="font-mono font-bold text-slate-900">{detailInvoice.invoiceNo}</span></div>
                    <div>Faktur Pajak: {detailInvoice.taxInvoiceNo || '-'}</div>
                    <div>Jatuh Tempo: {detailInvoice.dueDate}</div>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div>
                <h4 className="font-bold text-slate-900 mb-2">Perbandingan Kuantitas & Harga per Item</h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                        <th className="py-2.5 px-3">Nama Barang</th>
                        <th className="py-2.5 px-3 text-center">Qty PO</th>
                        <th className="py-2.5 px-3 text-center">Qty DO Diterima</th>
                        <th className="py-2.5 px-3 text-center">Status</th>
                        <th className="py-2.5 px-3 text-right">Harga Satuan</th>
                        <th className="py-2.5 px-3 text-right">Total Harga</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {detailInvoice.items?.map(it => {
                        const isMatch = it.poQty === undefined || Number(it.poQty) === Number(it.doQty);
                        return (
                          <tr key={it.id}>
                            <td className="py-2.5 px-3 font-medium text-slate-900">
                              {it.itemName}
                              {it.itemCode && <span className="text-[10px] text-slate-400 block font-mono">{it.itemCode}</span>}
                            </td>
                            <td className="py-2.5 px-3 text-center font-mono text-slate-600">
                              {it.poQty ?? '-'} {it.uom}
                            </td>
                            <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-900">
                              {it.doQty} {it.uom}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              {isMatch ? (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700">
                                  ✓ Sesuai
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700">
                                  ⚠ Selisih
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                              {detailInvoice.currency} {it.unitPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                              {detailInvoice.currency} {it.totalPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Financial Summary */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex justify-between items-center">
                <div>
                  <div className="text-[11px] text-slate-500">Status Pembayaran:</div>
                  <div className="font-bold text-slate-900 text-sm capitalize">{detailInvoice.status}</div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] text-slate-500">Grand Total Tagihan:</div>
                  <div className="text-lg font-bold font-mono text-indigo-600">
                    {detailInvoice.currency} {detailInvoice.grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-3.5 border-t border-slate-200 flex items-center justify-end bg-slate-50/50">
              <button
                onClick={() => setDetailInvoice(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs transition cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Cetak Bukti Tagihan / Voucher */}
      {printInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden my-auto">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <Printer className="w-4 h-4 text-indigo-600" />
                <span>Voucher Faktur Pembelian (Purchase Invoice Slip)</span>
              </div>
              <button
                onClick={() => setPrintInvoice(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 text-xs font-sans text-slate-800" id="print-area">
              {/* Slip Header */}
              <div className="flex justify-between items-start pb-4 border-b-2 border-slate-900">
                <div>
                  <h2 className="text-base font-extrabold text-slate-900 uppercase tracking-tight">
                    {companySettings?.companyName || 'PT SMARTBUDGET MANUFACTURING INDONESIA'}
                  </h2>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {companySettings?.address || 'Kawasan Industri GIIC Blok C-1, Cikarang Pusat, Bekasi'}
                  </p>
                  <p className="text-[11px] font-bold text-indigo-600 mt-1">BUKTI PENERIMAAN FAKTUR SUPPLIER (3-WAY MATCH)</p>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold font-mono text-slate-900">{printInvoice.invoiceNo}</div>
                  <div className="text-[11px] text-slate-500 font-mono">FP: {printInvoice.taxInvoiceNo || '-'}</div>
                  <div className="text-[11px] text-slate-500">Tgl: {printInvoice.invoiceDate}</div>
                </div>
              </div>

              {/* Information Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="font-bold text-slate-900">INFORMASI SUPPLIER:</div>
                  <div className="font-semibold text-slate-800">{printInvoice.supplierName} ({printInvoice.supplierCode})</div>
                  <div className="text-slate-600">NPWP: {printInvoice.supplierNpwp || '-'}</div>
                  <div className="text-slate-600">Termin: {printInvoice.paymentTerms}</div>
                  <div className="text-slate-600">Rekening: {printInvoice.bankAccount || '-'}</div>
                </div>

                <div className="space-y-1">
                  <div className="font-bold text-slate-900">DOKUMEN PENDUKUNG (3-WAY MATCH):</div>
                  <div>No. Purchase Order: <span className="font-mono font-bold text-indigo-700">{printInvoice.poNumber}</span></div>
                  <div>No. Delivery Order (DO): <span className="font-mono font-bold text-emerald-700">{printInvoice.deliveryOrderNo}</span></div>
                  <div>Tgl Kedatangan Barang: {printInvoice.deliveryOrderDate || '-'}</div>
                  <div>Diterima Fisik Oleh: {printInvoice.receivedBy || 'Incoming QC'}</div>
                  <div>Jatuh Tempo: <span className="font-bold text-slate-900">{printInvoice.dueDate}</span></div>
                </div>
              </div>

              {/* Items Table */}
              <div className="border border-slate-300 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-300 text-slate-900 font-bold">
                      <th className="py-2 px-2.5">Item Barang</th>
                      <th className="py-2 px-2 text-center">Qty PO</th>
                      <th className="py-2 px-2 text-center">Qty DO</th>
                      <th className="py-2 px-2.5 text-right">Harga Satuan</th>
                      <th className="py-2 px-2.5 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {printInvoice.items?.map(it => (
                      <tr key={it.id}>
                        <td className="py-2 px-2.5">
                          <div className="font-medium text-slate-900">{it.itemName}</div>
                          {it.itemCode && <div className="text-[10px] text-slate-500 font-mono">{it.itemCode}</div>}
                        </td>
                        <td className="py-2 px-2 text-center font-mono">{it.poQty ?? '-'}</td>
                        <td className="py-2 px-2 text-center font-mono font-bold">{it.doQty} {it.uom}</td>
                        <td className="py-2 px-2.5 text-right font-mono">
                          {printInvoice.currency} {it.unitPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-2 px-2.5 text-right font-mono font-bold">
                          {printInvoice.currency} {it.totalPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-slate-300 bg-slate-50">
                      <td colSpan={4} className="py-1.5 px-2.5 text-right font-bold text-slate-700">DPP (Subtotal):</td>
                      <td className="py-1.5 px-2.5 text-right font-mono font-bold text-slate-900">
                        {printInvoice.currency} {printInvoice.subtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                    <tr className="bg-slate-50">
                      <td colSpan={4} className="py-1.5 px-2.5 text-right font-bold text-slate-700">PPN ({printInvoice.taxPercent}%):</td>
                      <td className="py-1.5 px-2.5 text-right font-mono font-bold text-slate-900">
                        {printInvoice.currency} {printInvoice.taxAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                    <tr className="border-t-2 border-slate-900 bg-slate-100 text-slate-900 font-bold">
                      <td colSpan={4} className="py-2 px-2.5 text-right text-xs uppercase">Grand Total Tagihan:</td>
                      <td className="py-2 px-2.5 text-right font-mono text-sm text-indigo-700">
                        {printInvoice.currency} {printInvoice.grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-3 gap-4 pt-6 text-center text-xs">
                <div className="space-y-12">
                  <div className="text-slate-500 font-medium">Penerima Dokumen (Logistics):</div>
                  <div className="border-t border-slate-300 pt-1 font-bold text-slate-900">
                    {printInvoice.receivedBy || '( Petugas Gudang / QC )'}
                  </div>
                </div>
                <div className="space-y-12">
                  <div className="text-slate-500 font-medium">Diperiksa (Accounting/Check):</div>
                  <div className="border-t border-slate-300 pt-1 font-bold text-slate-900">
                    {printInvoice.checkedBy || '( ...................................... )'}
                  </div>
                </div>
                <div className="space-y-12">
                  <div className="text-slate-500 font-medium">Disetujui (Finance Manager):</div>
                  <div className="border-t border-slate-300 pt-1 font-bold text-slate-900">
                    {printInvoice.approvedBy || '( ...................................... )'}
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-3.5 border-t border-slate-200 flex items-center justify-end gap-2.5 bg-slate-50/50">
              <button
                onClick={() => setPrintInvoice(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium text-xs transition cursor-pointer"
              >
                Tutup
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                Cetak / Print Voucher
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Reject Reason */}
      {rejectReasonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center">
                <XCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Tolak Purchase Invoice</h3>
                <p className="text-xs text-slate-500">Invoice No: {rejectReasonModal.invoiceNo}</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Alasan Penolakan (Wajib diisi):
              </label>
              <textarea
                rows={3}
                placeholder="Contoh: Kuantitas barang pada surat jalan DO tidak cocok dengan PO, nomor faktur pajak tidak valid..."
                value={rejectionReasonText}
                onChange={e => setRejectionReasonText(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setRejectReasonModal(null)}
                className="px-3.5 py-1.5 text-xs rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium transition cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  if (!rejectionReasonText.trim()) {
                    alert('Mohon masukkan alasan penolakan!');
                    return;
                  }
                  if (onRejectInvoice) {
                    onRejectInvoice(rejectReasonModal.id, currentUser?.name || 'Rejector', rejectionReasonText);
                  }
                  setRejectReasonModal(null);
                }}
                className="px-4 py-1.5 text-xs rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold transition cursor-pointer"
              >
                Konfirmasi Tolak
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
