import React, { useState } from 'react';
import { Building2, Plus, Edit2, Trash2 } from 'lucide-react';
import { Department } from '../types';

interface DeptMasterViewProps {
  departments: Department[];
  onAddDept: (code: string, name: string) => void;
  onEditDept: (oldCode: string, newCode: string, newName: string) => void;
  onDeleteDept: (code: string) => void;
}

export const DeptMasterView: React.FC<DeptMasterViewProps> = ({
  departments,
  onAddDept,
  onEditDept,
  onDeleteDept
}) => {
  const [code, setCode] = useState<string>('');
  const [name, setName] = useState<string>('');

  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [editCode, setEditCode] = useState<string>('');
  const [editName, setEditName] = useState<string>('');

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !name.trim()) return;
    onAddDept(code.trim().toUpperCase(), name.trim());
    setCode('');
    setName('');
  };

  const startEdit = (dept: Department) => {
    setEditingDept(dept);
    setEditCode(dept.code);
    setEditName(dept.name);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDept || !editCode.trim() || !editName.trim()) return;
    onEditDept(editingDept.code, editCode.trim().toUpperCase(), editName.trim());
    setEditingDept(null);
  };

  return (
    <div id="view-dept" className="space-y-6">
      <div className="bg-linear-to-r from-slate-900 to-indigo-900 text-white p-5 rounded-xl shadow-xs">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-3">
          <div>
            <h3 className="font-bold text-lg flex items-center gap-2">
              <Building2 className="w-5 h-5 text-amber-300" />
              Master Department
            </h3>
            <p className="text-xs text-indigo-100 mt-1">
              Kelola kode dan nama department yang digunakan pada Department Planning.
            </p>
          </div>
          <div className="bg-white/10 rounded-lg px-4 py-2 text-xs">
            Total Department: <b id="deptMasterCount">{departments.length}</b>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-xs">
        {editingDept ? (
          <form onSubmit={handleSaveEdit} className="bg-indigo-50 border border-indigo-200 p-4 rounded-xl mb-5">
            <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wider mb-2">
              Edit Department: {editingDept.code}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                type="text"
                required
                maxLength={20}
                value={editCode}
                onChange={e => setEditCode(e.target.value)}
                placeholder="Kode Dept"
                className="p-2.5 rounded-lg border border-slate-300 text-sm uppercase bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
              <input
                type="text"
                required
                value={editName}
                onChange={e => setEditName(e.target.value)}
                placeholder="Nama Departemen"
                className="p-2.5 rounded-lg border border-slate-300 text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 rounded-lg text-sm transition"
                >
                  Simpan Perubahan
                </button>
                <button
                  type="button"
                  onClick={() => setEditingDept(null)}
                  className="px-3 border border-slate-300 rounded-lg text-sm bg-white hover:bg-slate-100"
                >
                  Batal
                </button>
              </div>
            </div>
          </form>
        ) : (
          <form onSubmit={handleAddSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
            <input
              id="deptCodeInput"
              type="text"
              required
              maxLength={20}
              value={code}
              onChange={e => setCode(e.target.value)}
              placeholder="Kode Dept, contoh: ACC"
              className="p-2.5 rounded-lg border border-slate-300 text-sm uppercase focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
            <input
              id="deptNameInput"
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Nama Departemen, contoh: Accounting"
              className="p-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-lg text-sm flex items-center justify-center gap-1.5 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Department</span>
            </button>
          </form>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 text-xs">
                <th className="p-3 w-12 text-center">No</th>
                <th className="p-3">Kode Dept</th>
                <th className="p-3">Nama Departemen</th>
                <th className="p-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody id="deptMasterList" className="divide-y divide-slate-100">
              {departments.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-xs text-slate-400 italic">
                    Belum ada departemen terdaftar.
                  </td>
                </tr>
              ) : (
                departments.map((d, i) => (
                  <tr key={d.code} className="hover:bg-slate-50">
                    <td className="p-3 text-center text-slate-400 text-xs">{i + 1}</td>
                    <td className="p-3 font-bold text-indigo-700 text-xs">{d.code}</td>
                    <td className="p-3 font-medium text-slate-800 text-xs">{d.name}</td>
                    <td className="p-3 text-center whitespace-nowrap">
                      <button
                        onClick={() => startEdit(d)}
                        className="text-indigo-600 hover:text-indigo-800 text-xs px-2 py-1"
                        title="Edit Department"
                      >
                        <Edit2 className="w-3.5 h-3.5 inline mr-1" />
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(`Hapus department ${d.code} - ${d.name}?`)) {
                            onDeleteDept(d.code);
                          }
                        }}
                        className="text-rose-600 hover:text-rose-800 text-xs px-2 py-1 ml-1"
                        title="Hapus Department"
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
