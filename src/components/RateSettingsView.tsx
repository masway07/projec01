import React, { useState } from 'react';
import { ArrowLeftRight, Save, Edit2, Trash2 } from 'lucide-react';
import { ExchangeRates } from '../types';

interface RateSettingsViewProps {
  ratesByYear: Record<string, ExchangeRates>;
  onSaveRate: (year: string, rates: ExchangeRates) => void;
  onDeleteRate: (year: string) => void;
}

export const RateSettingsView: React.FC<RateSettingsViewProps> = ({
  ratesByYear,
  onSaveRate,
  onDeleteRate
}) => {
  const [year, setYear] = useState<string>('2026');
  const [idr, setIdr] = useState<string>('16273.56');
  const [jpy, setJpy] = useState<string>('142.54');
  const [cny, setCny] = useState<string>('0.14');
  const [eur, setEur] = useState<string>('0.92');

  const handleYearChange = (newYear: string) => {
    setYear(newYear);
    const existing = ratesByYear[newYear];
    if (existing) {
      setIdr(existing.IDR ? String(existing.IDR) : '');
      setJpy(existing.JPY ? String(existing.JPY) : '');
      setCny(existing.CNY ? String(existing.CNY) : '');
      setEur(existing.EUR ? String(existing.EUR) : '');
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const yNum = parseInt(year, 10);
    const idrNum = parseFloat(idr);
    const jpyNum = parseFloat(jpy);
    const cnyNum = parseFloat(cny);
    const eurNum = parseFloat(eur) || 0.92;

    if (isNaN(yNum) || yNum < 2000 || yNum > 2100 || isNaN(idrNum) || isNaN(jpyNum) || isNaN(cnyNum)) {
      alert('Tahun dan seluruh rate mata uang harus valid serta lebih besar dari 0.');
      return;
    }

    onSaveRate(String(yNum), {
      IDR: idrNum,
      JPY: jpyNum,
      CNY: cnyNum,
      EUR: eurNum
    });
  };

  const handleEditYear = (yr: string) => {
    handleYearChange(yr);
  };

  const sortedYears = Object.keys(ratesByYear).sort((a, b) => Number(b) - Number(a));

  return (
    <div id="view-rate" className="space-y-6">
      <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-xs">
        <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
          <ArrowLeftRight className="w-5 h-5 text-indigo-600" />
          Exchange Rate per Tahun
        </h3>
        <p className="text-sm text-slate-500 mt-1">
          USD adalah mata uang dasar. Nilai di bawah merupakan besaran <strong>mata uang lokal untuk 1 USD</strong>.
          Misalnya IDR 16,273.56 berarti 1 USD = 16,273.56 IDR. Rate disimpan per tahun sehingga perubahan rate tahun 2026 tidak mengubah historis tahun 2025.
        </p>

        <form onSubmit={handleSave} className="mt-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Tahun</label>
              <input
                id="setRateYear"
                type="number"
                min="2000"
                max="2100"
                value={year}
                onChange={e => handleYearChange(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">IDR → USD</label>
              <input
                id="setRateIDR"
                type="number"
                step="any"
                value={idr}
                onChange={e => setIdr(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">JPY → USD</label>
              <input
                id="setRateJPY"
                type="number"
                step="any"
                value={jpy}
                onChange={e => setJpy(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">CNY → USD</label>
              <input
                id="setRateCNY"
                type="number"
                step="any"
                value={cny}
                onChange={e => setCny(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">EUR → USD</label>
              <input
                id="setRateEUR"
                type="number"
                step="any"
                value={eur}
                onChange={e => setEur(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-5 py-2.5 rounded-lg text-sm transition flex items-center gap-1.5"
          >
            <Save className="w-4 h-4" />
            <span>Simpan Rate Tahun {year}</span>
          </button>
        </form>

        <div className="mt-8">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
            Daftar Kurs Tersimpan
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 text-xs">
                <tr>
                  <th className="p-3">Tahun</th>
                  <th className="p-3">IDR → USD</th>
                  <th className="p-3">JPY → USD</th>
                  <th className="p-3">CNY → USD</th>
                  <th className="p-3">EUR → USD</th>
                  <th className="p-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody id="rateSettingsList" className="divide-y divide-slate-100">
                {sortedYears.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-4 text-center text-xs text-slate-400 italic">
                      Belum ada rate.
                    </td>
                  </tr>
                ) : (
                  sortedYears.map(yr => {
                    const r = ratesByYear[yr] || {};
                    return (
                      <tr key={yr} className="hover:bg-slate-50 text-xs">
                        <td className="p-3 font-bold text-indigo-700">{yr}</td>
                        <td className="p-3 font-mono">{r.IDR?.toLocaleString('id-ID')}</td>
                        <td className="p-3 font-mono">{r.JPY}</td>
                        <td className="p-3 font-mono">{r.CNY}</td>
                        <td className="p-3 font-mono">{r.EUR || '-'}</td>
                        <td className="p-3 text-center whitespace-nowrap">
                          <button
                            onClick={() => handleEditYear(yr)}
                            className="text-indigo-600 hover:text-indigo-800 px-2 py-1"
                            title="Edit Rate"
                          >
                            <Edit2 className="w-3.5 h-3.5 inline mr-1" />
                            Edit
                          </button>
                          {sortedYears.length > 1 && (
                            <button
                              onClick={() => {
                                if (window.confirm(`Hapus rate untuk tahun ${yr}?`)) {
                                  onDeleteRate(yr);
                                }
                              }}
                              className="text-rose-600 hover:text-rose-800 px-2 py-1 ml-1"
                              title="Hapus Rate"
                            >
                              <Trash2 className="w-3.5 h-3.5 inline mr-1" />
                              Hapus
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
