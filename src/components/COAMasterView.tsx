import React, { useState, useMemo } from 'react';
import { BookOpen, Plus, Search, Edit2, Trash2 } from 'lucide-react';
import { COA } from '../types';

interface COAMasterViewProps {
  coaList: COA[];
  onAddCOA: (coa: COA) => void;
  onEditCOA: (oldCode: string, newCOA: COA) => void;
  onDeleteCOA: (code: string) => void;
}

export const COAMasterView: React.FC<COAMasterViewProps> = ({
  coaList,
  onAddCOA,
  onEditCOA,
  onDeleteCOA
}) => {
  const [code, setCode] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [parent, setParent] = useState<string>('');
  const [type, setType] = useState<string>('');
  const [nature, setNature] = useState<'debit' | 'credit' | ''>('');

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [natureFilter, setNatureFilter] = useState<string>('');

  const [editingCOA, setEditingCOA] = useState<COA | null>(null);
  const [editCode, setEditCode] = useState<string>('');
  const [editName, setEditName] = useState<string>('');
  const [editParent, setEditParent] = useState<string>('');
  const [editType, setEditType] = useState<string>('');
  const [editNature, setEditNature] = useState<'debit' | 'credit' | ''>('');

  const debitCount = useMemo(() => coaList.filter(c => c.nature === 'debit').length, [coaList]);
  const creditCount = useMemo(() => coaList.filter(c => c.nature === 'credit').length, [coaList]);

  const filteredCOA = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return coaList.filter(c => {
      const matchQuery = !q || (
        c.code.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        (c.parent || '').toLowerCase().includes(q) ||
        (c.type || '').toLowerCase().includes(q)
      );
      const matchNature = !natureFilter || c.nature === natureFilter;
      return matchQuery && matchNature;
    });
  }, [coaList, searchQuery, natureFilter]);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !name.trim()) return;
    onAddCOA({
      code: code.trim(),
      name: name.trim(),
      parent: parent.trim(),
      type: type.trim(),
      nature
    });
    setCode('');
    setName('');
    setParent('');
    setType('');
    setNature('');
  };

  const startEdit = (c: COA) => {
    setEditingCOA(c);
    setEditCode(c.code);
    setEditName(c.name);
    setEditParent(c.parent || '');
    setEditType(c.type || '');
    setEditNature(c.nature || '');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCOA || !editCode.trim() || !editName.trim()) return;
    onEditCOA(editingCOA.code, {
      code: editCode.trim(),
      name: editName.trim(),
      parent: editParent.trim(),
      type: editType.trim(),
      nature: editNature
    });
    setEditingCOA(null);
  };

  return (
    <div id="view-coa" className="space-y-6">
      <div className="bg-linear-to-r from-slate-900 to-indigo-900 text-white p-5 rounded-xl shadow-xs">
        <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-3">
          <div>
            <h3 className="font-bold text-lg flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-amber-300" />
              Master COA (Chart of Accounts)
            </h3>
            <p className="text-xs text-indigo-100 mt-1">
              Daftar bagan akun pembukuan dan akuntansi yang terhubung ke Department Planning.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            <div className="bg-white/10 rounded-lg px-3 py-2">
              Total: <b id="coaCount">{coaList.length}</b>
            </div>
            <div className="bg-white/10 rounded-lg px-3 py-2">
              Debit: <b id="coaDebitCount">{debitCount}</b>
            </div>
            <div className="bg-white/10 rounded-lg px-3 py-2">
              Credit: <b id="coaCreditCount">{creditCount}</b>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-xs">
        {editingCOA ? (
          <form onSubmit={handleSaveEdit} className="bg-indigo-50 border border-indigo-200 p-4 rounded-xl mb-5">
            <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wider mb-2">
              Edit COA: {editingCOA.code}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
              <input
                type="text"
                required
                value={editCode}
                onChange={e => setEditCode(e.target.value)}
                placeholder="Code"
                className="p-2.5 rounded-lg border border-slate-300 text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
              <input
                type="text"
                required
                value={editName}
                onChange={e => setEditName(e.target.value)}
                placeholder="Name"
                className="md:col-span-2 p-2.5 rounded-lg border border-slate-300 text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
              <input
                type="text"
                value={editParent}
                onChange={e => setEditParent(e.target.value)}
                placeholder="Parent"
                className="p-2.5 rounded-lg border border-slate-300 text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
              <select
                value={editType}
                onChange={e => setEditType(e.target.value)}
                className="p-2.5 rounded-lg border border-slate-300 text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="">Type</option>
                <option value="Asset">Asset</option>
                <option value="Liability">Liability</option>
                <option value="Equity">Equity</option>
                <option value="Revenue">Revenue</option>
                <option value="Expense">Expense</option>
              </select>
              <select
                value={editNature}
                onChange={e => setEditNature(e.target.value as any)}
                className="p-2.5 rounded-lg border border-slate-300 text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="">Nature</option>
                <option value="debit">debit</option>
                <option value="credit">credit</option>
              </select>
              <div className="md:col-span-6 flex justify-end gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setEditingCOA(null)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-sm bg-white hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg text-sm"
                >
                  Simpan Perubahan
                </button>
              </div>
            </div>
          </form>
        ) : (
          <form onSubmit={handleAddSubmit} className="grid grid-cols-1 md:grid-cols-6 gap-3 mb-5">
            <input
              id="coaCodeInput"
              type="text"
              required
              value={code}
              onChange={e => setCode(e.target.value)}
              placeholder="Code (contoh: 1000001)"
              className="p-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
            />
            <input
              id="coaNameInput"
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Name (contoh: Petty Cash - IDR)"
              className="md:col-span-2 p-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
            <input
              id="coaParentInput"
              type="text"
              value={parent}
              onChange={e => setParent(e.target.value)}
              placeholder="Parent (opsional)"
              className="p-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
            <select
              id="coaTypeInput"
              value={type}
              onChange={e => setType(e.target.value)}
              className="p-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="">Type</option>
              <option value="Asset">Asset</option>
              <option value="Liability">Liability</option>
              <option value="Equity">Equity</option>
              <option value="Revenue">Revenue</option>
              <option value="Expense">Expense</option>
            </select>
            <select
              id="coaNatureInput"
              value={nature}
              onChange={e => setNature(e.target.value as any)}
              className="p-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="">Nature</option>
              <option value="debit">debit</option>
              <option value="credit">credit</option>
            </select>
            <button
              type="submit"
              className="md:col-span-6 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-lg text-sm flex items-center justify-center gap-1.5 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah COA</span>
            </button>
          </form>
        )}

        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
            <input
              id="coaSearchInput"
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Cari Code / Name / Parent..."
              className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
          <select
            id="coaNatureFilter"
            value={natureFilter}
            onChange={e => setNatureFilter(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none sm:w-44"
          >
            <option value="">Semua Nature</option>
            <option value="debit">Debit</option>
            <option value="credit">Credit</option>
          </select>
        </div>

        <div className="overflow-x-auto max-h-[560px]">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 bg-slate-50 text-slate-500 border-b border-slate-200 text-xs">
              <tr>
                <th className="p-3">Code</th>
                <th className="p-3">Name</th>
                <th className="p-3">Parent</th>
                <th className="p-3">Type</th>
                <th className="p-3">Nature</th>
                <th className="p-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody id="coaList" className="divide-y divide-slate-100">
              {filteredCOA.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-4 text-center text-xs text-slate-400 italic">
                    COA tidak ditemukan.
                  </td>
                </tr>
              ) : (
                filteredCOA.map(c => (
                  <tr key={c.code} className="hover:bg-slate-50 border-b border-slate-100 text-xs">
                    <td className="p-3 font-bold font-mono text-indigo-700">{c.code}</td>
                    <td className="p-3 font-medium text-slate-800">{c.name}</td>
                    <td className="p-3 text-slate-500">{c.parent || '-'}</td>
                    <td className="p-3 text-slate-600">{c.type || '-'}</td>
                    <td className="p-3">
                      {c.nature ? (
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          c.nature === 'debit' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {c.nature}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="p-3 text-center whitespace-nowrap">
                      <button
                        onClick={() => startEdit(c)}
                        className="text-indigo-600 hover:text-indigo-800 px-2 py-1"
                        title="Edit COA"
                      >
                        <Edit2 className="w-3.5 h-3.5 inline mr-1" />
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(`Hapus COA ${c.code} - ${c.name}?`)) {
                            onDeleteCOA(c.code);
                          }
                        }}
                        className="text-rose-600 hover:text-rose-800 px-2 py-1 ml-1"
                        title="Hapus COA"
                      >
                        <Trash2 className="w-3.5 h-3.5 inline mr-1" />
                        Hapus
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
  );
};
