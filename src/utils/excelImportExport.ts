import * as XLSX from 'xlsx';
import { Department, DeptPlanningItem, DeptPlanningSection, MonthlyDistribution } from '../types';
import { DP_MONTHS } from '../constants/defaultData';

export interface ParsedImportResult {
  items: DeptPlanningItem[];
  errors: string[];
  totalRowsProcessed: number;
}

/**
 * Parses numeric values safely (handles commas, currency symbols, and parenthesized negatives)
 */
export function cleanNumber(val: any): number {
  if (val === null || val === undefined || val === '') return 0;
  if (typeof val === 'number') {
    return isNaN(val) ? 0 : val;
  }
  let s = String(val).trim();
  const isNeg = s.startsWith('(') && s.endsWith(')');
  s = s.replace(/[()$Rp\s]/g, '').replace(/,/g, '');
  const n = parseFloat(s);
  if (isNaN(n)) return 0;
  return isNeg ? -Math.abs(n) : n;
}

/**
 * Parses date string or Excel serial number safely
 */
export function cleanDateStr(val: any, fallbackYear: number): string {
  if (val === null || val === undefined || val === '') return `${fallbackYear}-01-01`;
  if (typeof val === 'number') {
    const date = new Date(Math.round((val - 25569) * 86400 * 1000));
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
  }
  const str = String(val).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) {
    const [d, m, y] = str.split('/');
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  if (/^\d{4}\/\d{2}\/\d{2}$/.test(str)) {
    return str.replace(/\//g, '-');
  }
  return str.length >= 8 ? str.substring(0, 10) : `${fallbackYear}-01-01`;
}

/**
 * Downloads a standardized Excel/CSV template (.xlsx or .csv) for Budget, Cost Down, and Plan
 */
export function downloadExcelTemplate(
  section: DeptPlanningSection,
  deptCode: string,
  deptName: string,
  year: number = 2026,
  fileFormat: 'xlsx' | 'csv' = 'xlsx'
) {
  // Define standard columns
  const headers = [
    'Dept Code',
    'Code',
    'Account No',
    'Account Name',
    'Item Budget / Program',
    'Start Date',
    'Indicator Date',
    'Type',
    'Cost Category',
    'Business Function',
    'Currency',
    'Amount',
    'Rate',
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'Mei',
    'Jun',
    'Jul',
    'Agu',
    'Sep',
    'Okt',
    'Nov',
    'Des',
    'Total USD',
    'Notes / Catatan'
  ];

  // Sample data row matching standard format
  const samplePrefix = section === 'costdown' ? 'CD' : section === 'plan' ? 'PL' : 'BD';
  const sampleItems = section === 'costdown' ? [
    [
      deptCode,
      `${samplePrefix}${deptCode}-001`,
      '3600021',
      'G&A - Consultant fee',
      'Efisiensi negosiasi jasa konsultan audit pajak',
      `${year}-01-01`,
      `${year}-06-30`,
      'expense',
      'variable cost',
      'rutin',
      'USD',
      1200,
      1,
      0, 0, 0, 600, 0, 0, 0, 0, 0, 0, 600, 0,
      1200,
      'Ref: ACC-17 pengurangan termin'
    ]
  ] : section === 'plan' ? [
    [
      deptCode,
      `${samplePrefix}${deptCode}-001`,
      '3600045',
      'G&A - Software Maintenance',
      'Upgrade Lisensi ERP Cloud & Security Patch',
      `${year}-01-01`,
      `${year}-12-31`,
      'expense',
      'fixed cost',
      'rutin',
      'USD',
      3000,
      1,
      0, 0, 1500, 0, 0, 0, 0, 0, 1500, 0, 0, 0,
      3000,
      'Rencana semester 1 & semester 2'
    ]
  ] : [
    [
      deptCode,
      `BD${deptCode}-001`,
      '3600021',
      'G&A - Consultant fee',
      'Consultant fee - Mennix Transfer Pricing',
      `${year}-01-01`,
      `${year}-12-31`,
      'expense',
      'variable cost',
      'rutin',
      'USD',
      5000,
      1,
      0, 0, 1500, 2000, 0, 0, 0, 1500, 0, 0, 0, 0,
      5000,
      'Alokasi TP Doc FY 2026'
    ],
    [
      deptCode,
      `BD${deptCode}-002`,
      '3600030',
      'G&A - Bank Charge',
      'Biaya Administrasi Bank Bulanan',
      `${year}-01-01`,
      `${year}-12-31`,
      'expense',
      'fixed cost',
      'rutin',
      'IDR',
      16273560,
      16273.56,
      83.33, 83.33, 83.33, 83.33, 83.33, 83.33, 83.33, 83.33, 83.33, 83.33, 83.33, 83.37,
      1000,
      'Biaya bank operasional rutin'
    ]
  ];

  const wsData = [headers, ...sampleItems];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Set column widths for friendly display
  ws['!cols'] = [
    { wch: 10 }, // Dept Code
    { wch: 14 }, // Code
    { wch: 14 }, // Account No
    { wch: 25 }, // Account Name
    { wch: 35 }, // Item Budget
    { wch: 14 }, // Start Date
    { wch: 14 }, // Indicator Date
    { wch: 10 }, // Type
    { wch: 14 }, // Cost Category
    { wch: 16 }, // Business Function
    { wch: 10 }, // Currency
    { wch: 14 }, // Amount
    { wch: 10 }, // Rate
    ...DP_MONTHS.map(() => ({ wch: 10 })), // 12 months
    { wch: 14 }, // Total USD
    { wch: 30 }, // Notes
  ];

  const wb = XLSX.utils.book_new();
  const sheetName = section === 'costdown' ? 'Cost Down' : section === 'plan' ? 'Plan' : 'Budget';
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  const filename = `Template_Import_${section.toUpperCase()}_${deptCode}_${year}.${fileFormat === 'csv' ? 'csv' : 'xlsx'}`;
  
  if (fileFormat === 'csv') {
    XLSX.writeFile(wb, filename, { bookType: 'csv' });
  } else {
    XLSX.writeFile(wb, filename, { bookType: 'xlsx' });
  }
}

/**
 * Parses an Excel file (.xlsx, .xls) using SheetJS
 */
export function parseExcelWorkbook(
  arrayBuffer: ArrayBuffer,
  defaultSection: DeptPlanningSection,
  defaultDept: string,
  year: number,
  departments: Department[]
): ParsedImportResult {
  const wb = XLSX.read(arrayBuffer, { type: 'array' });
  const firstSheetName = wb.SheetNames[0];
  if (!firstSheetName) {
    return { items: [], errors: ['File Excel tidak memiliki sheet yang valid.'], totalRowsProcessed: 0 };
  }

  const ws = wb.Sheets[firstSheetName];
  // Parse into 2D array of strings/numbers
  const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
  return parseRowsArray(rows, defaultSection, defaultDept, year, departments);
}

/**
 * Parses raw CSV or TSV text
 */
export function parseDelimitedText(
  text: string,
  defaultSection: DeptPlanningSection,
  defaultDept: string,
  year: number,
  departments: Department[]
): ParsedImportResult {
  if (!text || !text.trim()) {
    return { items: [], errors: ['Teks CSV / TSV kosong.'], totalRowsProcessed: 0 };
  }

  const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length === 0) {
    return { items: [], errors: ['Tidak ada data baris yang ditemukan.'], totalRowsProcessed: 0 };
  }

  // Detect delimiter: tab, semicolon, comma
  const firstLine = lines[0];
  let delimiter = ',';
  if (firstLine.includes('\t')) delimiter = '\t';
  else if (firstLine.includes(';')) delimiter = ';';

  // Basic CSV splitting handling quotes
  const rows = lines.map(line => {
    if (delimiter === '\t') {
      return line.split('\t').map(c => c.trim());
    }
    // Simple regex for CSV splitting
    const tokens: string[] = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === delimiter && !inQuotes) {
        tokens.push(cur.trim());
        cur = '';
      } else {
        cur += char;
      }
    }
    tokens.push(cur.trim());
    return tokens;
  });

  return parseRowsArray(rows, defaultSection, defaultDept, year, departments);
}

/**
 * Universal rows parser mapping column headers or indices to DeptPlanningItem
 */
export function parseRowsArray(
  rows: any[][],
  defaultSection: DeptPlanningSection,
  defaultDept: string,
  selectedYear: number,
  departments: Department[]
): ParsedImportResult {
  if (rows.length === 0) {
    return { items: [], errors: ['Tidak ada data yang ditemukan.'], totalRowsProcessed: 0 };
  }

  const items: DeptPlanningItem[] = [];
  const errors: string[] = [];

  // 1. Identify header row and column mappings
  let headerRowIndex = -1;
  const colMap: Record<string, number> = {};
  const monthCols: Record<string, number> = {};

  for (let r = 0; r < Math.min(10, rows.length); r++) {
    const row = rows[r];
    if (!row || row.length === 0) continue;

    const lowerCells = row.map(c => String(c).trim().toLowerCase());
    const hasMonth = DP_MONTHS.some(m => {
      const mStr = String(m).toLowerCase();
      return lowerCells.some(c => c === mStr || c.startsWith(mStr));
    });
    const hasKeyCol = lowerCells.some(c =>
      c.includes('dept') ||
      c.includes('code') ||
      c.includes('account') ||
      c.includes('item') ||
      c.includes('amount') ||
      c.includes('pos')
    );

    if (hasKeyCol || hasMonth) {
      headerRowIndex = r;
      lowerCells.forEach((c, idx) => {
        if (c.includes('dept')) colMap['dept'] = idx;
        else if (c.includes('code') || c.includes('kode')) colMap['code'] = idx;
        else if (c.includes('account no') || c.includes('acc no') || c.includes('no akun') || c.includes('coa')) colMap['accountNo'] = idx;
        else if (c.includes('account name') || c.includes('nama akun')) colMap['accountName'] = idx;
        else if (c.includes('item') || c.includes('program') || c.includes('keterangan') || c.includes('deskripsi')) {
          if (colMap['item'] === undefined) colMap['item'] = idx;
        } else if (c.includes('start date') || c.includes('budget start') || c.includes('tgl mulai') || c.includes('start_date')) {
          colMap['startDate'] = idx;
        } else if (c.includes('indicator date') || c.includes('tgl indikator') || c.includes('indicator_date') || c.includes('indikator')) {
          colMap['indicatorDate'] = idx;
        } else if (c.includes('type') || c.includes('tipe')) colMap['type'] = idx;
        else if (c.includes('category') || c.includes('kategori')) colMap['costCategory'] = idx;
        else if (c.includes('function') || c.includes('fungsi')) colMap['businessFunction'] = idx;
        else if (c.includes('curr') || c.includes('mata uang')) colMap['currency'] = idx;
        else if (c.includes('amount') || c.includes('nominal')) colMap['amount'] = idx;
        else if (c.includes('rate') || c.includes('kurs')) colMap['rate'] = idx;
        else if (c.includes('total') || c.includes('grand')) colMap['totalUSD'] = idx;
        else if (c.includes('note') || c.includes('catatan') || c.includes('ref')) colMap['notes'] = idx;

        // Check months
        DP_MONTHS.forEach(m => {
          const mLower = String(m).toLowerCase();
          if (c === mLower || c.startsWith(mLower)) {
            monthCols[m] = idx;
          }
        });
      });
      break;
    }
  }

  const startRow = headerRowIndex >= 0 ? headerRowIndex + 1 : 0;
  const deptNameMap = new Map<string, string>();
  departments.forEach(d => deptNameMap.set(d.code.toUpperCase(), d.name));

  for (let i = startRow; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;

    // Check if entire row is empty
    const hasAnyVal = row.some(cell => cell !== '' && cell !== null && cell !== undefined);
    if (!hasAnyVal) continue;

    // Extract fields
    const getVal = (colKey: string, fallbackIdx?: number): any => {
      if (colMap[colKey] !== undefined) return row[colMap[colKey]];
      if (fallbackIdx !== undefined && fallbackIdx < row.length) return row[fallbackIdx];
      return undefined;
    };

    let rowDept = String(getVal('dept', 0) || '').trim().toUpperCase();
    if (!rowDept || rowDept.length > 8) {
      rowDept = defaultDept.toUpperCase();
    }

    let rowCode = String(getVal('code', 1) || '').trim();
    let rowAccNo = String(getVal('accountNo', 2) || '').trim();
    let rowAccName = String(getVal('accountName', 3) || '').trim();
    let rowItem = String(getVal('item', 4) || '').trim();

    // Fallbacks if header mapping wasn't found
    if (headerRowIndex === -1) {
      if (row.length >= 4) {
        rowCode = String(row[0] || '').trim();
        rowAccNo = String(row[1] || '').trim();
        rowAccName = String(row[2] || '').trim();
        rowItem = String(row[3] || rowAccName || 'Item Anggaran').trim();
      }
    }

    if (!rowItem && rowAccName) rowItem = rowAccName;
    if (!rowItem && !rowAccNo && !rowCode) continue; // skip blank line

    const rowType = String(getVal('type') || 'expense').toLowerCase();
    const rowCostCat = String(getVal('costCategory') || 'variable cost').toLowerCase();
    const rowBusFunc = String(getVal('businessFunction') || 'rutin').toLowerCase();
    const rowCurr = String(getVal('currency') || 'USD').toUpperCase();
    const rowNotes = String(getVal('notes') || '').trim();

    let rowRate = cleanNumber(getVal('rate'));
    if (rowRate <= 0) rowRate = 1;

    // Monthly distribution
    const monthly: MonthlyDistribution = {
      Jan: 0, Feb: 0, Mar: 0, Apr: 0, Mei: 0, Jun: 0,
      Jul: 0, Agu: 0, Sep: 0, Okt: 0, Nov: 0, Des: 0
    };

    let monthlySum = 0;
    const hasMonthHeader = Object.keys(monthCols).length > 0;

    if (hasMonthHeader) {
      DP_MONTHS.forEach(m => {
        if (monthCols[m] !== undefined && monthCols[m] < row.length) {
          const val = cleanNumber(row[monthCols[m]]);
          monthly[m] = val;
          monthlySum += val;
        }
      });
    } else if (row.length >= 13) {
      // Last 12 columns might be months
      const startMIdx = Math.max(0, row.length - 12);
      DP_MONTHS.forEach((m, idx) => {
        const val = cleanNumber(row[startMIdx + idx]);
        monthly[m] = val;
        monthlySum += val;
      });
    }

    let explicitAmount = cleanNumber(getVal('amount'));
    let explicitTotalUSD = cleanNumber(getVal('totalUSD'));

    let finalTotalUSD = explicitTotalUSD > 0 ? explicitTotalUSD : monthlySum > 0 ? monthlySum : explicitAmount;
    if (explicitAmount === 0 && finalTotalUSD > 0) {
      explicitAmount = finalTotalUSD;
    }

    // If monthly was 0 but total was given, distribute evenly
    if (monthlySum === 0 && finalTotalUSD > 0) {
      const avg = parseFloat((finalTotalUSD / 12).toFixed(2));
      DP_MONTHS.forEach(m => {
        monthly[m] = avg;
      });
    }

    // Determine target section
    let itemSection: DeptPlanningSection = defaultSection;
    const upperCode = rowCode.toUpperCase();
    if (upperCode.startsWith('CD') || upperCode.startsWith('COSTDOWN')) {
      itemSection = 'costdown';
    } else if (upperCode.startsWith('PL') || upperCode.startsWith('PLAN')) {
      itemSection = 'plan';
    } else if (upperCode.startsWith('BD') || upperCode.startsWith('BUDGET') || upperCode.startsWith('ACC-')) {
      itemSection = 'budget';
    }

    // Auto-generate code if empty
    if (!rowCode) {
      const prefix = itemSection === 'costdown' ? 'CD' : itemSection === 'plan' ? 'PL' : 'BD';
      rowCode = `${prefix}${rowDept}-${String(i).padStart(3, '0')}`;
    }

    const uniqueId = `dp_${itemSection}_${rowDept}_${rowCode}_${selectedYear}_${i}`.toLowerCase().replace(/[^a-z0-9_]/g, '_');

    items.push({
      id: uniqueId,
      code: rowCode,
      section: itemSection,
      year: selectedYear,
      deptCode: rowDept,
      deptName: deptNameMap.get(rowDept) || rowDept,
      accountNo: rowAccNo,
      accountName: rowAccName || rowItem,
      item: rowItem || 'Item Anggaran',
      type: rowType || 'expense',
      costCategory: rowCostCat || 'variable cost',
      budgetStartDate: cleanDateStr(getVal('startDate'), selectedYear),
      indicatorDate: cleanDateStr(getVal('indicatorDate'), selectedYear),
      businessFunction: rowBusFunc || 'rutin',
      currency: rowCurr || 'USD',
      amount: explicitAmount || finalTotalUSD,
      rate: rowRate,
      totalUSD: finalTotalUSD,
      monthlyTotalUSD: monthlySum > 0 ? monthlySum : finalTotalUSD,
      monthly,
      notes: rowNotes || undefined,
      updatedAt: new Date().toISOString()
    });
  }

  // Deduplicate internal array
  const seenMap = new Map<string, DeptPlanningItem>();
  items.forEach(item => {
    const key = `${item.deptCode}_${item.section}_${item.year}_${item.code || (item.accountNo + '_' + item.item)}`.toLowerCase();
    seenMap.set(key, item);
  });

  return {
    items: Array.from(seenMap.values()),
    errors,
    totalRowsProcessed: rows.length - (headerRowIndex >= 0 ? headerRowIndex + 1 : 0)
  };
}
