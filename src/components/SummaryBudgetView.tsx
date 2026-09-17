import React, { useState, useMemo } from 'react';
import { Department, DeptPlanningItem, CompanySettings } from '../types';
import { FileSpreadsheet, Printer, Search, Building2, Layers, DollarSign, ArrowDownRight, Info, LayoutGrid } from 'lucide-react';
import * as XLSX from 'xlsx';

interface SummaryBudgetViewProps {
  items: DeptPlanningItem[];
  departments: Department[];
  companySettings?: CompanySettings;
  activeBudgetTab?: 'dashboard' | 'planner' | 'deptPlanning' | 'realisasi';
  onSwitchBudgetTab?: (tab: 'dashboard' | 'planner' | 'deptPlanning' | 'realisasi') => void;
}

interface AccountSummaryGroup {
  accountNo: string;
  accountName: string;
  budgetUSD: number;
  costdownUSD: number;
  planUSD: number;
  afterCostDownUSD: number;
  dataCount: number;
}

export const SummaryBudgetView: React.FC<SummaryBudgetViewProps> = ({
  items = [],
  departments = [],
  companySettings,
  activeBudgetTab = 'dashboard',
  onSwitchBudgetTab
}) => {
  const [selectedDept, setSelectedDept] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Extract available years from data
  const availableYears = useMemo(() => {
    const years = Array.from(new Set(items.map(i => i.year).filter(Boolean))).sort((a, b) => b - a);
    return years.length > 0 ? years : [2026, 2025];
  }, [items]);

  // Filter items based on department and year
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      if (selectedDept && item.deptCode !== selectedDept) return false;
      if (selectedYear && item.year !== Number(selectedYear)) return false;
      return true;
    });
  }, [items, selectedDept, selectedYear]);

  // Group by No Akun + Nama Akun
  const accountGroups = useMemo(() => {
    const map = new Map<string, AccountSummaryGroup>();

    filteredItems.forEach(item => {
      const accNo = item.accountNo?.trim() || 'N/A';
      const accName = item.accountName?.trim() || item.item?.trim() || '-';
      const key = `${accNo}___${accName}`;

      if (!map.has(key)) {
        map.set(key, {
          accountNo: accNo,
          accountName: accName,
          budgetUSD: 0,
          costdownUSD: 0,
          planUSD: 0,
          afterCostDownUSD: 0,
          dataCount: 0
        });
      }

      const group = map.get(key)!;
      const amountUSD = Number(item.totalUSD) || 0;

      if (item.section === 'budget') {
        group.budgetUSD += amountUSD;
      } else if (item.section === 'costdown') {
        group.costdownUSD += amountUSD;
      } else if (item.section === 'plan') {
        group.planUSD += amountUSD;
      }

      group.dataCount += 1;
    });

    // Calculate afterCostDownUSD
    const list = Array.from(map.values()).map(g => ({
      ...g,
      afterCostDownUSD: g.budgetUSD - g.costdownUSD
    }));

    // Sort by accountNo ascending
    list.sort((a, b) => a.accountNo.localeCompare(b.accountNo, undefined, { numeric: true }));

    // Apply search term if any
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      return list.filter(
        g => g.accountNo.toLowerCase().includes(term) || g.accountName.toLowerCase().includes(term)
      );
    }

    return list;
  }, [filteredItems, searchTerm]);

  // Overall KPI sums
  const totals = useMemo(() => {
    let totalBudget = 0;
    let totalCostDown = 0;
    let totalPlan = 0;
    let totalData = 0;

    accountGroups.forEach(g => {
      totalBudget += g.budgetUSD;
      totalCostDown += g.costdownUSD;
      totalPlan += g.planUSD;
      totalData += g.dataCount;
    });

    const afterCostDown = totalBudget - totalCostDown;

    return {
      totalBudget,
      totalCostDown,
      totalPlan,
      afterCostDown,
      totalData
    };
  }, [accountGroups]);

  // Format currency helpers
  const formatUSD = (val: number): string => {
    const isNeg = val < 0;
    const absVal = Math.abs(val);
    const formatted = absVal.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    return isNeg ? `-$${formatted}` : `$${formatted}`;
  };

  // Export to Excel (.xlsx)
  const handleExportExcel = () => {
    const deptName = selectedDept
      ? departments.find(d => d.code === selectedDept)?.name || selectedDept
      : 'Semua Department';

    const sheetData = [
      ['SUMMARY BUDGET REFERENCE'],
      ['Perusahaan', companySettings?.companyName || 'PT. KANETA INDONESIA'],
      ['Filter Department', `${selectedDept || 'ALL'} - ${deptName}`],
      ['Filter Tahun', selectedYear || 'Semua Tahun'],
      ['Tanggal Export', new Date().toLocaleString('id-ID')],
      [],
      ['RINGKASAN KPI'],
      ['Budget (Total USD)', totals.totalBudget],
      ['Total Cost Down (USD)', totals.totalCostDown],
      ['Total Plan (USD)', totals.totalPlan],
      ['After Cost Down (USD)', totals.afterCostDown],
      [],
      ['DETAIL PER ACCOUNT'],
      ['No Akun', 'Nama Akun', 'Budget USD', 'Cost Down USD', 'Plan USD', 'After Cost Down USD', 'Data']
    ];

    accountGroups.forEach(row => {
      sheetData.push([
        row.accountNo,
        row.accountName,
        row.budgetUSD,
        row.costdownUSD,
        row.planUSD,
        row.afterCostDownUSD,
        row.dataCount
      ]);
    });

    // Total row
    sheetData.push([
      'TOTAL',
      '',
      totals.totalBudget,
      totals.totalCostDown,
      totals.totalPlan,
      totals.afterCostDown,
      totals.totalData
    ]);

    const ws = XLSX.utils.aoa_to_sheet(sheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Summary Budget');
    XLSX.writeFile(wb, `Summary_Budget_${selectedDept || 'AllDept'}_${Date.now()}.xlsx`);
  };

  // Export to PDF / Print
  const handleExportPDF = () => {
    window.print();
  };

  return (
    <main id="content" className="content space-y-6">
      {/* Header Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <span className="bg-indigo-600 text-white w-8 h-8 rounded-xl flex items-center justify-center text-base shadow-sm">
              $
            </span>
            <span>Budget</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Laporan Konsolidasi &amp; Rekapitulasi Anggaran Tahunan
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

      {/* Info Card Reference */}
      <div className="card bg-indigo-50/70 border border-indigo-200/80 rounded-2xl p-4.5 shadow-xs">
        <div className="text-sm font-bold text-indigo-950 flex items-center gap-2">
          <Info className="w-4 h-4 text-indigo-600 shrink-0" />
          <span>Budget Reference dari Dept Planning — {selectedDept ? `Dept ${selectedDept}` : 'Semua Department'}</span>
        </div>
        <p className="muted text-xs text-indigo-900/80 mt-1 leading-relaxed">
          Nilai Budget, Cost Down, dan Plan mengambil <strong>kolom Total</strong> dari Dept Planning. Kolom Total diperlakukan sebagai <strong>USD</strong> dan dikelompokkan berdasarkan No Akun + Nama Akun.
        </p>
      </div>

      {/* Toolbar */}
      <div className="toolbar flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
          {/* Department Filter */}
          <div className="flex items-center gap-1.5 min-w-[200px]">
            <Building2 className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
            <select
              id="budgetDeptFilter"
              value={selectedDept}
              onChange={e => setSelectedDept(e.target.value)}
              className="bg-slate-50 border border-slate-300 text-slate-800 text-xs sm:text-sm font-medium rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none w-full cursor-pointer"
            >
              <option value="">Semua Department</option>
              {departments.map(d => (
                <option key={d.code} value={d.code}>
                  {d.code} - {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Year Filter */}
          <div className="flex items-center gap-1.5">
            <select
              value={selectedYear}
              onChange={e => setSelectedYear(e.target.value)}
              className="bg-slate-50 border border-slate-300 text-slate-800 text-xs sm:text-sm font-medium rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
            >
              <option value="">Semua Tahun</option>
              {availableYears.map(yr => (
                <option key={yr} value={yr}>
                  Tahun {yr}
                </option>
              ))}
            </select>
          </div>

          {/* Quick Search */}
          <div className="relative flex-1 min-w-[180px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Cari no akun / nama akun..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportExcel}
            className="outline border border-emerald-600 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs sm:text-sm font-bold px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>⇩ Excel</span>
          </button>

          <button
            type="button"
            onClick={handleExportPDF}
            className="outline border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-bold px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>⇩ PDF</span>
          </button>
        </div>
      </div>

      {/* Grid KPIs */}
      <div className="grid kpis grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Budget After Cost Down (Total Budget) */}
        <div className="card kpi bg-white border border-slate-200/80 rounded-2xl p-4.5 shadow-xs hover:border-indigo-300 transition">
          <div className="label text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Budget After Cost Down
          </div>
          <div className="value text-xl sm:text-2xl font-black text-indigo-700 mt-1.5">
            {formatUSD(totals.totalBudget)}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Total Alokasi Budget USD</div>
        </div>

        {/* KPI 2: Total Cost Down */}
        <div className="card kpi bg-white border border-slate-200/80 rounded-2xl p-4.5 shadow-xs hover:border-amber-300 transition">
          <div className="label text-[11px] font-bold text-amber-700 uppercase tracking-wider">
            Total Cost Down
          </div>
          <div className="value text-xl sm:text-2xl font-black text-amber-600 mt-1.5">
            {formatUSD(totals.totalCostDown)}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Total Target Efisiensi Cost Down</div>
        </div>

        {/* KPI 3: Total Plan */}
        <div className="card kpi bg-white border border-slate-200/80 rounded-2xl p-4.5 shadow-xs hover:border-blue-300 transition">
          <div className="label text-[11px] font-bold text-blue-700 uppercase tracking-wider">
            Total Plan
          </div>
          <div className="value text-xl sm:text-2xl font-black text-blue-600 mt-1.5">
            {formatUSD(totals.totalPlan)}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Total Alokasi Plan B / Lainnya</div>
        </div>

        {/* KPI 4: After Cost Down (Net) */}
        <div className="card kpi bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-4.5 shadow-xs hover:border-emerald-300 transition">
          <div className="label text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
            After Cost Down
          </div>
          <div className="value text-xl sm:text-2xl font-black text-emerald-700 mt-1.5">
            {formatUSD(totals.afterCostDown)}
          </div>
          <div className="text-[10px] text-emerald-600 font-medium mt-1">
            Budget USD - Cost Down USD
          </div>
        </div>
      </div>

      {/* Detail per Account Section */}
      <div className="space-y-2">
        <h2 className="text-lg font-bold text-slate-900 flex items-center justify-between">
          <span>Detail per Account</span>
          <span className="text-xs font-normal text-slate-500">
            {accountGroups.length} Akun Terdaftar
          </span>
        </h2>

        <div className="card bg-white border border-slate-200 rounded-2xl p-5 shadow-xs overflow-hidden">
          <p className="muted text-xs text-slate-500 mb-4">
            Total gabungan {selectedDept ? `department ${selectedDept}` : 'semua department'}.
          </p>

          <div className="tablewrap overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 font-bold">
                  <th className="p-3 whitespace-nowrap">No Akun</th>
                  <th className="p-3 min-w-[200px]">Nama Akun</th>
                  <th className="p-3 text-right whitespace-nowrap">Budget USD</th>
                  <th className="p-3 text-right whitespace-nowrap">Cost Down USD</th>
                  <th className="p-3 text-right whitespace-nowrap">Plan USD</th>
                  <th className="p-3 text-right whitespace-nowrap">After Cost Down USD</th>
                  <th className="p-3 text-center whitespace-nowrap">Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-800">
                {accountGroups.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400 italic text-xs">
                      Belum ada data anggaran di Dept Planning untuk filter ini.
                    </td>
                  </tr>
                ) : (
                  accountGroups.map(group => {
                    const isNegative = group.afterCostDownUSD < 0;
                    return (
                      <tr key={group.accountNo} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3 font-mono font-bold text-indigo-950 whitespace-nowrap">
                          <b>{group.accountNo}</b>
                        </td>
                        <td className="p-3 font-medium text-slate-800">
                          {group.accountName}
                        </td>
                        <td className="num p-3 text-right font-mono text-slate-700 whitespace-nowrap">
                          {formatUSD(group.budgetUSD)}
                        </td>
                        <td className="num p-3 text-right font-mono text-amber-700 whitespace-nowrap">
                          {formatUSD(group.costdownUSD)}
                        </td>
                        <td className="num p-3 text-right font-mono text-blue-700 whitespace-nowrap">
                          {formatUSD(group.planUSD)}
                        </td>
                        <td className={`num p-3 text-right font-mono font-bold whitespace-nowrap ${
                          isNegative ? 'text-rose-600' : 'text-emerald-700'
                        }`}>
                          <b>{formatUSD(group.afterCostDownUSD)}</b>
                        </td>
                        <td className="num p-3 text-center font-mono text-slate-500 whitespace-nowrap">
                          <span className="bg-slate-100 text-slate-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                            {group.dataCount}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}

                {/* Total Footer Row */}
                {accountGroups.length > 0 && (
                  <tr className="bg-slate-100/90 font-bold border-t-2 border-slate-300 text-slate-900">
                    <td colSpan={2} className="p-3.5 text-slate-900">
                      <b>TOTAL</b>
                    </td>
                    <td className="num p-3.5 text-right font-mono text-indigo-950 whitespace-nowrap">
                      <b>{formatUSD(totals.totalBudget)}</b>
                    </td>
                    <td className="num p-3.5 text-right font-mono text-amber-800 whitespace-nowrap">
                      <b>{formatUSD(totals.totalCostDown)}</b>
                    </td>
                    <td className="num p-3.5 text-right font-mono text-blue-800 whitespace-nowrap">
                      <b>{formatUSD(totals.totalPlan)}</b>
                    </td>
                    <td className="num p-3.5 text-right font-mono text-emerald-800 whitespace-nowrap">
                      <b>{formatUSD(totals.afterCostDown)}</b>
                    </td>
                    <td className="num p-3.5 text-center font-mono text-slate-900 whitespace-nowrap">
                      <b>{totals.totalData}</b>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
};
