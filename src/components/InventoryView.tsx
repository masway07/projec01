import React, { useState, useMemo, useRef } from 'react';
import {
  InventoryItem,
  InventoryCategory,
  COA,
  ExchangeRates,
  CompanySettings,
  AppUser
} from '../types';
import {
  Package,
  Boxes,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Search,
  Filter,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  Download,
  Upload,
  Edit2,
  Trash2,
  RefreshCw,
  X,
  FileSpreadsheet,
  AlertCircle,
  Warehouse,
  Coins,
  TrendingDown,
  TrendingUp,
  Tag
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { InventoryMoldSummaryTable } from './InventoryMoldSummaryTable';
import { InventoryMoldSubTable } from './InventoryMoldSubTable';

interface InventoryViewProps {
  inventoryItems: InventoryItem[];
  coaList: COA[];
  ratesByYear: Record<string, ExchangeRates>;
  onAddInventoryItem: (item: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateInventoryItem: (id: string, updates: Partial<InventoryItem>) => void;
  onDeleteInventoryItem: (id: string) => void;
  onBatchImportInventory?: (items: Omit<InventoryItem, 'id'>[]) => void;
  currentUser?: AppUser | null;
  companySettings?: CompanySettings;
  activeSubCategory?: InventoryCategory;
  activeGroupId?: string;
  onSubCategoryChange?: (category: InventoryCategory) => void;
}

export const SUB_MENU_CONFIG: {
  id: InventoryCategory;
  label: string;
  defaultCoaCode: string;
  defaultCoaName: string;
  icon: any;
  color: string;
  bgLight: string;
  borderLight: string;
  description: string;
}[] = [
  {
    id: 'raw_material',
    label: 'Raw Material',
    defaultCoaCode: '1080001',
    defaultCoaName: 'Inventory - Raw Material',
    icon: Boxes,
    color: 'text-blue-600',
    bgLight: 'bg-blue-50',
    borderLight: 'border-blue-200',
    description: 'Bahan baku mentah produksi (Steel Coil, Aluminum Ingot, Resin, Plate, dsb.)'
  },
  {
    id: 'mold_sparepart',
    label: 'Mold & Spare Part',
    defaultCoaCode: '1080005',
    defaultCoaName: 'Inventory - Mold & Spareparts',
    icon: Package,
    color: 'text-amber-600',
    bgLight: 'bg-amber-50',
    borderLight: 'border-amber-200',
    description: 'Cetakan mold, dies, punch pin, cutter, dan suku cadang mesin pabrik'
  },
  {
    id: 'wip',
    label: 'Work In Process',
    defaultCoaCode: '1080003',
    defaultCoaName: 'Inventory - WIP',
    icon: Layers,
    color: 'text-purple-600',
    bgLight: 'bg-purple-50',
    borderLight: 'border-purple-200',
    description: 'Barang setengah jadi di lini produksi (Blanking, Stamping, Bending, Heat Treatment)'
  },
  {
    id: 'finish_good',
    label: 'Finish Good',
    defaultCoaCode: '1080004',
    defaultCoaName: 'Inventory - Finished Goods',
    icon: CheckCircle2,
    color: 'text-emerald-600',
    bgLight: 'bg-emerald-50',
    borderLight: 'border-emerald-200',
    description: 'Barang jadi siap kirim ke customer (AHM, Jatco, FCC, HPPM, Aichikiki, dsb.)'
  }
];

export const MOLD_SPAREPART_SUB_GROUPS: {
  id: string;
  code: string;
  label: string;
}[] = [
  { id: 'ALL', code: '', label: 'Semua Mold & Spare Part' },
  { id: '2RCF', code: '2RCF', label: 'CF Dies 2R (CF2R)' },
  { id: '4RCF', code: '4RCF', label: 'CF Dies 4R (CFD4R)' },
  { id: '2RMC', code: '2RMC', label: 'CF Machine 2R (CFM2R)' },
  { id: '2RTL', code: '2RTL', label: 'Tools 2R' },
  { id: '4RTL', code: '4RTL', label: 'Tools 4R' },
  { id: 'MTEL', code: 'MTEL', label: 'Electric' },
  { id: '2RSP', code: '2RSP', label: '2R Spare Cons (2Rcon)' },
  { id: '2RHP', code: '2RHP', label: '2R Holder Part (2RHP)' },
  { id: '4RSP', code: '4RSP', label: '4R Spare Cons (4Rcon)' },
  { id: '4RHL', code: '4RHL', label: '4R Holder List (4RHL)' },
  { id: '4RHP', code: '4RHP', label: '4R Holder Part (4RHP)' },
  { id: '4RBS', code: '4RBS', label: 'Bush1' },
  { id: 'MTMC', code: 'MTMC', label: 'Mekanik (Mech)' },
  { id: 'MTBO', code: 'MTBO', label: 'Belt & Oring' },
  { id: 'PRDW', code: 'PRDW', label: 'Dowa' },
  { id: 'PRFR', code: 'PRFR', label: 'Frame' },
  { id: 'PRSH', code: 'PRSH', label: 'Shot Blast' },
  { id: 'OIL_', code: 'OIL_', label: 'Oil' },
];

export const InventoryView: React.FC<InventoryViewProps> = ({
  inventoryItems,
  coaList,
  ratesByYear,
  onAddInventoryItem,
  onUpdateInventoryItem,
  onDeleteInventoryItem,
  onBatchImportInventory,
  currentUser,
  companySettings,
  activeSubCategory = 'raw_material',
  activeGroupId,
  onSubCategoryChange
}) => {
  // Selected Sub Category State
  const [selectedCategory, setSelectedCategory] = useState<InventoryCategory>(activeSubCategory);
  const [selectedGroupId, setSelectedGroupId] = useState<string | undefined>(activeGroupId);

  // Sync if prop changes externally (e.g. clicked from sidebar)
  React.useEffect(() => {
    if (activeSubCategory && activeSubCategory !== selectedCategory) {
      setSelectedCategory(activeSubCategory);
    }
  }, [activeSubCategory]);

  React.useEffect(() => {
    setSelectedGroupId(activeGroupId);
  }, [activeGroupId]);

  const handleCategorySwitch = (cat: InventoryCategory) => {
    setSelectedCategory(cat);
    if (onSubCategoryChange) {
      onSubCategoryChange(cat);
    }
  };

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [locationFilter, setLocationFilter] = useState<string>('ALL');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Active Rate for Valuation
  const currentYear = new Date().getFullYear().toString();
  const activeRateIDR = ratesByYear[currentYear]?.IDR || ratesByYear['2026']?.IDR || 16273.56;

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Modal State for Stock Movement (In / Out Adjustment)
  const [isMovementModalOpen, setIsMovementModalOpen] = useState<boolean>(false);
  const [movementItem, setMovementItem] = useState<InventoryItem | null>(null);
  const [movementType, setMovementType] = useState<'IN' | 'OUT'>('IN');
  const [movementQty, setMovementQty] = useState<string>('');
  const [movementNotes, setMovementNotes] = useState<string>('');
  const [movementError, setMovementError] = useState<string | null>(null);

  // Import Ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Current Sub Menu Config
  const activeConfig = useMemo(() => {
    return SUB_MENU_CONFIG.find(c => c.id === selectedCategory) || SUB_MENU_CONFIG[0];
  }, [selectedCategory]);

  // Unique Locations for Filter
  const availableLocations = useMemo(() => {
    const set = new Set<string>();
    inventoryItems
      .filter(i => i.category === selectedCategory && i.location)
      .forEach(i => set.add(i.location!));
    return Array.from(set).sort();
  }, [inventoryItems, selectedCategory]);

  // Filtered Items
  const filteredItems = useMemo(() => {
    return inventoryItems.filter(item => {
      // Must match sub-category
      if (item.category !== selectedCategory) return false;
      
      // If selectedGroupId or activeGroupId is provided (for mold & spare part submenus)
      const currentGroupId = selectedGroupId || activeGroupId;
      if (selectedCategory === 'mold_sparepart' && currentGroupId) {
        const targetPrefix = (currentGroupId === 'OIL' ? 'OIL_' : currentGroupId).toUpperCase();
        const cleanPrefix = targetPrefix.replace('_', '').toUpperCase();
        const codeUpper = (item.itemCode || '').toUpperCase();
        const partNoUpper = (item.partNo || '').toUpperCase();
        const nameUpper = (item.name || '').toUpperCase();

        const startsWithCode = codeUpper.startsWith(targetPrefix) || codeUpper.startsWith(cleanPrefix);
        const startsWithPart = partNoUpper.startsWith(targetPrefix) || partNoUpper.startsWith(cleanPrefix);
        const includesCode = codeUpper.includes(targetPrefix) || codeUpper.includes(cleanPrefix) || partNoUpper.includes(targetPrefix) || nameUpper.includes(targetPrefix);

        if (!startsWithCode && !startsWithPart && !includesCode) return false;
      }

      // Status filter
      if (statusFilter !== 'ALL') {
        const itemStatus = item.status || (item.endingQty <= item.minimumStock ? 'Low Stock' : 'Normal');
        if (itemStatus !== statusFilter) return false;
      }

      // Location filter
      if (locationFilter !== 'ALL' && item.location !== locationFilter) {
        return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const codeMatch = item.itemCode?.toLowerCase().includes(q);
        const partMatch = item.partNo?.toLowerCase().includes(q);
        const nameMatch = item.name?.toLowerCase().includes(q);
        const locMatch = item.location?.toLowerCase().includes(q);
        const coaMatch = item.coaCode?.toLowerCase().includes(q);
        return codeMatch || partMatch || nameMatch || locMatch || coaMatch;
      }

      return true;
    });
  }, [inventoryItems, selectedCategory, selectedGroupId, activeGroupId, statusFilter, locationFilter, searchQuery]);

  // Metrics for Current Category
  const metrics = useMemo(() => {
    let totalItems = 0;
    let totalEndingQty = 0;
    let totalUSD = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    filteredItems.forEach(item => {
      totalItems += 1;
      const endQty = Number(item.endingQty) || 0;
      totalEndingQty += endQty;

      const unitCostUSD = Number(item.unitCostUSD) || (Number(item.unitCost) || 0);
      const valUSD = Number(item.totalValueUSD) || (endQty * unitCostUSD);
      totalUSD += valUSD;

      const min = Number(item.minimumStock) || 0;
      if (endQty <= 0) {
        outOfStockCount += 1;
      } else if (endQty <= min) {
        lowStockCount += 1;
      }
    });

    const totalIDR = totalUSD * activeRateIDR;

    return {
      totalItems,
      totalEndingQty,
      totalUSD,
      totalIDR,
      lowStockCount,
      outOfStockCount
    };
  }, [filteredItems, activeRateIDR]);

  // Global Counts across all 4 sub-menus for tabs badges
  const categoryCounts = useMemo(() => {
    const map: Record<InventoryCategory, number> = {
      raw_material: 0,
      mold_sparepart: 0,
      wip: 0,
      finish_good: 0
    };
    inventoryItems.forEach(item => {
      if (map[item.category] !== undefined) {
        map[item.category] += 1;
      }
    });
    return map;
  }, [inventoryItems]);

  // Format numbers helper
  const formatNumber = (val: number, decimals: number = 2): string => {
    if (!val || isNaN(val)) return '0';
    return Number(val).toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  };

  // Form State for Add / Edit Modal
  const [formData, setFormData] = useState({
    itemCode: '',
    partNo: '',
    name: '',
    category: selectedCategory as InventoryCategory,
    uom: 'PCS',
    coaCode: activeConfig.defaultCoaCode,
    coaName: activeConfig.defaultCoaName,
    location: '',
    beginningQty: '0',
    inQty: '0',
    outQty: '0',
    minimumStock: '10',
    currency: 'USD',
    unitCost: '0',
    notes: ''
  });

  const openAddModal = () => {
    // Generate auto suggestion code
    const prefix = selectedCategory === 'raw_material' ? 'RM' :
      selectedCategory === 'mold_sparepart' ? 'MLD' :
      selectedCategory === 'wip' ? 'WIP' : 'FG';
    const count = inventoryItems.filter(i => i.category === selectedCategory).length + 1;
    const suggestedCode = `${prefix}-${String(count).padStart(3, '0')}`;

    setEditingItem(null);
    setFormError(null);
    setFormData({
      itemCode: suggestedCode,
      partNo: '',
      name: '',
      category: selectedCategory,
      uom: selectedCategory === 'raw_material' ? 'KG' : 'PCS',
      coaCode: activeConfig.defaultCoaCode,
      coaName: activeConfig.defaultCoaName,
      location: '',
      beginningQty: '0',
      inQty: '0',
      outQty: '0',
      minimumStock: '10',
      currency: 'USD',
      unitCost: '0',
      notes: ''
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item: InventoryItem) => {
    setEditingItem(item);
    setFormError(null);
    setFormData({
      itemCode: item.itemCode,
      partNo: item.partNo || '',
      name: item.name,
      category: item.category,
      uom: item.uom || 'PCS',
      coaCode: item.coaCode || activeConfig.defaultCoaCode,
      coaName: item.coaName || activeConfig.defaultCoaName,
      location: item.location || '',
      beginningQty: String(item.beginningQty || 0),
      inQty: String(item.inQty || 0),
      outQty: String(item.outQty || 0),
      minimumStock: String(item.minimumStock || 0),
      currency: item.currency || 'USD',
      unitCost: String(item.unitCost || 0),
      notes: item.notes || ''
    });
    setIsModalOpen(true);
  };

  const handleFormSave = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.itemCode.trim()) {
      setFormError('Kode Barang / SKU wajib diisi.');
      return;
    }
    if (!formData.name.trim()) {
      setFormError('Nama Barang & Spesifikasi Lengkap wajib diisi.');
      return;
    }

    const beg = Number(formData.beginningQty) || 0;
    const inQ = Number(formData.inQty) || 0;
    const outQ = Number(formData.outQty) || 0;
    const ending = Math.max(0, beg + inQ - outQ);
    const min = Number(formData.minimumStock) || 0;
    const cost = Number(formData.unitCost) || 0;
    const costUSD = formData.currency === 'IDR' ? (cost / activeRateIDR) : cost;
    const totalValUSD = ending * costUSD;
    const totalValIDR = totalValUSD * activeRateIDR;

    let status: 'Normal' | 'Low Stock' | 'Out of Stock' = 'Normal';
    if (ending <= 0) status = 'Out of Stock';
    else if (ending <= min) status = 'Low Stock';

    const itemPayload = {
      itemCode: formData.itemCode.trim(),
      partNo: formData.partNo.trim(),
      name: formData.name.trim(),
      category: formData.category,
      uom: formData.uom.trim().toUpperCase() || 'PCS',
      coaCode: formData.coaCode || activeConfig.defaultCoaCode,
      coaName: formData.coaName || activeConfig.defaultCoaName,
      location: formData.location.trim(),
      beginningQty: beg,
      inQty: inQ,
      outQty: outQ,
      endingQty: ending,
      minimumStock: min,
      currency: formData.currency,
      unitCost: cost,
      rate: 1,
      unitCostUSD: costUSD,
      totalValueUSD: totalValUSD,
      totalValueIDR: totalValIDR,
      status,
      notes: formData.notes.trim()
    };

    if (editingItem) {
      onUpdateInventoryItem(editingItem.id, itemPayload);
    } else {
      onAddInventoryItem(itemPayload);
    }

    setIsModalOpen(false);
  };

  // Quick Stock Movement handler
  const openMovementModal = (item: InventoryItem, type: 'IN' | 'OUT') => {
    setMovementItem(item);
    setMovementType(type);
    setMovementQty('');
    setMovementNotes('');
    setMovementError(null);
    setIsMovementModalOpen(true);
  };

  const handleApplyMovement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!movementItem) return;
    setMovementError(null);

    const qty = Number(movementQty);
    if (!qty || qty <= 0) {
      setMovementError('Masukkan jumlah kuantiti yang valid (lebih dari 0).');
      return;
    }

    const currentBeg = Number(movementItem.beginningQty) || 0;
    let newIn = Number(movementItem.inQty) || 0;
    let newOut = Number(movementItem.outQty) || 0;

    if (movementType === 'IN') {
      newIn += qty;
    } else {
      newOut += qty;
    }

    const ending = Math.max(0, currentBeg + newIn - newOut);
    const min = Number(movementItem.minimumStock) || 0;
    const costUSD = Number(movementItem.unitCostUSD) || (Number(movementItem.unitCost) || 0);
    const totalValUSD = ending * costUSD;
    const totalValIDR = totalValUSD * activeRateIDR;

    let status: 'Normal' | 'Low Stock' | 'Out of Stock' = 'Normal';
    if (ending <= 0) status = 'Out of Stock';
    else if (ending <= min) status = 'Low Stock';

    const timestamp = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
    const logNote = `[${timestamp} ${movementType === 'IN' ? '+Masuk' : '-Keluar'} ${qty} ${movementItem.uom || 'PCS'}${movementNotes ? `: ${movementNotes}` : ''}]`;
    const updatedNotes = movementItem.notes ? `${movementItem.notes} | ${logNote}` : logNote;

    onUpdateInventoryItem(movementItem.id, {
      inQty: newIn,
      outQty: newOut,
      endingQty: ending,
      totalValueUSD: totalValUSD,
      totalValueIDR: totalValIDR,
      status,
      notes: updatedNotes
    });

    setIsMovementModalOpen(false);
  };

  // Export to Excel handler
  const handleExportExcel = () => {
    const reportTitle = `LAPORAN INVENTORY - ${activeConfig.label.toUpperCase()}`;
    const company = companySettings?.companyName || 'PT. KANETA INDONESIA';
    const dateStr = new Date().toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });

    const sheetData: any[][] = [
      [reportTitle],
      ['Perusahaan', company],
      ['Kategori', activeConfig.label],
      ['COA Akun', `${activeConfig.defaultCoaCode} - ${activeConfig.defaultCoaName}`],
      ['Tanggal Cetak', dateStr],
      ['Kurs Acuan', `1 USD = IDR ${formatNumber(activeRateIDR, 2)}`],
      [],
      [
        'No',
        'Kode Barang',
        'Part Number',
        'Nama Barang / Spesifikasi',
        'Kategori',
        'COA',
        'Lokasi Gudang',
        'Satuan',
        'Saldo Awal',
        'Masuk (In)',
        'Keluar (Out)',
        'Saldo Akhir',
        'Min. Stock',
        'Unit Cost (USD)',
        'Total Nilai (USD)',
        'Total Nilai (IDR)',
        'Status',
        'Catatan'
      ]
    ];

    filteredItems.forEach((item, index) => {
      sheetData.push([
        index + 1,
        item.itemCode || '',
        item.partNo || '',
        item.name || '',
        item.category,
        `${item.coaCode || ''} ${item.coaName || ''}`.trim(),
        item.location || '',
        item.uom || 'PCS',
        Number(item.beginningQty) || 0,
        Number(item.inQty) || 0,
        Number(item.outQty) || 0,
        Number(item.endingQty) || 0,
        Number(item.minimumStock) || 0,
        Number(item.unitCostUSD || item.unitCost || 0),
        Number(item.totalValueUSD || 0),
        Number(item.totalValueIDR || (item.totalValueUSD * activeRateIDR) || 0),
        item.status || 'Normal',
        item.notes || ''
      ]);
    });

    // Grand Total Row
    sheetData.push([
      'TOTAL',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      filteredItems.reduce((acc, i) => acc + (Number(i.beginningQty) || 0), 0),
      filteredItems.reduce((acc, i) => acc + (Number(i.inQty) || 0), 0),
      filteredItems.reduce((acc, i) => acc + (Number(i.outQty) || 0), 0),
      metrics.totalEndingQty,
      '',
      '',
      metrics.totalUSD,
      metrics.totalIDR,
      '',
      ''
    ]);

    const ws = XLSX.utils.aoa_to_sheet(sheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, activeConfig.label.substring(0, 31));

    const fileName = `Inventory_${selectedCategory}_${new Date().toISOString().substring(0, 10)}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  // Import Excel handler
  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

        if (!jsonData || jsonData.length < 2) {
          alert('File Excel kosong atau format tidak valid.');
          return;
        }

        // Find header row (looks for Kode Barang or Item Code)
        let headerIdx = -1;
        for (let r = 0; r < Math.min(15, jsonData.length); r++) {
          const row = jsonData[r] || [];
          const str = row.join(' ').toLowerCase();
          if (str.includes('kode') || str.includes('item code') || str.includes('part')) {
            headerIdx = r;
            break;
          }
        }

        if (headerIdx === -1) {
          headerIdx = 0;
        }

        const headers = (jsonData[headerIdx] || []).map(h => String(h || '').toLowerCase().trim());
        const findCol = (keys: string[]) => {
          return headers.findIndex(h => keys.some(k => h.includes(k)));
        };

        const colCode = findCol(['kode', 'code', 'sku']);
        const colPart = findCol(['part', 'no part']);
        const colName = findCol(['nama', 'name', 'deskripsi', 'description']);
        const colUom = findCol(['satuan', 'uom', 'unit']);
        const colBeg = findCol(['awal', 'beginning', 'saldo awal']);
        const colIn = findCol(['masuk', 'in']);
        const colOut = findCol(['keluar', 'out']);
        const colMin = findCol(['min', 'safety']);
        const colCost = findCol(['cost', 'harga', 'price']);
        const colLoc = findCol(['lokasi', 'location', 'gudang', 'rak']);

        const newItems: Omit<InventoryItem, 'id'>[] = [];

        for (let r = headerIdx + 1; r < jsonData.length; r++) {
          const row = jsonData[r];
          if (!row || row.length === 0) continue;

          const itemCode = colCode !== -1 ? String(row[colCode] || '').trim() : '';
          const name = colName !== -1 ? String(row[colName] || '').trim() : '';

          if (!itemCode && !name) continue;

          const partNo = colPart !== -1 ? String(row[colPart] || '').trim() : '';
          const uom = colUom !== -1 ? String(row[colUom] || '').trim().toUpperCase() : 'PCS';
          const beg = colBeg !== -1 ? Number(row[colBeg]) || 0 : 0;
          const inQ = colIn !== -1 ? Number(row[colIn]) || 0 : 0;
          const outQ = colOut !== -1 ? Number(row[colOut]) || 0 : 0;
          const ending = Math.max(0, beg + inQ - outQ);
          const min = colMin !== -1 ? Number(row[colMin]) || 10 : 10;
          const cost = colCost !== -1 ? Number(row[colCost]) || 0 : 0;
          const loc = colLoc !== -1 ? String(row[colLoc] || '').trim() : '';

          const costUSD = cost;
          const totalValUSD = ending * costUSD;
          const totalValIDR = totalValUSD * activeRateIDR;

          let status: 'Normal' | 'Low Stock' | 'Out of Stock' = 'Normal';
          if (ending <= 0) status = 'Out of Stock';
          else if (ending <= min) status = 'Low Stock';

          newItems.push({
            itemCode: itemCode || `ITEM-${r}`,
            partNo,
            name: name || itemCode,
            category: selectedCategory,
            uom: uom || 'PCS',
            coaCode: activeConfig.defaultCoaCode,
            coaName: activeConfig.defaultCoaName,
            location: loc,
            beginningQty: beg,
            inQty: inQ,
            outQty: outQ,
            endingQty: ending,
            minimumStock: min,
            currency: 'USD',
            unitCost: cost,
            rate: 1,
            unitCostUSD: costUSD,
            totalValueUSD: totalValUSD,
            totalValueIDR: totalValIDR,
            status,
            notes: 'Imported via Excel'
          });
        }

        if (newItems.length > 0) {
          if (onBatchImportInventory) {
            onBatchImportInventory(newItems);
          } else {
            newItems.forEach(item => onAddInventoryItem(item));
          }
          alert(`Berhasil mengimpor ${newItems.length} item inventory ke ${activeConfig.label}!`);
        } else {
          alert('Tidak ada baris data valid yang dapat diimpor.');
        }
      } catch (err) {
        console.error('Error importing Excel:', err);
        alert('Gagal membaca file Excel. Pastikan format file sesuai.');
      }
    };
    reader.readAsArrayBuffer(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-7 shadow-xs">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-center gap-3.5">
            <div className={`w-12 h-12 rounded-2xl ${activeConfig.bgLight} border ${activeConfig.borderLight} flex items-center justify-center ${activeConfig.color} shadow-xs`}>
              <activeConfig.icon className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Inventory &bull; {activeConfig.label}
                </h1>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${activeConfig.bgLight} ${activeConfig.color} border ${activeConfig.borderLight}`}>
                  COA: {activeConfig.defaultCoaCode}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {activeConfig.description}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 flex-wrap w-full lg:w-auto">
            <button
              onClick={openAddModal}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-indigo-600/30 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Item</span>
            </button>

            <button
              onClick={handleExportExcel}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition cursor-pointer"
              title="Download format Excel"
            >
              <Download className="w-4 h-4 text-emerald-600" />
              <span>Export Excel</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition cursor-pointer"
              title="Upload file Excel"
            >
              <Upload className="w-4 h-4 text-indigo-600" />
              <span>Import Excel</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={handleFileImport}
              className="hidden"
            />
          </div>
        </div>

        {/* SUB-MENU TABS NAVIGATION (4 Sub-menus as requested) */}
        <div className="pt-4">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">
            Pilih Sub Menu Inventory:
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {SUB_MENU_CONFIG.map(sub => {
              const isSelected = sub.id === selectedCategory;
              const count = categoryCounts[sub.id] || 0;
              const IconComp = sub.icon;

              return (
                <button
                  key={sub.id}
                  id={`inventory-tab-${sub.id}`}
                  onClick={() => handleCategorySwitch(sub.id)}
                  className={`flex items-center justify-between p-3 rounded-2xl border transition text-left cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20'
                      : 'bg-slate-50/70 hover:bg-slate-100/90 text-slate-700 border-slate-200/80'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                      isSelected ? 'bg-white/20 text-white' : `${sub.bgLight} ${sub.color}`
                    }`}>
                      <IconComp className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 truncate">
                      <div className="font-bold text-xs sm:text-sm truncate">
                        {sub.label}
                      </div>
                      <div className={`text-[10px] truncate ${isSelected ? 'text-indigo-200' : 'text-slate-400'}`}>
                        {sub.defaultCoaCode}
                      </div>
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 rounded-lg text-xs font-mono font-bold shrink-0 ml-2 ${
                    isSelected ? 'bg-white text-indigo-700' : 'bg-white border border-slate-200 text-slate-700'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {selectedCategory === 'mold_sparepart' && (
            <div className="pt-4 border-t border-slate-100 mt-4">
              <div className="flex items-center justify-between mb-2">
                <div className="text-[11px] font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5" />
                  <span>Sub Menu & Kode Item Stock Mold & Spare Part:</span>
                </div>
                {selectedGroupId && (
                  <button
                    onClick={() => setSelectedGroupId(undefined)}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Lihat Semua Kode</span>
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
                {MOLD_SPAREPART_SUB_GROUPS.map(grp => {
                  const isGrpActive = (!selectedGroupId && grp.id === 'ALL') || (selectedGroupId === grp.code) || (selectedGroupId === 'OIL' && grp.code === 'OIL_');
                  return (
                    <button
                      key={grp.id}
                      onClick={() => setSelectedGroupId(grp.id === 'ALL' ? undefined : grp.code)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition flex items-center gap-1.5 cursor-pointer ${
                        isGrpActive
                          ? 'bg-amber-500 text-white shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      <span>{grp.label}</span>
                      {grp.code && (
                        <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${isGrpActive ? 'bg-amber-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                          {grp.code}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SUMMARY KPI METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total SKU / Items */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Item / SKU</div>
            <div className="text-2xl font-black text-slate-900 mt-0.5 font-mono">{metrics.totalItems}</div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
              <span>Fisik:</span>
              <span className="font-mono font-bold text-slate-700">{formatNumber(metrics.totalEndingQty, 0)} Unit</span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
            <Boxes className="w-5 h-5" />
          </div>
        </div>

        {/* Card 2: Total Nilai Stok USD */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Nilai Stok (USD)</div>
            <div className="text-2xl font-black text-indigo-700 mt-0.5 font-mono">
              ${formatNumber(metrics.totalUSD, 2)}
            </div>
            <div className="text-[11px] text-indigo-500 mt-1 font-medium truncate">
              Akun: {activeConfig.defaultCoaCode}
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
            <Coins className="w-5 h-5" />
          </div>
        </div>

        {/* Card 3: Nilai Stok Ekuivalen IDR */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Nilai Ekuivalen IDR</div>
            <div className="text-lg sm:text-xl font-black text-slate-900 mt-0.5 font-mono">
              Rp {formatNumber(metrics.totalIDR, 0)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Kurs: Rp {formatNumber(activeRateIDR, 0)}/USD
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        {/* Card 4: Peringatan Stok Kritis */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Status Stok Kritis</div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`text-2xl font-black font-mono ${metrics.lowStockCount > 0 ? 'text-amber-600' : 'text-slate-800'}`}>
                {metrics.lowStockCount}
              </span>
              <span className="text-xs text-slate-400">Low Stock</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Habis / Out of Stock: <span className="font-bold text-rose-600 font-mono">{metrics.outOfStockCount}</span>
            </div>
          </div>
          <div className={`w-11 h-11 rounded-xl border flex items-center justify-center ${
            metrics.lowStockCount > 0 ? 'bg-amber-50 border-amber-200 text-amber-600' : 'bg-slate-50 border-slate-200 text-slate-400'
          }`}>
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH TOOLBAR */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search Bar */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari kode, part no, nama, lokasi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2.5 w-full md:w-auto flex-wrap">
          {selectedCategory === 'mold_sparepart' && (
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-700">
              <span className="font-semibold text-slate-500">Mulai:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent font-bold text-slate-800 outline-none cursor-pointer"
              />
              <span className="font-semibold text-slate-500 ml-2">Akhir:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent font-bold text-slate-800 outline-none cursor-pointer"
              />
            </div>
          )}
          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-700">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-semibold text-slate-500">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent font-bold text-slate-800 outline-none cursor-pointer"
            >
              <option value="ALL">Semua Status</option>
              <option value="Normal">Normal</option>
              <option value="Low Stock">Low Stock</option>
              <option value="Out of Stock">Out of Stock</option>
            </select>
          </div>

          {/* Location Filter */}
          {availableLocations.length > 0 && (
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-700">
              <Warehouse className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-semibold text-slate-500">Lokasi:</span>
              <select
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="bg-transparent font-bold text-slate-800 outline-none cursor-pointer"
              >
                <option value="ALL">Semua Lokasi</option>
                {availableLocations.map(loc => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>
          )}

          <div className="text-xs text-slate-400 font-mono pl-1">
            Menampilkan: <strong className="text-slate-700">{filteredItems.length}</strong> item
          </div>
        </div>
      </div>

      {/* MAIN INVENTORY TABLE OR SUMMARY TABLE */}
      {selectedCategory === 'mold_sparepart' && !activeGroupId ? (
        <InventoryMoldSummaryTable 
          items={inventoryItems.filter(i => i.category === 'mold_sparepart')} 
          startDate={startDate}
          endDate={endDate}
        />
      ) : selectedCategory === 'mold_sparepart' && activeGroupId ? (
        <InventoryMoldSubTable 
          items={filteredItems} 
          startDate={startDate}
          endDate={endDate}
        />
      ) : (
        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-slate-50/90 text-slate-700 font-bold border-b border-slate-200 select-none">
                <th className="p-3 text-center w-12">No</th>
                <th className="p-3">Kode / SKU</th>
                <th className="p-3">Part Number</th>
                <th className="p-3 min-w-[220px]">Nama Barang &amp; Spesifikasi</th>
                <th className="p-3">Lokasi</th>
                <th className="p-3 text-center">Satuan</th>
                <th className="p-3 text-right">Saldo Awal</th>
                <th className="p-3 text-right text-emerald-700">+ In</th>
                <th className="p-3 text-right text-rose-700">- Out</th>
                <th className="p-3 text-right font-black">Saldo Akhir</th>
                <th className="p-3 text-right text-slate-500">Min. Stock</th>
                <th className="p-3 text-right">Unit Cost USD</th>
                <th className="p-3 text-right font-bold text-indigo-700">Total Nilai USD</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-center w-28">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={15} className="p-10 text-center text-slate-400 italic">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mx-auto mb-2">
                      <activeConfig.icon className="w-6 h-6" />
                    </div>
                    Tidak ada item inventory dalam kategori <strong>{activeConfig.label}</strong>
                    {searchQuery ? ' yang cocok dengan kata kunci pencarian.' : '. Silakan klik "Tambah Item" di atas.'}
                  </td>
                </tr>
              ) : (
                filteredItems.map((item, index) => {
                  const endQty = Number(item.endingQty) || 0;
                  const minStock = Number(item.minimumStock) || 0;
                  const isLow = endQty <= minStock && endQty > 0;
                  const isOut = endQty <= 0;

                  return (
                    <tr key={item.id} className="hover:bg-indigo-50/20 transition-colors">
                      <td className="p-3 text-center font-mono text-slate-400">{index + 1}</td>
                      <td className="p-3 font-mono font-bold text-slate-900">
                        <span className="px-2 py-0.5 bg-slate-100 rounded-md border border-slate-200">
                          {item.itemCode}
                        </span>
                      </td>
                      <td className="p-3 font-mono font-medium text-slate-700">
                        {item.partNo || '-'}
                      </td>
                      <td className="p-3 font-semibold text-slate-900">
                        <div>{item.name}</div>
                        {item.notes && (
                          <div className="text-[10px] text-slate-400 font-normal mt-0.5 truncate max-w-xs">
                            {item.notes}
                          </div>
                        )}
                      </td>
                      <td className="p-3 font-mono text-slate-600">
                        {item.location ? (
                          <span className="inline-flex items-center gap-1 text-[11px]">
                            <Warehouse className="w-3 h-3 text-slate-400" />
                            <span>{item.location}</span>
                          </span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                      <td className="p-3 text-center font-bold text-slate-700">
                        <span className="px-1.5 py-0.5 bg-slate-100 rounded text-[10px]">
                          {item.uom || 'PCS'}
                        </span>
                      </td>
                      <td className="p-3 text-right font-mono text-slate-600">
                        {formatNumber(item.beginningQty, 0)}
                      </td>
                      <td className="p-3 text-right font-mono text-emerald-700 font-medium">
                        +{formatNumber(item.inQty, 0)}
                      </td>
                      <td className="p-3 text-right font-mono text-rose-600 font-medium">
                        -{formatNumber(item.outQty, 0)}
                      </td>
                      <td className="p-3 text-right font-mono font-black text-slate-900 text-sm bg-slate-50/50">
                        {formatNumber(endQty, 0)}
                      </td>
                      <td className="p-3 text-right font-mono text-slate-400">
                        {formatNumber(minStock, 0)}
                      </td>
                      <td className="p-3 text-right font-mono text-slate-700">
                        ${formatNumber(item.unitCostUSD || item.unitCost || 0, 2)}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-indigo-700 bg-indigo-50/30">
                        ${formatNumber(item.totalValueUSD || (endQty * (item.unitCostUSD || item.unitCost || 0)), 2)}
                      </td>
                      <td className="p-3 text-center">
                        {isOut ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                            Habis
                          </span>
                        ) : isLow ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            Low Stock
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            Normal
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {/* In Movement Button */}
                          <button
                            onClick={() => openMovementModal(item, 'IN')}
                            className="p-1 rounded-lg hover:bg-emerald-50 text-slate-400 hover:text-emerald-700 transition cursor-pointer"
                            title="Tambah Stok Masuk (In)"
                          >
                            <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600" />
                          </button>

                          {/* Out Movement Button */}
                          <button
                            onClick={() => openMovementModal(item, 'OUT')}
                            className="p-1 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-700 transition cursor-pointer"
                            title="Catat Stok Keluar (Out)"
                          >
                            <ArrowUpRight className="w-3.5 h-3.5 text-rose-600" />
                          </button>

                          {/* Edit Button */}
                          <button
                            onClick={() => openEditModal(item)}
                            className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-indigo-600 transition cursor-pointer"
                            title="Edit Item"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Button */}
                          <button
                            onClick={() => {
                              if (window.confirm(`Yakin hapus item inventory "${item.itemCode} - ${item.name}"?`)) {
                                onDeleteInventoryItem(item.id);
                              }
                            }}
                            className="p-1 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                            title="Hapus Item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>

            {/* Total Row */}
            {filteredItems.length > 0 && (
              <tfoot>
                <tr className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300">
                  <td colSpan={6} className="p-3 text-center tracking-wider">
                    TOTAL {activeConfig.label.toUpperCase()} ({filteredItems.length} Item)
                  </td>
                  <td className="p-3 text-right font-mono">
                    {formatNumber(filteredItems.reduce((a, i) => a + (Number(i.beginningQty) || 0), 0), 0)}
                  </td>
                  <td className="p-3 text-right font-mono text-emerald-800">
                    +{formatNumber(filteredItems.reduce((a, i) => a + (Number(i.inQty) || 0), 0), 0)}
                  </td>
                  <td className="p-3 text-right font-mono text-rose-800">
                    -{formatNumber(filteredItems.reduce((a, i) => a + (Number(i.outQty) || 0), 0), 0)}
                  </td>
                  <td className="p-3 text-right font-mono font-black text-sm bg-slate-200/60">
                    {formatNumber(metrics.totalEndingQty, 0)}
                  </td>
                  <td className="p-3"></td>
                  <td className="p-3"></td>
                  <td className="p-3 text-right font-mono font-black text-sm text-indigo-900 bg-indigo-100/50">
                    ${formatNumber(metrics.totalUSD, 2)}
                  </td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
      )}

      {/* MODAL 1: ADD / EDIT INVENTORY ITEM */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full p-5 sm:p-7 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${activeConfig.bgLight} ${activeConfig.color} flex items-center justify-center`}>
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900">
                    {editingItem ? 'Edit Item Inventory' : `Tambah Item (${activeConfig.label})`}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Kategori: <strong>{activeConfig.label}</strong> &bull; COA: {activeConfig.defaultCoaCode}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleFormSave} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Kode Barang */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Kode Barang / SKU <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.itemCode}
                    onChange={(e) => setFormData(prev => ({ ...prev, itemCode: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Contoh: RM-001, FG-102"
                  />
                </div>

                {/* Part Number */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Part Number (Customer / Drawing)
                  </label>
                  <input
                    type="text"
                    value={formData.partNo}
                    onChange={(e) => setFormData(prev => ({ ...prev, partNo: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Contoh: 50100-KNT-001"
                  />
                </div>
              </div>

              {/* Nama Barang / Spesifikasi */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nama Barang &amp; Spesifikasi Lengkap <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Contoh: Steel Coil SPCC-SD 1.2 x 1219mm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Sub Menu / Category */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Sub Menu / Kategori</label>
                  <select
                    value={formData.category}
                    onChange={(e) => {
                      const newCat = e.target.value as InventoryCategory;
                      const conf = SUB_MENU_CONFIG.find(c => c.id === newCat);
                      setFormData(prev => ({
                        ...prev,
                        category: newCat,
                        coaCode: conf ? conf.defaultCoaCode : prev.coaCode,
                        coaName: conf ? conf.defaultCoaName : prev.coaName
                      }));
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {SUB_MENU_CONFIG.map(c => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                </div>

                {/* Satuan UoM */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Satuan (UoM)</label>
                  <input
                    type="text"
                    value={formData.uom}
                    onChange={(e) => setFormData(prev => ({ ...prev, uom: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold uppercase text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="KG, PCS, SHEET, MTR, SET"
                  />
                </div>

                {/* Lokasi Gudang / Rak */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Lokasi Gudang / Rak / Line</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Contoh: WH-RM-01, LINE-1"
                  />
                </div>
              </div>

              {/* COA Mapping */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Akun COA Persediaan</label>
                <select
                  value={formData.coaCode}
                  onChange={(e) => {
                    const code = e.target.value;
                    const found = coaList.find(c => c.code === code);
                    setFormData(prev => ({
                      ...prev,
                      coaCode: code,
                      coaName: found ? found.name : prev.coaName
                    }));
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="1080001">1080001 - Inventory - Raw Material</option>
                  <option value="1080005">1080005 - Inventory - Mold &amp; Spareparts</option>
                  <option value="1080003">1080003 - Inventory - WIP</option>
                  <option value="1080004">1080004 - Inventory - Finished Goods</option>
                  <option value="1080002">1080002 - Inventory - in transit</option>
                  {coaList
                    .filter(c => c.code.startsWith('108') && !['1080001','1080005','1080003','1080004','1080002'].includes(c.code))
                    .map(c => (
                      <option key={c.code} value={c.code}>{c.code} - {c.name}</option>
                    ))
                  }
                </select>
              </div>

              {/* Stock Quantities Section */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                <div className="font-bold text-slate-800 flex items-center justify-between">
                  <span>Kuantiti Stok ({formData.uom || 'PCS'})</span>
                  <span className="text-[11px] text-slate-500 font-normal">
                    Ending Qty = Saldo Awal + Masuk - Keluar
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-slate-500 text-[11px] font-medium mb-1">Saldo Awal</label>
                    <input
                      type="number"
                      step="any"
                      value={formData.beginningQty}
                      onChange={(e) => setFormData(prev => ({ ...prev, beginningQty: e.target.value }))}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-mono text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-emerald-700 text-[11px] font-semibold mb-1">+ Penerimaan (In)</label>
                    <input
                      type="number"
                      step="any"
                      value={formData.inQty}
                      onChange={(e) => setFormData(prev => ({ ...prev, inQty: e.target.value }))}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-mono text-emerald-800 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-rose-700 text-[11px] font-semibold mb-1">- Pemakaian (Out)</label>
                    <input
                      type="number"
                      step="any"
                      value={formData.outQty}
                      onChange={(e) => setFormData(prev => ({ ...prev, outQty: e.target.value }))}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-mono text-rose-800 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 text-[11px] font-bold mb-1">Min. Stock Alert</label>
                    <input
                      type="number"
                      step="any"
                      value={formData.minimumStock}
                      onChange={(e) => setFormData(prev => ({ ...prev, minimumStock: e.target.value }))}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-mono text-amber-700 font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Pricing & Valuation */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mata Uang</label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="IDR">IDR (Rp)</option>
                    <option value="JPY">JPY (¥)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Harga Satuan (Unit Cost)</label>
                  <input
                    type="number"
                    step="any"
                    value={formData.unitCost}
                    onChange={(e) => setFormData(prev => ({ ...prev, unitCost: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800 font-bold"
                  />
                </div>
              </div>

              {/* Catatan */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Catatan / Keterangan</label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
                  placeholder="Keterangan peruntukan, supplier, spesifikasi khusus"
                />
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md shadow-indigo-600/30 cursor-pointer"
                >
                  {editingItem ? 'Simpan Perubahan' : 'Tambah ke Inventory'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: QUICK IN / OUT ADJUSTMENT */}
      {isMovementModalOpen && movementItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  movementType === 'IN' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-rose-50 text-rose-600 border border-rose-200'
                }`}>
                  {movementType === 'IN' ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-slate-900">
                    {movementType === 'IN' ? 'Catat Penerimaan (Stok Masuk)' : 'Catat Pemakaian (Stok Keluar)'}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-mono">
                    {movementItem.itemCode} &bull; {movementItem.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsMovementModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {movementError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{movementError}</span>
              </div>
            )}

            <form onSubmit={handleApplyMovement} className="space-y-3.5 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <div className="flex justify-between text-slate-600">
                  <span>Saldo Saat Ini:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {formatNumber(movementItem.endingQty, 0)} {movementItem.uom}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Min. Safety Stock:</span>
                  <span className="font-mono text-slate-700">{formatNumber(movementItem.minimumStock, 0)} {movementItem.uom}</span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Jumlah Kuantiti ({movementItem.uom}) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  autoFocus
                  value={movementQty}
                  onChange={(e) => setMovementQty(e.target.value)}
                  placeholder="Masukkan jumlah..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nomor Dokumen / Keterangan (PO / SPK / Surat Jalan)
                </label>
                <input
                  type="text"
                  value={movementNotes}
                  onChange={(e) => setMovementNotes(e.target.value)}
                  placeholder="Contoh: PO-2026-081, Line Stamping 1"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsMovementModalOpen(false)}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className={`px-4 py-1.5 text-white rounded-xl font-bold cursor-pointer shadow-md ${
                    movementType === 'IN' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30' : 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/30'
                  }`}
                >
                  {movementType === 'IN' ? 'Konfirmasi Stok Masuk' : 'Konfirmasi Stok Keluar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
