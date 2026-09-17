import React, { useState, useMemo, useRef } from 'react';
import {
  X,
  Upload,
  FileSpreadsheet,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Download,
  FileText,
  HelpCircle,
  RefreshCw
} from 'lucide-react';
import { Department, DeptPlanningItem, DeptPlanningSection, AppUser } from '../types';
import { DP_MONTHS } from '../constants/defaultData';
import { downloadExcelTemplate, parseDelimitedText, parseExcelWorkbook } from '../utils/excelImportExport';

interface DeptPlanningImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  departments: Department[];
  defaultDept?: string;
  defaultSection?: DeptPlanningSection;
  currentUser?: AppUser | null;
  onImportItems: (items: DeptPlanningItem[], section: DeptPlanningSection) => void;
}

export const DeptPlanningImportModal: React.FC<DeptPlanningImportModalProps> = ({
  isOpen,
  onClose,
  departments,
  defaultDept = 'ACC',
  defaultSection = 'budget',
  currentUser,
  onImportItems
}) => {
  // Check if current user is restricted to a single department
  const isDeptRestricted = currentUser?.role === 'dept_user' && !!currentUser?.deptCode;
  const userDeptCode = isDeptRestricted ? currentUser.deptCode! : defaultDept;

  const [targetSection, setTargetSection] = useState<DeptPlanningSection>(defaultSection);
  const [selectedDept, setSelectedDept] = useState<string>(userDeptCode);
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [rawInput, setRawInput] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'upload' | 'paste' | 'template'>('upload');
  const [fileName, setFileName] = useState<string>('');
  const [parsedItems, setParsedItems] = useState<DeptPlanningItem[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Available departments based on user role
  const availableDepts = useMemo(() => {
    if (isDeptRestricted) {
      return departments.filter(d => d.code.toUpperCase() === userDeptCode.toUpperCase());
    }
    return departments;
  }, [departments, isDeptRestricted, userDeptCode]);

  // When text in paste area changes, re-parse
  const handlePasteChange = (text: string) => {
    setRawInput(text);
    if (!text.trim()) {
      setParsedItems([]);
      setErrorMessage('');
      return;
    }
    try {
      const result = parseDelimitedText(text, targetSection, selectedDept, selectedYear, departments);
      if (result.items.length === 0) {
        setErrorMessage('Tidak ada baris data valid yang terdeteksi. Silakan periksa format baris Anda.');
      } else {
        setErrorMessage('');
      }
      setParsedItems(result.items);
    } catch (e: any) {
      setErrorMessage(`Gagal membaca data: ${e.message}`);
      setParsedItems([]);
    }
  };

  // Handle file upload (.xlsx, .xls, .csv, .tsv)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setErrorMessage('');

    const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
    const isCsvOrText = file.name.endsWith('.csv') || file.name.endsWith('.tsv') || file.name.endsWith('.txt');

    if (isExcel) {
      const reader = new FileReader();
      reader.onload = evt => {
        try {
          const buffer = evt.target?.result as ArrayBuffer;
          const res = parseExcelWorkbook(buffer, targetSection, selectedDept, selectedYear, departments);
          if (res.items.length === 0) {
            setErrorMessage('Tidak ada baris data valid di dalam sheet Excel.');
          }
          setParsedItems(res.items);
        } catch (err: any) {
          setErrorMessage(`Gagal memproses file Excel: ${err.message}`);
          setParsedItems([]);
        }
      };
      reader.readAsArrayBuffer(file);
    } else if (isCsvOrText) {
      const reader = new FileReader();
      reader.onload = evt => {
        try {
          const text = evt.target?.result as string;
          setRawInput(text);
          const res = parseDelimitedText(text, targetSection, selectedDept, selectedYear, departments);
          if (res.items.length === 0) {
            setErrorMessage('Tidak ada baris data valid di dalam file CSV.');
          }
          setParsedItems(res.items);
        } catch (err: any) {
          setErrorMessage(`Gagal memproses file CSV: ${err.message}`);
          setParsedItems([]);
        }
      };
      reader.readAsText(file);
    } else {
      setErrorMessage('Format file tidak didukung. Harap upload file Excel (.xlsx) atau CSV (.csv).');
    }
  };

  // Trigger download of official template
  const handleDownloadTemplate = (format: 'xlsx' | 'csv') => {
    const activeDeptObj = departments.find(d => d.code === selectedDept);
    const dName = activeDeptObj ? activeDeptObj.name : selectedDept;
    downloadExcelTemplate(targetSection, selectedDept, dName, selectedYear, format);
  };

  // Submit parsed items to parent
  const handleApplyImport = () => {
    if (parsedItems.length === 0) return;

    // Enforce dept restriction on imported items if user is restricted
    const itemsToSave = isDeptRestricted
      ? parsedItems.map(it => ({
          ...it,
          deptCode: userDeptCode,
          deptName: departments.find(d => d.code === userDeptCode)?.name || userDeptCode
        }))
      : parsedItems;

    onImportItems(itemsToSave, targetSection);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl p-6 sm:p-7 space-y-5 max-h-[94vh] overflow-y-auto border border-slate-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-2">
                <span>Import Budget / Cost Down / Plan</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                  Excel &amp; CSV
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Unggah file Excel/CSV atau tempel salinan sel baris Excel secara instan tanpa duplikasi.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer"
            title="Tutup Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Configuration Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs">
          <div>
            <label className="block text-slate-600 font-bold mb-1">
              Departemen Target {isDeptRestricted && <span className="text-indigo-600">(Terkunci)</span>}
            </label>
            {isDeptRestricted ? (
              <div className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-lg font-bold text-slate-800">
                {selectedDept} - {departments.find(d => d.code === selectedDept)?.name || selectedDept}
              </div>
            ) : (
              <select
                value={selectedDept}
                onChange={e => {
                  setSelectedDept(e.target.value);
                  if (rawInput) handlePasteChange(rawInput);
                }}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                {availableDepts.map(d => (
                  <option key={d.code} value={d.code}>
                    {d.code} - {d.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-slate-600 font-bold mb-1">Kategori Bagian Target</label>
            <select
              value={targetSection}
              onChange={e => {
                const sec = e.target.value as DeptPlanningSection;
                setTargetSection(sec);
                if (rawInput) handlePasteChange(rawInput);
              }}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="budget">A. BUDGET (Anggaran Awal)</option>
              <option value="costdown">B. COST DOWN (Program Efisiensi)</option>
              <option value="plan">C. PLAN (Rencana Departemen)</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-600 font-bold mb-1">Tahun Anggaran</label>
            <input
              type="number"
              value={selectedYear}
              onChange={e => {
                const yr = Number(e.target.value) || 2026;
                setSelectedYear(yr);
                if (rawInput) handlePasteChange(rawInput);
              }}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Action Tabs: Upload File / Copy-Paste / Contoh Form & Template */}
        <div className="flex border-b border-slate-200 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'upload'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload File (.xlsx / .csv)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('paste')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'paste'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Salin &amp; Tempel dari Excel</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('template')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'template'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>Download Contoh Form / Template</span>
          </button>
        </div>

        {/* TAB 1: UPLOAD FILE */}
        {activeTab === 'upload' && (
          <div className="space-y-4">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-indigo-200 hover:border-indigo-400 bg-indigo-50/40 hover:bg-indigo-50/70 transition p-6 rounded-2xl flex flex-col items-center justify-center gap-3 cursor-pointer text-center"
            >
              <div className="p-3 bg-indigo-100 text-indigo-600 rounded-full">
                <FileSpreadsheet className="w-8 h-8" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">
                  Klik di sini untuk memilih file Excel (.xlsx, .xls) atau CSV (.csv)
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Format otomatis mendeteksi kolom Code, Account No, Item, dan sebaran 12 bulan (Jan - Des).
                </p>
              </div>
              {fileName ? (
                <div className="px-3 py-1.5 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-lg flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>File Terpilih: {fileName}</span>
                </div>
              ) : (
                <span className="text-xs font-semibold text-indigo-600 underline">
                  Pilih Berkas dari Komputer
                </span>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv,.tsv"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          </div>
        )}

        {/* TAB 2: COPY-PASTE FROM EXCEL */}
        {activeTab === 'paste' && (
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-700">
                Salin baris dari Excel (blok sel lalu Ctrl+C) kemudian tempel di bawah:
              </span>
              <button
                type="button"
                onClick={() => {
                  setRawInput('');
                  setParsedItems([]);
                  setErrorMessage('');
                }}
                className="text-slate-400 hover:text-slate-600 text-[11px] font-medium"
              >
                Bersihkan Teks
              </button>
            </div>
            <textarea
              rows={6}
              value={rawInput}
              onChange={e => handlePasteChange(e.target.value)}
              placeholder={`Contoh salinan Excel langsung:\n${selectedDept}\tBD${selectedDept}-001\t3600021\tConsultant fee - Mennix\t5000\t0\t0\t1500\t2000\t0\t0\t0\t1500\t0\t0\t0\t0\t5000`}
              className="w-full p-3 border border-slate-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-slate-50"
            />
          </div>
        )}

        {/* TAB 3: DOWNLOAD TEMPLATE & FORMAT GUIDELINES */}
        {activeTab === 'template' && (
          <div className="space-y-4 p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 pb-3 border-b border-slate-200">
              <div>
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Download className="w-4 h-4 text-emerald-600" />
                  <span>Download Formulir Standar Siap Pakai</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Gunakan template ini untuk mengisi data anggaran dengan cepat dan menghindari kesalahan susunan kolom.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDownloadTemplate('xlsx')}
                  className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Download Excel (.xlsx)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadTemplate('csv')}
                  className="px-3.5 py-2 rounded-lg bg-slate-700 hover:bg-slate-800 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <FileText className="w-4 h-4" />
                  <span>Download CSV (.csv)</span>
                </button>
              </div>
            </div>

            {/* Template Column Structure Guide */}
            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Panduan Struktur Kolom Formulir:
              </h4>
              <div className="overflow-x-auto border border-slate-200 rounded-lg bg-white">
                <table className="w-full text-[11px] text-left border-collapse">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-2">No</th>
                      <th className="p-2">Nama Kolom</th>
                      <th className="p-2">Wajib?</th>
                      <th className="p-2">Contoh Pengisian</th>
                      <th className="p-2">Penjelasan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="p-2 font-bold">1</td>
                      <td className="p-2 font-mono font-bold text-indigo-700">Dept Code</td>
                      <td className="p-2 text-emerald-600 font-bold">Ya</td>
                      <td className="p-2 font-mono">{selectedDept}</td>
                      <td className="p-2 text-slate-500">Kode departemen (ACC, ENG, FIN, HRD, dll)</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-bold">2</td>
                      <td className="p-2 font-mono font-bold text-indigo-700">Code</td>
                      <td className="p-2 text-slate-400">Opsional</td>
                      <td className="p-2 font-mono">BD{selectedDept}-001</td>
                      <td className="p-2 text-slate-500">Kode pos budget/cost down (otomatis dibuat jika kosong)</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-bold">3</td>
                      <td className="p-2 font-mono font-bold text-indigo-700">Account No</td>
                      <td className="p-2 text-emerald-600 font-bold">Ya</td>
                      <td className="p-2 font-mono">3600021</td>
                      <td className="p-2 text-slate-500">Nomor akun COA pembukuan</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-bold">4</td>
                      <td className="p-2 font-mono font-bold text-indigo-700">Account Name</td>
                      <td className="p-2 text-slate-400">Opsional</td>
                      <td className="p-2">G&amp;A - Consultant fee</td>
                      <td className="p-2 text-slate-500">Nama akun akuntansi</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-bold">5</td>
                      <td className="p-2 font-mono font-bold text-indigo-700">Item Budget / Program</td>
                      <td className="p-2 text-emerald-600 font-bold">Ya</td>
                      <td className="p-2">Jasa Konsultan TP Doc 2026</td>
                      <td className="p-2 text-slate-500">Nama rincian kegiatan / program efisiensi</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-bold">6</td>
                      <td className="p-2 font-mono font-bold text-indigo-700">Start Date</td>
                      <td className="p-2 text-slate-400">Opsional</td>
                      <td className="p-2 font-mono">2026-01-01</td>
                      <td className="p-2 text-slate-500">Tanggal mulai pos anggaran (format YYYY-MM-DD atau DD/MM/YYYY)</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-bold">7</td>
                      <td className="p-2 font-mono font-bold text-indigo-700">Indicator Date</td>
                      <td className="p-2 text-slate-400">Opsional</td>
                      <td className="p-2 font-mono">2026-12-31</td>
                      <td className="p-2 text-slate-500">Tanggal indikator/evaluasi target</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-bold">8</td>
                      <td className="p-2 font-mono font-bold text-indigo-700">Jan s/d Des (12 Kolom)</td>
                      <td className="p-2 text-emerald-600 font-bold">Ya</td>
                      <td className="p-2 font-mono">0, 0, 1500, 2000...</td>
                      <td className="p-2 text-slate-500">Nominal distribusi anggaran per bulan dalam USD</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-bold">9</td>
                      <td className="p-2 font-mono font-bold text-indigo-700">Total USD</td>
                      <td className="p-2 text-slate-400">Opsional</td>
                      <td className="p-2 font-mono font-bold">3500</td>
                      <td className="p-2 text-slate-500">Total keseluruhan tahunan (otomatis dijumlah dari bulan jika kosong)</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-bold">10</td>
                      <td className="p-2 font-mono font-bold text-indigo-700">Notes / Catatan</td>
                      <td className="p-2 text-slate-400">Opsional</td>
                      <td className="p-2">Ref efisiensi termin</td>
                      <td className="p-2 text-slate-500">Keterangan tambahan untuk referensi</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Error message */}
        {errorMessage && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Anti-Duplicate Protection Banner */}
        <div className="flex items-center gap-2.5 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800">
          <ShieldCheck className="w-5 h-5 shrink-0 text-emerald-600" />
          <div className="flex-1 font-medium">
            <b>Sistem Proteksi Anti-Duplikasi Otomatis:</b> Data dengan Kode Pos atau Akun + Item yang sama akan diperbarui (update), sehingga database Anda selalu bersih tanpa duplikat ganda.
          </div>
        </div>

        {/* Parsed Preview Table */}
        {parsedItems.length > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>Terdeteksi {parsedItems.length} Baris Data Valid Siap Diimpor:</span>
              </span>
              <span className="text-slate-600 text-xs">
                Total Anggaran: <b className="text-slate-900 font-mono">${parsedItems.reduce((s, r) => s + (r.totalUSD || 0), 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} USD</b>
              </span>
            </div>

            <div className="overflow-x-auto max-h-56 border border-slate-200 rounded-xl bg-slate-50/50">
              <table className="w-full text-left text-[11px] border-collapse">
                <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0 border-b border-slate-200">
                  <tr>
                    <th className="p-2">Dept</th>
                    <th className="p-2">Bagian</th>
                    <th className="p-2">Code</th>
                    <th className="p-2">Account No</th>
                    <th className="p-2">Item</th>
                    <th className="p-2">Start Date</th>
                    <th className="p-2">Indicator Date</th>
                    <th className="p-2 text-right">Total USD</th>
                    <th className="p-2 text-center">Bulan Terisi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {parsedItems.map((r, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="p-2 font-bold text-slate-700">{r.deptCode}</td>
                      <td className="p-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          r.section === 'budget' ? 'bg-indigo-100 text-indigo-700' :
                          r.section === 'costdown' ? 'bg-emerald-100 text-emerald-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>
                          {r.section.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-2 font-mono font-semibold text-slate-800">{r.code}</td>
                      <td className="p-2 font-mono text-slate-600">{r.accountNo || '-'}</td>
                      <td className="p-2 font-medium truncate max-w-xs text-slate-900">
                        <div>{r.item}</div>
                        {r.notes && <div className="text-[10px] text-slate-400 truncate">{r.notes}</div>}
                      </td>
                      <td className="p-2 font-mono text-slate-500">{r.budgetStartDate || '-'}</td>
                      <td className="p-2 font-mono text-slate-500">{r.indicatorDate || '-'}</td>
                      <td className="p-2 text-right font-mono font-bold text-indigo-700">
                        ${(r.totalUSD || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-2 text-center text-[10px] text-slate-500">
                        {DP_MONTHS.filter(m => (r.monthly?.[m] || 0) !== 0).length} bulan
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <div className="text-xs text-slate-500">
            {parsedItems.length > 0 && `${parsedItems.length} item siap dimasukkan ke kategori ${targetSection.toUpperCase()}`}
          </div>
          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              disabled={parsedItems.length === 0}
              onClick={handleApplyImport}
              className={`px-5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                parsedItems.length > 0
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer shadow-md shadow-indigo-600/20'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <span>Terapkan {parsedItems.length} Data ke {targetSection.toUpperCase()}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
