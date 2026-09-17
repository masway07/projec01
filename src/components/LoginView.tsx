import React, { useState } from 'react';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  LogIn,
  ShieldCheck,
  Building2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Layers,
  ArrowRight
} from 'lucide-react';
import { AppUser, CompanySettings } from '../types';
import { DEFAULT_COMPANY_SETTINGS } from '../constants/defaultData';

interface LoginViewProps {
  users: AppUser[];
  companySettings?: CompanySettings;
  onLogin: (user: AppUser) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  users,
  companySettings = DEFAULT_COMPANY_SETTINGS,
  onLogin
}) => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [logoError, setLogoError] = useState<boolean>(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const trimmedEmail = email.trim().toLowerCase();
    const targetUser = users.find(u => u.email.toLowerCase() === trimmedEmail);

    if (!targetUser) {
      setErrorMsg('Email tidak terdaftar dalam sistem. Silakan periksa kembali.');
      return;
    }

    if (!targetUser.isActive) {
      setErrorMsg('Akun ini dinonaktifkan oleh administrator. Silakan hubungi admin sistem.');
      return;
    }

    if (targetUser.password !== password) {
      setErrorMsg('Password yang Anda masukkan salah. Silakan coba lagi.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      onLogin(targetUser);
      setIsLoading(false);
    }, 250);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center px-4 sm:px-6 py-10 relative overflow-hidden select-none">
      {/* Background Subtle Accent Grids */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-40 pointer-events-none" />

      {/* Main Login Container */}
      <div className="w-full max-w-md relative z-10">
        {/* App Logo & Header with Company Identity */}
        <div className="text-center mb-6">
          {/* Company Logo Display */}
          <div className="flex justify-center mb-3">
            {companySettings.logoUrl && !logoError ? (
              <div className="bg-white/95 backdrop-blur-xs p-3 rounded-2xl shadow-xl shadow-indigo-950/40 border border-slate-700/50 inline-flex items-center justify-center max-w-[220px] max-h-[84px] overflow-hidden">
                <img
                  src={companySettings.logoUrl}
                  alt={companySettings.companyName}
                  className="max-h-12 w-auto object-contain"
                  onError={() => setLogoError(true)}
                  referrerPolicy="no-referrer"
                />
              </div>
            ) : (
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white shadow-xl shadow-indigo-600/30 border border-indigo-400/30">
                <Building2 className="w-8 h-8 text-amber-300" />
              </div>
            )}
          </div>

          <h1 className="text-2xl font-black text-white tracking-tight leading-snug">
            {companySettings.companyName || 'PT. KANETA INDONESIA'}
          </h1>
          <p className="text-indigo-200 text-xs font-semibold mt-0.5">
            Sistem Kontrol Anggaran &amp; Realisasi Budget
          </p>
          {companySettings.address && (
            <p className="text-slate-400 text-[11px] mt-1 line-clamp-1 max-w-sm mx-auto px-4">
              {companySettings.address}
            </p>
          )}
        </div>

        {/* Login Card */}
        <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-md">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <LogIn className="w-5 h-5 text-indigo-400" />
              <span>Masuk ke Akun Anda</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Masukkan email dan kata sandi Anda untuk mengakses sistem.
            </p>
          </div>

          {errorMsg && (
            <div className="mb-5 p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                Alamat Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="nama@perusahaan.com"
                className="w-full px-3.5 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              />
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  Kata Sandi
                </label>
              </div>

              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Masukkan password Anda..."
                  className="w-full px-3.5 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-white text-sm font-mono placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent pr-10 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200 cursor-pointer"
                  title={showPassword ? 'Sembunyikan' : 'Tampilkan'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-2 cursor-pointer text-sm"
            >
              {isLoading ? (
                <span className="flex items-center gap-2 text-xs">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Memverifikasi Akun...
                </span>
              ) : (
                <>
                  <span>Masuk ke Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Login Accounts */}
          <div className="mt-5 pt-4 border-t border-slate-700/80">
            <div className="text-[11px] font-semibold text-slate-400 mb-2 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Akses Cepat (Klik Akun untuk Otomatis Isi):</span>
            </div>
            <div className="space-y-1.5">
              {users.slice(0, 3).map(u => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => {
                    setEmail(u.email);
                    setPassword(u.password);
                  }}
                  className="w-full flex items-center justify-between p-2 rounded-lg bg-slate-900/60 hover:bg-slate-700/60 text-left transition cursor-pointer border border-slate-700/50"
                >
                  <div className="min-w-0 pr-2">
                    <div className="text-xs font-bold text-white truncate">{u.name}</div>
                    <div className="text-[10px] text-slate-400 font-mono truncate">{u.email}</div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                    u.role === 'admin'
                      ? 'bg-purple-900/60 text-purple-300 border border-purple-700/50'
                      : u.role === 'finance'
                      ? 'bg-blue-900/60 text-blue-300 border border-blue-700/50'
                      : 'bg-emerald-900/60 text-emerald-300 border border-emerald-700/50'
                  }`}>
                    {u.roleLabel}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer info */}
        <p className="text-center text-[11px] text-slate-500 mt-6">
          © 2026 SmartBudget Management System • Hak Akses Terenkripsi
        </p>
      </div>
    </div>
  );
};
