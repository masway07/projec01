import React, { useRef } from 'react';
import { Download, Upload, Trash2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { AppState } from '../types';

interface BackupDataViewProps {
  appState: AppState;
  onRestoreState: (newState: AppState) => void;
  onResetState: () => void;
}

export const BackupDataView: React.FC<BackupDataViewProps> = ({
  appState,
  onRestoreState,
  onResetState
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(appState, null, 2));
    const downloadAnchor = document.createElement('a');
    const filename = `smartbudget_backup_${new Date().toISOString().substring(0, 10)}.json`;

    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', filename);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = e => {
      try {
        const parsed = JSON.parse(e.target?.result as string);
        if (parsed && (parsed.monthlyData || parsed.deptPlanningItems)) {
          onRestoreState(parsed);
          alert('Data berhasil dipulihkan dari file JSON!');
        } else {
          alert('Format file JSON tidak valid.');
        }
      } catch (err) {
        alert('Gagal memproses file JSON cadangan.');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleConfirmReset = () => {
    if (window.confirm('PERINGATAN: Apakah Anda yakin ingin MENGHAPUS SEMUA DATA keuangan dari browser? Tindakan ini tidak dapat dibatalkan.')) {
      onResetState();
      alert('Seluruh data berhasil dikosongkan.');
    }
  };

  return (
    <div id="view-backup" className="space-y-6">
      <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-amber-900 text-sm flex gap-3 items-start shadow-xs">
        <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
        <div>
          <h4 className="font-bold">Informasi Penyimpanan Browser (LocalStorage)</h4>
          <p className="mt-1 text-xs text-amber-800">
            Aplikasi ini menyimpan seluruh data transaksi, Department Planning (A. Budget, B. Cost Down, C. Plan), Master COA, dan Master Department secara lokal dan aman di browser. Gunakan fitur <strong>Export Data</strong> secara rutin untuk membuat cadangan berkas.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Export / Backup */}
        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-xs space-y-3">
          <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
            <Download className="w-5 h-5 text-emerald-600" /> Export Data (Cadangan)
          </h3>
          <p className="text-xs text-slate-500">
            Unduh seluruh data anggaran bulanan, department planning, master departemen, dan master COA dalam bentuk berkas .json ke komputer/gadget Anda.
          </p>
          <button
            onClick={handleExport}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-4 py-2.5 rounded-lg text-sm transition flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <Download className="w-4 h-4" /> Unduh File Backup JSON
          </button>
        </div>

        {/* Import / Restore */}
        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-xs space-y-3">
          <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
            <Upload className="w-5 h-5 text-indigo-600" /> Import Data (Pemulihan)
          </h3>
          <p className="text-xs text-slate-500">
            Pilih file .json cadangan yang pernah diunduh sebelumnya untuk memulihkan seluruh data dan rencana anggaran.
          </p>
          <input
            type="file"
            id="importFile"
            ref={fileInputRef}
            accept=".json"
            className="hidden"
            onChange={handleImport}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2.5 rounded-lg text-sm transition flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <Upload className="w-4 h-4" /> Pilih File JSON & Pulihkan
          </button>
        </div>
      </div>

      {/* Reset Data Box */}
      <div className="bg-white border border-rose-200 p-5 rounded-xl shadow-xs space-y-3">
        <h3 className="font-bold text-rose-600 text-base flex items-center gap-2">
          <Trash2 className="w-5 h-5" /> Hapus Seluruh Data
        </h3>
        <p className="text-xs text-slate-500">
          Tindakan ini akan mengosongkan seluruh kategori, anggaran, catatan pengeluaran, dan data Dept Planning dari memori browser secara permanen.
        </p>
        <button
          onClick={handleConfirmReset}
          className="bg-rose-600 hover:bg-rose-700 text-white font-medium px-4 py-2 rounded-lg text-sm transition cursor-pointer"
        >
          Kosongkan Semua Data
        </button>
      </div>
    </div>
  );
};
