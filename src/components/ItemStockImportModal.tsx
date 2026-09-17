import React, { useState, useRef } from 'react';
import { ItemStock, COA, Supplier } from '../types';
import { X, Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle2, Sparkles, HelpCircle, Boxes } from 'lucide-react';
import * as XLSX from 'xlsx';

interface ItemStockImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (items: Omit<ItemStock, 'id' | 'createdAt' | 'updatedAt'>[]) => void;
  coaList?: COA[];
  suppliers?: Supplier[];
}

export const SAMPLE_ITEM_STOCKS_FOR_IMPORT: Omit<ItemStock, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    code: 'RM-S45C-D28',
    name: 'Round Steel Bar S45C',
    specification: 'S45C Dia 28mm x 6000mm JIS G4051',
    category: 'raw_material',
    uom: 'Kg',
    inventoryAccountCode: '1080001',
    inventoryAccountName: 'Raw Material',
    expenseAccountCode: '5100001',
    expenseAccountName: 'Raw Material Expense / HPP',
    minimumStock: 5000,
    safetyStock: 8000,
    standardCost: 1.45,
    standardPrice: 0,
    currency: 'USD',
    location: 'WH-RM-RACK-01',
    isActive: true,
    notes: 'Material utama Cold Forging shaft gear'
  },
  {
    code: 'MLD-CAV-04',
    name: 'Die Insert Cavity Gear 4R',
    specification: 'SKD11 / Hardness HRC 58-60 / Vacuum Heat Treat',
    category: 'mold_sparepart',
    uom: 'Set',
    inventoryAccountCode: '1080005',
    inventoryAccountName: 'Mold & Spare Part',
    expenseAccountCode: '5100003',
    expenseAccountName: 'Maintenance & Tooling Expense',
    minimumStock: 2,
    safetyStock: 4,
    standardCost: 1250.00,
    standardPrice: 0,
    currency: 'USD',
    location: 'WH-MOLD-A02',
    isActive: true,
    notes: 'Cetakan Dies Press Line 2'
  },
  {
    code: 'WIP-SHF-01',
    name: 'Blank Shaft Forged Semi Finish',
    specification: 'SCr420H / Dia 30mm x 150mm / Facing + Centering',
    category: 'wip',
    uom: 'Pcs',
    inventoryAccountCode: '1080003',
    inventoryAccountName: 'Work In Process',
    expenseAccountCode: '5100001',
    expenseAccountName: 'Raw Material Expense / HPP',
    minimumStock: 1000,
    safetyStock: 2000,
    standardCost: 2.10,
    standardPrice: 0,
    currency: 'USD',
    location: 'LINE-1-WIP',
    isActive: true,
    notes: 'Hasil proses blanking & Forging Line 1'
  },
  {
    code: 'FG-GR-4R01',
    name: 'Final Gear Shaft 4R Finished',
    specification: 'SCr420H / Machined & Carburized / O.D. 85mm',
    category: 'finish_good',
    uom: 'Pcs',
    inventoryAccountCode: '1080004',
    inventoryAccountName: 'Finish Good',
    expenseAccountCode: '5100001',
    expenseAccountName: 'Raw Material Expense / HPP',
    minimumStock: 1500,
    safetyStock: 3000,
    standardCost: 4.85,
    standardPrice: 7.50,
    currency: 'USD',
    location: 'WH-FG-BAY-03',
    isActive: true,
    notes: 'Produk siap kirim customer'
  },
  {
    code: 'SUP-OIL-68',
    name: 'Hydraulic Oil Shell Tellus S2 MX 68',
    specification: 'ISO VG 68 / Drum 209 Liter / Anti-wear',
    category: 'general',
    uom: 'Drum',
    inventoryAccountCode: '1080005',
    inventoryAccountName: 'Mold & Spare Part',
    expenseAccountCode: '5100002',
    expenseAccountName: 'Consumable & Factory Supplies',
    minimumStock: 5,
    safetyStock: 10,
    standardCost: 450.00,
    standardPrice: 0,
    currency: 'USD',
    location: 'WH-OIL-01',
    isActive: true,
    notes: 'Pelumas mesin hidrolik stamping press'
  }
];

export const ItemStockImportModal: React.FC<ItemStockImportModalProps> = ({
  isOpen,
  onClose,
  onImport,
  coaList = []
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [parsedData, setParsedData] = useState<Omit<ItemStock, 'id' | 'createdAt' | 'updatedAt'>[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [showSampleGuide, setShowSampleGuide] = useState<boolean>(false);

  if (!isOpen) return null;

  // Helper COA name finder
  const findCoaName = (codeStr: string, isExpense = false) => {
    const matched = coaList.find(c => c.code === codeStr);
    if (matched) return matched.name;
    if (codeStr === '1080001') return 'Raw Material';
    if (codeStr === '1080003') return 'Work In Process';
    if (codeStr === '1080004') return 'Finish Good';
    if (codeStr === '1080005') return 'Mold & Spare Part';
    if (codeStr === '5100001') return 'Raw Material Expense / HPP';
    if (codeStr === '5100002') return 'Consumable & Factory Supplies';
    if (codeStr === '5100003') return 'Maintenance & Tooling Expense';
    if (codeStr === '5200001') return 'General Expense';
    return isExpense ? 'Expense Account' : 'Inventory Asset';
  };

  // Download Excel Template
  const handleDownloadTemplate = (format: 'xlsx' | 'csv' = 'xlsx') => {
    const headers = [
      'Kode Item (SKU)*',
      'Nama Barang*',
      'Spek / Type Barang',
      'Kategori (raw_material/mold_sparepart/wip/finish_good/general)',
      'Satuan (UOM)',
      'Kode Akun Persediaan (COA)',
      'Kode Akun Beban (COA)',
      'Minimum Stock',
      'Safety Stock',
      'Standard Cost',
      'Standard Price',
      'Mata Uang (USD/IDR)',
      'Lokasi Gudang',
      'Status Active (TRUE/FALSE)',
      'Catatan / Keterangan'
    ];

    const sampleRows = SAMPLE_ITEM_STOCKS_FOR_IMPORT.map(item => [
      item.code,
      item.name,
      item.specification || '',
      item.category,
      item.uom,
      item.inventoryAccountCode,
      item.expenseAccountCode,
      item.minimumStock,
      item.safetyStock,
      item.standardCost,
      item.standardPrice,
      item.currency,
      item.location || '',
      item.isActive ? 'TRUE' : 'FALSE',
      item.notes || ''
    ]);

    const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleRows]);
    // Adjust column widths
    ws['!cols'] = [
      { wch: 18 }, // Kode
      { wch: 30 }, // Nama
      { wch: 38 }, // Spek
      { wch: 22 }, // Kategori
      { wch: 12 }, // UOM
      { wch: 20 }, // COA Inv
      { wch: 20 }, // COA Exp
      { wch: 14 }, // Min
      { wch: 14 }, // Safety
      { wch: 14 }, // Cost
      { wch: 14 }, // Price
      { wch: 10 }, // Currency
      { wch: 18 }, // Location
      { wch: 12 }, // Active
      { wch: 35 }  // Notes
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Item_Stock_Master');

    if (format === 'csv') {
      XLSX.writeFile(wb, `Template_Import_Master_Item_Stock.csv`, { bookType: 'csv' });
    } else {
      XLSX.writeFile(wb, `Template_Import_Master_Item_Stock.xlsx`);
    }
  };

  // Load Demo Data into preview
  const handleLoadSampleExamples = () => {
    setErrorMsg('');
    setFileName('Data_Demo_Item_Stock_Contoh.xlsx');
    setParsedData(SAMPLE_ITEM_STOCKS_FOR_IMPORT);
  };

  // Process File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setErrorMsg('');
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = evt => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary', cellDates: true });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });

        if (!data || data.length < 2) {
          setErrorMsg('File kosong atau format baris tidak valid.');
          setIsProcessing(false);
          return;
        }

        // Detect Header Indexes
        const headerRow = data[0].map((h: any) => String(h || '').toLowerCase().trim());
        
        const findColIndex = (keywords: string[]): number => {
          return headerRow.findIndex((h: string) => keywords.some(k => h.includes(k)));
        };

        const idxCode = findColIndex(['kode', 'code', 'sku']);
        const idxName = findColIndex(['nama', 'name', 'deskripsi', 'description']);
        const idxSpec = findColIndex(['spek', 'spec', 'type', 'tipe', 'spesifikasi']);
        const idxCategory = findColIndex(['kategori', 'category', 'kat']);
        const idxUom = findColIndex(['satuan', 'uom', 'unit']);
        const idxInvCoa = findColIndex(['persediaan', 'inventory', 'asset', 'akun persediaan']);
        const idxExpCoa = findColIndex(['beban', 'expense', 'hpp', 'akun beban']);
        const idxMinStock = findColIndex(['minimum', 'min stock', 'min']);
        const idxSafetyStock = findColIndex(['safety', 'safe']);
        const idxCost = findColIndex(['cost', 'biaya', 'standar cost', 'std cost']);
        const idxPrice = findColIndex(['price', 'harga', 'standar price', 'std price']);
        const idxCurrency = findColIndex(['mata uang', 'currency', 'kurs']);
        const idxLocation = findColIndex(['lokasi', 'location', 'gudang', 'rack', 'rak']);
        const idxActive = findColIndex(['status', 'active', 'aktif']);
        const idxNotes = findColIndex(['catatan', 'notes', 'keterangan']);

        const items: Omit<ItemStock, 'id' | 'createdAt' | 'updatedAt'>[] = [];

        for (let i = 1; i < data.length; i++) {
          const row = data[i];
          if (!row || row.length === 0) continue;

          // Read code and name (required)
          const codeVal = String(idxCode >= 0 ? row[idxCode] || '' : row[0] || '').trim();
          const nameVal = String(idxName >= 0 ? row[idxName] || '' : row[1] || '').trim();
          const specVal = String(idxSpec >= 0 ? row[idxSpec] || '' : row[2] || '').trim();

          if (!codeVal && !nameVal) continue; // Skip blank rows

          // Normalize category
          let rawCategory = String(idxCategory >= 0 ? row[idxCategory] || '' : '').toLowerCase().trim();
          let category: ItemStock['category'] = 'raw_material';
          if (rawCategory.includes('mold') || rawCategory.includes('spare') || rawCategory.includes('tool')) {
            category = 'mold_sparepart';
          } else if (rawCategory.includes('wip') || rawCategory.includes('process') || rawCategory.includes('proses')) {
            category = 'wip';
          } else if (rawCategory.includes('finish') || rawCategory.includes('jadi') || rawCategory.includes('fg')) {
            category = 'finish_good';
          } else if (rawCategory.includes('gen') || rawCategory.includes('umum') || rawCategory.includes('supplies')) {
            category = 'general';
          } else {
            category = 'raw_material';
          }

          // Default COAs based on category
          let defaultInvCoa = '1080001';
          let defaultExpCoa = '5100001';
          if (category === 'mold_sparepart') {
            defaultInvCoa = '1080005';
            defaultExpCoa = '5100003';
          } else if (category === 'wip') {
            defaultInvCoa = '1080003';
            defaultExpCoa = '5100001';
          } else if (category === 'finish_good') {
            defaultInvCoa = '1080004';
            defaultExpCoa = '5100001';
          } else if (category === 'general') {
            defaultInvCoa = '1080005';
            defaultExpCoa = '5100002';
          }

          const invCode = String(idxInvCoa >= 0 && row[idxInvCoa] ? row[idxInvCoa] : defaultInvCoa).trim();
          const expCode = String(idxExpCoa >= 0 && row[idxExpCoa] ? row[idxExpCoa] : defaultExpCoa).trim();

          const uomVal = String(idxUom >= 0 && row[idxUom] ? row[idxUom] : 'Pcs').trim();
          const minStock = Number(idxMinStock >= 0 ? row[idxMinStock] : 0) || 0;
          const safetyStock = Number(idxSafetyStock >= 0 ? row[idxSafetyStock] : 0) || 0;
          const stdCost = Number(idxCost >= 0 ? row[idxCost] : 0) || 0;
          const stdPrice = Number(idxPrice >= 0 ? row[idxPrice] : 0) || 0;
          const currencyVal = String(idxCurrency >= 0 && row[idxCurrency] ? row[idxCurrency] : 'USD').toUpperCase().trim();
          const locationVal = String(idxLocation >= 0 && row[idxLocation] ? row[idxLocation] : 'WH-MAIN').trim();
          const notesVal = String(idxNotes >= 0 && row[idxNotes] ? row[idxNotes] : '').trim();

          let activeVal = true;
          if (idxActive >= 0 && row[idxActive] !== undefined) {
            const rawAct = String(row[idxActive]).toLowerCase().trim();
            if (rawAct === 'false' || rawAct === '0' || rawAct === 'non-aktif' || rawAct === 'no') {
              activeVal = false;
            }
          }

          items.push({
            code: codeVal.toUpperCase(),
            name: nameVal || codeVal,
            specification: specVal,
            category,
            uom: uomVal || 'Pcs',
            inventoryAccountCode: invCode,
            inventoryAccountName: findCoaName(invCode, false),
            expenseAccountCode: expCode,
            expenseAccountName: findCoaName(expCode, true),
            minimumStock: minStock,
            safetyStock: safetyStock,
            standardCost: stdCost,
            standardPrice: stdPrice,
            currency: currencyVal || 'USD',
            location: locationVal || 'WH-MAIN',
            isActive: activeVal,
            notes: notesVal
          });
        }

        if (items.length === 0) {
          setErrorMsg('Tidak dapat menemukan data valid untuk diimport dari file tersebut.');
        } else {
          setParsedData(items);
        }
      } catch (err: any) {
        setErrorMsg(`Gagal membaca file: ${err.message || 'Format tidak valid'}`);
      } finally {
        setIsProcessing(false);
      }
    };

    reader.readAsBinaryString(file);
  };

  const handleConfirmImport = () => {
    if (parsedData.length === 0) return;
    onImport(parsedData);
    setParsedData([]);
    setFileName('');
    onClose();
  };

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'raw_material': return 'Raw Material';
      case 'mold_sparepart': return 'Mold & Sparepart';
      case 'wip': return 'WIP';
      case 'finish_good': return 'Finish Good';
      default: return 'General';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/20 rounded-2xl text-indigo-300 border border-indigo-400/20">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold tracking-tight">Import Master Data Item Stock</h3>
              <p className="text-xs text-indigo-200/80">
                Upload berkas Excel (.xlsx) atau CSV untuk mengisi database barang & spesifikasi teknis
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          
          {/* Action Toolbar: Download Template & Load Demo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                  <Download className="w-4 h-4 text-indigo-600" />
                  <span>Download Format Template Standard</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  Gunakan template Excel dengan susunan kolom standar termasuk <strong>Nama Barang</strong>, <strong>Spek / Type Barang</strong>, Kategori, COA, dan Stok.
                </p>
              </div>
              <div className="flex items-center gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => handleDownloadTemplate('xlsx')}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Template (.xlsx)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadTemplate('csv')}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
                >
                  <span>CSV</span>
                </button>
              </div>
            </div>

            <div className="bg-indigo-50/60 border border-indigo-100 rounded-2xl p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-indigo-900">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <span>Uji Coba Cepat dengan Data Demo</span>
                </div>
                <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                  Isi pratinjau secara otomatis dengan 5 sampel data contoh (Raw Material, Mold Insert, WIP, Finish Good & Pelumas) untuk mencoba fitur.
                </p>
              </div>
              <button
                type="button"
                onClick={handleLoadSampleExamples}
                className="mt-4 flex items-center justify-center gap-2 w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
              >
                <Boxes className="w-4 h-4" />
                <span>Gunakan Data Contoh Demo</span>
              </button>
            </div>
          </div>

          {/* Upload Area */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700">
              Upload Berkas Excel / CSV
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 hover:border-indigo-500 bg-slate-50/50 hover:bg-indigo-50/30 transition rounded-2xl p-6 text-center cursor-pointer group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileUpload}
                className="hidden"
              />
              <div className="flex flex-col items-center justify-center gap-2">
                <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-xs group-hover:scale-110 transition text-indigo-600">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-800">
                    Klik untuk memilih berkas Excel / CSV
                  </span>
                  <span className="text-xs text-slate-500"> atau drag & drop file ke area ini</span>
                </div>
                <span className="text-[10px] text-slate-400">Mendukung format .xlsx, .xls, .csv</span>
              </div>
            </div>
            {fileName && (
              <div className="flex items-center justify-between px-3 py-2 bg-slate-100 rounded-xl text-xs text-slate-700 font-mono">
                <span className="truncate">Berkas terpilih: <strong>{fileName}</strong></span>
                {parsedData.length > 0 && (
                  <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200 shrink-0">
                    {parsedData.length} item terbaca
                  </span>
                )}
              </div>
            )}
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Parsed Preview Table */}
          {parsedData.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Pratinjau Data Import ({parsedData.length} Item)</span>
                </div>
                <button
                  type="button"
                  onClick={() => { setParsedData([]); setFileName(''); }}
                  className="text-xs text-rose-600 hover:text-rose-800 font-semibold cursor-pointer"
                >
                  Bersihkan
                </button>
              </div>

              <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-64 overflow-y-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-100 border-b border-slate-200 text-[11px] font-bold text-slate-600 sticky top-0">
                    <tr>
                      <th className="py-2.5 px-3">Kode</th>
                      <th className="py-2.5 px-3">Nama Barang</th>
                      <th className="py-2.5 px-3">Spek / Type Barang</th>
                      <th className="py-2.5 px-3">Kategori</th>
                      <th className="py-2.5 px-3">UOM</th>
                      <th className="py-2.5 px-3 text-right">Min Stock</th>
                      <th className="py-2.5 px-3 text-right">Cost ({parsedData[0]?.currency || 'USD'})</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedData.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-2 px-3 font-mono font-bold text-indigo-600">{item.code}</td>
                        <td className="py-2 px-3 font-semibold text-slate-900">{item.name}</td>
                        <td className="py-2 px-3 text-slate-600 italic">
                          {item.specification ? (
                            <span className="px-1.5 py-0.5 bg-slate-100 rounded text-[11px] font-mono border border-slate-200">
                              {item.specification}
                            </span>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-[11px]">
                          <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 font-medium">
                            {getCategoryLabel(item.category)}
                          </span>
                        </td>
                        <td className="py-2 px-3 font-mono">{item.uom}</td>
                        <td className="py-2 px-3 text-right font-mono">{item.minimumStock}</td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-slate-800">
                          {item.standardCost.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            Batal
          </button>

          <button
            type="button"
            disabled={parsedData.length === 0}
            onClick={handleConfirmImport}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition shadow-sm ${
              parsedData.length > 0
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-emerald-600/30'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Proses Import ({parsedData.length} Item) Ke Database</span>
          </button>
        </div>

      </div>
    </div>
  );
};
