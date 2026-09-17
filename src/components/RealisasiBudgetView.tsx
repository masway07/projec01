import React, { useState, useMemo } from 'react';
import {
  DollarSign,
  Plus,
  Printer,
  FileSpreadsheet,
  Edit2,
  Trash2,
  Info,
  Calendar,
  Building2,
  BookOpen,
  CheckCircle2,
  ArrowDownRight,
  Lock,
  LayoutGrid,
  Layers
} from 'lucide-react';
import { AppUser, BudgetRealization, CompanySettings, Department, DeptPlanningItem, MonthlyDistribution } from '../types';
import { DEFAULT_COMPANY_SETTINGS, DP_MONTHS } from '../constants/defaultData';
import {
  computeBudgetUsagePrintData,
  generateBudgetUsagePrintHtml,
  printHtmlViaIframe,
  BudgetUsagePrintData,
  formatCurrencyVal
} from '../utils/printHelper';

interface RealisasiBudgetViewProps {
  realizations: BudgetRealization[];
  budgetItems: DeptPlanningItem[];
  departments: Department[];
  currentUser?: AppUser | null;
  onOpenModal: (realization?: BudgetRealization) => void;
  onDeleteRealization: (id: string) => void;
  companySettings?: CompanySettings;
  activeBudgetTab?: 'dashboard' | 'planner' | 'deptPlanning' | 'realisasi';
  onSwitchBudgetTab?: (tab: 'dashboard' | 'planner' | 'deptPlanning' | 'realisasi') => void;
}

export const RealisasiBudgetView: React.FC<RealisasiBudgetViewProps> = ({
  realizations,
  budgetItems,
  departments,
  currentUser,
  onOpenModal,
  onDeleteRealization,
  companySettings = DEFAULT_COMPANY_SETTINGS,
  activeBudgetTab = 'realisasi',
  onSwitchBudgetTab
}) => {
  const isDeptRestricted = currentUser?.role === 'dept_user' && !!currentUser?.deptCode;
  const userDeptCode = isDeptRestricted ? currentUser.deptCode! : '';

  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedDept, setSelectedDept] = useState<string>(userDeptCode);
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [printableItem, setPrintableItem] = useState<BudgetRealization | null>(null);
  const [printableVoucherData, setPrintableVoucherData] = useState<BudgetUsagePrintData | null>(null);
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
  } | null>(null);

  const handleOpenPrintVoucher = (r: BudgetRealization) => {
    const deptObj = departments.find(d => d.code.toUpperCase() === (r.deptCode || '').toUpperCase());
    const data = computeBudgetUsagePrintData(r, budgetItems, realizations, companySettings, deptObj?.name);
    setPrintableVoucherData(data);
  };

  const handleConfirmDeleteRealization = (r: BudgetRealization) => {
    setDeleteConfirmModal({
      isOpen: true,
      title: `Hapus Transaksi ${r.id}`,
      description: `Apakah Anda yakin ingin menghapus transaksi "${r.name}" (No Akun: ${r.accountNo}) sebesar ${r.currency} ${r.price.toLocaleString('id-ID')} ($${r.priceUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})?`,
      onConfirm: () => {
        onDeleteRealization(r.id);
      }
    });
  };

  // Available COA options that have budgets in Dept Planning or in realizations
  const availableAccounts = useMemo(() => {
    const accMap = new Map<string, string>();
    const effectiveDept = isDeptRestricted ? userDeptCode : selectedDept;

    budgetItems.forEach(item => {
      if (effectiveDept && item.deptCode.toUpperCase() !== effectiveDept.toUpperCase()) return;
      if (item.accountNo) {
        accMap.set(item.accountNo, item.accountName || item.item);
      }
    });
    realizations.forEach(r => {
      if (effectiveDept && r.deptCode.toUpperCase() !== effectiveDept.toUpperCase()) return;
      if (r.accountNo && !accMap.has(r.accountNo)) {
        accMap.set(r.accountNo, r.accountName);
      }
    });

    return Array.from(accMap.entries()).map(([code, name]) => ({ code, name }));
  }, [budgetItems, realizations, isDeptRestricted, userDeptCode, selectedDept]);

  // Filter Dept Planning items (A. BUDGET and B. COST DOWN)
  const filteredBudgetItems = useMemo(() => {
    const effectiveDept = isDeptRestricted ? userDeptCode : selectedDept;
    return budgetItems.filter(item => {
      if (selectedYear && item.year !== selectedYear) return false;
      if (effectiveDept && item.deptCode.toUpperCase() !== effectiveDept.toUpperCase()) return false;
      if (selectedAccount && item.accountNo !== selectedAccount) return false;
      return true;
    });
  }, [budgetItems, selectedYear, selectedDept, isDeptRestricted, userDeptCode, selectedAccount]);

  // Filtered Realizations
  const filteredRealizations = useMemo(() => {
    const effectiveDept = isDeptRestricted ? userDeptCode : selectedDept;
    return realizations.filter(r => {
      if (selectedYear && r.year !== selectedYear) return false;
      if (effectiveDept && r.deptCode.toUpperCase() !== effectiveDept.toUpperCase()) return false;
      if (selectedAccount && r.accountNo !== selectedAccount) return false;
      return true;
    });
  }, [realizations, selectedYear, selectedDept, isDeptRestricted, userDeptCode, selectedAccount]);

  // Calculate monthly budget after cost down
  // Budget After Cost Down Bulanan = A. BUDGET - B. COST DOWN for that month
  const monthlyData = useMemo(() => {
    // 1. Calculate Budget After Cost Down per month
    const budgetByMonth: Record<string, number> = {};
    const costDownByMonth: Record<string, number> = {};

    DP_MONTHS.forEach(m => {
      budgetByMonth[m] = 0;
      costDownByMonth[m] = 0;
    });

    filteredBudgetItems.forEach(item => {
      if (item.section === 'budget') {
        DP_MONTHS.forEach(m => {
          budgetByMonth[m] += Number(item.monthly?.[m as keyof MonthlyDistribution]) || 0;
        });
      } else if (item.section === 'costdown') {
        DP_MONTHS.forEach(m => {
          costDownByMonth[m] += Number(item.monthly?.[m as keyof MonthlyDistribution]) || 0;
        });
      }
    });

    // 2. Calculate Realisasi Bulanan
    const realisasiByMonth: Record<string, number> = {};
    DP_MONTHS.forEach(m => {
      realisasiByMonth[m] = 0;
    });

    filteredRealizations.forEach(r => {
      const mKey = r.month;
      if (mKey && realisasiByMonth[mKey] !== undefined) {
        realisasiByMonth[mKey] += Number(r.priceUSD) || 0;
      }
    });

    // 3. Compute cumulative and running balance
    // Calculate total budget year
    const totalBudgetYear = DP_MONTHS.reduce<number>((sum, m) => {
      return sum + (budgetByMonth[m] - costDownByMonth[m]);
    }, 0);

    let cumulativeTotal = 0;

    const rows = DP_MONTHS.map(m => {
      const monthlyReal = realisasiByMonth[m] || 0;
      cumulativeTotal += monthlyReal;

      const monthlyBudgetAfterCD = budgetByMonth[m] - costDownByMonth[m];
      const sisaBudgetBulan = monthlyBudgetAfterCD - monthlyReal;
      const sisaBudgetBerjalan = totalBudgetYear - cumulativeTotal;

      return {
        month: String(m).toUpperCase(),
        monthlyReal,
        cumulativeTotal,
        monthlyBudgetAfterCD,
        sisaBudgetBulan,
        sisaBudgetBerjalan
      };
    });

    const totalRealBulanan = DP_MONTHS.reduce<number>((sum, m) => sum + (realisasiByMonth[m] || 0), 0);
    const totalBudgetAfterCD = totalBudgetYear;
    const totalSisaBudget = totalBudgetAfterCD - totalRealBulanan;
    const finalSisaBudgetBerjalan = totalBudgetAfterCD - totalRealBulanan;

    return {
      rows,
      totals: {
        monthlyReal: totalRealBulanan,
        cumulativeTotal: totalRealBulanan,
        monthlyBudgetAfterCD: totalBudgetAfterCD,
        sisaBudgetBulan: totalSisaBudget,
        sisaBudgetBerjalan: finalSisaBudgetBerjalan
      },
      totalBudgetYear,
      totalRealisasi: totalRealBulanan,
      sisaBudgetBerjalan: finalSisaBudgetBerjalan
    };
  }, [filteredBudgetItems, filteredRealizations]);

  // Format currency helpers
  const fmtUSD = (val: number, showDashIfZero: boolean = true) => {
    if (showDashIfZero && Math.abs(val) < 0.001) return '-';
    if (val < 0) {
      return `-$${Math.abs(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `$${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const fmtOriginal = (val: number) => {
    return val.toLocaleString('id-ID', { maximumFractionDigits: 2 });
  };

  // Export to CSV / Excel
  const handleExportExcel = () => {
    const headers = [
      'Bulan',
      'Kumulatif Bulanan (USD)',
      'Kumulatif Total (USD)',
      'Budget After Cost Down Bulanan (USD)',
      'Sisa Budget (USD)',
      'Sisa Budget Berjalan (USD)'
    ];

    const monthlyRows = monthlyData.rows.map(r => [
      r.month,
      r.monthlyReal > 0 ? r.monthlyReal.toFixed(2) : '0',
      r.cumulativeTotal > 0 ? r.cumulativeTotal.toFixed(2) : '0',
      r.monthlyBudgetAfterCD.toFixed(2),
      r.sisaBudgetBulan.toFixed(2),
      r.sisaBudgetBerjalan.toFixed(2)
    ]);

    const totalRow = [
      'TOTAL',
      monthlyData.totals.monthlyReal.toFixed(2),
      monthlyData.totals.cumulativeTotal.toFixed(2),
      monthlyData.totals.monthlyBudgetAfterCD.toFixed(2),
      monthlyData.totals.sisaBudgetBulan.toFixed(2),
      monthlyData.totals.sisaBudgetBerjalan.toFixed(2)
    ];

    const transHeaders = [
      'Tanggal',
      'Dept',
      'No Akun',
      'Nama Akun',
      'Bulan',
      'Nama',
      'Type',
      'Alasan',
      'Currency',
      'Harga',
      'Harga USD'
    ];

    const transRows = filteredRealizations.map(t => [
      t.date,
      t.deptCode,
      t.accountNo,
      `"${t.accountName.replace(/"/g, '""')}"`,
      t.month,
      `"${t.name.replace(/"/g, '""')}"`,
      t.type,
      `"${(t.reason || '').replace(/"/g, '""')}"`,
      t.currency,
      t.price,
      t.priceUSD
    ]);

    const compName = companySettings?.companyName || 'PT. KANETA INDONESIA';
    const compAddr = companySettings?.address || '';

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      encodeURIComponent(
        `"${compName}"\r\n` +
        (compAddr ? `"${compAddr}"\r\n` : '') +
        'REKAP REALISASI BUDGET & PENGGUNAAN ANGGARAN\r\n' +
        `Tahun: ${selectedYear}; Dept: ${selectedDept || 'Semua'}; Akun: ${selectedAccount || 'Semua'}\r\n` +
        `Tanggal Export: ${new Date().toLocaleDateString('id-ID')}\r\n\r\n` +
        headers.join(',') + '\r\n' +
        monthlyRows.map(e => e.join(',')).join('\r\n') + '\r\n' +
        totalRow.join(',') + '\r\n\r\n' +
        'DETAIL TRANSAKSI REALISASI\r\n' +
        transHeaders.join(',') + '\r\n' +
        transRows.map(e => e.join(',')).join('\r\n')
      );

    const link = document.createElement('a');
    link.setAttribute('href', csvContent);
    link.setAttribute('download', `realisasi_budget_${compName.replace(/[^a-zA-Z0-9]/g, '_')}_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  // Print Rekap Window
  const handlePrintRekap = () => {
    setShowPrintModal(true);
  };

  const activeDeptName = selectedDept ? departments.find(d => d.code === selectedDept)?.name || selectedDept : 'Semua Department';
  const activeAccountName = selectedAccount
    ? availableAccounts.find(a => a.code === selectedAccount)?.name || selectedAccount
    : 'Semua No Akun';

  return (
    <div id="view-realisasi" className="space-y-6 animate-in fade-in duration-150">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2.5">
            <DollarSign className="w-6 h-6 text-emerald-600 shrink-0" />
            <span>Realisasi Budget</span>
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Monitoring penyerapan anggaran after cost down &amp; kontrol sisa budget tahunan.
          </p>
        </div>

        {/* Sub-tab Navigation for Budget Module */}
        {onSwitchBudgetTab && (
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-200/80 rounded-2xl">
            <button
              onClick={() => onSwitchBudgetTab('dashboard')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeBudgetTab === 'dashboard'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Summary Budget
            </button>
            <button
              onClick={() => onSwitchBudgetTab('planner')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeBudgetTab === 'planner'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              Rencana Anggaran
            </button>
            <button
              onClick={() => onSwitchBudgetTab('deptPlanning')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeBudgetTab === 'deptPlanning'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Dept Planning
            </button>
            <button
              onClick={() => onSwitchBudgetTab('realisasi')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeBudgetTab === 'realisasi'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
              }`}
            >
              <DollarSign className="w-3.5 h-3.5" />
              Realisasi Budget
            </button>
          </div>
        )}
      </div>

      {/* Info Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-4.5 shadow-xs">
        <b className="text-slate-800 text-sm block">Penggunaan Budget After Cost Down &amp; Sisa Budget Berjalan</b>
        <p className="text-xs text-slate-600 mt-1 leading-relaxed">
          Realisasi dicatat berdasarkan <b>No Akun</b> yang sudah mempunyai anggaran pada <b>A. BUDGET</b> di Dept Planning.
          Setiap transaksi otomatis mengurangi sisa budget bulan dan sisa budget tahunan berjalan.
        </p>
      </div>

      {/* Toolbar Filters */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-wrap items-end gap-3.5">
        {/* Tahun */}
        <div className="w-28 sm:w-32">
          <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">Tahun</label>
          <input
            id="realYearFilter"
            type="number"
            value={selectedYear}
            onChange={e => setSelectedYear(Number(e.target.value) || currentYear)}
            className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>

        {/* Department */}
        <div className="min-w-[190px] flex-1 sm:flex-initial">
          <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
            Department {isDeptRestricted && <span className="text-emerald-600 font-bold">(Terkunci)</span>}
          </label>
          {isDeptRestricted ? (
            <div className="flex items-center gap-2 px-3 py-2 border border-slate-300 rounded-lg text-sm bg-slate-100 font-bold text-slate-800">
              <Lock className="w-3.5 h-3.5 text-emerald-600" />
              <span>{userDeptCode} - {departments.find(d => d.code === userDeptCode)?.name || userDeptCode}</span>
            </div>
          ) : (
            <select
              id="realDeptFilter"
              value={selectedDept}
              onChange={e => setSelectedDept(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              <option value="">Semua Department</option>
              {departments.map(d => (
                <option key={d.code} value={d.code}>
                  {d.code} - {d.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* No Akun */}
        <div className="min-w-[240px] flex-1 sm:flex-initial">
          <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">No Akun</label>
          <select
            id="realCoaFilter"
            value={selectedAccount}
            onChange={e => setSelectedAccount(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          >
            <option value="">Semua No Akun</option>
            {availableAccounts.map(a => (
              <option key={a.code} value={a.code}>
                {a.code} - {a.name}
              </option>
            ))}
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 ml-auto">
          <button
            onClick={() => {}}
            className="px-3.5 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 transition cursor-pointer"
          >
            Tampilkan
          </button>

          <button
            onClick={() => onOpenModal()}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-lg shadow-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Penggunaan Budget</span>
          </button>

          <button
            onClick={handlePrintRekap}
            className="px-3.5 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 transition flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>Print Rekap</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="px-3.5 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 transition flex items-center gap-1.5 cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Export Excel</span>
          </button>
        </div>
      </div>

      {/* Grid KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Budget */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Budget</div>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {fmtUSD(monthlyData.totalBudgetYear, false)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Budget After Cost Down {selectedYear}</div>
        </div>

        {/* Realisasi s/d Sekarang */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Realisasi s/d Sekarang</div>
          <div className="text-2xl font-black text-emerald-600 mt-1">
            {fmtUSD(monthlyData.totalRealisasi, false)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">{filteredRealizations.length} transaksi tercatat</div>
        </div>

        {/* Sisa Budget Berjalan */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sisa Budget Berjalan</div>
          <div className={`text-2xl font-black mt-1 ${monthlyData.sisaBudgetBerjalan < 0 ? 'text-rose-600' : 'text-indigo-600'}`}>
            {fmtUSD(monthlyData.sisaBudgetBerjalan, false)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Total Budget - Realisasi</div>
        </div>
      </div>

      {/* Monthly Realization Table */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800">
            {selectedAccount ? `${selectedAccount} - ${activeAccountName}` : 'Semua No Akun'}
          </h2>
          <div className="text-xs text-slate-500 mt-0.5">
            {activeDeptName} • Tahun {selectedYear}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-700 text-xs font-bold">
                <th className="p-3">Bulan</th>
                <th className="p-3 text-right">Kumulatif Bulanan</th>
                <th className="p-3 text-right">Kumulatif Total</th>
                <th className="p-3 text-right">Budget After Cost Down Bulanan</th>
                <th className="p-3 text-right">Sisa Budget</th>
                <th className="p-3 text-right">Sisa Budget Berjalan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {monthlyData.rows.map(row => {
                const isOverBudget = row.sisaBudgetBulan < 0;

                return (
                  <tr key={row.month} className="hover:bg-slate-50/80 transition">
                    <td className="p-3 font-bold text-slate-900">{row.month}</td>
                    <td className="p-3 text-right font-mono text-slate-700">
                      {fmtUSD(row.monthlyReal)}
                    </td>
                    <td className="p-3 text-right font-mono text-slate-700">
                      {row.cumulativeTotal > 0 ? fmtUSD(row.cumulativeTotal) : '-'}
                    </td>
                    <td className="p-3 text-right font-mono text-slate-700">
                      {fmtUSD(row.monthlyBudgetAfterCD)}
                    </td>
                    <td className="p-3 text-right font-mono">
                      {row.monthlyBudgetAfterCD === 0 && row.monthlyReal === 0 ? (
                        <span className="text-slate-400">-</span>
                      ) : isOverBudget ? (
                        <span className="text-rose-600 font-bold">{fmtUSD(row.sisaBudgetBulan, false)}</span>
                      ) : (
                        <span className="text-slate-700 font-medium">{fmtUSD(row.sisaBudgetBulan)}</span>
                      )}
                    </td>
                    <td className="p-3 text-right font-mono text-slate-800 font-medium">
                      {fmtUSD(row.sisaBudgetBerjalan, false)}
                    </td>
                  </tr>
                );
              })}

              {/* TOTAL ROW (Exact Match from user's layout: background #92d050 font-weight 700) */}
              <tr className="bg-[#92d050] text-slate-900 font-bold border-t-2 border-slate-300">
                <td className="p-3 font-black">TOTAL</td>
                <td className="p-3 text-right font-mono font-bold">
                  {fmtUSD(monthlyData.totals.monthlyReal, false)}
                </td>
                <td className="p-3 text-right font-mono font-bold">
                  {fmtUSD(monthlyData.totals.cumulativeTotal, false)}
                </td>
                <td className="p-3 text-right font-mono font-bold">
                  {fmtUSD(monthlyData.totals.monthlyBudgetAfterCD, false)}
                </td>
                <td className="p-3 text-right font-mono font-bold">
                  {fmtUSD(monthlyData.totals.sisaBudgetBulan, false)}
                </td>
                <td className="p-3 text-right font-mono font-bold">
                  {fmtUSD(monthlyData.totals.sisaBudgetBerjalan, false)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-3 text-right text-sm font-bold text-slate-800 flex items-center justify-end gap-1">
          <ArrowDownRight className="w-4 h-4 text-emerald-600" />
          <span>← actual Sisa Budget: {fmtUSD(monthlyData.sisaBudgetBerjalan, false)}</span>
        </div>
      </div>

      {/* Detail Penggunaan Budget Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Detail Penggunaan Budget</h2>
            <div className="text-xs text-slate-500">
              Jumlah transaksi: <strong>{filteredRealizations.length}</strong>
            </div>
          </div>
          <button
            onClick={() => onOpenModal()}
            className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer w-fit"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Transaksi</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 text-xs font-bold">
                <th className="p-3 whitespace-nowrap">Tgl</th>
                <th className="p-3">Dept</th>
                <th className="p-3">No Akun</th>
                <th className="p-3">Nama Akun</th>
                <th className="p-3">Bulan</th>
                <th className="p-3">Nama</th>
                <th className="p-3">Type</th>
                <th className="p-3 min-w-[220px]">Alasan</th>
                <th className="p-3">Currency</th>
                <th className="p-3 text-right">Harga</th>
                <th className="p-3 text-right">Harga USD</th>
                <th className="p-3 text-center whitespace-nowrap">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredRealizations.length === 0 ? (
                <tr>
                  <td colSpan={12} className="p-6 text-center text-slate-400 italic">
                    Belum ada data transaksi realisasi untuk filter ini. Klik "+ Penggunaan Budget" untuk mencatat.
                  </td>
                </tr>
              ) : (
                filteredRealizations.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition align-top">
                    <td className="p-3 whitespace-nowrap font-mono text-slate-600">{r.date}</td>
                    <td className="p-3 font-bold text-indigo-700">{r.deptCode}</td>
                    <td className="p-3 font-mono font-bold text-slate-800">{r.accountNo}</td>
                    <td className="p-3 text-slate-700">{r.accountName}</td>
                    <td className="p-3 font-medium text-slate-700">{r.month}</td>
                    <td className="p-3 font-semibold text-slate-900">{r.name}</td>
                    <td className="p-3 text-slate-500">{r.type}</td>
                    <td className="p-3 text-slate-600 whitespace-normal min-w-[220px]">{r.reason || '-'}</td>
                    <td className="p-3 font-bold text-slate-700">{r.currency}</td>
                    <td className="p-3 text-right font-mono font-medium text-slate-800">
                      {fmtOriginal(r.price)}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-emerald-700">
                      ${r.priceUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="p-3 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => onOpenModal(r)}
                          className="px-2.5 py-1 text-xs border border-slate-300 rounded hover:bg-slate-100 text-slate-700 font-medium transition cursor-pointer"
                          title="Edit"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleOpenPrintVoucher(r)}
                          className="px-2.5 py-1 text-xs border border-indigo-200 bg-indigo-50/50 rounded hover:bg-indigo-100 text-indigo-700 font-medium transition cursor-pointer flex items-center gap-1"
                          title="Print Bukti Penggunaan Budget"
                        >
                          <Printer className="w-3 h-3" />
                          <span>Print</span>
                        </button>
                        <button
                          onClick={() => handleConfirmDeleteRealization(r)}
                          className="px-2.5 py-1 text-xs border border-rose-300 text-rose-600 rounded hover:bg-rose-50 font-medium transition cursor-pointer"
                          title="Hapus"
                        >
                          Hapus
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

      {/* Printable Receipt / Voucher Modal (Exact User Template) */}
      {printableVoucherData && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-3xl w-full shadow-2xl border border-slate-200 space-y-6 max-h-[94vh] overflow-y-auto">
            {/* Modal Actions Top Bar */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 print:hidden">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">Preview Form Penggunaan / Realisasi Budget</h3>
                  <p className="text-xs text-slate-500">Standar Dokumen A4 Portrait</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPrintableVoucherData(null)}
                  className="px-3.5 py-1.5 border border-slate-300 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                >
                  Tutup
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const html = generateBudgetUsagePrintHtml(printableVoucherData);
                    printHtmlViaIframe(html);
                  }}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak Dokumen (Print)</span>
                </button>
              </div>
            </div>

            {/* Document Content Exact HTML Styling Container */}
            <div className="border border-slate-300 bg-white p-6 sm:p-8 rounded-lg shadow-inner font-sans text-slate-900 text-[11px] leading-normal select-text">
              {/* Header */}
              <div className="text-center mb-3">
                {printableVoucherData.logoUrl && (
                  <img
                    src={printableVoucherData.logoUrl}
                    alt="Logo"
                    className="max-h-[50px] max-w-[160px] mx-auto mb-1 object-contain"
                    referrerPolicy="no-referrer"
                    onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                  />
                )}
                <h1 className="text-[17px] font-bold my-0.5 text-slate-900 tracking-wide">
                  {printableVoucherData.companyName}
                </h1>
                <div className="text-[11px] text-slate-600 mb-1">
                  {printableVoucherData.companyAddress}
                </div>
                <h2 className="text-[14px] font-bold my-1 text-slate-900 border-b pb-1">
                  FORM PENGGUNAAN / REALISASI BUDGET
                </h2>
              </div>

              {/* Top Boxes */}
              <div className="grid grid-cols-1 gap-2 my-2 text-[11px]">
                <div className="border border-slate-900 p-2 leading-relaxed bg-white">
                  <div><b>Department:</b> {printableVoucherData.deptDisplay}</div>
                  <div><b>Tahun:</b> {printableVoucherData.year}</div>
                  <div><b>No Akun:</b> {printableVoucherData.accountNo}</div>
                  <div><b>Nama Akun:</b> {printableVoucherData.accountName}</div>
                </div>
                <div className="border border-slate-900 p-2 leading-relaxed bg-white font-mono">
                  <div><b className="font-sans">Budget Tahun:</b> {formatCurrencyVal(printableVoucherData.budgetTahun)}</div>
                  <div><b className="font-sans">Budget {printableVoucherData.monthName}:</b> {formatCurrencyVal(printableVoucherData.budgetBulan)}</div>
                  <div><b className="font-sans">Sisa Budget Tahun Setelah Transaksi:</b> {formatCurrencyVal(printableVoucherData.sisaBudgetTahunSetelah)}</div>
                  <div><b className="font-sans">Sisa Budget Bulan Setelah Transaksi:</b> {formatCurrencyVal(printableVoucherData.sisaBudgetBulanSetelah)}</div>
                </div>
              </div>

              {/* Table */}
              <table className="w-full border-collapse border border-slate-900 mt-2 text-[11px]">
                <thead>
                  <tr className="bg-slate-200 text-slate-900">
                    <th className="border border-slate-900 p-1 font-bold text-center">Tgl</th>
                    <th className="border border-slate-900 p-1 font-bold text-left">Nama</th>
                    <th className="border border-slate-900 p-1 font-bold text-center">Type</th>
                    <th className="border border-slate-900 p-1 font-bold text-left">Alasan</th>
                    <th className="border border-slate-900 p-1 font-bold text-right">Harga</th>
                    <th className="border border-slate-900 p-1 font-bold text-right">Harga USD</th>
                    <th className="border border-slate-900 p-1 font-bold text-right">Sisa Budget (Bulan)</th>
                    <th className="border border-slate-900 p-1 font-bold text-right">Sisa Budget (Tahun)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-slate-900 p-1 text-center whitespace-nowrap">{printableVoucherData.item.date}</td>
                    <td className="border border-slate-900 p-1 font-medium">{printableVoucherData.item.name}</td>
                    <td className="border border-slate-900 p-1 text-center">{printableVoucherData.item.type || ''}</td>
                    <td className="border border-slate-900 p-1">{printableVoucherData.item.reason || ''}</td>
                    <td className="border border-slate-900 p-1 text-right font-mono whitespace-nowrap">
                      {printableVoucherData.item.currency} {printableVoucherData.item.price.toLocaleString('id-ID')}
                    </td>
                    <td className="border border-slate-900 p-1 text-right font-mono font-bold whitespace-nowrap">
                      {formatCurrencyVal(printableVoucherData.item.priceUSD)}
                    </td>
                    <td className="border border-slate-900 p-1 text-right font-mono font-bold whitespace-nowrap text-rose-700">
                      {formatCurrencyVal(printableVoucherData.sisaBudgetBulanSetelah)}
                    </td>
                    <td className="border border-slate-900 p-1 text-right font-mono font-bold whitespace-nowrap text-emerald-800">
                      {formatCurrencyVal(printableVoucherData.sisaBudgetTahunSetelah)}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Approval 4 columns */}
              <div className="mt-8 grid grid-cols-4 gap-0 w-full text-[11px] border-collapse">
                <div className="border border-slate-900 min-h-[135px] p-1.5 text-center flex flex-col justify-between">
                  <div className="font-normal min-h-[20px]">Approved</div>
                  <div className="flex-1 min-h-[75px]"></div>
                  <div className="font-normal pt-1 min-h-[22px] border-t border-dashed border-slate-300">General Manager</div>
                </div>
                <div className="border border-slate-900 border-l-0 min-h-[135px] p-1.5 text-center flex flex-col justify-between">
                  <div className="font-normal min-h-[20px]">Approved</div>
                  <div className="flex-1 min-h-[75px]"></div>
                  <div className="font-normal pt-1 min-h-[22px] border-t border-dashed border-slate-300">Manager</div>
                </div>
                <div className="border border-slate-900 border-l-0 min-h-[135px] p-1.5 text-center flex flex-col justify-between">
                  <div className="font-normal min-h-[20px]">Check</div>
                  <div className="flex-1 min-h-[75px]"></div>
                  <div className="font-normal pt-1 min-h-[22px] border-t border-dashed border-slate-300">SV</div>
                </div>
                <div className="border border-slate-900 border-l-0 min-h-[135px] p-1.5 text-center flex flex-col justify-between">
                  <div className="font-normal min-h-[20px]">Buat</div>
                  <div className="flex-1 min-h-[75px]"></div>
                  <div className="font-normal pt-1 min-h-[22px] border-t border-dashed border-slate-300">PIC</div>
                </div>
              </div>

              {/* Footer Timestamp */}
              <div className="mt-3 text-right text-[9px] text-slate-500">
                Dicetak: {printableVoucherData.printDateStr}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 print:hidden">
              <button
                type="button"
                onClick={() => setPrintableVoucherData(null)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-50 cursor-pointer"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => {
                  const html = generateBudgetUsagePrintHtml(printableVoucherData);
                  printHtmlViaIframe(html);
                }}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-600/20"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak Bukti (Print)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmModal && deleteConfirmModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-rose-100 text-rose-600 rounded-xl shrink-0">
                <Trash2 className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">{deleteConfirmModal.title}</h3>
                <p className="text-xs text-slate-500">Konfirmasi Penghapusan Realisasi</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              {deleteConfirmModal.description}
            </p>

            <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeleteConfirmModal(null)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteConfirmModal.onConfirm();
                  setDeleteConfirmModal(null);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Ya, Hapus Data</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full Rekap PDF / Print Modal */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl p-6 sm:p-8 space-y-6 max-h-[92vh] overflow-y-auto">
            {/* Kop Laporan Perusahaan */}
            <div className="border-b-2 border-slate-800 pb-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  {companySettings?.logoUrl && (
                    <div className="p-1 border border-slate-200 rounded-xl bg-white shadow-xs">
                      <img
                        src={companySettings.logoUrl}
                        alt="Logo Perusahaan"
                        className="h-14 w-auto max-w-[160px] object-contain"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  )}
                  <div>
                    <h2 className="text-lg sm:text-xl font-black text-slate-900 uppercase tracking-tight">
                      {companySettings?.companyName || 'PT. KANETA INDONESIA'}
                    </h2>
                    <p className="text-xs text-slate-600 max-w-lg mt-0.5 leading-relaxed">
                      {companySettings?.address}
                    </p>
                  </div>
                </div>

                <div className="text-right text-xs text-slate-500 hidden sm:block">
                  <div>Tahun Anggaran: <b className="text-slate-800">{selectedYear}</b></div>
                  <div>Dicetak: {new Date().toLocaleDateString('id-ID')}</div>
                </div>
              </div>

              <div className="text-center pt-4 mt-3 border-t border-slate-200">
                <h3 className="text-base sm:text-lg font-black text-slate-900 uppercase tracking-wider">
                  LAPORAN KONTROL &amp; REALISASI BUDGET
                </h3>
                <p className="text-xs text-slate-500">
                  Departemen: <b className="text-slate-800">{activeDeptName}</b> • Akun: <b className="text-slate-800">{activeAccountName}</b>
                </p>
              </div>
            </div>

            {/* KPI Summary Strip */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="text-[10px] text-slate-500 font-bold uppercase">Total Budget</div>
                <div className="text-base font-black text-slate-900">{fmtUSD(monthlyData.totalBudgetYear, false)}</div>
              </div>
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                <div className="text-[10px] text-emerald-700 font-bold uppercase">Total Realisasi</div>
                <div className="text-base font-black text-emerald-800">{fmtUSD(monthlyData.totalRealisasi, false)}</div>
              </div>
              <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl">
                <div className="text-[10px] text-indigo-700 font-bold uppercase">Sisa Budget Berjalan</div>
                <div className="text-base font-black text-indigo-900">{fmtUSD(monthlyData.sisaBudgetBerjalan, false)}</div>
              </div>
            </div>

            {/* Table Breakdown */}
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <th className="p-2.5">Bulan</th>
                    <th className="p-2.5 text-right">Realisasi (USD)</th>
                    <th className="p-2.5 text-right">Kumulatif Realisasi</th>
                    <th className="p-2.5 text-right">Budget After CD</th>
                    <th className="p-2.5 text-right">Sisa Bulan</th>
                    <th className="p-2.5 text-right">Sisa Berjalan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {monthlyData.rows.map(r => (
                    <tr key={r.month} className="hover:bg-slate-50">
                      <td className="p-2.5 font-bold text-slate-800">{r.month}</td>
                      <td className="p-2.5 text-right font-mono font-semibold">{r.monthlyReal > 0 ? fmtUSD(r.monthlyReal) : '-'}</td>
                      <td className="p-2.5 text-right font-mono text-emerald-700 font-semibold">{r.cumulativeTotal > 0 ? fmtUSD(r.cumulativeTotal) : '-'}</td>
                      <td className="p-2.5 text-right font-mono">{fmtUSD(r.monthlyBudgetAfterCD)}</td>
                      <td className="p-2.5 text-right font-mono">{fmtUSD(r.sisaBudgetBulan)}</td>
                      <td className="p-2.5 text-right font-mono font-bold text-indigo-700">{fmtUSD(r.sisaBudgetBerjalan)}</td>
                    </tr>
                  ))}
                  <tr className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300">
                    <td className="p-2.5">TOTAL</td>
                    <td className="p-2.5 text-right font-mono">{fmtUSD(monthlyData.totals.monthlyReal)}</td>
                    <td className="p-2.5 text-right font-mono text-emerald-800">{fmtUSD(monthlyData.totals.cumulativeTotal)}</td>
                    <td className="p-2.5 text-right font-mono">{fmtUSD(monthlyData.totals.monthlyBudgetAfterCD)}</td>
                    <td className="p-2.5 text-right font-mono">{fmtUSD(monthlyData.totals.sisaBudgetBulan)}</td>
                    <td className="p-2.5 text-right font-mono font-black text-indigo-800">{fmtUSD(monthlyData.totals.sisaBudgetBerjalan)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Signature Validation Blocks */}
            <div className="grid grid-cols-3 gap-6 pt-6 text-center text-xs text-slate-700">
              <div>
                <div className="font-semibold">Dibuat Oleh,</div>
                <div className="h-16"></div>
                <div className="border-t border-slate-400 pt-1 font-bold">Staff Departemen</div>
              </div>
              <div>
                <div className="font-semibold">Diperiksa Oleh,</div>
                <div className="h-16"></div>
                <div className="border-t border-slate-400 pt-1 font-bold">Manager Accounting</div>
              </div>
              <div>
                <div className="font-semibold">Disetujui Oleh,</div>
                <div className="h-16"></div>
                <div className="border-t border-slate-400 pt-1 font-bold">Direksi / GM</div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowPrintModal(false)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-600/20"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak / Export PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
