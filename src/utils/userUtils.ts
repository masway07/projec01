import { AppPermission, AppUser, UserActionPermission, UserRole } from '../types';

export const ALL_ACTION_PERMISSIONS: {
  id: UserActionPermission;
  label: string;
  shortLabel: string;
  description: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
}[] = [
  {
    id: 'check',
    label: 'Check / Reviewer (Pemeriksa)',
    shortLabel: 'Check',
    description: 'Memeriksa, meneliti fisik & keabsahan dokumen/barang sebelum diteruskan ke tahap persetujuan (PR, PO, Return from Prod, dsb.)',
    badgeBg: 'bg-blue-50',
    badgeText: 'text-blue-700',
    badgeBorder: 'border-blue-200'
  },
  {
    id: 'approve',
    label: 'Approve / Approver (Penyetuju)',
    shortLabel: 'Approve',
    description: 'Memberikan persetujuan resmi (approval) agar transaksi, anggaran, PO, dan pengembalian barang masuk sah tercatat',
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-700',
    badgeBorder: 'border-emerald-200'
  },
  {
    id: 'reject',
    label: 'Reject / Rejector (Penolak)',
    shortLabel: 'Reject',
    description: 'Menolak atau membatalkan dokumen atau barang yang tidak sesuai standar dengan menyertakan alasan perbaikan',
    badgeBg: 'bg-rose-50',
    badgeText: 'text-rose-700',
    badgeBorder: 'border-rose-200'
  }
];

export const ALL_PERMISSIONS: { id: AppPermission; label: string; description: string }[] = [
  { id: 'budget', label: 'Budget (Semua Modul)', description: 'Akses penuh modul Budget (Summary Budget, Rencana Anggaran, Dept Planning, dan Realisasi Budget)' },
  { id: 'dashboard', label: 'Summary Budget', description: 'Melihat laporan ringkasan budget reference dari Dept Planning per No Akun' },
  { id: 'planner', label: 'Rencana Anggaran', description: 'Mengatur pendapatan bulanan, limit kategori, utang, dan tabungan' },
  { id: 'deptPlanning', label: 'Dept Planning', description: 'Mengelola A. Budget, B. Cost Down, dan C. Plan' },
  { id: 'cashBank', label: 'Kas dan Bank (Semua Submenu)', description: 'Akses penuh modul Kas dan Bank (Buku Bank, Penerimaan, dan Pembayaran)' },
  { id: 'bukuBank', label: 'Buku Bank', description: 'Pengelolaan daftar rekening bank, kas kecil, dan mutasi saldo' },
  { id: 'penerimaan', label: 'Penerimaan', description: 'Pencatatan uang masuk, pembayaran piutang customer, dan pendapatan' },
  { id: 'pembayaran', label: 'Pembayaran', description: 'Pencatatan uang keluar, pembayaran hutang supplier, dan pengeluaran beban' },
  { id: 'purchase', label: 'Purchase (Semua Modul)', description: 'Akses penuh modul Purchase (Purchase Request dan Purchase Order)' },
  { id: 'purchaseRequest', label: 'Purchase Request', description: 'Permintaan pembelian barang dari departemen lain' },
  { id: 'purchaseOrder', label: 'Purchase Order', description: 'Pembuatan purchase order dan pengiriman ke supplier' },
  { id: 'sales', label: 'Sales (Semua Modul)', description: 'Akses penuh modul Sales (Sales Plan, Sales Delivery, dan Sales Invoice)' },
  { id: 'salesPlan', label: 'Sales Plan', description: 'Perencanaan target penjualan tahunan per customer & COA' },
  { id: 'salesDelivery', label: 'Sales Delivery', description: 'Surat Jalan / Pengiriman Barang (Delivery Order)' },
  { id: 'salesInvoice', label: 'Sales Invoice', description: 'Faktur Penjualan, Commercial Invoice, Faktur Pajak & Tagihan' },
  { id: 'fixedAsset', label: 'Fixed Asset', description: 'Pengelolaan daftar aset tetap, nilai perolehan, dan konversi USD' },
  { id: 'inventory', label: 'Inventory', description: 'Pengelolaan persediaan Raw Material, Mold & Spare Part, WIP, Finish Good, dan Return from Prod' },
  { id: 'realisasi', label: 'Realisasi Budget', description: 'Mencatat penggunaan budget after cost down & kontrol sisa budget' },
  { id: 'dept', label: 'Master Department', description: 'Mengelola daftar kode dan nama departemen' },
  { id: 'supplier', label: 'Master Supplier', description: 'Daftar vendor/supplier, alamat, kontak, dan termin pembayaran' },
  { id: 'customer', label: 'Master Customer', description: 'Daftar pelanggan/customer, kontak, NPWP, dan termin' },
  { id: 'itemStock', label: 'Master Item Stock', description: 'Katalog barang dan pemetaan akun Inventory & Expense di COA' },
  { id: 'masterProcess', label: 'Master Proses', description: 'Daftar proses produksi, mesin/work center, cycle time, dan kapasitas' },
  { id: 'dailyRates', label: 'Rate Harian (BI & KMK)', description: 'Kurs harian transaksi Bank Indonesia dan kurs pajak KMK' },
  { id: 'coa', label: 'Master COA', description: 'Melihat dan mengelola bagan akun standar (Chart of Accounts)' },
  { id: 'rate', label: 'Exchange Rate', description: 'Mengatur kurs mata uang USD, IDR, JPY, CNY, EUR per tahun' },
  { id: 'auditLog', label: 'Log Perubahan (Audit)', description: 'Melihat rekam jejak audit perubahan data yang dibuat oleh user Dept dan Admin' },
  { id: 'backup', label: 'Backup & Data', description: 'Export dan import cadangan berkas JSON serta reset data' },
  { id: 'users', label: 'Manajemen User', description: 'Menambah, mengedit, dan mengatur hak akses pengguna' },
  { id: 'settings', label: 'Pengaturan Perusahaan', description: 'Identitas perusahaan, nama PT, logo URL, dan alamat untuk kop laporan' },
];

export const ROLE_PRESETS: Record<UserRole, { label: string; permissions: AppPermission[]; actionPermissions: UserActionPermission[]; description: string }> = {
  admin: {
    label: 'Administrator (Akses Penuh)',
    description: 'Memiliki akses ke seluruh menu, konfigurasi sistem, audit trail, perusahaan, dan hak otorisasi penuh (Check, Approve, Reject)',
    permissions: ALL_PERMISSIONS.map(p => p.id),
    actionPermissions: ['check', 'approve', 'reject']
  },
  finance: {
    label: 'Finance & Accounting',
    description: 'Mengelola perencanaan budget, realisasi pengeluaran, kas & bank, purchase, sales, fixed asset, inventory, master data, kurs, dan hak verifikasi & persetujuan',
    permissions: [
      'budget',
      'dashboard',
      'planner',
      'deptPlanning',
      'cashBank',
      'bukuBank',
      'penerimaan',
      'pembayaran',
      'purchase',
      'purchaseRequest',
      'purchaseOrder',
      'sales',
      'salesPlan',
      'salesDelivery',
      'salesInvoice',
      'fixedAsset',
      'inventory',
      'realisasi',
      'dept',
      'supplier',
      'customer',
      'itemStock',
      'masterProcess',
      'dailyRates',
      'coa',
      'rate',
      'settings'
    ],
    actionPermissions: ['check', 'approve', 'reject']
  },
  dept_user: {
    label: 'Department User',
    description: 'Melihat planning departemen, kas & bank, purchase request, sales, fixed asset, inventory, mencatat penggunaan budget, dan hak pemeriksaan (Check)',
    permissions: [
      'budget',
      'dashboard',
      'deptPlanning',
      'cashBank',
      'bukuBank',
      'penerimaan',
      'pembayaran',
      'purchase',
      'purchaseRequest',
      'purchaseOrder',
      'sales',
      'salesPlan',
      'salesDelivery',
      'salesInvoice',
      'fixedAsset',
      'inventory',
      'realisasi',
      'dept',
      'supplier',
      'customer',
      'itemStock',
      'masterProcess',
      'dailyRates',
      'coa',
      'rate'
    ],
    actionPermissions: ['check']
  },
  custom: {
    label: 'Custom (Kustomisasi Mandiri)',
    description: 'Hak akses menu dan hak aksi otorisasi (Check, Approve, Reject) diatur secara manual',
    permissions: [
      'budget',
      'dashboard',
      'deptPlanning',
      'purchase',
      'purchaseRequest',
      'purchaseOrder',
      'sales',
      'salesPlan',
      'salesDelivery',
      'salesInvoice',
      'fixedAsset',
      'inventory',
      'realisasi',
      'dept',
      'supplier',
      'customer',
      'itemStock',
      'masterProcess',
      'dailyRates',
      'coa',
      'rate'
    ],
    actionPermissions: ['check']
  }
};

/**
 * Generates a secure, readable random password
 */
export function generateStrongPassword(
  length: number = 12,
  options: { includeSymbols?: boolean; includeNumbers?: boolean } = {}
): string {
  const { includeSymbols = true, includeNumbers = true } = options;

  const upperChars = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lowerChars = 'abcdefghijkmnpqrstuvwxyz';
  const numberChars = '23456789';
  const symbolChars = '@#$&*!?';

  let charPool = upperChars + lowerChars;
  if (includeNumbers) charPool += numberChars;
  if (includeSymbols) charPool += symbolChars;

  // Guarantee at least one of each required type
  const guaranteed: string[] = [
    upperChars[Math.floor(Math.random() * upperChars.length)],
    lowerChars[Math.floor(Math.random() * lowerChars.length)]
  ];

  if (includeNumbers) {
    guaranteed.push(numberChars[Math.floor(Math.random() * numberChars.length)]);
  }
  if (includeSymbols) {
    guaranteed.push(symbolChars[Math.floor(Math.random() * symbolChars.length)]);
  }

  const remainingLength = Math.max(length - guaranteed.length, 0);
  const remaining: string[] = [];

  for (let i = 0; i < remainingLength; i++) {
    const randIndex = Math.floor(Math.random() * charPool.length);
    remaining.push(charPool[randIndex]);
  }

  // Shuffle together
  const combined = [...guaranteed, ...remaining];
  for (let i = combined.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [combined[i], combined[j]] = [combined[j], combined[i]];
  }

  return combined.join('');
}

export const DEFAULT_USERS: AppUser[] = [
  {
    id: 'user_admin_1',
    email: 'acckaneta@gmail.com',
    name: 'Administrator Budget',
    password: 'Admin123!',
    role: 'admin',
    roleLabel: 'Administrator (Akses Penuh)',
    permissions: ROLE_PRESETS.admin.permissions,
    actionPermissions: ROLE_PRESETS.admin.actionPermissions,
    isActive: true,
    createdAt: '2026-01-01T08:00:00.000Z'
  },
  {
    id: 'user_finance_1',
    email: 'finance@smartbudget.com',
    name: 'Staff Finance & Accounting',
    password: 'Finance2026!',
    role: 'finance',
    roleLabel: 'Finance & Accounting',
    permissions: ROLE_PRESETS.finance.permissions,
    actionPermissions: ROLE_PRESETS.finance.actionPermissions,
    deptCode: 'ACC',
    isActive: true,
    createdAt: '2026-01-05T09:30:00.000Z'
  },
  {
    id: 'user_dept_1',
    email: 'user.acc@smartbudget.com',
    name: 'Department User ACC',
    password: 'DeptUser2026!',
    role: 'dept_user',
    roleLabel: 'Department User',
    permissions: ROLE_PRESETS.dept_user.permissions,
    actionPermissions: ROLE_PRESETS.dept_user.actionPermissions,
    deptCode: 'ACC',
    isActive: true,
    createdAt: '2026-01-10T11:00:00.000Z'
  }
];
