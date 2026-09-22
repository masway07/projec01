import React, { useState, useMemo } from 'react';
import { COA, Department, ExchangeRates, FixedAssetItem, FixedAssetMonthlyDepreciation, CompanySettings } from '../types';
import { FixedAssetModal } from './FixedAssetModal';
import { FixedAssetImportModal } from './FixedAssetImportModal';
import {
  Plus,
  FileSpreadsheet,
  Printer,
  Search,
  Building2,
  Trash2,
  Edit2,
  Box,
  Upload,
  Layers,
  BookOpen,
  PieChart,
  DollarSign,
  TrendingDown,
  Calendar
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface FixedAssetViewProps {
  fixedAssetItems: FixedAssetItem[];
  departments: Department[];
  coaList: COA[];
  ratesByYear: Record<string, ExchangeRates>;
  onAddFixedAsset: (item: Partial<FixedAssetItem>) => void;
  onUpdateFixedAsset: (id: string, item: Partial<FixedAssetItem>) => void;
  onDeleteFixedAsset: (id: string) => void;
  onBatchImportFixedAsset?: (items: Partial<FixedAssetItem>[]) => void;
  userDept?: string;
  companySettings?: CompanySettings;
  activeCategory?: string;
  onSelectCategory?: (category: string) => void;
}

const MONTHS: (keyof FixedAssetMonthlyDepreciation)[] = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

export const FIXED_ASSET_CATEGORIES: { id: string; label: string; desc: string }[] = [
  { id: 'all', label: 'Semua Asset', desc: 'Semua kelompok aset tetap' },
  { id: 'land', label: 'Land', desc: 'Tanah & Lahan Usaha' },
  { id: 'building', label: 'Building', desc: 'Gedung, Bangunan & Renovasi' },
  { id: 'vehicle', label: 'Vehicle', desc: 'Kendaraan Operasional & Logistik' },
  { id: 'electronic', label: 'Electronic', desc: 'Peralatan Elektronik, Komputer & IT' },
  { id: 'software', label: 'Software', desc: 'Lisensi Perangkat Lunak & Sistem' },
  { id: 'intangible_asset', label: 'Intangible Asset', desc: 'Aset Takberwujud, Hak Paten & Merek' },
  { id: 'right_of_use', label: 'Right of use', desc: 'Aset Hak Guna / Sewa Pembiayaan' }
];

export const FixedAssetView: React.FC<FixedAssetViewProps> = ({
  fixedAssetItems = [],
  departments = [],
  coaList = [],
  ratesByYear = {},
  onAddFixedAsset,
  onUpdateFixedAsset,
  onDeleteFixedAsset,
  onBatchImportFixedAsset,
  userDept,
  companySettings,
  activeCategory = 'all',
  onSelectCategory
}) => {
  const [selectedDept, setSelectedDept] = useState<string>(userDept || '');
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedCategory, setSelectedCategory] = useState<string>(activeCategory || 'all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<FixedAssetItem | null>(null);

  // Sync with prop when external category changes
  React.useEffect(() => {
    if (activeCategory) {
      setSelectedCategory(activeCategory);
    }
  }, [activeCategory]);

  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
    if (onSelectCategory) {
      onSelectCategory(cat);
    }
  };

  // Helper to determine asset category
  const getItemCategory = (item: FixedAssetItem): string => {
    if (item.assetCategory) return item.assetCategory;
    const desc = (item.description || item.name || '').toLowerCase();
    const coa = (item.coaCode || '') + ' ' + (item.coaName || '').toLowerCase();
    if (desc.includes('tanah') || desc.includes('land') || coa.includes('land') || coa.includes('tanah')) return 'land';
    if (desc.includes('building') || desc.includes('gedung') || desc.includes('bangunan') || coa.includes('building') || coa.includes('gedung')) return 'building';
    if (desc.includes('kendaraan') || desc.includes('vehicle') || desc.includes('car') || desc.includes('truck') || desc.includes('motor') || coa.includes('vehicle') || coa.includes('kendaraan')) return 'vehicle';
    if (desc.includes('software') || desc.includes('aplikasi') || desc.includes('lisensi') || desc.includes('license') || coa.includes('software')) return 'software';
    if (desc.includes('right of use') || desc.includes('sewa') || desc.includes('lease') || coa.includes('lease') || coa.includes('hak guna')) return 'right_of_use';
    if (desc.includes('patent') || desc.includes('intangible') || desc.includes('takberwujud') || coa.includes('intangible')) return 'intangible_asset';
    return 'electronic'; // default machinery & equipment / electronic
  };

  // Filter items
  const filteredItems = useMemo(() => {
    return fixedAssetItems.filter(item => {
      if (selectedDept && item.deptCode !== selectedDept) return false;
      
      // Category filter
      if (selectedCategory && selectedCategory !== 'all') {
        const itemCat = getItemCategory(item);
        if (itemCat !== selectedCategory) return false;
      }

      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchDesc = (item.description || item.name || '').toLowerCase().includes(term);
        const matchInvoice = (item.invoiceNo || '').toLowerCase().includes(term);
        const matchKi = (item.kiNo || item.code || '').toLowerCase().includes(term);
        const matchCoa = (item.coaCode || '').toLowerCase().includes(term) || (item.coaName || '').toLowerCase().includes(term);
        if (!matchDesc && !matchInvoice && !matchKi && !matchCoa) return false;
      }
      return true;
    });
  }, [fixedAssetItems, selectedDept, selectedCategory, searchTerm]);

  // Aggregate column totals
  const totals = useMemo(() => {
    let totalQty = 0;
    let totalAcqCost = 0;
    let totalPriorAccum = 0;
    const monthlySum: Record<keyof FixedAssetMonthlyDepreciation, number> = {
      Jan: 0, Feb: 0, Mar: 0, Apr: 0, May: 0, Jun: 0,
      Jul: 0, Aug: 0, Sep: 0, Oct: 0, Nov: 0, Dec: 0
    };
    let grandTotalDepr = 0;
    let grandEndingAccum = 0;
    let grandNBV = 0;

    filteredItems.forEach(item => {
      totalQty += Number(item.qty) || 1;
      const acqCost = Number(item.acquisitionCostUSD || item.usd || item.value || 0);
      totalAcqCost += acqCost;
      totalPriorAccum += Number(item.priorAccumDepreciation || 0);

      MONTHS.forEach(m => {
        const val = Number(item.monthlyDepreciation?.[m] || 0);
        monthlySum[m] += val;
      });

      const itemTotalDep = Number(item.totalDepreciationYear || 0);
      grandTotalDepr += itemTotalDep;

      const itemEndingAccum = Number(item.accumulatedDepreciationUSD || (item.priorAccumDepreciation || 0) + itemTotalDep);
      grandEndingAccum += itemEndingAccum;

      const itemNBV = Number(item.netBookValueUSD !== undefined ? item.netBookValueUSD : Math.max(0, acqCost - itemEndingAccum));
      grandNBV += itemNBV;
    });

    return {
      totalQty,
      totalAcqCost,
      totalPriorAccum,
      monthlySum,
      grandTotalDepr,
      grandEndingAccum,
      grandNBV
    };
  }, [filteredItems]);

  // Summary per Depreciation Expense Account
  const expenseAccountSummary = useMemo(() => {
    const map = new Map<string, {
      coaCode: string;
      coaName: string;
      assetCount: number;
      monthlySum: Record<keyof FixedAssetMonthlyDepreciation, number>;
      totalExpense: number;
    }>();

    filteredItems.forEach(item => {
      const expCode = item.depreciationExpenseCoaCode || 
        (['HRGA', 'ACC', 'FIN', 'GA', 'DIR', 'SALES', 'MKT'].includes(item.deptCode) ? '6010021' : '5500027');
      const coaObj = coaList.find(c => c.code === expCode);
      const coaName = item.depreciationExpenseCoaName || (coaObj ? coaObj.name : expCode);

      if (!map.has(expCode)) {
        map.set(expCode, {
          coaCode: expCode,
          coaName,
          assetCount: 0,
          monthlySum: {
            Jan: 0, Feb: 0, Mar: 0, Apr: 0, May: 0, Jun: 0,
            Jul: 0, Aug: 0, Sep: 0, Oct: 0, Nov: 0, Dec: 0
          },
          totalExpense: 0
        });
      }

      const entry = map.get(expCode)!;
      entry.assetCount += 1;
      const totalDep = Number(item.totalDepreciationYear || 0);
      entry.totalExpense += totalDep;

      MONTHS.forEach(m => {
        entry.monthlySum[m] += Number(item.monthlyDepreciation?.[m] || 0);
      });
    });

    return Array.from(map.values()).sort((a, b) => b.totalExpense - a.totalExpense);
  }, [filteredItems, coaList]);

  // Summary per Accumulated Depreciation Account
  const accumulatedAccountSummary = useMemo(() => {
    const map = new Map<string, {
      coaCode: string;
      coaName: string;
      assetCount: number;
      totalAcqCost: number;
      priorAccum: number;
      currentYearDepr: number;
      endingAccum: number;
      totalNBV: number;
    }>();

    filteredItems.forEach(item => {
      let accCode = item.accumulatedDepreciationCoaCode;
      if (!accCode) {
        if (item.coaCode === '1110002') accCode = '1120002';
        else if (item.coaCode === '1110005') accCode = '1120005';
        else if (item.coaCode === '1170001') accCode = '1170001';
        else accCode = '1120003';
      }
      const coaObj = coaList.find(c => c.code === accCode);
      const coaName = item.accumulatedDepreciationCoaName || (coaObj ? coaObj.name : accCode);

      if (!map.has(accCode)) {
        map.set(accCode, {
          coaCode: accCode,
          coaName,
          assetCount: 0,
          totalAcqCost: 0,
          priorAccum: 0,
          currentYearDepr: 0,
          endingAccum: 0,
          totalNBV: 0
        });
      }

      const entry = map.get(accCode)!;
      entry.assetCount += 1;
      const acq = Number(item.acquisitionCostUSD || item.usd || 0);
      const prior = Number(item.priorAccumDepreciation || 0);
      const depYear = Number(item.totalDepreciationYear || 0);
      const ending = Number(item.accumulatedDepreciationUSD || prior + depYear);
      const nbv = Number(item.netBookValueUSD !== undefined ? item.netBookValueUSD : Math.max(0, acq - ending));

      entry.totalAcqCost += acq;
      entry.priorAccum += prior;
      entry.currentYearDepr += depYear;
      entry.endingAccum += ending;
      entry.totalNBV += nbv;
    });

    return Array.from(map.values()).sort((a, b) => b.endingAccum - a.endingAccum);
  }, [filteredItems, coaList]);

  const formatNumber = (val: number): string => {
    if (!val || isNaN(val)) return '0.00';
    return Number(val).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: FixedAssetItem) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleSaveModal = (data: Partial<FixedAssetItem>) => {
    if (editingItem) {
      onUpdateFixedAsset(editingItem.id, data);
    } else {
      onAddFixedAsset(data);
    }
  };

  const handleBatchImport = (items: Partial<FixedAssetItem>[]) => {
    if (onBatchImportFixedAsset) {
      onBatchImportFixedAsset(items);
    } else {
      items.forEach(item => onAddFixedAsset(item));
    }
  };

  const handleDelete = (item: FixedAssetItem) => {
    const code = item.kiNo || item.code || '';
    const desc = item.description || item.name || '';
    if (confirm(`Apakah Anda yakin ingin menghapus aset "${code} - ${desc}"?`)) {
      onDeleteFixedAsset(item.id);
    }
  };

  // Export to Excel with full structure matching the table image
  const handleExportExcel = () => {
    const deptName = selectedDept
      ? departments.find(d => d.code === selectedDept)?.name || selectedDept
      : 'Semua Department';

    // Main Asset Table
    const sheetData: any[][] = [
      ['FIXED ASSET & DEPRECIATION REPORT'],
      ['Perusahaan', companySettings?.companyName || 'PT. KANETA INDONESIA'],
      ['Department', `${selectedDept || 'ALL'} - ${deptName}`],
      ['Tahun', selectedYear],
      ['Tanggal Export', new Date().toLocaleString('id-ID')],
      [],
      // Top header row
      [
        'Description',
        'Invoice No',
        'KI NO',
        'Qty',
        'Acquisition date',
        'COA Asset',
        'Akun Beban Depr',
        'Akun Akumulasi Depr',
        'Acquisition cost (USD)',
        `Accumulated depreciation (${selectedYear - 1})`,
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
        `Total depreciation (${selectedYear})`,
        'Ending Accumulated depreciation',
        'Net book value',
        'Type',
        'Dept',
        'Status'
      ]
    ];

    filteredItems.forEach(item => {
      const acq = Number(item.acquisitionCostUSD || item.usd || 0);
      const prior = Number(item.priorAccumDepreciation || 0);
      const m = item.monthlyDepreciation || {
        Jan: 0, Feb: 0, Mar: 0, Apr: 0, May: 0, Jun: 0,
        Jul: 0, Aug: 0, Sep: 0, Oct: 0, Nov: 0, Dec: 0
      };
      const totDep = Number(item.totalDepreciationYear || 0);
      const endingAccum = Number(item.accumulatedDepreciationUSD || prior + totDep);
      const nbv = Number(item.netBookValueUSD !== undefined ? item.netBookValueUSD : acq - endingAccum);

      sheetData.push([
        item.description || item.name || '',
        item.invoiceNo || '',
        item.kiNo || item.code || '',
        Number(item.qty) || 1,
        item.acquisitionDate || '',
        `${item.coaCode || ''} ${item.coaName || ''}`.trim(),
        `${item.depreciationExpenseCoaCode || ''} ${item.depreciationExpenseCoaName || ''}`.trim(),
        `${item.accumulatedDepreciationCoaCode || ''} ${item.accumulatedDepreciationCoaName || ''}`.trim(),
        acq,
        prior,
        m.Jan || 0,
        m.Feb || 0,
        m.Mar || 0,
        m.Apr || 0,
        m.May || 0,
        m.Jun || 0,
        m.Jul || 0,
        m.Aug || 0,
        m.Sep || 0,
        m.Oct || 0,
        m.Nov || 0,
        m.Dec || 0,
        totDep,
        endingAccum,
        nbv,
        item.assetType || 'NEW',
        item.deptCode || '',
        item.status || 'Active'
      ]);
    });

    // Grand Total Row
    sheetData.push([
      'TOTAL',
      '',
      '',
      totals.totalQty,
      '',
      '',
      '',
      '',
      totals.totalAcqCost,
      totals.totalPriorAccum,
      totals.monthlySum.Jan,
      totals.monthlySum.Feb,
      totals.monthlySum.Mar,
      totals.monthlySum.Apr,
      totals.monthlySum.May,
      totals.monthlySum.Jun,
      totals.monthlySum.Jul,
      totals.monthlySum.Aug,
      totals.monthlySum.Sep,
      totals.monthlySum.Oct,
      totals.monthlySum.Nov,
      totals.monthlySum.Dec,
      totals.grandTotalDepr,
      totals.grandEndingAccum,
      totals.grandNBV,
      '',
      '',
      ''
    ]);

    // Add Expense COA Breakdown Table
    sheetData.push([]);
    sheetData.push(['REKAPITULASI TOTAL AKUN BEBAN DEPRESIASI (DEPRECIATION EXPENSE)']);
    sheetData.push(['Kode Akun', 'Nama Akun Beban', 'Jumlah Aset', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Total Beban (USD)']);
    expenseAccountSummary.forEach(e => {
      sheetData.push([
        e.coaCode,
        e.coaName,
        e.assetCount,
        e.monthlySum.Jan,
        e.monthlySum.Feb,
        e.monthlySum.Mar,
        e.monthlySum.Apr,
        e.monthlySum.May,
        e.monthlySum.Jun,
        e.monthlySum.Jul,
        e.monthlySum.Aug,
        e.monthlySum.Sep,
        e.monthlySum.Oct,
        e.monthlySum.Nov,
        e.monthlySum.Dec,
        e.totalExpense
      ]);
    });

    // Add Accum Depr COA Breakdown Table
    sheetData.push([]);
    sheetData.push(['REKAPITULASI TOTAL AKUN AKUMULASI DEPRESIASI (ACCUMULATED DEPRECIATION)']);
    sheetData.push(['Kode Akun', 'Nama Akun Akumulasi', 'Jumlah Aset', 'Acquisition Cost (USD)', `Saldo Awal (${selectedYear - 1}) USD`, `Penambahan (${selectedYear}) USD`, 'Saldo Akhir Akumulasi USD', 'Net Book Value (USD)']);
    accumulatedAccountSummary.forEach(a => {
      sheetData.push([
        a.coaCode,
        a.coaName,
        a.assetCount,
        a.totalAcqCost,
        a.priorAccum,
        a.currentYearDepr,
        a.endingAccum,
        a.totalNBV
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(sheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Fixed Asset');
    XLSX.writeFile(wb, `Fixed_Asset_Depreciation_${selectedDept || 'ALL'}_${selectedYear}.xlsx`);
  };

  const handleExportPDF = () => {
    window.print();
  };

  return (
    <main id="content" className="content space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <span className="bg-indigo-600 text-white w-8 h-8 rounded-xl flex items-center justify-center text-base shadow-sm">
              <Box className="w-4 h-4" />
            </span>
            <span>Fixed Asset &amp; Depreciation</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Pencatatan aset tetap, invoice, kapitalisasi, jadwal depresiasi bulanan, dan net book value
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="toolbar flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
          {/* Add Asset Button */}
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-bold px-4 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-sm whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>+ Asset Baru / Kapitalisasi</span>
          </button>

          {/* Import Asset Button */}
          <button
            type="button"
            onClick={() => setIsImportModalOpen(true)}
            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs sm:text-sm font-bold px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs whitespace-nowrap"
          >
            <Upload className="w-4 h-4 text-emerald-600" />
            <span>Import Asset</span>
          </button>

          {/* Department Filter */}
          <div className="flex items-center gap-1.5 min-w-[170px]">
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
          <div className="flex items-center gap-1.5 min-w-[110px]">
            <Calendar className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
            <select
              value={selectedYear}
              onChange={e => setSelectedYear(parseInt(e.target.value) || 2026)}
              className="bg-slate-50 border border-slate-300 text-slate-800 text-xs sm:text-sm font-bold rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none w-full cursor-pointer"
            >
              <option value="2025">2025</option>
              <option value="2026">2026</option>
              <option value="2027">2027</option>
              <option value="2028">2028</option>
            </select>
          </div>

          {/* Search */}
          <div className="relative flex-1 min-w-[180px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Cari Description, Invoice, KI NO, COA..."
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

      {/* Submenu Categories Navigation Bar */}
      <div className="bg-white p-2.5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-1.5 overflow-x-auto">
        {FIXED_ASSET_CATEGORIES.map(cat => {
          const isCatActive = selectedCategory === cat.id;
          const count = cat.id === 'all'
            ? fixedAssetItems.length
            : fixedAssetItems.filter(i => getItemCategory(i) === cat.id).length;

          return (
            <button
              key={cat.id}
              onClick={() => handleCategoryChange(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap flex items-center gap-2 transition cursor-pointer ${
                isCatActive
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/80'
              }`}
              title={cat.desc}
            >
              <span>{cat.label}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                isCatActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="card bg-white border border-slate-200 rounded-2xl p-3.5 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Total Acquisition Cost
          </div>
          <div className="text-xl font-black text-indigo-700 mt-1 font-mono">
            ${formatNumber(totals.totalAcqCost)}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">{filteredItems.length} Unit Asset Tercatat</div>
        </div>

        <div className="card bg-white border border-slate-200 rounded-2xl p-3.5 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Total Depr ({selectedYear})
          </div>
          <div className="text-xl font-black text-amber-700 mt-1 font-mono">
            ${formatNumber(totals.grandTotalDepr)}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Biaya penyusutan tahun berjalan</div>
        </div>

        <div className="card bg-white border border-slate-200 rounded-2xl p-3.5 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Ending Accum. Depr
          </div>
          <div className="text-xl font-black text-rose-700 mt-1 font-mono">
            ${formatNumber(totals.grandEndingAccum)}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Akumulasi penyusutan s/d akhir {selectedYear}</div>
        </div>

        <div className="card bg-emerald-50/60 border border-emerald-200 rounded-2xl p-3.5 shadow-xs">
          <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
            Net Book Value (USD)
          </div>
          <div className="text-xl font-black text-emerald-700 mt-1 font-mono">
            ${formatNumber(totals.grandNBV)}
          </div>
          <div className="text-[10px] text-emerald-600 mt-0.5">Nilai sisa buku keseluruhan</div>
        </div>
      </div>

      {/* Main Table Matching the Uploaded User Design */}
      <div className="tablewrap coa-tablewrap bg-white rounded-2xl border border-blue-900/30 shadow-sm overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs border border-blue-900/40">
          {/* Two-tier Table Header Exactly Matching User's Image */}
          <thead>
            {/* Top Header Row */}
            <tr className="bg-blue-50/40 text-blue-950 font-bold border-b border-blue-900/30 text-center divide-x divide-blue-900/20">
              <th rowSpan={2} className="p-2.5 min-w-[240px] text-left align-middle border-r border-blue-900/30">
                Description
              </th>
              <th rowSpan={2} className="p-2.5 min-w-[120px] align-middle whitespace-nowrap border-r border-blue-900/30">
                Invoice No
              </th>
              <th rowSpan={2} className="p-2.5 min-w-[110px] align-middle whitespace-nowrap border-r border-blue-900/30">
                KI NO
              </th>
              <th rowSpan={2} className="p-2.5 min-w-[50px] align-middle whitespace-nowrap border-r border-blue-900/30">
                Qty
              </th>
              <th rowSpan={2} className="p-2.5 min-w-[110px] align-middle whitespace-nowrap border-r border-blue-900/30">
                Acquisition<br />date
              </th>
              <th className="p-2 min-w-[110px] whitespace-nowrap border-r border-blue-900/30">
                Acquisition<br />cost
              </th>
              <th className="p-2 min-w-[110px] whitespace-nowrap border-r border-blue-900/30">
                Accumulated<br />depreciation
              </th>
              {/* 12 Months Depreciation Expense Header */}
              <th colSpan={12} className="p-2 whitespace-nowrap bg-blue-100/50 text-blue-900 border-r border-blue-900/30">
                Depreciation expense ({selectedYear})
              </th>
              <th className="p-2 min-w-[110px] whitespace-nowrap bg-indigo-50/70 text-indigo-950 font-black border-r border-blue-900/30">
                Total<br />depreciation
              </th>
              <th className="p-2 min-w-[110px] whitespace-nowrap bg-amber-50/60 text-amber-950 font-black border-r border-blue-900/30">
                Accumulated<br />depreciation
              </th>
              <th className="p-2 min-w-[110px] whitespace-nowrap bg-emerald-50/60 text-emerald-950 font-black border-r border-blue-900/30">
                Net book<br />value
              </th>
              <th rowSpan={2} className="p-2.5 min-w-[70px] align-middle whitespace-nowrap bg-slate-100 text-slate-700">
                Aksi
              </th>
            </tr>

            {/* Sub Header Row */}
            <tr className="bg-blue-50/30 text-blue-900 font-bold border-b border-blue-900/30 text-center divide-x divide-blue-900/20 text-[11px]">
              {/* Under Acquisition Cost */}
              <th className="p-1.5 whitespace-nowrap font-mono">USD</th>
              {/* Under Prior Accumulated Depr */}
              <th className="p-1.5 whitespace-nowrap font-mono bg-blue-100/60 text-blue-950 font-bold">{selectedYear - 1}</th>
              {/* 12 Months */}
              {MONTHS.map(m => (
                <th key={m} className="p-1.5 min-w-[65px] whitespace-nowrap font-mono bg-blue-100/30">
                  {m}
                </th>
              ))}
              {/* Under Total Depr */}
              <th className="p-1.5 whitespace-nowrap font-mono bg-indigo-100/60 text-indigo-950 font-bold">USD</th>
              {/* Under Accumulated Depr USD */}
              <th className="p-1.5 whitespace-nowrap font-mono bg-amber-100/70 text-amber-950 font-bold">USD</th>
              {/* Under Net Book Value USD */}
              <th className="p-1.5 whitespace-nowrap font-mono bg-emerald-100/70 text-emerald-950 font-bold">USD</th>
            </tr>
          </thead>

          {/* Body Rows */}
          <tbody className="divide-y divide-slate-200 text-slate-800">
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={23} className="p-10 text-center text-slate-400 italic text-xs">
                  Belum ada data Fixed Asset untuk kriteria ini. Silakan klik <strong>+ Asset Baru / Kapitalisasi</strong> atau <strong>Import Asset</strong>.
                </td>
              </tr>
            ) : (
              filteredItems.map(item => {
                const acqCost = Number(item.acquisitionCostUSD || item.usd || 0);
                const prior = Number(item.priorAccumDepreciation || 0);
                const m = item.monthlyDepreciation || {
                  Jan: 0, Feb: 0, Mar: 0, Apr: 0, May: 0, Jun: 0,
                  Jul: 0, Aug: 0, Sep: 0, Oct: 0, Nov: 0, Dec: 0
                };
                const totalDep = Number(item.totalDepreciationYear || 0);
                const endingAccum = Number(item.accumulatedDepreciationUSD || prior + totalDep);
                const nbv = Number(item.netBookValueUSD !== undefined ? item.netBookValueUSD : Math.max(0, acqCost - endingAccum));

                return (
                  <tr key={item.id} className="hover:bg-blue-50/20 transition-colors divide-x divide-slate-200 text-[11.5px]">
                    {/* Description */}
                    <td className="p-2.5 font-medium text-slate-900 min-w-[240px]">
                      <div className="font-semibold text-slate-900">{item.description || item.name}</div>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        {item.assetType === 'CAPITALIZATION' && (
                          <span className="px-1.5 py-0.2 bg-purple-100 text-purple-800 border border-purple-300 rounded text-[9px] font-bold flex items-center gap-1">
                            <span>Kapitalisasi</span>
                            {item.parentAssetKiNo && <span>({item.parentAssetKiNo})</span>}
                          </span>
                        )}
                        <span className="px-1.5 py-0.2 bg-slate-100 text-slate-700 rounded text-[9px] font-bold">
                          {item.deptCode}
                        </span>
                        {/* Depreciation COA Badges */}
                        {item.depreciationExpenseCoaCode && (
                          <span className="px-1.5 py-0.2 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded text-[9px] font-semibold" title={`Beban Depresiasi: ${item.depreciationExpenseCoaCode} - ${item.depreciationExpenseCoaName || ''}`}>
                            Beban: {item.depreciationExpenseCoaCode}
                          </span>
                        )}
                        {item.accumulatedDepreciationCoaCode && (
                          <span className="px-1.5 py-0.2 bg-amber-50 text-amber-800 border border-amber-200 rounded text-[9px] font-semibold" title={`Akumulasi Depresiasi: ${item.accumulatedDepreciationCoaCode} - ${item.accumulatedDepreciationCoaName || ''}`}>
                            Akum: {item.accumulatedDepreciationCoaCode}
                          </span>
                        )}
                        {item.notes && <span className="text-[10px] text-slate-400">{item.notes}</span>}
                      </div>
                    </td>

                    {/* Invoice No */}
                    <td className="p-2 font-mono text-slate-700 whitespace-nowrap text-center">
                      {item.invoiceNo || '-'}
                    </td>

                    {/* KI NO */}
                    <td className="p-2 font-mono font-bold text-indigo-900 whitespace-nowrap text-center">
                      {item.kiNo || item.code || '-'}
                    </td>

                    {/* Qty */}
                    <td className="p-2 font-mono text-center font-bold text-slate-700">
                      {item.qty || 1}
                    </td>

                    {/* Acquisition Date */}
                    <td className="p-2 font-mono text-slate-600 whitespace-nowrap text-center">
                      {item.acquisitionDate || '-'}
                    </td>

                    {/* Acquisition Cost USD */}
                    <td className="p-2 font-mono text-right font-bold text-slate-900 whitespace-nowrap">
                      {formatNumber(acqCost)}
                    </td>

                    {/* Accumulated Depr (Prior) */}
                    <td className="p-2 font-mono text-right text-slate-600 whitespace-nowrap">
                      {formatNumber(prior)}
                    </td>

                    {/* Jan .. Dec */}
                    {MONTHS.map(monthKey => {
                      const val = Number(m[monthKey] || 0);
                      return (
                        <td
                          key={monthKey}
                          className={`p-1.5 font-mono text-right whitespace-nowrap text-[11px] ${
                            val > 0 ? 'text-slate-800 font-medium' : 'text-slate-300'
                          }`}
                        >
                          {val > 0 ? formatNumber(val) : '-'}
                        </td>
                      );
                    })}

                    {/* Total Depreciation */}
                    <td className="p-2 font-mono text-right font-bold whitespace-nowrap bg-indigo-50/40 text-indigo-900">
                      {formatNumber(totalDep)}
                    </td>

                    {/* Ending Accumulated Depreciation USD */}
                    <td className="p-2 font-mono text-right font-bold whitespace-nowrap bg-amber-50/40 text-amber-900">
                      {formatNumber(endingAccum)}
                    </td>

                    {/* Net Book Value USD */}
                    <td className="p-2 font-mono text-right font-black whitespace-nowrap bg-emerald-50/40 text-emerald-800">
                      {formatNumber(nbv)}
                    </td>

                    {/* Actions */}
                    <td className="p-2 text-center whitespace-nowrap bg-white">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(item)}
                          className="p-1 text-indigo-600 hover:bg-indigo-50 rounded-md transition cursor-pointer"
                          title="Edit Fixed Asset"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(item)}
                          className="p-1 text-rose-600 hover:bg-rose-50 rounded-md transition cursor-pointer"
                          title="Hapus Fixed Asset"
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

          {/* Grand Total Footer Row */}
          {filteredItems.length > 0 && (
            <tfoot>
              <tr className="bg-slate-900 text-white font-black text-xs divide-x divide-slate-700">
                <td colSpan={3} className="p-2.5 text-center uppercase tracking-wider font-bold">
                  TOTAL
                </td>
                <td className="p-2 font-mono text-center">{totals.totalQty}</td>
                <td className="p-2 text-center">-</td>
                <td className="p-2 font-mono text-right text-indigo-300">
                  {formatNumber(totals.totalAcqCost)}
                </td>
                <td className="p-2 font-mono text-right text-slate-300">
                  {formatNumber(totals.totalPriorAccum)}
                </td>
                {/* Monthly Totals */}
                {MONTHS.map(m => (
                  <td key={m} className="p-1.5 font-mono text-right text-[11px] text-indigo-200">
                    {formatNumber(totals.monthlySum[m])}
                  </td>
                ))}
                {/* Grand Total Depr */}
                <td className="p-2 font-mono text-right text-indigo-300 bg-slate-950">
                  {formatNumber(totals.grandTotalDepr)}
                </td>
                {/* Grand Ending Accum */}
                <td className="p-2 font-mono text-right text-amber-300 bg-slate-950">
                  {formatNumber(totals.grandEndingAccum)}
                </td>
                {/* Grand NBV */}
                <td className="p-2 font-mono text-right text-emerald-300 bg-slate-950">
                  {formatNumber(totals.grandNBV)}
                </td>
                <td className="p-2 text-center bg-slate-900">-</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* REKAPITULASI TOTAL AKUN DEPRESIASI & AKUMULASI */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 pt-2">
        {/* Card 1: Rekap Akun Beban Depresiasi */}
        <div className="bg-white border border-indigo-100 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">
                  Total per Akun Beban Depresiasi ({selectedYear})
                </h3>
                <p className="text-[11px] text-slate-500">
                  Alokasi beban penyusutan operasional berdasarkan COA
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-bold font-mono">
              Total: ${formatNumber(totals.grandTotalDepr)}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-bold border-y border-slate-200">
                  <th className="p-2.5">Kode &amp; Nama Akun Beban</th>
                  <th className="p-2.5 text-center">Unit</th>
                  <th className="p-2.5 text-right">Rata-rata/Bln</th>
                  <th className="p-2.5 text-right">Total Beban ({selectedYear})</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {expenseAccountSummary.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-4 text-center text-slate-400 italic">
                      Tidak ada data akun beban
                    </td>
                  </tr>
                ) : (
                  expenseAccountSummary.map(item => (
                    <tr key={item.coaCode} className="hover:bg-indigo-50/30 transition-colors">
                      <td className="p-2.5">
                        <div className="font-bold text-slate-900">{item.coaCode}</div>
                        <div className="text-[11px] text-slate-500 font-medium">{item.coaName}</div>
                      </td>
                      <td className="p-2.5 text-center font-mono font-semibold text-slate-700">
                        {item.assetCount}
                      </td>
                      <td className="p-2.5 text-right font-mono text-slate-600">
                        ${formatNumber(item.totalExpense / 12)}
                      </td>
                      <td className="p-2.5 text-right font-mono font-bold text-indigo-700">
                        ${formatNumber(item.totalExpense)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {expenseAccountSummary.length > 0 && (
                <tfoot>
                  <tr className="bg-indigo-50/60 font-black text-slate-900 border-t-2 border-indigo-200">
                    <td className="p-2.5">TOTAL BEBAN DEPRESIASI</td>
                    <td className="p-2.5 text-center font-mono">{filteredItems.length}</td>
                    <td className="p-2.5 text-right font-mono">${formatNumber(totals.grandTotalDepr / 12)}</td>
                    <td className="p-2.5 text-right font-mono text-indigo-900 text-sm">
                      ${formatNumber(totals.grandTotalDepr)}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>

        {/* Card 2: Rekap Akun Akumulasi Depresiasi */}
        <div className="bg-white border border-amber-100 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
                <PieChart className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">
                  Total per Akun Akumulasi Depresiasi ({selectedYear})
                </h3>
                <p className="text-[11px] text-slate-500">
                  Saldo akumulasi penyusutan dan net book value per akun kontra aset
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1 bg-amber-50 text-amber-800 rounded-lg text-xs font-bold font-mono">
              Ending: ${formatNumber(totals.grandEndingAccum)}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-bold border-y border-slate-200">
                  <th className="p-2.5">Kode &amp; Akun Akumulasi</th>
                  <th className="p-2.5 text-right">Saldo Awal ({selectedYear - 1})</th>
                  <th className="p-2.5 text-right">+ Thn {selectedYear}</th>
                  <th className="p-2.5 text-right">Saldo Akhir USD</th>
                  <th className="p-2.5 text-right">Net Book Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {accumulatedAccountSummary.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-slate-400 italic">
                      Tidak ada data akun akumulasi
                    </td>
                  </tr>
                ) : (
                  accumulatedAccountSummary.map(item => (
                    <tr key={item.coaCode} className="hover:bg-amber-50/30 transition-colors">
                      <td className="p-2.5">
                        <div className="font-bold text-slate-900">{item.coaCode}</div>
                        <div className="text-[11px] text-slate-500 font-medium">{item.coaName}</div>
                      </td>
                      <td className="p-2.5 text-right font-mono text-slate-600">
                        ${formatNumber(item.priorAccum)}
                      </td>
                      <td className="p-2.5 text-right font-mono font-medium text-amber-700">
                        ${formatNumber(item.currentYearDepr)}
                      </td>
                      <td className="p-2.5 text-right font-mono font-bold text-rose-700">
                        ${formatNumber(item.endingAccum)}
                      </td>
                      <td className="p-2.5 text-right font-mono font-black text-emerald-700">
                        ${formatNumber(item.totalNBV)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {accumulatedAccountSummary.length > 0 && (
                <tfoot>
                  <tr className="bg-amber-50/60 font-black text-slate-900 border-t-2 border-amber-200">
                    <td className="p-2.5">TOTAL AKUMULASI DEPRESIASI</td>
                    <td className="p-2.5 text-right font-mono">${formatNumber(totals.totalPriorAccum)}</td>
                    <td className="p-2.5 text-right font-mono text-amber-900">${formatNumber(totals.grandTotalDepr)}</td>
                    <td className="p-2.5 text-right font-mono text-rose-900 text-sm">
                      ${formatNumber(totals.grandEndingAccum)}
                    </td>
                    <td className="p-2.5 text-right font-mono text-emerald-900 text-sm">
                      ${formatNumber(totals.grandNBV)}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      </div>

      {/* Input / Edit Modal */}
      <FixedAssetModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveModal}
        editItem={editingItem}
        departments={departments}
        coaList={coaList}
        ratesByYear={ratesByYear}
        existingAssets={fixedAssetItems}
        defaultDept={selectedDept || userDept || 'ACC'}
        defaultYear={selectedYear}
      />

      {/* Import Modal */}
      <FixedAssetImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleBatchImport}
        departments={departments}
        coaList={coaList}
        ratesByYear={ratesByYear}
        currentYear={selectedYear}
      />
    </main>
  );
};
