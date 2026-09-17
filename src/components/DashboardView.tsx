import React, { useMemo } from 'react';
import { Wallet, PieChart, TrendingUp, CreditCard, Target, AlertTriangle } from 'lucide-react';
import { MonthData } from '../types';
import { formatIDR } from '../utils/formatters';

interface DashboardViewProps {
  data: MonthData;
  onNavigateToTab: (tab: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ data, onNavigateToTab }) => {
  const totalIncome = data.income || 0;
  const totalCatAllocated = (data.categories || []).reduce((acc, curr) => acc + (curr.budget || 0), 0);
  const totalDebtMonthly = (data.debts || []).reduce((acc, curr) => acc + (curr.monthlyPayment || 0), 0);
  const totalGoalMonthly = (data.goals || []).reduce((acc, curr) => acc + (curr.monthlyAllocation || 0), 0);

  const grandTotalAllocated = totalCatAllocated + totalDebtMonthly + totalGoalMonthly;
  const totalSpent = (data.expenses || []).reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const remainingCash = totalIncome - totalSpent;
  const unallocated = totalIncome - grandTotalAllocated;

  const spentPercentage = totalIncome > 0 ? Math.round((totalSpent / totalIncome) * 100) : 0;

  // Breakdown for Donut Chart
  const expenseByCategory = useMemo(() => {
    const map: Record<string, { name: string; amount: number; color: string }> = {};
    const palette = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#14b8a6', '#f43f5e'];

    (data.expenses || []).forEach((exp, idx) => {
      const cat = (data.categories || []).find(c => c.id === exp.categoryId);
      const catName = cat ? cat.name : 'Lain-lain';
      if (!map[catName]) {
        map[catName] = {
          name: catName,
          amount: 0,
          color: palette[Object.keys(map).length % palette.length]
        };
      }
      map[catName].amount += exp.amount;
    });

    return Object.values(map);
  }, [data.expenses, data.categories]);

  // Compute SVG Donut Chart Paths
  const donutSlices = useMemo(() => {
    if (totalSpent === 0 || expenseByCategory.length === 0) return [];
    let cumulativeAngle = 0;

    return expenseByCategory.map(item => {
      const sliceAngle = (item.amount / totalSpent) * 360;
      const startAngle = cumulativeAngle;
      const endAngle = cumulativeAngle + sliceAngle;
      cumulativeAngle += sliceAngle;

      const x1 = 50 + 40 * Math.cos((Math.PI * (startAngle - 90)) / 180);
      const y1 = 50 + 40 * Math.sin((Math.PI * (startAngle - 90)) / 180);
      const x2 = 50 + 40 * Math.cos((Math.PI * (endAngle - 90)) / 180);
      const y2 = 50 + 40 * Math.sin((Math.PI * (endAngle - 90)) / 180);

      const largeArcFlag = sliceAngle > 180 ? 1 : 0;
      const pathData = `M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

      return {
        ...item,
        pathData,
        percentage: Math.round((item.amount / totalSpent) * 100)
      };
    });
  }, [expenseByCategory, totalSpent]);

  // Recent transactions sorted by date descending
  const recentTransactions = useMemo(() => {
    return [...(data.expenses || [])]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [data.expenses]);

  return (
    <div id="view-dashboard" className="space-y-6">
      {/* Key Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl shadow-xs">
          <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Total Pemasukan</span>
          <div id="dashTotalIncome" className="text-xl md:text-2xl font-bold text-slate-800 mt-1">
            {formatIDR(totalIncome)}
          </div>
          <p className="text-xs text-slate-500 mt-1">Target anggaran bulan ini</p>
        </div>

        <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl shadow-xs">
          <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Total Dialokasikan</span>
          <div id="dashTotalAllocated" className="text-xl md:text-2xl font-bold text-slate-800 mt-1">
            {formatIDR(grandTotalAllocated)}
          </div>
          <p id="dashUnallocatedText" className="text-xs text-slate-500 mt-1">
            Sisa tak dialokasi: {formatIDR(unallocated)}
          </p>
        </div>

        <div className="bg-rose-50 border border-rose-100 p-4 rounded-xl shadow-xs">
          <span className="text-xs font-bold text-rose-600 uppercase tracking-wider">Total Pengeluaran</span>
          <div id="dashTotalSpent" className="text-xl md:text-2xl font-bold text-slate-800 mt-1">
            {formatIDR(totalSpent)}
          </div>
          <p id="dashSpentPercentage" className="text-xs text-slate-500 mt-1">
            {spentPercentage}% dari pemasukan
          </p>
        </div>

        <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl shadow-xs">
          <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Sisa Saldo Kas</span>
          <div id="dashRemainingCash" className="text-xl md:text-2xl font-bold text-slate-800 mt-1">
            {formatIDR(remainingCash)}
          </div>
          <p className="text-xs text-slate-500 mt-1">Pemasukan - Pengeluaran</p>
        </div>
      </div>

      {/* Debt and Goal Quick Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex justify-between items-center shadow-xs">
          <div>
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1.5">
              <CreditCard className="w-4 h-4" /> Total Cicilan Utang Bulan Ini
            </span>
            <div id="dashTotalDebtPayment" className="text-lg font-bold text-slate-800 mt-1">
              {formatIDR(totalDebtMonthly)}
            </div>
          </div>
          <span id="dashDebtCountBadge" className="bg-amber-200 text-amber-800 text-xs font-semibold px-2.5 py-1 rounded-full">
            {(data.debts || []).length} Kewajiban
          </span>
        </div>

        <div className="bg-cyan-50 border border-cyan-200 p-4 rounded-xl flex justify-between items-center shadow-xs">
          <div>
            <span className="text-xs font-bold text-cyan-700 uppercase tracking-wider flex items-center gap-1.5">
              <Target className="w-4 h-4" /> Alokasi Tabungan & Rencana
            </span>
            <div id="dashTotalGoalAllocation" className="text-lg font-bold text-slate-800 mt-1">
              {formatIDR(totalGoalMonthly)}
            </div>
          </div>
          <span id="dashGoalCountBadge" className="bg-cyan-200 text-cyan-800 text-xs font-semibold px-2.5 py-1 rounded-full">
            {(data.goals || []).length} Rencana
          </span>
        </div>
      </div>

      {/* Chart and Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Donut Chart Box */}
        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-xs lg:col-span-1 flex flex-col items-center justify-between">
          <h3 className="text-base font-bold text-slate-700 w-full text-left mb-2 flex items-center justify-between">
            <span>Visualisasi Pengeluaran</span>
            <PieChart className="w-4 h-4 text-slate-400" />
          </h3>

          <div className="w-full flex flex-col items-center justify-center py-2">
            {totalSpent > 0 ? (
              <div className="relative w-48 h-48">
                <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                  {donutSlices.map((slice, i) => (
                    <path
                      key={i}
                      d={slice.pathData}
                      fill={slice.color}
                      className="hover:opacity-85 transition-opacity cursor-pointer"
                    >
                      <title>{`${slice.name}: ${formatIDR(slice.amount)} (${slice.percentage}%)`}</title>
                    </path>
                  ))}
                  <circle cx="50" cy="50" r="24" fill="#ffffff" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Total</span>
                  <span className="text-xs font-bold text-slate-800">{formatIDR(totalSpent)}</span>
                </div>
              </div>
            ) : (
              <div className="w-44 h-44 rounded-full border-4 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 text-xs p-4 text-center">
                Belum ada pengeluaran bulan ini
              </div>
            )}

            {/* Legend list */}
            {expenseByCategory.length > 0 && (
              <div className="w-full mt-4 space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {expenseByCategory.map((c, i) => (
                  <div key={i} className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                      <span className="text-slate-600 truncate">{c.name}</span>
                    </div>
                    <span className="font-semibold text-slate-800 shrink-0 ml-2">
                      {formatIDR(c.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Category Health Progress Bars */}
        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-xs lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-bold text-slate-700">Kontrol Limit Kategori</h3>
            <span className="text-xs text-slate-500">Persentase Penggunaan Budget</span>
          </div>

          <div id="categoryHealthContainer" className="space-y-4 max-h-[320px] overflow-y-auto pr-1">
            {(!data.categories || data.categories.length === 0) ? (
              <div className="text-center py-8">
                <p className="text-xs text-slate-400 italic">Belum ada kategori budget.</p>
                <button
                  onClick={() => onNavigateToTab('planner')}
                  className="mt-2 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                >
                  + Atur di menu Rencana Anggaran
                </button>
              </div>
            ) : (
              data.categories.map(cat => {
                const spentInCat = (data.expenses || [])
                  .filter(e => e.categoryId === cat.id)
                  .reduce((acc, e) => acc + e.amount, 0);

                const percent = cat.budget > 0 ? Math.min(Math.round((spentInCat / cat.budget) * 100), 100) : 0;
                const isOver = spentInCat > cat.budget;

                let barColor = 'bg-emerald-500';
                let textColor = 'text-emerald-700';
                if (percent >= 75 && percent < 100) {
                  barColor = 'bg-amber-500';
                  textColor = 'text-amber-700';
                } else if (percent >= 100 || isOver) {
                  barColor = 'bg-rose-500';
                  textColor = 'text-rose-700';
                }

                return (
                  <div key={cat.id} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-700">{cat.name}</span>
                      <span className={textColor}>
                        {formatIDR(spentInCat)} / {formatIDR(cat.budget)} ({percent}%)
                        {isOver && (
                          <span className="font-extrabold text-rose-600 ml-1">
                            OVER BUDGET!
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                      <div
                        className={`${barColor} h-2.5 rounded-full transition-all duration-500`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-base font-bold text-slate-700">Transaksi Terakhir Bulan Ini</h3>
          <button
            onClick={() => onNavigateToTab('expenses')}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
          >
            Lihat Semua Transaksi →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-500 border-b border-slate-200">
                <th className="p-3">Tanggal</th>
                <th className="p-3">Kategori</th>
                <th className="p-3">Catatan</th>
                <th className="p-3 text-right">Jumlah</th>
              </tr>
            </thead>
            <tbody id="dashRecentTransactions" className="divide-y divide-slate-100 text-slate-700">
              {recentTransactions.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-xs text-slate-400 italic">
                    Belum ada catatan transaksi bulan ini.
                  </td>
                </tr>
              ) : (
                recentTransactions.map(exp => {
                  const catObj = (data.categories || []).find(c => c.id === exp.categoryId);
                  const catName = catObj ? catObj.name : 'Uncategorized';

                  return (
                    <tr key={exp.id} className="hover:bg-slate-50">
                      <td className="p-3 whitespace-nowrap text-xs">{exp.date}</td>
                      <td className="p-3 font-medium text-xs text-slate-800">{catName}</td>
                      <td className="p-3 text-xs text-slate-500">{exp.note || '-'}</td>
                      <td className="p-3 text-right font-bold text-xs text-rose-600">
                        {formatIDR(exp.amount)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
