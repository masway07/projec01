import React, { useState, useEffect, useMemo } from 'react';
import { COA, Department, ExchangeRates, FixedAssetCategory, FixedAssetItem, FixedAssetMonthlyDepreciation } from '../types';
import { X, Save, AlertCircle, Box, Layers, RefreshCw, Link as LinkIcon, BookOpen, Clock } from 'lucide-react';

interface FixedAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: Partial<FixedAssetItem>) => void;
  editItem?: FixedAssetItem | null;
  departments: Department[];
  coaList: COA[];
  ratesByYear: Record<string, ExchangeRates>;
  existingAssets?: FixedAssetItem[];
  defaultDept?: string;
  defaultYear?: number;
}

const MONTHS_LIST: (keyof FixedAssetMonthlyDepreciation)[] = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const INDONESIAN_MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export const FixedAssetModal: React.FC<FixedAssetModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editItem,
  departments,
  coaList,
  ratesByYear,
  existingAssets = [],
  defaultDept = 'ACC',
  defaultYear = 2026
}) => {
  const [kiNo, setKiNo] = useState<string>('');
  const [invoiceNo, setInvoiceNo] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [assetCategory, setAssetCategory] = useState<string>('electronic');
  const [qty, setQty] = useState<number>(1);
  const [acquisitionDate, setAcquisitionDate] = useState<string>(`${defaultYear}-01-01`);
  const [deptCode, setDeptCode] = useState<string>(defaultDept);
  const [coaCode, setCoaCode] = useState<string>('1110003');
  
  // Depreciation COA Accounts
  const [depreciationExpenseCoaCode, setDepreciationExpenseCoaCode] = useState<string>('5500027');
  const [accumulatedDepreciationCoaCode, setAccumulatedDepreciationCoaCode] = useState<string>('1120003');

  const [currency, setCurrency] = useState<string>('IDR');
  const [originalCost, setOriginalCost] = useState<number>(0);
  const [year, setYear] = useState<number>(defaultYear);
  const [status, setStatus] = useState<string>('Active');
  const [notes, setNotes] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Capitalization & Useful Life
  const [assetType, setAssetType] = useState<'NEW' | 'CAPITALIZATION'>('NEW');
  const [parentAssetId, setParentAssetId] = useState<string>('');
  const [usefulLifeYears, setUsefulLifeYears] = useState<number>(4);
  const [usefulLifeMonths, setUsefulLifeMonths] = useState<number>(48);

  // Depreciation Schedule
  const [priorAccumDepreciation, setPriorAccumDepreciation] = useState<number>(0);
  const [monthlyDepreciation, setMonthlyDepreciation] = useState<FixedAssetMonthlyDepreciation>({
    Jan: 0, Feb: 0, Mar: 0, Apr: 0, May: 0, Jun: 0,
    Jul: 0, Aug: 0, Sep: 0, Oct: 0, Nov: 0, Dec: 0
  });

  // Rates and USD conversion
  const currentRates = ratesByYear[String(year)] || { IDR: 16273.56, JPY: 142.54, CNY: 0.14, EUR: 0.92 };

  let rate = 1;
  if (currency === 'USD') rate = 1;
  else if (currency === 'IDR') rate = currentRates.IDR || 16273.56;
  else if (currency === 'JPY') rate = currentRates.JPY || 142.54;
  else if (currency === 'CNY') rate = currentRates.CNY || 0.14;
  else if (currency === 'EUR') rate = currentRates.EUR || 0.92;

  const acquisitionCostUSD = currency === 'USD' ? originalCost : originalCost / (rate || 1);

  // Eligible parent assets for capitalization
  const availableParentAssets = useMemo(() => {
    return existingAssets.filter(a => a.id !== editItem?.id);
  }, [existingAssets, editItem]);

  const selectedParent = useMemo(() => {
    if (!parentAssetId) return null;
    return availableParentAssets.find(a => a.id === parentAssetId) || null;
  }, [availableParentAssets, parentAssetId]);

  // Smart suggestions for Expense COA based on department
  const getDefaultExpenseCoa = (dCode: string) => {
    const isGA = ['HRGA', 'ACC', 'FIN', 'GA', 'DIR', 'SALES', 'MKT'].includes(dCode);
    return isGA ? '6010021' : '5500027'; // 6010021 = G&A - Depreciation, 5500027 = FOH - Depreciation
  };

  // Smart suggestions for Accum Depr COA based on Asset COA
  const getDefaultAccumDeprCoa = (aCode: string) => {
    if (aCode === '1110002') return '1120002'; // Building
    if (aCode === '1110003') return '1120003'; // Machinery
    if (aCode === '1110005') return '1120005'; // Furniture
    if (aCode === '1170001') return '1170001'; // Intangible
    if (aCode === '1120006') return '1120006'; // Lease
    return '1120003';
  };

  // Load edit item or reset
  useEffect(() => {
    if (editItem) {
      setKiNo(editItem.kiNo || editItem.code || '');
      setInvoiceNo(editItem.invoiceNo || '');
      setDescription(editItem.description || editItem.name || '');
      setAssetCategory(editItem.assetCategory || 'electronic');
      setQty(editItem.qty || 1);
      setAcquisitionDate(editItem.acquisitionDate || `${defaultYear}-01-01`);
      setDeptCode(editItem.deptCode || defaultDept);
      setCoaCode(editItem.coaCode || '1110003');

      setDepreciationExpenseCoaCode(
        editItem.depreciationExpenseCoaCode || getDefaultExpenseCoa(editItem.deptCode || defaultDept)
      );
      setAccumulatedDepreciationCoaCode(
        editItem.accumulatedDepreciationCoaCode || getDefaultAccumDeprCoa(editItem.coaCode || '1110003')
      );

      setCurrency(editItem.currency || 'IDR');
      setOriginalCost(editItem.originalCost || editItem.value || 0);
      setYear(editItem.year || defaultYear);
      setStatus(editItem.status || 'Active');
      setNotes(editItem.notes || '');

      setAssetType(editItem.assetType || 'NEW');
      setParentAssetId(editItem.parentAssetId || '');

      const initialYears = Math.max(1, Math.round(editItem.usefulLifeYears || (editItem.usefulLifeMonths ? editItem.usefulLifeMonths / 12 : 4)));
      setUsefulLifeYears(initialYears);
      setUsefulLifeMonths(initialYears * 12);

      setPriorAccumDepreciation(editItem.priorAccumDepreciation || 0);
      setMonthlyDepreciation(editItem.monthlyDepreciation || {
        Jan: 0, Feb: 0, Mar: 0, Apr: 0, May: 0, Jun: 0,
        Jul: 0, Aug: 0, Sep: 0, Oct: 0, Nov: 0, Dec: 0
      });
    } else {
      const randomCode = `KI-${defaultYear}-${Math.floor(1000 + Math.random() * 9000)}`;
      setKiNo(randomCode);
      setInvoiceNo(`INV-${defaultYear}-${Math.floor(100 + Math.random() * 900)}`);
      setDescription('');
      setAssetCategory('electronic');
      setQty(1);
      setAcquisitionDate(`${defaultYear}-01-01`);
      setDeptCode(defaultDept);
      setCoaCode('1110003');

      setDepreciationExpenseCoaCode(getDefaultExpenseCoa(defaultDept));
      setAccumulatedDepreciationCoaCode(getDefaultAccumDeprCoa('1110003'));

      setCurrency('IDR');
      setOriginalCost(0);
      setYear(defaultYear);
      setStatus('Active');
      setNotes('');

      setAssetType('NEW');
      setParentAssetId('');
      setUsefulLifeYears(4);
      setUsefulLifeMonths(48);

      setPriorAccumDepreciation(0);
      setMonthlyDepreciation({
        Jan: 0, Feb: 0, Mar: 0, Apr: 0, May: 0, Jun: 0,
        Jul: 0, Aug: 0, Sep: 0, Oct: 0, Nov: 0, Dec: 0
      });
    }
    setErrorMsg('');
  }, [editItem, isOpen, defaultDept, defaultYear]);

  // When changing parent asset in Capitalization mode
  const handleParentChange = (pId: string) => {
    setParentAssetId(pId);
    const parent = availableParentAssets.find(a => a.id === pId);
    if (parent) {
      const pMonths = parent.usefulLifeMonths || (parent.usefulLifeYears ? parent.usefulLifeYears * 12 : 48);
      const pDate = new Date(parent.acquisitionDate || `${year}-01-01`);
      const curDate = new Date(acquisitionDate || `${year}-01-01`);
      const elapsed = Math.max(0, (curDate.getFullYear() - pDate.getFullYear()) * 12 + (curDate.getMonth() - pDate.getMonth()));
      const remainingMonths = Math.max(12, pMonths - elapsed);
      const remainingYears = Math.max(1, Math.round(remainingMonths / 12));
      setUsefulLifeYears(remainingYears);
      setUsefulLifeMonths(remainingYears * 12);
    }
  };

  const handleYearsChange = (yrs: number) => {
    const validYears = Math.max(1, Math.round(yrs));
    setUsefulLifeYears(validYears);
    setUsefulLifeMonths(validYears * 12);
  };

  const handleDeptChange = (newDept: string) => {
    setDeptCode(newDept);
    if (!editItem) {
      setDepreciationExpenseCoaCode(getDefaultExpenseCoa(newDept));
    }
  };

  const handleAssetCoaChange = (newCoa: string) => {
    setCoaCode(newCoa);
    if (!editItem) {
      setAccumulatedDepreciationCoaCode(getDefaultAccumDeprCoa(newCoa));
    }
  };

  // Auto calculate straight-line depreciation schedule based strictly on Acquisition Date
  const autoCalculateDepreciation = () => {
    if (acquisitionCostUSD <= 0 || usefulLifeMonths <= 0) return;

    const monthlyRate = acquisitionCostUSD / usefulLifeMonths;
    const dateStr = acquisitionDate || `${year}-01-01`;
    const parts = dateStr.split('-');
    const acqYear = parseInt(parts[0], 10) || year;
    const acqMonth = Math.max(0, Math.min(11, (parseInt(parts[1], 10) || 1) - 1)); // 0 = Jan, 4 = May

    let priorMonths = 0;
    // If acquired in previous years, compute prior months up to Dec 31 of prior year (year - 1)
    if (acqYear < year) {
      const fullYearsBetween = year - acqYear - 1;
      priorMonths = (12 - acqMonth) + (fullYearsBetween * 12);
    }

    // Limit prior months to useful life
    priorMonths = Math.min(usefulLifeMonths, Math.max(0, priorMonths));
    const priorAccum = Number((priorMonths * monthlyRate).toFixed(2));
    setPriorAccumDepreciation(priorAccum);

    let runningAccum = priorAccum;
    const newMonthly: FixedAssetMonthlyDepreciation = {
      Jan: 0, Feb: 0, Mar: 0, Apr: 0, May: 0, Jun: 0,
      Jul: 0, Aug: 0, Sep: 0, Oct: 0, Nov: 0, Dec: 0
    };

    MONTHS_LIST.forEach((m, idx) => {
      // If acquired in current year, depreciation starts only from the acquisition month (e.g. 16 May -> idx 4 / May)
      if (acqYear === year && idx < acqMonth) {
        newMonthly[m] = 0;
      } else if (acqYear > year) {
        // Asset acquired in future year
        newMonthly[m] = 0;
      } else {
        const remainingToDepreciate = Math.max(0, acquisitionCostUSD - runningAccum);
        if (remainingToDepreciate > 0) {
          const depThisMonth = Math.min(monthlyRate, remainingToDepreciate);
          newMonthly[m] = Number(depThisMonth.toFixed(2));
          runningAccum += depThisMonth;
        } else {
          newMonthly[m] = 0;
        }
      }
    });

    setMonthlyDepreciation(newMonthly);
  };

  // Monthly change manual handler
  const handleMonthlyChange = (m: keyof FixedAssetMonthlyDepreciation, val: number) => {
    setMonthlyDepreciation(prev => ({
      ...prev,
      [m]: val
    }));
  };

  // Calculated Totals
  const totalDepreciationYear = useMemo(() => {
    return MONTHS_LIST.reduce((acc, m) => acc + (Number(monthlyDepreciation[m]) || 0), 0);
  }, [monthlyDepreciation]);

  const accumulatedDepreciationUSD = priorAccumDepreciation + totalDepreciationYear;
  const netBookValueUSD = Math.max(0, acquisitionCostUSD - accumulatedDepreciationUSD);

  // Information about starting month & duration
  const acquisitionScheduleInfo = useMemo(() => {
    const dateStr = acquisitionDate || `${year}-01-01`;
    const parts = dateStr.split('-');
    const acqYear = parseInt(parts[0], 10) || year;
    const acqMonth = Math.max(0, Math.min(11, (parseInt(parts[1], 10) || 1) - 1));
    const monthName = INDONESIAN_MONTHS[acqMonth] || 'Januari';

    if (acqYear === year) {
      const activeMonthsInYear = Math.min(12 - acqMonth, usefulLifeMonths);
      return {
        label: `Mulai Disusutkan: ${monthName} ${acqYear}`,
        detail: `${activeMonthsInYear} bulan disusutkan di tahun ${year} (dari total ${usefulLifeMonths} bulan)`,
        isCurrent: true
      };
    } else if (acqYear < year) {
      const fullYearsBetween = year - acqYear - 1;
      const priorMonths = Math.min(usefulLifeMonths, (12 - acqMonth) + (fullYearsBetween * 12));
      const remainingMonths = Math.max(0, usefulLifeMonths - priorMonths);
      const activeThisYear = Math.min(12, remainingMonths);
      return {
        label: `Perolehan Lalu: ${monthName} ${acqYear}`,
        detail: `${priorMonths} bulan telah disusutkan s/d ${year - 1}. ${activeThisYear} bulan aktif di tahun ${year}.`,
        isCurrent: false
      };
    } else {
      return {
        label: `Perolehan Masa Depan: ${monthName} ${acqYear}`,
        detail: `Aset diperoleh setelah tahun ${year}. Beban depresiasi tahun ${year} = $0.00`,
        isCurrent: false
      };
    }
  }, [acquisitionDate, year, usefulLifeMonths]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!kiNo.trim()) {
      setErrorMsg('KI NO / Kode aset wajib diisi.');
      return;
    }
    if (!invoiceNo.trim()) {
      setErrorMsg('Nomor Invoice wajib diisi.');
      return;
    }
    if (!description.trim()) {
      setErrorMsg('Description / Nama aset wajib diisi.');
      return;
    }
    if (originalCost <= 0) {
      setErrorMsg('Nilai perolehan (Acquisition cost) harus lebih dari 0.');
      return;
    }

    const coaObj = coaList.find(c => c.code === coaCode);
    const coaName = coaObj ? coaObj.name : '';

    const expCoaObj = coaList.find(c => c.code === depreciationExpenseCoaCode);
    const expCoaName = expCoaObj ? expCoaObj.name : '';

    const accCoaObj = coaList.find(c => c.code === accumulatedDepreciationCoaCode);
    const accCoaName = accCoaObj ? accCoaObj.name : '';

    onSave({
      kiNo: kiNo.trim(),
      code: kiNo.trim(),
      invoiceNo: invoiceNo.trim(),
      description: description.trim(),
      name: description.trim(),
      assetCategory: assetCategory as FixedAssetCategory,
      qty: Number(qty) || 1,
      acquisitionDate,
      deptCode,
      coaCode,
      coaName,
      currency,
      originalCost,
      rate,
      acquisitionCostUSD,
      value: originalCost,
      usd: acquisitionCostUSD,

      // Depreciation Accounts
      depreciationExpenseCoaCode,
      depreciationExpenseCoaName: expCoaName,
      accumulatedDepreciationCoaCode,
      accumulatedDepreciationCoaName: accCoaName,

      assetType,
      parentAssetId: assetType === 'CAPITALIZATION' ? parentAssetId : undefined,
      parentAssetKiNo: assetType === 'CAPITALIZATION' && selectedParent ? selectedParent.kiNo : undefined,
      parentAssetDescription: assetType === 'CAPITALIZATION' && selectedParent ? selectedParent.description : undefined,
      usefulLifeMonths,
      usefulLifeYears,

      priorAccumDepreciation,
      monthlyDepreciation,
      totalDepreciationYear,
      accumulatedDepreciationUSD,
      netBookValueUSD,

      status,
      year,
      notes: notes.trim()
    });
    onClose();
  };

  // Filtered COA lists for selectors
  const assetCoas = coaList.filter(c => c.code.startsWith('11') || c.code.startsWith('10') || c.code.startsWith('12') || c.type === 'Asset');
  const displayAssetCoas = assetCoas.length > 0 ? assetCoas : coaList;

  // Expense COAs
  const expenseCoas = coaList.filter(c => 
    c.code.startsWith('5') || c.code.startsWith('6') || c.code.startsWith('34') || c.code.startsWith('36') || c.type === 'Expense' || c.name.toLowerCase().includes('depreciation')
  );
  const displayExpenseCoas = expenseCoas.length > 0 ? expenseCoas : coaList;

  // Accumulated Depreciation COAs
  const accumDeprCoas = coaList.filter(c => 
    c.code.startsWith('112') || c.code.startsWith('122') || c.name.toLowerCase().includes('accum') || c.name.toLowerCase().includes('dep') || c.type === 'Asset'
  );
  const displayAccumCoas = accumDeprCoas.length > 0 ? accumDeprCoas : coaList;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 my-6">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold">
              <Box className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold">
                {editItem ? 'Edit Data Fixed Asset & Depresiasi' : 'Input Fixed Asset Baru & Depresiasi'}
              </h3>
              <p className="text-xs text-slate-400">
                Pencatatan aset, invoice, akun depresiasi, masa manfaat &amp; jadwal depresiasi otomatis
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[82vh] overflow-y-auto text-xs">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Section 1: Identitas & Dokumen */}
          <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200 space-y-3">
            <div className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <span>1. Identitas Aset &amp; Dokumen</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Description */}
              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">
                  Description / Nama Asset <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Contoh: CNC Milling Machine Hartford Type A, Forklift Toyota 3T, Building Extension"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              {/* Kategori Fixed Asset */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Submenu / Kategori Asset <span className="text-rose-500">*</span>
                </label>
                <select
                  value={assetCategory}
                  onChange={e => setAssetCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-indigo-300 rounded-xl font-semibold text-indigo-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
                >
                  <option value="land">Land (Tanah)</option>
                  <option value="building">Building (Gedung & Bangunan)</option>
                  <option value="vehicle">Vehicle (Kendaraan Operasional)</option>
                  <option value="electronic">Electronic (Elektronik & Mesin IT)</option>
                  <option value="software">Software (Perangkat Lunak)</option>
                  <option value="intangible_asset">Intangible Asset (Takberwujud)</option>
                  <option value="right_of_use">Right of use (Hak Guna)</option>
                </select>
              </div>

              {/* Invoice No */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Invoice No <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={invoiceNo}
                  onChange={e => setInvoiceNo(e.target.value)}
                  placeholder="INV-2026-001"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              {/* KI NO */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  KI NO <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={kiNo}
                  onChange={e => setKiNo(e.target.value)}
                  placeholder="KI-2026-001"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono font-bold text-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              {/* Qty */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Qty <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={qty}
                  onChange={e => setQty(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono font-bold text-right focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              {/* Acquisition Date */}
              <div>
                <label className="block font-bold text-slate-900 mb-1 flex items-center justify-between">
                  <span>Acquisition Date (Tgl Perolehan) <span className="text-rose-500">*</span></span>
                </label>
                <input
                  type="date"
                  required
                  value={acquisitionDate}
                  onChange={e => setAcquisitionDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-indigo-300 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer shadow-2xs"
                />
                <div className="mt-1 text-[11px] text-indigo-700 font-semibold flex items-center gap-1">
                  <Clock className="w-3 h-3 text-indigo-500" />
                  <span>{acquisitionScheduleInfo.label}</span>
                </div>
              </div>

              {/* Dept */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Department <span className="text-rose-500">*</span>
                </label>
                <select
                  value={deptCode}
                  onChange={e => handleDeptChange(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
                >
                  {departments.map(d => (
                    <option key={d.code} value={d.code}>
                      {d.code} - {d.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Year */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Tahun Budget
                </label>
                <input
                  type="number"
                  disabled
                  value={year}
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-xl font-bold text-slate-600 cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Pemilihan Akun Akuntansi (COA Asset, Beban Depresiasi, Akumulasi Depresiasi) */}
          <div className="bg-slate-50/90 p-4 rounded-2xl border border-slate-200 space-y-3">
            <div className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-indigo-600" />
              <span>2. Pemetaan Akun Akuntansi (COA Aset, Beban &amp; Akumulasi)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* COA Asset */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Akun Aset (Fixed Asset COA) <span className="text-rose-500">*</span>
                </label>
                <select
                  value={coaCode}
                  onChange={e => handleAssetCoaChange(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer text-xs font-medium"
                >
                  {displayAssetCoas.map(c => (
                    <option key={c.code} value={c.code}>
                      {c.code} - {c.name}
                    </option>
                  ))}
                </select>
                <p className="text-[10.5px] text-slate-400 mt-1">Akun neraca nilai perolehan aset</p>
              </div>

              {/* Depreciation Expense COA */}
              <div>
                <label className="block font-bold text-indigo-950 mb-1">
                  Akun Beban Depresiasi (Expense) <span className="text-rose-500">*</span>
                </label>
                <select
                  value={depreciationExpenseCoaCode}
                  onChange={e => setDepreciationExpenseCoaCode(e.target.value)}
                  className="w-full px-3 py-2 bg-indigo-50/50 border border-indigo-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer text-xs font-bold text-indigo-950"
                >
                  {displayExpenseCoas.map(c => (
                    <option key={c.code} value={c.code}>
                      {c.code} - {c.name}
                    </option>
                  ))}
                </select>
                <p className="text-[10.5px] text-indigo-600 mt-1 font-medium">Beban operasional laba rugi bulanan</p>
              </div>

              {/* Accumulated Depreciation COA */}
              <div>
                <label className="block font-bold text-amber-950 mb-1">
                  Akun Akumulasi Depresiasi <span className="text-rose-500">*</span>
                </label>
                <select
                  value={accumulatedDepreciationCoaCode}
                  onChange={e => setAccumulatedDepreciationCoaCode(e.target.value)}
                  className="w-full px-3 py-2 bg-amber-50/50 border border-amber-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none cursor-pointer text-xs font-bold text-amber-950"
                >
                  {displayAccumCoas.map(c => (
                    <option key={c.code} value={c.code}>
                      {c.code} - {c.name}
                    </option>
                  ))}
                </select>
                <p className="text-[10.5px] text-amber-700 mt-1 font-medium">Akun kontra-aset pengurang di neraca</p>
              </div>
            </div>
          </div>

          {/* Section 3: Opsi Kapitalisasi & Masa Manfaat */}
          <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-200/80 space-y-3">
            <div className="text-xs font-bold text-indigo-900 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-600" />
                <span>3. Tipe Aset &amp; Masa Manfaat (Useful Life)</span>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Asset Type Selector */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Status Perolehan Aset
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAssetType('NEW');
                      setParentAssetId('');
                      setUsefulLifeYears(4);
                      setUsefulLifeMonths(48);
                    }}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      assetType === 'NEW'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <span>Asset Baru (New)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAssetType('CAPITALIZATION');
                      if (availableParentAssets.length > 0 && !parentAssetId) {
                        handleParentChange(availableParentAssets[0].id);
                      }
                    }}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      assetType === 'CAPITALIZATION'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <LinkIcon className="w-3.5 h-3.5" />
                    <span>Kapitalisasi</span>
                  </button>
                </div>
              </div>

              {/* Useful life inputs */}
              <div>
                <label className="block font-bold text-slate-800 mb-1 text-xs">
                  Masa Manfaat (Useful Life) <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <div className="flex items-center rounded-xl border border-slate-300 bg-white overflow-hidden shadow-2xs focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500">
                      <input
                        type="number"
                        step="1"
                        min="1"
                        value={usefulLifeYears}
                        onChange={e => handleYearsChange(parseInt(e.target.value, 10) || 1)}
                        className="w-full px-3 py-2 font-bold text-slate-900 text-sm focus:outline-none bg-transparent"
                      />
                      <span className="px-3 py-2 bg-slate-100 text-slate-700 text-xs font-bold border-l border-slate-200 shrink-0 select-none">
                        Tahun
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center rounded-xl border border-slate-300 bg-slate-100/80 overflow-hidden shadow-2xs" title="Jumlah bulan otomatis dihitung: Tahun × 12">
                      <input
                        type="number"
                        readOnly
                        value={usefulLifeMonths}
                        className="w-full px-3 py-2 font-bold text-slate-700 text-sm focus:outline-none bg-transparent cursor-not-allowed select-none"
                      />
                      <span className="px-3 py-2 bg-slate-200/90 text-slate-700 text-xs font-bold border-l border-slate-300 shrink-0 select-none">
                        Bulan (×12)
                      </span>
                    </div>
                  </div>
                </div>
                <div className="mt-1 text-[11px] text-slate-500 font-medium flex items-center justify-between">
                  <span>Masa Manfaat: <strong className="text-indigo-900">{usefulLifeYears} Tahun</strong> ({usefulLifeMonths} Bulan)</span>
                  {acquisitionCostUSD > 0 && usefulLifeMonths > 0 && (
                    <span className="text-indigo-700 font-mono font-semibold">
                      ~${(acquisitionCostUSD / usefulLifeMonths).toFixed(2)}/bln
                    </span>
                  )}
                </div>
              </div>

              {/* If Capitalization: Select Parent Asset */}
              {assetType === 'CAPITALIZATION' && (
                <div className="sm:col-span-2 bg-white p-3 rounded-xl border border-indigo-200">
                  <label className="block font-bold text-indigo-950 mb-1">
                    Pilih Aset Induk (Parent Asset) yang Dikapitalisasi:
                  </label>
                  {availableParentAssets.length === 0 ? (
                    <div className="text-slate-400 italic text-[11px]">
                      Belum ada aset lain yang terdaftar sebagai aset induk. Silakan input aset utama terlebih dahulu.
                    </div>
                  ) : (
                    <select
                      value={parentAssetId}
                      onChange={e => handleParentChange(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-indigo-300 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
                    >
                      <option value="">-- Pilih Asset Induk --</option>
                      {availableParentAssets.map(a => (
                        <option key={a.id} value={a.id}>
                          {a.kiNo} - {a.description} (Acq: {a.acquisitionDate} | Cost: ${a.acquisitionCostUSD.toLocaleString('en-US', { maximumFractionDigits: 0 })} | Sisa Manfaat: {a.usefulLifeMonths} bln)
                        </option>
                      ))}
                    </select>
                  )}
                  {selectedParent && (
                    <p className="text-[11px] text-indigo-700 mt-1.5">
                      💡 Depresiasi kapitalisasi ini akan otomatis diselaraskan dengan sisa masa manfaat aset induk <strong>{selectedParent.kiNo} ({usefulLifeMonths} bulan)</strong>.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Section 4: Nilai Perolehan (Acquisition Cost) */}
          <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200 space-y-3">
            <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              4. Nilai Perolehan &amp; Kurs Valuasi USD
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Mata Uang <span className="text-rose-500">*</span>
                </label>
                <select
                  value={currency}
                  onChange={e => setCurrency(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
                >
                  <option value="IDR">IDR (Rupiah)</option>
                  <option value="USD">USD (US Dollar)</option>
                  <option value="JPY">JPY (Yen)</option>
                  <option value="CNY">CNY (Yuan)</option>
                  <option value="EUR">EUR (Euro)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nilai Perolehan ({currency}) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  required
                  value={originalCost || ''}
                  onChange={e => setOriginalCost(parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono text-right font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Acquisition Cost (USD)
                </label>
                <div className="px-3 py-2 bg-indigo-50/80 border border-indigo-200 rounded-xl font-mono font-black text-indigo-700 text-right">
                  ${acquisitionCostUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
            </div>
          </div>

          {/* Section 5: Jadwal Depresiasi (Monthly Depreciation Table) */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2">
              <div>
                <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  5. Jadwal Depresiasi Tahun {year} (Depreciation Expense Jan - Dec)
                </div>
                <div className="text-[11px] text-indigo-700 font-medium mt-0.5">
                  ✨ {acquisitionScheduleInfo.label} — {acquisitionScheduleInfo.detail}
                </div>
              </div>
              <button
                type="button"
                onClick={autoCalculateDepreciation}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 cursor-pointer self-start sm:self-auto transition shadow-xs"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Hitung Otomatis Berdasarkan Tgl Perolehan</span>
              </button>
            </div>

            {/* Prior Accum Depr */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Accumulated Depreciation (Thn {year - 1} / Sebelumnya) USD
                </label>
                <input
                  type="number"
                  step="any"
                  value={priorAccumDepreciation}
                  onChange={e => setPriorAccumDepreciation(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl font-mono text-right font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <div className="flex items-center text-slate-500 text-[11px]">
                Akumulasi penyusutan yang telah terjadi sebelum 1 Januari {year}. Dihitung otomatis dari tanggal perolehan bila aset diperoleh sebelum tahun {year}.
              </div>
            </div>

            {/* Monthly Grid (Jan..Dec) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2 pt-1">
              {MONTHS_LIST.map(m => (
                <div key={m} className="bg-slate-50 p-2 rounded-xl border border-slate-200">
                  <div className="text-[11px] font-bold text-slate-600 mb-1 text-center">
                    {m}
                  </div>
                  <input
                    type="number"
                    step="any"
                    value={monthlyDepreciation[m] || ''}
                    onChange={e => handleMonthlyChange(m, parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg font-mono text-right text-xs font-semibold focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              ))}
            </div>

            {/* Summary Depreciation Totals Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-200">
              <div className="bg-slate-100 p-2.5 rounded-xl text-center">
                <div className="text-[10px] uppercase font-bold text-slate-500">
                  Total Depreciation ({year})
                </div>
                <div className="text-sm font-black font-mono text-slate-800">
                  ${totalDepreciationYear.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 p-2.5 rounded-xl text-center">
                <div className="text-[10px] uppercase font-bold text-amber-800">
                  Ending Accumulated Depr (USD)
                </div>
                <div className="text-sm font-black font-mono text-amber-900">
                  ${accumulatedDepreciationUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl text-center">
                <div className="text-[10px] uppercase font-bold text-emerald-800">
                  Net Book Value (USD)
                </div>
                <div className="text-sm font-black font-mono text-emerald-900">
                  ${netBookValueUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
            </div>
          </div>

          {/* Section 6: Status & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Status Asset
              </label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
              >
                <option value="Active">Active (Beroperasi)</option>
                <option value="In Use">In Use (Digunakan)</option>
                <option value="Maintenance">Maintenance (Perbaikan)</option>
                <option value="Disposed">Disposed (Afkir/Dihapus)</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">
                Catatan / Lokasi / Tag
              </label>
              <input
                type="text"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Serial number, line produksi, supplier, PO number..."
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer font-semibold"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-md shadow-indigo-600/20 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Fixed Asset</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
