import React, { useState, useEffect, useMemo } from 'react';
import { X, Check, Search, Calendar, DollarSign, Info, Lock } from 'lucide-react';
import { AppUser, BudgetRealization, COA, Department, DeptPlanningItem, ExchangeRates } from '../types';
import { DP_MONTHS } from '../constants/defaultData';
import { calculateTotalUSD, getRateForCurrency } from '../utils/formatters';

interface RealisasiModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (realization: BudgetRealization) => void;
  departments: Department[];
  coaList: COA[];
  budgetItems: DeptPlanningItem[];
  ratesByYear: Record<string, ExchangeRates>;
  editingRealization: BudgetRealization | null;
  defaultYear?: number;
  defaultDept?: string;
  currentUser?: AppUser | null;
}

export const RealisasiModal: React.FC<RealisasiModalProps> = ({
  isOpen,
  onClose,
  onSave,
  departments,
  coaList,
  budgetItems,
  ratesByYear,
  editingRealization,
  defaultYear = 2026,
  defaultDept = 'ACC',
  currentUser
}) => {
  const isDeptRestricted = currentUser?.role === 'dept_user' && !!currentUser?.deptCode;
  const userDeptCode = isDeptRestricted ? currentUser.deptCode! : (defaultDept || 'ACC');

  const todayStr = new Date().toISOString().substring(0, 10);

  const [date, setDate] = useState<string>(todayStr);
  const [deptCode, setDeptCode] = useState<string>(userDeptCode);
  const [accountNo, setAccountNo] = useState<string>('6010012');
  const [accountName, setAccountName] = useState<string>('G&A - Consultant fee');
  const [month, setMonth] = useState<string>('Jul');
  const [name, setName] = useState<string>('');
  const [type, setType] = useState<string>('Expense');
  const [reason, setReason] = useState<string>('');
  const [currency, setCurrency] = useState<string>('IDR');
  const [price, setPrice] = useState<number>(0);
  const [rate, setRate] = useState<number>(16273.56);
  const [customRate, setCustomRate] = useState<boolean>(false);
  const [year, setYear] = useState<number>(defaultYear);

  const [coaSearch, setCoaSearch] = useState<string>('');
  const [showCoaDropdown, setShowCoaDropdown] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Auto-detect month from date
  const updateMonthFromDate = (dateVal: string) => {
    if (!dateVal) return;
    const d = new Date(dateVal);
    if (!isNaN(d.getTime())) {
      const monthIdx = d.getMonth();
      if (monthIdx >= 0 && monthIdx < DP_MONTHS.length) {
        setMonth(DP_MONTHS[monthIdx]);
      }
      setYear(d.getFullYear());
    }
  };

  // Accounts that currently have budget in Dept Planning (recommended accounts)
  const budgetedAccounts = useMemo(() => {
    const map = new Map<string, { code: string; name: string }>();
    budgetItems.forEach(item => {
      if (item.section === 'budget' && item.accountNo) {
        map.set(item.accountNo, {
          code: item.accountNo,
          name: item.accountName || item.item
        });
      }
    });
    return Array.from(map.values());
  }, [budgetItems]);

  // Filtered COA list
  const filteredCOA = useMemo(() => {
    if (!coaSearch.trim()) return coaList.slice(0, 15);
    const q = coaSearch.toLowerCase().trim();
    return coaList.filter(c =>
      c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q)
    ).slice(0, 20);
  }, [coaList, coaSearch]);

  useEffect(() => {
    if (editingRealization) {
      setDate(editingRealization.date);
      setDeptCode(editingRealization.deptCode);
      setAccountNo(editingRealization.accountNo);
      setAccountName(editingRealization.accountName);
      setMonth(editingRealization.month);
      setName(editingRealization.name);
      setType(editingRealization.type || 'Expense');
      setReason(editingRealization.reason || '');
      setCurrency(editingRealization.currency || 'IDR');
      setPrice(editingRealization.price || 0);
      setRate(editingRealization.rate || 1);
      setYear(editingRealization.year || defaultYear);
      setCustomRate(false);
      setErrorMsg('');
    } else if (isOpen) {
      setDate(todayStr);
      updateMonthFromDate(todayStr);
      setDeptCode(defaultDept || (departments[0]?.code || 'ACC'));
      if (budgetedAccounts.length > 0) {
        setAccountNo(budgetedAccounts[0].code);
        setAccountName(budgetedAccounts[0].name);
      } else if (coaList.length > 0) {
        setAccountNo(coaList[0].code);
        setAccountName(coaList[0].name);
      }
      setName('');
      setType('Expense');
      setReason('');
      setCurrency('IDR');
      setPrice(0);
      setCustomRate(false);
      setErrorMsg('');
    }
  }, [isOpen, editingRealization]);

  // Recalculate exchange rate when currency or year changes
  useEffect(() => {
    if (!customRate) {
      const r = getRateForCurrency(currency, year, ratesByYear);
      setRate(r);
    }
  }, [currency, year, ratesByYear, customRate]);

  // Calculate live price in USD
  const priceUSD = useMemo(() => {
    return calculateTotalUSD(price, currency, rate);
  }, [price, currency, rate]);

  const handleSelectCOA = (c: { code: string; name: string }) => {
    setAccountNo(c.code);
    setAccountName(c.name);
    setShowCoaDropdown(false);
    setCoaSearch('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim()) {
      setErrorMsg('Nama transaksi / pengeluaran wajib diisi.');
      return;
    }

    if (price <= 0) {
      setErrorMsg('Harga / nominal pengeluaran harus lebih besar dari 0.');
      return;
    }

    const newRealization: BudgetRealization = {
      id: editingRealization ? editingRealization.id : `real_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      date,
      deptCode: deptCode.toUpperCase(),
      accountNo: accountNo.trim() || 'COA-000',
      accountName: accountName.trim() || 'General Expense',
      month,
      name: name.trim(),
      type: type || 'Expense',
      reason: reason.trim(),
      currency: currency.toUpperCase(),
      price: Math.max(0, Number(price) || 0),
      rate: Number(rate) || 1,
      priceUSD: Number(priceUSD.toFixed(2)),
      year: Number(year) || defaultYear,
      createdAt: editingRealization?.createdAt || new Date().toISOString()
    };

    onSave(newRealization);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div id="realisasiModal" className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-400"></span>
              {editingRealization ? 'Edit Realisasi Penggunaan Budget' : 'Catat Penggunaan Budget (Realisasi)'}
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">
              Realisasi dicatat berdasarkan No Akun yang mempunyai anggaran pada A. BUDGET di Dept Planning.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
            title="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 max-h-[80vh] overflow-y-auto space-y-4">
          {errorMsg && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-sm flex items-center gap-2">
              <Info className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Tanggal */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Tanggal Transaksi</label>
              <input
                type="date"
                required
                value={date}
                onChange={e => {
                  setDate(e.target.value);
                  updateMonthFromDate(e.target.value);
                }}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            {/* Department */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Department {isDeptRestricted && <span className="text-emerald-600 font-bold">(Terkunci)</span>}
              </label>
              {isDeptRestricted ? (
                <div className="flex items-center gap-2 px-3 py-2 border border-slate-300 rounded-lg text-sm bg-slate-100 font-bold text-slate-800">
                  <Lock className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{userDeptCode} - {departments.find(d => d.code === userDeptCode)?.name || userDeptCode}</span>
                </div>
              ) : (
                <select
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

            {/* Bulan */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Bulan Alokasi</label>
              <select
                value={month}
                onChange={e => setMonth(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                {DP_MONTHS.map(m => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            {/* No Akun & Nama Akun Selector */}
            <div className="md:col-span-3 relative">
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">
                  No Akun &amp; Nama Akun (Master COA / Budget Terdaftar)
                </label>
                <button
                  type="button"
                  onClick={() => setShowCoaDropdown(!showCoaDropdown)}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1 cursor-pointer"
                >
                  <Search className="w-3.5 h-3.5" />
                  {showCoaDropdown ? 'Tutup Pilihan COA' : 'Pilih dari COA'}
                </button>
              </div>

              {/* Quick suggestions from budgeted accounts */}
              {budgetedAccounts.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 mb-2">
                  <span className="text-[11px] text-slate-500">Akun beranggaran:</span>
                  {budgetedAccounts.slice(0, 5).map(acc => (
                    <button
                      key={acc.code}
                      type="button"
                      onClick={() => handleSelectCOA(acc)}
                      className={`text-[11px] px-2 py-0.5 rounded-full border transition cursor-pointer ${
                        accountNo === acc.code
                          ? 'bg-indigo-600 text-white border-indigo-600 font-bold'
                          : 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
                      }`}
                    >
                      {acc.code} - {acc.name}
                    </button>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  type="text"
                  required
                  value={accountNo}
                  onChange={e => setAccountNo(e.target.value)}
                  onFocus={() => setShowCoaDropdown(true)}
                  placeholder="No Akun (contoh: 6010012)"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
                <input
                  type="text"
                  required
                  value={accountName}
                  onChange={e => setAccountName(e.target.value)}
                  onFocus={() => setShowCoaDropdown(true)}
                  placeholder="Nama Akun (contoh: G&A - Consultant fee)"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              {/* COA Dropdown */}
              {showCoaDropdown && (
                <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-slate-300 rounded-xl shadow-xl max-h-56 overflow-y-auto p-2">
                  <div className="sticky top-0 bg-white pb-2 border-b border-slate-100">
                    <input
                      type="text"
                      value={coaSearch}
                      onChange={e => setCoaSearch(e.target.value)}
                      placeholder="Cari kode atau nama akun..."
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
                            <span className="px-1.5 py-0.5 rounded text-[10px] uppercase font-bold bg-slate-100 text-slate-600">
                              {c.nature}
                            </span>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400 p-2 text-center">Akun tidak ditemukan.</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Nama Transaksi */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Pengeluaran / Item</label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Contoh: OPE Audit Mennix (Hotel)"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none font-medium"
              />
            </div>

            {/* Type */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Type</label>
              <select
                value={type}
                onChange={e => setType(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="Expense">Expense</option>
                <option value="Asset">Asset</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Alasan / Catatan */}
            <div className="md:col-span-3">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Alasan / Rincian Keterangan</label>
              <textarea
                rows={2}
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="Contoh: Hotel untuk Auditor (8 hari @2kamar @650K)"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            {/* Currency */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Currency</label>
              <select
                value={currency}
                onChange={e => {
                  setCurrency(e.target.value);
                  setCustomRate(false);
                }}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="IDR">IDR (Rp)</option>
                <option value="USD">USD ($)</option>
                <option value="JPY">JPY (¥)</option>
                <option value="CNY">CNY (¥)</option>
                <option value="EUR">EUR (€)</option>
              </select>
            </div>

            {/* Harga (Original) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Harga ({currency})</label>
              <input
                type="number"
                min="0"
                step="any"
                required
                value={price || ''}
                onChange={e => setPrice(parseFloat(e.target.value) || 0)}
                placeholder="0"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            {/* Harga USD (Calculated) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Harga USD</label>
              <div className="w-full px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg text-sm font-bold text-emerald-800 flex items-center justify-between">
                <span>${priceUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                <span className="text-[10px] text-emerald-600 font-normal">Rate: {rate}</span>
              </div>
            </div>
          </div>

          {/* Rate helper */}
          <div className="flex justify-between items-center text-xs text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
            <span>
              Kurs Konversi: <strong>1 USD = {rate} {currency}</strong>
            </span>
            <button
              type="button"
              onClick={() => setCustomRate(!customRate)}
              className="text-indigo-600 hover:underline cursor-pointer font-medium"
            >
              {customRate ? 'Kembalikan ke Rate Otomatis' : 'Ubah Rate Manual'}
            </button>
          </div>
          {customRate && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Rate Manual</label>
              <input
                type="number"
                step="any"
                value={rate}
                onChange={e => setRate(parseFloat(e.target.value) || 1)}
                className="w-full sm:w-60 px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 text-sm font-medium transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{editingRealization ? 'Update Realisasi' : 'Simpan Realisasi'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
