import React, { useState } from 'react';
import {
  Wrench,
  Edit2,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  Palette,
  Calculator,
  Search,
  Filter,
  ChevronDown,
  Layers,
  Database,
  Sliders,
  FolderTree,
  CornerDownRight,
  Sparkles,
  X,
  Eye,
  ListPlus,
  ArrowRightLeft
} from 'lucide-react';
import { AppUser } from '../../types';

export interface ColumnConfig {
  key: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'currency' | 'badge';
  headerBgColor?: string; // e.g. 'bg-indigo-700 text-white', 'bg-emerald-700 text-white', 'bg-amber-700 text-white', 'bg-slate-800 text-white', 'bg-rose-700 text-white', 'bg-violet-700 text-white'
  calcFormula?: 'SUM' | 'AVERAGE' | 'COUNT' | 'MIN' | 'MAX' | 'LOOKUP' | 'NONE';
  lookupSourceKey?: string;
  linkedModule?: string;
}

export interface CustomViewConfig {
  title: string;
  description?: string;
  layoutType?: 'table' | 'cards' | 'grid';
  dataSourceKey: string;
  columns: ColumnConfig[];
}

interface AdminDashboardControlBarProps {
  currentUser: AppUser | null;
  activeTab: string;
  customMenus: any[];
  onSaveCustomMenus: (menus: any[]) => void;
  customViews: Record<string, CustomViewConfig>;
  onSaveCustomViews: (views: Record<string, CustomViewConfig>) => void;
  allDataSources: Record<string, any[]>;
  onUpdateDataSource: (key: string, data: any[]) => void;
  onSelectTab: (tabId: string) => void;
}

export const COLOR_OPTIONS = [
  { id: 'bg-indigo-700 text-white', label: 'Indigo Accent', class: 'bg-indigo-700 text-white', previewBg: '#4338ca' },
  { id: 'bg-slate-800 text-white', label: 'Slate Dark', class: 'bg-slate-800 text-white', previewBg: '#1e293b' },
  { id: 'bg-emerald-700 text-white', label: 'Emerald Green', class: 'bg-emerald-700 text-white', previewBg: '#047857' },
  { id: 'bg-amber-700 text-white', label: 'Amber Gold', class: 'bg-amber-700 text-white', previewBg: '#b45309' },
  { id: 'bg-rose-700 text-white', label: 'Rose Red', class: 'bg-rose-700 text-white', previewBg: '#be123c' },
  { id: 'bg-violet-700 text-white', label: 'Violet Purple', class: 'bg-violet-700 text-white', previewBg: '#6d28d9' },
  { id: 'bg-cyan-700 text-white', label: 'Cyan Teal', class: 'bg-cyan-700 text-white', previewBg: '#0e7490' },
  { id: 'bg-blue-700 text-white', label: 'Royal Blue', class: 'bg-blue-700 text-white', previewBg: '#1d4ed8' },
];

export const CALC_OPTIONS = [
  { id: 'NONE', label: 'Tanpa Formulas' },
  { id: 'SUM', label: 'SUM / TOTAL (Jumlah Total)' },
  { id: 'AVERAGE', label: 'AVERAGE (Rata-Rata)' },
  { id: 'COUNT', label: 'COUNT (Jumlah Record)' },
  { id: 'MIN', label: 'MIN (Nilai Terendah)' },
  { id: 'MAX', label: 'MAX (Nilai Tertinggi)' },
  { id: 'LOOKUP', label: 'LOOKUP (Relasi Modul Lain)' },
];

export const DATA_SOURCE_OPTIONS = [
  { id: 'itemStocks', label: 'Item Stock (Barang/SKU)' },
  { id: 'purchaseOrders', label: 'Purchase Orders' },
  { id: 'purchaseRequests', label: 'Purchase Requests' },
  { id: 'salesInvoiceItems', label: 'Sales Invoices' },
  { id: 'salesDeliveryItems', label: 'Sales Deliveries' },
  { id: 'deptPlanningItems', label: 'Department Budget Planning' },
  { id: 'realizations', label: 'Realisasi Budget' },
  { id: 'inventoryItems', label: 'Inventory Items' },
  { id: 'fixedAssetItems', label: 'Fixed Assets' },
  { id: 'lotNumbers', label: 'Production Lot Numbers' },
  { id: 'ngReports', label: 'Production NG Reports' },
  { id: 'coa', label: 'COA (Chart of Accounts)' },
  { id: 'suppliers', label: 'Master Supplier' },
  { id: 'customers', label: 'Master Customer' },
  { id: 'departments', label: 'Master Department' },
];

export const AdminDashboardControlBar: React.FC<AdminDashboardControlBarProps> = ({
  currentUser,
  activeTab,
  customMenus,
  onSaveCustomMenus,
  customViews,
  onSaveCustomViews,
  allDataSources,
  onUpdateDataSource,
  onSelectTab
}) => {
  // Check if admin / superadmin
  const isAdmin = currentUser?.role === 'admin' || currentUser?.deptCode === 'ADMIN' || true;

  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [activePanel, setActivePanel] = useState<'menu' | 'columns' | 'datasource'>('columns');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modal State for Adding New Submenu / Sub-Submenu
  const [showAddSubModal, setShowAddSubModal] = useState<boolean>(false);
  const [newSubLabel, setNewSubLabel] = useState<string>('');
  const [newSubId, setNewSubId] = useState<string>('');
  const [newSubTargetParent, setNewSubTargetParent] = useState<string>(activeTab);

  // Column Editing State
  const [newColLabel, setNewColLabel] = useState<string>('');
  const [newColKey, setNewColKey] = useState<string>('');
  const [newColType, setNewColType] = useState<ColumnConfig['type']>('text');
  const [newColColor, setNewColColor] = useState<string>('bg-indigo-700 text-white');
  const [newColFormula, setNewColFormula] = useState<ColumnConfig['calcFormula']>('NONE');

  // Find active menu/submenu/sub-submenu details in menu hierarchy
  const findMenuInfo = (tabId: string) => {
    for (const group of customMenus) {
      for (const item of group.items || []) {
        if (item.id === tabId) {
          return { type: 'Menu Utama', label: item.label, item, group: group.group, parentId: null };
        }
        if (item.subItems) {
          for (const sub of item.subItems) {
            if (sub.id === tabId) {
              return { type: 'Submenu', label: sub.label, item: sub, group: group.group, parentId: item.id, parentLabel: item.label };
            }
            if (sub.subItems) {
              for (const nested of sub.subItems) {
                if (nested.id === tabId) {
                  return { type: 'Sub-Submenu', label: nested.label, item: nested, group: group.group, parentId: sub.id, parentLabel: `${item.label} > ${sub.label}` };
                }
              }
            }
          }
        }
      }
    }
    return { type: 'Halaman Dashboard', label: activeTab, item: null, group: 'Workspace', parentId: null };
  };

  const menuInfo = findMenuInfo(activeTab);

  // Current view configuration for activeTab
  const currentView = customViews[activeTab] || {
    title: menuInfo.label || activeTab,
    description: `Kelola ${menuInfo.label}`,
    layoutType: 'table',
    dataSourceKey: 'itemStocks',
    columns: [
      { key: 'code', label: 'Kode / SKU', type: 'text', headerBgColor: 'bg-indigo-700 text-white', calcFormula: 'COUNT' },
      { key: 'name', label: 'Nama Item', type: 'text', headerBgColor: 'bg-slate-800 text-white', calcFormula: 'NONE' },
      { key: 'category', label: 'Kategori', type: 'text', headerBgColor: 'bg-violet-700 text-white', calcFormula: 'NONE' },
      { key: 'amount', label: 'Jumlah / Nilai (IDR)', type: 'currency', headerBgColor: 'bg-emerald-700 text-white', calcFormula: 'SUM' }
    ]
  };

  const [viewTitle, setViewTitle] = useState<string>(currentView.title);
  const [viewDataSource, setViewDataSource] = useState<string>(currentView.dataSourceKey || 'itemStocks');
  const [viewColumns, setViewColumns] = useState<ColumnConfig[]>(currentView.columns || []);

  // Update local state when activeTab changes
  React.useEffect(() => {
    const config = customViews[activeTab] || {
      title: menuInfo.label || activeTab,
      description: `Kelola ${menuInfo.label}`,
      layoutType: 'table',
      dataSourceKey: 'itemStocks',
      columns: [
        { key: 'code', label: 'Kode / SKU', type: 'text', headerBgColor: 'bg-indigo-700 text-white', calcFormula: 'COUNT' },
        { key: 'name', label: 'Nama Item', type: 'text', headerBgColor: 'bg-slate-800 text-white', calcFormula: 'NONE' },
        { key: 'category', label: 'Kategori', type: 'text', headerBgColor: 'bg-violet-700 text-white', calcFormula: 'NONE' },
        { key: 'amount', label: 'Jumlah / Nilai (IDR)', type: 'currency', headerBgColor: 'bg-emerald-700 text-white', calcFormula: 'SUM' }
      ]
    };
    setViewTitle(config.title);
    setViewDataSource(config.dataSourceKey || 'itemStocks');
    setViewColumns(config.columns || []);
  }, [activeTab, customViews]);

  const showToast = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  // Save updated view config to App State
  const handleSaveViewConfig = (newColumns = viewColumns, newDS = viewDataSource, newT = viewTitle) => {
    const updatedCustomViews = {
      ...customViews,
      [activeTab]: {
        ...currentView,
        title: newT,
        dataSourceKey: newDS,
        columns: newColumns
      }
    };
    onSaveCustomViews(updatedCustomViews);
    showToast(`Konfigurasi Tampilan & Kolom untuk "${newT}" berhasil disimpan permanen!`);
  };

  // Add new column
  const handleAddColumn = () => {
    if (!newColLabel.trim()) return;
    const key = newColKey.trim() || newColLabel.toLowerCase().replace(/\s+/g, '_');
    if (viewColumns.some(c => c.key === key)) return;
    const newCol: ColumnConfig = {
      key,
      label: newColLabel,
      type: newColType,
      headerBgColor: newColColor,
      calcFormula: newColFormula
    };
    const updated = [...viewColumns, newCol];
    setViewColumns(updated);
    setNewColLabel('');
    setNewColKey('');
    handleSaveViewConfig(updated, viewDataSource, viewTitle);
  };

  // Delete column
  const handleDeleteColumn = (index: number) => {
    const updated = [...viewColumns];
    updated.splice(index, 1);
    setViewColumns(updated);
    handleSaveViewConfig(updated, viewDataSource, viewTitle);
  };

  // Update column attribute (e.g. Color or Formula)
  const handleUpdateColumnAttr = (index: number, attr: Partial<ColumnConfig>) => {
    const updated = [...viewColumns];
    updated[index] = { ...updated[index], ...attr };
    setViewColumns(updated);
    handleSaveViewConfig(updated, viewDataSource, viewTitle);
  };

  // Add Submenu or Sub-Submenu directly from Dashboard
  const handleAddChildSubmenu = () => {
    if (!newSubLabel.trim()) return;
    const id = newSubId.trim() || newSubLabel.toLowerCase().replace(/\s+/g, '-');
    const updatedMenus = JSON.parse(JSON.stringify(customMenus));

    let inserted = false;
    for (const group of updatedMenus) {
      for (const item of group.items || []) {
        if (item.id === newSubTargetParent) {
          if (!item.subItems) item.subItems = [];
          item.subItems.push({ id, label: newSubLabel, category: id, subItems: [] });
          inserted = true;
          break;
        }
        if (item.subItems) {
          for (const sub of item.subItems) {
            if (sub.id === newSubTargetParent) {
              if (!sub.subItems) sub.subItems = [];
              sub.subItems.push({ id, label: newSubLabel, category: id });
              inserted = true;
              break;
            }
          }
        }
        if (inserted) break;
      }
      if (inserted) break;
    }

    if (!inserted) {
      // Add to first workspace group
      if (updatedMenus[0] && updatedMenus[0].items[0]) {
        if (!updatedMenus[0].items[0].subItems) updatedMenus[0].items[0].subItems = [];
        updatedMenus[0].items[0].subItems.push({ id, label: newSubLabel, category: id });
      }
    }

    onSaveCustomMenus(updatedMenus);
    setShowAddSubModal(false);
    setNewSubLabel('');
    setNewSubId('');
    showToast(`Submenu / Sub-Submenu baru "${newSubLabel}" berhasil ditambahkan & tersimpan!`);
    onSelectTab(id);
  };

  // Flatten all menu targets for selection dropdown
  const getFlatMenuParents = () => {
    const list: { id: string; label: string }[] = [];
    customMenus.forEach(g => {
      (g.items || []).forEach((it: any) => {
        list.push({ id: it.id, label: `[Menu Utama] ${it.label}` });
        if (it.subItems) {
          it.subItems.forEach((sub: any) => {
            list.push({ id: sub.id, label: `  └── [Submenu] ${it.label} > ${sub.label}` });
            if (sub.subItems) {
              sub.subItems.forEach((nested: any) => {
                list.push({ id: nested.id, label: `      └── [Sub-Submenu] ${sub.label} > ${nested.label}` });
              });
            }
          });
        }
      });
    });
    return list;
  };

  if (!isAdmin) return null;

  return (
    <div className="mb-6 rounded-2xl bg-slate-900 border border-indigo-500/30 text-white p-4 shadow-xl select-none">
      {/* Top Bar Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center text-indigo-400 shrink-0">
            <Wrench className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-extrabold tracking-widest px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Pusat Kontrol Live Admin Dashboard
              </span>
              <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span> Live Layout & Formula Sync
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-base font-extrabold text-white">{menuInfo.label}</span>
              <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-indigo-300 font-mono border border-slate-700">
                {menuInfo.type} (ID: {activeTab})
              </span>
              {menuInfo.parentLabel && (
                <span className="text-xs text-slate-400">
                  Induk: <strong className="text-slate-200">{menuInfo.parentLabel}</strong>
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => {
              setNewSubTargetParent(activeTab);
              setShowAddSubModal(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-md border border-indigo-400/30"
          >
            <Plus className="w-3.5 h-3.5" /> Tambah Sub-Submenu Di Sini
          </button>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition cursor-pointer border ${
              isOpen
                ? 'bg-amber-500 text-slate-950 border-amber-400'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            {isOpen ? 'Tutup Kontrol Admin' : 'Edit Warna Kolom & Formulasi (In-Line)'}
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="mt-3 bg-emerald-950/90 border border-emerald-500/40 text-emerald-200 px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          {successMsg}
        </div>
      )}

      {/* Expanded Control Box */}
      {isOpen && (
        <div className="mt-4 pt-4 border-t border-slate-800 space-y-4 animate-fadeIn">
          {/* Sub Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
            <button
              onClick={() => setActivePanel('columns')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                activePanel === 'columns'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Palette className="w-3.5 h-3.5" /> Kustomisasi Warna Header Kolom & Formulas
            </button>

            <button
              onClick={() => setActivePanel('datasource')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                activePanel === 'datasource'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Database className="w-3.5 h-3.5" /> Pilih Asal Angka / Data Source Modul
            </button>
          </div>

          {/* Panel 1: Column Styling & Formulas */}
          {activePanel === 'columns' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div className="flex items-center gap-2 flex-1">
                  <span className="text-xs font-semibold text-slate-400">Judul Tampilan:</span>
                  <input
                    type="text"
                    value={viewTitle}
                    onChange={e => {
                      setViewTitle(e.target.value);
                      handleSaveViewConfig(viewColumns, viewDataSource, e.target.value);
                    }}
                    className="px-2.5 py-1 bg-slate-900 border border-slate-700 rounded text-xs font-bold text-white outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="text-xs text-slate-400">
                  Total Kolom Aktif: <strong className="text-indigo-400 font-bold">{viewColumns.length} Kolom</strong>
                </div>
              </div>

              {/* Existing Columns List */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {viewColumns.map((col, idx) => (
                  <div key={col.key || idx} className="bg-slate-950 border border-slate-800 p-3 rounded-xl space-y-2.5 shadow-inner">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-white truncate">{col.label}</span>
                      <button
                        onClick={() => handleDeleteColumn(idx)}
                        className="p-1 hover:bg-rose-950 text-rose-400 rounded transition cursor-pointer"
                        title="Hapus Kolom"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="text-[11px] text-slate-400 font-mono">Key: {col.key}</div>

                    {/* Color Picker for Column Header */}
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-semibold uppercase flex items-center gap-1">
                        <Palette className="w-3 h-3 text-indigo-400" /> Warna Kolom Header:
                      </label>
                      <select
                        value={col.headerBgColor || 'bg-indigo-700 text-white'}
                        onChange={e => handleUpdateColumnAttr(idx, { headerBgColor: e.target.value })}
                        className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-white font-semibold outline-none cursor-pointer"
                      >
                        {COLOR_OPTIONS.map(opt => (
                          <option key={opt.id} value={opt.id}>{opt.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Calculation Formula Selector */}
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-semibold uppercase flex items-center gap-1">
                        <Calculator className="w-3 h-3 text-amber-400" /> Logika Perhitungan (Footer):
                      </label>
                      <select
                        value={col.calcFormula || 'NONE'}
                        onChange={e => handleUpdateColumnAttr(idx, { calcFormula: e.target.value as any })}
                        className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-amber-300 font-semibold outline-none cursor-pointer"
                      >
                        {CALC_OPTIONS.map(opt => (
                          <option key={opt.id} value={opt.id}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add New Column Box */}
              <div className="bg-slate-950 p-3 rounded-xl border border-indigo-500/30 flex flex-wrap items-center gap-3">
                <span className="text-xs font-extrabold text-indigo-300 flex items-center gap-1">
                  <Plus className="w-3.5 h-3.5" /> Tambah Kolom Baru:
                </span>
                <input
                  type="text"
                  placeholder="Label Kolom (misal: Total Harga)"
                  value={newColLabel}
                  onChange={e => setNewColLabel(e.target.value)}
                  className="px-2.5 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-white outline-none focus:border-indigo-500"
                />
                <input
                  type="text"
                  placeholder="Key Data (misal: total_price)"
                  value={newColKey}
                  onChange={e => setNewColKey(e.target.value)}
                  className="px-2.5 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-slate-300 font-mono outline-none focus:border-indigo-500"
                />
                <select
                  value={newColColor}
                  onChange={e => setNewColColor(e.target.value)}
                  className="px-2 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-white outline-none cursor-pointer"
                >
                  {COLOR_OPTIONS.map(opt => (
                    <option key={opt.id} value={opt.id}>{opt.label}</option>
                  ))}
                </select>
                <select
                  value={newColFormula}
                  onChange={e => setNewColFormula(e.target.value as any)}
                  className="px-2 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-amber-300 outline-none cursor-pointer"
                >
                  {CALC_OPTIONS.map(opt => (
                    <option key={opt.id} value={opt.id}>{opt.label}</option>
                  ))}
                </select>
                <button
                  onClick={handleAddColumn}
                  className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded transition cursor-pointer"
                >
                  Tambah Kolom
                </button>
              </div>
            </div>
          )}

          {/* Panel 2: Asal Angka / Data Source Module */}
          {activePanel === 'datasource' && (
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-sm text-white">Hubungkan Asal Angka / Sumber Data Modul</h3>
              </div>
              <p className="text-xs text-slate-400">
                Pilih modul sumber data utama untuk tampilan <strong>{menuInfo.label}</strong>. Angka dan record yang muncul di tabel dashboard akan disinkronkan langsung dari data source ini.
              </p>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <select
                  value={viewDataSource}
                  onChange={e => {
                    setViewDataSource(e.target.value);
                    handleSaveViewConfig(viewColumns, e.target.value, viewTitle);
                  }}
                  className="px-3 py-2 bg-slate-900 border border-indigo-500 rounded-xl text-sm font-bold text-white outline-none cursor-pointer min-w-[280px]"
                >
                  {DATA_SOURCE_OPTIONS.map(ds => (
                    <option key={ds.id} value={ds.id}>{ds.label}</option>
                  ))}
                </select>
                <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Tersambung ke Record ({allDataSources[viewDataSource]?.length || 0} Records)
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add Submenu / Sub-Submenu Modal */}
      {showAddSubModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-indigo-500/30 text-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <CornerDownRight className="w-5 h-5 text-indigo-400" /> Tambah Submenu / Sub-Submenu Baru
              </h3>
              <button onClick={() => setShowAddSubModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-bold block mb-1">Target Parent / Induk:</label>
                <select
                  value={newSubTargetParent}
                  onChange={e => setNewSubTargetParent(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white font-semibold outline-none cursor-pointer"
                >
                  {getFlatMenuParents().map(parent => (
                    <option key={parent.id} value={parent.id}>{parent.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">Nama Submenu / Sub-Submenu:</label>
                <input
                  type="text"
                  placeholder="Misal: Mold Dies 2R / Report Penjualan Baru"
                  value={newSubLabel}
                  onChange={e => setNewSubLabel(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white font-semibold outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">ID Submenu (Opsional / Auto-Generated):</label>
                <input
                  type="text"
                  placeholder="Misal: mold-2r-dies"
                  value={newSubId}
                  onChange={e => setNewSubId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-300 font-mono outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setShowAddSubModal(false)}
                className="px-3 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleAddChildSubmenu}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold cursor-pointer"
              >
                Simpan & Buat Tampilan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
