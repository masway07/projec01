import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Search,
  Filter,
  Download,
  Printer,
  Calendar,
  Layers,
  ArrowUpRight,
  ArrowDownLeft,
  FileSpreadsheet,
  Building2,
  TrendingUp,
  CreditCard,
  Wallet,
  CheckCircle2,
  Info
} from 'lucide-react';
import { COA, Department, ExchangeRates, CompanySettings, AppUser, CashBankReceipt, CashBankPayment, SalesInvoiceItem, PurchaseInvoice } from '../../types';

interface LedgerViewProps {
  coaList: COA[];
  departments: Department[];
  ratesByYear: Record<string, ExchangeRates>;
  companySettings: CompanySettings;
  currentUser?: AppUser | null;
  cashReceipts?: CashBankReceipt[];
  cashBankReceipts?: CashBankReceipt[];
  cashPayments?: CashBankPayment[];
  cashBankPayments?: CashBankPayment[];
  salesInvoices?: SalesInvoiceItem[];
  purchaseInvoices?: PurchaseInvoice[];
  activeReportTab?: string;
  onSwitchReportTab?: (tab: string) => void;
}

interface GeneralLedgerRow {
  id: string;
  date: string;
  refNo: string;
  sourceModule: string;
  coaCode: string;
  coaName: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
  deptCode?: string;
}

export const LedgerView: React.FC<LedgerViewProps> = ({
  coaList = [],
  departments = [],
  companySettings,
  currentUser,
  cashReceipts: propReceipts = [],
  cashBankReceipts = [],
  cashPayments: propPayments = [],
  cashBankPayments = [],
  salesInvoices = [],
  purchaseInvoices = [],
  activeReportTab = 'report-ledger',
  onSwitchReportTab
}) => {
  const cashReceipts = propReceipts.length > 0 ? propReceipts : cashBankReceipts;
  const cashPayments = propPayments.length > 0 ? propPayments : cashBankPayments;
  const [selectedCoaCode, setSelectedCoaCode] = useState<string>('all');
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('2026-01-01');
  const [endDate, setEndDate] = useState<string>('2026-12-31');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currencyView, setCurrencyView] = useState<'IDR' | 'USD'>('IDR');
  const [exchangeRate] = useState<number>(16273.56);

  // Generate synthetic and combined transactions for General Ledger
  const ledgerRows = useMemo(() => {
    const rows: GeneralLedgerRow[] = [];

    // 1. Transactions from Cash/Bank Receipts
    cashReceipts.forEach((r, idx) => {
      rows.push({
        id: `cbr-${r.id || idx}`,
        date: r.date || '2026-03-01',
        refNo: r.receiptNumber || `CR-${idx + 1}`,
        sourceModule: 'Kas & Bank (Penerimaan)',
        coaCode: r.coaCode || '1010001',
        coaName: r.coaName || r.bankAccountName || 'Kas Operasional',
        description: r.description || `Penerimaan dari ${r.customerName || 'Customer'}`,
        debit: r.totalIDR || (r.currency === 'USD' ? (r.amount || 0) * exchangeRate : (r.amount || 0)),
        credit: 0,
        balance: 0,
        deptCode: undefined
      });
    });

    // 2. Transactions from Cash/Bank Payments
    cashPayments.forEach((p, idx) => {
      rows.push({
        id: `cbp-${p.id || idx}`,
        date: p.date || '2026-03-05',
        refNo: p.paymentNumber || `CP-${idx + 1}`,
        sourceModule: 'Kas & Bank (Pembayaran)',
        coaCode: p.coaCode || '1020001',
        coaName: p.coaName || p.bankAccountName || 'Bank Mandiri Operasional',
        description: p.description || `Pembayaran kepada ${p.supplierName || 'Vendor'}`,
        debit: 0,
        credit: p.totalIDR || (p.currency === 'USD' ? (p.amount || 0) * exchangeRate : (p.amount || 0)),
        balance: 0,
        deptCode: undefined
      });
    });

    // 3. Transactions from Sales Invoices (Revenue credit, AR debit)
    salesInvoices.forEach((si, idx) => {
      const amountIDR = si.totalAmountIDR || (si.totalAmount || 0) * (si.rate || exchangeRate);
      rows.push({
        id: `sinv-ar-${si.id || idx}`,
        date: si.invoiceDate || '2026-03-10',
        refNo: si.invoiceNo || `INV-SLS-${idx + 1}`,
        sourceModule: 'Sales Invoice (Piutang)',
        coaCode: '1030001',
        coaName: 'Piutang Usaha (Trade AR)',
        description: `Piutang Faktur Penjualan ${si.customer || ''}`,
        debit: amountIDR,
        credit: 0,
        balance: 0,
        deptCode: 'BAG1'
      });
      rows.push({
        id: `sinv-rev-${si.id || idx}`,
        date: si.invoiceDate || '2026-03-10',
        refNo: si.invoiceNo || `INV-SLS-${idx + 1}`,
        sourceModule: 'Sales Invoice (Pendapatan)',
        coaCode: '4010001',
        coaName: 'Pendapatan Penjualan Finish Good',
        description: `Penjualan ${si.customer || ''}`,
        debit: 0,
        credit: amountIDR,
        balance: 0,
        deptCode: 'BAG1'
      });
    });

    // 4. Transactions from Purchase Invoices (Inventory debit, AP credit)
    purchaseInvoices.forEach((pi, idx) => {
      const amountIDR = pi.grandTotalIDR || (pi.grandTotal || 0) * (pi.rate || exchangeRate);
      rows.push({
        id: `pinv-inv-${pi.id || idx}`,
        date: pi.invoiceDate || '2026-03-12',
        refNo: pi.invoiceNumber || `PINV-${idx + 1}`,
        sourceModule: 'Purchase Invoice (Persediaan)',
        coaCode: '1080001',
        coaName: 'Persediaan Raw Material SPCC',
        description: `Pembelian Raw Material dari ${pi.supplierName || ''}`,
        debit: amountIDR,
        credit: 0,
        balance: 0,
        deptCode: 'CF'
      });
      rows.push({
        id: `pinv-ap-${pi.id || idx}`,
        date: pi.invoiceDate || '2026-03-12',
        refNo: pi.invoiceNumber || `PINV-${idx + 1}`,
        sourceModule: 'Purchase Invoice (Hutang)',
        coaCode: '2010001',
        coaName: 'Hutang Usaha Supplier (Trade AP)',
        description: `Tagihan Hutang Usaha ${pi.supplierName || ''}`,
        debit: 0,
        credit: amountIDR,
        balance: 0,
        deptCode: 'CF'
      });
    });

    // Default Seed / Standard Journal Entries if empty
    if (rows.length < 8) {
      rows.push(
        {
          id: 'gen-001',
          date: '2026-01-02',
          refNo: 'JV/2026/01/001',
          sourceModule: 'Saldo Awal',
          coaCode: '1010001',
          coaName: 'Kas Operasional Perusahaan',
          description: 'Saldo Awal Kas Per 1 Januari 2026',
          debit: 50000000,
          credit: 0,
          balance: 50000000,
          deptCode: 'ACC'
        },
        {
          id: 'gen-002',
          date: '2026-01-02',
          refNo: 'JV/2026/01/001',
          sourceModule: 'Saldo Awal',
          coaCode: '1020001',
          coaName: 'Bank BCA Giro Operasional',
          description: 'Saldo Awal Bank BCA Per 1 Januari 2026',
          debit: 450000000,
          credit: 0,
          balance: 450000000,
          deptCode: 'ACC'
        },
        {
          id: 'gen-003',
          date: '2026-01-02',
          refNo: 'JV/2026/01/001',
          sourceModule: 'Saldo Awal',
          coaCode: '3010001',
          coaName: 'Modal Disetor Pemegang Saham',
          description: 'Saldo Awal Ekuitas Modal',
          debit: 0,
          credit: 500000000,
          balance: -500000000,
          deptCode: 'ACC'
        },
        {
          id: 'gen-004',
          date: '2026-02-15',
          refNo: 'JV/2026/02/012',
          sourceModule: 'Jurnal Beban',
          coaCode: '6010001',
          coaName: 'Beban Gaji Karyawan',
          description: 'Beban Penggajian Karyawan Dept Produksi',
          debit: 75000000,
          credit: 0,
          balance: 75000000,
          deptCode: 'HRGA'
        },
        {
          id: 'gen-005',
          date: '2026-02-15',
          refNo: 'JV/2026/02/012',
          sourceModule: 'Jurnal Beban',
          coaCode: '1020001',
          coaName: 'Bank BCA Giro Operasional',
          description: 'Payroll Transfer Karyawan',
          debit: 0,
          credit: 75000000,
          balance: -75000000,
          deptCode: 'HRGA'
        }
      );
    }

    // Sort by Date
    return rows.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [cashReceipts, cashPayments, salesInvoices, purchaseInvoices, exchangeRate]);

  // Filtered rows
  const filteredRows = useMemo(() => {
    let runningBalance = 0;
    return ledgerRows
      .filter(r => {
        if (selectedCoaCode !== 'all' && r.coaCode !== selectedCoaCode) return false;
        if (selectedDept !== 'all' && r.deptCode !== selectedDept) return false;
        if (startDate && r.date < startDate) return false;
        if (endDate && r.date > endDate) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          return (
            r.refNo.toLowerCase().includes(q) ||
            r.description.toLowerCase().includes(q) ||
            r.coaCode.toLowerCase().includes(q) ||
            r.coaName.toLowerCase().includes(q) ||
            r.sourceModule.toLowerCase().includes(q)
          );
        }
        return true;
      })
      .map(r => {
        const debitVal = currencyView === 'USD' ? r.debit / exchangeRate : r.debit;
        const creditVal = currencyView === 'USD' ? r.credit / exchangeRate : r.credit;
        runningBalance += (debitVal - creditVal);
        return {
          ...r,
          displayDebit: debitVal,
          displayCredit: creditVal,
          displayBalance: runningBalance
        };
      });
  }, [ledgerRows, selectedCoaCode, selectedDept, startDate, endDate, searchQuery, currencyView, exchangeRate]);

  // Summary Totals
  const totals = useMemo(() => {
    const totalDebit = filteredRows.reduce((sum, r) => sum + (r.displayDebit || 0), 0);
    const totalCredit = filteredRows.reduce((sum, r) => sum + (r.displayCredit || 0), 0);
    const netBalance = totalDebit - totalCredit;
    return { totalDebit, totalCredit, netBalance };
  }, [filteredRows]);

  const formatCurrency = (val: number) => {
    if (currencyView === 'USD') {
      return `$ ${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `Rp ${val.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  const handleExportCSV = () => {
    const headers = ['No. Referensi', 'Tanggal', 'Modul Sumber', 'Kode COA', 'Nama Akun', 'Departemen', 'Keterangan', 'Debit', 'Kredit', 'Saldo'];
    const csvRows = filteredRows.map(r => [
      r.refNo,
      r.date,
      `"${r.sourceModule}"`,
      r.coaCode,
      `"${r.coaName}"`,
      r.deptCode || '-',
      `"${r.description.replace(/"/g, '""')}"`,
      r.displayDebit.toFixed(2),
      r.displayCredit.toFixed(2),
      r.displayBalance.toFixed(2)
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...csvRows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Buku_Besar_Ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const reportTabs = [
    { id: 'report-ledger', label: 'Ledger (Buku Besar)' },
    { id: 'report-balance-sheet', label: 'Balance Sheet (Neraca)' },
    { id: 'report-trial-balance', label: 'Trial Balance' },
    { id: 'report-profit-loss', label: 'Profit / Loss (Laba Rugi)' }
  ];

  return (
    <div className="space-y-5">
      {/* Submenu Tabs Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3 bg-white p-4 rounded-xl shadow-xs">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">Financial Reports</h1>
            <p className="text-xs text-slate-500">Laporan Akuntansi & Keuangan Terintegrasi</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
          {reportTabs.map(t => (
            <button
              key={t.id}
              onClick={() => onSwitchReportTab && onSwitchReportTab(t.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeReportTab === t.id
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase">Total Mutasi Debit</span>
            <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg font-black text-slate-900">{formatCurrency(totals.totalDebit)}</div>
          <div className="text-[11px] text-emerald-600 mt-1 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Penerimaan / Penambahan Aset
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase">Total Mutasi Kredit</span>
            <div className="p-1.5 bg-rose-50 text-rose-600 rounded-lg">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg font-black text-slate-900">{formatCurrency(totals.totalCredit)}</div>
          <div className="text-[11px] text-rose-600 mt-1 font-semibold flex items-center gap-1">
            <Info className="w-3.5 h-3.5" /> Pengeluaran / Penambahan Kewajiban
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase">Net Saldo Berjalan</span>
            <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-lg font-black ${totals.netBalance >= 0 ? 'text-indigo-600' : 'text-rose-600'}`}>
            {formatCurrency(totals.netBalance)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Debit minus Kredit</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase">Jumlah Transaksi</span>
            <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg font-black text-slate-900">{filteredRows.length} Jurnal</div>
          <div className="text-[11px] text-slate-500 mt-1">Entri pada filter terpilih</div>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Cari no. ref, keterangan, akun COA..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <select
              value={selectedCoaCode}
              onChange={e => setSelectedCoaCode(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="all">Semua Akun COA</option>
              {coaList.map(c => (
                <option key={c.code} value={c.code}>{c.code} - {c.name}</option>
              ))}
            </select>

            <select
              value={selectedDept}
              onChange={e => setSelectedDept(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="all">Semua Departemen</option>
              {departments.map(d => (
                <option key={d.code} value={d.code}>{d.code} - {d.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-xl">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="bg-transparent text-xs text-slate-700 focus:outline-none"
              />
              <span className="text-xs text-slate-400">s/d</span>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="bg-transparent text-xs text-slate-700 focus:outline-none"
              />
            </div>

            <div className="flex items-center bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setCurrencyView('IDR')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
                  currencyView === 'IDR' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600'
                }`}
              >
                IDR
              </button>
              <button
                onClick={() => setCurrencyView('USD')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
                  currencyView === 'USD' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600'
                }`}
              >
                USD
              </button>
            </div>

            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Ledger Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-3">Tanggal</th>
                <th className="py-3 px-3">No. Referensi</th>
                <th className="py-3 px-3">Modul Sumber</th>
                <th className="py-3 px-3">Akun COA</th>
                <th className="py-3 px-3">Dept</th>
                <th className="py-3 px-3 min-w-[200px]">Keterangan Transaksi</th>
                <th className="py-3 px-3 text-right">Debit ({currencyView})</th>
                <th className="py-3 px-3 text-right">Kredit ({currencyView})</th>
                <th className="py-3 px-3 text-right">Saldo Kumulatif</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    Tidak ada transaksi buku besar yang sesuai dengan kriteria filter.
                  </td>
                </tr>
              ) : (
                filteredRows.map(row => (
                  <tr key={row.id} className="hover:bg-slate-50 transition">
                    <td className="py-2.5 px-3 whitespace-nowrap text-slate-700 font-medium">{row.date}</td>
                    <td className="py-2.5 px-3 whitespace-nowrap font-mono font-bold text-indigo-600">{row.refNo}</td>
                    <td className="py-2.5 px-3 whitespace-nowrap text-slate-600">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-semibold">
                        {row.sourceModule}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <div className="font-bold text-slate-800">{row.coaCode}</div>
                      <div className="text-[10px] text-slate-500">{row.coaName}</div>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-bold text-[10px]">
                        {row.deptCode || '-'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-700">{row.description}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-semibold text-emerald-700 whitespace-nowrap">
                      {row.displayDebit > 0 ? formatCurrency(row.displayDebit) : '-'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-semibold text-rose-700 whitespace-nowrap">
                      {row.displayCredit > 0 ? formatCurrency(row.displayCredit) : '-'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-indigo-900 whitespace-nowrap">
                      {formatCurrency(row.displayBalance)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {filteredRows.length > 0 && (
              <tfoot className="bg-slate-50 border-t-2 border-slate-200 font-bold text-slate-900">
                <tr>
                  <td colSpan={6} className="py-3 px-3 text-right uppercase tracking-wider">
                    Total Mutasi & Saldo Akhir:
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-emerald-700 whitespace-nowrap">
                    {formatCurrency(totals.totalDebit)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-rose-700 whitespace-nowrap">
                    {formatCurrency(totals.totalCredit)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-indigo-900 whitespace-nowrap">
                    {formatCurrency(totals.netBalance)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};
