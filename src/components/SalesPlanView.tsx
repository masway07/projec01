import React, { useState, useMemo } from 'react';
import { COA, Department, ExchangeRates, MonthlyDistribution, SalesPlanItem, CompanySettings } from '../types';
import { SalesPlanModal } from './SalesPlanModal';
import { DP_MONTHS } from '../constants/defaultData';
import {
  Plus,
  FileSpreadsheet,
  Printer,
  Search,
  Building2,
  Trash2,
  Edit2,
  TrendingUp,
  Filter,
  Truck,
  Receipt,
  FileText
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface SalesPlanViewProps {
  salesPlanItems: SalesPlanItem[];
  departments: Department[];
  coaList: COA[];
  ratesByYear: Record<string, ExchangeRates>;
  onAddSalesPlan: (item: Partial<SalesPlanItem>) => void;
  onUpdateSalesPlan: (id: string, item: Partial<SalesPlanItem>) => void;
  onDeleteSalesPlan: (id: string) => void;
  userDept?: string;
  companySettings?: CompanySettings;
  activeSalesTab?: 'sales-plan' | 'sales-delivery' | 'sales-invoice';
  onSwitchSalesTab?: (tab: 'sales-plan' | 'sales-delivery' | 'sales-invoice') => void;
}

export const SalesPlanView: React.FC<SalesPlanViewProps> = ({
  salesPlanItems = [],
  departments = [],
  coaList = [],
  ratesByYear = {},
  onAddSalesPlan,
  onUpdateSalesPlan,
  onDeleteSalesPlan,
  userDept,
  companySettings,
  activeSalesTab = 'sales-plan',
  onSwitchSalesTab
}) => {
  const [selectedDept, setSelectedDept] = useState<string>(userDept || '');
  const [selectedYear, setSelectedYear] = useState<string>('2026');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<SalesPlanItem | null>(null);

  // Available years
  const availableYears = useMemo(() => {
    const set = new Set(salesPlanItems.map(s => s.year).filter(Boolean));
    set.add(2026);
    set.add(2025);
    return Array.from(set).sort((a, b) => b - a);
  }, [salesPlanItems]);

  // Filtered items
  const filteredItems = useMemo(() => {
    return salesPlanItems.filter(item => {
      if (selectedDept && item.deptCode !== selectedDept) return false;
      if (selectedYear && item.year !== Number(selectedYear)) return false;
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchCustomer = item.customer?.toLowerCase().includes(term);
        const matchItem = item.item?.toLowerCase().includes(term);
        const matchCoa = item.coaCode?.toLowerCase().includes(term) || item.coaName?.toLowerCase().includes(term);
        if (!matchCustomer && !matchItem && !matchCoa) return false;
      }
      return true;
    });
  }, [salesPlanItems, selectedDept, selectedYear, searchTerm]);

  // Total Sales Plan USD
  const totalSalesPlanUSD = useMemo(() => {
    return filteredItems.reduce((sum, item) => sum + (Number(item.totalUSD) || 0), 0);
  }, [filteredItems]);

  // Format currency
  const formatUSD = (val: number): string => {
    return `$${(val || 0).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  const formatNum = (val: number): string => {
    if (!val) return '-';
    return val.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    });
  };

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: SalesPlanItem) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleSaveModal = (data: Partial<SalesPlanItem>) => {
    if (editingItem) {
      onUpdateSalesPlan(editingItem.id, data);
    } else {
      onAddSalesPlan(data);
    }
  };

  const handleDelete = (item: SalesPlanItem) => {
    if (confirm(`Apakah Anda yakin ingin menghapus Sales Plan untuk customer "${item.customer}" - "${item.item}"?`)) {
      onDeleteSalesPlan(item.id);
    }
  };

  // Export Excel (.xlsx)
  const handleExportExcel = () => {
    const deptName = selectedDept
      ? departments.find(d => d.code === selectedDept)?.name || selectedDept
      : 'Semua Department';

    const sheetData = [
      ['SALES PLAN REPORT'],
      ['Perusahaan', companySettings?.companyName || 'PT. KANETA INDONESIA'],
      ['Department', `${selectedDept || 'ALL'} - ${deptName}`],
      ['Tahun', selectedYear || 'Semua Tahun'],
      ['Total Sales Plan (USD)', totalSalesPlanUSD],
      ['Tanggal Export', new Date().toLocaleString('id-ID')],
      [],
      [
        'Dept',
        'Customer',
        'Item',
        'COA',
        'Currency',
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'Mei',
        'Jun',
        'Jul',
        'Agu',
        'Sep',
        'Okt',
        'Nov',
        'Des',
        'Total USD',
        'Status'
      ]
    ];

    filteredItems.forEach(item => {
      const m = item.monthly || ({} as MonthlyDistribution);
      sheetData.push([
        item.deptCode,
        item.customer,
        item.item,
        `${item.coaCode} ${item.coaName ? `- ${item.coaName}` : ''}`,
        item.currency,
        m.Jan || 0,
        m.Feb || 0,
        m.Mar || 0,
        m.Apr || 0,
        m.Mei || 0,
        m.Jun || 0,
        m.Jul || 0,
        m.Agu || 0,
        m.Sep || 0,
        m.Okt || 0,
        m.Nov || 0,
        m.Des || 0,
        item.totalUSD || 0,
        item.status || 'Approved'
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(sheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sales Plan');
    XLSX.writeFile(wb, `Sales_Plan_${selectedDept || 'All'}_${selectedYear}_${Date.now()}.xlsx`);
  };

  // Export PDF / Print
  const handleExportPDF = () => {
    window.print();
  };

  return (
    <main id="content" className="content space-y-5">
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

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <span className="bg-indigo-600 text-white w-8 h-8 rounded-xl flex items-center justify-center text-base shadow-sm">
              <TrendingUp className="w-4 h-4" />
            </span>
            <span>Sales Plan</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Perencanaan Penjualan &amp; Distribusi Target Bulanan per Customer
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="toolbar flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
          {/* Add Sales Button */}
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-bold px-4 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>+ Sales</span>
          </button>

          {/* Department Filter */}
          <div className="flex items-center gap-1.5 min-w-[180px]">
            <Building2 className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
            <select
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
          <div>
            <select
              value={selectedYear}
              onChange={e => setSelectedYear(e.target.value)}
              className="bg-slate-50 border border-slate-300 text-slate-800 text-xs sm:text-sm font-medium rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
            >
              {availableYears.map(yr => (
                <option key={yr} value={yr}>
                  Tahun {yr}
                </option>
              ))}
            </select>
          </div>

          {/* Search */}
          <div className="relative flex-1 min-w-[180px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Cari customer, item, COA..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Export buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportExcel}
            className="outline border border-emerald-600 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs sm:text-sm font-bold px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Export Excel</span>
          </button>

          <button
            type="button"
            onClick={handleExportPDF}
            className="outline border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-bold px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      {/* Total Card */}
      <div className="card bg-gradient-to-r from-slate-900 to-indigo-950 text-white border border-slate-800 rounded-2xl p-4.5 shadow-md flex items-center justify-between">
        <div>
          <span className="text-xs text-indigo-300 font-semibold uppercase tracking-wider block">
            Total Ringkasan Rencana Penjualan
          </span>
          <b className="text-xl sm:text-2xl font-black text-white mt-1 block">
            Total Sales Plan: {formatUSD(totalSalesPlanUSD)}
          </b>
        </div>
        <div className="text-right hidden sm:block">
          <span className="text-xs text-slate-400">Total Baris Data</span>
          <div className="text-lg font-bold text-indigo-200">{filteredItems.length} Records</div>
        </div>
      </div>

      {/* Tablewrap */}
      <div className="tablewrap bg-white rounded-2xl border border-slate-200 shadow-xs overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 font-bold">
              <th className="p-2.5 whitespace-nowrap">Dept</th>
              <th className="p-2.5 min-w-[140px]">Customer</th>
              <th className="p-2.5 min-w-[160px]">Item</th>
              <th className="p-2.5 min-w-[140px]">COA</th>
              <th className="p-2.5 text-center whitespace-nowrap">Currency</th>

              {DP_MONTHS.map(m => (
                <th key={m} className="p-2.5 text-right font-mono whitespace-nowrap">
                  {m}
                </th>
              ))}

              <th className="p-2.5 text-right font-bold whitespace-nowrap bg-indigo-50/70 text-indigo-900">
                Total USD
              </th>
              <th className="p-2.5 text-center whitespace-nowrap">Status</th>
              <th className="p-2.5 text-center whitespace-nowrap">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-slate-800">
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={19} className="p-8 text-center text-slate-400 italic text-xs">
                  Belum ada data Sales Plan untuk kriteria ini. Klik <strong>+ Sales</strong> untuk menambah.
                </td>
              </tr>
            ) : (
              filteredItems.map(item => {
                const m = item.monthly || ({} as MonthlyDistribution);
                return (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-2.5 font-bold text-slate-900 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-800 border border-slate-300 text-[11px]">
                        {item.deptCode}
                      </span>
                    </td>
                    <td className="p-2.5 font-bold text-indigo-950">{item.customer}</td>
                    <td className="p-2.5 font-medium text-slate-700">{item.item}</td>
                    <td className="p-2.5 font-mono text-slate-600 whitespace-nowrap">
                      <span title={item.coaName || ''}>{item.coaCode}</span>
                    </td>
                    <td className="p-2.5 text-center whitespace-nowrap">
                      <span className="font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">
                        {item.currency}
                      </span>
                    </td>

                    {DP_MONTHS.map(monthKey => (
                      <td key={monthKey} className="p-2.5 text-right font-mono text-slate-600 whitespace-nowrap">
                        {formatNum(m[monthKey])}
                      </td>
                    ))}

                    <td className="p-2.5 text-right font-mono font-bold whitespace-nowrap bg-indigo-50/40 text-indigo-700">
                      {formatUSD(item.totalUSD)}
                    </td>

                    <td className="p-2.5 text-center whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          item.status === 'Approved'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : item.status === 'Ongoing'
                            ? 'bg-blue-100 text-blue-800 border border-blue-300'
                            : item.status === 'Completed'
                            ? 'bg-purple-100 text-purple-800 border border-purple-300'
                            : 'bg-amber-100 text-amber-800 border border-amber-300'
                        }`}
                      >
                        {item.status || 'Approved'}
                      </span>
                    </td>

                    <td className="p-2.5 text-center whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(item)}
                          className="p-1 text-indigo-600 hover:bg-indigo-50 rounded-md transition cursor-pointer"
                          title="Edit Sales Plan"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(item)}
                          className="p-1 text-rose-600 hover:bg-rose-50 rounded-md transition cursor-pointer"
                          title="Hapus Sales Plan"
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

      {/* Modal Add/Edit */}
      <SalesPlanModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveModal}
        editItem={editingItem}
        departments={departments}
        coaList={coaList}
        ratesByYear={ratesByYear}
        defaultDept={selectedDept || userDept || 'ACC'}
        defaultYear={Number(selectedYear) || 2026}
      />
    </main>
  );
};
