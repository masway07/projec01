export type DeptPlanningSection = 'budget' | 'costdown' | 'plan';

export interface MonthlyDistribution {
  Jan: number;
  Feb: number;
  Mar: number;
  Apr: number;
  Mei: number;
  Jun: number;
  Jul: number;
  Agu: number;
  Sep: number;
  Okt: number;
  Nov: number;
  Des: number;
  [key: string]: number;
}

export interface DeptPlanningItem {
  id: string;
  code: string;
  section: DeptPlanningSection;
  year: number;
  deptCode: string;
  deptName: string;
  accountNo: string;
  accountName: string;
  item: string;
  type: string;
  costCategory: string;
  budgetStartDate: string;
  indicatorDate: string;
  businessFunction: string;
  currency: string;
  amount: number;
  rate: number;
  totalUSD: number;
  monthlyTotalUSD: number;
  monthly: MonthlyDistribution;
  notes?: string;
  updatedAt: string;
}

export interface Department {
  code: string;
  name: string;
}

export interface COA {
  code: string;
  name: string;
  parent: string;
  type: string;
  nature: 'debit' | 'credit' | '';
}

export type CoaAccount = COA;

export interface Category {
  id: string;
  name: string;
  budget: number;
}

export interface Debt {
  id: string;
  name: string;
  monthlyPayment: number;
  remainingDebt: number;
}

export interface Goal {
  id: string;
  name: string;
  monthlyAllocation: number;
  targetAmount: number;
}

export interface Expense {
  id: string;
  date: string;
  categoryId: string;
  amount: number;
  note: string;
}

export interface MonthData {
  income: number;
  categories: Category[];
  debts: Debt[];
  goals: Goal[];
  expenses: Expense[];
  deptPlanning?: {
    budgets?: any[];
    costDowns?: any[];
    planBs?: any[];
    items?: DeptPlanningItem[];
  };
}

export interface ExchangeRates {
  IDR: number;
  JPY: number;
  CNY: number;
  EUR?: number;
  [key: string]: number | undefined;
}

export interface BudgetRealization {
  id: string;
  date: string;
  deptCode: string;
  accountNo: string;
  accountName: string;
  month: string;
  name: string;
  type: string;
  reason: string;
  currency: string;
  price: number;
  rate: number;
  priceUSD: number;
  year: number;
  createdAt?: string;
}

export interface SalesPlanItem {
  id: string;
  deptCode: string;
  customer: string;
  item: string;
  coaCode: string;
  coaName?: string;
  currency: string;
  year: number;
  rate: number;
  monthly: MonthlyDistribution;
  totalUSD: number;
  status: 'Draft' | 'Approved' | 'Ongoing' | 'Completed' | string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type SalesDeliveryStatus = 'Draft' | 'Scheduled' | 'In Transit' | 'Delivered' | 'Received' | 'Cancelled';

export interface SalesDeliveryItem {
  id: string;
  deliveryNo: string; // e.g. "DO/2026/09/001"
  poNumber: string; // Customer PO No, e.g. "PO-AHM-2026-081"
  deliveryDate: string; // YYYY-MM-DD
  customer: string; // e.g. "PT Astra Honda Motor"
  partNo?: string; // e.g. "10110-AHM-001"
  itemName: string; // e.g. "Flange Collar Comp 12mm"
  qty: number; // e.g. 5000
  uom: string; // PCS, BOX, SET
  vehiclePlate?: string; // e.g. "B 9842 TYN"
  driverName?: string; // e.g. "Budi Santoso"
  destinationAddress?: string; // e.g. "Plant Pegangsaan Dua, Kelapa Gading"
  recipientName?: string; // Penerima gudang customer
  status: SalesDeliveryStatus;
  notes?: string;
  invoiced?: boolean; // True jika sudah dibuatkan invoice
  invoiceNo?: string; // No Invoice terkait jika sudah dibuatkan
  unitPriceUSD?: number; // Referensi harga satuan
  totalAmountUSD?: number; // Referensi total amount USD
  createdAt?: string;
  updatedAt?: string;
}

export type SalesInvoiceStatus = 'Draft' | 'Sent' | 'Partially Paid' | 'Paid' | 'Overdue' | 'Cancelled';

export interface SalesInvoiceItem {
  id: string;
  invoiceNo: string; // e.g. "INV/2026/09/0042"
  taxInvoiceNo?: string; // e.g. "010.002-26.19283746"
  deliveryNo?: string; // Referensi DO No, e.g. "DO/2026/09/001"
  poNumber?: string; // Referensi PO Customer
  invoiceDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  customer: string; // Customer Name
  customerTaxId?: string; // NPWP Customer
  customerAddress?: string;
  description: string; // Keterangan Tagihan
  currency: 'USD' | 'IDR' | 'JPY' | string;
  rate: number; // Kurs terhadap USD
  subtotal: number; // DPP (Dasar Pengenaan Pajak)
  taxRatePercent: number; // e.g. 11% or 0%
  taxAmount: number; // Nilai PPN
  totalAmount: number; // Total Tagihan (DPP + PPN)
  totalAmountUSD: number; // Nilai setara USD
  totalAmountIDR?: number; // Nilai setara IDR
  status: SalesInvoiceStatus;
  paymentDate?: string; // Tanggal Pembayaran
  bankAccount?: string; // Rekening Tujuan Transfer
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface FixedAssetMonthlyDepreciation {
  Jan: number;
  Feb: number;
  Mar: number;
  Apr: number;
  May: number;
  Jun: number;
  Jul: number;
  Aug: number;
  Sep: number;
  Oct: number;
  Nov: number;
  Dec: number;
}

export interface FixedAssetItem {
  id: string;
  kiNo: string; // KI NO
  code?: string; // alias for kiNo
  invoiceNo: string; // Invoice No
  description: string; // Asset description
  name?: string; // alias for description
  qty: number; // Qty
  acquisitionDate: string; // Acquisition date (YYYY-MM-DD)
  deptCode: string; // Department
  coaCode: string;
  coaName?: string;
  currency: string;
  originalCost: number; // Cost in original currency
  rate: number;
  acquisitionCostUSD: number; // Acquisition cost USD
  value?: number; // legacy alias
  usd?: number; // legacy alias

  // Depreciation Accounts
  depreciationExpenseCoaCode?: string; // Akun Beban Depresiasi (e.g. 5500027)
  depreciationExpenseCoaName?: string;
  accumulatedDepreciationCoaCode?: string; // Akun Akumulasi Depresiasi (e.g. 1120003)
  accumulatedDepreciationCoaName?: string;

  // Capitalization & Useful Life
  assetType: 'NEW' | 'CAPITALIZATION';
  parentAssetId?: string;
  parentAssetKiNo?: string;
  parentAssetDescription?: string;
  usefulLifeMonths: number; // Masa manfaat (bulan)
  usefulLifeYears?: number; // Masa manfaat (tahun)

  // Depreciation Schedule
  priorAccumDepreciation: number; // Accumulated depreciation prior year (e.g. 2025)
  monthlyDepreciation: FixedAssetMonthlyDepreciation;
  totalDepreciationYear: number; // Total depreciation (Jan - Dec)
  accumulatedDepreciationUSD: number; // Ending accumulated depreciation USD
  netBookValueUSD: number; // Net book value USD

  status: 'Active' | 'In Use' | 'Maintenance' | 'Disposed' | string;
  year?: number;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type InventoryCategory = 'raw_material' | 'mold_sparepart' | 'wip' | 'finish_good' | 'return_from_prod';

export type ReturnCondition = 'good' | 'sortir' | 'scrap' | 'rework' | 'damaged';
export type ReturnStatus = 'draft' | 'checked' | 'approved' | 'rejected';

export interface ReturnFromProdItem {
  id: string;
  returnNo: string; // e.g. "RFP/2026/09/001"
  returnNumber?: string; // alias
  date: string; // YYYY-MM-DD
  itemCode: string;
  partNo?: string;
  itemName: string;
  category: InventoryCategory;
  qty: number; // Return quantity
  returnedQty?: number; // alias
  uom: string;
  deptCode?: string; // Production department
  deptName?: string;
  productionBatchNo?: string; // No Batch / SPK
  workOrderNo?: string; // No Work Order (WO)
  shift?: string; // Shift 1, Shift 2, Shift 3
  reason: string; // Sisa Bahan, Kelebihan Pengambilan, Pergantian Dies, Sortir, dll.
  productionLine?: string; // Line Cold Forging 2R, Line Stamping 4R, Machining, dll.
  condition: ReturnCondition; // 'good' | 'sortir' | 'scrap' | 'rework' | 'damaged'
  location?: string; // Lokasi rak/bin gudang
  receivedLocation?: string; // Lokasi rak/bin gudang (alias)
  returnedBy?: string; // Nama penyerah dari produksi
  receivedBy?: string; // Petugas gudang penerima
  status: ReturnStatus; // 'draft' | 'checked' | 'approved' | 'rejected'
  checkedBy?: string;
  checkedAt?: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  rejectReason?: string;
  rejectionReason?: string; // alias
  unitCostUSD?: number;
  totalValueUSD?: number;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface InventoryItem {
  id: string;
  itemCode: string; // Kode Barang / SKU
  partNo?: string; // Part Number
  name: string; // Nama Barang / Spesifikasi
  category: InventoryCategory; // Raw Material, Mold & Spare Part, WIP, Finish Good
  uom: string; // Satuan (Kg, Pcs, Sheet, Mtr, Set, Roll, Box)
  coaCode: string; // e.g. 1080001, 1080005, 1080003, 1080004
  coaName?: string;
  location?: string; // Gudang / Rak / Line (e.g. WH-RM-01, WH-MOLD, LINE-1, WH-FG)

  // Quantities
  beginningQty: number; // Saldo Awal
  inQty: number; // Masuk / Penerimaan
  outQty: number; // Keluar / Pemakaian
  endingQty: number; // Saldo Akhir (Beginning + In - Out)
  minimumStock: number; // Safety Stock / Reorder Point

  // Currency & Valuation
  currency: string; // USD, IDR, JPY
  unitCost: number; // Harga Satuan
  rate: number; // Exchange rate to USD
  unitCostUSD: number; // Harga Satuan dalam USD
  totalValueUSD: number; // Nilai Total USD (endingQty * unitCostUSD)
  totalValueIDR?: number; // Nilai Total IDR

  status?: 'Normal' | 'Low Stock' | 'Overstock' | 'Out of Stock';
  notes?: string;
  updatedAt?: string;
  createdAt?: string;
}

// ==========================================
// Purchase Types
// ==========================================

export interface PurchaseRequestLine {
  id: string;
  itemCode?: string;
  itemName: string;
  description?: string;
  qty: number;
  uom: string;
  estimatedPrice: number;
  currency: string;
  totalEstimated: number;
  requiredDate?: string;
  notes?: string;
}

export type PurchaseRequestItem = PurchaseRequestLine;

export interface PurchaseRequest {
  id: string;
  prNumber: string; // e.g. PR/2026/03/001
  date: string; // YYYY-MM-DD
  deptCode: string;
  deptName: string;
  requesterName: string;
  purpose: string;
  priority: 'normal' | 'urgent' | 'high';
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'ordered' | 'po_created';
  totalAmountEstimated: number;
  currency: string;
  items: PurchaseRequestLine[];
  approvedBy?: string;
  approvalDate?: string;
  approvedAt?: string;
  linkedPoNumber?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseOrderLine {
  id: string;
  itemCode?: string;
  itemName: string;
  description?: string;
  qty: number;
  uom: string;
  unitPrice: number;
  totalPrice: number;
  notes?: string;
}

export type PurchaseOrderItem = PurchaseOrderLine;

export interface PurchaseOrder {
  id: string;
  poNumber: string; // e.g. PO/2026/03/001
  date: string; // YYYY-MM-DD
  prNumber?: string; // Linked PR reference
  supplierCode: string;
  supplierName: string;
  supplierAddress?: string;
  supplierContact?: string;
  supplierEmail?: string;
  supplierPhone?: string;
  deliveryDate: string;
  paymentTerms: string; // e.g. NET 30, COD
  currency: string;
  rate: number;
  subtotal: number;
  taxPercent: number; // e.g. 11% PPN
  taxAmount: number;
  grandTotal: number;
  grandTotalUSD?: number;
  status: 'draft' | 'approved' | 'sent' | 'received' | 'confirmed' | 'completed' | 'cancelled';
  items: PurchaseOrderLine[];
  deliveryAddress?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// Purchase Invoice Types (3-Way Matching: PO + DO + Invoice)
// ==========================================

export type PurchaseInvoiceStatus = 'draft' | 'unpaid' | 'partially_paid' | 'paid' | 'overdue' | 'cancelled';

export interface PurchaseInvoiceLine {
  id: string;
  itemCode?: string;
  itemName: string;
  description?: string;
  poQty?: number; // Qty yang tertera pada Purchase Order
  doQty: number; // Qty barang fisik yang diterima pada Surat Jalan / Delivery Order
  uom: string;
  unitPrice: number; // Harga satuan sesuai PO
  totalPrice: number; // doQty * unitPrice
  notes?: string;
}

export interface PurchaseInvoice {
  id: string;
  invoiceNo: string; // Nomor Tagihan / Faktur dari Supplier (e.g. INV-SUP/2026/03/001)
  taxInvoiceNo?: string; // No Seri Faktur Pajak PPN (e.g. 010.002-26.88219401)
  invoiceDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD (Jatuh tempo pembayaran)

  // 3-Way Match References
  poNumber: string; // Referensi No PO yang sudah dikirim ke supplier (e.g. PO/2026/03/001)
  poDate?: string;
  deliveryOrderNo: string; // Referensi Bukti Surat Jalan / Delivery Order yang diterima gudang (e.g. DO-SUP/2026/03/042)
  deliveryOrderDate?: string; // Tanggal penerimaan barang fisik di pabrik
  receivedBy?: string; // Petugas gudang / QC yang menerima barang

  supplierCode: string;
  supplierName: string;
  supplierNpwp?: string;
  supplierAddress?: string;
  paymentTerms: string; // e.g. NET 14, NET 30, NET 45, NET 60, COD
  bankAccount?: string; // Rekening bank supplier untuk pelunasan tagihan

  currency: string; // USD, IDR, JPY, EUR
  rate: number; // Kurs terhadap USD atau IDR
  subtotal: number; // DPP (Dasar Pengenaan Pajak)
  taxPercent: number; // Persentase PPN (misal 11% atau 0% Kawasan Berikat)
  taxAmount: number; // Nilai PPN
  discountAmount?: number;
  freightCost?: number; // Biaya pengiriman / handling jika ada
  grandTotal: number; // subtotal + taxAmount - discount + freight
  grandTotalUSD?: number;

  paidAmount?: number; // Jumlah yang telah dibayarkan
  remainingAmount?: number; // Sisa saldo yang belum dibayar
  paymentDate?: string; // Tanggal pelunasan

  status: PurchaseInvoiceStatus;
  matchStatus: 'matched' | 'discrepancy' | 'pending_verification'; // Status 3-Way Matching

  items: PurchaseInvoiceLine[];
  notes?: string;
  checkedBy?: string;
  checkedAt?: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// Master Data Types
// ==========================================

export interface Supplier {
  id: string;
  code: string; // e.g. SUP-001
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  paymentTerms: string; // e.g. NET 30, COD
  npwp?: string;
  currency: string; // IDR, USD, JPY
  isActive: boolean;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Customer {
  id: string;
  code: string; // e.g. CUST-001
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  paymentTerms: string; // e.g. NET 30, NET 60
  npwp?: string;
  currency: string; // IDR, USD
  isActive: boolean;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ItemStockSupplier {
  supplierId: string;
  supplierCode: string;
  supplierName: string;
  price?: number;
  currency?: string;
  leadTimeDays?: number;
  isPrimary?: boolean;
  notes?: string;
}

export interface ItemStock {
  id: string;
  code: string; // SKU / Item Code (e.g. RM-STEEL-01, MLD-CAV-04)
  name: string;
  specification?: string; // Spek / Type Barang (e.g. SKD11 / Dia 28mm / JIS G4051)
  category: 'raw_material' | 'mold_sparepart' | 'wip' | 'finish_good' | 'general';
  uom: string; // Pcs, Kg, Sheet, Set, Box, Roll
  inventoryAccountCode: string; // Akun Inventory (Persediaan di COA)
  inventoryAccountName?: string;
  expenseAccountCode: string; // Akun Expense (Beban / Biaya di COA)
  expenseAccountName?: string;
  minimumStock: number;
  safetyStock: number;
  standardCost: number; // Estimasi harga beli
  standardPrice: number; // Harga jual standar
  currency: string;
  location?: string;
  isActive: boolean;
  notes?: string;
  suppliers?: ItemStockSupplier[]; // Supplier-supplier yang menyediakan item stock ini
  supplierIds?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductionProcess {
  id: string;
  code: string; // e.g. PRS-CF01, PRS-INJ01, PRS-CNC01
  name: string; // e.g. Cold Forging, CNC Machining, Ultrasonic Cleaning
  workCenter: string; // Work Center / Machine / Line
  cycleTimeMinutes: number; // Waktu siklus standar (menit)
  standardCapacityPerHour: number; // Kapasitas output per jam (pcs)
  description?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface DailyRate {
  id: string;
  date: string; // YYYY-MM-DD
  currency: string; // USD, JPY, EUR, SGD, CNY, GBP
  rateBI: number; // Kurs Bank Indonesia (Transaksi / Kurs Tengah)
  rateKMK: number; // Kurs Keputusan Menteri Keuangan (Pajak & Bea Cukai)
  source?: string; // No SK KMK / Referensi
  notes?: string;
  updatedAt?: string;
}

export interface CashBankAccount {
  id: string;
  accountCode: string; // e.g. 1111-01, 1112-01
  accountName: string; // e.g. Bank BCA USD, Bank Mandiri IDR, Kas Kecil IDR
  bankName: string; // e.g. Bank Central Asia, Bank Mandiri, Bank BNI
  accountNumber: string; // e.g. 8820-192-888
  currency: string; // USD, IDR, JPY, EUR
  openingBalance: number; // Saldo Awal
  currentBalance: number; // Saldo Saat Ini
  coaCode?: string; // Link to COA
  coaName?: string;
  notes?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CashBankReceipt {
  id: string;
  receiptNumber: string; // e.g. REC/2026/03/001
  date: string; // YYYY-MM-DD
  bankAccountId: string; // Reference to CashBankAccount
  bankAccountName?: string;
  customerCode?: string;
  customerName?: string; // Payer / Customer / Entity
  coaCode?: string; // Account Code in COA
  coaName?: string;
  amount: number; // Jumlah Transaksi
  currency: string; // USD, IDR, etc.
  exchangeRate: number; // Kurs ke IDR
  totalIDR: number; // Amount in IDR
  paymentMethod: 'Transfer' | 'Cash' | 'Cheque' | 'Giro' | 'Other';
  refNumber?: string; // No. Referensi / Inv No / Surat Jalan
  description: string; // Keterangan / Memo
  createdAt?: string;
  updatedAt?: string;
}

export interface CashBankPayment {
  id: string;
  paymentNumber: string; // e.g. PAY/2026/03/001
  date: string; // YYYY-MM-DD
  bankAccountId: string; // Reference to CashBankAccount
  bankAccountName?: string;
  supplierCode?: string;
  supplierName?: string; // Payee / Supplier / Vendor / Entity
  coaCode?: string; // Account Code in COA
  coaName?: string;
  amount: number; // Jumlah Transaksi
  currency: string; // USD, IDR, etc.
  exchangeRate: number; // Kurs ke IDR
  totalIDR: number; // Amount in IDR
  paymentMethod: 'Transfer' | 'Cash' | 'Cheque' | 'Giro' | 'Other';
  refNumber?: string; // No. Referensi / PO No / Inv No
  description: string; // Keterangan / Memo
  createdAt?: string;
  updatedAt?: string;
}

export type UserRole = 'admin' | 'finance' | 'dept_user' | 'custom';

export type UserActionPermission = 'check' | 'approve' | 'reject';

export type AppPermission =
  | 'budget'
  | 'dashboard'
  | 'planner'
  | 'deptPlanning'
  | 'cashBank'
  | 'bukuBank'
  | 'penerimaan'
  | 'pembayaran'
  | 'purchase'
  | 'purchaseRequest'
  | 'purchaseOrder'
  | 'purchaseInvoice'
  | 'purchase-invoice'
  | 'sales'
  | 'salesPlan'
  | 'salesDelivery'
  | 'salesInvoice'
  | 'fixedAsset'
  | 'inventory'
  | 'realisasi'
  | 'dept'
  | 'supplier'
  | 'customer'
  | 'itemStock'
  | 'masterProcess'
  | 'dailyRates'
  | 'coa'
  | 'rate'
  | 'auditLog'
  | 'backup'
  | 'users'
  | 'settings';

export interface CompanySettings {
  companyName: string;
  logoUrl: string;
  address: string;
}

export interface AppUser {
  id: string;
  email: string;
  name: string;
  password: string;
  role: UserRole;
  roleLabel: string;
  permissions: AppPermission[];
  actionPermissions?: UserActionPermission[];
  deptCode?: string;
  isActive: boolean;
  createdAt: string;
}

export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'BATCH_DELETE' | 'IMPORT' | 'RESET' | 'CHECK' | 'APPROVE' | 'REJECT';

export type AuditModule =
  | 'Dept Planning (Budget)'
  | 'Dept Planning (Cost Down)'
  | 'Dept Planning (Plan)'
  | 'Kas dan Bank (Buku Bank)'
  | 'Kas dan Bank (Penerimaan)'
  | 'Kas dan Bank (Pembayaran)'
  | 'Purchase Request'
  | 'Purchase Order'
  | 'Purchase Invoice'
  | 'Sales'
  | 'Sales Plan'
  | 'Sales Delivery'
  | 'Sales Invoice'
  | 'Fixed Asset'
  | 'Inventory'
  | 'Inventory (Raw Material)'
  | 'Inventory (Mold & Spare Part)'
  | 'Inventory (WIP)'
  | 'Inventory (Finish Good)'
  | 'Inventory (Return from Prod)'
  | 'Summary Budget'
  | 'Realisasi Budget'
  | 'Master Dept'
  | 'Master Supplier'
  | 'Master Customer'
  | 'Master Item Stock'
  | 'Master Proses'
  | 'Master Proses Produksi'
  | 'Rate Harian'
  | 'Master Rate Harian'
  | 'Master COA'
  | 'Exchange Rate'
  | 'Company Settings'
  | 'User Management'
  | 'Sistem';

export interface AuditLogEntry {
  id: string;
  timestamp: string; // ISO String
  userId: string;
  userName: string;
  userEmail: string;
  userRole: UserRole;
  userDept?: string;
  action: AuditAction;
  module: AuditModule;
  itemCode?: string;
  itemName?: string;
  deptCode?: string;
  year?: number;
  details: string;
  device?: 'Desktop' | 'Mobile' | 'Tablet';
  oldValue?: any;
  newValue?: any;
}

export interface AppState {
  monthlyData: Record<string, MonthData>;
  deptPlanningItems: DeptPlanningItem[];
  cashBankAccounts?: CashBankAccount[];
  cashBankReceipts?: CashBankReceipt[];
  cashBankPayments?: CashBankPayment[];
  salesPlanItems?: SalesPlanItem[];
  salesDeliveryItems?: SalesDeliveryItem[];
  salesInvoiceItems?: SalesInvoiceItem[];
  fixedAssetItems?: FixedAssetItem[];
  inventoryItems?: InventoryItem[];
  returnFromProdItems?: ReturnFromProdItem[];
  purchaseRequests?: PurchaseRequest[];
  purchaseOrders?: PurchaseOrder[];
  purchaseInvoices?: PurchaseInvoice[];
  suppliers?: Supplier[];
  customers?: Customer[];
  itemStocks?: ItemStock[];
  productionProcesses?: ProductionProcess[];
  dailyRates?: DailyRate[];
  realizations?: BudgetRealization[];
  auditLogs?: AuditLogEntry[];
  departments: Department[];
  coa: COA[];
  ratesByYear: Record<string, ExchangeRates>;
  users?: AppUser[];
  currentUser?: AppUser | null;
  companySettings?: CompanySettings;
}
