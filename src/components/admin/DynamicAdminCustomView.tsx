import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Trash2,
  Edit2,
  Save,
  Download,
  Filter,
  Calculator,
  Database,
  Layers,
  Sparkles,
  CheckCircle2,
  X,
  ChevronDown,
  ArrowUpDown,
  ListPlus,
  Table as TableIcon
} from 'lucide-react';
import { ColumnConfig, CustomViewConfig } from './AdminDashboardControlBar';

interface DynamicAdminCustomViewProps {
  activeTab: string;
  customViews: Record<string, CustomViewConfig>;
  allDataSources: Record<string, any[]>;
  onUpdateDataSource: (key: string, data: any[]) => void;
  title?: string;
  description?: string;
}

export const DynamicAdminCustomView: React.FC<DynamicAdminCustomViewProps> = ({
  activeTab,
  customViews,
  allDataSources,
  onUpdateDataSource,
  title,
  description
}) => {
  // Retrieve view config
  const viewConfig: CustomViewConfig = customViews[activeTab] || {
    title: title || activeTab,
    description: description || `Manajemen ${title || activeTab}`,
    layoutType: 'table',
    dataSourceKey: 'itemStocks',
    columns: [
      { key: 'code', label: 'Kode / SKU', type: 'text', headerBgColor: 'bg-indigo-700 text-white', calcFormula: 'COUNT' },
      { key: 'name', label: 'Nama Barang / Item', type: 'text', headerBgColor: 'bg-slate-800 text-white', calcFormula: 'NONE' },
      { key: 'category', label: 'Kategori Material', type: 'text', headerBgColor: 'bg-violet-700 text-white', calcFormula: 'NONE' },
      { key: 'amount', label: 'Nilai Total (IDR)', type: 'currency', headerBgColor: 'bg-emerald-700 text-white', calcFormula: 'SUM' }
    ]
  };

  const dataSourceKey = viewConfig.dataSourceKey || 'itemStocks';
  const rawRecords = allDataSources[dataSourceKey] || [];

  // Filtering & Searching State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchColumnKey, setSearchColumnKey] = useState<string>('ALL');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('ALL');

  // Record Creation / Editing Modal
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [editingRecordIdx, setEditingRecordIdx] = useState<number | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Get distinct categories for filtering
  const categoryOptions = useMemo(() => {
    const cats = new Set<string>();
    rawRecords.forEach(r => {
      if (r.category) cats.add(String(r.category));
      if (r.deptCode) cats.add(String(r.deptCode));
    });
    return Array.from(cats);
  }, [rawRecords]);

  // Filtered records based on Search & Filter
  const filteredRecords = useMemo(() => {
    return rawRecords.filter(record => {
      // Category filter check
      if (selectedCategoryFilter !== 'ALL') {
        const matchesCat = record.category === selectedCategoryFilter || record.deptCode === selectedCategoryFilter;
        if (!matchesCat) return false;
      }

      // Search query check
      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase();

      if (searchColumnKey !== 'ALL') {
        const val = record[searchColumnKey];
        return val != null && String(val).toLowerCase().includes(query);
      }

      return Object.values(record).some(val =>
        val != null && String(val).toLowerCase().includes(query)
      );
    });
  }, [rawRecords, searchQuery, searchColumnKey, selectedCategoryFilter]);

  // Calculation Logic Engine (SUM, AVERAGE, COUNT, MIN, MAX)
  const calculationResults = useMemo(() => {
    const results: Record<string, { label: string; formula: string; value: string | number }> = {};

    viewConfig.columns.forEach(col => {
      const formula = col.calcFormula || 'NONE';
      if (formula === 'NONE') return;

      const numericValues = filteredRecords
        .map(r => parseFloat(r[col.key] || r.amount || r.stock || r.price || 0))
        .filter(v => !isNaN(v));

      if (formula === 'COUNT') {
        results[col.key] = {
          label: col.label,
          formula: 'COUNT',
          value: filteredRecords.length
        };
      } else if (formula === 'SUM') {
        const sum = numericValues.reduce((acc, curr) => acc + curr, 0);
        results[col.key] = {
          label: col.label,
          formula: 'SUM / TOTAL',
          value: col.type === 'currency' ? `Rp ${sum.toLocaleString('id-ID')}` : sum.toLocaleString('id-ID')
        };
      } else if (formula === 'AVERAGE') {
        const avg = numericValues.length > 0 ? numericValues.reduce((acc, curr) => acc + curr, 0) / numericValues.length : 0;
        results[col.key] = {
          label: col.label,
          formula: 'RATA-RATA',
          value: col.type === 'currency' ? `Rp ${Math.round(avg).toLocaleString('id-ID')}` : avg.toFixed(2)
        };
      } else if (formula === 'MIN') {
        const min = numericValues.length > 0 ? Math.min(...numericValues) : 0;
        results[col.key] = {
          label: col.label,
          formula: 'MINIMUM',
          value: col.type === 'currency' ? `Rp ${min.toLocaleString('id-ID')}` : min.toLocaleString('id-ID')
        };
      } else if (formula === 'MAX') {
        const max = numericValues.length > 0 ? Math.max(...numericValues) : 0;
        results[col.key] = {
          label: col.label,
          formula: 'MAXIMUM',
          value: col.type === 'currency' ? `Rp ${max.toLocaleString('id-ID')}` : max.toLocaleString('id-ID')
        };
      }
    });

    return results;
  }, [filteredRecords, viewConfig.columns]);

  // Save or Update Record
  const handleSaveRecord = () => {
    const updated = [...rawRecords];
    if (editingRecordIdx !== null) {
      updated[editingRecordIdx] = { ...updated[editingRecordIdx], ...formData };
      showToast('Record data berhasil diperbarui!');
    } else {
      const newRec = {
        id: `rec_${Date.now()}`,
        code: formData.code || `SKU-${Date.now().toString().slice(-4)}`,
        name: formData.name || 'Item Baru',
        amount: parseFloat(formData.amount || 0),
        category: formData.category || 'General',
        ...formData,
        createdAt: new Date().toISOString()
      };
      updated.unshift(newRec);
      showToast('Record data baru berhasil ditambahkan!');
    }
    onUpdateDataSource(dataSourceKey, updated);
    setShowAddModal(false);
    setEditingRecordIdx(null);
    setFormData({});
  };

  const handleDeleteRecord = (recordId: string) => {
    const updated = rawRecords.filter(r => r.id !== recordId && r.code !== recordId);
    onUpdateDataSource(dataSourceKey, updated);
    showToast('Record berhasil dihapus.');
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              Modul Tampilan Live
            </span>
            <span className="text-xs text-slate-400 font-mono">Modul Source: {dataSourceKey}</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">{viewConfig.title}</h1>
          <p className="text-slate-500 text-sm mt-0.5">{viewConfig.description || 'Kelola data dan laporan interaktif.'}</p>
        </div>

        <button
          onClick={() => {
            setEditingRecordIdx(null);
            setFormData({});
            setShowAddModal(true);
          }}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold flex items-center gap-2 transition cursor-pointer shadow-md shadow-indigo-600/20 shrink-0"
        >
          <Plus className="w-4 h-4" /> Tambah Data Record Baru
        </button>
      </div>

      {toastMsg && (
        <div className="bg-emerald-950/80 border border-emerald-500/30 text-emerald-200 px-4 py-3 rounded-xl flex items-center gap-2 text-sm font-semibold animate-fadeIn shadow-md">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          {toastMsg}
        </div>
      )}

      {/* KPI Calculation Metric Cards */}
      {Object.keys(calculationResults).length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(calculationResults).map(([key, calc]) => (
            <div key={key} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[11px] uppercase tracking-wider font-extrabold text-indigo-600 block">
                  {calc.formula}: {calc.label}
                </span>
                <div className="text-xl font-extrabold text-slate-900 mt-1">{calc.value}</div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <Calculator className="w-5 h-5" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Search & Selection Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex flex-1 flex-col sm:flex-row items-center gap-2">
          {/* Column Search Filter Picker */}
          <div className="flex items-center gap-1.5 bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs w-full sm:w-auto">
            <Filter className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span className="text-slate-600 font-semibold shrink-0">Cari Berdasarkan:</span>
            <select
              value={searchColumnKey}
              onChange={e => setSearchColumnKey(e.target.value)}
              className="bg-transparent font-bold text-indigo-700 outline-none cursor-pointer"
            >
              <option value="ALL">Semua Kolom</option>
              {viewConfig.columns.map(c => (
                <option key={c.key} value={c.key}>{c.label}</option>
              ))}
            </select>
          </div>

          {/* Search Text Input */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Ketik kata kunci untuk memfilter data..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 outline-none focus:border-indigo-500 focus:bg-white"
            />
          </div>
        </div>

        {/* Category Filter Dropdown */}
        {categoryOptions.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Filter Kategori:</span>
            <select
              value={selectedCategoryFilter}
              onChange={e => setSelectedCategoryFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none cursor-pointer"
            >
              <option value="ALL">Semua Kategori</option>
              {categoryOptions.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Main Table with Customized Header Colors & Calculated Footer */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="px-4 py-3.5 bg-slate-800 text-white text-xs font-bold uppercase tracking-wider w-12 text-center">
                  #
                </th>
                {viewConfig.columns.map(col => (
                  <th
                    key={col.key}
                    className={`px-4 py-3.5 text-xs font-bold uppercase tracking-wider ${
                      col.headerBgColor || 'bg-indigo-700 text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span>{col.label}</span>
                      {col.calcFormula && col.calcFormula !== 'NONE' && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-black/20 text-white font-mono">
                          {col.calcFormula}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
                <th className="px-4 py-3.5 bg-slate-800 text-white text-xs font-bold uppercase tracking-wider text-right w-24">
                  Aksi
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={viewConfig.columns.length + 2} className="px-4 py-8 text-center text-slate-400 font-medium">
                    Belum ada data record untuk tampilan ini atau tidak sesuai filter.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record, rIdx) => (
                  <tr key={record.id || rIdx} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3 text-center text-slate-400 font-mono">{rIdx + 1}</td>
                    {viewConfig.columns.map(col => {
                      const val = record[col.key] || record.code || record.name || '-';
                      return (
                        <td key={col.key} className="px-4 py-3 font-semibold text-slate-800">
                          {col.type === 'currency' && typeof val === 'number'
                            ? `Rp ${val.toLocaleString('id-ID')}`
                            : String(val)}
                        </td>
                      );
                    })}
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => {
                            setEditingRecordIdx(rawRecords.findIndex(r => r.id === record.id));
                            setFormData(record);
                            setShowAddModal(true);
                          }}
                          className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                          title="Edit Record"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteRecord(record.id || record.code)}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                          title="Hapus Record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>

            {/* Calculated Footer Summary Row */}
            {filteredRecords.length > 0 && (
              <tfoot>
                <tr className="bg-slate-900 text-white font-bold text-xs border-t-2 border-indigo-500">
                  <td className="px-4 py-3 text-center text-indigo-300 uppercase tracking-widest text-[10px]">
                    TOTAL
                  </td>
                  {viewConfig.columns.map(col => {
                    const calc = calculationResults[col.key];
                    return (
                      <td key={col.key} className="px-4 py-3 text-amber-300">
                        {calc ? (
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] text-slate-400">({calc.formula}):</span>
                            <span>{calc.value}</span>
                          </div>
                        ) : (
                          <span className="text-slate-600">-</span>
                        )}
                      </td>
                    );
                  })}
                  <td className="px-4 py-3 text-right text-slate-400 text-[10px]">
                    {filteredRecords.length} Items
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Record Creator / Editor Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                <TableIcon className="w-5 h-5 text-indigo-600" />
                {editingRecordIdx !== null ? 'Edit Record Data' : 'Tambah Record Data Baru'}
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1 text-xs">
              {viewConfig.columns.map(col => (
                <div key={col.key} className="space-y-1">
                  <label className="font-bold text-slate-700 block">{col.label}:</label>
                  <input
                    type={col.type === 'number' || col.type === 'currency' ? 'number' : 'text'}
                    placeholder={`Masukkan ${col.label}...`}
                    value={formData[col.key] || ''}
                    onChange={e => setFormData({ ...formData, [col.key]: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-800 outline-none focus:border-indigo-600 focus:bg-white"
                  />
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleSaveRecord}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md cursor-pointer"
              >
                Simpan Record Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
