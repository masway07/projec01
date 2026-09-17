import React, { useState } from 'react';
import { PackageCheck, Plus, Search, Boxes, Truck, Star, CheckCircle2, XCircle, Edit2, Trash2, X, AlertCircle, BookOpen, FileSpreadsheet } from 'lucide-react';
import { ItemStock, ItemStockSupplier, COA, Supplier } from '../types';
import { ItemStockImportModal } from './ItemStockImportModal';

export interface MasterItemStockViewProps {
  itemStocks: ItemStock[];
  suppliers?: Supplier[];
  coaList?: COA[];
  coaAccounts?: COA[];
  onAddItemStock: (item: Omit<ItemStock, 'id'>) => void;
  onBatchAddItemStock?: (items: Omit<ItemStock, 'id' | 'createdAt' | 'updatedAt'>[]) => void;
  onUpdateItemStock: (id: string, item: Partial<ItemStock>) => void;
  onDeleteItemStock: (id: string) => void;
  onDeleteBatchItemStock?: (ids: string[]) => void;
}

export const MasterItemStockView: React.FC<MasterItemStockViewProps> = ({
  itemStocks,
  suppliers = [],
  coaList = [],
  coaAccounts = [],
  onAddItemStock,
  onBatchAddItemStock,
  onUpdateItemStock,
  onDeleteItemStock,
  onDeleteBatchItemStock
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ItemStock | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleteConfirmType, setDeleteConfirmType] = useState<'single' | 'selected' | 'all' | null>(null);
  const [itemToDelete, setItemToDelete] = useState<ItemStock | null>(null);

  // Consolidated COA list from either prop
  const allCoa: COA[] = (coaList && coaList.length > 0) ? coaList : (coaAccounts || []);

  // Form states
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [specification, setSpecification] = useState('');
  const [category, setCategory] = useState<'raw_material' | 'mold_sparepart' | 'wip' | 'finish_good' | 'general'>('raw_material');
  const [uom, setUom] = useState('Kg');
  const [inventoryAccountCode, setInventoryAccountCode] = useState('1080001');
  const [inventoryAccountName, setInventoryAccountName] = useState('Raw Material');
  const [expenseAccountCode, setExpenseAccountCode] = useState('5100001');
  const [expenseAccountName, setExpenseAccountName] = useState('Raw Material Expense / HPP');
  const [minimumStock, setMinimumStock] = useState<number>(0);
  const [safetyStock, setSafetyStock] = useState<number>(0);
  const [standardCost, setStandardCost] = useState<number>(0);
  const [standardPrice, setStandardPrice] = useState<number>(0);
  const [currency, setCurrency] = useState('USD');
  const [location, setLocation] = useState('WH-MAIN');
  const [isActive, setIsActive] = useState(true);
  const [notes, setNotes] = useState('');

  // Linked suppliers states
  const [linkedSuppliers, setLinkedSuppliers] = useState<ItemStockSupplier[]>([]);
  const [newSupId, setNewSupId] = useState('');
  const [newSupPrice, setNewSupPrice] = useState<number>(0);
  const [newSupCurrency, setNewSupCurrency] = useState('USD');
  const [newSupLeadTime, setNewSupLeadTime] = useState<number>(7);
  const [newSupIsPrimary, setNewSupIsPrimary] = useState(false);
  const [newSupNotes, setNewSupNotes] = useState('');

  // Suggest default accounts based on category
  const setCategoryDefaults = (cat: typeof category) => {
    setCategory(cat);
    if (cat === 'raw_material') {
      setInventoryAccountCode('1080001');
      setInventoryAccountName('Raw Material');
      setExpenseAccountCode('5100001');
      setExpenseAccountName('Raw Material Expense / HPP');
      setUom('Kg');
    } else if (cat === 'mold_sparepart') {
      setInventoryAccountCode('1080005');
      setInventoryAccountName('Mold & Spare Part');
      setExpenseAccountCode('5100003');
      setExpenseAccountName('Maintenance & Tooling Expense');
      setUom('Set');
    } else if (cat === 'wip') {
      setInventoryAccountCode('1080003');
      setInventoryAccountName('Work In Process');
      setExpenseAccountCode('5100001');
      setExpenseAccountName('Raw Material Expense / HPP');
      setUom('Pcs');
    } else if (cat === 'finish_good') {
      setInventoryAccountCode('1080004');
      setInventoryAccountName('Finish Good');
      setExpenseAccountCode('5100001');
      setExpenseAccountName('Raw Material Expense / HPP');
      setUom('Pcs');
    } else {
      setInventoryAccountCode('1080005');
      setInventoryAccountName('Mold & Spare Part');
      setExpenseAccountCode('5100002');
      setExpenseAccountName('Consumable & Factory Supplies');
      setUom('Drum');
    }
  };

  const openAddModal = () => {
    setEditingItem(null);
    setFormError(null);
    const seq = itemStocks.length + 1;
    setCode(`ITEM-${String(seq).padStart(3, '0')}`);
    setName('');
    setSpecification('');
    setCategoryDefaults('raw_material');
    setMinimumStock(100);
    setSafetyStock(200);
    setStandardCost(0);
    setStandardPrice(0);
    setCurrency('USD');
    setLocation('WH-MAIN');
    setIsActive(true);
    setNotes('');
    setLinkedSuppliers([]);
    setNewSupId(suppliers[0]?.id || suppliers[0]?.code || '');
    setNewSupPrice(0);
    setNewSupCurrency('USD');
    setNewSupLeadTime(7);
    setNewSupIsPrimary(true);
    setNewSupNotes('');
    setIsModalOpen(true);
  };

  const openEditModal = (item: ItemStock) => {
    setEditingItem(item);
    setFormError(null);
    setCode(item.code);
    setName(item.name);
    setSpecification(item.specification || '');
    setCategory(item.category);
    setUom(item.uom);
    setInventoryAccountCode(item.inventoryAccountCode || '1080001');
    setInventoryAccountName(item.inventoryAccountName || 'Raw Material');
    setExpenseAccountCode(item.expenseAccountCode || '5100001');
    setExpenseAccountName(item.expenseAccountName || 'Raw Material Expense / HPP');
    setMinimumStock(item.minimumStock || 0);
    setSafetyStock(item.safetyStock || 0);
    setStandardCost(item.standardCost || 0);
    setStandardPrice(item.standardPrice || 0);
    setCurrency(item.currency || 'USD');
    setLocation(item.location || 'WH-MAIN');
    setIsActive(item.isActive);
    setNotes(item.notes || '');
    setLinkedSuppliers(item.suppliers ? [...item.suppliers] : []);
    setNewSupId(suppliers[0]?.id || suppliers[0]?.code || '');
    setNewSupPrice(item.standardCost || 0);
    setNewSupCurrency(item.currency || 'USD');
    setNewSupLeadTime(7);
    setNewSupIsPrimary((item.suppliers || []).length === 0);
    setNewSupNotes('');
    setIsModalOpen(true);
  };

  const handleAddSupplierLink = () => {
    const targetSup = suppliers.find(s => s.id === newSupId || s.code === newSupId);
    if (!targetSup) return;

    if (linkedSuppliers.some(s => s.supplierCode === targetSup.code || s.supplierId === targetSup.id)) {
      setFormError(`Supplier ${targetSup.name} sudah terhubung ke item ini.`);
      return;
    }

    const isFirst = linkedSuppliers.length === 0 || newSupIsPrimary;
    const updated = linkedSuppliers.map(s => isFirst && newSupIsPrimary ? { ...s, isPrimary: false } : s);

    updated.push({
      supplierId: targetSup.id,
      supplierCode: targetSup.code,
      supplierName: targetSup.name,
      price: Number(newSupPrice) || 0,
      currency: newSupCurrency,
      leadTimeDays: Number(newSupLeadTime) || 7,
      isPrimary: isFirst,
      notes: newSupNotes.trim()
    });

    setLinkedSuppliers(updated);
    setNewSupNotes('');
    setFormError(null);
  };

  const handleRemoveSupplierLink = (supCode: string) => {
    setLinkedSuppliers(prev => prev.filter(s => s.supplierCode !== supCode));
  };

  const handleSetPrimarySupplier = (supCode: string) => {
    setLinkedSuppliers(prev => prev.map(s => ({
      ...s,
      isPrimary: s.supplierCode === supCode
    })));
  };

  const handleInventorySelect = (selectedCode: string) => {
    setInventoryAccountCode(selectedCode);
    const matched = allCoa.find(c => c.code === selectedCode);
    if (matched) {
      setInventoryAccountName(matched.name);
    } else if (selectedCode === '1080001') {
      setInventoryAccountName('Raw Material');
    } else if (selectedCode === '1080003') {
      setInventoryAccountName('Work In Process');
    } else if (selectedCode === '1080004') {
      setInventoryAccountName('Finish Good');
    } else if (selectedCode === '1080005') {
      setInventoryAccountName('Mold & Spare Part');
    }
  };

  const handleExpenseSelect = (selectedCode: string) => {
    setExpenseAccountCode(selectedCode);
    const matched = allCoa.find(c => c.code === selectedCode);
    if (matched) {
      setExpenseAccountName(matched.name);
    } else if (selectedCode === '5100001') {
      setExpenseAccountName('Raw Material Expense / HPP');
    } else if (selectedCode === '5100002') {
      setExpenseAccountName('Consumable & Factory Supplies');
    } else if (selectedCode === '5100003') {
      setExpenseAccountName('Maintenance & Tooling Expense');
    } else if (selectedCode === '5200001') {
      setExpenseAccountName('General Expense');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!code.trim()) {
      setFormError('Kode Item wajib diisi.');
      return;
    }
    if (!name.trim()) {
      setFormError('Nama Deskripsi Barang wajib diisi.');
      return;
    }

    const invCode = inventoryAccountCode || '1080001';
    const invName = inventoryAccountName || 'Raw Material';
    const expCode = expenseAccountCode || '5100001';
    const expName = expenseAccountName || 'Raw Material Expense / HPP';

    if (editingItem) {
      onUpdateItemStock(editingItem.id, {
        code: code.trim().toUpperCase(),
        name: name.trim(),
        specification: specification.trim(),
        category,
        uom: uom.trim() || 'Pcs',
        inventoryAccountCode: invCode,
        inventoryAccountName: invName,
        expenseAccountCode: expCode,
        expenseAccountName: expName,
        minimumStock: Number(minimumStock) || 0,
        safetyStock: Number(safetyStock) || 0,
        standardCost: Number(standardCost) || 0,
        standardPrice: Number(standardPrice) || 0,
        currency: currency || 'USD',
        location: location.trim() || 'WH-MAIN',
        isActive,
        notes: notes.trim(),
        suppliers: linkedSuppliers,
        updatedAt: new Date().toISOString()
      });
    } else {
      onAddItemStock({
        code: code.trim().toUpperCase(),
        name: name.trim(),
        specification: specification.trim(),
        category,
        uom: uom.trim() || 'Pcs',
        inventoryAccountCode: invCode,
        inventoryAccountName: invName,
        expenseAccountCode: expCode,
        expenseAccountName: expName,
        minimumStock: Number(minimumStock) || 0,
        safetyStock: Number(safetyStock) || 0,
        standardCost: Number(standardCost) || 0,
        standardPrice: Number(standardPrice) || 0,
        currency: currency || 'USD',
        location: location.trim() || 'WH-MAIN',
        isActive,
        notes: notes.trim(),
        suppliers: linkedSuppliers
      });
    }

    setIsModalOpen(false);
  };

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case 'raw_material':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">Raw Material</span>;
      case 'mold_sparepart':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">Mold & Sparepart</span>;
      case 'wip':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">Work In Process</span>;
      case 'finish_good':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Finish Good</span>;
      default:
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">General Item</span>;
    }
  };

  const filteredItems = (itemStocks || []).filter(item => {
    const matchSearch =
      (item.code || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.specification || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.inventoryAccountName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.expenseAccountName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.location && item.location.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchCategory = categoryFilter === 'all' || item.category === categoryFilter;
    return matchSearch && matchCategory;
  });

  const isAllSelected = filteredItems.length > 0 && filteredItems.every(i => selectedIds.includes(i.id));

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds(prev => prev.filter(id => !filteredItems.some(item => item.id === id)));
    } else {
      const filteredItemIds = filteredItems.map(item => item.id);
      setSelectedIds(prev => Array.from(new Set([...prev, ...filteredItemIds])));
    }
  };

  const handleDeleteSelected = () => {
    if (selectedIds.length === 0) return;
    setDeleteConfirmType('selected');
  };

  const handleDeleteAll = () => {
    if (itemStocks.length === 0) return;
    setDeleteConfirmType('all');
  };

  const confirmDelete = () => {
    if (deleteConfirmType === 'single' && itemToDelete) {
      onDeleteItemStock(itemToDelete.id);
      setSelectedIds(prev => prev.filter(id => id !== itemToDelete.id));
    } else if (deleteConfirmType === 'selected') {
      if (selectedIds.length > 0) {
        if (onDeleteBatchItemStock) {
          onDeleteBatchItemStock(selectedIds);
        } else {
          selectedIds.forEach(id => onDeleteItemStock(id));
        }
        setSelectedIds([]);
      }
    } else if (deleteConfirmType === 'all') {
      if (itemStocks.length > 0) {
        const allIds = itemStocks.map(i => i.id);
        if (onDeleteBatchItemStock) {
          onDeleteBatchItemStock(allIds);
        } else {
          allIds.forEach(id => onDeleteItemStock(id));
        }
        setSelectedIds([]);
      }
    }
    setDeleteConfirmType(null);
    setItemToDelete(null);
  };

  return (
    <div id="view-master-item-stock" className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 rounded-2xl shadow-sm">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-indigo-500/20 rounded-xl text-indigo-300 border border-indigo-400/20">
                <PackageCheck className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-xl font-bold tracking-tight">Master Data Item Stock</h2>
                <p className="text-xs text-indigo-200/80 mt-0.5">
                  Katalog barang & persediaan terintegrasi dengan Akun Persediaan (Asset) dan Akun Beban (HPP / Expense)
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {itemStocks.length > 0 && (
              <button
                type="button"
                id="btnDeleteAllItemStock"
                onClick={handleDeleteAll}
                className="flex items-center gap-2 px-3.5 py-2.5 bg-rose-600/80 hover:bg-rose-600 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer border border-rose-500/30"
                title="Hapus seluruh data item stock dalam database"
              >
                <Trash2 className="w-4 h-4" />
                <span>Hapus Semua ({itemStocks.length})</span>
              </button>
            )}
            <button
              type="button"
              id="btnImportItemStock"
              onClick={() => setIsImportModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer shadow-emerald-600/30"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Import Excel / CSV
            </button>
            <button
              id="btnAddItemStock"
              onClick={openAddModal}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer shadow-indigo-600/30"
            >
              <Plus className="w-4 h-4" />
              Tambah Item Stock
            </button>
          </div>
        </div>

        {/* Quick Category Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 mt-5 pt-4 border-t border-slate-800">
          <div className="bg-white/5 rounded-xl p-2.5 border border-white/10">
            <div className="text-slate-400 text-[10px] font-medium">Total Item</div>
            <div className="text-base font-bold text-white mt-0.5">{(itemStocks || []).length}</div>
          </div>
          <div className="bg-white/5 rounded-xl p-2.5 border border-white/10">
            <div className="text-slate-400 text-[10px] font-medium">Raw Material</div>
            <div className="text-base font-bold text-amber-300 mt-0.5">
              {(itemStocks || []).filter(i => i.category === 'raw_material').length}
            </div>
          </div>
          <div className="bg-white/5 rounded-xl p-2.5 border border-white/10">
            <div className="text-slate-400 text-[10px] font-medium">Mold & Sparepart</div>
            <div className="text-base font-bold text-purple-300 mt-0.5">
              {(itemStocks || []).filter(i => i.category === 'mold_sparepart').length}
            </div>
          </div>
          <div className="bg-white/5 rounded-xl p-2.5 border border-white/10">
            <div className="text-slate-400 text-[10px] font-medium">Work In Process</div>
            <div className="text-base font-bold text-blue-300 mt-0.5">
              {(itemStocks || []).filter(i => i.category === 'wip').length}
            </div>
          </div>
          <div className="bg-white/5 rounded-xl p-2.5 border border-white/10 col-span-2 sm:col-span-1">
            <div className="text-slate-400 text-[10px] font-medium">Finish Good</div>
            <div className="text-base font-bold text-emerald-400 mt-0.5">
              {(itemStocks || []).filter(i => i.category === 'finish_good').length}
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari kode, nama item, akun COA..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <span className="text-xs text-slate-500 font-medium">Kategori:</span>
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-hidden cursor-pointer"
          >
            <option value="all">Semua Kategori</option>
            <option value="raw_material">Raw Material</option>
            <option value="mold_sparepart">Mold & Spare Part</option>
            <option value="wip">Work In Process (WIP)</option>
            <option value="finish_good">Finish Good</option>
            <option value="general">General Supplies</option>
          </select>
        </div>
      </div>

      {/* Selection / Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2 text-xs text-amber-900 font-bold">
            <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Terpilih <strong>{selectedIds.length}</strong> dari {filteredItems.length} item stock</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold transition cursor-pointer"
            >
              Batal Pilih
            </button>
            <button
              type="button"
              onClick={handleDeleteSelected}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Hapus Terpilih ({selectedIds.length})</span>
            </button>
          </div>
        </div>
      )}

      {/* Item Stock Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={handleToggleSelectAll}
                    title="Pilih / Batal Pilih Semua"
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                  />
                </th>
                <th className="py-3.5 px-4">Item & Kategori</th>
                <th className="py-3.5 px-4">UOM & Lokasi</th>
                <th className="py-3.5 px-4">Akun Persediaan (Asset)</th>
                <th className="py-3.5 px-4">Akun Beban (Expense / HPP)</th>
                <th className="py-3.5 px-4 text-right">Min / Safety Stock</th>
                <th className="py-3.5 px-4 text-right">Std Cost ({currency})</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                      <Boxes className="w-8 h-8 text-slate-300" />
                      <div className="font-semibold text-slate-700">Belum ada item stock</div>
                      <p className="text-[11px] text-slate-400">
                        Tambahkan item barang persediaan untuk digunakan di Purchase Request, PO, dan Produksi.
                      </p>
                      <button
                        type="button"
                        onClick={openAddModal}
                        className="mt-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Tambah Item Stock Sekarang</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredItems.map(item => (
                  <tr
                    key={item.id}
                    className={`hover:bg-slate-50/70 transition ${selectedIds.includes(item.id) ? 'bg-amber-50/40' : ''}`}
                  >
                    <td className="py-3 px-3 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(item.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedIds(prev => [...prev, item.id]);
                          } else {
                            setSelectedIds(prev => prev.filter(id => id !== item.id));
                          }
                        }}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{item.name}</div>
                      {item.specification && (
                        <div className="mt-0.5 text-[11px] text-slate-600 flex items-center gap-1">
                          <span className="text-[10px] uppercase font-bold text-slate-400">Spek/Type:</span>
                          <span className="font-mono text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                            {item.specification}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        <span className="font-mono text-[11px] font-semibold text-indigo-600">{item.code}</span>
                        {getCategoryBadge(item.category)}
                      </div>
                      {/* Linked Suppliers Preview */}
                      {item.suppliers && item.suppliers.length > 0 ? (
                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-1.5 py-0.5 rounded-md">
                            <Truck className="w-3 h-3" />
                            {item.suppliers.length} Supplier
                          </span>
                          {item.suppliers.map((s, sIdx) => (
                            <span
                              key={sIdx}
                              title={`${s.supplierName} - ${s.currency === 'IDR' ? 'Rp ' : '$'}${s.price?.toLocaleString()} (Lead time: ${s.leadTimeDays || '-'} hari)${s.isPrimary ? ' [Supplier Utama]' : ''}`}
                              className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md ${
                                s.isPrimary
                                  ? 'bg-amber-50 text-amber-900 border border-amber-300 font-semibold'
                                  : 'bg-slate-50 text-slate-700 border border-slate-200'
                              }`}
                            >
                              {s.isPrimary && <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500 shrink-0" />}
                              <span className="truncate max-w-[130px] font-medium">{s.supplierName}</span>
                              <span className="font-mono text-[10px] text-slate-500 font-semibold">
                                {s.currency === 'IDR' ? 'Rp ' : '$'}{s.price?.toLocaleString()}
                              </span>
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-800">{item.uom}</span>
                      <div className="text-[10px] text-slate-400 mt-0.5">{item.location || '-'}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-mono text-[11px] font-bold text-slate-800">{item.inventoryAccountCode}</div>
                      <div className="text-[11px] text-slate-500">{item.inventoryAccountName || '-'}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-mono text-[11px] font-bold text-slate-800">{item.expenseAccountCode}</div>
                      <div className="text-[11px] text-slate-500">{item.expenseAccountName || '-'}</div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="font-medium text-slate-800">{item.minimumStock?.toLocaleString() || 0}</div>
                      <div className="text-[10px] text-slate-400">Safety: {item.safetyStock?.toLocaleString() || 0}</div>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-slate-900">
                      {item.currency === 'IDR' ? 'Rp ' : '$'}
                      {(item.standardCost || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {item.isActive ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                          <XCircle className="w-3 h-3" />
                          Nonaktif
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => openEditModal(item)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-indigo-600 transition cursor-pointer"
                          title="Edit Item"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setItemToDelete(item);
                            setDeleteConfirmType('single');
                          }}
                          className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                          title="Hapus Item"
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
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <PackageCheck className="w-5 h-5" />
                </span>
                <h3 className="font-bold text-slate-900 text-base">
                  {editingItem ? 'Edit Data Item Stock' : 'Tambah Item Stock Baru'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kode Item <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={e => setCode(e.target.value)}
                    placeholder="RM-S45C-D28"
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-mono uppercase focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Deskripsi Barang <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Round Steel Bar S45C"
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Spek / Type Barang
                  </label>
                  <input
                    type="text"
                    value={specification}
                    onChange={e => setSpecification(e.target.value)}
                    placeholder="SKD11 / Dia 28mm / JIS G4051 / Grade A"
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kategori Item
                  </label>
                  <select
                    value={category}
                    onChange={e => setCategoryDefaults(e.target.value as any)}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden cursor-pointer"
                  >
                    <option value="raw_material">Raw Material</option>
                    <option value="mold_sparepart">Mold & Spare Part</option>
                    <option value="wip">Work In Process (WIP)</option>
                    <option value="finish_good">Finish Good</option>
                    <option value="general">General Supplies</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Satuan Ukur (UOM)
                  </label>
                  <input
                    type="text"
                    required
                    value={uom}
                    onChange={e => setUom(e.target.value)}
                    placeholder="Kg, Pcs, Set, Drum..."
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Lokasi Gudang / Rak
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    placeholder="WH-RM-RACK-01"
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* COA Linkage Section */}
              <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900">
                  <BookOpen className="w-4 h-4 text-indigo-600" />
                  Pemetaan Akun Akuntansi (COA Mapping)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Akun Persediaan (Inventory Asset) <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={inventoryAccountCode}
                      onChange={e => handleInventorySelect(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden cursor-pointer"
                    >
                      <option value="">Pilih Akun Persediaan...</option>
                      {allCoa
                        .filter(c => (c.code || '').startsWith('108') || (c.parent || '').toLowerCase().includes('inventory') || (c.type || '').toLowerCase().includes('asset'))
                        .map(c => (
                          <option key={c.code} value={c.code}>
                            {c.code} - {c.name}
                          </option>
                        ))}
                      {/* Fallback standard accounts */}
                      <option value="1080001">1080001 - Raw Material</option>
                      <option value="1080003">1080003 - Work In Process</option>
                      <option value="1080004">1080004 - Finish Good</option>
                      <option value="1080005">1080005 - Mold & Spare Part</option>
                    </select>
                    <div className="text-[10px] text-slate-500 mt-1">Nama Akun: <span className="font-semibold text-slate-700">{inventoryAccountName}</span></div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Akun Beban (Expense / HPP) <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={expenseAccountCode}
                      onChange={e => handleExpenseSelect(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden cursor-pointer"
                    >
                      <option value="">Pilih Akun Beban...</option>
                      {allCoa
                        .filter(c => (c.code || '').startsWith('5') || (c.type || '').toLowerCase().includes('expense') || (c.type || '').toLowerCase().includes('hpp'))
                        .map(c => (
                          <option key={c.code} value={c.code}>
                            {c.code} - {c.name}
                          </option>
                        ))}
                      {/* Fallback standard accounts */}
                      <option value="5100001">5100001 - Raw Material Expense / HPP</option>
                      <option value="5100002">5100002 - Consumable & Factory Supplies</option>
                      <option value="5100003">5100003 - Maintenance & Tooling Expense</option>
                      <option value="5200001">5200001 - General Expense</option>
                    </select>
                    <div className="text-[10px] text-slate-500 mt-1">Nama Akun: <span className="font-semibold text-slate-700">{expenseAccountName}</span></div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Minimum Stock
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={minimumStock}
                    onChange={e => setMinimumStock(Number(e.target.value))}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Safety Stock
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={safetyStock}
                    onChange={e => setSafetyStock(Number(e.target.value))}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Standar Biaya (Cost)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={standardCost}
                    onChange={e => setStandardCost(Number(e.target.value))}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mata Uang
                  </label>
                  <select
                    value={currency}
                    onChange={e => setCurrency(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden cursor-pointer"
                  >
                    <option value="USD">USD</option>
                    <option value="IDR">IDR</option>
                    <option value="JPY">JPY</option>
                  </select>
                </div>
              </div>

              {/* Supplier Integration Section */}
              <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-indigo-600" />
                    <span className="text-xs font-bold text-slate-800">
                      Hubungkan Data Supplier (Vendor Penyedia Barang)
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 font-medium">
                    {linkedSuppliers.length} Supplier Terdaftar
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mb-3">
                  Satu item stock dapat disediakan oleh beberapa supplier dengan harga, mata uang, dan lead time berbeda. Data ini akan otomatis muncul saat tim Purchasing membuat PO baru.
                </p>

                {/* Table of currently linked suppliers */}
                {linkedSuppliers.length > 0 ? (
                  <div className="bg-white rounded-lg border border-slate-200 overflow-hidden mb-3">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100/75 text-[10px] text-slate-600 font-bold uppercase border-b border-slate-200">
                        <tr>
                          <th className="p-2">Supplier</th>
                          <th className="p-2">Harga Vendor</th>
                          <th className="p-2">Lead Time</th>
                          <th className="p-2 text-center">Status</th>
                          <th className="p-2 text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {linkedSuppliers.map(ls => (
                          <tr key={ls.supplierCode} className="hover:bg-slate-50">
                            <td className="p-2">
                              <div className="font-semibold text-slate-900">{ls.supplierName}</div>
                              <div className="font-mono text-[10px] text-slate-500">{ls.supplierCode}</div>
                              {ls.notes && <div className="text-[10px] text-slate-400 italic mt-0.5">{ls.notes}</div>}
                            </td>
                            <td className="p-2 font-mono font-bold text-slate-800">
                              {ls.currency === 'IDR' ? 'Rp ' : '$'}{(ls.price || 0).toLocaleString()}
                             </td>
                             <td className="p-2">
                               <span className="font-mono text-xs text-slate-700">{ls.leadTimeDays || 0} hari</span>
                             </td>
                             <td className="p-2 text-center">
                               {ls.isPrimary ? (
                                 <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                                   <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                                   Utama
                                 </span>
                               ) : (
                                 <span className="text-[10px] text-slate-400">Alternatif</span>
                               )}
                             </td>
                             <td className="p-2 text-right">
                               <button
                                 type="button"
                                 onClick={() => handleRemoveSupplierLink(ls.supplierCode)}
                                 className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                                 title="Hapus Supplier"
                               >
                                 <Trash2 className="w-3.5 h-3.5" />
                               </button>
                             </td>
                           </tr>
                         ))}
                       </tbody>
                     </table>
                   </div>
                 ) : (
                   <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs text-slate-500 mb-3">
                     Belum ada supplier yang dihubungkan dengan item stock ini. Tambahkan minimal 1 supplier di bawah.
                   </div>
                 )}

                {/* Form to add supplier link */}
                <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2.5 mt-3">
                  <div className="text-[11px] font-bold text-slate-700">Tambah / Hubungkan Supplier</div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Supplier</label>
                      <select
                        value={newSupId}
                        onChange={e => setNewSupId(e.target.value)}
                        className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs cursor-pointer focus:outline-hidden"
                      >
                        <option value="">Pilih Supplier...</option>
                        {suppliers.map(sup => (
                          <option key={sup.id || sup.code} value={sup.id || sup.code}>
                            {sup.code} - {sup.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Lead Time (Hari)</label>
                      <input
                        type="number"
                        min="1"
                        value={newSupLeadTime}
                        onChange={e => setNewSupLeadTime(Number(e.target.value))}
                        className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Harga Vendor</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={newSupPrice}
                        onChange={e => setNewSupPrice(Number(e.target.value))}
                        className="w-full px-3.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Mata Uang</label>
                      <select
                        value={newSupCurrency}
                        onChange={e => setNewSupCurrency(e.target.value)}
                        className="w-full px-3.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs cursor-pointer"
                      >
                        <option value="USD">USD</option>
                        <option value="IDR">IDR</option>
                        <option value="JPY">JPY</option>
                      </select>
                    </div>
                    <div className="flex items-end">
                      <label className="flex items-center gap-2 cursor-pointer pb-2">
                        <input
                          type="checkbox"
                          checked={newSupIsPrimary}
                          onChange={e => setNewSupIsPrimary(e.target.checked)}
                          className="rounded border-slate-300 text-indigo-600 w-3.5 h-3.5"
                        />
                        <span className="text-[11px] font-semibold text-slate-700">Supplier Utama (Primary)</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Catatan / Keterangan Spesifik</label>
                    <input
                      type="text"
                      value={newSupNotes}
                      onChange={e => setNewSupNotes(e.target.value)}
                      placeholder="Contoh: Minimum order 1 ton, heat treat cert required..."
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={handleAddSupplierLink}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Hubungkan Supplier Ini
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="itemActive"
                  checked={isActive}
                  onChange={e => setIsActive(e.target.checked)}
                  className="rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="itemActive" className="text-xs font-medium text-slate-700 cursor-pointer">
                  Item Stock Aktif (Dapat digunakan di Purchase Request, PO, dan Produksi)
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
                  {editingItem ? 'Simpan Perubahan' : 'Tambah Item Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Excel / CSV Import Modal */}
      <ItemStockImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={(items) => {
          if (onBatchAddItemStock) {
            onBatchAddItemStock(items);
          } else {
            items.forEach(i => onAddItemStock(i));
          }
        }}
        coaList={allCoa}
        suppliers={suppliers}
      />

      {/* Custom Confirmation Modal for Deleting */}
      {deleteConfirmType !== null && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-rose-600 mb-4">
              <div className="p-3 bg-rose-50 rounded-xl border border-rose-100">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  {deleteConfirmType === 'single' && 'Hapus Item Stock'}
                  {deleteConfirmType === 'selected' && `Hapus ${selectedIds.length} Item Stock Terpilih`}
                  {deleteConfirmType === 'all' && 'Hapus SELURUH Data Item Stock'}
                </h3>
                <p className="text-xs text-slate-500 font-medium">Konfirmasi Penghapusan</p>
              </div>
            </div>

            <div className="py-2 text-xs text-slate-600 leading-relaxed space-y-2">
              {deleteConfirmType === 'single' && itemToDelete && (
                <p>
                  Apakah Anda yakin ingin menghapus item <strong className="text-slate-900">[{itemToDelete.code}] {itemToDelete.name}</strong>?
                </p>
              )}
              {deleteConfirmType === 'selected' && (
                <p>
                  Apakah Anda yakin ingin menghapus <strong>{selectedIds.length} item stock</strong> yang Anda centang?
                </p>
              )}
              {deleteConfirmType === 'all' && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-900">
                  <p className="font-bold mb-1">⚠️ PERINGATAN KONTROL:</p>
                  <p>
                    Anda akan menghapus seluruh <strong>({itemStocks.length}) data item stock</strong> dari database. Tindakan ini tidak dapat dibatalkan.
                  </p>
                </div>
              )}
              <p className="text-slate-400 text-[11px]">Item yang dihapus tidak dapat dipulihkan kembali.</p>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setDeleteConfirmType(null);
                  setItemToDelete(null);
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-xs"
              >
                Hapus Sekarang
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};