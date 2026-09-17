import React, { useState } from 'react';
import {
  Home,
  LayoutGrid,
  Layers,
  DollarSign,
  Building2,
  BookOpen,
  ArrowLeftRight,
  UploadCloud,
  Wallet,
  Users,
  LogOut,
  ShieldCheck,
  Settings,
  History,
  TrendingUp,
  Box,
  Boxes,
  ChevronDown,
  ChevronRight,
  FileSpreadsheet,
  ShoppingCart,
  Truck,
  Briefcase,
  PackageCheck,
  Workflow,
  CircleDollarSign,
  X
} from 'lucide-react';
import { AppPermission, AppUser, CompanySettings } from '../types';

interface NavSubItem {
  id: string;
  label: string;
  category?: string;  subItems?: { id: string; label: string; category?: string; }[];
}

interface NavItem {
  id: AppPermission;
  label: string;
  icon: any;
  subItems?: NavSubItem[];
}

interface SidebarProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  currentUser: AppUser | null;
  onLogout: () => void;
  companySettings?: CompanySettings;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  currentUser,
  onLogout,
  companySettings,
  mobileOpen = false,
  onCloseMobile
}) => {
  const [openSubMenus, setOpenSubMenus] = useState<Record<string, boolean>>({
    budget: true,
    cashBank: true,
    purchase: true,
    inventory: true,
    sales: true
  });

  const toggleSubMenu = (menuId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setOpenSubMenus(prev => ({
      ...prev,
      [menuId]: !prev[menuId]
    }));
  };

  const navGroups: { group: string; items: NavItem[] }[] = [
    {
      group: 'Workspace',
      items: [
        {
          id: 'budget',
          label: 'Budget',
          icon: FileSpreadsheet,
          subItems: [
            { id: 'dashboard', label: 'Summary Budget', category: 'dashboard' },
            { id: 'planner', label: 'Rencana Anggaran', category: 'planner' },
            { id: 'deptPlanning', label: 'Dept Planning', category: 'deptPlanning' },
            { id: 'realisasi', label: 'Realisasi Budget', category: 'realisasi' },
          ]
        },
        {
          id: 'cashBank',
          label: 'Kas dan bank',
          icon: Wallet,
          subItems: [
            { id: 'buku-bank', label: 'Buku Bank', category: 'buku_bank' },
            { id: 'penerimaan', label: 'Penerimaan', category: 'penerimaan' },
            { id: 'pembayaran', label: 'Pembayaran', category: 'pembayaran' },
          ]
        },
        {
          id: 'purchase',
          label: 'Purchase',
          icon: ShoppingCart,
          subItems: [
            { id: 'purchase-request', label: 'Purchase Request', category: 'purchase_request' },
            { id: 'purchase-order', label: 'Purchase Order', category: 'purchase_order' },
          ]
        },
        {
          id: 'sales',
          label: 'Sales',
          icon: TrendingUp,
          subItems: [
            { id: 'sales-plan', label: 'Sales Plan', category: 'sales_plan' },
            { id: 'sales-delivery', label: 'Sales Delivery', category: 'sales_delivery' },
            { id: 'sales-invoice', label: 'Sales Invoice', category: 'sales_invoice' },
          ]
        },
        { id: 'fixedAsset', label: 'Fixed Asset', icon: Box },
        {
          id: 'inventory',
          label: 'Inventory',
          icon: Boxes,
          subItems: [
            { id: 'inventory-raw-material', label: 'Raw Material', category: 'raw_material' },
            { 
              id: 'inventory-mold-sparepart', 
              label: 'Mold & Spare Part', 
              category: 'mold_sparepart',
              subItems: [
                { id: 'mold-2rcf', label: 'CF Dies 2R (CF2R)', category: '2RCF' },
                { id: 'mold-4rcf', label: 'CF Dies 4R (CFD4R)', category: '4RCF' },
                { id: 'mold-2rmc', label: 'CF Machine 2R (CFM2R)', category: '2RMC' },
                { id: 'mold-2rtl', label: 'Tools 2R', category: '2RTL' },
                { id: 'mold-4rtl', label: 'Tools 4R', category: '4RTL' },
                { id: 'mold-mtel', label: 'Electric', category: 'MTEL' },
                { id: 'mold-2rsp', label: '2R Spare Cons (2Rcon)', category: '2RSP' },
                { id: 'mold-2rhl', label: '2R Holder Part (2RHP)', category: '2RHL' },
                { id: 'mold-4rsp', label: '4R Spare Cons (4Rcon)', category: '4RSP' },
                { id: 'mold-4rhl', label: '4R Holder List (4RHL)', category: '4RHL' },
                { id: 'mold-4rhp', label: '4R Holder Part (4RHP)', category: '4RHP' },
                { id: 'mold-4rbs', label: 'Bush1', category: '4RBS' },
                { id: 'mold-mtmc', label: 'Mekanik (Mech)', category: 'MTMC' },
                { id: 'mold-mtbo', label: 'Belt & Oring', category: 'MTBO' },
                { id: 'mold-prdw', label: 'Dowa', category: 'PRDW' },
                { id: 'mold-prfr', label: 'Frame', category: 'PRFR' },
                { id: 'mold-prsh', label: 'Shot Blast', category: 'PRSH' },
                { id: 'mold-oil', label: 'Oil', category: 'OIL' },
              ]
            },
            { id: 'inventory-wip', label: 'Work In Process', category: 'wip' },
            { id: 'inventory-finish-good', label: 'Finish Good', category: 'finish_good' },
          ]
        },
      ]
    },
    {
      group: 'Master Data',
      items: [
        { id: 'dept', label: 'Master Department', icon: Building2 },
        { id: 'supplier', label: 'Supplier', icon: Truck },
        { id: 'customer', label: 'Customer', icon: Briefcase },
        { id: 'itemStock', label: 'Item Stock', icon: PackageCheck },
        { id: 'masterProcess', label: 'Proses Produksi', icon: Workflow },
        { id: 'dailyRates', label: 'Rate Harian (BI & KMK)', icon: CircleDollarSign },
        { id: 'coa', label: 'COA', icon: BookOpen },
        { id: 'rate', label: 'Exchange Rate', icon: ArrowLeftRight },
      ]
    },
    {
      group: 'Administration',
      items: [
        { id: 'users', label: 'Manajemen User', icon: Users },
        { id: 'auditLog', label: 'Log Activity (Audit)', icon: History },
        { id: 'backup', label: 'Backup & Data', icon: UploadCloud },
        { id: 'settings', label: 'Pengaturan Perusahaan', icon: Settings },
      ]
    }
  ];

  const handleTabClick = (tabId: string) => {
    onSelectTab(tabId);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const sidebarContent = (
    <div className="flex flex-col h-full select-none">
      {/* Brand logo & Company Identity */}
      <div className="px-2 sm:px-3 mb-5 pb-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          {companySettings?.logoUrl ? (
            <div className="w-9 h-9 rounded-xl bg-white p-1 flex items-center justify-center shrink-0 shadow-md shadow-indigo-500/20 overflow-hidden">
              <img
                src={companySettings.logoUrl}
                alt="Logo"
                className="max-h-7 max-w-7 object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
          ) : (
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 shrink-0">
              <Wallet className="w-5 h-5 text-amber-300" />
            </div>
          )}
          <div className="block min-w-0">
            <div className="text-sm font-extrabold text-white tracking-tight leading-tight truncate">
              {companySettings?.companyName || 'SmartBudget'}
            </div>
            <small className="text-[10px] text-indigo-300 block truncate">Sistem Kontrol Anggaran</small>
          </div>
        </div>

        {/* Mobile Close Button */}
        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="md:hidden text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition cursor-pointer"
            title="Tutup Menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation Groups Filtered by User Permissions */}
      <div className="space-y-5 flex-1 overflow-y-auto pr-1">
        {navGroups.map((group, gIdx) => {
          const visibleItems = group.items.filter(item => {
            if (!currentUser) return true;
            if (currentUser.role === 'admin') return true;

            if (group.group === 'Master Data') {
              return (
                currentUser.permissions.includes(item.id) ||
                currentUser.permissions.includes('dept') ||
                currentUser.role === 'finance' ||
                currentUser.role === 'dept_user'
              );
            }

            if (item.id === 'budget') {
              return (
                currentUser.permissions.includes('budget') ||
                currentUser.permissions.includes('dashboard') ||
                currentUser.permissions.includes('planner') ||
                currentUser.permissions.includes('deptPlanning') ||
                currentUser.permissions.includes('realisasi')
              );
            }
            if (item.id === 'purchase') {
              return (
                currentUser.permissions.includes('purchase') ||
                currentUser.permissions.includes('purchaseRequest') ||
                currentUser.permissions.includes('purchaseOrder')
              );
            }
            if (item.id === 'sales') {
              return (
                currentUser.permissions.includes('sales') ||
                currentUser.permissions.includes('salesPlan') ||
                currentUser.permissions.includes('salesDelivery') ||
                currentUser.permissions.includes('salesInvoice')
              );
            }
            return currentUser.permissions.includes(item.id);
          });

          if (visibleItems.length === 0) return null;

          return (
            <div key={gIdx}>
              <div className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                {group.group}
              </div>
              <div className="space-y-1">
                {visibleItems.map(item => {
                  const IconComponent = item.icon;
                  const hasSubItems = item.subItems && item.subItems.length > 0;
                  const isSubOpen = !!openSubMenus[item.id];
                  const isDirectActive = activeTab === item.id;
                  const isSubActive = hasSubItems && item.subItems!.some(s =>
                    activeTab === s.id || activeTab === s.category ||
                    (item.id === 'budget' && (
                      ((activeTab === 'dashboard' || activeTab === 'budget') && s.id === 'dashboard') ||
                      (activeTab === 'planner' && s.id === 'planner') ||
                      (activeTab === 'deptPlanning' && s.id === 'deptPlanning') ||
                      (activeTab === 'realisasi' && s.id === 'realisasi')
                    )) ||
                    (item.id === 'purchase' && (
                      ((activeTab === 'purchase' || activeTab === 'purchase-request' || activeTab === 'purchaseRequest') && s.id === 'purchase-request') ||
                      ((activeTab === 'purchase-order' || activeTab === 'purchaseOrder') && s.id === 'purchase-order')
                    )) ||
                    (activeTab === 'inventory' && s.id === 'inventory-raw-material') ||
                    ((activeTab === 'sales' || activeTab === 'salesPlan') && s.id === 'sales-plan') ||
                    (activeTab === 'salesDelivery' && s.id === 'sales-delivery') ||
                    (activeTab === 'salesInvoice' && s.id === 'sales-invoice')
                  );
                  const isParentActive = isDirectActive || isSubActive;

                  if (hasSubItems) {
                    return (
                      <div key={item.id} className="space-y-1">
                        <div
                          id={`tab-${item.id}`}
                          onClick={() => {
                            if (!isParentActive) {
                              setOpenSubMenus(prev => ({ ...prev, [item.id]: true }));
                              handleTabClick(item.subItems![0].id);
                            } else {
                              toggleSubMenu(item.id);
                            }
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition cursor-pointer text-left ${
                            isParentActive
                              ? 'bg-indigo-600/20 text-white font-semibold border border-indigo-500/30'
                              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/70'
                          }`}
                          title={item.label}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <IconComponent className={`w-4 h-4 shrink-0 ${isParentActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                            <span className="truncate">{item.label}</span>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => toggleSubMenu(item.id, e)}
                            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700/50 transition cursor-pointer shrink-0"
                            title={isSubOpen ? 'Tutup sub menu' : 'Buka sub menu'}
                          >
                            {isSubOpen ? (
                              <ChevronDown className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronRight className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>

                        {/* Sub-Items List */}
                        {isSubOpen && (
                          <div className="pl-6 pr-1 py-0.5 space-y-1 border-l-2 border-slate-800 ml-4">
                            {item.subItems!.map(sub => {
                              const isSubItemActive =
                                activeTab === sub.id ||
                                activeTab === sub.category ||
                                (item.id === 'budget' && (
                                  ((activeTab === 'dashboard' || activeTab === 'budget') && sub.id === 'dashboard') ||
                                  (activeTab === 'planner' && sub.id === 'planner') ||
                                  (activeTab === 'deptPlanning' && sub.id === 'deptPlanning') ||
                                  (activeTab === 'realisasi' && sub.id === 'realisasi')
                                )) ||
                                (activeTab === 'inventory' && sub.id === 'inventory-raw-material') ||
                                ((activeTab === 'sales' || activeTab === 'salesPlan') && sub.id === 'sales-plan') ||
                                (activeTab === 'salesDelivery' && sub.id === 'sales-delivery') ||
                                (activeTab === 'salesInvoice' && sub.id === 'sales-invoice') ||
                                (sub.subItems && sub.subItems.some(ss => activeTab === ss.id));

                              const hasNestedSubItems = sub.subItems && sub.subItems.length > 0;
                              const isNestedSubOpen = !!openSubMenus[sub.id];

                              return (
                                <div key={sub.id} className="space-y-1">
                                  <button
                                    id={`tab-${sub.id}`}
                                    onClick={() => {
                                      if (hasNestedSubItems) {
                                        setOpenSubMenus(prev => ({ ...prev, [sub.id]: !prev[sub.id] }));
                                        handleTabClick(sub.id);
                                      } else {
                                        handleTabClick(sub.id);
                                      }
                                    }}
                                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer text-left ${
                                      isSubItemActive
                                        ? 'bg-indigo-600 text-white font-bold shadow-xs shadow-indigo-600/30'
                                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                                    }`}
                                    title={sub.label}
                                  >
                                    <div className="flex items-center gap-2">
                                      <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                        isSubItemActive ? 'bg-white' : 'bg-slate-500'
                                      }`} />
                                      <span className="truncate">{sub.label}</span>
                                    </div>
                                    {hasNestedSubItems && (
                                      <div className={`transition-transform ${isNestedSubOpen ? 'rotate-180' : ''}`}>
                                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                                      </div>
                                    )}
                                  </button>

                                  {hasNestedSubItems && isNestedSubOpen && (
                                    <div className="pl-4 pr-1 py-0.5 space-y-1 ml-2 border-l border-slate-700/50">
                                      {sub.subItems!.map(nested => {
                                        const isNestedActive = activeTab === nested.id;
                                        return (
                                          <button
                                            key={nested.id}
                                            id={`tab-${nested.id}`}
                                            onClick={() => handleTabClick(nested.id)}
                                            className={`w-full flex items-center gap-2 px-2.5 py-1 rounded-md text-[11px] font-medium transition cursor-pointer text-left ${
                                              isNestedActive
                                                ? 'text-indigo-300 font-bold bg-slate-800/80'
                                                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/40'
                                            }`}
                                            title={nested.label}
                                          >
                                            <span className="truncate">- {nested.label}</span>
                                          </button>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  }

                  return (
                    <button
                      key={item.id}
                      id={`tab-${item.id}`}
                      onClick={() => handleTabClick(item.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition cursor-pointer text-left ${
                        isDirectActive
                          ? 'bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-600/30'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/70'
                      }`}
                      title={item.label}
                    >
                      <IconComponent className={`w-4 h-4 shrink-0 ${isDirectActive ? 'text-white' : 'text-slate-400'}`} />
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Current User Profile & Logout */}
      {currentUser && (
        <div className="pt-4 border-t border-slate-800/90 mt-3">
          <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-800/60 border border-slate-700/60">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                {currentUser.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="font-bold text-xs text-white truncate leading-tight">
                  {currentUser.name}
                </div>
                <div className="text-[10px] text-indigo-300 font-medium flex items-center gap-1 mt-0.5 truncate">
                  <ShieldCheck className="w-3 h-3 text-indigo-400 shrink-0" />
                  <span className="truncate">{currentUser.roleLabel}</span>
                </div>
              </div>
            </div>

            <button
              onClick={onLogout}
              className="text-slate-400 hover:text-rose-400 hover:bg-slate-700/50 p-2 rounded-lg transition cursor-pointer"
              title="Keluar / Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:flex w-64 bg-slate-900 text-slate-300 flex-col shrink-0 min-h-screen py-5 px-4 border-r border-slate-800">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          {/* Slide-over Drawer */}
          <div className="relative w-72 max-w-[85vw] bg-slate-900 text-slate-300 flex-col p-5 shadow-2xl z-10 flex h-full">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};

