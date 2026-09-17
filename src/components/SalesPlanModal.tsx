import React, { useState, useEffect } from 'react';
import { COA, Department, ExchangeRates, MonthlyDistribution, SalesPlanItem } from '../types';
import { DP_MONTHS } from '../constants/defaultData';
import { X, Save, AlertCircle, TrendingUp, Calculator } from 'lucide-react';

interface SalesPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: Partial<SalesPlanItem>) => void;
  editItem?: SalesPlanItem | null;
  departments: Department[];
  coaList: COA[];
  ratesByYear: Record<string, ExchangeRates>;
  defaultDept?: string;
  defaultYear?: number;
}

const DEFAULT_MONTHLY: MonthlyDistribution = {
  Jan: 0, Feb: 0, Mar: 0, Apr: 0, Mei: 0, Jun: 0,
  Jul: 0, Agu: 0, Sep: 0, Okt: 0, Nov: 0, Des: 0
};

export const SalesPlanModal: React.FC<SalesPlanModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editItem,
  departments,
  coaList,
  ratesByYear,
  defaultDept = 'ACC',
  defaultYear = 2026
}) => {
  const [deptCode, setDeptCode] = useState<string>(defaultDept);
  const [customer, setCustomer] = useState<string>('');
  const [item, setItem] = useState<string>('');
  const [coaCode, setCoaCode] = useState<string>('3000004');
  const [currency, setCurrency] = useState<string>('USD');
  const [year, setYear] = useState<number>(defaultYear);
  const [status, setStatus] = useState<string>('Approved');
  const [notes, setNotes] = useState<string>('');
  const [monthly, setMonthly] = useState<MonthlyDistribution>({ ...DEFAULT_MONTHLY });
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Pre-fill when editing
  useEffect(() => {
    if (editItem) {
      setDeptCode(editItem.deptCode || defaultDept);
      setCustomer(editItem.customer || '');
      setItem(editItem.item || '');
      setCoaCode(editItem.coaCode || '3000004');
      setCurrency(editItem.currency || 'USD');
      setYear(editItem.year || defaultYear);
      setStatus(editItem.status || 'Approved');
      setNotes(editItem.notes || '');
      setMonthly(editItem.monthly ? { ...editItem.monthly } : { ...DEFAULT_MONTHLY });
    } else {
      setDeptCode(defaultDept);
      setCustomer('');
      setItem('');
      setCoaCode('3000004');
      setCurrency('USD');
      setYear(defaultYear);
      setStatus('Approved');
      setNotes('');
      setMonthly({ ...DEFAULT_MONTHLY });
    }
    setErrorMsg('');
  }, [editItem, isOpen, defaultDept, defaultYear]);

  if (!isOpen) return null;

  // Calculate total in local currency and USD
  const sumLocal: number = (Object.values(monthly) as number[]).reduce((acc: number, val: number) => acc + (Number(val) || 0), 0);
  const currentRates = ratesByYear[String(year)] || { IDR: 16273.56, JPY: 142.54, CNY: 0.14, EUR: 0.92 };

  let rate = 1;
  if (currency === 'USD') {
    rate = 1;
  } else if (currency === 'IDR') {
    rate = currentRates.IDR || 16273.56;
  } else if (currency === 'JPY') {
    rate = currentRates.JPY || 142.54;
  } else if (currency === 'CNY') {
    rate = currentRates.CNY || 0.14;
  } else if (currency === 'EUR') {
    rate = currentRates.EUR || 0.92;
  }

  const calculatedUSD: number = currency === 'USD' ? sumLocal : sumLocal / (rate || 1);

  const handleMonthChange = (m: keyof MonthlyDistribution, valStr: string) => {
    const num = parseFloat(valStr) || 0;
    setMonthly(prev => ({ ...prev, [m]: num }));
  };

  const handleDistributeEvenly = () => {
    const totalPrompt = prompt('Masukkan total nilai penjualan untuk dibagi rata 12 bulan:');
    if (!totalPrompt) return;
    const totalVal = parseFloat(totalPrompt);
    if (isNaN(totalVal) || totalVal <= 0) return;

    const perMonth = parseFloat((totalVal / 12).toFixed(2));
    const newMonthly: MonthlyDistribution = {
      Jan: perMonth, Feb: perMonth, Mar: perMonth, Apr: perMonth,
      Mei: perMonth, Jun: perMonth, Jul: perMonth, Agu: perMonth,
      Sep: perMonth, Okt: perMonth, Nov: perMonth, Des: perMonth
    };
    setMonthly(newMonthly);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer.trim()) {
      setErrorMsg('Nama customer wajib diisi.');
      return;
    }
    if (!item.trim()) {
      setErrorMsg('Nama item / produk wajib diisi.');
      return;
    }

    const coaObj = coaList.find(c => c.code === coaCode);
    const coaName = coaObj ? coaObj.name : '';

    onSave({
      deptCode,
      customer: customer.trim(),
      item: item.trim(),
      coaCode,
      coaName,
      currency,
      year,
      rate,
      monthly,
      totalUSD: calculatedUSD,
      status,
      notes: notes.trim()
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 my-8">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold">
                {editItem ? 'Edit Rencana Penjualan (Sales Plan)' : 'Tambah Sales Plan Baru'}
              </h3>
              <p className="text-xs text-slate-400">
                Lengkapi rincian target customer, akun COA, dan alokasi per bulan
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
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Grid Basic Info */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Department */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Department <span className="text-rose-500">*</span>
              </label>
              <select
                value={deptCode}
                onChange={e => setDeptCode(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
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
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tahun <span className="text-rose-500">*</span>
              </label>
              <select
                value={year}
                onChange={e => setYear(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
              >
                <option value={2026}>2026</option>
                <option value={2025}>2025</option>
                <option value={2027}>2027</option>
              </select>
            </div>

            {/* Currency */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mata Uang <span className="text-rose-500">*</span>
              </label>
              <select
                value={currency}
                onChange={e => setCurrency(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
              >
                <option value="USD">USD ($)</option>
                <option value="IDR">IDR (Rp)</option>
                <option value="JPY">JPY (¥)</option>
                <option value="CNY">CNY (¥)</option>
                <option value="EUR">EUR (€)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Customer */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Customer / Klien <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={customer}
                onChange={e => setCustomer(e.target.value)}
                placeholder="Contoh: PT Astra Honda Motor, Jatco, dll."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            {/* Item */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Item / Produk Penjualan <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={item}
                onChange={e => setItem(e.target.value)}
                placeholder="Contoh: Part Stator Core 150cc, Shaft Driven, dll."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* COA */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Bagan Akun (COA)
              </label>
              <select
                value={coaCode}
                onChange={e => setCoaCode(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
              >
                {coaList.map(c => (
                  <option key={c.code} value={c.code}>
                    {c.code} - {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
              >
                <option value="Draft">Draft</option>
                <option value="Approved">Approved</option>
                <option value="Ongoing">Ongoing</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>

          {/* Monthly Breakdown 12 Months */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Distribusi Bulanan ({currency})
              </span>
              <button
                type="button"
                onClick={handleDistributeEvenly}
                className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Calculator className="w-3.5 h-3.5" />
                <span>Bagi Rata 12 Bulan</span>
              </button>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
              {DP_MONTHS.map(m => (
                <div key={m}>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">{m}</label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={monthly[m] || ''}
                    onChange={e => handleMonthChange(m, e.target.value)}
                    placeholder="0"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono text-right focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              ))}
            </div>

            {/* Total Summary preview */}
            <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
              <div className="text-slate-600">
                Total {currency}: <strong className="text-slate-900">{sumLocal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
              </div>
              <div className="text-indigo-700 bg-indigo-50 px-3 py-1 rounded-xl border border-indigo-200">
                Konversi Total USD: <strong>${calculatedUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Catatan Tambahan (Opsional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Catatan pesanan, kontrak, forecast..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-600/20 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Sales Plan</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
