import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { SummaryBudgetView } from './components/SummaryBudgetView';
import { SalesPlanView } from './components/SalesPlanView';
import { SalesDeliveryView } from './components/SalesDeliveryView';
import { SalesInvoiceView } from './components/SalesInvoiceView';
import { FixedAssetView } from './components/FixedAssetView';
import { InventoryView } from './components/InventoryView';
import { PlannerView } from './components/PlannerView';
import { DeptPlanningView } from './components/DeptPlanningView';
import { DeptPlanningModal } from './components/DeptPlanningModal';
import { DeptMasterView } from './components/DeptMasterView';
import { COAMasterView } from './components/COAMasterView';
import { RateSettingsView } from './components/RateSettingsView';
import { BackupDataView } from './components/BackupDataView';
import { RealisasiBudgetView } from './components/RealisasiBudgetView';
import { RealisasiModal } from './components/RealisasiModal';
import { UserManagementView } from './components/UserManagementView';
import { CompanySettingsView } from './components/CompanySettingsView';
import { AuditLogView } from './components/AuditLogView';
import { LoginView } from './components/LoginView';
import { MasterSupplierView } from './components/MasterSupplierView';
import { MasterCustomerView } from './components/MasterCustomerView';
import { MasterItemStockView } from './components/MasterItemStockView';
import { MasterProsesView } from './components/MasterProsesView';
import { MasterRateHarianView } from './components/MasterRateHarianView';
import { PurchaseRequestView } from './components/PurchaseRequestView';
import { PurchaseOrderView } from './components/PurchaseOrderView';
import { PurchaseInvoiceView } from './components/PurchaseInvoiceView';
import { CashBankView } from './components/CashBankView';
import {
  AppState,
  AppUser,
  AuditLogEntry,
  BudgetRealization,
  COA,
  CompanySettings,
  Department,
  DeptPlanningItem,
  DeptPlanningSection,
  ExchangeRates,
  FixedAssetItem,
  InventoryCategory,
  InventoryItem,
  MonthData,
  SalesPlanItem,
  SalesDeliveryItem,
  SalesInvoiceItem,
  Supplier,
  Customer,
  ItemStock,
  ProductionProcess,
  DailyRate,
  PurchaseRequest,
  PurchaseOrder,
  PurchaseInvoice,
  CashBankAccount,
  CashBankReceipt,
  CashBankPayment,
  ReturnFromProdItem
} from './types';
import {
  DEFAULT_COA,
  DEFAULT_COMPANY_SETTINGS,
  DEFAULT_DEPARTMENTS,
  DEFAULT_RATES_BY_YEAR,
  DEFAULT_FIXED_ASSET_ITEMS,
  DEFAULT_INVENTORY_ITEMS,
  DEFAULT_SALES_DELIVERY_ITEMS,
  DEFAULT_SALES_INVOICE_ITEMS,
  DEFAULT_SUPPLIERS,
  DEFAULT_CUSTOMERS,
  DEFAULT_ITEM_STOCKS,
  DEFAULT_PRODUCTION_PROCESSES,
  DEFAULT_DAILY_RATES,
  DEFAULT_PURCHASE_REQUESTS,
  DEFAULT_PURCHASE_ORDERS,
  DEFAULT_PURCHASE_INVOICES,
  DEFAULT_CASH_BANK_ACCOUNTS,
  DEFAULT_CASH_BANK_RECEIPTS,
  DEFAULT_CASH_BANK_PAYMENTS,
  DEFAULT_RETURN_FROM_PROD_ITEMS,
  DP_MONTHS,
  INITIAL_SAMPLE_MONTHLY_DATA
} from './constants/defaultData';
import { DEFAULT_USERS, ROLE_PRESETS } from './utils/userUtils';
import {
  buildAuditLog,
  clearAuditLogsFromServer,
  fetchAppDataFromServer,
  fetchAuditLogsFromServer,
  pushAuditLogToServer,
  saveAppDataToServer
} from './utils/syncService';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const STORAGE_KEY = 'blogspot_smart_budget_db_v2';
const AUDIT_LOGS_STORAGE_KEY = 'smartbudget_audit_logs_v1';
const CURRENT_USER_STORAGE_KEY = 'smartbudget_active_user_v1';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

export default function App() {
  const currentMonthDefault = new Date().toISOString().substring(0, 7);
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthDefault);
  const [activeTab, setActiveTab] = useState<string>('deptPlanning');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  // Sync state
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncedTime, setLastSyncedTime] = useState<string>('');
  const lastKnownVersion = useRef<number>(0);
  const isSavingRef = useRef<boolean>(false);

  // Toasts
  const [toast, setToast] = useState<Toast | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now().toString();
    setToast({ id, message, type });
    setTimeout(() => {
      setToast(prev => (prev?.id === id ? null : prev));
    }, 4000);
  }, []);

  // Current Authenticated User (Defaults to Administrator with full access)
  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => {
    try {
      const saved = localStorage.getItem(CURRENT_USER_STORAGE_KEY);
      if (saved) {
        const parsed: AppUser = JSON.parse(saved);
        // Refresh permissions with latest role preset
        const rolePreset = ROLE_PRESETS[parsed.role];
        if (rolePreset) {
          return {
            ...parsed,
            permissions: rolePreset.permissions,
            roleLabel: rolePreset.label
          };
        }
        return {
          ...parsed,
          permissions: Array.from(new Set([...(parsed.permissions || []), 'dept', 'supplier', 'customer', 'itemStock', 'masterProcess', 'dailyRates', 'coa', 'rate', 'purchase', 'purchaseRequest', 'purchaseOrder']))
        };
      }
    } catch (e) {
      console.error('Error reading currentUser from localStorage:', e);
    }
    // Default to Administrator (acckaneta@gmail.com) with full access to all menus
    return DEFAULT_USERS[0];
  });

  // Modal State for Dept Planning
  const [isDeptModalOpen, setIsDeptModalOpen] = useState<boolean>(false);
  const [targetDeptSection, setTargetDeptSection] = useState<DeptPlanningSection>('budget');
  const [editingDeptItem, setEditingDeptItem] = useState<DeptPlanningItem | null>(null);

  // Modal State for Realisasi Budget
  const [isRealModalOpen, setIsRealModalOpen] = useState<boolean>(false);
  const [editingRealization, setEditingRealization] = useState<BudgetRealization | null>(null);

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() => {
    try {
      const saved = localStorage.getItem(AUDIT_LOGS_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Error loading audit logs:', e);
    }
    return [];
  });

  // Core App State: ACC data for Budget, Cost Down, and Realization removed as requested
  const [appState, setAppState] = useState<AppState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const existingPlanning: DeptPlanningItem[] = Array.isArray(parsed.deptPlanningItems) ? parsed.deptPlanningItems : [];

        // Purge any old ACC sample/mock items as requested
        const cleanPlanningItems = existingPlanning.filter(
          item =>
            item.deptCode !== 'ACC' &&
            !item.code?.startsWith('ACC-') &&
            !item.code?.startsWith('CDACC-') &&
            item.id !== 'dp_acc_consultant' &&
            item.id !== 'dp_demo_1'
        );

        // Purge any old ACC realizations as requested
        const cleanRealizations = Array.isArray(parsed.realizations)
          ? parsed.realizations.filter((r: BudgetRealization) => r.deptCode !== 'ACC')
          : [];

        // Clean slate for Fixed Assets (purge any previous demo items)
        const cleanFixedAssets = Array.isArray(parsed.fixedAssetItems)
          ? parsed.fixedAssetItems.filter((fa: any) => fa.id !== 'fa_1' && fa.id !== 'fa_2' && fa.id !== 'fa_3')
          : [];

        return {
          monthlyData: parsed.monthlyData || { [currentMonthDefault]: INITIAL_SAMPLE_MONTHLY_DATA },
          deptPlanningItems: cleanPlanningItems,
          realizations: cleanRealizations,
          salesPlanItems: Array.isArray(parsed.salesPlanItems) ? parsed.salesPlanItems : [],
          salesDeliveryItems: Array.isArray(parsed.salesDeliveryItems)
            ? parsed.salesDeliveryItems
            : DEFAULT_SALES_DELIVERY_ITEMS,
          salesInvoiceItems: Array.isArray(parsed.salesInvoiceItems)
            ? parsed.salesInvoiceItems
            : DEFAULT_SALES_INVOICE_ITEMS,
          fixedAssetItems: cleanFixedAssets,
          inventoryItems: Array.isArray(parsed.inventoryItems)
            ? parsed.inventoryItems
            : DEFAULT_INVENTORY_ITEMS,
          users: Array.isArray(parsed.users) && parsed.users.length > 0
            ? parsed.users.map((u: AppUser) => {
                const preset = ROLE_PRESETS[u.role];
                return preset ? { ...u, permissions: preset.permissions } : u;
              })
            : DEFAULT_USERS,
          departments: Array.isArray(parsed.departments) && parsed.departments.length > 0
            ? parsed.departments
            : DEFAULT_DEPARTMENTS,
          coa: Array.isArray(parsed.coa) && parsed.coa.length > 0
            ? parsed.coa
            : DEFAULT_COA,
          ratesByYear: parsed.ratesByYear && typeof parsed.ratesByYear === 'object'
            ? parsed.ratesByYear
            : DEFAULT_RATES_BY_YEAR,
          companySettings: parsed.companySettings && typeof parsed.companySettings === 'object'
            ? parsed.companySettings
            : DEFAULT_COMPANY_SETTINGS,
          suppliers: Array.isArray(parsed.suppliers)
            ? parsed.suppliers
            : DEFAULT_SUPPLIERS,
          customers: Array.isArray(parsed.customers)
            ? parsed.customers
            : DEFAULT_CUSTOMERS,
          itemStocks: Array.isArray(parsed.itemStocks)
            ? parsed.itemStocks
            : DEFAULT_ITEM_STOCKS,
          productionProcesses: Array.isArray(parsed.productionProcesses)
            ? parsed.productionProcesses
            : DEFAULT_PRODUCTION_PROCESSES,
          dailyRates: Array.isArray(parsed.dailyRates)
            ? parsed.dailyRates
            : DEFAULT_DAILY_RATES,
          purchaseRequests: Array.isArray(parsed.purchaseRequests)
            ? parsed.purchaseRequests
            : DEFAULT_PURCHASE_REQUESTS,
          purchaseOrders: Array.isArray(parsed.purchaseOrders)
            ? parsed.purchaseOrders
            : DEFAULT_PURCHASE_ORDERS,
          purchaseInvoices: Array.isArray(parsed.purchaseInvoices)
            ? parsed.purchaseInvoices
            : DEFAULT_PURCHASE_INVOICES,
          cashBankAccounts: Array.isArray(parsed.cashBankAccounts)
            ? parsed.cashBankAccounts
            : DEFAULT_CASH_BANK_ACCOUNTS,
          cashBankReceipts: Array.isArray(parsed.cashBankReceipts)
            ? parsed.cashBankReceipts
            : DEFAULT_CASH_BANK_RECEIPTS,
          cashBankPayments: Array.isArray(parsed.cashBankPayments)
            ? parsed.cashBankPayments
            : DEFAULT_CASH_BANK_PAYMENTS,
          returnFromProdItems: Array.isArray(parsed.returnFromProdItems)
            ? parsed.returnFromProdItems
            : DEFAULT_RETURN_FROM_PROD_ITEMS
        };
      }
    } catch (e) {
      console.error('Error reading localStorage:', e);
    }

    return {
      monthlyData: { [currentMonthDefault]: INITIAL_SAMPLE_MONTHLY_DATA },
      deptPlanningItems: [], // Clean slate for ACC and others
      realizations: [], // Clean slate for ACC
      salesPlanItems: [],
      salesDeliveryItems: DEFAULT_SALES_DELIVERY_ITEMS,
      salesInvoiceItems: DEFAULT_SALES_INVOICE_ITEMS,
      fixedAssetItems: [],
      inventoryItems: DEFAULT_INVENTORY_ITEMS,
      users: DEFAULT_USERS,
      departments: DEFAULT_DEPARTMENTS,
      coa: DEFAULT_COA,
      ratesByYear: DEFAULT_RATES_BY_YEAR,
      companySettings: DEFAULT_COMPANY_SETTINGS,
      suppliers: DEFAULT_SUPPLIERS,
      customers: DEFAULT_CUSTOMERS,
      itemStocks: DEFAULT_ITEM_STOCKS,
      productionProcesses: DEFAULT_PRODUCTION_PROCESSES,
      dailyRates: DEFAULT_DAILY_RATES,
      purchaseRequests: DEFAULT_PURCHASE_REQUESTS,
      purchaseOrders: DEFAULT_PURCHASE_ORDERS,
      purchaseInvoices: DEFAULT_PURCHASE_INVOICES,
      cashBankAccounts: DEFAULT_CASH_BANK_ACCOUNTS,
      cashBankReceipts: DEFAULT_CASH_BANK_RECEIPTS,
      cashBankPayments: DEFAULT_CASH_BANK_PAYMENTS,
      returnFromProdItems: DEFAULT_RETURN_FROM_PROD_ITEMS
    };
  });

  // Local storage backup effect
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
    } catch (e) {
      console.error('Error saving state to localStorage:', e);
    }
  }, [appState]);

  useEffect(() => {
    try {
      localStorage.setItem(AUDIT_LOGS_STORAGE_KEY, JSON.stringify(auditLogs));
    } catch (e) {
      console.error('Error saving audit logs to localStorage:', e);
    }
  }, [auditLogs]);

  // Helper to record an audit log and push to server
  const logActivity = useCallback((params: {
    action: AuditLogEntry['action'];
    module: AuditLogEntry['module'];
    details: string;
    itemCode?: string;
    itemName?: string;
    deptCode?: string;
    year?: number;
    oldValue?: any;
    newValue?: any;
  }) => {
    const entry = buildAuditLog({
      currentUser,
      ...params
    });

    setAuditLogs(prev => [entry, ...prev].slice(0, 2000));
    pushAuditLogToServer(entry);
  }, [currentUser]);

  // Helper to persist state to local & push to server for desktop/mobile sync
  const updateAndSyncState = useCallback((updater: (prev: AppState) => AppState, auditParams?: {
    action: AuditLogEntry['action'];
    module: AuditLogEntry['module'];
    details: string;
    itemCode?: string;
    itemName?: string;
    deptCode?: string;
    year?: number;
    oldValue?: any;
    newValue?: any;
  }) => {
    isSavingRef.current = true;
    setAppState(prev => {
      const next = updater(prev);

      // Push state to server
      saveAppDataToServer(next).then(res => {
        if (res && res.version) {
          lastKnownVersion.current = res.version;
        }
        if (res && res.success) {
          const nowStr = new Date().toLocaleTimeString('id-ID');
          setLastSyncedTime(nowStr);
        }
        isSavingRef.current = false;
      });

      return next;
    });

    if (auditParams) {
      logActivity(auditParams);
    }
  }, [logActivity]);

  // Initial fetch from server on load
  const syncFromServer = useCallback(async (isManual: boolean = false) => {
    setIsSyncing(true);
    try {
      const resp = await fetchAppDataFromServer();
      if (resp.success && resp.data) {
        // Clean out any legacy ACC sample data if present
        const sData = resp.data;
        const cleanedPlanning = Array.isArray(sData.deptPlanningItems)
          ? sData.deptPlanningItems.filter(
              item =>
                item.deptCode !== 'ACC' ||
                // Keep if authored by real user or valid item
                item.id.startsWith('dp_user_')
            )
          : [];
        const cleanedRealizations = Array.isArray(sData.realizations)
          ? sData.realizations.filter(r => r.id !== 'Nsvl8BmPIPFoXXr6EVO7')
          : [];

        setAppState(prev => ({
          ...prev,
          monthlyData: sData.monthlyData || prev.monthlyData,
          deptPlanningItems: cleanedPlanning,
          realizations: cleanedRealizations,
          salesPlanItems: Array.isArray(sData.salesPlanItems) ? sData.salesPlanItems : (prev.salesPlanItems || []),
          salesDeliveryItems: Array.isArray(sData.salesDeliveryItems) ? sData.salesDeliveryItems : (prev.salesDeliveryItems || []),
          salesInvoiceItems: Array.isArray(sData.salesInvoiceItems) ? sData.salesInvoiceItems : (prev.salesInvoiceItems || []),
          fixedAssetItems: Array.isArray(sData.fixedAssetItems) ? sData.fixedAssetItems : (prev.fixedAssetItems || []),
          inventoryItems: Array.isArray(sData.inventoryItems) ? sData.inventoryItems : (prev.inventoryItems || []),
          purchaseRequests: Array.isArray(sData.purchaseRequests) ? sData.purchaseRequests : (prev.purchaseRequests || []),
          purchaseOrders: Array.isArray(sData.purchaseOrders) ? sData.purchaseOrders : (prev.purchaseOrders || []),
          cashBankAccounts: Array.isArray(sData.cashBankAccounts) ? sData.cashBankAccounts : (prev.cashBankAccounts || []),
          cashBankReceipts: Array.isArray(sData.cashBankReceipts) ? sData.cashBankReceipts : (prev.cashBankReceipts || []),
          cashBankPayments: Array.isArray(sData.cashBankPayments) ? sData.cashBankPayments : (prev.cashBankPayments || []),
          suppliers: Array.isArray(sData.suppliers) ? sData.suppliers : (prev.suppliers || []),
          customers: Array.isArray(sData.customers) ? sData.customers : (prev.customers || []),
          itemStocks: Array.isArray(sData.itemStocks) ? sData.itemStocks : (prev.itemStocks || []),
          productionProcesses: Array.isArray(sData.productionProcesses) ? sData.productionProcesses : (prev.productionProcesses || []),
          dailyRates: Array.isArray(sData.dailyRates) ? sData.dailyRates : (prev.dailyRates || []),
          users: Array.isArray(sData.users) && sData.users.length > 0 ? sData.users : prev.users,
          departments: Array.isArray(sData.departments) && sData.departments.length > 0 ? sData.departments : prev.departments,
          coa: Array.isArray(sData.coa) && sData.coa.length > 0 ? sData.coa : prev.coa,
          ratesByYear: sData.ratesByYear || prev.ratesByYear,
          companySettings: sData.companySettings || prev.companySettings,
          returnFromProdItems: Array.isArray(sData.returnFromProdItems) ? sData.returnFromProdItems : (prev.returnFromProdItems || DEFAULT_RETURN_FROM_PROD_ITEMS)
        }));

        if (Array.isArray(resp.auditLogs) && resp.auditLogs.length > 0) {
          setAuditLogs(resp.auditLogs);
        }

        if (resp.version) {
          lastKnownVersion.current = resp.version;
        }

        const nowStr = new Date().toLocaleTimeString('id-ID');
        setLastSyncedTime(nowStr);

        if (isManual) {
          showToast('Data berhasil disinkronkan dengan server (Desktop & HP up-to-date)!', 'success');
        }
      }
    } catch (err) {
      console.error('Sync error:', err);
    } finally {
      setIsSyncing(false);
    }
  }, [showToast]);

  // On initial mount, sync with server
  useEffect(() => {
    syncFromServer(false);
  }, [syncFromServer]);

  // Periodic polling & Window focus sync (every 4 seconds) to ensure Desktop & Mobile stay 100% in sync
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isSavingRef.current && document.visibilityState === 'visible') {
        fetch('/api/sync-status')
          .then(r => r.json())
          .then(json => {
            if (json.success && json.version && json.version !== lastKnownVersion.current) {
              syncFromServer(false);
            }
          })
          .catch(() => {});
      }
    }, 4000);

    const onFocus = () => {
      if (!isSavingRef.current) {
        fetch('/api/sync-status')
          .then(r => r.json())
          .then(json => {
            if (json.success && json.version && json.version !== lastKnownVersion.current) {
              syncFromServer(false);
            }
          })
          .catch(() => {});
      }
    };

    window.addEventListener('focus', onFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, [syncFromServer]);

  // Helper to get active month data safely
  const currentMonthData: MonthData = appState.monthlyData[selectedMonth] || {
    income: 0,
    categories: [],
    debts: [],
    goals: [],
    expenses: []
  };

  // Update monthly data
  const updateCurrentMonthData = (updater: (prev: MonthData) => MonthData) => {
    updateAndSyncState(prev => {
      const current = prev.monthlyData[selectedMonth] || {
        income: 0,
        categories: [],
        debts: [],
        goals: [],
        expenses: []
      };
      const updated = updater(current);
      return {
        ...prev,
        monthlyData: {
          ...prev.monthlyData,
          [selectedMonth]: updated
        }
      };
    });
  };

  // ===================== DEPT PLANNING HANDLERS =====================
  const handleOpenDeptModal = (section: DeptPlanningSection = 'budget', item?: DeptPlanningItem) => {
    setTargetDeptSection(section);
    setEditingDeptItem(item || null);
    setIsDeptModalOpen(true);
  };

  const handleSaveDeptPlanningItem = (item: DeptPlanningItem) => {
    const isEdit = appState.deptPlanningItems.some(x => x.id === item.id);
    const existing = isEdit ? appState.deptPlanningItems.find(x => x.id === item.id) : null;
    const sectionLabel = item.section === 'budget' ? 'A. BUDGET' : item.section === 'costdown' ? 'B. COST DOWN' : 'C. PLAN';

    updateAndSyncState(prev => {
      const items = [...prev.deptPlanningItems];
      const index = items.findIndex(x =>
        x.id === item.id ||
        (item.code && x.code.toLowerCase() === item.code.toLowerCase() && x.deptCode.toLowerCase() === item.deptCode.toLowerCase()) ||
        (x.deptCode.toLowerCase() === item.deptCode.toLowerCase() &&
         x.section === item.section &&
         x.year === item.year &&
         x.accountNo === item.accountNo &&
         x.item.toLowerCase() === item.item.toLowerCase())
      );

      if (index >= 0) {
        items[index] = {
          ...items[index],
          ...item,
          id: items[index].id,
          updatedAt: new Date().toISOString()
        };
      } else {
        items.unshift(item);
      }

      return {
        ...prev,
        deptPlanningItems: items
      };
    }, {
      action: isEdit ? 'UPDATE' : 'CREATE',
      module: item.section === 'budget' ? 'Dept Planning (Budget)' : item.section === 'costdown' ? 'Dept Planning (Cost Down)' : 'Dept Planning (Plan)',
      details: isEdit
        ? `Mengubah pos ${item.code} (${item.accountNo} - ${item.item}) pada ${sectionLabel} Dept ${item.deptCode} nominal: ${item.currency} ${item.amount.toLocaleString('id-ID')} (USD ${item.totalUSD.toLocaleString('en-US')})`
        : `Menambahkan pos baru ${item.code} (${item.accountNo} - ${item.item}) pada ${sectionLabel} Dept ${item.deptCode} nominal: ${item.currency} ${item.amount.toLocaleString('id-ID')} (USD ${item.totalUSD.toLocaleString('en-US')})`,
      itemCode: item.code,
      itemName: item.item,
      deptCode: item.deptCode,
      year: item.year,
      oldValue: existing ? { code: existing.code, amount: existing.amount, totalUSD: existing.totalUSD, monthly: existing.monthly } : undefined,
      newValue: { code: item.code, amount: item.amount, totalUSD: item.totalUSD, monthly: item.monthly }
    });

    showToast(`Data ${item.code} berhasil disimpan di ${sectionLabel}!`, 'success');
  };

  const handleBatchUpsertDeptPlanningItems = (newItems: DeptPlanningItem[], targetSection: DeptPlanningSection) => {
    const secName = targetSection === 'budget' ? 'A. BUDGET' : targetSection === 'costdown' ? 'B. COST DOWN' : 'C. PLAN';
    const deptCodes = Array.from(new Set(newItems.map(x => x.deptCode))).join(', ');

    updateAndSyncState(prev => {
      const items = [...prev.deptPlanningItems];

      newItems.forEach(newItem => {
        const idx = items.findIndex(x =>
          x.id === newItem.id ||
          (newItem.code && x.code.toLowerCase() === newItem.code.toLowerCase() && x.deptCode.toLowerCase() === newItem.deptCode.toLowerCase()) ||
          (x.deptCode.toLowerCase() === newItem.deptCode.toLowerCase() &&
           x.section === newItem.section &&
           x.year === newItem.year &&
           x.accountNo === newItem.accountNo &&
           x.item.toLowerCase() === newItem.item.toLowerCase())
        );

        if (idx >= 0) {
          items[idx] = {
            ...items[idx],
            ...newItem,
            id: items[idx].id,
            updatedAt: new Date().toISOString()
          };
        } else {
          items.unshift(newItem);
        }
      });

      return {
        ...prev,
        deptPlanningItems: items
      };
    }, {
      action: 'IMPORT',
      module: targetSection === 'budget' ? 'Dept Planning (Budget)' : targetSection === 'costdown' ? 'Dept Planning (Cost Down)' : 'Dept Planning (Plan)',
      details: `Import ${newItems.length} baris data ke ${secName} untuk Dept: ${deptCodes || '-'}`,
      deptCode: deptCodes,
      newValue: { count: newItems.length, section: targetSection, codes: newItems.slice(0, 10).map(x => x.code) }
    });

    showToast(`Import tuntas! ${newItems.length} baris diproses di ${secName} tanpa duplikasi.`, 'success');
  };

  const handleDeduplicateDeptPlanningItems = () => {
    let dupCount = 0;
    updateAndSyncState(prev => {
      const seen = new Map<string, DeptPlanningItem>();

      prev.deptPlanningItems.forEach(item => {
        const key = `${item.deptCode}_${item.section}_${item.year}_${item.code || (item.accountNo + '_' + item.item)}`.toLowerCase();
        if (seen.has(key)) {
          dupCount++;
          const existing = seen.get(key)!;
          const existingMonthsFilled = DP_MONTHS.filter(m => (existing.monthly?.[m] || 0) !== 0).length;
          const currentMonthsFilled = DP_MONTHS.filter(m => (item.monthly?.[m] || 0) !== 0).length;
          if (currentMonthsFilled >= existingMonthsFilled) {
            seen.set(key, item);
          }
        } else {
          seen.set(key, item);
        }
      });

      return {
        ...prev,
        deptPlanningItems: Array.from(seen.values())
      };
    }, {
      action: 'UPDATE',
      module: 'Dept Planning (Budget)',
      details: `Pembersihan data: Menghapus ${dupCount} data duplikat di Dept Planning`
    });

    if (dupCount > 0) {
      showToast(`Pembersihan tuntas: ${dupCount} data duplikat berhasil dihapus!`, 'success');
    } else {
      showToast('Tidak ada data duplikat. Seluruh data Dept Planning sudah unik.', 'info');
    }
  };

  const handleDeleteDeptPlanningItem = (id: string) => {
    const itemToDelete = appState.deptPlanningItems.find(x => x.id === id);
    if (!itemToDelete) return;

    const secName = itemToDelete.section === 'budget' ? 'A. BUDGET' : itemToDelete.section === 'costdown' ? 'B. COST DOWN' : 'C. PLAN';

    updateAndSyncState(prev => ({
      ...prev,
      deptPlanningItems: prev.deptPlanningItems.filter(x => x.id !== id)
    }), {
      action: 'DELETE',
      module: itemToDelete.section === 'budget' ? 'Dept Planning (Budget)' : itemToDelete.section === 'costdown' ? 'Dept Planning (Cost Down)' : 'Dept Planning (Plan)',
      details: `Menghapus pos ${itemToDelete.code} (${itemToDelete.item}) dari ${secName} Dept ${itemToDelete.deptCode} bernilai ${itemToDelete.currency} ${itemToDelete.amount.toLocaleString('id-ID')} (USD ${itemToDelete.totalUSD.toLocaleString('en-US')})`,
      itemCode: itemToDelete.code,
      itemName: itemToDelete.item,
      deptCode: itemToDelete.deptCode,
      year: itemToDelete.year,
      oldValue: itemToDelete
    });

    showToast(`Data ${itemToDelete.code} berhasil dihapus.`, 'info');
  };

  const handleDeleteBatchDeptPlanningItems = (ids: string[]) => {
    if (ids.length === 0) return;
    const idSet = new Set(ids);
    const itemsToDelete = appState.deptPlanningItems.filter(x => idSet.has(x.id));
    const sampleCodes = itemsToDelete.slice(0, 5).map(x => x.code).join(', ');
    const deptList = Array.from(new Set(itemsToDelete.map(x => x.deptCode))).join(', ');

    updateAndSyncState(prev => ({
      ...prev,
      deptPlanningItems: prev.deptPlanningItems.filter(x => !idSet.has(x.id))
    }), {
      action: 'BATCH_DELETE',
      module: 'Dept Planning (Budget)',
      details: `Menghapus ${ids.length} data Dept Planning secara massal (Dept: ${deptList || '-'}, Kode: ${sampleCodes}${ids.length > 5 ? '...' : ''})`,
      deptCode: deptList,
      oldValue: { count: ids.length, codes: itemsToDelete.map(x => x.code) }
    });

    showToast(`${ids.length} data Dept Planning berhasil dihapus.`, 'info');
  };

  // ===================== REALISASI BUDGET HANDLERS =====================
  const handleOpenRealModal = (realization?: BudgetRealization) => {
    setEditingRealization(realization || null);
    setIsRealModalOpen(true);
  };

  const handleSaveRealization = (item: BudgetRealization) => {
    const isEdit = (appState.realizations || []).some(r => r.id === item.id);
    const existing = isEdit ? (appState.realizations || []).find(r => r.id === item.id) : null;

    updateAndSyncState(prev => {
      const list = [...(prev.realizations || [])];
      const idx = list.findIndex(r => r.id === item.id);
      if (idx >= 0) {
        list[idx] = item;
      } else {
        list.unshift(item);
      }
      return {
        ...prev,
        realizations: list
      };
    }, {
      action: isEdit ? 'UPDATE' : 'CREATE',
      module: 'Realisasi Budget',
      details: isEdit
        ? `Mengubah realisasi budget #${item.id} (${item.name}) Dept ${item.deptCode} Akun ${item.accountNo} nominal ${item.currency} ${item.price.toLocaleString('id-ID')} (USD ${item.priceUSD.toLocaleString('en-US')})`
        : `Mencatat realisasi budget baru #${item.id} (${item.name}) Dept ${item.deptCode} Akun ${item.accountNo} nominal ${item.currency} ${item.price.toLocaleString('id-ID')} (USD ${item.priceUSD.toLocaleString('en-US')})`,
      itemCode: item.accountNo,
      itemName: item.name,
      deptCode: item.deptCode,
      year: item.year,
      oldValue: existing,
      newValue: item
    });

    showToast(`Penggunaan budget "${item.name}" ($${item.priceUSD}) berhasil disimpan!`, 'success');
  };

  const handleDeleteRealization = (id: string) => {
    const itemToDelete = (appState.realizations || []).find(r => r.id === id);
    if (!itemToDelete) return;

    updateAndSyncState(prev => ({
      ...prev,
      realizations: (prev.realizations || []).filter(r => r.id !== id)
    }), {
      action: 'DELETE',
      module: 'Realisasi Budget',
      details: `Menghapus transaksi realisasi budget #${itemToDelete.id} (${itemToDelete.name}) Dept ${itemToDelete.deptCode} nominal ${itemToDelete.currency} ${itemToDelete.price.toLocaleString('id-ID')} (USD ${itemToDelete.priceUSD.toLocaleString('en-US')})`,
      itemCode: itemToDelete.accountNo,
      itemName: itemToDelete.name,
      deptCode: itemToDelete.deptCode,
      year: itemToDelete.year,
      oldValue: itemToDelete
    });

    showToast('Data penggunaan budget berhasil dihapus.', 'info');
  };

  // ===================== SALES PLAN HANDLERS =====================
  const handleAddSalesPlan = (item: Partial<SalesPlanItem>) => {
    const newItem: SalesPlanItem = {
      id: `sp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      deptCode: item.deptCode || currentUser?.deptCode || 'ACC',
      customer: item.customer || '',
      item: item.item || '',
      coaCode: item.coaCode || '',
      coaName: item.coaName || '',
      currency: item.currency || 'USD',
      year: item.year || 2026,
      rate: item.rate || 1,
      monthly: item.monthly || { Jan: 0, Feb: 0, Mar: 0, Apr: 0, Mei: 0, Jun: 0, Jul: 0, Agu: 0, Sep: 0, Okt: 0, Nov: 0, Des: 0 },
      totalUSD: item.totalUSD || 0,
      status: item.status || 'Approved',
      notes: item.notes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    updateAndSyncState(prev => ({
      ...prev,
      salesPlanItems: [newItem, ...(prev.salesPlanItems || [])]
    }), {
      action: 'CREATE',
      module: 'Sales Plan',
      details: `Menambah Sales Plan baru customer "${newItem.customer}" - "${newItem.item}" Dept ${newItem.deptCode} total USD $${newItem.totalUSD.toLocaleString('en-US')}`,
      itemCode: newItem.coaCode,
      itemName: `${newItem.customer} - ${newItem.item}`,
      deptCode: newItem.deptCode,
      year: newItem.year,
      newValue: newItem
    });

    showToast(`Sales Plan "${newItem.customer}" berhasil ditambahkan!`, 'success');
  };

  const handleUpdateSalesPlan = (id: string, updated: Partial<SalesPlanItem>) => {
    const existing = (appState.salesPlanItems || []).find(s => s.id === id);
    if (!existing) return;

    const merged: SalesPlanItem = {
      ...existing,
      ...updated,
      updatedAt: new Date().toISOString()
    };

    updateAndSyncState(prev => ({
      ...prev,
      salesPlanItems: (prev.salesPlanItems || []).map(s => s.id === id ? merged : s)
    }), {
      action: 'UPDATE',
      module: 'Sales Plan',
      details: `Mengubah Sales Plan customer "${merged.customer}" - "${merged.item}" Dept ${merged.deptCode} total USD $${merged.totalUSD.toLocaleString('en-US')}`,
      itemCode: merged.coaCode,
      itemName: `${merged.customer} - ${merged.item}`,
      deptCode: merged.deptCode,
      year: merged.year,
      oldValue: existing,
      newValue: merged
    });

    showToast(`Sales Plan "${merged.customer}" berhasil diperbarui!`, 'success');
  };

  const handleDeleteSalesPlan = (id: string) => {
    const itemToDelete = (appState.salesPlanItems || []).find(s => s.id === id);
    if (!itemToDelete) return;

    updateAndSyncState(prev => ({
      ...prev,
      salesPlanItems: (prev.salesPlanItems || []).filter(s => s.id !== id)
    }), {
      action: 'DELETE',
      module: 'Sales Plan',
      details: `Menghapus Sales Plan customer "${itemToDelete.customer}" - "${itemToDelete.item}" Dept ${itemToDelete.deptCode} ($${itemToDelete.totalUSD.toLocaleString('en-US')})`,
      itemCode: itemToDelete.coaCode,
      itemName: `${itemToDelete.customer} - ${itemToDelete.item}`,
      deptCode: itemToDelete.deptCode,
      year: itemToDelete.year,
      oldValue: itemToDelete
    });

    showToast(`Sales Plan "${itemToDelete.customer}" berhasil dihapus.`, 'info');
  };

  // ===================== SALES DELIVERY HANDLERS =====================
  const handleAddSalesDelivery = (item: Omit<SalesDeliveryItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newItem: SalesDeliveryItem = {
      ...item,
      id: `sd_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    updateAndSyncState(prev => ({
      ...prev,
      salesDeliveryItems: [newItem, ...(prev.salesDeliveryItems || [])]
    }), {
      action: 'CREATE',
      module: 'Sales',
      details: `Menambah Surat Jalan (Sales Delivery) "${newItem.deliveryNo}" untuk customer "${newItem.customer}"`,
      itemCode: newItem.deliveryNo,
      itemName: `SJ ${newItem.customer}`,
      newValue: newItem
    });

    showToast(`Surat Jalan "${newItem.deliveryNo}" berhasil ditambahkan!`, 'success');
  };

  const handleUpdateSalesDelivery = (id: string, updated: Partial<SalesDeliveryItem>) => {
    const existing = (appState.salesDeliveryItems || []).find(s => s.id === id);
    if (!existing) return;

    const merged: SalesDeliveryItem = {
      ...existing,
      ...updated,
      updatedAt: new Date().toISOString()
    };

    updateAndSyncState(prev => ({
      ...prev,
      salesDeliveryItems: (prev.salesDeliveryItems || []).map(s => s.id === id ? merged : s)
    }), {
      action: 'UPDATE',
      module: 'Sales',
      details: `Memperbarui Surat Jalan "${merged.deliveryNo}" customer "${merged.customer}" (${merged.status})`,
      itemCode: merged.deliveryNo,
      itemName: `SJ ${merged.customer}`,
      oldValue: existing,
      newValue: merged
    });

    showToast(`Surat Jalan "${merged.deliveryNo}" berhasil diperbarui!`, 'success');
  };

  const handleDeleteSalesDelivery = (id: string) => {
    const itemToDelete = (appState.salesDeliveryItems || []).find(s => s.id === id);
    if (!itemToDelete) return;

    updateAndSyncState(prev => ({
      ...prev,
      salesDeliveryItems: (prev.salesDeliveryItems || []).filter(s => s.id !== id)
    }), {
      action: 'DELETE',
      module: 'Sales',
      details: `Menghapus Surat Jalan "${itemToDelete.deliveryNo}" customer "${itemToDelete.customer}"`,
      itemCode: itemToDelete.deliveryNo,
      itemName: `SJ ${itemToDelete.customer}`,
      oldValue: itemToDelete
    });

    showToast(`Surat Jalan "${itemToDelete.deliveryNo}" berhasil dihapus.`, 'info');
  };

  // ===================== SALES INVOICE HANDLERS =====================
  const handleAddSalesInvoice = (item: Omit<SalesInvoiceItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newItem: SalesInvoiceItem = {
      ...item,
      id: `inv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    updateAndSyncState(prev => ({
      ...prev,
      salesInvoiceItems: [newItem, ...(prev.salesInvoiceItems || [])]
    }), {
      action: 'CREATE',
      module: 'Sales',
      details: `Membuat Faktur Penjualan (Sales Invoice) "${newItem.invoiceNo}" untuk customer "${newItem.customer}" (${newItem.currency} ${newItem.totalAmount.toLocaleString()})`,
      itemCode: newItem.invoiceNo,
      itemName: `Invoice ${newItem.customer}`,
      newValue: newItem
    });

    showToast(`Faktur Penjualan "${newItem.invoiceNo}" berhasil dibuat!`, 'success');
  };

  const handleUpdateSalesInvoice = (id: string, updated: Partial<SalesInvoiceItem>) => {
    const existing = (appState.salesInvoiceItems || []).find(s => s.id === id);
    if (!existing) return;

    const merged: SalesInvoiceItem = {
      ...existing,
      ...updated,
      updatedAt: new Date().toISOString()
    };

    updateAndSyncState(prev => ({
      ...prev,
      salesInvoiceItems: (prev.salesInvoiceItems || []).map(s => s.id === id ? merged : s)
    }), {
      action: 'UPDATE',
      module: 'Sales',
      details: `Memperbarui Faktur Penjualan "${merged.invoiceNo}" customer "${merged.customer}" (${merged.status})`,
      itemCode: merged.invoiceNo,
      itemName: `Invoice ${merged.customer}`,
      oldValue: existing,
      newValue: merged
    });

    showToast(`Faktur Penjualan "${merged.invoiceNo}" berhasil diperbarui!`, 'success');
  };

  const handleDeleteSalesInvoice = (id: string) => {
    const itemToDelete = (appState.salesInvoiceItems || []).find(s => s.id === id);
    if (!itemToDelete) return;

    updateAndSyncState(prev => ({
      ...prev,
      salesInvoiceItems: (prev.salesInvoiceItems || []).filter(s => s.id !== id)
    }), {
      action: 'DELETE',
      module: 'Sales',
      details: `Menghapus Faktur Penjualan "${itemToDelete.invoiceNo}" customer "${itemToDelete.customer}"`,
      itemCode: itemToDelete.invoiceNo,
      itemName: `Invoice ${itemToDelete.customer}`,
      oldValue: itemToDelete
    });

    showToast(`Faktur Penjualan "${itemToDelete.invoiceNo}" berhasil dihapus.`, 'info');
  };

  const handleGenerateInvoiceFromDelivery = (delivery: SalesDeliveryItem) => {
    const unitPrice = delivery.unitPriceUSD || 10;
    const subtotal = delivery.totalAmountUSD || (delivery.qty * unitPrice);
    const taxRatePercent = 11;
    const taxAmount = (subtotal * taxRatePercent) / 100;
    const totalAmount = subtotal + taxAmount;

    handleAddSalesInvoice({
      invoiceNo: `INV/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, '0')}/${Math.floor(1000 + Math.random() * 9000)}`,
      deliveryNo: delivery.deliveryNo,
      poNumber: delivery.poNumber,
      invoiceDate: new Date().toISOString().substring(0, 10),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10),
      customer: delivery.customer,
      customerAddress: delivery.destinationAddress,
      description: `Penjualan ${delivery.itemName} (${delivery.qty.toLocaleString()} ${delivery.uom})`,
      currency: 'USD',
      rate: 1,
      subtotal,
      taxRatePercent,
      taxAmount,
      totalAmount,
      totalAmountUSD: totalAmount,
      status: 'Draft',
      notes: `Dibuat otomatis dari Surat Jalan No. ${delivery.deliveryNo}`
    });

    // Mark delivery as invoiced
    handleUpdateSalesDelivery(delivery.id, {
      invoiced: true
    });

    setActiveTab('sales-invoice');
  };
  const handleAddFixedAsset = (item: Partial<FixedAssetItem>) => {
    const acqCostUSD = item.acquisitionCostUSD !== undefined ? item.acquisitionCostUSD : (item.usd || item.value || 0);
    const prior = item.priorAccumDepreciation || 0;
    const monthly = item.monthlyDepreciation || {
      Jan: 0, Feb: 0, Mar: 0, Apr: 0, May: 0, Jun: 0,
      Jul: 0, Aug: 0, Sep: 0, Oct: 0, Nov: 0, Dec: 0
    };
    const totalDepYear = item.totalDepreciationYear !== undefined
      ? item.totalDepreciationYear
      : Object.values(monthly).reduce((a, b) => a + b, 0);
    const accumUSD = item.accumulatedDepreciationUSD !== undefined
      ? item.accumulatedDepreciationUSD
      : prior + totalDepYear;
    const nbv = item.netBookValueUSD !== undefined
      ? item.netBookValueUSD
      : Math.max(0, acqCostUSD - accumUSD);

    const newItem: FixedAssetItem = {
      id: `fa_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      kiNo: item.kiNo || item.code || '',
      code: item.kiNo || item.code || '',
      invoiceNo: item.invoiceNo || '',
      description: item.description || item.name || '',
      name: item.description || item.name || '',
      qty: Number(item.qty) || 1,
      acquisitionDate: item.acquisitionDate || '2026-01-01',
      deptCode: item.deptCode || currentUser?.deptCode || 'ACC',
      coaCode: item.coaCode || '',
      coaName: item.coaName || '',
      currency: item.currency || 'IDR',
      originalCost: item.originalCost || item.value || 0,
      rate: item.rate || 1,
      acquisitionCostUSD: acqCostUSD,
      value: item.originalCost || item.value || 0,
      usd: acqCostUSD,

      assetType: item.assetType || 'NEW',
      parentAssetId: item.parentAssetId,
      parentAssetKiNo: item.parentAssetKiNo,
      parentAssetDescription: item.parentAssetDescription,
      usefulLifeMonths: item.usefulLifeMonths || 48,
      usefulLifeYears: item.usefulLifeYears || 4,

      priorAccumDepreciation: prior,
      monthlyDepreciation: monthly,
      totalDepreciationYear: totalDepYear,
      accumulatedDepreciationUSD: accumUSD,
      netBookValueUSD: nbv,

      status: item.status || 'Active',
      year: item.year || 2026,
      notes: item.notes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    updateAndSyncState(prev => ({
      ...prev,
      fixedAssetItems: [newItem, ...(prev.fixedAssetItems || [])]
    }), {
      action: 'CREATE',
      module: 'Fixed Asset',
      details: `Menambah Fixed Asset "${newItem.kiNo} - ${newItem.description}" (Inv: ${newItem.invoiceNo}) Dept ${newItem.deptCode} (USD $${newItem.acquisitionCostUSD.toLocaleString('en-US')})`,
      itemCode: newItem.kiNo,
      itemName: newItem.description,
      deptCode: newItem.deptCode,
      year: newItem.year,
      newValue: newItem
    });

    showToast(`Fixed Asset "${newItem.kiNo} - ${newItem.description}" berhasil ditambahkan!`, 'success');
  };

  const handleUpdateFixedAsset = (id: string, updated: Partial<FixedAssetItem>) => {
    const existing = (appState.fixedAssetItems || []).find(f => f.id === id);
    if (!existing) return;

    const merged: FixedAssetItem = {
      ...existing,
      ...updated,
      code: updated.kiNo || updated.code || existing.code,
      name: updated.description || updated.name || existing.name,
      updatedAt: new Date().toISOString()
    };

    updateAndSyncState(prev => ({
      ...prev,
      fixedAssetItems: (prev.fixedAssetItems || []).map(f => f.id === id ? merged : f)
    }), {
      action: 'UPDATE',
      module: 'Fixed Asset',
      details: `Mengubah Fixed Asset "${merged.kiNo} - ${merged.description}" Dept ${merged.deptCode} (USD $${merged.acquisitionCostUSD.toLocaleString('en-US')})`,
      itemCode: merged.kiNo,
      itemName: merged.description,
      deptCode: merged.deptCode,
      year: merged.year,
      oldValue: existing,
      newValue: merged
    });

    showToast(`Fixed Asset "${merged.kiNo}" berhasil diperbarui!`, 'success');
  };

  const handleBatchImportFixedAsset = (items: Partial<FixedAssetItem>[]) => {
    if (!items || items.length === 0) return;

    const newItems: FixedAssetItem[] = items.map((item, idx) => {
      const acqCostUSD = item.acquisitionCostUSD !== undefined ? item.acquisitionCostUSD : (item.usd || item.value || 0);
      const prior = item.priorAccumDepreciation || 0;
      const monthly = item.monthlyDepreciation || {
        Jan: 0, Feb: 0, Mar: 0, Apr: 0, May: 0, Jun: 0,
        Jul: 0, Aug: 0, Sep: 0, Oct: 0, Nov: 0, Dec: 0
      };
      const totalDepYear = item.totalDepreciationYear !== undefined
        ? item.totalDepreciationYear
        : Object.values(monthly).reduce((a, b) => a + b, 0);
      const accumUSD = item.accumulatedDepreciationUSD !== undefined
        ? item.accumulatedDepreciationUSD
        : prior + totalDepYear;
      const nbv = item.netBookValueUSD !== undefined
        ? item.netBookValueUSD
        : Math.max(0, acqCostUSD - accumUSD);

      return {
        id: `fa_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 7)}`,
        kiNo: item.kiNo || item.code || `KI-${Date.now()}-${idx}`,
        code: item.kiNo || item.code || '',
        invoiceNo: item.invoiceNo || '',
        description: item.description || item.name || '',
        name: item.description || item.name || '',
        qty: Number(item.qty) || 1,
        acquisitionDate: item.acquisitionDate || '2026-01-01',
        deptCode: item.deptCode || currentUser?.deptCode || 'ACC',
        coaCode: item.coaCode || '1110003',
        coaName: item.coaName || 'Fixed Asset',
        currency: item.currency || 'USD',
        originalCost: item.originalCost || item.value || acqCostUSD,
        rate: item.rate || 1,
        acquisitionCostUSD: acqCostUSD,
        value: item.originalCost || item.value || acqCostUSD,
        usd: acqCostUSD,

        assetType: item.assetType || 'NEW',
        parentAssetId: item.parentAssetId,
        parentAssetKiNo: item.parentAssetKiNo,
        parentAssetDescription: item.parentAssetDescription,
        usefulLifeMonths: item.usefulLifeMonths || 48,
        usefulLifeYears: item.usefulLifeYears || 4,

        priorAccumDepreciation: prior,
        monthlyDepreciation: monthly,
        totalDepreciationYear: totalDepYear,
        accumulatedDepreciationUSD: accumUSD,
        netBookValueUSD: nbv,

        status: item.status || 'Active',
        year: item.year || 2026,
        notes: item.notes || 'Imported via Excel',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    });

    updateAndSyncState(prev => ({
      ...prev,
      fixedAssetItems: [...newItems, ...(prev.fixedAssetItems || [])]
    }), {
      action: 'IMPORT',
      module: 'Fixed Asset',
      details: `Mengimpor ${newItems.length} data Fixed Asset melalui berkas Excel/CSV`,
      itemCode: 'BATCH_IMPORT',
      itemName: `${newItems.length} Fixed Assets`,
      deptCode: currentUser?.deptCode || 'ALL',
      year: 2026
    });

    showToast(`Berhasil mengimpor ${newItems.length} data Fixed Asset!`, 'success');
  };

  const handleDeleteFixedAsset = (id: string) => {
    const itemToDelete = (appState.fixedAssetItems || []).find(f => f.id === id);
    if (!itemToDelete) return;

    updateAndSyncState(prev => ({
      ...prev,
      fixedAssetItems: (prev.fixedAssetItems || []).filter(f => f.id !== id)
    }), {
      action: 'DELETE',
      module: 'Fixed Asset',
      details: `Menghapus Fixed Asset "${itemToDelete.kiNo || itemToDelete.code} - ${itemToDelete.description || itemToDelete.name}" Dept ${itemToDelete.deptCode} (USD $${(itemToDelete.acquisitionCostUSD || itemToDelete.usd || 0).toLocaleString('en-US')})`,
      itemCode: itemToDelete.kiNo || itemToDelete.code,
      itemName: itemToDelete.description || itemToDelete.name,
      deptCode: itemToDelete.deptCode,
      year: itemToDelete.year,
      oldValue: itemToDelete
    });

    showToast(`Fixed Asset "${itemToDelete.kiNo || itemToDelete.code}" berhasil dihapus.`, 'info');
  };

  // ===================== INVENTORY HANDLERS =====================
  const handleAddInventoryItem = (item: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newItem: InventoryItem = {
      ...item,
      id: `inv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    updateAndSyncState(prev => ({
      ...prev,
      inventoryItems: [newItem, ...(prev.inventoryItems || [])]
    }), {
      action: 'CREATE',
      module: 'Inventory',
      details: `Menambahkan item inventory "${newItem.itemCode} - ${newItem.name}" ke kategori ${newItem.category} (${newItem.endingQty} ${newItem.uom}, USD $${newItem.totalValueUSD.toLocaleString('en-US')})`,
      itemCode: newItem.itemCode,
      itemName: newItem.name,
      newValue: newItem
    });

    showToast(`Item inventory "${newItem.itemCode}" berhasil ditambahkan!`, 'success');
  };

  const handleUpdateInventoryItem = (id: string, updates: Partial<InventoryItem>) => {
    const existing = (appState.inventoryItems || []).find(i => i.id === id);
    if (!existing) return;

    const merged: InventoryItem = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    updateAndSyncState(prev => ({
      ...prev,
      inventoryItems: (prev.inventoryItems || []).map(i => i.id === id ? merged : i)
    }), {
      action: 'UPDATE',
      module: 'Inventory',
      details: `Mengubah data inventory "${merged.itemCode} - ${merged.name}" (${merged.endingQty} ${merged.uom})`,
      itemCode: merged.itemCode,
      itemName: merged.name,
      oldValue: existing,
      newValue: merged
    });

    showToast(`Data inventory "${merged.itemCode}" berhasil diperbarui!`, 'success');
  };

  const handleDeleteInventoryItem = (id: string) => {
    const itemToDelete = (appState.inventoryItems || []).find(i => i.id === id);
    if (!itemToDelete) return;

    updateAndSyncState(prev => ({
      ...prev,
      inventoryItems: (prev.inventoryItems || []).filter(i => i.id !== id)
    }), {
      action: 'DELETE',
      module: 'Inventory',
      details: `Menghapus item inventory "${itemToDelete.itemCode} - ${itemToDelete.name}" dari kategori ${itemToDelete.category}`,
      itemCode: itemToDelete.itemCode,
      itemName: itemToDelete.name,
      oldValue: itemToDelete
    });

    showToast(`Item inventory "${itemToDelete.itemCode}" berhasil dihapus.`, 'info');
  };

  const handleBatchImportInventory = (items: Omit<InventoryItem, 'id'>[]) => {
    if (!items || items.length === 0) return;

    const newItems: InventoryItem[] = items.map((item, idx) => ({
      ...item,
      id: `inv_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));

    updateAndSyncState(prev => ({
      ...prev,
      inventoryItems: [...newItems, ...(prev.inventoryItems || [])]
    }), {
      action: 'IMPORT',
      module: 'Inventory',
      details: `Mengimpor ${newItems.length} item inventory secara massal via Excel`,
      itemCode: 'BATCH_IMPORT',
      itemName: `${newItems.length} Inventory Items`
    });

    showToast(`Berhasil mengimpor ${newItems.length} item inventory!`, 'success');
  };

  // ===================== RETURN FROM PRODUCTION HANDLERS =====================
  const handleAddReturnFromProd = (item: Omit<ReturnFromProdItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newItem: ReturnFromProdItem = {
      ...item,
      id: `ret_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    updateAndSyncState(prev => ({
      ...prev,
      returnFromProdItems: [newItem, ...(prev.returnFromProdItems || [])]
    }), {
      action: 'CREATE',
      module: 'Inventory',
      details: `Membuat dokumen pengembalian dari produksi ${newItem.returnNo} (${newItem.itemName} - ${newItem.qty} ${newItem.uom} dari Dept ${newItem.deptCode})`,
      itemCode: newItem.itemCode,
      itemName: newItem.itemName,
      deptCode: newItem.deptCode,
      newValue: newItem
    });

    showToast(`Dokumen pengembalian ${newItem.returnNo} berhasil dicatat!`, 'success');
  };

  const handleUpdateReturnFromProd = (id: string, updates: Partial<ReturnFromProdItem>) => {
    const existing = (appState.returnFromProdItems || []).find(r => r.id === id);
    if (!existing) return;

    const merged: ReturnFromProdItem = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    updateAndSyncState(prev => ({
      ...prev,
      returnFromProdItems: (prev.returnFromProdItems || []).map(r => r.id === id ? merged : r)
    }), {
      action: 'UPDATE',
      module: 'Inventory',
      details: `Mengubah dokumen pengembalian produksi ${merged.returnNo}`,
      itemCode: merged.itemCode,
      itemName: merged.itemName,
      deptCode: merged.deptCode,
      oldValue: existing,
      newValue: merged
    });

    showToast(`Dokumen ${merged.returnNo} berhasil diperbarui!`, 'success');
  };

  const handleDeleteReturnFromProd = (id: string) => {
    const existing = (appState.returnFromProdItems || []).find(r => r.id === id);
    if (!existing) return;

    updateAndSyncState(prev => ({
      ...prev,
      returnFromProdItems: (prev.returnFromProdItems || []).filter(r => r.id !== id)
    }), {
      action: 'DELETE',
      module: 'Inventory',
      details: `Menghapus dokumen pengembalian produksi ${existing.returnNo} (${existing.itemName})`,
      itemCode: existing.itemCode,
      itemName: existing.itemName,
      deptCode: existing.deptCode,
      oldValue: existing
    });

    showToast(`Dokumen pengembalian ${existing.returnNo} dihapus.`, 'info');
  };

  const handleCheckReturnFromProd = (id: string) => {
    const existing = (appState.returnFromProdItems || []).find(r => r.id === id);
    if (!existing) return;

    const checkedByName = currentUser?.name || 'Checker';
    const checkedAt = new Date().toISOString();

    const merged: ReturnFromProdItem = {
      ...existing,
      status: 'checked',
      checkedBy: checkedByName,
      checkedAt,
      updatedAt: checkedAt
    };

    updateAndSyncState(prev => ({
      ...prev,
      returnFromProdItems: (prev.returnFromProdItems || []).map(r => r.id === id ? merged : r)
    }), {
      action: 'UPDATE',
      module: 'Inventory',
      details: `Pemeriksaan (CHECK) fisik diverifikasi oleh ${checkedByName} untuk dokumen ${existing.returnNo} (${existing.qty} ${existing.uom} ${existing.itemName})`,
      itemCode: existing.itemCode,
      itemName: existing.itemName,
      deptCode: existing.deptCode,
      newValue: merged
    });

    showToast(`Dokumen ${existing.returnNo} berhasil diperiksa (CHECKED) oleh ${checkedByName}!`, 'success');
  };

  const handleApproveReturnFromProd = (id: string) => {
    const existing = (appState.returnFromProdItems || []).find(r => r.id === id);
    if (!existing) return;

    const approvedByName = currentUser?.name || 'Approver';
    const approvedAt = new Date().toISOString();

    const merged: ReturnFromProdItem = {
      ...existing,
      status: 'approved',
      approvedBy: approvedByName,
      approvedAt,
      updatedAt: approvedAt
    };

    updateAndSyncState(prev => {
      let updatedInv = prev.inventoryItems || [];
      if (existing.condition === 'good') {
        const invIndex = updatedInv.findIndex(i => i.itemCode === existing.itemCode);
        if (invIndex >= 0) {
          const invItem = updatedInv[invIndex];
          const newIn = Number(invItem.inQty || 0) + Number(existing.qty);
          const newEnding = Number(invItem.endingQty || 0) + Number(existing.qty);
          const costUSD = Number(invItem.unitCostUSD || invItem.unitCost || 0);
          const totalValUSD = newEnding * costUSD;
          const currentYear = new Date().getFullYear().toString();
          const rateIDR = prev.ratesByYear?.[currentYear]?.IDR || 16273.56;
          const totalValIDR = totalValUSD * rateIDR;

          updatedInv = [...updatedInv];
          updatedInv[invIndex] = {
            ...invItem,
            inQty: newIn,
            endingQty: newEnding,
            totalValueUSD: totalValUSD,
            totalValueIDR: totalValIDR,
            updatedAt: approvedAt
          };
        }
      }

      return {
        ...prev,
        returnFromProdItems: (prev.returnFromProdItems || []).map(r => r.id === id ? merged : r),
        inventoryItems: updatedInv
      };
    }, {
      action: 'APPROVE',
      module: 'Inventory',
      details: `Persetujuan (APPROVE) pengembalian barang produksi ${existing.returnNo} oleh ${approvedByName}. Stok ${existing.itemName} bertambah ${existing.qty} ${existing.uom} di gudang.`,
      itemCode: existing.itemCode,
      itemName: existing.itemName,
      deptCode: existing.deptCode,
      newValue: merged
    });

    showToast(`Dokumen ${existing.returnNo} berhasil DISETUJUI (APPROVED) oleh ${approvedByName}!`, 'success');
  };

  const handleRejectReturnFromProd = (id: string, reason: string) => {
    const existing = (appState.returnFromProdItems || []).find(r => r.id === id);
    if (!existing) return;

    const rejectedByName = currentUser?.name || 'Rejector';
    const rejectedAt = new Date().toISOString();

    const merged: ReturnFromProdItem = {
      ...existing,
      status: 'rejected',
      rejectedBy: rejectedByName,
      rejectedAt,
      rejectionReason: reason,
      updatedAt: rejectedAt
    };

    updateAndSyncState(prev => ({
      ...prev,
      returnFromProdItems: (prev.returnFromProdItems || []).map(r => r.id === id ? merged : r)
    }), {
      action: 'REJECT',
      module: 'Inventory',
      details: `Penolakan (REJECT) dokumen retur ${existing.returnNo} oleh ${rejectedByName}. Alasan: ${reason}`,
      itemCode: existing.itemCode,
      itemName: existing.itemName,
      deptCode: existing.deptCode,
      newValue: merged
    });

    showToast(`Dokumen ${existing.returnNo} DITOLAK (REJECTED). Alasan telah dicatat.`, 'info');
  };

  // ===================== AUTHENTICATION & LOGIN HANDLERS =====================
  const handleLogin = (user: AppUser) => {
    setCurrentUser(user);
    try {
      localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(user));
    } catch (e) {
      console.error('Error saving user session:', e);
    }

    if (!user.permissions.includes(activeTab as any)) {
      setActiveTab(user.permissions[0] || 'dashboard');
    }
    showToast(`Selamat datang, ${user.name}! (${user.roleLabel})`, 'success');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem(CURRENT_USER_STORAGE_KEY);
    } catch (e) {
      console.error('Error removing user session:', e);
    }
    showToast('Anda telah berhasil keluar dari sistem.', 'info');
  };

  // ===================== USER MANAGEMENT HANDLERS =====================
  const handleSaveUser = (user: AppUser) => {
    const isEdit = (appState.users || DEFAULT_USERS).some(u => u.id === user.id);

    updateAndSyncState(prev => {
      const currentList = prev.users || DEFAULT_USERS;
      const index = currentList.findIndex(u => u.id === user.id);
      let updatedList: AppUser[];
      if (index >= 0) {
        updatedList = [...currentList];
        updatedList[index] = user;
      } else {
        updatedList = [user, ...currentList];
      }
      return {
        ...prev,
        users: updatedList
      };
    }, {
      action: isEdit ? 'UPDATE' : 'CREATE',
      module: 'User Management',
      details: isEdit
        ? `Memperbarui profil pengguna ${user.name} (${user.email}) role: ${user.roleLabel}`
        : `Menambahkan pengguna baru ${user.name} (${user.email}) role: ${user.roleLabel}`
    });

    if (currentUser?.id === user.id) {
      setCurrentUser(user);
      localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(user));
    }

    showToast(`Pengguna "${user.name}" (${user.roleLabel}) berhasil disimpan!`, 'success');
  };

  const handleDeleteUser = (userId: string) => {
    const userToDelete = (appState.users || DEFAULT_USERS).find(u => u.id === userId);
    if (!userToDelete) return;

    updateAndSyncState(prev => ({
      ...prev,
      users: (prev.users || DEFAULT_USERS).filter(u => u.id !== userId)
    }), {
      action: 'DELETE',
      module: 'User Management',
      details: `Menghapus akun pengguna ${userToDelete.name} (${userToDelete.email})`
    });

    showToast(`Pengguna "${userToDelete.name}" berhasil dihapus.`, 'info');
  };

  const handleToggleUserStatus = (userId: string) => {
    const target = (appState.users || DEFAULT_USERS).find(u => u.id === userId);
    if (!target) return;

    updateAndSyncState(prev => ({
      ...prev,
      users: (prev.users || DEFAULT_USERS).map(u =>
        u.id === userId ? { ...u, isActive: !u.isActive } : u
      )
    }), {
      action: 'UPDATE',
      module: 'User Management',
      details: `Mengubah status akun pengguna ${target.name} menjadi ${!target.isActive ? 'AKTIF' : 'NONAKTIF'}`
    });

    showToast(`Status pengguna "${target.name}" diperbarui!`, 'success');
  };

  // ===================== PLANNER INCOME / CATEGORIES / GOALS HANDLERS =====================
  const handleSaveIncome = (amount: number) => {
    updateCurrentMonthData(prev => ({ ...prev, income: amount }));
    logActivity({
      action: 'UPDATE',
      module: 'Dept Planning (Budget)',
      details: `Mengubah target pendapatan bulan ${selectedMonth} menjadi $${amount.toLocaleString('en-US')}`
    });
    showToast('Pendapatan bulanan berhasil disimpan!', 'success');
  };

  const handleAddCategory = (name: string, budget: number) => {
    const newCat = { id: `cat_${Date.now()}`, name, budget };
    updateCurrentMonthData(prev => ({
      ...prev,
      categories: [...prev.categories, newCat]
    }));
    logActivity({
      action: 'CREATE',
      module: 'Dept Planning (Budget)',
      details: `Menambahkan kategori anggaran "${name}" limit $${budget.toLocaleString('en-US')}`
    });
    showToast(`Kategori "${name}" berhasil ditambahkan!`, 'success');
  };

  const handleDeleteCategory = (id: string) => {
    updateCurrentMonthData(prev => ({
      ...prev,
      categories: prev.categories.filter(c => c.id !== id),
      expenses: prev.expenses.filter(e => e.categoryId !== id)
    }));
    showToast('Kategori anggaran berhasil dihapus.', 'info');
  };

  const handleAddDebt = (name: string, monthlyPayment: number, remainingDebt: number) => {
    const newDebt = { id: `debt_${Date.now()}`, name, monthlyPayment, remainingDebt };
    updateCurrentMonthData(prev => ({
      ...prev,
      debts: [...prev.debts, newDebt]
    }));
    showToast(`Alokasi kewajiban "${name}" berhasil ditambahkan!`, 'success');
  };

  const handleDeleteDebt = (id: string) => {
    updateCurrentMonthData(prev => ({
      ...prev,
      debts: prev.debts.filter(d => d.id !== id)
    }));
    showToast('Kewajiban berhasil dihapus.', 'info');
  };

  const handleAddGoal = (name: string, monthlyAllocation: number, targetAmount: number) => {
    const newGoal = { id: `goal_${Date.now()}`, name, monthlyAllocation, targetAmount };
    updateCurrentMonthData(prev => ({
      ...prev,
      goals: [...prev.goals, newGoal]
    }));
    showToast(`Target tabungan "${name}" berhasil ditambahkan!`, 'success');
  };

  const handleDeleteGoal = (id: string) => {
    updateCurrentMonthData(prev => ({
      ...prev,
      goals: prev.goals.filter(g => g.id !== id)
    }));
    showToast('Target tabungan berhasil dihapus.', 'info');
  };

  // ===================== MASTER DEPARTMENT HANDLERS =====================
  const handleAddDept = (code: string, name: string) => {
    const dept: Department = { code, name };
    if (appState.departments.some(d => d.code.toLowerCase() === code.toLowerCase())) {
      showToast(`Kode departemen "${code}" sudah ada.`, 'error');
      return;
    }
    updateAndSyncState(prev => ({
      ...prev,
      departments: [...prev.departments, dept]
    }), {
      action: 'CREATE',
      module: 'Master Dept',
      details: `Menambahkan departemen baru "${code} - ${name}"`,
      deptCode: code
    });
    showToast(`Departemen "${code} - ${name}" berhasil ditambahkan!`, 'success');
  };

  const handleEditDept = (oldCode: string, newCode: string, newName: string) => {
    const updatedDept: Department = { code: newCode, name: newName };
    if (newCode !== oldCode && appState.departments.some(d => d.code.toLowerCase() === newCode.toLowerCase())) {
      showToast(`Kode departemen "${newCode}" sudah ada.`, 'error');
      return;
    }

    updateAndSyncState(prev => ({
      ...prev,
      departments: prev.departments.map(d => (d.code === oldCode ? updatedDept : d)),
      deptPlanningItems: prev.deptPlanningItems.map(item =>
        item.deptCode === oldCode ? { ...item, deptCode: newCode, deptName: newName } : item
      )
    }), {
      action: 'UPDATE',
      module: 'Master Dept',
      details: `Memperbarui departemen "${oldCode}" menjadi "${newCode} - ${newName}"`,
      deptCode: newCode
    });
    showToast(`Departemen "${newCode}" diperbarui!`, 'success');
  };

  const handleDeleteDept = (code: string) => {
    updateAndSyncState(prev => ({
      ...prev,
      departments: prev.departments.filter(d => d.code !== code)
    }), {
      action: 'DELETE',
      module: 'Master Dept',
      details: `Menghapus master departemen "${code}"`,
      deptCode: code
    });
    showToast(`Department "${code}" dihapus.`, 'info');
  };

  // ===================== MASTER COA HANDLERS =====================
  const handleAddCOA = (newCoa: COA) => {
    if (appState.coa.some(c => c.code === newCoa.code)) {
      showToast(`Kode COA "${newCoa.code}" sudah ada.`, 'error');
      return;
    }
    updateAndSyncState(prev => ({
      ...prev,
      coa: [...prev.coa, newCoa]
    }), {
      action: 'CREATE',
      module: 'Master COA',
      details: `Menambahkan bagan akun COA "${newCoa.code} - ${newCoa.name}"`,
      itemCode: newCoa.code,
      itemName: newCoa.name
    });
    showToast(`COA "${newCoa.code} - ${newCoa.name}" berhasil ditambahkan!`, 'success');
  };

  const handleEditCOA = (oldCode: string, updatedCoa: COA) => {
    if (updatedCoa.code !== oldCode && appState.coa.some(c => c.code === updatedCoa.code)) {
      showToast(`Kode COA "${updatedCoa.code}" sudah ada.`, 'error');
      return;
    }
    updateAndSyncState(prev => ({
      ...prev,
      coa: prev.coa.map(c => (c.code === oldCode ? updatedCoa : c)),
      deptPlanningItems: prev.deptPlanningItems.map(item =>
        item.accountNo === oldCode ? { ...item, accountNo: updatedCoa.code, accountName: updatedCoa.name } : item
      )
    }), {
      action: 'UPDATE',
      module: 'Master COA',
      details: `Memperbarui COA "${oldCode}" menjadi "${updatedCoa.code} - ${updatedCoa.name}"`,
      itemCode: updatedCoa.code,
      itemName: updatedCoa.name
    });
    showToast(`COA "${updatedCoa.code}" diperbarui!`, 'success');
  };

  const handleDeleteCOA = (code: string) => {
    updateAndSyncState(prev => ({
      ...prev,
      coa: prev.coa.filter(c => c.code !== code)
    }), {
      action: 'DELETE',
      module: 'Master COA',
      details: `Menghapus master COA "${code}"`,
      itemCode: code
    });
    showToast(`COA "${code}" dihapus.`, 'info');
  };

  // ===================== RATE HANDLERS =====================
  const handleSaveRate = (year: string, rates: ExchangeRates) => {
    updateAndSyncState(prev => ({
      ...prev,
      ratesByYear: {
        ...prev.ratesByYear,
        [year]: rates
      }
    }), {
      action: 'UPDATE',
      module: 'Exchange Rate',
      details: `Mengatur kurs tahun ${year}: IDR=${rates.IDR}, JPY=${rates.JPY}, CNY=${rates.CNY}, EUR=${rates.EUR || '-'}`,
      year: Number(year)
    });
    showToast(`Kurs untuk tahun ${year} berhasil disimpan!`, 'success');
  };

  const handleDeleteRate = (year: string) => {
    updateAndSyncState(prev => {
      const copy = { ...prev.ratesByYear };
      delete copy[year];
      return {
        ...prev,
        ratesByYear: copy
      };
    }, {
      action: 'DELETE',
      module: 'Exchange Rate',
      details: `Menghapus setting kurs tahun ${year}`,
      year: Number(year)
    });
    showToast(`Kurs tahun ${year} dihapus.`, 'info');
  };

  // ===================== MASTER DATA: SUPPLIER HANDLERS =====================
  const handleAddSupplier = (supplierData: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newSupplier: Supplier = {
      ...supplierData,
      id: `sup_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    updateAndSyncState(prev => ({
      ...prev,
      suppliers: [newSupplier, ...(prev.suppliers || [])]
    }), {
      action: 'CREATE',
      module: 'Master Supplier',
      details: `Menambahkan supplier baru: [${newSupplier.code}] ${newSupplier.name}`
    });
    showToast(`Supplier ${newSupplier.name} berhasil ditambahkan!`, 'success');
  };

  const handleUpdateSupplier = (updated: Supplier) => {
    updateAndSyncState(prev => ({
      ...prev,
      suppliers: (prev.suppliers || []).map(s => s.id === updated.id ? updated : s)
    }), {
      action: 'UPDATE',
      module: 'Master Supplier',
      details: `Memperbarui data supplier: [${updated.code}] ${updated.name}`
    });
    showToast(`Data supplier ${updated.name} berhasil diperbarui!`, 'success');
  };

  const handleDeleteSupplier = (id: string) => {
    const target = (appState.suppliers || []).find(s => s.id === id);
    updateAndSyncState(prev => ({
      ...prev,
      suppliers: (prev.suppliers || []).filter(s => s.id !== id)
    }), {
      action: 'DELETE',
      module: 'Master Supplier',
      details: `Menghapus supplier: [${target?.code || id}] ${target?.name || ''}`
    });
    showToast('Supplier berhasil dihapus.', 'info');
  };

  // ===================== MASTER DATA: CUSTOMER HANDLERS =====================
  const handleAddCustomer = (customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newCustomer: Customer = {
      ...customerData,
      id: `cust_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    updateAndSyncState(prev => ({
      ...prev,
      customers: [newCustomer, ...(prev.customers || [])]
    }), {
      action: 'CREATE',
      module: 'Master Customer',
      details: `Menambahkan customer baru: [${newCustomer.code}] ${newCustomer.name}`
    });
    showToast(`Customer ${newCustomer.name} berhasil ditambahkan!`, 'success');
  };

  const handleUpdateCustomer = (updated: Customer) => {
    updateAndSyncState(prev => ({
      ...prev,
      customers: (prev.customers || []).map(c => c.id === updated.id ? updated : c)
    }), {
      action: 'UPDATE',
      module: 'Master Customer',
      details: `Memperbarui data customer: [${updated.code}] ${updated.name}`
    });
    showToast(`Data customer ${updated.name} berhasil diperbarui!`, 'success');
  };

  const handleDeleteCustomer = (id: string) => {
    const target = (appState.customers || []).find(c => c.id === id);
    updateAndSyncState(prev => ({
      ...prev,
      customers: (prev.customers || []).filter(c => c.id !== id)
    }), {
      action: 'DELETE',
      module: 'Master Customer',
      details: `Menghapus customer: [${target?.code || id}] ${target?.name || ''}`
    });
    showToast('Customer berhasil dihapus.', 'info');
  };

  // ===================== MASTER DATA: ITEM STOCK HANDLERS =====================
  const handleAddItemStock = (itemData: Omit<ItemStock, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newItemStock: ItemStock = {
      ...itemData,
      id: `stock_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    updateAndSyncState(prev => ({
      ...prev,
      itemStocks: [newItemStock, ...(prev.itemStocks || [])]
    }), {
      action: 'CREATE',
      module: 'Master Item Stock',
      details: `Menambahkan item stock baru: [${newItemStock.code}] ${newItemStock.name}`
    });
    showToast(`Item stock ${newItemStock.name} berhasil ditambahkan!`, 'success');
  };

  const handleBatchAddItemStock = (newItemsData: Omit<ItemStock, 'id' | 'createdAt' | 'updatedAt'>[]) => {
    const newItems: ItemStock[] = newItemsData.map((itemData, idx) => ({
      ...itemData,
      id: `stock_${Date.now()}_${idx}_${Math.random().toString(36).substr(2, 5)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));
    updateAndSyncState(prev => ({
      ...prev,
      itemStocks: [...newItems, ...(prev.itemStocks || [])]
    }), {
      action: 'IMPORT',
      module: 'Master Item Stock',
      details: `Import massal ${newItems.length} item stock dari file Excel/CSV`
    });
    showToast(`${newItems.length} item stock berhasil di-import ke database!`, 'success');
  };

  const handleUpdateItemStock = (id: string, itemUpdates: Partial<ItemStock>) => {
    const existing = (appState.itemStocks || []).find(i => i.id === id);
    if (!existing) return;
    const merged: ItemStock = { ...existing, ...itemUpdates, id, updatedAt: new Date().toISOString() };
    updateAndSyncState(prev => ({
      ...prev,
      itemStocks: (prev.itemStocks || []).map(i => i.id === id ? merged : i)
    }), {
      action: 'UPDATE',
      module: 'Master Item Stock',
      details: `Memperbarui item stock: [${merged.code}] ${merged.name}`
    });
    showToast(`Item stock ${merged.name} berhasil diperbarui!`, 'success');
  };

  const handleDeleteItemStock = (id: string) => {
    const target = (appState.itemStocks || []).find(i => i.id === id);
    updateAndSyncState(prev => ({
      ...prev,
      itemStocks: (prev.itemStocks || []).filter(i => i.id !== id)
    }), {
      action: 'DELETE',
      module: 'Master Item Stock',
      details: `Menghapus item stock: [${target?.code || id}] ${target?.name || ''}`
    });
    showToast('Item stock berhasil dihapus.', 'info');
  };

  const handleDeleteBatchItemStock = (ids: string[]) => {
    if (!ids || ids.length === 0) return;
    updateAndSyncState(prev => ({
      ...prev,
      itemStocks: (prev.itemStocks || []).filter(i => !ids.includes(i.id))
    }), {
      action: 'DELETE',
      module: 'Master Item Stock',
      details: `Menghapus massal ${ids.length} item stock`
    });
    showToast(`${ids.length} item stock berhasil dihapus.`, 'info');
  };

  // ===================== MASTER DATA: PROSES PRODUKSI HANDLERS =====================
  const handleAddProcess = (processData: Omit<ProductionProcess, 'id'>) => {
    const newProcess: ProductionProcess = {
      ...processData,
      id: `proc_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`
    };
    updateAndSyncState(prev => ({
      ...prev,
      productionProcesses: [...(prev.productionProcesses || []), newProcess]
    }), {
      action: 'CREATE',
      module: 'Master Proses',
      details: `Menambahkan master proses produksi: [${newProcess.code}] ${newProcess.name}`
    });
    showToast(`Proses produksi ${newProcess.name} berhasil ditambahkan!`, 'success');
  };

  const handleUpdateProcess = (updated: ProductionProcess) => {
    updateAndSyncState(prev => ({
      ...prev,
      productionProcesses: (prev.productionProcesses || []).map(p => p.id === updated.id ? updated : p)
    }), {
      action: 'UPDATE',
      module: 'Master Proses',
      details: `Memperbarui master proses produksi: [${updated.code}] ${updated.name}`
    });
    showToast(`Proses produksi ${updated.name} berhasil diperbarui!`, 'success');
  };

  const handleDeleteProcess = (id: string) => {
    const target = (appState.productionProcesses || []).find(p => p.id === id);
    updateAndSyncState(prev => ({
      ...prev,
      productionProcesses: (prev.productionProcesses || []).filter(p => p.id !== id)
    }), {
      action: 'DELETE',
      module: 'Master Proses',
      details: `Menghapus master proses produksi: [${target?.code || id}] ${target?.name || ''}`
    });
    showToast('Proses produksi berhasil dihapus.', 'info');
  };

  // ===================== MASTER DATA: RATE HARIAN (BI & KMK) HANDLERS =====================
  const handleAddDailyRate = (rateData: Omit<DailyRate, 'id'>) => {
    const newRate: DailyRate = {
      ...rateData,
      id: `rate_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`
    };
    updateAndSyncState(prev => ({
      ...prev,
      dailyRates: [newRate, ...(prev.dailyRates || [])]
    }), {
      action: 'CREATE',
      module: 'Rate Harian',
      details: `Input rate harian ${newRate.currency} tgl ${newRate.date}: BI=${newRate.rateBI}, KMK=${newRate.rateKMK}`
    });
    showToast(`Rate harian ${newRate.currency} berhasil dicatat!`, 'success');
  };

  const handleUpdateDailyRate = (updated: DailyRate) => {
    updateAndSyncState(prev => ({
      ...prev,
      dailyRates: (prev.dailyRates || []).map(r => r.id === updated.id ? updated : r)
    }), {
      action: 'UPDATE',
      module: 'Rate Harian',
      details: `Memperbarui rate harian ${updated.currency} tgl ${updated.date}: BI=${updated.rateBI}, KMK=${updated.rateKMK}`
    });
    showToast(`Rate harian ${updated.currency} berhasil diperbarui!`, 'success');
  };

  const handleDeleteDailyRate = (id: string) => {
    const target = (appState.dailyRates || []).find(r => r.id === id);
    updateAndSyncState(prev => ({
      ...prev,
      dailyRates: (prev.dailyRates || []).filter(r => r.id !== id)
    }), {
      action: 'DELETE',
      module: 'Rate Harian',
      details: `Menghapus rate harian ${target?.currency} tanggal ${target?.date}`
    });
    showToast('Rate harian berhasil dihapus.', 'info');
  };

  // ===================== WORKSPACE: PURCHASE REQUEST HANDLERS =====================
  const handleAddPR = (prData: Omit<PurchaseRequest, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newPR: PurchaseRequest = {
      ...prData,
      id: `pr_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    updateAndSyncState(prev => ({
      ...prev,
      purchaseRequests: [newPR, ...(prev.purchaseRequests || [])]
    }), {
      action: 'CREATE',
      module: 'Purchase Request',
      details: `Pengajuan PR [${newPR.prNumber}] oleh ${newPR.requesterName} (${newPR.deptName})`
    });
    showToast(`Purchase Request ${newPR.prNumber} berhasil diajukan!`, 'success');
  };

  const handleUpdatePR = (updated: PurchaseRequest) => {
    updateAndSyncState(prev => ({
      ...prev,
      purchaseRequests: (prev.purchaseRequests || []).map(p => p.id === updated.id ? updated : p)
    }), {
      action: 'UPDATE',
      module: 'Purchase Request',
      details: `Memperbarui Purchase Request [${updated.prNumber}]`
    });
    showToast(`Purchase Request ${updated.prNumber} berhasil diperbarui!`, 'success');
  };

  const handleDeletePR = (id: string) => {
    const target = (appState.purchaseRequests || []).find(p => p.id === id);
    updateAndSyncState(prev => ({
      ...prev,
      purchaseRequests: (prev.purchaseRequests || []).filter(p => p.id !== id)
    }), {
      action: 'DELETE',
      module: 'Purchase Request',
      details: `Menghapus Purchase Request [${target?.prNumber || id}]`
    });
    showToast('Purchase Request berhasil dihapus.', 'info');
  };

  const handleApprovePR = (id: string, approverName: string) => {
    const target = (appState.purchaseRequests || []).find(p => p.id === id);
    if (!target) return;
    const updated: PurchaseRequest = {
      ...target,
      status: 'approved',
      approvedBy: approverName,
      approvedAt: new Date().toISOString()
    };
    updateAndSyncState(prev => ({
      ...prev,
      purchaseRequests: (prev.purchaseRequests || []).map(p => p.id === id ? updated : p)
    }), {
      action: 'APPROVE',
      module: 'Purchase Request',
      details: `Menyetujui PR [${target.prNumber}] oleh ${approverName}`
    });
    showToast(`Purchase Request ${target.prNumber} telah disetujui!`, 'success');
  };

  const handleRejectPR = (id: string) => {
    const target = (appState.purchaseRequests || []).find(p => p.id === id);
    if (!target) return;
    const updated: PurchaseRequest = {
      ...target,
      status: 'rejected'
    };
    updateAndSyncState(prev => ({
      ...prev,
      purchaseRequests: (prev.purchaseRequests || []).map(p => p.id === id ? updated : p)
    }), {
      action: 'UPDATE',
      module: 'Purchase Request',
      details: `Menolak PR [${target.prNumber}]`
    });
    showToast(`Purchase Request ${target.prNumber} ditolak.`, 'info');
  };

  const handleCreatePOFromPR = (pr: PurchaseRequest) => {
    // Generate new PO from PR
    const seq = (appState.purchaseOrders || []).length + 1;
    const yearMonth = new Date().toISOString().slice(0, 7).replace('-', '/');
    const poNumber = `PO/${yearMonth}/${String(seq).padStart(3, '0')}`;
    const defaultSup = (appState.suppliers || [])[0] || DEFAULT_SUPPLIERS[0];

    const poItems = pr.items.map(itm => ({
      id: `po_item_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      itemCode: itm.itemCode,
      itemName: itm.itemName,
      description: itm.description || '',
      qty: itm.qty,
      uom: itm.uom,
      unitPrice: itm.estimatedPrice || 0,
      totalPrice: (itm.qty || 1) * (itm.estimatedPrice || 0)
    }));

    const subtotal = poItems.reduce((sum, itm) => sum + itm.totalPrice, 0);
    const taxPercent = 11;
    const taxAmount = (subtotal * taxPercent) / 100;
    const grandTotal = subtotal + taxAmount;

    const newPO: PurchaseOrder = {
      id: `po_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      poNumber,
      date: new Date().toISOString().split('T')[0],
      prNumber: pr.prNumber,
      supplierCode: defaultSup.code,
      supplierName: defaultSup.name,
      supplierAddress: defaultSup.address ? `${defaultSup.address}, ${defaultSup.city}` : defaultSup.city,
      supplierContact: defaultSup.contactPerson || '',
      supplierEmail: defaultSup.email || '',
      supplierPhone: defaultSup.phone || '',
      deliveryDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      paymentTerms: defaultSup.paymentTerms || 'NET 30',
      currency: pr.currency || 'USD',
      rate: 16273.56,
      items: poItems,
      subtotal,
      taxPercent,
      taxAmount,
      grandTotal,
      grandTotalUSD: pr.currency === 'USD' ? grandTotal : grandTotal / 16273.56,
      status: 'draft',
      deliveryAddress: 'Kawasan Industri GIIC Blok C-1, Cikarang Pusat, Bekasi - Loading Dock Receiving',
      notes: `Diterbitkan otomatis dari pengajuan Purchase Request ${pr.prNumber} (${pr.deptName})`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Update PR status to po_created
    const updatedPR: PurchaseRequest = {
      ...pr,
      status: 'po_created',
      linkedPoNumber: poNumber
    };

    updateAndSyncState(prev => ({
      ...prev,
      purchaseOrders: [newPO, ...(prev.purchaseOrders || [])],
      purchaseRequests: (prev.purchaseRequests || []).map(p => p.id === pr.id ? updatedPR : p)
    }), {
      action: 'CREATE',
      module: 'Purchase Order',
      details: `Menerbitkan PO [${newPO.poNumber}] dari PR [${pr.prNumber}] ke supplier [${defaultSup.name}]`
    });

    setActiveTab('purchase-order');
    showToast(`Purchase Order ${newPO.poNumber} berhasil dibuat dari PR!`, 'success');
  };

  // ===================== WORKSPACE: PURCHASE ORDER HANDLERS =====================
  const handleAddPO = (poData: Omit<PurchaseOrder, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newPO: PurchaseOrder = {
      ...poData,
      id: `po_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    updateAndSyncState(prev => ({
      ...prev,
      purchaseOrders: [newPO, ...(prev.purchaseOrders || [])]
    }), {
      action: 'CREATE',
      module: 'Purchase Order',
      details: `Penerbitan Purchase Order [${newPO.poNumber}] ke supplier ${newPO.supplierName}`
    });
    showToast(`Purchase Order ${newPO.poNumber} berhasil diterbitkan!`, 'success');
  };

  const handleUpdatePO = (updated: PurchaseOrder) => {
    updateAndSyncState(prev => ({
      ...prev,
      purchaseOrders: (prev.purchaseOrders || []).map(p => p.id === updated.id ? updated : p)
    }), {
      action: 'UPDATE',
      module: 'Purchase Order',
      details: `Memperbarui Purchase Order [${updated.poNumber}]`
    });
    showToast(`Purchase Order ${updated.poNumber} berhasil diperbarui!`, 'success');
  };

  const handleDeletePO = (id: string) => {
    const target = (appState.purchaseOrders || []).find(p => p.id === id);
    updateAndSyncState(prev => ({
      ...prev,
      purchaseOrders: (prev.purchaseOrders || []).filter(p => p.id !== id)
    }), {
      action: 'DELETE',
      module: 'Purchase Order',
      details: `Menghapus Purchase Order [${target?.poNumber || id}]`
    });
    showToast('Purchase Order berhasil dihapus.', 'info');
  };

  const handleMarkStatusPO = (id: string, newStatus: PurchaseOrder['status']) => {
    const target = (appState.purchaseOrders || []).find(p => p.id === id);
    if (!target) return;
    const updated: PurchaseOrder = {
      ...target,
      status: newStatus,
      updatedAt: new Date().toISOString()
    };
    updateAndSyncState(prev => ({
      ...prev,
      purchaseOrders: (prev.purchaseOrders || []).map(p => p.id === id ? updated : p)
    }), {
      action: 'UPDATE',
      module: 'Purchase Order',
      details: `Merubah status PO [${target.poNumber}] menjadi: ${newStatus}`
    });
    showToast(`Status PO ${target.poNumber} diperbarui ke ${newStatus}.`, 'success');
  };

  // ===================== WORKSPACE: PURCHASE INVOICE HANDLERS =====================
  const handleAddPurchaseInvoice = (invData: Omit<PurchaseInvoice, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newInv: PurchaseInvoice = {
      ...invData,
      id: `pi_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    updateAndSyncState(prev => ({
      ...prev,
      purchaseInvoices: [newInv, ...(prev.purchaseInvoices || [])]
    }), {
      action: 'CREATE',
      module: 'Purchase Invoice',
      details: `Penerbitan Faktur Pembelian (Purchase Invoice) [${newInv.invoiceNo}] untuk PO [${newInv.poNumber}] / DO [${newInv.deliveryOrderNo}] dari supplier ${newInv.supplierName}`
    });
    showToast(`Purchase Invoice ${newInv.invoiceNo} berhasil dicatat!`, 'success');
  };

  const handleUpdatePurchaseInvoice = (id: string, updates: Partial<PurchaseInvoice>) => {
    const target = (appState.purchaseInvoices || []).find(p => p.id === id);
    if (!target) return;
    const updated: PurchaseInvoice = {
      ...target,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    updateAndSyncState(prev => ({
      ...prev,
      purchaseInvoices: (prev.purchaseInvoices || []).map(p => p.id === id ? updated : p)
    }), {
      action: 'UPDATE',
      module: 'Purchase Invoice',
      details: `Memperbarui Purchase Invoice [${updated.invoiceNo}]`
    });
    showToast(`Purchase Invoice ${updated.invoiceNo} berhasil diperbarui!`, 'success');
  };

  const handleDeletePurchaseInvoice = (id: string) => {
    const target = (appState.purchaseInvoices || []).find(p => p.id === id);
    updateAndSyncState(prev => ({
      ...prev,
      purchaseInvoices: (prev.purchaseInvoices || []).filter(p => p.id !== id)
    }), {
      action: 'DELETE',
      module: 'Purchase Invoice',
      details: `Menghapus Purchase Invoice [${target?.invoiceNo || id}]`
    });
    showToast('Purchase Invoice berhasil dihapus.', 'info');
  };

  const handleCheckPurchaseInvoice = (id: string, userName: string) => {
    const target = (appState.purchaseInvoices || []).find(p => p.id === id);
    if (!target) return;
    const updated: PurchaseInvoice = {
      ...target,
      checkedBy: userName || currentUser?.name || 'Checker',
      checkedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    updateAndSyncState(prev => ({
      ...prev,
      purchaseInvoices: (prev.purchaseInvoices || []).map(p => p.id === id ? updated : p)
    }), {
      action: 'UPDATE',
      module: 'Purchase Invoice',
      details: `Memeriksa Purchase Invoice [${target.invoiceNo}]`
    });
    showToast(`Purchase Invoice ${target.invoiceNo} berhasil diverifikasi (Checked)!`, 'success');
  };

  const handleApprovePurchaseInvoice = (id: string, userName: string) => {
    const target = (appState.purchaseInvoices || []).find(p => p.id === id);
    if (!target) return;
    const updated: PurchaseInvoice = {
      ...target,
      approvedBy: userName || currentUser?.name || 'Approver',
      approvedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    updateAndSyncState(prev => ({
      ...prev,
      purchaseInvoices: (prev.purchaseInvoices || []).map(p => p.id === id ? updated : p)
    }), {
      action: 'UPDATE',
      module: 'Purchase Invoice',
      details: `Menyetujui Purchase Invoice [${target.invoiceNo}]`
    });
    showToast(`Purchase Invoice ${target.invoiceNo} telah disetujui (Approved)!`, 'success');
  };

  const handleRejectPurchaseInvoice = (id: string, userName: string, reason: string) => {
    const target = (appState.purchaseInvoices || []).find(p => p.id === id);
    if (!target) return;
    const updated: PurchaseInvoice = {
      ...target,
      status: 'cancelled',
      rejectedBy: userName || currentUser?.name || 'Approver',
      rejectedAt: new Date().toISOString(),
      rejectionReason: reason,
      updatedAt: new Date().toISOString()
    };
    updateAndSyncState(prev => ({
      ...prev,
      purchaseInvoices: (prev.purchaseInvoices || []).map(p => p.id === id ? updated : p)
    }), {
      action: 'UPDATE',
      module: 'Purchase Invoice',
      details: `Menolak Purchase Invoice [${target.invoiceNo}]: ${reason}`
    });
    showToast(`Purchase Invoice ${target.invoiceNo} ditolak.`, 'error');
  };

  // ===================== BACKUP & RESTORE HANDLERS =====================
  const handleRestoreState = (newState: AppState) => {
    updateAndSyncState(() => ({
      monthlyData: newState.monthlyData || {},
      deptPlanningItems: Array.isArray(newState.deptPlanningItems) ? newState.deptPlanningItems : [],
      realizations: Array.isArray(newState.realizations) ? newState.realizations : [],
      salesPlanItems: Array.isArray(newState.salesPlanItems) ? newState.salesPlanItems : [],
      salesDeliveryItems: Array.isArray(newState.salesDeliveryItems) ? newState.salesDeliveryItems : DEFAULT_SALES_DELIVERY_ITEMS,
      salesInvoiceItems: Array.isArray(newState.salesInvoiceItems) ? newState.salesInvoiceItems : DEFAULT_SALES_INVOICE_ITEMS,
      fixedAssetItems: Array.isArray(newState.fixedAssetItems) ? newState.fixedAssetItems : [],
      inventoryItems: Array.isArray(newState.inventoryItems) ? newState.inventoryItems : DEFAULT_INVENTORY_ITEMS,
      users: Array.isArray(newState.users) ? newState.users : DEFAULT_USERS,
      departments: Array.isArray(newState.departments) ? newState.departments : DEFAULT_DEPARTMENTS,
      coa: Array.isArray(newState.coa) ? newState.coa : DEFAULT_COA,
      ratesByYear: newState.ratesByYear && typeof newState.ratesByYear === 'object'
        ? newState.ratesByYear
        : DEFAULT_RATES_BY_YEAR,
      companySettings: newState.companySettings || DEFAULT_COMPANY_SETTINGS,
      suppliers: Array.isArray(newState.suppliers) ? newState.suppliers : DEFAULT_SUPPLIERS,
      customers: Array.isArray(newState.customers) ? newState.customers : DEFAULT_CUSTOMERS,
      itemStocks: Array.isArray(newState.itemStocks) ? newState.itemStocks : DEFAULT_ITEM_STOCKS,
      productionProcesses: Array.isArray(newState.productionProcesses) ? newState.productionProcesses : DEFAULT_PRODUCTION_PROCESSES,
      dailyRates: Array.isArray(newState.dailyRates) ? newState.dailyRates : DEFAULT_DAILY_RATES,
      purchaseRequests: Array.isArray(newState.purchaseRequests) ? newState.purchaseRequests : DEFAULT_PURCHASE_REQUESTS,
      purchaseOrders: Array.isArray(newState.purchaseOrders) ? newState.purchaseOrders : DEFAULT_PURCHASE_ORDERS,
      purchaseInvoices: Array.isArray(newState.purchaseInvoices) ? newState.purchaseInvoices : DEFAULT_PURCHASE_INVOICES,
      cashBankAccounts: Array.isArray(newState.cashBankAccounts) ? newState.cashBankAccounts : DEFAULT_CASH_BANK_ACCOUNTS,
      cashBankReceipts: Array.isArray(newState.cashBankReceipts) ? newState.cashBankReceipts : DEFAULT_CASH_BANK_RECEIPTS,
      cashBankPayments: Array.isArray(newState.cashBankPayments) ? newState.cashBankPayments : DEFAULT_CASH_BANK_PAYMENTS,
      returnFromProdItems: Array.isArray(newState.returnFromProdItems) ? newState.returnFromProdItems : DEFAULT_RETURN_FROM_PROD_ITEMS
    }), {
      action: 'IMPORT',
      module: 'Sistem',
      details: 'Memulihkan data sistem secara penuh dari berkas cadangan JSON'
    });
    showToast('Data berhasil dipulihkan dari cadangan!', 'success');
  };

  const handleResetState = () => {
    updateAndSyncState(() => ({
      monthlyData: { [currentMonthDefault]: { income: 0, categories: [], debts: [], goals: [], expenses: [] } },
      deptPlanningItems: [],
      realizations: [],
      salesPlanItems: [],
      salesDeliveryItems: DEFAULT_SALES_DELIVERY_ITEMS,
      salesInvoiceItems: DEFAULT_SALES_INVOICE_ITEMS,
      fixedAssetItems: [],
      inventoryItems: DEFAULT_INVENTORY_ITEMS,
      users: DEFAULT_USERS,
      departments: DEFAULT_DEPARTMENTS,
      coa: DEFAULT_COA,
      ratesByYear: DEFAULT_RATES_BY_YEAR,
      companySettings: DEFAULT_COMPANY_SETTINGS,
      suppliers: DEFAULT_SUPPLIERS,
      customers: DEFAULT_CUSTOMERS,
      itemStocks: DEFAULT_ITEM_STOCKS,
      productionProcesses: DEFAULT_PRODUCTION_PROCESSES,
      dailyRates: DEFAULT_DAILY_RATES,
      purchaseRequests: DEFAULT_PURCHASE_REQUESTS,
      purchaseOrders: DEFAULT_PURCHASE_ORDERS,
      purchaseInvoices: DEFAULT_PURCHASE_INVOICES,
      cashBankAccounts: DEFAULT_CASH_BANK_ACCOUNTS,
      cashBankReceipts: DEFAULT_CASH_BANK_RECEIPTS,
      cashBankPayments: DEFAULT_CASH_BANK_PAYMENTS,
      returnFromProdItems: DEFAULT_RETURN_FROM_PROD_ITEMS
    }), {
      action: 'RESET',
      module: 'Sistem',
      details: 'Mereset seluruh data aplikasi ke kondisi awal'
    });
    showToast('Seluruh data berhasil dikosongkan.', 'info');
  };

  // Kas dan Bank Handlers
  const handleAddCashBankAccount = (account: CashBankAccount) => {
    updateAndSyncState(prev => ({
      ...prev,
      cashBankAccounts: [...(prev.cashBankAccounts || []), account]
    }), {
      action: 'CREATE',
      module: 'Kas dan Bank (Buku Bank)',
      details: `Menambah rekening bank baru [${account.accountCode}] ${account.accountName} (${account.currency})`
    });
    showToast(`Rekening bank ${account.accountName} berhasil ditambahkan`, 'success');
  };

  const handleUpdateCashBankAccount = (updated: CashBankAccount) => {
    updateAndSyncState(prev => ({
      ...prev,
      cashBankAccounts: (prev.cashBankAccounts || []).map(a => a.id === updated.id ? updated : a)
    }), {
      action: 'UPDATE',
      module: 'Kas dan Bank (Buku Bank)',
      details: `Memperbarui rekening bank [${updated.accountCode}] ${updated.accountName}`
    });
    showToast(`Rekening bank ${updated.accountName} berhasil diperbarui`, 'success');
  };

  const handleDeleteCashBankAccount = (id: string) => {
    const acc = (appState.cashBankAccounts || []).find(a => a.id === id);
    updateAndSyncState(prev => ({
      ...prev,
      cashBankAccounts: (prev.cashBankAccounts || []).filter(a => a.id !== id)
    }), {
      action: 'DELETE',
      module: 'Kas dan Bank (Buku Bank)',
      details: `Menghapus rekening bank ${acc ? acc.accountName : id}`
    });
    showToast('Rekening bank berhasil dihapus', 'success');
  };

  const handleAddCashBankReceipt = (receipt: CashBankReceipt) => {
    updateAndSyncState(prev => {
      const updatedAccounts = (prev.cashBankAccounts || []).map(acc => {
        if (acc.id === receipt.bankAccountId) {
          return {
            ...acc,
            currentBalance: acc.currentBalance + receipt.amount
          };
        }
        return acc;
      });
      return {
        ...prev,
        cashBankAccounts: updatedAccounts,
        cashBankReceipts: [receipt, ...(prev.cashBankReceipts || [])]
      };
    }, {
      action: 'CREATE',
      module: 'Kas dan Bank (Penerimaan)',
      details: `Menambah transaksi penerimaan [${receipt.receiptNumber}] senilai ${receipt.currency} ${receipt.amount}`
    });
    showToast(`Penerimaan ${receipt.receiptNumber} berhasil dicatat`, 'success');
  };

  const handleUpdateCashBankReceipt = (updated: CashBankReceipt) => {
    updateAndSyncState(prev => ({
      ...prev,
      cashBankReceipts: (prev.cashBankReceipts || []).map(r => r.id === updated.id ? updated : r)
    }), {
      action: 'UPDATE',
      module: 'Kas dan Bank (Penerimaan)',
      details: `Memperbarui transaksi penerimaan [${updated.receiptNumber}]`
    });
    showToast(`Penerimaan ${updated.receiptNumber} berhasil diperbarui`, 'success');
  };

  const handleDeleteCashBankReceipt = (id: string) => {
    const rec = (appState.cashBankReceipts || []).find(r => r.id === id);
    updateAndSyncState(prev => {
      let updatedAccounts = prev.cashBankAccounts || [];
      if (rec) {
        updatedAccounts = updatedAccounts.map(acc => {
          if (acc.id === rec.bankAccountId) {
            return {
              ...acc,
              currentBalance: acc.currentBalance - rec.amount
            };
          }
          return acc;
        });
      }
      return {
        ...prev,
        cashBankAccounts: updatedAccounts,
        cashBankReceipts: (prev.cashBankReceipts || []).filter(r => r.id !== id)
      };
    }, {
      action: 'DELETE',
      module: 'Kas dan Bank (Penerimaan)',
      details: `Menghapus transaksi penerimaan ${rec ? rec.receiptNumber : id}`
    });
    showToast('Transaksi penerimaan berhasil dihapus', 'success');
  };

  const handleAddCashBankPayment = (payment: CashBankPayment) => {
    updateAndSyncState(prev => {
      const updatedAccounts = (prev.cashBankAccounts || []).map(acc => {
        if (acc.id === payment.bankAccountId) {
          return {
            ...acc,
            currentBalance: acc.currentBalance - payment.amount
          };
        }
        return acc;
      });
      return {
        ...prev,
        cashBankAccounts: updatedAccounts,
        cashBankPayments: [payment, ...(prev.cashBankPayments || [])]
      };
    }, {
      action: 'CREATE',
      module: 'Kas dan Bank (Pembayaran)',
      details: `Menambah transaksi pembayaran [${payment.paymentNumber}] senilai ${payment.currency} ${payment.amount}`
    });
    showToast(`Pembayaran ${payment.paymentNumber} berhasil dicatat`, 'success');
  };

  const handleUpdateCashBankPayment = (updated: CashBankPayment) => {
    updateAndSyncState(prev => ({
      ...prev,
      cashBankPayments: (prev.cashBankPayments || []).map(p => p.id === updated.id ? updated : p)
    }), {
      action: 'UPDATE',
      module: 'Kas dan Bank (Pembayaran)',
      details: `Memperbarui transaksi pembayaran [${updated.paymentNumber}]`
    });
    showToast(`Pembayaran ${updated.paymentNumber} berhasil diperbarui`, 'success');
  };

  const handleDeleteCashBankPayment = (id: string) => {
    const pay = (appState.cashBankPayments || []).find(p => p.id === id);
    updateAndSyncState(prev => {
      let updatedAccounts = prev.cashBankAccounts || [];
      if (pay) {
        updatedAccounts = updatedAccounts.map(acc => {
          if (acc.id === pay.bankAccountId) {
            return {
              ...acc,
              currentBalance: acc.currentBalance + pay.amount
            };
          }
          return acc;
        });
      }
      return {
        ...prev,
        cashBankAccounts: updatedAccounts,
        cashBankPayments: (prev.cashBankPayments || []).filter(p => p.id !== id)
      };
    }, {
      action: 'DELETE',
      module: 'Kas dan Bank (Pembayaran)',
      details: `Menghapus transaksi pembayaran ${pay ? pay.paymentNumber : id}`
    });
    showToast('Transaksi pembayaran berhasil dihapus', 'success');
  };

  const handleSaveCompanySettings = (newSettings: CompanySettings) => {
    updateAndSyncState(prev => ({
      ...prev,
      companySettings: newSettings
    }), {
      action: 'UPDATE',
      module: 'Company Settings',
      details: `Memperbarui profil perusahaan: ${newSettings.companyName}`
    });
    showToast('Informasi perusahaan berhasil disimpan!', 'success');
  };

  // Clear audit logs handler
  const handleClearAuditLogs = async () => {
    setAuditLogs([]);
    localStorage.removeItem(AUDIT_LOGS_STORAGE_KEY);
    await clearAuditLogsFromServer();
    showToast('Riwayat log aktivitas berhasil dibersihkan.', 'info');
  };

  // ===================== AUTH GUARD: INITIAL LOGIN FORM =====================
  if (!currentUser) {
    return (
      <LoginView
        users={appState.users || DEFAULT_USERS}
        companySettings={appState.companySettings || DEFAULT_COMPANY_SETTINGS}
        onLogin={handleLogin}
      />
    );
  }

  // Check if activeTab is permitted for currentUser
  const isInventoryTab = activeTab === 'inventory' || activeTab.startsWith('inventory-') || activeTab.startsWith('mold-');
  const isSalesTab =
    activeTab === 'sales' ||
    activeTab === 'salesPlan' ||
    activeTab === 'sales-plan' ||
    activeTab === 'salesDelivery' ||
    activeTab === 'sales-delivery' ||
    activeTab === 'salesInvoice' ||
    activeTab === 'sales-invoice';
  const isBudgetTab =
    activeTab === 'budget' ||
    activeTab === 'dashboard' ||
    activeTab === 'planner' ||
    activeTab === 'deptPlanning' ||
    activeTab === 'realisasi';
  const isPurchaseTab =
    activeTab === 'purchase' ||
    activeTab === 'purchaseRequest' ||
    activeTab === 'purchase-request' ||
    activeTab === 'purchaseOrder' ||
    activeTab === 'purchase-order' ||
    activeTab === 'purchaseInvoice' ||
    activeTab === 'purchase-invoice';

  const isCashBankTab =
    activeTab === 'cashBank' ||
    activeTab === 'cash-bank' ||
    activeTab === 'buku-bank' ||
    activeTab === 'bukuBank' ||
    activeTab === 'penerimaan' ||
    activeTab === 'pembayaran';

  const isMasterDataTab =
    activeTab === 'dept' ||
    activeTab === 'supplier' ||
    activeTab === 'customer' ||
    activeTab === 'itemStock' ||
    activeTab === 'masterProcess' ||
    activeTab === 'dailyRates' ||
    activeTab === 'coa' ||
    activeTab === 'rate';

  const isTabPermitted =
    currentUser.role === 'admin' ||
    (isInventoryTab
      ? currentUser.permissions.includes('inventory')
      : isSalesTab
      ? (currentUser.permissions.includes('sales') ||
         currentUser.permissions.includes('salesPlan') ||
         currentUser.permissions.includes('salesDelivery') ||
         currentUser.permissions.includes('salesInvoice'))
      : isPurchaseTab
      ? (currentUser.permissions.includes('purchase') ||
         currentUser.permissions.includes('purchaseRequest') ||
         currentUser.permissions.includes('purchaseOrder') ||
         currentUser.permissions.includes('purchaseInvoice') ||
         currentUser.permissions.includes('purchase-invoice'))
      : isCashBankTab
      ? (currentUser.permissions.includes('cashBank') ||
         currentUser.permissions.includes('bukuBank') ||
         currentUser.permissions.includes('penerimaan') ||
         currentUser.permissions.includes('pembayaran') ||
         currentUser.role === 'finance' ||
         currentUser.role === 'dept_user')
      : isBudgetTab
      ? (currentUser.permissions.includes('budget') ||
         currentUser.permissions.includes('dashboard') ||
         currentUser.permissions.includes('planner') ||
         currentUser.permissions.includes('deptPlanning') ||
         currentUser.permissions.includes('realisasi'))
      : isMasterDataTab
      ? (currentUser.permissions.includes(activeTab as any) ||
         currentUser.permissions.includes('dept') ||
         currentUser.role === 'finance' ||
         currentUser.role === 'dept_user')
      : currentUser.permissions.includes(activeTab as any));

  const getInventoryCategoryFromTab = (tab: string): InventoryCategory => {
    if (tab === 'inventory-mold-sparepart' || tab.startsWith('mold-')) return 'mold_sparepart';
    if (tab === 'inventory-wip') return 'wip';
    if (tab === 'inventory-finish-good') return 'finish_good';
    if (tab === 'inventory-return-from-prod') return 'return_from_prod';
    return 'raw_material';
  };

  const handleInventoryCategoryChange = (cat: InventoryCategory) => {
    if (cat === 'raw_material') setActiveTab('inventory-raw-material');
    else if (cat === 'mold_sparepart') setActiveTab('inventory-mold-sparepart');
    else if (cat === 'wip') setActiveTab('inventory-wip');
    else if (cat === 'finish_good') setActiveTab('inventory-finish-good');
    else if (cat === 'return_from_prod') setActiveTab('inventory-return-from-prod');
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-800">
      <div className="flex-1 flex flex-row">
        {/* Navigation Sidebar with Mobile Drawer */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={tabId => {
            setActiveTab(tabId);
            setIsMobileMenuOpen(false);
          }}
          currentUser={currentUser}
          onLogout={handleLogout}
          companySettings={appState.companySettings || DEFAULT_COMPANY_SETTINGS}
          mobileOpen={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <Header
            selectedMonth={selectedMonth}
            onMonthChange={setSelectedMonth}
            onQuickAddDeptPlanning={() => handleOpenDeptModal('budget')}
            currentUser={currentUser}
            onLogout={handleLogout}
            companySettings={appState.companySettings || DEFAULT_COMPANY_SETTINGS}
            onToggleMobileMenu={() => setIsMobileMenuOpen(prev => !prev)}
            isSyncing={isSyncing}
            onManualSync={() => syncFromServer(true)}
            lastSyncedTime={lastSyncedTime}
          />

          {/* Toast Notification */}
          {toast && (
            <div className="px-4 sm:px-6 pt-4">
              <div
                className={`p-3.5 rounded-xl text-sm font-medium transition-all duration-300 flex items-center justify-between shadow-sm ${
                  toast.type === 'success'
                    ? 'bg-emerald-600 text-white'
                    : toast.type === 'error'
                    ? 'bg-rose-600 text-white'
                    : 'bg-indigo-600 text-white'
                }`}
              >
                <div className="flex items-center gap-2">
                  {toast.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                  ) : toast.type === 'error' ? (
                    <AlertCircle className="w-4 h-4 shrink-0" />
                  ) : (
                    <Info className="w-4 h-4 shrink-0" />
                  )}
                  <span>{toast.message}</span>
                </div>
                <button
                  onClick={() => setToast(null)}
                  className="text-white opacity-70 hover:opacity-100 p-1 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Tab Views */}
          <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto">
            {!isTabPermitted && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center text-amber-900 my-6">
                <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-2" />
                <h3 className="font-bold text-base">Akses Modul Terbatas</h3>
                <p className="text-xs text-amber-700 mt-1 max-w-md mx-auto">
                  Akun Anda ({currentUser.roleLabel}) tidak memiliki izin untuk mengakses halaman ini. Silakan hubungi Administrator untuk penyesuaian hak akses.
                </p>
                <button
                  onClick={() => setActiveTab(currentUser.permissions[0] || 'dashboard')}
                  className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-xs hover:bg-indigo-700 transition cursor-pointer"
                >
                  Kembali ke Menu Utama
                </button>
              </div>
            )}

            {isTabPermitted && (activeTab === 'dashboard' || activeTab === 'budget') && (
              <SummaryBudgetView
                items={appState.deptPlanningItems}
                departments={appState.departments}
                companySettings={appState.companySettings || DEFAULT_COMPANY_SETTINGS}
                activeBudgetTab="dashboard"
                onSwitchBudgetTab={tab => setActiveTab(tab)}
              />
            )}

            {isTabPermitted && activeTab === 'planner' && (
              <PlannerView
                data={currentMonthData}
                onSaveIncome={handleSaveIncome}
                onAddCategory={handleAddCategory}
                onDeleteCategory={handleDeleteCategory}
                onAddDebt={handleAddDebt}
                onDeleteDebt={handleDeleteDebt}
                onAddGoal={handleAddGoal}
                onDeleteGoal={handleDeleteGoal}
                activeBudgetTab="planner"
                onSwitchBudgetTab={tab => setActiveTab(tab)}
              />
            )}

            {isTabPermitted && activeTab === 'deptPlanning' && (
              <DeptPlanningView
                items={appState.deptPlanningItems}
                departments={appState.departments}
                currentUser={currentUser}
                onOpenModal={handleOpenDeptModal}
                onDeleteItem={handleDeleteDeptPlanningItem}
                onDeleteBatchItems={handleDeleteBatchDeptPlanningItems}
                onBatchUpsertItems={handleBatchUpsertDeptPlanningItems}
                onDeduplicateItems={handleDeduplicateDeptPlanningItems}
                activeBudgetTab="deptPlanning"
                onSwitchBudgetTab={tab => setActiveTab(tab)}
              />
            )}

            {isTabPermitted && (activeTab === 'salesPlan' || activeTab === 'sales-plan' || activeTab === 'sales') && (
              <SalesPlanView
                salesPlanItems={appState.salesPlanItems || []}
                departments={appState.departments}
                coaList={appState.coa}
                ratesByYear={appState.ratesByYear}
                onAddSalesPlan={handleAddSalesPlan}
                onUpdateSalesPlan={handleUpdateSalesPlan}
                onDeleteSalesPlan={handleDeleteSalesPlan}
                userDept={currentUser.deptCode}
                companySettings={appState.companySettings || DEFAULT_COMPANY_SETTINGS}
                activeSalesTab="sales-plan"
                onSwitchSalesTab={tab => setActiveTab(tab)}
              />
            )}

            {isTabPermitted && (activeTab === 'salesDelivery' || activeTab === 'sales-delivery') && (
              <SalesDeliveryView
                deliveryItems={appState.salesDeliveryItems || []}
                onAddDelivery={handleAddSalesDelivery}
                onUpdateDelivery={handleUpdateSalesDelivery}
                onDeleteDelivery={handleDeleteSalesDelivery}
                onGenerateInvoice={handleGenerateInvoiceFromDelivery}
                currentUser={currentUser}
                companySettings={appState.companySettings || DEFAULT_COMPANY_SETTINGS}
                activeSalesTab="sales-delivery"
                onSwitchSalesTab={tab => setActiveTab(tab)}
              />
            )}

            {isTabPermitted && (activeTab === 'salesInvoice' || activeTab === 'sales-invoice') && (
              <SalesInvoiceView
                invoiceItems={appState.salesInvoiceItems || []}
                deliveryItems={appState.salesDeliveryItems || []}
                ratesByYear={appState.ratesByYear}
                onAddInvoice={handleAddSalesInvoice}
                onUpdateInvoice={handleUpdateSalesInvoice}
                onDeleteInvoice={handleDeleteSalesInvoice}
                currentUser={currentUser}
                companySettings={appState.companySettings || DEFAULT_COMPANY_SETTINGS}
                activeSalesTab="sales-invoice"
                onSwitchSalesTab={tab => setActiveTab(tab)}
              />
            )}

            {isTabPermitted && activeTab === 'fixedAsset' && (
              <FixedAssetView
                fixedAssetItems={appState.fixedAssetItems || []}
                departments={appState.departments}
                coaList={appState.coa}
                ratesByYear={appState.ratesByYear}
                onAddFixedAsset={handleAddFixedAsset}
                onUpdateFixedAsset={handleUpdateFixedAsset}
                onDeleteFixedAsset={handleDeleteFixedAsset}
                onBatchImportFixedAsset={handleBatchImportFixedAsset}
                userDept={currentUser.deptCode}
                companySettings={appState.companySettings || DEFAULT_COMPANY_SETTINGS}
              />
            )}

            {isTabPermitted && isCashBankTab && (
              <CashBankView
                activeSubTab={activeTab}
                onSwitchSubTab={tab => setActiveTab(tab)}
                accounts={appState.cashBankAccounts || DEFAULT_CASH_BANK_ACCOUNTS}
                receipts={appState.cashBankReceipts || DEFAULT_CASH_BANK_RECEIPTS}
                payments={appState.cashBankPayments || DEFAULT_CASH_BANK_PAYMENTS}
                coaList={appState.coa}
                customers={appState.customers || []}
                suppliers={appState.suppliers || []}
                onAddAccount={handleAddCashBankAccount}
                onUpdateAccount={handleUpdateCashBankAccount}
                onDeleteAccount={handleDeleteCashBankAccount}
                onAddReceipt={handleAddCashBankReceipt}
                onUpdateReceipt={handleUpdateCashBankReceipt}
                onDeleteReceipt={handleDeleteCashBankReceipt}
                onAddPayment={handleAddCashBankPayment}
                onUpdatePayment={handleUpdateCashBankPayment}
                onDeletePayment={handleDeleteCashBankPayment}
                companySettings={appState.companySettings || DEFAULT_COMPANY_SETTINGS}
              />
            )}

            {isTabPermitted && isInventoryTab && (
              <InventoryView
                inventoryItems={appState.inventoryItems || DEFAULT_INVENTORY_ITEMS}
                coaList={appState.coa}
                ratesByYear={appState.ratesByYear}
                onAddInventoryItem={handleAddInventoryItem}
                onUpdateInventoryItem={handleUpdateInventoryItem}
                onDeleteInventoryItem={handleDeleteInventoryItem}
                onBatchImportInventory={handleBatchImportInventory}
                currentUser={currentUser}
                companySettings={appState.companySettings || DEFAULT_COMPANY_SETTINGS}
                activeSubCategory={getInventoryCategoryFromTab(activeTab)}
                activeGroupId={activeTab.startsWith('mold-') ? (activeTab === 'mold-oil' ? 'OIL_' : activeTab.replace('mold-', '').toUpperCase()) : undefined}
                onSubCategoryChange={handleInventoryCategoryChange}
                returnFromProdItems={appState.returnFromProdItems || DEFAULT_RETURN_FROM_PROD_ITEMS}
                departments={appState.departments || DEFAULT_DEPARTMENTS}
                onAddReturnFromProd={handleAddReturnFromProd}
                onUpdateReturnFromProd={handleUpdateReturnFromProd}
                onDeleteReturnFromProd={handleDeleteReturnFromProd}
                onCheckReturnFromProd={handleCheckReturnFromProd}
                onApproveReturnFromProd={handleApproveReturnFromProd}
                onRejectReturnFromProd={handleRejectReturnFromProd}
              />
            )}

            {isTabPermitted && activeTab === 'realisasi' && (
              <RealisasiBudgetView
                realizations={appState.realizations || []}
                budgetItems={appState.deptPlanningItems}
                departments={appState.departments}
                currentUser={currentUser}
                onOpenModal={handleOpenRealModal}
                onDeleteRealization={handleDeleteRealization}
                companySettings={appState.companySettings || DEFAULT_COMPANY_SETTINGS}
                activeBudgetTab="realisasi"
                onSwitchBudgetTab={tab => setActiveTab(tab)}
              />
            )}

            {isTabPermitted && activeTab === 'dept' && (
              <DeptMasterView
                departments={appState.departments}
                onAddDept={handleAddDept}
                onEditDept={handleEditDept}
                onDeleteDept={handleDeleteDept}
              />
            )}

            {isTabPermitted && activeTab === 'coa' && (
              <COAMasterView
                coaList={appState.coa}
                onAddCOA={handleAddCOA}
                onEditCOA={handleEditCOA}
                onDeleteCOA={handleDeleteCOA}
              />
            )}

            {isTabPermitted && activeTab === 'rate' && (
              <RateSettingsView
                ratesByYear={appState.ratesByYear}
                onSaveRate={handleSaveRate}
                onDeleteRate={handleDeleteRate}
              />
            )}

            {isTabPermitted && activeTab === 'auditLog' && (
              <AuditLogView
                auditLogs={auditLogs}
                departments={appState.departments}
                currentUser={currentUser}
                onClearLogs={handleClearAuditLogs}
                onRefreshLogs={() => syncFromServer(true)}
                isSyncing={isSyncing}
              />
            )}

            {isTabPermitted && activeTab === 'backup' && (
              <BackupDataView
                appState={appState}
                onRestoreState={handleRestoreState}
                onResetState={handleResetState}
              />
            )}

            {isTabPermitted && activeTab === 'users' && (
              <UserManagementView
                users={appState.users || DEFAULT_USERS}
                currentUser={currentUser}
                departments={appState.departments}
                onSaveUser={handleSaveUser}
                onDeleteUser={handleDeleteUser}
                onToggleStatus={handleToggleUserStatus}
              />
            )}

            {isTabPermitted && activeTab === 'settings' && (
              <CompanySettingsView
                companySettings={appState.companySettings || DEFAULT_COMPANY_SETTINGS}
                onSaveSettings={handleSaveCompanySettings}
              />
            )}

            {/* Purchase Views */}
            {isTabPermitted && (activeTab === 'purchase-request' || activeTab === 'purchaseRequest' || activeTab === 'purchase') && (
              <PurchaseRequestView
                purchaseRequests={appState.purchaseRequests || []}
                departments={appState.departments}
                itemStocks={appState.itemStocks || []}
                onAddPR={handleAddPR}
                onUpdatePR={handleUpdatePR}
                onDeletePR={handleDeletePR}
                onApprovePR={handleApprovePR}
                onRejectPR={handleRejectPR}
                onCreatePOFromPR={handleCreatePOFromPR}
              />
            )}

            {isTabPermitted && (activeTab === 'purchase-order' || activeTab === 'purchaseOrder') && (
              <PurchaseOrderView
                purchaseOrders={appState.purchaseOrders || []}
                suppliers={appState.suppliers || []}
                itemStocks={appState.itemStocks || []}
                purchaseRequests={appState.purchaseRequests || []}
                onAddPO={handleAddPO}
                onUpdatePO={handleUpdatePO}
                onDeletePO={handleDeletePO}
                onMarkStatusPO={handleMarkStatusPO}
              />
            )}

            {isTabPermitted && (activeTab === 'purchase-invoice' || activeTab === 'purchaseInvoice') && (
              <PurchaseInvoiceView
                invoices={appState.purchaseInvoices || []}
                purchaseOrders={appState.purchaseOrders || []}
                suppliers={appState.suppliers || []}
                ratesByYear={appState.ratesByYear}
                currentUser={currentUser}
                companySettings={appState.companySettings || DEFAULT_COMPANY_SETTINGS}
                onAddInvoice={handleAddPurchaseInvoice}
                onUpdateInvoice={handleUpdatePurchaseInvoice}
                onDeleteInvoice={handleDeletePurchaseInvoice}
                onCheckInvoice={handleCheckPurchaseInvoice}
                onApproveInvoice={handleApprovePurchaseInvoice}
                onRejectInvoice={handleRejectPurchaseInvoice}
                activePurchaseTab="purchase-invoice"
                onSwitchPurchaseTab={tab => setActiveTab(tab)}
              />
            )}

            {/* Master Data Views */}
            {isTabPermitted && activeTab === 'supplier' && (
              <MasterSupplierView
                suppliers={appState.suppliers || []}
                onAddSupplier={handleAddSupplier}
                onUpdateSupplier={handleUpdateSupplier}
                onDeleteSupplier={handleDeleteSupplier}
              />
            )}

            {isTabPermitted && activeTab === 'customer' && (
              <MasterCustomerView
                customers={appState.customers || []}
                onAddCustomer={handleAddCustomer}
                onUpdateCustomer={handleUpdateCustomer}
                onDeleteCustomer={handleDeleteCustomer}
              />
            )}

            {isTabPermitted && activeTab === 'itemStock' && (
              <MasterItemStockView
                itemStocks={appState.itemStocks || []}
                suppliers={appState.suppliers || []}
                coaList={appState.coa}
                onAddItemStock={handleAddItemStock}
                onBatchAddItemStock={handleBatchAddItemStock}
                onUpdateItemStock={handleUpdateItemStock}
                onDeleteItemStock={handleDeleteItemStock}
                onDeleteBatchItemStock={handleDeleteBatchItemStock}
              />
            )}

            {isTabPermitted && activeTab === 'masterProcess' && (
              <MasterProsesView
                processes={appState.productionProcesses || []}
                onAddProcess={handleAddProcess}
                onUpdateProcess={handleUpdateProcess}
                onDeleteProcess={handleDeleteProcess}
              />
            )}

            {isTabPermitted && activeTab === 'dailyRates' && (
              <MasterRateHarianView
                dailyRates={appState.dailyRates || []}
                onAddDailyRate={handleAddDailyRate}
                onUpdateDailyRate={handleUpdateDailyRate}
                onDeleteDailyRate={handleDeleteDailyRate}
              />
            )}
          </main>
        </div>
      </div>

      {/* Dept Planning Modal */}
      <DeptPlanningModal
        isOpen={isDeptModalOpen}
        onClose={() => setIsDeptModalOpen(false)}
        onSave={handleSaveDeptPlanningItem}
        departments={appState.departments}
        coaList={appState.coa}
        ratesByYear={appState.ratesByYear}
        existingItems={appState.deptPlanningItems}
        editingItem={editingDeptItem}
        initialSection={targetDeptSection}
      />

      {/* Realisasi Modal */}
      <RealisasiModal
        isOpen={isRealModalOpen}
        onClose={() => setIsRealModalOpen(false)}
        onSave={handleSaveRealization}
        departments={appState.departments}
        coaList={appState.coa}
        budgetItems={appState.deptPlanningItems}
        ratesByYear={appState.ratesByYear}
        editingRealization={editingRealization}
      />
    </div>
  );
}
