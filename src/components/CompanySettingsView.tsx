import React, { useState, useEffect } from 'react';
import {
  Building2,
  Image as ImageIcon,
  MapPin,
  Save,
  RotateCcw,
  CheckCircle2,
  Upload,
  ExternalLink,
  ShieldCheck,
  FileSpreadsheet,
  Printer
} from 'lucide-react';
import { CompanySettings } from '../types';
import { DEFAULT_COMPANY_SETTINGS } from '../constants/defaultData';

interface CompanySettingsViewProps {
  companySettings: CompanySettings;
  onSaveSettings: (settings: CompanySettings) => void;
}

export const CompanySettingsView: React.FC<CompanySettingsViewProps> = ({
  companySettings,
  onSaveSettings
}) => {
  const [companyName, setCompanyName] = useState<string>(
    companySettings?.companyName || DEFAULT_COMPANY_SETTINGS.companyName
  );
  const [logoUrl, setLogoUrl] = useState<string>(
    companySettings?.logoUrl || DEFAULT_COMPANY_SETTINGS.logoUrl
  );
  const [address, setAddress] = useState<string>(
    companySettings?.address || DEFAULT_COMPANY_SETTINGS.address
  );
  const [imageError, setImageError] = useState<boolean>(false);
  const [isSavedRecently, setIsSavedRecently] = useState<boolean>(false);

  useEffect(() => {
    if (companySettings) {
      setCompanyName(companySettings.companyName || DEFAULT_COMPANY_SETTINGS.companyName);
      setLogoUrl(companySettings.logoUrl || DEFAULT_COMPANY_SETTINGS.logoUrl);
      setAddress(companySettings.address || DEFAULT_COMPANY_SETTINGS.address);
      setImageError(false);
    }
  }, [companySettings]);

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const updated: CompanySettings = {
      companyName: companyName.trim() || DEFAULT_COMPANY_SETTINGS.companyName,
      logoUrl: logoUrl.trim() || DEFAULT_COMPANY_SETTINGS.logoUrl,
      address: address.trim() || DEFAULT_COMPANY_SETTINGS.address
    };
    onSaveSettings(updated);
    setIsSavedRecently(true);
    setTimeout(() => setIsSavedRecently(false), 3000);
  };

  const handleReset = () => {
    if (window.confirm('Kembalikan informasi perusahaan ke pengaturan default (PT. KANETA INDONESIA)?')) {
      setCompanyName(DEFAULT_COMPANY_SETTINGS.companyName);
      setLogoUrl(DEFAULT_COMPANY_SETTINGS.logoUrl);
      setAddress(DEFAULT_COMPANY_SETTINGS.address);
      setImageError(false);
      onSaveSettings(DEFAULT_COMPANY_SETTINGS);
      setIsSavedRecently(true);
      setTimeout(() => setIsSavedRecently(false), 3000);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Mohon pilih file gambar yang valid (PNG, JPG, SVG, WebP).');
      return;
    }

    // Limit file size to 2MB to prevent localStorage bloat
    if (file.size > 2 * 1024 * 1024) {
      alert('Ukuran file maksimal adalah 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setLogoUrl(reader.result);
        setImageError(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shrink-0 shadow-xs">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Pengaturan Perusahaan</h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Konfigurasi identitas perusahaan untuk tampilan login, bilah header aplikasi, dan kop dokumen export/print.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={handleReset}
              className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              title="Reset ke default"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Default</span>
            </button>

            <button
              type="button"
              onClick={() => handleSave()}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 flex items-center gap-1.5 transition cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Perubahan</span>
            </button>
          </div>
        </div>

        {isSavedRecently && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">Informasi perusahaan berhasil disimpan dan langsung diterapkan ke seluruh sistem!</span>
          </div>
        )}
      </div>

      {/* Main Settings Card */}
      <div className="card bg-white border border-slate-200 rounded-2xl p-5 sm:p-7 shadow-sm">
        <div className="border-b border-slate-100 pb-4 mb-6">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-600" />
            <span>Informasi Perusahaan</span>
          </h3>
          <p className="muted text-xs text-slate-500 mt-1">
            Informasi ini digunakan sebagai identitas perusahaan pada aplikasi dan dapat digunakan kembali pada laporan/export.
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-5">
          <div className="formgrid grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Nama PT */}
            <div className="field space-y-1.5">
              <label htmlFor="setCompanyName" className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Nama PT / Perusahaan <span className="text-rose-500">*</span>
              </label>
              <input
                id="setCompanyName"
                type="text"
                value={companyName}
                onChange={e => setCompanyName(e.target.value)}
                placeholder="Contoh: PT ABC Indonesia"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 text-sm font-semibold text-slate-800 transition outline-none"
                required
              />
              <span className="text-[11px] text-slate-400 block">
                Nama resmi PT yang akan dicantumkan di kop laporan dan layar login.
              </span>
            </div>

            {/* Logo URL */}
            <div className="field space-y-1.5">
              <label htmlFor="setLogoUrl" className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Logo URL / File Gambar
              </label>
              <div className="flex gap-2">
                <input
                  id="setLogoUrl"
                  type="text"
                  value={logoUrl}
                  onChange={e => {
                    setLogoUrl(e.target.value);
                    setImageError(false);
                  }}
                  placeholder="https://.../logo.png"
                  className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 text-xs sm:text-sm font-mono text-slate-700 transition outline-none truncate"
                />
                <label className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 rounded-xl cursor-pointer text-xs font-semibold flex items-center gap-1 shrink-0 transition" title="Upload dari komputer">
                  <Upload className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Upload</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
              <span className="text-[11px] text-slate-400 block">
                Masukkan tautan gambar web (URL) atau unggah file logo dari komputer Anda.
              </span>
            </div>

            {/* Alamat Lengkap */}
            <div className="field md:col-span-2 space-y-1.5" style={{ gridColumn: '1 / -1' }}>
              <label htmlFor="setAddress" className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Alamat Kantor / Pabrik <span className="text-rose-500">*</span>
              </label>
              <textarea
                id="setAddress"
                rows={2}
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder="Alamat lengkap perusahaan"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 text-sm text-slate-800 transition outline-none resize-y"
                required
              />
              <span className="text-[11px] text-slate-400 block">
                Alamat lengkap yang akan dicetak di bawah nama perusahaan pada header PDF dan Excel.
              </span>
            </div>
          </div>

          {/* Logo Preview Card */}
          <div className="pt-3 border-t border-slate-100" style={{ marginTop: '14px' }}>
            <label className="muted block text-xs font-bold text-slate-600 mb-2">
              Preview Logo
            </label>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="w-48 h-24 bg-white rounded-lg border border-slate-200 p-2 flex items-center justify-center overflow-hidden shadow-xs shrink-0">
                {logoUrl && !imageError ? (
                  <img
                    src={logoUrl}
                    alt="Logo"
                    className="max-w-[180px] max-h-[90px] object-contain"
                    style={{
                      maxWidth: '180px',
                      maxHeight: '90px',
                      objectFit: 'contain'
                    }}
                    onError={() => setImageError(true)}
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="text-center text-slate-400 text-xs flex flex-col items-center">
                    <ImageIcon className="w-8 h-8 text-slate-300 mb-1" />
                    <span>Logo tidak tersedia / error</span>
                  </div>
                )}
              </div>

              <div className="text-xs text-slate-600 space-y-1">
                <div className="font-bold text-slate-800 text-sm">{companyName || 'Nama Perusahaan'}</div>
                <div className="text-slate-500 text-xs flex items-start gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <span>{address || 'Alamat Perusahaan'}</span>
                </div>
                <div className="text-[11px] text-indigo-600 font-medium pt-1">
                  Format optimal: Gambar rasio lebar (PNG/JPG transparan) resolusi minimal 200x80px.
                </div>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => handleSave()}
              className="w-full sm:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-md shadow-indigo-600/20 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Informasi Perusahaan</span>
            </button>
          </div>
        </form>
      </div>

      {/* Preview Section: How it looks on Reports & Login */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Preview on Export/PDF Kop Laporan */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
            <Printer className="w-4 h-4 text-indigo-600" />
            <span>Simulasi Kop Laporan (PDF / Print)</span>
          </div>
          <div className="p-4 rounded-xl border border-dashed border-slate-300 bg-slate-50/50 space-y-2 text-center">
            <div className="flex items-center justify-center gap-3">
              {logoUrl && !imageError && (
                <img
                  src={logoUrl}
                  alt="Logo Kop"
                  className="h-10 w-auto object-contain"
                  onError={() => setImageError(true)}
                  referrerPolicy="no-referrer"
                />
              )}
              <div className="text-left">
                <div className="text-sm font-black text-slate-900 tracking-tight">{companyName}</div>
                <div className="text-[10px] text-slate-500 max-w-xs">{address}</div>
              </div>
            </div>
            <div className="border-t border-slate-300 pt-1.5 mt-2">
              <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                Laporan Kontrol Anggaran &amp; Realisasi Budget
              </span>
            </div>
          </div>
        </div>

        {/* Preview on Excel Export */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Simulasi Header Excel (.CSV / .XLS)</span>
          </div>
          <div className="p-4 rounded-xl border border-dashed border-slate-300 bg-slate-50/50 space-y-1.5 font-mono text-[11px] text-slate-700">
            <div className="text-emerald-700 font-bold">{companyName}</div>
            <div className="text-slate-500 text-[10px] truncate">{address}</div>
            <div className="text-slate-900 font-semibold pt-1">REKAP REALISASI BUDGET - TAHUN 2026</div>
            <div className="text-slate-400 text-[9px]">Diekspor secara otomatis dari Sistem Kontrol Anggaran</div>
          </div>
        </div>
      </div>
    </div>
  );
};
