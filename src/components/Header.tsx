import React, { useState } from 'react';
import { Calendar, Wallet, Layers, ShieldCheck, LogOut, Menu, Building2, RefreshCw, CheckCircle2, Cloud } from 'lucide-react';
import { AppUser, CompanySettings } from '../types';

interface HeaderProps {
  selectedMonth: string;
  onMonthChange: (month: string) => void;
  onQuickAddDeptPlanning: () => void;
  currentUser?: AppUser | null;
  onLogout?: () => void;
  companySettings?: CompanySettings;
  onToggleMobileMenu?: () => void;
  isSyncing?: boolean;
  onManualSync?: () => void;
  lastSyncedTime?: string;
}

export const Header: React.FC<HeaderProps> = ({
  selectedMonth,
  onMonthChange,
  onQuickAddDeptPlanning,
  currentUser,
  onLogout,
  companySettings,
  onToggleMobileMenu,
  isSyncing = false,
  onManualSync,
  lastSyncedTime
}) => {
  const [logoErr, setLogoErr] = useState<boolean>(false);

  return (
    <header className="bg-gradient-to-r from-indigo-800 via-indigo-700 to-purple-800 text-white p-3.5 sm:p-5 shadow-sm sticky top-0 z-30">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3.5 max-w-7xl mx-auto w-full">
        {/* Brand & Title Area */}
        <div className="flex items-center justify-between w-full md:w-auto gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {/* Hamburger Button for Mobile */}
            {onToggleMobileMenu && (
              <button
                type="button"
                onClick={onToggleMobileMenu}
                className="md:hidden p-2 rounded-xl bg-indigo-950/40 hover:bg-indigo-900 border border-indigo-300/30 text-white transition cursor-pointer"
                title="Buka Navigasi"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}

            {/* Logo */}
            {companySettings?.logoUrl && !logoErr ? (
              <div className="bg-white p-1 rounded-xl shadow-xs border border-white/20 shrink-0 h-10 w-10 flex items-center justify-center overflow-hidden">
                <img
                  src={companySettings.logoUrl}
                  alt={companySettings.companyName}
                  className="max-h-8 max-w-8 object-contain"
                  onError={() => setLogoErr(true)}
                  referrerPolicy="no-referrer"
                />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-xl bg-indigo-900/60 border border-indigo-400/30 flex items-center justify-center text-amber-300 shrink-0 shadow-xs">
                <Building2 className="w-5 h-5" />
              </div>
            )}

            {/* Text Identity */}
            <div className="min-w-0">
              <h1 className="text-base sm:text-xl font-black tracking-tight flex items-center gap-2 truncate">
                <span>{companySettings?.companyName || 'SmartBudget Control'}</span>
              </h1>
              <div className="flex items-center gap-2 text-indigo-200 text-[11px] sm:text-xs truncate">
                <span>Kontrol Anggaran &bull; Dept Planning &bull; Realisasi</span>
              </div>
            </div>
          </div>

          {/* Quick User Avatar & Sync on mobile */}
          <div className="flex md:hidden items-center gap-1.5">
            {onManualSync && (
              <button
                type="button"
                onClick={onManualSync}
                disabled={isSyncing}
                className="p-2 bg-indigo-950/40 rounded-lg border border-indigo-300/20 text-indigo-200 hover:text-white"
                title="Sinkronkan data desktop & handphone"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-amber-300' : ''}`} />
              </button>
            )}

            {currentUser && (
              <div className="flex items-center gap-1.5 bg-indigo-950/40 px-2 py-1 rounded-lg border border-indigo-300/20 text-xs">
                <div className="w-6 h-6 rounded-full bg-amber-400 text-slate-950 font-black flex items-center justify-center text-[10px]">
                  {currentUser.name.charAt(0).toUpperCase()}
                </div>
                {onLogout && (
                  <button
                    onClick={onLogout}
                    className="p-1 text-indigo-200 hover:text-white rounded cursor-pointer"
                    title="Keluar"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Controls: Sync Status, Month picker, Quick add, User profile */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-between md:justify-end">
          {/* Cloud Synchronization Indicator */}
          <div
            className="hidden sm:flex items-center gap-2 bg-indigo-950/40 backdrop-blur-md px-3 py-1.5 rounded-xl border border-indigo-300/20 text-xs"
            title="Sinkronisasi otomatis real-time antara Desktop dan Handphone"
          >
            <div className="relative flex items-center justify-center">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            </div>
            <div className="text-[11px] leading-tight">
              <span className="font-semibold text-emerald-300 flex items-center gap-1">
                <Cloud className="w-3 h-3 text-emerald-400" />
                <span>Sync Desktop &amp; HP</span>
              </span>
              {lastSyncedTime && (
                <span className="text-[9px] text-indigo-200 block font-mono">{lastSyncedTime}</span>
              )}
            </div>

            {onManualSync && (
              <button
                type="button"
                onClick={onManualSync}
                disabled={isSyncing}
                className="p-1 rounded-lg hover:bg-indigo-800/70 text-indigo-200 hover:text-white transition cursor-pointer ml-1"
                title="Sinkronkan data sekarang"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-amber-300' : ''}`} />
              </button>
            )}
          </div>

          {/* Month Selector */}
          <div className="bg-indigo-950/40 backdrop-blur-md px-3 py-1.5 rounded-xl border border-indigo-300/30 flex items-center gap-2 shadow-xs flex-1 sm:flex-initial">
            <Calendar className="w-4 h-4 text-indigo-200 shrink-0" />
            <span className="text-xs text-indigo-200 font-medium hidden sm:inline">Bulan:</span>
            <input
              type="month"
              id="selectedMonth"
              value={selectedMonth}
              onChange={e => onMonthChange(e.target.value)}
              className="bg-transparent text-white font-bold text-xs sm:text-sm focus:outline-none cursor-pointer w-full sm:w-auto"
            />
          </div>

          {/* Quick Add Dept Planning Button (only if user has deptPlanning permission or admin) */}
          {(!currentUser || currentUser.role === 'admin' || currentUser.permissions.includes('deptPlanning')) && (
            <button
              onClick={onQuickAddDeptPlanning}
              className="px-3.5 py-2 sm:py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <Layers className="w-3.5 h-3.5 shrink-0" />
              <span>+ Dept Planning</span>
            </button>
          )}

          {/* User Info & Logout Button (Desktop) */}
          {currentUser && (
            <div className="hidden md:flex items-center gap-2 bg-indigo-950/50 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-indigo-300/20 text-xs">
              <div className="w-7 h-7 rounded-full bg-amber-400 text-slate-950 font-black flex items-center justify-center text-xs">
                {currentUser.name.charAt(0).toUpperCase()}
              </div>
              <div className="text-left">
                <div className="font-bold text-white text-[11px] leading-tight truncate max-w-[120px]">
                  {currentUser.name}
                </div>
                <div className="text-[10px] text-indigo-200 truncate">{currentUser.roleLabel}</div>
              </div>

              {onLogout && (
                <button
                  onClick={onLogout}
                  className="p-1.5 text-indigo-200 hover:text-white hover:bg-indigo-800/80 rounded-lg transition cursor-pointer ml-1"
                  title="Keluar / Logout"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

