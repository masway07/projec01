import React, { useState, useRef } from 'react';
import { COA, Department, ExchangeRates, FixedAssetItem, FixedAssetMonthlyDepreciation } from '../types';
import { X, Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle2, RefreshCw, Sparkles, HelpCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import { SAMPLE_FIXED_ASSETS_FOR_IMPORT } from '../constants/defaultData';

interface FixedAssetImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (items: Partial<FixedAssetItem>[]) => void;
  departments: Department[];
  coaList: COA[];
  ratesByYear: Record<string, ExchangeRates>;
  currentYear?: number;
}

export const FixedAssetImportModal: React.FC<FixedAssetImportModalProps> = ({
  isOpen,
  onClose,
  onImport,
  departments,
  coaList,
  ratesByYear,
  currentYear = 2026
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [parsedData, setParsedData] = useState<Partial<FixedAssetItem>[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [showSampleGuide, setShowSampleGuide] = useState<boolean>(false);

  if (!isOpen) return null;

  // Download Sample Template with comprehensive examples
  const handleDownloadTemplate = () => {
    const headers = [
      'Description',
      'Invoice No',
      'KI NO',
      'Qty',
      'Acquisition date (YYYY-MM-DD)',
      'Department',
      'COA Code',
      'Currency',
      'Acquisition Cost (Original Currency)',
      'Asset Type (NEW / CAPITALIZATION)',
      'Parent KI NO (Jika Kapitalisasi)',
      'Useful Life (Years)',
      `Accumulated Depreciation ${currentYear - 1} (USD)`,
      'Jan (USD)',
      'Feb (USD)',
      'Mar (USD)',
      'Apr (USD)',
      'May (USD)',
      'Jun (USD)',
      'Jul (USD)',
      'Aug (USD)',
      'Sep (USD)',
      'Oct (USD)',
      'Nov (USD)',
      'Dec (USD)'
    ];

    const sampleRows = SAMPLE_FIXED_ASSETS_FOR_IMPORT.map(item => [
      item.description || item.name || '',
      item.invoiceNo || '',
      item.kiNo || item.code || '',
      item.qty || 1,
      item.acquisitionDate || '2026-01-01',
      item.deptCode || 'PROD',
      item.coaCode || '1110003',
      item.currency || 'USD',
      item.originalCost || item.acquisitionCostUSD || 0,
      item.assetType || 'NEW',
      item.parentAssetKiNo || '',
      item.usefulLifeYears || 4,
      item.priorAccumDepreciation || 0,
      item.monthlyDepreciation?.Jan || 0,
      item.monthlyDepreciation?.Feb || 0,
      item.monthlyDepreciation?.Mar || 0,
      item.monthlyDepreciation?.Apr || 0,
      item.monthlyDepreciation?.May || 0,
      item.monthlyDepreciation?.Jun || 0,
      item.monthlyDepreciation?.Jul || 0,
      item.monthlyDepreciation?.Aug || 0,
      item.monthlyDepreciation?.Sep || 0,
      item.monthlyDepreciation?.Oct || 0,
      item.monthlyDepreciation?.Nov || 0,
      item.monthlyDepreciation?.Dec || 0
    ]);

    const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleRows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template_Fixed_Asset');
    XLSX.writeFile(wb, `Template_Import_Fixed_Asset_${currentYear}.xlsx`);
  };

  // Load Sample Example into preview
  const handleLoadSampleExamples = () => {
    setErrorMsg('');
    setFileName('contoh_data_fixed_asset.xlsx (Data Contoh Demo)');
    setParsedData(SAMPLE_FIXED_ASSETS_FOR_IMPORT);
  };

  // Handle File Upload
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
        const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });

        if (rows.length < 2) {
          setErrorMsg('File kosong atau tidak memiliki baris data.');
          setIsProcessing(false);
          return;
        }

        const items: Partial<FixedAssetItem>[] = [];
        const currentRates = ratesByYear[String(currentYear)] || { IDR: 16273.56, JPY: 142.54, CNY: 0.14, EUR: 0.92 };

        // Parse from row index 1 (skipping header)
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row || row.length === 0 || !row[0]) continue;

          const description = String(row[0] || '').trim();
          const invoiceNo = String(row[1] || '').trim();
          const kiNo = String(row[2] || '').trim() || `KI-${currentYear}-${Math.floor(1000 + Math.random() * 9000)}`;
          const qty = Number(row[3]) || 1;

          let acqDate = '';
          if (row[4] instanceof Date) {
            acqDate = row[4].toISOString().split('T')[0];
          } else if (typeof row[4] === 'string') {
            acqDate = row[4].trim();
          } else {
            acqDate = `${currentYear}-01-01`;
          }

          const deptCode = String(row[5] || 'ACC').trim().toUpperCase();
          const coaCode = String(row[6] || '1110003').trim();
          const currency = String(row[7] || 'USD').trim().toUpperCase();
          const originalCost = Number(row[8]) || 0;
          const assetType = String(row[9] || 'NEW').trim().toUpperCase() === 'CAPITALIZATION' ? 'CAPITALIZATION' : 'NEW';
          const parentAssetKiNo = String(row[10] || '').trim();
          const usefulLifeYears = Number(row[11]) || 4;
          const usefulLifeMonths = Math.round(usefulLifeYears * 12);

          let rate = 1;
          if (currency === 'USD') rate = 1;
          else if (currency === 'IDR') rate = currentRates.IDR || 16273.56;
          else if (currency === 'JPY') rate = currentRates.JPY || 142.54;
          else if (currency === 'CNY') rate = currentRates.CNY || 0.14;
          else if (currency === 'EUR') rate = currentRates.EUR || 0.92;

          const acquisitionCostUSD = currency === 'USD' ? originalCost : originalCost / (rate || 1);
          let priorAccum = Number(row[12]) || 0;

          // Read monthly or auto-calculate
          const mDep: FixedAssetMonthlyDepreciation = {
            Jan: Number(row[13]) || 0,
            Feb: Number(row[14]) || 0,
            Mar: Number(row[15]) || 0,
            Apr: Number(row[16]) || 0,
            May: Number(row[17]) || 0,
            Jun: Number(row[18]) || 0,
            Jul: Number(row[19]) || 0,
            Aug: Number(row[20]) || 0,
            Sep: Number(row[21]) || 0,
            Oct: Number(row[22]) || 0,
            Nov: Number(row[23]) || 0,
            Dec: Number(row[24]) || 0
          };

          // If all monthly are 0, auto compute straight line
          const sumMonthly = Object.values(mDep).reduce((a, b) => a + b, 0);
          if (sumMonthly === 0 && acquisitionCostUSD > 0 && usefulLifeMonths > 0) {
            const monthlyRate = acquisitionCostUSD / usefulLifeMonths;
            const acqYear = parseInt(acqDate.split('-')[0]) || currentYear;
            const acqMonth = (parseInt(acqDate.split('-')[1]) || 1) - 1;

            if (acqYear < currentYear && priorAccum === 0) {
              const pMonths = (currentYear - acqYear - 1) * 12 + (12 - acqMonth);
              priorAccum = Math.min(acquisitionCostUSD, pMonths * monthlyRate);
            }

            let running = priorAccum;
            const mKeys: (keyof FixedAssetMonthlyDepreciation)[] = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            mKeys.forEach((k, idx) => {
              if (acqYear === currentYear && idx < acqMonth) {
                mDep[k] = 0;
              } else if (acqYear > currentYear) {
                mDep[k] = 0;
              } else {
                const rem = Math.max(0, acquisitionCostUSD - running);
                const dep = Math.min(monthlyRate, rem);
                mDep[k] = Number(dep.toFixed(2));
                running += dep;
              }
            });
          }

          const totalDepYear = Object.values(mDep).reduce((a, b) => a + b, 0);
          const accumulatedUSD = priorAccum + totalDepYear;
          const nbvUSD = Math.max(0, acquisitionCostUSD - accumulatedUSD);

          const coaObj = coaList.find(c => c.code === coaCode);

          // Smart COA mapping for Expense and Accum Depr
          const isGA = ['HRGA', 'ACC', 'FIN', 'GA', 'DIR', 'SALES', 'MKT'].includes(deptCode);
          const expCode = isGA ? '6010021' : '5500027';
          const expCoaObj = coaList.find(c => c.code === expCode);

          let accCode = '1120003';
          if (coaCode === '1110002') accCode = '1120002';
          else if (coaCode === '1110005') accCode = '1120005';
          else if (coaCode === '1170001') accCode = '1170001';
          const accCoaObj = coaList.find(c => c.code === accCode);

          items.push({
            description,
            name: description,
            invoiceNo: invoiceNo || `INV-${currentYear}-${i}`,
            kiNo,
            code: kiNo,
            qty,
            acquisitionDate: acqDate,
            deptCode,
            coaCode,
            coaName: coaObj ? coaObj.name : 'Fixed Asset',
            currency,
            originalCost,
            rate,
            acquisitionCostUSD,
            value: originalCost,
            usd: acquisitionCostUSD,

            depreciationExpenseCoaCode: expCode,
            depreciationExpenseCoaName: expCoaObj ? expCoaObj.name : 'Depreciation Expense',
            accumulatedDepreciationCoaCode: accCode,
            accumulatedDepreciationCoaName: accCoaObj ? accCoaObj.name : 'Accumulated Depreciation',

            assetType,
            parentAssetKiNo,
            usefulLifeYears,
            usefulLifeMonths,

            priorAccumDepreciation: Number(priorAccum.toFixed(2)),
            monthlyDepreciation: mDep,
            totalDepreciationYear: Number(totalDepYear.toFixed(2)),
            accumulatedDepreciationUSD: Number(accumulatedUSD.toFixed(2)),
            netBookValueUSD: Number(nbvUSD.toFixed(2)),

            status: 'Active',
            year: currentYear
          });
        }

        setParsedData(items);
        setIsProcessing(false);
      } catch (err: any) {
        console.error('Error importing file:', err);
        setErrorMsg(`Gagal memproses file: ${err.message || 'Format tidak didukung'}`);
        setIsProcessing(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleConfirmImport = () => {
    if (parsedData.length === 0) return;
    onImport(parsedData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 my-6">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold">Import Data Fixed Asset</h3>
              <p className="text-xs text-slate-400">
                Upload berkas Excel (.xlsx) atau CSV untuk import aset tetap dan depresiasi secara massal
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Step 1: Download Template or Load Sample */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                <span>1. Unduh Template Excel & Data Contoh</span>
                <span className="bg-indigo-100 text-indigo-800 text-[10px] font-bold px-2 py-0.5 rounded-md">Contoh Format</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Template sudah berisi 3 contoh lengkap: <strong>Mesin Baru (USD)</strong>, <strong>Kapitalisasi (IDR)</strong>, dan <strong>Kendaraan</strong>.
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
              <button
                type="button"
                onClick={handleLoadSampleExamples}
                className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs text-xs whitespace-nowrap"
                title="Tampilkan data contoh langsung di pratinjau import"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>Muat Contoh di Pratinjau</span>
              </button>
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="px-3.5 py-2 bg-white hover:bg-slate-100 text-emerald-800 border border-emerald-300 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs text-xs whitespace-nowrap"
              >
                <Download className="w-4 h-4 text-emerald-600" />
                <span>Download Template (.xlsx)</span>
              </button>
            </div>
          </div>

          {/* Step 2: Upload File */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
            <div className="font-bold text-slate-800 text-xs">2. Upload Berkas Excel / CSV</div>
            <input
              type="file"
              ref={fileInputRef}
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
              className="hidden"
            />
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 hover:border-indigo-500 bg-white rounded-2xl p-6 text-center cursor-pointer transition hover:bg-indigo-50/20 flex flex-col items-center justify-center gap-2"
            >
              <FileSpreadsheet className="w-8 h-8 text-indigo-600" />
              <div>
                <span className="font-bold text-indigo-700">Klik untuk memilih berkas</span> atau seret file ke sini
              </div>
              <span className="text-[10px] text-slate-400">Mendukung format .xlsx, .xls, .csv</span>
              {fileName && (
                <div className="mt-2 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{fileName}</span>
                </div>
              )}
            </div>
          </div>

          {/* Preview Table */}
          {parsedData.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between font-bold text-slate-800 text-xs">
                <span>Pratinjau Data ({parsedData.length} Aset):</span>
                <span className="text-indigo-700 font-mono">
                  Total Acq: ${parsedData.reduce((a, b) => a + (b.acquisitionCostUSD || 0), 0).toLocaleString('en-US', { maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl overflow-x-auto">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0">
                    <tr>
                      <th className="p-2">KI NO</th>
                      <th className="p-2">Invoice No</th>
                      <th className="p-2">Description</th>
                      <th className="p-2 text-right">Cost (USD)</th>
                      <th className="p-2 text-center">Type</th>
                      <th className="p-2 text-right">Total Depr</th>
                      <th className="p-2 text-right">NBV (USD)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {parsedData.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-2 font-bold text-indigo-900">{item.kiNo}</td>
                        <td className="p-2">{item.invoiceNo}</td>
                        <td className="p-2 font-sans font-medium text-slate-800">{item.description}</td>
                        <td className="p-2 text-right text-indigo-700">${item.acquisitionCostUSD?.toLocaleString('en-US', { maximumFractionDigits: 2 })}</td>
                        <td className="p-2 text-center font-sans">
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${item.assetType === 'CAPITALIZATION' ? 'bg-purple-100 text-purple-800' : 'bg-slate-100 text-slate-700'}`}>
                            {item.assetType}
                          </span>
                        </td>
                        <td className="p-2 text-right">${item.totalDepreciationYear?.toLocaleString('en-US', { maximumFractionDigits: 2 })}</td>
                        <td className="p-2 text-right font-bold text-emerald-700">${item.netBookValueUSD?.toLocaleString('en-US', { maximumFractionDigits: 2 })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer font-semibold"
            >
              Batal
            </button>
            <button
              type="button"
              disabled={parsedData.length === 0 || isProcessing}
              onClick={handleConfirmImport}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-xl shadow-md shadow-emerald-600/20 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>Import {parsedData.length} Fixed Asset</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
