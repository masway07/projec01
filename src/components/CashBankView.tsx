import React, { useState } from 'react';
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Plus,
  Search,
  Edit2,
  Trash2,
  Building2,
  CreditCard,
  Download,
  Calendar,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  Filter,
  DollarSign,
  TrendingUp,
  TrendingDown,
  ChevronRight
} from 'lucide-react';
import {
  CashBankAccount,
  CashBankReceipt,
  CashBankPayment,
  COA,
  Customer,
  Supplier,
  CompanySettings
} from '../types';

interface CashBankViewProps {
  activeSubTab: 'buku-bank' | 'penerimaan' | 'pembayaran' | string;
  onSwitchSubTab: (tab: string) => void;
  accounts: CashBankAccount[];
  receipts: CashBankReceipt[];
  payments: CashBankPayment[];
  coaList: COA[];
  customers: Customer[];
  suppliers: Supplier[];
  onAddAccount: (account: CashBankAccount) => void;
  onUpdateAccount: (account: CashBankAccount) => void;
  onDeleteAccount: (id: string) => void;
  onAddReceipt: (receipt: CashBankReceipt) => void;
  onUpdateReceipt: (receipt: CashBankReceipt) => void;
  onDeleteReceipt: (id: string) => void;
  onAddPayment: (payment: CashBankPayment) => void;
  onUpdatePayment: (payment: CashBankPayment) => void;
  onDeletePayment: (id: string) => void;
  companySettings?: CompanySettings;
}

export const CashBankView: React.FC<CashBankViewProps> = ({
  activeSubTab,
  onSwitchSubTab,
  accounts = [],
  receipts = [],
  payments = [],
  coaList = [],
  customers = [],
  suppliers = [],
  onAddAccount,
  onUpdateAccount,
  onDeleteAccount,
  onAddReceipt,
  onUpdateReceipt,
  onDeleteReceipt,
  onAddPayment,
  onUpdatePayment,
  onDeletePayment,
  companySettings
}) => {
  const currentTab =
    activeSubTab === 'penerimaan'
      ? 'penerimaan'
      : activeSubTab === 'pembayaran'
      ? 'pembayaran'
      : 'buku-bank';

  // Common Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBankFilter, setSelectedBankFilter] = useState('all');

  // Account Modal State
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<CashBankAccount | null>(null);
  const [accForm, setAccForm] = useState<Partial<CashBankAccount>>({
    accountCode: '',
    accountName: '',
    bankName: '',
    accountNumber: '',
    currency: 'USD',
    openingBalance: 0,
    currentBalance: 0,
    coaCode: '',
    notes: '',
    isActive: true
  });

  // Receipt Modal State
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [editingReceipt, setEditingReceipt] = useState<CashBankReceipt | null>(null);
  const [recForm, setRecForm] = useState<Partial<CashBankReceipt>>({
    receiptNumber: '',
    date: new Date().toISOString().split('T')[0],
    bankAccountId: '',
    customerCode: '',
    customerName: '',
    coaCode: '',
    amount: 0,
    currency: 'USD',
    exchangeRate: 16250,
    paymentMethod: 'Transfer',
    refNumber: '',
    description: ''
  });

  // Payment Modal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<CashBankPayment | null>(null);
  const [payForm, setPayForm] = useState<Partial<CashBankPayment>>({
    paymentNumber: '',
    date: new Date().toISOString().split('T')[0],
    bankAccountId: '',
    supplierCode: '',
    supplierName: '',
    coaCode: '',
    amount: 0,
    currency: 'USD',
    exchangeRate: 16250,
    paymentMethod: 'Transfer',
    refNumber: '',
    description: ''
  });

  // Delete Confirm Modal State
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    type: 'account' | 'receipt' | 'payment';
    id: string;
    title: string;
  } | null>(null);

  // Helper formatting
  const formatCurrency = (val: number, curr: string = 'USD') => {
    if (curr === 'IDR') {
      return `Rp ${val.toLocaleString('id-ID')}`;
    }
    return `$ ${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Total Balances Calculation
  const totalUSD = accounts
    .filter(a => a.currency === 'USD' && a.isActive)
    .reduce((sum, a) => sum + a.currentBalance, 0);

  const totalIDR = accounts
    .filter(a => a.currency === 'IDR' && a.isActive)
    .reduce((sum, a) => sum + a.currentBalance, 0);

  const totalReceiptsUSD = receipts
    .filter(r => r.currency === 'USD')
    .reduce((sum, r) => sum + r.amount, 0);

  const totalPaymentsUSD = payments
    .filter(p => p.currency === 'USD')
    .reduce((sum, p) => sum + p.amount, 0);

  // Filtered Accounts
  const filteredAccounts = accounts.filter(acc => {
    const matchSearch =
      acc.accountCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      acc.accountName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      acc.bankName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      acc.accountNumber.toLowerCase().includes(searchTerm.toLowerCase());
    return matchSearch;
  });

  // Filtered Receipts
  const filteredReceipts = receipts.filter(rec => {
    const matchBank = selectedBankFilter === 'all' || rec.bankAccountId === selectedBankFilter;
    const matchSearch =
      rec.receiptNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (rec.customerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (rec.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (rec.refNumber || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchBank && matchSearch;
  });

  // Filtered Payments
  const filteredPayments = payments.filter(pay => {
    const matchBank = selectedBankFilter === 'all' || pay.bankAccountId === selectedBankFilter;
    const matchSearch =
      pay.paymentNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (pay.supplierName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (pay.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (pay.refNumber || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchBank && matchSearch;
  });

  // Open Add Account Modal
  const handleOpenAddAccount = () => {
    const nextCode = `111${accounts.length + 1}-01`;
    setEditingAccount(null);
    setAccForm({
      accountCode: nextCode,
      accountName: '',
      bankName: 'Bank Central Asia',
      accountNumber: '',
      currency: 'USD',
      openingBalance: 0,
      currentBalance: 0,
      coaCode: '',
      notes: '',
      isActive: true
    });
    setIsAccountModalOpen(true);
  };

  // Open Edit Account Modal
  const handleOpenEditAccount = (acc: CashBankAccount) => {
    setEditingAccount(acc);
    setAccForm({ ...acc });
    setIsAccountModalOpen(true);
  };

  // Submit Account Form
  const handleSubmitAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accForm.accountName || !accForm.bankName || !accForm.accountNumber) return;

    const coaObj = coaList.find(c => c.code === accForm.coaCode);

    if (editingAccount) {
      onUpdateAccount({
        ...editingAccount,
        accountCode: accForm.accountCode || editingAccount.accountCode,
        accountName: accForm.accountName || editingAccount.accountName,
        bankName: accForm.bankName || editingAccount.bankName,
        accountNumber: accForm.accountNumber || editingAccount.accountNumber,
        currency: accForm.currency || editingAccount.currency,
        openingBalance: Number(accForm.openingBalance) || 0,
        currentBalance: Number(accForm.currentBalance) || 0,
        coaCode: accForm.coaCode,
        coaName: coaObj ? coaObj.name : editingAccount.coaName,
        notes: accForm.notes,
        isActive: accForm.isActive !== undefined ? accForm.isActive : true,
        updatedAt: new Date().toISOString().split('T')[0]
      });
    } else {
      const newAcc: CashBankAccount = {
        id: `cba_${Date.now()}`,
        accountCode: accForm.accountCode || `111${accounts.length + 1}-01`,
        accountName: accForm.accountName || 'Bank Baru',
        bankName: accForm.bankName || 'Bank',
        accountNumber: accForm.accountNumber || '-',
        currency: accForm.currency || 'USD',
        openingBalance: Number(accForm.openingBalance) || 0,
        currentBalance: Number(accForm.openingBalance) || 0,
        coaCode: accForm.coaCode,
        coaName: coaObj ? coaObj.name : '',
        notes: accForm.notes,
        isActive: true,
        createdAt: new Date().toISOString().split('T')[0],
        updatedAt: new Date().toISOString().split('T')[0]
      };
      onAddAccount(newAcc);
    }
    setIsAccountModalOpen(false);
  };

  // Open Add Receipt Modal
  const handleOpenAddReceipt = () => {
    const defaultBank = accounts.find(a => a.isActive) || accounts[0];
    const seq = receipts.length + 1;
    const padSeq = String(seq).padStart(3, '0');
    setEditingReceipt(null);
    setRecForm({
      receiptNumber: `REC/2026/03/${padSeq}`,
      date: new Date().toISOString().split('T')[0],
      bankAccountId: defaultBank ? defaultBank.id : '',
      customerCode: customers[0]?.code || '',
      customerName: customers[0]?.name || '',
      coaCode: '1121-01',
      amount: 0,
      currency: defaultBank ? defaultBank.currency : 'USD',
      exchangeRate: 16250,
      paymentMethod: 'Transfer',
      refNumber: '',
      description: ''
    });
    setIsReceiptModalOpen(true);
  };

  // Open Edit Receipt Modal
  const handleOpenEditReceipt = (rec: CashBankReceipt) => {
    setEditingReceipt(rec);
    setRecForm({ ...rec });
    setIsReceiptModalOpen(true);
  };

  // Submit Receipt Form
  const handleSubmitReceipt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recForm.bankAccountId || !recForm.amount || recForm.amount <= 0) return;

    const bankAcc = accounts.find(a => a.id === recForm.bankAccountId);
    const coaObj = coaList.find(c => c.code === recForm.coaCode);
    const custObj = customers.find(c => c.code === recForm.customerCode);

    const amt = Number(recForm.amount) || 0;
    const rate = recForm.currency === 'IDR' ? 1 : (Number(recForm.exchangeRate) || 16250);
    const totIDR = recForm.currency === 'IDR' ? amt : amt * rate;

    if (editingReceipt) {
      onUpdateReceipt({
        ...editingReceipt,
        receiptNumber: recForm.receiptNumber || editingReceipt.receiptNumber,
        date: recForm.date || editingReceipt.date,
        bankAccountId: recForm.bankAccountId,
        bankAccountName: bankAcc ? bankAcc.accountName : editingReceipt.bankAccountName,
        customerCode: recForm.customerCode,
        customerName: custObj ? custObj.name : recForm.customerName,
        coaCode: recForm.coaCode,
        coaName: coaObj ? coaObj.name : editingReceipt.coaName,
        amount: amt,
        currency: recForm.currency || 'USD',
        exchangeRate: rate,
        totalIDR: totIDR,
        paymentMethod: recForm.paymentMethod || 'Transfer',
        refNumber: recForm.refNumber,
        description: recForm.description || '',
        updatedAt: new Date().toISOString().split('T')[0]
      });
    } else {
      const newRec: CashBankReceipt = {
        id: `cbr_${Date.now()}`,
        receiptNumber: recForm.receiptNumber || `REC/${Date.now()}`,
        date: recForm.date || new Date().toISOString().split('T')[0],
        bankAccountId: recForm.bankAccountId,
        bankAccountName: bankAcc ? bankAcc.accountName : '',
        customerCode: recForm.customerCode,
        customerName: custObj ? custObj.name : (recForm.customerName || ''),
        coaCode: recForm.coaCode,
        coaName: coaObj ? coaObj.name : '',
        amount: amt,
        currency: recForm.currency || 'USD',
        exchangeRate: rate,
        totalIDR: totIDR,
        paymentMethod: recForm.paymentMethod || 'Transfer',
        refNumber: recForm.refNumber,
        description: recForm.description || '',
        createdAt: new Date().toISOString().split('T')[0],
        updatedAt: new Date().toISOString().split('T')[0]
      };
      onAddReceipt(newRec);
    }
    setIsReceiptModalOpen(false);
  };

  // Open Add Payment Modal
  const handleOpenAddPayment = () => {
    const defaultBank = accounts.find(a => a.isActive) || accounts[0];
    const seq = payments.length + 1;
    const padSeq = String(seq).padStart(3, '0');
    setEditingPayment(null);
    setPayForm({
      paymentNumber: `PAY/2026/03/${padSeq}`,
      date: new Date().toISOString().split('T')[0],
      bankAccountId: defaultBank ? defaultBank.id : '',
      supplierCode: suppliers[0]?.code || '',
      supplierName: suppliers[0]?.name || '',
      coaCode: '2111-01',
      amount: 0,
      currency: defaultBank ? defaultBank.currency : 'USD',
      exchangeRate: 16250,
      paymentMethod: 'Transfer',
      refNumber: '',
      description: ''
    });
    setIsPaymentModalOpen(true);
  };

  // Open Edit Payment Modal
  const handleOpenEditPayment = (pay: CashBankPayment) => {
    setEditingPayment(pay);
    setPayForm({ ...pay });
    setIsPaymentModalOpen(true);
  };

  // Submit Payment Form
  const handleSubmitPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payForm.bankAccountId || !payForm.amount || payForm.amount <= 0) return;

    const bankAcc = accounts.find(a => a.id === payForm.bankAccountId);
    const coaObj = coaList.find(c => c.code === payForm.coaCode);
    const suppObj = suppliers.find(s => s.code === payForm.supplierCode);

    const amt = Number(payForm.amount) || 0;
    const rate = payForm.currency === 'IDR' ? 1 : (Number(payForm.exchangeRate) || 16250);
    const totIDR = payForm.currency === 'IDR' ? amt : amt * rate;

    if (editingPayment) {
      onUpdatePayment({
        ...editingPayment,
        paymentNumber: payForm.paymentNumber || editingPayment.paymentNumber,
        date: payForm.date || editingPayment.date,
        bankAccountId: payForm.bankAccountId,
        bankAccountName: bankAcc ? bankAcc.accountName : editingPayment.bankAccountName,
        supplierCode: payForm.supplierCode,
        supplierName: suppObj ? suppObj.name : payForm.supplierName,
        coaCode: payForm.coaCode,
        coaName: coaObj ? coaObj.name : editingPayment.coaName,
        amount: amt,
        currency: payForm.currency || 'USD',
        exchangeRate: rate,
        totalIDR: totIDR,
        paymentMethod: payForm.paymentMethod || 'Transfer',
        refNumber: payForm.refNumber,
        description: payForm.description || '',
        updatedAt: new Date().toISOString().split('T')[0]
      });
    } else {
      const newPay: CashBankPayment = {
        id: `cbp_${Date.now()}`,
        paymentNumber: payForm.paymentNumber || `PAY/${Date.now()}`,
        date: payForm.date || new Date().toISOString().split('T')[0],
        bankAccountId: payForm.bankAccountId,
        bankAccountName: bankAcc ? bankAcc.accountName : '',
        supplierCode: payForm.supplierCode,
        supplierName: suppObj ? suppObj.name : (payForm.supplierName || ''),
        coaCode: payForm.coaCode,
        coaName: coaObj ? coaObj.name : '',
        amount: amt,
        currency: payForm.currency || 'USD',
        exchangeRate: rate,
        totalIDR: totIDR,
        paymentMethod: payForm.paymentMethod || 'Transfer',
        refNumber: payForm.refNumber,
        description: payForm.description || '',
        createdAt: new Date().toISOString().split('T')[0],
        updatedAt: new Date().toISOString().split('T')[0]
      };
      onAddPayment(newPay);
    }
    setIsPaymentModalOpen(false);
  };

  // Confirm Delete Handler
  const handleConfirmDelete = () => {
    if (!deleteModal) return;
    if (deleteModal.type === 'account') {
      onDeleteAccount(deleteModal.id);
    } else if (deleteModal.type === 'receipt') {
      onDeleteReceipt(deleteModal.id);
    } else if (deleteModal.type === 'payment') {
      onDeletePayment(deleteModal.id);
    }
    setDeleteModal(null);
  };

  // Export CSV
  const handleExportCSV = () => {
    let headers = '';
    let rows: string[] = [];

    if (currentTab === 'buku-bank') {
      headers = 'Kode Akun,Nama Akun,Bank,No Rekening,Mata Uang,Saldo Awal,Saldo Saat Ini,Status\n';
      rows = filteredAccounts.map(
        a =>
          `"${a.accountCode}","${a.accountName}","${a.bankName}","${a.accountNumber}","${a.currency}",${a.openingBalance},${a.currentBalance},"${a.isActive ? 'Aktif' : 'Nonaktif'}"`
      );
    } else if (currentTab === 'penerimaan') {
      headers = 'No Penerimaan,Tanggal,Rekening Bank,Customer / Pembayar,Akun COA,Jumlah,Mata Uang,Kurs,Total IDR,Metode,No Ref,Keterangan\n';
      rows = filteredReceipts.map(
        r =>
          `"${r.receiptNumber}","${r.date}","${r.bankAccountName || ''}","${r.customerName || ''}","${r.coaCode || ''}",${r.amount},"${r.currency}",${r.exchangeRate},${r.totalIDR},"${r.paymentMethod}","${r.refNumber || ''}","${r.description || ''}"`
      );
    } else {
      headers = 'No Pembayaran,Tanggal,Rekening Bank,Supplier / Penerima,Akun COA,Jumlah,Mata Uang,Kurs,Total IDR,Metode,No Ref,Keterangan\n';
      rows = filteredPayments.map(
        p =>
          `"${p.paymentNumber}","${p.date}","${p.bankAccountName || ''}","${p.supplierName || ''}","${p.coaCode || ''}",${p.amount},"${p.currency}",${p.exchangeRate},${p.totalIDR},"${p.paymentMethod}","${p.refNumber || ''}","${p.description || ''}"`
      );
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + headers + rows.join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `kas_bank_${currentTab}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div id="view-kas-dan-bank" className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 rounded-2xl shadow-sm">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-emerald-500/20 rounded-xl text-emerald-300 border border-emerald-400/20">
                <Wallet className="w-5 h-5" />
              </span>
              <h1 className="text-xl font-bold tracking-tight text-white">Kas dan Bank</h1>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Pengelolaan buku rekening bank, pencatatan arus penerimaan kas, dan pembayaran dana operasional perusahaan.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Export CSV</span>
            </button>

            {currentTab === 'buku-bank' && (
              <button
                onClick={handleOpenAddAccount}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Rekening Bank</span>
              </button>
            )}

            {currentTab === 'penerimaan' && (
              <button
                onClick={handleOpenAddReceipt}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Penerimaan</span>
              </button>
            )}

            {currentTab === 'pembayaran' && (
              <button
                onClick={handleOpenAddPayment}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Pembayaran</span>
              </button>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-slate-800/80 overflow-x-auto">
          <button
            onClick={() => onSwitchSubTab('buku-bank')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              currentTab === 'buku-bank'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Buku Bank</span>
            <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-300 font-semibold">
              {accounts.length}
            </span>
          </button>

          <button
            onClick={() => onSwitchSubTab('penerimaan')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              currentTab === 'penerimaan'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
            <span>Penerimaan (Money In)</span>
            <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-300 font-semibold">
              {receipts.length}
            </span>
          </button>

          <button
            onClick={() => onSwitchSubTab('pembayaran')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              currentTab === 'pembayaran'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <ArrowUpRight className="w-4 h-4 text-rose-400" />
            <span>Pembayaran (Money Out)</span>
            <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-300 font-semibold">
              {payments.length}
            </span>
          </button>
        </div>
      </div>

      {/* Summary Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Saldo Kas & Bank (USD)</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-slate-900">{formatCurrency(totalUSD, 'USD')}</div>
          <p className="text-[11px] text-slate-400 mt-1">Total akumulasi rekening USD aktif</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Saldo Kas & Bank (IDR)</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-slate-900">{formatCurrency(totalIDR, 'IDR')}</div>
          <p className="text-[11px] text-slate-400 mt-1">Total akumulasi rekening IDR aktif</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Total Penerimaan (USD)</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-emerald-600">{formatCurrency(totalReceiptsUSD, 'USD')}</div>
          <p className="text-[11px] text-slate-400 mt-1">{receipts.length} transaksi penerimaan recorded</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Total Pembayaran (USD)</span>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-rose-600">{formatCurrency(totalPaymentsUSD, 'USD')}</div>
          <p className="text-[11px] text-slate-400 mt-1">{payments.length} transaksi pembayaran recorded</p>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={
              currentTab === 'buku-bank'
                ? 'Cari nama bank, no rekening, kode...'
                : currentTab === 'penerimaan'
                ? 'Cari no penerimaan, customer, ref...'
                : 'Cari no pembayaran, supplier, ref...'
            }
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-indigo-500 outline-none transition"
          />
        </div>

        {currentTab !== 'buku-bank' && (
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={selectedBankFilter}
              onChange={e => setSelectedBankFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-xl px-3 py-2 outline-none focus:border-indigo-500"
            >
              <option value="all">Semua Rekening Bank</option>
              {accounts.map(a => (
                <option key={a.id} value={a.id}>
                  {a.accountName} ({a.currency})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* SUBTAB 1: BUKU BANK */}
      {currentTab === 'buku-bank' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-600" />
              <span>Daftar Rekening Bank & Kas Operasional</span>
            </h3>
            <span className="text-xs text-slate-500">
              Menampilkan {filteredAccounts.length} dari {accounts.length} rekening
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50/80 text-slate-500 uppercase font-semibold text-[11px] border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Kode & Nama Rekening</th>
                  <th className="py-3 px-4">Bank & No Rekening</th>
                  <th className="py-3 px-4">Mata Uang</th>
                  <th className="py-3 px-4 text-right">Saldo Awal</th>
                  <th className="py-3 px-4 text-right">Saldo Saat Ini</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAccounts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-400">
                      <Wallet className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      <p>Tidak ada rekening bank yang ditemukan.</p>
                    </td>
                  </tr>
                ) : (
                  filteredAccounts.map(acc => (
                    <tr key={acc.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
                            <Building2 className="w-4 h-4" />
                          </div>
                          <div>
                            <div>{acc.accountName}</div>
                            <div className="text-[11px] font-mono text-slate-400 font-normal">
                              {acc.accountCode} {acc.coaName ? `• ${acc.coaName}` : ''}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-800">{acc.bankName}</div>
                        <div className="text-[11px] font-mono text-slate-500">{acc.accountNumber}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          {acc.currency}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-500">
                        {formatCurrency(acc.openingBalance, acc.currency)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                        {formatCurrency(acc.currentBalance, acc.currency)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {acc.isActive ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            Aktif
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                            <XCircle className="w-3 h-3" />
                            Nonaktif
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEditAccount(acc)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-indigo-600 transition cursor-pointer"
                            title="Edit Rekening"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setDeleteModal({
                                isOpen: true,
                                type: 'account',
                                id: acc.id,
                                title: acc.accountName
                              })
                            }
                            className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                            title="Hapus Rekening"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBTAB 2: PENERIMAAN (MONEY IN) */}
      {currentTab === 'penerimaan' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
              <span>Daftar Penerimaan Kas & Bank (Penerimaan Piutang / Income)</span>
            </h3>
            <span className="text-xs text-slate-500">
              Menampilkan {filteredReceipts.length} dari {receipts.length} transaksi
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50/80 text-slate-500 uppercase font-semibold text-[11px] border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">No & Tanggal</th>
                  <th className="py-3 px-4">Rekening Bank</th>
                  <th className="py-3 px-4">Pembayar / Customer</th>
                  <th className="py-3 px-4">Akun COA / Ref</th>
                  <th className="py-3 px-4 text-right">Jumlah</th>
                  <th className="py-3 px-4 text-right">Total (IDR)</th>
                  <th className="py-3 px-4 text-center">Metode</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredReceipts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-slate-400">
                      <ArrowDownLeft className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      <p>Tidak ada data penerimaan yang ditemukan.</p>
                    </td>
                  </tr>
                ) : (
                  filteredReceipts.map(rec => (
                    <tr key={rec.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-bold text-emerald-700">{rec.receiptNumber}</div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3" />
                          <span>{rec.date}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-800">
                        {rec.bankAccountName || '-'}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{rec.customerName || '-'}</div>
                        <div className="text-[11px] text-slate-400">{rec.description}</div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px]">
                        <div className="text-slate-700 font-semibold">{rec.coaCode || '-'}</div>
                        <div className="text-slate-400">{rec.refNumber ? `Ref: ${rec.refNumber}` : ''}</div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-600">
                        +{formatCurrency(rec.amount, rec.currency)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-600">
                        {formatCurrency(rec.totalIDR, 'IDR')}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {rec.paymentMethod}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEditReceipt(rec)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-indigo-600 transition cursor-pointer"
                            title="Edit Penerimaan"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setDeleteModal({
                                isOpen: true,
                                type: 'receipt',
                                id: rec.id,
                                title: rec.receiptNumber
                              })
                            }
                            className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                            title="Hapus Penerimaan"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBTAB 3: PEMBAYARAN (MONEY OUT) */}
      {currentTab === 'pembayaran' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <ArrowUpRight className="w-4 h-4 text-rose-600" />
              <span>Daftar Pembayaran Kas & Bank (Pembayaran Hutang / Expense)</span>
            </h3>
            <span className="text-xs text-slate-500">
              Menampilkan {filteredPayments.length} dari {payments.length} transaksi
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50/80 text-slate-500 uppercase font-semibold text-[11px] border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">No & Tanggal</th>
                  <th className="py-3 px-4">Rekening Bank</th>
                  <th className="py-3 px-4">Penerima / Supplier</th>
                  <th className="py-3 px-4">Akun COA / Ref</th>
                  <th className="py-3 px-4 text-right">Jumlah</th>
                  <th className="py-3 px-4 text-right">Total (IDR)</th>
                  <th className="py-3 px-4 text-center">Metode</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-slate-400">
                      <ArrowUpRight className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      <p>Tidak ada data pembayaran yang ditemukan.</p>
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map(pay => (
                    <tr key={pay.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-bold text-rose-700">{pay.paymentNumber}</div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3" />
                          <span>{pay.date}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-800">
                        {pay.bankAccountName || '-'}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{pay.supplierName || '-'}</div>
                        <div className="text-[11px] text-slate-400">{pay.description}</div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px]">
                        <div className="text-slate-700 font-semibold">{pay.coaCode || '-'}</div>
                        <div className="text-slate-400">{pay.refNumber ? `Ref: ${pay.refNumber}` : ''}</div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-rose-600">
                        -{formatCurrency(pay.amount, pay.currency)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-600">
                        {formatCurrency(pay.totalIDR, 'IDR')}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                          {pay.paymentMethod}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEditPayment(pay)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-indigo-600 transition cursor-pointer"
                            title="Edit Pembayaran"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setDeleteModal({
                                isOpen: true,
                                type: 'payment',
                                id: pay.id,
                                title: pay.paymentNumber
                              })
                            }
                            className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                            title="Hapus Pembayaran"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: ACCOUNT ADD/EDIT */}
      {isAccountModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-600" />
                <span>{editingAccount ? 'Edit Rekening Bank' : 'Tambah Rekening Bank Baru'}</span>
              </h3>
              <button
                onClick={() => setIsAccountModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitAccount} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Kode Akun</label>
                  <input
                    type="text"
                    required
                    value={accForm.accountCode || ''}
                    onChange={e => setAccForm({ ...accForm, accountCode: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:bg-white focus:border-indigo-500 outline-none"
                    placeholder="1111-01"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Mata Uang</label>
                  <select
                    value={accForm.currency || 'USD'}
                    onChange={e => setAccForm({ ...accForm, currency: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:bg-white focus:border-indigo-500 outline-none"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="IDR">IDR (Rp)</option>
                    <option value="JPY">JPY (¥)</option>
                    <option value="EUR">EUR (€)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Nama Rekening / Kas</label>
                <input
                  type="text"
                  required
                  value={accForm.accountName || ''}
                  onChange={e => setAccForm({ ...accForm, accountName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 outline-none"
                  placeholder="e.g. Bank BCA Operational USD"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Nama Bank</label>
                  <input
                    type="text"
                    required
                    value={accForm.bankName || ''}
                    onChange={e => setAccForm({ ...accForm, bankName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 outline-none"
                    placeholder="e.g. Bank Central Asia"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Nomor Rekening</label>
                  <input
                    type="text"
                    required
                    value={accForm.accountNumber || ''}
                    onChange={e => setAccForm({ ...accForm, accountNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:bg-white focus:border-indigo-500 outline-none"
                    placeholder="8820-192-888"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Saldo Awal (Opening Balance)</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={accForm.openingBalance ?? 0}
                    onChange={e =>
                      setAccForm({
                        ...accForm,
                        openingBalance: parseFloat(e.target.value) || 0,
                        currentBalance: editingAccount ? accForm.currentBalance : parseFloat(e.target.value) || 0
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:bg-white focus:border-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Saldo Saat Ini (Current)</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={accForm.currentBalance ?? 0}
                    onChange={e => setAccForm({ ...accForm, currentBalance: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:bg-white focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Link Akun COA</label>
                <select
                  value={accForm.coaCode || ''}
                  onChange={e => setAccForm({ ...accForm, coaCode: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 outline-none"
                >
                  <option value="">Pilih Akun COA Kas/Bank...</option>
                  {coaList.map(c => (
                    <option key={c.code} value={c.code}>
                      {c.code} - {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Catatan</label>
                <textarea
                  rows={2}
                  value={accForm.notes || ''}
                  onChange={e => setAccForm({ ...accForm, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 outline-none"
                  placeholder="Keterangan opsional..."
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAccountModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition shadow-xs"
                >
                  {editingAccount ? 'Simpan Perubahan' : 'Tambah Rekening'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: RECEIPT ADD/EDIT */}
      {isReceiptModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <ArrowDownLeft className="w-5 h-5 text-emerald-600" />
                <span>{editingReceipt ? 'Edit Transaksi Penerimaan' : 'Pencatatan Penerimaan Kas / Bank'}</span>
              </h3>
              <button
                onClick={() => setIsReceiptModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitReceipt} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">No. Bukti Penerimaan</label>
                  <input
                    type="text"
                    required
                    value={recForm.receiptNumber || ''}
                    onChange={e => setRecForm({ ...recForm, receiptNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:bg-white focus:border-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Tanggal Transaksi</label>
                  <input
                    type="date"
                    required
                    value={recForm.date || ''}
                    onChange={e => setRecForm({ ...recForm, date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Masuk ke Rekening Bank</label>
                <select
                  required
                  value={recForm.bankAccountId || ''}
                  onChange={e => {
                    const acc = accounts.find(a => a.id === e.target.value);
                    setRecForm({
                      ...recForm,
                      bankAccountId: e.target.value,
                      currency: acc ? acc.currency : recForm.currency
                    });
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold focus:bg-white focus:border-indigo-500 outline-none"
                >
                  <option value="">Pilih Rekening Bank Tujuan...</option>
                  {accounts.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.accountName} ({a.currency}) - Saldo: {formatCurrency(a.currentBalance, a.currency)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Customer / Pembayar</label>
                  <select
                    value={recForm.customerCode || ''}
                    onChange={e => {
                      const cust = customers.find(c => c.code === e.target.value);
                      setRecForm({
                        ...recForm,
                        customerCode: e.target.value,
                        customerName: cust ? cust.name : recForm.customerName
                      });
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 outline-none"
                  >
                    <option value="">Pilih Customer...</option>
                    {customers.map(c => (
                      <option key={c.id || c.code} value={c.code}>
                        {c.code} - {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Metode Pembayaran</label>
                  <select
                    value={recForm.paymentMethod || 'Transfer'}
                    onChange={e => setRecForm({ ...recForm, paymentMethod: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 outline-none"
                  >
                    <option value="Transfer">Transfer Bank</option>
                    <option value="Cash">Tunai (Cash)</option>
                    <option value="Cheque">Cek (Cheque)</option>
                    <option value="Giro">Giro</option>
                    <option value="Other">Lain-lain</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Jumlah</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={recForm.amount ?? 0}
                    onChange={e => setRecForm({ ...recForm, amount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold focus:bg-white focus:border-indigo-500 outline-none text-emerald-700"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Mata Uang</label>
                  <input
                    type="text"
                    disabled
                    value={recForm.currency || 'USD'}
                    className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl font-bold text-slate-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Kurs (ke IDR)</label>
                  <input
                    type="number"
                    step="any"
                    value={recForm.exchangeRate ?? 16250}
                    onChange={e => setRecForm({ ...recForm, exchangeRate: parseFloat(e.target.value) || 1 })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:bg-white focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Kredit Akun COA</label>
                  <select
                    value={recForm.coaCode || ''}
                    onChange={e => setRecForm({ ...recForm, coaCode: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 outline-none"
                  >
                    <option value="">Pilih Akun Pendapatan/Piutang...</option>
                    {coaList.map(c => (
                      <option key={c.code} value={c.code}>
                        {c.code} - {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">No. Referensi / Invoice</label>
                  <input
                    type="text"
                    value={recForm.refNumber || ''}
                    onChange={e => setRecForm({ ...recForm, refNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:bg-white focus:border-indigo-500 outline-none"
                    placeholder="INV/2026/02/001"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Keterangan / Description</label>
                <textarea
                  rows={2}
                  value={recForm.description || ''}
                  onChange={e => setRecForm({ ...recForm, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 outline-none"
                  placeholder="Rincian pembayaran..."
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsReceiptModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition shadow-xs"
                >
                  {editingReceipt ? 'Simpan Perubahan' : 'Simpan Penerimaan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: PAYMENT ADD/EDIT */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <ArrowUpRight className="w-5 h-5 text-rose-600" />
                <span>{editingPayment ? 'Edit Transaksi Pembayaran' : 'Pencatatan Pembayaran Kas / Bank'}</span>
              </h3>
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitPayment} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">No. Bukti Pembayaran</label>
                  <input
                    type="text"
                    required
                    value={payForm.paymentNumber || ''}
                    onChange={e => setPayForm({ ...payForm, paymentNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:bg-white focus:border-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Tanggal Transaksi</label>
                  <input
                    type="date"
                    required
                    value={payForm.date || ''}
                    onChange={e => setPayForm({ ...payForm, date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Keluar Dari Rekening Bank</label>
                <select
                  required
                  value={payForm.bankAccountId || ''}
                  onChange={e => {
                    const acc = accounts.find(a => a.id === e.target.value);
                    setPayForm({
                      ...payForm,
                      bankAccountId: e.target.value,
                      currency: acc ? acc.currency : payForm.currency
                    });
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold focus:bg-white focus:border-indigo-500 outline-none"
                >
                  <option value="">Pilih Rekening Sumber...</option>
                  {accounts.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.accountName} ({a.currency}) - Saldo: {formatCurrency(a.currentBalance, a.currency)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Supplier / Penerima</label>
                  <select
                    value={payForm.supplierCode || ''}
                    onChange={e => {
                      const supp = suppliers.find(s => s.code === e.target.value);
                      setPayForm({
                        ...payForm,
                        supplierCode: e.target.value,
                        supplierName: supp ? supp.name : payForm.supplierName
                      });
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 outline-none"
                  >
                    <option value="">Pilih Supplier / Vendor...</option>
                    {suppliers.map(s => (
                      <option key={s.id || s.code} value={s.code}>
                        {s.code} - {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Metode Pembayaran</label>
                  <select
                    value={payForm.paymentMethod || 'Transfer'}
                    onChange={e => setPayForm({ ...payForm, paymentMethod: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 outline-none"
                  >
                    <option value="Transfer">Transfer Bank</option>
                    <option value="Cash">Tunai (Cash)</option>
                    <option value="Cheque">Cek (Cheque)</option>
                    <option value="Giro">Giro</option>
                    <option value="Other">Lain-lain</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Jumlah</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={payForm.amount ?? 0}
                    onChange={e => setPayForm({ ...payForm, amount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold focus:bg-white focus:border-indigo-500 outline-none text-rose-700"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Mata Uang</label>
                  <input
                    type="text"
                    disabled
                    value={payForm.currency || 'USD'}
                    className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl font-bold text-slate-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Kurs (ke IDR)</label>
                  <input
                    type="number"
                    step="any"
                    value={payForm.exchangeRate ?? 16250}
                    onChange={e => setPayForm({ ...payForm, exchangeRate: parseFloat(e.target.value) || 1 })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:bg-white focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Debet Akun COA</label>
                  <select
                    value={payForm.coaCode || ''}
                    onChange={e => setPayForm({ ...payForm, coaCode: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 outline-none"
                  >
                    <option value="">Pilih Akun Beban/Hutang...</option>
                    {coaList.map(c => (
                      <option key={c.code} value={c.code}>
                        {c.code} - {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">No. Referensi / PO</label>
                  <input
                    type="text"
                    value={payForm.refNumber || ''}
                    onChange={e => setPayForm({ ...payForm, refNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:bg-white focus:border-indigo-500 outline-none"
                    placeholder="PO/2026/03/001"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Keterangan / Description</label>
                <textarea
                  rows={2}
                  value={payForm.description || ''}
                  onChange={e => setPayForm({ ...payForm, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 outline-none"
                  placeholder="Rincian pengeluaran..."
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold transition shadow-xs"
                >
                  {editingPayment ? 'Simpan Perubahan' : 'Simpan Pembayaran'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DELETE CONFIRMATION */}
      {deleteModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-rose-600 mb-4">
              <div className="p-3 bg-rose-50 rounded-xl border border-rose-100">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Hapus Data Kas dan Bank</h3>
                <p className="text-xs text-slate-500 font-medium">Konfirmasi Penghapusan</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-6">
              Apakah Anda yakin ingin menghapus data{' '}
              <strong className="text-slate-900">"{deleteModal.title}"</strong>? Data yang dihapus tidak dapat dipulihkan.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => setDeleteModal(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-xs"
              >
                Hapus Sekarang
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
