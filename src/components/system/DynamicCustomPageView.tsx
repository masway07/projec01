import React, { useState, useMemo } from 'react';
import {
  Layers,
  Plus,
  Trash2,
  Edit3,
  Search,
  Download,
  Upload,
  RefreshCw,
  Code2,
  Table,
  CheckCircle2,
  X,
  FileSpreadsheet,
  AlertTriangle,
  Sliders
} from 'lucide-react';
import {
  DynamicNavItem,
  DynamicSubNavItem,
  DynamicFormSchema,
  DynamicFormField,
  CustomDatasetRecord,
  Department,
  COA,
  Supplier,
  Customer,
  ItemStock,
  ProductionProcess
} from '../../types';
import { getDynamicIcon } from '../../utils/iconMap';

interface DynamicCustomPageViewProps {
  menuItem: DynamicNavItem | DynamicSubNavItem;
  groupName?: string;
  formSchema?: DynamicFormSchema;
  dataset: CustomDatasetRecord[];
  onUpdateDataset: (datasetKey: string, records: CustomDatasetRecord[]) => void;
  departments: Department[];
  coaList: COA[];
  suppliers: Supplier[];
  customers: Customer[];
  itemStocks: ItemStock[];
  productionProcesses: ProductionProcess[];
  onOpenDeveloperStudio?: () => void;
}

export const DynamicCustomPageView: React.FC<DynamicCustomPageViewProps> = ({
  menuItem,
  groupName = 'Sistem',
  formSchema,
  dataset,
  onUpdateDataset,
  departments,
  coaList,
  suppliers,
  customers,
  itemStocks,
  productionProcesses,
  onOpenDeveloperStudio
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<CustomDatasetRecord | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [notification, setNotification] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showNotification = (text: string, type: 'success' | 'error' = 'success') => {
    setNotification({ text, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const targetCollectionKey = formSchema?.targetCollectionKey || menuItem.dataSourceKey || `custom_${menuItem.id}`;

  // Filter dataset
  const filteredDataset = useMemo(() => {
    if (!searchTerm.trim()) return dataset;
    return dataset.filter(row =>
      Object.values(row).some(val =>
        String(val).toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [dataset, searchTerm]);

  // Open modal for add
  const handleOpenAdd = () => {
    setEditingRecord(null);
    const initial: Record<string, any> = {};
    formSchema?.fields.forEach(f => {
      if (f.defaultValue !== undefined) {
        initial[f.key] = f.defaultValue;
      }
    });
    setFormData(initial);
    setIsFormModalOpen(true);
  };

  // Open modal for edit
  const handleOpenEdit = (row: CustomDatasetRecord) => {
    setEditingRecord(row);
    setFormData({ ...row });
    setIsFormModalOpen(true);
  };

  // Handle Form Submission
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (formSchema) {
      for (const field of formSchema.fields) {
        if (field.required && (formData[field.key] === undefined || formData[field.key] === '')) {
          showNotification(`Field "${field.label}" wajib diisi!`, 'error');
          return;
        }
      }
    }

    if (editingRecord) {
      // Edit existing
      const updated = dataset.map(item =>
        item.id === editingRecord.id
          ? { ...item, ...formData, updatedAt: new Date().toISOString() }
          : item
      );
      onUpdateDataset(targetCollectionKey, updated);
      showNotification('Data berhasil diperbarui');
    } else {
      // Add new
      const newRecord: CustomDatasetRecord = {
        id: `rec-${Date.now().toString().slice(-6)}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...formData
      };
      onUpdateDataset(targetCollectionKey, [newRecord, ...dataset]);
      showNotification('Data baru berhasil ditambahkan');
    }

    setIsFormModalOpen(false);
  };

  // Handle Delete Record
  const handleDeleteRecord = (id: string) => {
    if (!window.confirm('Hapus baris data ini?')) return;
    const updated = dataset.filter(item => item.id !== id);
    onUpdateDataset(targetCollectionKey, updated);
    showNotification('Data berhasil dihapus');
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (dataset.length === 0) {
      showNotification('Belum ada data untuk diexport', 'error');
      return;
    }
    const headers = Object.keys(dataset[0]);
    const csvContent = [
      headers.join(','),
      ...dataset.map(row =>
        headers.map(h => `"${String(row[h] ?? '').replace(/"/g, '""')}"`).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${menuItem.id}-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    showNotification('Export CSV berhasil');
  };

  // Helper field input renderer
  const renderInput = (field: DynamicFormField) => {
    const val = formData[field.key];
    const setVal = (v: any) => setFormData(prev => ({ ...prev, [field.key]: v }));

    switch (field.type) {
      case 'text':
        return (
          <input
            type="text"
            value={val ?? ''}
            onChange={e => setVal(e.target.value)}
            placeholder={field.placeholder || `Masukkan ${field.label}`}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            required={field.required}
          />
        );

      case 'number':
        return (
          <input
            type="number"
            value={val ?? ''}
            onChange={e => setVal(Number(e.target.value))}
            placeholder={field.placeholder || '0'}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            required={field.required}
          />
        );

      case 'textarea':
        return (
          <textarea
            rows={3}
            value={val ?? ''}
            onChange={e => setVal(e.target.value)}
            placeholder={field.placeholder || `Masukkan ${field.label}`}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            required={field.required}
          />
        );

      case 'select':
        return (
          <select
            value={val ?? ''}
            onChange={e => setVal(e.target.value)}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            required={field.required}
          >
            <option value="">-- Pilih {field.label} --</option>
            {field.options?.map((opt, idx) => (
              <option key={idx} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        );

      case 'date':
        return (
          <input
            type="date"
            value={val ?? ''}
            onChange={e => setVal(e.target.value)}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            required={field.required}
          />
        );

      case 'time':
        return (
          <input
            type="time"
            value={val ?? ''}
            onChange={e => setVal(e.target.value)}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            required={field.required}
          />
        );

      case 'currency_idr':
        return (
          <div className="relative">
            <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">Rp</span>
            <input
              type="number"
              value={val ?? ''}
              onChange={e => setVal(Number(e.target.value))}
              placeholder="0"
              className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              required={field.required}
            />
          </div>
        );

      case 'switch':
      case 'checkbox':
        return (
          <label className="flex items-center gap-3 cursor-pointer py-1">
            <input
              type="checkbox"
              checked={!!val}
              onChange={e => setVal(e.target.checked)}
              className="w-4 h-4 text-indigo-600 bg-slate-950 border-slate-700 rounded-sm focus:ring-indigo-500"
            />
            <span className="text-xs text-slate-300">
              {val ? 'Aktif / Ya (True)' : 'Nonaktif / Tidak (False)'}
            </span>
          </label>
        );

      case 'lookup_dept':
        return (
          <select
            value={val ?? ''}
            onChange={e => setVal(e.target.value)}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            required={field.required}
          >
            <option value="">-- Pilih Departemen --</option>
            {departments.map(d => (
              <option key={d.code} value={d.code}>
                {d.code} - {d.name}
              </option>
            ))}
          </select>
        );

      case 'lookup_supplier':
        return (
          <select
            value={val ?? ''}
            onChange={e => setVal(e.target.value)}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            required={field.required}
          >
            <option value="">-- Pilih Supplier --</option>
            {suppliers.map(s => (
              <option key={s.id} value={s.id}>
                {s.code} - {s.name}
              </option>
            ))}
          </select>
        );

      case 'lookup_customer':
        return (
          <select
            value={val ?? ''}
            onChange={e => setVal(e.target.value)}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            required={field.required}
          >
            <option value="">-- Pilih Customer --</option>
            {customers.map(c => (
              <option key={c.id} value={c.id}>
                {c.code} - {c.name}
              </option>
            ))}
          </select>
        );

      case 'lookup_coa':
        return (
          <select
            value={val ?? ''}
            onChange={e => setVal(e.target.value)}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            required={field.required}
          >
            <option value="">-- Pilih Akun COA --</option>
            {coaList.map(c => (
              <option key={c.code} value={c.code}>
                {c.code} - {c.name}
              </option>
            ))}
          </select>
        );

      case 'lookup_stock':
        return (
          <select
            value={val ?? ''}
            onChange={e => setVal(e.target.value)}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            required={field.required}
          >
            <option value="">-- Pilih Item Stock --</option>
            {itemStocks.map(i => (
              <option key={i.id} value={i.id}>
                {i.itemCode} - {i.itemName}
              </option>
            ))}
          </select>
        );

      case 'lookup_process':
        return (
          <select
            value={val ?? ''}
            onChange={e => setVal(e.target.value)}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            required={field.required}
          >
            <option value="">-- Pilih Proses --</option>
            {productionProcesses.map(p => (
              <option key={p.code} value={p.code}>
                {p.code} - {p.name}
              </option>
            ))}
          </select>
        );

      default:
        return (
          <input
            type="text"
            value={val ?? ''}
            onChange={e => setVal(e.target.value)}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
          />
        );
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Toast */}
      {notification && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 text-sm font-medium border ${
            notification.type === 'success'
              ? 'bg-emerald-950/90 text-emerald-200 border-emerald-500/50'
              : 'bg-rose-950/90 text-rose-200 border-rose-500/50'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-400" />
          )}
          <span>{notification.text}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 p-5 sm:p-6 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
              {getDynamicIcon((menuItem as DynamicNavItem).iconName, 'w-5 h-5 text-white')}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {menuItem.label}
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Area {groupName}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {menuItem.description || `Modul kustom dinamis terintegrasi dataset: ${targetCollectionKey}`}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {onOpenDeveloperStudio && (
            <button
              onClick={onOpenDeveloperStudio}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-indigo-300 text-xs font-semibold rounded-xl border border-slate-700 transition cursor-pointer"
              title="Atur Menu & Formulir ini di Developer Studio"
            >
              <Code2 className="w-3.5 h-3.5" />
              Developer Studio
            </button>
          )}

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Tambah Data
          </button>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Table className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              Daftar Data ({filteredDataset.length} Baris)
            </span>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Cari dalam tabel..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-hidden"
            />
          </div>
        </div>

        {filteredDataset.length === 0 ? (
          <div className="py-16 text-center text-slate-500 bg-slate-950/40 rounded-xl border border-dashed border-slate-800">
            <Table className="w-10 h-10 mx-auto mb-2 text-slate-600" />
            <p className="text-sm font-semibold text-slate-400">Belum ada data pada modul ini.</p>
            <p className="text-xs text-slate-500 mt-1">Klik tombol "+ Tambah Data" untuk mulai mencatat.</p>
            <button
              onClick={handleOpenAdd}
              className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition"
            >
              + Tambah Data Pertama
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-950 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3">#</th>
                  {formSchema ? (
                    formSchema.fields.map(f => (
                      <th key={f.id} className="p-3">{f.label}</th>
                    ))
                  ) : (
                    Object.keys(filteredDataset[0]).map(k => (
                      <th key={k} className="p-3 font-mono">{k}</th>
                    ))
                  )}
                  <th className="p-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 bg-slate-900/50">
                {filteredDataset.map((row, idx) => (
                  <tr key={row.id || idx} className="hover:bg-slate-800/40 transition">
                    <td className="p-3 text-slate-500 font-mono text-[10px]">{idx + 1}</td>

                    {formSchema ? (
                      formSchema.fields.map(f => {
                        const val = row[f.key];
                        return (
                          <td key={f.id} className="p-3 text-slate-200 truncate max-w-xs">
                            {f.type === 'switch' || f.type === 'checkbox' ? (
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${val ? 'bg-emerald-950 text-emerald-300' : 'bg-slate-800 text-slate-400'}`}>
                                {val ? 'YA' : 'TIDAK'}
                              </span>
                            ) : f.type === 'currency_idr' && typeof val === 'number' ? (
                              `Rp ${val.toLocaleString('id-ID')}`
                            ) : f.type === 'currency_usd' && typeof val === 'number' ? (
                              `$ ${val.toFixed(2)}`
                            ) : (
                              String(val ?? '-')
                            )}
                          </td>
                        );
                      })
                    ) : (
                      Object.keys(filteredDataset[0]).map(k => (
                        <td key={k} className="p-3 text-slate-200 truncate max-w-xs">
                          {String(row[k] ?? '-')}
                        </td>
                      ))
                    )}

                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenEdit(row)}
                          className="p-1.5 text-slate-400 hover:text-indigo-400 rounded-lg hover:bg-slate-800 transition"
                          title="Edit"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteRecord(row.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition"
                          title="Hapus"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Form Modal for Add / Edit */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-400" />
                {editingRecord ? 'Edit Data' : 'Tambah Data Baru'}: {formSchema?.name || menuItem.label}
              </h3>
              <button
                onClick={() => setIsFormModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              {formSchema ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {formSchema.fields.map(field => {
                    const colSpanClass =
                      field.gridSpan === 4
                        ? 'sm:col-span-2 lg:col-span-4'
                        : field.gridSpan === 3
                        ? 'sm:col-span-2 lg:col-span-3'
                        : field.gridSpan === 1
                        ? 'col-span-1'
                        : 'sm:col-span-2 lg:col-span-2';

                    return (
                      <div key={field.id} className={colSpanClass}>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          {field.label} {field.required && <span className="text-rose-400">*</span>}
                        </label>
                        {renderInput(field)}
                        {field.helpText && (
                          <p className="text-[10px] text-slate-500 mt-1">{field.helpText}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Kode / Nomor</label>
                    <input
                      type="text"
                      value={formData.code || ''}
                      onChange={e => setFormData({ ...formData, code: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white"
                      placeholder="Kode"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Nama / Deskripsi</label>
                    <input
                      type="text"
                      value={formData.name || ''}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white"
                      placeholder="Nama"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md cursor-pointer"
                >
                  Simpan Data
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
