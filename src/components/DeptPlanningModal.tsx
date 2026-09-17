import React, { useState, useEffect, useMemo } from 'react';
import { X, Check, Calculator, Info, Search, Lock } from 'lucide-react';
import { AppUser, COA, Department, DeptPlanningItem, DeptPlanningSection, ExchangeRates, MonthlyDistribution } from '../types';
import { DP_MONTHS } from '../constants/defaultData';
import { calculateTotalUSD, getNextDeptPlanningCode, getRateForCurrency } from '../utils/formatters';

interface DeptPlanningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: DeptPlanningItem) => void;
  departments: Department[];
  coaList: COA[];
  ratesByYear: Record<string, ExchangeRates>;
  existingItems: DeptPlanningItem[];
  editingItem: DeptPlanningItem | null;
  initialSection?: DeptPlanningSection;
  currentUser?: AppUser | null;
}

export const DeptPlanningModal: React.FC<DeptPlanningModalProps> = ({
  isOpen,
  onClose,
  onSave,
  departments,
  coaList,
  ratesByYear,
  existingItems,
  editingItem,
  initialSection = 'budget',
  currentUser
}) => {
  const currentYear = new Date().getFullYear();
  const isDeptRestricted = currentUser?.role === 'dept_user' && !!currentUser?.deptCode;
  const userDeptCode = isDeptRestricted ? currentUser.deptCode! : '';

  const [section, setSection] = useState<DeptPlanningSection>(initialSection);
  const [year, setYear] = useState<number>(currentYear);
  const [deptCode, setDeptCode] = useState<string>('');
  const [code, setCode] = useState<string>('');
  const [accountNo, setAccountNo] = useState<string>('');
  const [accountName, setAccountName] = useState<string>('');
  const [item, setItem] = useState<string>('');
  const [type, setType] = useState<string>('expense');
  const [costCategory, setCostCategory] = useState<string>('variable cost');
  const [budgetStartDate, setBudgetStartDate] = useState<string>('');
  const [indicatorDate, setIndicatorDate] = useState<string>('');
  const [businessFunction, setBusinessFunction] = useState<string>('rutin');
  const [currency, setCurrency] = useState<string>('USD');
  const [amount, setAmount] = useState<number>(0);
  const [rate, setRate] = useState<number>(1);
  const [customRate, setCustomRate] = useState<boolean>(false);
  const [monthly, setMonthly] = useState<MonthlyDistribution>({
    Jan: 0, Feb: 0, Mar: 0, Apr: 0, Mei: 0, Jun: 0,
    Jul: 0, Agu: 0, Sep: 0, Okt: 0, Nov: 0, Des: 0
  });

  const [coaSearch, setCoaSearch] = useState<string>('');
  const [showCoaDropdown, setShowCoaDropdown] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Set initial department if empty or restricted
  useEffect(() => {
    if (isDeptRestricted) {
      setDeptCode(userDeptCode);
    } else if (!deptCode && departments.length > 0) {
      setDeptCode(departments[0].code);
    }
  }, [departments, deptCode, isDeptRestricted, userDeptCode]);

  // Initialize or reset form when modal opens or editingItem changes
  useEffect(() => {
    if (editingItem) {
      setSection(editingItem.section);
      setYear(editingItem.year || currentYear);
      setDeptCode(isDeptRestricted ? userDeptCode : editingItem.deptCode);
      setCode(editingItem.code);
      setAccountNo(editingItem.accountNo);
      setAccountName(editingItem.accountName);
      setItem(editingItem.item);
      setType(editingItem.type || 'expense');
      setCostCategory(editingItem.costCategory || 'variable cost');
      setBudgetStartDate(editingItem.budgetStartDate || '');
      setIndicatorDate(editingItem.indicatorDate || '');
      setBusinessFunction(editingItem.businessFunction || 'rutin');
      setCurrency(editingItem.currency || 'USD');
      setAmount(editingItem.amount || 0);
      setRate(editingItem.rate || 1);
      setMonthly(editingItem.monthly ? { ...editingItem.monthly } : {
        Jan: 0, Feb: 0, Mar: 0, Apr: 0, Mei: 0, Jun: 0,
        Jul: 0, Agu: 0, Sep: 0, Okt: 0, Nov: 0, Des: 0
      });
      setCustomRate(false);
      setErrorMessage('');
    } else if (isOpen) {
      const activeDept = isDeptRestricted ? userDeptCode : (deptCode || (departments[0] ? departments[0].code : 'ACC'));
      setSection(initialSection);
      setYear(currentYear);
      setDeptCode(activeDept);
      setAccountNo(coaList[0]?.code || '5500001');
      setAccountName(coaList[0]?.name || 'Direct labor cost-Sal&Wages');
      setItem('');
      setType('expense');
      setCostCategory('variable cost');
      const todayIso = new Date().toISOString().substring(0, 10);
      setBudgetStartDate(todayIso);
      setIndicatorDate(todayIso);
      setBusinessFunction('rutin');
      setCurrency('USD');
      setAmount(0);
      setCustomRate(false);
      setMonthly({
        Jan: 0, Feb: 0, Mar: 0, Apr: 0, Mei: 0, Jun: 0,
        Jul: 0, Agu: 0, Sep: 0, Okt: 0, Nov: 0, Des: 0
      });
      const generated = getNextDeptPlanningCode(initialSection as DeptPlanningSection, activeDept, existingItems);
      setCode(generated);
      setErrorMessage('');
    }
  }, [isOpen, editingItem, initialSection, isDeptRestricted, userDeptCode]);

  // Update auto code when section or department changes (if not editing an existing item with established code)
  useEffect(() => {
    if (!editingItem && deptCode) {
      const nextCode = getNextDeptPlanningCode(section, deptCode, existingItems);
      setCode(nextCode);
    }
  }, [section, deptCode, editingItem, existingItems]);

  // Recalculate exchange rate when currency or year changes
  useEffect(() => {
    if (!customRate) {
      const r = getRateForCurrency(currency, year, ratesByYear);
      setRate(r);
    }
  }, [currency, year, ratesByYear, customRate]);

  // Calculate live Total USD
  const totalUSD = useMemo(() => {
    return calculateTotalUSD(amount, currency, rate);
  }, [amount, currency, rate]);

  // Calculate sum of monthly distributions
  const monthlyTotal = useMemo(() => {
    return DP_MONTHS.reduce<number>((sum, m) => sum + (Number(monthly[m]) || 0), 0);
  }, [monthly]);

  // Filter COA for search dropdown
  const filteredCOA = useMemo(() => {
    if (!coaSearch.trim()) return coaList.slice(0, 15);
    const q = coaSearch.toLowerCase().trim();
    return coaList.filter(c =>
      c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q)
    ).slice(0, 20);
  }, [coaList, coaSearch]);

  const handleSelectCOA = (coa: COA) => {
    setAccountNo(coa.code);
    setAccountName(coa.name);
    setShowCoaDropdown(false);
    setCoaSearch('');
  };

  const handleMonthlyChange = (m: keyof MonthlyDistribution, valStr: string) => {
    const val = parseFloat(valStr) || 0;
    setMonthly(prev => ({
      ...prev,
      [m]: Math.max(0, val)
    }));
  };

  const handleDistributeEvenly = () => {
    const targetAmt = totalUSD > 0 ? totalUSD : amount;
    const perMonth = parseFloat((targetAmt / 12).toFixed(2));
    const remainder = parseFloat((targetAmt - perMonth * 11).toFixed(2));

    const newDist: MonthlyDistribution = {
      Jan: perMonth, Feb: perMonth, Mar: perMonth, Apr: perMonth,
      Mei: perMonth, Jun: perMonth, Jul: perMonth, Agu: perMonth,
      Sep: perMonth, Okt: perMonth, Nov: perMonth, Des: remainder
    };
    setMonthly(newDist);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!item.trim()) {
      setErrorMessage('Item Budget wajib diisi.');
      return;
    }

    const matchedDept = departments.find(d => d.code === deptCode);
    const deptName = matchedDept ? matchedDept.name : deptCode;

    const finalCode = code.trim() || getNextDeptPlanningCode(section, deptCode, existingItems, editingItem?.id);
    const finalAccountNo = accountNo.trim() || 'COA-000';
    const finalAccountName = accountName.trim() || 'General Expense';

    const newItem: DeptPlanningItem = {
      id: editingItem ? editingItem.id : `dp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      code: finalCode,
      section,
      year: Number(year) || currentYear,
      deptCode: deptCode.toUpperCase(),
      deptName,
      accountNo: finalAccountNo,
      accountName: finalAccountName,
      item: item.trim(),
      type,
      costCategory,
      budgetStartDate,
      indicatorDate,
      businessFunction,
      currency: currency.toUpperCase(),
      amount: Math.max(0, Number(amount) || 0),
      rate: Number(rate) || 1,
      totalUSD: Number(totalUSD.toFixed(2)),
      monthlyTotalUSD: Number(monthlyTotal.toFixed(2)),
      monthly,
      updatedAt: new Date().toISOString()
    };

    onSave(newItem);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div id="deptPlanningModal" className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div>
            <h2 id="deptPlanningModalTitle" className="text-lg font-bold flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${
                section === 'budget' ? 'bg-indigo-400' : section === 'costdown' ? 'bg-emerald-400' : 'bg-amber-400'
              }`}></span>
              {editingItem ? 'Edit Data Dept Planning' : 'Tambah Data Dept Planning'}
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">
              Simpan data ke target section: <strong>{section === 'budget' ? 'A. BUDGET' : section === 'costdown' ? 'B. COST DOWN' : 'C. PLAN'}</strong>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
            title="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <form onSubmit={handleSubmit} className="p-6 max-h-[80vh] overflow-y-auto space-y-6">
          {errorMessage && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-sm flex items-center gap-2">
              <Info className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Section Selection Banner */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Pilih Target Section
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setSection('budget')}
                className={`px-4 py-3 rounded-xl border text-sm font-semibold flex items-center justify-between transition ${
                  section === 'budget'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span>A. BUDGET</span>
                {section === 'budget' && <Check className="w-4 h-4 text-white" />}
              </button>

              <button
                type="button"
                onClick={() => setSection('costdown')}
                className={`px-4 py-3 rounded-xl border text-sm font-semibold flex items-center justify-between transition ${
                  section === 'costdown'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span>B. COST DOWN</span>
                {section === 'costdown' && <Check className="w-4 h-4 text-white" />}
              </button>

              <button
                type="button"
                onClick={() => setSection('plan')}
                className={`px-4 py-3 rounded-xl border text-sm font-semibold flex items-center justify-between transition ${
                  section === 'plan'
                    ? 'bg-amber-600 text-white border-amber-600 shadow-md'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span>C. PLAN</span>
                {section === 'plan' && <Check className="w-4 h-4 text-white" />}
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Data yang Anda input akan langsung muncul di tabel <strong>{section === 'budget' ? 'A. BUDGET' : section === 'costdown' ? 'B. COST DOWN' : 'C. PLAN'}</strong> setelah tombol Simpan Data ditekan.
            </p>
          </div>

          {/* Primary Data Fields */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Year */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Tahun</label>
              <input
                id="dpy"
                type="number"
                min="2000"
                max="2100"
                value={year}
                onChange={e => setYear(Number(e.target.value) || currentYear)}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            {/* Department */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Department {isDeptRestricted && <span className="text-indigo-600 font-bold">(Terkunci)</span>}
              </label>
              {isDeptRestricted ? (
                <div className="flex items-center gap-2 px-3 py-2 border border-slate-300 rounded-lg text-sm bg-slate-100 font-bold text-slate-800">
                  <Lock className="w-3.5 h-3.5 text-indigo-600" />
                  <span>{userDeptCode} - {departments.find(d => d.code === userDeptCode)?.name || userDeptCode}</span>
                </div>
              ) : (
                <select
                  id="dpd"
                  value={deptCode}
                  onChange={e => setDeptCode(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  {departments.map(d => (
                    <option key={d.code} value={d.code}>
                      {d.code} - {d.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Code Budget */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Code Budget</label>
              <input
                id="dpc"
                type="text"
                value={code}
                onChange={e => setCode(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-slate-50 font-bold text-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                placeholder="BDACC-001"
              />
              <span className="text-[11px] text-slate-400">Kode otomatis (dapat diubah manual jika perlu)</span>
            </div>

            {/* Account Selector (COA) */}
            <div className="md:col-span-3 relative">
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">Account (Chart of Accounts)</label>
                <button
                  type="button"
                  onClick={() => setShowCoaDropdown(!showCoaDropdown)}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
                >
                  <Search className="w-3.5 h-3.5" />
                  {showCoaDropdown ? 'Tutup Daftar COA' : 'Cari dari Master COA'}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <input
                    id="dpano"
                    type="text"
                    value={accountNo}
                    onChange={e => setAccountNo(e.target.value)}
                    onFocus={() => setShowCoaDropdown(true)}
                    placeholder="Account No (contoh: 5500001)"
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <input
                    id="dpan"
                    type="text"
                    value={accountName}
                    onChange={e => setAccountName(e.target.value)}
                    onFocus={() => setShowCoaDropdown(true)}
                    placeholder="Account Name (contoh: Direct labor cost-Sal&Wages)"
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* COA Quick Picker Dropdown */}
              {showCoaDropdown && (
                <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-slate-300 rounded-xl shadow-xl max-h-56 overflow-y-auto p-2">
                  <div className="sticky top-0 bg-white pb-2 border-b border-slate-100">
                    <input
                      type="text"
                      value={coaSearch}
                      onChange={e => setCoaSearch(e.target.value)}
                      placeholder="Cari kode atau nama akun COA..."
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      autoFocus
                    />
                  </div>
                  <div className="divide-y divide-slate-100 pt-1">
                    {filteredCOA.length > 0 ? (
                      filteredCOA.map(c => (
                        <div
                          key={c.code}
                          onClick={() => handleSelectCOA(c)}
                          className="px-3 py-2 hover:bg-indigo-50 cursor-pointer flex justify-between items-center text-xs rounded transition"
                        >
                          <div>
                            <span className="font-mono font-bold text-indigo-700 mr-2">{c.code}</span>
                            <span className="text-slate-800">{c.name}</span>
                          </div>
                          {c.nature && (
                            <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold ${
                              c.nature === 'debit' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                            }`}>
                              {c.nature}
                            </span>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400 p-2 text-center">Akun COA tidak ditemukan.</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Item Budget */}
            <div className="md:col-span-3">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Item Budget / Deskripsi</label>
              <input
                id="dpitem"
                type="text"
                value={item}
                onChange={e => setItem(e.target.value)}
                required
                placeholder="Contoh: Pembelian spareparts mesin bubut CNC"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            {/* Type */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Type</label>
              <select
                id="dptype"
                value={type}
                onChange={e => setType(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="expense">Expense</option>
                <option value="asset">Asset</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Cost Category */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Cost Category</label>
              <select
                id="dpcc"
                value={costCategory}
                onChange={e => setCostCategory(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="variable cost">Variable Cost</option>
                <option value="fixed cost">Fixed Cost</option>
              </select>
            </div>

            {/* Business Function */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Business Function</label>
              <select
                id="dpbf"
                value={businessFunction}
                onChange={e => setBusinessFunction(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="rutin">Rutin</option>
                <option value="tidak rutin">Tidak Rutin</option>
              </select>
            </div>

            {/* Budget Start Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Budget Start Date</label>
              <input
                id="dpbsd"
                type="date"
                value={budgetStartDate}
                onChange={e => setBudgetStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            {/* Indicator Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Indicator Date</label>
              <input
                id="dpidate"
                type="date"
                value={indicatorDate}
                onChange={e => setIndicatorDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            {/* Currency */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Currency</label>
              <select
                id="dpcurr"
                value={currency}
                onChange={e => {
                  setCurrency(e.target.value);
                  setCustomRate(false);
                }}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="USD">USD ($)</option>
                <option value="IDR">IDR (Rp)</option>
                <option value="JPY">JPY (¥)</option>
                <option value="CNY">CNY (¥)</option>
                <option value="EUR">EUR (€)</option>
              </select>
            </div>

            {/* Amount */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Amount ({currency})</label>
              <input
                id="dpamount"
                type="number"
                min="0"
                step="any"
                value={amount}
                onChange={e => setAmount(parseFloat(e.target.value) || 0)}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            {/* Rate Konversi */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-semibold text-slate-700">Rate Konversi</label>
                <button
                  type="button"
                  onClick={() => setCustomRate(!customRate)}
                  className="text-[11px] text-indigo-600 hover:underline"
                >
                  {customRate ? 'Gunakan Rate Otomatis' : 'Ubah Manual'}
                </button>
              </div>
              <input
                id="dprate"
                type="number"
                step="any"
                value={rate}
                readOnly={!customRate}
                onChange={e => setRate(parseFloat(e.target.value) || 1)}
                className={`w-full px-3 py-2 border border-slate-300 rounded-lg text-sm ${
                  customRate ? 'bg-white' : 'bg-slate-100 text-slate-600'
                }`}
              />
              <span className="text-[11px] text-emerald-600">
                {currency === 'USD' ? 'USD = 1 (mata uang dasar)' : `1 USD = ${rate} ${currency}`}
              </span>
            </div>

            {/* Total USD */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Total USD</label>
              <div className="w-full px-3 py-2 bg-indigo-50 border border-indigo-200 rounded-lg text-sm font-bold text-indigo-800">
                ${totalUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <span className="text-[11px] text-slate-400">Hasil konversi Amount ÷ Rate</span>
            </div>
          </div>

          {/* 12-Month Distribution Grid */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
              <div>
                <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  <Calculator className="w-4 h-4 text-indigo-600" />
                  Rencana / Distribusi Bulanan (USD)
                </h4>
                <p className="text-xs text-slate-500">
                  Masukkan target per bulan (dalam USD) atau klik bagi rata dari Total USD.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDistributeEvenly}
                  className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold border border-indigo-200 transition flex items-center gap-1"
                >
                  <Calculator className="w-3.5 h-3.5" />
                  Bagi Rata (12 Bulan)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2.5 pt-1">
              {DP_MONTHS.map(m => (
                <div key={m} className="bg-white p-2 rounded-lg border border-slate-200">
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">{m}</label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={monthly[m] || 0}
                    onChange={e => handleMonthlyChange(m, e.target.value)}
                    className="w-full p-1.5 border border-slate-300 rounded text-xs text-right font-medium focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-slate-200 text-xs">
              <span className="text-slate-500">
                Total Distribusi: <strong className="text-slate-800">${monthlyTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
              </span>
              {Math.abs(monthlyTotal - totalUSD) > 0.1 && totalUSD > 0 && (
                <span className="text-amber-600 text-[11px]">
                  (Selisih dengan Total USD: ${(monthlyTotal - totalUSD).toFixed(2)})
                </span>
              )}
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 text-sm font-medium transition"
            >
              Batal
            </button>
            <button
              id="saveDP"
              type="submit"
              className="px-6 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md transition flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              {editingItem ? 'Update Data' : 'Simpan Data'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
