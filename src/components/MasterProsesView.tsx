import React, { useState } from 'react';
import {
  Workflow,
  Plus,
  Edit2,
  Trash2,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Gauge,
  Cpu,
  Layers,
  X
} from 'lucide-react';
import { ProductionProcess } from '../types';

interface MasterProsesViewProps {
  processes: ProductionProcess[];
  onAddProcess: (process: Omit<ProductionProcess, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateProcess: (process: ProductionProcess) => void;
  onDeleteProcess: (id: string) => void;
}

export const MasterProsesView: React.FC<MasterProsesViewProps> = ({
  processes,
  onAddProcess,
  onUpdateProcess,
  onDeleteProcess
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProcess, setEditingProcess] = useState<ProductionProcess | null>(null);

  // Form states
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [workCenter, setWorkCenter] = useState('');
  const [cycleTimeMinutes, setCycleTimeMinutes] = useState<number>(0.1);
  const [standardCapacityPerHour, setStandardCapacityPerHour] = useState<number>(600);
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);

  const openAddModal = () => {
    setEditingProcess(null);
    const seq = processes.length + 1;
    setCode(`PRS-00${seq}`);
    setName('');
    setWorkCenter('');
    setCycleTimeMinutes(0.5);
    setStandardCapacityPerHour(120);
    setDescription('');
    setIsActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (p: ProductionProcess) => {
    setEditingProcess(p);
    setCode(p.code);
    setName(p.name);
    setWorkCenter(p.workCenter || '');
    setCycleTimeMinutes(p.cycleTimeMinutes || 0);
    setStandardCapacityPerHour(p.standardCapacityPerHour || 0);
    setDescription(p.description || '');
    setIsActive(p.isActive);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !name.trim()) return;

    if (editingProcess) {
      onUpdateProcess({
        ...editingProcess,
        code: code.trim().toUpperCase(),
        name: name.trim(),
        workCenter: workCenter.trim(),
        cycleTimeMinutes: Number(cycleTimeMinutes) || 0,
        standardCapacityPerHour: Number(standardCapacityPerHour) || 0,
        description: description.trim(),
        isActive,
        updatedAt: new Date().toISOString()
      });
    } else {
      onAddProcess({
        code: code.trim().toUpperCase(),
        name: name.trim(),
        workCenter: workCenter.trim(),
        cycleTimeMinutes: Number(cycleTimeMinutes) || 0,
        standardCapacityPerHour: Number(standardCapacityPerHour) || 0,
        description: description.trim(),
        isActive
      });
    }

    setIsModalOpen(false);
  };

  const filteredProcesses = processes.filter(p => {
    return (
      p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.workCenter && p.workCenter.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  return (
    <div id="view-master-proses" className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 rounded-2xl shadow-sm">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-indigo-500/20 rounded-xl text-indigo-300 border border-indigo-400/20">
                <Workflow className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-xl font-bold tracking-tight">Master Data Proses Produksi</h2>
                <p className="text-xs text-indigo-200/80 mt-0.5">
                  Daftar urutan stasiun kerja, work center, cycle time, dan kapasitas standar proses manufaktur
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              id="btnAddProcess"
              onClick={openAddModal}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Tambah Proses
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-5 pt-4 border-t border-slate-800">
          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <div className="text-slate-400 text-[11px] font-medium">Total Stasiun Proses</div>
            <div className="text-lg font-bold text-white mt-0.5">{processes.length}</div>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <div className="text-slate-400 text-[11px] font-medium">Proses Aktif</div>
            <div className="text-lg font-bold text-emerald-400 mt-0.5">
              {processes.filter(p => p.isActive).length}
            </div>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/10 col-span-2 sm:col-span-1">
            <div className="text-slate-400 text-[11px] font-medium">Rata-rata Cycle Time</div>
            <div className="text-lg font-bold text-amber-300 mt-0.5">
              {(processes.reduce((acc, p) => acc + (p.cycleTimeMinutes || 0), 0) / (processes.length || 1)).toFixed(2)} mnt
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari kode, nama proses, work center, mesin..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
          />
        </div>
        <div className="text-xs text-slate-500">
          Menampilkan <span className="font-bold text-slate-800">{filteredProcesses.length}</span> dari {processes.length} proses
        </div>
      </div>

      {/* Process Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Urutan & Kode</th>
                <th className="py-3.5 px-4">Nama Proses Produksi</th>
                <th className="py-3.5 px-4">Work Center / Mesin</th>
                <th className="py-3.5 px-4 text-right">Cycle Time</th>
                <th className="py-3.5 px-4 text-right">Kapasitas / Jam</th>
                <th className="py-3.5 px-4">Deskripsi / Spesifikasi</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProcesses.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-slate-400">
                    Tidak ada data proses produksi yang cocok.
                  </td>
                </tr>
              ) : (
                filteredProcesses.map((prs, idx) => (
                  <tr key={prs.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-700 font-bold text-[11px] flex items-center justify-center border border-indigo-200">
                          {idx + 1}
                        </span>
                        <span className="font-mono text-[11px] font-bold text-slate-800">{prs.code}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{prs.name}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">{prs.workCenter || '-'}</div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="font-mono font-semibold text-slate-900">
                        {prs.cycleTimeMinutes} mnt
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                        {prs.standardCapacityPerHour?.toLocaleString()} pcs/jam
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="max-w-xs text-[11px] text-slate-600 truncate" title={prs.description}>
                        {prs.description || '-'}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {prs.isActive ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                          <XCircle className="w-3 h-3" />
                          Non-Aktif
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(prs)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                          title="Edit Proses"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`Hapus proses ${prs.name}?`)) {
                              onDeleteProcess(prs.id);
                            }
                          }}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                          title="Hapus Proses"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Workflow className="w-5 h-5" />
                </span>
                <h3 className="font-bold text-slate-900 text-base">
                  {editingProcess ? 'Edit Proses Produksi' : 'Tambah Proses Produksi Baru'}
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
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kode Proses <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={e => setCode(e.target.value)}
                    placeholder="PRS-CF-01"
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-mono uppercase focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Proses Produksi <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Cold Forging & Extrusion"
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Work Center / Mesin
                </label>
                <input
                  type="text"
                  value={workCenter}
                  onChange={e => setWorkCenter(e.target.value)}
                  placeholder="Multi-Station Cold Former 800 Ton (Komatsu)"
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Cycle Time (Menit per Pcs)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={cycleTimeMinutes}
                    onChange={e => {
                      const val = Number(e.target.value);
                      setCycleTimeMinutes(val);
                      if (val > 0) {
                        setStandardCapacityPerHour(Math.round(60 / val));
                      }
                    }}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kapasitas Standar (Pcs / Jam)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={standardCapacityPerHour}
                    onChange={e => setStandardCapacityPerHour(Number(e.target.value))}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Deskripsi / Standard Operating Procedure
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Instruksi kerja singkat, toleransi dimensi kritis, parameter suhu/tekanan..."
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="prsActive"
                  checked={isActive}
                  onChange={e => setIsActive(e.target.checked)}
                  className="rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="prsActive" className="text-xs font-medium text-slate-700 cursor-pointer">
                  Proses Aktif (Digunakan dalam routing produksi)
                </label>
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
                  {editingProcess ? 'Simpan Perubahan' : 'Tambah Proses'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
