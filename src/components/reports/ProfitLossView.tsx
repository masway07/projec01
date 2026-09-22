import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  Download,
  Printer,
  DollarSign,
  Percent,
  Layers,
  PieChart,
  Building2,
  FileSpreadsheet,
  ArrowUpRight,
  ArrowDownLeft,
  Briefcase
} from 'lucide-react';
import { COA, Department, ExchangeRates, CompanySettings, SalesInvoiceItem, PurchaseInvoice, DeptPlanningItem, BudgetRealization } from '../../types';

interface ProfitLossViewProps {
  coaList: COA[];
  departments: Department[];
  ratesByYear: Record<string, ExchangeRates>;
  companySettings: CompanySettings;
  salesInvoices?: SalesInvoiceItem[];
  purchaseInvoices?: PurchaseInvoice[];
  deptPlanningItems?: DeptPlanningItem[];
  realizations?: BudgetRealization[];
  activeReportTab?: string;
  onSwitchReportTab?: (tab: string) => void;
}

export const ProfitLossView: React.FC<ProfitLossViewProps> = ({
  coaList = [],
  departments = [],
  companySettings,
  salesInvoices = [],
  purchaseInvoices = [],
  deptPlanningItems = [],
  realizations = [],
  activeReportTab = 'report-profit-loss',
  onSwitchReportTab
}) => {
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [currencyView, setCurrencyView] = useState<'IDR' | 'USD'>('IDR');
  const [exchangeRate] = useState<number>(16273.56);

  // Compute Income Statement amounts
  const plData = useMemo(() => {
    // 1. Gross Revenue from Sales Invoices
    const salesTotalIDR = salesInvoices.reduce((sum, s) => {
      const amt = s.totalAmountIDR || ((s.totalAmount || 0) * (s.rate || exchangeRate));
      return sum + amt;
    }, 0) || 1250000000;

    const salesDiscountIDR = salesTotalIDR * 0.02;
    const netRevenueIDR = salesTotalIDR - salesDiscountIDR;

    // 2. Cost of Goods Sold (COGS / HPP)
    const rawMaterialConsumedIDR = purchaseInvoices.reduce((sum, p) => {
      const amt = p.grandTotalIDR || ((p.grandTotal || 0) * (p.rate || exchangeRate));
      return sum + amt;
    }, 0) * 0.85 || 580000000;

    const directLaborCostIDR = 145000000;
    const factoryOverheadCostIDR = 95000000;
    const totalCogsIDR = rawMaterialConsumedIDR + directLaborCostIDR + factoryOverheadCostIDR;

    // 3. Gross Profit
    const grossProfitIDR = netRevenueIDR - totalCogsIDR;
    const grossMarginPercent = netRevenueIDR > 0 ? (grossProfitIDR / netRevenueIDR) * 100 : 0;

    // 4. Operating Expenses (Beban Operasional) by Department
    const deptExpenseItems = departments.map(d => {
      // Find realization or dept planning for this department
      const deptRealizations = realizations.filter(r => r.deptCode === d.code);
      const sumRealization = deptRealizations.reduce((sum, r) => sum + (r.price || 0), 0);

      // Default reasonable amounts if empty
      let amount = sumRealization > 0 ? sumRealization : 0;
      if (amount === 0) {
        if (d.code === 'ACC') amount = 35000000;
        else if (d.code === 'HRGA') amount = 65000000;
        else if (d.code === 'ENG') amount = 42000000;
        else if (d.code === 'CF') amount = 28000000;
        else if (d.code === 'FIN') amount = 22000000;
        else if (d.code === 'BAG1') amount = 18000000;
        else if (d.code === 'BAG2') amount = 15000000;
        else amount = 10000000;
      }

      return {
        deptCode: d.code,
        deptName: d.name,
        amount
      };
    });

    const totalOperatingExpensesIDR = deptExpenseItems.reduce((sum, d) => sum + d.amount, 0);

    // 5. Operating Income (EBIT)
    const operatingIncomeIDR = grossProfitIDR - totalOperatingExpensesIDR;
    const operatingMarginPercent = netRevenueIDR > 0 ? (operatingIncomeIDR / netRevenueIDR) * 100 : 0;

    // 6. Other Income & Expenses
    const interestIncomeIDR = 8500000;
    const gainOnForexIDR = 12400000;
    const interestExpenseIDR = 18000000;
    const netOtherIncomeIDR = (interestIncomeIDR + gainOnForexIDR) - interestExpenseIDR;

    // 7. Net Profit Before Tax (EBT)
    const profitBeforeTaxIDR = operatingIncomeIDR + netOtherIncomeIDR;

    // 8. Tax (PPh Badan 22%)
    const taxExpenseIDR = profitBeforeTaxIDR > 0 ? profitBeforeTaxIDR * 0.22 : 0;

    // 9. Net Profit After Tax
    const netProfitAfterTaxIDR = profitBeforeTaxIDR - taxExpenseIDR;
    const netMarginPercent = netRevenueIDR > 0 ? (netProfitAfterTaxIDR / netRevenueIDR) * 100 : 0;

    return {
      grossSales: salesTotalIDR,
      salesDiscount: salesDiscountIDR,
      netRevenue: netRevenueIDR,

      rawMaterialConsumed: rawMaterialConsumedIDR,
      directLabor: directLaborCostIDR,
      factoryOverhead: factoryOverheadCostIDR,
      totalCogs: totalCogsIDR,

      grossProfit: grossProfitIDR,
      grossMarginPercent,

      deptExpenses: deptExpenseItems,
      totalOperatingExpenses: totalOperatingExpensesIDR,

      operatingIncome: operatingIncomeIDR,
      operatingMarginPercent,

      interestIncome: interestIncomeIDR,
      gainOnForex: gainOnForexIDR,
      interestExpense: interestExpenseIDR,
      netOtherIncome: netOtherIncomeIDR,

      profitBeforeTax: profitBeforeTaxIDR,
      taxExpense: taxExpenseIDR,
      netProfitAfterTax: netProfitAfterTaxIDR,
      netMarginPercent
    };
  }, [salesInvoices, purchaseInvoices, realizations, departments, exchangeRate]);

  const formatCurrency = (val: number) => {
    const converted = currencyView === 'USD' ? val / exchangeRate : val;
    if (currencyView === 'USD') {
      return `$ ${converted.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `Rp ${converted.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  const handleExportCSV = () => {
    const rows = [
      ['LAPORAN LABA RUGI (PROFIT & LOSS STATEMENT)'],
      [`Tahun Buku: ${selectedYear} | Periode: ${selectedMonth === 'all' ? 'Januari - Desember' : selectedMonth}`],
      [`Mata Uang: ${currencyView}`],
      [],
      ['DESKRIPSI AKUN / ELEMEN KEUANGAN', 'JUMLAH', 'PERSENTASE TERHADAP PENDAPATAN'],
      ['1. PENDAPATAN USAHA (REVENUE)'],
      ['  Penjualan Kotor Finish Good', formatCurrency(plData.grossSales), '100%'],
      ['  Diskon & Retur Penjualan', `(${formatCurrency(plData.salesDiscount)})`, `${((plData.salesDiscount / plData.grossSales) * 100).toFixed(1)}%`],
      ['Total Pendapatan Bersih (Net Revenue)', formatCurrency(plData.netRevenue), '100.0%'],
      [],
      ['2. BEBAN POKOK PENJUALAN (COGS / HPP)'],
      ['  Biaya Pemakaian Bahan Baku (Raw Material)', formatCurrency(plData.rawMaterialConsumed), `${((plData.rawMaterialConsumed / plData.netRevenue) * 100).toFixed(1)}%`],
      ['  Biaya Tenaga Kerja Langsung (Direct Labor)', formatCurrency(plData.directLabor), `${((plData.directLabor / plData.netRevenue) * 100).toFixed(1)}%`],
      ['  Biaya Overhead Pabrik (Factory Overhead)', formatCurrency(plData.factoryOverhead), `${((plData.factoryOverhead / plData.netRevenue) * 100).toFixed(1)}%`],
      ['Total Beban Pokok Penjualan', formatCurrency(plData.totalCogs), `${((plData.totalCogs / plData.netRevenue) * 100).toFixed(1)}%`],
      [],
      ['3. LABA KOTOR (GROSS PROFIT)', formatCurrency(plData.grossProfit), `${plData.grossMarginPercent.toFixed(1)}%`],
      [],
      ['4. BEBAN OPERASIONAL & UMUM (SG&A EXPENSES)'],
      ...plData.deptExpenses.map(d => [`  Beban Operasional Dept ${d.deptName} (${d.deptCode})`, formatCurrency(d.amount), `${((d.amount / plData.netRevenue) * 100).toFixed(1)}%`]),
      ['Total Beban Operasional', formatCurrency(plData.totalOperatingExpenses), `${((plData.totalOperatingExpenses / plData.netRevenue) * 100).toFixed(1)}%`],
      [],
      ['5. LABA OPERASIONAL (OPERATING INCOME / EBIT)', formatCurrency(plData.operatingIncome), `${plData.operatingMarginPercent.toFixed(1)}%`],
      [],
      ['6. PENDAPATAN & BEBAN LAIN-LAIN'],
      ['  Pendapatan Bunga Jasa Giro', formatCurrency(plData.interestIncome), '-'],
      ['  Keuntungan Selisih Kurs Valas', formatCurrency(plData.gainOnForex), '-'],
      ['  Beban Bunga Pinjaman Bank', `(${formatCurrency(plData.interestExpense)})`, '-'],
      ['Total Pendapatan / (Beban) Lain-Lain Bersih', formatCurrency(plData.netOtherIncome), '-'],
      [],
      ['7. LABA BERSIH SEBELUM PAJAK (EBT)', formatCurrency(plData.profitBeforeTax), `${((plData.profitBeforeTax / plData.netRevenue) * 100).toFixed(1)}%`],
      ['8. Beban Pajak Penghasilan (PPh Badan 22%)', `(${formatCurrency(plData.taxExpense)})`, `${((plData.taxExpense / plData.netRevenue) * 100).toFixed(1)}%`],
      ['9. LABA BERSIH TAHUN BERJALAN (NET PROFIT AFTER TAX)', formatCurrency(plData.netProfitAfterTax), `${plData.netMarginPercent.toFixed(1)}%`]
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Profit_Loss_Laba_Rugi_${selectedYear}.csv`);
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
      {/* Submenu Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3 bg-white p-4 rounded-xl shadow-xs">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">Profit & Loss (Laporan Laba Rugi)</h1>
            <p className="text-xs text-slate-500">Kinerja Pendapatan, HPP, Beban Operasional, dan Laba Bersih</p>
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

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase">Pendapatan Bersih</span>
            <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg font-black text-slate-900">{formatCurrency(plData.netRevenue)}</div>
          <div className="text-[11px] text-emerald-600 mt-1 font-semibold">Net Sales Penjualan</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase">Laba Kotor (Gross Profit)</span>
            <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg font-black text-blue-600">{formatCurrency(plData.grossProfit)}</div>
          <div className="text-[11px] text-slate-500 mt-1 font-medium">Margin: {plData.grossMarginPercent.toFixed(1)}%</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase">Beban Operasional</span>
            <div className="p-1.5 bg-rose-50 text-rose-600 rounded-lg">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg font-black text-rose-600">{formatCurrency(plData.totalOperatingExpenses)}</div>
          <div className="text-[11px] text-slate-500 mt-1">Biaya SG&A Seluruh Dept</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase">Laba Bersih (Net Profit)</span>
            <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg font-black text-indigo-600">{formatCurrency(plData.netProfitAfterTax)}</div>
          <div className="text-[11px] text-indigo-600 mt-1 font-bold">Net Margin: {plData.netMarginPercent.toFixed(1)}%</div>
        </div>
      </div>

      {/* Filter and Top Controls */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-bold text-slate-700">Tahun:</span>
            <select
              value={selectedYear}
              onChange={e => setSelectedYear(Number(e.target.value))}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none"
            >
              <option value={2025}>2025</option>
              <option value={2026}>2026</option>
              <option value={2027}>2027</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700">Bulan:</span>
            <select
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none"
            >
              <option value="all">Sepanjang Tahun (YTD Jan - Des)</option>
              <option value="Jan">Januari</option>
              <option value="Feb">Februari</option>
              <option value="Mar">Maret</option>
              <option value="Apr">April</option>
              <option value="Mei">Mei</option>
              <option value="Jun">Juni</option>
              <option value="Jul">Juli</option>
              <option value="Agu">Agustus</option>
              <option value="Sep">September</option>
              <option value="Okt">Oktober</option>
              <option value="Nov">November</option>
              <option value="Des">Desember</option>
            </select>
          </div>

          <div className="flex items-center bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setCurrencyView('IDR')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
                currencyView === 'IDR' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600'
              }`}
            >
              IDR
            </button>
            <button
              onClick={() => setCurrencyView('USD')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
                currencyView === 'USD' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600'
              }`}
            >
              USD
            </button>
          </div>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Main Income Statement Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4 min-w-[320px]">Deskripsi Akun / Pos Finansial</th>
                <th className="py-3 px-4 text-right w-44">Jumlah ({currencyView})</th>
                <th className="py-3 px-4 text-right w-28">% Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {/* SECTION 1: REVENUE */}
              <tr className="bg-slate-50/70 font-bold text-slate-900">
                <td colSpan={3} className="py-2.5 px-4 uppercase text-[11px] tracking-wide text-indigo-900">
                  1. PENDAPATAN USAHA (REVENUE)
                </td>
              </tr>
              <tr>
                <td className="py-2 px-6">Penjualan Kotor Finish Good (Gross Sales)</td>
                <td className="py-2 px-4 text-right font-mono font-medium">{formatCurrency(plData.grossSales)}</td>
                <td className="py-2 px-4 text-right font-mono text-slate-500">100.0%</td>
              </tr>
              <tr>
                <td className="py-2 px-6 text-slate-500">Diskon & Retur Penjualan</td>
                <td className="py-2 px-4 text-right font-mono text-rose-600">({formatCurrency(plData.salesDiscount)})</td>
                <td className="py-2 px-4 text-right font-mono text-slate-500">
                  {((plData.salesDiscount / plData.grossSales) * 100).toFixed(1)}%
                </td>
              </tr>
              <tr className="bg-indigo-50/40 font-bold text-indigo-950">
                <td className="py-2.5 px-4 font-extrabold">TOTAL PENDAPATAN BERSIH (NET REVENUE)</td>
                <td className="py-2.5 px-4 text-right font-mono text-indigo-800">{formatCurrency(plData.netRevenue)}</td>
                <td className="py-2.5 px-4 text-right font-mono text-indigo-800">100.0%</td>
              </tr>

              {/* SECTION 2: COGS */}
              <tr className="bg-slate-50/70 font-bold text-slate-900">
                <td colSpan={3} className="py-2.5 px-4 uppercase text-[11px] tracking-wide text-indigo-900">
                  2. BEBAN POKOK PENJUALAN (COST OF GOODS SOLD / HPP)
                </td>
              </tr>
              <tr>
                <td className="py-2 px-6">Biaya Pemakaian Bahan Baku (Raw Material Consumed)</td>
                <td className="py-2 px-4 text-right font-mono font-medium">{formatCurrency(plData.rawMaterialConsumed)}</td>
                <td className="py-2 px-4 text-right font-mono text-slate-500">
                  {((plData.rawMaterialConsumed / plData.netRevenue) * 100).toFixed(1)}%
                </td>
              </tr>
              <tr>
                <td className="py-2 px-6">Biaya Tenaga Kerja Langsung (Direct Labor)</td>
                <td className="py-2 px-4 text-right font-mono font-medium">{formatCurrency(plData.directLabor)}</td>
                <td className="py-2 px-4 text-right font-mono text-slate-500">
                  {((plData.directLabor / plData.netRevenue) * 100).toFixed(1)}%
                </td>
              </tr>
              <tr>
                <td className="py-2 px-6">Biaya Overhead Pabrik (Factory Overhead & Utility)</td>
                <td className="py-2 px-4 text-right font-mono font-medium">{formatCurrency(plData.factoryOverhead)}</td>
                <td className="py-2 px-4 text-right font-mono text-slate-500">
                  {((plData.factoryOverhead / plData.netRevenue) * 100).toFixed(1)}%
                </td>
              </tr>
              <tr className="bg-slate-100/70 font-bold text-slate-900">
                <td className="py-2.5 px-4">TOTAL BEBAN POKOK PENJUALAN (COGS)</td>
                <td className="py-2.5 px-4 text-right font-mono text-rose-700">({formatCurrency(plData.totalCogs)})</td>
                <td className="py-2.5 px-4 text-right font-mono text-rose-700">
                  {((plData.totalCogs / plData.netRevenue) * 100).toFixed(1)}%
                </td>
              </tr>

              {/* SECTION 3: GROSS PROFIT */}
              <tr className="bg-blue-50/70 font-extrabold text-blue-950 border-y-2 border-blue-200">
                <td className="py-3 px-4 text-sm">3. LABA KOTOR (GROSS PROFIT)</td>
                <td className="py-3 px-4 text-right font-mono text-sm text-blue-800">{formatCurrency(plData.grossProfit)}</td>
                <td className="py-3 px-4 text-right font-mono text-sm text-blue-800">{plData.grossMarginPercent.toFixed(1)}%</td>
              </tr>

              {/* SECTION 4: OPERATING EXPENSES */}
              <tr className="bg-slate-50/70 font-bold text-slate-900">
                <td colSpan={3} className="py-2.5 px-4 uppercase text-[11px] tracking-wide text-indigo-900">
                  4. BEBAN OPERASIONAL & UMUM (SG&A EXPENSES)
                </td>
              </tr>
              {plData.deptExpenses.map(d => (
                <tr key={d.deptCode}>
                  <td className="py-2 px-6">
                    Beban Operasional Departemen {d.deptName} ({d.deptCode})
                  </td>
                  <td className="py-2 px-4 text-right font-mono">{formatCurrency(d.amount)}</td>
                  <td className="py-2 px-4 text-right font-mono text-slate-500">
                    {((d.amount / plData.netRevenue) * 100).toFixed(1)}%
                  </td>
                </tr>
              ))}
              <tr className="bg-slate-100/70 font-bold text-slate-900">
                <td className="py-2.5 px-4">TOTAL BEBAN OPERASIONAL (SG&A)</td>
                <td className="py-2.5 px-4 text-right font-mono text-rose-700">({formatCurrency(plData.totalOperatingExpenses)})</td>
                <td className="py-2.5 px-4 text-right font-mono text-rose-700">
                  {((plData.totalOperatingExpenses / plData.netRevenue) * 100).toFixed(1)}%
                </td>
              </tr>

              {/* SECTION 5: OPERATING INCOME */}
              <tr className="bg-indigo-50/80 font-bold text-indigo-950 border-y border-indigo-200">
                <td className="py-2.5 px-4">5. LABA OPERASIONAL (OPERATING INCOME / EBIT)</td>
                <td className="py-2.5 px-4 text-right font-mono text-indigo-800">{formatCurrency(plData.operatingIncome)}</td>
                <td className="py-2.5 px-4 text-right font-mono text-indigo-800">{plData.operatingMarginPercent.toFixed(1)}%</td>
              </tr>

              {/* SECTION 6: OTHER INCOME & EXPENSES */}
              <tr className="bg-slate-50/70 font-bold text-slate-900">
                <td colSpan={3} className="py-2.5 px-4 uppercase text-[11px] tracking-wide text-indigo-900">
                  6. PENDAPATAN & BEBAN LAIN-LAIN
                </td>
              </tr>
              <tr>
                <td className="py-2 px-6">Pendapatan Bunga & Jasa Giro Bank</td>
                <td className="py-2 px-4 text-right font-mono text-emerald-700">{formatCurrency(plData.interestIncome)}</td>
                <td className="py-2 px-4 text-right font-mono text-slate-500">-</td>
              </tr>
              <tr>
                <td className="py-2 px-6">Keuntungan Selisih Kurs Valuta Asing</td>
                <td className="py-2 px-4 text-right font-mono text-emerald-700">{formatCurrency(plData.gainOnForex)}</td>
                <td className="py-2 px-4 text-right font-mono text-slate-500">-</td>
              </tr>
              <tr>
                <td className="py-2 px-6 text-slate-500">Beban Bunga Pinjaman Bank</td>
                <td className="py-2 px-4 text-right font-mono text-rose-700">({formatCurrency(plData.interestExpense)})</td>
                <td className="py-2 px-4 text-right font-mono text-slate-500">-</td>
              </tr>

              {/* SECTION 7 & 8: EBT & TAX */}
              <tr className="bg-slate-100/70 font-bold text-slate-900">
                <td className="py-2.5 px-4">7. LABA SEBELUM PAJAK PENGHASILAN (EBT)</td>
                <td className="py-2.5 px-4 text-right font-mono text-slate-900">{formatCurrency(plData.profitBeforeTax)}</td>
                <td className="py-2.5 px-4 text-right font-mono text-slate-600">
                  {((plData.profitBeforeTax / plData.netRevenue) * 100).toFixed(1)}%
                </td>
              </tr>
              <tr>
                <td className="py-2.5 px-6 text-slate-500">8. Beban Pajak Penghasilan Badan (PPh Badan 22%)</td>
                <td className="py-2.5 px-4 text-right font-mono text-rose-700">({formatCurrency(plData.taxExpense)})</td>
                <td className="py-2.5 px-4 text-right font-mono text-slate-500">
                  {((plData.taxExpense / plData.netRevenue) * 100).toFixed(1)}%
                </td>
              </tr>

              {/* SECTION 9: NET PROFIT AFTER TAX */}
              <tr className="bg-emerald-50 font-black text-emerald-950 border-t-2 border-emerald-300">
                <td className="py-3 px-4 text-sm uppercase">9. LABA BERSIH TAHUN BERJALAN (NET PROFIT AFTER TAX)</td>
                <td className="py-3 px-4 text-right font-mono text-base text-emerald-800">
                  {formatCurrency(plData.netProfitAfterTax)}
                </td>
                <td className="py-3 px-4 text-right font-mono text-sm text-emerald-800">
                  {plData.netMarginPercent.toFixed(1)}%
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
