import React, { useState } from 'react';
import {
  CircleDollarSign,
  Plus,
  Edit2,
  Trash2,
  Search,
  Calendar,
  ArrowUpDown,
  TrendingUp,
  FileCheck2,
  Building,
  DollarSign,
  X
} from 'lucide-react';
import { DailyRate } from '../types';

interface MasterRateHarianViewProps {
  dailyRates: DailyRate[];
  onAddDailyRate: (rate: Omit<DailyRate, 'id'>) => void;
  onUpdateDailyRate: (rate: DailyRate) => void;
  onDeleteDailyRate: (id: string) => void;
}

export const MasterRateHarianView: React.FC<MasterRateHarianViewProps> = ({
  dailyRates,
  onAddDailyRate,
  onUpdateDailyRate,
  onDeleteDailyRate
}) => {
  const [currencyFilter, setCurrencyFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRate, setEditingRate] = useState<DailyRate | null>(null);

  // Form states
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [currency, setCurrency] = useState('USD');
  const [rateBI, setRateBI] = useState<number>(16285.00);
  const [rateKMK, setRateKMK] = useState<number>(16250.00);
  const [source, setSource] = useState('KMK No. 11/KM.10/2026');
  const [notes, setNotes] = useState('');

  const openAddModal = () => {
    setEditingRate(null);
    setDate(new Date().toISOString().split('T')[0]);
    setCurrency('USD');
    setRateBI(16285.00);
    setRateKMK(16250.00);
    setSource('KMK No. 11/KM.10/2026');
    setNotes('');
    setIsModalOpen(true);
  };

  const openEditModal = (r: DailyRate) => {
    setEditingRate(r);
    setDate(r.date);
    setCurrency(r.currency);
    setRateBI(r.rateBI);
    setRateKMK(r.rateKMK);
    setSource(r.source || '');
    setNotes(r.notes || '');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !currency || !rateBI || !rateKMK) return;

    if (editingRate) {
      onUpdateDailyRate({
        ...editingRate,
        date,
        currency,
        rateBI: Number(rateBI),
        rateKMK: Number(rateKMK),
        source: source.trim(),
        notes: notes.trim()
      });
    } else {
      onAddDailyRate({
        date,
        currency,
        rateBI: Number(rateBI),
        rateKMK: Number(rateKMK),
        source: source.trim(),
        notes: notes.trim()
      });
    }

    setIsModalOpen(false);
  };

  const sortedRates = [...dailyRates].sort((a, b) => b.date.localeCompare(a.date));

  const filteredRates = sortedRates.filter(r => {
    const matchCur = currencyFilter === 'all' || r.currency === currencyFilter;
    const matchSearch =
      r.currency.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.date.includes(searchTerm) ||
      (r.source && r.source.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (r.notes && r.notes.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchCur && matchSearch;
  });

  const latestUSD = sortedRates.find(r => r.currency === 'USD');
  const latestJPY = sortedRates.find(r => r.currency === 'JPY');
  const latestEUR = sortedRates.find(r => r.currency === 'EUR');

  return (
    <div id="view-master-rate-harian" className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 rounded-2xl shadow-sm">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-indigo-500/20 rounded-xl text-indigo-300 border border-indigo-400/20">
                <CircleDollarSign className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-xl font-bold tracking-tight">Master Rate Harian (BI & KMK)</h2>
                <p className="text-xs text-indigo-200/80 mt-0.5">
                  Pencatatan resmi Kurs Tengah Bank Indonesia (BI) dan Kurs Keputusan Menteri Keuangan (KMK Pajak)
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              id="btnAddDailyRate"
              onClick={openAddModal}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Input Rate Harian
            </button>
          </div>
        </div>

        {/* Currency Highlight Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5 pt-4 border-t border-slate-800">
          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-300">USD - US Dollar</span>
              <span className="text-[10px] text-slate-400 font-mono">{latestUSD?.date || '-'}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Kurs BI</div>
                <div className="text-sm font-bold font-mono text-white">
                  Rp {latestUSD?.rateBI.toLocaleString() || '16,285'}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Kurs KMK Pajak</div>
                <div className="text-sm font-bold font-mono text-emerald-400">
                  Rp {latestUSD?.rateKMK.toLocaleString() || '16,250'}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-300">JPY - Japanese Yen</span>
              <span className="text-[10px] text-slate-400 font-mono">{latestJPY?.date || '-'}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Kurs BI</div>
                <div className="text-sm font-bold font-mono text-white">
                  Rp {latestJPY?.rateBI.toLocaleString() || '108.65'}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Kurs KMK Pajak</div>
                <div className="text-sm font-bold font-mono text-emerald-400">
                  Rp {latestJPY?.rateKMK.toLocaleString() || '108.20'}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-sky-300">EUR - Euro</span>
              <span className="text-[10px] text-slate-400 font-mono">{latestEUR?.date || '-'}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Kurs BI</div>
                <div className="text-sm font-bold font-mono text-white">
                  Rp {latestEUR?.rateBI.toLocaleString() || '17,680'}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Kurs KMK Pajak</div>
                <div className="text-sm font-bold font-mono text-emerald-400">
                  Rp {latestEUR?.rateKMK.toLocaleString() || '17,620'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari tanggal, nomor KMK, mata uang..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <span className="text-xs text-slate-500 font-medium">Mata Uang:</span>
          <select
            value={currencyFilter}
            onChange={e => setCurrencyFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-hidden cursor-pointer"
          >
            <option value="all">Semua Valuta</option>
            <option value="USD">USD - US Dollar</option>
            <option value="JPY">JPY - Japanese Yen</option>
            <option value="EUR">EUR - Euro</option>
            <option value="SGD">SGD - Singapore Dollar</option>
            <option value="CNY">CNY - Chinese Yuan</option>
          </select>
        </div>
      </div>

      {/* Rate Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Tanggal Kurs</th>
                <th className="py-3.5 px-4">Valuta</th>
                <th className="py-3.5 px-4 text-right">Kurs Bank Indonesia (BI)</th>
                <th className="py-3.5 px-4 text-right">Kurs KMK (Pajak)</th>
                <th className="py-3.5 px-4 text-right">Selisih (BI - KMK)</th>
                <th className="py-3.5 px-4">Dasar Hukum / No. KMK</th>
                <th className="py-3.5 px-4">Keterangan</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRates.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-slate-400">
                    Tidak ada data rate harian yang cocok.
                  </td>
                </tr>
              ) : (
                filteredRates.map(rate => {
                  const selisih = rate.rateBI - rate.rateKMK;
                  return (
                    <tr key={rate.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4 font-semibold text-slate-900 font-mono">
                        {rate.date}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2.5 py-0.5 rounded-md font-mono text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          {rate.currency}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                        Rp {rate.rateBI.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">
                        Rp {rate.rateKMK.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-[11px] font-semibold">
                        <span className={selisih >= 0 ? 'text-amber-700' : 'text-rose-600'}>
                          {selisih >= 0 ? `+Rp ${selisih.toFixed(2)}` : `-Rp ${Math.abs(selisih).toFixed(2)}`}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800 text-[11px]">{rate.source || '-'}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-[11px] text-slate-500 max-w-xs truncate">{rate.notes || '-'}</div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditModal(rate)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                            title="Edit Rate"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`Hapus rate ${rate.currency} tanggal ${rate.date}?`)) {
                                onDeleteDailyRate(rate.id);
                              }
                            }}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                            title="Hapus Rate"
                          >
                            <Trash2 className="w-4 h-4" />
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
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <CircleDollarSign className="w-5 h-5" />
                </span>
                <h3 className="font-bold text-slate-900 text-base">
                  {editingRate ? 'Edit Rate Harian BI & KMK' : 'Input Rate Harian Baru'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tanggal Efektif <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mata Uang (Valuta) <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={currency}
                    onChange={e => setCurrency(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden cursor-pointer"
                  >
                    <option value="USD">USD - US Dollar</option>
                    <option value="JPY">JPY - Japanese Yen</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="SGD">SGD - Singapore Dollar</option>
                    <option value="CNY">CNY - Chinese Yuan</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kurs Tengah BI (IDR) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={rateBI}
                    onChange={e => setRateBI(Number(e.target.value))}
                    placeholder="16285.00"
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-mono font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Untuk pembukuan akuntansi komersial</span>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kurs KMK Pajak (IDR) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={rateKMK}
                    onChange={e => setRateKMK(Number(e.target.value))}
                    placeholder="16250.00"
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-mono font-semibold text-emerald-700 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Untuk PPN Faktur Pajak & Bea Cukai</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Dasar Hukum / Nomor Keputusan Menteri Keuangan (KMK)
                </label>
                <input
                  type="text"
                  value={source}
                  onChange={e => setSource(e.target.value)}
                  placeholder="KMK No. 11/KM.10/2026 tanggal 10 Maret 2026"
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Catatan / Keterangan Tambahan
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Berlaku untuk periode transaksi minggu ke-2 Maret 2026..."
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-xs"
                >
                  {editingRate ? 'Simpan Perubahan' : 'Simpan Rate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
