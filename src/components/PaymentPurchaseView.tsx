import React, { useState, useMemo } from 'react';
import {
  CreditCard,
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
  Wallet,
  DollarSign,
  Landmark,
  PackageCheck,
  RotateCcw
} from 'lucide-react';
import * as XLSX from 'xlsx';
import {
  PaymentPurchase,
  PaymentPurchaseInvoiceRef,
  PaymentPurchaseStatus,
  PurchaseInvoice,
  CashBankAccount,
  Supplier,
  AppUser,
  CompanySettings
} from '../types';

interface PaymentPurchaseViewProps {
  paymentPurchases: PaymentPurchase[];
  purchaseInvoices: PurchaseInvoice[];
  cashBankAccounts: CashBankAccount[];
  suppliers: Supplier[];
  currentUser: AppUser | null;
  companySettings?: CompanySettings;
  onAddPaymentPurchase: (payment: Omit<PaymentPurchase, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdatePaymentPurchase: (id: string, updates: Partial<PaymentPurchase>) => void;
  onDeletePaymentPurchase: (id: string) => void;
  onCheckPaymentPurchase?: (id: string, userName: string) => void;
  onApprovePaymentPurchase?: (id: string, userName: string) => void;
  activePurchaseTab?: string;
  onSwitchPurchaseTab?: (tab: string) => void;
}

const STATUS_BADGES: Record<PaymentPurchaseStatus, { label: string; bg: string; text: string; border: string }> = {
  draft: { label: 'Draft', bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300' },
  processed: { label: 'Dibayar / Selesai', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  reconciled: { label: 'Terekonsiliasi Bank', bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
  cancelled: { label: 'Dibatalkan', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
};

export const PaymentPurchaseView: React.FC<PaymentPurchaseViewProps> = ({
  paymentPurchases = [],
  purchaseInvoices = [],
  cashBankAccounts = [],
  suppliers = [],
  currentUser,
  companySettings,
  onAddPaymentPurchase,
  onUpdatePaymentPurchase,
  onDeletePaymentPurchase,
  onCheckPaymentPurchase,
  onApprovePaymentPurchase,
  activePurchaseTab = 'payment-purchase',
  onSwitchPurchaseTab
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSupplier, setFilterSupplier] = useState('');
  const [filterBank, setFilterBank] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<PaymentPurchase | null>(null);
  const [viewingPayment, setViewingPayment] = useState<PaymentPurchase | null>(null);
  const [printPayment, setPrintPayment] = useState<PaymentPurchase | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    paymentNumber: '',
    paymentDate: new Date().toISOString().split('T')[0],
    supplierCode: '',
    supplierName: '',
    bankAccountId: '',
    bankAccountName: '',
    paymentMethod: 'Transfer' as 'Transfer' | 'Cash' | 'Giro' | 'Cheque' | 'Other',
    refNo: '',
    currency: 'IDR',
    exchangeRate: 1,
    totalPaidAmount: 0,
    totalPaidAmountIDR: 0,
    status: 'processed' as PaymentPurchaseStatus,
    beneficiaryAccount: '',
    beneficiaryBank: '',
    beneficiaryName: '',
    notes: '',
    processedBy: currentUser?.name || 'Staff Finance',
    invoices: [] as PaymentPurchaseInvoiceRef[]
  });

  // Filtered List
  const filteredPayments = useMemo(() => {
    return paymentPurchases.filter(pay => {
      const matchSearch =
        (pay.paymentNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (pay.supplierName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (pay.bankAccountName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (pay.refNo || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchSup = !filterSupplier || pay.supplierCode === filterSupplier;
      const matchBank = !filterBank || pay.bankAccountId === filterBank;
      const matchStat = filterStatus === 'all' || pay.status === filterStatus;

      return matchSearch && matchSup && matchBank && matchStat;
    });
  }, [paymentPurchases, searchTerm, filterSupplier, filterBank, filterStatus]);

  // Statistics
  const stats = useMemo(() => {
    const totalCount = paymentPurchases.length;
    const totalPaidIDR = paymentPurchases
      .filter(p => p.status !== 'cancelled')
      .reduce((sum, p) => sum + (Number(p.totalPaidAmountIDR) || (p.currency === 'IDR' ? Number(p.totalPaidAmount) : Number(p.totalPaidAmount) * (p.exchangeRate || 16273))), 0);
    
    const totalInvoicesSettled = paymentPurchases.reduce((acc, p) => acc + (p.invoices?.length || 0), 0);
    const pendingReconcile = paymentPurchases.filter(p => p.status === 'processed').length;

    return { totalCount, totalPaidIDR, totalInvoicesSettled, pendingReconcile };
  }, [paymentPurchases]);

  // Handle Supplier Selection in Modal - Auto pull outstanding invoices
  const handleSelectSupplier = (supCode: string) => {
    const sup = suppliers.find(s => s.code === supCode);
    if (!sup) {
      setFormData(prev => ({ ...prev, supplierCode: supCode, invoices: [] }));
      return;
    }

    // Filter unpaid/partially paid invoices for this supplier
    const outstandingInvoices = purchaseInvoices.filter(inv => 
      inv.supplierCode === supCode && (inv.status === 'unpaid' || inv.status === 'partially_paid' || inv.status === 'draft')
    );

    const invRefs: PaymentPurchaseInvoiceRef[] = outstandingInvoices.map((inv, idx) => {
      const total = Number(inv.grandTotal) || 0;
      const prevPaid = Number(inv.paidAmount) || 0;
      const rem = Math.max(0, total - prevPaid);
      return {
        id: `inv_ref_${Date.now()}_${idx}`,
        invoiceId: inv.id,
        invoiceNo: inv.invoiceNo,
        poNumber: inv.poNumber,
        invoiceDate: inv.invoiceDate,
        invoiceDueDate: inv.dueDate,
        invoiceTotal: total,
        previouslyPaid: prevPaid,
        paymentAmount: rem, // default to full payment of remaining
        remainingBalance: 0,
        notes: ''
      };
    });

    const sumTotalPaid = invRefs.reduce((acc, i) => acc + i.paymentAmount, 0);

    setFormData(prev => ({
      ...prev,
      supplierCode: sup.code,
      supplierName: sup.name,
      beneficiaryAccount: sup.notes || '',
      currency: sup.currency || 'IDR',
      invoices: invRefs,
      totalPaidAmount: sumTotalPaid,
      totalPaidAmountIDR: prev.currency === 'USD' ? sumTotalPaid * (prev.exchangeRate || 16273.56) : sumTotalPaid
    }));
  };

  const handleOpenAdd = () => {
    setEditingPayment(null);
    const nextNo = `PAY/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, '0')}/${String(paymentPurchases.length + 1).padStart(3, '0')}`;
    const defaultBank = cashBankAccounts[0] || null;

    setFormData({
      paymentNumber: nextNo,
      paymentDate: new Date().toISOString().split('T')[0],
      supplierCode: '',
      supplierName: '',
      bankAccountId: defaultBank?.id || '',
      bankAccountName: defaultBank?.accountName || 'Bank Operasional',
      paymentMethod: 'Transfer',
      refNo: '',
      currency: 'IDR',
      exchangeRate: 16273.56,
      totalPaidAmount: 0,
      totalPaidAmountIDR: 0,
      status: 'processed',
      beneficiaryAccount: '',
      beneficiaryBank: '',
      beneficiaryName: '',
      notes: '',
      processedBy: currentUser?.name || 'Staff Finance',
      invoices: []
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (pay: PaymentPurchase) => {
    setEditingPayment(pay);
    setFormData({
      paymentNumber: pay.paymentNumber,
      paymentDate: pay.paymentDate,
      supplierCode: pay.supplierCode,
      supplierName: pay.supplierName,
      bankAccountId: pay.bankAccountId,
      bankAccountName: pay.bankAccountName,
      paymentMethod: pay.paymentMethod,
      refNo: pay.refNo || '',
      currency: pay.currency,
      exchangeRate: pay.exchangeRate || 1,
      totalPaidAmount: pay.totalPaidAmount,
      totalPaidAmountIDR: pay.totalPaidAmountIDR || pay.totalPaidAmount,
      status: pay.status,
      beneficiaryAccount: pay.beneficiaryAccount || '',
      beneficiaryBank: pay.beneficiaryBank || '',
      beneficiaryName: pay.beneficiaryName || '',
      notes: pay.notes || '',
      processedBy: pay.processedBy || currentUser?.name || 'Staff Finance',
      invoices: (pay.invoices || []).map(i => ({ ...i }))
    });
    setIsModalOpen(true);
  };

  const handleUpdateInvoiceLine = (idx: number, payAmount: number) => {
    setFormData(prev => {
      const updated = [...prev.invoices];
      const inv = { ...updated[idx] };
      const total = Number(inv.invoiceTotal) || 0;
      const prevPaid = Number(inv.previouslyPaid) || 0;
      inv.paymentAmount = payAmount;
      inv.remainingBalance = Math.max(0, total - prevPaid - payAmount);
      updated[idx] = inv;

      const sumPaid = updated.reduce((s, i) => s + (Number(i.paymentAmount) || 0), 0);
      const sumIDR = prev.currency === 'USD' ? sumPaid * (prev.exchangeRate || 16273.56) : sumPaid;

      return { ...prev, invoices: updated, totalPaidAmount: sumPaid, totalPaidAmountIDR: sumIDR };
    });
  };

  const handleAddInvoiceRef = () => {
    setFormData(prev => ({
      ...prev,
      invoices: [
        ...prev.invoices,
        {
          id: `inv_${Date.now()}`,
          invoiceNo: '',
          poNumber: '',
          invoiceTotal: 0,
          previouslyPaid: 0,
          paymentAmount: 0,
          remainingBalance: 0,
          notes: ''
        }
      ]
    }));
  };

  const handleRemoveInvoiceRef = (idx: number) => {
    setFormData(prev => {
      const updated = prev.invoices.filter((_, i) => i !== idx);
      const sumPaid = updated.reduce((s, i) => s + (Number(i.paymentAmount) || 0), 0);
      const sumIDR = prev.currency === 'USD' ? sumPaid * (prev.exchangeRate || 16273.56) : sumPaid;
      return { ...prev, invoices: updated, totalPaidAmount: sumPaid, totalPaidAmountIDR: sumIDR };
    });
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.paymentNumber || !formData.supplierName || !formData.bankAccountId) {
      alert('Mohon lengkapi No Pembayaran, Supplier, dan Akun Kas/Bank.');
      return;
    }

    if (formData.totalPaidAmount <= 0) {
      alert('Total pembayaran harus lebih besar dari 0.');
      return;
    }

    if (editingPayment) {
      onUpdatePaymentPurchase(editingPayment.id, formData);
    } else {
      onAddPaymentPurchase(formData);
    }
    setIsModalOpen(false);
  };

  // Export to Excel
  const handleExportXLSX = () => {
    const rows = filteredPayments.flatMap(pay => {
      if (!pay.invoices || pay.invoices.length === 0) {
        return [{
          'No Pembayaran (Voucher)': pay.paymentNumber,
          'Tanggal Bayar': pay.paymentDate,
          'Supplier': pay.supplierName,
          'Sumber Rekening': pay.bankAccountName,
          'Metode': pay.paymentMethod,
          'No Ref Bank': pay.refNo || '-',
          'Status': STATUS_BADGES[pay.status]?.label || pay.status,
          'Total Bayar': pay.totalPaidAmount,
          'Mata Uang': pay.currency,
          'Total IDR': pay.totalPaidAmountIDR,
          'No Faktur Dibayar': '-',
          'Nominal Faktur': 0,
          'Jumlah Dibayar': 0
        }];
      }
      return pay.invoices.map(inv => ({
        'No Pembayaran (Voucher)': pay.paymentNumber,
        'Tanggal Bayar': pay.paymentDate,
        'Supplier': pay.supplierName,
        'Sumber Rekening': pay.bankAccountName,
        'Metode': pay.paymentMethod,
        'No Ref Bank': pay.refNo || '-',
        'Status': STATUS_BADGES[pay.status]?.label || pay.status,
        'Total Bayar': pay.totalPaidAmount,
        'Mata Uang': pay.currency,
        'Total IDR': pay.totalPaidAmountIDR,
        'No Faktur Dibayar': inv.invoiceNo,
        'Nominal Faktur': inv.invoiceTotal,
        'Jumlah Dibayar': inv.paymentAmount,
        'Sisa Tagihan': inv.remainingBalance
      }));
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'PaymentPurchases');
    XLSX.writeFile(workbook, `Pembayaran_Hutang_Supplier_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* Header & Submenu Navigation */}
      <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-600 rounded-xl text-white shadow-md shadow-indigo-500/20">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-800">Payment Purchase</h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800">
                  Pembayaran Hutang Dagang (AP Settlement)
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Pencatatan voucher pengeluaran kas & bank untuk pelunasan tagihan / faktur supplier (Accounts Payable).
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
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm shadow-indigo-600/30 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Buat Pembayaran Baru</span>
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
              { id: 'return-item-order', label: 'Return Item Order', icon: RotateCcw },
              { id: 'payment-purchase', label: 'Payment Purchase', icon: CreditCard },
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activePurchaseTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onSwitchPurchaseTab(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition cursor-pointer ${
                    isActive
                      ? 'bg-indigo-600 text-white font-bold shadow-xs'
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
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Voucher Terbit</span>
            <div className="p-2 bg-slate-100 rounded-lg text-slate-600">
              <FileCheck2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-800">{stats.totalCount}</span>
            <span className="text-xs text-slate-400 font-medium">Transaksi Bayar</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-emerald-100 bg-gradient-to-br from-white to-emerald-50/30 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Total Nilai Pembayaran</span>
            <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-black text-emerald-700">Rp {stats.totalPaidIDR.toLocaleString()}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-indigo-100 bg-gradient-to-br from-white to-indigo-50/30 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider">Faktur Terlunasi</span>
            <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-indigo-700">{stats.totalInvoicesSettled}</span>
            <span className="text-xs text-indigo-600/70 font-medium">Faktur Supplier</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Rekonsiliasi Bank</span>
            <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
              <Landmark className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-blue-700">{stats.pendingReconcile}</span>
            <span className="text-xs text-slate-400 font-medium">Menunggu Cek Bank</span>
          </div>
        </div>
      </div>

      {/* Filter & Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari No Voucher, Supplier, Rekening..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={filterSupplier}
            onChange={e => setFilterSupplier(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="">Semua Supplier</option>
            {suppliers.map(s => (
              <option key={s.id} value={s.code}>{s.name} ({s.code})</option>
            ))}
          </select>

          <select
            value={filterBank}
            onChange={e => setFilterBank(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="">Semua Akun Bank</option>
            {cashBankAccounts.map(b => (
              <option key={b.id} value={b.id}>{b.accountName} ({b.accountNumber})</option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="all">Semua Status</option>
            <option value="processed">Dibayar / Selesai</option>
            <option value="reconciled">Terekonsiliasi</option>
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
                <th className="px-4 py-3">No. Voucher / Tanggal</th>
                <th className="px-4 py-3">Supplier (Payee)</th>
                <th className="px-4 py-3">Sumber Kas / Bank</th>
                <th className="px-4 py-3">Faktur Terkait</th>
                <th className="px-4 py-3 text-right">Jumlah Dibayar</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    <CreditCard className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-medium">Belum ada data pembayaran pembelian.</p>
                  </td>
                </tr>
              ) : (
                filteredPayments.map(pay => {
                  const badge = STATUS_BADGES[pay.status] || STATUS_BADGES.draft;

                  return (
                    <tr key={pay.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-slate-800">{pay.paymentNumber}</div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3" />
                          <span>{pay.paymentDate}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-slate-800">{pay.supplierName}</div>
                        <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                          Metode: <span className="text-indigo-600 font-semibold">{pay.paymentMethod}</span>
                          {pay.refNo && <span className="ml-1 text-slate-400">({pay.refNo})</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                          <Landmark className="w-3.5 h-3.5 text-slate-400" />
                          <span>{pay.bankAccountName}</span>
                        </div>
                        {pay.beneficiaryAccount && (
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            Ke: {pay.beneficiaryAccount}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-slate-700">
                          {pay.invoices?.length || 0} Faktur
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[150px]">
                          {pay.invoices?.map(i => i.invoiceNo).join(', ') || '-'}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-right font-black text-emerald-700">
                        <div>{pay.currency} {(pay.totalPaidAmount || 0).toLocaleString()}</div>
                        {pay.currency !== 'IDR' && (
                          <div className="text-[10px] text-slate-400 font-normal">
                            ≈ Rp {(pay.totalPaidAmountIDR || 0).toLocaleString()}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${badge.bg} ${badge.text} ${badge.border}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setViewingPayment(pay)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                            title="Lihat Detail"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setPrintPayment(pay)}
                            className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                            title="Cetak Bukti Pengeluaran Kas/Bank"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(pay)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Hapus data pembayaran ${pay.paymentNumber}?`)) {
                                onDeletePaymentPurchase(pay.id);
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
                <div className="p-2 bg-indigo-600 rounded-lg text-white">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">
                    {editingPayment ? 'Edit Pembayaran Faktur Supplier' : 'Buat Pembayaran Faktur Supplier (Payment Purchase)'}
                  </h3>
                  <p className="text-xs text-slate-500">Pencatatan alokasi pelunasan invoice dan mutasi kas & bank.</p>
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
                  <label className="block text-xs font-bold text-slate-700 mb-1">No. Voucher Pembayaran *</label>
                  <input
                    type="text"
                    required
                    value={formData.paymentNumber}
                    onChange={e => setFormData({ ...formData, paymentNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal Pembayaran *</label>
                  <input
                    type="date"
                    required
                    value={formData.paymentDate}
                    onChange={e => setFormData({ ...formData, paymentDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Pilih Supplier (Payee) *</label>
                  <select
                    required
                    value={formData.supplierCode}
                    onChange={e => handleSelectSupplier(e.target.value)}
                    className="w-full px-3 py-2 bg-indigo-50/50 border border-indigo-300 text-indigo-900 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                  >
                    <option value="">-- Pilih Supplier --</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.code}>{s.name} ({s.code})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Bank Source & Payment Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Sumber Kas / Bank Pengirim *</label>
                  <select
                    required
                    value={formData.bankAccountId}
                    onChange={e => {
                      const bank = cashBankAccounts.find(b => b.id === e.target.value);
                      setFormData({
                        ...formData,
                        bankAccountId: e.target.value,
                        bankAccountName: bank?.accountName || ''
                      });
                    }}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="">-- Pilih Rekening Kas / Bank --</option>
                    {cashBankAccounts.map(b => (
                      <option key={b.id} value={b.id}>{b.accountName} - {b.accountNumber} ({b.currency})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Metode Pembayaran</label>
                  <select
                    value={formData.paymentMethod}
                    onChange={e => setFormData({ ...formData, paymentMethod: e.target.value as any })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="Transfer">Bank Transfer (RTGS / LLG / BI-FAST)</option>
                    <option value="Cash">Kas Tunai (Petty Cash)</option>
                    <option value="Giro">Bilyet Giro</option>
                    <option value="Cheque">Cek Bank (Cheque)</option>
                    <option value="Other">Lainnya</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">No. Referensi / Ref Transfer</label>
                  <input
                    type="text"
                    placeholder="Contoh: TRF-20260321-098"
                    value={formData.refNo}
                    onChange={e => setFormData({ ...formData, refNo: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Rekening Tujuan Supplier</label>
                  <input
                    type="text"
                    placeholder="Nomor rekening bank supplier"
                    value={formData.beneficiaryAccount}
                    onChange={e => setFormData({ ...formData, beneficiaryAccount: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mata Uang & Kurs</label>
                  <div className="flex gap-2">
                    <select
                      value={formData.currency}
                      onChange={e => {
                        const cur = e.target.value;
                        const rate = cur === 'USD' ? 16273.56 : 1;
                        const sumPaid = formData.totalPaidAmount;
                        setFormData({
                          ...formData,
                          currency: cur,
                          exchangeRate: rate,
                          totalPaidAmountIDR: cur === 'USD' ? sumPaid * rate : sumPaid
                        });
                      }}
                      className="w-24 px-2 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold"
                    >
                      <option value="IDR">IDR</option>
                      <option value="USD">USD</option>
                      <option value="JPY">JPY</option>
                      <option value="EUR">EUR</option>
                    </select>
                    <input
                      type="number"
                      placeholder="Kurs"
                      value={formData.exchangeRate}
                      onChange={e => {
                        const rate = Number(e.target.value);
                        setFormData({
                          ...formData,
                          exchangeRate: rate,
                          totalPaidAmountIDR: formData.currency === 'USD' ? formData.totalPaidAmount * rate : formData.totalPaidAmount
                        });
                      }}
                      className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Status Pembayaran</label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="processed">Dibayar / Selesai (Processed)</option>
                    <option value="reconciled">Terekonsiliasi Kas/Bank</option>
                    <option value="draft">Draft</option>
                    <option value="cancelled">Dibatalkan</option>
                  </select>
                </div>
              </div>

              {/* Invoices List / Allocation */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Daftar Faktur Pembelian yang Dibayar</h4>
                  <button
                    type="button"
                    onClick={handleAddInvoiceRef}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Faktur Manual</span>
                  </button>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="px-3 py-2">No. Faktur (Invoice)</th>
                        <th className="px-2 py-2 text-right w-28">Total Faktur</th>
                        <th className="px-2 py-2 text-right w-28">Telah Dibayar</th>
                        <th className="px-2 py-2 text-right w-36">Jumlah Bayar Ini *</th>
                        <th className="px-2 py-2 text-right w-28">Sisa Saldo</th>
                        <th className="px-2 py-2 text-center w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {formData.invoices.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center py-6 text-slate-400">
                            Pilih Supplier di atas atau klik "Tambah Faktur Manual" untuk memasukkan tagihan yang dibayar.
                          </td>
                        </tr>
                      ) : (
                        formData.invoices.map((inv, idx) => (
                          <tr key={inv.id || idx} className="hover:bg-slate-50">
                            <td className="px-3 py-2">
                              <input
                                type="text"
                                placeholder="No Invoice / Faktur"
                                value={inv.invoiceNo}
                                onChange={e => {
                                  const updated = [...formData.invoices];
                                  updated[idx].invoiceNo = e.target.value;
                                  setFormData({ ...formData, invoices: updated });
                                }}
                                className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                              />
                            </td>
                            <td className="px-2 py-2 text-right font-medium">
                              <input
                                type="number"
                                min="0"
                                value={inv.invoiceTotal}
                                onChange={e => {
                                  const updated = [...formData.invoices];
                                  updated[idx].invoiceTotal = Number(e.target.value);
                                  setFormData({ ...formData, invoices: updated });
                                }}
                                className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs text-right font-medium"
                              />
                            </td>
                            <td className="px-2 py-2 text-right text-slate-500 font-medium">
                              {(inv.previouslyPaid || 0).toLocaleString()}
                            </td>
                            <td className="px-2 py-2">
                              <input
                                type="number"
                                min="0"
                                value={inv.paymentAmount}
                                onChange={e => handleUpdateInvoiceLine(idx, Number(e.target.value))}
                                className="w-full px-2 py-1 bg-emerald-50 border border-emerald-300 rounded text-xs text-right font-bold text-emerald-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                              />
                            </td>
                            <td className="px-2 py-2 text-right font-bold text-slate-700">
                              {(inv.remainingBalance || 0).toLocaleString()}
                            </td>
                            <td className="px-2 py-2 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveInvoiceRef(idx)}
                                className="p-1 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                    {formData.invoices.length > 0 && (
                      <tfoot className="bg-slate-50 font-bold border-t border-slate-200">
                        <tr>
                          <td colSpan={3} className="px-3 py-2 text-right text-slate-700">Total Pembayaran:</td>
                          <td className="px-2 py-2 text-right text-emerald-700 font-black text-sm">
                            {formData.currency} {formData.totalPaidAmount.toLocaleString()}
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
                <label className="block text-xs font-bold text-slate-700 mb-1">Catatan / Memo Pembayaran</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Keterangan tambahan transaksi transfer atau nomor warkat giro..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
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
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-600/20 transition cursor-pointer"
                >
                  {editingPayment ? 'Simpan Perubahan' : 'Proses Pembayaran'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {viewingPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-800">Detail Bukti Pengeluaran Kas/Bank (Payment Purchase)</h3>
              </div>
              <button
                onClick={() => setViewingPayment(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-400 block font-medium">No. Voucher:</span>
                  <span className="font-bold text-slate-800 text-sm">{viewingPayment.paymentNumber}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Tanggal Bayar:</span>
                  <span className="font-bold text-slate-700">{viewingPayment.paymentDate}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Akun Kas/Bank:</span>
                  <span className="font-bold text-indigo-700">{viewingPayment.bankAccountName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Total Dibayar:</span>
                  <span className="font-black text-emerald-700 text-sm">
                    {viewingPayment.currency} {(viewingPayment.totalPaidAmount || 0).toLocaleString()}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-400 block font-medium">Supplier (Payee):</span>
                  <span className="font-bold text-slate-800">{viewingPayment.supplierName}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-400 block font-medium">Metode / Ref:</span>
                  <span className="font-bold text-slate-800">{viewingPayment.paymentMethod} {viewingPayment.refNo ? `(${viewingPayment.refNo})` : ''}</span>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">Faktur yang Dilunasi</h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-2.5">No. Faktur (Invoice)</th>
                        <th className="px-3 py-2.5 text-right">Total Faktur</th>
                        <th className="px-3 py-2.5 text-right">Jumlah Dibayar Ini</th>
                        <th className="px-3 py-2.5 text-right">Sisa Tagihan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(viewingPayment.invoices || []).map((inv, i) => (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="px-4 py-2.5 font-bold text-slate-800">{inv.invoiceNo}</td>
                          <td className="px-3 py-2.5 text-right font-medium">{(inv.invoiceTotal || 0).toLocaleString()}</td>
                          <td className="px-3 py-2.5 text-right font-bold text-emerald-700">{(inv.paymentAmount || 0).toLocaleString()}</td>
                          <td className="px-3 py-2.5 text-right font-semibold text-slate-600">{(inv.remainingBalance || 0).toLocaleString()}</td>
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
                  const target = viewingPayment;
                  setViewingPayment(null);
                  setPrintPayment(target);
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Voucher Pengeluaran</span>
              </button>
              <button
                onClick={() => setViewingPayment(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print View Modal */}
      {printPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
            <div className="px-6 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50 no-print">
              <span className="text-xs font-bold text-slate-700">Preview Cetak Bukti Pembayaran / Voucher Kas & Bank</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print</span>
                </button>
                <button
                  onClick={() => setPrintPayment(null)}
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
                  <h1 className="text-xl font-black tracking-tight text-indigo-800">BUKTI PENGELUARAN KAS / BANK</h1>
                  <p className="text-xs font-bold text-slate-600">PAYMENT VOUCHER (AP)</p>
                  <p className="text-xs font-mono font-bold text-slate-900 mt-1">{printPayment.paymentNumber}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 py-4 text-xs border-b border-slate-200">
                <div className="space-y-1">
                  <div><span className="font-semibold text-slate-500">Dibayarkan Kepada:</span> <strong className="text-slate-900">{printPayment.supplierName}</strong></div>
                  <div><span className="font-semibold text-slate-500">Rekening Tujuan:</span> <span>{printPayment.beneficiaryAccount || '-'}</span></div>
                  <div><span className="font-semibold text-slate-500">Metode / No. Ref:</span> <span>{printPayment.paymentMethod} {printPayment.refNo ? `(${printPayment.refNo})` : ''}</span></div>
                </div>
                <div className="space-y-1 text-right">
                  <div><span className="font-semibold text-slate-500">Tanggal Bayar:</span> <strong>{printPayment.paymentDate}</strong></div>
                  <div><span className="font-semibold text-slate-500">Dibayar Dari:</span> <strong>{printPayment.bankAccountName}</strong></div>
                  <div><span className="font-semibold text-slate-500">Total Pembayaran:</span> <strong className="text-emerald-800 font-bold text-sm">{printPayment.currency} {(printPayment.totalPaidAmount || 0).toLocaleString()}</strong></div>
                </div>
              </div>

              <div className="my-6">
                <table className="w-full text-xs text-left border border-slate-300">
                  <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                    <tr>
                      <th className="p-2 border-r border-slate-300 text-center w-10">No</th>
                      <th className="p-2 border-r border-slate-300">Nomor Faktur / Invoice</th>
                      <th className="p-2 border-r border-slate-300 text-right w-36">Total Faktur</th>
                      <th className="p-2 border-r border-slate-300 text-right w-36">Telah Dibayar</th>
                      <th className="p-2 text-right w-40">Jumlah Dibayar Ini</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-300">
                    {(printPayment.invoices || []).map((inv, idx) => (
                      <tr key={idx}>
                        <td className="p-2 border-r border-slate-300 text-center">{idx + 1}</td>
                        <td className="p-2 border-r border-slate-300 font-bold">{inv.invoiceNo}</td>
                        <td className="p-2 border-r border-slate-300 text-right font-medium">{(inv.invoiceTotal || 0).toLocaleString()}</td>
                        <td className="p-2 border-r border-slate-300 text-right text-slate-500">{(inv.previouslyPaid || 0).toLocaleString()}</td>
                        <td className="p-2 text-right font-bold text-emerald-800">{(inv.paymentAmount || 0).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-100 font-bold border-t border-slate-300">
                    <tr>
                      <td colSpan={4} className="p-2 text-right border-r border-slate-300">Total Yang Dibayarkan:</td>
                      <td className="p-2 text-right font-black text-emerald-800 text-sm">
                        {printPayment.currency} {(printPayment.totalPaidAmount || 0).toLocaleString()}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div className="grid grid-cols-4 gap-4 pt-8 text-center text-xs">
                <div>
                  <p className="font-semibold text-slate-500 mb-14">Dibuat Oleh,</p>
                  <p className="font-bold text-slate-800 border-t border-slate-400 pt-1">( {printPayment.processedBy || 'Staff Finance'} )</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-500 mb-14">Diperiksa Accounting,</p>
                  <p className="font-bold text-slate-800 border-t border-slate-400 pt-1">( ................................... )</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-500 mb-14">Disetujui Direksi/Fin Mgr,</p>
                  <p className="font-bold text-slate-800 border-t border-slate-400 pt-1">( ................................... )</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-500 mb-14">Penerima Dana (Supplier),</p>
                  <p className="font-bold text-slate-800 border-t border-slate-400 pt-1">( ................................... )</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
