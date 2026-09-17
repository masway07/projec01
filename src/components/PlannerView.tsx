import React, { useState } from 'react';
import { Plus, Trash2, ListChecks, CreditCard, Target, Check, FileSpreadsheet, LayoutGrid, Layers, DollarSign } from 'lucide-react';
import { Category, Debt, Goal, MonthData } from '../types';
import { formatIDR } from '../utils/formatters';

interface PlannerViewProps {
  data: MonthData;
  onSaveIncome: (amount: number) => void;
  onAddCategory: (name: string, budget: number) => void;
  onDeleteCategory: (id: string) => void;
  onAddDebt: (name: string, monthly: number, remaining: number) => void;
  onDeleteDebt: (id: string) => void;
  onAddGoal: (name: string, monthly: number, target: number) => void;
  onDeleteGoal: (id: string) => void;
  activeBudgetTab?: 'dashboard' | 'planner' | 'deptPlanning' | 'realisasi';
  onSwitchBudgetTab?: (tab: 'dashboard' | 'planner' | 'deptPlanning' | 'realisasi') => void;
}

export const PlannerView: React.FC<PlannerViewProps> = ({
  data,
  onSaveIncome,
  onAddCategory,
  onDeleteCategory,
  onAddDebt,
  onDeleteDebt,
  onAddGoal,
  onDeleteGoal,
  activeBudgetTab = 'planner',
  onSwitchBudgetTab
}) => {
  const [incomeVal, setIncomeVal] = useState<number>(data.income || 0);

  // Category form state
  const [catName, setCatName] = useState<string>('');
  const [catBudget, setCatBudget] = useState<string>('');

  // Debt form state
  const [debtName, setDebtName] = useState<string>('');
  const [debtMonthly, setDebtMonthly] = useState<string>('');
  const [debtRemaining, setDebtRemaining] = useState<string>('');

  // Goal form state
  const [goalName, setGoalName] = useState<string>('');
  const [goalMonthly, setGoalMonthly] = useState<string>('');
  const [goalTarget, setGoalTarget] = useState<string>('');

  const handleIncomeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveIncome(Math.max(0, Number(incomeVal) || 0));
  };

  const handleCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;
    onAddCategory(catName.trim(), Math.max(0, parseFloat(catBudget) || 0));
    setCatName('');
    setCatBudget('');
  };

  const handleDebtSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!debtName.trim()) return;
    onAddDebt(
      debtName.trim(),
      Math.max(0, parseFloat(debtMonthly) || 0),
      Math.max(0, parseFloat(debtRemaining) || 0)
    );
    setDebtName('');
    setDebtMonthly('');
    setDebtRemaining('');
  };

  const handleGoalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalName.trim()) return;
    onAddGoal(
      goalName.trim(),
      Math.max(0, parseFloat(goalMonthly) || 0),
      Math.max(0, parseFloat(goalTarget) || 0)
    );
    setGoalName('');
    setGoalMonthly('');
    setGoalTarget('');
  };

  return (
    <div id="view-planner" className="space-y-6">
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

      {/* Income Setting Box */}
      <div className="bg-indigo-50/50 border border-indigo-100 p-5 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xs">
        <div>
          <h3 className="font-bold text-slate-800 text-lg">Atur Total Pemasukan Bulan Ini</h3>
          <p className="text-xs text-slate-500">Tentukan estimasi total pendapatan untuk membatasi pengeluaran.</p>
        </div>
        <form onSubmit={handleIncomeSubmit} className="flex items-center gap-2 w-full md:w-auto">
          <span className="font-bold text-slate-600">Rp</span>
          <input
            id="plannerIncomeInput"
            type="number"
            value={incomeVal || ''}
            onChange={e => setIncomeVal(parseFloat(e.target.value) || 0)}
            placeholder="0"
            className="w-full md:w-48 p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none font-bold text-slate-800 text-right text-sm"
          />
          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2.5 rounded-lg transition text-sm flex items-center gap-1 shrink-0"
          >
            <Check className="w-4 h-4" />
            <span>Simpan</span>
          </button>
        </form>
      </div>

      {/* 1. KATEGORI ANGGARAN RUTIN */}
      <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-xs">
        <h3 className="font-bold text-slate-800 text-base mb-4 flex items-center gap-2">
          <ListChecks className="w-5 h-5 text-indigo-600" />
          1. Kategori Anggaran Pengeluaran
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <form onSubmit={handleCategorySubmit} className="space-y-4 border-r-0 md:border-r border-slate-200 md:pr-6">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Nama Kategori</label>
              <input
                id="catNameInput"
                type="text"
                required
                value={catName}
                onChange={e => setCatName(e.target.value)}
                placeholder="Contoh: Makanan & Dapur"
                className="w-full p-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Limit Budget (Rp)</label>
              <input
                id="catBudgetInput"
                type="number"
                required
                min="0"
                value={catBudget}
                onChange={e => setCatBudget(e.target.value)}
                placeholder="0"
                className="w-full p-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-slate-800 hover:bg-slate-900 text-white font-medium py-2.5 rounded-lg text-sm transition flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Tambahkan Kategori</span>
            </button>
          </form>

          <div className="md:col-span-2 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 text-xs">
                  <th className="p-3">Nama Kategori</th>
                  <th className="p-3 text-right">Target Limit</th>
                  <th className="p-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody id="plannerCategoryList" className="divide-y divide-slate-100">
                {(data.categories || []).length === 0 ? (
                  <tr>
                    <td colSpan={3} className="p-4 text-center text-xs text-slate-400 italic">
                      Belum ada kategori anggaran. Tambahkan pada form di samping.
                    </td>
                  </tr>
                ) : (
                  data.categories.map((cat: Category) => (
                    <tr key={cat.id} className="hover:bg-slate-50">
                      <td className="p-3 font-medium text-slate-800 text-xs">{cat.name}</td>
                      <td className="p-3 text-right font-bold text-slate-700 text-xs">{formatIDR(cat.budget)}</td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => onDeleteCategory(cat.id)}
                          className="text-rose-500 hover:text-rose-700 p-1 rounded"
                          title="Hapus Kategori"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 2. KELOLA UTANG & CICILAN (DEBT) */}
      <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-xs">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-amber-600" />
            2. Daftar Utang & Cicilan Bulan Ini
          </h3>
          <span className="text-xs text-slate-500">Membantu mengontrol kewajiban pembayaran</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <form onSubmit={handleDebtSubmit} className="space-y-4 border-r-0 md:border-r border-slate-200 md:pr-6">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Nama Utang / Cicilan</label>
              <input
                id="debtNameInput"
                type="text"
                required
                value={debtName}
                onChange={e => setDebtName(e.target.value)}
                placeholder="Contoh: Cicilan Motor / KPR"
                className="w-full p-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Bayar Cicilan Bulan Ini (Rp)</label>
              <input
                id="debtMonthlyInput"
                type="number"
                required
                min="0"
                value={debtMonthly}
                onChange={e => setDebtMonthly(e.target.value)}
                placeholder="0"
                className="w-full p-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Sisa Pokok Utang (Opsional)</label>
              <input
                id="debtRemainingInput"
                type="number"
                min="0"
                value={debtRemaining}
                onChange={e => setDebtRemaining(e.target.value)}
                placeholder="0"
                className="w-full p-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-amber-600 hover:bg-amber-700 text-white font-medium py-2.5 rounded-lg text-sm transition flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Tambahkan Pos Utang</span>
            </button>
          </form>

          <div className="md:col-span-2 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-amber-50/50 text-slate-600 border-b border-amber-200 text-xs">
                  <th className="p-3">Nama Cicilan</th>
                  <th className="p-3 text-right">Cicilan Bulan Ini</th>
                  <th className="p-3 text-right">Sisa Pokok Utang</th>
                  <th className="p-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody id="plannerDebtList" className="divide-y divide-slate-100">
                {(data.debts || []).length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-4 text-center text-xs text-slate-400 italic">
                      Tidak ada pos utang / cicilan.
                    </td>
                  </tr>
                ) : (
                  data.debts.map((d: Debt) => (
                    <tr key={d.id} className="hover:bg-amber-50/30">
                      <td className="p-3 font-medium text-slate-800 text-xs">{d.name}</td>
                      <td className="p-3 text-right font-bold text-amber-700 text-xs">{formatIDR(d.monthlyPayment)}</td>
                      <td className="p-3 text-right text-xs text-slate-500">{d.remainingDebt ? formatIDR(d.remainingDebt) : '-'}</td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => onDeleteDebt(d.id)}
                          className="text-rose-500 hover:text-rose-700 p-1"
                          title="Hapus Pos Utang"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 3. RENCANA KEUANGAN & TARGET TABUNGAN (GOALS) */}
      <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-xs">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
            <Target className="w-5 h-5 text-cyan-600" />
            3. Rencana Keuangan & Target Tabungan
          </h3>
          <span className="text-xs text-slate-500">Alokasi investasi & tujuan finansial</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <form onSubmit={handleGoalSubmit} className="space-y-4 border-r-0 md:border-r border-slate-200 md:pr-6">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Nama Rencana / Target</label>
              <input
                id="goalNameInput"
                type="text"
                required
                value={goalName}
                onChange={e => setGoalName(e.target.value)}
                placeholder="Contoh: Dana Darurat / Liburan"
                className="w-full p-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Alokasi Bulan Ini (Rp)</label>
              <input
                id="goalMonthlyInput"
                type="number"
                required
                min="0"
                value={goalMonthly}
                onChange={e => setGoalMonthly(e.target.value)}
                placeholder="0"
                className="w-full p-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Total Target Nominal (Opsional)</label>
              <input
                id="goalTargetInput"
                type="number"
                min="0"
                value={goalTarget}
                onChange={e => setGoalTarget(e.target.value)}
                placeholder="0"
                className="w-full p-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-medium py-2.5 rounded-lg text-sm transition flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Tambahkan Rencana</span>
            </button>
          </form>

          <div className="md:col-span-2 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-cyan-50/50 text-slate-600 border-b border-cyan-200 text-xs">
                  <th className="p-3">Nama Rencana</th>
                  <th className="p-3 text-right">Alokasi Bulan Ini</th>
                  <th className="p-3 text-right">Target Nominal</th>
                  <th className="p-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody id="plannerGoalList" className="divide-y divide-slate-100">
                {(data.goals || []).length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-4 text-center text-xs text-slate-400 italic">
                      Belum ada target tabungan / rencana.
                    </td>
                  </tr>
                ) : (
                  data.goals.map((g: Goal) => (
                    <tr key={g.id} className="hover:bg-cyan-50/30">
                      <td className="p-3 font-medium text-slate-800 text-xs">{g.name}</td>
                      <td className="p-3 text-right font-bold text-cyan-700 text-xs">{formatIDR(g.monthlyAllocation)}</td>
                      <td className="p-3 text-right text-xs text-slate-500">{g.targetAmount ? formatIDR(g.targetAmount) : '-'}</td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => onDeleteGoal(g.id)}
                          className="text-rose-500 hover:text-rose-700 p-1"
                          title="Hapus Rencana"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
