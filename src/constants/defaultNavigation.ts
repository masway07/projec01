import { NavGroupConfig, DynamicFormSchema } from '../types';

export const DEFAULT_NAVIGATION_CONFIG: NavGroupConfig[] = [
  {
    id: 'grp-workspace',
    group: 'Workspace',
    order: 1,
    items: [
      {
        id: 'budget',
        label: 'Budget',
        iconName: 'FileSpreadsheet',
        description: 'Perencanaan dan kontrol anggaran tahunan & departemen',
        dataSourceKey: 'deptPlanningItems',
        subItems: [
          { id: 'dashboard', label: 'Summary Budget', category: 'dashboard', dataSourceKey: 'monthlyData' },
          { id: 'planner', label: 'Rencana Anggaran', category: 'planner', dataSourceKey: 'monthlyData' },
          { id: 'deptPlanning', label: 'Dept Planning', category: 'deptPlanning', dataSourceKey: 'deptPlanningItems' },
          { id: 'realisasi', label: 'Realisasi Budget', category: 'realisasi', dataSourceKey: 'realizations' },
        ]
      },
      {
        id: 'cashBank',
        label: 'Kas dan bank',
        iconName: 'Wallet',
        description: 'Buku bank, penerimaan kas, dan voucher pembayaran',
        dataSourceKey: 'cashBankAccounts',
        subItems: [
          { id: 'buku-bank', label: 'Buku Bank', category: 'buku_bank', dataSourceKey: 'cashBankAccounts' },
          { id: 'penerimaan', label: 'Penerimaan', category: 'penerimaan', dataSourceKey: 'cashBankReceipts' },
          { id: 'pembayaran', label: 'Pembayaran', category: 'pembayaran', dataSourceKey: 'cashBankPayments' },
        ]
      },
      {
        id: 'purchase',
        label: 'Purchase',
        iconName: 'ShoppingCart',
        description: 'Pengadaan barang, penerimaan, faktur, retur & pembayaran',
        dataSourceKey: 'purchaseOrders',
        subItems: [
          { id: 'purchase-request', label: 'Purchase Request', category: 'purchase_request', dataSourceKey: 'purchaseRequests' },
          { id: 'purchase-order', label: 'Purchase Order', category: 'purchase_order', dataSourceKey: 'purchaseOrders' },
          { id: 'receive-item-order', label: 'Receive item order', category: 'receive_item_order', dataSourceKey: 'receiveItemOrders' },
          { id: 'purchase-invoice', label: 'Purchase Invoice', category: 'purchase_invoice', dataSourceKey: 'purchaseInvoices' },
          { id: 'return-item-order', label: 'Return Item Order', category: 'return_item_order', dataSourceKey: 'returnItemOrders' },
          { id: 'payment-purchase', label: 'Payment Purchase', category: 'payment_purchase', dataSourceKey: 'paymentPurchases' },
        ]
      },
      {
        id: 'sales',
        label: 'Sales',
        iconName: 'TrendingUp',
        description: 'Target sales, surat jalan delivery, dan faktur penjualan',
        dataSourceKey: 'salesInvoiceItems',
        subItems: [
          { id: 'sales-plan', label: 'Sales Plan', category: 'sales_plan', dataSourceKey: 'salesPlanItems' },
          { id: 'sales-delivery', label: 'Sales Delivery', category: 'sales_delivery', dataSourceKey: 'salesDeliveryItems' },
          { id: 'sales-invoice', label: 'Sales Invoice', category: 'sales_invoice', dataSourceKey: 'salesInvoiceItems' },
        ]
      },
      {
        id: 'fixedAsset',
        label: 'Fixed Asset',
        iconName: 'Box',
        description: 'Manajemen aktiva tetap, depresiasi, dan kategori aset',
        dataSourceKey: 'fixedAssetItems',
        subItems: [
          { id: 'fixedAsset', label: 'Semua Asset', category: 'all', dataSourceKey: 'fixedAssetItems' },
          { id: 'fixed-asset-land', label: 'Land', category: 'land', dataSourceKey: 'fixedAssetItems' },
          { id: 'fixed-asset-building', label: 'Building', category: 'building', dataSourceKey: 'fixedAssetItems' },
          { id: 'fixed-asset-vehicle', label: 'Vehicle', category: 'vehicle', dataSourceKey: 'fixedAssetItems' },
          { id: 'fixed-asset-electronic', label: 'Electronic', category: 'electronic', dataSourceKey: 'fixedAssetItems' },
          { id: 'fixed-asset-software', label: 'Software', category: 'software', dataSourceKey: 'fixedAssetItems' },
          { id: 'fixed-asset-intangible', label: 'Intangible Asset', category: 'intangible_asset', dataSourceKey: 'fixedAssetItems' },
          { id: 'fixed-asset-right-of-use', label: 'Right of use', category: 'right_of_use', dataSourceKey: 'fixedAssetItems' },
        ]
      },
      {
        id: 'inventory',
        label: 'Inventory',
        iconName: 'Boxes',
        description: 'Stok bahan baku, mold sparepart, WIP, finish good & retur',
        dataSourceKey: 'inventoryItems',
        subItems: [
          { id: 'inventory-raw-material', label: 'Raw Material', category: 'raw_material', dataSourceKey: 'inventoryItems' },
          { 
            id: 'inventory-mold-sparepart', 
            label: 'Mold & Spare Part', 
            category: 'mold_sparepart',
            dataSourceKey: 'inventoryItems',
            subItems: [
              { id: 'mold-2rcf', label: 'CF Dies 2R (CF2R)', category: '2RCF' },
              { id: 'mold-4rcf', label: 'CF Dies 4R (CFD4R)', category: '4RCF' },
              { id: 'mold-2rmc', label: 'CF Machine 2R (CFM2R)', category: '2RMC' },
              { id: 'mold-2rtl', label: 'Tools 2R', category: '2RTL' },
              { id: 'mold-4rtl', label: 'Tools 4R', category: '4RTL' },
              { id: 'mold-mtel', label: 'Electric', category: 'MTEL' },
              { id: 'mold-2rsp', label: '2R Spare Cons (2Rcon)', category: '2RSP' },
              { id: 'mold-2rhp', label: '2R Holder Part (2RHP)', category: '2RHP' },
              { id: 'mold-4rsp', label: '4R Spare Cons (4Rcon)', category: '4RSP' },
              { id: 'mold-4rhl', label: '4R Holder List (4RHL)', category: '4RHL' },
              { id: 'mold-4rhp', label: '4R Holder Part (4RHP)', category: '4RHP' },
              { id: 'mold-4rbs', label: 'Bush1', category: '4RBS' },
              { id: 'mold-mtmc', label: 'Mekanik (Mech)', category: 'MTMC' },
              { id: 'mold-mtbo', label: 'Belt & Oring', category: 'MTBO' },
              { id: 'mold-prdw', label: 'Dowa', category: 'PRDW' },
              { id: 'mold-prfr', label: 'Frame', category: 'PRFR' },
              { id: 'mold-prsh', label: 'Shot Blast', category: 'PRSH' },
              { id: 'mold-oil', label: 'Oil', category: 'OIL_' },
            ]
          },
          { id: 'inventory-wip', label: 'Work In Process', category: 'wip', dataSourceKey: 'inventoryItems' },
          { id: 'inventory-finish-good', label: 'Finish Good', category: 'finish_good', dataSourceKey: 'inventoryItems' },
          { id: 'inventory-return-from-prod', label: 'Return from Prod', category: 'return_from_prod', dataSourceKey: 'returnFromProdItems' },
        ]
      },
      {
        id: 'production',
        label: 'Production',
        iconName: 'Factory',
        description: 'Lot number tracing, jadwal mesin produksi & laporan NG',
        dataSourceKey: 'lotNumbers',
        subItems: [
          { id: 'production-lot-number', label: 'Lot Number', category: 'lot_number', dataSourceKey: 'lotNumbers' },
          { id: 'production-schedule', label: 'Production Schedule', category: 'production_schedule', dataSourceKey: 'productionSchedules' },
          { id: 'production-ng-report', label: 'NG Report', category: 'ng_report', dataSourceKey: 'ngReports' },
        ]
      },
      {
        id: 'report',
        label: 'Report',
        iconName: 'FileText',
        description: 'Buku Besar, Neraca, Neraca Saldo, dan Laba Rugi',
        dataSourceKey: 'coa',
        subItems: [
          { id: 'report-ledger', label: 'Ledger', category: 'ledger', dataSourceKey: 'coa' },
          { id: 'report-balance-sheet', label: 'Balance sheet', category: 'balance_sheet', dataSourceKey: 'coa' },
          { id: 'report-trial-balance', label: 'Trial Balance', category: 'trial_balance', dataSourceKey: 'coa' },
          { id: 'report-profit-loss', label: 'profit / Loss', category: 'profit_loss', dataSourceKey: 'coa' },
        ]
      },
    ]
  },
  {
    id: 'grp-master',
    group: 'Master Data',
    order: 2,
    items: [
      { id: 'dept', label: 'Master Department', iconName: 'Building2', dataSourceKey: 'departments', description: 'Kode dan nama unit departemen perusahaan' },
      { id: 'supplier', label: 'Supplier', iconName: 'Truck', dataSourceKey: 'suppliers', description: 'Data rekanan vendor / pemasok' },
      { id: 'customer', label: 'Customer', iconName: 'Briefcase', dataSourceKey: 'customers', description: 'Data pelanggan / mitra pembeli' },
      { id: 'itemStock', label: 'Item Stock', iconName: 'PackageCheck', dataSourceKey: 'itemStocks', description: 'Master part number, nama part, dan kategori' },
      { id: 'masterProcess', label: 'Proses Produksi', iconName: 'Workflow', dataSourceKey: 'productionProcesses', description: 'Stasiun kerja dan routing proses manufaktur' },
      { id: 'dailyRates', label: 'Rate Harian (BI & KMK)', iconName: 'CircleDollarSign', dataSourceKey: 'dailyRates', description: 'Kurs acuan Bank Indonesia & Keputusan Menkeu' },
      { id: 'coa', label: 'COA', iconName: 'BookOpen', dataSourceKey: 'coa', description: 'Bagan akun standar akuntansi keuangan' },
      { id: 'rate', label: 'Exchange Rate', iconName: 'ArrowLeftRight', dataSourceKey: 'ratesByYear', description: 'Kurs konversi tahunan USD/IDR/JPY' },
    ]
  },
  {
    id: 'grp-admin',
    group: 'Administration',
    order: 3,
    items: [
      { id: 'users', label: 'Manajemen User', iconName: 'Users', dataSourceKey: 'users', description: 'Hak akses akun, role, dan izin modul user' },
      { id: 'auditLog', label: 'Log Activity (Audit)', iconName: 'History', dataSourceKey: 'auditLogs', description: 'Perekaman jejak audit perubahan data' },
      { id: 'backup', label: 'Backup & Data', iconName: 'UploadCloud', description: 'Ekspor dan impor cadangan database' },
      { id: 'settings', label: 'Pengaturan Perusahaan', iconName: 'Settings', dataSourceKey: 'companySettings', description: 'Identitas logo, nama perusahaan, dan alamat' },
    ]
  },
  {
    id: 'grp-system',
    group: 'Sistem',
    order: 4,
    items: [
      {
        id: 'developer',
        label: 'Developer',
        iconName: 'Code2',
        description: 'Visual Drag & Drop Menu Builder, Form Generator, & Data Source Integrator',
        dataSourceKey: 'navigationConfig'
      }
    ]
  }
];

export const INITIAL_DYNAMIC_FORM_SCHEMAS: DynamicFormSchema[] = [
  {
    id: 'schema-custom-project',
    menuId: 'custom-project-tracking',
    name: 'Form Project & Task Tracker',
    description: 'Form manajemen proyek khusus departemen dengan integrasi PIC & Dept',
    targetCollectionKey: 'custom_project_tasks',
    submitButtonText: 'Simpan Data Project',
    allowAdd: true,
    allowEdit: true,
    allowDelete: true,
    allowExport: true,
    createdAt: '2026-03-20T08:00:00.000Z',
    updatedAt: '2026-03-20T08:00:00.000Z',
    fields: [
      {
        id: 'f-code',
        key: 'projectCode',
        label: 'Kode Proyek',
        type: 'text',
        placeholder: 'Contoh: PRJ-2026-001',
        required: true,
        gridSpan: 2
      },
      {
        id: 'f-name',
        key: 'projectName',
        label: 'Nama Proyek / Aktivitas',
        type: 'text',
        placeholder: 'Nama proyek atau pekerjaan',
        required: true,
        gridSpan: 2
      },
      {
        id: 'f-dept',
        key: 'deptCode',
        label: 'Departemen Penanggung Jawab',
        type: 'lookup_dept',
        required: true,
        gridSpan: 2
      },
      {
        id: 'f-target',
        key: 'targetDate',
        label: 'Target Selesai (Deadline)',
        type: 'date',
        required: true,
        gridSpan: 2
      },
      {
        id: 'f-budget',
        key: 'budgetEstimateIDR',
        label: 'Estimasi Budget (IDR)',
        type: 'currency_idr',
        required: false,
        gridSpan: 2
      },
      {
        id: 'f-status',
        key: 'status',
        label: 'Status Proyek',
        type: 'select',
        options: ['Planning', 'In Progress', 'Testing / Review', 'Completed', 'On Hold'],
        defaultValue: 'Planning',
        required: true,
        gridSpan: 2
      },
      {
        id: 'f-desc',
        key: 'description',
        label: 'Deskripsi & Deliverables',
        type: 'textarea',
        placeholder: 'Rincian target, spesifikasi, dan catatan penting',
        gridSpan: 4
      }
    ]
  },
  {
    id: 'schema-custom-vendor-evaluation',
    menuId: 'custom-vendor-eval',
    name: 'Form Evaluasi Vendor Berkala',
    description: 'Form penilaian KPI supplier: Delivery Time, Quality Rating, & Harga',
    targetCollectionKey: 'custom_vendor_evaluations',
    submitButtonText: 'Simpan Penilaian Vendor',
    allowAdd: true,
    allowEdit: true,
    allowDelete: true,
    allowExport: true,
    createdAt: '2026-03-21T09:00:00.000Z',
    updatedAt: '2026-03-21T09:00:00.000Z',
    fields: [
      {
        id: 'f-eval-no',
        key: 'evaluationNo',
        label: 'No. Evaluasi',
        type: 'text',
        placeholder: 'EVAL-SUP-2026-001',
        required: true,
        gridSpan: 2
      },
      {
        id: 'f-sup',
        key: 'supplierId',
        label: 'Supplier Terkait',
        type: 'lookup_supplier',
        required: true,
        gridSpan: 2
      },
      {
        id: 'f-period',
        key: 'evalPeriod',
        label: 'Periode Evaluasi',
        type: 'select',
        options: ['Q1 - 2026', 'Q2 - 2026', 'Q3 - 2026', 'Q4 - 2026', 'Tahunan 2026'],
        defaultValue: 'Q1 - 2026',
        required: true,
        gridSpan: 2
      },
      {
        id: 'f-score-qty',
        key: 'qualityScore',
        label: 'Skor Kualitas Part (1 - 100)',
        type: 'number',
        placeholder: '95',
        required: true,
        gridSpan: 2
      },
      {
        id: 'f-score-deliv',
        key: 'deliveryScore',
        label: 'Skor Ketepatan Pengiriman (1 - 100)',
        type: 'number',
        placeholder: '90',
        required: true,
        gridSpan: 2
      },
      {
        id: 'f-pass',
        key: 'isQualified',
        label: 'Rekomendasi Lolos Approved Vendor List',
        type: 'switch',
        defaultValue: true,
        gridSpan: 2
      },
      {
        id: 'f-comments',
        key: 'evalComments',
        label: 'Catatan & Rekomendasi Audit',
        type: 'textarea',
        placeholder: 'Tindakan pencegahan atau apresiasi vendor',
        gridSpan: 4
      }
    ]
  }
];

export const INITIAL_CUSTOM_DATASETS: Record<string, any[]> = {
  custom_project_tasks: [
    {
      id: 'prj-001',
      projectCode: 'PRJ-2026-ENG01',
      projectName: 'Implementasi Poka-Yoke Sensor Line CF-2',
      deptCode: 'ENG',
      targetDate: '2026-04-15',
      budgetEstimateIDR: 45000000,
      status: 'In Progress',
      description: 'Pemasangan proximity optical sensor untuk deteksi misfeed dies cold forging',
      createdAt: '2026-03-10T08:00:00.000Z',
      updatedAt: '2026-03-15T10:00:00.000Z'
    },
    {
      id: 'prj-002',
      projectCode: 'PRJ-2026-QC02',
      projectName: 'Upgrade Mikrometer Digital & Gauge Kalibrasi',
      deptCode: 'QC',
      targetDate: '2026-05-01',
      budgetEstimateIDR: 28000000,
      status: 'Planning',
      description: 'Pengadaan 6 unit mikrometer Mitutoyo Bluetooth export data ke QC Database',
      createdAt: '2026-03-18T09:30:00.000Z',
      updatedAt: '2026-03-18T09:30:00.000Z'
    }
  ],
  custom_vendor_evaluations: [
    {
      id: 'eval-001',
      evaluationNo: 'EVAL-SUP-2026-001',
      supplierId: 'sup-001',
      evalPeriod: 'Q1 - 2026',
      qualityScore: 98,
      deliveryScore: 95,
      isQualified: true,
      evalComments: 'Kualitas wire rod JIS G3507 stabil, defect rate di bawah 0.1%',
      createdAt: '2026-03-21T09:00:00.000Z',
      updatedAt: '2026-03-21T09:00:00.000Z'
    }
  ]
};
