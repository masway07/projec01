import React, { useState, useMemo, useEffect } from 'react';
import {
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Layers,
  DollarSign,
  TrendingDown,
  Calendar,
  AlertCircle,
  Upload,
  Sparkles,
  ShieldCheck,
  Lock,
  CheckSquare,
  Square,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  FileSpreadsheet,
  LayoutGrid
} from 'lucide-react';
import { AppUser, Department, DeptPlanningItem, DeptPlanningSection } from '../types';
import { DP_MONTHS } from '../constants/defaultData';
import { formatAmountWithCurrency, formatPlainUSD, formatUSD } from '../utils/formatters';
import { DeptPlanningImportModal } from './DeptPlanningImportModal';

interface DeptPlanningViewProps {
  items: DeptPlanningItem[];
  departments: Department[];
  currentUser?: AppUser | null;
  onOpenModal: (section?: DeptPlanningSection, item?: DeptPlanningItem) => void;
  onDeleteItem: (id: string) => void;
  onDeleteBatchItems?: (ids: string[]) => void;
  onBatchUpsertItems?: (items: DeptPlanningItem[], section: DeptPlanningSection) => void;
  onDeduplicateItems?: () => void;
  activeBudgetTab?: 'dashboard' | 'planner' | 'deptPlanning' | 'realisasi';
  onSwitchBudgetTab?: (tab: 'dashboard' | 'planner' | 'deptPlanning' | 'realisasi') => void;
}

export const DeptPlanningView: React.FC<DeptPlanningViewProps> = ({
  items,
  departments,
  currentUser,
  onOpenModal,
  onDeleteItem,
  onDeleteBatchItems,
  onBatchUpsertItems,
  onDeduplicateItems,
  activeBudgetTab = 'deptPlanning',
  onSwitchBudgetTab
}) => {
  // Check if current user is restricted to their own department
  const isDeptRestricted = currentUser?.role === 'dept_user' && !!currentUser?.deptCode;
  const userDeptCode = isDeptRestricted ? currentUser.deptCode! : '';

  const [deptFilter, setDeptFilter] = useState<string>(userDeptCode);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [importSection, setImportSection] = useState<DeptPlanningSection>('budget');

  // Multi-select state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Pagination state per section (budget, costdown, plan)
  const [pageSizeBySection, setPageSizeBySection] = useState<Record<DeptPlanningSection, number | 'all'>>({
    budget: 10,
    costdown: 10,
    plan: 10
  });

  const [pageBySection, setPageBySection] = useState<Record<DeptPlanningSection, number>>({
    budget: 1,
    costdown: 1,
    plan: 1
  });

  // Delete Confirmation Modal State (Reliable in iframes & browsers without window.confirm)
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    count: number;
    confirmText?: string;
    onConfirm: () => void;
  } | null>(null);

  // Keep deptFilter locked if user is dept_user
  useEffect(() => {
    if (isDeptRestricted) {
      setDeptFilter(userDeptCode);
    }
  }, [isDeptRestricted, userDeptCode]);

  // Available departments based on role
  const availableDepartments = useMemo(() => {
    if (isDeptRestricted) {
      return departments.filter(d => d.code.toUpperCase() === userDeptCode.toUpperCase());
    }
    return departments;
  }, [departments, isDeptRestricted, userDeptCode]);

  // Available years from items
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    items.forEach(item => {
      if (item.year) years.add(item.year);
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [items]);

  // Filter items - dept_user ONLY sees their own department items
  const filteredItems = useMemo(() => {
    return items.filter(x => {
      // Security check: if dept_user, strictly force their department
      const effectiveDept = isDeptRestricted ? userDeptCode : deptFilter;
      const matchDept = !effectiveDept || x.deptCode.toUpperCase() === effectiveDept.toUpperCase();
      const matchYear = selectedYear === 'all' || String(x.year) === selectedYear;

      const q = searchQuery.toLowerCase().trim();
      const matchQuery = !q || (
        (x.code || '').toLowerCase().includes(q) ||
        (x.deptCode || '').toLowerCase().includes(q) ||
        (x.deptName || '').toLowerCase().includes(q) ||
        (x.accountNo || '').toLowerCase().includes(q) ||
        (x.accountName || '').toLowerCase().includes(q) ||
        (x.item || '').toLowerCase().includes(q) ||
        (x.type || '').toLowerCase().includes(q) ||
        (x.costCategory || '').toLowerCase().includes(q) ||
        (x.currency || '').toLowerCase().includes(q)
      );

      return matchDept && matchYear && matchQuery;
    });
  }, [items, isDeptRestricted, userDeptCode, deptFilter, selectedYear, searchQuery]);

  const budgetItems = useMemo(() => filteredItems.filter(x => x.section === 'budget'), [filteredItems]);
  const costDownItems = useMemo(() => filteredItems.filter(x => x.section === 'costdown'), [filteredItems]);
  const planItems = useMemo(() => filteredItems.filter(x => x.section === 'plan'), [filteredItems]);

  const calcSectionTotalUSD = (list: DeptPlanningItem[]) => {
    return list.reduce((sum, x) => {
      const monthlySum = DP_MONTHS.reduce<number>((s, m) => s + (Number(x.monthly?.[m]) || 0), 0);
      return sum + (monthlySum > 0 ? monthlySum : (Number(x.totalUSD) || 0));
    }, 0);
  };

  const budgetTotalUSD = useMemo(() => calcSectionTotalUSD(budgetItems), [budgetItems]);
  const costDownTotalUSD = useMemo(() => calcSectionTotalUSD(costDownItems), [costDownItems]);

  // Toggle selection for a single item
  const handleToggleItem = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Delete batch items for a section
  const handleDeleteBatchSection = (idsToDelete: string[], sectionTitle: string) => {
    if (idsToDelete.length === 0) return;
    setDeleteConfirmModal({
      isOpen: true,
      title: `Hapus ${idsToDelete.length} Data Terpilih`,
      description: `Apakah Anda yakin ingin menghapus ${idsToDelete.length} data yang dipilih dari ${sectionTitle}?`,
      count: idsToDelete.length,
      confirmText: `Ya, Hapus ${idsToDelete.length} Data`,
      onConfirm: () => {
        if (onDeleteBatchItems) {
          onDeleteBatchItems(idsToDelete);
        } else {
          idsToDelete.forEach(id => onDeleteItem(id));
        }
        setSelectedIds(prev => {
          const next = new Set(prev);
          idsToDelete.forEach(id => next.delete(id));
          return next;
        });
      }
    });
  };

  // Delete ALL items in a section
  const handleDeleteAllSection = (sectionList: DeptPlanningItem[], sectionTitle: string) => {
    if (sectionList.length === 0) return;
    const allIds = sectionList.map(x => x.id);
    setDeleteConfirmModal({
      isOpen: true,
      title: `Hapus Semua Data di ${sectionTitle}`,
      description: `Apakah Anda yakin ingin menghapus seluruh ${allIds.length} data pada ${sectionTitle}? Tindakan ini akan menghapus semua pos anggaran di kategori ini secara permanen.`,
      count: allIds.length,
      confirmText: `Ya, Hapus Semua (${allIds.length} Data)`,
      onConfirm: () => {
        if (onDeleteBatchItems) {
          onDeleteBatchItems(allIds);
        } else {
          allIds.forEach(id => onDeleteItem(id));
        }
        setSelectedIds(prev => {
          const next = new Set(prev);
          allIds.forEach(id => next.delete(id));
          return next;
        });
      }
    });
  };

  const handleConfirmDeleteSingle = (item: DeptPlanningItem) => {
    setDeleteConfirmModal({
      isOpen: true,
      title: `Hapus Data ${item.code}`,
      description: `Apakah Anda yakin ingin menghapus "${item.code} - ${item.item}" (${item.accountNo})?`,
      count: 1,
      confirmText: 'Ya, Hapus Data',
      onConfirm: () => {
        onDeleteItem(item.id);
        setSelectedIds(prev => {
          const next = new Set(prev);
          next.delete(item.id);
          return next;
        });
      }
    });
  };

  const renderTableSection = (
    title: string,
    sectionKey: DeptPlanningSection,
    badgeColor: string,
    list: DeptPlanningItem[],
    countId: string,
    tableId: string
  ) => {
    const pageSize = pageSizeBySection[sectionKey];
    const currentPage = pageBySection[sectionKey] || 1;
    const totalCount = list.length;
    const totalPages = pageSize === 'all' ? 1 : Math.max(1, Math.ceil(totalCount / Number(pageSize)));
    const safeCurrentPage = Math.min(currentPage, totalPages);

    const pagedList = (() => {
      if (pageSize === 'all') return list;
      const size = Number(pageSize);
      const start = (safeCurrentPage - 1) * size;
      return list.slice(start, start + size);
    })();

    // Selected in this section
    const sectionSelectedIds = list.filter(item => selectedIds.has(item.id)).map(item => item.id);
    const isAllCurrentPageSelected = pagedList.length > 0 && pagedList.every(x => selectedIds.has(x.id));
    const isAllSectionSelected = list.length > 0 && list.every(x => selectedIds.has(x.id));

    const toggleSelectCurrentPage = () => {
      setSelectedIds(prev => {
        const next = new Set(prev);
        if (isAllCurrentPageSelected) {
          pagedList.forEach(x => next.delete(x.id));
        } else {
          pagedList.forEach(x => next.add(x.id));
        }
        return next;
      });
    };

    const toggleSelectAllSection = () => {
      setSelectedIds(prev => {
        const next = new Set(prev);
        if (isAllSectionSelected) {
          list.forEach(x => next.delete(x.id));
        } else {
          list.forEach(x => next.add(x.id));
        }
        return next;
      });
    };

    const clearSectionSelection = () => {
      setSelectedIds(prev => {
        const next = new Set(prev);
        list.forEach(x => next.delete(x.id));
        return next;
      });
    };

    // Calculate monthly column totals for the whole section
    const monthTotals = DP_MONTHS.reduce((acc, m) => {
      acc[m] = list.reduce((sum, item) => sum + (Number(item.monthly?.[m]) || 0), 0);
      return acc;
    }, {} as Record<string, number>);

    const grandTotalUSD = list.reduce((sum, item) => {
      const mSum = DP_MONTHS.reduce<number>((s, m) => s + (Number(item.monthly?.[m]) || 0), 0);
      return sum + (mSum > 0 ? mSum : (Number(item.totalUSD) || 0));
    }, 0);

    const startItem = totalCount === 0 ? 0 : pageSize === 'all' ? 1 : (safeCurrentPage - 1) * Number(pageSize) + 1;
    const endItem = pageSize === 'all' ? totalCount : Math.min(safeCurrentPage * Number(pageSize), totalCount);

    return (
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-slate-800 text-lg">{title}</h2>
              <span id={countId} className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${badgeColor}`}>
                {totalCount} Data
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {sectionKey === 'budget' && 'Data Anggaran Awal departemen yang telah disimpan.'}
              {sectionKey === 'costdown' && 'Data program efisiensi & pengurangan budget departemen.'}
              {sectionKey === 'plan' && 'Data rencana & planning strategis departemen.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Page Size Selector */}
            <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">
              <span className="font-medium text-slate-500">Tampilkan:</span>
              {( [10, 15, 20, 50, 'all'] as const).map(size => (
                <button
                  key={size}
                  onClick={() => {
                    setPageSizeBySection(prev => ({ ...prev, [sectionKey]: size }));
                    setPageBySection(prev => ({ ...prev, [sectionKey]: 1 }));
                  }}
                  className={`px-2 py-0.5 rounded font-bold transition text-xs ${
                    pageSize === size
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {size === 'all' ? 'All' : size}
                </button>
              ))}
            </div>

            {/* Delete All Button (Danger) */}
            {list.length > 0 && (
              <button
                onClick={() => handleDeleteAllSection(list, title)}
                title={`Hapus semua data yang ada di ${title}`}
                className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold border border-rose-200 transition flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span>Hapus Semua ({totalCount})</span>
              </button>
            )}

            <button
              onClick={() => onOpenModal(sectionKey)}
              className="px-3.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold border border-indigo-200 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah ke {title}</span>
            </button>
          </div>
        </div>

        {/* Batch Selection Action Bar */}
        {sectionSelectedIds.length > 0 && (
          <div className="bg-indigo-50/90 border border-indigo-200 p-3 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs animate-fadeIn">
            <div className="flex items-center gap-2 text-indigo-900 font-medium">
              <CheckSquare className="w-4 h-4 text-indigo-600" />
              <span>
                <strong>{sectionSelectedIds.length}</strong> dari <strong>{totalCount}</strong> data dipilih di <strong>{title}</strong>
              </span>
              {sectionSelectedIds.length < totalCount && (
                <button
                  onClick={toggleSelectAllSection}
                  className="text-indigo-600 hover:text-indigo-800 underline font-bold ml-1 cursor-pointer"
                >
                  Pilih Semua ({totalCount} Data)
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleDeleteBatchSection(sectionSelectedIds, title)}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus Terpilih ({sectionSelectedIds.length})</span>
              </button>
              <button
                onClick={clearSectionSelection}
                className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded-lg border border-slate-300 font-semibold transition cursor-pointer"
              >
                Batal Pilih
              </button>
            </div>
          </div>
        )}

        {/* Table Container */}
        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table id={tableId} className="w-full text-left text-xs border-collapse" style={{ minWidth: '2280px' }}>
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <th className="p-3 w-12 text-center sticky left-0 bg-slate-50 z-10 border-r border-slate-200">
                  <input
                    type="checkbox"
                    checked={isAllCurrentPageSelected}
                    onChange={toggleSelectCurrentPage}
                    title={isAllCurrentPageSelected ? 'Batalkan pilihan halaman ini' : 'Pilih semua di halaman ini'}
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                  />
                </th>
                <th className="p-3 w-16">Dept</th>
                <th className="p-3 w-28">Code Budget</th>
                <th className="p-3 w-28">Account No</th>
                <th className="p-3 min-w-[200px]">Account Name</th>
                <th className="p-3 min-w-[240px]">Item Budget</th>
                <th className="p-3 w-20">Type</th>
                <th className="p-3 w-28">Cost Category</th>
                <th className="p-3 w-28">Start Date</th>
                <th className="p-3 w-28">Indicator Date</th>
                <th className="p-3 w-28">Business Func</th>
                <th className="p-3 w-24">Currency</th>
                <th className="p-3 text-right w-28">Amount</th>
                {DP_MONTHS.map(m => (
                  <th key={m} className="p-3 text-right w-24">{m}</th>
                ))}
                <th className="p-3 text-right w-32 font-bold bg-slate-100">Total (USD)</th>
                <th className="p-3 text-center w-28 sticky right-0 bg-slate-50 border-l border-slate-200 z-10">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {list.length === 0 ? (
                <tr>
                  <td colSpan={27} className="p-8 text-center text-slate-400 italic">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <AlertCircle className="w-6 h-6 text-slate-300" />
                      <span>Belum ada data untuk {title} pada filter yang dipilih.</span>
                      <button
                        onClick={() => onOpenModal(sectionKey)}
                        className="mt-1 text-xs text-indigo-600 hover:text-indigo-800 font-semibold underline cursor-pointer"
                      >
                        + Tambah data sekarang
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                pagedList.map(x => {
                  const isChecked = selectedIds.has(x.id);
                  const mSum = DP_MONTHS.reduce<number>((s, m) => s + (Number(x.monthly?.[m]) || 0), 0);
                  const totalRowUSD = mSum > 0 ? mSum : (Number(x.totalUSD) || 0);

                  return (
                    <tr
                      key={x.id}
                      className={`transition align-top ${
                        isChecked ? 'bg-indigo-50/60 hover:bg-indigo-50' : 'hover:bg-slate-50/80'
                      }`}
                    >
                      <td className="p-3 text-center sticky left-0 bg-inherit border-r border-slate-200 z-10">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleItem(x.id)}
                          className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                        />
                      </td>
                      <td className="p-3 font-bold text-indigo-700">{x.deptCode}</td>
                      <td className="p-3 font-semibold font-mono text-slate-700 whitespace-nowrap">{x.code}</td>
                      <td className="p-3 font-mono text-slate-600">{x.accountNo}</td>
                      <td className="p-3 text-slate-800">{x.accountName}</td>
                      <td className="p-3 font-medium text-slate-900">
                        <div>{x.item}</div>
                        {x.notes && (
                          <div className="text-[11px] font-normal text-emerald-700 bg-emerald-50 rounded px-1.5 py-0.5 mt-1 inline-block border border-emerald-200">
                            {x.notes}
                          </div>
                        )}
                      </td>
                      <td className="p-3 capitalize">{x.type}</td>
                      <td className="p-3 capitalize">{x.costCategory}</td>
                      <td className="p-3 whitespace-nowrap text-slate-500">{x.budgetStartDate || '-'}</td>
                      <td className="p-3 whitespace-nowrap text-slate-500">{x.indicatorDate || '-'}</td>
                      <td className="p-3 capitalize text-slate-700">{x.businessFunction}</td>
                      <td className="p-3 font-semibold text-slate-800">
                        {x.currency}
                        <div className="text-[10px] text-slate-400 font-normal">
                          {x.currency === 'USD' ? 'Rate 1' : `Rate ${x.rate}`}
                        </div>
                      </td>
                      <td className="p-3 text-right font-medium">
                        {formatAmountWithCurrency(x.amount, x.currency)}
                      </td>
                      {DP_MONTHS.map(m => (
                        <td key={m} className="p-3 text-right font-mono text-slate-700">
                          {x.monthly?.[m] ? formatPlainUSD(x.monthly[m]) : '0.00'}
                        </td>
                      ))}
                      <td className="p-3 text-right font-bold text-indigo-700 bg-slate-50/60 font-mono">
                        ${formatPlainUSD(totalRowUSD)}
                      </td>
                      <td className="p-3 text-center whitespace-nowrap sticky right-0 bg-white border-l border-slate-200 z-10">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => onOpenModal(x.section, x)}
                            className="p-1.5 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 rounded transition cursor-pointer"
                            title="Edit Data"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleConfirmDeleteSingle(x)}
                            className="p-1.5 text-rose-500 hover:text-rose-800 hover:bg-rose-50 rounded transition cursor-pointer"
                            title="Hapus Data"
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
            {list.length > 0 && (
              <tfoot>
                <tr className="bg-slate-100/90 font-bold border-t-2 border-slate-300 text-slate-800">
                  <td className="p-3 sticky left-0 bg-slate-100 border-r border-slate-200"></td>
                  <td colSpan={12} className="p-3 text-right">
                    Total {title} (USD):
                  </td>
                  {DP_MONTHS.map(m => (
                    <td key={m} className="p-3 text-right font-mono">
                      ${formatPlainUSD(monthTotals[m] || 0)}
                    </td>
                  ))}
                  <td className="p-3 text-right font-mono text-indigo-800 bg-slate-200">
                    ${formatPlainUSD(grandTotalUSD)}
                  </td>
                  <td className="p-3 sticky right-0 bg-slate-100 border-l border-slate-200"></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* Pagination Bar */}
        {totalCount > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-xs text-slate-600">
            <div>
              Menampilkan <span className="font-bold text-slate-900">{startItem}</span> - <span className="font-bold text-slate-900">{endItem}</span> dari <span className="font-bold text-slate-900">{totalCount}</span> data
              {pageSize !== 'all' && totalPages > 1 && (
                <span className="text-slate-400 ml-2 font-medium">(Halaman {safeCurrentPage} dari {totalPages})</span>
              )}
            </div>

            {pageSize !== 'all' && totalPages > 1 && (
              <div className="flex items-center gap-1">
                <button
                  disabled={safeCurrentPage === 1}
                  onClick={() => setPageBySection(prev => ({ ...prev, [sectionKey]: 1 }))}
                  className="p-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  title="Halaman Pertama"
                >
                  <ChevronsLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  disabled={safeCurrentPage === 1}
                  onClick={() => setPageBySection(prev => ({ ...prev, [sectionKey]: Math.max(1, safeCurrentPage - 1) }))}
                  className="p-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  title="Halaman Sebelumnya"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>

                {/* Page Number Chips */}
                {Array.from({ length: totalPages }, (_, idx) => idx + 1)
                  .filter(p => p === 1 || p === totalPages || Math.abs(p - safeCurrentPage) <= 1)
                  .map((p, idx, arr) => {
                    const prevP = arr[idx - 1];
                    const hasGap = prevP && p - prevP > 1;

                    return (
                      <React.Fragment key={p}>
                        {hasGap && <span className="px-1 text-slate-400">...</span>}
                        <button
                          onClick={() => setPageBySection(prev => ({ ...prev, [sectionKey]: p }))}
                          className={`w-7 h-7 rounded-lg font-bold text-xs transition cursor-pointer ${
                            safeCurrentPage === p
                              ? 'bg-indigo-600 text-white shadow-xs'
                              : 'border border-slate-200 hover:bg-slate-100 text-slate-700'
                          }`}
                        >
                          {p}
                        </button>
                      </React.Fragment>
                    );
                  })}

                <button
                  disabled={safeCurrentPage === totalPages}
                  onClick={() => setPageBySection(prev => ({ ...prev, [sectionKey]: Math.min(totalPages, safeCurrentPage + 1) }))}
                  className="p-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  title="Halaman Selanjutnya"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
                <button
                  disabled={safeCurrentPage === totalPages}
                  onClick={() => setPageBySection(prev => ({ ...prev, [sectionKey]: totalPages }))}
                  className="p-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  title="Halaman Terakhir"
                >
                  <ChevronsRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div id="view-deptPlanning" className="space-y-6">
      {/* Sub-tab Navigation for Budget Module */}
      {onSwitchBudgetTab && (
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-200/80 rounded-2xl w-fit">
          <button
            onClick={() => onSwitchBudgetTab('dashboard')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeBudgetTab === 'dashboard'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Summary Budget
          </button>
          <button
            onClick={() => onSwitchBudgetTab('planner')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeBudgetTab === 'planner'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            Rencana Anggaran
          </button>
          <button
            onClick={() => onSwitchBudgetTab('deptPlanning')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeBudgetTab === 'deptPlanning'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Dept Planning
          </button>
          <button
            onClick={() => onSwitchBudgetTab('realisasi')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeBudgetTab === 'realisasi'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            Realisasi Budget
          </button>
        </div>
      )}

      {/* Top Banner */}
      <div className="bg-linear-to-r from-slate-900 via-indigo-900 to-slate-800 text-white p-5 rounded-2xl shadow-sm">
        <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4">
          <div>
            <h3 className="font-bold text-xl flex items-center gap-2">
              <Layers className="w-6 h-6 text-amber-400" />
              Department Planning
            </h3>
            <p className="text-xs text-indigo-200 mt-1 max-w-2xl">
              Kelola dan pantau <strong>A. BUDGET</strong>, <strong>B. COST DOWN</strong>, dan <strong>C. PLAN</strong> secara terstruktur dengan distribusi 12 bulan dan konversi mata uang otomatis.
            </p>
          </div>
          <button
            onClick={() => onOpenModal('budget')}
            className="bg-white hover:bg-indigo-50 text-indigo-700 font-bold px-5 py-2.5 rounded-xl text-sm shadow-md transition flex items-center gap-2 self-start lg:self-auto cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Dept Planning</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl flex items-center gap-3">
          <div className="p-3 bg-indigo-600 text-white rounded-xl shadow-xs">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">A. BUDGET</span>
            <div id="deptBudgetTotal" className="text-xl font-extrabold text-slate-800 mt-0.5">
              {formatUSD(budgetTotalUSD)}
            </div>
            <span className="text-xs text-slate-500">{budgetItems.length} Pos Anggaran</span>
          </div>
        </div>

        <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl flex items-center gap-3">
          <div className="p-3 bg-emerald-600 text-white rounded-xl shadow-xs">
            <TrendingDown className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">B. COST DOWN</span>
            <div id="deptCostDownTotal" className="text-xl font-extrabold text-slate-800 mt-0.5">
              {formatUSD(costDownTotalUSD)}
            </div>
            <span className="text-xs text-slate-500">{costDownItems.length} Program Efisiensi</span>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl flex items-center gap-3">
          <div className="p-3 bg-amber-600 text-white rounded-xl shadow-xs">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">C. PLAN</span>
            <div id="deptPlanBCount" className="text-xl font-extrabold text-slate-800 mt-0.5">
              {planItems.length} Plan
            </div>
            <span className="text-xs text-slate-500">Rencana Operasional Dept</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Department Filter */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            {isDeptRestricted ? (
              <div className="flex items-center gap-1.5 px-3 py-2 bg-indigo-50 border border-indigo-200 rounded-lg text-xs font-bold text-indigo-800">
                <Lock className="w-3.5 h-3.5 text-indigo-600" />
                <span>Dept: {userDeptCode} ({departments.find(d => d.code === userDeptCode)?.name || userDeptCode})</span>
              </div>
            ) : (
              <>
                <Filter className="w-4 h-4 text-slate-400" />
                <select
                  id="deptPlanDeptFilter"
                  value={deptFilter}
                  onChange={e => setDeptFilter(e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none w-full sm:w-48"
                >
                  <option value="">Semua Department</option>
                  {departments.map(d => (
                    <option key={d.code} value={d.code}>
                      {d.code} - {d.name}
                    </option>
                  ))}
                </select>
              </>
            )}
          </div>

          {/* Year Filter */}
          {availableYears.length > 0 && (
            <select
              value={selectedYear}
              onChange={e => setSelectedYear(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none w-full sm:w-32"
            >
              <option value="all">Semua Tahun</option>
              {availableYears.map(yr => (
                <option key={yr} value={String(yr)}>
                  Tahun {yr}
                </option>
              ))}
            </select>
          )}

          {/* Search Box */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              id="deptPlanningSearch"
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Cari Code / Dept / COA / Item Budget..."
              className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {onDeduplicateItems && (
            <button
              onClick={onDeduplicateItems}
              title="Periksa dan bersihkan data ganda berdasarkan Kode Budget & Akun"
              className="px-3 py-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold border border-emerald-200 transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Bersihkan Duplikat</span>
            </button>
          )}

          {onBatchUpsertItems && (
            <button
              onClick={() => {
                setImportSection('budget');
                setIsImportModalOpen(true);
              }}
              className="px-3 py-2 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold border border-indigo-200 transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>Import / Tempel Excel</span>
            </button>
          )}

          {/* Global Add Data Button */}
          <button
            onClick={() => onOpenModal('budget')}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Tambah Data</span>
          </button>
        </div>
      </div>

      {/* TABLE 1: A. BUDGET */}
      {renderTableSection(
        'A. BUDGET',
        'budget',
        'bg-indigo-100 text-indigo-800',
        budgetItems,
        'deptBudgetCount',
        'deptPlanningBudgetTable'
      )}

      {/* TABLE 2: B. COST DOWN */}
      {renderTableSection(
        'B. COST DOWN',
        'costdown',
        'bg-emerald-100 text-emerald-800',
        costDownItems,
        'deptCostDownCount',
        'deptPlanningCostDownTable'
      )}

      {/* TABLE 3: C. PLAN */}
      {renderTableSection(
        'C. PLAN',
        'plan',
        'bg-amber-100 text-amber-800',
        planItems,
        'deptPlanCount',
        'deptPlanningPlanTable'
      )}

      {/* Import Modal */}
      {isImportModalOpen && onBatchUpsertItems && (
        <DeptPlanningImportModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          departments={availableDepartments}
          defaultDept={userDeptCode || deptFilter || 'ACC'}
          defaultSection={importSection}
          currentUser={currentUser}
          onImportItems={(newItems, sec) => {
            onBatchUpsertItems(newItems, sec);
          }}
        />
      )}

      {/* Custom Delete Confirmation Modal (Reliable in iframes and all browsers) */}
      {deleteConfirmModal && deleteConfirmModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-rose-100 text-rose-600 rounded-xl shrink-0">
                <Trash2 className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">{deleteConfirmModal.title}</h3>
                <p className="text-xs text-slate-500">Konfirmasi Penghapusan Data</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              {deleteConfirmModal.description}
            </p>

            <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeleteConfirmModal(null)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteConfirmModal.onConfirm();
                  setDeleteConfirmModal(null);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{deleteConfirmModal.confirmText || 'Ya, Hapus Sekarang'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
