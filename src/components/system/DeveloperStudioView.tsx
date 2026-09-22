import React, { useState, useMemo, useRef } from 'react';
import {
  Code2,
  Layers,
  Plus,
  Trash2,
  Edit3,
  Move,
  GripVertical,
  CheckCircle2,
  XCircle,
  FolderTree,
  FileCode,
  Database,
  Eye,
  Settings2,
  RefreshCw,
  Download,
  Upload,
  Search,
  ChevronRight,
  ChevronDown,
  ArrowUp,
  ArrowDown,
  Sparkles,
  Save,
  Sliders,
  Table,
  PlusCircle,
  Tag,
  AlertTriangle,
  FolderPlus,
  Play,
  FileSpreadsheet,
  Check,
  X,
  ExternalLink,
  HelpCircle,
  CornerDownRight,
  Terminal,
  Cpu
} from 'lucide-react';
import {
  NavGroupConfig,
  DynamicNavItem,
  DynamicSubNavItem,
  DynamicFormSchema,
  DynamicFormField,
  DynamicFieldType,
  CustomDatasetRecord,
  Department,
  COA,
  Supplier,
  Customer,
  ItemStock,
  ProductionProcess,
  AppUser,
  CompanySettings
} from '../../types';
import { getDynamicIcon, AVAILABLE_ICON_NAMES } from '../../utils/iconMap';
import { DEFAULT_NAVIGATION_CONFIG, INITIAL_DYNAMIC_FORM_SCHEMAS, INITIAL_CUSTOM_DATASETS } from '../../constants/defaultNavigation';

interface DeveloperStudioViewProps {
  navigationConfig: NavGroupConfig[];
  onUpdateNavigationConfig: (config: NavGroupConfig[]) => void;
  dynamicFormSchemas: DynamicFormSchema[];
  onUpdateFormSchemas: (schemas: DynamicFormSchema[]) => void;
  customDatasets: Record<string, CustomDatasetRecord[]>;
  onUpdateCustomDatasets: (datasets: Record<string, CustomDatasetRecord[]>) => void;
  departments: Department[];
  coaList: COA[];
  suppliers: Supplier[];
  customers: Customer[];
  itemStocks: ItemStock[];
  productionProcesses: ProductionProcess[];
  currentUser?: AppUser | null;
  companySettings?: CompanySettings;
  onNavigateToTab?: (tabId: string) => void;
}

export const DeveloperStudioView: React.FC<DeveloperStudioViewProps> = ({
  navigationConfig,
  onUpdateNavigationConfig,
  dynamicFormSchemas,
  onUpdateFormSchemas,
  customDatasets,
  onUpdateCustomDatasets,
  departments,
  coaList,
  suppliers,
  customers,
  itemStocks,
  productionProcesses,
  currentUser,
  companySettings,
  onNavigateToTab
}) => {
  // Main Studio Tabs
  const [activeStudioTab, setActiveStudioTab] = useState<'menu-builder' | 'form-builder' | 'data-integrator' | 'preview-page'>('menu-builder');
  
  // Notification toast
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // =========================================================================
  // 1. MENU BUILDER STATE & DRAG AND DROP
  // =========================================================================
  const [selectedGroupId, setSelectedGroupId] = useState<string>(navigationConfig[0]?.id || 'grp-workspace');
  const [editingItemModal, setEditingItemModal] = useState<{
    isOpen: boolean;
    isNew: boolean;
    groupId: string;
    parentItemId?: string; // If adding/editing a sub-item
    item: Partial<DynamicNavItem> | Partial<DynamicSubNavItem>;
  }>({
    isOpen: false,
    isNew: false,
    groupId: '',
    item: {}
  });

  const [editingGroupModal, setEditingGroupModal] = useState<{
    isOpen: boolean;
    isNew: boolean;
    group: Partial<NavGroupConfig>;
  }>({
    isOpen: false,
    isNew: false,
    group: {}
  });

  const [iconPickerOpen, setIconPickerOpen] = useState(false);
  const [iconSearchTerm, setIconSearchTerm] = useState('');

  // Drag and Drop tracking
  const [draggedItemInfo, setDraggedItemInfo] = useState<{
    groupId: string;
    itemIndex: number;
    parentItemId?: string;
    subItemIndex?: number;
  } | null>(null);

  const [dragOverTarget, setDragOverTarget] = useState<string | null>(null);

  // Filter icon list
  const filteredIcons = useMemo(() => {
    if (!iconSearchTerm.trim()) return AVAILABLE_ICON_NAMES;
    return AVAILABLE_ICON_NAMES.filter(name =>
      name.toLowerCase().includes(iconSearchTerm.toLowerCase())
    );
  }, [iconSearchTerm]);

  // All available system data sources
  const availableDataSources = useMemo(() => {
    const defaultSources = [
      { key: 'deptPlanningItems', label: 'Dept Planning (Budget Realisasi)', category: 'Budget' },
      { key: 'monthlyData', label: 'Monthly Summary Budget', category: 'Budget' },
      { key: 'cashBankAccounts', label: 'Kas & Bank Accounts', category: 'Kas & Bank' },
      { key: 'cashBankReceipts', label: 'Kas Masuk / Penerimaan', category: 'Kas & Bank' },
      { key: 'cashBankPayments', label: 'Kas Keluar / Pembayaran', category: 'Kas & Bank' },
      { key: 'purchaseRequests', label: 'Purchase Request (PR)', category: 'Purchasing' },
      { key: 'purchaseOrders', label: 'Purchase Order (PO)', category: 'Purchasing' },
      { key: 'receiveItemOrders', label: 'Receive Item Order (GR)', category: 'Purchasing' },
      { key: 'purchaseInvoices', label: 'Purchase Invoices (AP)', category: 'Purchasing' },
      { key: 'returnItemOrders', label: 'Return Item Orders', category: 'Purchasing' },
      { key: 'paymentPurchases', label: 'Payment Purchases (Voucher)', category: 'Purchasing' },
      { key: 'salesPlanItems', label: 'Sales Plan', category: 'Sales' },
      { key: 'salesDeliveryItems', label: 'Sales Delivery (Surat Jalan)', category: 'Sales' },
      { key: 'salesInvoiceItems', label: 'Sales Invoices (AR)', category: 'Sales' },
      { key: 'fixedAssetItems', label: 'Fixed Assets (Aktiva Tetap)', category: 'Asset' },
      { key: 'inventoryItems', label: 'Inventory Items & Stock', category: 'Inventory' },
      { key: 'lotNumbers', label: 'Lot Numbers (Tracing Produksi)', category: 'Production' },
      { key: 'productionSchedules', label: 'Production Schedule (Jadwal Mesin)', category: 'Production' },
      { key: 'ngReports', label: 'NG Reports (Laporan Defek QC)', category: 'Production' },
      { key: 'departments', label: 'Master Departments', category: 'Master' },
      { key: 'suppliers', label: 'Master Suppliers', category: 'Master' },
      { key: 'customers', label: 'Master Customers', category: 'Master' },
      { key: 'itemStocks', label: 'Master Item Stock', category: 'Master' },
      { key: 'productionProcesses', label: 'Master Proses Produksi', category: 'Master' },
      { key: 'coa', label: 'Master Chart of Accounts (COA)', category: 'Master' },
      { key: 'dailyRates', label: 'Daily Exchange Rates (BI & KMK)', category: 'Master' },
      { key: 'users', label: 'User Accounts & Roles', category: 'System' },
      { key: 'auditLogs', label: 'Audit Trail Logs', category: 'System' }
    ];

    // Add custom datasets
    const customSources = Object.keys(customDatasets).map(key => ({
      key,
      label: `Custom: ${key} (${customDatasets[key]?.length || 0} data)`,
      category: 'Custom Dynamic Dataset'
    }));

    return [...defaultSources, ...customSources];
  }, [customDatasets]);

  // Handle Drag Start
  const handleDragStart = (
    e: React.DragEvent,
    groupId: string,
    itemIndex: number,
    parentItemId?: string,
    subItemIndex?: number
  ) => {
    setDraggedItemInfo({ groupId, itemIndex, parentItemId, subItemIndex });
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', JSON.stringify({ groupId, itemIndex, parentItemId, subItemIndex }));
  };

  // Handle Drag Over
  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverTarget !== targetId) {
      setDragOverTarget(targetId);
    }
  };

  // Handle Drop Reorder for Menus
  const handleDropItem = (targetGroupId: string, targetIndex: number) => {
    if (!draggedItemInfo) return;
    setDragOverTarget(null);

    const newConfig = JSON.parse(JSON.stringify(navigationConfig)) as NavGroupConfig[];
    const sourceGroup = newConfig.find(g => g.id === draggedItemInfo.groupId);
    const targetGroup = newConfig.find(g => g.id === targetGroupId);

    if (!sourceGroup || !targetGroup) return;

    // Moving a top-level menu item
    if (draggedItemInfo.parentItemId === undefined) {
      const [movedItem] = sourceGroup.items.splice(draggedItemInfo.itemIndex, 1);
      if (movedItem) {
        targetGroup.items.splice(targetIndex, 0, movedItem);
        onUpdateNavigationConfig(newConfig);
        showToast(`Menu "${movedItem.label}" berhasil dipindahkan`);
      }
    }

    setDraggedItemInfo(null);
  };

  // Handle Drop for Submenu
  const handleDropSubItem = (groupId: string, parentItemId: string, targetSubIndex: number) => {
    if (!draggedItemInfo || draggedItemInfo.parentItemId !== parentItemId) return;
    setDragOverTarget(null);

    const newConfig = JSON.parse(JSON.stringify(navigationConfig)) as NavGroupConfig[];
    const group = newConfig.find(g => g.id === groupId);
    if (!group) return;
    const parentItem = group.items.find(i => i.id === parentItemId);
    if (!parentItem || !parentItem.subItems || draggedItemInfo.subItemIndex === undefined) return;

    const [movedSub] = parentItem.subItems.splice(draggedItemInfo.subItemIndex, 1);
    if (movedSub) {
      parentItem.subItems.splice(targetSubIndex, 0, movedSub);
      onUpdateNavigationConfig(newConfig);
      showToast(`Submenu "${movedSub.label}" berhasil dipindahkan`);
    }

    setDraggedItemInfo(null);
  };

  // Move menu up / down using buttons
  const handleMoveItem = (groupId: string, index: number, direction: 'up' | 'down') => {
    const newConfig = JSON.parse(JSON.stringify(navigationConfig)) as NavGroupConfig[];
    const group = newConfig.find(g => g.id === groupId);
    if (!group) return;

    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= group.items.length) return;

    const temp = group.items[index];
    group.items[index] = group.items[targetIdx];
    group.items[targetIdx] = temp;

    onUpdateNavigationConfig(newConfig);
  };

  // Move submenu up / down using buttons
  const handleMoveSubItem = (groupId: string, parentItemId: string, subIndex: number, direction: 'up' | 'down') => {
    const newConfig = JSON.parse(JSON.stringify(navigationConfig)) as NavGroupConfig[];
    const group = newConfig.find(g => g.id === groupId);
    if (!group) return;
    const parentItem = group.items.find(i => i.id === parentItemId);
    if (!parentItem || !parentItem.subItems) return;

    const targetIdx = direction === 'up' ? subIndex - 1 : subIndex + 1;
    if (targetIdx < 0 || targetIdx >= parentItem.subItems.length) return;

    const temp = parentItem.subItems[subIndex];
    parentItem.subItems[subIndex] = parentItem.subItems[targetIdx];
    parentItem.subItems[targetIdx] = temp;

    onUpdateNavigationConfig(newConfig);
  };

  // Save Add/Edit Menu or Submenu
  const handleSaveMenuItem = () => {
    const { isNew, groupId, parentItemId, item } = editingItemModal;
    if (!item.label?.trim()) {
      showToast('Nama menu tidak boleh kosong', 'error');
      return;
    }

    const cleanId = item.id?.trim() || `custom-${item.label.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString().slice(-4)}`;

    const newConfig = JSON.parse(JSON.stringify(navigationConfig)) as NavGroupConfig[];
    const group = newConfig.find(g => g.id === groupId);
    if (!group) return;

    if (parentItemId) {
      // It's a sub-item
      const parent = group.items.find(i => i.id === parentItemId);
      if (!parent) return;
      if (!parent.subItems) parent.subItems = [];

      if (isNew) {
        parent.subItems.push({
          id: cleanId,
          label: item.label,
          category: (item as DynamicSubNavItem).category || cleanId,
          description: item.description,
          dataSourceKey: item.dataSourceKey,
          formSchemaId: item.formSchemaId,
          isActive: item.isActive !== false
        });
      } else {
        const subIdx = parent.subItems.findIndex(s => s.id === item.id);
        if (subIdx !== -1) {
          parent.subItems[subIdx] = {
            ...parent.subItems[subIdx],
            label: item.label,
            category: (item as DynamicSubNavItem).category || parent.subItems[subIdx].category,
            description: item.description,
            dataSourceKey: item.dataSourceKey,
            formSchemaId: item.formSchemaId,
            isActive: item.isActive !== false
          };
        }
      }
    } else {
      // Top-level menu item
      if (isNew) {
        group.items.push({
          id: cleanId,
          label: item.label,
          iconName: (item as DynamicNavItem).iconName || 'Layers',
          description: item.description || '',
          isCustom: true,
          isActive: item.isActive !== false,
          dataSourceKey: item.dataSourceKey,
          formSchemaId: item.formSchemaId,
          subItems: []
        });
      } else {
        const itemIdx = group.items.findIndex(i => i.id === item.id);
        if (itemIdx !== -1) {
          group.items[itemIdx] = {
            ...group.items[itemIdx],
            label: item.label,
            iconName: (item as DynamicNavItem).iconName || group.items[itemIdx].iconName,
            description: item.description,
            dataSourceKey: item.dataSourceKey,
            formSchemaId: item.formSchemaId,
            isActive: item.isActive !== false
          };
        }
      }
    }

    onUpdateNavigationConfig(newConfig);
    setEditingItemModal({ isOpen: false, isNew: false, groupId: '', item: {} });
    showToast(isNew ? 'Menu baru berhasil dibuat' : 'Perubahan menu berhasil disimpan');
  };

  // Delete Menu Item
  const handleDeleteMenuItem = (groupId: string, itemId: string, parentItemId?: string) => {
    if (!window.confirm(`Hapus menu "${itemId}"? Tindakan ini tidak dapat dibatalkan.`)) return;

    const newConfig = JSON.parse(JSON.stringify(navigationConfig)) as NavGroupConfig[];
    const group = newConfig.find(g => g.id === groupId);
    if (!group) return;

    if (parentItemId) {
      const parent = group.items.find(i => i.id === parentItemId);
      if (parent && parent.subItems) {
        parent.subItems = parent.subItems.filter(s => s.id !== itemId);
      }
    } else {
      group.items = group.items.filter(i => i.id !== itemId);
    }

    onUpdateNavigationConfig(newConfig);
    showToast('Menu berhasil dihapus', 'info');
  };

  // Add / Edit Navigation Group Area
  const handleSaveGroup = () => {
    const { isNew, group } = editingGroupModal;
    if (!group.group?.trim()) {
      showToast('Nama area tidak boleh kosong', 'error');
      return;
    }

    const cleanGroupId = group.id?.trim() || `grp-${group.group.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString().slice(-4)}`;

    const newConfig = JSON.parse(JSON.stringify(navigationConfig)) as NavGroupConfig[];

    if (isNew) {
      newConfig.push({
        id: cleanGroupId,
        group: group.group,
        order: newConfig.length + 1,
        isCustom: true,
        items: []
      });
      setSelectedGroupId(cleanGroupId);
    } else {
      const gIdx = newConfig.findIndex(g => g.id === group.id);
      if (gIdx !== -1) {
        newConfig[gIdx].group = group.group;
      }
    }

    onUpdateNavigationConfig(newConfig);
    setEditingGroupModal({ isOpen: false, isNew: false, group: {} });
    showToast(isNew ? `Area "${group.group}" berhasil dibuat` : 'Area berhasil diperbarui');
  };

  // Delete Navigation Group Area
  const handleDeleteGroup = (groupId: string) => {
    const targetGroup = navigationConfig.find(g => g.id === groupId);
    if (!targetGroup) return;

    if (targetGroup.items.length > 0) {
      if (!window.confirm(`Area "${targetGroup.group}" masih memiliki ${targetGroup.items.length} menu. Hapus seluruh area beserta menu didalamnya?`)) {
        return;
      }
    } else {
      if (!window.confirm(`Hapus area "${targetGroup.group}"?`)) return;
    }

    const newConfig = navigationConfig.filter(g => g.id !== groupId);
    onUpdateNavigationConfig(newConfig);
    if (selectedGroupId === groupId && newConfig.length > 0) {
      setSelectedGroupId(newConfig[0].id);
    }
    showToast(`Area "${targetGroup.group}" berhasil dihapus`, 'info');
  };

  // Reset to default navigation
  const handleResetNavigation = () => {
    if (window.confirm('Kembalikan konfigurasi seluruh menu & area ke standar bawaan pabrik?')) {
      onUpdateNavigationConfig(DEFAULT_NAVIGATION_CONFIG);
      onUpdateFormSchemas(INITIAL_DYNAMIC_FORM_SCHEMAS);
      onUpdateCustomDatasets(INITIAL_CUSTOM_DATASETS);
      showToast('Konfigurasi menu & form telah direset ke default sistem', 'info');
    }
  };

  // Export config as JSON
  const handleExportConfig = () => {
    const payload = {
      version: '2026.1',
      exportedAt: new Date().toISOString(),
      companyName: companySettings?.companyName || 'SmartBudget',
      navigationConfig,
      dynamicFormSchemas,
      customDatasets
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(payload, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `erp-developer-config-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Konfigurasi Developer berhasil diexport');
  };

  // Import config from JSON
  const handleImportConfig = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], 'UTF-8');
      fileReader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (parsed.navigationConfig) {
            onUpdateNavigationConfig(parsed.navigationConfig);
          }
          if (parsed.dynamicFormSchemas) {
            onUpdateFormSchemas(parsed.dynamicFormSchemas);
          }
          if (parsed.customDatasets) {
            onUpdateCustomDatasets(parsed.customDatasets);
          }
          showToast('Konfigurasi Developer berhasil diimpor!');
        } catch (err) {
          showToast('Format JSON tidak valid', 'error');
        }
      };
    }
  };

  // =========================================================================
  // 2. FORM BUILDER STATE & ACTIONS
  // =========================================================================
  const [selectedSchemaId, setSelectedSchemaId] = useState<string>(dynamicFormSchemas[0]?.id || '');
  const selectedSchema = useMemo(() => {
    return dynamicFormSchemas.find(s => s.id === selectedSchemaId) || dynamicFormSchemas[0] || null;
  }, [dynamicFormSchemas, selectedSchemaId]);

  const [editingFieldModal, setEditingFieldModal] = useState<{
    isOpen: boolean;
    isNew: boolean;
    field: Partial<DynamicFormField>;
  }>({
    isOpen: false,
    isNew: false,
    field: {}
  });

  const [editingSchemaModal, setEditingSchemaModal] = useState<{
    isOpen: boolean;
    isNew: boolean;
    schema: Partial<DynamicFormSchema>;
  }>({
    isOpen: false,
    isNew: false,
    schema: {}
  });

  // Test form state in preview
  const [testFormData, setTestFormData] = useState<Record<string, any>>({});
  const [testFormSubmitted, setTestFormSubmitted] = useState<any | null>(null);

  // Add / Edit Form Schema
  const handleSaveSchema = () => {
    const { isNew, schema } = editingSchemaModal;
    if (!schema.name?.trim()) {
      showToast('Nama formulir wajib diisi', 'error');
      return;
    }

    const cleanId = schema.id?.trim() || `schema-${schema.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString().slice(-4)}`;
    const targetCollection = schema.targetCollectionKey?.trim() || `custom_${schema.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

    const newSchemas = [...dynamicFormSchemas];
    if (isNew) {
      const newSchemaObj: DynamicFormSchema = {
        id: cleanId,
        menuId: schema.menuId || '',
        name: schema.name,
        description: schema.description || '',
        targetCollectionKey: targetCollection,
        submitButtonText: schema.submitButtonText || 'Simpan Data',
        allowAdd: schema.allowAdd !== false,
        allowEdit: schema.allowEdit !== false,
        allowDelete: schema.allowDelete !== false,
        allowExport: schema.allowExport !== false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        fields: [
          { id: `f-${Date.now()}-1`, key: 'code', label: 'Kode / No. Dokumen', type: 'text', required: true, gridSpan: 2 },
          { id: `f-${Date.now()}-2`, key: 'title', label: 'Nama / Judul', type: 'text', required: true, gridSpan: 2 },
          { id: `f-${Date.now()}-3`, key: 'notes', label: 'Catatan Keterangan', type: 'textarea', gridSpan: 4 }
        ]
      };
      newSchemas.push(newSchemaObj);
      setSelectedSchemaId(cleanId);

      // Create dataset placeholder if not exists
      if (!customDatasets[targetCollection]) {
        onUpdateCustomDatasets({
          ...customDatasets,
          [targetCollection]: []
        });
      }
    } else {
      const sIdx = newSchemas.findIndex(s => s.id === schema.id);
      if (sIdx !== -1) {
        newSchemas[sIdx] = {
          ...newSchemas[sIdx],
          name: schema.name,
          menuId: schema.menuId || newSchemas[sIdx].menuId,
          description: schema.description,
          targetCollectionKey: targetCollection,
          submitButtonText: schema.submitButtonText || 'Simpan Data',
          allowAdd: schema.allowAdd !== false,
          allowEdit: schema.allowEdit !== false,
          allowDelete: schema.allowDelete !== false,
          allowExport: schema.allowExport !== false,
          updatedAt: new Date().toISOString()
        };
      }
    }

    onUpdateFormSchemas(newSchemas);
    setEditingSchemaModal({ isOpen: false, isNew: false, schema: {} });
    showToast(isNew ? 'Formulir baru berhasil dibuat' : 'Formulir berhasil diperbarui');
  };

  // Delete Form Schema
  const handleDeleteSchema = (schemaId: string) => {
    if (!window.confirm('Hapus skema formulir ini?')) return;
    const newSchemas = dynamicFormSchemas.filter(s => s.id !== schemaId);
    onUpdateFormSchemas(newSchemas);
    if (selectedSchemaId === schemaId && newSchemas.length > 0) {
      setSelectedSchemaId(newSchemas[0].id);
    }
    showToast('Skema formulir berhasil dihapus', 'info');
  };

  // Add / Edit Field in Schema
  const handleSaveField = () => {
    if (!selectedSchema) return;
    const { isNew, field } = editingFieldModal;
    if (!field.label?.trim() || !field.key?.trim()) {
      showToast('Label field dan Key database wajib diisi', 'error');
      return;
    }

    const cleanFieldId = field.id || `field-${Date.now()}`;
    const cleanKey = field.key.trim().replace(/[^a-zA-Z0-9_]/g, '');

    const newSchemas = [...dynamicFormSchemas];
    const sIdx = newSchemas.findIndex(s => s.id === selectedSchema.id);
    if (sIdx === -1) return;

    const schemaFields = [...newSchemas[sIdx].fields];

    if (isNew) {
      schemaFields.push({
        id: cleanFieldId,
        key: cleanKey,
        label: field.label,
        type: field.type || 'text',
        placeholder: field.placeholder || '',
        defaultValue: field.defaultValue,
        required: !!field.required,
        options: field.options || (field.type === 'select' ? ['Opsi 1', 'Opsi 2', 'Opsi 3'] : undefined),
        helpText: field.helpText || '',
        gridSpan: field.gridSpan || 2,
        customLookupDataset: field.customLookupDataset
      });
    } else {
      const fIdx = schemaFields.findIndex(f => f.id === field.id);
      if (fIdx !== -1) {
        schemaFields[fIdx] = {
          ...schemaFields[fIdx],
          key: cleanKey,
          label: field.label,
          type: field.type || schemaFields[fIdx].type,
          placeholder: field.placeholder,
          defaultValue: field.defaultValue,
          required: !!field.required,
          options: field.options,
          helpText: field.helpText,
          gridSpan: field.gridSpan || 2,
          customLookupDataset: field.customLookupDataset
        };
      }
    }

    newSchemas[sIdx].fields = schemaFields;
    newSchemas[sIdx].updatedAt = new Date().toISOString();
    onUpdateFormSchemas(newSchemas);
    setEditingFieldModal({ isOpen: false, isNew: false, field: {} });
    showToast(isNew ? `Field "${field.label}" ditambahkan` : `Field "${field.label}" diperbarui`);
  };

  // Delete field from schema
  const handleDeleteField = (fieldId: string) => {
    if (!selectedSchema) return;
    const newSchemas = [...dynamicFormSchemas];
    const sIdx = newSchemas.findIndex(s => s.id === selectedSchema.id);
    if (sIdx === -1) return;

    newSchemas[sIdx].fields = newSchemas[sIdx].fields.filter(f => f.id !== fieldId);
    newSchemas[sIdx].updatedAt = new Date().toISOString();
    onUpdateFormSchemas(newSchemas);
    showToast('Field berhasil dihapus', 'info');
  };

  // Reorder field up / down
  const handleMoveField = (fieldIndex: number, direction: 'up' | 'down') => {
    if (!selectedSchema) return;
    const newSchemas = [...dynamicFormSchemas];
    const sIdx = newSchemas.findIndex(s => s.id === selectedSchema.id);
    if (sIdx === -1) return;

    const targetIdx = direction === 'up' ? fieldIndex - 1 : fieldIndex + 1;
    if (targetIdx < 0 || targetIdx >= newSchemas[sIdx].fields.length) return;

    const fields = [...newSchemas[sIdx].fields];
    const temp = fields[fieldIndex];
    fields[fieldIndex] = fields[targetIdx];
    fields[targetIdx] = temp;

    newSchemas[sIdx].fields = fields;
    onUpdateFormSchemas(newSchemas);
  };

  // Test form submit handler
  const handleTestFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSchema) return;

    // Validate required fields
    for (const field of selectedSchema.fields) {
      if (field.required && !testFormData[field.key]) {
        showToast(`Field "${field.label}" wajib diisi!`, 'error');
        return;
      }
    }

    const newRecord: CustomDatasetRecord = {
      id: `rec-${Date.now().toString().slice(-6)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...testFormData
    };

    setTestFormSubmitted(newRecord);

    // Also auto-save to linked custom dataset!
    const targetColl = selectedSchema.targetCollectionKey;
    if (targetColl) {
      const existing = customDatasets[targetColl] || [];
      onUpdateCustomDatasets({
        ...customDatasets,
        [targetColl]: [newRecord, ...existing]
      });
      showToast(`Data uji berhasil disimpan ke dataset "${targetColl}"!`);
    } else {
      showToast('Formulir berhasil divalidasi!');
    }
  };

  // =========================================================================
  // 3. DATA INTEGRATOR & DATASET MANAGER
  // =========================================================================
  const [selectedDatasetKey, setSelectedDatasetKey] = useState<string>(
    Object.keys(customDatasets)[0] || 'custom_project_tasks'
  );
  const [datasetSearchTerm, setDatasetSearchTerm] = useState('');
  const [newDatasetModalOpen, setNewDatasetModalOpen] = useState(false);
  const [newDatasetName, setNewDatasetName] = useState('');

  // Active dataset records
  const activeDatasetRecords = useMemo(() => {
    const list = customDatasets[selectedDatasetKey] || [];
    if (!datasetSearchTerm.trim()) return list;
    return list.filter(item =>
      Object.values(item).some(val =>
        String(val).toLowerCase().includes(datasetSearchTerm.toLowerCase())
      )
    );
  }, [customDatasets, selectedDatasetKey, datasetSearchTerm]);

  // Create new Custom Dataset
  const handleCreateNewDataset = () => {
    if (!newDatasetName.trim()) {
      showToast('Nama dataset tidak boleh kosong', 'error');
      return;
    }
    const cleanKey = `custom_${newDatasetName.trim().toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    if (customDatasets[cleanKey]) {
      showToast('Dataset dengan nama tersebut sudah ada', 'error');
      return;
    }

    onUpdateCustomDatasets({
      ...customDatasets,
      [cleanKey]: []
    });

    setSelectedDatasetKey(cleanKey);
    setNewDatasetName('');
    setNewDatasetModalOpen(false);
    showToast(`Dataset "${cleanKey}" berhasil dibuat`);
  };

  // Delete custom dataset
  const handleDeleteCustomDataset = (key: string) => {
    if (!window.confirm(`Hapus seluruh dataset "${key}" dan semua recordnya?`)) return;
    const newDatasets = { ...customDatasets };
    delete newDatasets[key];
    onUpdateCustomDatasets(newDatasets);
    const remainingKeys = Object.keys(newDatasets);
    if (remainingKeys.length > 0) {
      setSelectedDatasetKey(remainingKeys[0]);
    }
    showToast(`Dataset "${key}" berhasil dihapus`, 'info');
  };

  // Delete a record from dataset
  const handleDeleteRecord = (recordId: string) => {
    if (!window.confirm('Hapus baris data ini?')) return;
    const currentList = customDatasets[selectedDatasetKey] || [];
    onUpdateCustomDatasets({
      ...customDatasets,
      [selectedDatasetKey]: currentList.filter(r => r.id !== recordId)
    });
    showToast('Baris data berhasil dihapus', 'info');
  };

  // Export dataset to CSV
  const handleExportDatasetCSV = () => {
    const records = customDatasets[selectedDatasetKey] || [];
    if (records.length === 0) {
      showToast('Dataset masih kosong', 'info');
      return;
    }

    const headers = Object.keys(records[0]);
    const csvRows = [
      headers.join(','),
      ...records.map(row =>
        headers.map(h => `"${String(row[h] || '').replace(/"/g, '""')}"`).join(',')
      )
    ];

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${selectedDatasetKey}-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    showToast('Dataset berhasil diexport ke CSV');
  };

  // =========================================================================
  // RENDER DYNAMIC FORM INPUT HELPER
  // =========================================================================
  const renderFormFieldInput = (
    field: DynamicFormField,
    value: any,
    onChange: (val: any) => void
  ) => {
    switch (field.type) {
      case 'text':
        return (
          <input
            type="text"
            id={`field-${field.id}`}
            value={value ?? ''}
            onChange={e => onChange(e.target.value)}
            placeholder={field.placeholder || `Masukkan ${field.label}`}
            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            required={field.required}
          />
        );

      case 'number':
        return (
          <input
            type="number"
            id={`field-${field.id}`}
            value={value ?? ''}
            onChange={e => onChange(Number(e.target.value))}
            placeholder={field.placeholder || '0'}
            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            required={field.required}
          />
        );

      case 'textarea':
        return (
          <textarea
            id={`field-${field.id}`}
            value={value ?? ''}
            onChange={e => onChange(e.target.value)}
            rows={3}
            placeholder={field.placeholder || `Masukkan ${field.label}`}
            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            required={field.required}
          />
        );

      case 'select':
        return (
          <select
            id={`field-${field.id}`}
            value={value ?? field.defaultValue ?? ''}
            onChange={e => onChange(e.target.value)}
            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            required={field.required}
          >
            <option value="">-- Pilih {field.label} --</option>
            {field.options?.map((opt, i) => (
              <option key={i} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        );

      case 'date':
        return (
          <input
            type="date"
            id={`field-${field.id}`}
            value={value ?? ''}
            onChange={e => onChange(e.target.value)}
            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            required={field.required}
          />
        );

      case 'time':
        return (
          <input
            type="time"
            id={`field-${field.id}`}
            value={value ?? ''}
            onChange={e => onChange(e.target.value)}
            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            required={field.required}
          />
        );

      case 'currency_idr':
        return (
          <div className="relative">
            <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">Rp</span>
            <input
              type="number"
              id={`field-${field.id}`}
              value={value ?? ''}
              onChange={e => onChange(Number(e.target.value))}
              placeholder="0"
              className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              required={field.required}
            />
          </div>
        );

      case 'currency_usd':
        return (
          <div className="relative">
            <span className="absolute left-3 top-2 text-xs font-bold text-emerald-400">$</span>
            <input
              type="number"
              id={`field-${field.id}`}
              step="0.01"
              value={value ?? ''}
              onChange={e => onChange(Number(e.target.value))}
              placeholder="0.00"
              className="w-full pl-8 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              required={field.required}
            />
          </div>
        );

      case 'switch':
      case 'checkbox':
        return (
          <label className="flex items-center gap-3 cursor-pointer py-1">
            <input
              type="checkbox"
              id={`field-${field.id}`}
              checked={!!value}
              onChange={e => onChange(e.target.checked)}
              className="w-4 h-4 text-indigo-600 bg-slate-900 border-slate-700 rounded-sm focus:ring-indigo-500"
            />
            <span className="text-xs text-slate-300">
              {value ? 'Aktif / Ya (True)' : 'Nonaktif / Tidak (False)'}
            </span>
          </label>
        );

      case 'lookup_dept':
        return (
          <select
            id={`field-${field.id}`}
            value={value ?? ''}
            onChange={e => onChange(e.target.value)}
            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            required={field.required}
          >
            <option value="">-- Pilih Departemen --</option>
            {departments.map(d => (
              <option key={d.code} value={d.code}>
                {d.code} - {d.name}
              </option>
            ))}
          </select>
        );

      case 'lookup_supplier':
        return (
          <select
            id={`field-${field.id}`}
            value={value ?? ''}
            onChange={e => onChange(e.target.value)}
            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            required={field.required}
          >
            <option value="">-- Pilih Supplier --</option>
            {suppliers.map(s => (
              <option key={s.id} value={s.id}>
                {s.code} - {s.name}
              </option>
            ))}
          </select>
        );

      case 'lookup_customer':
        return (
          <select
            id={`field-${field.id}`}
            value={value ?? ''}
            onChange={e => onChange(e.target.value)}
            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            required={field.required}
          >
            <option value="">-- Pilih Customer --</option>
            {customers.map(c => (
              <option key={c.id} value={c.id}>
                {c.code} - {c.name}
              </option>
            ))}
          </select>
        );

      case 'lookup_coa':
        return (
          <select
            id={`field-${field.id}`}
            value={value ?? ''}
            onChange={e => onChange(e.target.value)}
            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            required={field.required}
          >
            <option value="">-- Pilih Akun COA --</option>
            {coaList.map(c => (
              <option key={c.code} value={c.code}>
                {c.code} - {c.name}
              </option>
            ))}
          </select>
        );

      case 'lookup_stock':
        return (
          <select
            id={`field-${field.id}`}
            value={value ?? ''}
            onChange={e => onChange(e.target.value)}
            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            required={field.required}
          >
            <option value="">-- Pilih Item Part / Stock --</option>
            {itemStocks.map(i => (
              <option key={i.id} value={i.id}>
                {i.itemCode} - {i.itemName} ({i.partNo})
              </option>
            ))}
          </select>
        );

      case 'lookup_process':
        return (
          <select
            id={`field-${field.id}`}
            value={value ?? ''}
            onChange={e => onChange(e.target.value)}
            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            required={field.required}
          >
            <option value="">-- Pilih Proses Produksi --</option>
            {productionProcesses.map(p => (
              <option key={p.code} value={p.code}>
                {p.code} - {p.name} ({p.type})
              </option>
            ))}
          </select>
        );

      default:
        return (
          <input
            type="text"
            id={`field-${field.id}`}
            value={value ?? ''}
            onChange={e => onChange(e.target.value)}
            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
          />
        );
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 text-sm font-medium border transition-all animate-bounce ${
            toastMessage.type === 'success'
              ? 'bg-emerald-950/90 text-emerald-200 border-emerald-500/50'
              : toastMessage.type === 'error'
              ? 'bg-rose-950/90 text-rose-200 border-rose-500/50'
              : 'bg-indigo-950/90 text-indigo-200 border-indigo-500/50'
          }`}
        >
          {toastMessage.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
          {toastMessage.type === 'error' && <AlertTriangle className="w-5 h-5 text-rose-400" />}
          {toastMessage.type === 'info' && <Sparkles className="w-5 h-5 text-indigo-400" />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-900/40 p-5 sm:p-6 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
              <Code2 className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Developer Studio
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Area Sistem
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Visual Menu Drag & Drop Builder, Dynamic Form Generator, & Data Source Integrator
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportConfig}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition shadow-xs cursor-pointer"
            title="Export Konfigurasi JSON"
          >
            <Download className="w-3.5 h-3.5" />
            Export JSON
          </button>

          <label className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition shadow-xs cursor-pointer">
            <Upload className="w-3.5 h-3.5" />
            Import JSON
            <input type="file" accept=".json" onChange={handleImportConfig} className="hidden" />
          </label>

          <button
            onClick={handleResetNavigation}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-rose-900/40 hover:bg-rose-900/70 text-rose-200 text-xs font-semibold border border-rose-700/50 transition shadow-xs cursor-pointer"
            title="Reset ke Default Bawaan"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reset Default
          </button>
        </div>
      </div>

      {/* Main Studio Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveStudioTab('menu-builder')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition shrink-0 cursor-pointer ${
            activeStudioTab === 'menu-builder'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <GripVertical className="w-4 h-4 text-amber-300" />
          1. Drag & Drop Menu Builder
        </button>

        <button
          onClick={() => setActiveStudioTab('form-builder')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition shrink-0 cursor-pointer ${
            activeStudioTab === 'form-builder'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <FileCode className="w-4 h-4 text-emerald-300" />
          2. Form Generator & Schema Designer
        </button>

        <button
          onClick={() => setActiveStudioTab('data-integrator')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition shrink-0 cursor-pointer ${
            activeStudioTab === 'data-integrator'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Database className="w-4 h-4 text-cyan-300" />
          3. Data Source Integrator
        </button>

        <button
          onClick={() => setActiveStudioTab('preview-page')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition shrink-0 cursor-pointer ${
            activeStudioTab === 'preview-page'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Eye className="w-4 h-4 text-violet-300" />
          4. Live Preview / Sandbox
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: DRAG & DROP MENU BUILDER */}
      {/* ========================================================================= */}
      {activeStudioTab === 'menu-builder' && (
        <div className="space-y-6">
          {/* Top Control Bar */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {/* Area / Group Selection */}
            <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <FolderTree className="w-3.5 h-3.5 text-indigo-400" />
                  Area Navigasi
                </span>
                <button
                  onClick={() => setEditingGroupModal({ isOpen: true, isNew: true, group: {} })}
                  className="p-1 text-indigo-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
                  title="Tambah Area Baru"
                >
                  <FolderPlus className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-1.5">
                {navigationConfig.map((grp) => (
                  <div
                    key={grp.id}
                    onClick={() => setSelectedGroupId(grp.id)}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                      selectedGroupId === grp.id
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/80 bg-slate-950/40'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="truncate">{grp.group}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                        selectedGroupId === grp.id ? 'bg-indigo-700 text-indigo-100' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {grp.items.length} menu
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingGroupModal({ isOpen: true, isNew: false, group: grp });
                        }}
                        className="p-1 text-slate-300 hover:text-white rounded-sm hover:bg-slate-700/50"
                        title="Edit Nama Area"
                      >
                        <Edit3 className="w-3 h-3" />
                      </button>
                      {grp.isCustom && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteGroup(grp.id);
                          }}
                          className="p-1 text-rose-300 hover:text-rose-100 rounded-sm hover:bg-rose-900/50"
                          title="Hapus Area"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Menu List within Selected Group */}
            <div className="lg:col-span-3 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Layers className="w-4 h-4 text-indigo-400" />
                    Daftar Menu & Submenu: <span className="text-indigo-400 font-extrabold">{navigationConfig.find(g => g.id === selectedGroupId)?.group}</span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Tarik dan lepas (Drag & Drop) untuk mengatur urutan menu, atau gunakan tombol kontrol di setiap item.
                  </p>
                </div>

                <button
                  onClick={() =>
                    setEditingItemModal({
                      isOpen: true,
                      isNew: true,
                      groupId: selectedGroupId,
                      item: { iconName: 'Layers', isActive: true }
                    })
                  }
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Tambah Menu Baru
                </button>
              </div>

              {/* Items List with Drag & Drop */}
              {(() => {
                const currentGroup = navigationConfig.find(g => g.id === selectedGroupId);
                if (!currentGroup || currentGroup.items.length === 0) {
                  return (
                    <div className="py-12 text-center text-slate-500 bg-slate-950/40 rounded-xl border border-dashed border-slate-800">
                      <Layers className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                      <p className="text-xs">Belum ada menu di area ini.</p>
                      <button
                        onClick={() =>
                          setEditingItemModal({
                            isOpen: true,
                            isNew: true,
                            groupId: selectedGroupId,
                            item: { iconName: 'Layers', isActive: true }
                          })
                        }
                        className="mt-3 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold"
                      >
                        + Tambah Menu Pertama
                      </button>
                    </div>
                  );
                }

                return (
                  <div className="space-y-3">
                    {currentGroup.items.map((item, itemIdx) => {
                      const isDragOver = dragOverTarget === `item-${item.id}`;

                      return (
                        <div
                          key={item.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, currentGroup.id, itemIdx)}
                          onDragOver={(e) => handleDragOver(e, `item-${item.id}`)}
                          onDrop={() => handleDropItem(currentGroup.id, itemIdx)}
                          className={`bg-slate-950/60 border rounded-xl p-3.5 transition-all ${
                            isDragOver
                              ? 'border-indigo-500 bg-indigo-950/30 scale-[1.01]'
                              : 'border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          {/* Top Level Item Header */}
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="cursor-grab active:cursor-grabbing text-slate-500 hover:text-indigo-400">
                                <GripVertical className="w-4 h-4" />
                              </div>

                              <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-indigo-400 shrink-0">
                                {getDynamicIcon(item.iconName, 'w-4 h-4')}
                              </div>

                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold text-white truncate">{item.label}</span>
                                  <span className="text-[10px] font-mono px-1.5 py-0.2 bg-slate-800 text-slate-400 rounded-sm">
                                    ID: {item.id}
                                  </span>
                                  {item.dataSourceKey && (
                                    <span className="text-[10px] px-1.5 py-0.2 bg-cyan-950/60 text-cyan-300 border border-cyan-800/50 rounded-sm">
                                      Data: {item.dataSourceKey}
                                    </span>
                                  )}
                                  {item.isCustom && (
                                    <span className="text-[9px] px-1 bg-amber-950 text-amber-300 border border-amber-800 rounded-xs font-bold">
                                      Custom
                                    </span>
                                  )}
                                </div>
                                {item.description && (
                                  <p className="text-[11px] text-slate-400 truncate mt-0.5">{item.description}</p>
                                )}
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={() => handleMoveItem(currentGroup.id, itemIdx, 'up')}
                                disabled={itemIdx === 0}
                                className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30 rounded-lg hover:bg-slate-800"
                                title="Pindah Ke Atas"
                              >
                                <ArrowUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleMoveItem(currentGroup.id, itemIdx, 'down')}
                                disabled={itemIdx === currentGroup.items.length - 1}
                                className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30 rounded-lg hover:bg-slate-800"
                                title="Pindah Ke Bawah"
                              >
                                <ArrowDown className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() =>
                                  setEditingItemModal({
                                    isOpen: true,
                                    isNew: true,
                                    groupId: currentGroup.id,
                                    parentItemId: item.id,
                                    item: { isActive: true }
                                  })
                                }
                                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-indigo-300 text-[11px] font-semibold rounded-lg flex items-center gap-1"
                                title="Tambah Submenu di bawah menu ini"
                              >
                                <Plus className="w-3 h-3" />
                                + Submenu
                              </button>

                              <button
                                onClick={() =>
                                  setEditingItemModal({
                                    isOpen: true,
                                    isNew: false,
                                    groupId: currentGroup.id,
                                    item: { ...item }
                                  })
                                }
                                className="p-1.5 text-slate-300 hover:text-indigo-400 rounded-lg hover:bg-slate-800"
                                title="Edit Menu"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => handleDeleteMenuItem(currentGroup.id, item.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800"
                                title="Hapus Menu"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Submenu List */}
                          {item.subItems && item.subItems.length > 0 && (
                            <div className="mt-3 pl-8 pr-2 py-2 border-l-2 border-indigo-900/50 space-y-2 ml-4">
                              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                                <CornerDownRight className="w-3 h-3 text-indigo-400" />
                                Submenu ({item.subItems.length})
                              </div>

                              {item.subItems.map((sub, subIdx) => {
                                const isSubDragOver = dragOverTarget === `sub-${sub.id}`;

                                return (
                                  <div
                                    key={sub.id}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, currentGroup.id, itemIdx, item.id, subIdx)}
                                    onDragOver={(e) => handleDragOver(e, `sub-${sub.id}`)}
                                    onDrop={() => handleDropSubItem(currentGroup.id, item.id, subIdx)}
                                    className={`flex items-center justify-between p-2 rounded-lg bg-slate-900 border text-xs transition ${
                                      isSubDragOver
                                        ? 'border-indigo-400 bg-indigo-950/40'
                                        : 'border-slate-800 hover:border-slate-700'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2 min-w-0">
                                      <div className="cursor-grab text-slate-600 hover:text-indigo-400">
                                        <GripVertical className="w-3 h-3" />
                                      </div>
                                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                                      <span className="font-semibold text-slate-200 truncate">{sub.label}</span>
                                      <span className="text-[9px] font-mono text-slate-500">({sub.id})</span>
                                      {sub.dataSourceKey && (
                                        <span className="text-[9px] px-1 py-0.2 bg-slate-800 text-cyan-300 rounded-sm">
                                          {sub.dataSourceKey}
                                        </span>
                                      )}
                                    </div>

                                    <div className="flex items-center gap-1 shrink-0">
                                      <button
                                        onClick={() => handleMoveSubItem(currentGroup.id, item.id, subIdx, 'up')}
                                        disabled={subIdx === 0}
                                        className="p-1 text-slate-500 hover:text-white disabled:opacity-30"
                                      >
                                        <ArrowUp className="w-3 h-3" />
                                      </button>
                                      <button
                                        onClick={() => handleMoveSubItem(currentGroup.id, item.id, subIdx, 'down')}
                                        disabled={subIdx === item.subItems!.length - 1}
                                        className="p-1 text-slate-500 hover:text-white disabled:opacity-30"
                                      >
                                        <ArrowDown className="w-3 h-3" />
                                      </button>
                                      <button
                                        onClick={() =>
                                          setEditingItemModal({
                                            isOpen: true,
                                            isNew: false,
                                            groupId: currentGroup.id,
                                            parentItemId: item.id,
                                            item: { ...sub }
                                          })
                                        }
                                        className="p-1 text-slate-400 hover:text-indigo-400"
                                      >
                                        <Edit3 className="w-3 h-3" />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteMenuItem(currentGroup.id, sub.id, item.id)}
                                        className="p-1 text-slate-500 hover:text-rose-400"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: FORM BUILDER & SCHEMA DESIGNER */}
      {/* ========================================================================= */}
      {activeStudioTab === 'form-builder' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form Schemas Sidebar */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <FileCode className="w-3.5 h-3.5 text-emerald-400" />
                  Daftar Formulir Dinamis
                </span>
                <button
                  onClick={() =>
                    setEditingSchemaModal({
                      isOpen: true,
                      isNew: true,
                      schema: {
                        submitButtonText: 'Simpan Data',
                        allowAdd: true,
                        allowEdit: true,
                        allowDelete: true,
                        allowExport: true
                      }
                    })
                  }
                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  Buat Form
                </button>
              </div>

              <div className="space-y-2">
                {dynamicFormSchemas.map(schema => (
                  <div
                    key={schema.id}
                    onClick={() => setSelectedSchemaId(schema.id)}
                    className={`p-3 rounded-xl border text-xs transition cursor-pointer ${
                      selectedSchemaId === schema.id
                        ? 'bg-emerald-950/40 border-emerald-500 text-white shadow-md'
                        : 'bg-slate-950/40 border-slate-800 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-sm truncate">{schema.name}</span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingSchemaModal({ isOpen: true, isNew: false, schema });
                          }}
                          className="p-1 text-slate-400 hover:text-white"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteSchema(schema.id);
                          }}
                          className="p-1 text-slate-400 hover:text-rose-400"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <div className="text-[11px] text-slate-400 truncate">{schema.description || 'Tidak ada deskripsi'}</div>
                    <div className="flex items-center gap-2 mt-2 text-[10px]">
                      <span className="px-1.5 py-0.5 bg-slate-800 text-emerald-300 rounded-sm font-mono">
                        {schema.fields.length} fields
                      </span>
                      <span className="px-1.5 py-0.5 bg-slate-800 text-cyan-300 rounded-sm font-mono">
                        Table: {schema.targetCollectionKey}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Schema Fields Editor & Live Preview */}
            <div className="lg:col-span-2 space-y-6">
              {selectedSchema ? (
                <>
                  {/* Fields Config Table */}
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                      <div>
                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                          <Sliders className="w-4 h-4 text-emerald-400" />
                          Desain Field Form: <span className="text-emerald-400">{selectedSchema.name}</span>
                        </h3>
                        <p className="text-[11px] text-slate-400">
                          Target Koleksi: <span className="font-mono text-cyan-300">{selectedSchema.targetCollectionKey}</span>
                        </p>
                      </div>

                      <button
                        onClick={() =>
                          setEditingFieldModal({
                            isOpen: true,
                            isNew: true,
                            field: { type: 'text', gridSpan: 2, required: true }
                          })
                        }
                        className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Tambah Field Input
                      </button>
                    </div>

                    <div className="space-y-2">
                      {selectedSchema.fields.map((field, fIdx) => (
                        <div
                          key={field.id}
                          className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 text-xs gap-3"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="text-slate-500 font-mono text-[10px] w-4">{fIdx + 1}.</div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-white truncate">{field.label}</span>
                                <span className="text-[10px] font-mono px-1.5 py-0.2 bg-slate-800 text-indigo-300 rounded-sm">
                                  key: {field.key}
                                </span>
                                <span className="text-[10px] px-1.5 py-0.2 bg-emerald-950 text-emerald-300 border border-emerald-800 rounded-sm">
                                  {field.type}
                                </span>
                                {field.required && (
                                  <span className="text-[9px] px-1 bg-rose-950 text-rose-300 border border-rose-800 rounded-xs">
                                    Wajib
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-500 mt-0.5">
                                Lebar: {field.gridSpan === 4 ? 'Full (4 Kolom)' : `${field.gridSpan || 2} Kolom`}
                                {field.helpText ? ` • Hint: ${field.helpText}` : ''}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => handleMoveField(fIdx, 'up')}
                              disabled={fIdx === 0}
                              className="p-1 text-slate-400 hover:text-white disabled:opacity-20"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleMoveField(fIdx, 'down')}
                              disabled={fIdx === selectedSchema.fields.length - 1}
                              className="p-1 text-slate-400 hover:text-white disabled:opacity-20"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() =>
                                setEditingFieldModal({
                                  isOpen: true,
                                  isNew: false,
                                  field: { ...field }
                                })
                              }
                              className="p-1 text-slate-300 hover:text-emerald-400"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteField(field.id)}
                              className="p-1 text-slate-400 hover:text-rose-400"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Interactive Form Test & Simulator */}
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                      <div>
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                          <Eye className="w-3.5 h-3.5 text-emerald-400" />
                          Pratinjau Interaktif Form (Live Simulator)
                        </h4>
                        <p className="text-[11px] text-slate-400">
                          Uji coba pengisian form secara langsung. Data yang disimpan akan langsung masuk ke dataset terintegrasi.
                        </p>
                      </div>
                    </div>

                    <form onSubmit={handleTestFormSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {selectedSchema.fields.map(field => {
                          const colSpanClass =
                            field.gridSpan === 4
                              ? 'sm:col-span-2 lg:col-span-4'
                              : field.gridSpan === 3
                              ? 'sm:col-span-2 lg:col-span-3'
                              : field.gridSpan === 1
                              ? 'col-span-1'
                              : 'sm:col-span-2 lg:col-span-2';

                          return (
                            <div key={field.id} className={colSpanClass}>
                              <label className="block text-xs font-semibold text-slate-300 mb-1">
                                {field.label} {field.required && <span className="text-rose-400">*</span>}
                              </label>
                              {renderFormFieldInput(
                                field,
                                testFormData[field.key],
                                (val) => setTestFormData(prev => ({ ...prev, [field.key]: val }))
                              )}
                              {field.helpText && (
                                <p className="text-[10px] text-slate-500 mt-1">{field.helpText}</p>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                        <button
                          type="button"
                          onClick={() => {
                            setTestFormData({});
                            setTestFormSubmitted(null);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                        >
                          Bersihkan Form
                        </button>

                        <button
                          type="submit"
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md cursor-pointer"
                        >
                          <Save className="w-3.5 h-3.5" />
                          {selectedSchema.submitButtonText || 'Simpan Data'}
                        </button>
                      </div>
                    </form>

                    {/* Result Inspection */}
                    {testFormSubmitted && (
                      <div className="mt-4 p-4 rounded-xl bg-slate-950 border border-emerald-800/60 text-xs space-y-2">
                        <div className="flex items-center justify-between text-emerald-400 font-bold">
                          <span className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4" />
                            Data Terkirim & Tersimpan di Koleksi "{selectedSchema.targetCollectionKey}"
                          </span>
                          <span className="font-mono text-[10px] text-slate-400">ID: {testFormSubmitted.id}</span>
                        </div>
                        <pre className="p-2.5 rounded-lg bg-slate-900 font-mono text-[11px] text-slate-300 overflow-x-auto">
                          {JSON.stringify(testFormSubmitted, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="p-12 text-center text-slate-500 bg-slate-900 rounded-2xl border border-slate-800">
                  <FileCode className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                  <p className="text-xs">Pilih atau buat formulir di panel kiri.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: DATA SOURCE INTEGRATOR */}
      {/* ========================================================================= */}
      {activeStudioTab === 'data-integrator' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Datasets List */}
            <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-cyan-400" />
                  Dataset Kustom & ERP
                </span>
                <button
                  onClick={() => setNewDatasetModalOpen(true)}
                  className="px-2 py-1 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-lg flex items-center gap-1 cursor-pointer"
                  title="Tambah Dataset Tabel Baru"
                >
                  <Plus className="w-3 h-3" />
                  Dataset
                </button>
              </div>

              <div className="space-y-1.5">
                <div className="text-[10px] font-bold text-slate-500 uppercase px-1">Koleksi Dinamis (Kustom)</div>
                {Object.keys(customDatasets).map(key => (
                  <div
                    key={key}
                    onClick={() => setSelectedDatasetKey(key)}
                    className={`flex items-center justify-between p-2.5 rounded-xl text-xs transition cursor-pointer ${
                      selectedDatasetKey === key
                        ? 'bg-cyan-950/60 border border-cyan-500 text-white font-semibold shadow-xs'
                        : 'bg-slate-950/40 border border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="truncate min-w-0">
                      <span className="font-mono text-cyan-300 block truncate">{key}</span>
                      <span className="text-[10px] text-slate-400">{customDatasets[key]?.length || 0} baris data</span>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCustomDataset(key);
                      }}
                      className="p-1 text-slate-500 hover:text-rose-400"
                      title="Hapus Dataset"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}

                <div className="text-[10px] font-bold text-slate-500 uppercase px-1 pt-3">Koleksi Standar ERP</div>
                <div className="text-[11px] text-slate-400 space-y-1 pl-1">
                  <div className="p-1.5 rounded-md bg-slate-950/30 text-slate-400">• coa ({coaList.length} akun)</div>
                  <div className="p-1.5 rounded-md bg-slate-950/30 text-slate-400">• departments ({departments.length} dept)</div>
                  <div className="p-1.5 rounded-md bg-slate-950/30 text-slate-400">• itemStocks ({itemStocks.length} part)</div>
                  <div className="p-1.5 rounded-md bg-slate-950/30 text-slate-400">• suppliers ({suppliers.length} vendor)</div>
                  <div className="p-1.5 rounded-md bg-slate-950/30 text-slate-400">• customers ({customers.length} client)</div>
                </div>
              </div>
            </div>

            {/* Data Grid Table Viewer */}
            <div className="lg:col-span-3 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Table className="w-4 h-4 text-cyan-400" />
                    Data Grid: <span className="font-mono text-cyan-400">{selectedDatasetKey}</span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Total {activeDatasetRecords.length} baris data tercatat
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      placeholder="Cari data..."
                      value={datasetSearchTerm}
                      onChange={e => setDatasetSearchTerm(e.target.value)}
                      className="pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-hidden"
                    />
                  </div>

                  <button
                    onClick={handleExportDatasetCSV}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    CSV
                  </button>
                </div>
              </div>

              {/* Data Table */}
              {activeDatasetRecords.length === 0 ? (
                <div className="py-12 text-center text-slate-500 bg-slate-950/40 rounded-xl border border-dashed border-slate-800">
                  <Database className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                  <p className="text-xs">Belum ada data dalam koleksi "{selectedDatasetKey}".</p>
                  <p className="text-[11px] text-slate-600 mt-1">Gunakan Form Builder untuk mengisi data ke koleksi ini.</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-800">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-950 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="p-3">#</th>
                        {Object.keys(activeDatasetRecords[0]).map(k => (
                          <th key={k} className="p-3 font-mono">{k}</th>
                        ))}
                        <th className="p-3 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 bg-slate-900/60">
                      {activeDatasetRecords.map((row, idx) => (
                        <tr key={row.id || idx} className="hover:bg-slate-800/50 transition">
                          <td className="p-3 text-slate-500 font-mono text-[10px]">{idx + 1}</td>
                          {Object.keys(activeDatasetRecords[0]).map(k => (
                            <td key={k} className="p-3 text-slate-200 truncate max-w-xs">
                              {typeof row[k] === 'boolean' ? (
                                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${row[k] ? 'bg-emerald-950 text-emerald-300' : 'bg-slate-800 text-slate-400'}`}>
                                  {row[k] ? 'TRUE' : 'FALSE'}
                                </span>
                              ) : typeof row[k] === 'number' && k.toLowerCase().includes('idr') ? (
                                `Rp ${row[k].toLocaleString('id-ID')}`
                              ) : (
                                String(row[k] ?? '-')
                              )}
                            </td>
                          ))}
                          <td className="p-3 text-right">
                            <button
                              onClick={() => handleDeleteRecord(row.id)}
                              className="p-1 text-slate-400 hover:text-rose-400 rounded-sm hover:bg-slate-800"
                              title="Hapus baris ini"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: LIVE PREVIEW / SANDBOX */}
      {/* ========================================================================= */}
      {activeStudioTab === 'preview-page' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-300" />
                Live Architecture & Navigation Tree Overview
              </h3>
              <p className="text-xs text-slate-400">
                Pratinjau seluruh struktur area, menu, dan submenu aktif yang tampil pada Sidebar ERP.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {navigationConfig.map(grp => (
              <div key={grp.id} className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">{grp.group}</span>
                  <span className="text-[10px] text-slate-500 font-mono">{grp.items.length} item</span>
                </div>

                <div className="space-y-1.5">
                  {grp.items.map(item => (
                    <div key={item.id} className="text-xs">
                      <div className="flex items-center gap-2 p-1.5 rounded-lg bg-slate-900 font-medium text-slate-200">
                        {getDynamicIcon(item.iconName, 'w-3.5 h-3.5 text-indigo-400')}
                        <span className="truncate">{item.label}</span>
                      </div>

                      {item.subItems && item.subItems.length > 0 && (
                        <div className="pl-4 py-1 space-y-1 border-l border-slate-800 ml-3">
                          {item.subItems.map(sub => (
                            <div key={sub.id} className="text-[11px] text-slate-400 flex items-center gap-1.5 truncate">
                              <span className="w-1 h-1 rounded-full bg-slate-600" />
                              <span className="truncate">{sub.label}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD / EDIT MENU ITEM */}
      {/* ========================================================================= */}
      {editingItemModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-400" />
                {editingItemModal.isNew
                  ? editingItemModal.parentItemId
                    ? 'Tambah Submenu Baru'
                    : 'Tambah Menu Baru'
                  : 'Edit Konfigurasi Menu'}
              </h3>
              <button
                onClick={() => setEditingItemModal({ isOpen: false, isNew: false, groupId: '', item: {} })}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Nama / Label Menu <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={editingItemModal.item.label || ''}
                  onChange={e =>
                    setEditingItemModal(prev => ({
                      ...prev,
                      item: { ...prev.item, label: e.target.value }
                    }))
                  }
                  placeholder="Contoh: Quality Inspection / Project Task"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  ID Unik / Tab Route
                </label>
                <input
                  type="text"
                  value={editingItemModal.item.id || ''}
                  onChange={e =>
                    setEditingItemModal(prev => ({
                      ...prev,
                      item: { ...prev.item, id: e.target.value }
                    }))
                  }
                  placeholder="Otomatis jika dikosongkan (contoh: custom-quality)"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              {!editingItemModal.parentItemId && (
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Icon Visual</label>
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center text-indigo-400 border border-slate-700">
                      {getDynamicIcon((editingItemModal.item as DynamicNavItem).iconName, 'w-5 h-5')}
                    </div>
                    <button
                      type="button"
                      onClick={() => setIconPickerOpen(!iconPickerOpen)}
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold cursor-pointer"
                    >
                      Pilih Icon ({(editingItemModal.item as DynamicNavItem).iconName || 'Pilih'})
                    </button>
                  </div>

                  {iconPickerOpen && (
                    <div className="mt-2 p-3 bg-slate-950 border border-slate-700 rounded-xl space-y-2 max-h-48 overflow-y-auto">
                      <input
                        type="text"
                        placeholder="Cari icon (Code, Table, Box, Database...)"
                        value={iconSearchTerm}
                        onChange={e => setIconSearchTerm(e.target.value)}
                        className="w-full px-2.5 py-1 bg-slate-900 border border-slate-700 rounded-lg text-[11px] text-white focus:outline-hidden"
                      />
                      <div className="grid grid-cols-6 gap-1.5 pt-1">
                        {filteredIcons.map(name => (
                          <button
                            key={name}
                            type="button"
                            onClick={() => {
                              setEditingItemModal(prev => ({
                                ...prev,
                                item: { ...prev.item, iconName: name }
                              }));
                              setIconPickerOpen(false);
                            }}
                            className="p-2 rounded-lg bg-slate-900 hover:bg-indigo-600 text-slate-300 hover:text-white flex flex-col items-center justify-center gap-1 transition"
                            title={name}
                          >
                            {getDynamicIcon(name, 'w-4 h-4')}
                            <span className="text-[8px] truncate max-w-full">{name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Sumber Data Terintegrasi (Data Source)
                </label>
                <select
                  value={editingItemModal.item.dataSourceKey || ''}
                  onChange={e =>
                    setEditingItemModal(prev => ({
                      ...prev,
                      item: { ...prev.item, dataSourceKey: e.target.value }
                    }))
                  }
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                >
                  <option value="">-- Tanpa Binding / Standar Submenu --</option>
                  {availableDataSources.map(src => (
                    <option key={src.key} value={src.key}>
                      [{src.category}] {src.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Tautkan Formulir Dinamis (Form Builder Schema)
                </label>
                <select
                  value={editingItemModal.item.formSchemaId || ''}
                  onChange={e =>
                    setEditingItemModal(prev => ({
                      ...prev,
                      item: { ...prev.item, formSchemaId: e.target.value }
                    }))
                  }
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                >
                  <option value="">-- Tanpa Form Khusus --</option>
                  {dynamicFormSchemas.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.targetCollectionKey})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Deskripsi Singkat</label>
                <textarea
                  rows={2}
                  value={editingItemModal.item.description || ''}
                  onChange={e =>
                    setEditingItemModal(prev => ({
                      ...prev,
                      item: { ...prev.item, description: e.target.value }
                    }))
                  }
                  placeholder="Fungsi dan tujuan menu ini..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEditingItemModal({ isOpen: false, isNew: false, groupId: '', item: {} })}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveMenuItem}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md cursor-pointer"
              >
                Simpan Menu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD / EDIT NAVIGATION GROUP */}
      {/* ========================================================================= */}
      {editingGroupModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FolderPlus className="w-4 h-4 text-indigo-400" />
                {editingGroupModal.isNew ? 'Tambah Area Navigasi Baru' : 'Edit Nama Area Navigasi'}
              </h3>
              <button
                onClick={() => setEditingGroupModal({ isOpen: false, isNew: false, group: {} })}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Nama Area Navigasi <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={editingGroupModal.group.group || ''}
                  onChange={e =>
                    setEditingGroupModal(prev => ({
                      ...prev,
                      group: { ...prev.group, group: e.target.value }
                    }))
                  }
                  placeholder="Contoh: Sistem, Operasional, HRD & GA"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEditingGroupModal({ isOpen: false, isNew: false, group: {} })}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveGroup}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold"
              >
                Simpan Area
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD / EDIT FORM SCHEMA */}
      {/* ========================================================================= */}
      {editingSchemaModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileCode className="w-4 h-4 text-emerald-400" />
                {editingSchemaModal.isNew ? 'Buat Skema Formulir Baru' : 'Edit Skema Formulir'}
              </h3>
              <button
                onClick={() => setEditingSchemaModal({ isOpen: false, isNew: false, schema: {} })}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Nama Formulir <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={editingSchemaModal.schema.name || ''}
                  onChange={e =>
                    setEditingSchemaModal(prev => ({
                      ...prev,
                      schema: { ...prev.schema, name: e.target.value }
                    }))
                  }
                  placeholder="Contoh: Form Audit QC Harian"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Target Koleksi Database (Dataset Key)
                </label>
                <input
                  type="text"
                  value={editingSchemaModal.schema.targetCollectionKey || ''}
                  onChange={e =>
                    setEditingSchemaModal(prev => ({
                      ...prev,
                      schema: { ...prev.schema, targetCollectionKey: e.target.value }
                    }))
                  }
                  placeholder="Otomatis (contoh: custom_qc_daily_audit)"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Teks Tombol Submit</label>
                <input
                  type="text"
                  value={editingSchemaModal.schema.submitButtonText || 'Simpan Data'}
                  onChange={e =>
                    setEditingSchemaModal(prev => ({
                      ...prev,
                      schema: { ...prev.schema, submitButtonText: e.target.value }
                    }))
                  }
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Deskripsi Formulir</label>
                <textarea
                  rows={2}
                  value={editingSchemaModal.schema.description || ''}
                  onChange={e =>
                    setEditingSchemaModal(prev => ({
                      ...prev,
                      schema: { ...prev.schema, description: e.target.value }
                    }))
                  }
                  placeholder="Penjelasan penggunaan formulir ini..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEditingSchemaModal({ isOpen: false, isNew: false, schema: {} })}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveSchema}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
              >
                Simpan Skema
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD / EDIT FORM FIELD */}
      {/* ========================================================================= */}
      {editingFieldModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-emerald-400" />
                {editingFieldModal.isNew ? 'Tambah Field Input Baru' : 'Edit Konfigurasi Field'}
              </h3>
              <button
                onClick={() => setEditingFieldModal({ isOpen: false, isNew: false, field: {} })}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Label Field <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={editingFieldModal.field.label || ''}
                  onChange={e => {
                    const labelVal = e.target.value;
                    const autoKey = labelVal.toLowerCase().replace(/[^a-z0-9]/g, '');
                    setEditingFieldModal(prev => ({
                      ...prev,
                      field: {
                        ...prev.field,
                        label: labelVal,
                        key: prev.isNew ? autoKey : prev.field.key
                      }
                    }));
                  }}
                  placeholder="Contoh: Tanggal Pemeriksaan / No. Serial"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Key Database (Nama Kolom JSON) <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={editingFieldModal.field.key || ''}
                  onChange={e =>
                    setEditingFieldModal(prev => ({
                      ...prev,
                      field: { ...prev.field, key: e.target.value }
                    }))
                  }
                  placeholder="Contoh: inspectionDate / serialNumber"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Tipe Input / Data</label>
                <select
                  value={editingFieldModal.field.type || 'text'}
                  onChange={e =>
                    setEditingFieldModal(prev => ({
                      ...prev,
                      field: { ...prev.field, type: e.target.value as DynamicFieldType }
                    }))
                  }
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                >
                  <optgroup label="Tipe Standar">
                    <option value="text">Teks Pendek (Text Input)</option>
                    <option value="number">Angka / Kuantitas (Number)</option>
                    <option value="textarea">Teks Panjang (Textarea / Catatan)</option>
                    <option value="select">Dropdown Pilihan (Select)</option>
                    <option value="date">Tanggal (Date Picker)</option>
                    <option value="time">Waktu / Jam (Time Picker)</option>
                    <option value="currency_idr">Mata Uang IDR (Rupiah)</option>
                    <option value="currency_usd">Mata Uang USD (Dollar)</option>
                    <option value="switch">Saklar / Switch (Ya / Tidak)</option>
                    <option value="checkbox">Centang / Checkbox</option>
                  </optgroup>
                  <optgroup label="Integrasi Master Data ERP (Lookup)">
                    <option value="lookup_dept">Lookup Master Departemen</option>
                    <option value="lookup_supplier">Lookup Master Supplier</option>
                    <option value="lookup_customer">Lookup Master Customer</option>
                    <option value="lookup_coa">Lookup Bagan Akun (COA)</option>
                    <option value="lookup_stock">Lookup Master Item Stock / Part</option>
                    <option value="lookup_process">Lookup Master Proses Produksi</option>
                  </optgroup>
                </select>
              </div>

              {editingFieldModal.field.type === 'select' && (
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Daftar Opsi (Pisahkan dengan koma)
                  </label>
                  <input
                    type="text"
                    value={editingFieldModal.field.options?.join(', ') || ''}
                    onChange={e =>
                      setEditingFieldModal(prev => ({
                        ...prev,
                        field: {
                          ...prev.field,
                          options: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                        }
                      }))
                    }
                    placeholder="Contoh: Passed, Failed, Pending, Under Review"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Lebar Kolom Grid</label>
                  <select
                    value={editingFieldModal.field.gridSpan || 2}
                    onChange={e =>
                      setEditingFieldModal(prev => ({
                        ...prev,
                        field: { ...prev.field, gridSpan: Number(e.target.value) as any }
                      }))
                    }
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  >
                    <option value={1}>1 Kolom (Kecil)</option>
                    <option value={2}>2 Kolom (Setengah / Standar)</option>
                    <option value={3}>3 Kolom (3/4)</option>
                    <option value={4}>4 Kolom (Full Width)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Validasi Wajib</label>
                  <label className="flex items-center gap-2 mt-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!editingFieldModal.field.required}
                      onChange={e =>
                        setEditingFieldModal(prev => ({
                          ...prev,
                          field: { ...prev.field, required: e.target.checked }
                        }))
                      }
                      className="w-4 h-4 text-emerald-600 rounded-sm"
                    />
                    <span className="text-slate-300">Wajib Diisi</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Teks Bantuan (Helper Text)</label>
                <input
                  type="text"
                  value={editingFieldModal.field.helpText || ''}
                  onChange={e =>
                    setEditingFieldModal(prev => ({
                      ...prev,
                      field: { ...prev.field, helpText: e.target.value }
                    }))
                  }
                  placeholder="Penjelasan panduan pengisian..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEditingFieldModal({ isOpen: false, isNew: false, field: {} })}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveField}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
              >
                Simpan Field
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CREATE DATASET */}
      {/* ========================================================================= */}
      {newDatasetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Database className="w-4 h-4 text-cyan-400" />
                Tambah Koleksi Dataset Baru
              </h3>
              <button
                onClick={() => setNewDatasetModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Nama Dataset <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={newDatasetName}
                  onChange={e => setNewDatasetName(e.target.value)}
                  placeholder="Contoh: safety_patrol_records"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono focus:ring-2 focus:ring-cyan-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setNewDatasetModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleCreateNewDataset}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold"
              >
                Buat Dataset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
