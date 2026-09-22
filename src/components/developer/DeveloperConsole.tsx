import React, { useState } from 'react';
import {
  Wrench,
  Code2,
  Terminal,
  Layers,
  LayoutGrid,
  Plus,
  Trash2,
  Edit2,
  Save,
  CheckCircle2,
  Database,
  FileCode,
  MoveUp,
  MoveDown,
  Eye,
  Settings2,
  ListTree,
  Table,
  Check,
  X,
  Sparkles,
  HelpCircle,
  FolderTree,
  Sliders,
  CheckSquare,
  Workflow,
  ArrowRightLeft,
  CornerDownRight,
  ArrowUpFromLine,
  GitCommit
} from 'lucide-react';
import { AppUser, CompanySettings } from '../../types';
import { WorkflowBuilder } from './WorkflowBuilder';

interface DeveloperConsoleProps {
  currentUser?: AppUser | null;
  companySettings: CompanySettings;
  customMenus?: any[];
  onSaveCustomMenus: (menus: any[]) => void;
  customViews?: Record<string, any>;
  onSaveCustomViews: (views: Record<string, any>) => void;
  allDataSources: Record<string, any[]>;
  onUpdateDataSource: (key: string, data: any[]) => void;
  onSelectTab: (tabId: string) => void;
}

export const DeveloperConsole: React.FC<DeveloperConsoleProps> = ({
  currentUser,
  companySettings,
  customMenus = [],
  onSaveCustomMenus,
  customViews = {},
  onSaveCustomViews,
  allDataSources,
  onUpdateDataSource,
  onSelectTab
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'menus' | 'layouts' | 'forms' | 'datasource' | 'workflow' | 'preview'>('menus');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Complete system default menus if customMenus is empty
  const defaultSystemMenus = [
    {
      id: 'workspace',
      group: 'Workspace',
      items: [
        { id: 'budget', label: 'Budget', icon: 'FileSpreadsheet', subItems: [
          { id: 'dashboard', label: 'Summary Budget', category: 'dashboard' },
          { id: 'planner', label: 'Rencana Anggaran', category: 'planner' },
          { id: 'deptPlanning', label: 'Dept Planning', category: 'deptPlanning' },
          { id: 'realisasi', label: 'Realisasi Budget', category: 'realisasi' },
        ]},
        { id: 'cashBank', label: 'Kas dan bank', icon: 'Wallet', subItems: [
          { id: 'buku-bank', label: 'Buku Bank', category: 'buku_bank' },
          { id: 'penerimaan', label: 'Penerimaan', category: 'penerimaan' },
          { id: 'pembayaran', label: 'Pembayaran', category: 'pembayaran' },
        ]},
        { id: 'purchase', label: 'Purchase', icon: 'ShoppingCart', subItems: [
          { id: 'purchase-request', label: 'Purchase Request', category: 'purchase_request' },
          { id: 'purchase-order', label: 'Purchase Order', category: 'purchase_order' },
          { id: 'receive-item-order', label: 'Receive item order', category: 'receive_item_order' },
          { id: 'purchase-invoice', label: 'Purchase Invoice', category: 'purchase_invoice' },
          { id: 'return-item-order', label: 'Return Item Order', category: 'return_item_order' },
          { id: 'payment-purchase', label: 'Payment Purchase', category: 'payment_purchase' },
        ]},
        { id: 'sales', label: 'Sales', icon: 'TrendingUp', subItems: [
          { id: 'sales-plan', label: 'Sales Plan', category: 'sales_plan' },
          { id: 'sales-delivery', label: 'Sales Delivery', category: 'sales_delivery' },
          { id: 'sales-invoice', label: 'Sales Invoice', category: 'sales_invoice' },
        ]},
        { id: 'fixedAsset', label: 'Fixed Asset', icon: 'Box', subItems: [
          { id: 'fixedAsset', label: 'Semua Asset', category: 'all' },
          { id: 'fixed-asset-land', label: 'Land', category: 'land' },
          { id: 'fixed-asset-building', label: 'Building', category: 'building' },
          { id: 'fixed-asset-vehicle', label: 'Vehicle', category: 'vehicle' },
          { id: 'fixed-asset-electronic', label: 'Electronic', category: 'electronic' },
          { id: 'fixed-asset-software', label: 'Software', category: 'software' },
          { id: 'fixed-asset-intangible', label: 'Intangible Asset', category: 'intangible_asset' },
          { id: 'fixed-asset-right-of-use', label: 'Right of use', category: 'right_of_use' },
        ]},
        { id: 'inventory', label: 'Inventory', icon: 'Boxes', subItems: [
          { id: 'inventory-raw-material', label: 'Raw Material', category: 'raw_material' },
          { id: 'inventory-mold-sparepart', label: 'Mold & Spare Part', category: 'mold_sparepart' },
          { id: 'inventory-wip', label: 'Work In Process', category: 'wip' },
          { id: 'inventory-finish-good', label: 'Finish Good', category: 'finish_good' },
          { id: 'inventory-return-from-prod', label: 'Return from Prod', category: 'return_from_prod' },
        ]},
        { id: 'production', label: 'Production', icon: 'Factory', subItems: [
          { id: 'production-lot-number', label: 'Lot Number', category: 'lot_number' },
          { id: 'production-schedule', label: 'Production Schedule', category: 'production_schedule' },
          { id: 'production-ng-report', label: 'NG Report', category: 'ng_report' },
        ]},
        { id: 'report', label: 'Report', icon: 'FileText', subItems: [
          { id: 'report-ledger', label: 'Ledger', category: 'ledger' },
          { id: 'report-balance-sheet', label: 'Balance sheet', category: 'balance_sheet' },
          { id: 'report-trial-balance', label: 'Trial Balance', category: 'trial_balance' },
          { id: 'report-profit-loss', label: 'profit / Loss', category: 'profit_loss' },
        ]}
      ]
    },
    {
      group: 'Master Data',
      items: [
        { id: 'dept', label: 'Master Department', icon: 'Building2' },
        { id: 'supplier', label: 'Supplier', icon: 'Truck' },
        { id: 'customer', label: 'Customer', icon: 'Briefcase' },
        { id: 'itemStock', label: 'Item Stock', icon: 'PackageCheck' },
        { id: 'masterProcess', label: 'Proses Produksi', icon: 'Workflow' },
        { id: 'dailyRates', label: 'Rate Harian (BI & KMK)', icon: 'CircleDollarSign' },
        { id: 'coa', label: 'COA', icon: 'BookOpen' },
        { id: 'rate', label: 'Exchange Rate', icon: 'ArrowLeftRight' },
      ]
    },
    {
      group: 'Administration',
      items: [
        { id: 'users', label: 'Manajemen User', icon: 'Users' },
        { id: 'auditLog', label: 'Log Activity (Audit)', icon: 'History' },
        { id: 'backup', label: 'Backup & Data', icon: 'UploadCloud' },
        { id: 'settings', label: 'Pengaturan Perusahaan', icon: 'Settings' },
      ]
    },
    {
      group: 'Sistem',
      items: [
        { id: 'developer', label: 'Developer', icon: 'Wrench' }
      ]
    }
  ];

  const [menus, setMenus] = useState<any[]>(
    customMenus.length > 0 ? customMenus : defaultSystemMenus
  );

  const [views, setViews] = useState<Record<string, any>>(
    Object.keys(customViews).length > 0 ? customViews : {
      'budget': {
        title: 'Budget Management',
        description: 'Kelola anggaran dan departemen.',
        layoutType: 'table',
        dataSourceKey: 'deptPlanningItems',
        columns: [
          { key: 'code', label: 'Kode', type: 'text' },
          { key: 'name', label: 'Nama Item', type: 'text' },
          { key: 'amount', label: 'Jumlah / Nilai', type: 'number' }
        ]
      },
      'itemStock': {
        title: 'Master Item Stock',
        description: 'Manajemen stok item dan material.',
        layoutType: 'table',
        dataSourceKey: 'itemStocks',
        columns: [
          { key: 'code', label: 'Kode SKU', type: 'text' },
          { key: 'name', label: 'Nama Barang', type: 'text' },
          { key: 'stock', label: 'Stok', type: 'number' }
        ]
      }
    }
  );

  const [selectedMenuId, setSelectedMenuId] = useState<string>('budget');
  const [selectedDataSourceKey, setSelectedDataSourceKey] = useState<string>('itemStocks');

  // Inline Menu Editing State
  const [editingItemKey, setEditingItemKey] = useState<string | null>(null);
  const [editItemLabelVal, setEditItemLabelVal] = useState<string>('');

  const [editingSubKey, setEditingSubKey] = useState<string | null>(null);
  const [editSubLabelVal, setEditSubLabelVal] = useState<string>('');

  // Layout customization state for selectedMenuId
  const currentViewConfig = views[selectedMenuId] || {
    title: selectedMenuId,
    description: '',
    layoutType: 'table',
    dataSourceKey: 'itemStocks',
    columns: [
      { key: 'code', label: 'Kode / ID', type: 'text' },
      { key: 'name', label: 'Nama / Keterangan', type: 'text' }
    ]
  };

  const [layoutTitle, setLayoutTitle] = useState<string>(currentViewConfig.title);
  const [layoutDesc, setLayoutDesc] = useState<string>(currentViewConfig.description);
  const [layoutType, setLayoutType] = useState<string>(currentViewConfig.layoutType);
  const [layoutDataSource, setLayoutDataSource] = useState<string>(currentViewConfig.dataSourceKey);
  const [layoutColumns, setLayoutColumns] = useState<Array<{ key: string; label: string; type: string }>>(currentViewConfig.columns || []);

  // New Column inputs
  const [newColKey, setNewColKey] = useState<string>('');
  const [newColLabel, setNewColLabel] = useState<string>('');
  const [newColType, setNewColType] = useState<string>('text');

  // Modal / Add Menu State
  const [showAddMenuModal, setShowAddMenuModal] = useState<boolean>(false);
  const [newMenuGroup, setNewMenuGroup] = useState<string>('Workspace');
  const [newMenuLabel, setNewMenuLabel] = useState<string>('');
  const [newMenuId, setNewMenuId] = useState<string>('');
  const [newMenuIcon, setNewMenuIcon] = useState<string>('Layers');
  const [newMenuParentId, setNewMenuParentId] = useState<string>('');

  // Data Source CRUD state
  const [showAddDataModal, setShowAddDataModal] = useState<boolean>(false);
  const [newDataCode, setNewDataCode] = useState<string>('');
  const [newDataName, setNewDataName] = useState<string>('');

  const showNotification = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  const handleSaveAll = () => {
    onSaveCustomMenus(menus);
    onSaveCustomViews(views);
    showNotification('Seluruh struktur menu, konfigurasi kolom, data source, dan layout berhasil disimpan permanen selamanya!');
  };

  const handleSelectMenuForLayout = (id: string, label: string) => {
    setSelectedMenuId(id);
    const existing = views[id] || {
      title: label,
      description: `Manajemen ${label}`,
      layoutType: 'table',
      dataSourceKey: 'itemStocks',
      columns: [
        { key: 'code', label: 'Kode / ID', type: 'text' },
        { key: 'name', label: 'Nama / Keterangan', type: 'text' }
      ]
    };
    setLayoutTitle(existing.title || label);
    setLayoutDesc(existing.description || '');
    setLayoutType(existing.layoutType || 'table');
    setLayoutDataSource(existing.dataSourceKey || 'itemStocks');
    setLayoutColumns(existing.columns || [
      { key: 'code', label: 'Kode / ID', type: 'text' },
      { key: 'name', label: 'Nama / Keterangan', type: 'text' }
    ]);
  };

  const handleSaveCurrentLayout = () => {
    const updatedViews = {
      ...views,
      [selectedMenuId]: {
        title: layoutTitle,
        description: layoutDesc,
        layoutType,
        dataSourceKey: layoutDataSource,
        columns: layoutColumns
      }
    };
    setViews(updatedViews);
    onSaveCustomViews(updatedViews);
    showNotification(`Layout untuk "${layoutTitle}" berhasil disimpan dan langsung aktif di dashboard!`);
  };

  const handleAddColumn = () => {
    if (!newColLabel.trim()) return;
    const key = newColKey.trim() || newColLabel.toLowerCase().replace(/\s+/g, '_');
    if (layoutColumns.some(c => c.key === key)) return;
    setLayoutColumns([...layoutColumns, { key, label: newColLabel, type: newColType }]);
    setNewColKey('');
    setNewColLabel('');
    showNotification(`Kolom "${newColLabel}" berhasil ditambahkan ke layout.`);
  };

  const handleDeleteColumn = (colKey: string) => {
    setLayoutColumns(layoutColumns.filter(c => c.key !== colKey));
    showNotification('Kolom berhasil dihapus dari layout.');
  };

  const handleSaveItemLabel = (gIdx: number, iIdx: number) => {
    const updated = [...menus];
    updated[gIdx].items[iIdx].label = editItemLabelVal;
    setMenus(updated);
    onSaveCustomMenus(updated);
    setEditingItemKey(null);
    showNotification(`Nama menu berhasil diubah menjadi "${editItemLabelVal}"!`);
  };

  const handleSaveSubLabel = (gIdx: number, iIdx: number, sIdx: number) => {
    const updated = [...menus];
    updated[gIdx].items[iIdx].subItems[sIdx].label = editSubLabelVal;
    setMenus(updated);
    onSaveCustomMenus(updated);
    setEditingSubKey(null);
    showNotification(`Nama submenu berhasil diubah menjadi "${editSubLabelVal}"!`);
  };

  const handleConvertToSubmenu = (sourceGIdx: number, sourceIIdx: number, targetParentMenuId: string) => {
    const updated = [...menus];
    const sourceItem = updated[sourceGIdx].items[sourceIIdx];
    updated[sourceGIdx].items.splice(sourceIIdx, 1);
    let found = false;
    for (const g of updated) {
      for (const it of g.items) {
        if (it.id === targetParentMenuId) {
          if (!it.subItems) it.subItems = [];
          it.subItems.push({ id: sourceItem.id, label: sourceItem.label, category: sourceItem.id });
          found = true;
          break;
        }
      }
      if (found) break;
    }
    setMenus(updated);
    onSaveCustomMenus(updated);
    showNotification(`Menu "${sourceItem.label}" berhasil diubah menjadi Submenu dan disimpan permanen!`);
  };

  const handleChangeSubmenuParent = (subId: string, newParentId: string) => {
    if (!newParentId) return;
    const updated = [...menus];
    let extractedSub: any = null;
    for (const g of updated) {
      for (const it of g.items) {
        if (it.subItems) {
          const sIdx = it.subItems.findIndex((s: any) => s.id === subId);
          if (sIdx !== -1) {
            extractedSub = it.subItems.splice(sIdx, 1)[0];
            break;
          }
        }
      }
      if (extractedSub) break;
    }
    if (!extractedSub) return;
    let inserted = false;
    for (const g of updated) {
      for (const it of g.items) {
        if (it.id === newParentId) {
          if (!it.subItems) it.subItems = [];
          it.subItems.push(extractedSub);
          inserted = true;
          break;
        }
      }
      if (inserted) break;
    }
    if (inserted) {
      setMenus(updated);
      onSaveCustomMenus(updated);
      showNotification(`Induk submenu berhasil dipindahkan dan disimpan permanen!`);
    }
  };

  const handlePromoteToMenu = (gIdx: number, iIdx: number, sIdx: number) => {
    const updated = [...menus];
    const subItem = updated[gIdx].items[iIdx].subItems[sIdx];
    updated[gIdx].items[iIdx].subItems.splice(sIdx, 1);
    updated[gIdx].items.push({
      id: subItem.id,
      label: subItem.label,
      icon: 'Layers',
      subItems: []
    });
    setMenus(updated);
    onSaveCustomMenus(updated);
    showNotification(`Submenu "${subItem.label}" berhasil dipromosikan menjadi Menu Utama!`);
  };

  const handleAddMenu = () => {
    if (!newMenuLabel.trim()) return;
    const id = newMenuId.trim() || newMenuLabel.toLowerCase().replace(/\s+/g, '-');
    const updated = [...menus];
    const newEntry = {
      id,
      label: newMenuLabel,
      category: id,
      subItems: []
    };

    if (newMenuParentId) {
      let added = false;
      for (const g of updated) {
        for (const it of g.items) {
          if (it.id === newMenuParentId) {
            if (!it.subItems) it.subItems = [];
            it.subItems.push(newEntry);
            added = true;
            break;
          }
        }
        if (added) break;
      }
    } else {
      let groupObj = updated.find(g => g.group.toLowerCase() === newMenuGroup.toLowerCase());
      if (!groupObj) {
        groupObj = { id: newMenuGroup.toLowerCase(), group: newMenuGroup, items: [] };
        updated.push(groupObj);
      }
      groupObj.items.push({
        id,
        label: newMenuLabel,
        icon: newMenuIcon,
        subItems: []
      });
    }

    setMenus(updated);
    onSaveCustomMenus(updated);
    setNewMenuLabel('');
    setNewMenuId('');
    setNewMenuParentId('');
    setShowAddMenuModal(false);
    showNotification(`Menu/Submenu baru "${newMenuLabel}" berhasil ditambahkan dan disimpan permanen!`);
  };

  const handleDeleteMenu = (groupIndex: number, itemIndex: number) => {
    const updated = [...menus];
    updated[groupIndex].items.splice(itemIndex, 1);
    setMenus(updated);
    onSaveCustomMenus(updated);
    showNotification('Menu berhasil dihapus.');
  };

  const handleDeleteSubItem = (gIdx: number, iIdx: number, sIdx: number) => {
    const updated = [...menus];
    updated[gIdx].items[iIdx].subItems.splice(sIdx, 1);
    setMenus(updated);
    onSaveCustomMenus(updated);
    showNotification('Submenu berhasil dihapus.');
  };

  const handleMoveMenu = (groupIndex: number, itemIndex: number, direction: 'up' | 'down') => {
    const updated = [...menus];
    const items = updated[groupIndex].items;
    const targetIdx = direction === 'up' ? itemIndex - 1 : itemIndex + 1;
    if (targetIdx < 0 || targetIdx >= items.length) return;
    const temp = items[itemIndex];
    items[itemIndex] = items[targetIdx];
    items[targetIdx] = temp;
    setMenus(updated);
    onSaveCustomMenus(updated);
    showNotification('Urutan menu berhasil diperbarui.');
  };

  const currentDataSourceItems = allDataSources[selectedDataSourceKey] || [];

  const handleAddDataSourceRecord = () => {
    if (!newDataCode.trim() && !newDataName.trim()) return;
    const newItem = {
      id: `rec_${Date.now()}`,
      code: newDataCode || `CODE_${Date.now().toString().slice(-4)}`,
      name: newDataName || 'Item Baru',
      createdAt: new Date().toISOString()
    };
    const updated = [newItem, ...currentDataSourceItems];
    onUpdateDataSource(selectedDataSourceKey, updated);
    setNewDataCode('');
    setNewDataName('');
    setShowAddDataModal(false);
    showNotification(`Record baru berhasil ditambahkan!`);
  };

  const handleDeleteDataSourceRecord = (index: number) => {
    const updated = [...currentDataSourceItems];
    updated.splice(index, 1);
    onUpdateDataSource(selectedDataSourceKey, updated);
    showNotification('Record sumber data berhasil dihapus.');
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-violet-950 rounded-2xl p-6 sm:p-8 text-white shadow-xl border border-indigo-500/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600/30 border border-indigo-400/30 flex items-center justify-center shadow-inner">
            <Wrench className="w-7 h-7 text-indigo-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-widest font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Sistem / Developer Studio Utama
              </span>
              <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span> Real-time Sync Active
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1 text-white">
              Pusat Kontrol & Kustomisasi Hirarki Menu & Layout UI
            </h1>
            <p className="text-slate-300 text-sm mt-1 max-w-2xl">
              Atur kolom, sumber data, dan tampilan seluruh menu dan submenu agar sinkron sempurna dengan dashboard.
            </p>
          </div>
        </div>

        <button
          onClick={handleSaveAll}
          className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition flex items-center gap-2 cursor-pointer border border-indigo-400/30 shrink-0"
        >
          <Save className="w-4 h-4" /> Simpan & Terapkan Selamanya
        </button>
      </div>

      {successMsg && (
        <div className="bg-emerald-950/80 border border-emerald-500/30 text-emerald-200 px-4 py-3 rounded-xl flex items-center gap-3 shadow-lg animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-sm font-medium">{successMsg}</span>
        </div>
      )}

      {/* Sub Tabs Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200">
        {[
          { id: 'menus', label: '1. Kelola Hirarki Menu & Submenu', icon: ListTree },
          { id: 'layouts', label: '2. Tampilan & Layout UI (Kolom & Data)', icon: LayoutGrid },
          { id: 'forms', label: '3. Form & Input Builder', icon: FileCode },
          { id: 'datasource', label: '4. Integrasi & CRUD Data Source', icon: Database },
          { id: 'workflow', label: '5. Visual Workflow (n8n Drag & Drop)', icon: Workflow },
          { id: 'preview', label: '6. Live Preview', icon: Eye },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 transition cursor-pointer shrink-0 ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab 1: Kelola Menu & Submenu */}
      {activeSubTab === 'menus' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Manajemen Pembuatan Menu & Perubahan Induk Submenu</h2>
              <p className="text-sm text-slate-500 mt-0.5">
                Buat menu baru langsung sebagai submenu di menu tertentu, ubah induk submenu, atau pindahkan menu antar level secara permanen.
              </p>
            </div>
            <button
              onClick={() => setShowAddMenuModal(true)}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-semibold flex items-center gap-2 transition cursor-pointer shadow shrink-0"
            >
              <Plus className="w-4 h-4" /> Tambah Menu / Submenu Baru
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {menus.map((groupObj, gIdx) => (
              <div key={groupObj.id || gIdx} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                <div className="bg-slate-50 px-5 py-4 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <FolderTree className="w-5 h-5 text-indigo-600" />
                    <h3 className="font-bold text-slate-900 text-base tracking-wide uppercase">{groupObj.group}</h3>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-bold border border-indigo-200">
                    {groupObj.items?.length || 0} Menu Utama
                  </span>
                </div>

                <div className="p-4 space-y-3 flex-1">
                  {groupObj.items?.map((item: any, iIdx: number) => {
                    const itemKey = `${gIdx}-${iIdx}`;
                    const isEditingThis = editingItemKey === itemKey;
                    return (
                      <div key={item.id || iIdx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1">
                            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow shrink-0">
                              {item.label.substring(0, 2).toUpperCase()}
                            </div>
                            <div className="flex-1">
                              {isEditingThis ? (
                                <div className="flex items-center gap-2">
                                  <input
                                    type="text"
                                    value={editItemLabelVal}
                                    onChange={e => setEditItemLabelVal(e.target.value)}
                                    className="px-3 py-1 bg-white border border-indigo-500 rounded-lg text-sm font-bold text-slate-900 outline-none w-full"
                                    autoFocus
                                  />
                                  <button onClick={() => handleSaveItemLabel(gIdx, iIdx)} className="px-3 py-1 bg-indigo-600 text-white text-xs font-bold rounded-lg cursor-pointer">Simpan</button>
                                  <button onClick={() => setEditingItemKey(null)} className="px-2 py-1 bg-slate-200 text-slate-700 text-xs rounded-lg cursor-pointer">Batal</button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-slate-900 text-sm">{item.label}</span>
                                  <button onClick={() => { setEditingItemKey(itemKey); setEditItemLabelVal(item.label); }} className="text-indigo-600 hover:text-indigo-800 p-1 cursor-pointer" title="Edit Nama">
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )}
                              <div className="text-[11px] text-slate-400 font-mono">ID: {item.id}</div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button onClick={() => handleMoveMenu(gIdx, iIdx, 'up')} className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-600 cursor-pointer" title="Geser Atas"><MoveUp className="w-4 h-4" /></button>
                            <button onClick={() => handleMoveMenu(gIdx, iIdx, 'down')} className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-600 cursor-pointer" title="Geser Bawah"><MoveDown className="w-4 h-4" /></button>
                            <button onClick={() => handleDeleteMenu(gIdx, iIdx)} className="p-1.5 rounded-lg hover:bg-rose-100 text-rose-600 cursor-pointer ml-1" title="Hapus"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </div>

                        {/* Convert to Submenu Control */}
                        <div className="flex items-center justify-between text-xs bg-indigo-50/60 border border-indigo-100 px-3 py-2 rounded-lg">
                          <span className="text-indigo-900 font-medium flex items-center gap-1.5">
                            <CornerDownRight className="w-3.5 h-3.5 text-indigo-600" /> Jadikan Submenu dari:
                          </span>
                          <select
                            onChange={e => {
                              const parentId = e.target.value;
                              if (parentId) {
                                handleConvertToSubmenu(gIdx, iIdx, parentId);
                                e.target.value = '';
                              }
                            }}
                            defaultValue=""
                            className="px-2 py-1 bg-white border border-indigo-200 rounded text-xs font-semibold text-indigo-700 outline-none cursor-pointer"
                          >
                            <option value="" disabled>Pilih Menu Induk Baru...</option>
                            {menus.flatMap(mg => mg.items).filter(it => it.id !== item.id).map(it => (
                              <option key={it.id} value={it.id}>{it.label}</option>
                            ))}
                          </select>
                        </div>

                        {/* Subitems list */}
                        {item.subItems && item.subItems.length > 0 && (
                          <div className="pl-4 pt-2 space-y-2 border-t border-slate-200/80 mt-2">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Submenu ({item.subItems.length}):</div>
                            <div className="space-y-1.5">
                              {item.subItems.map((sub: any, sIdx: number) => {
                                const subKey = `${gIdx}-${iIdx}-${sIdx}`;
                                const isEditingSub = editingSubKey === subKey;
                                return (
                                  <div key={sub.id || sIdx} className="bg-white border border-slate-200 p-3 rounded-xl shadow-sm space-y-2">
                                    <div className="flex items-center justify-between gap-2">
                                      <div className="flex items-center gap-2 flex-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0"></span>
                                        {isEditingSub ? (
                                          <div className="flex items-center gap-2 w-full">
                                            <input type="text" value={editSubLabelVal} onChange={e => setEditSubLabelVal(e.target.value)} className="px-2 py-0.5 border border-indigo-500 rounded text-xs font-semibold outline-none w-full" autoFocus />
                                            <button onClick={() => handleSaveSubLabel(gIdx, iIdx, sIdx)} className="px-2 py-0.5 bg-indigo-600 text-white text-[11px] font-bold rounded cursor-pointer">Simpan</button>
                                            <button onClick={() => setEditingSubKey(null)} className="px-2 py-0.5 bg-slate-200 text-[11px] rounded cursor-pointer">Batal</button>
                                          </div>
                                        ) : (
                                          <div className="flex items-center gap-2">
                                            <span className="text-xs text-slate-800 font-semibold">{sub.label}</span>
                                            <button onClick={() => { setEditingSubKey(subKey); setEditSubLabelVal(sub.label); }} className="text-indigo-600 hover:text-indigo-800 cursor-pointer" title="Edit Nama Submenu"><Edit2 className="w-3 h-3" /></button>
                                          </div>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-1.5 shrink-0">
                                        <button
                                          onClick={() => handlePromoteToMenu(gIdx, iIdx, sIdx)}
                                          className="px-2 py-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold text-[10px] flex items-center gap-1 cursor-pointer"
                                          title="Jadikan Menu Utama"
                                        >
                                          <ArrowUpFromLine className="w-3 h-3" /> Jadikan Menu Utama
                                        </button>
                                        <button onClick={() => handleDeleteSubItem(gIdx, iIdx, sIdx)} className="p-1 rounded hover:bg-rose-100 text-rose-600 cursor-pointer" title="Hapus Submenu"><Trash2 className="w-3 h-3" /></button>
                                      </div>
                                    </div>

                                    {/* Change Parent of Submenu */}
                                    <div className="flex items-center justify-between text-[11px] bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-lg">
                                      <span className="text-slate-600 font-medium flex items-center gap-1">
                                        <GitCommit className="w-3 h-3 text-indigo-600" /> Pindah Induk Ke:
                                      </span>
                                      <select
                                        value={item.id}
                                        onChange={e => {
                                          const newParentId = e.target.value;
                                          if (newParentId) {
                                            handleChangeSubmenuParent(sub.id, newParentId);
                                          }
                                        }}
                                        className="px-2 py-0.5 bg-white border border-slate-300 rounded text-[11px] font-semibold text-slate-700 outline-none cursor-pointer"
                                      >
                                        {menus.flatMap(mg => mg.items).map(parentIt => (
                                          <option key={parentIt.id} value={parentIt.id}>{parentIt.label}</option>
                                        ))}
                                      </select>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Tampilan & Layout UI (Kolom & Data Source untuk Menu & Submenu) */}
      {activeSubTab === 'layouts' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">Pengaturan Tampilan & Layout UI (Menu & Submenu)</h2>
            <p className="text-sm text-slate-500 mt-0.5">Semua menu dan submenu sistem tersedia di sini. Anda dapat mengatur judul, tipe layout, sumber data, serta menambah/mengedit/menghapus kolom secara permanen.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Complete List of All Menus and Submenus */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Daftar Menu & Submenu Sistem</h3>
              <div className="space-y-3 max-h-[550px] overflow-y-auto pr-1">
                {menus.map((groupObj, gIdx) => (
                  <div key={groupObj.id || gIdx} className="space-y-1.5">
                    <div className="text-[11px] font-bold text-indigo-600 uppercase px-2">{groupObj.group}</div>
                    {groupObj.items?.map((item: any) => {
                      const isMainSelected = selectedMenuId === item.id;
                      return (
                        <div key={item.id} className="space-y-1">
                          <button
                            onClick={() => handleSelectMenuForLayout(item.id, item.label)}
                            className={`w-full text-left px-3.5 py-2.5 rounded-xl font-bold text-sm transition flex items-center justify-between cursor-pointer ${
                              isMainSelected
                                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                                : 'bg-slate-50 text-slate-800 hover:bg-slate-100 border border-slate-200/60'
                            }`}
                          >
                            <span>{item.label}</span>
                            <span className="text-[10px] opacity-75 font-mono">{item.id}</span>
                          </button>

                          {/* Submenus under this item */}
                          {item.subItems && item.subItems.length > 0 && (
                            <div className="pl-4 space-y-1 pt-1">
                              {item.subItems.map((sub: any) => {
                                const isSubSelected = selectedMenuId === sub.id;
                                return (
                                  <button
                                    key={sub.id}
                                    onClick={() => handleSelectMenuForLayout(sub.id, sub.label)}
                                    className={`w-full text-left px-3 py-2 rounded-lg font-medium text-xs transition flex items-center justify-between cursor-pointer ${
                                      isSubSelected
                                        ? 'bg-violet-600 text-white shadow-sm'
                                        : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                                    }`}
                                  >
                                    <span className="flex items-center gap-1.5">
                                      <span className="w-1 h-1 rounded-full bg-current"></span>
                                      {sub.label}
                                    </span>
                                    <span className="text-[9px] opacity-70 font-mono">{sub.id}</span>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Layout Config & Column Manager for Selected Menu/Submenu */}
            <div className="lg:col-span-2 bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-lg">Konfigurasi Layout: <span className="text-indigo-600 font-mono">{layoutTitle}</span></h3>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">ID Target: {selectedMenuId}</p>
                </div>
                <button
                  onClick={handleSaveCurrentLayout}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/20 cursor-pointer flex items-center gap-2"
                >
                  <Save className="w-4 h-4" /> Simpan Layout Permanen
                </button>
              </div>

              {/* General Properties */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Judul Tampilan (Header Title)</label>
                  <input
                    type="text"
                    value={layoutTitle}
                    onChange={e => setLayoutTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-900 outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tipe Layout Tampilan</label>
                  <select
                    value={layoutType}
                    onChange={e => setLayoutType(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-900 outline-none bg-white cursor-pointer"
                  >
                    <option value="table">Tabel Data Interaktif</option>
                    <option value="cards">Grid Kartu / Grid View</option>
                    <option value="summary">Dashboard Ringkasan KPI</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Deskripsi Halaman</label>
                <input
                  type="text"
                  value={layoutDesc}
                  onChange={e => setLayoutDesc(e.target.value)}
                  placeholder="Keterangan singkat halaman..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Hubungkan Sumber Data (Data Source Linking)</label>
                <select
                  value={layoutDataSource}
                  onChange={e => setLayoutDataSource(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-indigo-700 outline-none bg-indigo-50/50 cursor-pointer"
                >
                  <option value="itemStocks">Item Stock (Stok Barang & Material)</option>
                  <option value="deptPlanningItems">Dept Planning (Anggaran Departemen)</option>
                  <option value="purchaseOrders">Purchase Orders (PO Supplier)</option>
                  <option value="salesInvoiceItems">Sales Invoices (Faktur Penjualan)</option>
                  <option value="lotNumbers">Lot Numbers (Nomor Lot Produksi)</option>
                  <option value="ngReports">NG Reports (Laporan Cacat Produksi)</option>
                  <option value="coa">COA (Bagan Akun)</option>
                  <option value="departments">Departments (Master Departemen)</option>
                </select>
                <p className="text-[11px] text-slate-500 mt-1">Menu ini akan otomatis menampilkan dan mengelola data dari sumber yang dipilih.</p>
              </div>

              {/* Columns Manager */}
              <div className="space-y-3 pt-3 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">Manajemen Kolom Tabel</h4>
                    <p className="text-xs text-slate-500">Tambah, ubah, atau hapus kolom yang tampil pada tabel menu ini.</p>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200">
                    {layoutColumns.length} Kolom Aktif
                  </span>
                </div>

                {/* Add column quick form */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center gap-2">
                  <input
                    type="text"
                    placeholder="Nama Kolom (Label, cth: Harga Satuan)"
                    value={newColLabel}
                    onChange={e => setNewColLabel(e.target.value)}
                    className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium outline-none w-full"
                  />
                  <input
                    type="text"
                    placeholder="Key Data (cth: unit_price)"
                    value={newColKey}
                    onChange={e => setNewColKey(e.target.value)}
                    className="w-full sm:w-40 px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono outline-none"
                  />
                  <select
                    value={newColType}
                    onChange={e => setNewColType(e.target.value)}
                    className="w-full sm:w-32 px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold outline-none cursor-pointer"
                  >
                    <option value="text">Teks</option>
                    <option value="number">Angka / Nilai</option>
                    <option value="date">Tanggal</option>
                    <option value="badge">Badge Status</option>
                  </select>
                  <button
                    onClick={handleAddColumn}
                    className="w-full sm:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold shadow cursor-pointer shrink-0 flex items-center justify-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Tambah Kolom
                  </button>
                </div>

                {/* Columns table list */}
                <div className="border border-slate-200 rounded-xl overflow-hidden max-h-[240px] overflow-y-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 sticky top-0">
                        <th className="p-2.5">Label Kolom</th>
                        <th className="p-2.5">Key Data</th>
                        <th className="p-2.5">Tipe Data</th>
                        <th className="p-2.5 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {layoutColumns.map((col: any) => (
                        <tr key={col.key} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="p-2.5 font-bold text-slate-800">{col.label}</td>
                          <td className="p-2.5 font-mono text-indigo-600">{col.key}</td>
                          <td className="p-2.5 uppercase text-[10px] font-bold text-slate-500">{col.type}</td>
                          <td className="p-2.5 text-right">
                            <button
                              onClick={() => handleDeleteColumn(col.key)}
                              className="p-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-600 cursor-pointer"
                              title="Hapus Kolom"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Form Builder */}
      {activeSubTab === 'forms' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">Form & Input Builder Menu</h2>
            <p className="text-sm text-slate-500 mt-0.5">Atur komponen formulir dan field input data.</p>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            {[{ name: 'code', label: 'Kode / SKU', type: 'text' }, { name: 'name', label: 'Nama Item', type: 'text' }].map((f, i) => (
              <div key={i} className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                <div className="font-bold text-sm text-slate-800">{f.label} <span className="text-xs text-slate-400 font-mono">({f.name})</span></div>
                <span className="text-xs bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded-lg font-bold">{f.type}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Integrasi & CRUD Data Source */}
      {activeSubTab === 'datasource' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Integrasi & Manajemen Data Source (CRUD)</h2>
              <p className="text-sm text-slate-500 mt-0.5">Kelola data record untuk seluruh sumber data menu.</p>
            </div>
            <button onClick={() => setShowAddDataModal(true)} className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold flex items-center gap-2 transition cursor-pointer shadow shrink-0">
              <Plus className="w-4 h-4" /> Tambah Record Data
            </button>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
              <h3 className="font-bold text-slate-800 text-sm">Pilih Sumber Data</h3>
              <div className="space-y-1.5 max-h-[500px] overflow-y-auto pr-1">
                {[{ key: 'itemStocks', label: 'Item Stock' }, { key: 'purchaseOrders', label: 'Purchase Orders' }, { key: 'salesInvoiceItems', label: 'Sales Invoices' }, { key: 'lotNumbers', label: 'Lot Numbers' }, { key: 'ngReports', label: 'NG Reports' }, { key: 'coa', label: 'COA' }].map(ds => (
                  <button key={ds.key} onClick={() => setSelectedDataSourceKey(ds.key)} className={`w-full text-left px-3.5 py-2.5 rounded-xl font-medium text-sm transition flex items-center justify-between cursor-pointer ${selectedDataSourceKey === ds.key ? 'bg-indigo-600 text-white shadow' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'}`}>
                    <span>{ds.label}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-white/20 font-mono">{allDataSources[ds.key]?.length || 0}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="lg:col-span-3 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <h3 className="font-bold text-slate-900 text-base">Record: <span className="text-indigo-600 font-mono">{selectedDataSourceKey}</span></h3>
                <span className="text-xs font-bold px-3 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">Aktif</span>
              </div>
              <div className="overflow-x-auto max-h-[420px] overflow-y-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 sticky top-0">
                      <th className="p-3">No</th>
                      <th className="p-3">Kode / ID</th>
                      <th className="p-3">Nama / Keterangan</th>
                      <th className="p-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentDataSourceItems.length === 0 ? (
                      <tr><td colSpan={4} className="text-center py-8 text-slate-400 text-xs">Belum ada record data.</td></tr>
                    ) : (
                      currentDataSourceItems.map((item: any, idx: number) => (
                        <tr key={item.id || idx} className="border-b border-slate-100 hover:bg-slate-50/80">
                          <td className="p-3 text-xs text-slate-500 font-mono">{idx + 1}</td>
                          <td className="p-3 font-bold text-slate-800 text-xs font-mono">{item.code || item.deptCode || item.id?.substring(0, 8)}</td>
                          <td className="p-3 text-slate-700 font-medium">{item.name || item.itemName || item.description || '—'}</td>
                          <td className="p-3 text-right"><button onClick={() => handleDeleteDataSourceRecord(idx)} className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 cursor-pointer"><Trash2 className="w-4 h-4" /></button></td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Visual Workflow (n8n Style) */}
      {activeSubTab === 'workflow' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">Visual Workflow & Data Integration (n8n Style)</h2>
            <p className="text-sm text-slate-500 mt-0.5">Rancang pipeline integrasi data secara visual.</p>
          </div>
          <WorkflowBuilder />
        </div>
      )}

      {/* Tab 6: Live Preview */}
      {activeSubTab === 'preview' && (
        <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto"><Eye className="w-8 h-8" /></div>
          <h2 className="text-xl font-bold text-slate-900">Pratinjau Sistem ERP</h2>
          <p className="text-sm text-slate-500 max-w-md mx-auto">Semua konfigurasi layout dan menu telah tersinkronisasi.</p>
          <button onClick={() => onSelectTab('budget')} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl shadow cursor-pointer">Buka Beranda ERP</button>
        </div>
      )}

      {/* Modal Add Menu / Submenu */}
      {showAddMenuModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <h3 className="text-lg font-bold text-slate-900">Tambah Menu atau Submenu Baru</h3>
              <button onClick={() => setShowAddMenuModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Grup Area Utama</label>
                <select value={newMenuGroup} onChange={e => setNewMenuGroup(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm outline-none bg-white font-medium">
                  <option value="Workspace">Workspace</option>
                  <option value="Master Data">Master Data</option>
                  <option value="Administration">Administration</option>
                  <option value="Sistem">Sistem</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Jadikan Sebagai Submenu Dari (Opsional)</label>
                <select value={newMenuParentId} onChange={e => setNewMenuParentId(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm outline-none bg-white font-medium">
                  <option value="">(Buat sebagai Menu Utama baru)</option>
                  {menus.flatMap(mg => mg.items).map(parentIt => (
                    <option key={parentIt.id} value={parentIt.id}>Submenu di bawah: {parentIt.label}</option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500 mt-1">Jika dipilih, menu baru ini akan otomatis menjadi submenu di bawah menu utama tersebut.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Menu / Submenu Baru</label>
                <input type="text" placeholder="Contoh: Laporan Pajak Bulanan" value={newMenuLabel} onChange={e => setNewMenuLabel(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm outline-none" />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
              <button onClick={() => setShowAddMenuModal(false)} className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer">Batal</button>
              <button onClick={handleAddMenu} className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow cursor-pointer">Simpan Permanen</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Add Data Source Record */}
      {showAddDataModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <h3 className="text-lg font-bold text-slate-900">Tambah Record ke {selectedDataSourceKey}</h3>
              <button onClick={() => setShowAddDataModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Kode / ID</label>
                <input type="text" placeholder="Contoh: CODE-001" value={newDataCode} onChange={e => setNewDataCode(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 navigasi mb-1">Nama / Keterangan</label>
                <input type="text" placeholder="Contoh: Material Utama" value={newDataName} onChange={e => setNewDataName(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm outline-none" />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
              <button onClick={() => setShowAddDataModal(false)} className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer">Batal</button>
              <button onClick={handleAddDataSourceRecord} className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow cursor-pointer">Simpan Record</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
